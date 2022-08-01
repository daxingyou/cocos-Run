import { activityUtils } from "../../../app/ActivityUtils";
import { VIEW_NAME } from "../../../app/AppConst";
import { utils } from "../../../app/AppUtils";
import { configUtils } from "../../../app/ConfigUtils";
import { resPathUtils } from "../../../app/ResPathUrlUtils";
import ButtonEx from "../../../common/components/ButtonEx";
import List from "../../../common/components/List";
import UIGridView, { GridData } from "../../../common/components/UIGridView";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { configCache } from "../../../common/ConfigCache";
import { configManager } from "../../../common/ConfigManager";
import { eventCenter } from "../../../common/event/EventCenter";
import { activityEvent, commonEvent, shopEvent, taskEvent } from "../../../common/event/EventData";
import guiManager from "../../../common/GUIManager";
import { logger } from "../../../common/log/Logger";
import moduleUIManager from "../../../common/ModuleUIManager";
import { redDotMgr, RED_DOT_MODULE } from "../../../common/RedDotManager";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { cfg } from "../../../config/config";
import { data, gamesvr } from "../../../network/lib/protocol";
import { activityData } from "../../models/ActivityData";
import { bagData } from "../../models/BagData";
import { serverTime } from "../../models/ServerTime";
import { taskData } from "../../models/TaskData";
import { taskDataOpt } from "../../operations/TaskDataOpt";
import ItemRedDot from "../view-item/ItemRedDot";
import ItemDoubleWeekGift from "./ItemDoubleWeekGift";
import ItemDoubleWeekWarOrder from "./ItemDoubleWeekWarOrder";
import ItemDoubleWeekReward from "./ItemDoubleWeekReward";
import ItemDoubleWeekTask from "./ItemDoubleWeekTask";
import { ItemInfo } from "../../../app/AppType";
import { shopOpt } from "../../operations/ShopOpt";

const enum  DOUBLE_WEEK_VIEW_TYPE {
    REWARD,
    TASK,
    GIFT,
    WAR_ORDER
}

const {ccclass, property} = cc._decorator;

@ccclass
export default class ActivityDoubleWeekView extends ViewBaseComponent {
    @property(cc.ToggleContainer) toggleContainor: cc.ToggleContainer = null;
    @property(cc.Node) rewardView: cc.Node = null;
    @property(cc.Sprite) moneyIcon: cc.Sprite = null;
    @property(cc.Label) moneyNum: cc.Label = null;
    @property(cc.Node) taskView: cc.Node = null;
    @property(ButtonEx) jumpToSummonBtn: ButtonEx = null;
    @property(ButtonEx) onceReceiveTaskRewardBtn: ButtonEx = null;
    @property(cc.Node) giftView: cc.Node = null;
    @property(cc.Node) warOrderView: cc.Node = null;
    @property(List) rewardList: List = null;
    @property(List) taskList: List = null;
    @property(List) giftList: List = null;
    @property(UIGridView) warOrderList: UIGridView = null;
    @property(cc.Label) countdownTips: cc.Label = null;
    @property(cc.Label) title: cc.Label = null;
    @property(cc.Label) titleTips: cc.Label = null;
    @property(cc.Node) taskToggleBgs: cc.Node = null;
    @property(cc.Node) taskToggleChecks: cc.Node = null;
    @property(ItemRedDot) rewardToggleRedDot: ItemRedDot = null;
    @property(ItemRedDot) taskToggleRedDot: ItemRedDot = null;
    @property(ItemRedDot) giftBagToggleRedDot: ItemRedDot = null;
    @property(cc.Node) warOrderRechargeNode: cc.Node = null;
    @property(cc.Button) warOrderRechargeBtn: cc.Button = null;
    @property(cc.Node) warOrderBuyedNode: cc.Node = null;
    @property(cc.Label) warOrderPriceLb: cc.Label = null;
    @property(cc.Prefab) warOrderItemPfb: cc.Prefab = null;

