/*
 * @Author:xuyang
 * @Date: 2021-05-21 16:17:35
 * @Description: 补充体力弹窗
 */
import { configUtils } from "../../../app/ConfigUtils";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { checkProductRestrict } from "../view-shop/ShopView";
import { eventCenter } from "../../../common/event/EventCenter";
import { activityEvent, bagDataEvent, shopEvent } from "../../../common/event/EventData";
import { data, gamesvr } from "../../../network/lib/protocol";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { bagData } from "../../models/BagData";
import { utils } from "../../../app/AppUtils";
import { bagDataOpt } from "../../operations/BagDataOpt";
import { CustomDialogId, TREASURE_SYS_POWER_TYPE, VIEW_NAME } from "../../../app/AppConst";
import { serverTime } from "../../models/ServerTime";
import { activityData } from "../../models/ActivityData";
import ShopItem from "../view-shop/ShopItem";
import guiManager from "../../../common/GUIManager";
import moduleUIManager from "../../../common/ModuleUIManager";
import List from "../../../common/components/List";
import {scheduleManager} from "../../../common/ScheduleManager";
import { taskData } from "../../models/TaskData";
import { userData } from "../../models/UserData";
import ItemHpAcess from "./ItemHpAcess";

const { ccclass, property } = cc._decorator;

@ccclass
export default class GetHpView extends ViewBaseComponent {
    @property(ShopItem) shopItem: ShopItem = null;
    @property(List) listView: List = null;

    @property(cc.Label) physicalLb: cc.Label = null;
    @property(cc.Label) introLb: cc.Label = null;
    @property(cc.Label) tipsLb: cc.Label = null;

    private _scheduleId: number = 0;
    private _shopItemId: number = 0;
    private _itemArray: number[] = [];

    onInit(){
        this.prepareData();
        this.showShopItem();
        this.showRefreshInfo();

        eventCenter.register(bagDataEvent.ITEM_CHANGE, this, this._recvItemChangeNotify);
        eventCenter.register(bagDataEvent.ITEM_USE, this, this._recvItemUseNotify);
        eventCenter.register(shopEvent.BUY_PRODUCT, this, this._recvBuyProductSuccess);
        eventCenter.register(activityEvent.SPIRIT_TIME_REFRESH, this, this.showRefreshInfo);
    }

    onRelease(){
        if (this._scheduleId) {
            scheduleManager.unschedule(this._scheduleId);
        }
        this._scheduleId = 0;
        this.shopItem.unuse();
        this.listView._deInit();
        eventCenter.unregisterAll(this);
    }

   

    prepareData(){
        let moduleCfg = configUtils.getModuleConfigs();
        if (!this._shopItemId && moduleCfg.GetStrengthShopID){
            this._shopItemId = moduleCfg.GetStrengthShopID;
        }
        if (!this._itemArray.length && moduleCfg.GetStrengthItemID){
            this._itemArray = moduleCfg.GetStrengthItemID.split(";").map((itemId)=>{
                return parseInt(itemId);
            })
        }
        this.listView.numItems = this._itemArray.length;
    }

    showShopItem(){
        // 展示商城物品
        if (this._shopItemId)
            this.shopItem.init({
                id: this._shopItemId.toString(),
                type: 0,
                loadView: (viewName: string) => {
                    this.loadSubView(viewName);
                },
                dellFunc: null
            });
    }

    showRefreshInfo(){
        let basicCfg = configUtils.getBasicConfig();
        let interval = basicCfg.PhysicalRecoveryInterval || 0;
        let step = basicCfg.PhysicalRecoveryGetNum || 0;
        let max = basicCfg.PhysicalRecoveryLimit || 0;

        if (this._scheduleId) {
            scheduleManager.unschedule(this._scheduleId);
        }

        if (step && interval && max){
            //10013: 与宝物相关的减少体力CD时间的LeadTreasure字段
            let extra  = taskData.getTreasureSysPowerParam(TREASURE_SYS_POWER_TYPE.RI_YUE_ZHU);
            extra && (interval *= (1 - extra / 10000));
            this.introLb.string = `每${utils.getTimeLeft(interval)}恢复${step}点`;
            let physicalLimit = basicCfg.PhysicalRecoveryLimit || 0;
            let physicalMax = physicalLimit + (basicCfg.LevelUpMax || 0) * (userData.lv);
            this.physicalLb.string = `${bagData.physical}/${physicalMax}`;
            if (bagData.physical >= physicalMax){
                this.tipsLb.string = `已全部恢复`;
            } else{
                let lastRefreshTime = activityData.spiritData ? activityData.spiritData.LastRefreshSpTime : 0;
                let remainTime = utils.longToNumber(lastRefreshTime) + interval - serverTime.currServerTime() ;
                remainTime = Math.min(interval, remainTime);
                
                if (remainTime > 0){
                    this.tipsLb.string = `${utils.getTimeInterval(remainTime)}后+${step}`;
                    this._scheduleId = scheduleManager.schedule(()=>{
                        remainTime -= 1;
                        if (remainTime > 0) {
                            this.physicalLb.string = `${bagData.physical}/${physicalMax}`;
                            this.tipsLb.string = `${utils.getTimeInterval(remainTime)}后+${step}`;
                        } else {
                            this.tipsLb.string = `00:00后+${step}`;
                        }
                    },1)
                }
            }
        }
    }
   
