import { configUtils } from "../../../app/ConfigUtils";
import ButtonEx from "../../../common/components/ButtonEx";
import { logger } from "../../../common/log/Logger";
import moduleUIManager from "../../../common/ModuleUIManager";
import { taskData } from "../../models/TaskData";
import { taskDataOpt } from "../../operations/TaskDataOpt";
import ItemDoubleWeekBase from "./ItemDoubleWeekBase";

const {ccclass, property} = cc._decorator;

@ccclass
export default class ItemDoubleWeekTask extends ItemDoubleWeekBase {
    @property(cc.Label) taskIntroduce: cc.Label = null;
    @property(ButtonEx) getRewardBtn: ButtonEx = null;
    @property(cc.Node) rewarded: cc.Node = null;
    @property(cc.Label) progressTips: cc.Label = null;
    @property(ButtonEx) jumpBtn: ButtonEx = null;

    private _taskId: number = 0;
    init(taskId: number, loadView: Function) {
        this._taskId = taskId;
        this.baseInit(loadView);
        this._refreshView();
    }

    private _refreshView() {
        try {
            const taskCfg = configUtils.getTaskByTaskId(this._taskId);
            this.taskIntroduce.string = `${taskCfg.TaskIntroduce}`;
            this._refreshReward(taskCfg.TaskRewardShow);

            const isCompleted = taskData.getTaskIsCompleted(this._taskId);
            const isRewarded = taskData.getTaskIsReceiveReward(this._taskId);
            this.progressTips.node.active = !isCompleted;
            const isJump = !!taskCfg.TaskJump;
            this.jumpBtn.setActivity(isJump && !isCompleted);
            this.progressTips.node.active = !isJump && !isCompleted;
            if(!isCompleted && !isJump) {
                const curCount = taskData.getTaskGroupCompletedCount(this._taskId);
                this.progressTips.string = `${curCount}/${taskCfg.TargetGoalParam}`;
            }
            this.getRewardBtn.setActivity(isCompleted && !isRewarded);
            this.rewarded.active = isRewarded;
        } catch(err) {
            logger.error('ItemDoubleWeekTask _refreshView error: ', err, 'taskId: ', this._taskId);
        }
    }

    onClickReceiveBtn() {
        taskDataOpt.sendReceiveTaskReward([this._taskId]);
    }

    onClickJumpBtn() {
        const taskCfg = configUtils.getTaskByTaskId(this._taskId);
        const jump = taskCfg.TaskJump.split(';');
        const moduleId = Number(jump[0]);
        const partId = Number(jump[1]);
        moduleUIManager.jumpToModule(moduleId, partId);
    }

}
