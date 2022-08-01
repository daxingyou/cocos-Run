/*
 * @Author: xuyang
 * @Date: 2021-06-19 15:02:26
 * @Description: 商店主界面
 */
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { bagDataEvent, commonEvent, shopEvent } from "../../../common/event/EventData";
import { antiAddictionOpt } from "../../operations/AntiAddictionOpt";
import { eventCenter } from "../../../common/event/EventCenter";
import { redDotMgr, RED_DOT_MODULE } from "../../../common/RedDotManager";
import { configManager } from "../../../common/ConfigManager";
import { data, gamesvr } from "../../../network/lib/protocol";
import { AntiAdditionCode } from "../../../app/AppEnums";
import { configUtils } from "../../../app/ConfigUtils";
import { CustomDialogId, PRODUCR_WITH_TREASURE_MAP, RES_ICON_PRE_URL, TREASURE_SYS_POWER_TYPE, VIEW_NAME } from "../../../app/AppConst";
import { utils } from "../../../app/AppUtils";
import { cfg } from "../../../config/config";
import { serverTime } from "../../models/ServerTime";
import { trackData } from "../../models/TrackData";
import { shopOpt } from "../../operations/ShopOpt";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import guiManager from "../../../common/GUIManager";
import List from "../../../common/components/List";
import ItemRedDot from "../view-item/ItemRedDot";
import ShopItem from "./ShopItem";
import {scheduleManager} from "../../../common/ScheduleManager";
import { pvpData } from "../../models/PvpData";
import CoinNode from "../../template/CoinNode";
import { taskData } from "../../models/TaskData";
import StepWork from "../../../common/step-work/StepWork";
import { preloadShopItemPool } from "../../../common/res-manager/Preloaders";
import { ItemShopPool } from "../../../common/res-manager/NodePool";
import { audioManager, SFX_TYPE } from "../../../common/AudioManager";
import { configCache } from "../../../common/ConfigCache";

const { ccclass, property } = cc._decorator;
enum PAGE_MODE {
    PROP,
    RECHARGE,
    GIFT,
    RANDOM,
}

interface ShopItemInfo {
    id: string,
    type: PAGE_MODE,
    loadView: Function,
    dellFunc: Function
}

@ccclass
export default class ShopView extends ViewBaseComponent {

    @property(cc.Node) randomNode: cc.Node = null;
    @property(cc.Label) remainLb: cc.Label = null;
    @property(cc.Label) refreshLb: cc.Label = null;

    @property(List) listView: List = null;
    @property(cc.Node) chargeNavs: cc.Node[] = [];
    @property(cc.Node) currencyNav: cc.Node = null; 
    @property(cc.Node) currencyRootNode: cc.Node = null;
    @property(cc.Node) chargeRootNode: cc.Node = null;
    @property(cc.Node) giftNavTemplate: cc.Node = null;
    @property(cc.Node) giftRootNode: cc.Node = null;
    @property(cc.ToggleContainer) navs: cc.ToggleContainer = null;
    @property(ItemRedDot) giftToggleItemRedDot: ItemRedDot = null;
    @property(ItemRedDot) randomToggleRedot: ItemRedDot = null;
    @property(cc.Node) effectNode: cc.Node = null;

    private _moduleId: number = 0;
    private _pageMode: PAGE_MODE = -1;
    private _currency: number = -1;
    private _items: number[] = [];
    private _coinNode: cc.Node = null;
    private currencyNavs: cc.Node[] = [];
    private currencyCfgs: cfg.ShopType[] = [];
    private _sprLoader: SpriteLoader = new SpriteLoader();

    private _scheduleId: number = 0;
    private _seleProductID: number = 0;
    private _seleProductIdxInList: number = -1;

    private _giftNavs: cc.Node[] = null;  //礼包子页签
    private _currGiftType:number = undefined;

    preInit(moduleId: number, partId: PAGE_MODE, subId: number, itemID: number): Promise<any> {
        this._moduleId = moduleId;
        this._seleProductID = itemID;
        return  new Promise((resolve, reject) => {
                    let stepWork = preloadShopItemPool();
                    let stepWork1 = new StepWork();
                    if(!this._coinNode){
                        stepWork1.addTask(() => {
                            this._coinNode = guiManager.addCoinNode(this.node);
                        });
                        stepWork1.addTask(() => {
                            this.listView.node.getComponent(cc.ScrollView).content.getComponent(cc.Layout).updateLayout();
                            this.listView._init();
                        });
                        stepWork1.addTask(()=> {
                            this._loadCurrencyNavs();
                        })
                    }
                    stepWork1.addTask( () => {
                        this.listView.setupExternalPool(ItemShopPool);
                        let shopType = configManager.getConfigByKey("shopType", subId) ? subId : this.currencyCfgs[0].ShopTypeID;
                        if (this._currency != (shopType) || !this.listView.numItems){
                            this._currency = shopType;
                            this.refreshCurrencyNavs();
                        } else
                            this._currency = shopType;
                    });
                    stepWork.concact(stepWork1);
                    stepWork.start(() => {
                        resolve(true);
                    });
                });
    }

