import { configCache } from "../common/ConfigCache";
import { configManager } from "../common/ConfigManager";
import { cfg } from "../config/config";
import { activityData } from "../mvp/models/ActivityData";
import { bagData } from "../mvp/models/BagData";
import { serverTime } from "../mvp/models/ServerTime";
import { taskData } from "../mvp/models/TaskData";
import { userData } from "../mvp/models/UserData";
import { ACTIVITY_PREVIEW_FUNC_ID, CustomDialogId, CustomItemId } from "./AppConst";
import { utils } from "./AppUtils";
import { configUtils } from "./ConfigUtils";

export class ActivityUtils {

    /**
     * @description 开服七天乐活动时间
     * @param activityId 
     * @returns 
     */
    calSevenDayTime(activityId: number) {
        let sevenCfg: cfg.ActivitySevenDayTask = configManager.getConfigByKey('sevenDay', activityId);
        let beginTime = 0, endTime = 0;
        if (sevenCfg) {
            return this.calBeginEndTime(sevenCfg.ActivitySevenDayTaskOpenTime, sevenCfg.ActivitySevenDayTaskHoldTime);
        }
        return [beginTime, endTime];
    }
    /**
       * @description 七天登录活动时间
       * @param activityId
       * @returns
       */
    calActivityTime(activityId: number){
        let activityCfg: cfg.ActivityList = configManager.getConfigByKey('activityList', activityId);
        let beginTime = 0, endTime = 0;
        if (activityCfg) {
            return this.calBeginEndTime(activityCfg.ActiveListBeginTime, activityCfg.ActiveListHoldTime);
        }
        return [beginTime, endTime];
    }

    calLoginRewardTime(activityListId: number){
        let cfg = configManager.getConfigList('activityList').find((_cfg) =>{
            return _cfg.ActiveListFunctionID == activityListId
        })
        return this.calActivityTime(cfg ? cfg.ActiveListID : 0);
    }

    checkSevenDayOpen(activityId: number){
        let currTime = serverTime.currServerTime();
        let timeArr = this.calSevenDayTime(activityId);
        if (timeArr && timeArr[0] && currTime) {
            return timeArr[0] < currTime && (!timeArr[1] || currTime < timeArr[1]);
        }
        return true;
    }

    checkActivityOpen(activityId: number) {
        let activityCfg: cfg.ActivityList = configManager.getConfigByKey('activityList', activityId);
        let currTime = serverTime.currServerTime();
        let timeArr = this.calActivityTime(activityId);
        let isOpen = true;
        if (timeArr && timeArr[0] && currTime) {
            isOpen = timeArr[0] < currTime && (!timeArr[1] || currTime < timeArr[1]);
        }
        if(activityCfg.ActiveListFunctionID == ACTIVITY_PREVIEW_FUNC_ID) {
            let atyPreviewable = this.getActivityPreviewableCfg();
            isOpen &&= (atyPreviewable && atyPreviewable.length > 0);
        }
        return isOpen;
    }

    // 获取可预览的预览活动配置
    getActivityPreviewableCfg():cfg.ActivityNextShow[] {
        let previews: cfg.ActivityNextShow[] = null;
        let activityShowIDs = configCache.getActivityPreviewCfgs();
        if(!activityShowIDs || activityShowIDs.length == 0) return previews;
        let currTime = serverTime.currServerTime();
        activityShowIDs.forEach(ele => {
            let atyPreivewCfg: cfg.ActivityNextShow = configManager.getConfigByKey('activityPreview', ele)
            if(!atyPreivewCfg.ActivityNextShowBegin || !atyPreivewCfg.ActivityNextShowOpenTime) return;
            let startTimes = utils.parseStringTo1Arr(atyPreivewCfg.ActivityNextShowBegin, ';');
            let startTime = new Date(parseInt(startTimes[0]), parseInt(startTimes[1]) - 1, parseInt(startTimes[2])).getTime() / 1000;
            if(startTime >= currTime) return;
            let endTimes = utils.parseStringTo1Arr(atyPreivewCfg.ActivityNextShowOpenTime, '/');
            let endTime = new Date(parseInt(endTimes[0]), parseInt(endTimes[1]) - 1, parseInt(endTimes[2])).getTime() / 1000;
            if(endTime <= currTime) return;
            previews = previews || [];
            previews.push(atyPreivewCfg);
        });
        return previews;
    }

