import { data, gamesvr } from "../../network/lib/protocol";
import { operationSvr } from "../../network/OperationSvr";
import { eventCenter } from "../../common/event/EventCenter";
import { BaseOpt } from "./BaseOpt";
import { activityData } from "../models/ActivityData";
import { activityEvent, commonEvent } from "../../common/event/EventData";
import { userData } from "../models/UserData";
import { CustomItemId } from "../../app/AppConst";

class ActivityOpt extends BaseOpt {

    init() {
        super.init();
        this.addEvent();
    }

    addEvent(){
        eventCenter.register(commonEvent.TIME_DAY_RESET, this, this._onTimeReset);
        eventCenter.register(activityEvent.BATTLE_PASS_RESET, this, this._onBattlePassReset);

        this.addEventListener(gamesvr.CMD.ACTIVITY_SIGN_IN_FLOP_CARD_RES, this._receiveSignInFlopRes);
        this.addEventListener(gamesvr.CMD.ACTIVITY_SIGN_IN_RECEIVE_HERO_RES, this._receiveSignInHeroRes);
        this.addEventListener(gamesvr.CMD.ACTIVITY_SIGN_IN_REFRESH_HERO_RES, this._receiveSignInRefreshRes);
        this.addEventListener(gamesvr.CMD.ACTIVITY_SIGN_IN_CHANGE_HERO_NOTIFY, this._receiveSignInChangeHeroNotify);

        this.addEventListener(gamesvr.CMD.ACTIVITY_SPIRIT_RECEIVE_SPIRIT_RES, this._receiveSpiritRes);
        this.addEventListener(gamesvr.CMD.ACTIVITY_LEVEL_RECEIVE_REWARD_RES, this._receiveLevelRewardRes);
        this.addEventListener(gamesvr.CMD.ACTIVITY_LEVEL_CHANGE_RECHARGE_AMOUNT_NOTIFY, this._receiveLevelRechargeNotify);
        this.addEventListener(gamesvr.CMD.ACTIVITY_OPEN_SERVICE_LOGIN_RECEIVE_REWARD_RES, this._receiveLoginRewardRes);

        this.addEventListener(gamesvr.CMD.ACTIVITY_BATTLE_PASS_RECEIVE_REWARD_RES, this._receiveBattlePassRewardRes);
        this.addEventListener(gamesvr.CMD.ACTIVITY_BATTLE_PASS_BUY_LEVEL_RES, this._receiveBattlePassBuyLevelRes);
        this.addEventListener(gamesvr.CMD.ACTIVITY_BATTLE_PASS_BUY_BATTLE_PASS_NOTIFY, this._receiveBattlePassBuyLevelNotify);

        this.addEventListener(gamesvr.CMD.ACTIVITY_SEVEN_DAY_RECEIVE_ANIMATE_REWARD_RES, this._receiveSevenDayRewardRes);

        this.addEventListener(gamesvr.CMD.ACTIVITY_SPIRIT_LAST_REFRESH_SP_TIME_NOTIFY, this._receivePhysicalRefreshNotify);

        this.addEventListener(gamesvr.CMD.ACTIVITY_DAILY_LOTTERY_DEPART_RES, this._recvLotteryRes);
        this.addEventListener(gamesvr.CMD.ACTIVITY_DAILY_LOTTERY_LOTTERY_COUNT_NOTIFY, this._recvLotteryNotify);

        this.addEventListener(gamesvr.CMD.ACTIVITY_DAILY_RECHARGE_RECEIVE_REWARD_RES, this._recvDayRechargeRewardRes);
        this.addEventListener(gamesvr.CMD.ACTIVITY_DAILY_RECHARGE_DAY_RECHARGE_COUNT_NOTIFY, this._recvDayRechargeCountNotify);

        this.addEventListener(gamesvr.CMD.ACTIVITY_AMOUNT_RECHARGE_RECEIVE_REWARD_RES, this._recvCumulativeRechargeRewardRes);
        this.addEventListener(gamesvr.CMD.ACTIVITY_AMOUNT_RECHARGE_RECHARGE_COUNT_NOTIFY, this._recvCumulativeRechargeCountNotify);

        this.addEventListener(gamesvr.CMD.ACTIVITY_RECHARGE_REBATE_OBTAIN_RES, this._recvRebateRechargeRes);
        
        this.addEventListener(gamesvr.CMD.ACTIVITY_DOUBLE_WEEK_RECEIVE_REWARD_RES, this._recvExchangeDoubleWeekRewardRes);
        this.addEventListener(gamesvr.CMD.ACTIVITY_DOUBLE_WEEK_BUY_GIFT_COUNT_NOTIFY, this._recvDoubleWeekBuyGiftCountNotify);

        this.addEventListener(gamesvr.CMD.ACTIVITY_MONTH_CARD_RECEIVE_DAY_REWARD_RES, this._recvMonthlyCardDayReward);
        this.addEventListener(gamesvr.CMD.ACTIVITY_MONTH_CARD_BUY_MONTH_CARD_NOTIFY, this._recvBuyMonthlyCardNotify);

        this.addEventListener(gamesvr.CMD.ACTIVITY_HERO_GROWUP_RECEIVE_REWARD_RES, this._recvTakeHeroDevelopRewardRes);

        this.addEventListener(gamesvr.CMD.ACTIVITY_ETERNAL_RECHARGE_RECEIVE_REWARD_RES, this._recvEnternalCumulativeRechargeRewardRes);
        this.addEventListener(gamesvr.CMD.ACTIVITY_ETERNAL_RECHARGE_RECHARGE_COUNT_NOTIFY, this._recvEnternalCumulativeRechargeCountNtf);
        
        this.addEventListener(gamesvr.CMD.ACTIVITY_FEAST_GIFT_RECEIVE_SURPRISE_REWARD_RES, this._recvActivityAmazingRewardRes);

        this.addEventListener(gamesvr.CMD.ACTIVITY_DOUBLE_WEEK_RECEIVE_DAY_REWARD_RES, this._recvDoubleWeekBattlePassRewards);
        this.addEventListener(gamesvr.CMD.ACTIVITY_DOUBLE_WEEK_BUY_DAY_ADVANCE_NOTIFY, this._recvBuyDoubleWeekBattlePassNty)

		// 至尊豪礼
        this.addEventListener(gamesvr.CMD.ACTIVITY_LUXURY_GIFT_BUY_GIFT_NOTIFY, this._recvLuxuryGiftBuyGiftNotify);
        this.addEventListener(gamesvr.CMD.ACTIVITY_LUXURY_GIFT_RECEIVE_REWARD_RES, this._recvActivityLuxuryGiftReceiveRewardRes);    }

