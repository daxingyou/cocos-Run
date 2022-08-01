import { activityUtils } from "../../../app/ActivityUtils";
import { FIRST_CHARGE_FUNC_ID, LIMIT_TIME_GIFT_FUNC_ID, ModuleName, RANDON_FIGHT_FUNC_ID, RANDON_SHOP_FUNC_ID, VIEW_NAME } from "../../../app/AppConst";
import { utils } from "../../../app/AppUtils";
import { configUtils } from "../../../app/ConfigUtils";
import LinearSortContainor, { NODE_OPEN_CONDI_TYPE } from "../../../common/components/LinearSortContainor";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { configManager } from "../../../common/ConfigManager";
import { eventCenter } from "../../../common/event/EventCenter";
import { activityEvent, bagDataEvent, commonEvent, shopEvent, taskEvent } from "../../../common/event/EventData";
import guiManager from "../../../common/GUIManager";
import { localStorageMgr, SAVE_TAG } from "../../../common/LocalStorageManager";
import moduleUIManager from "../../../common/ModuleUIManager";
import { RED_DOT_MODULE } from "../../../common/RedDotManager";
import { ItemDoubleWeekIconPool, LimitIconPool } from "../../../common/res-manager/NodePool";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { cfg } from "../../../config/config";
import { data } from "../../../network/lib/protocol";
import { limitData, TimeLimitData, TIME_LIMIT_TYPE } from "../../models/LimitData";
import { serverTime } from "../../models/ServerTime";
import { trackData } from "../../models/TrackData";
import { userData } from "../../models/UserData";
import ItemDoubleWeekIcon from "../view-activity/ItemDoubleWeekIcon";
import ItemRedDot from "../view-item/ItemRedDot";
import SevenDayItem from "../view-sevenday/SevenDayItem";
import ItemLimitIcon from "../view-timelimit/ItemLimitIcon";

const {ccclass, property} = cc._decorator;

/**
 * @description MainScene中左上角的动态活动
 */
@ccclass
export default class MainDynamicAtyCtrl extends cc.Component {

    @property(LinearSortContainor) linearContainor: LinearSortContainor = null;
    @property(cc.Node) firstChargeNode: cc.Node = null;
    @property(cc.Node) sevenDayTmpNode: cc.Node = null;
    @property(cc.Node) doubleWeenViewParent: cc.Node = null;


    private _7DayAtyCfgs: cfg.ActivitySevenDayTask[] = null;
    private _7DayAtyItemPool: cc.NodePool = new cc.NodePool();
    private _7DayAtyItemUsedMap: Map<number, SevenDayItem> = new Map();

    private _DWItemUsedMap: Map<number, ItemDoubleWeekIcon> = new Map();
    private _doubleWeekAtyCfgs: cfg.ActivityWeekSummonList[] = null;

    private _limitIconsMap: Map<number, ItemLimitIcon> = new Map();

    //限时礼包
    private _limitGiftBagIcon: ItemLimitIcon = null;

    private _spLoader: SpriteLoader = new SpriteLoader();
    private _rootView: ViewBaseComponent = null;

    init(rootView: ViewBaseComponent) {
        this._rootView = rootView;
        this._initCfgs();
        this._registerEvents();
        this.linearContainor.init();
    }

    deInit() {
        eventCenter.unregisterAll(this);
        this._spLoader.release();
        this.linearContainor.deInit();
        this.linearContainor.Nodes.length = 0;
        this.linearContainor.FIDs.length = 0;
        this._7DayAtyItemUsedMap.forEach(ele => {
            this._7DayAtyItemPool.put(ele.node);
        });
        this._7DayAtyItemUsedMap.clear();
        this._7DayAtyItemPool.clear();
        this._DWItemUsedMap.forEach(ele => {
            ele.node.removeFromParent(true);
            ItemDoubleWeekIconPool.put(ele);
        });
        this._DWItemUsedMap.clear();
        this._limitIconsMap.forEach(ele => {
            ele.node.removeFromParent(true);
            LimitIconPool.put(ele);
        })
        this._limitIconsMap.clear();

        if(this._limitGiftBagIcon) {
            LimitIconPool.put(this._limitGiftBagIcon);
        }
        this._limitGiftBagIcon = null;
        this._7DayAtyCfgs = null;
        this._doubleWeekAtyCfgs = null;
        this._rootView = null;
    }

