

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

export default class ProcessAdditionAttack extends ProcessBase {

    process (data: Effect, user: BTBaseRole, currAction: OneActionInfo, battleInfo: BattleInfo): ResultData[] {
        let result: ResultData[] = [];
        let configEffect = configUtils.getEffectConfig(data.effectId);
        if (!configEffect) return [];

        let itemInfo = currAction.itemInfo;

        let eventPara = currAction.eventInfo;
        let mateAction = eventPara.currAction;
        let itemId = itemInfo.itemId;
        let cfg = configUtils.getConfig(mateAction.effectType, mateAction.itemId);

        // 必须是队友的大招，而且大招有攻击
        if (cfg && cfg.Type == SkillType.HeroActive && eventPara && mateAction && mateAction.attacks.length > 0) {
            let baseAdd = strToInt(configEffect.EffectValue1);
            let critRate = strToInt(configEffect.EffectValue2);

            let friendId = mateAction.user;
            let friendRole = dataManager.battleData.getRoleByUid(friendId);
            let target = dataOptManager.battleOpt.findDefaultTarget(friendRole);
            let userAttibute: number[] = [];
            userAttibute[HERO_PROP.CRIT_RATE] = critRate;
            if (target && friendRole) {
                let attackResults = this._compluteAttackResult(user, [target], {
                    itemId: itemId,
                    userAttribute: userAttibute,
                    skillMul: baseAdd,
                    effectType: itemInfo.type,
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
        }

        
        return result;
    }
}