
import { VIEW_NAME } from "../../../app/AppConst";
import { configUtils } from "../../../app/ConfigUtils";
import List from "../../../common/components/List";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { configManager } from "../../../common/ConfigManager";
import { eventCenter } from "../../../common/event/EventCenter";
import { guildEvent } from "../../../common/event/EventData";
import guiManager from "../../../common/GUIManager";
import { data } from "../../../network/lib/protocol";
import { guildData } from "../../models/GuildData";
import ItemDonate from "./ItemDonate";

const enum DONATE_TYPE {

}

const {ccclass, property} = cc._decorator;

@ccclass
export default class GuildDonateView extends ViewBaseComponent {
    @property(cc.Node) rootNd: cc.Node = null;
    @property(cc.Prefab) donatePf: cc.Prefab = null;
    @property(cc.Label) donateCount: cc.Label = null;

    private _donateIds: number[] = [];
    private _items: ItemDonate[] = [];
    private _loadView: Function = null;

    onInit(loadView: Function) {
        this._loadView = loadView;
        this.doInit();
        this._dueData();
        this._refreshView();
    }

    doInit() {

        eventCenter.register(guildEvent.UPDATE_DONATE, this, this._onRecvDonate);
    }

    onRelease() {
        eventCenter.unregisterAll(this);
        this._clearItem();
    }

    private _dueData() {
        this._donateIds = configManager.getConfigList('guildDonate').map((_cfg) => { return _cfg.ID; });
    }

    private _refreshView() {
        this._clearItem();

        const maxDonateCount = this._getMaxDonateCount();
        this.donateCount.string = `今日剩余捐赠次数：${maxDonateCount - guildData.donateTimes}`;
        for (let i = 0; i < this._donateIds.length; i++) {
            let _dn = this._donateIds[i];
            let _itemNd = cc.instantiate(this.donatePf);
            let _comp = _itemNd.getComponent(ItemDonate);
            this._items.push(_comp);

            _comp.init(_dn, this._loadView.bind(this));
            this.rootNd.addChild(_itemNd);
        }
    }

    private _onRecvDonate(eventId: number, prizes: data.IItemInfo[]) {
        guiManager.showDialogTips(99000050);
        this._loadView && this._loadView(VIEW_NAME.GET_ITEM_VIEW, prizes);
        this._refreshView();
    }

    private _getMaxDonateCount(): number {
        const lv = guildData.lv;
        const lvCfg = configUtils.getGuildLevelCfg(lv);
        if(lvCfg) {
            return lvCfg.GuildLevelDonateNum;
        }
        return 0;
    }

    private _clearItem () {
        this._items.forEach( _dn => {
            _dn.deInit();
        })
        this.rootNd.removeAllChildren();
        this._items = [];
    }
}