    private _initCfgs() {
        this._7DayAtyCfgs = this._7DayAtyCfgs || configManager.getConfigList('sevenDay');
        this._doubleWeekAtyCfgs = this._doubleWeekAtyCfgs || configManager.getConfigList('doubleWeekList');
    }

    private _registerEvents() {
        eventCenter.register(commonEvent.TIME_DAY_RESET, this, this._refreshView);
        eventCenter.register(bagDataEvent.ITEM_CHANGE, this, this._refreshView);
        eventCenter.register(taskEvent.CHANGE_PROGRESS, this, this._refreshView);
        eventCenter.register(taskEvent.RECEIVE_SEVEN_DAY_REWARD, this, this._refreshView);
        eventCenter.register(activityEvent.SEVENDAY_REWARD_TAKE, this, this._refreshView);
        eventCenter.register(shopEvent.RECV_FIRST_CHARGE_REWARD, this, this._refreshView);
    }

    refreshView() {
        this._refreshView();
    }

    private _refreshView() {
        let fChargeChanged = this._initFirstCharge();
        let _7DayChanged = this._init7DayAtyItems();
        let dWeekChanged = this._initDoubleWeekAtyItems();
        let limitIconChanged = this._initLimitIcons();
        let limitGiftBagChanged = this._initLimitGiftBag();
        if(fChargeChanged || _7DayChanged || dWeekChanged || limitIconChanged || limitGiftBagChanged){
            this.linearContainor.reset();
        }
    }

    // 初始化首充Icon
    private _initFirstCharge(): boolean {
        let isShow = trackData.checkFirstCharge();
        isShow = isShow || !activityUtils.checkAllFirstPayRewardToken();
        let isChanged = false;
        let linearIdx = this.linearContainor.FIDs.findIndex(ele => {
            return ele == FIRST_CHARGE_FUNC_ID;
        });
        if(isShow) {
            if(linearIdx == -1) {
                this.linearContainor.Nodes.unshift(this.firstChargeNode);
                this.linearContainor.FIDs.unshift(FIRST_CHARGE_FUNC_ID);
                isChanged = true;
            }
        } else {
            if(linearIdx != -1) {
                this.linearContainor.Nodes.splice(linearIdx, 1);
                this.linearContainor.FIDs.splice(linearIdx, 1);
                this.firstChargeNode.active = false;
                isChanged = true;
            }
        }
        return isChanged;
    }

    //  初始化七天活动ICON
    private _init7DayAtyItems(): boolean {
          let sevenCfgs = this._7DayAtyCfgs;
          let linearChanged = false;
          sevenCfgs.forEach(cfg => {
              let activityID = cfg.ActivitySevenDayTaskID;
              if(activityUtils.checkSevenDayOpen(activityID)) {
                  if(this._7DayAtyItemUsedMap.has(activityID)) return;
                  let item = this._get7DayAtyItem();
                  item.node.active = true;
                  item.node.y = 0;
                  this._7DayAtyItemUsedMap.set(activityID, item);
                  item.functionId = activityID;
                  item.setClickHandler((fid: number)=> {
                      moduleUIManager.jumpToModule(fid);
                  });
                  item.node.getComponentInChildren(ItemRedDot).setData(RED_DOT_MODULE.SEVENDAY_ENTRY, {args: [activityID]});
                  if (cfg.ActivitySevenDayEntryIcon) {
                      this._spLoader.changeSprite(item.icon, cfg.ActivitySevenDayEntryIcon);
                  }
                  this.node.addChild(item.node);
                  this.linearContainor.Nodes.push(item.node);
                  this.linearContainor.FIDs.push(activityID);
                  linearChanged = true;
              } else {
                  if(!this._7DayAtyItemUsedMap.has(activityID)) return;

                  let linearIdx = this.linearContainor.FIDs.findIndex((ele) => {
                      return ele = activityID;
                  });
                  if(linearIdx != -1) {
                      this.linearContainor.Nodes.splice(linearIdx, 1);
                      this.linearContainor.FIDs.splice(linearIdx, 1);
                      linearChanged = true;
                  }

                  let item = this._7DayAtyItemUsedMap.get(activityID);
                  this._7DayAtyItemUsedMap.delete(activityID);
                  this._7DayAtyItemPool.put(item.node);
              }
        });
        return linearChanged;
    }

