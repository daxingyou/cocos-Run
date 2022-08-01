import { VIEW_NAME } from "../../../app/AppConst";
import { BagItemInfo, ItemInfo } from "../../../app/AppType";
import { configUtils } from "../../../app/ConfigUtils";
import UIGridView, { GridData } from "../../../common/components/UIGridView";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { configCache } from "../../../common/ConfigCache";
import { configManager } from "../../../common/ConfigManager";
import { eventCenter } from "../../../common/event/EventCenter";
import { dreamlandEvent, shopEvent } from "../../../common/event/EventData";
import { cfg } from "../../../config/config";
import { data, gamesvr } from "../../../network/lib/protocol";
import { checkGiftRestrict } from "../view-shop/ShopView";
import { DREAM_LAND_CHAPTER_REWARD_STATE, getDreamLandChapterState } from "./DreamlandView";
import ItemDreamLandReward from "./ItemDreamLandReward ";


enum DREAM_LAND_REWARD_VIEW_TYPE {
    CHAPTER = 0,
    GIFT
}

const CNT_OF_PER_FRAME_CREATE_INS = 3;

/**
 * 太虚幻境关卡奖励
 */
const { ccclass, property } = cc._decorator;
@ccclass
export default class DreamLandReWardView extends ViewBaseComponent {
    @property(cc.ToggleContainer) toggleContainor: cc.ToggleContainer = null;
    @property(cc.Node) chapterRewardRoot: cc.Node = null;
    @property(UIGridView) chapterRewardList: UIGridView = null;
    @property(cc.Node) giftBagRoot: cc.Node = null;
    @property(UIGridView) giftBagList: UIGridView = null;
    @property(cc.Prefab) itemPrefab: cc.Prefab = null;
    @property(cc.Label) titleLb: cc.Label = null;
    @property(cc.Label) descLb: cc.Label = null;

