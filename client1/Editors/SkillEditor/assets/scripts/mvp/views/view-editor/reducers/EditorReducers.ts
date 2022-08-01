import { EditorActionType, StateCurrEffect, StateCurrSkill, StateSkillList, EditorAction, StateSkillDesc, StateUIRole, StateRoleInfo, DefaultRole, StateCurrShake, StateCurrShadow, StateCurrSfx } from "../models/EditorConst";
import { combineReducers, store } from "../store/EditorStore";
import { EffectInfo, RoleSkillInfo, AnimationGroupInfo, RoleInfo, ShakeInfo, EffectShadowInfo, EffectSfxInfo } from "./../view-actor/CardSkill";

interface GlobalState {
    stateCurrSkill: StateCurrSkill;
    stateCurrEffect: StateCurrEffect;
    stateSkillList: StateSkillList;
    stateSkillDesc: StateSkillDesc;
    stateUIRole: StateUIRole;
    stateRoleInfo: StateRoleInfo;
}

const initSkillList: StateSkillList = {
    arrSkillInfo: [],
}

const stateSkillList = (state: StateSkillList = initSkillList, action: EditorAction): StateSkillList => {
    switch (action.type) {
        case EditorActionType.UPDATE_SKILL: {
            let index = -1;
            state.arrSkillInfo.some((skill, idx) => {
                if (skill.id === action.skillInfo.id) {
                    index = idx;
                    return true;
                }
                return false;
            });

            if (index >= 0) {
                return {
                    arrSkillInfo: state.arrSkillInfo.map((v, idx) => {
                        return idx === index ? action.skillInfo : v;
                    })
                }
            } else {
                return {
                    arrSkillInfo: [...state.arrSkillInfo, action.skillInfo]
                }
            }
        } break;
        case EditorActionType.DELETE_SKILL: {
            return {
                arrSkillInfo: state.arrSkillInfo.filter(v => {
                    return v.id !== action.skillInfo.id;
                })
            }
        } break;
        default: return state;
    }
}

const initState: StateCurrSkill = {
    skillInfo: {
        id: 0,
        effectList: []
    }
}

