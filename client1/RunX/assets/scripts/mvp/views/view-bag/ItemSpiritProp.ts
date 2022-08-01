import { FULL_PERCENT } from "../../../app/AppConst";
import { EquipAttr } from "../../../app/AppType";
import { configUtils } from "../../../app/ConfigUtils";

const {ccclass, property} = cc._decorator;

@ccclass
export default class ItemSpiritProp extends cc.Component {

    @property(cc.Label) attrName: cc.Label = null;
    @property(cc.Label) attrVal: cc.Label = null;
    @property(cc.Node) iconNew: cc.Node = null;
    @property(cc.Toggle) checkBox: cc.Toggle = null;
    @property(cc.ProgressBar) progressBar: cc.ProgressBar = null;

    private _isChecked = false;

    set isChecked(val: boolean){
        this._isChecked = val; 
        this.checkBox.isChecked = this._isChecked;
    }
    /**
     * @desc 初始化铸魂属性Item
     * @param attr 铸魂信息
     * @param hideToggle 隐藏选择框
     */
    init(attr: EquipAttr, hideToggle?: boolean) {
        let cfg = configUtils.getEquipCastSoulConfig(attr.attributeId);
        let attrCfg = configUtils.getAttributeConfig(cfg.EquipCastSoulPropertyId);
        let section = cfg.EquipCastSoulMaxRange.split("|").map((str)=>{return parseInt(str)});
        this.attrName.string = attrCfg.Name;
        this.attrVal.string = attrCfg && attrCfg.AttributeValueType == 2 ? `+${attr.value*100/FULL_PERCENT}%` : `+${attr.value}`
        this.progressBar.progress = attr.value && section[1] ? attr.value/section[1] : 0;
        this.iconNew.active = attr.new;
        this.checkBox.isChecked = this._isChecked;
        this.checkBox.node.active = !hideToggle;
        this.node.getComponent(cc.Button).interactable = !hideToggle;
    }
}
