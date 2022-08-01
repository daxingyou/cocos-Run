import { utils } from "../../../../app/AppUtils";
import { ViewBaseComponent } from "../../../../common/components/ViewBaseComponent";
import { configManager } from "../../../../common/ConfigManager";
import moduleUIManager from "../../../../common/ModuleUIManager";
import { ItemBagPool } from "../../../../common/res-manager/NodePool";
import { cfg } from "../../../../config/config";
import { pveTrialData } from "../../../models/PveTrialData";
import ItemBag from "../../view-item/ItemBag";

const {ccclass, property} = cc._decorator;

@ccclass
export default class PVEPurtogaryBossRewardView extends ViewBaseComponent {

    @property(cc.Node) layoutCur: cc.Node = null;
    @property(cc.Node) nodeNext: cc.Node = null;
    @property(cc.Node) layoutNext: cc.Node = null;
    @property(cc.Node) nodePreview: cc.Node = null;
    @property(cc.Node) layoutPreview: cc.Node = null;
    @property(cc.Label) labelPreview: cc.Label = null;

    private itemBags: ItemBag[] = [];

    onInit() {
        this.initView();
    }

    initView() {
        // 获得当前层
        let curStorey: number = pveTrialData.getPurgatoryCurStorey();
        // 获得下一层，若当前层为最高层，则无下一层
        let infernalBasicConfigs: {[key: number]: cfg.PVEInfernalBasic} = configManager.getConfigs("pveInfernalBasic");
        let maxStorey: number = utils.getObjLength(infernalBasicConfigs);
        let nextStorey: number = curStorey === maxStorey ? null : curStorey + 1;
        // 获得预览层，从curStorey+2层开始找到的第一个PVEInfernalBasicNextReward为1的层
        let previewStorey: number = null;
        for (let i = curStorey + 2; i <= maxStorey; ++i) {
            if (infernalBasicConfigs[i].PVEInfernalBasicNextReward === 1) {
                previewStorey = i;
                break;
            }
        }

        // 展示奖励
        this.showBossReward(this.layoutCur, infernalBasicConfigs[curStorey]);
        
        if (nextStorey) {
            this.showBossReward(this.layoutNext, infernalBasicConfigs[nextStorey]);
        } else {
            this.nodeNext.active = false;
        }

        if (previewStorey) {
            this.labelPreview.string = `${previewStorey}层首领奖励`
            this.showBossReward(this.layoutPreview, infernalBasicConfigs[previewStorey]);
        } else {
            this.nodePreview.active = false;
        }
    }

    showBossReward(layoutNode: cc.Node, basicConfig: cfg.PVEInfernalBasic) {
        let parseResult = utils.parseStingList(basicConfig.PVEInfernalBasicRewardShow);
        let itemBag: ItemBag = null;
        for (let i = 0; i < parseResult.length; ++i) {
            itemBag = ItemBagPool.get();
            itemBag.init({
                id: parseInt(parseResult[i][0]),
                count: parseInt(parseResult[i][1]),
                clickHandler: () => { moduleUIManager.showItemDetailInfo(parseInt(parseResult[i][0]), parseInt(parseResult[i][1]), this.node); }
            });
            layoutNode.addChild(itemBag.node);
            this.itemBags.push(itemBag);
        }
    }

    onRelease() {
        this.clearItemBags();
    }

    clearItemBags() {
        this.itemBags.forEach((itemBag) => {
            ItemBagPool.put(itemBag);
        });
    }

    onBtnClose() {
        this.closeView();
    }
}
