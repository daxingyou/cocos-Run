import { CustomDialogId } from "../../../app/AppConst";
import { configUtils } from "../../../app/ConfigUtils";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import guiManager from "../../../common/GUIManager";
import { data } from "../../../network/lib/protocol";
import { guildOpt } from "../../operations/GuildOpt";
import ItemMemberList from "./ItemMemberList";

const {ccclass, property} = cc._decorator;

@ccclass
export default class GuildKickOutView extends ViewBaseComponent {
    @property(ItemMemberList) itemMemberList: ItemMemberList = null;
    @property([cc.Label]) reasonLabels: cc.Label[] = [];
    @property([cc.Toggle]) reasonToggles: cc.Toggle[] = [];

    private _info: data.IFactionMember = null;
    onInit(info: data.IFactionMember) {
        this._info = info;
        this._refreshView();
    }

    onRelease() {
        this.itemMemberList.deInit();
    }

    private _refreshView() {
        this.itemMemberList.setData(this._info);
        let guildDelPeopleText = configUtils.getConfigModule('GuildDelPeopleText');
        if(guildDelPeopleText) {
            let reasonList = guildDelPeopleText.split(';');
            for(let i = 0; i < this.reasonLabels.length; ++i) {
                let dialog = configUtils.getDialogCfgByDialogId(reasonList[i]);
                this.reasonLabels[i].string = dialog.DialogText;
            }
        }
    }

    onClickKickOut() {
        if(this.reasonToggles.filter(_t => {
            return _t.isChecked;
        }).length > 0) {
            let reasons: number[] = [];
            let reasonStrs: string[] = [];
            let guildDelPeopleText = configUtils.getConfigModule('GuildDelPeopleText');
            let reasonList = guildDelPeopleText.split(';');
            this.reasonToggles.forEach((_t, _index) => {
                if(_t.isChecked) {
                    let reasonID = parseInt(reasonList[_index]);
                    reasons.push(reasonID);
                    let dialogCfg = configUtils.getDialogCfgByDialogId(reasonID);
                    dialogCfg &&  reasonStrs.push(dialogCfg.DialogText);

                }
            });
            guildOpt.sendKickOut(this._info.UserID, reasons, reasonStrs);
            this.closeView();
        } else {
            guiManager.showDialogTips(CustomDialogId.GUILD_CHOOSE_REASON);
        }
    }
}
