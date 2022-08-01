import { EffectType, EFFECT_TYPE, PRIMARY_TYPE, ROLE_TYPE, SkillType, SKILL_CONDITION, TARGET_TYPE, TIME_TRIGGER } from "../../app/AppEnums";
import { configUtils } from "../../app/ConfigUtils";
import { getBuffChangeResult, getBuffLightResult, getHaloLightResult, getSkillLightResult } from "./effect/EffectUtils";
import BattleLogic from "./BattleLogic";
import { BuffData, OneActionInfo, EventInfo, AttackProperty, DirectEffect } from "../BattleType";
import { ResultData } from "../CSInterface";
import { dataManager } from "../data-manager/DataManager";
import BTBaseRole from "../data-template/BTBaseRole";
import Buff from "../data-template/Buff";
import { utils } from "../../app/AppUtils";

interface RoleSkill {
    role: BTBaseRole,
    skill: number,
    normalAttack?: boolean,
}

interface ActivateBuffInfo {
    role: BTBaseRole,
    buffId: number,
}

interface ActivateHaloInfo {
    role: BTBaseRole,
    haloId: number,
}

export default class BattleTrigger {

    private _game: BattleLogic = null;

    init (game: BattleLogic) {
        this._game = game;
    }

    deInit () {

    }

    /**
     * 触发时间点事件
     * @param currTime 时间点
     * @param paras 参数
     * @param {out} triggerRes 触发的宝物与buff结果
     */
    setTimePoint (currTime: TIME_TRIGGER , paras: EventInfo, triggerRes: ResultData[]) {
        if (paras) paras.triggerPoint = currTime;

        // 光环触发点
        this._checkTriggerHalo(currTime, paras, triggerRes);

        // buff触发点
        this._checkTriggerBuff(currTime, paras, triggerRes);

        // 技能触发点
        if (currTime == TIME_TRIGGER.SKILL_ACTION_START || currTime == TIME_TRIGGER.BATTLE_START) {
            // 这里区分的原因是再回合开始的同一时间点，优先触发buff，再触发主动技能
            if (currTime == TIME_TRIGGER.SKILL_ACTION_START) {
                currTime = TIME_TRIGGER.ROUND_START;
            }
            this._checkTriggerSkill(currTime, paras, triggerRes);
        }
    }

      /**  
     * 直接触发时机点事件, 和setTimePoint的区别是
     *  1. setTimePoint 是触发之后引起的效果
     *     setTimePointDirect 是在触发时候【修改后面效果用到的属性】；
     *  2. 现在只有2个时间点会直接触发
     * 
     * @param currTime 时间点
     * @param paras 参数
     * @param {out} triggerRes 触发的宝物与buff结果
     */
    setTimePointDirect (currTime: TIME_TRIGGER , paras: EventInfo, triggerRes: ResultData[], directEffect: DirectEffect) {
        if (currTime != TIME_TRIGGER.ROLE_MAKE_ATTACK && currTime != TIME_TRIGGER.ROLE_CHANGE_HP) {
            return;
        }

        if (paras) paras.triggerPoint = currTime;
        this._checkTriggerBuffDirect(currTime, paras, triggerRes, directEffect);
    }

