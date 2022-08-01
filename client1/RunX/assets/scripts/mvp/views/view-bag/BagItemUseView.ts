import { utils } from "../../../app/AppUtils";
import { configUtils } from "../../../app/ConfigUtils";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { ItemBagPool } from "../../../common/res-manager/NodePool";
import { cfg } from "../../../config/config";
import { data } from "../../../network/lib/protocol";
import { bagData } from "../../models/BagData";
import { bagDataOpt } from "../../operations/BagDataOpt";

const { ccclass, property } = cc._decorator;
@ccclass
export default class BagItemUseView extends ViewBaseComponent {
    @property(cc.Label)         txtTitle: cc.Label = null;
    @property(cc.EditBox)       editBox: cc.EditBox = null;
    @property(cc.Node)          emptyNode: cc.Node = null;
    @property(cc.Label)         itemNameLB: cc.Label = null;
    @property(cc.Label)         hasCountLB: cc.Label = null;
    @property(cc.Label)         descLB: cc.Label = null;
    @property(cc.Label)         selectCountLB: cc.Label = null;
    @property(cc.ProgressBar)   selectProgress: cc.ProgressBar = null;
    @property(cc.Slider)        selectSlider: cc.Slider = null;

    private _itemCount: number = 0;
    private _curCount: number = 1;
    private _itemData: data.IBagUnit = null;
    private _stepNum: number = 1;
    private _callBack: Function = null;

    //物品，使用最小数量限制，回调
    onInit(itemData: data.IBagUnit, step: number, cb?: Function) {
        this._callBack = cb;
        this._itemData = itemData;
        this._itemCount = utils.longToNumber(itemData.Count);
        this._stepNum = step || 1;
        this._curCount = this._stepNum;
        this.editBox.string = this._stepNum.toString();
        //展示Item
        let pItem = this.emptyNode.getComponentInChildren("ItemBag");
        let count = bagData.getItemCountByID(itemData.ID);
        if (!pItem) {
            pItem = ItemBagPool.get();
            pItem.node.parent = this.emptyNode;
        }
        pItem.init({
            id: itemData.ID,
            count: count,
        });

        this._refreshItemInfoView();
        this._refreshProgress();
    }

    onRelease () {
        let item = this.emptyNode.getComponentInChildren("ItemBag");
        if (item) {
            ItemBagPool.put(item);
        }
    }

    private _refreshItemInfoView() {
        let hasItemCount = bagData.getItemCountByID(this._itemData.ID);
        this.hasCountLB.string = `拥有数量：${hasItemCount}`;

        let itemCfg: cfg.Item = configUtils.getItemConfig(this._itemData.ID);
        if(itemCfg) {
            this.itemNameLB.string = `${itemCfg.ItemName}`;
            this.descLB.string = `${itemCfg.ItemIntroduce}`;
        }
    }

    private _refreshSlider() {
        this.selectSlider.progress = (this._curCount < 1 ? 0 : this._curCount) / this._itemCount;
    }

    private _refreshProgress() {
        this.selectCountLB.string = `${this._curCount}/${this._itemCount}`;
        this.selectProgress.progress = (this._curCount < 1 ? 0 : this._curCount) / this._itemCount;
        this._refreshSlider();
    }

    private _resetProgress() {
        this.selectProgress.progress = 0;
    }

    onSliderEvent(slider: cc.Slider, customEventData: number) {
        let progress = slider.progress;
        this._curCount = Math.round(progress * this._itemCount) < 1 ? 1 : Math.round(progress * this._itemCount);
        this._refreshProgress();
    }

    private onClickNext() {
        if (this._curCount <= this._itemCount - this._stepNum) {
            this._curCount += this._stepNum;
            this.editBox.string = String(this._curCount);
            this._refreshProgress();
        }
    }
    private onClickPre() {
        if (this._curCount > this._stepNum) {
            this._curCount -= this._stepNum;
            this.editBox.string = String(this._curCount);
            this._refreshProgress();
        }
    }

    private onClickAdd() {
        if (this._curCount <= this._itemCount - this._stepNum) {
            this._curCount = Math.min(this._curCount + 10, this._itemCount);
            this.editBox.string = String(this._curCount);
            this._refreshProgress();
        }
    }

    private onClickMinus() {
        if (this._curCount > this._stepNum) {
            this._curCount = Math.max(this._curCount - 10, this._stepNum);
            this.editBox.string = String(this._curCount);
            this._refreshProgress();
        }
    }

    //创建特殊技能条目
    private onClickConfirm() {
        if (this._curCount > 0 && this._curCount <= this._itemCount) {
            let cfg = configUtils.getItemConfig(this._itemData.ID);
            if (cfg && cfg.ItemUseEffect == 3 && this._callBack) {
                this._callBack(this._curCount);
                this.closeView();
                return;
            }
            let copyItem: data.IBagUnit = utils.deepCopy(this._itemData);
            copyItem.Count = Math.floor(this._curCount / this._stepNum);
            bagDataOpt.sendItemUseRequst(copyItem);
            this.closeView();
        }
    }

    // update (dt) {}
}
