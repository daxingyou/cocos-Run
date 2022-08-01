/*
 * @Author: xuyang
 * @Description: 活动-战令页面
 */
import { configManager } from "../../../common/ConfigManager";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { eventCenter } from "../../../common/event/EventCenter";
import { cfg } from "../../../config/config";
import { data, gamesvr } from "../../../network/lib/protocol";
import { activityEvent, taskEvent } from "../../../common/event/EventData";
import { activityUtils } from "../../../app/ActivityUtils";
import { serverTime } from "../../models/ServerTime";
import { configUtils } from "../../../app/ConfigUtils";
import { utils } from "../../../app/AppUtils";
import { activityData } from "../../models/ActivityData";
import { uiHelper } from "../../../common/ui-helper/UIHelper";
import { CustomDialogId, CustomItemId, VIEW_NAME } from "../../../app/AppConst";
import {scheduleManager} from "../../../common/ScheduleManager";
import List from "../../../common/components/List";
import moduleUIManager from "../../../common/ModuleUIManager";
import ItemBattlePassReward from "./ItemBattlePassReward";
import ItemTask from "../view-task/ItemTask";
import guiManager from "../../../common/GUIManager";
import { activityOpt } from "../../operations/ActivityOpt";
import { shopOpt } from "../../operations/ShopOpt";
import { taskData } from "../../models/TaskData";
import { taskDataOpt } from "../../operations/TaskDataOpt";
import { redDotMgr, RED_DOT_MODULE } from "../../../common/RedDotManager";
import {TaskState} from '../../../app/AppEnums';
import GetAllRewardBtn from '../view-common/GetAllRewardBtn';
import ItemRedDot from "../view-item/ItemRedDot";
import { appCfg } from "../../../app/AppConfig";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { resPathUtils } from "../../../app/ResPathUrlUtils";

enum PAGE_TYPE {
    REWARD,
    TASK
}

const { ccclass, property } = cc._decorator;
@ccclass
export default class ActivityBattlePassView extends ViewBaseComponent {
    @property(List) rewardlistview: List = null;
    @property(List) taskListView: List = null;
    @property(cc.Node) rewardTitle: cc.Node = null;
    @property(cc.Node) rewardNode: cc.Node = null;
    @property(cc.Node) taskNode: cc.Node = null;
    @property(cc.Node) takeButton: cc.Node = null;

    @property(cc.Label) expLb: cc.Label = null;
    @property(cc.Label) levelLb: cc.Label = null;
    @property(cc.Node) upgradeButton: cc.Node = null;
    @property(cc.ProgressBar) progressBar: cc.ProgressBar = null;

    @property(cc.Label) tipsLb: cc.Label = null;
    @property(cc.Label) priceLb: cc.Label = null;
    @property(cc.Sprite) priceIcon: cc.Sprite = null;
    @property(cc.Label) introLb: cc.Label = null;
    @property(cc.Label) buyTipsLb: cc.Label = null;
    @property(cc.Label) reaminTimeLb: cc.Label = null;
    @property(cc.Toggle) toggleItem: cc.Toggle = null;
    @property(cc.Node) toggleLayout: cc.Node = null;
    @property(ItemRedDot) rewardRedot: ItemRedDot = null;
    @property(ItemRedDot) taskRedot: ItemRedDot = null;
    @property(cc.Node) rechargeRewardNode: cc.Node = null;

    private _battlePasscfgs: cfg.BattlePass[] = [];
    private _tasks: cfg.TaskTarget[] = null;
    private _scheduleId: number = 0;
    private _pageType = PAGE_TYPE.REWARD;
    private _showTaskIdxs: number[] = null;
    private _spLoader: SpriteLoader = null;

    onInit(moduleId: number, partId: number, subId: number) {
        if (this._pageType)
            this._pageType = partId;
        this._prepareData();
        this._refreshView();
        this._registerEvent();
    }

    onRelease() {
        this.unscheduleAllCallbacks();
        this._spLoader && this._spLoader.release();
        this.rewardRedot.deInit();
        this.taskRedot.deInit();
        this.taskListView._deInit();
        this.rewardlistview._deInit();
        eventCenter.unregisterAll(this);
        this._scheduleId &&  scheduleManager.unschedule(this._scheduleId);
        this._scheduleId = 0;
    }

    onRefresh() {
        this._prepareData();
        this._refreshView();
    }

