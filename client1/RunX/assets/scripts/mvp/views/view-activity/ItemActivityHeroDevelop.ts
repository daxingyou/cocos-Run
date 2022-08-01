import { VIEW_NAME } from "../../../app/AppConst";
import { BagItemInfo, ItemInfo } from "../../../app/AppType";
import { utils } from "../../../app/AppUtils";
import { bagDataUtils } from "../../../app/BagDataUtils";
import { configUtils } from "../../../app/ConfigUtils";
import { resPathUtils } from "../../../app/ResPathUrlUtils";
import RichTextEx from "../../../common/components/rich-text/RichTextEx";
import guiManager from "../../../common/GUIManager";
import { ItemBagPool } from "../../../common/res-manager/NodePool";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { cfg } from "../../../config/config";
import { activityData } from "../../models/ActivityData";
import { bagData } from "../../models/BagData";
import { activityOpt } from "../../operations/ActivityOpt";
import { shopOpt } from "../../operations/ShopOpt";
import ItemBag from "../view-item/ItemBag";
import { checkGiftRestrict } from "../view-shop/ShopView";
import { checkHeroGrowUpGiftRestrict } from "./ActivityHeroDevelopView";


const { ccclass, property } = cc._decorator;

enum ACTIVITY_HERO_GROW_UP_UI_UPDATE_TYPE {
    REWARD = 1,
    GIFT,
    All
}

@ccclass export default class ItemActivityHeroDevelop extends cc.Component {
    @property(cc.Node) lockNode: cc.Node = null;
    @property(RichTextEx) title: RichTextEx = null;
    @property(cc.Node) leftItemContainor: cc.Node = null;
    @property(cc.Node) rightItemContainor: cc.Node = null;
    @property(cc.Node) leftRewardTokenTag: cc.Node = null;
    @property(cc.Node) rightRewardTokenTag: cc.Node = null;
    @property(cc.Button) takeBtn: cc.Button = null;
    @property(cc.Sprite) spIcon: cc.Sprite = null;
    @property(cc.Label) takeBtnLabel: cc.Label = null;

    private _leftItems: ItemBag[] = null;
    private _rightItems: ItemBag[] = null;
    private _heroGrowUpCfg: cfg.ActivityHeroGrowUp = null;
    private _taskCfg: cfg.TaskTarget = null;
    private _giftCfg: cfg.ShopGift = null;
    private _heroID: number = 0;
    private _targetHeroStar: number = 0;
    private _leftRewards: ItemInfo[] = null;
    private _rightRewards: ItemInfo[] = null;
    private _loadViewFn: Function = null;
    private _spLoader: SpriteLoader = null;

    get giftID(): number {
        return this._heroGrowUpCfg ? this._heroGrowUpCfg.ActivityHeroGrowUpGiftId : 0;
    }

    get growUpID(): number {
      return this._heroGrowUpCfg ? this._heroGrowUpCfg.ActivityHeroGrowUpId : 0;
    }

    init(heroGrowUpCfg: cfg.ActivityHeroGrowUp, loadViewFn: Function) {
        this._heroGrowUpCfg = heroGrowUpCfg;
        this._loadViewFn = loadViewFn;
        this._taskCfg = configUtils.getTaskByTaskId(this._heroGrowUpCfg.ActivityHeroGrowUpTaskId);
        this._giftCfg = configUtils.getNormalShopGift(this._heroGrowUpCfg.ActivityHeroGrowUpGiftId);
        this._parseCfgs();
        this._initUI();
    }

    deInit() {
        this._spLoader && this._spLoader.release();
        if(this._leftItems) {
            this._leftItems.forEach(ele => {
                ItemBagPool.put(ele);
            });
            this._leftItems.length = 0;
        }

        if(this._rightItems) {
            this._rightItems.forEach(ele => {
                ItemBagPool.put(ele);
            });
            this._rightItems.length = 0;
        }

        this._leftRewards && (this._leftRewards.length = 0);
        this._rightRewards && (this._rightRewards.length = 0);
        this._heroGrowUpCfg = null;
        this._taskCfg = null;
        this._giftCfg = null;
    }

