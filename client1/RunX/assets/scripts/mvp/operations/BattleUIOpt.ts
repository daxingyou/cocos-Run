import { eventCenter } from "../../common/event/EventCenter";
import { battleEvent, battleStatisticEvent, cloudDreamEvent, dailyLessonEvent, deifyCombatEvent, dreamlandEvent, immortalsEvent, islandEvent, lvMapViewEvent, magicDoorEvent, nineHellEvent, peakDuelEvent, purgatoryEvent, respectEvent, timeLimitEvent, trialDevilEvent, yyBookEvent } from "../../common/event/EventData";
import { logger } from "../../common/log/Logger";
import UITeam from "../template/UITeam";
import { ItemResultData } from "../../app/BattleType";
import UIRole from "../template/UIRole";
import { BTResult, ROLE_TYPE, TEAM_TYPE, UI_LEN } from "../../app/BattleConst";
import { battleUIData } from "../models/BattleUIData";
import { BaseOpt } from "./BaseOpt";
import { gamesvr } from "../../network/lib/protocol";
import { pveData } from "../models/PveData";
import { battleStatisticor } from "../views/view-battle/BattleStatisticor";
import { battleUtils } from "../../app/BattleUtils";
type BattleMsgResult = gamesvr.IBattleStartResult | gamesvr.IRoundResult | gamesvr.IBattleEndResult;

class BattleUIOpt extends BaseOpt {
    private _msgQuene: BattleMsgResult[] = [];
    private _currMsg: BattleMsgResult = null;
    private _msgSeq: number = 0;
    private _pause: boolean = false;

    setTeamPowers(powers: number[]) {
        battleUIData.setTeamPower(powers)
    }

    init() {}
    deInit() {}

    registerBattle() {
        battleUIData.battleBegin();
        eventCenter.register(lvMapViewEvent.ENTER_PVE_RES, this, this._recvPveBattleMsg);
        eventCenter.register(dreamlandEvent.ENTER_PVE_RES, this, this._recvPveBattleMsg);
        eventCenter.register(dailyLessonEvent.ENTER_PVE_DAILY_RES, this, this._recvPveBattleMsg);
        eventCenter.register(dailyLessonEvent.ENTER_PVE_RISEROAD_RES, this, this._recvPveBattleMsg);
        eventCenter.register(magicDoorEvent.ENTER_PVE_RES, this, this._recvPveBattleMsg);
        eventCenter.register(nineHellEvent.ENTER_PVE_RES, this, this._recvPveBattleMsg);
        eventCenter.register(cloudDreamEvent.ENTER_PVE_RES, this, this._recvPveBattleMsg);
        eventCenter.register(timeLimitEvent.ENTER_RANDOM_FIGHT_BATTLE, this, this._recvTimelimitBattleMsg);
        eventCenter.register(respectEvent.ENTER_PVE_RES, this, this._recvPveBattleMsg);
        eventCenter.register(islandEvent.RECEIVE_BATTLE_RES, this, this._recvPveBattleMsg);
        eventCenter.register(trialDevilEvent.ENTER_PVE_RES, this, this._recvPveBattleMsg);
		    eventCenter.register(purgatoryEvent.ENTER_PVE_RES, this, this._recvPveBattleMsg);
        eventCenter.register(yyBookEvent.ENTER_RES, this, this._recvPveBattleMsg);
        // pvp
        eventCenter.register(immortalsEvent.ENTER_PVP_RES, this, this._recvPvpBattleMsg);
        eventCenter.register(deifyCombatEvent.ENTER_PVP_RES, this, this._recvPvpBattleMsg);
        eventCenter.register(peakDuelEvent.ENTER_PVP_RES,this,this._recvPvpMultBattleMsg)
    }

    clear(){
        this._msgQuene = [];
        this._currMsg = null;
        this._msgSeq = 0;
    }

    unRegisterBattle() {
        battleUIData.battleEnd();
        this.clear();
        eventCenter.unregisterAll(this);
    }