    /**
     * 主动技能还是普攻
     * 
     * @param currTime 
    */
    private _checkTriggerSkill (currTime: TIME_TRIGGER, paras: EventInfo, triggerRes: ResultData[]) {
        if (!paras) return;

        // 当前时间点的主体（人）
        let currRole: BTBaseRole[] = [];
        currRole = this._getEventRole(currTime, paras);

        // 这里只可能是主动技能或者普攻
        let skills: RoleSkill[] = this._getActivateSkill(currTime, paras, currRole[0]);
        let results: ResultData[] = [];
        let effList: OneActionInfo[] = [];
        skills.forEach( _skill => {
            if (_skill.normalAttack) {
                let effectInfo: OneActionInfo = {
                    user: _skill.role.roleUID,
                    effects: [{
                        effectType: EFFECT_TYPE.NORMAL_ATTACK,
                        effectId: 0,
                        targetType: TARGET_TYPE.DEFAULT,
                        realTargets: [],
                        seq: 0,
                    }],
                    itemInfo: {
                        type: EFFECT_TYPE.NORMAL_ATTACK,
                        itemId: 0,
                    },
                    eventInfo: paras
                }
                effList.push(effectInfo);
                results.push(getSkillLightResult(0, _skill.role.roleUID, true));
            } else {
                let effectInfo: OneActionInfo = {
                    user: _skill.role.roleUID,
                    effects: [],
                    itemInfo: {
                        type: EFFECT_TYPE.SKILL,
                        itemId: _skill.skill,
                    },
                    eventInfo: paras
                }
                effList.push(effectInfo);
                results.push(getSkillLightResult(_skill.skill, _skill.role.roleUID, false))
            }

        })
        this._game.addEffectList(effList);
        if (triggerRes) {
            results.forEach( _r => {
                triggerRes.push(_r);
            })
        }
    }

    /**
     * 光环触发点
     * 
     * @param currTime 
    */
     private _checkTriggerHalo (currTime: TIME_TRIGGER, paras: EventInfo, triggerRes: ResultData[]) {
        if (!paras) return;

        let currRole = this._getEventRole(currTime, paras);
        let halos: ActivateHaloInfo[] = this._getActivateHalo(currTime, paras, currRole);
        let results: ResultData[] = [];

        halos.forEach( _halo => {
            let effectInfo: OneActionInfo = {
                user: _halo.role.roleUID,
                effects: [],
                itemInfo: {
                    type: EFFECT_TYPE.HALO,
                    itemId: _halo.haloId,
                },
                eventInfo: paras
            }
            results.push(getHaloLightResult(_halo.haloId, _halo.role.roleUID));
            this._game.addEffectList([effectInfo]);
        })
        
        if (triggerRes) {
            results.forEach( _r => {
                triggerRes.push(_r);
            })
        }
    }

    /**
     * buff触发点
     * 
     * @param currTime 
    */
    private _checkTriggerBuff (currTime: TIME_TRIGGER, paras: EventInfo, triggerRes: ResultData[]) {
        if (!paras) return;

        let currRole = this._getEventRole(currTime, paras);
        let buffs: ActivateBuffInfo[] = this._getActivateBuff(currTime, paras, currRole);
        let results: ResultData[] = [];

        buffs.forEach( _buff => {
            let effectInfo: OneActionInfo = {
                user: _buff.role.roleUID,
                effects: [],
                itemInfo: {
                    type: EFFECT_TYPE.BUFF,
                    itemId: _buff.buffId,
                },
                eventInfo: paras
            }
            results.push(getBuffLightResult(_buff.buffId, _buff.role.roleUID));
            this._game.addEffectList([effectInfo]);
        })

        // 检查buff激活后是否销毁
        buffs.forEach( _buff => {
            results = results.concat(this._getBuffActiveDestoryResults(_buff));
        })

        // 检查buff到了时间点之后是否销毁
        let teams = dataManager.battleData.teams;
        teams.forEach( _t => {
            let roles = _t.roles;
            roles.forEach ( _r => {
                if (currRole.indexOf(_r)!= -1 && _r.buffList && _r.buffList.length > 0) {
                    results = results.concat(this._getBuffDestoryResults(_r, _r.buffList, currTime));
                }
            })
        })

        
        if (triggerRes) {
            results.forEach( _r => {
                triggerRes.push(_r);
            })
        }
    }

