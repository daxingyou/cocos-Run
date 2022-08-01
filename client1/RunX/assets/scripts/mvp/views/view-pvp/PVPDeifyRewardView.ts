/*
 * @Author: xuyang
 * @Date: 2021-07-05 19:17:31
 * @Description: PVP-斩将封神-奖励页面
 */
import { VIEW_NAME } from "../../../app/AppConst";
import { utils } from "../../../app/AppUtils";
import { bagDataUtils } from "../../../app/BagDataUtils";
import { configUtils } from "../../../app/ConfigUtils";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { configManager } from "../../../common/ConfigManager";
import { cfg } from "../../../config/config";
import { data } from "../../../network/lib/protocol";
import { bagData } from "../../models/BagData";
import { pvpData } from "../../models/PvpData";
import List from "../../../common/components/List";
import ItemBag from "../view-item/ItemBag";
import moduleUIManager from "../../../common/ModuleUIManager";
import { ItemBagPool } from "../../../common/res-manager/NodePool";

const { ccclass, property } = cc._decorator;

@ccclass
export default class PVPDeifyRewardView extends ViewBaseComponent {

    @property(List) listView: List = null;
    @property(cc.Node) selfItem: cc.Node = null;

    private _pvpDeifyCFg: cfg.PVPDeify[] = [];
    private _itemBags: ItemBag[] = [];

    onInit() {
        this.refreshView();
    }
    
    onRelease() {
        this._clearItems();
    }

    private _clearItems() {
        this._itemBags.forEach(_i => {
            ItemBagPool.put(_i)
        })
        this._itemBags = [];
    }

    onListRender(itemNode: cc.Node, idx: number) {
        let deifyCfg = this._pvpDeifyCFg[idx];
        this.changeItem(itemNode, deifyCfg); 
    }

    refreshView(){
        this._pvpDeifyCFg = configManager.getConfigList("pvpDeify");
        this.listView.numItems = this._pvpDeifyCFg.length;
        // 自己的Item
        this.changeItem(this.selfItem, configUtils.getDeifyCfgByRank(pvpData.spiritData.Rank), true)
    }

    changeItem(item:cc.Node, cfg: cfg.PVPDeify, self?: boolean){
        let rankNode = item.getChildByName("rank");
        let rank1 = rankNode.getChildByName("rank_1");
        let rank2 = rankNode.getChildByName("rank_2");
        let rank3 = rankNode.getChildByName("rank_3");
        let rankTxt = rankNode.getChildByName("text");
        let prizeNode = item.getChildByName("rewards");
        let empty = item.getChildByName("empty_txt");

        rank1.active = cfg && cfg.PVPDeifyId==1;
        rank2.active = cfg && cfg.PVPDeifyId==2;
        rank3.active = cfg && cfg.PVPDeifyId==3;
        rankTxt.active = !(cfg && cfg.PVPDeifyId >= 1 && cfg.PVPDeifyId <= 3);

        if (cfg && cfg.PVPDeifyRankSection){
            rankTxt.getComponent(cc.Label).string = cfg.PVPDeifyRankSection.replace(";","-");
            if (self) rankTxt.getComponent(cc.Label).string = `${pvpData.spiritData.Rank}`;
        }else
            rankTxt.getComponent(cc.Label).string = "10000+";  
        //奖励物品
        let children = [...prizeNode.children]
        children.forEach(child => {
            let childItem = child.getComponent(ItemBag);
            child.removeFromParent();
            if (childItem){
                let childIdx = this._itemBags.indexOf(childItem);
                if (childIdx > -1){
                    childItem.deInit();
                    ItemBagPool.put(childItem);
                    this._itemBags.splice(childIdx, 1);
                }
            }
        });
        if (cfg && cfg.PVPDeifyDayReward) {
            let parseArr = utils.parseStingList(cfg.PVPDeifyDayReward);
            parseArr.forEach((ele, index) => {
                if (ele && ele.length) {
                    let item = ItemBagPool.get();
                    item.init({
                        id: parseInt(ele[0]),
                        count: parseInt(ele[1]),
                        prizeItem: true,
                        clickHandler: () => { moduleUIManager.showItemDetailInfo(parseInt(ele[0]), parseInt(ele[1]),  this.node); }
                    })
                    this._itemBags.push(item);
                    item.node.parent = prizeNode;
                }
            })
            prizeNode.active = true;
            empty.active = false
        } else {
            prizeNode.active = false;
            empty.active = true;
        }
    }


    onClickItem(itemID: number) {
        let config = configUtils.getItemConfig(itemID);
        let config1 = configUtils.getEquipConfig(itemID);
        if (config) {
            let newitem: data.IBagUnit = { ID: itemID, Count: 0, Seq: 0 };
            let findItem = bagData.getItemByID(itemID);
            let item: data.IBagUnit = findItem ? findItem.Array[0] : newitem;
            this.loadSubView(VIEW_NAME.TIPS_ITEM, item);
        } else if (config1) {
            let item: data.IBagUnit = bagDataUtils.buildDefaultEquip(itemID);
            this.loadSubView(VIEW_NAME.TIPS_EQUIP, item);
        }
    }

}
