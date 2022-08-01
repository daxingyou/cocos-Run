import { ResultType, ROLE_STATE, ROLE_TYPE, TEAM_TYPE, TIMER_STATE } from "../app/AppEnums";
import { BuffData, DirectEffect, RoleEffect } from "./BattleType";

interface ResultData {
    ResultType:         ResultType,
    FromUID?:           number, // 人物ID
    EffectId?:          number,
    ItemId?:            number,
    Seq?:               number,
    HPResult?:          HPResult,
    RoleDeadResult?:    RoleDeadResult,
    AttackResult?:      AttackResult,
    PowerResult?:       PowerResult,
    SkillLightResult?:  SkillLightResult,
    BuffLightResult?:   BuffLightResult,
    HaloLightResult?:   HaloLightResult,
    BuffResult?:        BuffResult,
    HaloResult?:        HaloResult,
    ChangePropResult?:  ChangePropResult,
}

interface TeamData {
    Roles: RoleData[],
    TeamType: TEAM_TYPE,
    // 其他
    GroupId?: number
}

interface RoleData {
    Pos: number,
    UID: number,
    ID: number,
    HP: number,
    MaxHP: number,
    Power: number
    State?: ROLE_STATE,
    Type: ROLE_TYPE,
    Buffs: BuffData[]
}

interface RoleTimer {
    roleUid: number,
    distance: number,
    currSpeed: number,
    state: TIMER_STATE
}

interface HPResult {
    RoleUID: number,
    Delta?: number,
    DeltaMaxHP?: number,
    HP?: number,
    MaxHP?: number,
    RowAttack?: number,
    SourceId?: number,
    SourceRole?: number
}

interface RoleDeadResult {
    RoleUID: number,
    State: ROLE_STATE
}

interface PowerResult {
    RoleUID: number,
    Delta: number,
    Power: number,
    SourceId: number,
}

interface AttackResult {
    RoleUID: number,
    TargetUid: number,
    Miss?: boolean,
    Crit?: boolean,
    Attack?: number,
    RawAttack?: number,
    TrueAttack?: number,
    directEffect?: DirectEffect
}

interface SkillLightResult {
    User: number,
    SkillId: number,
    NormalAttack?: boolean,
    UiTarget?: number,
}

interface BuffLightResult {
    User: number,
    BuffId: number,
}

interface HaloLightResult {
    User: number,
    HaloId: number,
}

interface BuffResult {
    BuffId: number,
    RoleId: number,
    Delta: number,
    Count: number,
}

interface HaloResult {
    HaloId: number,
    RoleId: number,
}

interface ChangePropResult {
    roleId: number,
    prop: RoleEffect
}

export {
    ResultData,
    TeamData,
    RoleTimer,
    HPResult,
    PowerResult,
    AttackResult,
    SkillLightResult,
    BuffLightResult,
    RoleData, 
    BuffResult,
    HaloResult,
    ChangePropResult,
    RoleDeadResult
}