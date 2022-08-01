import { RES_ICON_PRE_URL } from "../../../app/AppConst";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { cfg } from "../../../config/config";

const { ccclass, property } = cc._decorator;
@ccclass export default class ItemBubble extends cc.Component {
    @property(cc.Label)     lbDesc: cc.Label = null;
    @property(cc.Sprite)    sprIcon: cc.Sprite = null;
    @property(cc.Node)      ndSelect: cc.Node = null;
    
    private _cfg: cfg.ChatBubble = null
    private _spLoader: SpriteLoader = new SpriteLoader();
    private _clickHandler: Function = null

    setSelect (v: boolean) {
        this.ndSelect.active = v
    }

    get bubbleID () {
        return this._cfg.ChatBubbleId
    }

    init (cfg: cfg.ChatBubble, handler: Function) {
        if (!cfg) return;

        this._clickHandler = handler;
        this._cfg = cfg
        this.lbDesc.string = cfg.ChatBubbleName;
        let imgUrl = `${RES_ICON_PRE_URL.CHAT_BUBBLE}/${cfg.ChatBubbleLeft}`;
        this._spLoader.changeSprite(this.sprIcon, imgUrl);
    }

    deInit () {
        this._spLoader.release();
    }

    onClick () {
        this._clickHandler && this._clickHandler(this._cfg)
    }
}