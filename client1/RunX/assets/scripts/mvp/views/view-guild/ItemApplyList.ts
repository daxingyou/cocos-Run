import { RES_ICON_PRE_URL } from "../../../app/AppConst";
import { utils } from "../../../app/AppUtils";
import { configUtils } from "../../../app/ConfigUtils";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { data } from "../../../network/lib/protocol";
import { guildData } from "../../models/GuildData";
import { guildOpt } from "../../operations/GuildOpt";

const {ccclass, property} = cc._decorator;

@ccclass
export default class ItemApplyList extends cc.Component {
    @property(cc.Sprite) headSp: cc.Sprite = null;
    @property(cc.Sprite) headFrame: cc.Sprite = null;
    @property(cc.Node) rejectBtn: cc.Node = null;
    @property(cc.Node) confirmBtn: cc.Node = null;
    @property(cc.Label) lvLB: cc.Label = null;
    @property(cc.Label) nameLB: cc.Label = null;
    @property(cc.Label) combatLB: cc.Label = null;
    @property(cc.Node) rejectTips: cc.Node = null;

    private _info: data.IFactionMember = null;
    private _spriteLoader: SpriteLoader = new SpriteLoader();
    onInit() {

    }

    deInit() {
        this._spriteLoader.release();
    }

    unuse() {
        this.deInit();
    }

    reuse() {

    }

    setData(info: data.IFactionMember) {
        this._info = info;
        this._refreshView();
    }

    private _refreshView() {
        let isReject: boolean = guildData.rejectList.indexOf(this._info.UserID) > -1;
        this.confirmBtn.active = !isReject;
        this.rejectBtn.active = !isReject;
        this.rejectTips.active = isReject;

        this.lvLB.string = this._getUserLv(this._info.Exp) + '';
        this.nameLB.string = this._info.Name;
        this.combatLB.string = this._info.Power;
        // 更换英雄头像
        let headUrl = `${RES_ICON_PRE_URL.HEAD_IMG}/` + configUtils.getHeadConfig(this._info.HeadID).HeadFrameImage;
        let frameUrl = `${RES_ICON_PRE_URL.HEAD_FRAME}/` + configUtils.getHeadConfig(this._info.HeadFrameID).HeadFrameImage;
        this._spriteLoader.changeSpriteP(this.headSp, headUrl);
        this._spriteLoader.changeSpriteP(this.headFrame, frameUrl);
    }

    onClickReject() {
        let guildInfo = guildData.guildInfo;
        guildOpt.sendChangeApplyState(guildInfo.Account.ID, this._info.UserID, false);
    }

    onClickConfirm() {
        let guildInfo = guildData.guildInfo;
        guildOpt.sendChangeApplyState(guildInfo.Account.ID, this._info.UserID, true);
    }

    private _getUserLv(exp: number): number {
        let expConfigs = configUtils.getLevelExpConfigsByType(3);
        if (exp) {
            let expCount: number = 0;
            for (const k in expConfigs) {
                expCount += expConfigs[k].LevelExpNeedNum;
                if (exp < expCount) {
                    return Number(k);
                }
            }
            return utils.getUserMaxLv();
        } else {
           return 1;
        }
    }
}
