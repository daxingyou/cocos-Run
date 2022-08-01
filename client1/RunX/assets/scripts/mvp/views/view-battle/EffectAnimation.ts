import { BACK_ATTACK_ID, BTResult, BUFF_TYPE, DOUBLE_ATTACK_ID, EFFECT_TYPE, NORMAL_ATTACK_TIME, PURSUE_ATTACK_ID, ROLE_REBORN_ID, ROLE_TYPE, SPUTTER_ATTACK_ID } from "../../../app/BattleConst";
import { battleUtils } from "../../../app/BattleUtils";
import { configUtils } from "../../../app/ConfigUtils";
import { configManager } from "../../../common/ConfigManager";
import { logger } from "../../../common/log/Logger";
import {scheduleManager} from "../../../common/ScheduleManager";
import { cfg } from "../../../config/config";
import { gamesvr } from "../../../network/lib/protocol";
import { battleUIData } from "../../models/BattleUIData";
import skillDisplayManager from "../view-actor/SkillDisplayManager";
import { TARGET_EFFECT, SKILL_EVENT, EffectConst, ANIMATION_GROUP, SkillActorInfo, RoleSkillInfo } from "../view-actor/SkillUtils";
import ItemRole from "../view-item/ItemRole";
import { buffAnimHelper, BUFF_ANIMATION_TYPE } from "../view-role/BuffAnimationHelper";
import { hpAnimationHelper } from "../view-role/HpAnimationHerlper";
import BattleScene from "../view-scene/BattleScene";
import { ActionNode } from "./ActionChain";
import { getItemEffectOption } from "./EffectAnimationOption";

const NOLABEL_BUFF: number[] = []; // 不显示获得buff的id
export const ANIM_TIMER_TAG = "EFFECT_ANIMATION"
/** * 
 * buff可能存在减少层数并消失，在数据层中可能已经没有buff了，这里取已经消失的buff会取不到数据
 */
class EffectAnimation {
    private _result: BTResult = null;
    private _game: BattleScene = null;
    private _userUID: number = -1;

    constructor(game: BattleScene, effRes: BTResult, userUID: number) {
        this._game = game;
        this._result = effRes;
        this._userUID = userUID;
    }

    /**
     * @desc 根据每个effectRes播放效果
     */
    play(): number {
        if (this._result == null) {
            // logger.error('EffectAnimation', `result info is null`);
            return 0;
        }

        let duration: number = 0;
        switch (this._result.ResultType) {
            case gamesvr.ResultType.RTHPResult:{
                duration = this._playHPResultInfo();
                break;
            }
            case gamesvr.ResultType.RTBuffResult:
                duration = Math.max(this._playBuffInfo(), duration);
                break;
            case gamesvr.ResultType.RTHaloResult:
                if (this._needPlaySkill()) {
                    duration = this._playItemInfo();
                }
                duration = Math.max(this._playHaloInfo(), duration);
                break;
            case gamesvr.ResultType.RTRoleDeadResult:
                duration = Math.max(this._updateHaloWhenDead(), duration);
                break;
            case gamesvr.ResultType.RTRoleReviveResult:
                duration = this._playRoleReborn();
                break;
            case gamesvr.ResultType.RTTeamBuffResult:
                break;
            case gamesvr.ResultType.RTRoleTimerResult:
                this._updateTimer();
                break;
            default:
                break;
        }

        return duration;
    }

