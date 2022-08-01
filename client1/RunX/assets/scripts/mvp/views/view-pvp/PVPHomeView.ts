/*
 * @Author: xuyang
 * @Date: 2021-07-05 19:17:31
 * @Description: PVP 竞技玩法主界面
 */
import LinearSortContainor from "../../../common/components/LinearSortContainor";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { configManager } from "../../../common/ConfigManager";
import { eventCenter } from "../../../common/event/EventCenter";
import { bagDataEvent, commonEvent } from "../../../common/event/EventData";
import guiManager from "../../../common/GUIManager";
import { cfg } from "../../../config/config";
import PVPListItem from "./PVPListItem";

const { ccclass, property } = cc._decorator;

@ccclass
export default class PVPHomeView extends ViewBaseComponent {
    @property(cc.Node) deifyItem: cc.Node = null;
    @property(cc.Node) immortalsItem: cc.Node = null;
    @property(cc.Node) peakDuleItem: cc.Node = null;
    // @property(LinearSortContainor) itemsContainor: LinearSortContainor = null;

    onInit(moduleId: number) {
        this._registerEvent();
        this._initUI();
        // this.itemsContainor.init();
        guiManager.addCoinNode(this.node, moduleId);
    }

    deInit() {
        this.releaseSubView();
        this.unscheduleAllCallbacks();
    }

    private _registerEvent() {
        //有道具、材料发生改变，直接刷新界面
        eventCenter.register(bagDataEvent.ITEM_CHANGE, this, this._initUI);
    }

    onRelease() {
        this.deInit();
        // this.itemsContainor.deInit();
        eventCenter.unregisterAll(this);
        this.deifyItem.getComponent(PVPListItem).unuse();
        this.immortalsItem.getComponent(PVPListItem).unuse();
        guiManager.removeCoinNode(this.node);
    }

    private _onListRender(itemNode: cc.Node) {
        let item = itemNode.getComponent(PVPListItem);
        let cfg: cfg.PVPList = configManager.getConfigByKey('pvpList', item.functionID);
        item.init(cfg);
    }

    private _initUI() {
        this._onListRender(this.deifyItem);
        this._onListRender(this.immortalsItem);
        this._onListRender(this.peakDuleItem);
    }
}
