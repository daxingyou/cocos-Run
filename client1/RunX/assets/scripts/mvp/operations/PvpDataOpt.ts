import { eventCenter } from "../../common/event/EventCenter";
import { deifyCombatEvent, immortalsEvent, peakDuelEvent} from "../../common/event/EventData";
import guiManager from "../../common/GUIManager";
import { data, gamesvr } from "../../network/lib/protocol";
import { operationSvr } from "../../network/OperationSvr";
import { pvpData } from "../models/PvpData";
import ShopGiftView from "../views/view-shop/ShopGiftView";
import { BaseOpt } from "./BaseOpt";

class PvpDataOpt extends BaseOpt {

    init() {
        // 斩将封神
        this.addEventListener(gamesvr.CMD.PVP_SPIRIT_BUY_TICKET_RES, this._receievePvpSpiritTicketRes);
        this.addEventListener(gamesvr.CMD.PVP_SPIRIT_ENTER_RES, this._receievePvpSpiritEnterRes);
        // this.addEventListener(gamesvr.CMD.PVP_SPIRIT_FINISH_RES, this._receievePvpSpiritFinishRes);
        this.addEventListener(gamesvr.CMD.PVP_SPIRIT_TRADE_ENEMY_RES, this._receievePvpTradeEnemyRes);
        this.addEventListener(gamesvr.CMD.PVP_SPIRIT_CHANGE_ENEMY_NOTIFY, this._receievePvpChangeEnemyNotify);
        this.addEventListener(gamesvr.CMD.PVP_SPIRIT_CHANGE_RANK_NOTIFY, this._receievePvpSpiritRankNotify);
        this.addEventListener(gamesvr.CMD.PVP_SPIRIT_CHANGE_RECORD_FIGHT_NOTIFY, this._receievePvpFightRecordRes);
        this.addEventListener(gamesvr.CMD.PVP_SPIRIT_TRADE_DEFENSIVE_LINEUP_RES, this._receievePvpTradeDefensiveRes);
        // 论道修仙
        this.addEventListener(gamesvr.CMD.PVP_FAIRY_BUY_CHALLENGE_TIMES_RES, this._receievePvpFairyTicketRes);
        this.addEventListener(gamesvr.CMD.PVP_FAIRY_ENTER_RES, this._receievePvpFairyEnterRes);
        // this.addEventListener(gamesvr.CMD.PVP_FAIRY_FINISH_RES, this._receievePvpFairyFinishRes);
        this.addEventListener(gamesvr.CMD.RANK_PVP_FAIRY_INTEGRAL_GET_LIST_RES, this._receievePvpRankListRes);
        // 斩将封神敌方列表
        this.addEventListener(gamesvr.CMD.PVP_SPIRIT_OBTAIN_ENEMY_INFO_RES, this._receievePvpSpiritEnemyListRes);

        //巅峰对决排行榜信息
        this.addEventListener(gamesvr.CMD.RANK_PVP_PEAK_DUEL_GET_LIST_RES, this._recvPvpPeakDuelRankList);
        this.addEventListener(gamesvr.CMD.PVP_PEAK_DUEL_TRADE_ENEMY_RES, this._recvPvpPeakDuelChangeEnemyRes);
        this.addEventListener(gamesvr.CMD.PVP_PEAK_DUEL_ENTER_RES, this._recvEnterPvpPeakDuelRes);
        this.addEventListener(gamesvr.CMD.PVP_PEAK_DUEL_TRADE_DEFENSIVE_LINEUP_RES, this._recvPeakDuelTradeDefensiveLineupRes);
        this.addEventListener(gamesvr.CMD.PVP_PEAK_DUEL_CHANGE_RANK_NOTIFY, this._recvPeakDuelRankNotify);
        this.addEventListener(gamesvr.CMD.PVP_PEAK_DUEL_CHANGE_RECORD_FIGHT_NOTIFY, this._recvPeakDuelRecordFightNotify);
    }

    deInit() {
    }

    private _receievePvpSpiritTicketRes(recvMsg: { Result: number, Desc: string, Msg: gamesvr.PvpSpiritBuyTicketRes }){
        if (!this._checkResValid(recvMsg)) {
            return;
        }
        let msg = recvMsg.Msg;
        if (msg.buyTicketsTimes) {
            pvpData.updateSpiritBuyTimes(msg.buyTicketsTimes);
        }
    }

