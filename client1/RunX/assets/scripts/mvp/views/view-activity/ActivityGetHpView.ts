/*
 * @Author: xuyang
 * @Description: 活动-获取体力页面
 */
import { configManager } from "../../../common/ConfigManager";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { eventCenter } from "../../../common/event/EventCenter";
import { cfg } from "../../../config/config";
import { activityEvent, commonEvent } from "../../../common/event/EventData";
import guiManager from "../../../common/GUIManager";
import { redDotMgr, RED_DOT_MODULE } from "../../../common/RedDotManager";
import { CustomDialogId, RES_ICON_PRE_URL, TREASURE_SYS_POWER_TYPE, VIEW_NAME } from "../../../app/AppConst";
import { data, gamesvr } from "../../../network/lib/protocol";
import { taskData } from "../../models/TaskData";
import ItemActivityGetHp from "./ItemActivityGetHp";
const { ccclass, property } = cc._decorator;

@ccclass
export default class ActivityGetHpView extends ViewBaseComponent {
    @property(cc.Node) rootNode: cc.Node = null;
    @property(ItemActivityGetHp) HPItems: ItemActivityGetHp[] = [];

    private _powerList: cfg.ActivityGetPower[] = [];
    private _parentComp: ViewBaseComponent = null;

    onInit(activityID: number, root: ViewBaseComponent) {
        this._parentComp = root;
        this._prepareData();
        this._refreshView();

        eventCenter.register(commonEvent.TIME_DAY_RESET, this, this._onTimeReset);
        eventCenter.register(activityEvent.RECV_POWER_RES, this, this._recvGetPowerRes);
    }

    onRelease() {
        this._parentComp = null;

        this.HPItems.forEach(_v=> {
            if (_v && cc.isValid(_v)) {
                _v.deInit();
            }
        })

        this.unscheduleAllCallbacks();
        this.releaseSubView();
        eventCenter.unregisterAll(this);
    }

    onRefresh() {
    }

    private _prepareData() {
        let cfgs: cfg.ActivityGetPower[] = configManager.getConfigList("activityGetPower");
        this._powerList = cfgs.filter(powerId => {return !! powerId}).sort((a, b) => {
            return a.GetPowerID - b.GetPowerID;
        });
    }

    private _refreshView() {
        for (let i = 0; i < this.HPItems.length; i++) {
            let _item = this.HPItems[i];
            let _cfg = this._powerList[i];
            if (_item && _cfg) {
                _item.onInit(_cfg)
            }
        }
    }

    private _recvGetPowerRes(eventId: number, msg: gamesvr.ActivitySpiritReceiveSpiritRes){
        let cfg = configManager.getConfigByKey('activityGetPower', msg.GetPowerID);

        //构造体力奖励数据(原本应该后端带过来的)    10010003: 体力道具的ID
        let prizes: data.IItemInfo[] = [{ID: 10010003, Count: cfg.GetPowerItem}];
        //额外奖励
        let extraPrizes:data.IItemInfo[]  =  null;

        //10016：赠送体力的宝物参数，在表LeadTreasure中
        let extra = taskData.getTreasureSysPowerParam(TREASURE_SYS_POWER_TYPE.LING_YE_GUO);
        extra && (extraPrizes= [{ID: 10010003, Count: extra}]);

        this._loadView(VIEW_NAME.GET_ITEM_VIEW, prizes, extraPrizes);
        this._refreshView();
        guiManager.showDialogTips(CustomDialogId.ACTIVITY_GET_HP);
        redDotMgr.fire(RED_DOT_MODULE.MAIN_ACTIVITY);
        redDotMgr.fire(RED_DOT_MODULE.ACTIVITY_PHYSICAL_TOGGLE);
    }

    private _onTimeReset(){
        this._refreshView();
    }

    private _loadView(viewName: string, ...args: any[]) {
        //@ts-ignore
        cc.isValid(this._parentComp) && this._parentComp.loadSubView(viewName, ...args)
    }
}