    // 初始化双周活动Icon
    private _initDoubleWeekAtyItems(): boolean {
        let configs = this._doubleWeekAtyCfgs;
        if(!configs || configs.length == 0) return false;
        let linearChanged = false;
        configs.forEach(ele => {
            let isShow = activityUtils.checkWeekSummonAtyIsNeedShow(ele);
            if(isShow) {
                if(this._DWItemUsedMap.has(ele.FunctionID)) return;

                let item = ItemDoubleWeekIconPool.get();
                this.node.addChild(item.node);
                this._DWItemUsedMap.set(ele.FunctionID, item);
                item.node.y = 0;
                item.init(ele.ID, this.doubleWeenViewParent);
                this.linearContainor.Nodes.push(item.node);
                this.linearContainor.FIDs.push(ele.FunctionID);
                linearChanged = true;
            } else {
                if(!this._DWItemUsedMap.has(ele.FunctionID)) return;

                let linearIdx = this.linearContainor.FIDs.findIndex((_functionId) => {
                    return _functionId = ele.FunctionID;
                });

                if(linearIdx != -1) {
                    this.linearContainor.Nodes.splice(linearIdx, 1);
                    this.linearContainor.FIDs.splice(linearIdx, 1);
                    linearChanged = true;
                }

                let item = this._DWItemUsedMap.get(ele.FunctionID);
                this._DWItemUsedMap.delete(ele.FunctionID);
                ItemDoubleWeekIconPool.put(item);
            }
        })
        return linearChanged;
    }

    // 初始化限时活动Icon
    private _initLimitIcons(): boolean {
        let limitListCopy: TimeLimitData[] = utils.deepCopy(limitData.limitList);
        let lastLimitFuncs: number[] = null;
        this._limitIconsMap.forEach((v, k) => {
            lastLimitFuncs = lastLimitFuncs || [];
            lastLimitFuncs.push(k);
        });

        let linearChanged = false;
        if(limitListCopy && limitListCopy.length > 0) {
            linearChanged = this._genLimitIcons(limitListCopy, lastLimitFuncs);
        }

        //清除多余的Icon
        linearChanged = this._removeLeftLimitIcon(lastLimitFuncs) || linearChanged;
        return linearChanged;
    }

    private _genLimitIcons(limitList: TimeLimitData[], lastFuncs: number[]): boolean {
        if(!limitList || limitList.length == 0) return false;

        let linearChanged = false;
        limitList.forEach(ele => {
            let limitType = ele.limitType;
            let funcID = 0;
            if(TIME_LIMIT_TYPE.FIGHT == limitType) {
                funcID = RANDON_FIGHT_FUNC_ID;
            } else if(TIME_LIMIT_TYPE.SHOP == limitType) {
                funcID = RANDON_SHOP_FUNC_ID;
            }

            if(funcID == 0) return;
            if(this._limitIconsMap.has(funcID)) {
                  let lastIdx = lastFuncs ? lastFuncs.indexOf(funcID) : -1;
                  lastIdx != -1 && lastFuncs.splice(lastIdx, 1);
                  return;
            }

            let itemLimitIconCmp = LimitIconPool.get();
            let limitIcon: cc.Node = itemLimitIconCmp.node;
            this._limitIconsMap.set(funcID, itemLimitIconCmp);
            this.node.addChild(limitIcon);
            limitIcon.scale = 1;
            itemLimitIconCmp.onInit(ele, (data: TimeLimitData) => {

                let viewName: string = ModuleName[funcID+''];
                if(!viewName || viewName.length == 0) return;
                //@ts-ignore
                !guiManager.checkViewOpenInScene(viewName) && this._rootView.loadSubView(viewName, data);
            });
            this.linearContainor.Nodes.push(limitIcon);
            this.linearContainor.FIDs.push(funcID);
            linearChanged = true;
        });
        return linearChanged;
    }

