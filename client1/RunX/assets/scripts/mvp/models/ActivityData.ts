import { activityUtils } from "../../app/ActivityUtils";
import { utils } from "../../app/AppUtils";
import { configUtils } from "../../app/ConfigUtils";
import { configManager } from "../../common/ConfigManager";
import { cfg } from "../../config/config";
import { data, gamesvr } from "../../network/lib/protocol";
import BaseModel from "./BaseModel";

class ActivityData extends BaseModel {

    private _activityData: data.IActivityData = {};

    get spiritData () { return this._activityData.ActivitySpiritData; }

    get levelData (){ return this._activityData.ActivityLevelData; }

    get signInData () { return this._activityData.ActivitySignInData; }

    get sevenDayData () { return this._activityData.ActivitySevenDayData; }

    get serviceLoginData () { return this._activityData.ActivityOpenServiceLoginData; }

    get battlePassData () { return this._activityData.ActivityBattlePassData;}

    get lotteryData () { return this._activityData.ActivityDailyLotteryData; }
    
    get dayRechargeData () { return this._activityData.ActivityDailyRechargeData; }

    get cumulativeRechargeData () { return this._activityData.ActivityAmountRechargeData; }

    get doubleWeekData () { return this._activityData.ActivityDoubleWeekData; }

    get monthlyCardData() { return this._activityData.ActivityMonthCardData; }
    
    get onlineRewardData() { return this._activityData.ActivityOnlineReward; }

    get firstChargeData() {return this._activityData.ActivityFirstChargeData}

    get heroGrowUpData() { return this._activityData.ActivityHeroGrowUpData }
    
    get eterRechargeData() { return this._activityData.ActivityEternalRechargeData; }

    get feastGiftData() { return this._activityData.ActivityFeastGiftData; }

    get luxuryGiftData() { return this._activityData.ActivityLuxuryGiftData; }

    init() { }

    deInit () {
        this._activityData = {
            ActivitySpiritData: {},
            ActivityLevelData: {},
            ActivitySignInData: {},
            ActivitySevenDayData: {},
            ActivityOpenServiceLoginData: {},
            ActivityBattlePassData: {},
            ActivityDailyLotteryData: {},
            ActivityDailyRechargeData: {},
            ActivityAmountRechargeData: {},
            ActivityDoubleWeekData: {},
            ActivityMonthCardData: {},
            ActivityOnlineReward: {},
            ActivityEternalRechargeData: {},
            ActivityLuxuryGiftData: {}

        }
    }

    initActivityData(res: data.IActivityData){
        if (res){
            this._activityData = res;
        }
    }

    onDayReset() {
        this.clearDoubleWeekData();
    }
    
    updateSpiritData(powerId: number, reset?: boolean){
        if (this.spiritData && !reset){
            let spiritMap = this.spiritData.ReceiveSpiritMap;
            spiritMap[powerId.toString()] = true;
        } else if (this.spiritData) {
            this.spiritData.ReceiveSpiritMap = {};
        }
    }

    updateLevelRechargeCount(rechargeCount: number){
        if (this.levelData){
            this.levelData.RechargeAmount = rechargeCount;
        }
    }

    updateLevelRewardMap(levelId: number, ordinary: boolean, special: boolean){
        if (this.levelData && levelId){
            this.levelData.ReceiveOrdinaryRewardMap[levelId] = ordinary;
            this.levelData.ReceiveSpecialRewardMap[levelId] = special;
        }
    }

    updateSignInFlopData(signInFlopRes: gamesvr.ActivitySignInFlopCardRes){
        if (this.signInData && signInFlopRes){
            this.signInData.FlopCardMap[signInFlopRes.CardSerial] = signInFlopRes.CardTime;
            this.signInData.ReceiveRewardMap[signInFlopRes.SignInID] = true;
        }
    }

    updateSignInRecvData(signInRecvRes: gamesvr.ActivitySignInReceiveHeroRes) {
        if (this.signInData && signInRecvRes) {
            this.signInData.IsReceive = signInRecvRes.IsReceive;
        }
    }

