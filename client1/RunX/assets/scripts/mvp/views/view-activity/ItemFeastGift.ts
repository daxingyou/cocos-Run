import { utils } from "../../../app/AppUtils";
import { resPathUtils } from "../../../app/ResPathUrlUtils";
import { configManager } from "../../../common/ConfigManager";
import { eventCenter } from "../../../common/event/EventCenter";
import guiManager from "../../../common/GUIManager";
import { logger } from "../../../common/log/Logger";
import moduleUIManager from "../../../common/ModuleUIManager";
import { ItemBagPool } from "../../../common/res-manager/NodePool";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { uiHelper } from "../../../common/ui-helper/UIHelper";
import { cfg } from "../../../config/config";
import { activityData } from "../../models/ActivityData";
import { bagData } from "../../models/BagData";
import { shopOpt } from "../../operations/ShopOpt";
import ItemBag from "../view-item/ItemBag";

const {ccclass, property} = cc._decorator;
@ccclass
export default class ItemFeastGift extends cc.Component {
    @property(cc.Label) title: cc.Label = null;
    @property(cc.Label) lessLb: cc.Label = null;
    @property(cc.Label) giftTypeLb: cc.Label = null;
    @property(cc.Label) money: cc.Label = null;
    @property(cc.Sprite) moneySpr: cc.Sprite = null;
    @property(cc.Label) recvTag: cc.Label = null;
    @property(cc.Layout) rewardShowLayout: cc.Layout = null;
    @property(cc.Button) buyBtn: cc.Button = null;

    private _shopGiftCfg: cfg.ShopGift = null;
    private _feastCfg: cfg.ActivityFeastGift = null;
    private _itemBags: ItemBag[] = [];
    private _spriteLoader: SpriteLoader = new SpriteLoader();

    private _isRmb: boolean = false;

    init(feastId: number, giftId: number): void {
        this.deInit();
        this._shopGiftCfg = configManager.getConfigByKey("gift", giftId);
        this._feastCfg = configManager.getConfigByKey("activityFeastGift", feastId);
        if (!this._shopGiftCfg) {
            logger.error(`giftId:${giftId} not exist in ConfigShopGift`)
            return;
        }

        this._reflashItem();
        this.refreshMoenyBtnState();
        this._registerEvent();
    }

    /**item释放清理*/
    deInit() {
        this._itemBags.forEach(item => {
            ItemBagPool.put(item);
        })
        this._itemBags.length = 0;
        this._shopGiftCfg = null;
        this._feastCfg = null;
        this.rewardShowLayout.node.removeAllChildren();
        this.rewardShowLayout.node.width = 0;
        this._spriteLoader.release();
        eventCenter.unregisterAll(this);
    }

    private _registerEvent() {

    }

    updateLb() {
        let gitBuyMap = activityData.feastGiftData?.BuyGiftMap || {};
        this.title.string = this._shopGiftCfg.ShopGiftName;
        this.lessLb.string = `特惠\n${this._feastCfg.ActivityFeastGiftDiscountNum}%`;
        this.giftTypeLb.string = `开服限购(${gitBuyMap[this._shopGiftCfg.ShopGiftId] || 0}/${this._feastCfg.ActivityFeastGiftBuyNum})`;
    }

    private _reflashItem() {
        this.updateLb();
        let rewards = utils.parseStingList(this._shopGiftCfg.ShopGiftItemShow);
        for (let i = 0; i < rewards.length; i++) {
            let itemBag = ItemBagPool.get();
            itemBag.init({
                id: Number(rewards[i][0]),
                count: Number(rewards[i][1]),
                clickHandler: () => {
                    moduleUIManager.showItemDetailInfo(parseInt(rewards[i][0]), parseInt(rewards[i][1]), uiHelper.getRootViewComp(this.node).node);
                }
            })
            itemBag.node.scale = 0.55;
            itemBag.node.parent = this.rewardShowLayout.node;
            this.rewardShowLayout.node.width += itemBag.node.width * itemBag.node.scale;
        }
        this.rewardShowLayout.spacingX = -40;
    }

    /**刷新购买按钮的展示*/
    refreshMoenyBtnState() {
        //礼包已购买次数
        let countNum = activityData.feastGiftData.BuyGiftMap[this._shopGiftCfg.ShopGiftId] || 0;
        let maxCountNum = this._feastCfg.ActivityFeastGiftBuyNum;

        let isRecived = (countNum >= maxCountNum);
        this.buyBtn.node.active = !isRecived;
        this.recvTag.node.active = isRecived;

        if (isRecived) return;

        //价格--有货币 || RMB
        let buyTypeArr = utils.parseStingList(this._shopGiftCfg.ShopGiftBuyType);
        this._isRmb = (this._shopGiftCfg.ShopGiftBuyType == "1");
        let count = this._isRmb ? (this._shopGiftCfg.ShopGiftCost / 100) : this._shopGiftCfg.ShopGiftCost;
        if (this._isRmb) {
            this.money.string = `￥${count}`;
        } else {
            this.moneySpr.node.active = true;
            this.money.string = count.toString();
            this._spriteLoader.changeSprite(this.moneySpr, resPathUtils.getItemIconPath(Number(buyTypeArr[0][1])));
        }
    }

    itemClick() {
        let count = this._isRmb ? (this._shopGiftCfg.ShopGiftCost / 100) : this._shopGiftCfg.ShopGiftCost;
        if (this._isRmb) {
            shopOpt.sendBuyGiftReq(this._shopGiftCfg.ShopGiftId, count);
        } else {
            // 游戏内货币购买
            let itemInfo = utils.parseStringTo1Arr(this._shopGiftCfg.ShopGiftBuyType, ';');
            let itemID = parseInt(itemInfo[1]);
            if(bagData.getItemCountByID(itemID) < count) {
                guiManager.showDialogTips(1000127, itemID);
                return;
            }
            shopOpt.sendBuyCurrencyGift(this._shopGiftCfg.ShopGiftId);
        }
    }
}