    deInit() {
        eventCenter.unregisterAll(this);
    }

    getSpiritReq(id: number) {
        operationSvr.send(gamesvr.ActivitySpiritReceiveSpiritReq.create({
           GetPowerID: id
        }))
    }

    takeLevelRewardReq(id: number){
        operationSvr.send(gamesvr.ActivityLevelReceiveRewardReq.create({
            LevelRewardID: id
        }))
    }

    flopCardReq(cardSerial: number){
        operationSvr.send(gamesvr.ActivitySignInFlopCardReq.create({
            CardSerial: cardSerial
        }))
    }

    refreshHeroReq() {
        operationSvr.send(gamesvr.ActivitySignInRefreshHeroReq.create({
        }))
    }

    takeHeroReq() {
        operationSvr.send(gamesvr.ActivitySignInReceiveHeroReq.create({
        }))
    }

    takeSevenDayReward(activityId: number, idx: number) {
        operationSvr.send(gamesvr.ActivitySevenDayReceiveAnimateRewardReq.create({
            ActivityID: activityId,
            AnimateRewardIndex: idx
        }))
    }

    takeLoginReward(activityId: number, ids: number[]){
        operationSvr.send(gamesvr.ActivityOpenServiceLoginReceiveRewardReq.create({
            ActivityID: activityId,
            LoginRewardIndexList: ids
        }))
    }

    takeBattlePassReward(ids: number[]){
        operationSvr.send(gamesvr.ActivityBattlePassReceiveRewardReq.create({
            LevelList: ids
        }))
    }

    buyBattlePassLevel(level: number){
        operationSvr.send(gamesvr.ActivityBattlePassBuyLevelReq.create({
            BuyLevel: level
        }))
    }

