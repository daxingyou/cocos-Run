import { Channel_Max_Num } from "../../../app/AppConst";
import { utils } from "../../../app/AppUtils";
import { configUtils } from "../../../app/ConfigUtils";
import List from "../../../common/components/List";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { eventCenter } from "../../../common/event/EventCenter";
import { cfg } from "../../../config/config";
import { svrConfig } from "../../../network/SvrConfig";
import ItemBigChannel from "./ItemBigChannel";
import ItemChannel from "./ItemChannel";

const { ccclass, property } = cc._decorator;

const enum CHANNEL_TYPE {
    RECOMMEND,
    NORMAL
}

@ccclass
export default class ChannelView extends ViewBaseComponent {
    @property(List)                                                    bigChannelList: List = null;
    @property(List)                                                    smamllChannelList: List = null;
    @property({ type: cc.Node, tooltip: '已有角色区域' })               HasRoleParent: cc.Node = null;
    @property({ type: cc.Prefab, tooltip: '已有角色PrefabItem' })       HasRoleItem: cc.Prefab = null;

    private _curSelectBigChannel: number = 0;
    private _servers: cfg.Game[] = [];
    private _smallServers: cfg.Game[] = [];
    private _selectCallback: (svrId: number) => void = null;

    onInit(selectCallback: (svrId: number) => void) {
        this._selectCallback = selectCallback;
        this._servers = this._getChannelServers();
        this.refreshView();
    }

    onRelease() {
        eventCenter.unregisterAll(this);
        this._curSelectBigChannel = 0;
        this.bigChannelList._deInit();
        this.smamllChannelList._deInit();
    }

    refreshView() {
        this.refreshBigChannelView();
    }

    refreshBigChannelView() {
        this.bigChannelList.numItems = Math.ceil(this._servers.length / Channel_Max_Num) + 1;
        this.bigChannelList.selectedId = 0;
    }

    onBigChannelRender(item: cc.Node, index: number) {
        item.getComponent(ItemBigChannel).setData(index);
    }

    onBigChannelSelected(item: cc.Node, index: number, lastIndex: number) {
        this._curSelectBigChannel = index;
        this.refreshSmallChannelView();
    }

    refreshSmallChannelView() {
        this._smallServers = this._getSmallChannelServers();
        this.smamllChannelList.numItems = this._smallServers.length;
        this.smamllChannelList.node.getComponent(cc.ScrollView).scrollToTop(0.1);
    }

    onSmallChannelRender(item: cc.Node, index: number) {
        let data = this._smallServers[index];
        let callFunc = (srvId: number) => {
            this._selectCallback && this._selectCallback(srvId);
            this.closeView();
        }
        item.getComponent(ItemChannel).setData({
            id: data.ServerID,
            name: data.ServerName
        }, callFunc);
    }

    refreshHasRoleView() {
        // TODO 刷新已有角色信息
    }

    private _getChannelServers() {
        let configs = configUtils.getGameSvrList(svrConfig.worldTag);
        return configs;
    }

    private _getSmallChannelServers() {
        if(CHANNEL_TYPE.RECOMMEND == this._curSelectBigChannel) {
            return this._getRecommendServer();    
        } else {
            let start = (this._curSelectBigChannel - 1) * Channel_Max_Num;
            return this._servers.slice(start, start + Channel_Max_Num);
        }
    }

    private _getRecommendServer(): cfg.Game[] {
        let configs = configUtils.getGameSvrList(svrConfig.worldTag);
        let recommendServers: cfg.Game[] = [];
        if(configs && configs.length > 0) {
            let recommendServer = null;
            for(const k in configs) {
                if(svrConfig.fetchGamesvrs.find(_s => { return _s.GamesvrID == configs[k].ServerID; })) {
                    recommendServer = configs[k];
                }
            }
            recommendServers.push(recommendServer);
        }
        return recommendServers;
    }
}
