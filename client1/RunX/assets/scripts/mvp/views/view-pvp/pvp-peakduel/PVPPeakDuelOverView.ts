import { SCENE_NAME } from "../../../../app/AppConst";
import { audioManager, SFX_TYPE } from "../../../../common/AudioManager";
import { ViewBaseComponent } from "../../../../common/components/ViewBaseComponent";
import { eventCenter } from "../../../../common/event/EventCenter";
import guiManager from "../../../../common/GUIManager";
import moduleUIManager from "../../../../common/ModuleUIManager";
import { ItemBagPool } from "../../../../common/res-manager/NodePool";
import { data, gamesvr } from "../../../../network/lib/protocol";
import { pvpData } from "../../../models/PvpData";
import ItemBag from "../../view-item/ItemBag";

const {ccclass, property} = cc._decorator;
@ccclass
export default class PVPPeakDuelOverView extends ViewBaseComponent {

   @property(cc.Label) pointGain: cc.Label = null;
   @property(cc.Label) tempPoint: cc.Label = null;
   @property(cc.Node) winBg: cc.Node = null;
   @property(cc.Node) loseBg: cc.Node = null;
   @property(sp.Skeleton) winSpine: sp.Skeleton = null;
   @property(sp.Skeleton) loseSpine: sp.Skeleton = null;
   @property(cc.Node) nextBtn: cc.Node = null;
   @property(cc.Node) winRoleNode: cc.Node = null;
    @property(cc.Node) loseRoleNode: cc.Node = null;
    @property(cc.Node) content:cc.Node = null

    private _items: data.IItemInfo[] = [];
    private _rewards: ItemBag[] = [];
    
    onInit(info: gamesvr.PvpPeakDuelEnterRes, closeFunc: Function) {
        let isWin = pvpData.pvpConfig.replay ? pvpData.peakRecordInfo.IsWin : info.Past;
        this.winBg.active = isWin;
        this.loseBg.active = !isWin;
        this._adapterRolePos(isWin ? this.winRoleNode : this.loseRoleNode);
        this._items = info.Prizes1;
        if (info.Prizes1) this.rewardListRender();
        this._initScoreLb();

        if(isWin){
            this._playWinBgEff(null)
        } else {
            this._playLoseBgEff(null);
        }
        this.scheduleOnce(() => {
            (isWin ? this.winRoleNode : this.loseRoleNode).active = true;
            audioManager.playSfx(SFX_TYPE.GAME_WIN);
        }, 0.3);
    }

   onRelease() {
       this.releaseSubView();
       eventCenter.unregisterAll(this);
       this.unscheduleAllCallbacks();
       this._rewards.forEach(item => {
           ItemBagPool.put(item);
       })
   }

    rewardListRender() {
        this._items.forEach(itemInfo => {
            let itemBag: ItemBag = ItemBagPool.get();
            itemBag.init({
                id: itemInfo.ID,
                count:itemInfo.Count
            })
            itemBag.node.parent = this.content;    
            this._rewards.push(itemBag);
        })
        
   }
    
    private _prepareFightData():data.IPVPPeakDuelFight {
        if (pvpData.pvpConfig?.replay) {
            return pvpData.peakRecordInfo;
        } else {
            let fightList = pvpData.peakDuelData?.FightList || [];
            if (!fightList.length) return null;
            fightList = fightList.sort((A, B) => {
                return B.FightTime - A.FightTime;
            })
       
            return fightList[0];
        }
    }
    
    private _initScoreLb() {
        let fight:data.IPVPPeakDuelFight = this._prepareFightData();
        let tmPoint: number = fight.IntegralLast || 0;
        let chrPoint: number = fight.IntegralChange || 0;
        this.tempPoint.string =  `${tmPoint}` ;
        this.pointGain.string = `+${chrPoint}`;
    }

   private _adapterRolePos(roleNode: cc.Node) {
       let roleParent = roleNode.parent;
       let widgetComp = roleParent.getComponent(cc.Widget);
       if(cc.isValid(widgetComp)) widgetComp.updateAlignment();
       let rect = roleParent.getBoundingBox();
       roleNode.x = rect.xMin;
       roleNode.y = rect.yMin;
   }

   private _setViewChildrenVisible(node: cc.Node, visible: boolean) {
       if(!cc.isValid(node)) return;
       node.children.forEach(ele => {
             if(ele == this.winRoleNode || ele == this.loseRoleNode) return;
             ele.active = visible;
       });
   }

   private _playWinBgEff(cb: Function){
       let winBgEff = cc.find('effect_win', this.winBg);
       winBgEff.active = true;
       let spComp: sp.Skeleton = winBgEff.getComponent(sp.Skeleton);
       spComp.clearTracks();
       spComp.setAnimation(0, 'win', false);
       this.scheduleOnce(() => {
           this._setViewChildrenVisible(this.winBg, true);
           this.nextBtn.active = true;
           cb && cb();
       }, 0.7)
   }


   private _playLoseBgEff(cb: Function){
       let loseBgEff = cc.find('effect_lose', this.loseBg);
       loseBgEff.active = true;
       let spComp: sp.Skeleton = loseBgEff.getComponent(sp.Skeleton);
       spComp.clearTracks();
       spComp.setAnimation(0, 'lose2', false);
       this.scheduleOnce(() => {
           this._setViewChildrenVisible(this.loseBg, true);
           this.nextBtn.active = true;
           cb && cb();
       }, 1.2);
   }

   onClickClose() {
       this.closeView();
   }

    onClickContinue() {
        this.closeView();
       guiManager.loadScene(SCENE_NAME.MAIN).then(()=>{
           moduleUIManager.showModuleView();
       })
   }

    onClickLeave() {
        this.closeView();
        guiManager.loadScene(SCENE_NAME.MAIN).then(()=>{
            moduleUIManager.showModuleView();
        });
   }

}