    onListRender(itemNode: cc.Node, idx:number) {
        let item = itemNode.getComponent(ItemHpAcess)
        if (!item) return;
        let itemId = this._itemArray[idx];
        item.onInit(itemId, 
        (clickItem: number)=> {
            let itemCnt = bagData.getItemCountByID(clickItem) || 0;
            moduleUIManager.showItemDetailInfo(clickItem, itemCnt, this.node);
        }, 
        (useItem: number)=> {
            this._useItem(useItem);
        })
    }

    onClickShopItem(){
        let res = checkProductRestrict(this._shopItemId);
        if (res[0] && res[1] && res[0] >= res[1]) {
            guiManager.showDialogTips(CustomDialogId.SHOP_MATCH_LIMIT);
            return;
        }
        guiManager.loadModuleView("ShopCommodityView", this._shopItemId);
    }

    private _recvBuyProductSuccess(cmd: any, msg: gamesvr.IBuyProductRes){
        if (msg) {
            guiManager.showDialogTips(CustomDialogId.GTE_HP_BUY_SUCCESS);
            this.showShopItem();
        }
        let basicCfg = configUtils.getBasicConfig();
        let physicalLimit = basicCfg.PhysicalRecoveryLimit || 0;
        let physicalMax = physicalLimit + (basicCfg.LevelUpMax || 0) * (userData.lv);
        this.physicalLb.string = `${bagData.physical}/${physicalMax}`;
    }

    private _recvItemChangeNotify(cmd: any, msg: gamesvr.IBuyProductRes) {
        this.prepareData();
        this.showShopItem();
    }

    private _recvItemUseNotify(cmd: any, data: data.IItemInfo[]) {
        if (data && data.length > 0) {
            this.loadSubView(VIEW_NAME.GET_ITEM_VIEW, data);
            guiManager.showDialogTips(CustomDialogId.GTE_HP_EXCHANGE_SUCCESS);

            let basicCfg = configUtils.getBasicConfig();
            let physicalLimit = basicCfg.PhysicalRecoveryLimit || 0;
            let physicalMax = physicalLimit + (basicCfg.LevelUpMax || 0) * (userData.lv);
            this.physicalLb.string = `${bagData.physical}/${physicalMax}`;
        }
    }

    private _useItem(itemID: number){
        let itemArr = bagData.getItemByID(itemID);
        if(!itemArr) {
            guiManager.showDialogTips(CustomDialogId.ACTIVITY_ITEM_NO_ENOUGH);
            return;
        }
        let item = itemArr.Array[0];
        let cfg = configUtils.getItemConfig(item.ID);
        switch (cfg.ItemUseEffect) {
            case 2:
                if (!cfg.ItemUseNum) {
                    let copyItem: any = utils.deepCopy(item);
                    copyItem.Count = 1;
                    bagDataOpt.sendItemUseRequst(copyItem);
                } else {
                    let minNum = cfg.ItemComposeNum || 1;
                    let cnt = utils.longToNumber(item.Count);
                    cnt >= minNum && (this.loadSubView(VIEW_NAME.BAGITEM_USE_VIEW, item, minNum));
                    cnt < minNum && guiManager.showDialogTips(CustomDialogId.GTE_HP_ITEM_NO_ENOUGH);;
                }
                break;
            case 3:
                if (cfg.ItemUseNum) {
                    let minNum = cfg.ItemComposeNum || 1;
                    let cnt = utils.longToNumber(item.Count);
                    cnt >= minNum && (this.loadSubView(VIEW_NAME.BAGITEM_USE_VIEW, item, 1, (cnt: number) => {
                        this.loadSubView(VIEW_NAME.GIFT_CHOOSE_VIEW, item.ID, cnt);
                    }));
                } else {
                    this.loadSubView(VIEW_NAME.GIFT_CHOOSE_VIEW, item.ID, 1);
                }

                break;
            default:
                guiManager.showDialogTips(CustomDialogId.GTE_HP_ITEM_NO_AVALIABLE);
        }
    }
}