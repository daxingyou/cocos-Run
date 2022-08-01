import { BATTLE_POS, ResultType, ROLE_TYPE } from "../../../app/AppEnums";
import { configUtils } from "../../../app/ConfigUtils";
import { eventCenter } from "../../../common/event/EventCenter";
import { logger } from "../../../common/log/Logger";
import scheduleManager from "../../../common/ScheduleManager";
import { ItemResultData } from "../../../game/BattleType";
import { AttackResult, BuffLightResult, BuffResult, HPResult, PowerResult, ResultData, SkillLightResult } from "../../../game/CSInterface";
import { modelManager } from "../../models/ModeManager";
import ItemRole from "../view-item/ItemRole";
import BattleScene from "../view-scene/BattleScene";


export default class EffectAnimCtrl {
    private _game: BattleScene = null;
    private _timerId: number[] = [];
    // 一次执行效果的间隔
    private _itemInterval: number = 0;
    private _tempInterval: number = 0;
    private _itemRecord = new Map<number, number>();
 
    private _isProcessing: boolean = false;
    private _effList: Array<ItemResultData> = [];
    private _callback: Function = null;
 
    init (game: BattleScene) {
        this._game = game;
        this._isProcessing = false;
        this._effList = [];
        this._timerId = [];
    }
 
    deInit () {
        this._effList = [];
        this._callback = null;
        this._unscheduleAllCallbacks();
        eventCenter.unregisterAll(this);
    }
 
    /**
     * 播放技能特效
     * @param effResArr 待播放的特效
     * @param callback 特效播放完成回调
     */
    process (effResArr: ItemResultData[], callback: () => void) {
        if (effResArr == null) {
            if (callback) callback();
            return;
        }

        if (this._effList.length > 0) {
            logger.error(`EffectAnimCtrl`, `there is still effect processing. pls check!`);
        }

        this._callback = callback;
        this._effList = this._effList.concat(effResArr);
        this._processOne();
    }

    // /**
    //  * 施法者的技能特效
    //  * @param itemUID 
    //  * @param roleUID 
    //  */
    // processUseInfo (itemUID: number, roleUID: number, targetUid: number) {
    //     if (itemUID && roleUID) {
    //         let isSelfTeam = this._checkIsSelfTeam(roleUID);
    //         let user: ItemRole;
    //         let target: ItemRole;
    //         if (isSelfTeam) {
    //             let roleNode = this._game.heroCtrl.getRoleNode(roleUID);
    //             if (cc.isValid(roleNode)) { user = roleNode.getComponent(ItemRole); }
    //         } else {
    //             let roleNode = this._game.monsterCtrl.getRoleNode(roleUID);
    //             if (cc.isValid(roleNode)) { user = roleNode.getComponent(ItemRole); }
    //         }

    //         isSelfTeam = this._checkIsSelfTeam(targetUid);  
    //         if (isSelfTeam) {
    //             let roleNode = this._game.heroCtrl.getRoleNode(roleUID);
    //             if (cc.isValid(roleNode)) { target = roleNode.getComponent(ItemRole);}
    //         } else {
    //             let roleNode = this._game.monsterCtrl.getRoleNode(roleUID);
    //             if (cc.isValid(roleNode)) { target = roleNode.getComponent(ItemRole);}
    //         }
    
    //         if (user && target) {
    //             console.log(`process SourceAnimation. now = ${Date.now()}. frame = ${cc.director.getTotalFrames()}`);
    //             // 对于施法动画来说，source就是施法发起方，target就是对方！！！
    //             user.playUseEffect();
    //             target.playTakeEffect();
    //         }

    //     }
    // }

    private _processOne () {
        this._itemInterval = 0;
        if (this._isProcessing) 
            return;
 
        if (this._effList.length == 0) {
            this._processFinish();
            return;
        };
        
        let effectInfo = this._effList.shift();
        if (effectInfo == null) {
            this._processFinish();
            return;
        }

        this._isProcessing = true;
        if (effectInfo.ItemResults && effectInfo.ItemResults.length) {
            this._processEffect(effectInfo.ItemResults, effectInfo.RoleUID, () => {
                this._processFinish();
            });
        } else {
            this._processFinish();
        }
    }

