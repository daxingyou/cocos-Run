
import { EFFECT_TYPE, TARGET_TYPE } from "../../../../app/AppEnums";
import { configUtils } from "../../../../app/ConfigUtils";
import { BattleInfo, Effect, OneActionInfo } from "../../../BattleType";
import { ResultData } from "../../../CSInterface";
import BTBaseRole from "../../../data-template/BTBaseRole";
import { getChangePropResult, strToInt } from "../EffectUtils";
import ProcessBase from "./ProcessBase";

export default class ProcessChangeRoleProp extends ProcessBase {

    process (data: Effect, user: BTBaseRole, currAction: OneActionInfo, battleInfo: BattleInfo): ResultData[] {
        let itemInfo = currAction.itemInfo;
        let configEffect = configUtils.getEffectConfig(data.effectId);
        if (!configEffect || !itemInfo) {
            return [];
        }

        let cfg: any = null;
        let currType = itemInfo.type;

        if (currType == EFFECT_TYPE.BUFF) {
            cfg = configUtils.getBuffConfig(itemInfo.itemId); 
        } else if (currType == EFFECT_TYPE.HALO) {
            cfg = configUtils.getHaloConfig(itemInfo.itemId); 
        }

        if (!cfg) return []

        let result: ResultData[] = [];
        // 如果修改属性，一定是走buff形式，要控制效果顶部和移除，策划说如是 4-20
        let type = strToInt(configEffect.EffectValue1);
        let value = strToInt(configEffect.EffectValue2);
        let target = this._getTarget(user, itemInfo, data.realTargets, configEffect.TargetType);


        if (target && type && value) {
            target.forEach( _t=> {
                if (cfg.BuffId) {
                    let curr = _t.getBuff(cfg.BuffId);
                    let currCnt = curr? curr.count : 0;
                    let currValue = value * currCnt;
                    if (currValue) {
                        let effArry: number[] = [];
                        effArry[type] = currValue;
                        let addRes = _t.setBuffEffect({
                            buffId: itemInfo.itemId,
                            propEffect: effArry,
                            targetType: TARGET_TYPE.SELF,
                        });
                        result.push(getChangePropResult(user, _t, itemInfo, addRes));
                    }
                } else if (cfg.SkillHaloId) {
                    let currValue = value;
                    if (currValue) {
                        let effArry: number[] = [];
                        effArry[type] = currValue;
                        let addRes = _t.setHaloEffect({
                            buffId: itemInfo.itemId,
                            propEffect: effArry,
                            rangeType: cfg.Range
                        });
                        result.push(getChangePropResult(user, _t, itemInfo, addRes));
                    }
                }
              
            })
        }

        return result;
    }
}

