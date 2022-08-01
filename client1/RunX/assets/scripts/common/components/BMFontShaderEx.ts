import { logger } from "../log/Logger";
import materialHelper from "../../shader/MaterialHelper";

const {ccclass, property, executeInEditMode, requireComponent, disallowMultiple} = cc._decorator;

@ccclass
@disallowMultiple
@requireComponent(cc.Label)
@executeInEditMode
export default class BMFontShaderEX extends cc.Component {

    @property _bold = false;
    @property
    get bold (): boolean {
        return this._bold;
    }
    set bold (v: boolean) {
        if (this._bold != v) {
            this._bold = v;
            this._updateBold();
        }
    }

    @property _enableOutline = false;
    @property
    get enableOutline (): boolean {
        return this._enableOutline;
    }
    set enableOutline (v: boolean) {
        if (this._enableOutline != v) {
            this._enableOutline = v;
            this._updateOutline();
        }
    }

    @property _outlineColor = cc.Color.BLACK;
    @property
    get outlineColor (): cc.Color {
        return this._outlineColor.clone();
    }
    set outlineColor (v: cc.Color) {
        if (!this._outlineColor.equals(v)) {
            this._outlineColor = v.clone();
            this._updateOutline();
        }
    }

    onLoad () {
        this._updateBold();
        this._updateOutline();
    }

    private _useSpecialMaterial () {
        const label = this.getComponent(cc.Label);
        if (!label) {
            logger.error('BMFontShaderEX', `You need a label Component first. node name = ${this.node.name}`);
        }

        let material = label.getMaterial(0);
        if (!material || material.name.indexOf('MaterialBMFontEX') == -1) {
            material = materialHelper.getMaterial('BMFontEX', label);
            if (material) {
                label.setMaterial(0, material);
            }
        }

        return material;
    }

    private _updateBold () {
        let material = this._useSpecialMaterial();
        // @ts-ignore
        material && material.setProperty('bold', this._bold ? 0.4 : 0.2);
    }

    private _updateOutline () {
        let material = this._useSpecialMaterial();
        // @ts-ignore
        material && material.setProperty('outline', this._enableOutline ? 1 : 0);
        // @ts-ignore
        material && material.setProperty('outlineColor', this._outlineColor);
    }
}