    private _receievePvpSpiritEnemyListRes(recvMsg: { Result: number, Desc: string, Msg: gamesvr.PvpSpiritObtainEnemyInfoRes}){
        if (!this._checkResValid(recvMsg)) {
            return;
        }
        let msg = recvMsg.Msg;
        if (msg.EnemyInfoList) {
            pvpData.updateEnemyList(msg.EnemyInfoList);
            eventCenter.fire(deifyCombatEvent.GET_ENEMY_LIST);
        }
    }

    private _receievePvpSpiritEnterRes(recvMsg: { Result: number, Desc: string, Msg: gamesvr.PvpSpiritEnterRes }) {
        if (!this._checkResValid(recvMsg)) {    
            return;
        }
        let msg = recvMsg.Msg;
        if (msg) {
            pvpData.updateEnemyList(msg.EnemyInfoList);
            pvpData.updateSpiritDefensive(msg);
            // 结束数据已合入，手动备份一份结束用
            pvpData.spiritFinishData = msg;
            eventCenter.fire(deifyCombatEvent.ENTER_PVP_RES, msg);
        }
    }

    // private _receievePvpSpiritFinishRes(recvMsg: { Result: number, Desc: string, Msg: gamesvr.PvpSpiritFinishRes }) {
    //     if (!this._checkResValid(recvMsg)) {
    //         return;
    //     }
    //     let msg = recvMsg.Msg;
    //     if (msg) {
    //         pvpData.updateEnemyList(msg.EnemyList);
    //         pvpData.updateSpiritDefensive(msg);
    //         eventCenter.fire(deifyCombatEvent.FINISH_PVP_RES, msg);
    //     }
    // }

    private _receievePvpSpiritRankNotify(recvMsg: { Result: number, Desc: string, Msg: gamesvr.PvpSpiritChangeRankNotify }){
        if (!this._checkResValid(recvMsg)) {
            return;
        }
        let msg = recvMsg.Msg;
        if (msg && msg.EnemyInfoList){
            pvpData.updateEnemyList(msg.EnemyInfoList);
            eventCenter.fire(deifyCombatEvent.CHANGE_ENEMY_LIST, msg);
        }
        if (msg && msg.Rank){
            pvpData.updateSpiritRank(msg.Rank);
            eventCenter.fire(deifyCombatEvent.CHANGE_RANK, msg.Rank);
        }
    }

    private _receievePvpTradeEnemyRes(recvMsg: { Result: number, Desc: string, Msg: gamesvr.PvpSpiritTradeEnemyRes }){
        if (!this._checkResValid(recvMsg)) {
            return;
        }
        let msg = recvMsg.Msg;
        if (msg && msg.EnemyInfoList) {
            pvpData.updateEnemyList(msg.EnemyInfoList, msg.LastTradeTime);
            eventCenter.fire(deifyCombatEvent.CHANGE_ENEMY_LIST, msg);
        }
    }

    private _receievePvpChangeEnemyNotify(recvMsg: { Result: number, Desc: string, Msg: gamesvr.PvpSpiritChangeEnemyNotify }) {
        if (!this._checkResValid(recvMsg)) {
            return;
        }
        let msg = recvMsg.Msg;
        if (msg && msg.EnemyInfoList) {
            pvpData.updateEnemyList(msg.EnemyInfoList);
            eventCenter.fire(deifyCombatEvent.CHANGE_ENEMY, msg);
        }
    }

    private _receievePvpFightRecordRes(recvMsg: { Result: number, Desc: string, Msg: gamesvr.PvpSpiritChangeRecordFightNotify }){
        if (!this._checkResValid(recvMsg)) {
            return;
        }
        let msg = recvMsg.Msg;
        if (msg && msg.FightUnit) {
            pvpData.updateSpiritRecord(msg.FightUnit);
            eventCenter.fire(deifyCombatEvent.CHANGE_RANK, msg);
        }
    }

    private _receievePvpTradeDefensiveRes(recvMsg: { Result: number, Desc: string, Msg: gamesvr.PvpSpiritTradeDefensiveLineupRes }) {
        if (!this._checkResValid(recvMsg)) {
            return;
        }
        let msg = recvMsg.Msg;
        if (msg && msg.DefensiveHeroMap) {
            pvpData.updateSpiritDefensive(msg);
            eventCenter.fire(deifyCombatEvent.CHANGE_DEFENSE, msg);
        }
    }

