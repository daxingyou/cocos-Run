import { RES_ICON_PRE_URL } from "../../../app/AppConst";
import { configUtils } from "../../../app/ConfigUtils";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { data } from "../../../network/lib/protocol";

const { ccclass, property } = cc._decorator;

@ccclass
export default class ItemBlackList extends cc.Component {
    @property(cc.Label) lbName: cc.Label = null;
    @property(cc.Sprite) spHead: cc.Sprite = null;
    @property(cc.Sprite) spHeadFrame: cc.Sprite = null;

    private _clickHandler: Function = null;
    private _user: data.IOtherData = null;
    private _spriteLoader: SpriteLoader = new SpriteLoader();
    
    init (v: data.IOtherData, clickHandler: Function) {
        this._user = v;
        this._clickHandler = clickHandler;

        this._updateView();
    }

    unuse () {
        this._spriteLoader.release();
    }

    private _updateView () {
        let cfg = this._user
        this.lbName.string = cfg.Name;
        let headUrl = `${RES_ICON_PRE_URL.HEAD_IMG}/` + configUtils.getHeadConfig(cfg.HeadID).HeadFrameImage;
        let frameUrl = `${RES_ICON_PRE_URL.HEAD_FRAME}/` + configUtils.getHeadConfig(cfg.HeadFrameID).HeadFrameImage;

        this._spriteLoader.changeSprite(this.spHead, headUrl);
        this._spriteLoader.changeSprite(this.spHeadFrame, frameUrl);
    }

    onClickItem () {
        this._clickHandler && this._clickHandler(this._user.UserID);
    }

}