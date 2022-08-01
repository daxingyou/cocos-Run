import { resPathUtils } from "../../../app/ResPathUrlUtils";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";

const { ccclass, property } = cc._decorator;

@ccclass export default class ItemSignInPrize extends cc.Component {
    @property(cc.Sprite)      prizeIcon: cc.Sprite = null;
    @property(cc.Node)        ndToken: cc.Node = null;
    @property(cc.Label)       lbCnt: cc.Label = null;


    private _sprLoader = new SpriteLoader();
    private _clickHandler: Function = null
    private _itemID: number = 0;
    private _count: number = 0

    onInit (icon: number, count: number, clickHandler: Function) {
        this._itemID = icon;
        this._count = count;
        this._clickHandler = clickHandler;

        this.ndToken.active = false;
        this.lbCnt.string = `x${count}`;
        this._sprLoader.changeSprite(this.prizeIcon, resPathUtils.getItemIconPath(icon))
    }

    set takon (v: boolean) {
        this.ndToken.active = v;
    }

    deInit () {
        this._sprLoader.release()
    }

    onClickItem () {
        if (this._itemID && this._clickHandler) {
            this._clickHandler(this._itemID, this._count)
        }
    }

}