    onInit(moduleId: number, partId: PAGE_MODE, subId: number, itemID: number) {
        this.registerEvent();
        this._updateFirstLvToggle();
        this._switchView(partId);
    }

    private _switchView(partId: number) {
        switch (partId) {
          case PAGE_MODE.PROP: this.onClickProp(); break;
          case PAGE_MODE.RECHARGE: this.onClickRecharge(); break;
          case PAGE_MODE.GIFT: this.onClickGift(); break;
          case PAGE_MODE.RANDOM: this.onClickRandom(); break;
          default: this.onClickProp(); break;
        }
    }

    onRelease() {
        this._hideSeleProductEffect();
        if (this._scheduleId)
            scheduleManager.unschedule(this._scheduleId);
        if(this._coinNode) {
            guiManager.removeCoinNode(this.node);
            this._coinNode = null;
        }
        redDotMgr.clearAllNewShopData();
        this.randomToggleRedot.deInit();
        this.giftToggleItemRedDot.deInit();
        this.listView._deInit();
        this._sprLoader.release();
        this.releaseSubView();
        this.unscheduleAllCallbacks();
        eventCenter.unregisterAll(this);
    }

    onRefresh(mID?: number, pID?: number, sId?: number, ...args:any[]){
        if(typeof pID == 'undefined') return;
        if(pID == PAGE_MODE.PROP && this._pageMode == pID && (typeof sId == 'undefined' || this._currency == sId)) return;
        if(pID != PAGE_MODE.PROP && this._pageMode == pID) return;

        if(this._pageMode == PAGE_MODE.PROP && pID == PAGE_MODE.PROP){
            this._currency = sId;
            this.refreshCurrencyNavs();
            this._updatePropView();
            return;
        }
        this._switchView(pID);
    }

    registerEvent() {
        eventCenter.register(shopEvent.BUY_PRODUCT, this, this.onBuyProductSuccess);
        eventCenter.register(bagDataEvent.ITEM_USE, this, this.onProductItemGet);       //掉落物品
        eventCenter.register(shopEvent.BUY_GIFT, this, this.onPaySuccess);
        eventCenter.register(shopEvent.BUY_CHARGE, this, this.onPaySuccess);

        eventCenter.register(shopEvent.BUY_RANDOM, this, this.onBuyRandomSuccess);
        eventCenter.register(shopEvent.REFRESH_RANDOM, this, this.onRefreshRandomRes);
        eventCenter.register(commonEvent.TIME_DAY_RESET, this, this.refreshRandomNode);
    }

    onListRender(item: cc.Node, idx: number) {
        let script = item.getComponent(ShopItem);
        script.init({
            id: this._items[idx].toString(),
            type: this._pageMode,
            loadView: (viewName: string) => {
                this.loadSubView(viewName);
            },
            dellFunc: () => {
                this._items.splice(idx, 1);
                this.listView.numItems = this._items.length;
            }
        });
    }

    onSelectRender(item: cc.Node, sID: number) {
        if (this._pageMode == PAGE_MODE.PROP) {
            let res = checkProductRestrict(Number(this._items[sID]));
            if (checkProductRankRestrict(Number(this._items[sID]))){
                guiManager.showTips("请先提升鹤鸣会武排名。");
                return;
            }
            if (res[0] && res[1] && res[0] >= res[1]) {
                this.showLockTips();
                return;
            }
            this.loadSubView("ShopCommodityView", this._items[sID]);
        }

        if (this._pageMode == PAGE_MODE.RANDOM) {
            let shopRandomDataMap = trackData.shopRandomData ? trackData.shopRandomData.RandomShopCommodityIDMap : {};
            let buyRes = shopRandomDataMap[this._items[sID]] ? 1 : 0;
            if (buyRes) {
                this.showLockTips();
                return;
            }
            item.getComponent(ShopItem).itemRedDot.clear();
            redDotMgr.clearNewShopData(this._items[sID]);
            this.loadSubView("ShopCommodityView", this._items[sID]);
        }

        if (this._pageMode == PAGE_MODE.GIFT) {
            let res = checkGiftRestrict(Number(this._items[sID]));
            if (res[0] && res[1] && res[0] >= res[1]) {
                this.showLockTips();
                return;
            }
            if (!checkGiftValid(Number(this._items[sID]))) {
                guiManager.showDialogTips(CustomDialogId.SHOP_GIFT_NO_SUPPORT);
                return;
            }
            this.loadSubView("ShopGiftView", this._items[sID]);
        }

        if (this._pageMode == PAGE_MODE.RECHARGE) {
            let needCount =   item.getComponent(ShopItem).getPrice();
            this._doRecharge(Number(this._items[sID]), needCount)
        }
        audioManager.playSfx(SFX_TYPE.BUTTON_CLICK);
    }