    private _curViewType: DREAM_LAND_REWARD_VIEW_TYPE = DREAM_LAND_REWARD_VIEW_TYPE.CHAPTER;
    private _isInitChapterView: boolean = false;
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
        eventCenter.register(dreamlandEvent.CHAP_REWARD_TOKEN, this, this._recvChapterRewardRes);
        eventCenter.register(shopEvent.BUY_GIFT, this, this._recvLessonBuyGift);
        eventCenter.register(shopEvent.BUY_CURRENCY_GIFT, this, this._recvLessonBuyGift);
        this._switchViewType();
    }

    protected onRelease(): void {
        this.unscheduleAllCallbacks();
        eventCenter.unregisterAll(this);
        this._isInitChapterView = false;
        this._isInitGiftBagView = false;
        this.chapterRewardList.clear();
        this.giftBagList.clear();
        this._itemPool.clear();
    }

    onToggleChange(toggle: cc.Toggle) {
        let toggles = this.toggleContainor.toggleItems;
        this._curViewType = toggles.indexOf(toggle);
        this._switchViewType();
    }

    private _switchViewType() {
        this.titleLb.string = this._curViewType == DREAM_LAND_REWARD_VIEW_TYPE.CHAPTER ? '通关奖励' : '专属礼包';
        this.descLb.string = this._curViewType == DREAM_LAND_REWARD_VIEW_TYPE.CHAPTER ? '通关关卡\n免费领取关卡奖励' : '通关章节\n解锁超值专属礼包';
        if(this._curViewType == DREAM_LAND_REWARD_VIEW_TYPE.CHAPTER) {
            this.chapterRewardRoot.active = true;
            this.giftBagRoot.active = false;
            this._initChapterRewardView();
            return;
        }

        if(this._curViewType == DREAM_LAND_REWARD_VIEW_TYPE.GIFT) {
            this.chapterRewardRoot.active = false;
            this.giftBagRoot.active = true;
            this._initGiftBagView();
        }
    }

    private _initChapterRewardView() {
        if(this._isInitChapterView) return;
        this._isInitChapterView = true;

        // 初始化章节奖励
        let gridData = this._genListDataSource(DREAM_LAND_REWARD_VIEW_TYPE.CHAPTER);
        if(!gridData) return;

        this.chapterRewardList.init(gridData, {
            onInit: (item: ItemDreamLandReward, data: GridData) => {
                let chapterID = parseInt(data.key), type = data.data;
                let lessons = configCache.getDreamLandLessonsByChapterID(chapterID)
                let cfg: cfg.PVEDreamlandLesson  = configUtils.getDreamLandLessonConfig(lessons[lessons.length - 1]);
                item.init(cfg, type);
            },
            releaseItem: (item: ItemDreamLandReward) => {
                item.deInit();
                this._itemPool.put(item.node);
            },
            getItem: (): ItemDreamLandReward => {
                let node = this._getItemNode();
                node.active = true;
                return node.getComponent(ItemDreamLandReward);
            }
        });
        this._scrollChapterView(false);
    }

    private _scrollChapterView(isAnim: boolean = true) {
        let gridData = this.chapterRewardList.gridDatas;
        if(!gridData || gridData.length == 0) return;

        let targetChapterID = 0;
        gridData.some(ele => {
            let chapterID = parseInt(ele.key);
            let state = getDreamLandChapterState(chapterID);
            if(state != DREAM_LAND_CHAPTER_REWARD_STATE.REWARDED) {
                targetChapterID = chapterID;
                return true;
            }
            return false;
        });
        targetChapterID != 0 && this.chapterRewardList.scrollTo({key: targetChapterID+'', data: null}, isAnim ? null : 0.016);
    }

    private _initGiftBagView() {
        if(this._isInitGiftBagView) return;
        this._isInitGiftBagView = true;

        // 初始化礼包奖励
        let gridData = this._genListDataSource(DREAM_LAND_REWARD_VIEW_TYPE.GIFT);
        if(!gridData) return;

        this.giftBagList.init(gridData, {
            onInit: (item: ItemDreamLandReward, data: GridData) => {
                let lessonID = parseInt(data.key), type = data.data;
                let cfg: cfg.PVEDreamlandLesson  = configUtils.getDreamLandLessonConfig(lessonID);
                item.init(cfg, type);
            },
            releaseItem: (item: ItemDreamLandReward) => {
              item.deInit();
              this._itemPool.put(item.node);
            },
            getItem: (): ItemDreamLandReward => {
              let node = this._getItemNode();
              node.active = true;
              let item = node.getComponent(ItemDreamLandReward)
              return item;
            }
        })
        this.scheduleOnce(this._scrollGiftBagView.bind(this, false));
    }

    private _scrollGiftBagView(isAnim: boolean = true) {
        let gridData = this.giftBagList.gridDatas;
        if(!gridData || gridData.length == 0) return;

        let targetLessonID = 0;
        gridData.some(ele => {
            let lessonID = parseInt(ele.key);
            let giftCfg = configUtils.getNormalShopGift(configCache.getDreamLandGiftByLessonID(lessonID));
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

    private _genListDataSource(type: DREAM_LAND_REWARD_VIEW_TYPE): GridData[] {
        let gridData: GridData[] = null;
        // 章节奖励
        if(DREAM_LAND_REWARD_VIEW_TYPE.CHAPTER == type) {
            let chapters: {[key:string]: cfg.PVEDreamlandChapter} = configManager.getConfigs('dreamlandChapter');
            for(let k in chapters) {
                if(!chapters.hasOwnProperty(k)) continue;
                let cfg = chapters[k];
                if(!cfg || !cfg.PVEDreamlandChapterRewardShow || cfg.PVEDreamlandChapterRewardShow.length == 0) continue;
                gridData = gridData || [];
                gridData.push({key: `${cfg.PVEDreamlandChapterId}`, data: type});
            }
            return gridData;
        }

        // 礼包
        let lessonGiftCfgs = configCache.getDreamLandGifts();
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

    // 购买章节礼包
    private _recvLessonBuyGift(event: number, data: gamesvr.IPayResultNotify | gamesvr.IBuyCurrencyGiftRes) {
        if(!this._isInitGiftBagView) return;

        let productID = 0;
        if(event == shopEvent.BUY_CURRENCY_GIFT) {
            data = data as gamesvr.IBuyCurrencyGiftRes;
            this.loadSubView(VIEW_NAME.GET_ITEM_VIEW, data.Products || []);
            productID = data.Record.ProductID;
        } else {
            data = data as gamesvr.IPayResultNotify;
            this.loadSubView(VIEW_NAME.GET_ITEM_VIEW, data.PropertyList || [], data.ExtraPropertyList || []);
            productID = data.ProductID;
        }

        this.scheduleOnce(() => {
            let items = this.giftBagList.getItems();
            if(items) {
                for(let [key, value] of items) {
                    if(configCache.getDreamLandGiftByLessonID(parseInt(key)) != productID) continue;
                    (items.get(key) as ItemDreamLandReward).updateState();
                    break;
                }
            }
            this._scrollGiftBagView();
        });
    }

    // 领取章节奖励
    private _recvChapterRewardRes(cmd: any, msg: gamesvr.IChapterRewardRes) {
        this.loadSubView(VIEW_NAME.GET_ITEM_VIEW, msg.Prizes);
        this.scheduleOnce(() => {
            let chapterID = msg.ChapterID;
            let item = this.chapterRewardList.getItemBykey(chapterID + '');
            if(item) {
                (item as ItemDreamLandReward).updateState();
            }
            this._scrollChapterView();
        });
    }
}

export {
    DREAM_LAND_REWARD_VIEW_TYPE
}