    getServiceLoginActivityId(){
        let cfgs: cfg.ActivityList[] = configManager.getConfigList("activityList");
        for(let k in cfgs){
            let cfg = cfgs[k];
            if (cfg.ActiveListFunctionID == 37001 && this.checkActivityOpen(cfg.ActiveListID)){
                return cfg.ActiveListFunctionID;
            }
        }
        return 0;
    }

    /**
     * @description 每日充值
     * @param activityId 
     * @returns 
     */
    getRechargeActivityPeriod(activityId?: number){
        // 无指定活动Id，默认选开放活动内第一个
        if (activityId) {
            let cfg: cfg.ActivityList = configManager.getConfigByKey("activityList", activityId);
            if (cfg) {
                return cfg.ActiveListStage || 0;
            }
        } else {
            let cfgs: cfg.ActivityList[] = configManager.getConfigList("activityList");
            for (let k in cfgs) {
                let cfg = cfgs[k];
                if (cfg.ActiveListFunctionID == 39000 && this.checkActivityOpen(cfg.ActiveListID)) {
                    return cfg.ActiveListStage;
                }
            }
        }

        return 0;
    }

    /**
     * @description 累计充值
     * @param activityId 
     * @returns 
     */
    getCumulativeRechargeActivityPeriod(activityId?: number){
        // 无指定活动Id，默认选开放活动内第一个
        if (activityId) {
            let cfg: cfg.ActivityList = configManager.getConfigByKey("activityList", activityId);
            if (cfg) {
                return cfg.ActiveListStage;
            }
        } else {
            let cfgs: cfg.ActivityList[] = configManager.getConfigList("activityList");
            for (let k in cfgs) {
                let cfg = cfgs[k];
                if (cfg.ActiveListFunctionID == 40000 && this.checkActivityOpen(cfg.ActiveListID)) {
                    return cfg.ActiveListStage;
                }
            }
        }

        return 0;
    }
    
    //获取每日充值充值活动中未领取奖励的项
    getPerDayRechargeAtyIWithNotGet(activityId?: number) :number[]{
        let period = this.getRechargeActivityPeriod(activityId);
        if(!period) return null;
        let nowDay = this.getDayRechargeActivityDay(activityId); // 本周第几天
        let cfgs = configManager.getConfigList("dayRecharge").filter((_cfg: cfg.ActivityDayRecharge)=>{
            if (period && nowDay && (period == _cfg.Stage) && (nowDay == _cfg.Day)){
                return true;
            } 
            return false;
        });
        if(!cfgs) return null;
        let nums: number[] = null;
        let rechargeData = activityData.dayRechargeData ? activityData.dayRechargeData.ActivityDailyRechargePeriodMap[period] : null;
        cfgs.forEach(_cfg =>{
            let isRewarded = rechargeData && rechargeData.DayReceiveRewardMap && rechargeData.DayReceiveRewardMap[_cfg.Num];
            let curCount = (rechargeData ? rechargeData.DayRechargeCount : 0);
            let targetCount = Number(_cfg.NeedMoney || 0);
            let isCompleted = curCount >= targetCount;
            if (!isRewarded && isCompleted){
                nums = nums || [];
                nums.push(_cfg.Num);
            }
        })
        return nums;
    }

    getEternalCumulativeRechargeAtysWithNotGet(activityId?: number) {
        let period = this.getCumulativeRechargeActivityPeriod(activityId) || 0;
        let rechargeData = activityData.eterRechargeData ? activityData.eterRechargeData.ActivityEternalRechargePeriodMap[period] : null;
        let curCount = rechargeData? rechargeData.RechargeCount || 0 : 0;
        let cfgs = configManager.getConfigList("cumulativeRecharge").filter((_cfg: cfg.ActivityCumulativeRecharge)=>{
            if (_cfg.Stage == 0 && curCount >= (_cfg.ShowNeed || 0)) {
                return true;
            } 
            return false;
        });
        if(!cfgs) return null;
        let nums: number[] = null;
        cfgs.forEach(_cfg =>{
            let isRewarded = rechargeData && rechargeData.ReceiveRewardMap && rechargeData.ReceiveRewardMap[_cfg.Num];
            let curCount = (rechargeData ? rechargeData.RechargeCount : 0);
            let targetCount = Number(_cfg.NeedMoney || 0);
            let isCompleted = curCount >= targetCount;
            if (!isRewarded && isCompleted){
                nums = nums || [];
                nums.push(_cfg.Num);
            }
        });
        return nums;      
    }

