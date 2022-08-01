import { activityUtils } from "../../../../app/ActivityUtils";
import { VIEW_NAME } from "../../../../app/AppConst";
import { utils } from "../../../../app/AppUtils";
import { configUtils } from "../../../../app/ConfigUtils";
import { resPathUtils } from "../../../../app/ResPathUrlUtils";
import { ViewBaseComponent } from "../../../../common/components/ViewBaseComponent";
import { configManager } from "../../../../common/ConfigManager";
import { eventCenter } from "../../../../common/event/EventCenter";
import { activityEvent, commonEvent } from "../../../../common/event/EventData";
import guiManager from "../../../../common/GUIManager";
import { scheduleManager } from "../../../../common/ScheduleManager";
import { SpriteLoader } from "../../../../common/ui-helper/SpriteLoader";
import { cfg } from "../../../../config/config";
import { data, gamesvr } from "../../../../network/lib/protocol";
import { activityData } from "../../../models/ActivityData";
import { serverTime } from "../../../models/ServerTime";
import { activityOpt } from "../../../operations/ActivityOpt";
import { shopOpt } from "../../../operations/ShopOpt";
import MessageBoxView from "../../view-other/MessageBoxView";
import ItemLuxuryGift, { ITEM_LUXURY_GIFT_STATE } from "./ItemLuxuryGift";

const {ccclass, property} = cc._decorator;

@ccclass
export default class ActivityLuxuryGiftView extends ViewBaseComponent {

    @property(cc.Prefab) itemLuxuryGiftPrefab: cc.Prefab = null;

    @property(cc.Label) dialogTitle: cc.Label = null;
    @property(cc.Node) layout: cc.Node = null;
    @property(cc.Sprite) weekCard: cc.Sprite = null;
    @property(cc.Sprite) monthCard: cc.Sprite = null;
    @property(cc.Sprite) foreverCard: cc.Sprite = null;
    @property(cc.Label) dialogDesc1: cc.Label = null;
    @property(cc.Label) dialogCost: cc.Label = null;
    @property(cc.Sprite) iconCost: cc.Sprite = null;
    @property(cc.Label) numCost: cc.Label = null;
    @property(cc.Node) btnBuy: cc.Node = null;
    @property(cc.Label) btnBuyLabel: cc.Label = null;
    @property(cc.Node) btnReceive: cc.Node = null;
    @property(cc.Node) iconReceived: cc.Node = null;
    @property(cc.Label) countDownLabel: cc.Label = null;
    @property(cc.Label) dialogDesc2: cc.Label = null;

    private _luxuryGiftEndTime: number = 0;         // 活动结束时间
    private _countDownScheduleID: number = 0;   // 计时任务回调ID


    private _gainItemID: number = 0;        // 礼包获得道具ID
    private _gainItemCount: number = 0;     // 礼包获得道具数量
    private _rechargeID: number = 0;        // 礼包ID
    private _price: number = 0;             // 礼包价格(元)

    private _isBought: boolean = false;                                     // 是否购买了礼包
    private _itemStates: {[string: number]: ITEM_LUXURY_GIFT_STATE} = {};   // 奖励状态
    private _boughtWeekCard: boolean = false;                                // 是否购买过周卡
    private _boughtMonthCard: boolean = false;                               // 是否购买过月卡
    private _boughtForeverCard: boolean = false;                             // 是否购买过永久卡
    private _dayList: number[] = [];                                         // 可领取的day数组

    private _spriteLoader: SpriteLoader = new SpriteLoader();

    onInit(luxuryGiftEndTime: number) {
        this._luxuryGiftEndTime = luxuryGiftEndTime;

        this._initEventRegister();
        this._prepareData();
        this._initView();
        this._refreshView();
    }

    onRelease() {
        this.layout.children.forEach((item) => {
            item.getComponent(ItemLuxuryGift).deInit();
        });

        this._countDownScheduleID && scheduleManager.unschedule(this._countDownScheduleID);
        eventCenter.unregisterAll(this);
        this._spriteLoader.release();
    }

