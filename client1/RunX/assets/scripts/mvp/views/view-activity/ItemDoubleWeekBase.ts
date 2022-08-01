import { VIEW_NAME } from "../../../app/AppConst";
import moduleUIManager from "../../../common/ModuleUIManager";
import { ItemBagPool } from "../../../common/res-manager/NodePool";
import { data } from "../../../network/lib/protocol";
import { bagData } from "../../models/BagData";
import ItemBag from "../view-item/ItemBag";

const {ccclass, property} = cc._decorator;

@ccclass
export default class ItemDoubleWeekBase extends cc.Component {
    @property(cc.Node) rewardsParent: cc.Node = null;

    protected _loadView: Function = null;
    protected baseInit(loadView: Function) {
        this._loadView = loadView;
    }

    deInit() {
        this._releaseRewards();
    }

    unuse () {
        this.deInit();
    }

    protected _refreshReward(rewardStr: string) {
        this._releaseRewards();
        const rewards = rewardStr.split('|').map(_itemStr => { return _itemStr.split(';'); });
        for(let i = 0; i < rewards.length; ++i) {
            const itemId = Number(rewards[i][0]);
            const count = Number(rewards[i][1]);
            const itemBagCmp = ItemBagPool.get();
            this.rewardsParent.addChild(itemBagCmp.node);
            itemBagCmp.init({
                id: itemId,
                count: count,
                clickHandler: () => {
                    moduleUIManager.showItemDetailInfoByLoadView(itemId, count, this._loadView.bind(this));
                }
            });
        }
    }

    protected _releaseRewards() {
        let children = [...this.rewardsParent.children];
        children.forEach(_c => {
            _c.removeFromParent();
            ItemBagPool.put(_c.getComponent(ItemBag));
        });
    }

}