    /**
     * buff触发点
     * 
     * @param currTime 
    */
     private _checkTriggerBuffDirect (currTime: TIME_TRIGGER, paras: EventInfo, triggerRes: ResultData[], directEffect: DirectEffect) {
        if (!paras) return;

        let currRole = this._getEventRole(currTime, paras);
        let buffs: ActivateBuffInfo[] = this._getActivateBuff(currTime, paras, currRole);
        let results: ResultData[] = [];

        buffs.forEach( _buff => {
            let effectInfo: OneActionInfo = {
                user: _buff.role.roleUID,
                effects: [],
                itemInfo: {
                    type: EFFECT_TYPE.BUFF,
                    itemId: _buff.buffId,
                },
                eventInfo: paras
            }
            results.push(getBuffLightResult(_buff.buffId, _buff.role.roleUID));
            this._game.addDirectEffect(effectInfo, directEffect);
        })

        // 检查buff激活后是否销毁
        buffs.forEach( _buff => {
            results = results.concat(this._getBuffActiveDestoryResults(_buff));
        })

        // 检查buff到了时间点之后是否销毁
        let teams = dataManager.battleData.teams;
        teams.forEach( _t => {
            let roles = _t.roles;
            roles.forEach ( _r => {
                if (currRole.indexOf(_r)!= -1 && _r.buffList && _r.buffList.length > 0) {
                    results = results.concat(this._getBuffDestoryResults(_r, _r.buffList, currTime));
                }
            })
        })

        
        if (triggerRes) {
            results.forEach( _r => {
                triggerRes.push(_r);
            })
        }
    }

    private _getActivateSkill (currTime: TIME_TRIGGER, eventInfo: EventInfo, currRoles: BTBaseRole):RoleSkill[] {
        let skills: RoleSkill[] = [];
        let currActionRole = eventInfo.currRole;

        // 被动技能用+buff的形式去实现
        if (currTime == TIME_TRIGGER.BATTLE_START) {
            let allAction = this._findTriggerAction(eventInfo, currRoles);
            skills = skills.concat(allAction);
        }

        // 主动技能
        if (currTime == TIME_TRIGGER.ROUND_START) {
            let mainAction = this._findActivateAction(currActionRole);
            skills.push(mainAction);
        }
        
        return skills;
    }

    private _getActivateBuff (currTime: TIME_TRIGGER, eventInfo: EventInfo, currRoles: BTBaseRole[]): ActivateBuffInfo[] {
        let buffs: ActivateBuffInfo[] = [];
        let buffAll: {owner: BTBaseRole, buffs: BuffData[]} [] = [];
        dataManager.battleData.teams.forEach( _t => {
            let roles = _t.roles;
            roles.forEach( _r => {
                if (_r.buffList && _r.buffList.length > 0)
                    buffAll.push({
                        owner: _r,
                        buffs: _r.buffList
                    })
            })
        })

        buffAll.forEach( _buff => {
            _buff.buffs.forEach( _buffInfo => {
               let cfg = configUtils.getBuffConfig(_buffInfo.buffId);
                if (cfg && cfg.TakeTiming == eventInfo.triggerPoint) {
                    let satisfyRole = this._checkSatisfyRole(_buff.owner, cfg, eventInfo, currRoles);
                    let satisfyCondition = this._checkSatisfyCondition(_buff.owner, cfg, eventInfo, currRoles);
                    if (satisfyRole && satisfyCondition) {
                        buffs.push({
                            buffId: _buffInfo.buffId,
                            role: _buff.owner,
                        })
                    }
                }
           })
        })

        return buffs;
    }

    private _getActivateHalo (currTime: TIME_TRIGGER, eventInfo: EventInfo, currRoles: BTBaseRole[]): ActivateHaloInfo[] {
        let halos: ActivateHaloInfo[] = [];
        let halosAll: {owner: BTBaseRole, halos: number[]} [] = [];
        dataManager.battleData.teams.forEach( _t => {
            let roles = _t.roles;
            roles.forEach( _r => {
                if (_r.haloList && _r.haloList.length > 0)
                    halosAll.push({
                        owner: _r,
                        halos: _r.haloList
                    })
            })
        })

        halosAll.forEach( _halo => {
            _halo.halos.forEach( _haloId => {
               let cfg = configUtils.getBuffConfig(_haloId);
                if (cfg && cfg.TakeTiming == eventInfo.triggerPoint) {
                    let satisfyRole = this._checkSatisfyRole(_halo.owner, cfg, eventInfo, currRoles);
                    let satisfyCondition = this._checkSatisfyCondition(_halo.owner, cfg, eventInfo, currRoles);
                    if (satisfyRole && satisfyCondition) {
                        halos.push({
                            haloId: _haloId,
                            role: _halo.owner,
                        })
                    }
                }
           })
        })

        return halos;
    }

