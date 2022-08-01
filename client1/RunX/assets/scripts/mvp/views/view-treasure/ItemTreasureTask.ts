import { utils } from "../../../app/AppUtils";
import { configUtils } from "../../../app/ConfigUtils";
import RichTextEx from "../../../common/components/rich-text/RichTextEx";
import moduleUIManager from "../../../common/ModuleUIManager";
import { cfg } from "../../../config/config";
import { taskData } from "../../models/TaskData";

const {ccclass, property} = cc._decorator;

@ccclass
export default class ItemTreasureTask extends cc.Component {
    @property(cc.Label)           introduceLB: cc.Label = null;
    @property(RichTextEx)           progressLB: RichTextEx = null;
    @property(cc.ProgressBar)       progress: cc.ProgressBar = null;
    @property(cc.Node)              jumpBtn: cc.Node = null;

    private _treasureCfg: cfg.LeadTreasure = null;

    init(treasureID: number){
        this._treasureCfg = configUtils.getLeadTreasureConfig(treasureID);
        if(!this._treasureCfg || !this._treasureCfg.ConditionID) {
            this.node.active = false;
            return;
        }

        this.node.active = true;
        this._initUI();
    }

    private _initUI(){
        if(!this._treasureCfg || !this._treasureCfg.ConditionID) return;

        let intro = this._treasureCfg.ConditionIntroduce || '';
        this.introduceLB.string = intro;

        let maxTimes = this._treasureCfg.AttributeConditionMax || 1;
        let singleFinishCD =  this._treasureCfg.ConditionGoalParam || 1;

        let currFinishCD = taskData.getTreasureTaskAchieveCnt(this._treasureCfg.ConditionID);
        let finishTimes = Math.floor(currFinishCD / singleFinishCD);
        finishTimes = Math.min(finishTimes, maxTimes);
        let progress = finishTimes / maxTimes;

        this.progress.progress = progress;
        this.progressLB.string = `${finishTimes}/${maxTimes}`;
        this.jumpBtn.active = this._checkJumpBtnVisible() && progress < 1;
    }

    private _checkJumpBtnVisible(){
        if(!this._treasureCfg || !this._treasureCfg.ConditionJump || this._treasureCfg.ConditionJump.length == 0){
            return false;
        }
        return true;
    }

    onClickJump(){
        if(!this._treasureCfg || !this._treasureCfg.ConditionJump || this._treasureCfg.ConditionJump.length == 0) return;

        let moduleCfgs = utils.parseStringTo1Arr(this._treasureCfg.ConditionJump, ';');
        let moduleID = parseInt(moduleCfgs[0]);
        let subModuleID;
        if(moduleCfgs.length > 1){
            subModuleID = parseInt(moduleCfgs[1]);
        }
        moduleUIManager.jumpToModule(moduleID, subModuleID);
    }
}
