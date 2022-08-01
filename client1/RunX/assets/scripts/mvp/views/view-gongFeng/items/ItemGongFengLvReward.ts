/*
 * @Description:
 * @Version: 1.0
 * @Autor: lixu
 * @Date: 2022-06-08 19:26:53
 * @LastEditors: lixu
 * @LastEditTime: 2022-06-13 12:41:51
 */
import { BagItemInfo } from "../../../../app/AppType";
import guiManager from "../../../../common/GUIManager";
import { ItemBagPool } from "../../../../common/res-manager/NodePool";
import { data } from "../../../../network/lib/protocol";
import { consecrateData } from "../../../models/ConsecrateData";
import ItemBag from "../../view-item/ItemBag";

const {ccclass, property} = cc._decorator;

const ITEM_SPACE_X = 10;

@ccclass
export default class ItemGongFengLvReward extends cc.Component {
    @property(cc.Label) lv: cc.Label = null;
    @property(cc.Button) btnGetReward: cc.Button = null;
    @property(cc.Node) itemRoot: cc.Node = null;
    @property(cc.Node) takedTag: cc.Node = null;
    @property(cc.Sprite) btnGetRewardBgNormal: cc.Sprite = null;
    @property(cc.Sprite) btnGetRewardBgGray: cc.Sprite = null;

    private _bagItems: ItemBag[] = null;
    private _items: BagItemInfo[] = null;
    private _statueInfo: data.IUniversalConsecrateStatue = null;
    private _lv: number = 0;
    private _clickItemHandler: Function = null;
    private _getRewardHandler: Function = null;
    private _curLv: number = 0;
    init(items: BagItemInfo[], lv: number, statueID: number, curLv: number,  clickItemHandler: Function, clickHandler?: Function) {
        this._items = items;
        this._lv = lv;
        this._statueInfo = consecrateData.getStatueInfo(statueID);
        this._curLv = curLv;
        this._clickItemHandler = clickItemHandler;
        this._getRewardHandler = clickHandler;
        this._initUI();
    }

    deInit() {
        this._statueInfo = null;
        this._items = null;
        this._curLv = 0;
        this._clickItemHandler = null;
        this._getRewardHandler = null;
        if(this._bagItems) {
            this._bagItems.forEach(ele => {
                ItemBagPool.put(ele);
            });
            this._bagItems.length = 0;
        }
    }

    onClickTake() {
        if(this._lv > this._curLv) {
            guiManager.showTips('未达到等级，奖励暂不可领取');
            return;
        }
        this._getRewardHandler && this._getRewardHandler(this._lv);
    }

    private _initUI() {
        this.lv.string = `LV：${this._lv}`;
        this._initRewardItems();
        this._initTakeBtn();
    }

    private _initRewardItems() {
        if(!this._items || this._items.length == 0) return;

        this._bagItems = this._bagItems || [];
        this._items.forEach((ele, idx) => {
            let bagItem = ItemBagPool.get();
            bagItem.init({
                id: ele.id,
                count: ele.count,
                clickHandler: (info: BagItemInfo) => {
                    this._clickItemHandler && this._clickItemHandler(info);
                }
            });
            bagItem.node.scale = 0.8;
            let posX = (2 * idx + 1) * (bagItem.node.width >> 1) * 0.8 + idx * ITEM_SPACE_X;
            bagItem.node.setPosition(posX, 0);
            this.itemRoot.addChild(bagItem.node);
            this._bagItems.push(bagItem);
        });
    }

    private _initTakeBtn() {
        let curLv = this._curLv;
        if(this._lv <= curLv) {
            let recvMap = this._statueInfo.ReceiveLevelRewardMap;
            let isRecv = !!(recvMap && recvMap[this._lv + '']);
            this.btnGetReward.node.active = !isRecv;
            this.takedTag.active = isRecv;
            this.btnGetRewardBgGray.node.active = false;
            this.btnGetRewardBgNormal.node.active = true;
        } else {
            this.btnGetReward.node.active = true;
            this.takedTag.active = false;
            this.btnGetRewardBgGray.node.active = true;
            this.btnGetRewardBgNormal.node.active = false;
        }
    }

    updateTakeRewardState(curLv: number) {
        this._curLv = curLv;
        this._initTakeBtn();
    }
}