    /**
     * @description 只有在生效时机枚举 = 2的时候才会调用
     *  1. 查找当前有效的主动技能
     *  2. 如果没查找到，那就普攻
     * @param currActionRole 
     */
    private _findActivateAction (currActionRole: BTBaseRole): RoleSkill {
        let skills = currActionRole.skillList;
        let actSkill: RoleSkill = null;
        skills.forEach( _sId => {
            let _cfg = configUtils.getSkillConfig(_sId);
            if (_cfg && _cfg.Type == SkillType.HeroActive) {
                let satisfyCount = this._checkSatisfyTime(_sId, _cfg);
                let satisfyConfition = this._checkSatisfyCondition(currActionRole, _cfg);
                if (_cfg.TakeTiming == TIME_TRIGGER.ROUND_START && satisfyCount && satisfyConfition) {
                    actSkill = {
                        role: currActionRole,
                        skill: _sId,
                        normalAttack: false,
                    };
                }
            }
        })

        if (actSkill == null) {
            actSkill = {
                role: currActionRole,
                skill: 0,
                normalAttack: true,
            };
        } 
        return actSkill
    }

    /**
     * @description 只有在生效时机枚举 != 2的时候才会调用
     *  1. 查找所有角色的被动技能
     * @param eventInfo 
     * @param currRoles 当前时间点的主体
     */
    private _findTriggerAction (eventInfo: EventInfo, currRoles: BTBaseRole): RoleSkill[] {
        let skillsAll: {owner: BTBaseRole, skills: number[]} [] = [];
        let result: RoleSkill[] = []; 
        dataManager.battleData.teams.forEach( _t => {
            let roles = _t.roles;
            roles.forEach( _r => {
                skillsAll.push({
                    owner: _r,
                    skills: _r.skillList
                })
            })
        })

        skillsAll.forEach( _s => {
           _s.skills.forEach( _skillId => {
               let cfg = configUtils.getSkillConfig(_skillId);
               // 触发的技能一定不是主动技能， 主动技能在 _findActivateAction 里面寻找
                if (cfg && cfg.Type != SkillType.HeroActive && cfg.TakeTiming == eventInfo.triggerPoint) {
                    let satisfyTime = this._checkSatisfyTime(_skillId, cfg);
                    let satisfyRole = this._checkSatisfyRole(_s.owner, cfg, eventInfo, null);
                    let satisfyCondition = this._checkSatisfyCondition(_s.owner, cfg, eventInfo, null);
                    if (satisfyTime && satisfyRole && satisfyCondition) {
                        result.push({
                            skill: _skillId,
                            role: _s.owner,
                            normalAttack: false,
                        })
                    }
                }
           })
        })

        return result;
    }

