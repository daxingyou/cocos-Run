import ParkourMonster from "../../ParkourMonster";
import { MonsterActionInfo } from "../MonsterBT";
import FlyAction from "./FlyAction";

/*
 * @Description: 怪物的归位动作，跟飞行动作相同，只是起始时间为从0开始
 * @Version: 1.0
 * @Autor: lixu
 * @Date: 2021-07-08 13:59:34
 * @LastEditors: lixu
 * @LastEditTime: 2021-07-14 16:31:23
 */
export default class ResetAction extends FlyAction{
    public static TAG: string = 'ResetAction';

    constructor(actionInfo: MonsterActionInfo){
        actionInfo.time = 0;
        super(actionInfo, ResetAction.TAG);
    }

    //开始触发
    protected onTrigStart(tick: b3.Tick){
        //@ts-ignore
        let dt: number = tick.target.dt;
        //@ts-ignore
        let monsterNode: cc.Node = tick.target.target;
        if(!cc.isValid(monsterNode)) return;
        let monsterComp = monsterNode.getComponent(ParkourMonster);
        if(monsterComp){
            monsterComp.attackedAble = false;
        }
    }

    //结束触发
    protected onTrigEnd(tick: b3.Tick){
        //@ts-ignore
        let dt: number = tick.target.dt;
        //@ts-ignore
        let monsterNode: cc.Node = tick.target.target;
        if(!cc.isValid(monsterNode)) return;
        let monsterComp = monsterNode.getComponent(ParkourMonster);
        if(monsterComp){
            monsterComp.attackedAble = true;
        }
    }
  }
