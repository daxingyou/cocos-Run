import { eventCenter } from "../../common/event/EventCenter";
import { divineEvent, testEvent } from "../../common/event/EventData";
import { data, gamesvr } from "../../network/lib/protocol";
import { operationSvr } from "../../network/OperationSvr";
import { BaseOpt } from "./BaseOpt";

// interface MeasureRole {
//     Equip: string,
//     Gift: number[],
//     Pos: number,
//     Role: number,
//     Star: number,
// }

// interface MeasureCfg {
//     Ref: number,
//     TeamSelf: MeasureRole[],
//     TeamEmeny: MeasureRole[],
// }

// interface MeasureResCfg {
//     HP: number,
//     ID: number,
//     Power: number,
//     Round: number,
//     Shiled: number,
//     Time: number,

//     Buff: {
//         ID: number,
//         Count: number,
//     }[],
//     Property: {
//         ID:number,
//         Value: number,
//     }[]
// }


class BattleTestOpt extends BaseOpt {
    init() {
        this.addEventListener(gamesvr.CMD.BATTLE_MEASURE_RES, this._onMessageNotify);
    }

    reqTest (strInfo: any) {
        let data:data.IMeasureBattleCfg[] = []
        for (let i = 0; i < strInfo.length; i++) {
            let msg = {} as data.IMeasureBattleCfg
            let v = strInfo[i]
            msg.Ref = v.Ref;
            msg.Team = []; 
            if (v.TeamSelf) {
                msg.Team.push(v.TeamSelf)
            }

            if (v.TeamEmeny) {
                msg.Team.push(v.TeamEmeny)
            }
            data[i] = msg
        }
        this._send(data)
    }

    //转化格式
    private _send(origin: data.IMeasureBattleCfg[]) {
        let chatReq = gamesvr.BattleMeasureReq.create({
            BattleCfg: origin,
        })
        operationSvr.send(chatReq);
    }

    //收到即时消息
    private _onMessageNotify(recvMsg: { Result: number, Desc: string, Msg: gamesvr.IBattleMeasureRes}) {
        eventCenter.fire(testEvent.EVENT_SKILL_TEST, recvMsg.Msg);
    }
    
}

let battleTestOpt = new BattleTestOpt();
export { battleTestOpt }
