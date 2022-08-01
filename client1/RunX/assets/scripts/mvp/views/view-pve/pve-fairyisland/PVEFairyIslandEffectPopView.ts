import { CustomDialogId } from "../../../../app/AppConst";
import { bagDataUtils } from "../../../../app/BagDataUtils";
import { configUtils } from "../../../../app/ConfigUtils";
import { ViewBaseComponent } from "../../../../common/components/ViewBaseComponent";
import { configManager } from "../../../../common/ConfigManager";
import { eventCenter } from "../../../../common/event/EventCenter";
import { islandEvent } from "../../../../common/event/EventData";
import guiManager from "../../../../common/GUIManager";
import { logger } from "../../../../common/log/Logger";
import { cfg } from "../../../../config/config";
import { data } from "../../../../network/lib/protocol";
import { bagData } from "../../../models/BagData";
import { islandData, PointType } from "../../../models/IslandData";
import { pveTrialData } from "../../../models/PveTrialData";
import { pveDataOpt } from "../../../operations/PveDataOpt";
import ItemIsLandBtn from "./ItemIsLandBtn";

const {ccclass, property} = cc._decorator;
@ccclass
export default class PVEFairyIslandEffectPopView extends ViewBaseComponent {

    @property(cc.Button) confirmBtn: cc.Button = null;
    @property(cc.Label) titleLb: cc.Label = null;
    @property(cc.Label) desc: cc.Label = null;
    /**传送门按钮节点*/
    @property(cc.Node) portalNode: cc.Node = null;

    private _tileInfo: data.ITrialPointInfo = null;

    onInit(tileInfo: data.ITrialPointInfo): void {
        if (!tileInfo) return;
        this._tileInfo = tileInfo;
        this._initViewByType(tileInfo.Type);
        this._showProtalBtn(tileInfo.Type == PointType.PTTransGate);
        this._registerEvent();
    }

    /**页面释放清理*/
    onRelease() {
       eventCenter.unregisterAll(this);
    }

    private _registerEvent() {
        eventCenter.register(islandEvent.RECEIVE_RELIVE_RES, this, this._showTips); 
        eventCenter.register(islandEvent.RECEIVE_POTAL_RES, this, this._showTips);
        eventCenter.register(islandEvent.RECEIVE_ADD_HP_RES, this, this._showAddHpTips);
    }

    private _initViewByType(viewType: PointType) {
        let btnIsland = this.confirmBtn.getComponent(ItemIsLandBtn);
        if (!btnIsland) logger.error(`PVEFairyIslandEffectPopView`, `prefab binder error!`);
        let desId = CustomDialogId.PVE_ISLAND_RESUREGENCE;
        switch (viewType) {
            case PointType.PTLiveAltar: {
                this.titleLb.string = `复活祭坛`;
                btnIsland.onInit({ clickFunc: this._funcByPortalEffect.bind(this), btnTitle: `立即使用` })
                desId = CustomDialogId.PVE_ISLAND_RESUREGENCE;
                break
            };
            case PointType.PTHPAltar: { 
                this.titleLb.string = `泉水`;
                btnIsland.onInit({ clickFunc: this._funcByAddAllHeroHp.bind(this), btnTitle: `立即使用` })
                desId = CustomDialogId.PVE_ISLAND_RECOVE_HALF_HP;
                break;
            } 
            case PointType.PTTransGate: { 
                this.titleLb.string = `传送门`;
                desId = CustomDialogId.PVE_ISLAND_PORTAL_DES;
                this._showProtalBtn(true);
                break;
            }
           
            default : { 
                this.titleLb.string = `复活仙丹`;
                //剩余数量
                let itemId = configUtils.getConfigModule(`PVEFairyIslandResurrectionItem`);
                let remain = bagData.getItemCountByID(itemId);
                //本次是否免费-先判定上次免费时间是不是在今天
                let data = new Date();
                let curTimeOffset = Number(data.getTime() / 1000) - data.getHours()*3600 - data.getMinutes()*60 - data.getSeconds();
                let notSameDay = (curTimeOffset - pveTrialData.islandData.FreeReliveTime) > 0;
                let free = notSameDay ? 1 : 0;
                btnIsland.onInit({ clickFunc: this._funcByPortalMedicine.bind(this), btnTitle: `立即使用`, remainNum: remain, freeNum: free });
                desId = CustomDialogId.PVE_ISLAND_RECOVE_ALL_HP_REDUCEITEM;
                break;
            } 
        }
        let dialogueCfg: cfg.Dialog = configManager.getConfigByKey(`dialogue`, desId);
        if (desId == CustomDialogId.PVE_ISLAND_RECOVE_ALL_HP_REDUCEITEM) {
            let strFirst = dialogueCfg.DialogText.split(`【`);
            let strEnd = strFirst && strFirst.length && strFirst[1]?.split(`】`);
            let itemId = configUtils.getConfigModule(`PVEFairyIslandResurrectionItem`);
            let itemInfo = configUtils.getItemConfig(itemId);
            this.desc.string = `${strFirst[0]}${itemInfo.ItemName}${strEnd[1]}`;
        } else {
            this.desc.string = dialogueCfg.DialogText;    
        }   
    }

    private _showProtalBtn(show: boolean = false) {
        this.portalNode.active = show;
        this.confirmBtn.node.active = !show;
    }

    /**治疗之泉*/
    private _funcByAddAllHeroHp() {
        pveDataOpt.reqHpAltar(this._tileInfo.PointUID);
    }

    /**复活祭坛*/
    private _funcByPortalEffect() {
        pveDataOpt.reqPortal(this._tileInfo.PointUID);
    }

    /**复活仙丹*/
    private _funcByPortalMedicine() {
        //本次是否免费-先判定上次免费时间是不是在今天
        let data = new Date();
        let curTimeOffset = Number(data.getTime() / 1000) - data.getHours()*3600 - data.getMinutes()*60 - data.getSeconds();
        let notSameDay = (curTimeOffset - pveTrialData.islandData.FreeReliveTime) > 0;
        let free = notSameDay ? 1 : 0;

        //剩余数量
        let itemId = configUtils.getConfigModule(`PVEFairyIslandResurrectionItem`);
        let remain = bagData.getItemCountByID(itemId);
        if (!free && remain <= 0) {
            guiManager.showTips("道具数量不足!");
            return;
        }
        pveDataOpt.reqRelive();
    }

    private _showTips() {
        guiManager.showTips("复活成功");
        this.closeView();
    }
    private _showAddHpTips() {
        guiManager.showTips("血量已恢复");
        this.closeView();
    }

    funcByTransGate() {
        this.closeView();
        pveDataOpt.reqTransGate(this._tileInfo.PointUID);
    }
}