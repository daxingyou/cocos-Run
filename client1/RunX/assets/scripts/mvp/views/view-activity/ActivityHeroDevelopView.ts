
import { activityUtils } from "../../../app/ActivityUtils";
import { VIEW_NAME } from "../../../app/AppConst";
import { ItemInfo } from "../../../app/AppType";
import { utils } from "../../../app/AppUtils";
import UIGridView, { GridData } from "../../../common/components/UIGridView";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { configManager } from "../../../common/ConfigManager";
import { eventCenter } from "../../../common/event/EventCenter";
import { activityEvent, commonEvent, shopEvent } from "../../../common/event/EventData";
import guiManager from "../../../common/GUIManager";
import moduleUIManager from "../../../common/ModuleUIManager";
import { scheduleManager } from "../../../common/ScheduleManager";
import { cfg } from "../../../config/config";
import { data, gamesvr } from "../../../network/lib/protocol";
import { activityData } from "../../models/ActivityData";
import { serverTime } from "../../models/ServerTime";
import ItemActivityHeroDevelop, { ACTIVITY_HERO_GROW_UP_UI_UPDATE_TYPE } from "./ItemActivityHeroDevelop";

const CNT_OF_PER_FRAME_CREATE_INS = 3;

const { ccclass, property } = cc._decorator;
@ccclass
export default class ActivityHeroDevelopView extends ViewBaseComponent {
    @property(UIGridView) activityList: UIGridView = null;
    @property(cc.Label) timeLb: cc.Label = null;
    @property(cc.Prefab) listItemPfb: cc.Prefab = null;

    private _activityId: number;
    private _curPeriod = 0;
    private _cfgs: cfg.ActivityHeroGrowUp[] = null;
    private _itemPool: cc.NodePool = new cc.NodePool();
    private _parentComp: ViewBaseComponent = null;
    private _schedulerID: number = 0;

    preInit(...rest: any[]) : Promise<any>{
        //分帧构建节点
        return new Promise((resolve, reject) => {
            for(let i = 0, len = 10; i < len; i += CNT_OF_PER_FRAME_CREATE_INS) {
                let curLen = Math.min(CNT_OF_PER_FRAME_CREATE_INS, len - i);
                this.stepWork.addTask(() => {
                    for(let j = 0; j < curLen; j++) {
                        this._itemPool.put(cc.instantiate(this.listItemPfb));
                    }
                })
            }

            this.stepWork.start(() => {
                resolve(true);
            });
        });
    }

    protected onInit(mID: number, parentComp: ViewBaseComponent) {
        this._activityId = mID;
        this._parentComp = parentComp;
        this._registerEvents();
        let isChange = this._prepareData();
        if(isChange) {
            this._initUI();
        }
    }

    protected onRelease() {
        this.unscheduleAllCallbacks();
        eventCenter.unregisterAll(this);
        this._schedulerID && scheduleManager.unschedule(this._schedulerID);
        this._schedulerID = 0;
        this.activityList.clear();
        this._cfgs = null;
        this._itemPool && this._itemPool.clear();
        this._parentComp = null;
    }

    private _registerEvents() {
        eventCenter.register(commonEvent.TIME_DAY_RESET, this, this._onDayReset);
        eventCenter.register(activityEvent.RECV_HERO_GROW_UP_REWARD, this, this._onTakeReward)
        eventCenter.register(shopEvent.BUY_GIFT, this, this._recvLessonBuyGift);
        eventCenter.register(shopEvent.BUY_CURRENCY_GIFT, this, this._recvLessonBuyGift);
    }

    /**
     * 英雄养成的数据准备
     * @returns 如果数据有变化，返回true；反之false
     */
    private _prepareData() {
        let period = activityUtils.getHeroDevelopActivityPeriod(this._activityId);
      let activityOpen = activityUtils.checkActivityOpen(this._activityId);
        if(!activityOpen || this._curPeriod == period) return false;
        this._curPeriod = period;

        this._cfgs = configManager.getConfigList('activityHeroGrowUp').filter((_cfg: cfg.ActivityHeroGrowUp)=>{
            if (period && period == _cfg.ActivityHeroGrowUpRound){
                return true;
            }
            return false;
        });
        this._cfgs && this._cfgs.sort((l, r) => {
            return (l.ActivityHeroGrowUpRewardCondition || 0 - r.ActivityHeroGrowUpRewardCondition || 0);
        });
        return true;
    }

    private _initUI() {
        this.unscheduleAllCallbacks();
        this._initRemainTime();
        this.activityList.clear();
        if(!this._cfgs || this._cfgs.length == 0) return;

        let gridData: GridData[] = this._cfgs.map(ele => {
            return {
                key: ele.ActivityHeroGrowUpId +'',
                data: ele
            }
        });
        this.activityList.init(gridData, {
            onInit: (item: ItemActivityHeroDevelop, data: GridData) => {
                let atyCfg: cfg.ActivityHeroGrowUp = data.data as cfg.ActivityHeroGrowUp;
                item.init(atyCfg, (viewName: string, info: ItemInfo) => {
                    moduleUIManager.showItemDetailInfo(info.itemId, info.num, this._parentComp.node)
                });
            },
            releaseItem: (item: ItemActivityHeroDevelop) => {
                item.deInit();
                this._itemPool.put(item.node);
            },
            getItem: (): ItemActivityHeroDevelop => {
                let node = this._getItemNode();
                return node.getComponent(ItemActivityHeroDevelop);
            }
        });
    }

