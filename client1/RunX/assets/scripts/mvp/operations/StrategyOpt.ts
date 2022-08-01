
import { eventCenter } from "../../common/event/EventCenter";
import { operationSvr } from "../../network/OperationSvr";
import { gamesvr } from "../../network/lib/protocol";
import { StrategyEvents } from "../../common/event/EventData";
import { BaseOpt } from "./BaseOpt";

class StrategyOpt extends BaseOpt {

    init() {
        this.registerAllEvent();
    }

    registerAllEvent() {
        this.addEventListener(gamesvr.CMD.EPOCH_STRATEGY_VIEW_STRONG_DEGREE_RES, this._recvEpochStrategyProgressRes);
        this.addEventListener(gamesvr.CMD.EPOCH_STRATEGY_VIEW_HERO_DEGREE_RES, this._recvEpochStrategyHeroRes);
    }

    sendEpochStrategyViewProgressReq() {
        let req = gamesvr.EpochStrategyViewStrongDegreeReq.create();
        operationSvr.send(req);
    }

    private _recvEpochStrategyProgressRes(recvMsg: { Result: number, Desc: string, Msg: gamesvr.IEpochStrategyViewStrongDegreeRes}) {
        if (!this._checkResValid(recvMsg)) {
            return;
        }
        let msg = recvMsg.Msg;
        eventCenter.fire(StrategyEvents.RECV_STRONG_RES, msg.DegreeMap);
    }

    sendEpochStrategyViewHeroReq(heroID: number) {
        let req = gamesvr.EpochStrategyViewHeroDegreeReq.create({
            HeroID: heroID
        });
        operationSvr.send(req);
    }

    private _recvEpochStrategyHeroRes(recvMsg: { Result: number, Desc: string, Msg: gamesvr.IEpochStrategyViewHeroDegreeRes}) {
        if (!this._checkResValid(recvMsg)) {
            return;
        }
        let msg = recvMsg.Msg;
        eventCenter.fire(StrategyEvents.RECV_HERO_RES, msg.HeroID, msg.EpochStrategyHeroUnit);
    }
}

let strategyOpt = new StrategyOpt();
export { strategyOpt }
