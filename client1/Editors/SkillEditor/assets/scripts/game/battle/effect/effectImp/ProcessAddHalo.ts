import { utils } from "../../../../app/AppUtils";
import { configUtils } from "../../../../app/ConfigUtils";
import { BattleInfo, Effect, OneActionInfo } from "../../../BattleType";
import { ResultData } from "../../../CSInterface";
import BTBaseRole from "../../../data-template/BTBaseRole";
import { getHaloResult, strToInt } from "../EffectUtils";
import ProcessBase from "./ProcessBase";

export default class ProcessAddHalo extends ProcessBase {

    process (data: Effect, user: BTBaseRole, currAction: OneActionInfo, battleInfo: BattleInfo): ResultData[] {
        let itemInfo = currAction.itemInfo;
        let configEffect = configUtils.getEffectConfig(data.effectId);
        if (!configEffect) return [];

        let addRate = strToInt(configEffect.EffectValue1);
        let buffId = strToInt(configEffect.EffectValue2);
    
        if (!addRate || !buffId) {
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
                    let haroInfo = _t.addHalo({HaloId: buffId, roleId: _t.roleUID});
                    result.push(getHaloResult(haroInfo, user.roleUID, itemInfo.itemId))
                })
           }
        }
        return result;
    }
}