    updateSignInRefreshData(signInRefreshRes: gamesvr.ActivitySignInRefreshHeroRes) {
        if (this.signInData && signInRefreshRes) {
            this.signInData.SignInID = signInRefreshRes.SignInID;
        }
    }

    resetSignInData(){
        if (this.signInData){
            this.signInData.IsReceive = false;
            this.signInData.FlopCardMap = {};
            this.signInData.ReceiveRewardMap = {};
        }
    }

    updateSevenDayRewardMap(sevenDayRewardRes: gamesvr.ActivitySevenDayReceiveAnimateRewardRes){
        let activityId = sevenDayRewardRes.ActivityID;
        let rewardIdx = sevenDayRewardRes.AnimateRewardIndex;
        if (!this._activityData.ActivitySevenDayData.ActivitySevenDayActivityMap[activityId]){
            this._activityData.ActivitySevenDayData.ActivitySevenDayActivityMap[activityId] = { ReceiveAnimateRewardMap: {[rewardIdx] : true}};
        } else {
            this._activityData.ActivitySevenDayData.ActivitySevenDayActivityMap[activityId].ReceiveAnimateRewardMap[rewardIdx.toString()] = true;
        }
    }

    updateServiceLoginData(activityId: number, index: number|number[]){
        if (this.serviceLoginData){
            if (!this.serviceLoginData.ActivityOpenServiceLoginActivityMap){
                this.serviceLoginData.ActivityOpenServiceLoginActivityMap = {};
            }
            if (!this.serviceLoginData.ActivityOpenServiceLoginActivityMap[activityId]){
                this.serviceLoginData.ActivityOpenServiceLoginActivityMap[activityId] = {ReceiveLoginRewardMap: {}};
            }
            if (typeof(index) == "object" && index.length){
                index.forEach(_i =>{
                    this.serviceLoginData.ActivityOpenServiceLoginActivityMap[activityId].ReceiveLoginRewardMap[_i] = true;
                })
            } else if (typeof(index) == "number"){
                this.serviceLoginData.ActivityOpenServiceLoginActivityMap[activityId].ReceiveLoginRewardMap[index] = true;
            }
        }
    }

    updateBattlePassRewardData(levelList: number[]){
        if (this.battlePassData){
            levelList.forEach(level => {
                this.battlePassData.ReceiveNormalReward[level] = true;
                this.battlePassData.ReceiveSpecialReward[level] = this.battlePassData.IsSpecial;
            }) 
        }
    }

    updateBattlePassStatus(buyTimes: number, isSpecial: boolean){
        if (this.battlePassData){
            if (buyTimes) 
                this.battlePassData.BuyCount = buyTimes;
            if (isSpecial)
                this.battlePassData.IsSpecial = isSpecial;
        }
    }

    updateSpiritRefreshTime(time: any) {
        if (this.spiritData && time) {
            this.spiritData.LastRefreshSpTime = time;
        }
    }

    updateLotteryData(data: gamesvr.ActivityDailyLotteryDepartRes){
        if (this.lotteryData && data){
            if (data.Period)
                this.lotteryData.Period = data.Period;
            if (data.UseLotteryCount)
                this.lotteryData.UseLotteryCount = data.UseLotteryCount;
            if (this.lotteryData.CanLotteryCount)
                this.lotteryData.CanLotteryCount -= 1;
            if (!this.lotteryData.ReceiveRewardMap)
                this.lotteryData.ReceiveRewardMap = {};
            if (data.ID)
                this.lotteryData.ReceiveRewardMap[data.ID] = true;
        }

        //抽满八次自动重置
        let MAX_COUNT = 8; let receiveCnt = 0; 
        for (let k in this.lotteryData.ReceiveRewardMap){
            if (this.lotteryData.ReceiveRewardMap[k]){
                receiveCnt += 1;
            }
        }
        if (receiveCnt == MAX_COUNT){
            this.lotteryData.ReceiveRewardMap = {};
        }
    }