    //获取累计充值活动中未领取奖励的项
    getCumulativeRechargeAtysWithNotGet(activityId?: number): number[]{
        let period = this.getCumulativeRechargeActivityPeriod(activityId);
        if(!period) return null;
        let rechargeData = activityData.cumulativeRechargeData ? activityData.cumulativeRechargeData.ActivityAmountRechargePeriodMap[period] : null;
        let curCount = rechargeData? rechargeData.RechargeCount || 0 : 0;
        let cfgs = configManager.getConfigList("cumulativeRecharge").filter((_cfg: cfg.ActivityCumulativeRecharge)=>{
            if (period && (period == _cfg.Stage) && curCount  >= (_cfg.ShowNeed || 0)){
                return true;
            } 
            return false;
        });
       
        if(!cfgs) return null;
        let nums: number[] = null;
        cfgs.forEach(_cfg =>{
            let isRewarded = rechargeData && rechargeData.ReceiveRewardMap && rechargeData.ReceiveRewardMap[_cfg.Num];
            let curCount = (rechargeData ? rechargeData.RechargeCount : 0);
            let targetCount = Number(_cfg.NeedMoney || 0);
            let isCompleted = curCount >= targetCount;
            if (!isRewarded && isCompleted){
                nums = nums || [];
                nums.push(_cfg.Num);
            }
        });
        return nums;      
    }

    getDayRechargeActivityDay(activityId: number){
        let timeArr = activityUtils.calActivityTime(activityId);
        let dayBegin = utils.getStageTimeStampEx(1, timeArr[0]);
        if (dayBegin) {
            return Math.ceil((serverTime.currServerTime() - dayBegin)/60/60/24);
        }
        return 0;
    }

    calBeginEndTime(beginTimeStr: string, holdTime: number) {
        let beginTime = 0, endTime = 0;
        if (!beginTimeStr) return [beginTime, endTime];

        let openTime = beginTimeStr.split('|');
        if (!openTime || openTime.length == 0) return [beginTime, endTime];
            
        if(openTime[0] == '1'){
            //开服时间
            let openDate = new Date(serverTime.openServerTime * 1000);
            let beginOfOpenDay = utils.parseTimeToStamp(`${openDate.getFullYear()};${openDate.getMonth() + 1};${openDate.getDate()}`) / 1000;
            beginTime = beginOfOpenDay + (parseFloat(openTime[1]) - 1) * 24 * 60 * 60;
            holdTime && (endTime = beginTime + holdTime * 24 * 60 * 60);
        } else if(openTime[0] == '2'){
            //自然时间
            beginTime = utils.parseTimeToStamp(openTime[1]) / 1000;
            holdTime && ( endTime = beginTime + holdTime * 24 * 60 * 60);
        }

        return [beginTime, endTime];
    }

    //战令等级
    getBattlePassLv(addExp?: number){
        let level = 1;
        let exp = bagData.getItemCountByID(CustomItemId.BATTLE_PASS_EXP) + (addExp || 0);
        if(!exp) return level;

        let battlePasscfgs: cfg.BattlePass[] = configManager.getConfigList("battlePass");
        battlePasscfgs.sort((_cfgA, _cfgB)=>{
            return _cfgA.Level - _cfgB.Level
        });

        let sumExp = 0;
        battlePasscfgs.some(ele => {
            sumExp += ele.LevelupNeedMoney || 0;
            if(sumExp > exp){
                return true;
            }
            level = ele.Level;
            return false;
        });
        return level;
    }

    getBattlePassMaxLv() {
        let battlePasscfgs: cfg.BattlePass[] = configManager.getConfigList("battlePass");
        if (battlePasscfgs.length) {
            battlePasscfgs.sort((_cfgA, _cfgB) => {
                return _cfgA.Level - _cfgB.Level
            })

            return battlePasscfgs[battlePasscfgs.length - 1].Level;
        }

        return 1;
    }

