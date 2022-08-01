

import { EFFECT_TYPE, HERO_PROP, ResultType, SkillType } from "../../../../app/AppEnums";
import { utils } from "../../../../app/AppUtils";
import { configUtils } from "../../../../app/ConfigUtils";
import { BattleInfo, Effect, OneActionInfo } from "../../../BattleType";
import { ResultData } from "../../../CSInterface";
import { dataManager } from "../../../data-manager/DataManager";
import { dataOptManager } from "../../../data-operation/DataOperation";
import BTBaseRole from "../../../data-template/BTBaseRole";
import { getAttackResult, getHpResult, strToInt } from "../EffectUtils";
import ProcessBase from "./ProcessBase";

export default class ProcessLightningAttack extends ProcessBase {


    process (data: Effect, user: BTBaseRole, currAction: OneActionInfo, battleInfo: BattleInfo): ResultData[] {
        let itemInfo = currAction.itemInfo;
    
        let configEffect = configUtils.getEffectConfig(data.effectId);
        if (!configEffect) return [];
    
        let bassAttackAddMul = strToInt(configEffect.EffectValue1);
        let AddBuffRate = strToInt(configEffect.EffectValue2);
        let addBuff = strToInt(configEffect.EffectValue3);
        let addCount = strToInt(configEffect.EffectValue4);
    
        let target = data.realTargets[data.seq - 1];
        let role = dataManager.battleData.getRoleByUid(target);
        let result: ResultData[] = [];
    
        if (role) {
            // 攻击
            let attackResults = this._compluteAttackResult(user, [role], {
                itemId: itemInfo.itemId,
                skillMul: bassAttackAddMul,
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
    
            // 加闪电链
            if (AddBuffRate && AddBuffRate > 0) {
                const checkAddBuff = (rate: number): boolean => {
                    if (rate >= 10000) return true;
        
                    let intNum = utils.getRandomInt(10000);
                    return intNum <= rate;
                }
                let result: ResultData[] = [];
                if (checkAddBuff(AddBuffRate)) {
        
                    let buffInfo = role.addBuff({buffId: addBuff, count: addCount, data: null}, battleInfo );
                    result.push({
                        ResultType: ResultType.RTBuffCntChange,
                        FromUID: user.roleUID,
                        ItemId: itemInfo.itemId,
                        BuffResult: {
                            RoleId: role.roleUID,
                            BuffId: buffInfo.buff.buffId,
                            Count: buffInfo.buff.count,
                            Delta: buffInfo.delta,
                        }
                    })
                
                }
            }
        
       }
       return result;
    }
}