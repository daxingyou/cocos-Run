import { BATTLE_STATE, EffectType, EFFECT_TYPE, ResultType, ROLE_STATE, TIME_TRIGGER } from "../../app/AppEnums";
import { eventCenter } from "../../common/event/EventCenter";
import { effectManager } from "./effect/EffectManager";
import { skillManager } from "./effect/SkillManager";
import BattleDataTransformer from "./BattleDataTransformer";
import BattleTrigger from "./BattleTrigger";
import BTStepWork from "./BTStepWork";
import BattleStateControl from "./state-machine/BattleStateControl";
import { AsyncBattleBaseNotify, csCmd, EffectResultNotify, ReqBattleReady } from "../CS";
import { Effect, OneActionInfo, EventInfo, AttackProperty, EffectItem, DirectEffect } from "../BattleType";
import { AttackResult, BuffLightResult, BuffResult, HPResult, ResultData } from "../CSInterface";
import { dataManager } from "../data-manager/DataManager";
import { dataOptManager } from "../data-operation/DataOperation";
import BTBaseRole from "../data-template/BTBaseRole";
import { buffManager } from "./effect/BuffManager";
import { utils } from "../../app/AppUtils";
import { configUtils } from "../../app/ConfigUtils";
import Buff from "../data-template/Buff";
import { getRoleDeadResult } from "./effect/EffectUtils";

const TEST_HERO = [175111, 165211, 175311, 115111, 125111];
const TEST_MONSTER = [800001, 800002, 800003, 800004 , 800005];

export default class BattleLogic {

    // 游戏状态控制器
    stateCtrl: BattleStateControl = null;
    currState: BATTLE_STATE = BATTLE_STATE.NONE;

    // 当前执行效果
    private _eventLogic: BTStepWork = null;
    private _effectList: OneActionInfo[] = [];
    private _currEffect: OneActionInfo = null;
    private _resultList: ResultData[] = [];

    // 其他
    private _trigger: BattleTrigger = null;

    init () {
        if (this.stateCtrl == null) {
            this.stateCtrl = new BattleStateControl();
        }
        this.stateCtrl.init(this);

        if (this._eventLogic == null) {
            this._eventLogic = new BTStepWork();
        }
        this._eventLogic.clear();

        if (this._trigger == null) {
            this._trigger = new BattleTrigger();
        }
        this._trigger.init(this)
        effectManager.init();
    }

    gameEnd () {
        this.deInit()
    }

    deInit () {
        this._effectList = [];
        this._currEffect = null;
        this._eventLogic.clear();
        this._trigger.deInit();
        eventCenter.unregisterAll(this);
    }

    process (cmd: string, args: any) {
        switch (cmd) {
            case csCmd.REQ_BATTLE_READY: {
                this._battleStart(args);
                break;
            }
            case csCmd.REQ_ACTION_FINISH: {
                this._roleActionFinish(args);
                break;
            }
            default: break;
        }
    }

    fire (cmd: string, args?: any) {
        eventCenter.fire(cmd, args);
    }

    clearWorks () {
        this._eventLogic.clear();
    }

    /**
     * 添加分步任务
     * @param target 执行对象
     * @param func 执行函数
     * @param toHead 按深度优先顺序放在队列中
     *       1. 一般的效果都是直接 tohead = true放到前面
     *          a. 二级效果，比如一个具体的effect处理
     *          b. 处理玩一个技能效果之后，马上派发出去
     *       2. 放到队列后面的情况：tohead = false
     *          a. 检查战斗结束
     *          b. 状态机切换状态
     *          c. 一级效果，比如一个技能，一个天赋
     *          
     * @param name 名称
     * @param toEventBottom 所有按照深度优先顺序的子事件算一个事件的话，放在当前事件的最后面（非深度优先事件的前面）
     */
    addStepWork (target: object, func: () => void, toHead: boolean = false, name = 'default', toEventBottom: boolean = false) {
        this._eventLogic.addStepWork(target, func, toHead, name, toEventBottom);
    }

    checkGameEnd () {
        let gameOver = this._checkGameOver();
        return gameOver;
    }

