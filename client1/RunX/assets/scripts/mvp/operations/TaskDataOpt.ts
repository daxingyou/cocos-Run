import { configManager } from "../../common/ConfigManager";
import { eventCenter } from "../../common/event/EventCenter";
import { commonEvent, taskEvent } from "../../common/event/EventData";
import { logger } from "../../common/log/Logger";
import { cfg } from "../../config/config";
import { gamesvr } from "../../network/lib/protocol";
import { operationSvr } from "../../network/OperationSvr";
import { bagData } from "../models/BagData";
import { taskData } from "../models/TaskData";
import { userData } from "../models/UserData";
import { BaseOpt } from "./BaseOpt";

class TaskDataOpt extends BaseOpt {
    init() {
        this.addEventListener(gamesvr.CMD.TASK_TARGET_GROUP_COUNT_CHANGE_NOTIFY, this._recvTaskProcessCountChange);
        this.addEventListener(gamesvr.CMD.TASK_TARGET_RECEIVE_REWARD_RES, this._recvTaskReceiveReward);
        this.addEventListener(gamesvr.CMD.ACTIVITY_SEVEN_DAY_RECEIVE_TASK_REWARD_RES, this._recvSevenDayTaskReceiveReward);
        this.addEventListener(gamesvr.CMD.TREASURE_ACHIEVE_COUNT_CHANGE_NOTIFY, this._recvTreasureAchieveCountChangeNty);
        this.addEventListener(gamesvr.CMD.TREASURE_PROFIT_VALUE_CHANGE_NOTIFY, this._recvTreasureProfitChangeNty);
    }

    deInit() {

    }

    //更新宝物任务
    private _recvTreasureAchieveCountChangeNty(recvMsg: { Result: number, Desc: string, Msg: gamesvr.ITreasureAchieveCountChangeNotify}){
        if(!this._checkResValid(recvMsg)) {
            logger.error("_recvTreasureAchieveCountChangeNty recv error:", recvMsg);
            return;
        }

        taskData.updateTreasureTask([recvMsg.Msg]);

        //更新宝物属性加成
        let treasureCfg: cfg.LeadTreasure[] = configManager.getConfigByKV('leadTreasure', 'ConditionID', recvMsg.Msg.AchieveID);
        if(treasureCfg && treasureCfg.length > 0) {
           treasureCfg.forEach(ele => {
              bagData.updateTreasureProp(ele.ItemID);
           });
           userData.updateCapability();
        }
        eventCenter.fire(taskEvent.TREASURE_ACHIEVE_COUNT_NTY);
    }

    //更新宝物权益
    private _recvTreasureProfitChangeNty(recvMsg: { Result: number, Desc: string, Msg: gamesvr.ITreasureProfitValueChangeNotify}){
        if(!this._checkResValid(recvMsg)) {
            logger.error("_recvTreasureAchieveCountChangeNty recv error:", recvMsg);
            return;
        }

        taskData.updateTreasureProfit([recvMsg.Msg]);
    }

    private _recvTaskProcessCountChange(recvMsg: { Result: number, Desc: string, Msg: gamesvr.TaskTargetGroupCountChangeNotify }) {
        if(!this._checkResValid(recvMsg)) {
            logger.error("_recvTaskProcessCountChange recv error:", recvMsg);
            return;
        }
        let msg = recvMsg.Msg;

        let hasFinishedTasks: number[] = [];
        let groupIDMap: {[key: string]: boolean} = {};
        for (let key in msg.TargetGroupCountMap) {
            let v = msg.TargetGroupCountMap[key];
            v && (groupIDMap[key] = true);
        }
        let newTask = taskData.checkNewFinishedTask(groupIDMap);
        hasFinishedTasks.push(...newTask);

        taskData.updateTaskProgress(msg.TargetGroupCountMap);
        eventCenter.fire(taskEvent.CHANGE_PROGRESS, msg);

        // 新任务检测
        let newFinishedTask: number[] = [];
        newTask = taskData.checkNewFinishedTask(groupIDMap);
        newTask = newTask.filter(ele => {
            return hasFinishedTasks.indexOf(ele) == -1;
        });
        newFinishedTask.push(...newTask);

        if (newFinishedTask && newFinishedTask.length > 0) {
            eventCenter.fire(commonEvent.NEW_TASK_FINISHED, newFinishedTask);
        }
    }

    private _recvTaskReceiveReward(recvMsg: { Result: number, Desc: string, Msg: gamesvr.TaskTargetReceiveRewardRes }) {
        if(!this._checkResValid(recvMsg)) {
            logger.error("_recvTaskReceiveReward recv error:", recvMsg);
            return;
        }
        let msg = recvMsg.Msg;
        taskData.updateReward(msg.TargetIDList);
        eventCenter.fire(taskEvent.RECEIVE_REWARD, msg);
    }

    private _recvSevenDayTaskReceiveReward(recvMsg: { Result: number, Desc: string, Msg: gamesvr.ActivitySevenDayReceiveTaskRewardRes }) {
        if(!this._checkResValid(recvMsg)) {
            logger.error("_recvSevenDayTaskReceiveReward recv error:", recvMsg);
            return;
        }
        let msg = recvMsg.Msg;
        taskData.updateReward([msg.TargetID]);
        eventCenter.fire(taskEvent.RECEIVE_SEVEN_DAY_REWARD, msg);
    }

    sendReceiveTaskReward(taskId: number[]) {
        let seq = new gamesvr.TaskTargetReceiveRewardReq({
            TargetIDList: taskId
        });
        operationSvr.send(seq);
    }

    finishSevneDayTask(activityId: number, taskId: number) {
        operationSvr.send(gamesvr.ActivitySevenDayReceiveTaskRewardReq.create({
            ActivityID: activityId,
            TargetID: taskId
        }))
    }
}

let taskDataOpt = new TaskDataOpt();
export {
    taskDataOpt
}
