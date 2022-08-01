import { RES_ICON_PRE_URL } from "../../../app/AppConst";
import { utils } from "../../../app/AppUtils";
import { configUtils } from "../../../app/ConfigUtils";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { data } from "../../../network/lib/protocol";

const {ccclass, property} = cc._decorator;

@ccclass
export default class ItemRankUser extends cc.Component {

    @property(cc.Label) rankIdxLb: cc.Label = null;
    @property(cc.Sprite) headSp: cc.Sprite = null;
    @property(cc.Sprite) headFrameSp: cc.Sprite = null;
    @property(cc.Label) userName: cc.Label = null;
    @property(cc.Label) time: cc.Label = null;

    private _spLoader: SpriteLoader = new SpriteLoader();

    init(idx: number, user: data.IEpochRewardReachUser, userInfo: data.IUniversalViewOtherData) {
        this.rankIdxLb.string = idx + '';
        this.userName.string = userInfo.Name || '';
        this.time.string = utils.getFormatTime(utils.longToNumber(user.Time));
        let headUrl = `${RES_ICON_PRE_URL.HEAD_IMG}/` + configUtils.getHeadConfig(userInfo.HeadID).HeadFrameImage;
        let frameUrl = `${RES_ICON_PRE_URL.HEAD_FRAME}/` + configUtils.getHeadConfig(userInfo.HeadFrameID).HeadFrameImage;
        this._spLoader.changeSprite(this.headSp, headUrl);
        this._spLoader.changeSprite(this.headFrameSp, frameUrl);
    }

    deInit() {
        this._spLoader.release();
    }

    reuse(...rest: any[]) {

    }

    unuse() {
        this.deInit();
    }
}