    private _getItemRoleByUID(roleUID: number): ItemRole {
        if (roleUID) {
            if (this._game.heroCtrl.getRoleNode(roleUID)) {
                return this._game.heroCtrl.getRoleNode(roleUID).getComponent(ItemRole);
            } else if (this._game.monsterCtrl.getRoleNode(roleUID)) {
                return this._game.monsterCtrl.getRoleNode(roleUID).getComponent(ItemRole);
            }
        }
        return null;
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
            case gamesvr.ResultType.RTBuffResult: roleUID = this._result.BuffResult.RoleUID; break;
            case gamesvr.ResultType.RTBuffLightResult: roleUID = this._result.BuffLightResult.RoleUID; break;
            case gamesvr.ResultType.RTHaloResult: roleUID = this._result.HaloResult.RoleUID; break;
            default:
                break;
        }
        return this._getItemRoleByUID(roleUID);
    }

    private _getSource(): ItemRole {
        let roleUID: number;
        switch (this._result.ResultType) {
            case gamesvr.ResultType.RTHPResult: {
                // 回血
                if(this._result.HPResult.Delta > 0) {
                    let target: ItemRole = null;
                    let from = this._result.From;
                    let uiRole = battleUIData.getRoleByBuffUid(from);
                    if(uiRole) {
                        // 上一层是buff触发的buff效果 from是buffUid
                        target = this._getItemRoleByUID(uiRole.uid);
                    } else {
                        // 上一层是技能触发的buff效果 from是skill技能施法者的uid
                        target = this._getItemRoleByUID(from);
                    }
                    return target;
                } else {
                    // 加护盾
                    roleUID = this._result.HPResult.HPDetail.RoleUID || this._result.HPResult.RoleUID;
                }
            }
            break;
            case gamesvr.ResultType.RTBuffResult: {
                let from = this._result.From;
                let itemType = this._getItemType();
                if(EFFECT_TYPE.BUFF == itemType) {
                    let buffUid = this._result.BuffResult.BuffUID;
                    let uiRole = battleUIData.getRoleByBuffUid(buffUid);
                    if(uiRole) {
                        roleUID = uiRole.uid;
                    }
                } else if(EFFECT_TYPE.SKILL == itemType) {
                    roleUID = from
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
            case gamesvr.ResultType.RTHaloResult: roleUID = this._result.HaloResult.RoleUID; break;
            case gamesvr.ResultType.RTRoleReviveResult: roleUID = this._result.RoleReviveResult.RoleUID; break;
            default:
                break;
        }
        return this._getItemRoleByUID(roleUID);
    }

    private _getHaloTargets(haloUId: number, ownerUId: number) {
        let haloTargets: ItemRole[] = [];
        let roles = battleUIData.getTeamByRoleUid(ownerUId).roles;
        if (roles && roles.length) {
            for (let i = 0; i < roles.length; i++) {
                if (roles[i].uid == ownerUId) 
                    continue;

                let halos = roles[i].haloList;
                for (let j = 0; j < halos.length; j++) {
                    if (halos[j] && halos[j].UID == haloUId) {
                        let item = this._getItemRoleByUID(roles[i].uid);
                        item && haloTargets.push(item);
                        break;
                    }
                }
            }
        }
        return haloTargets;
    }

    /**
     * 处理HPResult
     * @returns 
     */
    private _playHPResultInfo(): number {
        let duration: number = 0;
        let root = this._actionRoot();
        if(!this._result.HPResult) {
            return duration;
        }
        // 攻击吸血
        if(this._result.HPResult.HPDetail && this._result.HPResult.HPDetail.Vampire) {
            root
            .appendIf(
                this._actionUpdateHp(true), this._result.HPResult
            )
            .exec();
            return duration;
        }

        if(this._result.HPResult.Delta > 0 || this._result.HPResult.DeltaShield > 0) {
            // 加血    一般来说这都是buff触发吧
            let itemId = this._getItemId();
            let timeInfo = { time: 0 };
            if(itemId > 0) {
                if (this._needPlaySkill()) {
                    root
                    .append(
                        this._actionPlayAddHp(itemId, timeInfo)
                        .onIf(
                            SKILL_EVENT.HIT_TARGET + "0", this._actionUpdateHp(true), this._result.HPResult
                        )
                    )
                    .appendIf(
                        this._actionUpdateHp(true), this._result.HPResult.DeltaShield
                    )
                    .exec();
                } else {
                    root
                    .appendIf(
                        this._actionUpdateHp(false), this._result.HPResult
                    )
                    .exec();
                }
            } else {
                root
                .appendIf(this._actionUpdateHp(true), this._result.HPResult)
                .exec();
            }
            return timeInfo.time;
        } else {
            // 其他扣血的了
            if (this._needPlaySkill()) {
                duration += this._playItemInfo();
            } else {
                duration += this._playNormalAttack();
            }
        }
        return duration;
    }

    private _playRoleReborn(): number {
        let timeInfo = { time: 0 };
        
        let root = this._actionRoot();
        root
        // 重生没有hpRes，所以不用更新
        // .append(this._actionUpdateHp(true))
        .append(
            this._actionPlayReborn(timeInfo, this._result.HPResult)
        )
        .exec();
        return timeInfo.time;
    }

    /**
     * 现在平A几乎都是有特效的了 以后应该不会走这了吧（被打方的效果）
     * @returns 
     */
    private _playNormalAttack(): number {
        const root = this._actionRoot();
        // TODO 现在默认平A只有一段 应该不会这么变态把 如果有到时候在改
        let willDie = false;
        if (this._result.HPResult) {
            this._addRoleReadList();
            willDie = !this._result.HPResult.HP && this._result.HPResult.Delta < 0;
        }

        let itemId = this._getItemId();
        let target = this._getTarget();
        let delayTime: number = 0;
        if(this._result.HPResult.HPDetail.Protect) {
            // 触发了坦攻
            delayTime = this._playSubstitu();
        }

        scheduleManager.scheduleOnce(() => {
            const skillInfo = skillDisplayManager.getSkill(itemId);
            if (!skillInfo) {
                scheduleManager.scheduleOnce(() => {
                    root
                        .appendIf(this._actionTakeAttack(), this._result.HPResult && this._result.HPResult.HPDetail)
                        .appendIf(this._actionUpdateHp(), this._result.HPResult)
                        .appendIf(this._actionPlayDeadAni(battleUIData.playDeadList), willDie)
                        .exec();
                }, NORMAL_ATTACK_TIME / 2, ANIM_TIMER_TAG);
            } else {
                if (target == null) {
                    // logger.warn('EffectAnimation', `target is invalid`);
                    return;
                }
                let attackSeparate = [this._result.HPResult.HPDetail.Attack];
                root
                .append(
                    this._actionPlaySkill(itemId, target, 0, attackSeparate)
                    .onIf(SKILL_EVENT.HIT_TARGET + "0",
                        this._actionTakeAttack(true, attackSeparate[0])
                        .appendIf(this._actionUpdateHp(true), this._result.HPResult), this._result.HPResult)
                        .appendIf(this._actionPlayDeadAni(battleUIData.playDeadList), willDie)
                )
                .exec();
            }
        }, delayTime, ANIM_TIMER_TAG);
        return this._getTime() + delayTime;
    }

    private _needPlayAddHp(itemId: number) {
        let skillTemplate = skillDisplayManager.getSkill(itemId);
        if(skillTemplate) {
            return skillTemplate.targetEffect == TARGET_EFFECT.STATE;
        }
        skillTemplate = skillDisplayManager.getBuffEffectSkill(itemId);
        if(skillTemplate) {
            return skillTemplate.targetEffect == TARGET_EFFECT.STATE;
        }
        return false;
    }

    /**
     * 是否允许播buff激活特效 
     * @TODO 等到时候三个字段了 触发buff跟触发造成伤害分开了 这个就是要区分了
     * @param itemId 
     * @returns 
     */
    private _needPlayActivityBuff(itemId: number) {
        let skillTemplate = skillDisplayManager.getBuffEffectSkill(itemId);
        if(skillTemplate) {
            return true;
        }
        return false;
    }

    private _needPlaySkill(): boolean {
        // const itemId = this._getItemId();
        // let section = this._getSection();
        // let target = this._getTarget();
        const effectId = this._getEffectId();
        if(effectId > 0) {
            let skillInfo = skillDisplayManager.getSkill(effectId);
            return !!skillInfo;
        }
        return false;
    }

    private _getSection() {
        return this._result.Display || 0;
    }

    private _getItemType() {
        let itemId = this._getItemId();
        return battleUtils.getItemType(itemId);
    }

    /**
     * 获得itemId
     * @returns 
     */
    private _getItemId(): number {
        return battleUtils.getItemId(this._result);
    }

    /**
     * 播放特效动作
     * @returns 
     */
    private _playItemInfo(): number {
        let target = this._getTarget();
        if (target == null) {
            // logger.warn('EffectAnimation', `target is invalid`);
            return 0;
        }

        let root = this._actionRoot();
        let itemId = this._getItemId();
        let delayTime: number = 0;
        let duration: number = 0;
        // 伤害技能触发
        // 过滤掉BUff触发的扣血
        if(this._result.HPResult) {
            // 添加到待死亡列表中
            this._addRoleReadList();
            let isCanPlayDead = this._checkCanPlayRoleDeadAni();
            let isNeedPlayDeadAni = this._checkNeedPlayDeadAni();
            let itemType = battleUtils.getItemType(itemId);
            let seq = this._getSeq();
            if(itemType == EFFECT_TYPE.BUFF) {
                let resultTime = { time: 0 };
                root
                    .append(
                        this._actionHPResultByBuff(itemId, resultTime)
                        .appendIf(this._actionPlayDeadAni(battleUIData.playDeadList), isCanPlayDead && isNeedPlayDeadAni)
                        .onIf(SKILL_EVENT.HIT_TARGET + seq + "",
                                this._actionTakeAttack(isCanPlayDead && isNeedPlayDeadAni)
                                    .appendIf(this._actionUpdateHp(true), this._result.HPResult),
                                this._result.HPResult
                            )
                    )
                .exec();
                duration += resultTime.time;
            } else {
                if(this._result.HPResult.HPDetail.Protect) {
                    // 触发了坦攻 加上坦攻的移动时间
                    delayTime += this._playSubstitu();
                }
                let seq = this._getSeq();
                let source = this._getSource();
                let effectId = this._getEffectId();
                // 正好伤害
                duration +=  this._getSkillTime(effectId, ANIMATION_GROUP.TARGET, {
                    source: source,
                    target: target
                }, seq);
                // 如果触发了坦攻 需要延迟攻击的表现 当然也要算上坦攻移动的延迟时间
                scheduleManager.scheduleOnce(() => {
                    root.append(
                            this._actionPlaySkill(itemId, target, seq)
                            .appendIf(
                                this._actionPlayDeadAni(battleUIData.playDeadList), isCanPlayDead && isNeedPlayDeadAni
                            )
                            .onIf(SKILL_EVENT.HIT_TARGET + seq,
                                this._actionTakeAttack(isCanPlayDead && isNeedPlayDeadAni, this._result.HPResult.HPDetail.Attack)
                                .appendIf(this._actionUpdateHp(true), this._result.HPResult),
                                this._result.HPResult
                            )
                        )
                    .exec();
                }, delayTime, ANIM_TIMER_TAG);
            }
        }
        return duration + delayTime;
    }
    /**
     * 光环之类的没有怎么改动
     * @returns 
     */
    private _playHaloInfo(): number {
        const haloId = this._result.HaloResult.HaloID;
        const isHaloValid = this._checkHaloValid(haloId);
        if (!isHaloValid) {
            logger.error('EffectAnimation', `halo is invalid. halo = ${haloId}`);
            return 0;
        }

        if (this._getTarget() == null) {
            logger.warn('EffectAnimation', `target is invalid. halo = ${haloId}`);
            return 0;
        }

        let root = this._actionRoot();
        let target = this._getTarget();
        // 查找光环范围内的目标
        let haloTargets = this._getHaloTargets(this._result.HaloResult.HaloUID, target.role.uid);
        let result = { time: 0 };
        if (haloId > 0) {
            root.appendIf(
                    this._actionPlayGetHaloAnimation(this._result.HaloResult, target, haloTargets, result),
                    this._targetHaloffect() || this._targetLoopHalo(haloTargets)
                )
                .exec();
            return result.time;
        } else {
            // 现在不会有移除光环的效果，光环的效果要移除或者屏蔽放到角色死亡了，
            // root.appendIf(
            //     this._actionUpdateHaloList(this._result.HaloResult, target, haloTargets),
            //     haloId
            // )
            // .exec();
            // return 0.2;
        }
        return 0;
    }

    private _updateHaloWhenDead() {
        let roleId = 0;
        if (this._result.RoleDeadResult) roleId = this._result.RoleDeadResult.RoleUID;

        if (!roleId) return 0;

        let roleItem = this._getItemRoleByUID(roleId);
        let haloList = roleItem.role.haloList;
        let root = this._actionRoot();
        for (let i = 0; i < haloList.length; i++) {
            let _h = haloList[i];
            let haloTargets = this._getHaloTargets(_h.UID, roleItem.role.uid);
            root.appendIf(
                this._actionUpdateHaloList({
                    HaloID: _h.ID,
                    RoleUID: roleItem.role.uid,
                    HaloUID: _h.UID,
                    isAdd: false,
                }, roleItem, haloTargets),
                _h.ID
            )
            .exec();
        }
        root.exec();
        return 0.25;

    }
    /**
     * 播放buff特效
     * @returns 
     */
    private _playBuffInfo(): number {
        const buffId = this._getItemId();
        const isBuffValid = this._checkBuffValid(buffId);
        if (!isBuffValid) {
            // logger.error('EffectAnimation', `buff is invalid. buffId = ${buffId}`);
            return 0;
        }

        let target = this._getTarget();
        if (target == null) {
            // logger.warn('EffectAnimation', `target is invalid.`);
            return 0;
        }

        let root = this._actionRoot();
        if(this._result.BuffResult) {
            if (this._result.BuffResult.Delta > 0) {
                // 加BUFF
                // 为了深拷贝 返回特效时间
                let result = { time: 0 };
                root
                    .appendIf(
                        this._actionPlayBuffSkill(this._result.BuffResult.BuffID, result),
                        this._targetBuffEffect() || this._targetLoopBuff()
                    )
                    .appendIf(
                        this._actionUpdateBuffList(this._result.BuffResult, target),
                        buffId
                    )
                    .exec();
                return result.time;
            } else {
                // buff抵抗
                if(this._result.BuffResult.Resist) {
                    root
                    .append(
                        this._actionBuffResist()
                    )
                    .exec();
                    return 0;
                }

                if(target) {
                    target.reduceBuffResult(this._result.BuffResult);
                }
                root.appendIf(
                    this._actionUpdateBuffList(this._result.BuffResult, target),
                    buffId
                )
                .exec();
                return 0;
            }
        }
        return 0;
    }

    /**
     * buff触发的血量变化
     * @param itemId 
     * @param result 
     * @returns 
     */
    private _actionHPResultByBuff(itemId: number, result: any) {
        return new ActionNode(
            '_actionHPResultByBuff',
            ({ onComplete, onEvent, onError }) => {
                try {
                    let effectId = this._getEffectId();
                    if(effectId > 0) {
                        let source = this._getSource();
                        let target = this._getTarget();
                        let isRoleDie = this._result && this._result.HPResult && this._result.HPResult.HP <= 0 ? true : false;
                        let seq = this._getSeq();
                        target.playSkillEffect(effectId, ANIMATION_GROUP.TARGET, {
                            onComplete: () => { onComplete(); },
                            onSkillEvent: (eventInfo) => { onEvent(eventInfo.type); },
                            onAnimationStart: () => {
                                if (isRoleDie) target.playDeadAnim();
                            },
                            source: source,
                            target: target,
                            leftSide: target.role.roleType == ROLE_TYPE.HERO
                        }, { seq : seq});

                        // 计算时间 计算buff触发的来源
                        result.time += this._getSkillTime(effectId, ANIMATION_GROUP.TARGET, {
                            source: source,
                            target: target
                        }, seq);
                    }
                }
                catch(err) {
                    if(onError) {
                        onError(err);
                    }
                    onComplete();
                }
            }
        )
    }

    private _updateTimer() {
        const timerResult = this._result.RoleTimerResult;
        if(timerResult.RolePosition) {
            let itemTimer = this._game.timerCtrl.getItemByRoleId(timerResult.RoleUID);
            if(itemTimer)
                itemTimer.uiDistance = timerResult.RolePosition;
        }
    }

    private _targetLoopBuff (): boolean {
        if (this._result.BuffResult && this._result.BuffResult.Delta == this._result.BuffResult.Count
            && this._result.BuffResult.Delta != 0) {
            let buffCfg = configUtils.getBuffConfig(this._result.BuffResult.BuffID);
            let target = this._getItemRoleByUID(this._result.BuffResult.RoleUID);
            if (buffCfg && buffCfg.LoopTemplateID && target)
                return true;
        }
        return false;
    }

    private _targetLoopHalo (roles: ItemRole[]): boolean {
        if (!roles || roles.length <= 0) {
            return false
        }

        if (this._result.HaloResult && this._result.HaloResult.isAdd) {
            let cfg = configUtils.getHaloConfig(this._result.HaloResult.HaloID);
            if (cfg && cfg.LoopTemplateId)
                return true;
        }
        return false;
    }

    /**
     * 是否播放被添加者的buff移除特效
     * @returns 
     */
    private _targetRemoveBuff(): boolean {
        if (this._result.BuffResult && this._result.BuffResult.Delta != 0) {
            if (this._result.BuffResult.Count == 0) {
                return true;
            }
        }
        return false;
    }

    /**
     * 是否播放被添加者的buff添加特效
     * @returns 
     */
    private _targetBuffEffect(): boolean {
        if (this._result.BuffResult && this._result.BuffResult.Delta > 0) {
            let buffCfg = configUtils.getBuffConfig(this._result.BuffResult.BuffID);
            if (buffCfg && buffCfg.TemplateID) {
                let skillTemplate = skillDisplayManager.getSkill(buffCfg.TemplateID);
                if(skillTemplate) {
                    return skillTemplate.targetEffect == TARGET_EFFECT.STATE;
                }
            }
        }
        return false;
    }

    /**
     * 是否播放施加光环者添加特效
     * @returns 
     */
    private _targetHaloffect(): boolean {
        if (this._result.HaloResult && this._result.HaloResult.isAdd && this._result.HaloResult.HaloID) {
            let cfg = configUtils.getHaloConfig(this._result.HaloResult.HaloID);
            if (cfg && cfg.TemplateID) {
                let skillTemplate = skillDisplayManager.getSkill(cfg.TemplateID);
                if(skillTemplate) {
                    return skillTemplate.targetEffect == TARGET_EFFECT.STATE;
                }
            }
        }
        return false;
    }

    /**
     * @TODO 现在这个几乎没用 因为Source跟Target同一都在这里播特效了 需要补充
     * 获得AnimationGroup
     */
    private get animationGroup(): ANIMATION_GROUP {
        // 如果是躲闪，或者其他导致没有扣血的话，不会播受击动作
        // 如果是探伤，坦攻之类的，后续继续处理
        if (!this._result.HPResult) {
            return ANIMATION_GROUP.TARGET_RESIST;
        } else {
            return ANIMATION_GROUP.TARGET;
        }
    }

    private _getEffectDuration(itemId: number): number {
        const skillInfo = skillDisplayManager.getSkill(itemId);
        if (!skillInfo) {
            return 0;
        }

        let ret = -1;
        const group = this.animationGroup;
        if (skillInfo.arrGroupInfo && skillInfo.arrGroupInfo.length > 0) {
            skillInfo.arrGroupInfo.some(info => {
                //@ts-ignore
                const gp = ANIMATION_GROUP[info.group];
                if (gp === group) {
                    ret = info.duration;
                    return true;
                }
                return false;
            });
        }

        if (ret >= 0) {
            // 防止配置的一样导致先后不统一
            ret += 0.01;
            const arrEvent = skillInfo.arrEvent;
            if (arrEvent && arrEvent.length > 0) {
                let maxTime = 0;
                arrEvent.forEach(ev => {
                    maxTime = Math.max(ev.time + 0.1, maxTime);
                });

                ret = Math.max(ret, maxTime);
            }
        }

        return ret >= 0 ? ret : EffectConst.calculateTime(skillInfo).end;
    }

    /**
     * 播放坦攻动作
     * @returns 
     */
    private _playSubstitu(): number {
        let preTarget = this._getItemRoleByUID(this._result.HPResult.HPDetail.TargetUID);
        let roleAct = preTarget.role.roleType == ROLE_TYPE.HERO ? this._game.heroCtrl : this._game.monsterCtrl;
        return roleAct.processRoleSubstitution(this._result.HPResult.HPDetail.Protect, this._result.HPResult.HPDetail.TargetUID);
    }

    private _registerAnimation(name: string) {
        this._game.btStateCtrl.currStat().registerAnimation(name);
    }

    private _releaseAnimation(name: string) {
        let currState = this._game.btStateCtrl.currStat();
        currState && currState.releaseAnimation(name);
    }

    private _checkBuffValid(buffId: number): boolean {
        return configManager.getConfigByKey('buff', buffId) ? true : false;
    }

    private _checkHaloValid(haloId: number): boolean {
        return configManager.getConfigByKey('halo', haloId) ? true : false;
    }

    /**
     * @desc 播放技能；根据指定的id播放技能配置的效果
     *
     * @private
     * @param {number} itemId
     * @returns {ActionNode}
     * @memberof EffectAnimation
     */
    private _actionPlaySkill(itemId: number, target: ItemRole, seq: number = 0, saperate: number[] = []): ActionNode {
        return new ActionNode(
            '_actionPlaySkill',
            ({ onComplete, onEvent, onError }) => {
                let effectId = this._getEffectId();
                if (effectId > 0) {
                    try {
                        const selfTeam = battleUIData.getSelfTeam();
                        const source = this._getSource();
                        let leftSide = false;
                        if (selfTeam.getRoleByUid(target.role.uid)) {
                            leftSide = true;
                        }
                        target.playSkillEffect(effectId, ANIMATION_GROUP.TARGET, {
                            // playDeathAnim: isRoleDie,
                            onComplete: () => { 
                                onComplete(); 
                            },
                            onSkillEvent: (eventInfo) => { onEvent(eventInfo.type); },
                            // onAnimationStart: () => {
                            //     if (isRoleDie) target.playDeadAnim();
                            // },
                            source: source,
                            target: target,
                            leftSide: leftSide,
                        }, {
                            seq: seq,
                            total: saperate
                        });
                    } catch (error) {
                        onError(error);
                        onComplete();
                    }
                } else {
                    onComplete();
                }
            }
        );
    }

    /**
     * 加血ActionNode
     * @param effectId 
     * @param timeInfo 
     * @returns 
     */
    private _actionPlayAddHp(itemId: number, timeInfo: any) {
        return new ActionNode(
            '_actionPlayAddHp',
            ({ onComplete, onEvent, onError  }) => {
                let effectId = this._getEffectId();
                if(effectId > 0) {
                    let source = this._getSource();
                    let target = this._getTarget();
                    let seq = this._getSeq();
                    target.playSkillEffect(effectId, ANIMATION_GROUP.TARGET, {
                        // 播放被加血者动画
                        source: source,
                        target: target,
                        leftSide: target.role.roleType == ROLE_TYPE.HERO,
                        onComplete: () => { onComplete(); },
                        onSkillEvent: (eventInfo) => { onEvent(eventInfo.type); },
                    }, {
                        seq: seq
                    });
                    // TODO 加血需要返回时间吗？ 需要的话需要计算时间 补充：如果是大招加的血 需要计算时间
                    // TODO 这里不需要播放加血来源者的动作的 如果到时候需要 需要播放source的动作特效 并移去EffectAnimCtrl
                    if(this._checkNeedCalculateTime(effectId)) {
                        timeInfo.time += this._getSkillTime(effectId, ANIMATION_GROUP.TARGET, {
                            source: source,
                            target: target
                        });
                    }
                }
            }
        )
    }

    /**
     * 通用复活的ActionNode
     * @param timeInfo 
     * @param hpResult 
     * @returns 
     */
    private _actionPlayReborn(timeInfo: any, hpResult: gamesvr.IHPResult) {
        return new ActionNode(
            '_actionPlayReborn',
            ({ onComplete, onEvent, onError  }) => {
                // TODO 有待商榷 现在是
                let source = this._getSource();
                if(source) {
                    let animTime = source.playRebornAnim(hpResult);
                    let effectTime = this._getSkillTime(ROLE_REBORN_ID, ANIMATION_GROUP.SOURCE);
                    let seq = this._getSeq();
                    scheduleManager.scheduleOnce(() => {
                        // 播放施法者动画
                        let effectId = this._getEffectId();
                        if(effectId > 0) {
                            source.playSkillEffect(effectId, ANIMATION_GROUP.SOURCE, {
                                source: source,
                                target: source,
                                leftSide: source.role.roleType == ROLE_TYPE.HERO,
                                onComplete: ()=> {
                                    let ctrlComp = source.role.roleType == ROLE_TYPE.HERO? this._game.heroCtrl:this._game.monsterCtrl;
                                    ctrlComp.onRoleMoveBack(source)
                                }
                            }, {
                                seq: seq
                            });
                        }
                    }, animTime, ANIM_TIMER_TAG);
                    timeInfo.time += animTime + effectTime;
                }
            }
        )
    }

    /**
     * @description 获得光环的时候的效果
     * @private
     * @returns {ActionNode}
     * @memberof EffectAnimation
     */
    private _actionPlayGetHaloAnimation(haloRes: gamesvr.IHaloResult, target: ItemRole, rangeRoles: ItemRole[], result: any = {}): ActionNode {
        return new ActionNode(
            '_actionPlayGetHaloAnimation',
            ({ onComplete, onEvent, onError }) => {
                const cfg = configUtils.getHaloConfig(haloRes.HaloID);
                
                let completeHandler = () => {
                    if (this._targetLoopHalo(rangeRoles)) {
                        this._addLoopGfxHalo(rangeRoles)
                    }
                }

                if (cfg && cfg.TemplateID) {
                    let effectId = cfg.TemplateID;
                    let leftSide = target.role.roleType == ROLE_TYPE.HERO;
                    // 如果有添加动作 就需要播添加动作
                    if (target) {
                        target.playBuffSkillEffect(effectId, ANIMATION_GROUP.SOURCE, {
                            source: target,//这里就是target
                            target: target,
                            leftSide: leftSide,
                            onComplete: ()=> {
                                completeHandler();
                                onComplete();
                            }
                        })
                    }

                    let haloTime = this._getSkillTime(effectId, ANIMATION_GROUP.TARGET, {
                        source: target,
                        target: target,
                        leftSide: leftSide
                    });

                    if (rangeRoles && rangeRoles.length > 0) {
                        rangeRoles.forEach( _r => {
                            let _leftSide = _r.role.roleType == ROLE_TYPE.HERO;
                            _r.playBuffSkillEffect(effectId, ANIMATION_GROUP.TARGET, {
                                source: target,
                                target: _r,
                                leftSide: _leftSide
                            })
                        })
                    }
                    result && (result.time += haloTime)
                } else {
                    completeHandler();
                    onComplete();
                }
            }
        );
    }

    /**
  * @desc 简单的更新HaloListCtrl
  *
  * @private
  * @param {BuffResult} [buffInfo]
  * @returns {ActionNode}
  * @memberof EffectAnimation
  */
    private _actionUpdateHaloList(haloRes: gamesvr.IHaloResult, target: ItemRole, haloTargets: ItemRole[]): ActionNode {
        return new ActionNode(
            '_actionUpdateHaloList',
            ({ onComplete, onEvent, onError }) => {
                haloTargets.forEach(_r => {
                    if (_r && cc.isValid(_r.node)) {
                        _r.updateHaloByRes(haloRes);
                    }
                })
                onComplete();
            }
        );
    }

    /**
     * 添加buff特效
     * @param buffId 
     * @param result 为了保存动作时间
     * @returns 
     */
    private _actionPlayBuffSkill(buffId: number, result: any = {}) {
        return new ActionNode(
            '_actionPlayBuffSkill',
            ({ onComplete, onEvent, onError }) => {
                let buffCfg = configUtils.getBuffConfig(buffId);
                if(!buffCfg) {
                    onComplete();
                    return;
                }
                // 如果有施法动作的话，那么buff常驻效果放到施法动作后面（_actionPlayBuffSkill里面）
                // 否则直接添加常驻效果
                let completeHandler = ()=> {
                    if (this._targetLoopBuff()) {
                        this._addLoofGfx();
                    }
                }

                let effectId: number = this._getEffectId();
                if (effectId > 0) {
                    try {
                        let source = this._getSource();
                        let target = this._getTarget();
                        let leftSide = target.role.roleType == ROLE_TYPE.HERO;
                        if(source && source != target) {
                            // 如果有添加动作 就需要播添加动作
                            source.playBuffSkillEffect(effectId, ANIMATION_GROUP.SOURCE, {
                                source: source,
                                target: target,
                                leftSide: source.role.roleType == ROLE_TYPE.HERO
                            })
                        }
                        let buffTime = this._getSkillTime(effectId, ANIMATION_GROUP.TARGET, {
                            source: source,
                            target: target,
                            leftSide: leftSide
                        });

                        // 被添加者动作
                        target.playBuffSkillEffect(effectId, ANIMATION_GROUP.TARGET, {
                            onComplete: () => { 
                                completeHandler();
                                onComplete(); 
                            },
                            onSkillEvent: (eventInfo) => { onEvent(eventInfo.type); },
                            source: source,
                            target: target,
                            leftSide: leftSide,
                        })
                        result && (result.time += buffTime);
                    } catch (error) {
                        onError(error);
                        completeHandler();
                        onComplete();
                    }
                } else {
                    completeHandler();
                    onComplete();
                }
            }
        );
    }

    /**
     * buff触发 ActionNode
     * @param buffId 
     * @param result 
     * @returns 
     */
    private _actionPlayBuffActiveSkill(buffId: number, result: any = {}): ActionNode {
        return new ActionNode(
            '_actionPlayBuffActiveSkill',
            ({ onComplete, onEvent, onError }) => {
                let buffCfg = configUtils.getBuffConfig(buffId);
                if(!buffCfg) {
                    onComplete();
                    return;
                }
                let effectId = this._getEffectId();
                if (effectId > 0) {
                    try {
                        let source = this._getSource();
                        let target = this._getTarget();
                        let leftSide = source.role.roleType == ROLE_TYPE.HERO;
                        let seq = this._getSeq();
                        
                        let buffActiveTime = source.playSkillEffect(effectId, ANIMATION_GROUP.SOURCE, {
                            onComplete: () => { onComplete(); },
                            onSkillEvent: (eventInfo) => { onEvent(eventInfo.type); },
                            source: source,
                            target: target,
                            leftSide: leftSide
                        }, {
                            seq: seq
                        });
                        result && (result.time = buffActiveTime);
                    } catch (error) {
                        onError(error);
                        onComplete();
                    }
                } else {
                    onComplete();
                }
            }
        );
    }
    /**
     * buff抵抗
     * @returns 
     */
    private _actionBuffResist() {
        return new ActionNode(
            '_actionBuffResist',
            ({ onComplete, onEvent, onError }) => {
                let target = this._getTarget();
                if(target) {
                    let str = '抵抗';
                    target.showCustomLabel(str);
                }
            }
        );
    }
    /**
     * @desc 简单的更新BUFFListCtrl；包括Buff冒出来，以及Buff消失等都在这里，这里是更新Buff的最后一步，可以理解为更新UI数据等
     *
     * @private
     * @param {BuffResult} [buffInfo]
     * @returns {ActionNode}
     * @memberof EffectAnimation
     */
    private _actionUpdateBuffList(buffInfo: gamesvr.IBuffResult, target: ItemRole): ActionNode {
        return new ActionNode(
            '_actionUpdateBuffList',
            ({ onComplete, onEvent, onError }) => {
                buffAnimHelper.play({
                    type: BUFF_ANIMATION_TYPE.DUMMY,
                    role: target,
                    buffId: buffInfo.BuffID,
                    buffUID: buffInfo.BuffUID,
                    buffInfo: buffInfo,
                    onFinish: () => {
                        if (target && cc.isValid(target.node)) {
                            target.updateBuffByRes(buffInfo);
                        }
                        onComplete();
                    }
                })
            }
        );
    }

    /**
     * 角色死亡动画
     * @returns 
     */
    private _actionPlayDeadAni(deadListNow: number[]) {
        return new ActionNode(
            '_actionPlayDeadAni',
            ({ onComplete, onEvent, onError }) => {
                // let target = this._getTarget();
                // target.playDeadAnim();
                // onComplete();
                const deadList = deadListNow;// battleUIData.playDeadList
                for(let i = 0; i < deadList.length; ++i) {
                    let uId = deadList[i];
                    let target = this._getItemRoleByUID(uId);
                    if(target) {
                        target.playDeadAnim();
                    }
                }
                battleUIData.clearPlayDeadList();
                // 现在死亡动画是没有占用时间的
                onComplete();
            }
        );
    }
    /**
     * @desc 更新HP；血条的动画以及头顶的伤害数字，是在ItemRole里边调用的【暂时没有飘字】
     *
     * @private
     * @returns {ActionNode}
     * @memberof EffectAnimation
     */
    private _actionUpdateHp (needPlaySkill: boolean = false): ActionNode {
        let actionNode = new ActionNode(
            '_actionUpdateHp',
            ({ onComplete, onEvent, onError }) => {
                let target = this._getTarget();
                let source = this._getSource();

                let hpDetail = this._result.HPResult.HPDetail;

                if(!this._result.HPResult.Delta && hpDetail && !!hpDetail.Vampire) {
                    // 这里是吸血飘字 攻击方回血
                    if(source) {
                        source.showHpFloatLabel(this._result.HPResult, 100, this._result.ItemID);
                    }
                } else {
                    if (target && this._result.HPResult) {
                        target.updateHp(this._result.HPResult);
                        if (this._result.HPResult.Delta < 0) {
                            target.playLoseHpAudio();
                        }
                    }
                    // 如果是特殊类型打出来的伤害 需要播放特殊类型特效
                    if(this._result.ItemID == DOUBLE_ATTACK_ID || BACK_ATTACK_ID == this._result.ItemID 
                        || PURSUE_ATTACK_ID == this._result.ItemID
                        /*|| SPUTTER_ATTACK_ID == this._result.ItemID*/) {
                        // 溅射因为没效果，放到普攻里面去表现
                        // if(SPUTTER_ATTACK_ID == this._result.ItemID) {
                        //     if(target) {
                        //         target.showSpecialAttack(this._result.HPResult, 100, this._result.ItemID);
                        //     }
                        // } else{
                            if(source) {
                                source.showSpecialAttack(this._result.HPResult, 100, this._result.ItemID);
                            }
                        // }
                    } 

                    if(!!this._result.HPResult.Delta && !!this._result.HPResult.DeltaShield) {
                        target.showHpFloatLabel(this._result.HPResult, 100, this._result.ItemID);
                        let shieldValue: number = this._result.HPResult.Shield || 0;
                        target.updateShield(shieldValue);
                    } else if(!!this._result.HPResult.DeltaShield) {
                        let fromBuffUID = this._result.From;
                        let isFromSelf = target.getBuff(fromBuffUID) != null
                        if (!isFromSelf || this._result.HPResult.DeltaShield > 0) {
                            target.showHpFloatLabel(this._result.HPResult, 100, this._result.ItemID);
                        }
                        let shieldValue: number = this._result.HPResult.Shield || 0;
                        // 刷伤害模式，统计己方英雄的输出伤害，如PVE心魔法相
                        target.role.roleType == ROLE_TYPE.MONSTER && this._result.HPResult.DeltaShield < 0 && this._game.uiController.damageCollect.updateDamage(this._result.HPResult.DeltaShield);
                        target.updateShield(shieldValue);
                    } else if(!!this._result.HPResult.Delta) {
                        target.showHpFloatLabel(this._result.HPResult, 100, this._result.ItemID);
                        // 刷伤害模式，统计己方英雄的输出伤害，如PVE心魔法相
                        target.role.roleType == ROLE_TYPE.MONSTER && this._result.HPResult.Delta < 0 && this._game.uiController.damageCollect.updateDamage(this._result.HPResult.Delta);
                    } else if(hpDetail && hpDetail.Miss) {
                        target.showHpFloatLabel(this._result.HPResult, 100, this._result.ItemID);
                    }
                    hpAnimationHelper.onFinish(target.role.uid, 0, actionNode);
                }
                onComplete();
            }
        );
        let target = this._getTarget();
        if (target && this._result.HPResult) {
            let uid = target.role.uid;
            if (hpAnimationHelper.checkActionNode(uid, 0) && !needPlaySkill) {
                hpAnimationHelper.appendActionNode(uid, 0, actionNode);
                return new ActionNode("null", ({ onComplete, onEvent, onError }) => { onComplete(); });
            } else {
                hpAnimationHelper.addActionNode({ uid: uid, action: actionNode, type: 0 });
                return actionNode;
            }
        } else {
            return new ActionNode("null", ({ onComplete, onEvent, onError }) => { onComplete(); });
        }
    }


    /**
     * @desc 通用的受击动作，两种情况会触发 1. 普攻攻击的受击， 2.技能守击，但是没有配置动画模板（理论上不应该不配，没配就找策划PK）
     *
     * @private
     * @returns {ActionNode}
     * @memberof EffectAnimation
     */
    private _actionTakeAttack(needPlaySkill: boolean = false, saperateRate: number = 100): ActionNode {
        let actionNode = new ActionNode(
            '_actionTakeAttack',
            ({ onComplete, onEvent, onError }) => {
                let target = this._getTarget();
                if (target && this._result.HPResult.HPDetail) {
                    let detail = this._result.HPResult.HPDetail

                    if (detail.Attack && !needPlaySkill) {
                        target.playNormalTakeAttack();
                    }

                    if (detail.Miss) {
                        target.playDodge();
                    }
                }
                hpAnimationHelper.onFinish(target.role.uid, 1, actionNode);
                onComplete();
            }
        );

        let target = this._getTarget();
        if (target && this._result.HPResult && this._result.HPResult.HPDetail) {
            let uid = target.role.uid;
            if (hpAnimationHelper.checkActionNode(uid, 1) && !needPlaySkill) {
                hpAnimationHelper.appendActionNode(uid, 1, actionNode);
                return new ActionNode("null", ({ onComplete, onEvent, onError }) => { onComplete(); });
            } else {
                hpAnimationHelper.addActionNode({ uid: uid, action: actionNode, type: 1 });
                return actionNode;
            }
        } else {
            return new ActionNode("null", ({ onComplete, onEvent, onError }) => { onComplete(); });
        }
    }


    /**
     * @desc 创建一个空的root节点
     *
     * @private
     * @returns {ActionNode}
     * @memberof EffectAnimation
     */
    private _actionRoot(): ActionNode {
        return new ActionNode(
            '_actionRoot',
            ({ onComplete, onEvent, onError }) => {
                onComplete();
            }
        )
    }

    private _addLoofGfx () {
        let target = this._getTarget();
        let buffId = this._getItemId();
        let effectId = this._getLoopEffectId();
        let skillTime = this._getSkillTime(effectId, ANIMATION_GROUP.SOURCE, {
            source: target,
            target: target,
            skillId: buffId,
        });

        let isLeftSide = target.role.roleType == ROLE_TYPE.HERO ? true : false;
        let seq = this._getSeq();

        target.playSkillEffect(effectId, ANIMATION_GROUP.TARGET, {
            source: target,
            target: target,
            skillId: buffId,
            leftSide: isLeftSide
        }, {
            seq: seq
        });
        return skillTime
    }

    private _addLoopGfxHalo (itemRole: ItemRole[]) {
        let targets = itemRole;
        let haloId = this._getItemId();
        let effectId = this._getLoopEffectId();
        let skillTime = this._getSkillTime(effectId, ANIMATION_GROUP.SOURCE, {
            source: targets[0],
            target: targets[0],
            skillId: haloId,
        });
        // 加循环buff的时间好像没啥必要，给加几个buff岂不是等好几十秒
        // result.time += skillTime;
        
        let seq = this._getSeq();
        targets.forEach ((target)=> {
            let isLeftSide = target.role.roleType == ROLE_TYPE.HERO ? true : false;
            target.playSkillEffect(effectId, ANIMATION_GROUP.TARGET, {
                source: target,
                target: target,
                skillId: haloId,
                leftSide: isLeftSide
            }, {
                seq: seq
            });
        })
        return skillTime;
    }

    private _isDebuff(cfg: any, countChange: number): boolean {
        countChange = countChange || 0;
        let isDeBuff = false;
        if (cfg.Type === BUFF_TYPE.BAD || (cfg.Type === BUFF_TYPE.NONE && countChange < 0)) {
            isDeBuff = true;
        }

        return isDeBuff;
    }

    private _checkIsSelfTeam(roleUID: number) {
        let selfTeam = battleUIData.getSelfTeam();
        if (selfTeam.getRoleByUid(roleUID)) {
            return true;
        }
        return false;
    }

    /**
     * 包含了真正的普通攻击的时间计算
     * @returns 
     */
    private _getTime(): number {
        let time: number = 0;
        let itemId: number = this._getItemId();
        let source = this._getSource();
        let target = this._getTarget();
        const skillInfo = skillDisplayManager.getSkill(itemId);
        if (!skillInfo) {
            time += NORMAL_ATTACK_TIME;
            if(this._result.HPResult && this._result.HPResult.Delta < 0 && this._result.HPResult.HP == 0) {
                // 死亡
                time += 0.2;
            }
        } else {
            if(source) {
                time += this._getSkillTime(itemId, ANIMATION_GROUP.SOURCE, {
                    source: source, 
                    target: target,
                    leftSide: source.role.roleType == ROLE_TYPE.HERO
                });
            } else {
                if(target) {
                    time += this._getSkillTime(itemId, ANIMATION_GROUP.TARGET, {
                        source: source, 
                        target: target,
                        leftSide: target.role.roleType == ROLE_TYPE.HERO
                    });
                }
            }
        }
        return time;
    }

    private _needPlaySourceAction(): boolean {
        let itemId = this._getItemId();
        if(DOUBLE_ATTACK_ID == itemId || BACK_ATTACK_ID == itemId) {
            return true;
        }
        return false;
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
                    if (gp === group) {
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
        let ret = {
            start: 0,
            end: 0
        };
        ret = EffectConst.filterGroupSeqTime(skillInfo, group, skillInfo.targetEffect, seq);
        // if(seq && seq > 0) {
        // } else {
        //     ret = EffectConst.filterGroupTime(skillInfo, group, skillInfo.targetEffect, seq);
        // }
        return ret.end - ret.start;
    }

    private _getSkillTimeBySeq(itemId: number, group: ANIMATION_GROUP, actorInfo?: SkillActorInfo, seq?: number) {

    }

    /**
     * 这个主要是给因为 buff触发跟buff触发伤害 字段不够用 所以根据state区分的方法
     * @returns 
     */
    private _getEffectId(): number {
        let source = this._getSource();
        let section = this._getSection();
        return battleUtils.getEffectId(this._result, { source: source, section: section });
    }

    private _getLoopEffectId(): number {
        let source = this._getSource();
        let section = this._getSection();
        return battleUtils.getEffectId(this._result, { source: source, section: section, isLoop: true});
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

    private _checkNeedCalculateTime(itemId: number): boolean {
        if(this._result.HPResult) {
            let itemType = this._getItemType();
            let effectId = this._getEffectId();
            if(effectId > 0) {
                let displayConfig = skillDisplayManager.getSkill(effectId);
                if(this._result.HPResult.Delta > 0 && EFFECT_TYPE.SKILL == itemType && displayConfig && TARGET_EFFECT.STATE == displayConfig.targetEffect) {
                    return true;
                }
            }
        }
        return false;
    }

    private _getSeq(): number {
        if(!this._result) {
            return 0;
        }
        let effectId = this._getEffectId();
        if(effectId > 0) {
            let maxSeq = EffectConst.getSkillInfoMaxSeq(effectId, ANIMATION_GROUP.TARGET);
            return maxSeq > 0 ? (this._result.Index ? this._result.Index : 0) : maxSeq;
        }
        return 0;
    }

    private _checkCanPlayRoleDeadAni(): boolean {
        if(this._result.ResultType == gamesvr.ResultType.RTHPResult) {
            let effectId = this._getEffectId();
            let maxSeq = 0;
            if(effectId > 0) {
                maxSeq = EffectConst.getSkillInfoMaxSeq(effectId, ANIMATION_GROUP.TARGET);
            }
            let index = this._result.Index ? this._result.Index : 0;
            if(maxSeq > 0) {
                return index >= maxSeq;
            } else {
                return true;
            }
        }
        return false;
    }

    private _addRoleReadList() {
        if(this._result.ResultType == gamesvr.ResultType.RTHPResult) {
            if(!this._result.HPResult.HP && this._result.HPResult.Delta < 0) {
                let targetUid = this._result.HPResult.RoleUID;
                battleUIData.addDeadUid(targetUid);
            }
        }
    }

    private _checkNeedPlayDeadAni(): boolean {
        return battleUIData.playDeadList.length >= 1;
    }

}

export {
    EffectAnimation,
}