    private _removeLeftLimitIcon(funcs: number[]): boolean {
        if(!funcs || funcs.length == 0) return false;
        let isChanged = false;
        funcs.forEach(ele => {
            let linearIdx = this.linearContainor.FIDs.findIndex(funcID => {
                return ele == funcID;
            });
            if(linearIdx != -1) {
                this.linearContainor.Nodes.splice(linearIdx, 1);
                this.linearContainor.FIDs.splice(linearIdx, 1);
                let item = this._limitIconsMap.get(ele);
                this._limitIconsMap.delete(ele);
                LimitIconPool.put(item);
                isChanged = true;
            }
        });
        return isChanged
    }

    // 初始化限时礼包
    private _initLimitGiftBag(): boolean {
        let giftBagData = limitData.shopTimeFiniteGiftData;
        if(!giftBagData) {
            return this._removetLimitGiftBagIcon(LIMIT_TIME_GIFT_FUNC_ID);
        }

        let touchCount = giftBagData.TouchCount || 0;
        let moduleCfg: string[] = utils.parseStringTo1Arr((configUtils.getConfigModule('ShopGiftSceneConfig') || ''), ';');
        let maxTimes = moduleCfg && parseInt(moduleCfg[0]) || 0;
        let currGiftBag = this._getLimitGifts();
        //每天最大次数已经触发完了
        if(touchCount >= maxTimes && !currGiftBag) {
            return this._removetLimitGiftBagIcon(LIMIT_TIME_GIFT_FUNC_ID);
        }


        if(touchCount >= maxTimes) {
            return this._addLimitGiftBagIcon(currGiftBag);
        }

        //没有礼包数据 或者礼包已经过期
        if(touchCount == 0 || serverTime.currServerTime() >= utils.longToNumber(giftBagData.NextFoundGiftTime)) {
            return this._removetLimitGiftBagIcon(LIMIT_TIME_GIFT_FUNC_ID);
        } else {
            return this._addLimitGiftBagIcon(currGiftBag);
        }
    }

    private _getLimitGifts() : data.IShopTimeFiniteGiftBale {
        //功能开放条件未达到
        let condiStr = configUtils.getFunctionConfig(LIMIT_TIME_GIFT_FUNC_ID).FunctionOpenCondition;
        if(condiStr && condiStr.length > 0) {
            let condis = utils.parseStringTo1Arr(condiStr);
            if(condis && condis.length > 0){
                let type = parseInt(condis[0]), value = parseInt(condis[1]);
                //玩家等级限制
                if(NODE_OPEN_CONDI_TYPE.USER_LV == type && value > userData.lv) {
                    return null;
                }
            }
        }

        if(!limitData.shopTimeFiniteGiftData) return null;
        let giftBagData = limitData.shopTimeFiniteGiftData;
        let touchCount  = giftBagData.TouchCount || 0;

        let currGiftBag = null;
        //默认同时只能有一个礼包
        for(let k in giftBagData.ShopTimeFiniteGiftBaleMap){
            currGiftBag = giftBagData.ShopTimeFiniteGiftBaleMap[k];
            if(currGiftBag) break;
        }

        let moduleCfg: string[] = utils.parseStringTo1Arr((configUtils.getConfigModule('ShopGiftSceneConfig') || ''), ';');
        let maxTimes = moduleCfg && parseInt(moduleCfg[0]) || 0;
        //每天最大次数已经触发完了
        if(touchCount >= maxTimes && !currGiftBag) return null;

        //触发次数为零或者可以触发新的礼包，主动触发礼包
        if(touchCount == 0 || serverTime.currServerTime() >= utils.longToNumber(giftBagData.NextFoundGiftTime)) {
            return null;
        }

        //礼包为空或者礼包失效
        if(!currGiftBag || currGiftBag.ExpiredTime <= serverTime.currServerTime()) return null;
        return currGiftBag
    }

