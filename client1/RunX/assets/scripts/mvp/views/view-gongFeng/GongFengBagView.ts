/*
 * @Description:
 * @Version: 1.0
 * @Autor: lixu
 * @Date: 2022-06-08 20:03:15
 * @LastEditors: lixu
 * @LastEditTime: 2022-06-15 19:49:59
 */

import { CONSECRATE_STATUE_NAME} from "../../../app/AppEnums";
import UIGridView, { GridData } from "../../../common/components/UIGridView";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import guiManager from "../../../common/GUIManager";
import { bagData } from "../../models/BagData";
import { consecrateData } from "../../models/ConsecrateData";
import { consecrateOpt } from "../../operations/ConsecrateOpt";
import ItemGongFengBag from "./items/ItemGongFengBag";
import { ConsecreateStatueLVData } from "./items/ItemGongFengMain";

const {ccclass, property} = cc._decorator;

@ccclass
export default class GongFengBagView extends ViewBaseComponent {
    @property(cc.Node) rootNode: cc.Node = null;
    @property(UIGridView) bagList: UIGridView = null;
    @property(cc.Label) nameLb: cc.Label = null;
    @property(cc.Prefab) itemPfb: cc.Prefab = null;
    @property(cc.Node) emptyNode: cc.Node = null;

    private _statueID: number = 0;
    private _itemPool: cc.NodePool = new cc.NodePool();
    private _goodsIDs: number[] = null;;
    private _lvData: ConsecreateStatueLVData = null;

    protected onInit(statueID: number, lvData: ConsecreateStatueLVData, goodsIDs: number[]): void {
        this._statueID = statueID;
        this._lvData = lvData;
        this._goodsIDs = goodsIDs;
        this.node.active = true;
        this._initUI()
    }

    protected onRelease(): void {
      this._lvData = null;
        this.bagList.clear();
        this._itemPool.clear();
    }

    onClickClose() {
        this.node.active = false;
    }

    private _initUI() {
        this.nameLb.string = `${CONSECRATE_STATUE_NAME[this._statueID + '']}贡品背包`;
        this._initBagList();
    }

    private _initBagList() {
        this.bagList.clear();
        let gridData: GridData[] = [];
        this._goodsIDs.forEach(ele => {
            let cnt = bagData.getItemCountByID(ele);
            if(cnt > 0) {
               gridData.push({key: ele +'', data:cnt});
            }
        });

        let isEmpty = gridData.length == 0;
        this.emptyNode.active = isEmpty;
        if(isEmpty) {
            return;
        }

        this.bagList.init(gridData, {
            onInit: (item: ItemGongFengBag, data: GridData) => {
              let key = parseInt(data.key);
              item.init(key, this._onItemClick.bind(this));
            },
            getItem: (): ItemGongFengBag => {
                let node = this._getBagItem();
                node.active = true;
                return node.getComponent(ItemGongFengBag);
            },
            releaseItem: (item: ItemGongFengBag) => {
                item.deInit();
                this._itemPool.put(item.node);
            }
        });
    }

    private _getBagItem(): cc.Node {
        if(this._itemPool.size() > 0) {
            return this._itemPool.get();
        }

        let node = cc.instantiate(this.itemPfb);
        return node;
    }

    private _onItemClick(itemID: number) {
        let statueInfo = consecrateData.getStatueInfo(this._statueID);
        if(!statueInfo) return;
        let tributeList = statueInfo.UniversalConsecrateTributeList
        if(tributeList && tributeList.length >= this._lvData.tributeBoxCnt) {
            guiManager.showTips(`${CONSECRATE_STATUE_NAME[this._statueID+'']}雕像供奉栏已满`)
            return;
        }
        consecrateOpt.sendPutOnTributeReq(this._statueID, itemID);
    }

    upateItemBag(statueID: number, itemID: number) {
        if(statueID != this._statueID || !this._goodsIDs) return;
        let idx = this._goodsIDs.indexOf(itemID);
        if(idx == -1) return;

        let curCnt = bagData.getItemCountByID(itemID);
        if(curCnt == 0){
            this._goodsIDs.splice(idx, 1);
            this.bagList.deleteItem(itemID+ '');
        }

        if(this._goodsIDs.length == 0) {
            this.emptyNode.active = true;
            this.bagList.clear();
            return;
        }

        let visibleItems = this.bagList.getItems();
        visibleItems.forEach((ele, idx) => {
            if(itemID == parseInt(idx)) {
                (ele as ItemGongFengBag).updateRewardItem();
            }
        });
    }
}