    private _activityId: number = 0;
    private _viewType: DOUBLE_WEEK_VIEW_TYPE = DOUBLE_WEEK_VIEW_TYPE.TASK;
    private _rewardList: cfg.ActivityWeekSummonReward[] = [];
    private _taskList: number[] = [];
    private _giftList: number[][] = [];
    private _spriteLoader: SpriteLoader = new SpriteLoader();
    private _warOrderItemPool: cc.NodePool = new cc.NodePool();
    private _isInitedWarOrder: boolean = false;

    preInit(id: number) : Promise<any>{
      this._activityId = id;
      this._initToggles();
      return Promise.resolve(true);
    }

    onInit(id: number) {
        this._activityId = id;
        guiManager.addCoinNode(this.node, 48000);
        this.doInit();
        this._refreshView();
    }

    doInit() {
        eventCenter.register(activityEvent.DOUBLE_WEEK_REWARD_EXCHANGE_SUC, this, this._recvExchangeSuc);
        eventCenter.register(taskEvent.RECEIVE_REWARD, this, this._recvGetReward);
        eventCenter.register(taskEvent.CHANGE_PROGRESS, this, this._onChangeProgress);
        eventCenter.register(activityEvent.DOUBLE_WEEK_GIFT_BUY_SUC, this, this._onGiftBagChange);
        eventCenter.register(shopEvent.BUY_GIFT, this, this._recvChargeGiftSuc);
        eventCenter.register(commonEvent.TIME_DAY_RESET, this, this._onDayReset);
        eventCenter.register(activityEvent.DOUBLE_WEEK_BUY_BATTLE_PASS_NTY, this, this._onDoubleWeekButBattlePassNty);
        eventCenter.register(activityEvent.DOUBLE_WEEK_TAKE_BATTLE_PASS_REWARD, this, this._onRecvTokenDoubleWeekBattlePassReward);
    }

    onRelease() {
        this.unscheduleAllCallbacks();
        this._isInitedWarOrder = false;
        guiManager.removeCoinNode(this.node);
        eventCenter.unregisterAll(this);
        this._spriteLoader.release();
        this.rewardList._deInit();
        this.taskList._deInit();
        this.giftList._deInit();
 	      this.warOrderList.clear();
        this._warOrderItemPool.clear();
        this.releaseSubView();
    }

    private _initToggles() {
        const doubleWeekConfig = configUtils.getDoubleWeekListConfig(this._activityId);
        let isGiftVisible = !!(doubleWeekConfig.GiftID && doubleWeekConfig.GiftID.length > 0);

        let toggles = this.toggleContainor.toggleItems;
        let toggleCnt = isGiftVisible ? toggles.length : toggles.length - 1;
        let spaceY = 10;
        let totalH = toggles[0].node.height * toggleCnt + spaceY * (toggleCnt - 1);
        let startY = (totalH >> 1);
        toggles.forEach((toggle, idx) => {
            // 礼包不可见时， 隐藏礼包页签
            if(idx == 2 && !isGiftVisible) {
                toggle.node.active = false;
                return;
            }
            toggle.node.setPosition(0, startY - (toggle.node.height >> 1));
            startY -= (toggle.node.height + spaceY);
        });
    }

    private _onDayReset() {
        const cfg: cfg.ActivityWeekSummonList = configUtils.getDoubleWeekListConfig(this._activityId);
        const activityTimes = activityUtils.calBeginEndTime(cfg.OpenTime, cfg.HoldTime);
        const curTime = serverTime.currServerTime();
        // 超过结束时间
        if(curTime >= activityTimes[1]) {
            this.closeView();
        } else {
            this._refreshCommonView();
            DOUBLE_WEEK_VIEW_TYPE.WAR_ORDER == this._viewType && this._refreshWarOrderView(true);
        }
    }