    onClickProp() {
        if (this._pageMode == PAGE_MODE.PROP) return;
        this._updatePropView();
    }

    private _updatePropView() {
        this._pageMode = PAGE_MODE.PROP;
        this.refreshNavButtons();

        // 刷新货币栏
        let shopTypeCfg = configManager.getConfigByKey("shopType", this._currency);
        if (shopTypeCfg){
            let coinIds = shopTypeCfg.ShopTypeMoneyShow.split(';').map((numStr: string) => {
                return parseInt(numStr);
            })
            this._coinNode && this._coinNode.getComponent(CoinNode).initWithCfgs(coinIds);
        }
    }

    onClickRandom() {
        if (this._pageMode == PAGE_MODE.RANDOM) return;
        
        this._pageMode = PAGE_MODE.RANDOM;
        this.refreshNavButtons();
        this.refreshRandomNode();
        this._coinNode && this._coinNode.getComponent(CoinNode).init(this._moduleId, this._pageMode);
    }

    onClickGift() {
        if (this._pageMode == PAGE_MODE.GIFT) return;
        
        this._pageMode = PAGE_MODE.GIFT;
        this._genGiftNavs();
        if(typeof this._currGiftType == 'undefined') {
            this._currGiftType = 1;
            this._currGiftType
        }
        this._refreshGiftNavs();
        this.refreshNavButtons();
        this._coinNode && this._coinNode.getComponent(CoinNode).init(this._moduleId, this._pageMode);
    }

    onClickRecharge() {
        if (this._pageMode == PAGE_MODE.RECHARGE) return;

        this._pageMode = PAGE_MODE.RECHARGE;
        this.refreshNavButtons();
        this._coinNode && this._coinNode.getComponent(CoinNode).init(this._moduleId, this._pageMode);
    }

    onClickRandomRefresh() {
        let maxCnt = configUtils.getModuleConfigs().ShopRandomFreeCount || 0;
        let extra = taskData.getTreasureSysPowerParam(TREASURE_SYS_POWER_TYPE.SHEN_TU);
        extra && (maxCnt += extra);
        let holdCnt = trackData.shopRandomData.RandomCount || 0;
        if (maxCnt - holdCnt > 0) {
            shopOpt.sendRefreshRandomReq();
        } else {
            guiManager.showDialogTips(CustomDialogId.RANDOM_SHOP_TIPS);
        }
    }

    refreshNavButtons() {
        this.giftToggleItemRedDot.setData(RED_DOT_MODULE.SHOP_GIFT_TOGGLE, {
            isClickCurToggle: this._pageMode == PAGE_MODE.GIFT
        });
        this.randomToggleRedot.setData(RED_DOT_MODULE.SHOP_RANDOM_TOGGLE, {
            isClickCurToggle: this._pageMode == PAGE_MODE.RANDOM
        });
        this.extractItems();
        this.listView.numItems = this._items.length;
        this._updateFirstLvToggle();
        this._updateSecLvToggle();
        this._showSeleProductEffect();
    }

    //更新左侧页签状态
    private _updateFirstLvToggle(){
        this.navs.toggleItems[PAGE_MODE.PROP].isChecked = this._pageMode == PAGE_MODE.PROP;
        this.navs.toggleItems[PAGE_MODE.RECHARGE].isChecked = this._pageMode == PAGE_MODE.RECHARGE;
        this.navs.toggleItems[PAGE_MODE.GIFT].isChecked = this._pageMode == PAGE_MODE.GIFT;
        this.navs.toggleItems[PAGE_MODE.PROP].interactable = this._pageMode != PAGE_MODE.PROP;
        this.navs.toggleItems[PAGE_MODE.RECHARGE].interactable = this._pageMode != PAGE_MODE.RECHARGE;
        this.navs.toggleItems[PAGE_MODE.GIFT].interactable = this._pageMode != PAGE_MODE.GIFT;
    }