    updateLotteryCount(count: number, rechargeCnt: number){
        if (this.lotteryData) {
            this.lotteryData.CanLotteryCount = count || 0;
            this.lotteryData.DayRechargeCount = rechargeCnt || 0;
        }
    }

    updateDayRechargeData(data: gamesvr.ActivityDailyRechargeReceiveRewardRes){
        if (this.dayRechargeData){
            if (!this.dayRechargeData.ActivityDailyRechargePeriodMap){
                this.dayRechargeData.ActivityDailyRechargePeriodMap = {};
            }
            if (data.Period && !this.dayRechargeData.ActivityDailyRechargePeriodMap[data.Period]){
                this.dayRechargeData.ActivityDailyRechargePeriodMap[data.Period] = {
                    DayReceiveRewardMap: {}
                };
            }

            let rechargePeriodData = this.dayRechargeData.ActivityDailyRechargePeriodMap[data.Period];
            if (data.GapDay){
                rechargePeriodData.GapDay = data.GapDay;
            }
            if (data.NumList){
                if (!rechargePeriodData.DayReceiveRewardMap) {
                    rechargePeriodData.DayReceiveRewardMap = {};
                }
                data.NumList.forEach(_num =>{
                    rechargePeriodData.DayReceiveRewardMap[_num] = true;
                })
            }
        }
    }

    updateDayRechargeAmount(data: gamesvr.ActivityDailyRechargeDayRechargeCountNotify){
        if (this.dayRechargeData) {
            let period = activityUtils.getRechargeActivityPeriod();
            if (!this.dayRechargeData.ActivityDailyRechargePeriodMap) {
                this.dayRechargeData.ActivityDailyRechargePeriodMap = {};
            }

            if (!this.dayRechargeData.ActivityDailyRechargePeriodMap[period]){
                this.dayRechargeData.ActivityDailyRechargePeriodMap[period] = {};
            }

            //只更新当前期数据，活动唯一性由策划控制 
            if (period && data.PeriodDayRechargeMap[period]) {
                this.dayRechargeData.ActivityDailyRechargePeriodMap[period].DayRechargeCount = data.PeriodDayRechargeMap[period];
            }
        }
    }

    updateCulumativeRechargeData(data: gamesvr.ActivityAmountRechargeReceiveRewardRes) {
        if (this.cumulativeRechargeData) {
            if (!this.cumulativeRechargeData.ActivityAmountRechargePeriodMap) {
                this.cumulativeRechargeData.ActivityAmountRechargePeriodMap = {};
            }
            if (data.Period && !this.cumulativeRechargeData.ActivityAmountRechargePeriodMap[data.Period]) {
                this.cumulativeRechargeData.ActivityAmountRechargePeriodMap[data.Period] = {
                    ReceiveRewardMap: {}
                };
            }

            let rechargePeriodData = this.cumulativeRechargeData.ActivityAmountRechargePeriodMap[data.Period];
            if (data.NumList) {
                if (!rechargePeriodData.ReceiveRewardMap){
                    rechargePeriodData.ReceiveRewardMap = {};
                }
                data.NumList.forEach(_num => {
                    rechargePeriodData.ReceiveRewardMap[_num] = true;
                })
            }
        }
    }

    updateEnternalRechargeData(data: gamesvr.ActivityEternalRechargeReceiveRewardRes) {
        let rechargePeriodData = this.eterRechargeData.ActivityEternalRechargePeriodMap[data.Period];
        if (data.NumList) {
            if (!rechargePeriodData.ReceiveRewardMap){
                rechargePeriodData.ReceiveRewardMap = {};
            }
            data.NumList.forEach(_num => {
                rechargePeriodData.ReceiveRewardMap[_num] = true;
            })
        }
    }

