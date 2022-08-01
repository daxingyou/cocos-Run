import { utils } from "../../../app/AppUtils";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { eventCenter } from "../../../common/event/EventCenter";
import { cfg } from "../../../config/config";
import { serverTime } from "../../models/ServerTime";
import { activityEvent, commonEvent } from "../../../common/event/EventData";
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
import moduleUIManager from "../../../common/ModuleUIManager";
import ItemCumulativeRecharge from "./ItemCumuativeRecharge";
import GetAllRewardBtn from "../view-common/GetAllRewardBtn";
import { configUtils } from "../../../app/ConfigUtils";

const {ccclass, property} = cc._decorator;
@ccclass
export default class ActivityCumulativeRechargeView extends ViewBaseComponent {
    @property(List)                 tasksList: List = null;
    @property(cc.Label)             remainTime: cc.Label = null;
    @property(cc.Node)              getAllRewardBtn: cc.Node = null;
    @property(cc.Label)             atyTip: cc.Label = null;

    private _activityId: number = 0;
    private _scheduleId: number = 0;
    private _cfgs: cfg.ActivityCumulativeRecharge[] = [];

    onInit(mID: number) {
        this._activityId = mID;
        this._registerEvent();
        this._initView();
    }

    onRelease() {
        this.tasksList._deInit();
        if (this._scheduleId) 
            scheduleManager.unschedule(this._scheduleId);
        eventCenter.unregisterAll(this);
    }

    onRefresh(){
        this.tasksList._onScrolling();
    }

    private _registerEvent() {
        eventCenter.register(commonEvent.TIME_DAY_RESET, this, this._recvTimeReset);
        eventCenter.register(activityEvent.CUMULATIVE_ECHARGE_TAKE_RES, this, this._recvRewardRes);
        eventCenter.register(activityEvent.CUMULATIVE_RECHARGE_CHANGE_NOTIFY, this, this._recvRechargeNotifyRes);
    }

    private _initView() {
        let dialogCfg = configUtils.getDialogCfgByDialogId(99000061);
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
        if (remainTime && remainTime > 0) {
            this.remainTime.string = `活动结束时间：${utils.getTimeInterval(remainTime)}后`;
            this._scheduleId = scheduleManager.schedule(() => {
                let remainTime = closeTime - serverTime.currServerTime();
                if (remainTime && remainTime > 0) {
                    this.remainTime.string = `活动结束时间：${utils.getTimeInterval(remainTime)}后`;
                } else {
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
        let period = activityUtils.getRechargeActivityPeriod(this._activityId);
        let activityOpen = activityUtils.checkActivityOpen(this._activityId);
        let rechargeData = activityData.cumulativeRechargeData ? activityData.cumulativeRechargeData.ActivityAmountRechargePeriodMap[period] : null;
        let curCount = rechargeData? rechargeData.RechargeCount || 0 : 0;
        this._cfgs = configManager.getConfigList("cumulativeRecharge").filter((_cfg: cfg.ActivityCumulativeRecharge)=>{
            if (period && (period == _cfg.Stage) && curCount  >= (_cfg.ShowNeed || 0)){
                return true;
            } 
            return false;
        });


        let getOrder = function(cfg: cfg.ActivityCumulativeRecharge){
            let isRewarded = rechargeData && rechargeData.ReceiveRewardMap && rechargeData.ReceiveRewardMap[cfg.Num];
            let curCount = (rechargeData ? rechargeData.RechargeCount : 0);
            let targetCount = Number(cfg.NeedMoney || 0);
            let isCompleted = curCount >= targetCount;

            if (isRewarded) 
                return 1;
            else if (isCompleted)
                return -1;
            else
                return 0;
        }

        this._cfgs.sort((_cfgA, _cfgB) =>{
            return getOrder(_cfgA) - getOrder(_cfgB);
        })

        this.tasksList.numItems = activityOpen ? this._cfgs.length : 0;
        this._initRemainTime();
    }

    private _recvRewardRes(cmd: any, data: gamesvr.ActivityAmountRechargeReceiveRewardRes, idx: number) {
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
        let period = activityUtils.getCumulativeRechargeActivityPeriod(this._activityId);
        let completedTasks = this._getCanTakeRewards(); 
        if (period && completedTasks && completedTasks.length > 0){
            activityOpt.takeCumulativeRechargeReward(period, completedTasks);
            return;
        }
        this.getAllRewardBtn.getComponent(GetAllRewardBtn).showNotReward();
    }


    // 列表数据刷新
    onItemTaskRender(item: cc.Node, index: number) {
        let data = this._cfgs[index];
        let itemTask = item.getComponent(ItemCumulativeRecharge);
        itemTask.init(data);
        itemTask.activityId = this._activityId;
    }

    //获取可领取的任务项集合
    private _getCanTakeRewards(): number[]{
        return activityUtils.getCumulativeRechargeAtysWithNotGet(this._activityId);
    }

    //更新一键领取按钮状态
    private _updateGetAllRewardBtn(){
        let period = activityUtils.getCumulativeRechargeActivityPeriod(this._activityId);
        let completedTasks = this._getCanTakeRewards();
        this.getAllRewardBtn.getComponent(GetAllRewardBtn).gray = !(period && completedTasks && completedTasks.length > 0);
    }
   
}