const stateCurrSkill = (state: StateCurrSkill = initState, action: EditorAction): StateCurrSkill => {
    switch (action.type) {
        case EditorActionType.EDIT_SKILL: {
            return {
                skillInfo: action.skillInfo,
            }
        } break;
        case EditorActionType.ADD_EFECTINFO: {
            return {
                skillInfo: {
                    ...state.skillInfo,
                    effectList: [...state.skillInfo.effectList, action.effect],
                }
            }
        } break;
        case EditorActionType.DELETE_EFFECTINFO: {
            const arr: EffectInfo [] = [];
            state.skillInfo.effectList.forEach(item => {
                if (item.id !== action.effect.id) {
                    arr.push(item);
                }
            });
            return {
                skillInfo: {
                    ...state.skillInfo,
                    effectList: arr,
                }
            }
        } break;
        case EditorActionType.UPDATE_EFFECTINFO: {
            const arr: EffectInfo [] = [];
            state.skillInfo.effectList.forEach(item => {
                if (item.id === action.effect.id) {
                    arr.push(action.effect);
                } else {
                    arr.push(item);
                }
            });
            return {
                skillInfo: {
                    ...state.skillInfo,
                    effectList: arr,
                }
            }
        } break;
        case EditorActionType.UPDATE_SKILLID: {
            return {
                skillInfo: {
                    ...state.skillInfo,
                    id: action.id,
                }
            }
        } break;
        case EditorActionType.UPDATE_TARGET_EFFECT: {
            return {
                skillInfo: {
                    ...state.skillInfo,
                    targetEffect: action.targetEffect,
                }
            }
        }
        case EditorActionType.ADD_SKILLEVENT: {
            return {
                skillInfo: {
                    ...state.skillInfo,
                    arrEvent: state.skillInfo.arrEvent? [...state.skillInfo.arrEvent, action.eventInfo] : [action.eventInfo],
                }
            }
        } break;
        case EditorActionType.DELETE_SKILLEVENT: {
            if (!state.skillInfo.arrEvent) {
                return state;
            }
            return {
                skillInfo: {
                    ...state.skillInfo,
                    arrEvent: state.skillInfo.arrEvent.filter(ei => {
                        return (ei.type != action.eventInfo.type || ei.time != action.eventInfo.time || ei.group != action.eventInfo.group);
                    })
                }
            };
        } break;
        case EditorActionType.UPDATE_GROUPINFO: {
            let arrGroupInfo: AnimationGroupInfo[] = [];
            if (state.skillInfo.arrGroupInfo) {
                let findUpdate = false;
                arrGroupInfo = state.skillInfo.arrGroupInfo.map(info => {
                    if (info.group == action.groupInfo.group) {
                        findUpdate = true;
                        return {
                            ...action.groupInfo,
                        }
                    }
                    return info;
                });
                if (!findUpdate) {
                    arrGroupInfo.push(action.groupInfo);
                }
            } else {
                arrGroupInfo.push(action.groupInfo);
            }

            return {
                skillInfo: {
                    ...state.skillInfo,
                    arrGroupInfo: arrGroupInfo,
                }
            }
        } break;
        case EditorActionType.UPDATE_DESC: {
            return {
                skillInfo: {
                    ...state.skillInfo,
                    desc: action.desc,
                }
            }
        } break;
        case EditorActionType.ADD_SHAKE :
            return {
                skillInfo: {
                    ...state.skillInfo,
                    shakes: state.skillInfo.shakes? [...state.skillInfo.shakes, action.shakeInfo] : [action.shakeInfo],
                }
            }
            break;
        case EditorActionType.DELE_SHAKE:
            if (!state.skillInfo.shakes) return state;
            
            return {
                skillInfo: {
                    ...state.skillInfo,
                    shakes: state.skillInfo.shakes.filter((ele) => {
                        return ele.id != action.shakeInfo.id;
                    }),
                }
            }
            break;
        case EditorActionType.UPDATE_SHAKE:
            if (!state.skillInfo.shakes) return state;

            return {
                skillInfo: {
                    ...state.skillInfo,
                    shakes: state.skillInfo.shakes.map(ele => {
                        return (ele.id == action.shakeInfo.id) ? action.shakeInfo : ele;
                    })
                }
            }
            break;
        case EditorActionType.ADD_WHOLE_SHADOW :
            return {
                skillInfo: {
                    ...state.skillInfo,
                    shadows: state.skillInfo.shadows? [...state.skillInfo.shadows, action.shadowInfo] : [action.shadowInfo],
                }
            }
            break;
        case EditorActionType.DELE_WHOLE_SHADOW:
            if (!state.skillInfo.shadows) return state;
            
            return {
                skillInfo: {
                    ...state.skillInfo,
                    shadows: state.skillInfo.shadows.filter((ele) => {
                        return ele.id != action.shadowInfo.id;
                    }),
                }
            }
            break;
        case EditorActionType.UPDATE_WHOLE_SHADOW:
            if (!state.skillInfo.shadows) return state;

            return {
                skillInfo: {
                    ...state.skillInfo,
                    shadows: state.skillInfo.shadows.map(ele => {
                        return (ele.id == action.shadowInfo.id) ? action.shadowInfo : ele;
                    })
                }
            }
            break;
        case EditorActionType.ADD_WHOLE_SFX:
            return {
                skillInfo: {
                    ...state.skillInfo,
                    sfxInfos: {...action.sfxInfos},
                }
            }
            break;
        case EditorActionType.DELE_WHOLE_SFX:
            if (!state.skillInfo.sfxInfos) return state;
            let newState = {skillInfo: {...state.skillInfo}};
            delete newState.skillInfo.sfxInfos;
            return newState;
            break;
        case EditorActionType.UPDATE_WHOLE_SFX:
            if (!state.skillInfo.sfxInfos || !action.sfxInfos) return state;
            let newState1 = {skillInfo: {...state.skillInfo}};
            newState1.skillInfo.sfxInfos = action.sfxInfos;
            return newState1;
            break;
        default : return state;
    }
}

const stateCurrEffect = (state: StateCurrEffect = {id: 0}, action: EditorAction): StateCurrEffect => {
    switch (action.type) {
        case EditorActionType.SELECT_EFFECT: {
            return {
                id: action.id
            }
        }; break;
        default : return state;
    }
}

const stateUIRole = (state: any = {hero: 'spine/role/FuXi_model', monster: 'spine/role/FuXi_model'}, action: EditorAction): StateUIRole => {
    switch (action.type) {
        case EditorActionType.UPDATE_UI_ROLE: {
            const ret = {
                ...state,
                ...action.uiRole,
            };
            return ret;
        } break;
        default: return state;
    }
}