    buyBattlePass(level: number) {
        operationSvr.send(gamesvr.BuyBattlePassReq.create({
            BuyLevel: level
        }))
    }

    takeLotteryReward(){
        operationSvr.send(gamesvr.ActivityDailyLotteryDepartReq.create({
        }))
    }

    /**
     * @description 领取每日充值奖励
     * @param period 活动期数   【cfg.ActivityList.ActiveListStage】
     * @param day 活动日期偏移  【activityData.dayRechargeData.GapDay】
     * @param numArray 编号列表 【cfg.ActivityDayRecharge.Num】
     */
    takeDayRechargeReward(period: number, day: number, numArray: number[]){
        operationSvr.send(gamesvr.ActivityDailyRechargeReceiveRewardReq.create({
            Period: period,
            GapDay: day,
            NumList: numArray
        }))
    }

    /**
     * @description 领取累计充值奖励
     * @param period 活动期数   【cfg.ActivityList.ActiveListStage】
     * @param numArray 编号列表 【cfg.ActivityCumulativeRecharge.Num】
     */
    takeCumulativeRechargeReward(period: number, numArray: number[]){
        operationSvr.send(gamesvr.ActivityAmountRechargeReceiveRewardReq.create({
            Period: period,
            NumList: numArray
        }))
    }

    /**
     * @description 领取永久累计充值奖励
     * @param period 活动期数   【cfg.ActivityList.ActiveListStage】
     * @param numArray 编号列表 【cfg.ActivityCumulativeRecharge.Num】
     */
     takeEnternalCumulativeRechargeReward(period: number, numArray: number[]){
        operationSvr.send(gamesvr.ActivityEternalRechargeReceiveRewardReq.create({
            Period: period,
            NumList: numArray
        }))
    }


    takeRebateRechargeCount(){
        operationSvr.send(gamesvr.ActivityRechargeRebateObtainReq.create({
        }))
    }

    exchangeDoubleWeekReward(factionId: number, order: number) {
        const seq = new gamesvr.ActivityDoubleWeekReceiveRewardReq({
            ID: factionId,
            ReceiveOrder: order
        });
        operationSvr.send(seq);
    }

    sendReceiveMonthlyCardDayReward(cardId: number) {
        const seq = new gamesvr.ActivityMonthCardReceiveDayRewardReq({
            FastenID: cardId
        });
        operationSvr.send(seq);
    }

    private _receiveSpiritRes(recvMsg: { Result: number, Desc: string, Msg: gamesvr.ActivitySpiritReceiveSpiritRes }) {
        if (!this._checkResValid(recvMsg)){
            return;
        }
        let msg = recvMsg.Msg;
        if (msg && msg.GetPowerID){
            activityData.updateSpiritData(msg.GetPowerID);
            eventCenter.fire(activityEvent.RECV_POWER_RES, msg);
        }
    }

    private _receiveSignInFlopRes(recvMsg: { Result: number, Desc: string, Msg: gamesvr.ActivitySignInFlopCardRes }) {
        if (!this._checkResValid(recvMsg)){
            return;
        }
        let msg = recvMsg.Msg;
        if (msg){
            activityData.updateSignInFlopData(msg);
            eventCenter.fire(activityEvent.RECV_SIGNIN_FLOP_RES, msg.Prizes, msg.CardSerial);
        }
    }

    private _receiveSignInHeroRes(recvMsg: { Result: number, Desc: string, Msg: gamesvr.ActivitySignInReceiveHeroRes }) {
        if (!this._checkResValid(recvMsg)) {
            return;
        }
        let msg = recvMsg.Msg;
        if (msg && msg.IsReceive) {
            activityData.updateSignInRecvData(msg);
            eventCenter.fire(activityEvent.RECV_SIGNIN_GET_HERO);
        }
    }

    private _receiveSignInRefreshRes(recvMsg: { Result: number, Desc: string, Msg: gamesvr.ActivitySignInRefreshHeroRes }) {
        if (!this._checkResValid(recvMsg)) {
            return;
        }
        let msg = recvMsg.Msg;
        if (msg && msg.SignInID) {
            activityData.updateSignInRefreshData(msg);
            eventCenter.fire(activityEvent.RECV_SIGNIN_HERO_CHANGE);
        }
    }

