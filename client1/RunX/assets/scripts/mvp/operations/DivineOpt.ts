import { eventCenter } from "../../common/event/EventCenter";
import { divineEvent } from "../../common/event/EventData";
import { logger } from "../../common/log/Logger";
import { gamesvr } from "../../network/lib/protocol";
import { operationSvr } from "../../network/OperationSvr";
import { divineData } from "../models/DivineData";
import { BaseOpt } from "./BaseOpt";

class DivineOpt extends BaseOpt {
    init() {
        this.addEventListener(gamesvr.CMD.DIVINE_EXPEDITION_JOIN_RES, this._recvDispatchSuc);
        this.addEventListener(gamesvr.CMD.DIVINE_EXPEDITION_RECEIVE_REWARD_RES, this._recvReceiveReward);
        this.addEventListener(gamesvr.CMD.DIVINE_EXPEDITION_RESET_TASK_RES, this._recvRefreshList);
        this.addEventListener(gamesvr.CMD.DIVINE_EXPEDITION_RECALL_RES, this._recvCancelTask);
        this.addEventListener(gamesvr.CMD.DIVINE_EXPEDITION_REFRESH_TASK_NOTIFY, this._recvRefreshTaskNotify);
    }

    deInit() {
    }

    private _recvDispatchSuc(recvMsg: { Result: number, Desc: string, Msg: gamesvr.DivineExpeditionJoinRes }) {
        if(!this._checkResValid(recvMsg)) {
            logger.error("_recvDispatchSuc recv error:", recvMsg);
            return;
        }
        let msg = recvMsg.Msg;
        divineData.updateTasksList(msg.DivineExpeditionTaskMap);
        eventCenter.fire(divineEvent.DISPATCH_SUC_EVENT);
    }

    sendDispatch(tasksList: gamesvr.IDivineExpeditionJoinTask[]) {
        let req = new gamesvr.DivineExpeditionJoinReq({
            DivineExpeditionJoinTaskList: tasksList
        });
        operationSvr.send(req);
    }

    private _recvReceiveReward(recvMsg: { Result: number, Desc: string, Msg: gamesvr.DivineExpeditionReceiveRewardRes }) {
        if(!this._checkResValid(recvMsg)) {
            logger.error("_recvTaskProcessCountChange recv error:", recvMsg);
            return;
        }
        let msg = recvMsg.Msg;
        divineData.receiveReward(msg);
        eventCenter.fire(divineEvent.RECEIVE_REWARD, msg.Prizes);
    }
    
    sendReceiveReward(taskList: number[]) {
        let req = new gamesvr.DivineExpeditionReceiveRewardReq({
            ReceiveSeqList: taskList
        });
        operationSvr.send(req);
    }

    private _recvRefreshList(recvMsg: { Result: number, Desc: string, Msg: gamesvr.DivineExpeditionResetTaskRes }) {
        if(!this._checkResValid(recvMsg)) {
            logger.error("_recvRefreshList recv error:", recvMsg);
            return;
        }
        let msg = recvMsg.Msg;
        divineData.addTasks(msg);
        eventCenter.fire(divineEvent.RECV_TASK_LIST);
    }

    sendRefreshList() {
        let req = new gamesvr.DivineExpeditionResetTaskReq();
        operationSvr.send(req);
    }

    private _recvCancelTask(recvMsg: { Result: number, Desc: string, Msg: gamesvr.DivineExpeditionRecallRes }) {
        if(!this._checkResValid(recvMsg)) {
            logger.error("_recvRefreshList recv error:", recvMsg);
            return;
        }
        let msg = recvMsg.Msg;
        divineData.cancelTasks(msg.Seq);
        eventCenter.fire(divineEvent.CANCEL_TASK_SUC, Number(msg.Seq));
    }

    sendCancelTask(taskId: number) {
        let req = new gamesvr.DivineExpeditionRecallReq({
            Seq: taskId
        });
        operationSvr.send(req);
    }

    private _recvRefreshTaskNotify(recvMsg: { Result: number, Desc: string, Msg: gamesvr.DivineExpeditionRefreshTaskNotify }) {
        if(!this._checkResValid(recvMsg)) {
            logger.error("_recvRefreshList recv error:", recvMsg);
            return;
        }
        let msg = recvMsg.Msg;
        divineData.updateTasksList(msg.DivineExpeditionTaskMap);
        eventCenter.fire(divineEvent.RECV_TASK_LIST);
    }
}
let divineOpt = new DivineOpt();
export {
    divineOpt,
}
