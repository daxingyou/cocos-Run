/*
 * @Author: xuyang
 * @Date: 2021-07-05 19:17:31
 * @Description: PVE极限试炼-云端梦境-奖励页面
 */
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { configManager } from "../../../common/ConfigManager";
import { cfg } from "../../../config/config";
import { utils } from "../../../app/AppUtils";
import { pveTrialData } from "../../models/PveTrialData";
import { ItemBagPool } from "../../../common/res-manager/NodePool";
import ItemBag from "../view-item/ItemBag";
import List from "../../../common/components/List";
import moduleUIManager from "../../../common/ModuleUIManager";
const { ccclass, property } = cc._decorator;
@ccclass
export default class PVECloudDreamRewardView extends ViewBaseComponent {
    @property(List) mainListView: List = null;
    
    private _chapterCfgs: cfg.PVECloudDreamChapter[] = [];       //PVE关卡列表
    private _itemBags: ItemBag[] = [];

    onInit() {
        this.refreshView();
    }

    deInit() {
        this._clearItems();
    }

    onRelease() {
        this.deInit(); 
    }

    private _clearItems() {
        this._itemBags.forEach(_i => {
            _i.node.removeFromParent();
            _i.deInit();
            ItemBagPool.put(_i)
        })
        this._itemBags = [];
    }

    refreshView() {
        this._chapterCfgs = configManager.getConfigList("cloudDreamChapter");
        this._clearItems();
        this.mainListView.numItems = this._chapterCfgs.length;
    }

    onListRender(item: cc.Node, idx: number){
        let chapterCfg = this._chapterCfgs[idx];
        let prizeNode = item.getChildByName("reward");
        let prizeTokentTxt = item.getChildByName("txt_token");
        let title = item.getChildByName("title");
        //奖励道具展示
        if (chapterCfg.PVECloudDreamChapterRewardShow) {
            let parseArr = utils.parseStingList(chapterCfg.PVECloudDreamChapterRewardShow);
            parseArr.forEach((ele, index) => {
                if (ele && ele.length) {
                    let itemNode = prizeNode.children[index] || ItemBagPool.get().node;
                    let item = itemNode.getComponent(ItemBag);
                    item.init({
                        id: parseInt(ele[0]),
                        count: parseInt(ele[1]),
                        prizeItem: true,
                        clickHandler: () => { moduleUIManager.showItemDetailInfo(parseInt(ele[0]), parseInt(ele[1]), this.node); }
                    })
                    itemNode.parent = prizeNode;
                    !prizeNode.children[index] && this._itemBags.push(item);
                }
                
            })
        }
        prizeTokentTxt.active = pveTrialData.cloudData.ReceiveRewardMap[chapterCfg.PVECloudDreamChapterId];
        title.getComponentInChildren(cc.Label).string = `${chapterCfg.PVECloudDreamChapterName}`;
    }
}
