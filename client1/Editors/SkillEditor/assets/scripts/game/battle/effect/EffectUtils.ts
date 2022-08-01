import { EFFECT_TYPE, HERO_PROP, ResultType, ROLE_STATE, ROLE_TYPE } from "../../../app/AppEnums";
import { utils } from "../../../app/AppUtils";
import { AttackResultHelper, EffectItem, AttackProperty, AddBuffResulttHelper, RoleEffect, HaloData } from "../../BattleType";
import { ResultData } from "../../CSInterface";
import BTBaseRole from "../../data-template/BTBaseRole";
import Buff from "../../data-template/Buff";

    /**
     * 
     * @param user 攻击着
     * @param target 防御者
     * @param extraEffect 玩家自身buff导致的额外效果
     * @returns boolean true为躲开了，false为命中
     */
    const computeMiss = (user: BTBaseRole, target: BTBaseRole, roleProp: AttackProperty, effProp?: AttackProperty): boolean => {
        let userHit = user.hit + roleProp.userAttribute[HERO_PROP.HIT_RATE] || 0;
        let targetMiss = target.miss + roleProp.targetAttribute[HERO_PROP.MISS] || 0;
        let final = userHit - targetMiss;
        // 躲闪超过100%
        if (final/100 >= 100) return false

        if (final < 500) final = 500;

        let random = utils.getRandomInt(10000);

        return random > final;
    }
    
    /**
     * 
     * @param user 攻击者
     * @param target 受到攻击者
     * @param roleProp 双方角色属性的
     * @param extraEffect 
     * @returns 
     */
    const compluteAttack = (user: BTBaseRole, target: BTBaseRole, roleProp: AttackProperty, effProp?: AttackProperty): { 
            isCrit: boolean,
            trueAttack: number,
            attackValue: number,
            rawAttack: number,
        } => {

        let totalProp = mergeAttackProp(roleProp, effProp);
        // 如果有真实伤害，那么其他都不用算了
        let trueAttack = totalProp.trueAttack;
        if (trueAttack) {
            return {
                isCrit: false,
                attackValue: trueAttack,
                trueAttack: trueAttack,
                rawAttack: trueAttack,
            }
        }
        
        // 计算基础伤害
        let ignoreDefendRate = totalProp.userAttribute[HERO_PROP.IGNORE_DEFENG] || 0;
        let bassAttackAddPCT =  totalProp.userAttribute[HERO_PROP.BASE_ATTACK_PCT];
        let baseUserAttack = (user.attack + totalProp.userAttribute[HERO_PROP.BASE_ATTACK]) * ( 1 + bassAttackAddPCT/10000)
        let baseDefend = (target.block + (totalProp.targetAttribute[HERO_PROP.DEFEND] * (1 - ignoreDefendRate/10000)));
        let baseAttack = baseUserAttack - baseDefend;
        let minAttack = Math.floor(user.attack * 0.1);
        if (baseAttack < minAttack) {
            baseAttack = minAttack;
        }

        // 计算最终攻击
        let deepAttackPCT = totalProp.userAttribute[HERO_PROP.ADD_BASE] || 0;
        let susuceptPCT = totalProp.userAttribute[HERO_PROP.SUSCEPT] || 0;
        let avoidInjury = totalProp.targetAttribute[HERO_PROP.AVOID_INJURY] || 0;
        let otherAttack = 0; // 10000 就是100%
        let effMul = effProp.skillMul || 10000;
        let equipmentMul = 0;
        let critValue = compluteCrit(user, target, totalProp);
        let extraAttack = effProp.extraAttack || 0;  

        //（基础伤害*（1+技能放大百分比）*（1+暴击伤害）*（1+各种装备buff之类的伤害放大值）+各种效果的自带伤害值）*（1-防御方百分比免伤率）+真实伤害
        let finalAttack = ((baseAttack * (effMul/10000)) 
                          * (1 + Math.floor(critValue)/10000) 
                          * (1 + Math.floor(deepAttackPCT)/10000 + Math.floor(susuceptPCT)/10000)
                          * (1 - Math.floor(avoidInjury)/10000)
                          * (1 + equipmentMul) + otherAttack) 
                          * (1 - Math.floor(target.harmImmunity/10000)) 
                          + extraAttack;
        return {
            isCrit: critValue > 0,
            attackValue: finalAttack,
            trueAttack: trueAttack,
            rawAttack: baseUserAttack
        }
    }

    /**
     * @description 根据玩家攻击 受击 的属性和技能的属性合并
     * @param roleProp 玩家的最终属性
     * @param effProp 攻击的最终属性
     * @returns 
     */
    const mergeAttackProp = (roleProp: AttackProperty, effProp: AttackProperty): AttackProperty => {
        const merger = (v1: number = 0, v2: number = 0) => {
            let vv1 = v1 || 0;
            let vv2 = v2 || 0;
            return vv1 + vv2;
        }

        const mergerArray = (v1: number[] = [], v2: number[] = []) => {
            let res: number[] = [];
            for (let i = HERO_PROP.BEGIN; i < HERO_PROP.END; i++) {
                let vv1 = v1[i] || 0;
                let vv2 = v2[i] || 0;
                res[i] = vv1 + vv2;
            }
            return res;
        }

        return {
            effectType: effProp.effectType,
            targetAttribute: mergerArray(roleProp.targetAttribute, effProp.targetAttribute),
            userAttribute: mergerArray(roleProp.userAttribute, effProp.userAttribute),
            extraAttack: merger(roleProp.extraAttack, effProp.extraAttack),
            resistDeath: merger(roleProp.resistDeath, effProp.resistDeath),
            god: merger(roleProp.god, effProp.god),
            bounce: merger(roleProp.bounce, effProp.bounce),
            trueAttack: merger(roleProp.trueAttack, effProp.trueAttack),
        }
    }

    const compluteCrit = (user: BTBaseRole, target: BTBaseRole, totalProp?: AttackProperty): number => {
        let roleRate = totalProp.userAttribute[HERO_PROP.CRIT_RATE] || 0;
        let risistCritRate = totalProp.targetAttribute[HERO_PROP.RESIST_CRIT_RATE] || 0;
        let critRate = user.critRate + roleRate - target.noCrit - risistCritRate;
        let critValue = 0;
        if (critRate > 0) {
            let random = utils.getRandomInt(10000);
            if (random < critRate) {
                critValue = user.crit;
            }
        }
        return critValue
    }
    
    const getAttackResult = (user: BTBaseRole, itemInfo: EffectItem, attackResult: AttackResultHelper): ResultData => {
        let res: ResultData = null;
        res = {
            FromUID: user.roleUID,
            ItemId: itemInfo.itemId,
            ResultType: ResultType.RTSkillAttackResult,
            AttackResult: {
                RoleUID: user.roleUID,
                TargetUid: attackResult.target.roleUID,
                Miss: attackResult.isMiss,
                Crit: attackResult.crit,
                RawAttack: attackResult.rawAttack,
                Attack: attackResult.attack,
            }
        }
        return res;
    }

    const getPowerResult = (user: BTBaseRole, target: BTBaseRole, itemInfo: EffectItem, realChange: number): ResultData => {
        let res: ResultData = null;
        res = {
            FromUID: user.roleUID,
            ItemId: itemInfo.itemId,
            ResultType: ResultType.RTChangePower,
            PowerResult: {
                RoleUID: target.roleUID,
                Delta: realChange,
                Power: target.power,
                SourceId: itemInfo.itemId,
            }
        }
        return res;
    }

    const getHpResult = (user: BTBaseRole, target: BTBaseRole, itemInfo: EffectItem, realChange: number, attack?: AttackResultHelper): ResultData => {
        let res: ResultData = null;
        res = {
            FromUID: user.roleUID,
            ItemId: itemInfo.itemId,
            ResultType: ResultType.RTHPResult,
            HPResult: {
                RoleUID: target.roleUID,
                Delta: realChange,
                HP: target.hp,
                RowAttack: attack.attack || 0,
                SourceId: itemInfo.itemId,
                SourceRole: user.roleUID
            }
        }
        return res;
    }

    const getRoleDeadResult = (user: BTBaseRole, target: BTBaseRole, itemInfo: EffectItem): ResultData => {
        let res: ResultData = null;
        res = {
            FromUID: user.roleUID,
            ItemId: itemInfo.itemId,
            ResultType: ResultType.RTRoleDead,
            RoleDeadResult: {
                RoleUID: target.roleUID,
                State: ROLE_STATE.DEAD
            }
        }
        return res;
    }

    const getChangePropResult = (user: BTBaseRole, target: BTBaseRole, itemInfo: EffectItem, propInfo: RoleEffect): ResultData => {
        let res: ResultData = null;
        res = {
            FromUID: user.roleUID,
            ItemId: itemInfo.itemId,
            ResultType: ResultType.RTRolePropChange,
            ChangePropResult: {
                roleId: target.roleUID,
                prop: propInfo,
            }
        }
        return res;
    }

    const getSkillLightResult = (skillId: number, userId: number, isNormalAttack: boolean = false): ResultData => {
        return {
            FromUID: userId,
            ItemId: skillId,
            ResultType: ResultType.RTSkillLight,
            SkillLightResult: {
                User: userId,
                SkillId: skillId,
                NormalAttack: isNormalAttack
            }
        }
    }

    const getBuffLightResult = (buffId: number, userId: number): ResultData => {
        return {
            FromUID: userId,
            ItemId: buffId,
            ResultType: ResultType.RTBuffLight,
            BuffLightResult: {
                User: userId,
                BuffId: buffId,
            }
        }
    }

    const getHaloLightResult = (haloId: number, userId: number): ResultData => {
        return {
            FromUID: userId,
            ItemId: haloId,
            ResultType: ResultType.RTHaloLight,
            HaloLightResult: {
                User: userId,
                HaloId: haloId,
            }
        }
    }

    const getBuffChangeResult = (buff: Buff, from: number, delt: number, fromItem: number = 0): ResultData => {
        return {
            FromUID: from,
            ItemId: fromItem,
            ResultType: ResultType.RTBuffCntChange,
            BuffResult: {
                BuffId: buff.buffId,
                Delta: delt,
                RoleId: buff.owner,
                Count: buff.count
            }
        }
    }

    const getHaloResult = (halo: HaloData, from: number, fromItem: number = 0): ResultData => {
        return {
            FromUID: from,
            ItemId: fromItem,
            ResultType: ResultType.RTHaloChange,
            HaloResult: {
                HaloId: halo.HaloId,
                RoleId: halo.roleId
            }
        }
    }

    const strToInt = (numStr: string) => {
        let num = 0;
        try {
            let v = parseInt(numStr);
            if (v) {
                num = v;
            }
        } catch (error) {

        }
        return num
    }

export {
    computeMiss,
    compluteAttack,
    getAttackResult,
    getPowerResult,
    getHpResult,
    getSkillLightResult,
    getBuffLightResult,
    getBuffChangeResult,
    getChangePropResult,
    getHaloLightResult,
    getRoleDeadResult,
    getHaloResult,
    strToInt
};