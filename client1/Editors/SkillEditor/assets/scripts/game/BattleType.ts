import { BATTLE_POS, EFFECT_TYPE, HALO_RANGE, HERO_PROP, ResultType, ROLE_STATE, ROLE_TYPE, TARGET_TYPE, TEAM_TYPE, TIMER_STATE, TIME_TRIGGER } from "../app/AppEnums";
import { ResultData } from "./CSInterface";
import BTBaseRole from "./data-template/BTBaseRole";

interface EffectItem {
    itemId?: number,
    type: EFFECT_TYPE,
    paras?: number[],
}

interface OneActionInfo {
    user: number,
    itemInfo: EffectItem,
    effects: Effect[],
    eventInfo: EventInfo,           // 触发这个时机点带进去的数据
}

interface AttackProperty {
    // 来源
    itemId?: number,                // 效果来源

    userAttribute?: number[],       // 攻击计算的基础属性 - 攻击者
    targetAttribute?: number[],     // 攻击计算的基础属性 - 受击者

    // 其他属性
    forcedTarget?: number,          // 坦攻，强制改为目标
    forcedTake?: number,            // 坦伤，分担百分比多少的伤害,
    resistDeath?: number,           // 抵抗死亡
    god?: number,                   // 无敌，伤害变成0,
    bounce?: number,                // 反弹

    skillMul?: number,              // 技能放大百分比
    extraAttack?: number,           // 额外伤害
    trueAttack?: number,            // 真实伤害
    effectType: EFFECT_TYPE,        // 攻击类型             

    changeTarget?: number           // 强制修改目标
}

interface UIRoleData {
    hp?: number, 
    maxHp?: number,
    pos: number,
    ePos?: {
        type: BATTLE_POS,
        index: number
    },
    buffList?: BuffData[],
    skillList?: SkillData[],
    haloList?: HaloData[],
    id?: number,
    uid?: number,
    roleType?: ROLE_TYPE,
    roleCfg?: any,
    power?: number
}

interface SkillData {
    skillId: number,
    //...
}

interface HaloData {
    HaloId: number,
    roleId: number
    //...
}

interface BuffData {
    buffId: number,
    buffUId?: number,
    count: number,
    data?: any
}

interface Effect {
    effectType?: EFFECT_TYPE,
    effectId: number,
    // sourceId: number,
    targetType?: TARGET_TYPE,
    realTargets?: number[],
    data?: number
    seq: number
}

// 主动行为
interface ActionInfo {
    itemId?: number,
    effectType?: EFFECT_TYPE,
    user?: number,
    attacks?: {
        target: number,
        miss: boolean,
        crit: boolean,
        attack: number
    }[],
    preAttack?: {
        target: number,
    }
}

interface BuffInfo {
    buffId: number, 
    targetId: number,
    delta: number, 
    count: number,
    fromRole: number
}

interface EventInfo {
    triggerPoint?: TIME_TRIGGER,
    target?: number,
    // 事件参数
    itemId?: number,
    effectType?: EFFECT_TYPE,   // 效果类型，普攻，技能，buff
    currRole?: BTBaseRole,      // 当前回合的行动者
    currAction?: ActionInfo,    // 当前行动之后的结果
    buffInfo?: BuffInfo,
    // 变化值
    hpChange?: number,
}

/**
 * 影响攻击过程直接生效的效果类型
 */
interface DirectEffect {
    substitution?: {            // 坦攻信息
        originRole?: number,    // 原始目标
        substituRole: number,   // 谁去坦攻了
        extraEffect: number[],  // 坦攻的时候的额外效果
    }
}

interface ItemResultData {
    RoleUID: number,
    ItemUID: number,
    ItemResults: ResultData[],
}

interface AttackResultHelper {
    target: BTBaseRole, 
    attack?: number, 
    isMiss?: boolean, 
    crit?: boolean,
    rawAttack?: number,
    trueAttack?: number,
    directEffect?: DirectEffect,
}

interface AddBuffResulttHelper {
    buffId: number,
    rate: number,
    delta: number,
    count: number,
    target: number
}

interface BattleInfo {
    currRound: number,
    currDefault: number,
}

interface RoleEffect {
    buffId?: number,
    haloId?: number,
    propEffect: number[],
    targetId?: number[],
    targetType?: TARGET_TYPE,
    rangeType?: HALO_RANGE,
}

interface BuffExtraData {
    attribute?: HERO_PROP,
    value?: number
}

export {
    EffectItem,
    OneActionInfo,
    AttackProperty,
    UIRoleData,
    SkillData,
    HaloData,
    BuffData,
    Effect,
    ActionInfo,
    EventInfo,
    ItemResultData,
    AttackResultHelper,
    AddBuffResulttHelper,
    BattleInfo,
    RoleEffect,
    BuffExtraData,
    DirectEffect
}