    updateCumulativeRechargeAmount(data: gamesvr.ActivityAmountRechargeRechargeCountNotify) {
        if (this.cumulativeRechargeData) {
            let period = activityUtils.getCumulativeRechargeActivityPeriod();
            if (!this.cumulativeRechargeData.ActivityAmountRechargePeriodMap) {
                this.cumulativeRechargeData.ActivityAmountRechargePeriodMap = {};
            }

            if (!this.cumulativeRechargeData.ActivityAmountRechargePeriodMap[period]) {
                this.cumulativeRechargeData.ActivityAmountRechargePeriodMap[period] = {};
            }

            //只更新当前期数据，活动唯一性由策划控制 
            if (period && data.PeriodRechargeMap[period]) {
                this.cumulativeRechargeData.ActivityAmountRechargePeriodMap[period].RechargeCount = data.PeriodRechargeMap[period];
            }
        }
    }

    updateEternalCumulativeRechargeAmount(data:gamesvr.ActivityEternalRechargeRechargeCountNotify) {
        if (this.eterRechargeData) {
            let period = activityUtils.getCumulativeRechargeActivityPeriod(16) || 0;
            if (!this.eterRechargeData.ActivityEternalRechargePeriodMap) {
                this.eterRechargeData.ActivityEternalRechargePeriodMap = {};
            }

            if (!this.eterRechargeData.ActivityEternalRechargePeriodMap[period]) {
                this.eterRechargeData.ActivityEternalRechargePeriodMap[period] = {};
            }

            if (data.PeriodRechargeMap[period]) {
                this.eterRechargeData.ActivityEternalRechargePeriodMap[period].RechargeCount = data.PeriodRechargeMap[period];
            }
        }
    }

    updateDoubleWeekReward(activityId: number, order: number) {
        if(!this._activityData.ActivityDoubleWeekData.ActivityDoubleWeekFunctionMap[activityId]) {
            this._activityData.ActivityDoubleWeekData.ActivityDoubleWeekFunctionMap[activityId] = new data.ActivityDoubleWeekFunction();
        }
        this._activityData.ActivityDoubleWeekData.ActivityDoubleWeekFunctionMap[activityId].ReceiveOrderMap[order] = true;
    }

    updateDoubleWeekGift(list: gamesvr.IActivityDoubleWeekBuyGiftCount[]) {
        for(let i = 0; i < list.length; ++i) {
            const item = list[i];
            if(!this._activityData.ActivityDoubleWeekData.ActivityDoubleWeekFunctionMap[item.ID]) {
                this._activityData.ActivityDoubleWeekData.ActivityDoubleWeekFunctionMap[item.ID] = new data.ActivityDoubleWeekFunction();
            }
            this._activityData.ActivityDoubleWeekData.ActivityDoubleWeekFunctionMap[item.ID].BuyGiftMap[item.ShopID] = Number(item.Count);
        }
    }

    updateMonthlyCardData(msg: gamesvr.ActivityMonthCardBuyMonthCardNotify) {
        const cardId = msg.FastenID;
        if(!this._activityData.ActivityMonthCardData) {
            this._activityData.ActivityMonthCardData = new data.ActivityMonthCardData();
        }
        if(!this._activityData.ActivityMonthCardData.ActivityMonthCardFastenMap[cardId]) {
            this._activityData.ActivityMonthCardData.ActivityMonthCardFastenMap[cardId] = new data.ActivityMonthCardFasten();
        }
        this._activityData.ActivityMonthCardData.ActivityMonthCardFastenMap[cardId].ExpiredTime = msg.ExpiredTime;
        this._activityData.ActivityMonthCardData.ActivityMonthCardFastenMap[cardId].LastReceiveGetRewardTime = msg.LastReceiveGetRewardTime;

        // 更新购买历史
        if (!this._activityData.ActivityMonthCardData.HistoryBuyMonthCardMap) {
            this._activityData.ActivityMonthCardData.HistoryBuyMonthCardMap = {};
        }
        this._activityData.ActivityMonthCardData.HistoryBuyMonthCardMap[cardId] = true;
    }