    private _registerEvent() {
        eventCenter.register(activityEvent.BATTLE_PASS_REWARD_TAKE, this, this._recvTakeRewardRes);
        eventCenter.register(activityEvent.BATTLE_PASS_BUY, this, this._recvBuyBattlePassRes);
        eventCenter.register(activityEvent.BATTLE_PASS_BUY_LEVEL, this, this._recvBuyLevelRes);
        eventCenter.register(taskEvent.RECEIVE_REWARD, this, this._recvTakeTaskRewardRes);
    }

    private _initTaskData(){
        if(this._tasks) return;

        let tasks: cfg.TaskTarget[] = configManager.getConfigList("task").filter(_task =>{
            return _task.TargetModule && _task.TargetModule == 8;
        });
        tasks.sort((a, b) => {
            let aGroupID = a.TargetGroupID;
            let bGroupID = b.TargetGroupID;
            if(aGroupID == bGroupID){
                return a.TargetSerialID - b.TargetSerialID;
            }
            return aGroupID - bGroupID;
        });
        this._tasks = tasks;
    }

    private _prepareData(){
        this._battlePasscfgs = configManager.getConfigList("battlePass");
        this._initTaskData();
        let tasks = this._tasks;

        let showTasks: number[] = [];
        tasks.forEach((ele, idx) => {
            taskData.checkSatisfyShow(ele) &&  showTasks.push(idx);
        });

        showTasks.sort((_a, _b) => {
            let aTask = this._tasks[_a];
            let bTask = this._tasks[_b];
            let aCompleted: boolean = taskData.getTaskIsCompleted(aTask.TargetID);
            let aReceivedReward: boolean = taskData.getTaskIsReceiveReward(aTask.TargetID);
            let bCompleted: boolean = taskData.getTaskIsCompleted(bTask.TargetID);
            let bReceivedReward: boolean = taskData.getTaskIsReceiveReward(bTask.TargetID);
            let a = aReceivedReward ? TaskState.Received : (aCompleted ? TaskState.Completed : TaskState.Undo);
            let b = bReceivedReward ? TaskState.Received : (bCompleted ? TaskState.Completed : TaskState.Undo);
            if (a == b) {
                return aTask.TargetID - aTask.TargetID;
            } else {
                return a - b;
            }
        });
        this._showTaskIdxs = showTasks;
    }

    private _refreshView(){
        if (this._pageType == PAGE_TYPE.REWARD){
            this.rewardNode.active = true;
            this.rewardTitle.active = true;
            this.taskNode.active = false;
            this.rewardlistview.numItems = this._battlePasscfgs.length;

            // 自动跳转到可领取条目
            let battlePassData = activityData.battlePassData;
            let openPrior = battlePassData && battlePassData.IsSpecial;
            let battlePassLv = activityUtils.getBattlePassLv();
            let jumpIdx = this._battlePasscfgs.findIndex((cfg) => {
                let rewardTokenAll = openPrior ? battlePassData.ReceiveSpecialReward[cfg.Level] : battlePassData.ReceiveNormalReward[cfg.Level];
                let meetLevel = battlePassLv >= cfg.Level;
                return !rewardTokenAll && meetLevel;
            })
            if (jumpIdx != -1)
                this.rewardlistview.scrollTo(jumpIdx, 0);

        } else if (this._pageType == PAGE_TYPE.TASK){
            this.rewardNode.active = false;
            this.rewardTitle.active = false;
            this.taskNode.active = true;
            this.taskListView.numItems = this._showTaskIdxs.length;
            this.taskListView.scrollTo(0, 0);
        }
        
        // 战令经验
        let battlePassLv = activityUtils.getBattlePassLv();
        let battlePassMaxLv = activityUtils.getBattlePassMaxLv();
        let battlePassExp = activityUtils.getBattlePassExp();
        let battlePassNeedExp = activityUtils.getBattlePassNeedExp();

        this.upgradeButton.active = battlePassLv != battlePassMaxLv;
        this.progressBar.progress = battlePassExp/ battlePassNeedExp;
        this.levelLb.string = `${battlePassLv}`;
        this.expLb.string = battlePassLv == battlePassMaxLv ? `满级` : `${battlePassExp}/${battlePassNeedExp}`;

        if (this._pageType == PAGE_TYPE.REWARD) {
            let levelList: number[] = this._getUntakeRewardList();
            this.takeButton.getComponent(GetAllRewardBtn).gray = !levelList.length;
        } else if (this._pageType == PAGE_TYPE.TASK) {
            let taskList: number[] = this._getUntakeTaskList();
            this.takeButton.getComponent(GetAllRewardBtn).gray = !taskList.length;
        }
        // 至尊战令
        this._refreshBattlePassStatus();
        this._updateRedot();
    }

