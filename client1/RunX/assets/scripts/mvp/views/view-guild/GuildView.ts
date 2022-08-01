import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { eventCenter } from "../../../common/event/EventCenter";
import { guildEvent } from "../../../common/event/EventData";
import guiManager from "../../../common/GUIManager";
import {scheduleManager} from "../../../common/ScheduleManager";
import { gamesvr } from "../../../network/lib/protocol";
import { guildData } from "../../models/GuildData";
import { guildOpt } from "../../operations/GuildOpt";
import GuildInfoView from "./GuildInfoView";
import GuildListView from "./GuildListView";
import GuildMainView from "./GuildMainView";

const enum View_Type {
    List,
    Main
}

const {ccclass, property} = cc._decorator;

@ccclass
export default class GuildView extends ViewBaseComponent {
    @property(GuildListView) guildListView: GuildListView = null;
    @property(GuildMainView) guildMainView: GuildMainView = null;
    @property(GuildInfoView) guildInfoView: GuildInfoView = null;

    private _viewType: View_Type = null;
    private _isLoaded: boolean = false;
    private _firstEnterSid: number = 0;

    preInit(...rest: any[]): Promise<any> {
        this.doInit();
        return new Promise((resolve, reject) => {
            let guidInfo = guildData.guildInfo;
            this._firstEnterSid = scheduleManager.schedule(() => {
                if(!this._isLoaded) return;
                scheduleManager.unschedule(this._firstEnterSid);
                eventCenter.unregister(guildEvent.UPDATE_GUILDS_LIST, this);
                resolve(true);
            }, 0);
            if(guidInfo) {
                guildOpt.sendGetGuildInfo();
            } else {
                guildOpt.sendRecommendGuildsList();
            }
        });
    }

    onInit(moduleId: number) {
        guiManager.addCoinNode(this.node, moduleId);
        let guidInfo = guildData.guildInfo;
        if(guidInfo) {
            this._showGuildMainView();
        } else {
            this._showGuildListView();
        }
    }

    doInit() {
        eventCenter.register(guildEvent.UPDATE_GUILD_INFO, this, this._showGuildMainView);
        eventCenter.register(guildEvent.CREATE_GUILD, this, this._recvCreateGuildSuc);
        eventCenter.register(guildEvent.FIRE_OUT_GUILD, this, this.closeView);
        eventCenter.register(guildEvent.DISBAND_GUILD, this, this.closeView);
        //公会列表事件， 首次获取之后注销
        eventCenter.register(guildEvent.UPDATE_GUILDS_LIST, this, this._refreshGuildListView);
    }

    onRelease() {
        guiManager.removeCoinNode(this.node);
        eventCenter.unregisterAll(this);
        this.guildInfoView.onRelease();
        this.guildListView.onRelease();
        this.guildMainView.onRelease();
        this.releaseSubView();
        this._isLoaded = false;
        this._firstEnterSid && scheduleManager.unschedule(this._firstEnterSid);
        this._firstEnterSid = 0;
    }

    private _refreshGuildListView(){
        if(!this._isLoaded){
            this._isLoaded = true;
            return;
        }
    }

    private _showGuildMainView() {
        if(!this._isLoaded){
            this._isLoaded = true;
            return;
        }

        this.guildListView.onRelease();
        if(View_Type.Main != this._viewType) {
            this._viewType = View_Type.Main;
            this._switchView();
            this.guildMainView.onInit(this);
            this._refreshGuildInfoView();
        }
    }

    private _showGuildListView() {
        this.guildMainView.onRelease();
        if(View_Type.List != this._viewType) {
            this._viewType = View_Type.List;
            this._switchView();
        }
        this.guildListView.onInit(this, this._refreshGuildInfoView.bind(this));
    }

    private _refreshGuildInfoView(guildInfo: gamesvr.FactionSearchInfo = null) {
        this.guildInfoView.onInit(this.loadSubView.bind(this), guildInfo);
    }

    private _switchView() {
        this.guildListView.node.active = View_Type.List == this._viewType;
        this.guildMainView.node.active = View_Type.Main == this._viewType;
    }

    private _recvCreateGuildSuc() {
        guiManager.showTips(`公会创建成功`);
        this._showGuildMainView();
    }

    loadGuildSubView(name: string, ...args: any[]) {
        this.loadSubView(name, ...args);
    }

    loadGuildWar() {
        guiManager.loadView('GuildWarView',guiManager.sceneNode);
    }
}
