import { utils } from "../../../app/AppUtils";
import { configUtils } from "../../../app/ConfigUtils";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import moduleUIManager from "../../../common/ModuleUIManager";
import { data } from "../../../network/lib/protocol";

const { ccclass, property } = cc._decorator;

@ccclass export default class ItemPropAccess extends cc.Component {
    @property(cc.Label) label: cc.Label = null;
    @property(cc.Node) jumpBtn: cc.Node = null;

    private _jumpPage: string = "";
    private _parent: ViewBaseComponent = null;
    private _autoClose = false;
    private _bagUnit: data.IBagUnit = null;

    set jumpPage(val: string) {
        this.setJumpPage(val, null);
    }

    setJumpPage(val: string, bagUnit: data.IBagUnit) {
        let cfg = configUtils.getAccessConfig(Number(val));
        this._bagUnit = bagUnit;
        this._jumpPage = cfg.GetAccessLink;
        this.label.string = cfg.GetAccessIntroduce;
        this.node.getComponentInChildren(cc.Button).node.active = !!cfg.GetAccessLink;
    }

    set parent(view:ViewBaseComponent){
        this._parent = view;
    }

    onClickJump(event: cc.Event, customEventData: string) {
        let parseList = utils.parseStingList(this._jumpPage);
        if (parseList && parseList.length > 0) {
            let ID = this._bagUnit? this._bagUnit.ID:0
            parseList = this._jumpPage.search(";") == -1 ? parseList : parseList[0];
            let moduleId = parseList && parseList[0] ? parseList[0] : 0;
            let partId = parseList && parseList[1] ? parseList[1] : 0;
            let subId = parseList && parseList[2] || 0;
            if (this._parent)
                this._parent.closeView();
            moduleUIManager.jumpToModule(parseInt(moduleId), parseInt(partId), parseInt(subId), ID);
        }
    }

    adjustButton(){
        if (this.jumpBtn){
            this.jumpBtn.x = 270;
        }
    }

    deInit(){
        this._bagUnit = null;
    }
}