    private _refreshView() {
        this.rewardView.active = DOUBLE_WEEK_VIEW_TYPE.REWARD == this._viewType;

        this.taskView.active = DOUBLE_WEEK_VIEW_TYPE.TASK == this._viewType;
        this.jumpToSummonBtn.setActivity(DOUBLE_WEEK_VIEW_TYPE.TASK == this._viewType);
        this.onceReceiveTaskRewardBtn.setActivity(DOUBLE_WEEK_VIEW_TYPE.TASK == this._viewType)
        this.giftView.active = DOUBLE_WEEK_VIEW_TYPE.GIFT == this._viewType;
        this.warOrderView.active = DOUBLE_WEEK_VIEW_TYPE.WAR_ORDER == this._viewType;

        switch(this._viewType) {
            case DOUBLE_WEEK_VIEW_TYPE.REWARD: {
                this._refreshRewardView();
                break;
            }
            case DOUBLE_WEEK_VIEW_TYPE.TASK: {
                this._refreshTaskView();
                break;
            }
            case DOUBLE_WEEK_VIEW_TYPE.GIFT: {
                this._refreshGiftView();
                break;
            }
            case DOUBLE_WEEK_VIEW_TYPE.WAR_ORDER:
                this._refreshWarOrderView();
                break;
            default: {
                break;
            }
        }

        this._refreshCommonView();
        this._refreshRedDot();
    }

    private _refreshCommonView() {
        const cfg: cfg.ActivityWeekSummonList = configUtils.getDoubleWeekListConfig(this._activityId);
        const activityTimes = activityUtils.calBeginEndTime(cfg.OpenTime, cfg.HoldTime);
        const curTime = serverTime.currServerTime();
        const day = Math.ceil((activityTimes[1] - curTime) / (24 * 60 * 60));
        this.countdownTips.string = `剩余时间：${day}天`;

        let titleStr = '';
        let titleTipsStr = '';
        switch(this._viewType) {
            case DOUBLE_WEEK_VIEW_TYPE.REWARD: {
                titleStr = '活动奖励';
                titleTipsStr = '奖励需要依次兑换';
                break;
            }
            case DOUBLE_WEEK_VIEW_TYPE.TASK: {
                titleStr = '活动任务';
                titleTipsStr = '完成全部任务后可进入下一轮';
                break;
            }
            case DOUBLE_WEEK_VIEW_TYPE.GIFT: {
                titleStr = '活动礼包';
                titleTipsStr = '仅在活动期间可购买';
                break;
            }
            case DOUBLE_WEEK_VIEW_TYPE.WAR_ORDER:
                titleStr = '活动战令';
                titleTipsStr = '';
                break;
            default: {
                break;
            }
        }
        this.title.string = titleStr;
        this.titleTips.string = titleTipsStr;
    }

    private _refreshRedDot() {
        this.rewardToggleRedDot && this.rewardToggleRedDot.setData(RED_DOT_MODULE.ACTIVITY_DOUBLE_WEEK_REWARD_TOGGLE, {
            args: [this._activityId]
        });

        this.taskToggleRedDot && this.taskToggleRedDot.setData(RED_DOT_MODULE.ACTIVITY_DOUBLE_WEEK_TASK_TOGGLE, {
            args: [this._activityId]
        });

        this.giftBagToggleRedDot && this.giftBagToggleRedDot.setData(RED_DOT_MODULE.ACTIVITY_DOUBLE_WEEK_GIFT_TOGGLE, {
            args: [this._activityId]
        });
        redDotMgr.fire(RED_DOT_MODULE.ACTIVITY_DOUBLE_WEEK_TOGGLE);
    }

