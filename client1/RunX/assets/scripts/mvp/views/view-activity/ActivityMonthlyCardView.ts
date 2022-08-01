import { activityUtils } from "../../../app/ActivityUtils";
import { TREASURE_SYS_POWER_TYPE, VIEW_NAME } from "../../../app/AppConst";
import { utils } from "../../../app/AppUtils";
import { configUtils } from "../../../app/ConfigUtils";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { configManager } from "../../../common/ConfigManager";
import { eventCenter } from "../../../common/event/EventCenter";
import { activityEvent, commonEvent } from "../../../common/event/EventData";
import guiManager from "../../../common/GUIManager";
import { redDotMgr, RED_DOT_MODULE } from "../../../common/RedDotManager";
import { scheduleManager } from "../../../common/ScheduleManager";
import { cfg } from "../../../config/config";
import { data, gamesvr } from "../../../network/lib/protocol";
import { serverTime } from "../../models/ServerTime";
import { taskData } from "../../models/TaskData";
import ItemMonthlyCard from "./ItemMonthlyCard";

const {ccclass, property} = cc._decorator;

@ccclass
export default class ActivityMonthlyCardView extends ViewBaseComponent {
    @property(cc.Node) itemRoot: cc.Node = null;
    @property(cc.Prefab) itemMonth: cc.Prefab = null;
    @property(cc.Node) btnLuxuryGift: cc.Node = null;
    @property(cc.Label) labelCountDownLuxury: cc.Label = null;

    private _itemMonthCard: ItemMonthlyCard[] = [];
    private _monthlyCards: number[] = [];
    private _luxuryGiftEndTime: number = 0;     // 至尊豪礼结束时间(s)
    private _countDownScheduleID: number = 0;   // 计时任务回调ID

    onInit() {
        this.doInit();
        this._initView();
    }

    doInit() {
        eventCenter.register(activityEvent.RECEIVE_MONTHLY_CARD_DAY_REWARD, this, this._recvGetMonthlyCardDayReward);
        eventCenter.register(activityEvent.BUY_MONTHLY_CARD_SUC, this, this._recvBuyMonthlyCardSuc);
        eventCenter.register(commonEvent.TIME_DAY_RESET, this, this._onDayReset);
    }

    onRelease() {
        eventCenter.unregisterAll(this);
        this._itemMonthCard.forEach(_itemMonth => {
            _itemMonth.deInit();
        })
        this._itemMonthCard.length = 0;
        this.itemRoot.destroyAllChildren()
        this.releaseSubView();
        this._hideBtnLuxuryGift();
    }

    //只有初始化的时候才调用
    private _initView(){
        this._prepareData();
        this._monthlyCards.forEach( _mID => {
            let ndMonth = cc.instantiate(this.itemMonth);
            let comp = ndMonth.getComponent(ItemMonthlyCard)
            comp.init(_mID, this._loadView.bind(this));

            this.itemRoot.addChild(ndMonth);
            this._itemMonthCard.push(comp)
        });

        // 显示至尊豪礼
        if (serverTime.currServerTime() < this._luxuryGiftEndTime) {
            this._showBtnLuxuryGift();
        }
    }


    private _refreshView(cardID?: number) {
        //刷新所有项
        if(typeof cardID == 'undefined'){
          this._itemMonthCard.forEach(ele => {
              ele && cc.isValid(ele) && ele.refreshView();
          });
          return;
        }

        //刷新某个月卡
        this._itemMonthCard.some(ele => {
            if(ele.getCardID() == cardID){
                ele && cc.isValid(ele) && ele.refreshView();
                return true;
            }
            return false;
        })
    }

    private _prepareData() {
        if(this._monthlyCards && this._monthlyCards.length != 0) return;

        const configs: any = configManager.getConfigs('monthlyCard');
        for(let k in configs) {
            if(configs.hasOwnProperty(k)){
              this._monthlyCards.push(configs[k].ID);
            }
        }

        // 开服时间 + 持续时间 = 结束时间
        let holdTime = configUtils.getModuleConfigs().ActivityMonthCardGiftHoldTime;
        holdTime = holdTime ? holdTime : 0;
        this._luxuryGiftEndTime = activityUtils.calBeginEndTime("1|1", holdTime)[1];
    }