    /**
     * @description 检查是否符合技能的角色要求
     * @param owner 技能的持有者
     * @param checkCfg 要检查的技能配置
     * @param eventInfo 当前触发信息
     */
    private _checkSatisfyRole (owner: BTBaseRole, checkCfg: any, eventInfo: EventInfo, currRoles: BTBaseRole[]): boolean {
        if (!checkCfg) return false;
        if (checkCfg.TakeTimingPrimary == null) return false;
        if (eventInfo.triggerPoint == TIME_TRIGGER.BATTLE_START) return true;
        if (eventInfo.triggerPoint == TIME_TRIGGER.BATTLE_END) return true;

        switch (checkCfg.TakeTimingPrimary) {
            case PRIMARY_TYPE.ALL: {
                return true
            }
            case PRIMARY_TYPE.MATE: {
                let satisfy = false;
                currRoles.forEach( currRole => {
                    if (currRole) {
                        let mateTeam = dataManager.battleData.getTeamByRoleUid(currRole.roleUID);
                        if (mateTeam) {
                            let roleIds = mateTeam.roles.map(_r=> {return _r.roleUID});
                            if (roleIds.indexOf(owner.roleUID) > -1 && owner.roleUID != currRole.roleUID) {
                                satisfy = true
                            }
                        }
                    }
                })
                return satisfy;
                break; 
            }
            case PRIMARY_TYPE.OPPOSITE: {
                let satisfy = false;
                if (currRoles) {
                    currRoles.forEach( currRole => {
                        if (currRole) {
                            let enemyTeam = currRole.roleType == ROLE_TYPE.MONSTER? dataManager.battleData.getSelfTeam(): dataManager.battleData.getOppositeTeam()
                            if (enemyTeam) {
                                let roleIds = enemyTeam.roles.map(_r=> {return _r.roleUID});
                                if (roleIds.indexOf(owner.roleUID) > -1) {
                                    satisfy = true
                                }
                            }
                        }
                    })
                }
                return satisfy;
                break; 
            }
            case PRIMARY_TYPE.SELF: {
                if (currRoles) {
                    let satisfy = false;
                    currRoles.forEach( currRoles => {
                        if (currRoles && currRoles.roleUID == owner.roleUID) {
                                satisfy = true
                            }
                        }
                    )
                    return satisfy;
                }
                break; 
            }
            default: {
                break;
            }
        }

        return false;
    }

    /**
     * @description 根据配置检查是否达到技能的触发条件
     * @param targetRole 技能持有者
     * @param skillCfg 目标角色的技能配置
     * @param eventInfo 当前事件信息
     * @param currRoles 当前时间点主体
     * @returns 
     */
    private _checkSatisfyCondition (targetRole: BTBaseRole, cfg: any, eventInfo?: EventInfo, currRoles?: BTBaseRole[]): boolean {
        if (!cfg) return false;
        if (cfg && !cfg.Condition) return true;

        let satisfy = true;
        
        const cId = cfg.Condition;
        const cPara = cfg.ConditionValue1;
        switch (cId) {
            case SKILL_CONDITION.POWER_OVER_100: {
                satisfy = satisfy && (targetRole.power >= 100);
                break;
            } case SKILL_CONDITION.MATE_ACTING: {
                let satisfySub = false;
                if (currRoles && eventInfo.currAction) {
                    let isMate = dataManager.battleData.checkInSameTeam(eventInfo.currAction.user, targetRole.roleUID);
                    if (isMate && eventInfo.currAction.effectType != EFFECT_TYPE.NORMAL_ATTACK) {
                        satisfySub = true
                    }
                }
                satisfy = satisfy && satisfySub;
                break;
            } case SKILL_CONDITION.ATTACKING: {
                let satisfySub = false;
                if (eventInfo && eventInfo.currAction && eventInfo.currAction.attacks) {
                    if (eventInfo.currAction.attacks.length > 0)
                        satisfySub = true;
                }
                satisfy = satisfy && satisfySub;
                break
            } case SKILL_CONDITION.ADD_BUFF: {
                let satisfySub = false;
                if (eventInfo && eventInfo.currAction && eventInfo.buffInfo) {
                    if (eventInfo.buffInfo.count && eventInfo.buffInfo.delta >= 0 && eventInfo.buffInfo.buffId == cPara)
                        satisfySub = true;
                }
                satisfy = satisfy && satisfySub;
                break
            }
            default: {
                break;
            }
        }
        
        return satisfy;
    }



    private _checkSatisfyTime (skill: number, skillCfg: any) {
        // let satisfyRound = (skillCfg.TimesLimitRound == -1) || (skill.roundCnt < skillCfg.TimesLimitRound) || !skillCfg.TimesLimitRound;
        // let satisfyGame = (skillCfg.TimesLimit == -1) || (skill.gameCnt < skillCfg.TimesLimit)|| !skillCfg.TimesLimitRound;
        // return satisfyGame && satisfyRound;
        return true;
    }