    private _refreshRewardView() {
        try {
            const doubleWeekConfig = configUtils.getDoubleWeekListConfig(this._activityId);
            const rewardConfigs: cfg.ActivityWeekSummonReward[] = configManager.getConfigByKV('doubleWeekReward', 'FunctionID', doubleWeekConfig.FunctionID);
            this._rewardList = rewardConfigs;
        } catch(err) {
            logger.error('ActivityDoubleWeekView _refreshRewardView err:', err);
        }
        this.rewardList.numItems = this._rewardList.length;
        // 滚动到当前可兑换的item
        const curIndex = this._rewardList.findIndex(_cfg => {
            return !activityData.doubleWeekData.ActivityDoubleWeekFunctionMap[this._activityId]
            || !activityData.doubleWeekData.ActivityDoubleWeekFunctionMap[this._activityId].ReceiveOrderMap[_cfg.GetOrder];
        });
        if(curIndex > -1) {
            this.rewardList.scrollTo(curIndex, 0.1);
        }
        // 刷新货币信息
        const itemId = Number(this._rewardList[0].NeedMoney.split(";")[0]);
        const itemCount: number = bagData.getItemCountByID(itemId);
        const iconUrl = resPathUtils.getItemIconPath(itemId);
        this._spriteLoader.changeSprite(this.moneyIcon, iconUrl);
        this.moneyNum.string = `${itemCount}`;
    }

    onClickReward () {
        if (!this._rewardList[0] || !this._rewardList[0].NeedMoney) {
            return;
        }
        const itemId = Number(this._rewardList[0].NeedMoney.split(";")[0])
        if (!itemId) return;

        const itemData: data.IBagUnit = {
            ID: itemId,
            Count: bagData.getItemCountByID(itemId)
        }
        this._loadView(VIEW_NAME.TIPS_ITEM, itemData);
    }

    onClickWarOrderReWard() {
        let warOrderRechargeCfg = this._getWarOrderRechargeCfg();
        if(!warOrderRechargeCfg || !warOrderRechargeCfg.reward) return;
        let reward = warOrderRechargeCfg.reward as ItemInfo;
        moduleUIManager.showItemDetailInfo(reward.itemId, reward.num, this.node);
    }

    onRewardItemRender(item: cc.Node, index: number) {
        const cfg = this._rewardList[index];
        const cmp = item.getComponent(ItemDoubleWeekReward);
        cmp.init(cfg, this._activityId, this._loadView.bind(this));
    }

    // 购买战令
    onClickBuyBattlePass() {
        let doubleWeekData = activityData.doubleWeekData;
        if(doubleWeekData && doubleWeekData.ActivityDoubleWeekFunctionMap && doubleWeekData.ActivityDoubleWeekFunctionMap[`${this._activityId}`]
            && doubleWeekData.ActivityDoubleWeekFunctionMap[`${this._activityId}`].IsSpecial)
        {
            guiManager.showTips('该战令已购买，请不要重复购买');
            this._updateWarOrderTopState();
            return;
        }
        let rechargetID = activityUtils.getDoubleWeekBattlePassRechargeId();
        let coinCnt: number, reward: ItemInfo = null;
        let rechargeCfg: cfg.ShopRechargeAndroid|cfg.ShopRechargeIOS = null;
        if (cc.sys.os == cc.sys.OS_IOS) {
            rechargeCfg = configManager.getConfigByKey('rechargeIOS', rechargetID);
            coinCnt = (rechargeCfg as cfg.ShopRechargeIOS).ShopRechargeIOSCost;
        } else {
            rechargeCfg = configManager.getConfigByKey('rechargeAndroid', rechargetID);
            coinCnt = (rechargeCfg as cfg.ShopRechargeAndroid).ShopRechargeAndroidCost;
        }
        shopOpt.sendRechargeReq(rechargetID, coinCnt);
    }

    private _onChangeProgress(){
        this._refreshTaskView();
    }

