import { CustomDialogId, VIEW_NAME } from "../../../../app/AppConst";
import { utils } from "../../../../app/AppUtils";
import { ViewBaseComponent } from "../../../../common/components/ViewBaseComponent";
import { eventCenter } from "../../../../common/event/EventCenter";
import { islandEvent } from "../../../../common/event/EventData";
import guiManager from "../../../../common/GUIManager";
import { logger } from "../../../../common/log/Logger";
import moduleUIManager from "../../../../common/ModuleUIManager";
import { ItemBagPool } from "../../../../common/res-manager/NodePool";
import { gamesvr } from "../../../../network/lib/protocol";
import { islandData, PointType } from "../../../models/IslandData";
import { pveTrialData } from "../../../models/PveTrialData";
import { serverTime } from "../../../models/ServerTime";
import ItemBag from "../../view-item/ItemBag";
import PVEFairyIslandMapTile from "./PVEFairyIslandMap";

const {ccclass, property} = cc._decorator;
@ccclass
export default class PVEFairyIslandView extends ViewBaseComponent {
    @property(cc.ParticleSystem) effct: cc.ParticleSystem = null;
    @property(PVEFairyIslandMapTile) mapView: PVEFairyIslandMapTile = null;
    @property(cc.Layout) rewardLayout: cc.Layout = null;
    @property(cc.Label) timeDownLabel: cc.Label = null;
    @property(cc.Button) effectBtn: cc.Button = null;
    @property(cc.Label) layerLb: cc.Label = null;
    
    private _bagItems: ItemBag[] = [];

    onInit(fid:number): void { 
        this._registerEvent();
        //监听地图划动
        this._fixListener(true);
        //刷新界面数据
        this._reflashLayerId();
        this._checkTimeShow();
        
        guiManager.addCoinNode(this.node,fid);
    }

    private _registerEvent() {
        eventCenter.register(islandEvent.RECEIVE_BATTLE_RES, this, this._openBuffView);
        eventCenter.register(islandEvent.RECEIVE_BUFF_RES, this, this._particleEffect);
        eventCenter.register(islandEvent.RECEIVE_TRANS_GATE_RES, this, this._reflashLayerId);
    }


    /**页面释放清理*/
    onRelease() {
        this._stopShedule();
        this._bagItems.forEach(bagItem => {
            ItemBagPool.put(bagItem);
        })
        this._fixListener(false);
        eventCenter.unregisterAll(this);
        cc.Tween.stopAllByTarget(this.effct.node);
        guiManager.removeCoinNode(this.node);
    }

    private _reflashViewData(layerId: number = 1) {
        //重置数据
        // this.rewardLayout.node.children.length = 0;
        this.rewardLayout.node.width = 0;
        this._bagItems.forEach(item => {
            ItemBagPool.put(item);
        })
        this._bagItems.length = 0;

        let dropString = islandData.getRewardCfgByLayerID(layerId);
        if (!dropString) return;
        let dropShow: string[] = dropString.split("|");
        dropShow.forEach((str) => {
            let dropIds = str.split(";").map(Number);
            if (dropIds && dropIds.length) {
                let itemBag = ItemBagPool.get();
                itemBag.init({
                    id: dropIds[0],
                    count: dropIds[1],
                    clickHandler: () => { moduleUIManager.showItemDetailInfo(dropIds[0], dropIds[1], this.rewardLayout.node); }
                });
                itemBag.node.parent = this.rewardLayout.node;
                this.rewardLayout.node.width += itemBag.node.width;
                this._bagItems.push(itemBag);
            }
        })
            
    }

    private _particleEffect() {
        this.effct.node.active = true;
        this.effct.resetSystem();
        this.effct.node.position = cc.v3(0, 0);

        let effctBtnPos = this.effectBtn.node.position;
     
        cc.tween(this.effct.node)
            .to(1, { x: effctBtnPos.x, y: effctBtnPos.y })
            .call(() => {
                this.effct.stopSystem();
            })
            .delay(this.effct.life + this.effct.lifeVar)
            .set({ active: false })
            .start()
    }