    private _receiveSignInChangeHeroNotify(recvMsg: { Result: number, Desc: string, Msg: gamesvr.ActivitySignInChangeHeroNotify }) {
        if (!this._checkResValid(recvMsg)) {
            return;
        }
        let msg = recvMsg.Msg;
        if (msg && msg.SignInID) {
            activityData.updateSignInRefreshData(msg);
            activityData.resetSignInData();
            eventCenter.fire(activityEvent.RECV_SIGNIN_HERO_CHANGE);
        }
    }

    private _receiveLevelRewardRes(recvMsg: { Result: number, Desc: string, Msg: gamesvr.ActivityLevelReceiveRewardRes }) {
        if (!this._checkResValid(recvMsg)){
            return;
        }
        let msg = recvMsg.Msg;
        if (msg && msg.LevelRewardID){
            activityData.updateLevelRewardMap(msg.LevelRewardID, msg.ReceiveOrdinaryReward, msg.ReceiveSpecialReward);
            eventCenter.fire(activityEvent.LEVEL_REWARD_TAKE, msg);
        }
    }

    private _receiveLevelRechargeNotify(recvMsg: { Result: number, Desc: string, Msg: gamesvr.ActivityLevelChangeRechargeAmountNotify }) {
        if (!this._checkResValid(recvMsg)){
            return;
        }
        let msg = recvMsg.Msg;
        if (msg && msg.RechargeAmount){
            activityData.updateLevelRechargeCount(msg.RechargeAmount);
            eventCenter.fire(activityEvent.LEVEL_RECHARGE_CHANGE);
        }
    }

    private _receiveSevenDayRewardRes(recvMsg: { Result: number, Desc: string, Msg: gamesvr.ActivitySevenDayReceiveAnimateRewardRes }){
        if (!this._checkResValid(recvMsg)) {
            return;
        }
        let msg = recvMsg.Msg;
        if (msg && msg.Prizes) {
            activityData.updateSevenDayRewardMap(msg);
            eventCenter.fire(activityEvent.SEVENDAY_REWARD_TAKE, msg.Prizes);
        }
    }

    private _receiveLoginRewardRes(recvMsg: { Result: number, Desc: string, Msg: gamesvr.ActivityOpenServiceLoginReceiveRewardRes }) {
        if (!this._checkResValid(recvMsg)) {
            return;
        }
        let msg = recvMsg.Msg;
        if (msg && msg.Prizes) {
            activityData.updateServiceLoginData(msg.ActivityID, msg.LoginRewardIndexList);
            eventCenter.fire(activityEvent.LOGIN_REWARD_TAKE, msg.Prizes);
        }
    }


    private _receiveBattlePassRewardRes(recvMsg: { Result: number, Desc: string, Msg: gamesvr.ActivityBattlePassReceiveRewardRes }) {
        if (!this._checkResValid(recvMsg)) {
            return;
        }
        let msg = recvMsg.Msg;
        if (msg && msg.Prizes) {
            activityData.updateBattlePassRewardData(msg.LevelList);
            eventCenter.fire(activityEvent.BATTLE_PASS_REWARD_TAKE, msg.Prizes);
        }
    }

    private _receiveBattlePassBuyLevelRes(recvMsg: { Result: number, Desc: string, Msg: gamesvr.ActivityBattlePassBuyLevelRes }) {
        if (!this._checkResValid(recvMsg)) {
            return;
        }
        let msg = recvMsg.Msg;
        if (msg) {
            eventCenter.fire(activityEvent.BATTLE_PASS_BUY_LEVEL);
        }
    }

    private _receiveBattlePassBuyLevelNotify(recvMsg: { Result: number, Desc: string, Msg: gamesvr.ActivityBattlePassBuyBattlePassNotify }) {
        if (!this._checkResValid(recvMsg)) {
            return;
        }
        let msg = recvMsg.Msg;
        if (msg) {
            activityData.updateBattlePassStatus(msg.BuyCount, msg.IsSpecial);
            eventCenter.fire(activityEvent.BATTLE_PASS_BUY, msg.IsSpecial);
        }
    }