    updateMonthlyCardDayReward(msg: gamesvr.ActivityMonthCardReceiveDayRewardRes) {
        const cardId = msg.FastenID;
        if(!this._activityData.ActivityMonthCardData) {
            this._activityData.ActivityMonthCardData = new data.ActivityMonthCardData();
        }
        if(!this._activityData.ActivityMonthCardData.ActivityMonthCardFastenMap[cardId]) {
            this._activityData.ActivityMonthCardData.ActivityMonthCardFastenMap[cardId] = new data.ActivityMonthCardFasten();
        }
        this._activityData.ActivityMonthCardData.ActivityMonthCardFastenMap[cardId].LastReceiveGetRewardTime = msg.LastReceiveGetRewardTime;
    }

    // 首充活动奖励
    updateFirstChargeReward(rewardRecord: number[]) {
        this._activityData.ActivityFirstChargeData = this._activityData.ActivityFirstChargeData || {};
        this._activityData.ActivityFirstChargeData.RewardRecord = rewardRecord;
    }

    // 更新英雄养成活动奖励
    updateHeroGrowUpRewardData(growUpID: number) {
        this._activityData.ActivityHeroGrowUpData = this._activityData.ActivityHeroGrowUpData || {};
        this._activityData.ActivityHeroGrowUpData.ActivityHeroGrowUpUnitMap = this._activityData.ActivityHeroGrowUpData.ActivityHeroGrowUpUnitMap || {};
        let heroGrowUpCfg: cfg.ActivityHeroGrowUp = configUtils.getActivityHeroGrowUpCfgByGID(growUpID);
        if(!heroGrowUpCfg) return;
        let round = `${heroGrowUpCfg.ActivityHeroGrowUpRound}`;
        let data = this._activityData.ActivityHeroGrowUpData.ActivityHeroGrowUpUnitMap[round] = (this._activityData.ActivityHeroGrowUpData.ActivityHeroGrowUpUnitMap[round] || {});
        data.ReceiveOrderMap = data.ReceiveOrderMap || {};
        data.ReceiveOrderMap[`${heroGrowUpCfg.ActivityHeroGrowUpOrder}`] = true;
    }

    // 更新英雄养成活动礼包
    updateHeroGrowUpGiftData(growUpID: number, giftBagID:number) {
        this._activityData.ActivityHeroGrowUpData = this._activityData.ActivityHeroGrowUpData || {};
        this._activityData.ActivityHeroGrowUpData.ActivityHeroGrowUpUnitMap = this._activityData.ActivityHeroGrowUpData.ActivityHeroGrowUpUnitMap || {};
        let heroGrowUpCfg: cfg.ActivityHeroGrowUp = configUtils.getActivityHeroGrowUpCfgByGID(growUpID);
        if(!heroGrowUpCfg) return;
        let round = `${heroGrowUpCfg.ActivityHeroGrowUpRound}`;
        let data = this._activityData.ActivityHeroGrowUpData.ActivityHeroGrowUpUnitMap[round] = (this._activityData.ActivityHeroGrowUpData.ActivityHeroGrowUpUnitMap[round] || {});
        data.BuyGiftMap = data.BuyGiftMap || {};
        let oldCnt = data.BuyGiftMap[`${giftBagID}`] || 0;
        data.BuyGiftMap[`${giftBagID}`] =  oldCnt + 1;
    }