    private _updateRedot(){
        let rewardList: number[] = this._getUntakeRewardList();
        this.rewardRedot.showRedDot(rewardList && rewardList.length > 0);
        let taskList: number[] = this._getUntakeTaskList();
        this.taskRedot.showRedDot(taskList && taskList.length > 0);
        redDotMgr.fire(RED_DOT_MODULE.ACTIVITY_BATTLE_PASS_TOGGLE);
    }

    private _refreshBattlePassStatus(){
        let moduleCfg = configUtils.getModuleConfigs();
        let openPrior = activityData.battlePassData && activityData.battlePassData.IsSpecial;
        let buyCnt = activityData.battlePassData ? activityData.battlePassData.BuyCount : 0;
        let needCnt = moduleCfg.BattlePassForeverNeed || 0;
        let itemNodes = [...this.toggleLayout.children];
        let price = activityUtils.getBattlePassCost();
        itemNodes.forEach(itemNode =>{
            if (cc.isValid(itemNode) && itemNode.active) {
                itemNode.removeFromParent();
            }
        })
        if (needCnt) {
            for (let i = 0; i < needCnt; i++){
                let check = i < buyCnt;
                let newItem = cc.instantiate(this.toggleItem.node);
                newItem.active = true;
                newItem.getComponent(cc.Toggle).isChecked = check;
                this.toggleLayout.addChild(newItem);
            }
        }

        if (openPrior && needCnt == buyCnt) {
            let cfg = configUtils.getDialogCfgByDialogId(CustomDialogId.BATTLE_PASS_FOREVER);
            if (cfg && cfg.DialogText){
                this.buyTipsLb.string = cfg.DialogText;
            }
        } else if(openPrior){
            let cfg = configUtils.getDialogCfgByDialogId(CustomDialogId.BATTLE_PASS_BUY);
            if (cfg && cfg.DialogText) {
                this.buyTipsLb.string = cfg.DialogText;
            }
        }
        this.priceLb.node.parent.parent.active = !openPrior;
        this.buyTipsLb.node.active = openPrior;
        this.priceIcon.node.active = false;
        if(appCfg.UseTestMoney){
            this._spLoader = this._spLoader || new SpriteLoader();
            this._spLoader.changeSprite(this.priceIcon, resPathUtils.getItemIconPath(CustomItemId.ZI_YV), () => {
                this.priceIcon.node.active = true;
            });
            this.priceLb.string = `至尊战令${price/100}`;
            //@ts-ignore
            this.priceLb._forceUpdateRenderData();
            let totalWh = this.priceIcon.node.width + this.priceLb.node.width;
            let halfWh = totalWh >> 1;
            this.priceLb.node.x = -halfWh + (this.priceLb.node.width >> 1);
            this.priceIcon.node.x = halfWh - (this.priceIcon.node.width >> 1);
        }else {
            this.priceLb.string = `至尊战令${price/100}元`;
          this.priceLb.node.x = 0;
        }

        // 改为一次永久开启至尊战令
        // this.tipsLb.node.active = buyCnt < needCnt;
        // this.tipsLb.string = `再开启${needCnt - buyCnt}次后，即可永久获得`;

        let rewards = this._getRechargeRewards();
        let isShowOpenReward = !openPrior && rewards && rewards.length > 0;
        this.rechargeRewardNode.active = isShowOpenReward;
        if(isShowOpenReward) {
            let leftLb = this.rechargeRewardNode.getChildByName('leftLb').getComponent(cc.Label);
            leftLb.string = '购买后立即获得';
            //@ts-ignore
            leftLb._forceUpdateRenderData();
            let rightLb = this.rechargeRewardNode.getChildByName('rightLb').getComponent(cc.Label);
            rightLb.string = `${rewards[0].Count}`;
            //@ts-ignore
            rightLb._forceUpdateRenderData();
            let itemSp = this.rechargeRewardNode.getChildByName('icon').getComponent(cc.Sprite);
            let totalW = leftLb.node.width + rightLb.node.width + itemSp.node.width;
            let startX = -(totalW >> 1);
            leftLb.node.x = startX;
            startX += (leftLb.node.width + 5);
            itemSp.node.x = startX + (itemSp.node.width >> 1);
            startX += (itemSp.node.width + 5);
            rightLb.node.x = startX;
            this._spLoader = this._spLoader || new SpriteLoader();
            this._spLoader.changeSprite(itemSp, resPathUtils.getItemIconPath(rewards[0].ID));
        }

        // 重置时间
        let resetTime = utils.getStageTimeStamp(2) + 60 * 60 * 24 * 7;
        let warnTime = moduleCfg.BattlePassWarningTime;
        let remainTime = resetTime - serverTime.currServerTime();

        this._scheduleId && scheduleManager.unschedule(this._scheduleId);
        this._scheduleId = 0;

        if (remainTime > 0 && remainTime < warnTime){
            this.reaminTimeLb.string = `${utils.getTimeInterval(remainTime)}后重置`;
            this._scheduleId = scheduleManager.schedule(() =>{
                remainTime = remainTime - 1;
                if (remainTime > 0){
                    this.reaminTimeLb.string = `${utils.getTimeInterval(remainTime)}后重置`;
                } else {
                    this.reaminTimeLb.string = "";
                    eventCenter.fire(activityEvent.BATTLE_PASS_RESET);
                    this._prepareData();
                    this._refreshView();
                }
            }, 1)
        } else {
            this.reaminTimeLb.string = "";
        }

        // 战令描述
        let dialogCfg = configUtils.getDialogCfgByDialogId(99000043);
        if (dialogCfg) {
            this.introLb.string = dialogCfg.DialogText;
        }
    }