    sendGame(cmd: string, args?: any) {

    }

    getMsgList() {
        return this._msgQuene;
    }

    getCurrSeq() {
        return this._msgSeq
    }

    restart () {
        this._msgSeq = 0;
        this._currMsg = null;
        this._processNextMsg();
    }

    pause () {
        this._pause = true;
    }

    continue () {
        this._pause = false;
        this._processNextMsg();
    }

    skipToEnd () {
        if (this._msgSeq >= (this._msgQuene.length - 1) || this._msgQuene.length <= 2) {
            return;
        }
        this._msgSeq = this._msgQuene.length - 1;
        this._currMsg = null;
        this._processNextMsg();
    }

    private _recvPveBattleMsg (cmd: string,  
            msgs: gamesvr.EnterPveRes 
                | gamesvr.TrialHellEnterPveRes 
                | gamesvr.TrialCloudDreamEnterPveRes
                | gamesvr.TrialMiracleDoorEnterPveRes
                | gamesvr.TrialIslandEnterPveRes
                | gamesvr.ITrialDevilEnterPveRes
                | gamesvr.ITrialLightDarkEnterRes)
    {
        if (!msgs.EnterBattleResult) {
            logger.error("[BattleUIOpt] enter battle res is err", msgs)
            return;
        }

        battleUIData.setRawResultRes(msgs.EnterBattleResult) 

        logger.log('BattleUIOpt', `------ALL ------, msg = `, msgs);
        this._pause = false;
        battleUtils.showBattleDetailLog(msgs.EnterBattleResult)

        // @ts-ignore
        if (msgs && ((!isNaN(msgs.LessonID) && msgs.LessonID == pveData.pveConfig.lessonId) || isNaN(msgs.LessonID)) && msgs.EnterBattleResult) {
            this.clear();

            let res = msgs.EnterBattleResult
            if (res.BattleStartRes) {
                this._msgQuene.push(res.BattleStartRes)
            }

            if (res.RoundRes) {
                res.RoundRes.forEach( _v => { this._msgQuene.push(_v) })
            }

            if (res.BattleEndRes) {
                this._msgQuene.push(res.BattleEndRes)
            }
            if (res.Teams) {
                this._asyncBattleBaseData(res.Teams)
            }
            this._processNextMsg();
        }
    }

    private _recvTimelimitBattleMsg(cmd: string, msgs: gamesvr.TimeLimitFantasyEnterPveRes) {
        if (!msgs.EnterBattleResult) {
            logger.error("[BattleUIOpt] timelimitFight enter battle res is err", msgs)
            return;
        }
        battleUIData.setRawResultRes(msgs.EnterBattleResult) 
        logger.log('BattleUIOpt', `------ALL ------, msg = `, msgs);
        this._pause = false;
        battleUtils.showBattleDetailLog(msgs.EnterBattleResult)

        if (msgs && !!msgs.ID && msgs.EnterBattleResult) {
            this.clear();

            let res = msgs.EnterBattleResult
            if (res.BattleStartRes) {
                this._msgQuene.push(res.BattleStartRes)
            }

            if (res.RoundRes) {
                res.RoundRes.forEach( _v => { this._msgQuene.push(_v) })
            }

            if (res.BattleEndRes) {
                this._msgQuene.push(res.BattleEndRes)
            }
            if (res.Teams) {
                this._asyncBattleBaseData(res.Teams)
            }
            this._processNextMsg();
        }
    }

    private _recvPvpBattleMsg (cmd: string, msgs: gamesvr.PvpFairyEnterRes | gamesvr.PvpSpiritEnterRes) {
        logger.log('BattleUIOpt', `------ALL ------, msg = `, msgs);
        this._pause = false;
        if (msgs && msgs.EnterBattleResult) {
            battleUIData.setRawResultRes(msgs.EnterBattleResult) 
            battleUtils.showBattleDetailLog(msgs.EnterBattleResult)
            this.clear();

            let res = msgs.EnterBattleResult
            if (res.BattleStartRes) {
                this._msgQuene.push(res.BattleStartRes)
            }

            if (res.RoundRes) {
                res.RoundRes.forEach( _v => { this._msgQuene.push(_v) })
            }

            if (res.BattleEndRes) {
                this._msgQuene.push(res.BattleEndRes)
            }
            if (res.Teams) {
                this._asyncBattleBaseData(res.Teams)
            }
            this._processNextMsg();
        }
    }

