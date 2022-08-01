
import { HERO_PROP, ResultType } from "../../../../app/AppEnums";
import { utils } from "../../../../app/AppUtils";
import { configUtils } from "../../../../app/ConfigUtils";
import { BattleInfo, BuffExtraData, Effect, OneActionInfo } from "../../../BattleType";
import { ResultData } from "../../../CSInterface";
import BTBaseRole from "../../../data-template/BTBaseRole";
import { getBuffChangeResult, strToInt } from "../EffectUtils";
import ProcessBase from "./ProcessBase";

export default class ProcessAddBuffWithData extends ProcessBase {

    process (data: Effect, user: BTBaseRole, currAction: OneActionInfo, battleInfo: BattleInfo): ResultData[] {
        let itemInfo = currAction.itemInfo;
        let configEffect = configUtils.getEffectConfig(data.effectId);

        let buffId = strToInt(configEffect.EffectValue1);
        let addCnt = strToInt(configEffect.EffectValue2);
        let attribute = strToInt(configEffect.EffectValue3);
        let type = strToInt(configEffect.EffectValue4);

        if (!buffId || !addCnt) {
            return [];
        }
        
        let result: ResultData[] = [];

        let addValue = 0;
        switch (type) {
            case HERO_PROP.BASE_ATTACK: {
                addValue = user.baseAttack;
                break;
            }
            default: {
                addValue = 0
            }
        }

        let extra: BuffExtraData = {attribute: attribute, value: addValue}
        let target = this._getTarget(user, itemInfo, data.realTargets, configEffect.TargetType);
        if (target && addValue) {
            target.forEach( _t=> {
                let buffInfo = _t.addBuff({buffId: buffId, count: addCnt, data: extra }, battleInfo );
                let buff = _t.getBuff(buffId)
                result.push(getBuffChangeResult(buff, user.roleUID, buffInfo.delta, itemInfo.itemId))
            })
        }
   
       return result;
    }
}

