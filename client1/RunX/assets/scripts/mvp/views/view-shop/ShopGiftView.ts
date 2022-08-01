/*
 * @Author: xuyang
 * @Date: 2021-06-21 17:39:22
 * @Description: 礼包购买弹窗
 */
import { CustomItemId, VIEW_NAME } from "../../../app/AppConst";
import { AntiAdditionCode } from "../../../app/AppEnums";
import { BagItemInfo } from "../../../app/AppType";
import { utils } from "../../../app/AppUtils";
import { bagDataUtils } from "../../../app/BagDataUtils";
import { configUtils } from "../../../app/ConfigUtils";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { configManager } from "../../../common/ConfigManager";
import { eventCenter } from "../../../common/event/EventCenter";
import { shopEvent } from "../../../common/event/EventData";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { cfg } from "../../../config/config";
import { data } from "../../../network/lib/protocol";
import { bagData } from "../../models/BagData";
import { antiAddictionOpt } from "../../operations/AntiAddictionOpt";
import { shopOpt } from "../../operations/ShopOpt";
import { checkGiftRestrict } from "./ShopView";
import { ItemBagPool } from "../../../common/res-manager/NodePool";
import List from "../../../common/components/List";
import ItemBag from "../view-item/ItemBag";
import moduleUIManager from "../../../common/ModuleUIManager";
import { appCfg } from "../../../app/AppConfig";
import { resPathUtils } from "../../../app/ResPathUrlUtils";

const { ccclass, property } = cc._decorator;
@ccclass
export default class ShopGiftView extends ViewBaseComponent {
    @property(cc.Label) restrict: cc.Label = null;      //购买限制
    @property(cc.Label) randomType: cc.Label = null;          //礼包类型
    @property(List) listView: List = null;              //列表
    @property(cc.Label) price: cc.Label = null;
    @property(cc.Sprite) priceIcon: cc.Sprite = null;

    private _pId: number = 0;
    private _cfg: cfg.ShopGift = null;
    private _itemArr: BagItemInfo[] = [];
    private _itemBags: ItemBag[] = [];
    private _sprLoader: SpriteLoader = new SpriteLoader();
    private _canClickClose: boolean = false;

    onInit(giftID: number) {
        this.scheduleOnce(()=> { this._canClickClose = true; }, 0.3)
        this._cfg = configManager.getConfigByKey("gift", giftID);
        this._pId = giftID;
        this.showView();
        this.registerEvent();
    }

    registerEvent() {
        eventCenter.register(shopEvent.BUY_GIFT, this, this.closeView);
    }

    private showView() {
        let isNotFree = !!this._cfg.ShopGiftCost;
        this.priceIcon.node.active = false;
        if(appCfg.UseTestMoney){
            isNotFree && this._sprLoader.changeSprite(this.priceIcon, resPathUtils.getItemIconPath(CustomItemId.ZI_YV), () => {
                this.priceIcon.node.active = true;
            });
            this.price.string = isNotFree ? `${this._cfg.ShopGiftCost / 100}` : "免费";
             //@ts-ignore
             this.price._forceUpdateRenderData();
             let totalWh = this.priceIcon.node.width + this.price.node.width;
              let halfWh = totalWh >> 1;
              this.priceIcon.node.x = -halfWh + (this.priceIcon.node.width >> 1);
              this.price.node.x = halfWh - (this.price.node.width >> 1);
        }else{
            this.price.string = this._cfg.ShopGiftCost ? `￥${this._cfg.ShopGiftCost / 100}` : "免费";
        }
        //限制购买，每日/每周/每月/终身
        if (this._cfg.ShopGiftLimit) {
            let limit = utils.parseStingList(this._cfg.ShopGiftLimit)[0];
            let dateHead = ["", "今日", "本周", "本月", "永久", "活动"];
            let buyCnt = checkGiftRestrict(this._pId)[0];
            this.restrict.string = `${dateHead[limit[0]]}限购(${limit[1] - buyCnt}/${limit[1]})`
        } else {
            this.restrict.string = "";
        }
        //礼包类型
        if (this._cfg.ShopGiftRandomGetNum) {
            this.randomType.string = "可【随机获得】1种奖励";
        } else {
            this.randomType.string = "可获得以下【全部奖励】";
        }
        //展示道具
        if (this._cfg.ShopGiftItemShow) {
            let pasreInfo = utils.parseStingList(this._cfg.ShopGiftItemShow);
            pasreInfo.forEach((info) => {
                if (info && info.length > 0) {
                    this._itemArr.push({
                        id: parseInt(info[0]),
                        count: parseInt(info[1]),
                        clickHandler: ()=>{
                            moduleUIManager.showItemDetailInfo(Number(info[0]),  parseInt(info[1]), this.node);
                        }
                    })
                }
            })
            this.listView.numItems = this._itemArr.length;
        }
    }

