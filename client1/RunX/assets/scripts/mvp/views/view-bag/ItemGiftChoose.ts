import { utils } from "../../../app/AppUtils";
import { bagDataUtils } from "../../../app/BagDataUtils";
import { configUtils } from "../../../app/ConfigUtils";
import { ItemBagPool } from "../../../common/res-manager/NodePool";
import { data } from "../../../network/lib/protocol";
import { Equip } from "../../template/Equip";
import ItemBag from "../view-item/ItemBag";
import GiftChooseView from "./GiftChooseView";
import guiManager from "../../../common/GUIManager";

const { ccclass, property } = cc._decorator;

@ccclass
export default class ItemGiftChoose extends cc.Component {
    @property(cc.Node) emptyNode: cc.Node = null;
    @property(cc.EditBox) inputArea: cc.EditBox = null;
    @property(cc.Button) buttonAdd: cc.Button = null;
    @property(cc.Button) buttonMinus: cc.Button = null;
    @property(cc.Label) itemName: cc.Label = null;

    private _giftView: GiftChooseView = null;
    private _itemInfo: data.ItemInfo = null;
    private _curCnt: number = 0;
    private _index: number = 0;    //组件在父容器中下标

    reuse(){

    }
    
    unuse () {
        let item = this.emptyNode.getComponentInChildren("ItemBag");
        if (item) {
            ItemBagPool.put(item);
        }
    }

    get curCnt() {
        return Number(this.inputArea.string) || 0;
    }

    set curCnt(val: number) {
        this._curCnt = val;
        this.inputArea.string = val.toString();
    }

    set itemInfo(val: data.ItemInfo) {
        this._itemInfo = val;
        this.updateItemView();
    }

    set index(val: number) {
        this._index = val;
    }

    onInit(parent: GiftChooseView) {
        this._giftView = parent;
    }

    updateItemView() {
        let prizeItem = this._itemInfo;
        let item = this.emptyNode.getComponentInChildren(ItemBag);
        if (!item){
            item = ItemBagPool.get();
            item.node.parent = this.emptyNode;
        }

        item.init({
            id: prizeItem.ID,
            count: prizeItem.Count,
        });
        this.itemName.string = item.getItemName();
    }

    onClickAdd() {
        if (this._giftView.remainGift > 0) {
            this._curCnt += 1;
            this._giftView.setSelCnt(this._index, this._curCnt);
            this.inputArea.string = this._curCnt.toString();
        } else {
            guiManager.showTips("已经到达选择上限。");
        }
    }

    onClickMinus() {
        if (this._curCnt > 0) {
            this._curCnt -= 1;
            this._giftView.setSelCnt(this._index, this._curCnt);
            this.inputArea.string = this._curCnt.toString();
        }
    }
}