    onClickTake() {
        if(this._isTaskLock()) {
            guiManager.showDialogTips(1000155);
            return;
        }

        let giftCfg: cfg.ShopGift = this._giftCfg;
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

    updateState(type: ACTIVITY_HERO_GROW_UP_UI_UPDATE_TYPE) {
        if(type & ACTIVITY_HERO_GROW_UP_UI_UPDATE_TYPE.REWARD) {
            this._updateRewardState();
        }

        if(type & ACTIVITY_HERO_GROW_UP_UI_UPDATE_TYPE.GIFT) {
            this._updateGiftState();
        }
    }

    // 更新奖励状态
    private _updateRewardState() {
        let isTokenReward = false;
        let round = `${this._heroGrowUpCfg.ActivityHeroGrowUpRound}`;
        if(activityData.heroGrowUpData && activityData.heroGrowUpData.ActivityHeroGrowUpUnitMap) {
            let growupData = activityData.heroGrowUpData.ActivityHeroGrowUpUnitMap;
            if(growupData.hasOwnProperty(round) && growupData[round] && growupData[round].ReceiveOrderMap && growupData[round].ReceiveOrderMap[`${this._heroGrowUpCfg.ActivityHeroGrowUpOrder}`]) {
              isTokenReward = true;
            }
        }
        if(activityData.heroGrowUpData)
        this.leftRewardTokenTag.active = isTokenReward;
    }

    // 更新礼包状态
    private _updateGiftState() {
        let buyRes = checkHeroGrowUpGiftRestrict(this._heroGrowUpCfg);
        let isSellOut = buyRes[0] && buyRes[0] >= buyRes[1];
        this.takeBtn.node.active = !isSellOut;
        this.rightRewardTokenTag.active = isSellOut;
    }

    private _parseCfgs() {
        let heroParams = utils.parseStringTo1Arr(this._taskCfg.TargetGoalParam, ';');
        this._heroID = parseInt(heroParams[0]), this._targetHeroStar = parseInt(heroParams[1]);

        utils.parseStingList(this._taskCfg.TaskRewardShow, (strArr: string[]) => {
            if(!strArr || !Array.isArray(strArr) || strArr.length == 0) return;
            this._leftRewards = this._leftRewards || [];
            this._leftRewards.push({itemId: parseInt(strArr[0]), num: parseInt(strArr[1])});
        });

        utils.parseStingList(this._giftCfg.ShopGiftItemShow, (strArr: string[]) => {
            if(!strArr || !Array.isArray(strArr) || strArr.length == 0) return;
            this._rightRewards = this._rightRewards || [];
            this._rightRewards.push({itemId: parseInt(strArr[0]), num: parseInt(strArr[1])});
        });
    }

    private _initUI() {
        let heroUnit = bagData.getHeroById(this._heroID);
        let initStar = bagDataUtils.getHeroInitStar(this._heroID);
        let isExist = !!heroUnit;
        this.lockNode.active = this._isTaskLock();
        this.title.string = `<color=#68402D>${this._taskCfg.TaskIntroduce+'('}<\color>
          <color=${initStar == this._targetHeroStar ? (isExist ? '#68402D' : '#C33939') : (isExist &&  heroUnit.star >= this._targetHeroStar ? '#68402D': '#C33939')}>
          ${initStar == this._targetHeroStar ?  (isExist ? 1 : 0) : (isExist ? heroUnit.star : 0)}</color>
          <color=#68402D>/${initStar == this._targetHeroStar ? '1' : this._targetHeroStar})</color>`.replace(/\s*/gm, '');

        let itemID = 0, itemCnt = 0;
        if(this._giftCfg.ShopGiftBuyType == '1') {
            itemCnt = this._giftCfg.ShopGiftCost / 100;
        } else if(this._giftCfg.ShopGiftBuyType && this._giftCfg.ShopGiftBuyType.length > 0){
            let items = utils.parseStringTo1Arr(this._giftCfg.ShopGiftBuyType, ';');
            itemID = parseInt(items[1]);
            itemCnt = this._giftCfg.ShopGiftCost;
        }

        let buyRes = checkGiftRestrict(this._giftCfg.ShopGiftId);
        let isSellOut = buyRes[0] && buyRes[0] >= buyRes[1];
        this.takeBtn.node.active = !isSellOut;
        this.rightRewardTokenTag.active = isSellOut;
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
        this.updateState(ACTIVITY_HERO_GROW_UP_UI_UPDATE_TYPE.All);
        this._addItemBags(this._leftRewards, this.leftItemContainor, -0.5, this._leftItems = this._leftItems || []);
        this._addItemBags(this._rightRewards, this.rightItemContainor, 0, this._rightItems = this._rightItems || []);
    }

    private _addItemBags(itemInfos: ItemInfo[], parent: cc.Node, anchorX: number, itemArr: ItemBag[]) {
        if(!itemInfos || itemInfos.length == 0) return;

        let startX: number, itemW: number, spaceX: number = 3, scale = 0.7;
        itemInfos.forEach(ele => {
            let itemBag = ItemBagPool.get();
            if(typeof startX == 'undefined') {
                itemW = itemBag.node.width * scale;
                let totalW = itemInfos.length * itemW + spaceX * (itemInfos.length - 1);
                startX = totalW * anchorX;
            }
            itemBag.node.setPosition(startX + (itemW >> 1), 0);
            itemBag.node.parent = parent;
            itemBag.node.scale = scale;
            itemArr.push(itemBag);
            itemBag.init({
                id: ele.itemId,
                count: ele.num,
                clickHandler: this._onItemClick.bind(this)
            })
        })
    }

    private _onItemClick(info: BagItemInfo, tyep: any, item: ItemBag) {
        // 领取奖励
        if(this._leftItems.indexOf(item) != -1 && !this._isTaskLock() && !this._isRewardToken()) {
            activityOpt.sendTakeHeroDevelopReward(this._heroGrowUpCfg.ActivityHeroGrowUpId);
            return;
        }

        // 展示道具
        this._loadViewFn && this._loadViewFn(VIEW_NAME.TIPS_ITEM, {itemId: info.id, num: info.count})
    }

    private _isTaskLock() {
        let heroUnit = bagData.getHeroById(this._heroID);
        if(!heroUnit) return true;
        // 没有前置条件
        if(!this._heroGrowUpCfg.ActivityHeroGrowUpRewardCondition) {
            return heroUnit.star < this._targetHeroStar;
        }

        let preTask: cfg.ActivityHeroGrowUp = configUtils.getActivityHeroGrowUpCfgByGID(this._heroGrowUpCfg.ActivityHeroGrowUpRewardCondition);
        let preTaskCfg = configUtils.getTaskByTaskId(preTask.ActivityHeroGrowUpTaskId);
        let heroParams = utils.parseStringTo1Arr(preTaskCfg.TargetGoalParam, ';');
        let heroID = parseInt(heroParams[0]), targetHeroStar = parseInt(heroParams[1]);

        // 前置任务和当前任务对应同一个英雄
        if(heroID == this._heroID) {
            if(!heroUnit) return true;
            return heroUnit.star < targetHeroStar;
        }

        // 前置任务和当前任务不是同一个英雄
        let preHeroUnit = bagData.getHeroById(this._heroID);
        if(!preHeroUnit) return true;
        return preHeroUnit.star < targetHeroStar;
    }

    // 奖励是否已被领取
    private _isRewardToken() {
      let isTokenReward = false;
        let round = `${this._heroGrowUpCfg.ActivityHeroGrowUpRound}`;
        if(activityData.heroGrowUpData && activityData.heroGrowUpData.ActivityHeroGrowUpUnitMap) {
            let growupData = activityData.heroGrowUpData.ActivityHeroGrowUpUnitMap;
            if(growupData.hasOwnProperty(round) && growupData[round] && growupData[round].ReceiveOrderMap && growupData[round].ReceiveOrderMap[`${this._heroGrowUpCfg.ActivityHeroGrowUpOrder}`]) {
              isTokenReward = true;
            }
        }
        return isTokenReward;
    }
}

export {
  ACTIVITY_HERO_GROW_UP_UI_UPDATE_TYPE
}
