import { utils } from "../../../app/AppUtils";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { eventCenter } from "../../../common/event/EventCenter";
import { cfg } from "../../../config/config";
import { serverTime } from "../../models/ServerTime";
import { activityEvent } from "../../../common/event/EventData";
import { activityUtils } from "../../../app/ActivityUtils";
import { configManager } from "../../../common/ConfigManager";
import { activityData } from "../../models/ActivityData";
import { gamesvr } from "../../../network/lib/protocol";
import { VIEW_NAME } from "../../../app/AppConst";
import { uiHelper } from "../../../common/ui-helper/UIHelper";
import { activityOpt } from "../../operations/ActivityOpt";
import List from "../../../common/components/List"; 
import guiManager from "../../../common/GUIManager";
import {scheduleManager} from "../../../common/ScheduleManager";
import ItemDayRecharge from "./ItemDayRecharge";
import moduleUIManager from "../../../common/ModuleUIManager";
import GetAllRewardBtn from "../view-common/GetAllRewardBtn";
import { configUtils } from "../../../app/ConfigUtils";

const {ccclass, property} = cc._decorator;
@ccclass
export default class ActivityDayRechargeView extends ViewBaseComponent {
    @property(List)                 tasksList: List = null;
    @property(cc.Label)             remainTime: cc.Label = null;
    @property(cc.Node)              getAllRewardBtn: cc.Node = null;
    @property(cc.Label)             atyTip: cc.Label = null;

    private _activityId: number = 0;
    private _scheduleId: number = 0;
    private _cfgs: cfg.ActivityDayRecharge[] = [];

    private _period: number = 0;
    private _nowDay: number = 0;

    onInit(mID: number) {
        this._activityId = mID;
        this._registerEvent();
        this._initView();
    }

    onRelease() {
        this.deInit();
        eventCenter.unregisterAll(this);
    }

    onRefresh(){
        this.tasksList._onScrolling();
    }

    deInit(){
        this.tasksList._deInit();
        if (this._scheduleId) 
            scheduleManager.unschedule(this._scheduleId);
    }


    private _registerEvent() {
        eventCenter.register(activityEvent.DALIY_DATA_CLEAR_NOTIFY, this, this._recvTimeReset);
        eventCenter.register(activityEvent.DALIY_RECHARGE_TAKE_RES, this, this._recvRewardRes);
        eventCenter.register(activityEvent.DALIY_RECHARGE_CHANGE_NOTIFY, this, this._recvRechargeNotifyRes);
    }

    private _initView() {
        let dialogCfg = configUtils.getDialogCfgByDialogId(99000060);
        this.atyTip.string = dialogCfg.DialogText || '';
        this._prepareData();
        this._updateGetAllRewardBtn();
    }

    private _initRemainTime() {
        let timeArr = activityUtils.calActivityTime(this._activityId);
        let closeTime = timeArr[1];
        let remainTime = closeTime - serverTime.currServerTime();
        if (this._scheduleId){
            scheduleManager.unschedule(this._scheduleId);
        }
        if (remainTime && remainTime > 0){
            this.remainTime.string = `活动结束时间：${utils.getTimeInterval(remainTime)}后`;
            this._scheduleId = scheduleManager.schedule(() => {
                let remainTime = closeTime - serverTime.currServerTime(); 
                if (remainTime && remainTime > 0){
                    this.remainTime.string = `活动结束时间：${utils.getTimeInterval(remainTime)}后`;
                } else {
                    // 发送请求获取最新活动配置
                    if (this._scheduleId) {
                        scheduleManager.unschedule(this._scheduleId);
                    }
                    guiManager.showTips("活动已结束");
                    this.remainTime.string = `活动已结束`; 
                    this.tasksList.numItems = 0;
                }
            }, 1)
        } else {
            this.remainTime.string = `活动已结束`;
        }
    }

    private _recvTimeReset() {
        this._initView();
    }

    private _prepareData(){
        this._period = activityUtils.getRechargeActivityPeriod(this._activityId);
        this._nowDay = activityUtils.getDayRechargeActivityDay(this._activityId); // 本周第几天
        let activityOpen = activityUtils.checkActivityOpen(this._activityId);
       
        this._cfgs = configManager.getConfigList("dayRecharge").filter((_cfg: cfg.ActivityDayRecharge)=>{
            if (this._period && this._nowDay && (this._period == _cfg.Stage) && (this._nowDay == _cfg.Day)){
                return true;
            } 
            return false;
        });

        let rechargeData = activityData.dayRechargeData ? activityData.dayRechargeData.ActivityDailyRechargePeriodMap[this._period] : null;
        let getOrder = function (cfg: cfg.ActivityDayRecharge) {
            let isRewarded = rechargeData && rechargeData.DayReceiveRewardMap && rechargeData.DayReceiveRewardMap[cfg.Num];
            let curCount = (rechargeData ? rechargeData.DayRechargeCount : 0);
            let targetCount = Number(cfg.NeedMoney || 0);
            let isCompleted = curCount >= targetCount;

            if (isRewarded)
                return 1;
            else if (isCompleted)
                return -1;
            else
                return 0;
        }

        this._cfgs.sort((_cfgA, _cfgB) => {
            return getOrder(_cfgA) - getOrder(_cfgB);
        })

        this.tasksList.numItems = activityOpen ? this._cfgs.length : 0;
        this._initRemainTime();
    }

    private _recvRewardRes(cmd: any, data: gamesvr.ActivityDailyRechargeReceiveRewardRes, idx: number) {
        let rootView = uiHelper.getRootViewComp(this.node.parent);
        if (data && data.Prizes.length) {
            guiManager.loadView(VIEW_NAME.GET_ITEM_VIEW, rootView.node, data.Prizes);
        }
        this._initView();
    }

    private _recvRechargeNotifyRes() {
        this._initView();
    }

    onClickJumpBtn() {
        moduleUIManager.jumpToModule(25000, 2);
    }

    onClickAutoTake() {
        let completedTasks = this._getCanTakeRewards(); 
        if (this._period && completedTasks && completedTasks.length > 0){
            activityOpt.takeDayRechargeReward(this._period, this._nowDay, completedTasks);
            return;
        }
        this.getAllRewardBtn.getComponent(GetAllRewardBtn).showNotReward();
    }

    // 列表数据刷新
    onItemTaskRender(item: cc.Node, index: number) {
        let data = this._cfgs[index];
        let itemTask = item.getComponent(ItemDayRecharge);
        itemTask.init(data);
        itemTask.activityId = this._activityId;
    }
   
    private _getCanTakeRewards(): number[]{
        return activityUtils.getPerDayRechargeAtyIWithNotGet(this._activityId);
    }

    private _updateGetAllRewardBtn(){
        let completedTasks = this._getCanTakeRewards();
        this.getAllRewardBtn.getComponent(GetAllRewardBtn).gray = !(this._period && completedTasks && completedTasks.length > 0);
    }
}
