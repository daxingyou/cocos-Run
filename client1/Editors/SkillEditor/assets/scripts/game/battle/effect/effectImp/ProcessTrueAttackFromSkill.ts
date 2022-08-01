
import { EFFECT_TYPE } from "../../../../app/AppEnums";
import { configUtils } from "../../../../app/ConfigUtils";
import { BattleInfo, Effect, OneActionInfo } from "../../../BattleType";
import { ResultData } from "../../../CSInterface";
import { dataOptManager } from "../../../data-operation/DataOperation";
import BTBaseRole from "../../../data-template/BTBaseRole";
import { getAttackResult, getHpResult, strToInt } from "../EffectUtils";
import ProcessBase from "./ProcessBase";

export default class ProcessTrueAttackFromSkill extends ProcessBase {

    process (data: Effect, user: BTBaseRole, currAction: OneActionInfo, battleInfo: BattleInfo): ResultData[] {
        let itemInfo = currAction.itemInfo;
        let configEffect = configUtils.getEffectConfig(data.effectId);
        if (!user || user.hp == 0 || !configEffect) {
            return [];
        }

        let curr = currAction.eventInfo.currAction;
        if (!curr || !curr.attacks || !curr.attacks[0]) return []
        if (currAction.eventInfo.effectType == EFFECT_TYPE.BUFF) return [];

        let trueAttack = 0;
        let rate = strToInt(configEffect.EffectValue1);

        trueAttack = Math.floor(curr.attacks[0].attack * rate / 10000);

        if (trueAttack <= 0) {
            return [];
        }

        let target = this._getTarget(user, itemInfo, data.realTargets, configEffect.TargetType);
        let result: ResultData[] = [];
        if (target) {
            let attackResults = this._compluteAttackResult(user, target, {
                itemId: itemInfo.itemId,
                trueAttack: trueAttack,
                effectType: EFFECT_TYPE.SKILL,
            }, result);

            result = result.concat(this._getAttackAndHpResult(attackResults, user, itemInfo)); 

            // attackResults.forEach( attackResult => {
            //     result.push(getAttackResult(user, itemInfo, attackResult));

            //     let realChange = dataOptManager.battleOpt.changeRoleHp(attackResult.target.roleUID, -attackResult.attack);
            //     if (realChange) {
            //         result.push(getHpResult(user, attackResult.target, itemInfo, realChange, attackResult));
            //     }
            // });
       }
       return result;
    }
}
