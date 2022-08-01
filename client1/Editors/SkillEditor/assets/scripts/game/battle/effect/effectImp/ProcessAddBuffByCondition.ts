import { configUtils } from "../../../../app/ConfigUtils";
import { BattleInfo, Effect, OneActionInfo } from "../../../BattleType";
import { ResultData } from "../../../CSInterface";
import BTBaseRole from "../../../data-template/BTBaseRole";
import { getBuffChangeResult, strToInt } from "../EffectUtils";
import ProcessBase from "./ProcessBase";

export default class ProcessAddBuffByCondition extends ProcessBase {

    private _counter = new Map<number, number>();

    init () {
        this._counter.clear();
    }

    process (data: Effect, user: BTBaseRole, currAction: OneActionInfo, battleInfo: BattleInfo): ResultData[] {
        let itemInfo = currAction.itemInfo;
        let configEffect = configUtils.getEffectConfig(data.effectId);
        let cnt = strToInt(configEffect.EffectValue1);
        let buffId = strToInt(configEffect.EffectValue2);
        let addCnt = strToInt(configEffect.EffectValue3);
        let para = strToInt(configEffect.EffectValue4);
    
        if (!cnt || !buffId || !addCnt) {
            return [];
        }
    
        let result: ResultData[] = [];
        if (this._checkActivate(data.effectId, cnt)) {
            let target = this._getTarget(user, itemInfo, data.realTargets, configEffect.TargetType);
            if (target) {
                target.forEach( _t=> {
                    let buffInfo = _t.addBuff({buffId: buffId, count: addCnt, data: para }, battleInfo );
                    let buff = _t.getBuff(buffId)
                    result.push(getBuffChangeResult(buff, user.roleUID, buffInfo.delta, itemInfo.itemId))
                })
            }
        }

       return result;
    }

    private _checkActivate (effectId: number, condition: number) {
        if (this._counter.has(effectId)) {
            let curr = this._counter.get(effectId);
            if (curr >= condition) {
                this._counter.set(effectId, 0);
                return true;
            } else {
                this._counter.set(effectId, curr+1);
            }
        } else {
            this._counter.set(effectId, 1);
        }
        return false;
    }


}