    /**
     * @description 一次同时要执行的效果，返回执行效果的时间
     * @param itemId itemId
     * @param effects 一次要执行的效果
     * @returns 返回效果的执行时间
     */
    private _processEffect (effects: ResultData[], userUID: number, callback: Function) {
        if (!effects || effects.length == 0) {
            callback();
            return;
        }

        let processTime: number = 0;

        // effects需要过滤一遍，将同一个index的HPResult与AttackRes合并
        let filterResults = this._preProcessResults(effects);

        filterResults.forEach ( _eff => {
            let currProcessTime = this.processOneEffect(_eff);
            processTime = Math.max(currProcessTime, processTime);
        })

        if (processTime == 0) {
            callback();
        } else {
            let timeId = scheduleManager.scheduleOnce(() => {
                callback();
            }, processTime);
            this._timerId.push(timeId);
        }
    }
    processOneEffect (effect: ResultData): number {
        let duration = 0.1;
        if (effect) {
            // let user: ItemRole = null;
            // let target: ItemRole = null;
            // user = this._getItemRoleByUid(effect.FromUID);
       
            let currDuration = 0;
            if (effect.AttackResult && effect.HPResult) { 
                currDuration = Math.max(this._processAttack(effect), currDuration);
            } else if (effect.HPResult) {
                // 有一说一，不应该出现这种情况
                console.log("??????????????????????? WHY ???????????????????", effect)
                currDuration = Math.max(this._processChangeHp(effect.HPResult), currDuration);
            } else if (effect.AttackResult) {

                currDuration = Math.max(this._processAttack(effect), currDuration);
            }

            if (effect.BuffResult) {
                currDuration = Math.max(this._processBuff(effect.BuffResult), currDuration); 
            }

            if (effect.PowerResult) { 
                currDuration = Math.max(this._processPower(effect.PowerResult), currDuration); 
            }

            if (effect.SkillLightResult) {
                currDuration = Math.max(this._processUseSkill(effect.SkillLightResult), currDuration); 
            }

            if (effect.BuffLightResult) {
                currDuration = Math.max(this._processActiveBuff(effect.BuffLightResult), currDuration); 
            }

            duration = Math.max(currDuration, duration);
        }
        return duration;
    }

    private _processUseSkill (skillRes: SkillLightResult): number {
        let duration = 0;
        // if (skillRes && skillRes.NormalAttack) { return 0; }
        let skillId = skillRes.SkillId;
        let role = modelManager.battleUIData.getRoleByUid(skillRes.User);
        let roleCtrl = role.roleType == ROLE_TYPE.HERO? this._game.heroCtrl:this._game.monsterCtrl;
        
        const platSkillEffect = (userId: number, skillId: number)=> {
            let skillDuration = 0;
            let itemRole = this._getItemRoleByUid(userId);
            skillDuration = itemRole.playSkill(skillId);
            return skillDuration;
        }

        if (!skillRes.NormalAttack) {
            let cfg = configUtils.getSkillConfig(skillId);
            if (cfg) {
                if (cfg.MeleeOrLong == 2) { 
                    duration = roleCtrl.precessRoleMove(-1, role.uid, {
                        type: BATTLE_POS.FORWARD,
                        index: -1
                    }, ()=> {
                        platSkillEffect(skillRes.User, skillRes.SkillId);
                    });
                    duration += 1
                } else {
                    let uiTarget = skillRes.UiTarget;
                    let targetRole = this._getItemRoleByUid(uiTarget);
                    if (targetRole) {
                        duration = roleCtrl.precessRoleMove(targetRole.getRoleData().uid, role.uid, {
                            type: BATTLE_POS.TARGET,
                            index: targetRole.getRoleData().pos
                        }, ()=> {
                            platSkillEffect(skillRes.User, skillRes.SkillId);
                        });
                        duration += 0.5
                    }
                }
            }
        } else {
            // 可能是近程，可能是普攻
            let uiTarget = skillRes.UiTarget;
            let targetRole = this._getItemRoleByUid(uiTarget);
            if (targetRole) {
                duration = roleCtrl.precessRoleMove(targetRole.getRoleData().uid, role.uid, {
                    type: BATTLE_POS.TARGET,
                    index: targetRole.getRoleData().pos
                }, ()=> {
                    platSkillEffect(skillRes.User, skillRes.SkillId);
                });
                duration += 0.5
            }
        }

        return duration;
    }

    private _processActiveBuff (buffRes: BuffLightResult): number {
        let duration = 0.5;
        
        const platBuffEffect = (userId: number, buffId: number)=> {
            let skillDuration = 0;
            let itemRole = this._getItemRoleByUid(userId);
            skillDuration = itemRole.activeBuff(buffId)
            return skillDuration;
        }

        duration += platBuffEffect(buffRes.User, buffRes.BuffId);
        return duration;
    }

    private _processChangeHp (hpRes: HPResult): number {
        if (!hpRes || !hpRes) { return 0; }

        // let targetUid = hpRes.RoleUID;
        // let targetItem = this._getItemRoleByUid(targetUid);

        // let targetTakeAttack = ()=> {
        //     if (targetItem) {
        //         targetItem.takeAttack(hpRes, null, ()=> {

        //         })
        //     }
        // }
        // targetTakeAttack();
        return 0.5;
    }

