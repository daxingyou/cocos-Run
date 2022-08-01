import { eventCenter } from "../../common/event/EventCenter";
import { mainTaskEvent } from "../../common/event/EventData";
import { gamesvr } from "../../network/lib/protocol";
import { operationSvr } from "../../network/OperationSvr";
import { BaseOpt } from "./BaseOpt";

class MainTaskOpt extends BaseOpt {
    
    init() {
        this.registerAllEvent();
    }

    registerAllEvent() {
        this.addEventListener(gamesvr.CMD.TASK_MAIN_RECEIVE_REWARD_RES, this._reciveRewards);
    }

    seqTargerReward(taskId:number) {
        let req = gamesvr.TaskMainReceiveRewardReq.create({
            TaskMainID: taskId,
        });
        operationSvr.send(req);
    }

    private _reciveRewards(recvMsg: { Result: number, Desc: string, Msg: gamesvr.TaskMainReceiveRewardRes }) {
        if (!this._checkResValid(recvMsg)) {
            return;
        }
        let data = recvMsg.Msg;
        eventCenter.fire(mainTaskEvent.MAIN_TASK_RES, data);
    }
}

let mainTaskOpt = new MainTaskOpt();
export {
    mainTaskOpt
}