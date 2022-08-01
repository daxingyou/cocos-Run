import { VIEW_NAME } from "../../../app/AppConst";
import { utils } from "../../../app/AppUtils";
import List from "../../../common/components/List";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { configManager } from "../../../common/ConfigManager";
import { eventCenter } from "../../../common/event/EventCenter";
import { activityEvent, shopEvent } from "../../../common/event/EventData";
import guiManager from "../../../common/GUIManager";
import { uiHelper } from "../../../common/ui-helper/UIHelper";
import { cfg } from "../../../config/config";
import { comm, gamesvr } from "../../../network/lib/protocol";
import { activityData } from "../../models/ActivityData";
import { activityOpt } from "../../operations/ActivityOpt";
import ItemRedDot from "../view-item/ItemRedDot";
import ItemFeastGift from "./ItemFeastGift";

const {ccclass, property} = cc._decorator;
@ccclass
export default class ActivityFeastGiftView extends ViewBaseComponent {
    @property(cc.Label) leftTimeLb: cc.Label = null;
    @property(List) feastGiftList: List = null
    @property(cc.Button) amzBtn: cc.Button = null;
    @property(cc.Sprite) btnSp: cc.Sprite = null;

    private _giftIds: number[] = [];
    private _feastIds: number[] = [];
    private _feastItemMap: Map<number, ItemFeastGift> = new Map();

    onInit(): void {
        this._registerEvent();
        this._prepareData();
        this._refreshAmzBtnState();
    }

    /**页面释放清理*/
    onRelease() {
        this._feastItemMap.forEach(itemFeast => {
            //关闭的时候清理
            itemFeast.deInit();
        })
        eventCenter.unregisterAll(this);
    }

    /**页面来回跳转刷新*/
    onRefresh(): void {
        this.feastGiftList.scrollTo(-1);
    }

    private _registerEvent() {
        eventCenter.register(activityEvent.RECV_FEAST_GIFT_RES, this, this._recvAmzReward);
        eventCenter.register(shopEvent.BUY_CURRENCY_GIFT, this, this._recvBuyCurrentGift);
        eventCenter.register(activityEvent.FEAST_GIFT_CHANGE_NTF, this, this._recvFeastGiftNtf);
        eventCenter.register(shopEvent.BUY_GIFT, this, this._recvPayResultNtf);
    }


    private _prepareData() {
        let feastList = configManager.getConfigs("activityFeastGift")
        for (let k in feastList) {
            let feast: cfg.ActivityFeastGift = feastList[k];
            this._giftIds.push(feast.ActivityFeastGiftGiftId);
            this._feastIds.push(feast.ActivityFeastGiftId);
        }
        this.feastGiftList.numItems = this._giftIds.length;
        
    }

    private _refreshAmzBtnState() {
        let isRecived: boolean = activityData.feastGiftData.ReceiveSurpriseReward;
        let redDot = this.amzBtn.getComponentInChildren(ItemRedDot);
        if (redDot) {
            redDot.showRedDot(!isRecived);
        }
        utils.setSpriteGray(this.btnSp, isRecived);
    }

    feastGiftRender(item: cc.Node, idx: number) {
        let cmp = item.getComponent(ItemFeastGift);
        if (!cmp) return;
        cmp.init(this._feastIds[idx], this._giftIds[idx]);
        cc.tween(cmp.node).set({ opacity: 0 }).to(0.1 * idx, { opacity: 255 }).start();    

        if (cmp && !this._feastItemMap.get(idx)) {
            this._feastItemMap.set(idx, cmp);  
        }
    }

    private _recvAmzReward(cmd: any, data: gamesvr.IActivityFeastGiftReceiveSurpriseRewardRes) {
        let rootView = uiHelper.getRootViewComp(this.node.parent);
        if (data && data.Prizes.length) {
            guiManager.loadView(VIEW_NAME.GET_ITEM_VIEW, rootView.node, data.Prizes);
        }
        this._refreshAmzBtnState();
    }

    /**购买返回获得数据*/
    private _recvBuyCurrentGift(cmd: any, data: gamesvr.IBuyCurrencyGiftRes) {
        if (!cc.isValid(this.node)) return;
        let rootView = uiHelper.getRootViewComp(this.node.parent);
        if (data && data.Products.length) {
            guiManager.loadView(VIEW_NAME.GET_ITEM_VIEW, rootView.node, data.Products);
        }
    }

    /**冲值返回*/
    private _recvPayResultNtf(cmd: any, data:gamesvr.IPayResultNotify) {
        let rootView = uiHelper.getRootViewComp(this.node.parent);
        if (data && data.PropertyList.length) {
            guiManager.loadView(VIEW_NAME.GET_ITEM_VIEW, rootView.node, data.PropertyList);
        }
    }

    /**数据改变通知*/
    private _recvFeastGiftNtf(cmd: any, data: gamesvr.IActivityFeastGifBuyGiftCountNotify) {
        //刷新相应的列表item
        let idx = this._giftIds.indexOf(data.ShopID);
        if (idx > -1) {
            let item = this.feastGiftList.getItemByListId(idx);   
            if (!item) return;
            let cmp:ItemFeastGift = item.getComponent(ItemFeastGift);
            cmp && (cmp.refreshMoenyBtnState())
            cmp && (cmp.updateLb())
        }
    }

    amzBtnClick() {
        let recved: boolean = activityData.feastGiftData.ReceiveSurpriseReward;
        if (recved) {
            guiManager.showTips("今日已领取!");
            return;
        }
        activityOpt.activityAmazingRewardReq();
    }
}