    /**
     * @description 获取当前时间点的主体
     * @param currTime 当前时机触发点
     * @param paras 事件参数
     * @returns 
     */
    private _getEventRole (currTime: TIME_TRIGGER, paras: EventInfo) {
        // 当前时间点的主体（人）
        let targetRole: BTBaseRole[] = [];

        switch (currTime) {
            case TIME_TRIGGER.ROLE_COUNT_CHANGE:
            case TIME_TRIGGER.BATTLE_START:
            case TIME_TRIGGER.BATTLE_END: {
                let selfTeam = dataManager.battleData.getSelfTeam();
                let oppoTeam = dataManager.battleData.getOppositeTeam();
                targetRole = selfTeam.roles.concat(oppoTeam.roles);
                break;
            }
        
            case TIME_TRIGGER.ROUND_START:
            case TIME_TRIGGER.ROUND_END: {
                targetRole.push(paras.currRole);
                break;
            }

            // case TIME_TRIGGER.ROLE_CHANGE_HP:
            // case TIME_TRIGGER.POWER_CHANGE:
            // case TIME_TRIGGER.ROLE_DEAD:
            // case TIME_TRIGGER.ROLE_BE_ATTACKED: 
            case TIME_TRIGGER.SKILL_EFFECT_LIGHT:
            case TIME_TRIGGER.BUFF_EFFECT_LIGHT:{
                if (paras.currRole) {
                    targetRole = [paras.currRole]
                }
                break;
            }
            case TIME_TRIGGER.ROLE_MAKE_ATTACK: {
                if (paras.currAction && paras.currAction.user) {
                    let role = dataManager.battleData.getRoleByUid(paras.currAction.user);
                    if (role)
                        targetRole = [role];
                }
                break;
            }
            case TIME_TRIGGER.BUFF_COUNT_CHANGE:
            case TIME_TRIGGER.GAIN_BUFF: {
                let buffInfo = paras.buffInfo;
                if (buffInfo && buffInfo.targetId) {
                    let role = dataManager.battleData.getRoleByUid(buffInfo.targetId);
                    if (role)
                        targetRole = [role];
                }
                break;
            }
            default: break;
        }
        return targetRole;
    }
    
    private _getBuffDestoryResults (owner: BTBaseRole, buffList: Buff[], currTime: TIME_TRIGGER): ResultData[] {
        let results: ResultData[] = [];
        for (let i = buffList.length - 1; i >= 0; i--) {
            let _b = buffList[i];
            let buffId = _b.buffId;
            let cfg = configUtils.getBuffConfig(buffId);
            if (cfg
                && ( (cfg.DestructionTiming == 1 && currTime == TIME_TRIGGER.ROUND_START
                    || cfg.DestructionTiming == 2 && currTime == TIME_TRIGGER.ROUND_END) )) {

                    let curr = owner.getBuff(buffId);
                    curr.roundTag--;

                    if (curr.roundTag == 0) {
                        curr.count = 0;
                        results.push(getBuffChangeResult(_b, owner.roleUID, -_b.count));
                        results = results.concat(this._game.autoRemoveBuff(owner, buffId));
                    }
                }
        }
      
        return results;
    }

    private _getBuffActiveDestoryResults (buff: ActivateBuffInfo) {
        let results: ResultData[] = [];
        let cfg = configUtils.getBuffConfig(buff.buffId);
        if (cfg && cfg.UseDestructionLayers && buff.role) {

            let changeCnt = -cfg.UseDestructionLayers;
            let curr = buff.role.getBuff(buff.buffId);
            curr.count += changeCnt;
            results.push(getBuffChangeResult(curr, buff.role.roleUID, changeCnt));
            if (curr.count <= 0) {
                results = results.concat(this._game.autoRemoveBuff(buff.role, curr.buffId));
                // buff.role.removeBuff(curr.buffId);
                // let info: EventInfo = {
                //     effectType: EffectType.no,
                //     target: buff.role,
                //     itemId: itemId,
                //     buffInfo: {
                //         fromRole: user.roleUID,
                //         buffId: buffResult.BuffId,
                //         targetId: buffResult.RoleId,
                //         count: buffResult.Count,
                //         delta: buffResult.Delta,
                //     }
                // }
                // this.setTimePoint(TIME_TRIGGER.BUFF_COUNT_CHANGE, );
            }
        }
        return results;
    }

}