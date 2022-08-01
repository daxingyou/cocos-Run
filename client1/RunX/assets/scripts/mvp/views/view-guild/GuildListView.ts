import { VIEW_NAME } from "../../../app/AppConst";
import { configUtils } from "../../../app/ConfigUtils";
import List from "../../../common/components/List";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { eventCenter } from "../../../common/event/EventCenter";
import { guildEvent } from "../../../common/event/EventData";
import guiManager from "../../../common/GUIManager";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { gamesvr } from "../../../network/lib/protocol";
import { guildData } from "../../models/GuildData";
import { guildOpt } from "../../operations/GuildOpt";
import GuildView from "./GuildView";
import ItemGuildList from "./ItemGuildList";

const {ccclass, property} = cc._decorator;

@ccclass
export default class GuildListView extends ViewBaseComponent {
    @property(List) guildsList: List = null;
    
    @property(cc.EditBox) findEdit: cc.EditBox = null;

    private _guildList: gamesvr.IFactionSearchInfo[] = [];
    private _clickHandle: Function = null;
    private _spriteLoader: SpriteLoader = new SpriteLoader();
    private _isLoaded: boolean = false;
    private _currSelect: ItemGuildList = null;
    private _root: GuildView = null;

    onInit(root: GuildView, clickHandle: Function) {
        this._root = root;
        clickHandle && (this._clickHandle = clickHandle);
        if(!this._isLoaded) {
            this.doInit();
            this._isLoaded = true;
        }
        this._refreshGuildListView();
    }

    doInit() {
        eventCenter.register(guildEvent.UPDATE_GUILDS_LIST, this, this._refreshGuildListView);
    }

    onRelease() {
        this._currSelect = null;
        this.guildsList._deInit()
        this._isLoaded = false;
        this._spriteLoader.release()
        this.releaseSubView()
        eventCenter.unregisterAll(this);
    }

    private _refreshGuildListView() {
        let guilds = guildData.recommendGuilds;
        if(guilds.length <= 0) {
            guiManager.showTips('暂无公会');
            this._clickHandle && this._clickHandle(null);
            return;
        }

        this.guildsList.node.active = true;
        this._guildList = guilds;
        this.guildsList.numItems = guilds.length;
        this.guildsList.selectedId = 0;
        this.scheduleOnce(() => {
            this.guildsList.scrollTo(0, 0);
        })
    }

    onListItemRenderEvent(item: cc.Node, index: number) {
        let data = this._guildList[index];
        item.getComponent(ItemGuildList).onInit(data as gamesvr.FactionSearchInfo);
    }

    onListItemSelect(item: cc.Node, selectId: number, lastSelectId: number) {
        if (this._currSelect) this._currSelect.setSelect(false)
        if (cc.isValid(item)) {
            this._currSelect = item.getComponent(ItemGuildList)
            this._currSelect.setSelect(true);
        }

        let curData = this._guildList[selectId];
        this._clickHandle && this._clickHandle(curData);
    }

    onClickCreateGuild() {
        this._loadSubView(VIEW_NAME.GUILD_CREATE_VIEW, this._loadSubView);
    }

    onClickQuickJoin() {
        guiManager.showTips(configUtils.getDialogCfgByDialogId(1000121).DialogText);
        let list: number[] = [];
        this._guildList.forEach(_g => {
            list.push(_g.FactionID);
        });
        guildOpt.sendQuickJoin(list);
    }

    onClickFind() {
        guildOpt.sendRecommendGuildsList(this.findEdit.string);
    }

    onClickGuildLevelProp() {
        // TODO 
    }

    onClickCloseView() {
        guildData.clearRecommendGuilds();
        if(this._clickHandle) {
            this._clickHandle();
        }
    }

    private _loadSubView(name: string, ...args: any) {
        this._root.loadGuildSubView(name, ...args);
    }
}
