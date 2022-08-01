import { configUtils } from "../../../../app/ConfigUtils";
import { BattleInfo, Effect, OneActionInfo } from "../../../BattleType";
import { ResultData } from "../../../CSInterface";
import { dataOptManager } from "../../../data-operation/DataOperation";
import BTBaseRole from "../../../data-template/BTBaseRole";
import { getPowerResult } from "../EffectUtils";
import ProcessBase from "./ProcessBase";

export default class ProcessChangePower extends ProcessBase {
    
    process (data: Effect, user: BTBaseRole, currAction: OneActionInfo, battleInfo: BattleInfo): ResultData[] {
      
        let itemInfo = currAction.itemInfo;
        let changeValue = 0;

        let configEffect = configUtils.getEffectConfig(data.effectId);
        if (configEffect) {
            let vStr = configEffect.EffectValue1 || "0";
            changeValue = parseInt(vStr)
        }
      
        if (!changeValue) {
            return [];
        }
        
        let target = this._getTarget(user, itemInfo, data.realTargets, configEffect.TargetType);
        let result: ResultData[] = [];
        if (target) {
            target.forEach( _t => {
                let realChange = dataOptManager.battleOpt.changeRolePower(_t.roleUID, changeValue);
                if (realChange) {
                    result.push(getPowerResult(user, _t, itemInfo, realChange));
                }
            })
       }
       return result;
    }
}

