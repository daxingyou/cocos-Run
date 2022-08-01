import { AnimationGroupInfo, RoleSkillInfo, EffectInfo, RoleInfo, SkillEventInfo, TARGET_EFFECT, ShakeInfo, EffectShadowInfo, EffectSfxInfo } from "../view-actor/CardSkill";

enum EditorEvent {
    ANIMATION_CHANGED       = 'editor-animation-value-changed',
    GFX_CHANGED             = 'editor-gfx-value-changed',
    MOVE_CHANGED            = 'editor-move-value-changed',
    SHAKE_CHANGED           = 'editor-shake-value-changed',
    GLOW_CHANGED            = 'editor-glow-value-changed',
    SFX_CHANGED             = 'editor-sfx-value-changed',
    CUVE_CHANGED            = 'editor-cuve-value-changed',
    BULLET_CHANGED          = 'editor-bullet-value-changed',
    RANDOM_ANGLE_CHANGED    = 'editor-random-angle-changed',
    EDIT_SKILL              = 'editor-edit-skill',
    DELETE_SKILL            = 'editor-delete-skill',
    COPY_SKILL              = 'editor-copy-skill',
    DELETE_SKILLEVENT       = 'editor-delete-skill',
    COPY_ITEM_EFFECT        = 'editor-copy-item-effect',

    UI_VEC2_CHANGED         = 'editor-ui-vec2-chagned',

    SHAKE_ITEM_ADD          = 'editor-add-item-shake',
    SHAKE_ITEM_DELETE       = 'editor-delete-item-shake',
    SHAKE_ITEM_CHANGE       = 'editor-change-item-shake',

    SHADOW_CHANGE           = 'editor-shadow-value-change',

    // for init
    EDITOR_DATA_READY       = 'editor-data-ready',
    EDITOR_LOADSTAT_SUCC    = 'editor-loadstat-succ',
    EDITOR_RELOAD_SUCC      = 'editor-reload-succ',

    EDITOR_MIRROR_CHANGED   = 'editor-mirror-changed',

    FILTER_INDEX_CHANGED    = 'editor-filter-index-changed',
}

enum EditorKey {
    KEY_STATE               = 'EDITOR_STATE',

    KEY_TEMP_USE            = 'EDITOR_KEY_TEMP',
}

/**
 * @desc Action类型定义
 *
 * @enum {number}
 */
enum EditorActionType {
    DELETE_SKILL                = 'delete-skill',
    UPDATE_SKILL                = 'update-skill',    
    EDIT_SKILL                  = 'edit-skill',

    ADD_EFECTINFO               = 'add-effect-info',
    DELETE_EFFECTINFO           = 'delete-effect-info',
    UPDATE_EFFECTINFO           = 'update-effect-info',
    UPDATE_SKILLID              = 'update-skill-id',
    UPDATE_TARGET_EFFECT        = 'update-target-effect',

    UPDATE_DESC                 = 'update-skill-desc',

    UPDATE_UI_ROLE              = 'update-ui-role',

    UPDATE_ROLE_INFO            = 'update-role-info',

    SELECT_EFFECT               = 'select-curr-effect',

    ADD_SKILLEVENT              = 'add-skill-event',
    DELETE_SKILLEVENT           = 'delete-skill-event',

    UPDATE_GROUPINFO            = 'update-group-info',

    ADD_SHAKE                   = 'add_shake-info',
    SELECT_SHAKE                = 'sele-curr-shake',
    DELE_SHAKE                  =   'dele-shake-info',
    UPDATE_SHAKE                = 'update-shake-info',

    ADD_WHOLE_SHADOW                  = 'add_shadow-info',
    SELECT_WHOLE_SHADOW               = 'sele-curr-shadow',
    DELE_WHOLE_SHADOW                 =   'dele-shadow-info',
    UPDATE_WHOLE_SHADOW                = 'update-shadow-info',

    ADD_WHOLE_SFX                    = 'add-sfx-info',
    SELECT_WHOLE_SFX                 = 'sele-curr-sfx',
    DELE_WHOLE_SFX                   = 'dele-sfx-info',
    UPDATE_WHOLE_SFX                 = 'update-sfx-info'
}

enum ROLE_Z_INDEX_TYPE {
    SOURCE_ATTACK = 6,
}


interface EditorAction {
    type: EditorActionType;
    skillInfo?: RoleSkillInfo;
    effect?: EffectInfo;
    id?: number;
    desc?: string;
    eventInfo?: SkillEventInfo;
    groupInfo?: AnimationGroupInfo;
    uiRole?: StateUIRole;
    roleInfo?: RoleInfo;
    shakeInfo?: ShakeInfo,
    shadowInfo?: EffectShadowInfo,
    sfxInfos?:  EffectSfxInfo,
    targetEffect?: TARGET_EFFECT;
}

// State数据结构定义
interface StateSkillList {
    arrSkillInfo: RoleSkillInfo[];
}

interface StateCurrSkill {
    skillInfo: RoleSkillInfo;
}

interface StateCurrEffect {
    id: number;
}

interface StateSkillDesc {
    [index: number]: string;
}

interface StateUIRole {
    hero?: string;
    monster?: string;
}

interface StateRoleInfo {
    [index: string]: RoleInfo;
}

interface StateCurrShake {
    [index: string] : number
}

type StateCurrShadow = StateCurrShake;
type StateCurrSfx = StateCurrShake

const DefaultRole = "spine/role/FuXi_model"

export {
    EditorActionType,
    EditorAction,
    ROLE_Z_INDEX_TYPE,

    StateSkillList,
    StateCurrSkill,
    StateCurrEffect,
    StateSkillDesc,
    StateUIRole,
    StateRoleInfo,

    EditorEvent,

    EditorKey,
    DefaultRole,
    StateCurrShake,
    StateCurrShadow,
    StateCurrSfx
}