    private _receievePvpFairyTicketRes(recvMsg: { Result: number, Desc: string, Msg: gamesvr.PvpFairyBuyChallengeTimesRes }){
        if (!this._checkResValid(recvMsg)) {
            return;
        }
        let msg = recvMsg.Msg;
        if (msg){
            pvpData.updateFairyData({
                ChallengeTimes: msg.ChallengeTimes,
                FightUserList: msg.FightUserList
            })
            eventCenter.fire(immortalsEvent.CHANGE_TICKET);
        }
    }

    private _receievePvpFairyEnterRes(recvMsg: { Result: number, Desc: string, Msg: gamesvr.PvpFairyEnterRes }) {
        if (!this._checkResValid(recvMsg)) {
            return;
        }
        let msg = recvMsg.Msg;
        if (msg) {
            pvpData.updateFairyData({
                ChallengeTimes: msg.ChallengeTimes,
                FightUserList: msg.FightUserList,
                Integral: msg.Integral,
                WinTimes: msg.WinTimes
            })
            // 结束数据已合入，手动备份一份结束用
            pvpData.fairyFinishData = msg;
            eventCenter.fire(immortalsEvent.ENTER_PVP_RES, msg);
        }
    }

    // private _receievePvpFairyFinishRes(recvMsg: { Result: number, Desc: string, Msg: gamesvr.PvpFairyFinishRes }) {
    //     if (!this._checkResValid(recvMsg)) {
    //         return;
    //     }
    //     let msg = recvMsg.Msg;
    //     if (msg) {
    //         pvpData.updateFairyData({
    //             ChallengeTimes: msg.ChallengeTimes,
    //             FightUserList: msg.FightUserList,
    //             Integral: msg.Integral,
    //             WinTimes: msg.WinTimes
    //         })
    //         eventCenter.fire(immortalsEvent.FINISH_PVP_RES, msg);
    //     }
    // }

    private _receievePvpRankListRes(recvMsg: { Result: number, Desc: string, Msg: gamesvr.RankPvpFairyIntegralGetListRes }) {
        if (!this._checkResValid(recvMsg)) {
            return;
        }
        let msg = recvMsg.Msg;
        if (msg) {
            pvpData.updateFairyRankList(msg.PVPFairyIntegralList);
            eventCenter.fire(immortalsEvent.GET_RANK, msg);
        }
    }

    /**
     * @desc 请求进入封神战将战斗
     * @param enemySerial 敌方序列ID
     * @param heros 我方阵容
     * @returns 
     */
    reqEnterPvpSpirit(enemySerial: number, heros: number[], uID: string, enemyList: {[k: string]: number}) {
        let req = gamesvr.PvpSpiritEnterReq.create({
            EnemySerial: enemySerial,
            Heroes: heros,
            EnemyUserID: uID,
            EnemyHeroes: enemyList
        })
        operationSvr.send(req);
    }

    /**
     * @desc 更改防御阵容
     * @param heros 防御阵容
     */
    reqTradeDefensive(heros: {[k: string]:number}){
        let req = gamesvr.PvpSpiritTradeDefensiveLineupReq.create({
            DefensiveHeroMap: heros
        })
        operationSvr.send(req);
    }

    /**
     * @desc 刷新敌方列表
     */
    reqTradeEnemies(){
        let req = gamesvr.PvpSpiritTradeEnemyReq.create({});
        operationSvr.send(req);
    }

    /**
     * @desc 购买斩将封神门票
     */
    reqBuySpiritTicket(){
        let req = gamesvr.PvpSpiritBuyTicketReq.create({});
        operationSvr.send(req);
    }

    /**
     * @desc 购买论道修仙门票
     */
    reqBuyFairyTicket() {
        let req = gamesvr.PvpFairyBuyChallengeTimesReq.create({});
        operationSvr.send(req);
    }

    /**
     * @desc 进入论道修仙战斗
     */
    reqEnterPvpFairy(fightIdx: number, heros: number[], buff: number[]){
        let req = gamesvr.PvpFairyEnterReq.create({
            FightUserIndex: fightIdx,
            Heroes: heros,
            GainBuffIndexList: buff
        })
        operationSvr.send(req);
    }

    /**
     * @desc 请求论道修仙排行
     */
    reqGetPvpFairyRank() {
        let req = gamesvr.RankPvpFairyIntegralGetListReq.create({})
        operationSvr.send(req);
    }

    reqPvpSpiritEnemyList(){
        let req = gamesvr.PvpSpiritObtainEnemyInfoReq.create({})
        operationSvr.send(req);
    }

    private _transArray2Map(heros: number[]): { [k: string]: number }{
        let heroMap: { [k: string]: number } = {};
        heros.forEach((hero,index) => {
            heroMap[index.toString()] = hero;
        })
        return heroMap;
    }