    onListRender(item: cc.Node, idx: number) {
        let empty = item.getChildByName("empty");
        let bagItem = empty.getComponent(ItemBag);
        let cfg = configUtils.getItemConfig(this._itemArr[idx].id);
        let itemName = item.getChildByName("name").getComponent(cc.Label);
        if (!bagItem){
            bagItem = ItemBagPool.get();
            bagItem.node.parent = empty;
            this._itemBags.push(bagItem);
        }
        bagItem.init(this._itemArr[idx]);
        itemName.string = cfg.ItemName || "";
        //最后一次刷新过后设置Content居中
        if (idx == this._itemArr.length - 1 && this.listView.content.width < this.listView.node.width) {
            this.scheduleOnce(() => {
                this.listView.content.getComponent(cc.Layout).updateLayout();
                this.listView.node.x += (this.listView.node.width - this.listView.content.width) / 2;
            })
        }
    }

    onSelectRender(item: cc.Node, sID: number) {
        let _item = this._itemArr[sID];
        let config = configUtils.getItemConfig(_item.id);
        let config1 = configUtils.getEquipConfig(_item.id);
        if (config) {
            let newitem: data.IBagUnit = { ID: _item.id, Count: 0, Seq: 0 };
            let findItem = bagData.getItemByID(_item.id);
            let item: data.IBagUnit = findItem ? findItem.Array[0] : newitem;
            item && this.loadSubView(VIEW_NAME.TIPS_ITEM, item);
        } else if (config1) {
            let item: data.IBagUnit = bagDataUtils.buildDefaultEquip(_item.id);
            this.loadSubView(VIEW_NAME.TIPS_EQUIP, item);
        }
    }

    onClickPurchase() {
        let pID = this._pId;
        let antiAddictionCode = antiAddictionOpt.antiAdditionBuyCode(pID);

        switch (antiAddictionCode) {
            case AntiAdditionCode.NON_ADULT_UNDER8: 
            case AntiAdditionCode.NON_ADULT_8TO16: 
            case AntiAdditionCode.NON_ADULT_16TO18: {
                this.loadSubView("AntiAddictionView", antiAddictionCode, ()=> {})
                break;
            }
            case AntiAdditionCode.NON_ADULT_NORMAL: 
            case AntiAdditionCode.ADULT:
            default: {
                shopOpt.sendBuyGiftReq((this._pId), (this._cfg.ShopGiftCost || 0) / 100);
                break;
            }
        }
        // shopOpt.sendBuyGiftReq(Number(this._pId));
    }

    deInit() {
        this.releaseSubView();
        this.unscheduleAllCallbacks();
        this._clearItems();
        this._sprLoader.release();
        eventCenter.unregisterAll(this);
    }

    onRelease() {
        this.deInit();
    }

    private _clearItems() {
        this._itemBags.forEach(_i => {
            _i.node.removeFromParent();
            _i.deInit();
            ItemBagPool.put(_i)
        })
        this._itemBags = [];
    }

    onClickClose () {
        if (!this._canClickClose) return;

        this.closeView()
    }

    // update (dt) {}
}
