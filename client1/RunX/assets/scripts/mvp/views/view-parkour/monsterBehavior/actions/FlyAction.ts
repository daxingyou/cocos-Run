/*
 * @Description:  怪物飞行行为
 * @Version: 1.0
 * @Autor: lixu
 * @Date: 2021-07-08 16:09:24
 * @LastEditors: lixu
 * @LastEditTime: 2021-08-18 16:07:09
 */

import { utils } from "../../../../../app/AppUtils";
import { MonsterActionInfo } from "../MonsterBT";

export default class FlyAction extends b3.Action {
  public static TAG: string = 'FlyAction';

  protected _actionInfo: MonsterActionInfo = null;
  protected _startPos: cc.Vec2 = cc.v2();
  protected _targetPos: cc.Vec2 = null;
  protected _totalDistance: number = 0;
  protected _sin: number = 0;
  protected _cos: number = 0;
  protected _parent: any = null;
  constructor(actionInfo: MonsterActionInfo, name: string = FlyAction.TAG, parent?: any){
      super({name: name});
      this._actionInfo = actionInfo;
      this._targetPos = cc.v2(this._actionInfo.targetX, this._actionInfo.targetY);
      this._parent = parent;
  }

  enter(tick: b3.Tick){

  }

  get actionInfo(): MonsterActionInfo{
      return this._actionInfo;
  }

  open(tick: b3.Tick){
      //@ts-ignore
      tick.blackboard.set('isTrig', false, tick.tree.id, this.id);
      //@ts-ignore
      tick.blackboard.set('costTime', 0, tick.tree.id, this.id);
      //@ts-ignore
      tick.blackboard.set('isFirst', true, tick.tree.id, this.id);
  }

  tick(tick: b3.Tick): number{
      //@ts-ignore
      let dt: number = tick.target.dt;
      //@ts-ignore
      let monsterNode: cc.Node = tick.target.target;
      //@ts-ignore
      let costTime = tick.blackboard.get('costTime', tick.tree.id, this.id);
      //@ts-ignore
      let isTrig = tick.blackboard.get('isTrig', tick.tree.id, this.id);
      //@ts-ignore
      let isFirst = tick.blackboard.get('isFirst', tick.tree.id, this.id);
      //@ts-ignore
      isFirst && tick.blackboard.set('isFirst', false, tick.tree.id, this.id);
      //到了触发时间
      if(costTime >= this._actionInfo.time){
          //还未被触发
          if(!isTrig){
              //@ts-ignore
              tick.blackboard.set('isTrig', true, tick.tree.id, this.id);
              this._setSameTypeNode(tick);
              this.onTrigStart(tick);
              //开始移动行为
              this._startPos.x = monsterNode.x;
              this._startPos.y = monsterNode.y;
              let vec = cc.v2(this._targetPos.x - this._startPos.x, this._targetPos.y - this._startPos.y);
              let angel = vec.signAngle(cc.v2(1,0));
              this._sin = Math.abs(Math.sin(angel)) * (vec.y < 0 ? -1 : 1);
              this._cos = Math.abs(Math.cos(angel)) * (vec.x < 0 ? -1 : 1);
              this._totalDistance = vec.mag();
              !isFirst && (costTime += dt);
              //@ts-ignore
              tick.blackboard.set('costTime', costTime, tick.tree.id, this.id);
              if(this._setTargetPos(costTime - this._actionInfo.time, monsterNode)){
                  this._clearSameTypeNode(tick);
                  this.onTrigEnd(tick);
                  return b3.SUCCESS;
              }
              return b3.RUNNING;
          }else{
              !isFirst && (costTime += dt);
              //@ts-ignore
              tick.blackboard.set('costTime', costTime, tick.tree.id, this.id);
              if(this._setTargetPos(costTime - this._actionInfo.time, monsterNode)){
                  this._clearSameTypeNode(tick);
                  this.onTrigEnd(tick);
                  return b3.SUCCESS;
              }
              return b3.RUNNING;
          }
      }else{
          !isFirst && (costTime += dt);
          //@ts-ignore
          tick.blackboard.set('costTime', costTime, tick.tree.id, this.id);
          return b3.RUNNING;
      }
  }

  private _setTargetPos(costTime: number, target: cc.Node):boolean{
      let distance = costTime * this._actionInfo.speed;
      if(distance >= this._totalDistance){
          target.x = this._targetPos.x;
          target.y = this._targetPos.y;
          return true;
      }
      target.x = this._startPos.x + distance * this._cos;
      target.y = this._startPos.y + distance * this._sin;
      return false;
  }

  private _clearSameTypeNode(tick: b3.Tick){
      //@ts-ignore
      let currFlyAction = tick.blackboard.get(FlyAction.TAG);
      if(currFlyAction == this){
          //@ts-ignore
          tick.blackboard.set(FlyAction.TAG, null);
      }
  }

  private _setSameTypeNode(tick: b3.Tick){
      //保证当前动作的唯一性
      if(this._parent){
        //@ts-ignore
        let currFlyAction = tick.blackboard.get(FlyAction.TAG);
        if(!utils.isNull(currFlyAction)){
            //@ts-ignore
            let isOpen = tick.blackboard.get('isOpen', tick.tree.id, currFlyAction.id);
            //@ts-ignore
            let isTrig = tick.blackboard.get('isTrig', tick.tree.id, currFlyAction.id);
            if(isOpen && isTrig){
                currFlyAction._close(tick);
                currFlyAction.onTrigEnd && currFlyAction.onTrigEnd(tick);
                this._parent.setChildResult && this._parent.setChildResult(b3.SUCCESS, this, tick);
            }
        }
        //@ts-ignore
        tick.blackboard.set(FlyAction.TAG, this);
    }
  }

  close(tick: b3.Tick){

  }

  exit(tick: b3.Tick){

  }

  //开始触发
  protected onTrigStart(tick: b3.Tick){

  }

  //结束触发
  protected onTrigEnd(tick: b3.Tick){

  }
}