    getBattlePassExp() {
        let exp = bagData.getItemCountByID(CustomItemId.BATTLE_PASS_EXP);
        if (exp) {
            let battlePasscfgs: cfg.BattlePass[] = configManager.getConfigList("battlePass");
            battlePasscfgs.sort((_cfgA, _cfgB) => {
                return _cfgA.Level - _cfgB.Level
            })

            let sumExp = 0;
            let levelExp = 0;
            for (let i in battlePasscfgs) {
                levelExp = battlePasscfgs[i].LevelupNeedMoney || 0;
                sumExp += levelExp;
                if (sumExp > exp) {
                    let preIndex = Number(i) -1;
                    return exp - (preIndex >= 0 ? sumExp - levelExp : 0);
                }
            }

            return levelExp;
        }

        return 0;
    }

    getBattlePassNeedExp(){
        let exp = bagData.getItemCountByID(CustomItemId.BATTLE_PASS_EXP);
        let battlePasscfgs: cfg.BattlePass[] = configManager.getConfigList("battlePass");
        battlePasscfgs.sort((_cfgA, _cfgB) => {
            return _cfgA.Level - _cfgB.Level
        })

        let sumExp = 0;
        let levelExp = 0;
        for (let i in battlePasscfgs) {
            levelExp = battlePasscfgs[i].LevelupNeedMoney || 0;
            sumExp += levelExp;
            if (sumExp > exp) {
                return levelExp;
            }
        }

        return levelExp;
    }

    getBattlePassCost(){
        if (cc.sys.os == cc.sys.OS_IOS) {
            let cfg: cfg.ShopRechargeIOS = configManager.getConfigList("rechargeIOS").find((_cfg: cfg.ShopRechargeIOS) =>{
                return _cfg.ShopRechargeIOSType == 2;
            });
            return cfg.ShopRechargeIOSCost || 0;
        } else {
            let cfg: cfg.ShopRechargeAndroid = configManager.getConfigList("rechargeAndroid").find((_cfg: cfg.ShopRechargeAndroid) => {
                return _cfg.ShopRechargeAndroidType == 2;
            });
            return cfg.ShopRechargeAndroidCost || 0;
        }
    }

    getBattlePassRechargeId() {
        return this._getBattlePassRechargeIDByType(2);
    }

    getDoubleWeekBattlePassRechargeId() {
        return this._getBattlePassRechargeIDByType(5);
    }

    private _getBattlePassRechargeIDByType(type: number) {
        if (cc.sys.os == cc.sys.OS_IOS) {
            let cfg: cfg.ShopRechargeIOS = configManager.getConfigList("rechargeIOS").find((_cfg: cfg.ShopRechargeIOS) => {
                return _cfg.ShopRechargeIOSType == type;
            });
            return cfg.ShopRechargeIOSId || 0;
        } else {
            let cfg: cfg.ShopRechargeAndroid = configManager.getConfigList("rechargeAndroid").find((_cfg: cfg.ShopRechargeAndroid) => {
                return _cfg.ShopRechargeAndroidType == type;
            });
            return cfg.ShopRechargeAndroidId || 0;
        }
    }
    /**
     * 获得月卡支付价格 元
     * @param id
     * @returns 元
     */
    getMonthlyCardCost(id: number): number {
        if(cc.sys.os == cc.sys.OS_ANDROID) {
            const cfg: cfg.ShopRechargeAndroid = configManager.getOneConfigByManyKV('rechargeAndroid', 'ShopRechargeAndroidType', 3, 'ShopRechargeAndroidGoodsID', id);
            if(cfg) {
                return cfg.ShopRechargeAndroidCost / 100;
            }
        } else {
            const cfg: cfg.ShopRechargeIOS = configManager.getOneConfigByManyKV('rechargeIOS', 'ShopRechargeIOSType', 3, 'ShopRechargeIOSGoodsID', id);
            if(cfg) {
                return cfg.ShopRechargeIOSCost / 100;
            }
        }
        return 0;
    }

