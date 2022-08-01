/*
 * @Author:xuyang
 * @Date: 2021-05-21 16:17:35
 * @Description: 基础物品领取弹窗，可复用
 */
import List from "../../../common/components/List";
import { data } from "../../../network/lib/protocol";
import { utils } from "../../../app/AppUtils";
import { configUtils } from "../../../app/ConfigUtils";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { VIEW_NAME } from "../../../app/AppConst";
import { bagDataUtils } from "../../../app/BagDataUtils";

const { ccclass, property } = cc._decorator;
@ccclass
export default class ChapterPrizeView extends ViewBaseComponent {
    @property(List) itemListView: List = null;
    private _itemList: data.IItemInfo[] = [];

    onInit(itemList: data.IItemInfo[]) {
        this._itemList = this.deal(itemList) || [];
        this.itemListView.numItems = this._itemList.length;
    }

    onListRender(item: cc.Node, idx: number) {
        let prizeItem = this._itemList[idx];
        let itemScript = item.getComponent("ItemBag");

        itemScript.init({
            id: prizeItem.ID,
            count: prizeItem.Count,
            prizeItem: true,
        });

        //最后一次刷新过后设置Content居中
        if (idx == this._itemList.length - 1) {
            this.scheduleOnce(() => {
                this.itemListView.content.getComponent(cc.Layout).updateLayout();
                this.itemListView.node.x += (500 - this.itemListView.content.width) / 2;
            })

        }
    }

    onRelease () {
        this.unscheduleAllCallbacks();
        this.releaseSubView();
        this.itemListView._deInit();
    }

    //合并重复数据
    deal(data: data.IItemInfo[]) {
        let idMap = new Map<number, data.IItemInfo>();
        let itemList: data.IItemInfo[] = [];
        data.forEach(item => {
            if (!idMap.has(item.ID)) {
                idMap.set(item.ID, item);
            } else {
                let val = idMap.get(item.ID);
                val.Count = Number(val.Count) + Number(item.Count);
                idMap.set(item.ID, val);
            }
        })
        idMap.forEach((ele) => {
            let config1 = configUtils.getEquipConfig(ele.ID);
            if (config1) {
                let copy: any = utils.deepCopy(ele);
                let cnt: number = utils.longToNumber(ele.Count);
                copy.Count = 1;
                //@ts-ignore
                itemList = itemList.concat(new Array<data.ItemInfo>(cnt).fill(copy));
                return;
            }
            itemList.push(ele);
        })
        return itemList;
    }

    //选中事件
    onListSelectRender(item: cc.Node, sid: number) {
        let prizeItem = this._itemList[sid];
        let config = configUtils.getItemConfig(prizeItem.ID);
        let config1 = configUtils.getEquipConfig(prizeItem.ID);
        if (config) {
            let newitem: data.IBagUnit = { ID: prizeItem.ID, Count: prizeItem.Count, Seq: 0 };
            item && this.loadSubView(VIEW_NAME.TIPS_ITEM, newitem);
        } else if (config1) {
            let item: data.IBagUnit = bagDataUtils.buildDefaultEquip(prizeItem.ID);
            this.loadSubView(VIEW_NAME.TIPS_EQUIP, item);
        }

    }
}