const stateRoleInfo = (state: StateRoleInfo = {}, action: EditorAction): StateRoleInfo => {
    switch (action.type) {
        case EditorActionType.UPDATE_ROLE_INFO: {
            const ret = {
                ...state,
            };

            let oldInfo = ret[action.roleInfo.name];
            const newInfo = action.roleInfo;
            if (oldInfo) {
                if (action.roleInfo.width !== undefined) {
                    oldInfo.width = newInfo.width;
                }

                if (action.roleInfo.height !== undefined) {
                    oldInfo.height = newInfo.height;
                }

                if (action.roleInfo.timeOffset !== undefined) {
                    oldInfo.timeOffset = newInfo.timeOffset;
                }
            } else {
                ret[action.roleInfo.name] = action.roleInfo;
            }
            return ret;
        } break;
        default: return state;
    }
}

const stateCurrShake = (state: StateCurrShake = {id: 0}, action: EditorAction): StateCurrShake => {
    switch (action.type) {
        case EditorActionType.SELECT_SHAKE: {
            return {
                id: action.id
            }
        }; break;
        default : return state;
    }
}

const stateCurrShadow = (state: StateCurrShadow = {id: 0}, action: EditorAction): StateCurrShadow => {
    switch (action.type) {
        case EditorActionType.SELECT_WHOLE_SHADOW: {
            return {
                id: action.id
            }
        }; break;
        default : return state;
    }
}

const stateCurrSfx = (state: StateCurrSfx = {id: 0}, action: EditorAction): StateCurrSfx => {
    switch (action.type) {
        case EditorActionType.SELECT_WHOLE_SFX: {
            return {
                id: action.id
            }
        }; break;
        default : return state;
    }
}

const getCurrEffectInfo = (state: any): EffectInfo => {
    let ret: EffectInfo = null;
    if (state && state.stateCurrSkill) {
        const skillInfo: RoleSkillInfo = state.stateCurrSkill.skillInfo;
        skillInfo.effectList.some(effect => {
            if (effect.id === state.stateCurrEffect.id) {
                ret = effect;
                return true;
            }
            return false;
        });
    }
   
    return ret;
}

const getCurrSkill = (state: any): RoleSkillInfo => {
    return state.stateCurrSkill.skillInfo;
}

const getRoleInfo = (name: string, state: any): RoleInfo => {
    return state.stateRoleInfo[name];
}

const getCurrShakeInfo = (state: any): ShakeInfo[] => {
    if(!state.stateCurrSkill || !state.stateCurrSkill.skillInfo) return null;
    return state.stateCurrSkill.skillInfo.shakes;
}

const getCurrSfxInfo = (state: any): EffectSfxInfo => {
    if(!state.stateCurrSkill || !state.stateCurrSkill.skillInfo) return null;
    return state.stateCurrSkill.skillInfo.sfxInfos;
}

const getCurrWholeShadows = (state: any): EffectShadowInfo[] => {
    if(!state.stateCurrSkill || !state.stateCurrSkill.skillInfo) return null;
    return state.stateCurrSkill.skillInfo.shadows;
}

const getRoleName = (state: any): RoleInfo => {
    return state.stateCurrSkill.skillInfo.roleInfo;
}

const getSkillDesc = (id: number, state: any): string => {
    if (id == state.stateCurrSkill.skillInfo.id) {
        return state.stateCurrSkill.skillInfo.desc || '';
    } else {
        let skillInfo: RoleSkillInfo = null;
        state.stateSkillList.arrSkillInfo.some((v: RoleSkillInfo) => {
            if (v.id == id) {
                skillInfo = v;
                return true;
            }
            return false;
        });
        return skillInfo ? skillInfo.desc || '' : '';
    }
}

const getUIRole = (state: any): StateUIRole => {
    return state.stateUIRole;
}

const rootReducer = combineReducers(stateSkillList, stateCurrSkill, stateCurrEffect, stateRoleInfo, stateUIRole, stateCurrShake, stateCurrShadow, stateCurrSfx);

export {
    stateCurrSkill,
    stateCurrEffect,
    stateSkillList,
    stateRoleInfo,
    stateUIRole,
    stateCurrShake,
    stateCurrShadow,
    stateCurrSfx,
    rootReducer,

    // Helper function
    getCurrEffectInfo,
    getSkillDesc,
    getRoleInfo,
    getUIRole,
    getCurrSkill,
    getRoleName,
    getCurrShakeInfo,
    getCurrWholeShadows,
    getCurrSfxInfo,
}