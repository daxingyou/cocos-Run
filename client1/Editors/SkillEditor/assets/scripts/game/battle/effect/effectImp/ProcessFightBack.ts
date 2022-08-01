

import { EFFECT_TYPE, HERO_PROP } from "../../../../app/AppEnums";
import { configUtils } from "../../../../app/ConfigUtils";
import { BattleInfo, Effect, OneActionInfo } from "../../../BattleType";
import { ResultData } from "../../../CSInterface";
import BTBaseRole from "../../../data-template/BTBaseRole";
import { strToInt } from "../EffectUtils";
import ProcessBase from "./ProcessBase";

export default class ProcessFightBack extends ProcessBase {

    process (data: Effect, user: BTBaseRole, currAction: OneActionInfo, battleInfo: BattleInfo): ResultData[] {
        let result: ResultData[] = [];
        let configEffect = configUtils.getEffectConfig(data.effectId);
        if (!configEffect) return [];

        let itemInfo = currAction.itemInfo;
        let eventPara = currAction.eventInfo;
        let itemId = itemInfo.itemId;

        let actionRole = eventPara.currRole;
        // 必须是普攻
        if (data && data.effectType == EFFECT_TYPE.NORMAL_ATTACK 
            && eventPara && actionRole.roleType != user.roleType 
            && eventPara.currAction.attacks.length > 0) {

            eventPara.currAction.attacks.forEach( _att => {
                if (_att.target == user.roleUID) {
                    let baseAdd = strToInt(configEffect.EffectValue1);

                    let target = actionRole;
                    let userAttibute: number[] = [];
                    userAttibute[HERO_PROP.ADD_BASE] = baseAdd;
                    let attackResults = this._compluteAttackResult(user, [target], {
                        itemId: itemId,
                        userAttribute: userAttibute,
                        skillMul: baseAdd,
                        effectType: itemInfo.type,
                    }, result);
                    result = result.concat(this._getAttackAndHpResult(attackResults, user, itemInfo)); 
                }
            });
        }
        
        return result;
    }
}