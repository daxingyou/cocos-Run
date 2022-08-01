import List from "../../../../common/components/List";
import { ViewBaseComponent } from "../../../../common/components/ViewBaseComponent";
import { eventCenter } from "../../../../common/event/EventCenter";
import { guildWarEvent } from "../../../../common/event/EventData";
import guiManager from "../../../../common/GUIManager";
import { logger } from "../../../../common/log/Logger";
import { data } from "../../../../network/lib/protocol";
import { guildData } from "../../../models/GuildData";
import MeshRendererCtrl from "../../view-hero/MeshRendererCtrl";
import { BUILD_OWNER, BUILD_STATE, CAMP_CFG } from "./GuildWarCommon";
import ItemGuildWarBuild from "./ItemGuildWarBuild";
import ItemGuildWarCampOpt from "./ItemGuildWarCampOpt";

const {ccclass, property} = cc._decorator;
@ccclass
export default class GuildWarCampOptView extends ViewBaseComponent {
    @property(List) memberList: List = null;
    @property(ItemGuildWarBuild) curBuild: ItemGuildWarBuild = null;
    @property(cc.Label) title: cc.Label = null;

    private _campCfg: CAMP_CFG = null;
    onInit(param:CAMP_CFG): void {
        
        this._campCfg = param;
        this._registerEvent();
        
        this.curBuild.onInit(param);
        this.curBuild.setOptBtnState(false);
        this.memberList.numItems = guildData?.memberList?.length || 0;
        this.title.string = `${param.Idx}号营地`;
    }

    /**页面释放清理*/
    onRelease() {
       eventCenter.unregisterAll(this);
    }

    /**页面来回跳转刷新*/
    onRefresh(): void {
        
    }

    /**放弃驻守*/
    abandonDefence() {
        if (this.curBuild.state == BUILD_STATE.EMPTY) {
            guiManager.showTips(`当前无驻守!`)
            return;
        }
        let param: CAMP_CFG = {
            OwnTag: BUILD_OWNER.SELF,
            BuildState: BUILD_STATE.EMPTY,
            Idx: -1,
        }
        this.curBuild.onInit(param,true);
    }

    private _refreshCurCamp(cmd: any, member: data.IFactionMember) {
        let param: CAMP_CFG = {
            OwnTag: BUILD_OWNER.SELF,
            BuildState: BUILD_STATE.DEFEND,
            Idx: this._campCfg.Idx,
        }
        this.curBuild.onInit(param,true);
    }

    onMemberRender(meber: cc.Node, idx: number) {
        let campOptCmp = meber.getComponent(ItemGuildWarCampOpt);
        campOptCmp.onInit(guildData?.memberList[idx]);
    }

    private _registerEvent() {
        eventCenter.register(guildWarEvent.CHOSE_GUILD_CAMP_OPT_RES, this, this._refreshCurCamp);
    }
}