    private _receivePhysicalRefreshNotify(recvMsg: { Result: number, Desc: string, Msg: gamesvr.ActivitySpiritLastRefreshSpTimeNotify }){
        if (!this._checkResValid(recvMsg)) {
            return;
        }
        let msg = recvMsg.Msg;
        if (msg) {
            activityData.updateSpiritRefreshTime(msg.LastRefreshSpTime);
            eventCenter.fire(activityEvent.SPIRIT_TIME_REFRESH);
        }
    }

    private _recvLotteryRes(recvMsg: { Result: number, Desc: string, Msg: gamesvr.ActivityDailyLotteryDepartRes }){
        if (!this._checkResValid(recvMsg)) {
            return;
        }
        let msg = recvMsg.Msg;
        if (msg) {
            activityData.updateLotteryData(msg);
            eventCenter.fire(activityEvent.LOTTERY_TAKE_RES, msg);
        }
    }


    private _recvLotteryNotify(recvMsg: { Result: number, Desc: string, Msg: gamesvr.ActivityDailyLotteryLotteryCountNotify }){
        if (!this._checkResValid(recvMsg)) {
            return;
        }
        let msg = recvMsg.Msg;
        if (msg) {
            activityData.updateLotteryCount(msg.CanLotteryCount, msg.DayRechargeCount);
            eventCenter.fire(activityEvent.LOTTERY_CHANGE_NOTIFY);
        }
    }

    private _recvDayRechargeRewardRes(recvMsg: { Result: number, Desc: string, Msg: gamesvr.ActivityDailyRechargeReceiveRewardRes }){
        if (!this._checkResValid(recvMsg)) {
            return;
        }
        let msg = recvMsg.Msg;
        if (msg) {
            activityData.updateDayRechargeData(msg);
            eventCenter.fire(activityEvent.DALIY_RECHARGE_TAKE_RES, msg);
        }
    }

    private _recvDayRechargeCountNotify(recvMsg: { Result: number, Desc: string, Msg: gamesvr.ActivityDailyRechargeDayRechargeCountNotify }){
        if (!this._checkResValid(recvMsg)) {
            return;
        }
        let msg = recvMsg.Msg;
        if (msg) {
            activityData.updateDayRechargeAmount(msg);
            eventCenter.fire(activityEvent.DALIY_RECHARGE_CHANGE_NOTIFY);
        }
    }

    private _recvCumulativeRechargeRewardRes(recvMsg: { Result: number, Desc: string, Msg: gamesvr.ActivityAmountRechargeReceiveRewardRes }){
        if (!this._checkResValid(recvMsg)) {
            return;
        }
        let msg = recvMsg.Msg;
        if (msg) {
            activityData.updateCulumativeRechargeData(msg);
            eventCenter.fire(activityEvent.CUMULATIVE_ECHARGE_TAKE_RES, msg);
        }
    }

    private _recvEnternalCumulativeRechargeRewardRes(recvMsg: { Result: number, Desc: string, Msg: gamesvr.ActivityEternalRechargeReceiveRewardRes }){
        if (!this._checkResValid(recvMsg)) {
            return;
        }
        let msg = recvMsg.Msg;
        if (msg) {
            activityData.updateEnternalRechargeData(msg);
            eventCenter.fire(activityEvent.RECV_ETERNAL_RECHARGE_RES, msg);
        }
    }

    private _recvEnternalCumulativeRechargeCountNtf(recvMsg: { Result: number, Desc: string, Msg: gamesvr.ActivityEternalRechargeRechargeCountNotify }){
        if (!this._checkResValid(recvMsg)) {
            return;
        }
        let msg = recvMsg.Msg;
        if (msg) {
            activityData.updateEternalCumulativeRechargeAmount(msg);
            eventCenter.fire(activityEvent.ERERNAL_RECHARGE_CHANGE_NTF);
        }
    }

    private _recvCumulativeRechargeCountNotify(recvMsg: { Result: number, Desc: string, Msg: gamesvr.ActivityAmountRechargeRechargeCountNotify }){
        if (!this._checkResValid(recvMsg)) {
            return;
        }
        let msg = recvMsg.Msg;
        if (msg) {
            activityData.updateCumulativeRechargeAmount(msg);
            eventCenter.fire(activityEvent.CUMULATIVE_RECHARGE_CHANGE_NOTIFY);
        }
    }

