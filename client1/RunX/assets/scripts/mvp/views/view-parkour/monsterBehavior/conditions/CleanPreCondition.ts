import { MonsterStageCleanTag, MonsterStageInfo } from "../MonsterBT";


/*
 * @Description:清洗行为前置条件
 * @Version: 1.0
 * @Autor: lixu
 * @Date: 2021-07-08 13:28:49
 * @LastEditors: lixu
 * @LastEditTime: 2021-07-15 14:35:31
 */
export default class CleanPreCondition extends b3.Condition{
    public static TAG: string = "ClearPreCondition";

    private _monsterStageInfo: MonsterStageInfo = null;
    constructor(stageInfo?: MonsterStageInfo){
        super({name: CleanPreCondition.TAG});
        this._monsterStageInfo = stageInfo;
    }

    enter(tick: b3.Tick){

    }

    open(tick: b3.Tick){

    }

    tick(tick: b3.Tick): number{
        if(this._monsterStageInfo && typeof this._monsterStageInfo.config.IsClean != 'undefined' && this._monsterStageInfo.config.IsClean > MonsterStageCleanTag.None){
            return b3.SUCCESS;
        }
        return b3.FAILURE;
    }

    close(tick: b3.Tick){

    }

    exit(tick: b3.Tick){

    }
}