    private _battleStart (req: ReqBattleReady) {
        this.init();

        dataOptManager.battleOpt.initBattleBegin(req.heroList, req.enemyList);

        let selfTeam = BattleDataTransformer.getPlayerTeamData(dataManager.battleData.getSelfTeam());
        let oppositeTeam = BattleDataTransformer.getPlayerTeamData(dataManager.battleData.getOppositeTeam());
        let baseData: AsyncBattleBaseNotify = {
            teamData: [selfTeam, oppositeTeam],
        }

        this.fire(csCmd.ASYNC_BATTLE_BASE_NOTIFY, baseData)
        this.stateCtrl.gotoState(BATTLE_STATE.BATTLE_START, null);
    }

    private _roleActionFinish (roleUid: number) {
        this.stateCtrl.gotoState(BATTLE_STATE.IDLE, null);
    }

    addEffectList (effects: OneActionInfo[]) {
        if (this._effectList.length == 0 && this._currEffect == null) {
            this._effectList = effects;
            this.addStepWork(this, this.processEffectList, true, 'processEffectList');
        } else {
            this._effectList = this._effectList.concat(effects);
        }
    }

    addDirectEffect (currEffect: OneActionInfo, directEffect: DirectEffect) {
        let effects: Effect[] = [];
        let user = this._currEffect.user;
        let itemInfo = this._currEffect.itemInfo;

        if (itemInfo) {
            if (itemInfo.type == EFFECT_TYPE.BUFF) {
                effects = buffManager.process(itemInfo.itemId, user);
            } else {
                effects = this._currEffect.effects;
            }
        }

        effects.forEach( eff => {
            effectManager.processDirect(eff, currEffect, directEffect);
        })
    }

    processEffectList () {
        if (this._currEffect != null) return;
        if (this._effectList.length == 0) return;
        
        this._currEffect = this._effectList.shift();
        this.processOneEffect();
    }

    processOneEffect () {
        if (this._currEffect == null) {
            this.processEffectList();
            return;
        }

        let effects: Effect[] = [];
        let user = this._currEffect.user;
        let userRole = dataManager.battleData.getRoleByUid(user);
        let itemInfo = this._currEffect.itemInfo;

        if (itemInfo) {
            if (itemInfo.type == EFFECT_TYPE.SKILL) {
                effects = skillManager.process(itemInfo.itemId, user);
                this.stateCtrl.currState.setCurrMainAction(this._currEffect);          
            } else if (itemInfo.type == EFFECT_TYPE.BUFF) {
                effects = buffManager.process(itemInfo.itemId, user);
            } else {
                effects = this._currEffect.effects;
            }
        }
        
        let originResults: ResultData[] = [];
        let currDefault = dataOptManager.battleOpt.findDefaultTarget(userRole);
        for (let i = 0; i < effects.length; i++) {
            const currEffect = effects[i];
            if (!this._checkEffectValid(currEffect)) continue;
            
            let effectRes = effectManager.process(currEffect, this._currEffect, userRole, {
                currRound: dataManager.battleData.roundIdx,
                currDefault: currDefault.roleUID
            });

            // @ts-ignore
            originResults = originResults.concat(utils.deepCopy(effectRes));
            // 因为上面技能效果而触发的另外一个效果
            let triggerRes = this.processEffectEvent(itemInfo, currEffect.effectId, userRole, effectRes)
            effectRes = effectRes.concat(triggerRes);

            effectRes.forEach(resultData => {
                if (!resultData.FromUID) {
                    resultData.FromUID = user;
                }
                resultData.ItemId = itemInfo.itemId;
                resultData.EffectId = currEffect.effectId;
                resultData.Seq = i;
            })
            this.addResultList(effectRes);
        }

        let effRes: ResultData[] = [];
        
        let eventInfo = this._transResultDataToEventInfo(originResults, itemInfo, userRole);
        if (itemInfo.type == EFFECT_TYPE.SKILL || itemInfo.type == EFFECT_TYPE.NORMAL_ATTACK) {
            this.setTimePoint(TIME_TRIGGER.SKILL_EFFECT_LIGHT, eventInfo, effRes);
        } else if (itemInfo.type == EFFECT_TYPE.BUFF) {
            this.setTimePoint(TIME_TRIGGER.BUFF_EFFECT_LIGHT, eventInfo, effRes);
        }
        
        this.addResultList(effRes);

        this._currEffect = null;
        if (this._effectList.length > 0) {
            this.processEffectList();
        } else {
            this.notifyEffectResult(this._resultList);
            this.clearResultList();

            this.addStepWork(this, () =>{
                if (this._checkGameOver()) 
                    this.stateCtrl.gotoState(BATTLE_STATE.BATTLE_END);
            }, false, '_checkGameOver');
        }
    }
    