    private _recvRebateRechargeRes(recvMsg: { Result: number, Desc: string, Msg: gamesvr.ActivityRechargeRebateObtainRes }){
        if (!this._checkResValid(recvMsg)) {
            return;
        }
        let msg = recvMsg.Msg;
        if (msg) {
            eventCenter.fire(activityEvent.REBATE_RECHARGE_RES, msg);
        }
    }

    private _recvExchangeDoubleWeekRewardRes(recvMsg: { Result: number, Desc: string, Msg: gamesvr.ActivityDoubleWeekReceiveRewardRes }){
        if (!this._checkResValid(recvMsg)) {
            return;
        }
        let msg = recvMsg.Msg;
        activityData.updateDoubleWeekReward(msg.ID, msg.ReceiveOrder);
        eventCenter.fire(activityEvent.DOUBLE_WEEK_REWARD_EXCHANGE_SUC, msg.Prizes);
    }

    private _recvDoubleWeekBuyGiftCountNotify(recvMsg: { Result: number, Desc: string, Msg: gamesvr.ActivityDoubleWeekBuyGiftCountNotify }){
        if (!this._checkResValid(recvMsg)) {
            return;
        }
        let msg = recvMsg.Msg;
        activityData.updateDoubleWeekGift(msg.ActivityDoubleWeekBuyGiftCountList);
        eventCenter.fire(activityEvent.DOUBLE_WEEK_GIFT_BUY_SUC);
    }

    private _recvMonthlyCardDayReward(recvMsg: { Result: number, Desc: string, Msg: gamesvr.ActivityMonthCardReceiveDayRewardRes }){
        if (!this._checkResValid(recvMsg)) {
            return;
        }
        let msg = recvMsg.Msg;
        activityData.updateMonthlyCardDayReward(msg);
        eventCenter.fire(activityEvent.RECEIVE_MONTHLY_CARD_DAY_REWARD, msg);
    }

    private _recvBuyMonthlyCardNotify(recvMsg: { Result: number, Desc: string, Msg: gamesvr.ActivityMonthCardBuyMonthCardNotify }){
        if (!this._checkResValid(recvMsg)) {
            return;
        }
        let msg = recvMsg.Msg;
        activityData.updateMonthlyCardData(msg);
        eventCenter.fire(activityEvent.BUY_MONTHLY_CARD_SUC, msg);
    }

    private _onTimeReset(){
        activityData.updateSpiritData(null, true);
        activityData.clearLotteryUseCnt();
        activityData.clearDayRechargeData();
        eventCenter.fire(activityEvent.DALIY_DATA_CLEAR_NOTIFY);
    }

    private _onBattlePassReset(){
        activityData.clearBattlePassData();
    }

    // 领取英雄养成奖励
    sendTakeHeroDevelopReward(GrowUpID: number) {
        let req = gamesvr.ActivityHeroGrowupReceiveRewardReq.create({
          GrowUpID: GrowUpID
        });

        operationSvr.send(req);
    }

    private _recvTakeHeroDevelopRewardRes(recvMsg: { Result: number, Desc: string, Msg: gamesvr.IActivityHeroGrowupReceiveRewardRes }) {
        if (!this._checkResValid(recvMsg)) {
            return;
        }

        let msg = recvMsg.Msg;
        activityData.updateHeroGrowUpRewardData(msg.RewardGrowUpID);
        if (msg.TotalExp) {
            userData.updateExp(msg.TotalExp);
        }
        if(msg.Exp) {
            msg.Prizes = msg.Prizes || [];
            let isFind = msg.Prizes.some(ele => {
                if(ele.ID == CustomItemId.EXP) {
                    ele.Count = msg.Exp;
                    return true;
                }
                return false;
            });
            if(!isFind) {
                msg.Prizes.unshift({ ID: CustomItemId.EXP, Count: msg.Exp })
            }
        }
        eventCenter.fire(activityEvent.RECV_HERO_GROW_UP_REWARD, msg);
    }