    private _recvBuyMonthlyCardSuc(eventId: number, msg: gamesvr.ActivityMonthCardBuyMonthCardNotify) {
        this._loadView(VIEW_NAME.GET_ITEM_VIEW, msg.Prizes);
        this._refreshView(msg.FastenID);
        redDotMgr.fire(RED_DOT_MODULE.ACTIVITY_MONTHLY_CARD_TOGGLE);
    }

    private _recvGetMonthlyCardDayReward(eventId: number, msg: gamesvr.ActivityMonthCardReceiveDayRewardRes) {
        let prizes = msg.Prizes;

        let extraPrizes = this._getExtraPrizes(msg.FastenID);
        //有额外奖励的情况下，分离出原始奖励的额外奖励
        if(extraPrizes && extraPrizes.length > 0){
            for(let i = 0, len = prizes.length; i < len; i++) {
                let prize = prizes[i];
                let extraPrize = extraPrizes.find(ele => {
                    return ele.ID == prize.ID;
                });
                if(!extraPrize || utils.longToNumber(extraPrize.Count) <= 0) continue;
                let count = utils.longToNumber(prize.Count);
                let extraCnt = utils.longToNumber(extraPrize.Count);
                if(count == extraCnt){
                    prizes.splice(i, 1);
                    i--;
                    len --;
                }
            }
        }
        this._loadView(VIEW_NAME.GET_ITEM_VIEW, prizes, extraPrizes);
        this._refreshView(msg.FastenID);
        redDotMgr.fire(RED_DOT_MODULE.ACTIVITY_MONTHLY_CARD_TOGGLE);
    }

    private _onDayReset() {
        this._refreshView();
        redDotMgr.fire(RED_DOT_MODULE.ACTIVITY_MONTHLY_CARD_TOGGLE);
    }

    private _loadView(viewName: string, ...args: any[]) {
        guiManager.loadView(viewName, guiManager.sceneNode, ...args);
    }

    private _getExtraPrizes(fastenID: number){
        if(!fastenID) return null;
        let prizes: data.IItemInfo[] = null;
        //周卡奖励
        if(fastenID== 10001){
            //10004：赠送体力的宝物参数，在表LeadTreasure中, 10010002: 仙玉道具ID
            let extra = taskData.getTreasureSysPowerParam(TREASURE_SYS_POWER_TYPE.YUE_GUANG_BAO_HE);
            extra && (prizes = [{ID: 10010002, Count: extra}]);
        }

        //月卡奖励
        if(fastenID == 10002){
            //10005：赠送宝箱的宝物参数，在表LeadTreasure中, 10019013: 宝箱道具ID
            let extra = taskData.getTreasureSysPowerParam(TREASURE_SYS_POWER_TYPE.GE_SHI_HUA_LONG);
            extra && (prizes = [{ID: 10019013, Count: extra}]);
        }

        //永久卡奖励
        if(fastenID == 10003){
            //10006：赠送体力的宝物参数，在表LeadTreasure中, 10010002: 仙玉道具ID
            let extra = taskData.getTreasureSysPowerParam(TREASURE_SYS_POWER_TYPE.QIAN_KUN_BAI_BAO_DAI);
            extra && (prizes = [{ID: 10010002, Count: extra}]);
        }
        return prizes;
  }

    private _showBtnLuxuryGift() {
        this.btnLuxuryGift.active = true;

        if (!this._countDownScheduleID) {
            this.countDownLuxuryGift();
            this._countDownScheduleID = scheduleManager.schedule(this.countDownLuxuryGift.bind(this), 1);
        }
    }

    private _hideBtnLuxuryGift() {
        this.btnLuxuryGift.active = false;

        if (this._countDownScheduleID) {
            scheduleManager.unschedule(this._countDownScheduleID);
        }
    }

    countDownLuxuryGift() {
        let restTime: number = this._luxuryGiftEndTime - serverTime.currServerTime();

        if (restTime === 0) {
            this._hideBtnLuxuryGift();
            return;
        }

        this.labelCountDownLuxury.string = utils.getTimeInterval(restTime);
    }

    onBtnLuxuryGift() {
        // 因为层级遮挡的关系，直接添加到root_node上
        guiManager.loadView(VIEW_NAME.ACTIVITY_LUXURY_GIFT_VIEW, this.node.parent.parent, this._luxuryGiftEndTime);
    }
}