    private _updateSecLvToggle() {
        this.currencyRootNode.active = this._pageMode == PAGE_MODE.PROP;
        this.giftRootNode.active = this._pageMode == PAGE_MODE.GIFT;
        this.chargeRootNode.active = this._pageMode == PAGE_MODE.RECHARGE;
        this.randomNode.active = this._pageMode == PAGE_MODE.RANDOM;
    }

    //显示指定商品的特效
    private _showSeleProductEffect(){
        this._hideSeleProductEffect();
        if(!this._seleProductID || this._seleProductIdxInList == -1) return;
        this._seleProductID = 0;
        this.listView.scrollTo(this._seleProductIdxInList, 0);
        let posInfo = this.listView.getItemPos(this._seleProductIdxInList);
        let worldPos = this.listView.content.convertToWorldSpaceAR(cc.v2(posInfo.x, posInfo.y));
        this.effectNode.setPosition(this.node.convertToNodeSpaceAR(worldPos));
        this.effectNode.scale = 10;
        this.effectNode.active = true;
        this.scheduleOnce(() => {
            this._playSeleProductEffect();
        });
    }

    private _playSeleProductEffect(){
        cc.tween(this.effectNode).to(0.5, {scale : 1}).call(() => {
            this.effectNode.active = false;
        }, this).start();
    }

    private _hideSeleProductEffect(){
        cc.Tween.stopAllByTarget(this.effectNode);
        this.unschedule(this._playSeleProductEffect);
        this.effectNode.active = false;
    }

    refreshRandomNode(){
        if (this._scheduleId){
            scheduleManager.unschedule(this._scheduleId);
        }
        let refreshTime = utils.getStageTimeStampEx(1) + 24 * 60 * 60;
        let curTime = serverTime.currServerTime();
        if (refreshTime - curTime >= 0){
            this.remainLb.string = `${utils.getTimeInterval(refreshTime - curTime)}后自动刷新`;
            this._scheduleId = scheduleManager.schedule(() =>{
                curTime = serverTime.currServerTime();
                if (refreshTime - curTime > 0){
                    this.remainLb.string = `${utils.getTimeInterval(refreshTime - curTime)}后自动刷新`;
                } else {
                    refreshTime = utils.getStageTimeStampEx(1) + 24 * 60 * 60;
                }
            }, 1)
        } else {
            // 临界时间
            refreshTime = refreshTime + 24 * 60 * 60;
            this.remainLb.string = `${utils.getTimeInterval(refreshTime - curTime)}后自动刷新`;
            this._scheduleId = scheduleManager.schedule(() => {
                curTime = serverTime.currServerTime();
                if (refreshTime - curTime > 0) {
                    this.remainLb.string = `${utils.getTimeInterval(refreshTime - curTime)}后自动刷新`;
                } else {
                    refreshTime = utils.getStageTimeStampEx(1) + 24 * 60 * 60;
                }
            }, 1)
        }

        let maxCnt = configUtils.getModuleConfigs().ShopRandomFreeCount || 0;
        let extra = taskData.getTreasureSysPowerParam(TREASURE_SYS_POWER_TYPE.SHEN_TU);
        extra && (maxCnt += extra);

        let holdCnt = maxCnt - (trackData.shopRandomData.RandomCount || 0);
        // let refreshBtn =this.randomNode.getComponentInChildren(cc.Button);
        // if (refreshBtn)
        //     refreshBtn.interactable = holdCnt > 0;
        this.refreshLb.string = `免费刷新(${holdCnt}/${maxCnt})`;
    }

    refreshCurrencyNavs() {
        this.currencyNavs.forEach((ele, index) => {
            ele.getChildByName("label").active = this.currencyCfgs[index].ShopTypeID != this._currency;
            ele.getChildByName("label_choose").active = this.currencyCfgs[index].ShopTypeID == this._currency;
            ele.getChildByName("normal").active = this.currencyCfgs[index].ShopTypeID != this._currency;
            ele.getChildByName("choose").active = this.currencyCfgs[index].ShopTypeID == this._currency;

            if (this._currency == this.currencyCfgs[index].ShopTypeID){
                let coinIds = this.currencyCfgs[index].ShopTypeMoneyShow.split(';').map(numStr => {
                    return parseInt(numStr);
                })
                this._coinNode && this._coinNode.getComponent(CoinNode).initWithCfgs(coinIds);
            }
        })
        this.extractItems();
        this.scheduleOnce(() => {
            this.listView.numItems = this._items.length;
        })
    }