    private _initRemainTime() {
        let timeArr = activityUtils.calActivityTime(this._activityId);
        let closeTime = timeArr[1];
        let remainTime = closeTime - serverTime.currServerTime();
        if (this._schedulerID){
            scheduleManager.unschedule(this._schedulerID);
        }
        if (remainTime && remainTime > 0){
            this.timeLb.string = `${utils.getTimeInterval(remainTime)}后`;
            this._schedulerID = scheduleManager.schedule(() => {
                let remainTime = closeTime - serverTime.currServerTime();
                if (remainTime && remainTime > 0){
                    this.timeLb.string = `${utils.getTimeInterval(remainTime)}后`;
                } else {
                    // 发送请求获取最新活动配置
                    if (this._schedulerID) {
                        scheduleManager.unschedule(this._schedulerID);
                    }
                    guiManager.showTips("活动已结束");
                    this.timeLb.string = `活动已结束`;
                    this.activityList.clear();
                }
            }, 1)
        } else {
            this.timeLb.string = `活动已结束`;
        }
    }

    private _getItemNode(): cc.Node {
        if(this._itemPool.size() > 0) {
            return this._itemPool.get();
        }
        return cc.instantiate(this.listItemPfb);
    }

    private _onDayReset() {
        let isChange = this._prepareData();
        if(!isChange) return;
        this._initUI();
    }

    // 购买礼包
    private _recvLessonBuyGift(event: number, info: gamesvr.IPayResultNotify|gamesvr.IBuyCurrencyGiftRes, growUpID: number, activityPeriod: number) {
        let productID = 0;
        let prizesArr: data.IItemInfo[][] = [];
        if(event == shopEvent.BUY_CURRENCY_GIFT) {
            let data = info as gamesvr.IBuyCurrencyGiftRes;
            productID = data.ProductID;
            data.Products && data.Products.length > 0 && prizesArr.push(data.Products);
        } else {
          let data = info as gamesvr.IPayResultNotify;
            productID = data.ProductID;
            data.PropertyList && data.PropertyList.length > 0 && prizesArr.push(data.PropertyList);
            data.ExtraPropertyList && data.ExtraPropertyList.length > 0 && prizesArr.push(data.ExtraPropertyList);
        }

        if(prizesArr.length > 0) {
            guiManager.loadView(VIEW_NAME.GET_ITEM_VIEW, this._parentComp.node, ...prizesArr);
        }

        this.scheduleOnce(() => {
            let items = this.activityList.getItems();
            let isChange = false;
            if(items) {
                for(let [key, value] of items) {
                    let item = value as ItemActivityHeroDevelop;
                    if(item.giftID == productID && item.growUpID == growUpID) {
                      item.updateState(ACTIVITY_HERO_GROW_UP_UI_UPDATE_TYPE.GIFT);
                      isChange = true;
                      break;
                    }
                }
            }
        })
    }

    // 领取奖励
    private _onTakeReward(event: number, data: gamesvr.IActivityHeroGrowupReceiveRewardRes) {
        guiManager.loadView(VIEW_NAME.GET_ITEM_VIEW, this._parentComp.node, data.Prizes);
        this.scheduleOnce(() => {
            let item:ItemActivityHeroDevelop = this.activityList.getItemBykey(data.RewardGrowUpID+'') as ItemActivityHeroDevelop;
            if(item) {
                item.updateState(ACTIVITY_HERO_GROW_UP_UI_UPDATE_TYPE.REWARD);
            }
        });
    }
}

//礼包购买限制
const checkHeroGrowUpGiftRestrict = (heroGrowUpCfg: cfg.ActivityHeroGrowUp) => {
    let giftcfg: cfg.ShopGift = configManager.getConfigByKey("gift", heroGrowUpCfg.ActivityHeroGrowUpGiftId);
    let heroGrowUpData = activityData.heroGrowUpData;
    let productRecord: {[key:string]: number} = null;
    if(heroGrowUpData && heroGrowUpData.ActivityHeroGrowUpUnitMap && heroGrowUpData.ActivityHeroGrowUpUnitMap[`${heroGrowUpCfg.ActivityHeroGrowUpRound}`]) {
        productRecord = heroGrowUpData.ActivityHeroGrowUpUnitMap[`${heroGrowUpCfg.ActivityHeroGrowUpRound}`].BuyGiftMap;
    }

    // 这种活动的限购类型是活动期内限购,限购次数配置在ActivityHeroGrowUp表中
    if (productRecord && heroGrowUpCfg.ActivityHeroGrowUpGiftBuyNum) {
        let count = productRecord[`${giftcfg.ShopGiftId}`] || 0;
        return [count, heroGrowUpCfg.ActivityHeroGrowUpGiftBuyNum];
    }
    return [0, 1];
}

export {
    checkHeroGrowUpGiftRestrict
}
