/*
 * @Author: xuyang
 * @Date: 2021-06-21 17:39:22
 * @Description: 道具购买弹窗
 */
import { CustomDialogId, PRODUCR_WITH_TREASURE_MAP, RES_ICON_PRE_URL, VIEW_NAME } from "../../../app/AppConst";
import { utils } from "../../../app/AppUtils";
import { bagDataUtils } from "../../../app/BagDataUtils";
import { configUtils } from "../../../app/ConfigUtils";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { configManager } from "../../../common/ConfigManager";
import { eventCenter } from "../../../common/event/EventCenter";
import { commonEvent, shopEvent } from "../../../common/event/EventData";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { cfg } from "../../../config/config";
import { data } from "../../../network/lib/protocol";
import { bagData } from "../../models/BagData";
import { shopOpt } from "../../operations/ShopOpt";
import { checkProductRestrict } from "./ShopView";
import ItemBag from "../view-item/ItemBag";
import RichTextEx from "../../../common/components/rich-text/RichTextEx";
import { ItemBagPool } from "../../../common/res-manager/NodePool";
import { trackData } from "../../models/TrackData";
import guiManager from "../../../common/GUIManager";
import { taskData } from "../../models/TaskData";

const { ccclass, property } = cc._decorator;
@ccclass
export default class ShopCommodityView extends ViewBaseComponent {

    @property(cc.Label) restrict: cc.Label = null;      //购买限制
    @property(cc.Label) itemName: cc.Label = null;      //道具名称
    @property(cc.Label) itemDesc: cc.Label = null;      //道具名称
    @property(cc.Label) itemCount: cc.Label = null;      //道具名称
    @property(cc.Node) empty: cc.Node = null;           //道具Item
    @property(cc.EditBox) input: cc.EditBox = null;     //输入框
    @property(cc.Label) inputLb: cc.Label = null;       //选择数量

    @property(cc.Sprite) priceIcon: cc.Sprite = null;
    @property(RichTextEx) price: RichTextEx = null;

    private _itemID: number = 0;
    private _itemCnt: number = 0;
    private _perPrice: number = 0;
    private _limitNum: number = 0;
    private _productId: number = 0;
    private _cfg: cfg.ShopCommodity = null;
    private _randomCfg: cfg.ShopRandom = null;
    private _item: ItemBag = null;
    private _sprLoader: SpriteLoader = new SpriteLoader();
    private _canClickClose: boolean = false;

    onInit(commodityID: number) {
        this.scheduleOnce(()=> { this._canClickClose = true; }, 0.3)
        this._productId = Number(commodityID);
        this._cfg = configManager.getConfigByKey("commodity", commodityID);
        this._randomCfg = configManager.getConfigByKey("shopRandom", commodityID);

        if (this._cfg){
            let parseInfo = utils.parseStingList(this._cfg.ShopCommodityItem)[0];
            this._itemID = Number(parseInfo[0]);
            this._itemCnt = Number(parseInfo[1]);
            this.showView();
            this.registerEvent();
        } 
        else if(this._randomCfg){
            let parseInfo = utils.parseStingList(this._randomCfg.ShopCommodityItem)[0];
            this._itemID = Number(parseInfo[0]);
            this._itemCnt = Number(parseInfo[1]);
            this.showRandomView();
            this.registerEvent();
        }
       
    }

    registerEvent() {
        eventCenter.register(shopEvent.BUY_PRODUCT, this, this.closeView);
        eventCenter.register(shopEvent.BUY_RANDOM, this, this.closeView);
        eventCenter.register(commonEvent.TIME_DAY_RESET, this, this._onTimeDayReset);
    }

