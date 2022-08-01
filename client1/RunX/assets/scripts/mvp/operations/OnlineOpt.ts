import { configManager } from "../../common/ConfigManager";
import { eventCenter } from "../../common/event/EventCenter";
import { onlineEvent } from "../../common/event/EventData";
import { cfg } from "../../config/config";
import { gamesvr } from "../../network/lib/protocol";
import { operationSvr } from "../../network/OperationSvr";
import { onlineData, ONLINE_ITEM_RESULT } from "../models/OnlineData";
import { BaseOpt } from "./BaseOpt";

class OnlineOpt extends BaseOpt{
    
    init() {
        this.registerAllEvent();
    }

    registerAllEvent() {
        this.addEventListener(gamesvr.CMD.ACTIVITY_ONLINE_REWARD_RECEIVE_REWARD_RES, this._reciveRewards);
    }

    sendGetRewardReq(ids:number[]) {
        let req = gamesvr.ActivityOnlineRewardReceiveRewardReq.create({
            ReceiveIDList: ids
        });
        operationSvr.send(req);
    }

    private _reciveRewards(recvMsg: { Result: number, Desc: string, Msg: gamesvr.ActivityOnlineRewardReceiveRewardRes }) {
        if (!this._checkResValid(recvMsg)) {
            return;
        }
        let data = recvMsg.Msg;
        eventCenter.fire(onlineEvent.ONLINE_REWARDS_RES, data);
    }
}

let onlineOpt = new OnlineOpt();
export { onlineOpt };