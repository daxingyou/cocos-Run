/*
 * @Author: your name
 * @Date: 2021-05-31 20:15:33
 * @LastEditTime: 2021-11-03 15:41:19
 * @LastEditors: lixu
 * @Description: In User Settings Edit
 * @FilePath: \RunX\assets\scripts\mvp\views\view-summary\GameLoseView.ts
 */
import { eventCenter } from "../../../common/event/EventCenter";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import guiManager from "../../../common/GUIManager";
import { SCENE_NAME } from "../../../app/AppConst";
import { battleEvent, commonEvent } from "../../../common/event/EventData";
import { audioManager, SFX_TYPE } from "../../../common/AudioManager";
import moduleUIManager from "../../../common/ModuleUIManager";
import { pvpData } from "../../models/PvpData";
import { cfg } from "../../../config/config";
import { configManager } from "../../../common/ConfigManager";
import { userData } from "../../models/UserData";
import { battleUIData } from "../../models/BattleUIData";
import { pveData } from "../../models/PveData";
import { PVE_MODE } from "../../../app/AppEnums";

const { ccclass, property } = cc._decorator;

@ccclass
export default class GameLoseView extends ViewBaseComponent {

    @property(cc.Node) replyButton: cc.Node = null;
    @property([cc.Node]) guideBtns: cc.Node[] = [];
    @property(sp.Skeleton) loseSpine: sp.Skeleton = null;
    @property(cc.Node) panel: cc.Node = null;
    @property(cc.Node) roleNode: cc.Node = null;
    @property(cc.Node) ndReport: cc.Node = null;

    /**蓬莱仙岛失败后需要隐藏的元素*/
    @property(cc.Node) btns: cc.Node = null;
    @property(cc.Node) replayBtnNode: cc.Node = null;

    private _currLession: number = 0;

    onInit(lessonId: number) {
        this._currLession = lessonId || 0;

        this.panel.active = false;
        let roleParent = this.roleNode.parent;
        let widgetComp = roleParent.getComponent(cc.Widget);
        if(cc.isValid(widgetComp)) widgetComp.updateAlignment();
        let rect = roleParent.getBoundingBox();
        this.roleNode.x = rect.xMin;
        this.roleNode.y = rect.yMin;
        // pvp模式隐藏该按钮
        this.replyButton.active = !pvpData.pvpConfig;
        this.scheduleOnce( ()=> {
            this.roleNode.active = true;
            audioManager.playSfx(SFX_TYPE.GAME_WIN);
        }, 0.3);
        this._showLoseEnterAnim(() => {
            this.panel.active = true;
        });
        this.showGuideButtons();
        this.ndReport.active = battleUIData.isBattle;

        if (pveData.pveConfig.pveMode == PVE_MODE.FAIRY_ISLAND) {
            this.btns.active = false;
            this.replayBtnNode.active = false;
        }
    }

    onRelease() {
        this.unscheduleAllCallbacks();
        eventCenter.unregisterAll(this);
        this.loseSpine.clearTracks();
    }

    onClickClose() {
        eventCenter.fire(battleEvent.CLOSE_BATTLE_POP);
        this.closeView();
    }

    onClickReSatrt() {
        eventCenter.fire(battleEvent.CLOSE_BATTLE_POP);
        this.closeView();
        eventCenter.fire(commonEvent.RESTART_CURR_GAME, this._currLession);
    }

    onClickLeave() {
        eventCenter.fire(battleEvent.CLOSE_BATTLE_POP);
        this.closeView();
        guiManager.loadScene(SCENE_NAME.MAIN).then(()=>{
            moduleUIManager.showModuleView();
        });
    }

    onClickReport () {
        this.loadSubView("BattleReportView", battleUIData.rawRes)
    }

    onClickGuideBtn(event: cc.Event.EventTouch) {
        if (pvpData.isReplay || !this._currLession) {
            return;
        }
        let target = event.currentTarget;
        if(!cc.isValid(target)) return;

        let data: cfg.FailGuide = target._bindData;
        if(!data) return;

        let linkRes = data.FailGuideLink.split(";").map(str=>{return parseInt(str)});
        if (linkRes[0] == 35000){
            this.closeView();
            eventCenter.fire(commonEvent.RESTART_CURR_GAME, this._currLession);
            return;
        }

        (linkRes[0]) && this.closeView();
        guiManager.loadScene(SCENE_NAME.MAIN).then(() => {
            moduleUIManager.jumpToModule(linkRes[0], linkRes[1], linkRes[2]);
        });
    }

    /**
     * @description 展示引导按钮，最多三个
     */
    showGuideButtons(){
        let guideCfgs: cfg.FailGuide[] = configManager.getConfigList("failGuide");
        guideCfgs = guideCfgs.filter(cfg=>{
            return !(cfg.FailGuideOpenLeveL && cfg.FailGuideOpenLeveL > userData.lv) && !(pvpData.pvpConfig && cfg.FailGuideLink == "35000");
        });
        guideCfgs.forEach((cfg, index)=>{
            if (this.guideBtns[index]){
                this.guideBtns[index].active = true;
                //@ts-ignore
                this.guideBtns[index]._bindData = cfg;
                this.guideBtns[index].getComponentInChildren(cc.Label).string = cfg.FailGuideName;
            }
        })
    }

    private _showLoseEnterAnim(func: Function) {
        this.loseSpine.clearTracks();
        this.loseSpine.setAnimation(0, 'lose2', false);
        this.scheduleOnce(() => {
          func && func();
      }, 1.2);

    }
}