        /**添加监听*/
    private _fixListener(on: boolean = true) {
        if (on) {
            this.mapView.mapBg.on(cc.Node.EventType.TOUCH_MOVE, this._mapBgListener.bind(this), this.mapView.mapBg);
        } else {
            this.mapView.mapBg.off(cc.Node.EventType.TOUCH_MOVE, this._mapBgListener.bind(this), this.mapView.mapBg);
        }
    }
        
        
    private _mapBgListener(event: cc.Event.EventTouch) {
        let detal = event.getDelta();
        //bg原点再左下
        let targetPos = this.mapView.mapBg.position.add(cc.v3(detal.x, detal.y));
        if (targetPos.x > 0 || targetPos.y > 0) {
            targetPos.x = Math.min(targetPos.x, 0);
            targetPos.y = Math.min(targetPos.y, 0);
        }
        else {
            //坐下最大移动距离
            targetPos.x = Math.max(targetPos.x, -this.mapView.mapBg.width);
            targetPos.y = Math.max(targetPos.y, -this.mapView.mapBg.height);

            //右上最小移动距离
            let rightTopMaxX = this.mapView.mapBg.width - this.mapView.node.width;
            if (targetPos.x < -rightTopMaxX) targetPos.x = -rightTopMaxX;
            let rightTopMaxY = this.mapView.mapBg.height - this.mapView.node.height;
            if(targetPos.y < -rightTopMaxY )targetPos.y = -rightTopMaxY;

            if (this.mapView.mapBg.width < this.mapView.node.width) targetPos.x = 0;
            if (this.mapView.mapBg.height < this.mapView.node.height) targetPos.y = 0;
        }
        
        this.mapView.mapBg.position = targetPos;
    }

    private _checkTimeShow() {
        let leftTime = pveTrialData.islandData.NextTime - serverTime.currServerTime();
        let timeStampArr = utils.getLeftTime(leftTime);
        let day = timeStampArr[0], hour = timeStampArr[1], min = timeStampArr[2], sec = timeStampArr[3];
        if (day) {
            this.timeDownLabel.string = `${day}天`;
        } else if (hour) {
            this.timeDownLabel.string = `${hour}时`;   
        } else {
            this.timeDownLabel.string = `${min}:${sec}`;
            this.schedule(this._starTimeDown,1);
        }
    }

    private _starTimeDown() {
        let nextTime = pveTrialData.islandData.NextTime;
        let leftTime = nextTime - serverTime.currServerTime();
        //已重置 按理说不应该
        if (leftTime < 0) this._stopShedule();
        let timeStampArr = utils.getLeftTime(leftTime);
        let min = timeStampArr[2], sec = timeStampArr[3];
        this.timeDownLabel.string = `${min}:${sec}`;
    }

    private _reflashLayerId() {
        let layerId = (pveTrialData.islandData.Progress + 1) || 1;
        this.layerLb.string = `${layerId}层首领奖励`
        this._reflashViewData(layerId)

        //地图初始化
        this.mapView.deInit();
        this.mapView.onInit();
    }

    private _stopShedule() {
        // this.unschedule(this._starTimeDown);
        this.unscheduleAllCallbacks();
    }

    openRuleView() {
        this.loadSubView(VIEW_NAME.PVE_CHALLENGE_RULE_VIEW,CustomDialogId.PVE_ISLAND_GAME_RULE);
    }

    openRewardPreview() {
        this.loadSubView(VIEW_NAME.PVE_FAIRYISLAND_REWARD_PREVIEW);
    }

    /**我的英雄*/
    openMyHeroView() {
        this.loadSubView(VIEW_NAME.PVE_FAIRYISLAND_MYHERO_VIEW);
    }

    /**增益效果*/
    openSelfBuff() {
        this.loadSubView(VIEW_NAME.PVE_FAIRYISLAND_BUFF_VIEW);
    }

    /**复活*/
    openResuregence() {
        this.loadSubView(VIEW_NAME.PVE_FAIRYISLAND_EFFECT_POPVIEW,PointType.PTTransGate);
    }

    private _openBuffView(cmd:any,msg:gamesvr.TrialIslandEnterPveRes) {
        if (!msg.BuffList || !msg.BuffList.length) return;
        this.loadSubView(VIEW_NAME.PVE_FAIRYISLAND_BUFF_VIEW,msg.BuffList);
    }
}