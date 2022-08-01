import { CustomDialogId, CustomItemId, XUANTIE_TO_EXP } from "../../../app/AppConst";
import { bagDataUtils } from "../../../app/BagDataUtils";
import RichTextEx from "../../../common/components/rich-text/RichTextEx";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { configManager } from "../../../common/ConfigManager";
import { ItemBagPool } from "../../../common/res-manager/NodePool";
import { cfg } from "../../../config/config";
import ItemBag from "../view-item/ItemBag";

const { ccclass, property } = cc._decorator;

@ccclass
export default class EquipOnceEnhanceConfirmView extends ViewBaseComponent {

    @property(cc.Label)
    descTitle: cc.Label = null;
    @property(cc.Label) 
    descContent: cc.Label = null;
    @property(cc.Node)
    buttonConfirm: cc.Node = null;
    @property(cc.Button) 
    btnClose: cc.Button = null;
    @property(cc.Button) 
    btnMask: cc.Button = null;
    @property(cc.Toggle) 
    toggle: cc.Toggle = null;
    @property(cc.Node)
    xuantieNode: cc.Node = null;
    @property(cc.Node)
    goldNode: cc.Node = null;

    private _callBack: Function = null;
    private _items: Array<ItemBag> = new Array();

    onInit(costExp: number, callBack: Function) {
        let titleDialog: cfg.Dialog = configManager.getConfigByKey("dialogue", CustomDialogId.EQUIP_ONCE_ENHANCE_CONFIRM_TITLE);
        if (titleDialog && titleDialog.DialogText) {
            this.descTitle.string = titleDialog.DialogText;
        }

        let contentDialog: cfg.Dialog = configManager.getConfigByKey("dialogue", CustomDialogId.EQUIP_ONCE_ENHANCE_CONFIRM_CONTENT);
        if (contentDialog && contentDialog.DialogText) {
            this.descContent.string = contentDialog.DialogText;
        }

        this._showCost(costExp);

        this._callBack = callBack;
    }

    private _showCost(costExp: number) {
        let xuantieCount: number = Math.round(costExp / XUANTIE_TO_EXP);

        let itemXuantie: ItemBag = ItemBagPool.get();
        itemXuantie.init({
            id: CustomItemId.XUANTIE,
            count: xuantieCount
        });
        itemXuantie.node.parent = this.xuantieNode;
        this._items.push(itemXuantie);

        let goldCount: number = Math.round(costExp * bagDataUtils.getEnhanceGoldMulti());
        let itemGold: ItemBag = ItemBagPool.get();
        itemGold.init({
            id: CustomItemId.GOLD,
            count: goldCount
        });
        itemGold.node.parent = this.goldNode;
        this._items.push(itemGold);
    }

    onDestroy() {

    }

    onClickButtonConfirm() {
        if (this._callBack) {
            this._callBack(this.toggle.isChecked);
        }
        this.closeView();
    }

    protected onRelease(): void {
        if (this._items.length > 0) {
            this._items.forEach((item) => {
                ItemBagPool.put(item);
            });
            
            this._items = [];
        }
    }
}

export {
    EquipOnceEnhanceConfirmView
}