    /**巅峰对决-请求排行榜数据*/
    reqPvpPeakDuelRankList() {
        let req = gamesvr.RankPvpPeakDuelGetListReq.create({});
        operationSvr.send(req);
    }

    private _recvPvpPeakDuelRankList(recvMsg: { Result: number, Desc: string, Msg: gamesvr.RankPvpPeakDuelGetListRes }) {
        if (!this._checkResValid(recvMsg)) {
            return;
        }
        let msg = recvMsg.Msg;
        msg.PVPPeakDuelIntegralList= msg.PVPPeakDuelIntegralList.sort((interA, interB) => {
            return interB.Integral - interA.Integral;
        })
        pvpData.updatePeakDuelRankList(msg);
        eventCenter.fire(peakDuelEvent.RECV_RANK_RES, pvpData.peakDuelRankInfo);
    }

    /**更换对手请求*/
    reqPvpPeakDuelChangeEnemy() {
        let req = gamesvr.PvpPeakDuelTradeEnemyReq.create({});
        operationSvr.send(req);
    }

    private _recvPvpPeakDuelChangeEnemyRes(recvMsg: { Result: number, Desc: string, Msg: gamesvr.PvpPeakDuelTradeEnemyRes }) {
        if (!this._checkResValid(recvMsg)) {
            return;
        }
        let msg = recvMsg.Msg;
        if (msg) {
            pvpData.peakDuelData.LastTradeTime = msg.LastTradeTime;
            pvpData.peakDuelData.PVPPeakDuelIntegralList = msg.EnemyInfoList;
            eventCenter.fire(peakDuelEvent.RECV_CHANGE_ENEMY_RES, msg);    
        }
    }

    /**巅峰对决请求战斗 */
    reqEnterPvpPeakDuel(enemyIndex: number, heros: data.IPvpPeakDuelDefensiveLineupHero[]) {
        let req = gamesvr.PvpPeakDuelEnterReq.create({
            EnemyIndex: enemyIndex,
            ChallengerHeroListHeroList:heros,
        });
        operationSvr.send(req);
    }

    private _recvEnterPvpPeakDuelRes(recvMsg: { Result: number, Desc: string, Msg: gamesvr.PvpPeakDuelEnterRes }) {
        if (!this._checkResValid(recvMsg)) {
            return;
        }
        let msg = recvMsg.Msg;
        if (msg) {
            pvpData.pvpPeakDuekFinishData = msg;
            pvpData.peakDuelData.Integral = msg.Integral;
            let battleRes = msg.EnterBattleResultList[0];
            eventCenter.fire(peakDuelEvent.ENTER_PVP_RES, battleRes);
        }
    }

    /**巅峰对决防守阵容改变请求*/
    reqPeakDuelTradeDefensiveLineup(heros: data.IPvpPeakDuelDefensiveLineupHero[]) {
        let req = gamesvr.PvpPeakDuelTradeDefensiveLineupReq.create({
            PvpPeakDuelDefensiveLineupHeroList: heros,
        });
        operationSvr.send(req);
    }

    private _recvPeakDuelTradeDefensiveLineupRes(recvMsg: { Result: number, Desc: string, Msg: gamesvr.PvpPeakDuelTradeDefensiveLineupRes }) {
        if (!this._checkResValid(recvMsg)) {
            return;
        }
        let msg = recvMsg.Msg;
        if (msg) {
            eventCenter.fire(peakDuelEvent.RECV_CHANGE_DEVENSIVE_TEAM_RES, msg);
        }
    }

    /**战报通知*/
    private _recvPeakDuelRecordFightNotify(recvMsg: { Result: number, Desc: string, Msg: gamesvr.PvpPeakDuelChangeRecordFightNotify }) {
        if (!this._checkResValid(recvMsg)) {
            return;
        }
        let msg = recvMsg.Msg;
        pvpData.peakDuelData.FightList.push(msg.FightUnit);
    }

    /**积分通知*/
    private _recvPeakDuelRankNotify(recvMsg: { Result: number, Desc: string, Msg: gamesvr.PvpPeakDuelChangeIntegralNotify }) {
        if (!this._checkResValid(recvMsg)) {
            return;
        }
        let msg = recvMsg.Msg;
        pvpData.peakDuelData.Integral = msg.Integral;
        eventCenter.fire(peakDuelEvent.RANK_INTERGEL_NTY);
    }
}

let pvpDataOpt = new PvpDataOpt();
export { pvpDataOpt }
