

import { configUtils } from "../../../../app/ConfigUtils";
import { BattleInfo, DirectEffect, Effect, OneActionInfo } from "../../../BattleType";
import { ResultData } from "../../../CSInterface";
import BTBaseRole from "../../../data-template/BTBaseRole";
import { getBuffChangeResult, getChangePropResult, strToInt } from "../EffectUtils";
import ProcessBase from "./ProcessBase";

export default class ProcessDirectSubstitution extends ProcessBase {

    processDirect (data: Effect, user: BTBaseRole, currAction: OneActionInfo, direct: DirectEffect) {
        let itemInfo = currAction.itemInfo;
        let configEffect = configUtils.getEffectConfig(data.effectId);
        let eventInfo = currAction.eventInfo;
        if (!configEffect || !itemInfo) {
            return;
        }

        if (direct.substitution) {
            return;
        }

        direct.substitution = {
            originRole: eventInfo.currAction.preAttack.target,
            substituRole: user.roleUID,
            extraEffect: [],
        }

        // let buffId = strToInt(configEffect.EffectValue1);
        // let amount = strToInt(configEffect.EffectValue2);

        // cfg = configUtils.getBuffConfig(buffId); 
        // if (!cfg || !amount) return;

        // let target = this._getTarget(user, itemInfo, data.realTargets, configEffect.TargetType);

    }
}