    private _loadCurrencyNavs () {
        this.currencyCfgs = configManager.getConfigList("shopType");
        this.currencyCfgs.forEach(_cfg => {
            let newNav = cc.instantiate(this.currencyNav);
            let nameLb = newNav.getChildByName("label").getComponent(cc.Label);
            let chooseLb = newNav.getChildByName("label_choose").getComponent(cc.Label);
            let iconSpr = newNav.getChildByName("icon").getComponent(cc.Sprite);

            newNav.active = true;
            nameLb.string = _cfg.ShopTypeName;
            chooseLb.string = _cfg.ShopTypeName;
            let btnComp = newNav.getComponent(cc.Button);
            if(!cc.isValid(btnComp) || btnComp.clickEvents.length == 1) return;

            let clickHandler = new cc.Component.EventHandler();
            clickHandler.component = 'ShopView';
            clickHandler.target = this.node;
            clickHandler.handler = '_onClickTopNav';
            clickHandler.customEventData = `${_cfg.ShopTypeID}`;
            btnComp.clickEvents.push(clickHandler);

            newNav.parent = this.currencyNav.parent;
            this._sprLoader.changeSprite(iconSpr, `${RES_ICON_PRE_URL.BAG_ITEM}/${_cfg.ShopTypeImage}`);
            this.currencyNavs.push(newNav);
        });

        let layoutComp = this.currencyNav.parent.getComponent(cc.Layout);
        cc.isValid(layoutComp) && layoutComp.updateLayout();
    }

    private _onClickTopNav (event: cc.Event, customData: string) {
        if (this._pageMode != PAGE_MODE.PROP) return;
        let shopTypeID = parseInt(customData);
        if (this._currency == shopTypeID) return;
        this._currency = shopTypeID;
        this.refreshCurrencyNavs();
        let coinCfg: cfg.ShopType[] = configManager.getConfigByKV('shopType', 'ShopTypeID', shopTypeID);
        if(!coinCfg || coinCfg.length == 0) return;

        let coinIds = coinCfg[0].ShopTypeMoneyShow.split(';').map(numStr =>{
          return parseInt(numStr);
        })
        this._coinNode && this._coinNode.getComponent(CoinNode).initWithCfgs(coinIds);
    }

    // 生成礼包页签
    private _genGiftNavs() {
        if(this._giftNavs) return;
        this._giftNavs = this._giftNavs || [];

        let giftTypes = [{type: 1, name: '日礼包'}, {type: 7, name: '周礼包'}, {type: 8, name: '月礼包'}]
        while(this._giftNavs.length < giftTypes.length) {
            let node: cc.Node = null;
            if(this._giftNavs.length == 0) {
                node = this.giftNavTemplate;
            } else {
                node = cc.instantiate(this.giftNavTemplate);
            }
            let normalLb = node.getChildByName('label').getComponent(cc.Label);
            let seleLb = node.getChildByName('label_choose').getComponent(cc.Label);
            seleLb.string = normalLb.string = giftTypes[this._giftNavs.length].name;
            let buttonComp = node.getComponent(cc.Button);

            let clickHandler = new cc.Component.EventHandler();
            clickHandler.component = 'ShopView';
            clickHandler.target = this.node;
            clickHandler.handler = '_onClickGiftNav';
            clickHandler.customEventData = `${giftTypes[this._giftNavs.length].type}`;
            buttonComp.clickEvents.length = 0;
            buttonComp.clickEvents.push(clickHandler);
            node.name = `${giftTypes[this._giftNavs.length].type}`;
            node.parent = this.giftRootNode;

            this._giftNavs.push(node);
        }
    }

    // 礼包子页签的点击事件
    private _onClickGiftNav(event: cc.Event, customData: string) {
        if (this._pageMode != PAGE_MODE.GIFT) return;
        let giftType = parseInt(customData);
        if(this._currGiftType == giftType) return;
        this._currGiftType = giftType;
        this._refreshGiftNavs();
        this.extractItems();
        this.scheduleOnce(() => {
            this.listView.numItems = this._items.length;
        })
    }

    private _refreshGiftNavs() {
        this._giftNavs.forEach((ele, index) => {
            let isSele: boolean = parseInt(ele.name) == this._currGiftType;
            ele.getChildByName("label").active = !isSele;
            ele.getChildByName("label_choose").active = isSele;
            ele.getChildByName("normal").active = !isSele;
            ele.getChildByName("choose").active = isSele;
        });
    }

