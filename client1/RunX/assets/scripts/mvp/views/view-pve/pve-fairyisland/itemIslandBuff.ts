import RichTextEx from "../../../../common/components/rich-text/RichTextEx";
import { configManager } from "../../../../common/ConfigManager";
import { cfg } from "../../../../config/config";

const {ccclass, property} = cc._decorator;
@ccclass
export default class ItemIslandBuff extends cc.Component {
    @property(RichTextEx) des: RichTextEx = null;
    @property(cc.Sprite) bg: cc.Sprite = null;
    @property(cc.Sprite) checkMark: cc.Sprite = null;
    
    private _toggle: cc.Toggle = null;
    /**获得buff || 展示buff */
    private _isGetBuff: boolean = false;

    onInit(buffID: number, start: boolean = false ,isGetBuff:boolean = false): void {
        if (!buffID) return;
        let buffCfg: cfg.PVEFairyIslandBuff = configManager.getConfigByKey('pveFairyIslandBuff', buffID);
        
        let des = buffCfg.PVEFairyIslandBuffIntroduce.split("+");

        this.des.string = `${des[0]} <color=#4FEE69>+${des[1]}</c>`
        
        this._toggle = this.node.getComponent(cc.Toggle);
        this._toggle.isChecked = false;
        if (start && this._toggle && isGetBuff) {
            this._toggle.isChecked = true;
        }
        this._isGetBuff = isGetBuff;
        this._toggle.enabled = this._isGetBuff;
        //在展示环节的时候
        if (!isGetBuff) {
            this.checkMark.node.active = false;
            this.bg.node.active = false;
        } 
    }

    itemClick() {
        if (!this._isGetBuff) return;
        if (!this._toggle) return;
        this._toggle.isChecked = !this._toggle.isChecked;
    }
}