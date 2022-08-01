import { ResultType } from "../../../../app/AppEnums";
import { configUtils } from "../../../../app/ConfigUtils";
import { BattleInfo, Effect, OneActionInfo } from "../../../BattleType";
import { ResultData } from "../../../CSInterface";
import { dataManager } from "../../../data-manager/DataManager";
import { dataOptManager } from "../../../data-operation/DataOperation";
import BTBaseRole from "../../../data-template/BTBaseRole";
import { strToInt } from "../EffectUtils";
import ProcessBase from "./ProcessBase";

export default class ProcessChangeHp extends ProcessBase {
    
    process (data: Effect, user: BTBaseRole, currAction: OneActionInfo, battleInfo: BattleInfo): ResultData[] {
      
        let eventInfo = currAction.eventInfo;
        let roleUid = eventInfo.target;
        let target = dataManager.battleData.getRoleByUid(roleUid);
        let configEffect = configUtils.getEffectConfig(data.effectId);
        if (!configEffect || !target) {
            return [];
        }
        let changeVPCT = strToInt(configEffect.EffectValue1);
        if (!changeVPCT) {
            return [];
        }

        let result: ResultData[] = [];
        let changeV = Math.floor(target.maxHp * changeVPCT/10000);
        let itemInfo = currAction.itemInfo;
        let realChange = dataOptManager.battleOpt.changeRoleHp(roleUid, changeV);
        if (realChange) {
            result.push({
                FromUID: user.roleUID,
                ItemId:  itemInfo.itemId,
                ResultType: ResultType.RTHPResult,
                HPResult: {
                    RoleUID: roleUid,
                    Delta: realChange,
                    HP: target.hp,
                    RowAttack: 0,
                    SourceId: itemInfo.itemId,
                    SourceRole: user.roleUID
                }
            })
        }

       return result;
    }
}