    /**
     * 获得月卡支付id
     * @param id
     * @returns rechargeId
     */
     getMonthlyCardRechargeId(id: number): number {
        let rechargeId: number = 0;
        if(cc.sys.os == cc.sys.OS_ANDROID) {
            const cfg: cfg.ShopRechargeAndroid = configManager.getOneConfigByManyKV('rechargeAndroid', 'ShopRechargeAndroidType', 3, 'ShopRechargeAndroidGoodsID', id);
            if(cfg) {
                rechargeId = cfg.ShopRechargeAndroidId;
            }
        } else {
            const cfg: cfg.ShopRechargeIOS = configManager.getOneConfigByManyKV('rechargeIOS', 'ShopRechargeIOSType', 3, 'ShopRechargeIOSGoodsID', id);
            if(cfg) {
                rechargeId = cfg.ShopRechargeIOSId;
            }
        }
        return rechargeId;
    }

    
    // 检查是否符合条件打开对应模块
    checkMeetCond(mID: number): string {
        let errInfo: string = "";
        
        let itemConfig = configUtils.getFunctionConfig(mID);
        if (!itemConfig) 
            return "找不到活动配置";

        let openCondition: string = itemConfig.FunctionOpenCondition || "1|1";
        let conditionArr: Array<string> = openCondition.split("|");
        let meetCond: boolean = true;
        switch (conditionArr[0]) {
            case "1": {
                let curLevel: number = userData.lv;
                meetCond = Number(conditionArr[1]) <= curLevel;  //等级
                if (!meetCond) {
                    let dialogCfg = configUtils.getDialogCfgByDialogId(CustomDialogId.GRADE_NO_MATCH);
                    let text = utils.convertFormatString(dialogCfg.DialogText, [{ levelnum: conditionArr[1]}]);
                    errInfo = text
                }
                break;
            }
            case "2": {
                let taskCfg = configUtils.getTaskByTaskId(Number(conditionArr[1]));
                meetCond = taskData.getTaskIsCompleted(Number(conditionArr[1]));
                if (taskCfg && !meetCond) {
                    let cfg = configUtils.getDialogCfgByDialogId(CustomDialogId.TASK_NO_FINISH);
                    if (taskCfg) {
                        errInfo = cfg.DialogText.replace(/\%task/gi, taskCfg.TaskIntroduce);
                    }
                }
                break;
            }
        }
        return errInfo;
    }

    checkWeekSummonAtyIsNeedShow(cfg: cfg.ActivityWeekSummonList): boolean {
        // const openTimes = cfg.OpenTime.split(';').map(_l => { return Number(_l); });
        const activityTimes = activityUtils.calBeginEndTime(cfg.OpenTime, cfg.HoldTime);
        // const type = openTimes[0];
        // const openDay = openTimes[1];
        let curTime = serverTime.currServerTime();
        // if(ACTIVITY_TIME_TYPE.OPEN_SERVER_TIME == type) {
        //     curTime = serverTime.currServerTime() - serverTime.openServerTime;
        // } else if(ACTIVITY_TIME_TYPE.SERVER_TIME == type) {
        //     curTime = serverTime.currServerTime();
        // }
        // const curDay = Math.floor(curTime / (24 * 60 * 60)) + 1;
        // // return true;
        // return curDay <= openDay + cfg.HoldTime;
        return curTime >= activityTimes[0] && curTime < activityTimes[1];
  }

    /**
       * @description 英雄养成
       * @param activityId
       * @returns
       */
    getHeroDevelopActivityPeriod(activityId?: number){
        // 无指定活动Id，默认选开放活动内第一个
        if (activityId) {
            let cfg: cfg.ActivityList = configManager.getConfigByKey("activityList", activityId);
            if (cfg) {
                return cfg.ActiveListStage;
            }
        } else {
            let cfgs: cfg.ActivityList[] = configManager.getConfigList("activityList");
            for (let k in cfgs) {
                let cfg = cfgs[k];
                if (cfg.ActiveListFunctionID == 52000 && this.checkActivityOpen(cfg.ActiveListID)) {
                    return cfg.ActiveListStage;
                }
            }
        }
        return 0;
    }

    // 检查是否所有的首充奖励都被领取
    checkAllFirstPayRewardToken() {
        let rewardRecords = activityData.firstChargeData;
        if(!rewardRecords || !rewardRecords.RewardRecord || rewardRecords.RewardRecord.length == 0) {
            return false;
        }

        let tokenRecords = rewardRecords.RewardRecord;
        let cfgs = configManager.getConfigs('firstPay');
        let isAllToken = true;
        for(let k in cfgs) {
            if(!cfgs.hasOwnProperty(k)) continue;
            let cfg: cfg.FirstPay = cfgs[k];
            if(tokenRecords.indexOf(cfg.FirstPayId) == -1) {
                isAllToken = false;
                break;
            }
        }
        return isAllToken;
    }

};

export let activityUtils = new ActivityUtils();
