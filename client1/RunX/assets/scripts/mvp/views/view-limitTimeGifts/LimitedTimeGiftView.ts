import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { cfg } from "../../../config/config";
import { utils } from "../../../app/AppUtils";
import { configUtils } from "../../../app/ConfigUtils";
import { ItemBagPool } from "../../../common/res-manager/NodePool";
import { bagDataUtils } from "../../../app/BagDataUtils";
import { Equip } from "../../template/Equip";
import { eventCenter } from "../../../common/event/EventCenter";
import { data } from "../../../network/lib/protocol";
import ItemBag from "../view-item/ItemBag";
import moduleUIManager from "../../../common/ModuleUIManager";
import {scheduleManager} from "../../../common/ScheduleManager";
import { shopEvent } from "../../../common/event/EventData";
import { limitData } from "../../models/LimitData";
import { serverTime } from "../../models/ServerTime";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { shopOpt } from "../../operations/ShopOpt";
import { appCfg } from "../../../app/AppConfig";
import { resPathUtils } from "../../../app/ResPathUrlUtils";
import { CustomItemId } from "../../../app/AppConst";

const { ccclass, property } = cc._decorator;

@ccclass
export default class LimitedTimeGiftView extends ViewBaseComponent{
    @property(cc.Sprite) priceIcon: cc.Sprite = null;
    @property(cc.Label) price: cc.Label = null;
    @property(cc.Node) giftNode: cc.Node = null;
    @property(cc.Label) countDownLb: cc.Label = null;
    @property(cc.Sprite) giftImage: cc.Sprite = null;

    private _itemBags: ItemBag[] = null;
    private _CDTime: number = 0;
    private _schedulerID: number = 0;
    private _currGiftBag: data.IShopTimeFiniteGiftBale = null;
    private _spriteLoader: SpriteLoader = null;
    private _shopGiftScene: cfg.ShopGiftScene = null;

    protected onInit(moduleId: number): void {
        this._initEvents();
        this._initView();
    }

    protected onRelease(): void {
        this._currGiftBag = null;
        this._spriteLoader && this._spriteLoader.release();
        this._spriteLoader = null;
        eventCenter.unregisterAll(this);
        this._schedulerID && scheduleManager.unschedule(this._schedulerID);
        this._schedulerID = 0;
        this._clearItems();
    }

    private _initEvents(){
        eventCenter.register(shopEvent.BUY_GIFT, this, this.closeView);
    }

    //初始化UI
    private _initView(){
        let giftBagData = limitData.shopTimeFiniteGiftData;
        if(!giftBagData) return;

        let currGiftBag = null;
        //默认同时只能有一个礼包
        for(let k in giftBagData.ShopTimeFiniteGiftBaleMap){
            currGiftBag = giftBagData.ShopTimeFiniteGiftBaleMap[k];
            if(currGiftBag) break;
        }
        if(!currGiftBag) return;
        this._currGiftBag = currGiftBag;

        let giftBagCfg: cfg.ShopGiftScene = configUtils.getShopGiftCfgByID(currGiftBag.GiftID);
        this._shopGiftScene = giftBagCfg;
        if(!giftBagCfg) return;


        //更新人物立绘
        let giftImage = giftBagCfg.GiftImage;
        if(giftImage){
            this._spriteLoader = this._spriteLoader || new SpriteLoader();
            this._spriteLoader.changeSprite(this.giftImage, giftImage);
        }

        this._setupPrice(giftBagCfg);
        let items: Map<number, number> = new Map<number, number>();
        utils.parseStingList(giftBagCfg.GiftItemShow, (item: string[]) => {
            if(!item || item.length < 2) return;
            let itemID = parseInt(item[0]);
            let count = parseInt(item[1]);
            let oldCount = 0;
            items.has(itemID) && (oldCount = items.get(itemID));
            items.set(itemID, oldCount + count);
        });

        this._clearItems();
        items.forEach((count: number, ID: number) => {
            this.addItem(ID, count);
        });
        
        this._CDTime = utils.longToNumber(currGiftBag.ExpiredTime) - serverTime.currServerTime();
        this._updateCDTime();
        this._schedulerID = scheduleManager.schedule(() => {
            this._CDTime--;
            if(this._CDTime < 0){
                this.closeView();
                return;
            }
            this._updateCDTime();
        }, 1);
    }

    private _setupPrice(shopGiftCfg: cfg.ShopGiftScene){
        if(!shopGiftCfg) return;
        if(appCfg.UseTestMoney){
            this.priceIcon && this._spriteLoader.changeSprite(this.priceIcon, resPathUtils.getItemIconPath(CustomItemId.ZI_YV));
            this.price.string = `${shopGiftCfg.GiftPrice/100}`;
            //@ts-ignore
            this.price._forceUpdateRenderData();
            let totalWh = this.priceIcon.node.width + this.price.node.width;
            let halfWh = totalWh >> 1;
            this.priceIcon.node.x = -halfWh + (this.priceIcon.node.width >> 1);
            this.price.node.x = halfWh - (this.price.node.width >> 1);
            return;
        }
        this.priceIcon.node.active = false;
        this.price.string = `￥${shopGiftCfg.GiftPrice/100}`;
    }

    //更新倒计时
    private _updateCDTime(){
        this.countDownLb.string = `${utils.parseSecondsToHours(this._CDTime)}后礼包永久消失`;
    }

    private _clearItems() {
        this._itemBags && this._itemBags.forEach(_i => {
            ItemBagPool.put(_i)
        })
        this._itemBags = [];
    }

    onClickBuy(){
        if(!this._currGiftBag) return;
        let needMoney = this._shopGiftScene && this._shopGiftScene.GiftPrice || 0;
        needMoney /= 100;
        shopOpt.sendBuyLimitedTimeGiftBag(this._currGiftBag.ID, needMoney);
    }

    private addItem(itemId: number, count: number){
        let giftItem = ItemBagPool.get();
        giftItem.node.parent = this.giftNode;
        this._itemBags = this._itemBags || [];
        this._itemBags.push(giftItem);

        giftItem.init({
            id: itemId,
            count: count,
            prizeItem: true,
            clickHandler: () => {
                moduleUIManager.showItemDetailInfo(itemId, count, this.node)
            }
        });
    }
}