    //  更新双周活动战令领取记录
    updateDoubleWeekBattlePassRewardRecord(atyID: number, lastTokenRecord: number[]) {
        if(!lastTokenRecord || lastTokenRecord.length == 0) return;
        this._activityData.ActivityDoubleWeekData = this._activityData.ActivityDoubleWeekData || {};
        this._activityData.ActivityDoubleWeekData.ActivityDoubleWeekFunctionMap = this._activityData.ActivityDoubleWeekData.ActivityDoubleWeekFunctionMap || {};

        if(!this._activityData.ActivityDoubleWeekData.ActivityDoubleWeekFunctionMap[`${atyID}`]) {
            this._activityData.ActivityDoubleWeekData.ActivityDoubleWeekFunctionMap[`${atyID}`] = new data.ActivityDoubleWeekFunction();
        }

        let atyData = this._activityData.ActivityDoubleWeekData.ActivityDoubleWeekFunctionMap[`${atyID}`];
        atyData.ReceiveNormalReward = atyData.ReceiveNormalReward || {};
        atyData.ReceiveSpecialReward = atyData.ReceiveSpecialReward || {};
        lastTokenRecord.forEach(ele => {
            atyData.ReceiveNormalReward[`${ele}`] = true;
            atyData.IsSpecial && (atyData.ReceiveSpecialReward[`${ele}`] = true);
        })
    }

    // 更新双周活动战令购买记录
    updateDoubleWeekBattlePassBuyRecord(atyID: number) {
        this._activityData.ActivityDoubleWeekData = this._activityData.ActivityDoubleWeekData || {};
        this._activityData.ActivityDoubleWeekData.ActivityDoubleWeekFunctionMap = this._activityData.ActivityDoubleWeekData.ActivityDoubleWeekFunctionMap || {};
        let data = this._activityData.ActivityDoubleWeekData.ActivityDoubleWeekFunctionMap[`${atyID}`] = this._activityData.ActivityDoubleWeekData.ActivityDoubleWeekFunctionMap[`${atyID}`] || {};
        data.IsSpecial = true;
    }

    clearBattlePassData(){
        if (this.battlePassData){
            let moduleCfg = configUtils.getModuleConfigs();
            let maxCnt = moduleCfg.BattlePassForeverNeed || 0;
            this.battlePassData.IsSpecial = maxCnt && this.battlePassData.BuyCount == maxCnt;
            this.battlePassData.ReceiveNormalReward = {};
            this.battlePassData.ReceiveSpecialReward = {};
        }
    }

    clearLotteryUseCnt(){
        if (this.lotteryData) {
            this.lotteryData.UseLotteryCount = 0;
            this.lotteryData.CanLotteryCount = 0;
            this.lotteryData.DayRechargeCount = 0;
        }
    }

    clearDayRechargeData() {
        if (this.dayRechargeData && this.dayRechargeData.ActivityDailyRechargePeriodMap) {
            let rechargeDataMap = this.dayRechargeData.ActivityDailyRechargePeriodMap;
            let period = activityUtils.getRechargeActivityPeriod();
            if (rechargeDataMap[period]){
                rechargeDataMap[period].DayRechargeCount = 0;
                rechargeDataMap[period].DayReceiveRewardMap = {};
            }
        }
    }

    clearDoubleWeekData() {
        const todayTime = utils.getTodayZeroTime(true);
        let clearActivities: number[] = [];
        const configs: cfg.ActivityWeekSummonList[] = configManager.getConfigList('doubleWeekList');
        for(let i = 0; i < configs.length; ++i) {
            const cfg = configs[i];
            const activityTimes = activityUtils.calBeginEndTime(cfg.OpenTime, cfg.HoldTime);
            const endTime = activityTimes[1];
            if(Math.abs(endTime - todayTime) <= 10) {
                clearActivities.push(cfg.ID);
            }
        }
        // 充值双周活动
        for(let i = 0; i < clearActivities.length; ++i) {
            const activityId = clearActivities[i];
            const doubleWeekData = this._activityData.ActivityDoubleWeekData.ActivityDoubleWeekFunctionMap[activityId];
            if(doubleWeekData) {
                this._activityData.ActivityDoubleWeekData.ActivityDoubleWeekFunctionMap[activityId].BuyGiftMap = {};
                this._activityData.ActivityDoubleWeekData.ActivityDoubleWeekFunctionMap[activityId].ReceiveOrderMap = {};
            }
        }
    }


    updateEterRecharge(data: gamesvr.IActivityEternalRechargeRechargeCountNotify) {
        let daat = data;
    }
}

let activityData = new ActivityData();
export { activityData }