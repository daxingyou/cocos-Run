
import { ResultType } from "../../../../app/AppEnums";
import { utils } from "../../../../app/AppUtils";
import { configUtils } from "../../../../app/ConfigUtils";
import { BattleInfo, Effect, OneActionInfo } from "../../../BattleType";
import { ResultData } from "../../../CSInterface";
import BTBaseRole from "../../../data-template/BTBaseRole";
import { getBuffChangeResult, strToInt } from "../EffectUtils";
import ProcessBase from "./ProcessBase";

export default class ProcessAddBuff extends ProcessBase {

    process (data: Effect, user: BTBaseRole, currAction: OneActionInfo, battleInfo: BattleInfo): ResultData[] {
        let itemInfo = currAction.itemInfo;
        let configEffect = configUtils.getEffectConfig(data.effectId);
        let addRate = strToInt(configEffect.EffectValue1);
        let buffId = strToInt(configEffect.EffectValue2);
        let addCnt = strToInt(configEffect.EffectValue3);
        let para = strToInt(configEffect.EffectValue4);
    
        if (!addRate || !buffId || !addCnt) {
            return [];
        }
    
        const checkAddBuff = (rate: number): boolean => {
            if (rate >= 10000) return true;
    
            let intNum = utils.getRandomInt(10000);
            return intNum <= rate;
        }
        let result: ResultData[] = [];
        if (checkAddBuff(addRate)) {
            let target = this._getTarget(user, itemInfo, data.realTargets, configEffect.TargetType);
            if (target) {
                target.forEach( _t=> {
                    let buffInfo = _t.addBuff({buffId: buffId, count: addCnt, data: para }, battleInfo );
                    let buff = _t.getBuff(buffId)
                    result.push(getBuffChangeResult(buff, user.roleUID, buffInfo.delta, itemInfo.itemId))
                })
           }
        }
       return result;
    }
}