    /**保留一份对局结束的副本来重复读取*/
    private _recvPvpMultBattleMsg(cmd: string, msgs: gamesvr.IEnterBattleResult) {
        logger.log('BattleUIOpt', `------ALL ------, msg = `, msgs);
        this._pause = false;
        if (msgs) {
            battleUIData.setRawResultRes(msgs) 
            battleUtils.showBattleDetailLog(msgs)
            this.clear();

            let res = msgs
            if (res.BattleStartRes) {
                this._msgQuene.push(res.BattleStartRes)
            }

            if (res.RoundRes) {
                res.RoundRes.forEach( _v => { this._msgQuene.push(_v) })
            }

            if (res.BattleEndRes) {
                this._msgQuene.push(res.BattleEndRes)
            }
            if (res.Teams) {
                this._asyncBattleBaseData(res.Teams)
            }
            this._processNextMsg();
        }
    }

    showReplayNotify (msgs: gamesvr.IEnterBattleResult) {
        logger.log('BattleUIOpt _showReplayNotify', `------ALL ------, msg = `, msgs);

        this._pause = false;
        if (msgs) {
            battleUtils.showBattleDetailLog(msgs)
            this.clear();
            battleUIData.setRawResultRes(msgs) 
            let res = msgs
        
            if (res.BattleStartRes) {
                this._msgQuene.push(<gamesvr.BattleStartResult>res.BattleStartRes)
            }

            if (res.RoundRes) {
                res.RoundRes.forEach( _v => { this._msgQuene.push(_v) })
            }

            if (res.BattleEndRes) {
                this._msgQuene.push(<gamesvr.BattleEndResult>res.BattleEndRes)
            }
            if (res.Teams) {
                this._asyncBattleBaseData(res.Teams)
            }
            this._processNextMsg();
        }
    }

    private _processNextMsg() {
        if (this._pause) return;
        if (this._currMsg != null) return;
        if (this._msgQuene.length <= 0) return;

        this._currMsg = this._msgQuene[this._msgSeq++];
        if (this._currMsg == null) {
            logger.log('BattleUIOpt', `--- 战斗已经结束 ---`)
            return;
        }

        logger.log('BattleUIOpt', `------发出处理事件------, msgSeq = ${this._msgSeq}, msg = `, this._currMsg);

        if (this._msgSeq == 1/*this._currMsg instanceof gamesvr.BattleStartResult*/) {
            this._processBattleStartMsg(this._currMsg);
        } else if (this._msgSeq == this._msgQuene.length /*this._currMsg instanceof gamesvr.BattleEndResult*/) {
            // @ts-ignore
            this._processBattleEndMsg(this._currMsg);
        } else {
            this._processRoundMsg(<gamesvr.IRoundResult>this._currMsg, this._msgSeq);
        }
    }

    private _processBattleStartMsg(msg: gamesvr.IBattleStartResult) {
        let startFunc = () => {
            if (msg.Results) {
                this.processEffectRes(msg.Results)
            } else {
                this.finishCurrMsg(this._msgSeq);
            }
        }

        eventCenter.fire(battleStatisticEvent.BATTLE_START, msg, this._msgSeq);
        if(!battleStatisticor.isBattleMore) eventCenter.fire(battleEvent.BATTLE_START, msg, this._msgSeq, startFunc);
    }

    private _processBattleEndMsg(msg: gamesvr.IBattleEndResult) {
      if(!battleStatisticor.isBattleMore) eventCenter.fire(battleEvent.BATTLE_END, msg, this._msgSeq);
        if (msg.Results) {
            this.processEffectRes(msg.Results)
        } else {
            this.finishCurrMsg(this._msgSeq);
        }
        eventCenter.fire(battleStatisticEvent.BATTLE_END, msg, this._msgSeq);
    }

