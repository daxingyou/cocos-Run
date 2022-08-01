import { utils } from "../../../../../app/AppUtils";
import ParkourMonster from "../../ParkourMonster";
import { MonsterActionInfo } from "../MonsterBT";

/*
 * @Description:  怪物下跳行为
 * @Version: 1.0
 * @Autor: lixu
 * @Date: 2021-07-08 16:09:24
 * @LastEditors: lixu
 * @LastEditTime: 2021-08-18 15:35:59
 */
export default class JumpDownAction extends b3.Action {
  public static TAG: string = 'JumpDownAction';
  private _actionInfo: MonsterActionInfo = null;
  constructor(actionInfo: MonsterActionInfo){
      super({name: JumpDownAction.TAG});
      this._actionInfo = actionInfo;
  }

  enter(tick: b3.Tick){

  }

  open(tick: b3.Tick){
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
      let isFirst = tick.blackboard.get('isFirst', tick.tree.id, this.id);
      //@ts-ignore
      isFirst && tick.blackboard.set('isFirst', false, tick.tree.id, this.id);
      //到了触发时间
      if(costTime >= this._actionInfo.time){
          !isFirst && (costTime += dt);
          //@ts-ignore
          tick.blackboard.set('costTime', costTime, tick.tree.id, this.id);
          this._doJumpDown(monsterNode);
          return b3.SUCCESS;
      }else{
          !isFirst && (costTime += dt);
          //@ts-ignore
          tick.blackboard.set('costTime', costTime, tick.tree.id, this.id);
          return b3.RUNNING;
      }
  }

  close(tick: b3.Tick){

  }

  private _doJumpDown(target: cc.Node){
    if(!cc.isValid(target)) return;
    let monsterComp = target.getComponent(ParkourMonster);
    if(!monsterComp) return;
    monsterComp.goDown();
}

  exit(tick: b3.Tick){

  }
}
