import { CustomDialogId } from "../../../app/AppConst";
import { GuildPositionType } from "../../../app/AppEnums";
import { configUtils } from "../../../app/ConfigUtils";
import List from "../../../common/components/List";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { eventCenter } from "../../../common/event/EventCenter";
import { guildEvent } from "../../../common/event/EventData";
import guiManager from "../../../common/GUIManager";
import { cfg } from "../../../config/config";
import { data } from "../../../network/lib/protocol";
import { guildData } from "../../models/GuildData";
import { guildOpt } from "../../operations/GuildOpt";
import ItemMemberList from "./ItemMemberList";

const {ccclass, property} = cc._decorator;

@ccclass
export default class GuildMemberListView extends ViewBaseComponent {
    @property(cc.Node) optMemberNode: cc.Node = null;
    @property(cc.Node) appointBtn: cc.Node = null;
    @property(cc.Label) appointCountLB: cc.Label = null;
    @property(cc.Node) unAppointBtn: cc.Node = null;
    @property(cc.Label) unAppointCountLB: cc.Label = null;
    @property(cc.Node) kickOutBtn: cc.Node = null;
    @property(List) membersList: List = null;
    @property(cc.Label) membersCountLb: cc.Label = null;
    @property(cc.Label) operationBtnTips: cc.Label = null;

    private _curSelectIndex: number = -1;
    private _memberList: data.IFactionMember[] = [];
    onInit() {
        this.doInit();
        this.optMemberNode.active = false;
        this._preGetData();
        this._refreshList();
        this._refreshView();
    }

    doInit() {
        eventCenter.register(guildEvent.CHANGE_MEMBER_LIST, this, this._recvChangeMemberList);
        eventCenter.register(guildEvent.FIRE_OUT_GUILD, this, this.closeView);
        eventCenter.register(guildEvent.DISBAND_GUILD, this, this.closeView);
    }

    onRelease() {
        this.membersList._deInit();
        eventCenter.unregisterAll(this);
    }

    private _preGetData() {
        this._memberList = guildData.memberList;
    }

    private _refreshList() {
        this.membersList.numItems = this._memberList.length;
    }

    private _refreshView() {
        let myInfo = guildData.myGuildSelfInfo;
        let myPosition = guildData.getMemberTypeByUid(myInfo.UserID);
        this.operationBtnTips.string = data.FACTION_MEMBER_TYPE.PRESIDENT == myPosition ? '解散公会' : '退出公会';
        this.membersCountLb.string = `公会成员: ${this._memberList.length}/${this._getGuildMemberMax()}`;
    }

    private _refreshOptMemberView() {
        let myInfo = guildData.myGuildSelfInfo;
        let memberInfo = this._memberList[this._curSelectIndex];
        if(!memberInfo || myInfo.UserID == memberInfo.UserID) {
            this.optMemberNode.active = false;
            return;
        }
        let myPosition = guildData.getMemberTypeByUid(myInfo.UserID);
        let memberPosition = guildData.getMemberTypeByUid(memberInfo.UserID);
        if(data.FACTION_MEMBER_TYPE.CIVILIAN == myPosition) {
            // 普通成员
            // TODO 有可能会加查看详情
            if (myInfo.UserID == memberInfo.UserID) {
                guiManager.showDialogTips(CustomDialogId.GUILD_OPREATE_NO_SELF);
            } else {
                guiManager.showDialogTips(CustomDialogId.GUILD_OPREATE_NO_AUTH);
            }
            this.optMemberNode.active = false;
            return;
        } else {
            if (myInfo.UserID == memberInfo.UserID) {
                guiManager.showDialogTips(CustomDialogId.GUILD_OPREATE_NO_SELF);
                this.optMemberNode.active = false;
                return;
            } else {
                if(myPosition < memberPosition) {
                    this.optMemberNode.active = true;
                } else {
                    guiManager.showDialogTips(CustomDialogId.GUILD_OPREATE_NO_AUTH);
                    this.optMemberNode.active = false;
                    return;
                }
            }
        }

        this.appointBtn.active = myPosition == data.FACTION_MEMBER_TYPE.PRESIDENT && memberPosition == data.FACTION_MEMBER_TYPE.CIVILIAN;
        this.unAppointBtn.active =  myPosition == data.FACTION_MEMBER_TYPE.PRESIDENT && memberPosition == data.FACTION_MEMBER_TYPE.VICE_PRESIDENT;
        this.kickOutBtn.active = myPosition < memberPosition;
        let appointInfo = this._getAppointInfo();
        if(this.appointBtn.active) {
            this.appointCountLB.string = `(${appointInfo.cur}/${appointInfo.max})`;
        } else {
            this.unAppointCountLB.string = `(${appointInfo.cur}/${appointInfo.max})`;
        }
    }

    onMemberItemRenderEvent(item: cc.Node, index: number) {
        item.getComponent(ItemMemberList).setData(this._memberList[index]);
    }

    onMemberItemClick(item: cc.Node, index: number, lastIndex: number) {
        this._curSelectIndex = index
        this._refreshOptMemberView();
    }

    onClickAppoint() {
        let appointInfo = this._getAppointInfo();
        if(appointInfo.cur >= appointInfo.max) {
            guiManager.showDialogTips(CustomDialogId.GUILD_APPLY_LIMIT);
        } else {
            let curInfo = this._memberList[this._curSelectIndex];
            guildOpt.sendChangePosition(curInfo.UserID, GuildPositionType.VICE_CHAIRMAN);
        }
    }

    onClickUnAppoint() {
        let curInfo = this._memberList[this._curSelectIndex];
        guildOpt.sendChangePosition(curInfo.UserID, GuildPositionType.NORMAL_MEMBER);
    }

    onClickExitGuild() {
        let myInfo = guildData.myGuildSelfInfo;
        let myPosition = guildData.getMemberTypeByUid(myInfo.UserID);
        if(data.FACTION_MEMBER_TYPE.PRESIDENT == myPosition) {
            guiManager.showMessageBox(this.node, {
                titleStr: '解散公会',
                content: configUtils.getDialogCfgByDialogId(CustomDialogId.GUILD_DISBAND).DialogText,
                leftStr: '取消',
                rightStr: '确定',
                rightCallback: () => {
                    guildOpt.sendExit();
                }
            });
        } else {
            guiManager.showMessageBox(this.node, {
                titleStr: '退出公会',
                content: '确定退出公会？',
                leftStr: '取消',
                rightStr: '确定',
                rightCallback: () => {
                    guildOpt.sendExit();
                }
            });
        }
    }

    onClickKickOut() {
        let curInfo = this._memberList[this._curSelectIndex];
        this.loadSubView('GuildKickOutView', curInfo);
    }

    private _recvChangeMemberList() {
        this._curSelectIndex = -1;
        this._preGetData();
        this._refreshList();
        this._refreshOptMemberView();
    }

    private _getRoleLimit(position: number): cfg.GuildRole {
        let cfg = configUtils.getGuildRoleCfg(position);
        return cfg;
    }

    private _getAppointInfo() {
        let curViceChairmanCount: number = this._memberList.filter(_m => {
            return guildData.guildInfo.Sundry.VicePresidentUserIDList.indexOf(_m.UserID) > -1;
        }).length;
        let guildLevelCfg = configUtils.getGuildLevelCfg(guildData.lv);
        return {
            cur: curViceChairmanCount,
            max: guildLevelCfg.GuildLevelLeaderNum
        }
    }

    private _getGuildMemberMax(): number {
        const lv = guildData.lv;
        let cfg = configUtils.getGuildLevelCfg(lv);
        return cfg.GuildLevelPeopleNum;
    }
}