    /**惊喜奖励请求*/
    activityAmazingRewardReq() {
        let req = gamesvr.ActivityFeastGiftReceiveSurpriseRewardReq.create({});
        operationSvr.send(req);
    }

    
    private _recvActivityAmazingRewardRes(recvMsg: { Result: number, Desc: string, Msg: gamesvr.IActivityFeastGiftReceiveSurpriseRewardRes }) {
        if (!this._checkResValid(recvMsg)) {
            return;
        }
        let msg = recvMsg.Msg;
        if (msg) {
            activityData.feastGiftData.ReceiveSurpriseReward = msg.ReceiveSurpriseReward;
            eventCenter.fire(activityEvent.RECV_FEAST_GIFT_RES, msg);
        }
    }

    /**礼包购买请求*/
    activityGiftBuyReq() {
        // let req = gamesvr.ActivityFE
    }

    // 领取双周活动战令奖励
    sendTakePrizesOfDoubleWeekBattlePass(atyID: number, rewardIDs: number[]) {
        let req = gamesvr.ActivityDoubleWeekReceiveDayRewardReq.create({
            ID: atyID,
            DayList: rewardIDs,
        });
        operationSvr.send(req);
    }

    private _recvDoubleWeekBattlePassRewards(recvMsg: { Result: number, Desc: string, Msg: gamesvr.IActivityDoubleWeekReceiveDayRewardRes}){
        if (!this._checkResValid(recvMsg)) {
            return;
        }
        let msg = recvMsg.Msg;
        activityData.updateDoubleWeekBattlePassRewardRecord(msg.ID, msg.DayList);
        if (msg.TotalExp) {
            userData.updateExp(msg.TotalExp);
        }
        if(msg.Exp) {
            msg.Prizes = msg.Prizes || [];
            let isFind = msg.Prizes.some(ele => {
                if(ele.ID == CustomItemId.EXP) {
                    ele.Count = msg.Exp;
                    return true;
                }
                return false;
            });
            if(!isFind) {
                msg.Prizes.unshift({ ID: CustomItemId.EXP, Count: msg.Exp })
            }
        }
        eventCenter.fire(activityEvent.DOUBLE_WEEK_TAKE_BATTLE_PASS_REWARD, msg.ID, msg.DayList, msg.Prizes);
    }

    // 购买双周活动战令的通知
    private _recvBuyDoubleWeekBattlePassNty(recvMsg: { Result: number, Desc: string, Msg: gamesvr.IActivityDoubleWeekBuyDayAdvanceNotify}){
      if (!this._checkResValid(recvMsg)) {
          return;
      }
      let msg = recvMsg.Msg;
      activityData.updateDoubleWeekBattlePassBuyRecord(msg.ID);
      eventCenter.fire(activityEvent.DOUBLE_WEEK_BUY_BATTLE_PASS_NTY, msg.ID);
  }

	// --------------------- 至尊豪礼 ---------------------
    private _recvLuxuryGiftBuyGiftNotify(recvMsg: { Result: number, Desc: string, Msg: gamesvr.IActivityLuxuryGiftBuyGiftNotify }) {
        if (!this._checkResValid(recvMsg)) {
            return;
        }

        let msg = recvMsg.Msg;
        activityData.luxuryGiftData.BuyGift = msg.BuyGift;
        activityData.luxuryGiftData.ReceiveRewardMap = {};
        eventCenter.fire(activityEvent.LUXURY_GIFT_BUY_GIFT_NOTIFY, msg);
    }

    // 领取至尊豪礼奖励
    reqActivityLuxuryGiftReceiveReward(dayList: number[]) {
        let req = gamesvr.ActivityLuxuryGiftReceiveRewardReq.create({
            ReceiveDayList: dayList
        });

        operationSvr.send(req);
    }

    private _recvActivityLuxuryGiftReceiveRewardRes(recvMsg: { Result: number, Desc: string, Msg: gamesvr.IActivityLuxuryGiftReceiveRewardRes }) {
        if (!this._checkResValid(recvMsg)) {
            return;
        }
        
        let msg = recvMsg.Msg;
        msg.ReceiveDayList.forEach((day) => {
            activityData.luxuryGiftData.ReceiveRewardMap[day] = true;
        });

        msg.TotalExp && userData.updateExp(msg.TotalExp);
        
        eventCenter.fire(activityEvent.LUXURY_GIFT_RECEIVE_REWARD_RES, msg);
    }
}
let activityOpt = new ActivityOpt();
export {
    activityOpt
}
