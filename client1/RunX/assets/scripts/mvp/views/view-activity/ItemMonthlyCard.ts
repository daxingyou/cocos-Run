import { activityUtils } from "../../../app/ActivityUtils";
import { appCfg } from "../../../app/AppConfig";
import { CustomItemId } from "../../../app/AppConst";
import { utils } from "../../../app/AppUtils";
import { configUtils } from "../../../app/ConfigUtils";
import { resPathUtils } from "../../../app/ResPathUrlUtils";
import ButtonEx from "../../../common/components/ButtonEx";
import guiManager from "../../../common/GUIManager";
import { logger } from "../../../common/log/Logger";
import moduleUIManager from "../../../common/ModuleUIManager";
import { ItemBagPool } from "../../../common/res-manager/NodePool";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { activityData } from "../../models/ActivityData";
import { serverTime } from "../../models/ServerTime";
import { activityOpt } from "../../operations/ActivityOpt";
import { shopOpt } from "../../operations/ShopOpt";
import ItemBag from "../view-item/ItemBag";
import ItemRedDot from "../view-item/ItemRedDot";

const enum MONTHLY_CARD_STATE {
    NOT_OPEN,
    OPEN,
    REWARDED
}

const {ccclass, property} = cc._decorator;

@ccclass
export default class ItemMonthlyCard extends cc.Component {
    @property(cc.Sprite) title: cc.Sprite = null;
    @property(cc.Node) onceRewards: cc.Node = null;
    @property(cc.Node) onceRewarded: cc.Node = null;
    @property(cc.Node) dayRewards: cc.Node = null;
    @property(cc.Node) dayRewarded: cc.Node = null;
    @property(ButtonEx) chargeBtn: ButtonEx = null;
    @property(ButtonEx) getRewardBtn: ButtonEx = null;
    @property(cc.Label) surplusDay: cc.Label = null;
    @property(cc.Label) tips: cc.Label = null;
    @property(cc.Sprite) priceIcon: cc.Sprite = null;
    @property(ItemRedDot) itemRedDot: ItemRedDot = null;

    private _monthlyCardId: number = 0;
    private _loadView: Function = null;
    private _spriteLoader: SpriteLoader = new SpriteLoader();

    getCardID() {
        return this._monthlyCardId;
    }

    init(id: number, loadView: Function) {
        this._monthlyCardId = id;
        this._loadView = loadView;
        this.refreshView();
    }

    unuse () {
        this.deInit();
    }

    deInit() {
        this.unscheduleAllCallbacks();
        this._clearReward(this.onceRewards);
        this._clearReward(this.dayRewards);
        this._spriteLoader.release();
    }

    refreshView() {
        try {
            const monthlyCardCfg = configUtils.getMonthlyCardConfig(this._monthlyCardId);
            const state = this._getState();

            this.onceRewarded.active = MONTHLY_CARD_STATE.NOT_OPEN != state;
            this.chargeBtn.setActivity(MONTHLY_CARD_STATE.NOT_OPEN == state);
            this.dayRewarded.active = MONTHLY_CARD_STATE.REWARDED == state;
            this.getRewardBtn.setActivity(MONTHLY_CARD_STATE.NOT_OPEN != state);
            this.getRewardBtn.setGray(MONTHLY_CARD_STATE.REWARDED == state);
            this.getRewardBtn.setButtonTipsContent(MONTHLY_CARD_STATE.REWARDED == state ? '已领取' : '领取');
            this.surplusDay.node.active = MONTHLY_CARD_STATE.NOT_OPEN != state;
            this.itemRedDot.showRedDot(MONTHLY_CARD_STATE.OPEN == state);
            if(MONTHLY_CARD_STATE.NOT_OPEN != state) {
                this.priceIcon.node.active = false;
                this._scheduleUpdateTime();
            } else {
                const costMoney = activityUtils.getMonthlyCardCost(this._monthlyCardId);
                if(appCfg.UseTestMoney){
                    this._spriteLoader.changeSprite(this.priceIcon, resPathUtils.getItemIconPath(CustomItemId.ZI_YV), () => {
                        this.priceIcon.node.active = true;
                    });
                    this.chargeBtn.setButtonTipsContent(`${costMoney}`);
                    let buttonTips = this.chargeBtn.buttonTips;
                    //@ts-ignore
                    buttonTips.getComponent(cc.Label)._forceUpdateRenderData();
                    let totalWh = this.priceIcon.node.width + buttonTips.width;
                    let halfWh = totalWh >> 1;
                    buttonTips.x = halfWh - (buttonTips.width >> 1);
                    this.priceIcon.node.x = -halfWh + (this.priceIcon.node.width >> 1);
                }else{
                    this.chargeBtn.setButtonTipsContent(`${costMoney}元`);
                    this.chargeBtn.buttonTips.x = 0;
                }
                this.tips.string = monthlyCardCfg.HoldTime ? '' : '永久生效';
            }

            this._spriteLoader.changeSprite(this.title, monthlyCardCfg.ShowImage);

            this._refreshRewardView(this.onceRewards, monthlyCardCfg.GetRewardShow);
            this._refreshRewardView(this.dayRewards, monthlyCardCfg.DayRewardShow);
        } catch(err) {
            logger.error('ItemMonthlyCard refreshView err: ', err);
        }
    }