    clearResultList () {
        this._resultList = [];
    }

    getResultList (): ResultData[] {
        return this._resultList;
    }

    addResultList (results: ResultData[]) {
        if (results && results.length > 0) {
            results.forEach(result => {
                if (result) this._resultList.push(result);
            });
        }
    } 

    notifyEffectResult (resultData: ResultData[]) {
        if (resultData && resultData.length > 0) {
            if (resultData && resultData.length > 0) {
                let effectNotify: EffectResultNotify = {
                    Results: resultData
                }
                this.fire(csCmd.EFFECT_RESULT_NOTIFY, effectNotify);
            }
        }
    }

    private _checkEffectValid (effect: Effect) {
        // 游戏结束就不执行后面的效果了
        let gameEnd = this._checkGameOver();
        return !gameEnd;
    }

    private _checkGameOver () {
        let monsList = dataManager.battleData.getOppositeTeam().roles;
        let heroList = dataManager.battleData.getSelfTeam().roles;
        let monsterAlive = false;
        let heroAlive = false;
        monsList.forEach( ele => {
            if (ele && ele.hp)  {
                monsterAlive = true;
            }
        });

        heroList.forEach( ele => {
            if (ele && ele.hp)  {
                heroAlive = true;
            }
        });

        return !(monsterAlive && heroAlive);
    }


    setTimePoint (currTime: TIME_TRIGGER , paras: EventInfo, triggerRes: ResultData[]) {
        this._trigger.setTimePoint(currTime, paras, triggerRes);
    }

    setTimePointDirect (currTime: TIME_TRIGGER , paras: EventInfo, triggerRes: ResultData[], directEffect?: DirectEffect) {
        this._trigger.setTimePointDirect(currTime, paras, triggerRes, directEffect);
    }

    /**
     * @desc 处理技能/buff等触发的事件
     * @param effType 具体效果的effectid
     * @param itemId 卡牌/锦囊id
     * @param user 使用者
     * @param effRes 产生的效果
     * @returns {Array<ResultData>} 立即产生的效果(buff触发/意图触发)
     */
     processEffectEvent (effectInfo: EffectItem, effTypeID: EffectType, user: BTBaseRole, effRes: ResultData[]): ResultData[] {
        let results: ResultData[] = [];
        if (effRes == null) return results;

        let currLen = effRes.length;

        for (let i = 0; i < currLen; i++) {
            let res = effRes[i];
            if (res) {
                if (res.AttackResult) {
                    this._procAttackEffect(effectInfo, user, results, res.AttackResult);
                } 

                if (res.BuffResult) {
                    this._procBuffChange(effectInfo, user, results, res.BuffResult);
                }

                if (res.HPResult) {
                    this._procHpChange(effectInfo, user, results, res.HPResult);
                }
            }
        }

        return results;
    }

    private _procAttackEffect (effectInfo: EffectItem, user: BTBaseRole, triggerRes: ResultData[], currRes: AttackResult) {
        let attackRes = currRes;

        let attRole = dataManager.battleData.getRoleByUid(attackRes.RoleUID);
        let info: EventInfo = { 
            itemId: effectInfo.itemId, 
            target: attackRes.TargetUid,
            currRole: user,
            effectType: effectInfo.type,
            currAction: {
                itemId: effectInfo.itemId,
                user: attRole.roleUID,
                effectType: effectInfo.type,
                attacks: [
                    {
                        target:attackRes.TargetUid,
                        miss: attackRes.Miss,
                        crit: attackRes.Crit,
                        attack: attackRes.Attack,
                    }
                ]
            }
        };
        this.setTimePoint(TIME_TRIGGER.ROLE_BE_ATTACKED, info, triggerRes);
    }