    private _refreshTaskView() {
        try {
            const doubleWeekConfig = configUtils.getDoubleWeekListConfig(this._activityId);
            const taskConfigs: cfg.ActivityWeekSummonTask[] = configManager.getConfigByKV('doubleWeekTask', 'FunctionID', doubleWeekConfig.FunctionID);
            taskConfigs.sort((_a, _b) => { return _a.RoundID - _b.RoundID; });
            const roundId = this._getCurTaskRound(taskConfigs);
            if(roundId <= 0) {
                return;
            }
            const doubleWeekTaskCfg = taskConfigs.find(_taskCfg => { return _taskCfg.RoundID == roundId; });
            this._taskList = doubleWeekTaskCfg.TaskList.split(";").map(_task => { return Number(_task); });
            this._taskList.sort((_a, _b) => {
                const _aComplete = taskData.getTaskIsCompleted(_a);
                const _aReward = taskData.getTaskIsReceiveReward(_a);
                const _bComplete = taskData.getTaskIsCompleted(_b);
                const _bReward = taskData.getTaskIsReceiveReward(_b);
                const _aNum = _aComplete ? (_aReward ? 1 : 3) : 2;
                const _bNum = _bComplete ? (_bReward ? 1 : 3) : 2;
                return _bNum - _aNum;
            })

            this.taskToggleBgs.children.forEach(_c => { _c.active = false; });
            this.taskToggleChecks.children.forEach(_c => { _c.active = false; });
            const templateBg = this.taskToggleBgs.children[0];
            const templateCheck = this.taskToggleChecks.children[0];
            for(let i = 0; i < taskConfigs.length; ++i) {
                let bg = this.taskToggleBgs.children[i];
                let check = this.taskToggleChecks.children[i];
                if(!bg) {
                    bg = cc.instantiate(templateBg);
                    this.taskToggleBgs.addChild(bg);
                }
                bg.x = -((i + 0.5) * bg.width + 20);
                bg.active = true;
                if(!check) {
                    check = cc.instantiate(templateCheck);
                    this.taskToggleChecks.addChild(check);
                }
                check.x = bg.x;
                check.active = taskConfigs.length - i == roundId;
            }
        } catch(err) {
            logger.error('ActivityDoubleWeekView _refreshRewardView err:', err);
        }
        this.taskList.numItems = this._taskList.length;

        const hasReward = this._checkHasRewardTask();
        this.onceReceiveTaskRewardBtn.setGray(!hasReward);
    }

    onTaskItemRender(item: cc.Node, index: number) {
        const taskId = this._taskList[index];
        const cmp = item.getComponent(ItemDoubleWeekTask);
        cmp.init(taskId, this._loadView.bind(this));
    }

    private _onGiftBagChange(){
        this._refreshGiftView();
        this._refreshRedDot();
    }

    private _refreshGiftView() {
        try {
            this._giftList.length = 0;
            const doubleWeekConfig = configUtils.getDoubleWeekListConfig(this._activityId);
            utils.parseStingList(doubleWeekConfig.GiftID, (strArr: string[]) => {
              this._giftList.push([parseInt(strArr[0]), parseInt(strArr[1])]);
            });

            this._giftList.sort((_a, _b) => {
                let _aShopId = _a[0];
                let _aLimitCount = _a[1];
                let _aShopCfg: cfg.ShopGift = configManager.getConfigByKey('gift', _aShopId);
                let _aBuyCount = 0;
                activityData.doubleWeekData.ActivityDoubleWeekFunctionMap[this._activityId]
                    && activityData.doubleWeekData.ActivityDoubleWeekFunctionMap[this._activityId].BuyGiftMap[_aShopId]
                    && (_aBuyCount = activityData.doubleWeekData.ActivityDoubleWeekFunctionMap[this._activityId].BuyGiftMap[_aShopId]);
                let _aCanBuyCount = _aLimitCount - _aBuyCount;

                let _bShopId = _b[0];
                let _bLimitCount = _b[1];
                let _bShopCfg: cfg.ShopGift = configManager.getConfigByKey('gift', _bShopId);
                let _bBuyCount = 0;
                activityData.doubleWeekData.ActivityDoubleWeekFunctionMap[this._activityId]
                    && activityData.doubleWeekData.ActivityDoubleWeekFunctionMap[this._activityId].BuyGiftMap[_bShopId]
                    && (_bBuyCount = activityData.doubleWeekData.ActivityDoubleWeekFunctionMap[this._activityId].BuyGiftMap[_bShopId]);
                let _bCanBuyCount = _bLimitCount - _bBuyCount;

                if((_aCanBuyCount > 0 && _bCanBuyCount > 0) || (_aBuyCount <= 0 && _bBuyCount <= 0)) {
                    return _aShopCfg.ShopGiftCost - _bShopCfg.ShopGiftCost;
                } else {
                    return _bCanBuyCount - _aCanBuyCount;
                }
            });
            this.giftList.numItems = this._giftList.length;
        } catch(err) {
            logger.log('ActivityDoubleWeekView _refreshGiftView err: ', err);
        }
    }