    private _scheduleUpdateTime(){
        const monthlyCardCfg = configUtils.getMonthlyCardConfig(this._monthlyCardId);
        if(!monthlyCardCfg.HoldTime || this._getSurplusDay() <= 0) {
            this.surplusDay.string = '';
            return;
        }
        this.surplusDay.string =  `剩余${utils.getTimeLeft(this._getSurplusDay())}`;
        this.schedule(() => {
            let leftTime =  this._getSurplusDay();
            if(leftTime <= 0){
                this.unscheduleAllCallbacks();
                this.surplusDay.string = '';
                return;
            }
            this.surplusDay.string = `剩余${utils.getTimeLeft(leftTime)}`;
        }, 1);
    }

    private _refreshRewardView(parent: cc.Node, str: string) {
        this._clearReward(parent);
        const rewards: number[][] = str.split('|').map(_itemInfo => { return _itemInfo.split(';').map(_l => { return Number(_l); }); });
        for(let i = 0; i < rewards.length; ++i) {
            const itemId = rewards[i][0];
            const count = rewards[i][1];
            const itemBagCmp = ItemBagPool.get();
            parent.addChild(itemBagCmp.node);
            itemBagCmp.node.scale = 0.8;
            itemBagCmp.init({
                id: itemId,
                count: count,
                clickHandler: () => {
                    moduleUIManager.showItemDetailInfoByLoadView(itemId, count, this._loadView.bind(this));
                }
            });
        }
    }

    onClickChargeBtn() {
        let rechargeId = activityUtils.getMonthlyCardRechargeId(this._monthlyCardId);
        let costMoney = activityUtils.getMonthlyCardCost(this._monthlyCardId);
        shopOpt.sendRechargeReq(rechargeId, costMoney);
    }

    onClickGetRewardBtn() {
        const state = this._getState();
        if(MONTHLY_CARD_STATE.REWARDED == state) {
            guiManager.showTips('今日已领取');
        } else {
            activityOpt.sendReceiveMonthlyCardDayReward(this._monthlyCardId);
        }
    }

    private _clearReward(parent: cc.Node) {
        let children = [...parent.children];
        children.forEach(_c => {
            const cmp = _c.getComponent(ItemBag);
            if(cmp) {
                _c.scale = 1;
                _c.removeFromParent();
                ItemBagPool.put(cmp);
            }
        });
    }

    private _getState(): MONTHLY_CARD_STATE {
        const monthlyCardData = activityData.monthlyCardData && activityData.monthlyCardData.ActivityMonthCardFastenMap[this._monthlyCardId];
        if(!monthlyCardData) {
            return MONTHLY_CARD_STATE.NOT_OPEN;
        }
        const todayZeroTime = utils.getTodayZeroTime(true);
        const monthlyCardCfg = configUtils.getMonthlyCardConfig(this._monthlyCardId);
        if(monthlyCardCfg && !monthlyCardCfg.HoldTime) {
            // 永久卡
            if(monthlyCardData.LastReceiveGetRewardTime >= todayZeroTime) {
                return MONTHLY_CARD_STATE.REWARDED;
            } else {
                return MONTHLY_CARD_STATE.OPEN;
            }
        }
        // 过期时间
        const overDueTime = monthlyCardData.ExpiredTime;
        if(overDueTime >= todayZeroTime && overDueTime < todayZeroTime + 24 * 60 * 60) {
            // 是在过期的这一天
            if(monthlyCardData.LastReceiveGetRewardTime >= todayZeroTime) {
                return MONTHLY_CARD_STATE.NOT_OPEN;
            } else {
                return MONTHLY_CARD_STATE.OPEN;
            }
        } else {
            if(overDueTime >= todayZeroTime) {
                if(monthlyCardData.LastReceiveGetRewardTime >= todayZeroTime) {
                    return MONTHLY_CARD_STATE.REWARDED;
                } else {
                    return MONTHLY_CARD_STATE.OPEN;
                }
            } else {
                return MONTHLY_CARD_STATE.NOT_OPEN;
            }
        }
    }

    private _getSurplusDay(): number {
        let monthlyCardData = activityData.monthlyCardData.ActivityMonthCardFastenMap[this._monthlyCardId];
        if(!monthlyCardData) {
            return 0;
        }
        // 过期时间
        let overDueTime = monthlyCardData.ExpiredTime || 0;
        return overDueTime - serverTime.currServerTime();
    }

}
