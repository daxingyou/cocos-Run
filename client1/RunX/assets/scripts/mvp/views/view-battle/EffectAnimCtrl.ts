import { BACK_ATTACK_ID, BATTLE_POS, BTResult, DOUBLE_ATTACK_ID, EFFECT_TYPE, NORMAL_ATTACK_ID, NORMAL_ATTACK_TIME, NORMAL_ATTACK_TYPE, PRE_SKILL_ANIMATION_TIME, PURSUE_ATTACK_ID, ROLE_REBORN_ID, ROLE_TYPE, SHADE_LAYER_Z_INDEX, SkillType, SPUTTER_ATTACK_ID } from "../../../app/BattleConst";
import { configUtils } from "../../../app/ConfigUtils";
import { eventCenter } from "../../../common/event/EventCenter";
import { logger } from "../../../common/log/Logger";
import {scheduleManager} from "../../../common/ScheduleManager";
import { ItemResultData } from "../../../app/BattleType";
import { gamesvr } from "../../../network/lib/protocol";
import { battleUIData } from "../../models/BattleUIData";
import { battleUIOpt } from "../../operations/BattleUIOpt";
import skillDisplayManager from "../view-actor/SkillDisplayManager";
import { ANIMATION_GROUP, EffectConst, EffectMoveInfo, RoleSkillInfo, ROLE_MOVE_TYPE, SkillActorInfo, TARGET_EFFECT } from "../view-actor/SkillUtils";
import { SKILL_TYPE } from "../view-hero/HeroSkillView";
import ItemRole from "../view-item/ItemRole";
import { hpAnimationHelper } from "../view-role/HpAnimationHerlper";
import BattleScene from "../view-scene/BattleScene";
import { ANIM_TIMER_TAG, EffectAnimation } from "./EffectAnimation";
import { configManager } from "../../../common/ConfigManager";
import { cfg } from "../../../config/config";
import { getItemEffectOption } from "./EffectAnimationOption";
import shakeManager from "./ShakeManager";
import { battleUtils } from "../../../app/BattleUtils";
import { SUBSTITU_MOVE_TIME } from "../../../app/AppConst";

export default class EffectAnimCtrl {
    private _game: BattleScene = null;
    private _timerId: number[] = [];
    // 一次执行效果的间隔
    private _itemInterval: number = 0;
 
    private _isProcessing: boolean = false;
    private _effList: Array<ItemResultData> = [];
    private _callback: Function = null;
    private _moveTargets = new Map<number, number[]>();
    private _result: BTResult = null;
    private _curMoveSourceUid: number = -1; 
    private _curMoveTargetUid: number = -1;
    private _needMoveToNewTarget: boolean = false;  // 是否需要移动要新目标
    private _hpResultsLength: number = 0;
    private _currActiveRoles: Set<number> = null;
    private _extraHoldTime: number = 0;
    private _skillWithoutHpRes: boolean = false;

    init (game: BattleScene) {
        this._game = game;
        this._isProcessing = false;
        this._effList = [];
        this._timerId = [];
        this._currActiveRoles = this._currActiveRoles || new Set<number>();
        this._clearEffctInfo()
    }
 
    deInit () {
        this._effList = [];
        this._callback = null;
        this._unscheduleAllCallbacks();
        eventCenter.unregisterAll(this);
        hpAnimationHelper.clear();

        this._currActiveRoles && this._currActiveRoles.clear();
        this._clearEffctInfo();
    }

    // 清除当前这一组效果的信息
    private _clearEffctInfo () {
        this._needMoveToNewTarget = false;
        this._curMoveSourceUid = -1;
        this._curMoveTargetUid = -1;
        this._moveTargets.clear();
        this._skillWithoutHpRes = false;
        this._extraHoldTime = 0;
    }