    onGiftItemRender(item: cc.Node, index: number) {
        const gift = this._giftList[index];
        const cmp = item.getComponent(ItemDoubleWeekGift);
        cmp.init(gift, this._activityId, this._loadView.bind(this));
    }

    private _refreshWarOrderView(isForce: boolean = false) {
        this._initWarOrderTopInfo();

        if(!isForce && this._isInitedWarOrder) return;
        this._isInitedWarOrder = true;
        let doubleWeekConfig = configUtils.getDoubleWeekListConfig(this._activityId);
        let warOrderData = configCache.getAtyWeekSummonBattlePassByFunctionID(doubleWeekConfig.FunctionID);
        this.unscheduleAllCallbacks();
        if(!warOrderData || warOrderData.length == 0) return;

        let gridData = warOrderData.map(ele => {
            return {
                key: ele + '',
                data: ele
            }
        });
        this.warOrderList.init(gridData, {
            onInit: (item: ItemDoubleWeekWarOrder, data: GridData) => {
                let onlyID: number = data.data;
                item.init(onlyID, this._activityId, this.node);
            },

            releaseItem: (item: ItemDoubleWeekWarOrder) => {
                item.deInit();
                this._warOrderItemPool.put(item.node);
            },
            getItem: (): ItemDoubleWeekWarOrder => {
                let node = this._getWarOrderItem();
                node.active = true;
                return node.getComponent(ItemDoubleWeekWarOrder);
            }
        });
    }

    private _initWarOrderTopInfo() {
        if(this._isInitedWarOrder) return;

        let warOrderRechargeCfg = this._getWarOrderRechargeCfg();
        this.warOrderPriceLb.string = `￥${warOrderRechargeCfg.costCnt}`;

        let leftLb = this.warOrderRechargeNode.getChildByName('leftLb').getComponent(cc.Label);
        leftLb.string = `购买后立即获得`;
        //@ts-ignore
        leftLb._forceUpdateRenderData();

        let reward = warOrderRechargeCfg.reward;
        if(!reward) {
            this.warOrderRechargeNode.active = false;
        } else {
            this.warOrderRechargeNode.active = true;
            let rightLb = this.warOrderRechargeNode.getChildByName('rightLb').getComponent(cc.Label);
            rightLb.string = `${reward.num}`;
            //@ts-ignore
            rightLb._forceUpdateRenderData();

            let iconSp = this.warOrderRechargeNode.getChildByName('icon').getComponent(cc.Sprite);

            let startX = -rightLb.node.width, spaceX = 5;
            rightLb.node.setPosition(startX, 0);
            startX -= (spaceX + iconSp.node.width);
            iconSp.node.setPosition(startX + (iconSp.node.width >> 1), 0);
            startX -= (spaceX + leftLb.node.width);
            leftLb.node.setPosition(startX, 0);

            this._spriteLoader.changeSprite(iconSp, resPathUtils.getItemIconPath(reward.itemId));
        }
        this._updateWarOrderTopState();
    }