    private showView() {
        if (!this._itemID) return;
        let pItem = this.empty.getComponentInChildren("ItemBag");
        let cfg = configUtils.getItemConfig(this._itemID);
        let remainNum = 0;
        if (!pItem) {
            pItem = ItemBagPool.get();
            pItem.node.parent = this.empty;
        }
        pItem.init({
            id: this._itemID,
            count: this._itemCnt
        });
        this.itemName.string = cfg.ItemName;
        this.itemDesc.string = cfg.ItemIntroduce;
        this.itemCount.string = `拥有数量：${bagData.getItemCountByID(this._itemID) || 0}`
        //限制购买，每日/每周/每月/终身
        if (this._cfg.ShopCommodityLimit) {

            let limitCondis = utils.parseStingList(this._cfg.ShopCommodityLimit)[0];
            let limitType = parseInt(limitCondis[0]), limitValue = parseInt(limitCondis[1]);
            if(PRODUCR_WITH_TREASURE_MAP.hasOwnProperty(this._cfg.ShopCommodityId)){
                let extra = taskData.getTreasureSysPowerParam(PRODUCR_WITH_TREASURE_MAP[this._cfg.ShopCommodityId]);
                extra && (limitValue += extra);
            }

            let dateHead = ["", "今日", "本周", "本月", "永久"];
            let buyCnt = checkProductRestrict(this._productId)[0];
            this.restrict.string = `${dateHead[limitType]}限购(${limitValue - buyCnt}/${limitValue})`
            remainNum = limitValue - buyCnt;
            this._limitNum = remainNum;
        }
        //读取配置
        let configModule = configUtils.getModuleConfigs();
        if (configModule.BuyItemMax && remainNum) {
            this._limitNum = Math.min(remainNum, configModule.BuyItemMax);
        } else if (configModule.BuyItemMax) {
            this._limitNum = configModule.BuyItemMax;
        }
        //价格
        let parseInfoP = utils.parseStingList(this._cfg.ShopCommodityCost)[0];
        let prizeIconRes = `${RES_ICON_PRE_URL.BAG_ITEM}/${configUtils.getItemConfig(Number(parseInfoP[0])).ItemIcon}`
        this._perPrice = Number(parseInfoP[1]);;
        this._sprLoader.changeSpriteP(this.priceIcon, prizeIconRes);
        this.priceIcon.node.active = !!this._perPrice;
        this.price.string = this._perPrice ? `${Number(this.inputLb.string) * this._perPrice}` : "免费";
        this.changePriceStatus();
    }

    private showRandomView() {
        if (!this._itemID) return;
        let pItem = this.empty.getComponentInChildren("ItemBag");
        let cfg = configUtils.getItemConfig(this._itemID);
        let remainNum = 0;
        if (!pItem) {
            pItem = ItemBagPool.get();
            pItem.node.parent = this.empty;
        }
        pItem.init({
            id: this._itemID,
            count: this._itemCnt
        });
        this.itemName.string = cfg.ItemName;
        this.itemDesc.string = cfg.ItemIntroduce;
        this.itemCount.string = `拥有数量：${bagData.getItemCountByID(this._itemID) || 0}`
        //限制购买，每日/每周/每月/终身
        let shopRandomDataMap = trackData.shopRandomData ? trackData.shopRandomData.RandomShopCommodityIDMap : {};
        let buyCnt = shopRandomDataMap[this._productId] ? 1 : 0;
        this.restrict.string = `限购(${1 - buyCnt}/1)`;
        remainNum = 1 - buyCnt;
        this._limitNum = remainNum;
        //读取配置
        let configModule = configUtils.getModuleConfigs();
        if (configModule.BuyItemMax && remainNum) {
            this._limitNum = Math.min(remainNum, configModule.BuyItemMax);
        } else if (configModule.BuyItemMax) {
            this._limitNum = configModule.BuyItemMax;
        }
        //价格
        let parseInfoP = utils.parseStingList(this._randomCfg.ShopCommodityCost)[0];
        let prizeIconRes = `${RES_ICON_PRE_URL.BAG_ITEM}/${configUtils.getItemConfig(Number(parseInfoP[0])).ItemIcon}`
        this._perPrice = Number(parseInfoP[1]);;
        this._sprLoader.changeSpriteP(this.priceIcon, prizeIconRes);
        this.priceIcon.node.active = !!this._perPrice;
        this.price.string = this._perPrice ? `${Number(this.inputLb.string) * this._perPrice}` : "免费";
        this.changePriceStatus();
    }

    private _onTimeDayReset(){
        if (this._randomCfg) {
            guiManager.showDialogTips(CustomDialogId.RANDOM_SHOP_OVERTIME);
            this.closeView();
        }
    }

    onClickItem() {
        let config = configUtils.getItemConfig(this._itemID);
        let config1 = configUtils.getEquipConfig(this._itemID);
        if (config) {
            let newitem: data.IBagUnit = { ID: this._itemID, Count: 0, Seq: 0 };
            let findItem = bagData.getItemByID(this._itemID);
            let item: data.IBagUnit = findItem ? findItem.Array[0] : newitem;
            item && this.loadSubView(VIEW_NAME.TIPS_ITEM, item);
        } else if (config1) {
            let item: data.IBagUnit = bagDataUtils.buildDefaultEquip(this._itemID);
            this.loadSubView(VIEW_NAME.TIPS_EQUIP, item);
        }
    }

