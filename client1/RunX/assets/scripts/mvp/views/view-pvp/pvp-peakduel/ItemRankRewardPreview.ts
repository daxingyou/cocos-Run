import { configManager } from "../../../../common/ConfigManager";
import { eventCenter } from "../../../../common/event/EventCenter";
import { ItemBagPool } from "../../../../common/res-manager/NodePool";
import { cfg } from "../../../../config/config";
import ItemBag from "../../view-item/ItemBag";

const {ccclass, property} = cc._decorator;
@ccclass
export default class ItemRankRewardPreview extends cc.Component {
    @property(cc.SpriteFrame) rankTopSprs: cc.SpriteFrame[] = [];
    @property(cc.Sprite) rankIndexSpr: cc.Sprite = null;
    @property(cc.Label) rankIndexLb: cc.Label = null;
    @property(cc.Layout) rewardLayout: cc.Layout = null;

    private _itemBags: ItemBag[] = [];
    
    onInit(data:cfg.PVPTopBattleRank): void {
       this._initItem(data)
       this._registerEvent();
    }

    /**item释放清理*/
    deInit() {
        this._itemBags.forEach(itemBag => {
            ItemBagPool.put(itemBag);
        })
        eventCenter.unregisterAll(this);
    }

    private _registerEvent() {

    }

    private _initItem(data: cfg.PVPTopBattleRank) {
        this.rankIndexSpr.node.active = data.PVPTopBattleRankNum <= 3;
        this.rankIndexLb.node.active = data.PVPTopBattleRankNum > 3;
        if (data.PVPTopBattleRankId <= 3) {
            this.rankIndexSpr.spriteFrame = this.rankTopSprs[data.PVPTopBattleRankId-1];
        } else {
            let preReward:cfg.PVPTopBattleRank = configManager.getConfigByKey("pvpTopBattleRank", data.PVPTopBattleRankId - 1);
            this.rankIndexLb.string = `${preReward.PVPTopBattleRankNum + 1}-${data.PVPTopBattleRankNum}`;
        }

        let rewards = data.PVPTopBattleRankReward.split(";").map(Number);
        let item = ItemBagPool.get();
        item.init({
            id: rewards[0],
            count:rewards[1]
        })
        item.node.scale = 0.8;
        item.node.parent = this.rewardLayout.node;
        this._itemBags.push(item);
    }

    itemClick() {

    }
}