    private _procBuffChange (effectInfo: EffectItem, user: BTBaseRole, triggerRes: ResultData[], buffRes: BuffResult) {
        let itemId = effectInfo.itemId;
        let buffResult: BuffResult = buffRes;

        if (buffResult) {
            let info: EventInfo = {
                effectType: effectInfo.type,
                target: buffResult.RoleId,
                itemId: itemId,
                buffInfo: {
                    fromRole: user.roleUID,
                    buffId: buffResult.BuffId,
                    targetId: buffResult.RoleId,
                    count: buffResult.Count,
                    delta: buffResult.Delta,
                }
            }

            if (buffResult.Delta > 0) {
                this.setTimePoint(TIME_TRIGGER.GAIN_BUFF, info, triggerRes);
                this._checkRemoveSameTypeBuff(info, triggerRes);
            } else {
                this.setTimePoint(TIME_TRIGGER.BUFF_COUNT_CHANGE, info, triggerRes);
            }
        }
    }

    private _checkRemoveSameTypeBuff (eventInfo: EventInfo, resultData: ResultData[]) {
        let res: ResultData[] = []
        let buffInfo = eventInfo.buffInfo;
        if (buffInfo.delta) {
            let cfg = configUtils.getBuffConfig(buffInfo.buffId);
            let role = dataManager.battleData.getRoleByUid(buffInfo.targetId);
            let currCfgList = role.buffList.map( _v => {return _v.cfg});
            currCfgList.forEach( _cfg => {
                if (_cfg && _cfg.DType == cfg.DType && _cfg.BuffId != buffInfo.buffId) {
                    res = res.concat(this.autoRemoveBuff(role, _cfg.BuffId))
                }
            })

        }
        resultData = resultData.concat(res);
    }

    autoRemoveBuff (role: BTBaseRole, buffId: number): ResultData[] {
        let res: ResultData[] = [];
        let resBuff = role.removeBuff(buffId);

        let info: EventInfo = {
            effectType: EFFECT_TYPE.OTHER,
            target: role.roleUID,
            buffInfo: {
                fromRole: role.roleUID,
                buffId: resBuff.buffId,
                targetId: role.roleUID,
                count: 0,
                delta: resBuff.delta,
            }
        }
        this.setTimePoint(TIME_TRIGGER.BUFF_COUNT_CHANGE, info, res); 
        return res;
    }

    private _procHpChange (effectInfo: EffectItem, user: BTBaseRole, triggerRes: ResultData[], hpResult: HPResult) {
        let itemId = effectInfo.itemId;
        let hpRes: HPResult = hpResult;

        if (hpRes) {
            if (hpRes.HP == 0) {
                let target = dataManager.battleData.getRoleByUid(hpRes.RoleUID);
                if (target)
                    this._procRoleDead(user, effectInfo, target, triggerRes);
            }
        }
    }

    private _procRoleDead (user: BTBaseRole, effectInfo: EffectItem, target: BTBaseRole, triggerRes: ResultData[]) {
        target.state = ROLE_STATE.DEAD;
        let info: EventInfo = {
            effectType: effectInfo.type,
            target: target.roleUID,
            itemId: effectInfo.itemId,
        }
        triggerRes.push(getRoleDeadResult(user, target, effectInfo));
        this.setTimePoint(TIME_TRIGGER.ROLE_DEAD, info, triggerRes);
    }

    private _transResultDataToEventInfo (resultList: ResultData[], itemEffect: EffectItem, user: BTBaseRole): EventInfo {
        let eventInfo: EventInfo = {
            effectType: itemEffect.type,
            currRole: user
        };

        for (let i = 0; i < resultList.length; i++) {
            let _res = resultList[i];
            if (_res.AttackResult) {
                let attRes = _res.AttackResult;
                if (!eventInfo.currAction) {
                    eventInfo.currAction = {
                        itemId: _res.ItemId,
                        effectType: itemEffect.type,
                        user: user.roleUID,
                        attacks: []
                    }
                }
                eventInfo.currAction.attacks.push({
                    target:attRes.TargetUid,
                    miss: attRes.Miss,
                    crit: attRes.Crit,
                    attack: attRes.Attack,
                })
            }
        }
        return eventInfo;
    }

}