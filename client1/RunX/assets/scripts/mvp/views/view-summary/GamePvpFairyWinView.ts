import { eventCenter } from "../../../common/event/EventCenter";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { data, gamesvr } from "../../../network/lib/protocol";
import ItemBag from "../view-item/ItemBag";
import guiManager from "../../../common/GUIManager";
import { SCENE_NAME } from "../../../app/AppConst";
import { audioManager, SFX_TYPE } from "../../../common/AudioManager";
import { configUtils } from "../../../app/ConfigUtils";
import moduleUIManager from "../../../common/ModuleUIManager";
import { cfg } from "../../../config/config";
import { configManager } from "../../../common/ConfigManager";
import { userData } from "../../models/UserData";
import { pvpData } from "../../models/PvpData";
import { battleUIData } from "../../models/BattleUIData";

const { ccclass, property } = cc._decorator;


@ccclass
export default class GamePvpFairyWinView extends ViewBaseComponent {
    @property(cc.Node) itemRoot: cc.Node = null;
    @property(cc.Label) pointGain: cc.Label = null;
    @property(cc.Node) winBg: cc.Node = null;
    @property(cc.Node) loseBg: cc.Node = null;
    @property([cc.Node]) guideBtns: cc.Node[] = [];
    @property(sp.Skeleton) winSpine: sp.Skeleton = null;
    @property(sp.Skeleton) loseSpine: sp.Skeleton = null;
    @property(cc.Node) nextBtn: cc.Node = null;
    @property(cc.Node) winRoleNode: cc.Node = null;
    @property(cc.Node) loseRoleNode: cc.Node = null;
    @property(cc.Node) ndReport: cc.Node = null;

    onInit(info: gamesvr.PvpFairyEnterRes) {
        this.winBg.active = info.Past;
        this.loseBg.active = !info.Past;
        this.nextBtn.active = false;
        this.pointGain.node.active = false;
        this._adapterRolePos(info.Past ? this.winRoleNode : this.loseRoleNode);
        info.Past ? this._setViewChildrenVisible(this.winBg, false) : this._setViewChildrenVisible(this.loseBg, false);
        if(info.Past){
            this._playWinBgEff(() => {
                  let cnt = pvpData.fairyData.ChallengeTimes || 0;
                  let moduleCfg = configUtils.getModuleConfigs();
                  let gameIdx = (moduleCfg.PVPImmortalsFightNum || 5) - cnt;
                  let point = moduleCfg.PVPImmortalsWinPoint.split(";")[gameIdx -1] || 0;
                  this.pointGain.node.active = true;
                  this.pointGain.string = info.Past ? `积分+${point}` : "";
              })
        } else {
            this.showGuideButtons();
            this._playLoseBgEff(null);
        }
        this.scheduleOnce(() => {
            (info.Past ? this.winRoleNode : this.loseRoleNode).active = true;
            audioManager.playSfx(SFX_TYPE.GAME_WIN);
        }, 0.3);
        this.ndReport.active = battleUIData.isBattle;
    }

    onRelease() {
        this.itemRoot.children.forEach(_p => {
            if (cc.isValid(_p)) {
                let comp = _p.getComponent(ItemBag);
                comp && comp.deInit();
            }
        })
        this.releaseSubView();
        this.itemRoot.removeAllChildren();
        eventCenter.unregisterAll(this);
        this.unscheduleAllCallbacks();
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
        guiManager.loadScene(SCENE_NAME.MAIN).then(()=>{
            moduleUIManager.showModuleView();
        })
    }

    onClickLeave() {
        guiManager.loadScene(SCENE_NAME.MAIN).then(()=>{
            moduleUIManager.showModuleView();
        });
    }

    onClickGuideBtn(event: cc.Event.EventTouch) {
        let target = event.currentTarget;
        if(!cc.isValid(target)) return;

        let data: cfg.FailGuide = target._bindData;
        if(!data) return;
        let linkRes = data.FailGuideLink.split(";").map(str => { return parseInt(str) });
        linkRes[0] && this.closeView();
        guiManager.loadScene(SCENE_NAME.MAIN).then(() => {
            moduleUIManager.jumpToModule(linkRes[0], linkRes[1], linkRes[2]);
        });
    }

    onClickReport () {
        this.loadSubView("BattleReportView", battleUIData.rawRes)
    }

    /**
    * @description 展示引导按钮，最多三个
    */
    showGuideButtons() {
        let guideCfgs: cfg.FailGuide[] = configManager.getConfigList("failGuide");
        guideCfgs = guideCfgs.filter(cfg => {
            return !(cfg.FailGuideOpenLeveL && cfg.FailGuideOpenLeveL > userData.lv) && cfg.FailGuideLink != "35000";
        });
        guideCfgs.forEach((cfg, index) => {
            if (this.guideBtns[index]) {
                this.guideBtns[index].active = true;
                //@ts-ignore
                this.guideBtns[index]._bindData = cfg;
                this.guideBtns[index].getComponentInChildren(cc.Label).string = cfg.FailGuideName;
            }
        })
    };

}
