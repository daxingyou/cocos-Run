import { CustomDialogId, RES_ICON_PRE_URL } from "../../../app/AppConst";
import { configUtils } from "../../../app/ConfigUtils";
import guiManager from "../../../common/GUIManager";
import moduleUIManager from "../../../common/ModuleUIManager";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { cfg } from "../../../config/config";
import { bagData } from "../../models/BagData";
import { taskData } from "../../models/TaskData";
import { userData } from "../../models/UserData";

const { ccclass, property } = cc._decorator;

@ccclass
export default class PVPListItem extends cc.Component {

    @property(cc.Label) txtCond1: cc.Label = null;
    @property(cc.Label) txtCond2: cc.Label = null;
    @property(cc.Node) lockNode: cc.Node = null;
    @property(cc.Sprite) bgSpr: cc.Sprite = null;

    @property(cc.Label) enterNum: cc.Label = null;
    @property(cc.Sprite) enterSpr: cc.Sprite = null;
    @property(cc.Integer) functionID: number = 0;

    private _cfg: cfg.PVPList = null;
    private _canEnter: boolean = true;
    private _enterStr: string = "";
    private _sprLoader: SpriteLoader = new SpriteLoader();

    init(cfg: cfg.PVPList) {
        this._cfg = cfg;
        this.showOpenType();
        // this.checkModuleOpened(cfg.PVEListFunctionId);
    }

    unuse() {
        this._canEnter = false;
        this._sprLoader.release();
    }

    reuse() {
    }

    onDestroy() {
    }

    checkModuleOpened(funcID: number) {
        let cfg = configUtils.getFunctionConfig(funcID);
        let openCondition = cfg.FunctionOpenCondition || "1|1";
        let conditionArr = openCondition.split("|");
        if (conditionArr[0]) switch (conditionArr[0]) {
            case "1":
                let lv = Number(conditionArr[1]);
                if (lv && lv > userData.lv) {
                    let cfg = configUtils.getDialogCfgByDialogId(CustomDialogId.GRADE_NO_MATCH);
                    this.lockNode.active = true;
                    this.txtCond1.node.active = true;
                    this.txtCond1.string = `<color=#FF9336>${lv}</c>级开启`;
                    //隐藏挑战次数
                    this.enterSpr.node.parent.active = false;
                    this._canEnter = false;
                    this._enterStr = cfg.DialogText.replace(/\%levelnum/gi, lv.toString());
                    return;
                }
                break;
            case "2":
                let fID = Number(conditionArr[1]);
                let taskCfg = configUtils.getTaskByTaskId(fID);
                let completed = taskData.getTaskIsCompleted(Number(conditionArr[1]));
                if (taskCfg && !completed) {
                    let cfg = configUtils.getDialogCfgByDialogId(CustomDialogId.PVE_TASK_NO_MATCH);
                    this.txtCond2.node.active = true;
                    this.txtCond1.string = `完成任务<color=#FF9336>${taskCfg.TaskIntroduce}</c>开启`;
                    this.lockNode.active = true;
                    this.enterSpr.node.parent.active = false;

                    this._canEnter = false;
                    this._enterStr = cfg.DialogText.replace(/\%s/gi, taskCfg.TaskIntroduce);
                    return;
                }
                break;
            default:
                break;
        }
        this._canEnter = true;
        this.lockNode.active = false;
        this.enterSpr.node.parent.active = true;
    }
    /**
     * 开启条件展示
     */
    showOpenType() {
        let numShow = this._cfg.PVPListNumShow;
        if (numShow) {
            let num = bagData.getItemCountByID(numShow);
            let itemcfg = configUtils.getItemConfig(numShow);
            let url = `${RES_ICON_PRE_URL.BAG_ITEM}/${itemcfg.ItemIcon}`;
            this.enterNum.string = `${num}`;
            this._sprLoader.changeSprite(this.enterSpr, url)
            if (!num) {
                this.enterNum.node.color = cc.color(255, 0, 0);
                // 暂时不做挑战次数限制
                // this._canEnter = false;
                this._enterStr = `挑战次数不足。`;
            }
        }
    }

    onClickThis() {
        if (!this._canEnter) {
            guiManager.showTips(this._enterStr);
            return;
        }
        moduleUIManager.jumpToModule(this._cfg.PVPListFunctionId);
    }
}
