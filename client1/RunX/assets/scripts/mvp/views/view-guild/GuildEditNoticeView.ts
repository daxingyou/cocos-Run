import { CustomDialogId } from "../../../app/AppConst";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { eventCenter } from "../../../common/event/EventCenter";
import { guildEvent } from "../../../common/event/EventData";
import guiManager from "../../../common/GUIManager";
import { data } from "../../../network/lib/protocol";
import { guildData } from "../../models/GuildData";
import { guildOpt } from "../../operations/GuildOpt";

const {ccclass, property} = cc._decorator;

@ccclass
export default class GuildEditNoticeView extends ViewBaseComponent {
    @property(cc.EditBox) noticeEditBox: cc.EditBox = null;
    @property(cc.Label) noticeContentCount: cc.Label = null;

    private _guildInfo: data.IFaction = null;
    onInit() {
        eventCenter.register(guildEvent.CHANGE_NOTICE, this, this.closeView);
        this._guildInfo = guildData.guildInfo;
        this.noticeEditBox.string = this._guildInfo.Sundry.BulletinText || '';
        this.updateNoticeLabelCount();
    }

    onRelease() {
        eventCenter.unregisterAll(this);
    }

    onClickConfirm() {
        if(this._checkNoticeLegality()) {
            guildOpt.sendChangeNotice(this._guildInfo.Account.ID, this.noticeEditBox.string);
        } else {
            guiManager.showDialogTips(CustomDialogId.GUILD_INPUT_INVALID);
        }
    }

    updateNoticeLabelCount() {
        this.noticeContentCount.string = `（${this.noticeEditBox.textLabel.string.length}/200）`;
    }

    private _checkNoticeLegality(): boolean {
        if(this.noticeEditBox.string != '' && this.noticeEditBox.string != this._guildInfo.Sundry.BulletinText) {
            return true;
        }
        return false;
    }
}
