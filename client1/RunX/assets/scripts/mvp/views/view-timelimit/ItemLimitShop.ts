import { CustomDialogId, VIEW_NAME } from "../../../app/AppConst";
import { utils } from "../../../app/AppUtils";
import { bagDataUtils } from "../../../app/BagDataUtils";
import { configUtils } from "../../../app/ConfigUtils";
import { resPathUtils } from "../../../app/ResPathUrlUtils";
import guiManager from "../../../common/GUIManager";
import { logger } from "../../../common/log/Logger";
import { ItemBagPool } from "../../../common/res-manager/NodePool";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { cfg } from "../../../config/config";
import { data } from "../../../network/lib/protocol";
import { bagData } from "../../models/BagData";
import { LimitShopItem } from "../../models/LimitData";
import ItemBag from "../view-item/ItemBag";

const {ccclass, property} = cc._decorator;

@ccclass
export default class ItemLimitShop extends cc.Component {
    @property(cc.Node)              itemShop: cc.Node = null;
    @property(cc.Label)             itemNameLb: cc.Label = null;
    @property(cc.Label)             itemCount: cc.Label = null;
    @property(cc.Sprite)            costIcon: cc.Sprite = null;
    @property(cc.Label)             costNumLb: cc.Label = null;
    @property(cc.Node)              tagNode: cc.Node = null;
    @property(cc.Label)             tagLabel: cc.Label = null;
    @property(cc.Node)              saveNullNode: cc.Node = null;

    private _limitShopItem: LimitShopItem = null;
    private _spriteLoader: SpriteLoader = new SpriteLoader();
    private _buyHandle: Function = null;
    private _loadView: Function = null;

    onInit (limitShopItem: LimitShopItem, buyHandle?: Function, loadView?: Function) {
        this._limitShopItem = limitShopItem;
        buyHandle && (this._buyHandle = buyHandle);
        loadView && (this._loadView = loadView);
        this.refreshView();
    }

    deInit () {
        if(this._spriteLoader) {
            this._spriteLoader.release();
        }
        // 清理节点
        let item = this.itemShop.getComponentInChildren(ItemBag); 
        if (item) {
            ItemBagPool.put(item);
        }
    }

    refreshView() {
        let randomShopCfg: cfg.RandomShop = configUtils.getRandomShopConfig(this._limitShopItem.shopId);
        if(!randomShopCfg) {
            logger.error('ItemLimitShop randomShopCfg error limitShopItem:', this._limitShopItem);
            return;
        }
        //  消耗品展示
        let costList = utils.parseStingList(randomShopCfg.RandomShopCost)[0];
        let costItemId: number = Number(costList[0]);
        let costNum: number = Number(costList[1]);
        this._spriteLoader.changeSpriteP(this.costIcon, resPathUtils.getItemIconPath(costItemId)).catch((err) => {
            logger.error(err);
        });
        let bagMoneyItem = bagData.getItemByID(costItemId);
        let bagMoneyNum = bagMoneyItem ? utils.longToNumber(bagMoneyItem.Array[0].Count) : 0;
        this.costNumLb.node.color = bagMoneyNum < costNum ? cc.Color.RED : cc.Color.WHITE;
        this.costNumLb.string = costNum + '';

        // 物品展示
        let shopCfgList = utils.parseStingList(randomShopCfg.RandomShopItem)[0];
        let curNum: number = this._limitShopItem.isBuy ? 0 : shopCfgList[1];
        this.itemCount.string = `今日限购（${curNum}/${shopCfgList[1]}）`;

        let itemId: number = Number(shopCfgList[0]);
        let itemBag: cc.Node = null;
        if(this.itemShop.childrenCount > 0) {
            itemBag = this.itemShop.children[0];
        } else {
            itemBag = this._getItemBag().node;
            this.itemShop.addChild(itemBag);
        }
        itemBag.getComponent(ItemBag).init({
            id: itemId,
            count: shopCfgList[1],
            clickHandler: () => {
                this.onClickItem(itemId);
            }
        });
        let itemCfg = configUtils.getItemConfig(itemId);
        if(!itemCfg) {
            logger.error('ItemLimitShop itemCfg error limitShopItem:', this._limitShopItem);
            return;
        }
        this.itemNameLb.string = itemCfg.ItemName;

        // 标签展示
        this.tagNode.active = typeof randomShopCfg.RandomShopItemTip != 'undefined';
        if(randomShopCfg.RandomShopItemTip) {
            this.tagLabel.string = randomShopCfg.RandomShopItemTip == '1' ? '限购' : '限时';
        }

        if(this._limitShopItem.isBuy && !this.saveNullNode.active) {
            this.saveNullNode.scale = 1.5;
            this.saveNullNode.active = true;
            cc.tween(this.saveNullNode)
                .to(0.2, { scale: 1 }, {easing: "easeIn"})
                .start();
        }
    }

    onClickBuy() {
        if (this.costNumLb.node.color.toRGBValue() == cc.Color.RED.toRGBValue()) {
            guiManager.showDialogTips(CustomDialogId.LIMIT_SHOP_ITEM_NO_ENOUGH);
        } else {
            if(this._checkCanBuy()) {
                this._buyHandle && this._buyHandle();
            } else {
                guiManager.showDialogTips(CustomDialogId.LIMIT_SHOP_SOLD_OUT);
            }
        }
    }

    onClickItem(itemId: number) {
        let cfg: any = configUtils.getItemConfig(itemId);
        if(cfg) {
            let newitem: data.IBagUnit = { ID: itemId, Count: 0, Seq: 0 };
            let findItem = bagData.getItemByID(itemId);
            let item: data.IBagUnit = findItem ? findItem.Array[0] : newitem;
            this._loadView(VIEW_NAME.TIPS_ITEM, item);
            return;
        }
        cfg = configUtils.getEquipConfig(itemId);
        if(cfg) {
            let item: data.IBagUnit = bagDataUtils.buildDefaultEquip(itemId);
            this._loadView(VIEW_NAME.TIPS_EQUIP, item);
            return;
        }
        cfg = configUtils.getHeroBasicConfig(itemId);
        if(cfg) {
            let heroCfg = cfg as cfg.HeroBasic;
            this._loadView(VIEW_NAME.TIPS_HERO, heroCfg.HeroBasicId);
            return;
        }
    }

    _getItemBag() { 
        return ItemBagPool.get();
    }

    _checkCanBuy() {
        return !this._limitShopItem.isBuy;
    }
}