    extractItems() {
        this._items = [];
        switch (this._pageMode) {
            case PAGE_MODE.PROP:
                this._items = configManager.getConfigList("commodity")
                    .filter((cfg: cfg.ShopCommodity) => {
                        return cfg.ShopCommodityType == this._currency;
                    })
                    .map((cfg: cfg.ShopCommodity) => {
                        return cfg.ShopCommodityId;
                    });
                this.sortItemBySellStatus();
                break;
            case PAGE_MODE.GIFT:
                this._items = configCache.getShopGiftsByType(this._currGiftType);
                this._items = this._items.filter((id) => { return checkGiftValid(id) });
                this.sortItemBySellStatus();
                break;
            case PAGE_MODE.RECHARGE:
                if (cc.sys.os == cc.sys.OS_IOS) {
                    this._items = configManager.getConfigList("rechargeIOS")
                        .filter((cfg: cfg.ShopRechargeIOS)=>{
                            return cfg.ShopRechargeIOSType == 1;
                        })
                        .map((cfg: cfg.ShopRechargeIOS) => {
                            return cfg.ShopRechargeIOSId;
                        });
                }
                else {
                    this._items = configManager.getConfigList("rechargeAndroid")
                        .filter((cfg: cfg.ShopRechargeAndroid) => {
                            return cfg.ShopRechargeAndroidType == 1;
                        })
                        .map((cfg: cfg.ShopRechargeAndroid) => {
                            return cfg.ShopRechargeAndroidId;
                        });
                }
                break;
            case PAGE_MODE.RANDOM:
                let randomMap = trackData.shopRandomData.RandomShopCommodityIDMap || {};
                this._items = configManager.getConfigList("shopRandom")
                    .filter((cfg: cfg.ShopRandom) =>{
                        return randomMap.hasOwnProperty(cfg.ShopCommodityId);
                    })
                    .map((cfg: cfg.ShopRandom) => {
                        return cfg.ShopCommodityId;
                    });
                this.sortItemBySellStatus();
                break;
        }
        this._setSeleProductIdxInList();
    }

    //设置选中商品在商品列表的索引
    private _setSeleProductIdxInList(){
        if(!this._seleProductID || !this._items || this._items.length == 0) return;

        let seleProductID = this._seleProductID;
        this._seleProductIdxInList = this._items.findIndex(ele => {
            switch (this._pageMode) {
              case PAGE_MODE.PROP:
                  let commodityCfg: cfg.ShopCommodity = configManager.getConfigByKey('commodity', ele);
                  let productCfg: string[] = utils.parseStringTo1Arr(commodityCfg.ShopCommodityItem, ';');
                  if(parseInt(productCfg[0]) == seleProductID){
                      return true;
                  }
                  break;
              case PAGE_MODE.GIFT:
                  let giftCfg: cfg.ShopGift = configManager.getConfigByKey('gift', ele);
                  if(giftCfg.ShopGiftDorpGroup == seleProductID){
                      return true;
                  }
                  break;
              case PAGE_MODE.RECHARGE:
                  if (cc.sys.os == cc.sys.OS_IOS) {
                      let rechargeCfg: cfg.ShopRechargeIOS = configManager.getConfigByKey('rechargeIOS', ele);
                      if(rechargeCfg.ShopRechargeIOSPropertyID == seleProductID){
                          return true;
                      }
                  } else {
                      let rechargeCfg: cfg.ShopRechargeAndroid = configManager.getConfigByKey('rechargeAndroid', ele);
                      if(rechargeCfg.ShopRechargeAndroidPropertyID == seleProductID){
                          return true;
                      }
                  }
                  break;
              case PAGE_MODE.RANDOM:
                  let shopRandomCfg: cfg.ShopRandom = configManager.getConfigByKey('shopRandom', ele);
                  let productCfg1: string[] = utils.parseStringTo1Arr(shopRandomCfg.ShopCommodityItem, ';');
                  if(parseInt(productCfg[0]) == seleProductID){
                      return true;
                  }
                  break;
            }
            return false;
        });
    }

    onPaySuccess(cmd: any, msg: gamesvr.IPayResultNotify) {
        if (msg.PropertyList || msg.ExtraPropertyList) {
            this.loadSubView(VIEW_NAME.GET_ITEM_VIEW, msg.PropertyList || [], msg.ExtraPropertyList || []);
        }
        //刷新界面
        //this.extractItems();
        this.scheduleOnce(() => {
            this.listView.numItems = this._items.length;
        })
    }