    private _processAttack (res: ResultData): number {
        let targetUid = res.AttackResult.TargetUid;
        let targetItem = this._getItemRoleByUid(targetUid);

        let targetTakeAttack = ()=> {
            if (targetItem) {
                this._processAttackResult(res.AttackResult);
                targetItem.takeAttack(res, ()=> {
                    if (res.HPResult)
                        this._processHpResult(res.HPResult);
                })
            }
        }
    
        targetTakeAttack();
        return 0.5;
    }

    private _processBuff (buffRes: BuffResult): number {
        if (!buffRes) return 0;
        let targetUid = buffRes.RoleId;
        let target = this._getItemRoleByUid(targetUid);
        target && target.updatebuffByRes(buffRes);
        return 0
    }

    private _processPower (powerRes: PowerResult): number {
        let targetUid = powerRes.RoleUID;
        let target = this._getItemRoleByUid(targetUid);
        target && target.updatePowerByRes(powerRes);
        return 0
    }
    
    private _preProcessResults (results: ResultData[]): ResultData[] {
        let destResults: ResultData[] = [];
        let filter: ResultData;
        let filterIndex: number;
        let filterType: ResultType;
        for (let i = 0; i < results.length; i++) {
            if (results[i].ResultType != ResultType.RTHPResult 
                && results[i].ResultType != ResultType.RTNormalAttackResult
                && results[i].ResultType != ResultType.RTSkillAttackResult) {
                destResults.push(results[i]);
            } else {
                if (!filter) {
                    if ((results[i].HPResult && results[i].HPResult.Delta < 0) 
                    || (results[i].AttackResult && results[i].AttackResult.Attack > 0)) {
                        filter = results[i];
                        filterIndex = i;
                        filterType = results[i].ResultType;
                    } else {
                        destResults.push(results[i]);
                    }
                } else {
                    if (results[i].ResultType != filterType) {
                        if (filterType == ResultType.RTHPResult) {
                            if (filter.HPResult.RoleUID == results[i].AttackResult.TargetUid) {
                                filter.AttackResult = results[i].AttackResult;
                            } else {
                                destResults.push(results[i]);
                            }
                        } else {
                            if (filter.AttackResult.TargetUid == results[i].HPResult.RoleUID) {
                                filter.HPResult = results[i].HPResult;
                                filter.ResultType = ResultType.RTHPResult;
                            } else {
                                destResults.push(results[i]);
                            }
                        }
                    } else {
                        destResults.push(filter);
                        filter = results[i];
                        filterIndex = i;
                        // destResults.push(results[i]);
                    }
                }
            }
        }
        if (filter && filterIndex != null) {
            destResults.push(filter);
        }
        return destResults;
    }

    private _processHpResult (hpRes: HPResult) {
        let role = hpRes.RoleUID;
        let itemRole = this._getItemRoleByUid(role);
        if (itemRole) {
            itemRole.updateHp(hpRes);
        }
    }

    private _processAttackResult (attRes: AttackResult) {
        let role = attRes.TargetUid;
        let itemRole = this._getItemRoleByUid(role);
        if (itemRole) {
            itemRole.showAttackLabel(attRes);
        }
    }
 
    private _processFinish () {
        this._isProcessing = false;
        if (this._effList.length == 0) {
            if (this._callback) {
                this._unscheduleAllCallbacks();
                this._callback();
            }
        } else {
            if (this._itemInterval == 0) {
                this._processOne();
            } else {
                let timeId = scheduleManager.scheduleOnce(() => {
                    this._processOne();
                }, this._itemInterval);
                this._timerId.push(timeId);
            }
        }
    }

    private _checkIsSelfTeam (roleUID: number) {
        let selfTeam = modelManager.battleUIData.getSelfTeam();
        if (selfTeam && selfTeam.getRoleByUid(roleUID)) {
            return true;
        }
        return false;
    }


    private _unscheduleAllCallbacks () {
        this._timerId.forEach(timeId => {
            scheduleManager.unschedule(timeId);
        });
        this._timerId = [];
    }

    private _getItemRoleByUid (uid: number) {
        let isSelfTeam = this._checkIsSelfTeam(uid);
        let res: ItemRole = null;
        if (isSelfTeam) {
            let targetNode = this._game.heroCtrl.getRoleNode(uid);
            if (targetNode) res = targetNode.getComponent(ItemRole);
        } else {
            let targetNode = this._game.monsterCtrl.getRoleNode(uid);
            if (targetNode) res = targetNode.getComponent(ItemRole);
        }
        return res;
    }


}