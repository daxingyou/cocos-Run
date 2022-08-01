import { ItemBagPool } from "../../../common/res-manager/NodePool";
import { RewardItem } from "./ActivityLoginRewardView";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { configUtils } from "../../../app/ConfigUtils";
import { uiHelper } from "../../../common/ui-helper/UIHelper";
import ItemBag from "../view-item/ItemBag";
import moduleUIManager from "../../../common/ModuleUIManager";
import { activityOpt } from "../../operations/ActivityOpt";
import ItemRedDot from "../view-item/ItemRedDot";

const { ccclass, property } = cc._decorator;

@ccclass
export default class ItemActivityLogin extends cc.Component {
    @property(cc.Node) rewardNode: cc.Node = null;
    @property(cc.Node) takeNode: cc.Node = null;
    @property(cc.Node) untakeNode: cc.Node = null;
    @property(cc.Node) tokenNode: cc.Node = null;
    // 英雄卡片
    @property(cc.Node) specialNode: cc.Node = null;
    @property(cc.Sprite) heroDraw: cc.Sprite = null;
    @property(cc.Node) specialTakeButton: cc.Node = null;
    @property(cc.Node) specialTokenIcon: cc.Node = null;
    @property(ItemRedDot) redotComp: ItemRedDot = null;

    private _itemData: RewardItem = null;
    private _day: number = -1;
    private _itemBag: ItemBag = null;
    private _isHero: boolean = false;
    private _sprLoader: SpriteLoader = new SpriteLoader();
    
    init (itemData: RewardItem, day: number) {
        if (itemData) {
            this._itemData = itemData;
            this._day = day;
            this._showView();
        }
    }

    deInit() {
        this.redotComp.deInit();
        this._clearItems();
        this._sprLoader.release();
    }

    unuse() {
        this.heroDraw.node.targetOff(this)
        this.node.targetOff(this)
        this.deInit();
    }

    reuse() {
    }

    private _clearItems() {
        if (this._itemBag) {
            this._itemBag.node.removeFromParent();
            ItemBagPool.put(this._itemBag);
            this._itemBag = null;
        }
    }

    private _showView() {
        if (!this._itemData || this._day < 0){
            return;
        }

        let token = this._itemData.token;
        let special = !!configUtils.getHeroBasicConfig(this._itemData.itemId);
        let canTake = this._itemData.day <= this._day;

        this.takeNode.active = !token && canTake && !special;
        this.untakeNode.active = !canTake && !special;
        this.tokenNode.active = token && !special;
        this.rewardNode.active = !special;
        this.specialNode.active = special;
        let isCanTake = !token && canTake
        this.specialTakeButton.active = !token && canTake;
        this.redotComp.showRedDot(isCanTake);
        this.specialTokenIcon.active = token;

        this.takeNode.getChildByName('tips_txt').getComponent(cc.Label).string = `第${this._itemData.day + 1}天`;
        this.untakeNode.getChildByName('tips_txt').getComponent(cc.Label).string = `第${this._itemData.day + 1}天`;
        this.tokenNode.getChildByName('tips_txt').getComponent(cc.Label).string = `第${this._itemData.day + 1}天`;
        this.specialNode.getChildByName('tips_txt').getComponent(cc.Label).string = `第${this._itemData.day + 1}天即可领取`;
        this.untakeNode.getChildByName("untake").active = this._itemData.day == (this._day + 1);


        if (special && this._itemData.heroRes) {
            this._sprLoader.changeSprite(this.heroDraw, `textures/activity/${this._itemData.heroRes}`);
        }

        let rewardItem = this.rewardNode.getComponentInChildren(ItemBag);
        let parent = uiHelper.getRootViewComp(this.node).node;
        let homeComp = uiHelper.getRootViewComp(parent.parent);
        let homeNode = homeComp ? homeComp.node : null;
        
        if (!rewardItem){
            rewardItem  = ItemBagPool.get();
            rewardItem.node.parent = this.rewardNode;
            this._itemBag = rewardItem;
        } 

        rewardItem.init({
            id: this._itemData.itemId,
            count: this._itemData.count,
            prizeItem: true,
            clickHandler: () => {
                moduleUIManager.showItemDetailInfo(this._itemData.itemId, this._itemData.count, homeNode)
            }
        })

        let cfg = configUtils.getHeroBasicConfig(this._itemData.itemId);
        if (cfg) {
            this.node.width = 110;
            this._isHero = true;
        } else {
            this._isHero = false;
        }
    }

    onClickHero () {
        if (!this._isHero) return;
        moduleUIManager.showItemDetailInfo(this._itemData.itemId, this._itemData.count, this.node.parent.parent)
    }

    onClickTake(){
        activityOpt.takeLoginReward(this._itemData.activityId, [this._itemData.day]);
    }


}