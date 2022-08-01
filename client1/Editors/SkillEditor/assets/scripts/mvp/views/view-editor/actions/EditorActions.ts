import { EditorAction, EditorActionType, StateUIRole } from "../models/EditorConst"
import { AnimationGroupInfo, RoleSkillInfo, EffectInfo, RoleInfo, SkillEventInfo, TARGET_EFFECT, ShakeInfo, EffectShadowInfo, EffectSfxInfo } from "../view-actor/CardSkill"

const actionUpdateSkill = (info: RoleSkillInfo): EditorAction => {
    return {
        type: EditorActionType.UPDATE_SKILL,
        skillInfo: info,
    }
}

const actionDeleteSkill = (info: RoleSkillInfo): EditorAction => {
    return {
        type: EditorActionType.DELETE_SKILL,
        skillInfo: info,
    }
}

const actionEditSkill = (info: RoleSkillInfo): EditorAction => {
    return {
        type: EditorActionType.EDIT_SKILL,
        skillInfo: info,
    }
}

const actionAddEffectInfo = (info: EffectInfo): EditorAction => {
    return {
        type: EditorActionType.ADD_EFECTINFO,
        effect: info,
    }
}

const actionRemoveEffectInfo = (info: EffectInfo): EditorAction => {
    return {
        type: EditorActionType.DELETE_EFFECTINFO,
        effect: info,
    }
}

const actionSelectEffect = (effId: number): EditorAction => {
    return {
        type: EditorActionType.SELECT_EFFECT,
        id: effId,
    }
}

const actionUpdateEffectInfo = (info: EffectInfo): EditorAction => {
    return {
        type: EditorActionType.UPDATE_EFFECTINFO,
        effect: info,
    }
}

const actionUpdateSkillId = (id: number): EditorAction => {
    return {
        type: EditorActionType.UPDATE_SKILLID,
        id: id,
    }
}

const actionUpdateTargetEffect = (targetEffect: TARGET_EFFECT): EditorAction => {
    return {
        type: EditorActionType.UPDATE_TARGET_EFFECT,
        targetEffect: targetEffect,
    }
}

const actionUpdateDesc = (id: number, desc: string): EditorAction => {
    return {
        type: EditorActionType.UPDATE_DESC,
        id: id,
        desc: desc,
    }
}

const actionAddSkillEventInfo = (event: SkillEventInfo): EditorAction => {
    return {
        type: EditorActionType.ADD_SKILLEVENT,
        eventInfo: event,
    }
}

const actionDeleteSkillEventInfo = (event: SkillEventInfo): EditorAction => {
    return {
        type: EditorActionType.DELETE_SKILLEVENT,
        eventInfo: event,
    }
}

const actionUpdateGroupInfo = (event: AnimationGroupInfo): EditorAction => {
    return {
        type: EditorActionType.UPDATE_GROUPINFO,
        groupInfo: event,
    }
}

const actionUpdateUIRole = (event: StateUIRole): EditorAction => {
    return {
        type: EditorActionType.UPDATE_UI_ROLE,
        uiRole: event,
    }
}

const actionUpdateRoleInfo = (event: RoleInfo): EditorAction => {
    return {
        type: EditorActionType.UPDATE_ROLE_INFO,
        roleInfo: event
    }
}

const actionAddShakeEventInfo = (event: ShakeInfo): EditorAction => {
    return {
        type: EditorActionType.ADD_SHAKE,
        shakeInfo: event,
    }
}

const actionSelectShake = (shakeId: number): EditorAction => {
    return {
        type: EditorActionType.SELECT_SHAKE,
        id: shakeId,
    }
}

const actionDeleteShake = (shakeInfo: ShakeInfo): EditorAction => {
    return {
        type: EditorActionType.DELE_SHAKE,
        shakeInfo: shakeInfo,
    }
}

const actionUpdateShake = (shakeInfo: ShakeInfo): EditorAction => {
    return {
        type: EditorActionType.UPDATE_SHAKE,
        shakeInfo: shakeInfo,
    }
}

const actionUpdateShadow = (shadowInfo: EffectShadowInfo): EditorAction => {
    return {
        type: EditorActionType.UPDATE_WHOLE_SHADOW,
        shadowInfo: shadowInfo,
    }
}

const actionSelectWhoneShadow = (shadowId: number): EditorAction => {
    return {
        type: EditorActionType.SELECT_WHOLE_SHADOW,
        id: shadowId,
    }
}

const actionDeleteWholeShadow = (shadowInfo: EffectShadowInfo): EditorAction => {
    return {
        type: EditorActionType.DELE_WHOLE_SHADOW,
        shadowInfo: shadowInfo,
    }
}

const actionAddWholeShadow = (event: EffectShadowInfo): EditorAction => {
    return {
        type: EditorActionType.ADD_WHOLE_SHADOW,
        shadowInfo: event,
    }
}

const actionAddWholeSfx = (event: EffectSfxInfo): EditorAction => {
    return {
        type: EditorActionType.ADD_WHOLE_SFX,
        sfxInfos: event,
    }
}

const actionUpdateWholeSfx = (event: EffectSfxInfo): EditorAction => {
    return {
        type: EditorActionType.UPDATE_WHOLE_SFX,
        sfxInfos: event,
    }
}

const actionSelectWholeSfx = (sfxid: number): EditorAction => {
    return {
        type: EditorActionType.SELECT_WHOLE_SFX,
        id: sfxid,
    }
}

const actionDeleteWholeSfx = (event: EffectSfxInfo): EditorAction => {
    return {
        type: EditorActionType.DELE_WHOLE_SFX,
    }
}


export {
    actionUpdateSkill,
    actionEditSkill,    
    actionDeleteSkill,
    actionAddEffectInfo,
    actionRemoveEffectInfo,
    actionSelectEffect,
    actionUpdateEffectInfo,
    actionUpdateSkillId,
    actionUpdateDesc,
    actionAddSkillEventInfo,
    actionDeleteSkillEventInfo,
    actionUpdateGroupInfo,
    actionUpdateUIRole,
    actionUpdateRoleInfo,
    actionUpdateTargetEffect,
    actionAddShakeEventInfo,
    actionSelectShake,
    actionDeleteShake,
    actionUpdateShake,
    actionUpdateShadow,
    actionSelectWhoneShadow,
    actionDeleteWholeShadow,
    actionAddWholeShadow,
    actionAddWholeSfx,
    actionUpdateWholeSfx,
    actionSelectWholeSfx,
    actionDeleteWholeSfx,
}