import { HERO_PROP } from "../../../../app/AppEnums";
import { configUtils } from "../../../../app/ConfigUtils";
import { BattleInfo, Effect, OneActionInfo } from "../../../BattleType";
import { ResultData } from "../../../CSInterface";
import { dataOptManager } from "../../../data-operation/DataOperation";
import BTBaseRole from "../../../data-template/BTBaseRole";
import { getAttackResult, getHpResult, strToInt } from "../EffectUtils";
import ProcessBase from "./ProcessBase";

export default class ProcessSkillAttack extends ProcessBase {

    process (data: Effect, user: BTBaseRole, currAction: OneActionInfo, battleInfo: BattleInfo): ResultData[] {
        let itemInfo = currAction.itemInfo;

        let configEffect = configUtils.getEffectConfig(data.effectId);
        let baseMul = strToInt(configEffect.EffectValue1);
        let hitRate = strToInt(configEffect.EffectValue2);
        let critRate = strToInt(configEffect.EffectValue3);
        let crit = strToInt(configEffect.EffectValue4);
        let extraAttack = strToInt(configEffect.EffectValue5);

        let target = this._getTarget(user, itemInfo, data.realTargets, configEffect.TargetType);
        let result: ResultData[] = [];

        let userAttribute: number[] = [];
        userAttribute[HERO_PROP.HIT_RATE] = hitRate;
        userAttribute[HERO_PROP.CRIT] = crit;
        userAttribute[HERO_PROP.CRIT_RATE] = critRate;
        if (target) {
            let attackResults = this._compluteAttackResult(user, target, {
                itemId: itemInfo.itemId,
                skillMul: baseMul,
                userAttribute: userAttribute,
                extraAttack: extraAttack,
                effectType: data.effectType,
            }, result);

           
            result = result.concat(this._getAttackAndHpResult(attackResults, user, itemInfo)); 
            // attackResults.forEach( attackResult => {
            //     result.push(getAttackResult(user, itemInfo, attackResult))

            //     let realChange = dataOptManager.battleOpt.changeRoleHp(attackResult.target.roleUID, -attackResult.attack);
            //     if (realChange) {
            //         result.push(getHpResult(user, attackResult.target, itemInfo, realChange, attackResult));
            //     }
            // });
       }
       return result;
    }
}