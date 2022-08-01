import { RES_ICON_PRE_URL } from "../../../../app/AppConst";
import { bagDataUtils } from "../../../../app/BagDataUtils";
import { configUtils } from "../../../../app/ConfigUtils";
import { SpriteLoader } from "../../../../common/ui-helper/SpriteLoader";
import { data } from "../../../../network/lib/protocol";
import { userData } from "../../../models/UserData";

const {ccclass, property} = cc._decorator;

@ccclass
export default class ItemPVEXinMoFaXiangRank extends cc.Component {
    @property(cc.Node) bgImg: cc.Node = null;
    @property(cc.Node) bgSelfImg: cc.Node = null;
    @property(cc.Sprite) rankImg: cc.Sprite = null;
    @property(cc.Label) rankNo: cc.Label = null;
    @property(cc.Label) nameLb: cc.Label = null;
    @property(cc.Label) damageLb: cc.Label = null;
    @property(cc.Label) lvLb: cc.Label = null;
    @property(cc.Sprite) headSp: cc.Sprite = null;
    @property(cc.Sprite) headFrameSp: cc.Sprite = null;
    @property([cc.SpriteFrame]) rankNoBgSps: cc.SpriteFrame[] = [];

    private _spLoader: SpriteLoader = null;
    private _rankIdx: number = 0;
    private _userInfo: data.IRankUser = null;
    private _damage: number = 0;

    init(no: number, userInfo: data.IRankUser, damage: number) {
        this._rankIdx = no;
        this._userInfo = userInfo;
        this._damage = damage;
        this._spLoader = this._spLoader || new SpriteLoader();
        this._initUI();
    }

    deInit() {
        this.rankImg.spriteFrame = null;
        this._spLoader && this._spLoader.release();
        this._userInfo = null;
    }

    private _initUI() {
        if(this._rankIdx >= 0 && this._rankIdx < 3) {
            this.rankImg.node.active = true;
            this.rankImg.spriteFrame = this.rankNoBgSps[this._rankIdx];
            this.rankNo.node.active = false;
        } else {
            this.rankImg.node.active = false;
            this.rankNo.node.active = true;
            this.rankNo.string =  (this._rankIdx < 0) ? '未\n上\n榜' : `${this._rankIdx + 1}`;
        }
        this.lvLb.string = `${bagDataUtils.getUserLVByExp(this._userInfo.Exp || 0)}`;
        this.nameLb.string = this._userInfo ? this._userInfo.Name : '';
        this.damageLb.string = `累计伤害：${this._damage}`;
        let isSelf = this._userInfo.UserID == userData.uId;
        this.bgImg.active = !isSelf;
        this.bgSelfImg.active = isSelf;
        if(this._userInfo.HeadID) {
            let headUrl = `${RES_ICON_PRE_URL.HEAD_IMG}/` + configUtils.getHeadConfig(this._userInfo.HeadID).HeadFrameImage;
            this._spLoader.changeSprite(this.headSp, headUrl);
        }

        if(this._userInfo.HeadFrameID) {
            let frameUrl = `${RES_ICON_PRE_URL.HEAD_FRAME}/` + configUtils.getHeadConfig(this._userInfo.HeadFrameID).HeadFrameImage;
            this._spLoader.changeSprite(this.headFrameSp, frameUrl);
        }
    }
}
