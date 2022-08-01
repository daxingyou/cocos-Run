import ParkourMonster from "../../ParkourMonster";
import { MonsterStageCleanTag, MonsterStageInfo } from "../MonsterBT";
/*
 * @Description:归位的前置条件
 * @Version: 1.0
 * @Autor: lixu
 * @Date: 2021-07-08 13:41:39
 * @LastEditors: lixu
 * @LastEditTime: 2021-07-16 11:15:02
 */

export default class ResetPreCondition extends b3.Condition{
    public static TAG: string = "ResetPreCondition";

    private _monsterStageInfo: MonsterStageInfo = null;
    constructor(stageInfo: MonsterStageInfo){
        super({name: ResetPreCondition.TAG});
        this._monsterStageInfo = stageInfo;
    }

    enter(tick: b3.Tick){

    }

    open(tick: b3.Tick){

    }

    tick(tick: b3.Tick): number{
        if(this._monsterStageInfo && typeof this._monsterStageInfo.config.IsHoming != 'undefined' && this._monsterStageInfo.config.IsHoming.length > 0){
          return b3.SUCCESS;
        }
        //@ts-ignore
        let monsterNode: cc.Node = tick.target.target;
        if(!cc.isValid(monsterNode)) return;
        let monsterComp = monsterNode.getComponent(ParkourMonster);
        if(monsterComp){
            monsterComp.attackedAble = true;
        }
        return b3.FAILURE;
    }

    close(tick: b3.Tick){

    }

    exit(tick: b3.Tick){

    }
}