    private _processRoundMsg(msg: gamesvr.IRoundResult, seq: number) {
        eventCenter.fire(battleStatisticEvent.ROUND, msg, seq);
        if(!battleStatisticor.isBattleMore) eventCenter.fire(battleEvent.ROUND_START, msg);
    }

    finishCurrMsg(msgSeq: number) {
        if (msgSeq == null || !this._msgQuene[msgSeq]) return;

        this._currMsg = null;
        this._processNextMsg();
    }

    private _asyncBattleBaseData (teams: gamesvr.ITeam[]) {
        battleUIData.battleBegin();
        teams.forEach( (_t, _idx) => {
            let team = new UITeam();
            // 第一个默认是己方
            team.setTeam(_t, _idx == 0? TEAM_TYPE.SELF: TEAM_TYPE.OPPOSITE);
            battleUIData.addOneTeam(team);
        })
    }

    processEffectRes (args?: gamesvr.IResult[]) {
        if (args && args.length) {
            let results = this._processEffectResult(args);
            eventCenter.fire(battleEvent.EFFECT_EVENT, results, this._msgSeq)
        } else {
            eventCenter.fire(battleEvent.EFFECT_EVENT, [], this._msgSeq)
        }
    }

    private _processEffectResult(resultsRes: BTResult[]) {
        let res = resultsRes;

        if (res == null || res.length == 0) {
            return null;
        }

        let results = battleUtils.mergeEffectArray(res)
        let findRole = (res: BTResult): number => {
            if (res.HPResult) return res.HPResult.RoleUID
            if (res.PowerResult) return res.PowerResult.RoleUID
            if (res.BuffResult) return res.BuffResult.RoleUID
            if (res.HaloResult) return res.HaloResult.RoleUID
            if (res.SkillLightResult) return res.SkillLightResult.RoleUID
            if (res.BuffLightResult) return res.BuffLightResult.RoleUID
            if (res.HaloLightResult) return res.HaloLightResult.RoleUID
            if (res.RoleDeadResult) return res.RoleDeadResult.RoleUID
            return 0
        }

        // 将划分好的数组放到指定结构中
        let itemResults: ItemResultData[] = [];
        results.forEach(itemData => {
            if (itemData && itemData.length > 0) {
                let roleUID = findRole(itemData[0]);
                let itemUID = itemData[0].From;

                let roleItem = battleUIData.getRoleByUid(roleUID);
                if (roleItem) roleUID = roleItem.uid;

                itemResults.push({
                    RoleUID: roleUID,
                    ItemUID: itemUID,
                    ItemResults: itemData
                });
            } else {
                logger.warn('BattleOpt', `itemData is invalid. itemData = ${itemData}`);
            }
        });

        // 同步数据
        res.forEach(resultData => {
            battleUIData.updateResultData(resultData);
            if (resultData.RoleDeadResult) {
                eventCenter.fire(battleEvent.ROLE_STATE_CHANGE, resultData.RoleDeadResult)
            }
        });

        return itemResults;
    }


    findDefaultTarget(user: UIRole) {
        let selfPos = user.pos;

        let oppoTeam = user.roleType == ROLE_TYPE.HERO ? battleUIData.getOppositeTeam() : battleUIData.getSelfTeam()

        const maxRole = 5;
        let validRole: UIRole = null;
        for (let intv = 0; intv < maxRole; intv++) {
            let currPos = selfPos + intv;
            let findRole = oppoTeam.getRoleByPos(currPos);
            if (!findRole || !findRole.hp) {
                currPos = selfPos - intv;
                findRole = oppoTeam.getRoleByPos(currPos);
            }

            if (findRole && findRole.hp) {
                validRole = findRole;
                break;
            }
        }
        return validRole
    }

    
}

let battleUIOpt = new BattleUIOpt();
export { battleUIOpt }