    private _updateWarOrderTopState() {
        let doubleWeekData = activityData.doubleWeekData.ActivityDoubleWeekFunctionMap[`${this._activityId}`];
        let isBuyedSpe = !!(doubleWeekData && doubleWeekData.IsSpecial);
        this.warOrderRechargeBtn.node.active = !isBuyedSpe;
        this.warOrderBuyedNode.active = isBuyedSpe;
    }

    onClickToggle(toggle: cc.Toggle, customEventData: string) {
        let pageTag = parseInt(customEventData);
        if(this._viewType == pageTag) return;

        this._viewType = pageTag;
        this._refreshView();
    }

    onClickJumpToSummonBtn() {
        const isInSummonView = guiManager.checkViewOpenInScene('SummonView');
        if(isInSummonView) {
            this.closeView();
        } else {
            const moduleIds: cfg.FunctionConfig[] = configManager.getConfigByKV('function', 'FunctionName', 'SummonView');
            if(moduleIds && moduleIds.length > 0) {
                const moduleId = moduleIds[0].FunctionId;
                // 应策划要求 写死跳转到召唤英雄
                try {
                    const doubleWeekCfg = configUtils.getDoubleWeekListConfig(this._activityId);
                    const type = doubleWeekCfg.ActivityType;
                    const summonCardCfg: cfg.SummonCard[] = configManager.getConfigByKV('summon', 'SummonCardType', type);
                    if(summonCardCfg && summonCardCfg.length > 0) {
                        moduleUIManager.jumpToModule(moduleId, summonCardCfg[0].SummonCardId);
                    }
                } catch(err) {
                }
            }
        }
    }

    onClickOnceGetRewardTasks() {
        let canRewardTasks = this._getCanRewardTasks();
        if (!canRewardTasks || canRewardTasks.length == 0) {
            guiManager.showTips("没有可领奖的任务。");
            return;
        }
        taskDataOpt.sendReceiveTaskReward(canRewardTasks);
    }

    private _recvExchangeSuc(eventId: number, prizes: data.ItemInfo[]) {
        guiManager.showDialogTips(99000052);
        this._loadView(VIEW_NAME.GET_ITEM_VIEW, prizes);
        this._refreshRewardView();
        this._refreshRedDot();
    }

    private _recvGetReward(eventId: number, msg: gamesvr.TaskTargetReceiveRewardRes) {
        this._loadView(VIEW_NAME.GET_ITEM_VIEW, msg.Prizes);
        this._refreshTaskView();
        this._refreshRedDot();
    }

    private _recvChargeGiftSuc(eventId: number, msg: gamesvr.IPayResultNotify) {
        this._loadView(VIEW_NAME.GET_ITEM_VIEW, msg.PropertyList);
        this._refreshRedDot();
    }

    private _loadView(viewName: string, ...args: any[]) {
        this.loadSubView(viewName, ...args);
    }

    private _getCurTaskRound(cfgs: cfg.ActivityWeekSummonTask[]): number {
        let roundId: number = 0;
        for(let i = 0; i < cfgs.length; ++i) {
            const doubleWeekConfig = cfgs[i];
            const tasks = doubleWeekConfig.TaskList.split(";").map(_task => { return Number(_task); });
            for(let j = 0; j < tasks.length; ++j) {
                const taskId = tasks[j];
                const isCompleted = taskData.getTaskIsCompleted(taskId);
                if(!isCompleted) {
                    roundId = doubleWeekConfig.RoundID;
                    return roundId;
                }
                const isRewarded = taskData.getTaskIsReceiveReward(taskId);
                if(!isRewarded) {
                    roundId = doubleWeekConfig.RoundID;
                    return roundId;
                }

            }
            roundId = doubleWeekConfig.RoundID;
        }
        return roundId;
    }

