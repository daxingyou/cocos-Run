
import { EFFECT_TYPE, HERO_PROP, ResultType } from "../../../../app/AppEnums";
import { utils } from "../../../../app/AppUtils";
import { configUtils } from "../../../../app/ConfigUtils";
import { BattleInfo, Effect, OneActionInfo } from "../../../BattleType";
import { ResultData } from "../../../CSInterface";
import { dataOptManager } from "../../../data-operation/DataOperation";
import BTBaseRole from "../../../data-template/BTBaseRole";
import { getAttackResult, getHpResult, strToInt } from "../EffectUtils";
import ProcessBase from "./ProcessBase";

export default class ProcessTrueAttack extends ProcessBase {

    process (data: Effect, user: BTBaseRole, currAction: OneActionInfo, battleInfo: BattleInfo): ResultData[] {
        let itemInfo = currAction.itemInfo;
        let configEffect = configUtils.getEffectConfig(data.effectId);
        if (!user || user.hp == 0 || !configEffect) {
            return [];
        }
    
        let trueAttack = 0;;
        let type = strToInt(configEffect.EffectValue1);
        let dataEffect = strToInt(configEffect.EffectValue2);
        switch (type) {
            case HERO_PROP.BASE_ATTACK: {
                let targetProp = user.baseAttack;
                let defMul = dataEffect;
                trueAttack = targetProp * defMul/10000;
                break;
            }
            case HERO_PROP.DEFEND: {
                let targetProp = user.baseDefend;
                let defMul = dataEffect;
                trueAttack = targetProp * defMul/10000;
                break;
            }
            default: {
                break;
            }
        }
    
        if (trueAttack == 0) {
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
