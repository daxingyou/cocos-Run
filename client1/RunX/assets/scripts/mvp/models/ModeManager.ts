/*
 * @Author: fly
 * @Date: 2021-03-16 19:05:43
 * @LastEditTime: 2021-09-23 15:47:03
 * @Description: file content
 */

import { redDotMgr } from "../../common/RedDotManager";
import { gamesvr } from "../../network/lib/protocol";
import { activityData } from "./ActivityData";
import { pveDataOpt } from "../operations/PveDataOpt";
import { bagData } from "./BagData";
import { chatData } from "./ChatData";
import { friendData } from "./FriendData";
import { limitData } from "./LimitData";
import { loginData } from "./LoginData";
import { mailData } from "./MailData";
import { pragmaticData } from "./PragmaticData";
import { pveData } from "./PveData";
import { pveTrialData } from "./PveTrialData";
import { pvpData } from "./PvpData";
import { serverTime } from "./ServerTime";
import { taskData } from "./TaskData";
import { trackData } from "./TrackData";
import { userData } from "./UserData";
import { guildData } from "./GuildData";
import { divineData } from "./DivineData";
import { commonData } from "./CommonData";
import { pveFakeData } from "./PveFakeData";
import { functionGuideData } from "./GuideData";
import { strategyData } from "./StrategyData";
import { onlineData } from "./OnlineData";
import { mainTaskData } from "./MainTaskData";
import { consecrateData } from "./ConsecrateData";
import { islandData } from "./IslandData";


class ModelManager {

    constructor() {

    }

    init() {
        activityData.init();
        bagData.init();
        chatData.init();
        commonData.init();
        loginData.init();
        mailData.init();
        pveData.init();
        pveTrialData.init();
        userData.init();
        trackData.init();
        limitData.init();
        friendData.init();
        pragmaticData.init();
        pvpData.init();
        taskData.init();
        functionGuideData.init();
        guildData.init();
        divineData.init();
        strategyData.init();
        onlineData.init();
        mainTaskData.init();
        consecrateData.init();
        islandData.init();
    }

    deInit() {
        activityData.deInit();
        bagData.deInit();
        chatData.deInit();
        commonData.deInit();
        divineData.deInit();
        loginData.deInit();
        mailData.deInit();
        pveData.deInit();
        pveTrialData.deInit();
        userData.deInit();
        trackData.deInit();
        limitData.deInit();
        friendData.deInit();
        pragmaticData.deInit();
        pvpData.deInit();
        taskData.deInit();
        functionGuideData.deInit();
        guildData.deInit();
        pveFakeData.deInit();
        strategyData.deInit();
        onlineData.deInit();
        mainTaskData.deInit();
        consecrateData.deInit();
        islandData.deInit();
    }
    /**
     * 用户登录成功
     * @param res
     */
    updateByLoginResponse(res: gamesvr.LoginRes) {
        // 切换账号了 清除下红点数据
        redDotMgr.deInit();
        console.log('loginSuc:', res);
        userData.initUserData(res.UserData.AccountData);
        if (res.UserData.UniversalData) userData.initUniversalData(res.UserData.UniversalData);
        if (res.UserData.UniversalData) consecrateData.initConsecrateData(res.UserData.UniversalData);
        if (res.ServerTime)             serverTime.initServerTime(res.ServerTime);
        if (res.OpenServerTime)         serverTime.initOpenSeverTime(res.OpenServerTime);
        if (res.UserData.PVEData)       pveData.initPveData(res.UserData.PVEData);
        if (res.UserData.TrialData)     pveTrialData.initPveTrialData(res.UserData.TrialData);
        if (res.UserData.MailData)      mailData.initMailData(res.UserData.MailData);
        if (res.UserData.BagData)       bagData.initBagData(res.UserData.BagData);
        if (res.UserData.TrackData)     trackData.initTrackData(res.UserData.TrackData);
        if (res.UserData.ShopData)      trackData.initShopRandomData(res.UserData.ShopData);
        if (res.UserData.ShopData)      limitData.initLimitedTimeGiftBagData(res.UserData.ShopData);
        if (res.UserData.FriendData)    friendData.initFriendData(res.UserData.FriendData);
        if (res.UserData.AccountData)   chatData.refreshBlackList();
        if (res.UserData.TimeLimitData) limitData.initLimitData(res.UserData.TimeLimitData);
        if (res.UserData.PVPData)       pvpData.initPvpData(res.UserData.PVPData);
        if (res.UserData.LeadData)      pragmaticData.initSkills(res.UserData.LeadData);
        if (res.UserData.TaskData)      taskData.initTask(res.UserData.TaskData);
        if (res.UserData.ActivityData)  activityData.initActivityData(res.UserData.ActivityData);
        if (res.UserData.FactionData)   guildData.initGuildData(res.UserData.FactionData);
        if (res.UserData.TreasureData)  taskData.initTreasureTask(res.UserData.TreasureData);
        if (res.UserData.EpochData)    taskData.initRankRewardData(res.UserData.EpochData);

        //预留的接口 神系派遣
        if (res.UserData.DivineData)    divineData.updateDivineInfo(res.UserData.DivineData);
        if (res.UserData.GuideData)     functionGuideData.updateFinishedGuideData(res.UserData.GuideData.FinishGuideIds);
        bagData.initTreasureProp();
        userData.updateCapability(0, false);
        redDotMgr.updateData();
        // guildData.updateData();
        // 拉取奇门遁甲活动数据
        setTimeout(() => {
            pveDataOpt.reqGetTrialMiracalInfo();
            pveDataOpt.reqGetTrialHellInfo();
            pveDataOpt.reqGetTrialCloudInfo();
        }, 1000);
    }

    /**
     * 0点刷新
     */
    onDayReset() {
        guildData.onDayReset();
        taskData.onDayReset();
        activityData.onDayReset();
        pveTrialData.onDayReset();
        userData.onDayReset();
    }
    /**
     * 周一零点刷新 
     */
    onWeekReset() {
        taskData.resetWeekTasks();
    }

}
let modelManager = new ModelManager();
export { modelManager }
