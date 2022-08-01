/*
* @Author:xuyang
* @Date: 2021-05-21 16:17:35
* @Description: 基础物品领取弹窗，可复用
* @FilePath: \RunX\assets\scripts\mvp\views\view-other\GiftChooseView.ts
*/
import List from "../../../common/components/List";
import ItemGiftChoose from "./ItemGiftChoose";
import { data } from "../../../network/lib/protocol";
import { utils } from "../../../app/AppUtils";
import { bagData } from "../../models/BagData";
import { bagDataOpt } from "../../operations/BagDataOpt";
import { eventCenter } from "../../../common/event/EventCenter";
import { bagDataEvent } from "../../../common/event/EventData";
import { configUtils } from "../../../app/ConfigUtils";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";

const { ccclass, property } = cc._decorator;
@ccclass
export default class GiftChooseView extends ViewBaseComponent {
    @property(List) itemListView: List = null;
    @property(cc.Button) cfmButton: cc.Button = null;
    @property(cc.Label) itemCount: cc.Label = null;

    private _itemList: data.ItemInfo[] = [];
    private _totalGift: number = 0;
    private _giftCnt: number = 0;
    private _selCount: number[] = [];
    private _itemID: number = 0;

    get remainGift() {
        let sum = 0;
        this._selCount.forEach(ele => {
            sum += ele;
        })
        return this._totalGift - sum;
    }

    setSelCnt(index: number, cnt: number) {
        let sum = 0;
        this._selCount[index] = cnt;
        this.updateSelCnt();
    }

    onInit(itemID: number, useCnt: number) {
        this._itemID = itemID;
        this._totalGift = useCnt;
        this.parseItemInfo(itemID, useCnt);
        this.updateSelCnt();
        this.registerEvent();
        this.itemListView.numItems = this._itemList.length;
    }

    onRelease() {
        this.itemListView._deInit();
        eventCenter.unregisterAll(this);
    }

    registerEvent() {
        eventCenter.register(bagDataEvent.ITEM_USE, this, this.closeView);       //掉落物品
    }

    onListRender(item: cc.Node, idx: number) {
        let prizeItem = this._itemList[idx];
        let itemScript: ItemGiftChoose = item.getComponent("ItemGiftChoose");

        itemScript.onInit(this);
        itemScript.index = idx;
        itemScript.curCnt = this._selCount[idx];
        itemScript.itemInfo = prizeItem;

        //最后一次刷新过后设置Content居中
        if (idx == this._itemList.length - 1 && this.itemListView.content.width < 840) {
            this.scheduleOnce(() => {
                this.itemListView.content.getComponent(cc.Layout).updateLayout();
                this.itemListView.node.x += (840 - this.itemListView.content.width) / 2 + 20;
            })
        }
    }

    parseItemInfo(itemID: number, useCnt?: number) {
        let config = configUtils.getItemConfig(itemID);
        if (config.ItemUseEffect == 3 && config.ItemUseEffectNum) {
            let parseRes = utils.parseStingList(config.ItemUseEffectNum);
            parseRes.forEach((ele) => {
                let itemInfo: data.ItemInfo = {
                    Count: Number(ele[1] | 0),
                    ID: Number(ele[0]),
                    toJSON: null,
                }
                this._selCount.push(0);
                this._itemList.push(itemInfo);
            })
        }
    }

    updateSelCnt() {
        let useCnt = this._totalGift - this.remainGift;
        let materialGrey: cc.Material = cc.Material.getBuiltinMaterial('2d-gray-sprite');
        let materialNormal: cc.Material = cc.Material.getBuiltinMaterial('2d-sprite');
        this.itemCount.string = `已选奖励${useCnt}/${this._totalGift}`;
        this.cfmButton.interactable = !Boolean(this.remainGift);
        this.cfmButton.node.getComponent(cc.Sprite).setMaterial(0, this.remainGift ? materialGrey : materialNormal);
        this.cfmButton.node.getComponentInChildren(cc.Label).setMaterial(0, this.remainGift ? materialGrey : materialNormal);
    }


    onClickConfirm() {
        let selResult: number[] = [];
        this._selCount.forEach((ele, index) => {
            if (ele > 0) {
                //@ts-ignore
                selResult = selResult.concat(new Array<number>(ele).fill(index));
            }
        })
        let item = bagData.getItemByID(this._itemID).Array[0];
        let copyItem: any = utils.deepCopy(item);
        if (!item) {
            return;
        }
        copyItem.Count = this._totalGift;
        bagDataOpt.sendItemUseRequst(copyItem, selResult);
    }
}