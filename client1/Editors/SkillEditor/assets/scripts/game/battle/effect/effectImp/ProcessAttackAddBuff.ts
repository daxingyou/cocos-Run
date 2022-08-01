import { HERO_PROP, ResultType } from "../../../../app/AppEnums";
import { utils } from "../../../../app/AppUtils";
import { configUtils } from "../../../../app/ConfigUtils";
import { BattleInfo, Effect, OneActionInfo } from "../../../BattleType";
import { ResultData } from "../../../CSInterface";
import { dataOptManager } from "../../../data-operation/DataOperation";
import BTBaseRole from "../../../data-template/BTBaseRole";
import { getAttackResult, getBuffChangeResult, getHpResult, strToInt } from "../EffectUtils";
import ProcessBase from "./ProcessBase";

/**
 * 这里为什么不分开成攻击和加buff组合，是因为满足效果【如果命中目标概率给目标+buff】的需求
 */
export default class ProcessAttackAddBuff extends ProcessBase {

    process (data: Effect, user: BTBaseRole, currAction: OneActionInfo, battleInfo: BattleInfo): ResultData[] {
        let itemInfo = currAction.itemInfo;

        let configEffect = configUtils.getEffectConfig(data.effectId);
        let baseMul = strToInt(configEffect.EffectValue1);
        let addRate = strToInt(configEffect.EffectValue2);
        let buffId = strToInt(configEffect.EffectValue3);
        let addCnt = strToInt(configEffect.EffectValue4);

        if (!configEffect) return [];

        let target = this._getTarget(user, itemInfo, data.realTargets, configEffect.TargetType);
        let result: ResultData[] = [];

        if (target) {
            let attackResults = this._compluteAttackResult(user, target, {
                itemId: itemInfo.itemId,
                skillMul: baseMul,
                userAttribute: [],
                effectType: data.effectType,
            }, result);

            
            const checkAddBuff = (rate: number): boolean => {
                if (rate >= 10000) return true;

                let intNum = utils.getRandomInt(10000);
                return intNum <= rate;
            }

            attackResults.forEach( attackResult => {
                result.push(getAttackResult(user, itemInfo, attackResult))

                let realChange = dataOptManager.battleOpt.changeRoleHp(attackResult.target.roleUID, -attackResult.attack);
                if (realChange) {
                    result.push(getHpResult(user, attackResult.target, itemInfo, realChange, attackResult));
                }

                if (!attackResult.isMiss) {
                    if (checkAddBuff(addRate)) {
                        let _t = attackResult.target;
                        let buffInfo = _t.addBuff({buffId: buffId, count: addCnt}, battleInfo);
                        let buff = _t.getBuff(buffId);
                        result.push(getBuffChangeResult(buff, user.roleUID, buffInfo.delta, itemInfo.itemId));
                    }
                }

            });
       }
       return result;
    }
}