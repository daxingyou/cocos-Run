

import { BagItemInfo, ItemInfo } from "../../../app/AppType";
import { utils } from "../../../app/AppUtils";
import { configUtils } from "../../../app/ConfigUtils";
import { resPathUtils } from "../../../app/ResPathUrlUtils";
import { configCache } from "../../../common/ConfigCache";
import guiManager from "../../../common/GUIManager";
import moduleUIManager from "../../../common/ModuleUIManager";
import { ItemBagPool } from "../../../common/res-manager/NodePool";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { cfg } from "../../../config/config";
import { bagData } from "../../models/BagData";
import { pveDataOpt } from "../../operations/PveDataOpt";
import { shopOpt } from "../../operations/ShopOpt";
import ItemBag from "../view-item/ItemBag";
import { checkGiftRestrict } from "../view-shop/ShopView";
import { DREAM_LAND_REWARD_VIEW_TYPE } from "./DreamLandRewardView";
import { DREAM_LAND_CHAPTER_REWARD_STATE, getDreamLandChapterState } from "./DreamlandView";

const {ccclass, property} = cc._decorator;

const REWARD_SPACE_X = 10;

@ccclass
export default class ItemDreamLandReward extends cc.Component {
    @property(cc.Label) desc: cc.Label = null;
    @property(cc.Node) itemContainor: cc.Node = null;
    @property(cc.Button) takeBtn: cc.Button = null;
    @property(cc.Label) takeBtnLabel: cc.Label = null;
    @property(cc.Node) takedNode: cc.Node = null;
    @property(cc.Sprite) spIcon: cc.Sprite = null;

    private _cfg: cfg.PVEDreamlandLesson = null;
    private _type: DREAM_LAND_REWARD_VIEW_TYPE = null;
    private _items: ItemBag[] = null;
    private _spLoader: SpriteLoader = null;

    init(cfg: cfg.PVEDreamlandLesson, type: DREAM_LAND_REWARD_VIEW_TYPE) {
        this._cfg = cfg;
        this._type = type;
        this._initUI();
    }

    deInit() {
        this._cfg = null;
        this._type = null;
        this._spLoader && this._spLoader.release();
        if(this._items) {
            this._items.forEach(ele => {
                ItemBagPool.put(ele);
            });
            this._items.length = 0;
        }
    }

    private _initUI() {
        let chapterCfg: cfg.PVEDreamlandChapter = configUtils.getDreamLandChapterConfig(this._cfg.PVEDreamlandLessonChapter);
        this.desc.string = `通关 ${chapterCfg.PVEDreamlandChapterName} ${this._cfg.PVEDreamlandLessonName} 后可${DREAM_LAND_REWARD_VIEW_TYPE.CHAPTER == this._type ? '领取' : '购买'}`;

        let rewards: ItemInfo[] = null;
        if(DREAM_LAND_REWARD_VIEW_TYPE.CHAPTER == this._type) {
            this._updateChapterRewardState();
            if(chapterCfg.PVEDreamlandChapterRewardShow && chapterCfg.PVEDreamlandChapterRewardShow.length > 0) {
                utils.parseStingList(chapterCfg.PVEDreamlandChapterRewardShow, (strArr: string[]) => {
                    if(!strArr || !Array.isArray(strArr) || strArr.length == 0) return;
                    rewards = rewards || [];
                    rewards.push({itemId: parseInt(strArr[0]), num: parseInt(strArr[1])});
                });
            }
        } else {
            let giftCfg: cfg.ShopGift = configUtils.getNormalShopGift(configCache.getDreamLandGiftByLessonID(this._cfg.PVEDreamlandLessonId));
            this._updateChapterGiftState(giftCfg);
            if(giftCfg && giftCfg.ShopGiftItemShow && giftCfg.ShopGiftItemShow.length > 0) {
                utils.parseStingList(giftCfg.ShopGiftItemShow, (strArr: string[]) => {
                    if(!strArr || !Array.isArray(strArr) || strArr.length == 0) return;
                    rewards = rewards || [];
                    rewards.push({itemId: parseInt(strArr[0]), num: parseInt(strArr[1])});
                });
            }
        }

        if(rewards) {
            let startX: number = 0;
            let itemW: number = undefined, scale = 0.8;
            rewards.forEach(ele => {
                this._items = this._items || [];
                let item = ItemBagPool.get();
                if(typeof itemW == 'undefined') {
                    itemW = item.node.width * scale;
                }
                item.node.setPosition(startX + (itemW >> 1), 0);
                item.node.parent = this.itemContainor;
                item.node.scale = scale;
                item.init({id: ele.itemId, count: ele.num, clickHandler: (itemInfo: BagItemInfo) => {
                    moduleUIManager.showItemDetailInfo(itemInfo.id, itemInfo.count, null);
                }});
                this._items.push(item);
                startX += (itemW + REWARD_SPACE_X);
            });
        }
    }