    onRewardListRender(itemNode: cc.Node, idx:number){
        let battlePassItem = itemNode.getComponent(ItemBattlePassReward);
        battlePassItem.init(this._battlePasscfgs[idx]);
    }

    onTaskListRender(itemNode: cc.Node, idx: number) {
        let taskItem = itemNode.getComponent(ItemTask);
        let homeNode = uiHelper.getRootViewComp(this.node.parent).node;
        taskItem.onInit(this._tasks[this._showTaskIdxs[idx]], homeNode);
    }

    onClickCharge(event?: cc.Event, customEventData?: string){
        moduleUIManager.jumpToModule(25000, 1);
    }

    onClickRewardToggle(){
        if (this._pageType != PAGE_TYPE.REWARD){
            this._pageType = PAGE_TYPE.REWARD;
            this._refreshView();
        }
    }

    onClickTaskToggle() {
        if (this._pageType != PAGE_TYPE.TASK) {
            this._pageType = PAGE_TYPE.TASK;
            this._refreshView();
        }
    }

    onClickUpgrade(){
        let homeNode = uiHelper.getRootViewComp(this.node.parent).node;
        guiManager.loadView("ActivityBattlePassUpgradeView", homeNode);
    }

    onClickBuy(){
        let rechargeId = activityUtils.getBattlePassRechargeId();
        let price = activityUtils.getBattlePassCost();
        let needMoney = price / 100;
        shopOpt.sendRechargeReq(rechargeId, needMoney);
    }

    onClickAutoTake(){
        if (this._pageType == PAGE_TYPE.REWARD){
            let levelList: number[] = this._getUntakeRewardList();
            if (levelList.length > 0) {
                activityOpt.takeBattlePassReward(levelList);
                return;
            }
        }

        if (this._pageType == PAGE_TYPE.TASK){
            let taskList: number[] = this._getUntakeTaskList();
            if (taskList.length > 0){
                taskDataOpt.sendReceiveTaskReward(taskList);
                return;
            }
        }
        
        this.takeButton.getComponent(GetAllRewardBtn).showNotReward();
    }

    onClickRechargeReward() {
        let rewards = this._getRechargeRewards();
        if(!rewards || rewards.length == 0) return;
        let homeNode = uiHelper.getRootViewComp(this.node.parent).node;
        moduleUIManager.showItemDetailInfo(rewards[0].ID, rewards[0].Count, homeNode);
    }

