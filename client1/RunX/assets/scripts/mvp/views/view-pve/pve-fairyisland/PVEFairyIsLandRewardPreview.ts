import { ViewBaseComponent } from "../../../../common/components/ViewBaseComponent";
import { eventCenter } from "../../../../common/event/EventCenter";
import moduleUIManager from "../../../../common/ModuleUIManager";
import { ItemBagPool } from "../../../../common/res-manager/NodePool";
import { islandData } from "../../../models/IslandData";
import ItemBag from "../../view-item/ItemBag";

const { ccclass, property } = cc._decorator;
const LAYER_LEN = 3;
@ccclass
export default class PVEFairyIsLandRewardPreview extends ViewBaseComponent {
    @property(cc.Layout) layout: cc.Layout = null;
    @property(cc.Node) rewardTemp: cc.Node = null;

    private _userItemBag: ItemBag[] = [];

    onInit(): void {
        this._initView();
    }

    /**页面释放清理*/
    onRelease() {
        this._userItemBag.forEach(itemBag => {
            ItemBagPool.put(itemBag);
        })
       eventCenter.unregisterAll(this);
    }

    private _initView() {
        this.layout.node.removeAllChildren();
        for (let layerID = 1; layerID <= LAYER_LEN; layerID++){
            let rewardItem = cc.instantiate(this.rewardTemp);
            rewardItem.parent = this.layout.node;

            //掉落
            let dropString = islandData.getRewardCfgByLayerID(layerID);
            if (!dropString) continue;
            let dropShow: string[] = dropString.split("|");
            //单行奖励约束
            let curLayout = rewardItem.getComponentInChildren(cc.Layout);
            //单行title
            let rewardTitle = rewardItem.getComponentInChildren(cc.Label);
            rewardTitle.string = `${layerID}层首领奖励`
            dropShow.forEach((str) => {
                let dropIds = str.split(";").map(Number);
                if (dropIds && dropIds.length) {
                    let itemBag = ItemBagPool.get();
                    itemBag.init({
                        id: dropIds[0],
                        count: dropIds[1],
                        clickHandler: () => { moduleUIManager.showItemDetailInfo(dropIds[0], dropIds[1], this.node); }
                    });
                    itemBag.node.parent = curLayout.node;
                    this._userItemBag.push(itemBag);
                }
            })
        }
    }
}