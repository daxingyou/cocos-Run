

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
import { pveData } from "../../models/PveData";
import { pveDataOpt } from "../../operations/PveDataOpt";
import { shopOpt } from "../../operations/ShopOpt";
import ItemBag from "../view-item/ItemBag";
import { checkGiftRestrict } from "../view-shop/ShopView";
import { VIEW_TYPE } from "./LevelMapRewardView";
import { ADVENTURE_LV_REWARD_STATE, getLevelState } from "./LevelMapStageReward";

const {ccclass, property} = cc._decorator;

const REWARD_SPACE_X = 10;

@ccclass
export default class ItemLevelMapReward extends cc.Component {
    @property(cc.Label) desc: cc.Label = null;
    @property(cc.Node) itemContainor: cc.Node = null;
    @property(cc.Button) takeBtn: cc.Button = null;
    @property(cc.Label) takeBtnLabel: cc.Label = null;
    @property(cc.Node) takedNode: cc.Node = null;
    @property(cc.Sprite) spIcon: cc.Sprite = null;

    private _cfg: cfg.AdventureLesson = null;
    private _type: VIEW_TYPE = null;
    private _items: ItemBag[] = null;
    private _spLoader: SpriteLoader = null;

    init(cfg: cfg.AdventureLesson, type: VIEW_TYPE) {
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
        let chapterCfg: cfg.AdventureChapter = configUtils.getChapterConfig(this._cfg.LessonChapter);
        this.desc.string = `通关 ${chapterCfg.ChapterName} ${this._cfg.LessonName} 后可${VIEW_TYPE.LV == this._type ? '领取' : '购买'}`;

        let rewards: ItemInfo[] = null;
        if(VIEW_TYPE.LV == this._type) {
            this._updateLvRewardState();
            rewards = configCache.getAdventureLvRewardByLessonID(this._cfg.LessonId);
        } else {
            let giftCfg: cfg.ShopGift = configUtils.getNormalShopGift(configCache.getAdventureLvGiftByLessonID(this._cfg.LessonId));
            this._updateLvGiftState(giftCfg);
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
        if(VIEW_TYPE.LV == this._type) {
            this._updateLvRewardState();
        } else {
            this._updateLvGiftState();
        }
    }

    private _updateLvRewardState() {
        let state = this._getLevelState();
        this.takeBtnLabel.string = `领取`;
        this.takeBtnLabel.node.x = 0;
        this.spIcon.node.active = false;
        this.takeBtn.node.active = state == ADVENTURE_LV_REWARD_STATE.PAST;
        this.takedNode.active = state == ADVENTURE_LV_REWARD_STATE.REWARDED;
    }

    private _updateLvGiftState(giftCfg?: cfg.ShopGift) {
        giftCfg = giftCfg || configUtils.getNormalShopGift(configCache.getAdventureLvGiftByLessonID(this._cfg.LessonId));
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
        this.takedNode.active = (state != ADVENTURE_LV_REWARD_STATE.NOT_PAST && isSellOut);
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
        if(ADVENTURE_LV_REWARD_STATE.NOT_PAST == state) {
            guiManager.showTips('当前礼包未解锁');
            return;
        }
        if(VIEW_TYPE.LV == this._type) {
            pveDataOpt.reqLessonStageRewards(this._cfg.LessonId);
            return;
        }

        let giftCfg: cfg.ShopGift = configUtils.getNormalShopGift(configCache.getAdventureLvGiftByLessonID(this._cfg.LessonId));
        let isRMB = giftCfg.ShopGiftBuyType == '1';
        let costNum = isRMB ? giftCfg.ShopGiftCost/100 : giftCfg.ShopGiftCost;
        // 现金购买
        if(isRMB) {
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

    private _getLevelState(): ADVENTURE_LV_REWARD_STATE {
        return getLevelState(this._cfg.LessonId);
    }
}