    private _getUntakeRewardList(){
        let levelList: number[] = [];
        let level = activityUtils.getBattlePassLv();
        let battlePassData = activityData.battlePassData;
        let openPrior = battlePassData && activityData.battlePassData.IsSpecial;
        this._battlePasscfgs.forEach(_cfg => {
            if (level >= _cfg.Level) {
                let normalToken = battlePassData && battlePassData.ReceiveNormalReward[_cfg.Level];
                let priorToken = battlePassData && battlePassData.ReceiveSpecialReward[_cfg.Level];
                if (!normalToken || (openPrior && !priorToken)) {
                    levelList.push(_cfg.Level);
                }
            }
        })
        return levelList;
    }

    private _getUntakeTaskList(){
        let taskList: number[] = [];
        this._tasks.forEach(_task => {
            let finished = taskData.getTaskIsCompleted(_task.TargetID);
            let received = taskData.getTaskIsReceiveReward(_task.TargetID);
            if (finished && !received) {
                taskList.push(_task.TargetID);
            }
        })
        return taskList;
    }

    private _recvTakeRewardRes(cmd: any, prizes: data.IItemInfo[]) {
        if (prizes && prizes.length > 0) {
            let activityHomeView = uiHelper.getRootViewComp(this.node.parent);
            if (activityHomeView)
                guiManager.loadView(VIEW_NAME.GET_ITEM_VIEW, activityHomeView.node,prizes);
            if (this._pageType == PAGE_TYPE.REWARD) {
                this._prepareData();
                this._refreshView();
                redDotMgr.fire(RED_DOT_MODULE.ACTIVITY_BATTLE_PASS_TOGGLE);
            }
        }
    }

    private _recvTakeTaskRewardRes(cmd: any, msg: gamesvr.TaskTargetReceiveRewardRes) {
        let prizes = msg.Prizes;
        if (prizes && prizes.length > 0) {

            //如果未满级，则提示升级
            let item = prizes.find(prize =>{return prize.ID = CustomItemId.BATTLE_PASS_EXP});
            let battlePassLv = activityUtils.getBattlePassLv();
            let battlePassOldLv = activityUtils.getBattlePassLv(item ? -item.Count : 0);
            if (battlePassOldLv != battlePassLv){
                guiManager.showTips("升级成功。");
            }

            let activityHomeView = uiHelper.getRootViewComp(this.node.parent);
            if (activityHomeView)
                guiManager.loadView(VIEW_NAME.GET_ITEM_VIEW, activityHomeView.node,prizes);
            if (this._pageType == PAGE_TYPE.TASK) {
                this._prepareData();
                this._refreshView();
            }
        }
    }

    private _recvBuyLevelRes(cmd: any) {
       guiManager.showTips("升级成功。");
       this._refreshView();
    }

    private _recvBuyBattlePassRes(cmd: any, IsSpecial: boolean) {
        guiManager.showTips("购买成功。");

        if(IsSpecial) {
            let rewards = this._getRechargeRewards();
            if(rewards) {
                let activityHomeView = uiHelper.getRootViewComp(this.node.parent);
                guiManager.loadView(VIEW_NAME.GET_ITEM_VIEW, activityHomeView.node, rewards);
            }
        }

        this.scheduleOnce(() => {
            this._refreshView();
        });
    }

    private _recvRechargeChangeNotify(){
        this._refreshView();
    }

    onDisable() {
        this.unscheduleAllCallbacks();
    }

    private _getRechargeRewards(): data.IItemInfo[] {
        let rewards: data.IItemInfo[] = null;
        let rechargeID = activityUtils.getBattlePassRechargeId();
        if (cc.sys.os == cc.sys.OS_IOS) {
            let rechargeCfg: cfg.ShopRechargeIOS = configManager.getConfigByKey('rechargeIOS', rechargeID);
            if(rechargeCfg && rechargeCfg.ShopRechargeIOSPropertyID && rechargeCfg.ShopRechargeIOSPropertyCount) {
                rewards = rewards || [];
                rewards.push({ID: rechargeCfg.ShopRechargeIOSPropertyID, Count: rechargeCfg.ShopRechargeIOSPropertyCount});
            }
        } else {
            let rechargeCfg: cfg.ShopRechargeAndroid = configManager.getConfigByKey('rechargeAndroid', rechargeID);
            if(rechargeCfg && rechargeCfg.ShopRechargeAndroidPropertyID && rechargeCfg.ShopRechargeAndroidPropertyCount) {
                rewards = rewards || [];
                rewards.push({ID: rechargeCfg.ShopRechargeAndroidPropertyID, Count: rechargeCfg.ShopRechargeAndroidPropertyCount});
            }
        }
        return rewards;
    }
}
