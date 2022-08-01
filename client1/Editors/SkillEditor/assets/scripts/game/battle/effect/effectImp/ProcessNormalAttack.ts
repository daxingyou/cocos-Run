import { NORMAL_ATTACK_ID } from "../../../../app/AppConst";
import { EffectType, EFFECT_TYPE, ResultType } from "../../../../app/AppEnums";
import { BattleInfo, Effect, OneActionInfo } from "../../../BattleType";
import { ResultData } from "../../../CSInterface";
import { dataOptManager } from "../../../data-operation/DataOperation";
import BTBaseRole from "../../../data-template/BTBaseRole";
import { getPowerResult } from "../EffectUtils";
import ProcessBase from "./ProcessBase";

export default class ProcessNormalAttack extends ProcessBase {

    process (data: Effect, user: BTBaseRole, currAction: OneActionInfo, battleInfo: BattleInfo): ResultData[] {
        let itemInfo = currAction.itemInfo;
        let target = this._getTarget(user, itemInfo);

        let result: ResultData[] = [];
        if (target) {
            let attackResults = this._compluteAttackResult(user, target, {effectType: EFFECT_TYPE.NORMAL_ATTACK}, result);

            attackResults.forEach( attackResult => {
                result.push({
                    FromUID: user.roleUID,
                    ItemId: NORMAL_ATTACK_ID,
                    ResultType: ResultType.RTNormalAttackResult,
                    AttackResult: {
                        RawAttack: attackResult.rawAttack,
                        RoleUID: user.roleUID,
                        TargetUid: attackResult.target.roleUID,
                        Miss: attackResult.isMiss,
                        Crit: attackResult.crit,
                        Attack: attackResult.attack,
                        TrueAttack: attackResult.trueAttack,
                    }
                })

                let realChange = dataOptManager.battleOpt.changeRoleHp(attackResult.target.roleUID, -attackResult.attack);
                if (realChange) {
                    result.push({
                        FromUID: user.roleUID,
                        ItemId:  NORMAL_ATTACK_ID,
                        ResultType: ResultType.RTHPResult,
                        HPResult: {
                            RoleUID: attackResult.target.roleUID,
                            Delta: realChange,
                            HP: attackResult.target.hp,
                            RowAttack: attackResult.attack,
                            SourceId: NORMAL_ATTACK_ID,
                            SourceRole: user.roleUID
                        }
                    })
                }

                let changePower = user.paPower;
                realChange = dataOptManager.battleOpt.changeRolePower(user.roleUID, changePower);
                if (realChange) {
                    let powerResult = getPowerResult(user, user, itemInfo, realChange);
                    result.push(powerResult)
                }
            });
       }
       return result;
    }
}