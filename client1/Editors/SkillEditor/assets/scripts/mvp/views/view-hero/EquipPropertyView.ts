import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { data } from "../../../network/lib/protocol";
import { modelManager } from "../../models/ModeManager";
import { optManager } from "../../operations/OptManager";
import EquipItem from "../view-other/EquipItem";

const { ccclass, property } = cc._decorator;

@ccclass
export default class EquipPropertyView extends ViewBaseComponent {
    @property(EquipItem) equipItem: EquipItem = null;
    @property(cc.Label) nameLb: cc.Label = null;
    // 基础属性
    @property(cc.Label) attackLb: cc.Label = null;
    @property(cc.Label) defendLb: cc.Label = null;
    @property(cc.Label) hpLb: cc.Label = null;
    // 特殊属性
    @property(cc.Node) specialPropertyNode: cc.Node = null;
    @property(cc.Label)

    private _equip: data.IBagUnit = null;
    onInit(equip: data.IBagUnit) {
        optManager.heroOpt.openEquipProperDlg();
        this._equip = equip;
        this.refreshView();
    }

    refreshView() {
        this.equipItem.setData(this._equip);
        let equipConfig = modelManager.bagData.getEquipBasicConfig(this._equip);

    }

    onRelease() {
        optManager.heroOpt.closeEquipPropertyDlg();
    }
}