    private _resetEffectInfo (effResArr: ItemResultData[]) {
        this._clearEffctInfo();

        this._setMoveTargets(effResArr);
        this._getActiveRoles(effResArr);
        this._getExtraHoleTime(effResArr);
        this._updataSkillInfo(effResArr)
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
        
        this._resetEffectInfo(effResArr);
        this._callback = callback;
        this._effList = this._effList.concat(effResArr);
        this._processOne();
    }

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
            this._checkShadeVisible(effectInfo);
            this._processEffect(effectInfo.ItemResults, effectInfo.RoleUID, () => {
                this._processFinish();
            });
        } else {
            this._processFinish();
        }
    }

    private _checkShadeVisible(data: ItemResultData){
        if(!data || !data.ItemResults || data.ItemResults.length == 0) return;
        let firstEle = data.ItemResults[0];
        if(firstEle.ResultType != gamesvr.ResultType.RTSkillLightResult || !firstEle.SkillLightResult) return;
        let skillCfg = configUtils.getSkillConfig(firstEle.SkillLightResult.SkillID);
        if(!skillCfg || !skillCfg.BlackBackground || skillCfg.BlackBackground <= 0) return;
        let activeNodes: cc.Node[] = [];
        let posArr: number[] = [];
        this._currActiveRoles.forEach(ele => {
            let roleInfo =  battleUIData.getRoleByUid(ele);
            if(!roleInfo) return;
            let roleItem = roleInfo.roleType == ROLE_TYPE.HERO ? this._game.heroCtrl.getRoleItem(ele) : this._game.monsterCtrl.getRoleItem(ele);
            if(!roleItem) return;
            activeNodes.push(roleItem.node.parent);
            posArr.push(roleInfo.pos);
        });

        //黑屏生效
        if(activeNodes.length > 0){
            this._game.shadeCtrl.show();
            battleUtils.setZIndex(SHADE_LAYER_Z_INDEX);
        }

        activeNodes.forEach((ele, idx) => {
            let zindex = battleUtils.getInitZIndex(posArr[idx]);
            ele.zIndex = zindex + battleUtils.zIndexHelper;
        })
    }

    private _getActiveRoles(effResArr: ItemResultData[]){
        if(!effResArr || effResArr.length == 0) return;
        this._currActiveRoles = this._currActiveRoles || new Set<number>();
        effResArr.forEach(ele => {
            if(!ele.ItemResults || ele.ItemResults.length === 0) return;
            ele.ItemResults.forEach(item => {
                switch(item.ResultType){
                    case gamesvr.ResultType.RTBuffLightResult:
                        item.BuffLightResult.RoleUID && this._currActiveRoles.add(item.BuffLightResult.RoleUID);
                        break;
                    case gamesvr.ResultType.RTBuffResult:
                        item.BuffResult.RoleUID && this._currActiveRoles.add(item.BuffResult.RoleUID);
                        break;
                    case gamesvr.ResultType.RTHPResult:
                        item.HPResult.RoleUID && this._currActiveRoles.add(item.HPResult.RoleUID);
                        item.HPResult.HPDetail.RoleUID && this._currActiveRoles.add(item.HPResult.HPDetail.RoleUID);
                        item.HPResult.HPDetail.TargetUID && this._currActiveRoles.add(item.HPResult.HPDetail.TargetUID);
                        item.HPResult.HPDetail.Protect && this._currActiveRoles.add(item.HPResult.HPDetail.Protect);
                        break;
                    case gamesvr.ResultType.RTHaloLightResult:
                        item.HaloLightResult.RoleUID && this._currActiveRoles.add(item.HaloLightResult.RoleUID);
                        break;
                    case gamesvr.ResultType.RTHaloResult:
                        item.HaloResult.RoleUID && this._currActiveRoles.add(item.HaloResult.RoleUID);
                        break;
                    case gamesvr.ResultType.RTPowerResult:
                        item.PowerResult.RoleUID && this._currActiveRoles.add(item.PowerResult.RoleUID);
                        break;
                    case gamesvr.ResultType.RTRoleDeadResult:
                        item.RoleDeadResult.RoleUID && this._currActiveRoles.add(item.RoleDeadResult.RoleUID);
                        break;
                    case gamesvr.ResultType.RTRoleReviveResult:
                        item.RoleReviveResult.RoleUID && this._currActiveRoles.add(item.RoleReviveResult.RoleUID);
                        break;
                    case gamesvr.ResultType.RTRoleTimerResult:
                        item.RoleTimerResult.RoleUID && this._currActiveRoles.add(item.RoleTimerResult.RoleUID);
                        break;
                    case gamesvr.ResultType.RTSkillLightResult:
                        item.SkillLightResult.RoleUID && this._currActiveRoles.add(item.SkillLightResult.RoleUID);
                        break;
                    case gamesvr.ResultType.RTTeamBuffLightResult:
                        break;
                    case gamesvr.ResultType.RTTeamBuffResult:
                        break;
                }
            });
        })
    }

    /**
     * @description 一次同时要执行的效果，返回执行效果的时间
     * @param itemId itemId
     * @param effects 一次要执行的效果
     * @returns 返回效果的执行时间
     */
    private _processEffect (effects: BTResult[], userUID: number, callback: Function) {
        if (!effects || effects.length == 0) {
            callback();
            return;
        }

        let processTime: number = 0;

        // effects需要过滤一遍，将同一个index的HPResult合并, 合并后的类型是HPresult
        let filterResults = this._preProcessResults(effects);
        this._needMoveToNewTarget = false;
        // 判断是否需要移动到新的目标
        this._changeNeedMoveToNewTargetState(filterResults);
        let delayTime = 0;
        if(filterResults.length == 1 && filterResults[0].HPResult && this._needMoveToNewTarget) {
            delayTime = this._moveToNewTarget(filterResults[0].HPResult);
        }

        // 获取需要坦攻击的效果索引
        // this._updateSubstituIndex(filterResults)
        let timerMain = scheduleManager.scheduleOnce(() => {
            this._updateHPResultsLength(filterResults);
            filterResults.forEach((resultData: BTResult, idx: number) => {
                const effectPlayer = new EffectAnimation(this._game, resultData, userUID);
                
                // 播放受击方
                let dur = effectPlayer.play();
                processTime = Math.max(processTime, dur);
            
                 // 播放攻击方
                let operaTime = this.processOneEffect(resultData);
                processTime = Math.max(processTime, operaTime);
            });
    
            if (processTime == 0) {
                callback();
            } else {
                let timeId = scheduleManager.scheduleOnce(() => {
                    callback();
                }, processTime);
                this._timerId.push(timeId);
            }
        }, delayTime);
        this._timerId.push(timerMain);
    }
    processOneEffect (effect: BTResult): number {
        // 这里的processTime主要是移动的时间
        // 让攻击动作和受击动作同一时间点开始
        this._result = effect;
        let processTime = 0;
        if (effect) {
            switch (effect.ResultType) {
                case gamesvr.ResultType.RTSkillLightResult:     processTime = this._processSkillLight(effect.SkillLightResult); break;
                case gamesvr.ResultType.RTHPResult:             processTime = this._processHpResult(); break;
                case gamesvr.ResultType.RTBuffLightResult:      processTime = this._processBuffLight(); break;
                // buff变化 只有target动作特效 所以这里这个可以不需要了
                // case gamesvr.ResultType.RTBuffResult:       processTime = this._processBuff(effect.BuffResult); break;
                case gamesvr.ResultType.RTPowerResult:          processTime = this._processPower(); break;
                case gamesvr.ResultType.RTRoleDeadResult:       processTime = this._processRoleDie(effect.RoleDeadResult); break;
                case gamesvr.ResultType.RTTeamBuffResult:       processTime = this._porcessTeamBuff(effect.TeamBuffResult); break;
                case gamesvr.ResultType.RTTeamBuffLightResult:  processTime = this._processTeamBuffLight(); break;
                default: break
            }
        }
        return processTime;
    }

    private _playShakeScreen(info: RoleSkillInfo) {
      if(!info || !info.shakes || info.shakes.length === 0) return;
      info.shakes.forEach(ele => {
          if(!EffectConst.isShakeValid(ele)) return;
          shakeManager.shake(ele);
      });
    }

    private _processSkillLight (skillRes: gamesvr.ISkillLightResult): number {
        let processTime = 0;
        let roleUid = skillRes.RoleUID;
        let roleItem = battleUIData.getRoleByUid(roleUid);
        let skillId: number = skillRes.SkillID;
        if (roleItem) {
            let moveTargets = this._moveTargets.get(skillRes.SkillID) || [];
            let moveTarget = moveTargets[0]?moveTargets[0]: 0;
            let userItem = this._getItemRoleByUid(roleItem.uid);
            if (!userItem) return 0

            let targetItem = moveTarget? this._getItemRoleByUid(moveTarget):userItem;
            let isLeft = userItem.role.roleType == ROLE_TYPE.HERO;
            let effectId = battleUtils.getSkillEffectId(skillId, 0);
            // 移动目标不一定是最终攻击目标
            // 全部移去processHpResult处理了
            if (battleUtils.checkIsNormalAttack(skillId)) {

            } else {
                let skillCfg = configUtils.getSkillConfig(skillId);
                let skillActionFunc = () => {
                    if(userItem) {
                        // TODO 旭哥这个需要改一下位置还是怎么滴
                        this._playShakeScreen(skillDisplayManager.getFrontEffect(skillId));
                        //this._playShakeScreen(skillDisplayManager.getBehindEffect(skillId));
                        // state特效 都是加buff或者加血技能 统一放到EffectAnimation中去播 放这里
                        let isLeftSide = userItem.role.roleType == ROLE_TYPE.HERO ? true : false;
                        if(skillCfg && skillCfg.FrontTemplateID) {
                            // 播放攻击前摇 如果有
                            userItem.playBeforeOrBehindSkillEffect(skillId, ANIMATION_GROUP.SOURCE, 1, {
                                    source: userItem,
                                    target: targetItem,
                                    leftSide: isLeftSide
                                }, { seq : this._getSeq()}
                            )
                        }
                    }
                }
                // 非血量变化类技能施法者的时间
                if (effectId && this._skillWithoutHpRes) {
                    processTime +=  this._getSkillTime(effectId, ANIMATION_GROUP.SOURCE, {
                        source: userItem,
                        target: targetItem
                    });
                    let timer = scheduleManager.scheduleOnce(()=> {
                        userItem.playSkillEffect(effectId, ANIMATION_GROUP.SOURCE, {
                            source: userItem,
                            target: targetItem,
                            leftSide: userItem.role.roleType == ROLE_TYPE.HERO
                        });
                    }, PRE_SKILL_ANIMATION_TIME)
                    this._timerId.push(timer)
                }

                // 大招前摇计算时间
                if(skillCfg && skillCfg.FrontTemplateID) {
                    processTime += this._getSkillTime(skillCfg.FrontTemplateID, ANIMATION_GROUP.SOURCE);
                }
                // 只有大招才能播放
                if(skillCfg && SKILL_TYPE.BASIC_SKILL == skillCfg.Type) {
                    // 播放大招PV
                    processTime += this.playPreSkill(skillId, roleUid, skillActionFunc);
                } else {
                    skillActionFunc();
                }
            }
        }
        return processTime;
    }
    /**
     * 处理HPResult
     * @returns 
     */
    private _processHpResult() {
        let duration: number = 0;
        this._curMoveSourceUid = this._result.HPResult.HPDetail.RoleUID || -1;
        this._curMoveTargetUid = this._result.HPResult.RoleUID || -1;
        if(!this._result.HPResult) {
            return duration;
        }
        let section = this._getSection();
        let source = this._getSource();
        let target = this._getTarget();
        let itemId = this._getItemId();

        // 普攻效果 包括连击 反击 追击 。。。 反正是除了技能之外的攻击
        if(source && battleUtils.checkIsNormalAttack(itemId)) {
            let seq = this._getSeq();
            let attackEffectId = battleUtils.getEffectId(this._result, { source: source });
            if(attackEffectId > 0) {
                let isLeft = source.role.roleType == ROLE_TYPE.HERO;
                 // 如果需要额外时间就需要在行动前等一等(比如坦攻，只有在普攻的情况下)
                if (this._extraHoldTime) {
                    let schedulaID = scheduleManager.scheduleOnce(()=> {
                        source.playSkillEffect(attackEffectId, ANIMATION_GROUP.SOURCE, {
                            source: source,
                            target: target,
                            leftSide: isLeft
                        });
                    }, this._extraHoldTime)
                   this._timerId.push(schedulaID)
                } else {
                    source.playSkillEffect(attackEffectId, ANIMATION_GROUP.SOURCE, {
                        source: source,
                        target: target,
                        leftSide: isLeft
                    });
                }
            }
            duration = this._getSkillTime(attackEffectId, ANIMATION_GROUP.SOURCE, {
                source: source,
                target: target,
                leftSide: source.role.roleType == ROLE_TYPE.HERO
            }, seq);
            this._hpResultsLength = 0;
            
            // 如果需要额外时间就需要在行动前等一等
            let extraTime = this._extraHoldTime;
            this._extraHoldTime = 0;
            return duration + extraTime;
        }

        // 大招
        let effectId = battleUtils.getEffectId(this._result, { section: section});
        if(source && effectId > 0 && this._hpResultsLength >= 1 && this._needPlayEffect()) {
            // 播技能特效 skill & buff 
            let seq = this._getSeq();
            let maxSeq = EffectConst.getSkillInfoMaxSeq(effectId, ANIMATION_GROUP.SOURCE);
            // 如果取到 skillList里最大的Seq ！= 0  说明是多段攻击  而此时seq ！= 0  就不会播了
            if(maxSeq > 0) {
                // 如果技能的最大seq 大于0 说明是多段攻击
                source.playSkillEffect(effectId, ANIMATION_GROUP.SOURCE, {
                    source: source,
                    target: target,
                    leftSide: source.role.roleType == ROLE_TYPE.HERO
                }, {
                    seq: seq
                });
            } else {
                source.playSkillEffect(effectId, ANIMATION_GROUP.SOURCE, {
                    source: source,
                    target: target,
                    leftSide: source.role.roleType == ROLE_TYPE.HERO
                });
            }
            //攻击振屏
            (!seq || seq == 0) && this._playShakeScreen(skillDisplayManager.getSkill(battleUtils.getEffectId(this._result, {section: this._getSection()})));
            duration = this._getSkillTime(effectId, ANIMATION_GROUP.SOURCE, {
                source: source,
                target: target,
                leftSide: source.role.roleType == ROLE_TYPE.HERO
            }, seq);
            this._hpResultsLength = 0;
        }
        return duration;
    }

    /**
     * 找到当前移动到的目标列表
     * @param res 
     */    
    private _setMoveTargets (res: ItemResultData[]) {
        this._moveTargets.clear();

        let lightId: number = 0;
        let targets: number[] = [];
        for (let n = 0; n < res.length; n++) {
            let _itemRes = res[n].ItemResults;
            for (let i = 0; i < _itemRes.length; i++) {
                let _res = _itemRes[i];
                if (_res && _res.ResultType == gamesvr.ResultType.RTSkillLightResult) {
                    if (targets.length > 0 && lightId) {
                        this._moveTargets.set(lightId, targets);
                    }
                    lightId = _res.SkillLightResult.SkillID;
                    targets = []
                } else {
                    if (_res && _res.ResultType == gamesvr.ResultType.RTHPResult) { 
                        if (_res.HPResult.HPDetail) {
                            if(_res.HPResult.HPDetail && _res.HPResult.HPDetail.Protect) {
                                targets.push(_res.HPResult.HPDetail.Protect);
                            } else {
                                targets.push(_res.HPResult.HPDetail.TargetUID)
                            }
                        }
                    }
                }
            }
        }
        if (lightId && targets.length) {
            this._moveTargets.set(lightId, targets);
        }
    }

    /**
     * @description 攻击者的移动和普攻效果
     * @param roleUid 攻击者角色ID
     * @param targetUid 目标UIS
     * @returns 
     */
    private _processMoveNewTarget (roleUid: number, targetUid: number, moveHandler: Function): number {
        let user = battleUIData.getRoleByUid(roleUid);
        let target = battleUIData.getRoleByUid(targetUid);
        let isSelfTeam = user.roleType == ROLE_TYPE.HERO;

        let targetItem: ItemRole;
        let userItem: ItemRole;
        let roleNode = isSelfTeam? this._game.heroCtrl.getRoleNode(roleUid):this._game.monsterCtrl.getRoleNode(roleUid);
        if (cc.isValid(roleNode)) {
            userItem = roleNode.getComponent(ItemRole);
        }

        let targetNode = isSelfTeam? this._game.monsterCtrl.getRoleNode(targetUid):this._game.heroCtrl.getRoleNode(targetUid);
        if (cc.isValid(targetNode)) {
            targetItem = targetNode.getComponent(ItemRole);
        }

        if (targetItem && userItem) {
            let roleCtrl = isSelfTeam? this._game.heroCtrl: this._game.monsterCtrl;
            let userPosType = BATTLE_POS.TARGET;
            let isLong = battleUtils.getModelMeleeOrLong(user.roleId);
            // 远程攻击在原地
            if(isLong) {
                userPosType = BATTLE_POS.ORIGIN;
            }
            let moveTime = roleCtrl.precessRoleMove(targetUid, roleUid, {type: userPosType, index: target.pos}, ()=> {
                moveHandler && moveHandler();
            });
            return moveTime;
        }
        moveHandler && moveHandler();
        return 0;
    }

    private _processBuffLight (): number {
        let processTime = 0;
        let source = this._getSource();
        let itemId = this._getItemId();
        let isLeftSide = source && source.role.roleType == ROLE_TYPE.HERO
       
        // 先判断是否是仙缘buff触发
        let delayTime: number = 0;
        let teamBuffFriendId = this._getTeamBuffFriendId(itemId);
        if(teamBuffFriendId) {
            delayTime += this._game.uiController.playPreSkillEffect(itemId, 0, isLeftSide);
        }
        // let effectId = this._getEffectId();
        let effectId= battleUtils.getEffectId(this._result);
        if(effectId > 0) {
            processTime += this._getArrGroupDuration(effectId, ANIMATION_GROUP.SOURCE);
        }
        let timer = scheduleManager.scheduleOnce(() => {
            if (effectId > 0) {
                if (source) {
                    let target = this._getTarget();
                    this._playShakeScreen(skillDisplayManager.getBuffEffectSkill(effectId));
                    this._playShakeScreen(skillDisplayManager.getSkill(effectId));
                    this._playShakeScreen(skillDisplayManager.getLoopEffectSkill(effectId));
                    this._playShakeScreen(skillDisplayManager.getBuffHitEffectSkill(effectId));
                    source.playSkillEffect(effectId, ANIMATION_GROUP.SOURCE, {
                        source: source,
                        target: target,
                        leftSide: isLeftSide
                    });
                }
            }
        }, delayTime);
        this._timerId.push(timer)
        return processTime + delayTime;
    }

    private processActiveBuff (buffId: number, roleUid: number): number {
        return 0;
    }

    processBeforeSkillMove(itemId: number, roleUid: number, targetUid: number, endCb?: Function): number {
        let user = battleUIData.getRoleByUid(roleUid);
        let target = battleUIData.getRoleByUid(targetUid);
        let isSelfTeam = user.roleType == ROLE_TYPE.HERO;
        let targetItem: ItemRole;
        let userItem: ItemRole;
        let skillTime = 0;
        if (isSelfTeam) {
            userItem = this._game.heroCtrl.getRoleItem(roleUid);

            if (targetUid) {
                targetItem = this._game.monsterCtrl.getRoleItem(targetUid);
                if (!targetItem) {
                    logger.warn(`process SourceAnimation target cant be found. item ID = ${itemId}, target = ${targetUid}`)
                    let defaultTarget = battleUIOpt.findDefaultTarget(user);
                    targetItem = this._game.monsterCtrl.getRoleItem(defaultTarget.uid);
                }
            }
        } else {
            userItem = this._game.monsterCtrl.getRoleItem(roleUid);
            if (targetUid) {
                targetItem = this._game.heroCtrl.getRoleItem(targetUid);
                if (!targetItem) {
                    logger.warn(`process SourceAnimation target cant be found. item ID = ${itemId}, target = ${targetUid}`)
                    let defaultTarget = battleUIOpt.findDefaultTarget(user);
                    targetItem = this._game.heroCtrl.getRoleItem(defaultTarget.uid);
                }
            }
        }
        skillTime += userItem.playBeforeOrBehindSkillEffect(itemId, ANIMATION_GROUP.SOURCE, 1, {
            playDeathAnim: false,
            onComplete: () => { endCb && endCb(); },
            source: userItem,
            target: targetItem
        });
        // 一般来说 跟上面的时间是一样的
        // let skillTime: number =  this._getSkillTime(itemId, ANIMATION_GROUP.SOURCE);
        return skillTime;
    }

    // 大招技能效果播放前的全屏特效
    private playPreSkill(skillId: number, instanceId: number, endFunc: Function): number {
        let time: number = 0;
        let isSelfTeam = this._checkIsSelfTeam(instanceId);
        let itemRole = isSelfTeam ? this._game.heroCtrl.getRoleItem(instanceId) : this._game.monsterCtrl.getRoleItem(instanceId);
        if(itemRole) {
            time = this._game.uiController.playPreSkillEffect(skillId, itemRole.role.id, isSelfTeam, endFunc);
        }
        return time;
    }

    private _checkSkillMove (itemId: number) {
        let skillInfo: RoleSkillInfo = skillDisplayManager.getSkill(itemId);
        if (skillInfo && skillInfo.effectList.length > 0) {
            for (let i = 0; i < skillInfo.effectList.length; i++) {
                if (skillInfo.effectList[i].roleMove) {
                    return true;
                }
            }
        }
        return false;
    }

    private _porcessTeamBuff(teamBuffRes: gamesvr.ITeamBuffResult) {
        if(!teamBuffRes) return 0;
        this._game.updateFriendView(teamBuffRes);
        return 0;
    }
    /**
     * 仙缘羁绊技能触发表现
     * @returns 
     */
    private _processTeamBuffLight(): number {
        let duration: number = 0;
        if(!this._result.TeamBuffLightResult) return duration;
        let buffId = this._result.TeamBuffLightResult.BuffID;
        if(buffId) {
            let getTeamCfg = (): cfg.HeroFriend => {
                let configs: {[k: number]: cfg.HeroFriend} = configManager.getConfigs('heroFriend');
                for(const k in configs) {
                    let cfg = configs[k];
                    if(cfg.HeroFriendSkillBuff && cfg.HeroFriendSkillBuff == buffId) {
                        return cfg;
                    }
                }
                return null;
            }
            let actionTime: number = 0;
            let prepvTime = 0;
            let friendCfg = getTeamCfg();
            let showHeroList: number[] = [];
            if(friendCfg) {
                // 说明是teambuff
                let friends = friendCfg.HeroFriendNeedHero.split('|');
                showHeroList = showHeroList.concat(friends.map(_hero => { return Number(_hero); }));
            }
            
            if(showHeroList.length > 0 && friendCfg && friendCfg.HeroFriendHeroEffect) {
                let effects = friendCfg.HeroFriendHeroEffect.split('|');
                let isSelfTeam = this._result.TeamBuffLightResult.Team != 1
                for(let i = 0; i < showHeroList.length; ++i) {
                    let heroId: number = showHeroList[i];
                    let effectId: number = Number(effects[i]);
                    let source = this._getItemRoleByRoleId(heroId, isSelfTeam);

                    if (prepvTime == 0) {
                        prepvTime = this._game.uiController.playPreSkillEffect(buffId, 0, isSelfTeam);
                    }

                    if(source && heroId > 0 && effectId > 0) {
                        let timer = scheduleManager.scheduleOnce(() => {
                            source.playSkillEffect(effectId, ANIMATION_GROUP.SOURCE, {
                                source: source,
                                target: source,
                                leftSide: source.role.roleType == ROLE_TYPE.HERO 
                            });
                        }, prepvTime);
                        let effectTime = this._getSkillTime(effectId, ANIMATION_GROUP.SOURCE);
                        actionTime = Math.max(actionTime, effectTime);
                        this._timerId.push(timer)
                    }
                }
            }
            
            duration += (/*actionTime+*/prepvTime);
        }
        return duration;
    }

    private _processRoleDie (deadRes: gamesvr.IRoleDeadResult) {
        return 0;
    }   

    private _processPower (): number {
        let target = this._getTarget();
        target && target.updatePowerByRes(this._result.PowerResult);
        return 0
    }

    private _preProcessResults (results: BTResult[]): BTResult[] {
        let destResults: BTResult[] = [];
        let filter: BTResult;
        let filterIndex: number;
        let filterType: gamesvr.ResultType;
        for (let i = 0; i < results.length; i++) {
            if (results[i].ResultType != gamesvr.ResultType.RTHPResult) {
                destResults.push(results[i]);
            } else {
                if (!filter) {
                    if ((results[i].HPResult && (results[i].HPResult.Delta != 0 || results[i].HPResult.DeltaShield != 0))) {
                        filter = results[i];
                        filterIndex = i;
                        filterType = results[i].ResultType;
                    } else {
                        destResults.push(results[i]);
                    }
                } else {
                    if (results[i].ResultType != filterType) {
                        // if (filterType == gamesvr.ResultType.RTHPResult) {
                        //     if (filter.HPResult.RoleUID == results[i].AttackResult.TargetUid) {
                        //         filter.AttackResult = results[i].AttackResult;
                        //         filter.ResultType = ResultType.RTAttackResult;
                        //     } else {
                        //         destResults.push(results[i]);
                        //     }
                        // } else {
                        //     if (filter.AttackResult.TargetUid == results[i].HPResult.RoleUID) {
                        //         filter.HPResult = results[i].HPResult;
                        //     } else {
                        //         destResults.push(results[i]);
                        //     }
                        // }
                        destResults.push(results[i]);
                    } else {
                        destResults.push(filter);
                        filter = results[i];
                        filterIndex = i;
                    }
                }
            }
        }
        if (filter && filterIndex != null) {
            destResults.push(filter);
        }
        return destResults;
    }

    private _moveToNewTarget(hpResult: gamesvr.IHPResult): number {
        let duration: number = 0;
        if(hpResult) {
            this._curMoveSourceUid = hpResult.HPDetail.RoleUID || -1;
            this._curMoveTargetUid = hpResult.RoleUID || -1;
            if(this._needMoveToNewTarget) {
                duration += this._processMoveNewTarget(this._curMoveSourceUid, this._curMoveTargetUid, null);
                // TODO 暂时改成 移动不占用时间
                duration = 0;
                this._needMoveToNewTarget = false;
            }
        }
        return duration;
    }

    private _changeNeedMoveToNewTargetState(res: BTResult[]) {
        if(!res || res.length == 0) return;
        if(res.length != 1) return;
        let hpResult = res[0].HPResult;
        if(!hpResult) return;
        // 如果主动方不对等了 就不需要移动
        if(this._curMoveSourceUid != hpResult.HPDetail.RoleUID){
            this._curMoveSourceUid = hpResult.HPDetail.RoleUID;

            // 反击是例外
            if (res[0].ItemID == BACK_ATTACK_ID && hpResult.HPDetail) {
                let source = this._getItemRoleByUid(hpResult.HPDetail.RoleUID);
                let target = this._getItemRoleByUid(hpResult.HPDetail.TargetUID);
                if (source && target && battleUtils.checkBackAttackMove(source,target)) {
                    this._needMoveToNewTarget = true;
                }
            }

            return;
        }
        // 当前没有主动方 或者当前主动方id 跟 新的主动方 对不上  就不需要移动到新目标
        if(this._curMoveTargetUid == -1 || this._curMoveTargetUid != hpResult.RoleUID){
            let sourceId = hpResult.HPDetail.RoleUID;
            let source = this._getItemRoleByUid(sourceId);
            if(source) {
                let section = res[0].Display || 0;
                let effectId = battleUtils.getEffectId(res[0], {
                    source: source,
                    section: section
                });
                if(effectId > 0) {
                    let moveType = this._getStartMoveType(effectId);
                    if(ROLE_MOVE_TYPE.DEFAULT == moveType) {
                        this._needMoveToNewTarget = true;
                    }
                }
                // let effectMaxSeq = EffectConst.getSkillInfoMaxSeq(effectId, ANIMATION_GROUP.SOURCE);
                // if(res[0].Index > 0 && effectMaxSeq > 0) {
                // } else {
                //     this._needMoveToNewTarget = true;
                // }
            }
        }

        // if(hpResult) {
        //     if(res.length == 1) {
        //         if(this._curMoveSourceUid != hpResult.HPDetail.RoleUID) {
        //             this._curMoveSourceUid = hpResult.HPDetail.RoleUID
        //         } else {
        //             if(this._curMoveTargetUid == -1 || this._curMoveTargetUid != hpResult.RoleUID) {
        //                 this._needMoveToNewTarget = true;
        //                 return;
        //             }
        //         }
        //     }
        // }
    }

    private _updateHPResultsLength(res: BTResult[]) {
        let fHpResult = res[0].HPResult;
        if(fHpResult) {
            this._hpResultsLength = res.length;
        } else {
            this._hpResultsLength = 0;
        }
    }

    private _processFinish () {
        this._isProcessing = false;
        if (this._effList.length == 0) {
            this._currActiveRoles && this._currActiveRoles.size > 0 && this._game.shadeCtrl.hide();
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
        let selfTeam = battleUIData.getSelfTeam();
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
        // effectAnimation也放到这里管理，好像有点不合理，但是没其他地方管理了
        scheduleManager.unscheduleByTag(ANIM_TIMER_TAG)
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

    private _getItemRoleByRoleId(roleId: number, isSelfTeam: boolean): ItemRole {
        if (isSelfTeam) {
            let itemRole = this._game.heroCtrl.getRoleByRoleId(roleId);
            return itemRole
        }
       
      
        let itemE = this._game.monsterCtrl.getRoleByRoleId(roleId);
        
        return itemE;
    }

    private _needCalculateSkillTime(itemId: number, actorInfo: SkillActorInfo): boolean {
        const src = actorInfo ? actorInfo.source : null;
        let skillInfo = skillDisplayManager.getSkill(itemId, src ? src.role.skeletonName : null);
        if (skillInfo == null) {
            return false;
        }
        // let itemEffectOption = getItemEffectOption(itemId);
        // if('undefined' !=  typeof itemEffectOption) {
        //     return true;
        // }
        return 'state' == skillInfo.targetEffect;
    }

     /**
     * 这个是计算特效时间
     * @param itemId 
     * @param group 
     * @param actorInfo 
     * @param seq 
     * @returns 
     */
      private _getSkillTime (itemId: number, group: ANIMATION_GROUP, actorInfo?: SkillActorInfo, seq?: number): number {
        // TODO 特殊处理下 如果特殊处理了时间间隔
        let itemEffectOption = getItemEffectOption(itemId);
        if('undefined' != typeof itemEffectOption.durationRate) {
            return itemEffectOption.durationRate;
        }

        const src = actorInfo ? actorInfo.source : null;
        let skillInfo = skillDisplayManager.getSkill(itemId, src ? src.role.skeletonName : null);
        if (skillInfo == null) {
            return 0;
        }
        if(skillInfo.arrGroupInfo && skillInfo.arrGroupInfo.length > 0) {
            let ret = -1;
            if (skillInfo.arrGroupInfo && skillInfo.arrGroupInfo.length > 0) {
                skillInfo.arrGroupInfo.some(info => {
                    //@ts-ignore
                    const gp = ANIMATION_GROUP[info.group];
                    if (gp === group && info.duration) {
                        ret = info.duration;
                        return true;
                    }
                    return false;
                });
            }
            if(ret != -1) {
                return ret;
            }
        }
        let ret = EffectConst.filterGroupSeqTime(skillInfo, group, skillInfo.targetEffect, seq);
        return ret.end - ret.start;
    }
    /**
     * 单独计算BuffLight时间 如果给了特殊设置时间 就返回时间 不给就是默认的0 因为skillLight不占时间
     * @param itemId 
     * @param group 
     * @param actorInfo 
     * @param seq 
     * @returns 
     */
    private _getArrGroupDuration(itemId: number, group: ANIMATION_GROUP, actorInfo?: SkillActorInfo, seq?: number): number {
        const src = actorInfo ? actorInfo.source : null;
        let skillInfo = skillDisplayManager.getSkill(itemId, src ? src.role.skeletonName : null);
        if (skillInfo == null) {
            return 0;
        }
        let duration: number = 0;
        if(skillInfo.arrGroupInfo && skillInfo.arrGroupInfo.length > 0) {
            if (skillInfo.arrGroupInfo && skillInfo.arrGroupInfo.length > 0) {
                skillInfo.arrGroupInfo.some(info => {
                    //@ts-ignore
                    const gp = ANIMATION_GROUP[info.group];
                    if (gp === group) {
                        duration = info.duration;
                        return true;
                    }
                    return false;
                });
            }
        }
        return duration;
    }

    private _checkHasFrontSkill(itemId: number): boolean {
        let skillInfo = skillDisplayManager.getFrontEffect(itemId);
        return !!skillInfo;
    }

    private _getItemId(): number {
        return battleUtils.getItemId(this._result);
    }

    private _getTarget(): ItemRole {
        let roleUID: number;
        switch (this._result.ResultType) {
            case gamesvr.ResultType.RTHPResult: {
                if(this._result.HPResult.HPDetail.Protect) {
                    roleUID = this._result.HPResult.HPDetail.TargetUID;
                } else {
                    roleUID = this._result.HPResult.RoleUID;
                }
            }
            break;
            case gamesvr.ResultType.RTBuffLightResult: roleUID = this._result.BuffLightResult.RoleUID; break;
            case gamesvr.ResultType.RTSkillLightResult: roleUID = this._result.SkillLightResult.RoleUID; break;
            case gamesvr.ResultType.RTPowerResult: roleUID = this._result.PowerResult.RoleUID; break;
            default:
                break;
        }
        return this._getItemRoleByUid(roleUID);
    }

    private _getSource(): ItemRole {
        let roleUID: number;
        switch (this._result.ResultType) {
            case gamesvr.ResultType.RTHPResult: {
                if(this._result.HPResult.Delta > 0) {
                    let source = null;
                    let from = this._result.From;
                    let uiRole = battleUIData.getRoleByBuffUid(from);
                    if(uiRole) {
                        // 上一层是buff触发的buff效果 from是buffUid
                        source = this._getItemRoleByUid(uiRole.uid);
                    } else {
                        source = this._getItemRoleByUid(from);
                    }
                    return source;
                } else {
                    roleUID = this._result.HPResult.HPDetail.RoleUID;
                }
            }
            break;
            case gamesvr.ResultType.RTBuffResult: {
                let from = this._result.From;
                let itemType = this._getItemType(this._result.ItemID);
                if(EFFECT_TYPE.BUFF == itemType) {
                    let buffUid = this._result.BuffResult.BuffUID;
                    let uiRole = battleUIData.getRoleByBuffUid(buffUid);
                    if(uiRole) {
                        roleUID = uiRole.uid;
                    }
                } else if(EFFECT_TYPE.SKILL == itemType) {
                    let itemRole = this._getItemRoleByUid(from);
                    if(itemRole) {
                        return itemRole;
                    }
                }
            }; break;
            case gamesvr.ResultType.RTBuffLightResult: {
                let buffUid = this._result.BuffLightResult.BuffUID;
                let uiRole = battleUIData.getRoleByBuffUid(buffUid);
                if(uiRole) {
                    roleUID = uiRole.uid;
                }
            } break;
            case gamesvr.ResultType.RTSkillLightResult: roleUID = this._result.SkillLightResult.RoleUID; break;
            case gamesvr.ResultType.RTRoleReviveResult: roleUID = this._result.RoleReviveResult.RoleUID; break;
            default:
                break;
        }
        return this._getItemRoleByUid(roleUID);
    }

    private _getItemType(itemId: number): EFFECT_TYPE {
        if (itemId != NORMAL_ATTACK_ID && configManager.getConfigByKey('skill', itemId)) {
            return EFFECT_TYPE.SKILL;
        } else if (configManager.getConfigByKey('buff', itemId)) {
            return EFFECT_TYPE.BUFF;
        } else if (configManager.getConfigByKey('halo', itemId)) {
            return EFFECT_TYPE.HALO;
        } else {
            if(NORMAL_ATTACK_ID == itemId) {
                return EFFECT_TYPE.NORMAL_ATTACK;
            } else if(PURSUE_ATTACK_ID == itemId) {
                return EFFECT_TYPE.NORMAL_ATTACK;
            } else if(DOUBLE_ATTACK_ID == itemId) {
                return  EFFECT_TYPE.NORMAL_ATTACK;
            } else if(BACK_ATTACK_ID == itemId) {
                return EFFECT_TYPE.NORMAL_ATTACK;
            }
        }
        return EFFECT_TYPE.SKILL;
    }

    private _getTeamBuffFriendId(buffId: number): number {
        let configs: {[k: number]: cfg.HeroFriend} = configManager.getConfigs('heroFriend');
        for(const k in configs) {
            let cfg = configs[k];
            if(cfg.HeroFriendSkillBuff && cfg.HeroFriendSkillBuff == buffId) {
                return cfg.HeroFriendId;
            }
        }
        return 0;
    }

    private _getSeq() {
        let seq = this._result.Index ? this._result.Index : 0;
        let effectId = this._getEffectId();
        let effectMaxSeq = EffectConst.getSkillInfoMaxSeq(effectId, ANIMATION_GROUP.SOURCE);
        return effectMaxSeq > 0 ? seq : effectMaxSeq;
    }

    private _getEffectSeq(): number {
        return this._result.Index ? this._result.Index : 0;
    }

    private _needPlayEffect(): boolean {
        if(gamesvr.ResultType.RTHPResult == this._result.ResultType) {
            if(this._result.HPResult) {
                if(this._result.HPResult.HPDetail && this._result.HPResult.HPDetail.Vampire) {
                    return false;
                }
                return true;
            }
        }
        return false;
    }

    private _getSkillTemplate(): RoleSkillInfo {
        let itemId = this._getItemId();
        let itemType = this._getItemType(itemId);
        if(EFFECT_TYPE.HALO == itemType) {
            return skillDisplayManager.getLoopEffectSkill(itemId);
        } else if(EFFECT_TYPE.BUFF == itemType) {
            if(this._result.ResultType == gamesvr.ResultType.RTHPResult) {
                return skillDisplayManager.getBuffHitEffectSkill(itemId);
            } else if(this._result.ResultType == gamesvr.ResultType.RTBuffLightResult) {
                return skillDisplayManager.getBuffEffectSkill(itemId);
            } else if(this._result.ResultType == gamesvr.ResultType.RTBuffResult) {
                return skillDisplayManager.getBuffTemplateSkill(itemId);
            } else if(this._result.ResultType == gamesvr.ResultType.RTTeamBuffLightResult) {
                return skillDisplayManager.getBuffEffectSkill(itemId);
            }
        } else if(EFFECT_TYPE.SKILL == itemType) {
            let section: number = this._getSection();
            let effectId = 0;
            if(section > 0) {
                effectId = EffectConst.getSkillEffectId(itemId, section);
            } else {
                effectId = EffectConst.getSkillEffectId(itemId);
            }
            return skillDisplayManager.getSkill(effectId);
        } else {
            let effectId = 0;
            if(this._result.ResultType == gamesvr.ResultType.RTRoleReviveResult) {
                effectId = ROLE_REBORN_ID;
            }
            return skillDisplayManager.getSkill(effectId);
        }
        return skillDisplayManager.getSkill(itemId);
    }

    private _getEffectId(): number {
        let source = this._getSource();
        let section = this._getSection();
        return battleUtils.getEffectId(this._result, { source: source, section: section });
    }

    private _getSection() {
        return this._result.Display || 0;
    }

    private _getStartMoveType(effectId: number) {
        let roleMoveType: string = ROLE_MOVE_TYPE.NONE; 
        let displayData = skillDisplayManager.getSkill(effectId);
        if(displayData) {
            let startMoveMent: EffectMoveInfo = null;
            for(let i = 0; i < displayData.effectList.length; ++i) {
                let effectInfo = displayData.effectList[i];
                if(effectInfo && ((effectInfo.tag && (effectInfo.tag & ANIMATION_GROUP.SOURCE) == 0) || (effectInfo.seq || 0) > 0)) {
                    continue;
                }
                if(effectInfo.roleMove) {
                    if(!startMoveMent) {
                        startMoveMent = effectInfo.roleMove;
                    } else {
                        if((startMoveMent.delay || 0) > (effectInfo.roleMove.delay || 0)) {
                            startMoveMent = effectInfo.roleMove;
                        }
                    }
                }
            }
            if(startMoveMent) {
                roleMoveType = startMoveMent.type;
            }
        }
        return roleMoveType;
    }

    private _getExtraHoleTime (res: ItemResultData[]) {
        let holeTime = 0;
        res.forEach( _res => {
            if(_res.ItemResults.length) {
                _res.ItemResults.forEach( _effect => {
                    if (_effect.HPResult && _effect.HPResult.HPDetail && _effect.HPResult.HPDetail.Protect) {
                        let targetItem = this._getItemRoleByUid(_effect.HPResult.HPDetail.TargetUID)
                        if (targetItem) {
                            let isLeft = targetItem.role.roleType == ROLE_TYPE.HERO;
                            let handler = isLeft? this._game.heroCtrl:this._game.monsterCtrl;
                            if (!handler.checkSubstitueFinish(_effect.HPResult.HPDetail.Protect, _effect.HPResult.HPDetail.TargetUID)) {
                                holeTime += SUBSTITU_MOVE_TIME
                            }
                        }
                        
                    }
                })
            }
        })
        this._extraHoldTime = holeTime
    }

    private _updataSkillInfo (res: ItemResultData[]) {
        let currSkillLight: gamesvr.ISkillLightResult = null;
        let hasHpRes = false;
        res.forEach( _res => {
            if(_res.ItemResults.length) {
                _res.ItemResults.forEach( _effect => {
                    if (_effect.HPResult && _effect.ItemID && currSkillLight 
                        && _effect.ItemID == currSkillLight.SkillID 
                        && _effect.From == currSkillLight.RoleUID) {
                        hasHpRes = true
                    }
                    if (_effect.SkillLightResult) {
                        currSkillLight = _effect.SkillLightResult
                    }
                })
            }
        })

        // 没有血量变化的大招，施法者的效果放到skillLight去处理
        // 有血量变化的大招，放到hpRes去处理（涉及到位移。之前是这样，改不动了）
        if (!hasHpRes) {
            this._skillWithoutHpRes = true;
        }
    }

}