    // 添加限时礼包
    private _addLimitGiftBagIcon(currGiftBag: data.IShopTimeFiniteGiftBale): boolean {
        if(!currGiftBag) {
            return this._removetLimitGiftBagIcon(LIMIT_TIME_GIFT_FUNC_ID);
        }
        let isChanged = false;
        if (!this._limitGiftBagIcon || !cc.isValid(this._limitGiftBagIcon)) {
            this._limitGiftBagIcon = LimitIconPool.get();
            this._limitGiftBagIcon.node.scale = 1;
            this.node.addChild(this._limitGiftBagIcon.node);
            let giftBagCfg: cfg.ShopGiftScene = configUtils.getShopGiftCfgByID(currGiftBag.GiftID);
            let data:TimeLimitData = {
                starTime: 0,
                index: 0,
                iconPath: giftBagCfg.GiftIcon,
                limitType: TIME_LIMIT_TYPE.GIFT_BAG,
                endTime: currGiftBag.ExpiredTime
            };

            this._limitGiftBagIcon.onInit(data, (data: TimeLimitData) => {
                this._popLimitGiftView();
            });
            this.linearContainor.Nodes.push(this._limitGiftBagIcon.node);
            this.linearContainor.FIDs.push(LIMIT_TIME_GIFT_FUNC_ID);
            isChanged = true;
        } else {
            this._limitGiftBagIcon.updateTimer();
        }
        return isChanged;
    }

    // 移除限时礼包
    private _removetLimitGiftBagIcon(funcID: number): boolean {
        if(!this._limitGiftBagIcon || !cc.isValid(this._limitGiftBagIcon.node)) return false;

        let isChanged = false;
        let linearIdx = this.linearContainor.FIDs.findIndex(ele => {
            return ele == funcID;
        });

        if(linearIdx != -1) {
            this.linearContainor.Nodes.splice(linearIdx, 1);
            this.linearContainor.FIDs.splice(linearIdx, 1);
            let item = this._limitGiftBagIcon;
            LimitIconPool.put(item);
            isChanged = true;
        }

        this._limitGiftBagIcon = null;
        return isChanged;
   }

    private _get7DayAtyItem() : SevenDayItem {
        if(this._7DayAtyItemPool.size() > 0) {
            return this._7DayAtyItemPool.get().getComponent(SevenDayItem);
        }

        let node = cc.instantiate(this.sevenDayTmpNode);
        return node.getComponent(SevenDayItem);
    }

    //打开限时礼包
    private _popLimitGiftView () {
        let currGift = this._getLimitGifts();
        if (!currGift) {
            localStorageMgr.setAccountStorage(SAVE_TAG.LIMIT_GIFT, 0)
            return;
        }
        localStorageMgr.setAccountStorage(SAVE_TAG.LIMIT_GIFT, currGift.GiftID);
        let funcCfg = configUtils.getFunctionConfig(LIMIT_TIME_GIFT_FUNC_ID);
        let viewName = funcCfg ? funcCfg.FunctionName : null;
        viewName && this._rootView.loadSubView(viewName);
    }

    popLimitGiftView() {
        this._popLimitGiftView();
    }

    // 弹出限时商店和限时战斗
    popLimitView() {
        if(!limitData.newLimitData || limitData.newLimitData.length == 0) return;

        let newLimitDataCopy: TimeLimitData[] = utils.deepCopy(limitData.newLimitData);
        newLimitDataCopy.forEach(ele => {
            let limitType = ele.limitType;
            let funcID = 0;
            if(TIME_LIMIT_TYPE.FIGHT == limitType) {
                funcID = RANDON_FIGHT_FUNC_ID;
            } else if(TIME_LIMIT_TYPE.SHOP == limitType) {
                funcID = RANDON_SHOP_FUNC_ID;
            }
            if(funcID == 0) return;

            let funcCfg = configUtils.getFunctionConfig(funcID);
            let viewName = funcCfg ? funcCfg.FunctionName : null;
            viewName && this._rootView.loadSubView(viewName, ele);
        });
        limitData.clearNewLimitData();
    }
}
