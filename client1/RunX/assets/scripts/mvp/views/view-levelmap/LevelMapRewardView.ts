import { BagItemInfo, ItemInfo } from "../../../app/AppType";
import { configUtils } from "../../../app/ConfigUtils";
import UIGridView, { GridData } from "../../../common/components/UIGridView";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { configCache } from "../../../common/ConfigCache";
import { eventCenter } from "../../../common/event/EventCenter";
import { lvMapViewEvent, shopEvent } from "../../../common/event/EventData";
import { cfg } from "../../../config/config";
import { data, gamesvr } from "../../../network/lib/protocol";
import { checkGiftRestrict } from "../view-shop/ShopView";
import ItemLevelMapReward from "./ItemLevelMapReward";
import { ADVENTURE_LV_REWARD_STATE, getLevelState } from "./LevelMapStageReward";


enum VIEW_TYPE {
    LV = 0,
    GIFT
}

const CNT_OF_PER_FRAME_CREATE_INS = 3;

/**
 * 主线关卡奖励
 */
const { ccclass, property } = cc._decorator;
@ccclass
export default class LevelMapReWardView extends ViewBaseComponent {
    @property(cc.ToggleContainer) toggleContainor: cc.ToggleContainer = null;
    @property(cc.Node) lvRewardRoot: cc.Node = null;
    @property(UIGridView) lvRewardList: UIGridView = null;
    @property(cc.Node) giftBagRoot: cc.Node = null;
    @property(UIGridView) giftBagList: UIGridView = null;
    @property(cc.Prefab) itemPrefab: cc.Prefab = null;
    @property(cc.Label) titleLb: cc.Label = null;
    @property(cc.Label) descLb: cc.Label = null;

    private _curViewType: VIEW_TYPE = VIEW_TYPE.LV;
    private _isInitLvView: boolean = false;
    private _isInitGiftBagView: boolean = false;

    private _itemPool: cc.NodePool = new cc.NodePool();

    preInit(...rest: any[]): Promise<any> {
        //分帧构建节点
        return new Promise((resolve, reject) => {
            for(let i = 0, len = 10; i < len; i += CNT_OF_PER_FRAME_CREATE_INS) {
                let curLen = Math.min(CNT_OF_PER_FRAME_CREATE_INS, len - i);
                this.stepWork.addTask(() => {
                    for(let j = 0; j < curLen; j++) {
                      this._itemPool.put(cc.instantiate(this.itemPrefab));
                    }
                })
            }

            this.stepWork.start(() => {
                resolve(true);
            });
        });
    }

    protected onInit(): void {
        eventCenter.register(lvMapViewEvent.LESSON_STAGE_REWARD_RES, this, this._recvLessonStageRewards);
        eventCenter.register(shopEvent.BUY_GIFT, this, this._recvLessonBuyGift);
        eventCenter.register(shopEvent.BUY_CURRENCY_GIFT, this, this._recvLessonBuyGift);
        this._switchViewType();
    }

    protected onRelease(): void {
        this.unscheduleAllCallbacks();
        eventCenter.unregisterAll(this);
        this._isInitLvView = false;
        this._isInitGiftBagView = false;
        this.lvRewardList.clear();
        this.giftBagList.clear();
        this._itemPool.clear();
    }

    onToggleChange(toggle: cc.Toggle) {
        let toggles = this.toggleContainor.toggleItems;
        this._curViewType = toggles.indexOf(toggle);
        this._switchViewType();
    }

    private _switchViewType() {
        this.titleLb.string = this._curViewType == VIEW_TYPE.LV ? '通关奖励' : '专属礼包';
        this.descLb.string = this._curViewType == VIEW_TYPE.LV ? '通关关卡\n免费领取关卡奖励' : '通关章节\n解锁超值专属礼包';
        if(this._curViewType == VIEW_TYPE.LV) {
            this.lvRewardRoot.active = true;
            this.giftBagRoot.active = false;
            this._initLvRewardView();
            return;
        }

        if(this._curViewType == VIEW_TYPE.GIFT) {
            this.lvRewardRoot.active = false;
            this.giftBagRoot.active = true;
            this._initGiftBagView();
        }
    }

    private _initLvRewardView() {
        if(this._isInitLvView) return;
        this._isInitLvView = true;

        // 初始化通关奖励
        let gridData = this._genListDataSource(VIEW_TYPE.LV);
        if(!gridData) return;

        this.lvRewardList.init(gridData, {
            onInit: (item: ItemLevelMapReward, data: GridData) => {
                let lessonID = parseInt(data.key), type = data.data;
                let cfg: cfg.AdventureLesson  = configUtils.getLessonConfig(lessonID);
                item.init(cfg, type);
            },
            releaseItem: (item: ItemLevelMapReward) => {
                item.deInit();
                this._itemPool.put(item.node);
            },
            getItem: (): ItemLevelMapReward => {
                let node = this._getItemNode();
                node.active = true;
                return node.getComponent(ItemLevelMapReward);
            }
        });
        this.scheduleOnce(this._scrollLvRewardView.bind(this, false));
    }

