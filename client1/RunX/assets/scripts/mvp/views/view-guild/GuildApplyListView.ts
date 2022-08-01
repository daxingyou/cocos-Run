import { CustomDialogId } from "../../../app/AppConst";
import { utils } from "../../../app/AppUtils";
import { configUtils } from "../../../app/ConfigUtils";
import List from "../../../common/components/List";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { eventCenter } from "../../../common/event/EventCenter";
import { guildEvent } from "../../../common/event/EventData";
import guiManager from "../../../common/GUIManager";
import { redDotMgr, RED_DOT_MODULE } from "../../../common/RedDotManager";
import { cfg } from "../../../config/config";
import { data, gamesvr } from "../../../network/lib/protocol";
import { guildData } from "../../models/GuildData";
import { guildOpt } from "../../operations/GuildOpt";
import ItemApplyList from "./ItemApplyList";
import Menu from "./Menu";

const {ccclass, property} = cc._decorator;

@ccclass
export default class GuildApplyListView extends ViewBaseComponent {
    @property(cc.Node) closeApplyChecked: cc.Node = null;
    @property(cc.Node) autoApproveChecked: cc.Node = null;
    @property(List) applyList: List = null;
    @property(Menu) minLvMenu: Menu = null;

    private _applyList: data.IFactionMember[] = [];
    private _menuList: number[] = [];
    onInit() {
        this.doInit();
        this._refreshRedDot();        
        this._refreshList();
        this._refreshCommonView();
    }

    doInit() {
        eventCenter.register(guildEvent.CHANGE_CLOSE_APPLY, this, this._changeCloseApply);
        eventCenter.register(guildEvent.CHANGE_AUTO_APPROVE, this, this._changeAutoApprove);
        eventCenter.register(guildEvent.CHANGE_MIN_LV, this, this._changeMinLv);
        eventCenter.register(guildEvent.CHANGE_APPLY_LIST, this, this._refreshList);
    }

    onRelease() {
        this.minLvMenu.deInit();
        this.applyList._deInit();
        eventCenter.unregisterAll(this);
    }

    private _refreshRedDot() {
        // 需要清除公会的有新申请的记录
        guildData.clearNewApplyState();
        redDotMgr.fire(RED_DOT_MODULE.GUILD_NEW_APPLY);
    }

    private _refreshCommonView() {
        let labels = this.node.getChildByName('labels');
        let closeApplyCloseTips = labels.getChildByName('closeApply'),
            autoApproveTips = labels.getChildByName('autoApprove');

        let myMemberTyppe = guildData.getMemberTypeByUid(guildData.myGuildSelfInfo.UserID);
        let limitCfg = this._getRoleLimit(myMemberTyppe);
        this.closeApplyChecked.parent.active = !!limitCfg.GuildRoleAddPeople;
        closeApplyCloseTips.active = !!limitCfg.GuildRoleAddPeople;
        this.autoApproveChecked.parent.active = !!limitCfg.GuildRoleAddPeople;
        autoApproveTips.active = !!limitCfg.GuildRoleAddPeople;

        this.closeApplyChecked.active = !guildData.guildInfo.Sundry.IsApply;
        this.autoApproveChecked.active = guildData.guildInfo.Sundry.IsAutoAccept;

        if(!!limitCfg.GuildRoleAddPeople) {
            this._refreshMinLvMenu();
        } else {
            this.minLvMenu.node.active = false;
        }
    }

    private _refreshList() {
        this._applyList = guildData.applyList;
        this.applyList.numItems = this._applyList.length;
    }

    onApplyListRenderEvent(item: cc.Node, index: number) {
        item.getComponent(ItemApplyList).setData(this._applyList[index]);
    }

    private _refreshMinLvMenu() {
        for(let i = 0; i < utils.getUserMaxLv(); ++i) {
            this._menuList.push((i + 1));
        }
        this.minLvMenu.setData(this._menuList, this.onMinLvSelected.bind(this));
        let minLv = guildData.guildInfo.Sundry.AutoAcceptLevel || 1;
        let index = this._menuList.indexOf(minLv);
        this.minLvMenu.setCurSelect(index);
    }

    private _changeCloseApply(eventId: number, state: boolean) {
        this.closeApplyChecked.active = !state;
    }

    private _changeAutoApprove(eventId: number, Msg: gamesvr.FactionSetAutoAcceptRes) {
        this.autoApproveChecked.active = Msg.IsAutoAccept;
        this._changeMinLv(null, Msg.AutoAcceptLevel ? Msg.AutoAcceptLevel : 1);
    }

    private _changeMinLv(eventId: number, minLv: number) {
        let index = this._menuList.indexOf(minLv);
        this.minLvMenu.setCurSelect(index);
    }

    onClickCloseApply() {
        let closeState = !guildData.guildInfo.Sundry.IsApply;
        guildOpt.sendChangeCloseApply(closeState);
    }

    onClickAutoApprove() {
        let autoState = !guildData.guildInfo.Sundry.IsAutoAccept;
        guildOpt.sendChangeAutoApprove(autoState, guildData.guildInfo.Sundry.AutoAcceptLevel);
    }

    onMinLvSelected(index: number) {
        let minLv = this._menuList[index];
        if(minLv != guildData.guildInfo.Sundry.AutoAcceptLevel) {
            guildOpt.sendChangeAutoApprove(guildData.guildInfo.Sundry.IsAutoAccept, minLv);
        } else {
            this._changeMinLv(null, minLv);
        }
    }

    onClickAllReject() {
        let trueApplyList: string[] = [];
        this._applyList.forEach(_c => {
            if(guildData.rejectList.indexOf(_c.UserID) <= -1) {
                trueApplyList.push(_c.UserID);
            }
        });
        if(trueApplyList.length > 0) {
            guildOpt.sendChangeAllApplyState(false);
        } else {
            guiManager.showDialogTips(CustomDialogId.GUILD_NO_APPLYMENT);
        }
    }

    onClickAllConfirm() {
        let trueApplyList: string[] = [];
        this._applyList.forEach(_c => {
            if(guildData.rejectList.indexOf(_c.UserID) <= -1) {
                trueApplyList.push(_c.UserID);
            }
        });
        if(trueApplyList.length > 0) {
            guildOpt.sendChangeAllApplyState(true);
        } else {
            guiManager.showDialogTips(CustomDialogId.GUILD_NO_APPLYMENT);
        }
    }

    private _getRoleLimit(position: number): cfg.GuildRole {
        let cfg = configUtils.getGuildRoleCfg(position);
        return cfg;
    }
}
