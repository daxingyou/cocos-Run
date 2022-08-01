import { VIEW_NAME } from "../../app/AppConst";
import guiManager from "../../common/GUIManager";
import { data } from "../../network/lib/protocol";

const { ccclass, property } = cc._decorator;

@ccclass
export default class HeroOpt {
    private _isShowEquipPropertyDlg: Boolean = false;
    showEquipPropertyDlg(equip: data.IBagUnit, parentNode: cc.Node) {
        if (!this._isShowEquipPropertyDlg) {
            guiManager.loadView(VIEW_NAME.EQUIPPROPERTYVIEW, guiManager.sceneNode, equip);
        } else {

        }
    }

    openEquipProperDlg() {
        this._isShowEquipPropertyDlg = true;
    }

    closeEquipPropertyDlg() {
        this._isShowEquipPropertyDlg = false;
    }
}
