/*
 * @Description:  怪物x轴移动行为
 * @Version: 1.0
 * @Autor: lixu
 * @Date: 2021-07-08 16:09:24
 * @LastEditors: lixu
 * @LastEditTime: 2021-08-18 15:32:40
 */

import { utils } from "../../../../../app/AppUtils";
import { MonsterActionInfo } from "../MonsterBT";
import Parallel from "../Parallel";

export default class MoveXAction extends b3.Action {
  public static TAG: string = 'MoveXAction';
  private _actionInfo: MonsterActionInfo = null;
  private _startPosX: number = NaN;
  private _speed: number = 0;
  private _totalDistance: number = 0;

  //移动方向   0：表示不动  1：向右   -1：向左
  private _direct: number = 0;
  private _parent: any = null;
  constructor(actionInfo: MonsterActionInfo, parent: Parallel){
      super({name: MoveXAction.TAG});
      this._actionInfo = actionInfo;
      this._parent = parent;
  }

  enter(tick: b3.Tick){

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
              this._startPosX = monsterNode.x;
              this._totalDistance = this._actionInfo.targetX - this._startPosX;
              this._direct = this._totalDistance < 0 ? -1 : (this._totalDistance > 0 ? 1 : 0);
              this._totalDistance = Math.abs(this._totalDistance);
              this._speed = Math.ceil(this._totalDistance / this._actionInfo.useTime);

              !isFirst && (costTime += dt);
              //@ts-ignore
              tick.blackboard.set('costTime', costTime, tick.tree.id, this.id);
              if(this._updatePos(costTime - this._actionInfo.time, monsterNode)){
                  this._clearSameTypeNode(tick);
                  return b3.SUCCESS;
              }
              return b3.RUNNING;
          }else{
              !isFirst && (costTime += dt);
              //@ts-ignore
              tick.blackboard.set('costTime', costTime, tick.tree.id, this.id);
              if(this._updatePos(costTime - this._actionInfo.time, monsterNode)){
                  this._clearSameTypeNode(tick);
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

  private _updatePos(costTime: number, target: cc.Node): boolean{
      let distance = this._speed * costTime;
      if(distance >= this._totalDistance){
          target.x = this._actionInfo.targetX;
          return true;
      }
      target.x = this._startPosX + this._direct * distance;
      return false;
  }

  private _clearSameTypeNode(tick: b3.Tick){
      //@ts-ignore
      let currMoveXAction = tick.blackboard.get(MoveXAction.TAG);
      if(currMoveXAction == this){
          //@ts-ignore
          tick.blackboard.set(MoveXAction.TAG, null);
      }
  }

  private _setSameTypeNode(tick: b3.Tick){
      //保证当前动作的唯一性
      if(this._parent){
        //@ts-ignore
        let currMoveXAction = tick.blackboard.get(MoveXAction.TAG);
        if(!utils.isNull(currMoveXAction)){
            //@ts-ignore
            let isOpen = tick.blackboard.get('isOpen', tick.tree.id, currMoveXAction.id);
            //@ts-ignore
            let isTrig = tick.blackboard.get('isTrig', tick.tree.id, currMoveXAction.id);
            if(isOpen && isTrig){
                currMoveXAction._close(tick);
                this._parent.setChildResult && this._parent.setChildResult(b3.SUCCESS, this, tick);
            }
        }
        //@ts-ignore
        tick.blackboard.set(MoveXAction.TAG, this);
    }
  }

  close(tick: b3.Tick){

  }

  exit(tick: b3.Tick){

  }
}