    onBuyProductSuccess(cmd: any, msg: gamesvr.IBuyProductRes) {
        //道具提示
        if (msg.Products && msg.Products.length > 0) {
            this.loadSubView(VIEW_NAME.GET_ITEM_VIEW, msg.Products);
        }
        //刷新界面
        // this.extractItems();
        this.scheduleOnce(() => {
            this.listView.numItems = this._items.length;
        })
    }

    onBuyRandomSuccess(cmd: any, prize: data.IItemInfo[]) {
        //道具提示
        if (prize && prize.length > 0) {
            this.loadSubView(VIEW_NAME.GET_ITEM_VIEW, prize);
        }
        //刷新界面
        //this.extractItems();
        this.scheduleOnce(() => {
            this.listView.numItems = this._items.length;
        })
    }

    onRefreshRandomRes(){
        if (this._pageMode == PAGE_MODE.RANDOM){
            this.refreshNavButtons();
            this.refreshRandomNode();
        }
        guiManager.showTips("刷新成功。");
    }

    onProductItemGet(event: any, data: data.IItemInfo[]) {
       
    }

    showLockTips() {
        guiManager.showDialogTips(CustomDialogId.SHOP_MATCH_LIMIT);
    }


    sortItemBySellStatus() {
        if (!this._items || !this._items.length || this._pageMode == PAGE_MODE.RECHARGE) return;

        if (this._pageMode == PAGE_MODE.PROP){
            this._items.sort((p1, p2) => {
                let order1= configManager.getConfigByKey("commodity", p1).ShopCommodityNum || 0;
                let order2 = configManager.getConfigByKey("commodity", p2).ShopCommodityNum || 0;
                return order1 - order2;
            })
            this._items.sort((p1, p2) => {
                let res1 = checkProductRestrict(p1);
                let res2 = checkProductRestrict(p2);
                let weight1 = (res1[0] && res1[1] && res1[0] >= res1[1]) ? 1 : 0;
                let weight2 = (res2[0] && res2[1] && res2[0] >= res2[1]) ? 1 : 0;
                return weight1 - weight2;
            })
        }

        if (this._pageMode == PAGE_MODE.RANDOM){
            this._items.sort((p1, p2) => {
                let order1 = configManager.getConfigByKey("shopRandom", p1).ShopCommodityType || 0;
                let order2 = configManager.getConfigByKey("shopRandom", p2).ShopCommodityType || 0;
                return order1 - order2;
            }) 
            this._items.sort((p1, p2) => {
                let shopRandomDataMap = trackData.shopRandomData ? trackData.shopRandomData.RandomShopCommodityIDMap : {};
                return (shopRandomDataMap[p1] ? 1 : 0) - (shopRandomDataMap[p2] ? 1 : 0);
            })
        }
        
        if (this._pageMode == PAGE_MODE.GIFT){
            this._items.sort((p1, p2) => {
                let cfg: cfg.ShopGift = configManager.getConfigByKey("gift", p1);
                let cfg1: cfg.ShopGift = configManager.getConfigByKey("gift", p2);
                let res = checkGiftRestrict(p1);
                let tag1 = 0, tag2 = 0;
                if(cfg.ShopGiftLimit && res[0] && res[0] && res[1] && res[0] >= res[1]) {
                    tag1 = 1;
                }
                let res1 = checkGiftRestrict(p2);
                if(cfg1.ShopGiftLimit && res1[0] && res1[0] && res1[1] && res1[0] >= res1[1]) {
                    tag2 = 1;
                }
                return tag1 - tag2;
            })
        }
    }

    private _doRecharge (pID: number, needCount?: number) {
        let antiAddictionCode = antiAddictionOpt.antiAdditionBuyCode(pID);

        switch (antiAddictionCode) {
            case AntiAdditionCode.NON_ADULT_UNDER8: 
            case AntiAdditionCode.NON_ADULT_8TO16: 
            case AntiAdditionCode.NON_ADULT_8TO16_TOTAL: 
            case AntiAdditionCode.NON_ADULT_16TO18:
            case AntiAdditionCode.NON_ADULT_16TO18_TOTAL: {
                this.loadSubView("AntiAddictionView", antiAddictionCode, ()=> {})
                break;
            }
            case AntiAdditionCode.NON_ADULT_NORMAL: 
            case AntiAdditionCode.ADULT:
            default: {
                shopOpt.sendRechargeReq(pID, needCount);
                break;
            }
        }
    }
}

