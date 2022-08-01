/*
 * @Author: xuyang
 * @Date: 2021-07-05 19:17:31
 * @Description: PVP-论道修仙-奖励页面
 */
import {VIEW_NAME } from "../../../app/AppConst";
import { utils } from "../../../app/AppUtils";
import { bagDataUtils } from "../../../app/BagDataUtils";
import { configUtils } from "../../../app/ConfigUtils";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { configManager } from "../../../common/ConfigManager";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { cfg } from "../../../config/config";
import { data } from "../../../network/lib/protocol";
import { bagData } from "../../models/BagData";
import { pvpData } from "../../models/PvpData";
import { userData } from "../../models/UserData";
import { ItemBagPool } from "../../../common/res-manager/NodePool";
import List from "../../../common/components/List";
import ItemBag from "../view-item/ItemBag";
import moduleUIManager from "../../../common/ModuleUIManager";

const { ccclass, property } = cc._decorator;

@ccclass
export default class PVPImmortalsRewardView extends ViewBaseComponent {
    @property(List) listView: List = null;
    @property(cc.Node) selfItem: cc.Node = null;
    @property(cc.Label) rankTxt: cc.Label = null;

    private _rank: number = 0;
    private _itemBags: ItemBag[] = [];
    private _pvpImmortalsCfg: cfg.PVPImmortals[] = [];
    private _sprLoader: SpriteLoader = new SpriteLoader();

    onInit() {
        this.refreshView();
    }

    private _clearItems() {
        this._itemBags.forEach(_i => {
            ItemBagPool.put(_i)
        })
        this._itemBags = [];
    }

    onRelease() {
        this._clearItems();
        this.listView._deInit();
        this._sprLoader.release();
    }

    onListRender(itemNode: cc.Node, idx: number) {
        let immortalsCfg = this._pvpImmortalsCfg[idx];
        this.changeItem(itemNode, immortalsCfg);
    }

    refreshView(){
        this._pvpImmortalsCfg = configManager.getConfigList("pvpImmortals").reverse();
        this.listView.numItems = this._pvpImmortalsCfg.length;
        // 自己的Item
        this._rank = pvpData.getUserFairyRank(userData.uId);
        // this.rankTxt.string = `我的排名：${this._rank || "--"}`
        this.changeItem(this.selfItem, this._getSelfCfg(), true)
    }

    changeItem(item:cc.Node, cfg: cfg.PVPImmortals, self?: boolean){
        let rankNode = item.getChildByName("rank");
        let rankTxt = rankNode.getChildByName("rank_text");
        let lableRank = rankTxt.getComponent(cc.Label);
        let rankIcon = rankNode.getChildByName("rank_icon");
        let prizeNode = item.getChildByName("reward");

        rankIcon.active = !!cfg.PVPImmortalsRankType;
        if (self) {
            lableRank.string = `${pvpData.fairyData.Integral || 0}`;
        } else {
            if (cfg && cfg.PVPImmortalsRankSection) {
                let rankInfo = cfg.PVPImmortalsRankSection.split(";")
                if (cfg.PVPImmortalsRankType == 2) {
                    if (rankInfo.length > 1) {
                        if (rankInfo[1] && rankInfo[0] == rankInfo[1]) {
                            lableRank.string = `第${rankInfo[1]}名`
                        } else if (rankInfo[1]) {
                            lableRank.string = `第${rankInfo[0]}-${rankInfo[1]}名`
                        }
                    }
                } else if (cfg.PVPImmortalsRankType == 1) {
                    lableRank.string = cfg.PVPImmortalsRankSection.replace(/;[\w\d]*/, "+");
                }
            }
        }

        //奖励物品
        let children = [...prizeNode.children]
        children.forEach(child => {
            let childItem = child.getComponent(ItemBag);
            child.removeFromParent();
            if (childItem) {
                let childIdx = this._itemBags.indexOf(childItem);
                if (childIdx > -1) {
                    childItem.deInit();
                    ItemBagPool.put(childItem);
                    this._itemBags.splice(childIdx, 1);
                }
            }
        });
        if (cfg && cfg.PVPImmortalsRankReward) {
            let parseArr = utils.parseStingList(cfg.PVPImmortalsRankReward);
            parseArr.forEach((ele, index) => {
                if (ele && ele.length) {
                    let item = ItemBagPool.get();
                    item.init({
                        id: parseInt(ele[0]),
                        count: parseInt(ele[1]),
                        prizeItem: true,
                        clickHandler: () => { moduleUIManager.showItemDetailInfo(parseInt(ele[0]), parseInt(ele[1]), this.node); }
                    })
                    item.node.parent = prizeNode;
                    this._itemBags.push(item);
                }

            })
            prizeNode.active = true;
        }
        this._sprLoader.changeSprite(rankIcon.getComponent(cc.Sprite), `textures/pvp-image/${cfg.PVPImmortalsRankIcon}`);
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


    private _calMinRank() {
        let cfgs: cfg.PVPImmortals[] = configManager.getConfigList("pvpImmortals");
        let minRank = 0;
        for (let _k in cfgs) {
            let cfg = cfgs[_k];
            if (cfg.PVPImmortalsRankType == 2) {
                let lower = parseInt(cfg.PVPImmortalsRankSection.split(";")[0]);
                let upper = parseInt(cfg.PVPImmortalsRankSection.split(";")[1]);
                minRank = Math.max(minRank, lower, upper);
            }
        }
        return minRank;
    }

    private _getSelfCfg(){
        let cfgs: cfg.PVPImmortals[] = configManager.getConfigList("pvpImmortals");
        let integral = pvpData.fairyData.Integral;
        let rank = this._rank;
        let minRank = this._calMinRank();
        let immortalCfg: cfg.PVPImmortals;
        if (rank && rank<=minRank){
            for (let _k in cfgs) {
                let cfg = cfgs[_k];
                let lower = parseInt(cfg.PVPImmortalsRankSection.split(";")[0]);
                let upper = parseInt(cfg.PVPImmortalsRankSection.split(";")[1]);
                if (cfg.PVPImmortalsRankType == 2
                    && rank >= lower && rank <= upper) {
                    immortalCfg = cfg;
                    break;
                }
            }
        }else{
            for (let _k in cfgs) {
                let cfg = cfgs[_k];
                let lower = parseInt(cfg.PVPImmortalsRankSection.split(";")[0]);
                let upper = parseInt(cfg.PVPImmortalsRankSection.split(";")[1]);
                if (cfg.PVPImmortalsRankType == 1
                    && integral >= lower && integral <= upper) {
                    immortalCfg = cfg;
                    break;
                }
            }
        }
        return immortalCfg;
    }

}
