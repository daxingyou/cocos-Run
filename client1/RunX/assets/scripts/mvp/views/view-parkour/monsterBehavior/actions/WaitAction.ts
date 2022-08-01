import { utils } from "../../../../../app/AppUtils";
import { MonsterActionInfo } from "../MonsterBT";

/*
 * @Description:闲置等待的动作，主要用来在一个阶段行为
 * @Version: 1.0
 * @Autor: lixu
 * @Date: 2021-07-13 19:10:55
 * @LastEditors: lixu
 * @LastEditTime: 2021-08-18 15:34:52
 */
export default class WaitAction extends b3.Action{
    public static TAG: string = 'WaitAction';

    private _actionInfo: MonsterActionInfo = null;

    constructor(actionInfo: MonsterActionInfo){
        super({name: WaitAction.TAG});
        this._actionInfo = actionInfo;
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
              !isFirst && (costTime += dt);
              //@ts-ignore
              tick.blackboard.set('costTime', costTime, tick.tree.id, this.id);
              if(this._checkTimeout(costTime - this._actionInfo.time)){
                  return b3.SUCCESS;
              }
              return b3.RUNNING;
          }else{
              !isFirst && (costTime += dt);
              //@ts-ignore
              tick.blackboard.set('costTime', costTime, tick.tree.id, this.id);
              if(this._checkTimeout(costTime - this._actionInfo.time)){
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

    //检查是否等待了足够的时间
    private _checkTimeout(costTime: number): boolean{
        return costTime >= this._actionInfo.useTime;
    }

    close(tick: b3.Tick){

    }

    exit(tick: b3.Tick){

    }
}
