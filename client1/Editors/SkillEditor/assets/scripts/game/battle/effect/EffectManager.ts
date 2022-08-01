import { EFFECT_TYPE, EffectType } from "../../../app/AppEnums";
import { configUtils } from "../../../app/ConfigUtils";
import { Effect, OneActionInfo, EventInfo, BattleInfo, DirectEffect } from "../../BattleType";
import { ResultData } from "../../CSInterface";
import BTBaseRole from "../../data-template/BTBaseRole";
import ProcessBase from "./effectImp/ProcessBase";
import ProcessNormalAttack from "./effectImp/ProcessNormalAttack";
import ProcessSkillAttack from "./effectImp/ProcessSkillAttack";
import ProcessAddBuff from "./effectImp/ProcessAddBuff";
import ProcessChangeRoleProp from "./effectImp/ProcessChangeRoleProp";
import ProcessTrueAttack from "./effectImp/ProcessTrueAttack";
import ProcessChangePower from "./effectImp/ProcessChangePower";
import ProcessAdditionAttack from "./effectImp/ProcessAdditionAttack";
import ProcessLightningAttack from "./effectImp/ProcessLightningAttack";
import ProcessTrueAttackFromSkill from "./effectImp/ProcessTrueAttackFromSkill";
import ProcessAttackAddBuff from "./effectImp/ProcessAttackAddBuff";
import ProcessChangeHp from "./effectImp/ProcessChangeHp";
import ProcessAddHalo from "./effectImp/ProcessAddHalo";
import ProcessChangeRolePropByBuff from "./effectImp/ProcessChangeRolePropByBuff";
import ProcessAddBuffWithData from "./effectImp/ProcessAddBuffWithData";
import ProcessFightBack from "./effectImp/ProcessFightBack";
import ProcessDirectSubstitution from "./effectImp/ProcessDirectSubstitution";
import { dataManager } from "../../data-manager/DataManager";
import ProcessAddBuffByCondition from "./effectImp/ProcessAddBuffByCondition";

const skillEffect = new Map<number, ProcessBase>()
// 【不会】修改触发时候带进去的参数，以影响后面的效果
.set(EffectType.NormalAttack,                   new ProcessNormalAttack())      // 0. 普攻
.set(EffectType.SkillAttack,                    new ProcessSkillAttack())       // 1. 大招攻击
.set(EffectType.AddBuff,                        new ProcessAddBuff())           // 2. 添加buff
.set(EffectType.ChangeRoleProp,                 new ProcessChangeRoleProp())    // 3. 修改属性，暂时是必须和buff绑定
.set(EffectType.TrueAttack,                     new ProcessTrueAttack())        // 4. 根据属性转为攻击
.set(EffectType.ChangePower,                    new ProcessChangePower())       // 5. 能量变化
.set(EffectType.AdditionAttack,                 new ProcessAdditionAttack())    // 6. 额外攻击
.set(EffectType.LightningAttack,                new ProcessLightningAttack())   // 7. 闪电链攻击
.set(EffectType.TrueAttackFromSkill,            new ProcessTrueAttackFromSkill())   // 8. 根据来源进行攻击
.set(EffectType.ChangeHp,                       new ProcessChangeHp())              // 9. 血量变化
.set(EffectType.AttackAddBuff,                  new ProcessAttackAddBuff())         // 10. 攻击并且添加buff
.set(EffectType.AddHalo,                        new ProcessAddHalo())               // 11. 添加光环
.set(EffectType.AddBuffWithData,                new ProcessAddBuffWithData())       // 12. 添加buff附带信息
.set(EffectType.ChangeRolePropByBuff,           new ProcessChangeRolePropByBuff())  // 13. 根据buff的附带信息去修改属性修改属性，暂时是必须和buff绑定
.set(EffectType.FightBack,                      new ProcessFightBack())             // 14. 反击
.set(EffectType.Substitution,                   new ProcessDirectSubstitution())    // 15. 坦伤
.set(EffectType.AddBuffByCondition,             new ProcessAddBuffByCondition())    // 16. 根据条件添加buff


class EffectManager {

    init () {
        skillEffect.forEach( (_handler, key) => {
            _handler.init();
        })
    }
    
    process (effect: Effect, currAction: OneActionInfo, userRole: BTBaseRole, battleInfo: BattleInfo): ResultData[]  {
        let result: ResultData[] = [];
        let item = currAction.itemInfo;
        let targetRes: ResultData[];
        if (item.type == EFFECT_TYPE.NORMAL_ATTACK) {
            let handler = skillEffect.get(EffectType.NormalAttack);
            targetRes = handler.process(effect, userRole, currAction, battleInfo);
            result = result.concat(targetRes);
        } else {
            let effectCfg = configUtils.getEffectConfig(effect.effectId);
            if (effectCfg && effectCfg.UType) {
                let handler = skillEffect.get(effectCfg.UType);
                if (!!handler) {
                    targetRes = handler.process(effect, userRole, currAction, battleInfo);
                    result = result.concat(targetRes);
                }
            }
        }
        return result;
    }
    /**
     * @description 直接生效处理，会影响当前攻击的计算过程
     * @param currAction 当前是当前触发的角色和buff信息，并不是当前回合的行动者信息
     * @returns 
     */
    processDirect (effect: Effect, currAction: OneActionInfo, directEffect: DirectEffect) {
        if (!currAction) {
            return;
        }

        let userRole = dataManager.battleData.getRoleByUid(currAction.user);

        let effectCfg = configUtils.getEffectConfig(effect.effectId);
        if (effectCfg && effectCfg.UType) {
            let handler = skillEffect.get(effectCfg.UType);
            if (!!handler) {
                handler.processDirect(effect, userRole, currAction, directEffect);
            }
        }
    }
}

let effectManager = new EffectManager();
export {effectManager}