    private _getCanRewardTasks(): number[] {
        let tasks: number[] = [];
        for(let i = 0; i < this._taskList.length; ++i) {
            const taskId = this._taskList[i];
            const isCompleted = taskData.getTaskIsCompleted(taskId);
            if(isCompleted) {
                const isRewarded = taskData.getTaskIsReceiveReward(taskId);
                if(!isRewarded) {
                    tasks.push(taskId);
                }
            }

        }
        return tasks;
    }

    private _checkHasRewardTask(): boolean {
        for(let i = 0; i < this._taskList.length; ++i) {
            const taskId = this._taskList[i];
            const isCompleted = taskData.getTaskIsCompleted(taskId);
            if(isCompleted) {
                const isRewarded = taskData.getTaskIsReceiveReward(taskId);
                if(!isRewarded) {
                    return true;
                }
            }

        }
        return false;
    }

    private _getWarOrderItem() {
        if(this._warOrderItemPool.size() > 0) {
            return this._warOrderItemPool.get();
        }

        return cc.instantiate(this.warOrderItemPfb);
    }

    // 获取战令充值配置
    private _getWarOrderRechargeCfg(): any {
        let rechargetID = activityUtils.getDoubleWeekBattlePassRechargeId();
        let coinCnt: number, reward: ItemInfo = null;
        let rechargeCfg: cfg.ShopRechargeAndroid|cfg.ShopRechargeIOS = null;
        if (cc.sys.os == cc.sys.OS_IOS) {
            rechargeCfg = configManager.getConfigByKey('rechargeIOS', rechargetID);
            coinCnt = (rechargeCfg as cfg.ShopRechargeIOS).ShopRechargeIOSCost/100;
            reward = {itemId: (rechargeCfg as cfg.ShopRechargeIOS).ShopRechargeIOSPropertyID, num: (rechargeCfg as cfg.ShopRechargeIOS).ShopRechargeIOSPropertyCount};
        } else {
            rechargeCfg = configManager.getConfigByKey('rechargeAndroid', rechargetID);
            coinCnt = (rechargeCfg as cfg.ShopRechargeAndroid).ShopRechargeAndroidCost/100;
            reward = {itemId: (rechargeCfg as cfg.ShopRechargeAndroid).ShopRechargeAndroidPropertyID, num: (rechargeCfg as cfg.ShopRechargeAndroid).ShopRechargeAndroidPropertyCount};
        }
        return {costCnt: coinCnt, reward: reward};
    }

    private _onDoubleWeekButBattlePassNty(cmd: number, atyID: number) {
        let warOrderRechargeCfg = this._getWarOrderRechargeCfg();
        if(warOrderRechargeCfg && warOrderRechargeCfg.reward &&  warOrderRechargeCfg.reward.num) {
            this._loadView(VIEW_NAME.GET_ITEM_VIEW, [{ID: warOrderRechargeCfg.reward.itemId, Count: warOrderRechargeCfg.reward.num}]);
        }

        this.scheduleOnce(() => {
            this._updateWarOrderTopState();
            let items = this.warOrderList.getItems() as Map<string, ItemDoubleWeekWarOrder>;
                items.forEach(ele => {
                    ele.updateState();
                });
        }, 0.05);
    }

    private _onRecvTokenDoubleWeekBattlePassReward(cmd: number, atyID: number, tokenIDs: number[], prizes: data.IItemInfo[]) {
        this._loadView(VIEW_NAME.GET_ITEM_VIEW, prizes);
        if(this._activityId == atyID) {
            this.scheduleOnce(() => {
                let items = this.warOrderList.getItems() as Map<string, ItemDoubleWeekWarOrder>;
                items.forEach(ele => {
                    if(tokenIDs.indexOf(ele.needDay) != -1) {
                        ele.updateState();
                    }
                });
            }, 0.5);
        }
    }
}
