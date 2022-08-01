import { PVP_MODE } from "../../../app/AppEnums";
import { configUtils } from "../../../app/ConfigUtils";
import { pveData } from "../../models/PveData";
import { pvpData } from "../../models/PvpData";

export interface MULTBA_TTLET_YPE{
    lessonID?: number,
    pvpMode?: number
}

const { ccclass, property } = cc._decorator;
@ccclass
export default class MultiBattleComp extends cc.Component {
    @property(cc.Button)        ndSteps: cc.Button[] = [];
    @property(cc.Node)          ndTitle: cc.Node = null;
    @property(cc.Node)          ndBan: cc.Node = null;
    @property(cc.Label)         lbChapter: cc.Label = null;
    @property(cc.SpriteFrame)   stepFrames: cc.SpriteFrame[] = [];

    private _lessonID: number = 0
    
    onInit () {
        this.ndBan.opacity = 0;
    }

    deInit () {
        this.node.stopAllActions();
        this.ndBan.opacity = 0;
    }

    onRefresh (type:MULTBA_TTLET_YPE) {
        this._lessonID = type.lessonID;
        this.ndTitle.active = false;

        let currLesson = this._lessonID || 0;
        let cfg = configUtils.getLessonConfig(currLesson);
        let monsterGroupIDs = pveData.pveConfig?.monsterGroupIDs;

        let passStep = pveData.pveConfig?.passStep;
        let currStep = pveData.pveConfig?.step;
        let stepNeed = 0;
        if (cfg && cfg.LessonMonsterGroupId) {
            stepNeed = cfg.LessonMonsterGroupId.split(";").length;
        } else if (monsterGroupIDs && monsterGroupIDs.length > 0) {
            stepNeed = monsterGroupIDs.length;
        }
        if (stepNeed) this.lbChapter.string = `需获得${stepNeed}场胜利方可通过关卡`;

        // pvp模式不需要展示关卡信息  
        if (pvpData.pvpConfig  && pvpData.checkPVPMulitBattle(type.pvpMode)) {
            //pvp目前默认3关
            stepNeed = 3;
            currStep = pvpData.pvpConfig?.step || 0;
            this.lbChapter.string = "获得2场及以上的胜利";
        }


        if (stepNeed <= 1) return;
        this.ndTitle.active = true;
        this.ndSteps.forEach( (_nd, _idx) => {
            _nd.node.active = _idx < stepNeed;
            
            let sprf = _nd.node.getChildByName("Mark").getComponent(cc.Sprite)
            if (_idx == currStep) {
                sprf.spriteFrame = this.stepFrames[1];
            } else if (pveData && pveData.pveConfig && passStep.indexOf(_idx) >= 0) {
                sprf.spriteFrame = this.stepFrames[2];
            } else {
                sprf.spriteFrame = this.stepFrames[0];
            }
        })
    }

    showBanInfo () {
        this.node.stopAllActions();
        this.ndBan.opacity = 0;
        cc.tween(this.ndBan)
        .sequence(
            cc.tween().to(0.2, {opacity: 255}, {easing: "sineOut"}),
            cc.delayTime(1),
            cc.tween().to(0.2, {opacity: 0}, {easing: "sineIn"})
        )
        .start();
    }
}