//充值首购
const checkExtraCharge = (pID: number) => {
    if (cc.sys.os == cc.sys.OS_IOS) {
        let cfg: cfg.ShopRechargeIOS = configManager.getConfigByKey("rechargeIOS", pID);
        let chargeRecord = trackData.chargeRecords[pID.toString()];
        if (chargeRecord && cfg.ShopRechargeIOSBundledCount) {
            //首购次数
            let chargeTimes = chargeRecord.FirstChargeTimes;
            return chargeTimes && chargeTimes >= cfg.ShopRechargeIOSBundledNum;
        }
        return true;
    } else {
        let cfg: cfg.ShopRechargeAndroid = configManager.getConfigByKey("rechargeAndroid", pID);
        let chargeRecords = trackData.chargeRecords;
        if (chargeRecords && chargeRecords[pID.toString()] && cfg.ShopRechargeAndroidBundledNum) {
            //首购次数
            let chargeTimes = chargeRecords[pID.toString()].FirstChargeTimes;
            return chargeTimes && chargeTimes < cfg.ShopRechargeAndroidBundledNum;
        }
        return true;
    }
    
    return false;
}

//道具购买限制
const checkProductRestrict = (pID: number) => {
    let cfg: cfg.ShopCommodity = configManager.getConfigByKey("commodity", pID);
    let productRecord = trackData.productRecords[pID.toString()];
    if (productRecord && cfg.ShopCommodityLimit) {
        let limitCondis = utils.parseStingList(cfg.ShopCommodityLimit)[0];
        let limitType = parseInt(limitCondis[0]), limitNum = parseInt(limitCondis[1]);
        if(PRODUCR_WITH_TREASURE_MAP.hasOwnProperty(pID)){
            let extra = taskData.getTreasureSysPowerParam(PRODUCR_WITH_TREASURE_MAP[pID]);
            extra && (limitNum += extra);
        }
        let stageTime = utils.getStageTimeStamp(limitType);
        let count = 0;
        productRecord.PurchaseTime.forEach(_time => {
            let time = utils.longToNumber(_time);
            if (time >= stageTime || limitType > 3) count += 1;
        })
        return [count, limitNum];
    }
    return [0, 1];
}

//道具购买限制
const checkProductRankRestrict = (pID: number) => {
    let cfg: cfg.ShopCommodity = configManager.getConfigByKey("commodity", pID);
    if (cfg.ShopCommodityPowerLimit) {
        let limit = utils.parseStingList(cfg.ShopCommodityPowerLimit)[0];
        if (limit[0] == 1 && limit[1]) {
            let topRank = pvpData.spiritData ? pvpData.spiritData.TopRank : 0;
            if (!(topRank && topRank <= limit[1])) {
                return true;
            }
        }
    }
    return false;
}


//礼包购买限制
const checkGiftRestrict = (pID: number) => {
    let cfg: cfg.ShopGift = configManager.getConfigByKey("gift", pID);
    let productRecord = trackData.productRecords[pID.toString()];
    if (productRecord && cfg.ShopGiftLimit) {
        let limit = utils.parseStringTo1Arr(cfg.ShopGiftLimit, ';');
        let limitType = parseInt(limit[0]), limitNum = parseInt(limit[1]);
        let stageTime = utils.getStageTimeStamp(limitType);
        let count = 0;
        productRecord.PurchaseTime.forEach(_time => {
            let time = utils.longToNumber(_time);
            if (time >= stageTime || limitType > 3) count += 1;
        })
        return [count, limitNum];
    }
    return [0, 1];
}

//检查礼包是否过期
const checkGiftValid = (pID: number) => {
    let cfg: cfg.ShopGift = configManager.getConfigByKey("gift", pID);
    if (cfg.ShopGiftSellTime && cfg.ShopGiftHoldTime) {
        let resetTime = configUtils.getBasicConfig().ActivityResetCron;            //活动重置时间
        let resetArr = resetTime.split("|") || [];
        let hour = resetArr[1] || 0,
            minute = resetArr[0] || 0,
            second = 0;
        let timeStr = cfg.ShopGiftSellTime.split(";").join("-");
        let beginTime = Number(new Date(`${timeStr} ${hour}:${minute}:${second}`)) / 1000;
        let limitTime = beginTime + cfg.ShopGiftHoldTime;
        let currTime = serverTime.currServerTime();
        if (currTime > limitTime || currTime < beginTime) {
            return false;
        }
    }
    return true;
}

export { ShopItemInfo, PAGE_MODE, checkExtraCharge, checkProductRestrict, checkGiftRestrict };