    updateState() {
        if(DREAM_LAND_REWARD_VIEW_TYPE.CHAPTER == this._type) {
            this._updateChapterRewardState();
        } else {
            this._updateChapterGiftState();
        }
    }

    private _updateChapterRewardState() {
        let state = this._getLevelState();
        this.takeBtnLabel.string = `领取`;
        this.takeBtnLabel.node.x = 0;
        this.spIcon.node.active = false;
        this.takeBtn.node.active = state == DREAM_LAND_CHAPTER_REWARD_STATE.PAST;
        this.takedNode.active = state == DREAM_LAND_CHAPTER_REWARD_STATE.REWARDED;
    }

    private _updateChapterGiftState(giftCfg?: cfg.ShopGift) {
        giftCfg = giftCfg || configUtils.getNormalShopGift(configCache.getDreamLandGiftByLessonID(this._cfg.PVEDreamlandLessonId));
        let state = this._getLevelState();
        let itemID = 0, itemCnt = 0;
        if(giftCfg.ShopGiftBuyType == '1') {
            itemCnt = giftCfg.ShopGiftCost / 100;
        } else if(giftCfg.ShopGiftBuyType && giftCfg.ShopGiftBuyType.length > 0){
            let items = utils.parseStringTo1Arr(giftCfg.ShopGiftBuyType, ';');
            itemID = parseInt(items[1]);
            itemCnt = giftCfg.ShopGiftCost;
        }

        let buyRes = checkGiftRestrict(giftCfg.ShopGiftId);
        let isSellOut = buyRes[0] && buyRes[0] >= buyRes[1];
        this.takeBtn.node.active = !isSellOut;
        this.takedNode.active = (state != DREAM_LAND_CHAPTER_REWARD_STATE.NOT_PAST && isSellOut);
        this.spIcon.node.active = true;
        if(!isSellOut) {
            if(itemID == 0) {
                this.takeBtnLabel.string = `￥${itemCnt}`;
                this.takeBtnLabel.node.x = 0;
            } else {
                this.takeBtnLabel.string = `${itemCnt}`;
                //@ts-ignore
                this.takeBtnLabel._forceUpdateRenderData();
                this._spLoader = this._spLoader || new SpriteLoader();
                this._spLoader.changeSprite(this.spIcon, resPathUtils.getItemIconPath(itemID), (err) => {
                    let totalW = this.takeBtnLabel.node.width + this.spIcon.node.width;
                    this.spIcon.node.x = -(totalW >> 1) + (this.spIcon.node.width >> 1);
                    this.takeBtnLabel.node.x = (totalW >> 1) - (this.takeBtnLabel.node.width >> 1);
                });
            }
        }
    }

    onClickTake() {
        let state = this._getLevelState();
        if(DREAM_LAND_CHAPTER_REWARD_STATE.NOT_PAST == state) {
            guiManager.showTips('当前礼包未解锁');
            return;
        }

        if(DREAM_LAND_REWARD_VIEW_TYPE.CHAPTER == this._type) {
            this._getLevelState() == DREAM_LAND_CHAPTER_REWARD_STATE.PAST && pveDataOpt.reqTakeDreamChapReward(this._cfg.PVEDreamlandLessonChapter);
            return;
        }

        let giftCfg: cfg.ShopGift = configUtils.getNormalShopGift(configCache.getDreamLandGiftByLessonID(this._cfg.PVEDreamlandLessonId));
        let isRMB = giftCfg.ShopGiftBuyType == '1';
        let costNum = isRMB ? giftCfg.ShopGiftCost/100 : giftCfg.ShopGiftCost;
        if(isRMB){
            shopOpt.sendBuyGiftReq(giftCfg.ShopGiftId, costNum);
            return;
        }

        // 游戏内货币购买
        let itemInfo = utils.parseStringTo1Arr(giftCfg.ShopGiftBuyType, ';');
        let itemID = parseInt(itemInfo[1]);
        if(bagData.getItemCountByID(itemID) < costNum) {
            guiManager.showDialogTips(1000127, itemID);
            return;
        }

        shopOpt.sendBuyCurrencyGift(giftCfg.ShopGiftId);
    }

    private _getLevelState(): DREAM_LAND_CHAPTER_REWARD_STATE {
        return getDreamLandChapterState(this._cfg.PVEDreamlandLessonChapter);
    }
}