    private _initEventRegister() {
        eventCenter.register(commonEvent.TIME_DAY_RESET, this, this.onRefreshView);
        eventCenter.register(activityEvent.LUXURY_GIFT_BUY_GIFT_NOTIFY, this, this.onLuxuryGiftBuyGiftNotify);
        eventCenter.register(activityEvent.LUXURY_GIFT_RECEIVE_REWARD_RES, this, this.onLuxuryGiftReceiveRewardRes);
    }

    private _prepareData() {
        if(cc.sys.os == cc.sys.OS_ANDROID) {
            const cfg: cfg.ShopRechargeAndroid = configManager.getOneConfigByManyKV('rechargeAndroid', 'ShopRechargeAndroidType', 4);
            this._rechargeID = cfg.ShopRechargeAndroidId;
            this._gainItemID = cfg.ShopRechargeAndroidPropertyID;
            this._gainItemCount = cfg.ShopRechargeAndroidPropertyCount;
            this._price = cfg.ShopRechargeAndroidCost / 100;
        } else {
            const cfg: cfg.ShopRechargeIOS = configManager.getOneConfigByManyKV('rechargeIOS', 'ShopRechargeIOSType', 4);
            this._rechargeID = cfg.ShopRechargeIOSId;
            this._gainItemID = cfg.ShopRechargeIOSPropertyID;
            this._gainItemCount = cfg.ShopRechargeIOSPropertyCount;
            this._price = cfg.ShopRechargeIOSCost / 100;
        }

        // 奖励状态
        const luxuryGiftData: data.IActivityLuxuryGiftData = activityData.luxuryGiftData;
        let giftConfigs: {[key: number]: cfg.ActivityMonthCardGift} = configManager.getConfigs("activityMonthCardGift"); 
        let openDate = new Date(serverTime.openServerTime * 1000);
        let beginOfOpenDay = utils.parseTimeToStamp(`${openDate.getFullYear()};${openDate.getMonth() + 1};${openDate.getDate()}`) / 1000;
        for (let key in giftConfigs) {
            if (serverTime.currServerTime() < (beginOfOpenDay + (Number(key)-1)*24*60*60)) {
                this._itemStates[key] = ITEM_LUXURY_GIFT_STATE.CAN_NOT_RECEIVE;
            } else if (luxuryGiftData.ReceiveRewardMap[key]) {
                this._itemStates[key] = ITEM_LUXURY_GIFT_STATE.RECEIVED;
            } else {
                this._itemStates[key] = ITEM_LUXURY_GIFT_STATE.CAN_RECEIVE;
            }
        }

        // 是否购买过卡
        const configs: {[key: number]: cfg.ActivityMonthCard} = configManager.getConfigs('monthlyCard');
        for (let key in configs) {
            if (!configs[key].HoldTime) {
                // 永久卡
                this._boughtForeverCard = activityData.monthlyCardData.HistoryBuyMonthCardMap[key];
            } else if (configs[key].HoldTime >= 30) {
                // 月卡
                this._boughtMonthCard = activityData.monthlyCardData.HistoryBuyMonthCardMap[key];
            } else if (configs[key].HoldTime >= 7) {
                // 周卡
                this._boughtWeekCard = activityData.monthlyCardData.HistoryBuyMonthCardMap[key];
            }
        }

        // 是否购买了礼包
        this._isBought = luxuryGiftData.BuyGift;

        // 是否有可领取的奖励
        let dayList: number[] = [];
        if (this._isBought) {
            for (let key in this._itemStates) {
                this._itemStates[key] === ITEM_LUXURY_GIFT_STATE.CAN_RECEIVE && dayList.push(Number(key));
            }
        }
        
        this._dayList = dayList;
    }

    private _initView() {
        // 标题
        this.dialogTitle.string = configUtils.getDialogCfgByDialogId(99000091).DialogText;
        
        // 奖励
        this._initItems();

        // 描述1
        this.dialogDesc1.string = configUtils.getDialogCfgByDialogId(99000092).DialogText;

        // 获得
        this.dialogCost.string = configUtils.getDialogCfgByDialogId(99000093).DialogText;
        this._spriteLoader.changeSprite(this.iconCost, resPathUtils.getItemIconPath(this._gainItemID));
        this.numCost.string = String(this._gainItemCount);

        // 按钮花费
        this.btnBuyLabel.string = `￥${this._price}`;

        // 描述2
        this.dialogDesc2.string = configUtils.getDialogCfgByDialogId(99000094).DialogText;

        // 倒计时
        if (!this._countDownScheduleID) {
            this.countDownLuxuryGift();
            this._countDownScheduleID = scheduleManager.schedule(this.countDownLuxuryGift.bind(this), 1);
        }
    }

