import { BATTLE_POS, BTResult, EFFECT_TYPE, HALO_RANGE, ROLE_TYPE, TARGET_TYPE, TIME_TRIGGER } from "./BattleConst";
import { gamesvr } from "../network/lib/protocol";
import ItemRole from "../mvp/views/view-item/ItemRole";

interface UIRoleData {
    hp: number,
    maxHp: number,
    shield: number,     // 护盾值
    pos: number,
    ePos: {
        type: BATTLE_POS,
        index: number
    },
    buffList: gamesvr.IBuff[],
    skillList: SkillData[],
    haloList: gamesvr.IHalo[],
    id: number,
    uid: number,
    roleType: ROLE_TYPE,
    uiCfg: UIRoleCfg,
    power: number,
    maxPower: number,
    skillCount: number,         // 可以释放大招次数
    skeletonName: string,
    orignalId?: number          // 客户端使用假英雄Id
}

interface UIRoleCfg {
    nameStr: string,
    modelId: number,
    normalAttackId?: number,
}

interface SkillData {
    skillId: number,
    //...
}

interface ItemResultData {
    RoleUID: number,
    ItemUID: number,
    ItemResults: BTResult[],
}

interface LessonInfo {
    enemyId: number,
    step: number,
    lessonId: number,
    heroes: number[]
}

interface GetEffectInfo {
    source?: ItemRole,
    target?: ItemRole,
    section?: number,
    isLoop?: boolean,
}

export {
    UIRoleData,
    ItemResultData,
    LessonInfo,
    UIRoleCfg,
    GetEffectInfo
}