    onClickAdd() {
        let priceItem = this._cfg ? utils.parseStingList(this._cfg.ShopCommodityCost)[0] : utils.parseStingList(this._randomCfg.ShopCommodityCost)[0];
        let maxCnt = Math.floor(bagData.getItemCountByID(Number(priceItem[0])) / this._perPrice);
        let num = Number(this.inputLb.string);
        if (!(this._limitNum && (num + 1) > this._limitNum)) {
            num += 1;
            this.inputLb.string = Math.max(1, Math.min(num, maxCnt)).toString();
        }
        this.changePriceStatus();
    }

    onClickAddTen() {
        let priceItem = this._cfg ? utils.parseStingList(this._cfg.ShopCommodityCost)[0] : utils.parseStingList(this._randomCfg.ShopCommodityCost)[0];
        let maxCnt = Math.floor(bagData.getItemCountByID(Number(priceItem[0])) / this._perPrice);
        let num = Number(this.inputLb.string);
        if (!(this._limitNum && (num + 10) > this._limitNum)) {
            num += 10;
            this.inputLb.string = Math.max(1, Math.min(num, maxCnt)).toString();
        } else {
            num = this._limitNum;
            this.inputLb.string = Math.max(1, Math.min(num, maxCnt)).toString();
        }
        this.changePriceStatus();
    }

    onClickMinus() {
        let num = Number(this.inputLb.string);
        if (num && num > 1) {
            this.inputLb.string = (num - 1).toString();
        }
        this.changePriceStatus();
    }

    onClickMinusTen() {
        let num = Number(this.inputLb.string);
        if (num && (num - 10) > 1) {
            this.inputLb.string = (num - 10).toString();
        } else {
            this.inputLb.string = "1";
        }
        this.changePriceStatus();
    }

    onEditCallback(target: cc.EditBox) {
        let num = Number(this.input.string);
        if (!num || num <= 0) {
            this.input.string = "1";
        } else if (this._limitNum && num > this._limitNum) {
            this.input.string = `${this._limitNum}`;
        }
        this.changePriceStatus();
    }
    //加入货币数量限制
    changePriceStatus() {
        let priceItem = this._cfg ? utils.parseStingList(this._cfg.ShopCommodityCost)[0] : utils.parseStingList(this._randomCfg.ShopCommodityCost)[0];
        let haveCnt = bagData.getItemCountByID(Number(priceItem[0]));
        let needCnt = Number(this.inputLb.string) * this._perPrice;
        let needStr = needCnt < 1000000 ? `${needCnt}` : `${Math.floor(needCnt / 10000)}万`;

        this.priceIcon.node.active = !!this._perPrice;
        this.price.string = this._perPrice ? `${needStr}` : "免费";
        this.price.node.color = (needCnt <= haveCnt) ? cc.color(138, 94, 40) : cc.color(255, 0, 0);
    }

    onClickPurchase() {
        let priceItem = this._cfg ? utils.parseStingList(this._cfg.ShopCommodityCost)[0] : utils.parseStingList(this._randomCfg.ShopCommodityCost)[0];
        let cnt = Number(this.inputLb.string) || 0;
        let haveCnt = bagData.getItemCountByID(Number(priceItem[0]));
        let needCnt = cnt * this._perPrice;

        if (haveCnt < needCnt) {
            guiManager.showDialogTips(CustomDialogId.COMMON_ITEM_NOT_ENOUGH, Number(priceItem[0]));
            return;
        }

        if (cnt && this._cfg)
            shopOpt.sendBuyProductReq(this._productId, cnt);
        else if (this._randomCfg)
            shopOpt.sendBuyRandomReq(this._productId);
    }

    deInit() {
        // 清理背包Item
        let item = this.empty.getComponentInChildren("ItemBag");
        if (item) {
            ItemBagPool.put(item);
        }
        this.releaseSubView();
        this.unscheduleAllCallbacks();
        this._sprLoader.release();
        eventCenter.unregisterAll(this);
    }

    onRelease() {
        this.deInit();
    }

    onClickClose () {
        if (!this._canClickClose) return;

        this.closeView()
    }

    // update (dt) {}
}