    private _scrollLvRewardView(isAnim: boolean = true) {
        let gridData = this.lvRewardList.gridDatas;
        if(!gridData || gridData.length == 0) return;
        let targetLessonID = 0;
        gridData.some(ele => {
            let lessonID = parseInt(ele.key);
            let state = getLevelState(lessonID);
            if(state != ADVENTURE_LV_REWARD_STATE.REWARDED) {
                targetLessonID = lessonID;
                return true;
            }
            return false;
        });
        targetLessonID != 0 && this.lvRewardList.scrollTo({key: targetLessonID+'', data: null}, isAnim ? null : 0.016);
    }

    private _initGiftBagView() {
        if(this._isInitGiftBagView) return;
        this._isInitGiftBagView = true;

        // 初始化礼包奖励
        let gridData = this._genListDataSource(VIEW_TYPE.GIFT);
        if(!gridData) return;

        this.giftBagList.init(gridData, {
            onInit: (item: ItemLevelMapReward, data: GridData) => {
                let lessonID = parseInt(data.key), type = data.data;
                let cfg: cfg.AdventureLesson  = configUtils.getLessonConfig(lessonID);
                item.init(cfg, type);
            },
            releaseItem: (item: ItemLevelMapReward) => {
              item.deInit();
              this._itemPool.put(item.node);
            },
            getItem: (): ItemLevelMapReward => {
              let node = this._getItemNode();
              node.active = true;
              let item = node.getComponent(ItemLevelMapReward)
              return item;
            }
        });
        this.scheduleOnce(this._scrollGiftBagView.bind(this, false));
    }

    private _scrollGiftBagView(isAnim: boolean = true) {
        let gridData = this.giftBagList.gridDatas;
        if(!gridData || gridData.length == 0) return;
        let targetLessonID = 0;
        gridData.some(ele => {
            let lessonID = parseInt(ele.key);
            let giftCfg = configUtils.getNormalShopGift(configCache.getAdventureLvGiftByLessonID(lessonID));
            let buyRes = checkGiftRestrict(giftCfg.ShopGiftId);
            let isSellOut = buyRes[0] && buyRes[0] >= buyRes[1];
            if(!isSellOut) {
                targetLessonID = lessonID;
                return true;
            }
            return false;
        });
        targetLessonID != 0 && this.giftBagList.scrollTo({key: targetLessonID+'', data: null}, isAnim ? null : 0.016);
    }

    private _genListDataSource(type: VIEW_TYPE): GridData[] {
        let gridData: GridData[] = null;
        // 通关奖励
        if(VIEW_TYPE.LV == type) {
            let lessonRewardCfgs = configCache.getAdventureLvRewards();
            lessonRewardCfgs.forEach((rewards: ItemInfo[], lessonID: number) => {
                gridData = gridData || [];
                gridData.push({key: lessonID+'', data: type});
            });
            return gridData;
        }

        // 礼包
        let lessonGiftCfgs = configCache.getAdventureLvGifts();
        lessonGiftCfgs.forEach((giftID: number, lessonID: number) => {
            let giftCfg: cfg.ShopGift = configUtils.getNormalShopGift(giftID);
            if(!giftCfg) return;
            gridData = gridData || [];
            gridData.push({key: lessonID+'', data: type});
        });
        return gridData;
    }

    private _getItemNode() {
        if(this._itemPool.size() > 0){
            return this._itemPool.get();
        }
        return cc.instantiate(this.itemPrefab);
    }

    // 领取关卡奖励
    private _recvLessonStageRewards(event: number, prizes: data.ItemInfo[], lessonID: number) {
        if(!this._isInitLvView) return;

        let item = this.lvRewardList.getItemBykey(lessonID + '');
        if(item) {
            (item as ItemLevelMapReward).updateState();
        }
        this._scrollLvRewardView();
    }

    // 购买章节礼包
    private _recvLessonBuyGift(event: number, info: gamesvr.IPayResultNotify|gamesvr.IBuyCurrencyGiftRes) {
        if(!this._isInitGiftBagView) return;

        let productID = 0;
        if(event == shopEvent.BUY_CURRENCY_GIFT) {
            let data = info as gamesvr.IBuyCurrencyGiftRes;
            productID = data.Record.ProductID;
        } else {
            let data = info as gamesvr.IPayResultNotify;
            productID = data.ProductID;
        }

        let items = this.giftBagList.getItems();
        if(items) {
            for(let [key] of items.entries()) {
                if(configCache.getAdventureLvGiftByLessonID(parseInt(key)) != productID) continue;
                (items.get(key) as ItemLevelMapReward).updateState();
                break;
            }
        }
        this._scrollGiftBagView();
    }
}

export {
    VIEW_TYPE
}