    private _initItems() {
        let giftConfigs: {[key: number]: cfg.ActivityMonthCardGift} = configManager.getConfigs("activityMonthCardGift");
        let configArr: Array<cfg.ActivityMonthCardGift> = [];
        for (let key in giftConfigs) {
            configArr[Number(key)-1] = giftConfigs[key];
        }

        let count: number = utils.getObjLength(giftConfigs);
        let tempNode: cc.Node = cc.instantiate(this.itemLuxuryGiftPrefab);
        let itemWidth: number = tempNode.width;
        let spaceX: number = 10;
        let startX: number = -(count-1) * (itemWidth + spaceX) / 2;
        tempNode.destroy();
        
        let item: cc.Node = null;
        let parseResult: string[] = null;
        for (let i = 0; i < configArr.length; ++i) {
            parseResult = utils.parseStringTo1Arr(configArr[i].ActivityMonthCardGiftRewardShow, ";");

            item = cc.instantiate(this.itemLuxuryGiftPrefab);
            item.setPosition(startX + itemWidth * i, 0);
            item.getComponent(ItemLuxuryGift).init(i+1, Number(parseResult[0]), Number(parseResult[1]));
            item.parent = this.layout;
        }
    }

    private _refreshView() {
        let itemLuxuryGift: ItemLuxuryGift = null;
        this.layout.children.forEach((item) => {
            itemLuxuryGift = item.getComponent(ItemLuxuryGift);
            itemLuxuryGift.setState(this._itemStates[itemLuxuryGift.day]);
        });

        this.weekCard.node.color = this._boughtWeekCard ? cc.Color.BLUE : cc.Color.GRAY;
        this.monthCard.node.color = this._boughtMonthCard ? cc.Color.BLUE : cc.Color.GRAY;
        this.foreverCard.node.color = this._boughtForeverCard ? cc.Color.BLUE : cc.Color.GRAY;

        this.btnBuy.active = !this._isBought;
        this.btnReceive.active = this._isBought && this._dayList.length > 0;
        this.iconReceived.active = this._isBought && this._dayList.length == 0;
    }

    onRefreshView() {
        this._prepareData();
        this._refreshView();
    }

    onBtnClose() {
        this.closeView();
    }

    onBtnBuy() {
        if (this._boughtWeekCard && this._boughtMonthCard && this._boughtForeverCard) {
            shopOpt.sendRechargeReq(this._rechargeID, this._price);
        } else {
            let self = this;
            let cfg = configUtils.getDialogCfgByDialogId(2000025);
            guiManager.showMessageBoxByCfg(this.node, cfg, (msgBox: MessageBoxView) => {
                msgBox.closeView();
            }, (msgBox: MessageBoxView) => {
                msgBox.closeView();
                self.closeView();
            });
        }
    }

    onBtnReceive() {
        activityOpt.reqActivityLuxuryGiftReceiveReward(this._dayList);
    }

    countDownLuxuryGift() {
        let restTime: number = this._luxuryGiftEndTime - serverTime.currServerTime();

        if (restTime === 0) {
            this.closeView();
            return;
        }

        this.countDownLabel.string = `活动剩余时间：${utils.getTimeInterval(restTime)}`;
    }

    // 购买礼包反馈
    onLuxuryGiftBuyGiftNotify(event: number, msg: gamesvr.IActivityLuxuryGiftBuyGiftNotify) {
        guiManager.loadView(VIEW_NAME.GET_ITEM_VIEW, this.node, msg.Prizes);
        this.onRefreshView();
    }

    // 领取奖励反馈
    onLuxuryGiftReceiveRewardRes(event: number, msg: gamesvr.IActivityLuxuryGiftReceiveRewardRes) {
        guiManager.loadView(VIEW_NAME.GET_ITEM_VIEW, this.node, msg.Prizes);
        this.onRefreshView();
    }
}
