/*
 * @Description:  血量变化时要执行的子树的前置条件
 * @Version: 1.0
 * @Autor: lixu
 * @Date: 2021-07-08 11:29:22
 * @LastEditors: lixu
 * @LastEditTime: 2021-07-13 11:37:33
 */
import ParkourMonster from "../../ParkourMonster";

//行为树中的阈值类型，包括绝对值和比例两种
enum BTThresholdType{
    Absolute = 1,
    Ratio
}

export default class HPPreCondition extends b3.Condition{
    public static TAG: string = 'HPPreCondition';

    private _thresholdType: BTThresholdType = BTThresholdType.Absolute;
    private _threshold: number = NaN;
    constructor(threshold: number, type: BTThresholdType = BTThresholdType.Absolute){
        super({name: HPPreCondition.TAG});
        this._threshold = threshold;
        this._thresholdType = type;
    }

    enter(tick: b3.Tick){

    }

    open(tick: b3.Tick){

    }

    tick(tick: b3.Tick): number{
        //@ts-ignore
        let target: cc.Node = tick.target.target;
        let monsterComp: ParkourMonster = target.getComponent(ParkourMonster);
        let monsterInfo = monsterComp.getMonsterInfo();

        if(this._thresholdType == BTThresholdType.Absolute && monsterInfo.currHp <= this._threshold){
            return b3.SUCCESS;
        }

        if(this._thresholdType == BTThresholdType.Ratio && monsterInfo.currHp / monsterInfo.maxHp <= this._threshold){
          return b3.SUCCESS;
        }
        return b3.FAILURE;
    }

    close(tick: b3.Tick){

    }

    exit(tick: b3.Tick){

    }
}

export{
    BTThresholdType
}
