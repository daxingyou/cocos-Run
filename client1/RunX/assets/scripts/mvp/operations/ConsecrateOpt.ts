
import { eventCenter } from "../../common/event/EventCenter";
import { ConsecrateEvents, useInfoEvent } from "../../common/event/EventData";
import { gamesvr } from "../../network/lib/protocol";
import { operationSvr } from "../../network/OperationSvr";
import { consecrateData } from "../models/ConsecrateData";
import { BaseOpt } from "./BaseOpt";

class ConsecrateOpt extends BaseOpt {
    public init(): void {
        super.init();
        this._addEvent();
    }

    public deInit(): void {

    }

    private _addEvent() {
        this.addEventListener(gamesvr.CMD.UNIVERSAL_CONSECRATE_PUT_ON_TRIBUTE_RES, this._onRecvPutOnTribute);
        this.addEventListener(gamesvr.CMD.UNIVERSAL_CONSECRATE_PUT_OFF_TRIBUTE_RES, this._onRecvPutOffTribute);
        this.addEventListener(gamesvr.CMD.UNIVERSAL_CONSECRATE_SPEED_UP_TRIBUTE_RES, this._onRecvSpeedUpTribute);
        this.addEventListener(gamesvr.CMD.UNIVERSAL_CONSECRATE_RECEIVE_TRIBUTE_REWARD_RES, this._onRecvGetRewardTribute);
        this.addEventListener(gamesvr.CMD.UNIVERSAL_CONSECRATE_RECEIVE_STATUE_LEVEL_REWARD_RES, this._onRecvGetRewardStatue);
        this.addEventListener(gamesvr.CMD.UNIVERSAL_CONSECRATE_RECEIVE_STATUE_BEFALL_REWARD_RES, this._onRecvGetRewardStatueRefall);
    }

    //添加贡品
    private _onRecvPutOnTribute(recvMsg: { Result: number, Desc: string, Msg: gamesvr.UniversalConsecratePutOnTributeRes}) {
        if (!this._checkResValid(recvMsg)) {
            return;
        }

        let msg = recvMsg.Msg;
        consecrateData.addTribute(msg.StatueType, msg.UniversalConsecrateTributeUnit);
        eventCenter.fire(ConsecrateEvents.RECV_ADD_TRIBUTE, msg.StatueType, msg.UniversalConsecrateTributeUnit)
    }

    //取消贡品
    private _onRecvPutOffTribute(recvMsg: { Result: number, Desc: string, Msg: gamesvr.UniversalConsecratePutOffTributeRes}) {
        if (!this._checkResValid(recvMsg)) {
            return;
        }

        let msg = recvMsg.Msg;
        consecrateData.updateTributeList(msg.StatueType, msg.UniversalConsecrateTributeList, msg.TributePos);
        eventCenter.fire(ConsecrateEvents.RECV_REMOVE_TRIBUTE, msg.StatueType)
    }

    //贡品加速
    private _onRecvSpeedUpTribute(recvMsg: { Result: number, Desc: string, Msg: gamesvr.UniversalConsecrateSpeedUpTributeRes}) {
        if (!this._checkResValid(recvMsg)) {
            return;
        }
        let msg = recvMsg.Msg;
        consecrateData.updateTributeList(msg.StatueType, msg.UniversalConsecrateTributeList);
        eventCenter.fire(ConsecrateEvents.RECV_SPEED_TRIBUTE, msg.StatueType);
    }

    //领取贡品奖励
    private _onRecvGetRewardTribute(recvMsg: { Result: number, Desc: string, Msg: gamesvr.UniversalConsecrateReceiveTributeRewardRes}) {
        if (!this._checkResValid(recvMsg)) {
            return;
        }
        let msg = recvMsg.Msg;
        consecrateData.updateStatue(msg);
        let exp = msg.Exp;
        //有经验加成
        if(exp) {
            eventCenter.fire(useInfoEvent.GAME_EXP_ADD, null,  msg.TotalExp);
        }
        eventCenter.fire(ConsecrateEvents.RECV_TAKE_TRIBUTE_REWARD, msg.StatueType, msg.Prizes, exp);
    }

    //领取雕像奖励
    private _onRecvGetRewardStatue(recvMsg: { Result: number, Desc: string, Msg: gamesvr.UniversalConsecrateReceiveStatueLevelRewardRes}) {
        if (!this._checkResValid(recvMsg)) {
            return;
        }

        let msg = recvMsg.Msg;
        consecrateData.updateStatueLevelReward(msg.StatueType, msg.ReceiveLevel);
        let exp = msg.Exp;
        //有经验加成
        if(exp) {
            eventCenter.fire(useInfoEvent.GAME_EXP_ADD, null,  msg.TotalExp);
        }
        eventCenter.fire(ConsecrateEvents.RECV_TAKE_LV_REWARD, msg.StatueType, msg.ReceiveLevel, msg.Prizes, exp);
    }

    //领取信仰（雕像降临）奖励
    private _onRecvGetRewardStatueRefall(recvMsg: { Result: number, Desc: string, Msg: gamesvr.UniversalConsecrateReceiveStatueBefallRewardRes}) {
        if (!this._checkResValid(recvMsg)) {
            return;
        }

        let msg = recvMsg.Msg;
        consecrateData.updateStatueRefallReward(msg.StatueType, msg.ReceiveBefallRewardCount, msg.RandomBefallRewardIndexList);
        let exp = msg.Exp;
        //有经验加成
        if(exp) {
            eventCenter.fire(useInfoEvent.GAME_EXP_ADD, null,  msg.TotalExp);
        }
        eventCenter.fire(ConsecrateEvents.RECV_TAKE_BEFALL_REWARD, msg.StatueType, msg.Prizes, exp);
    }

    //添加贡品
    sendPutOnTributeReq(statueType: number, tributeID: number) {
        let req = gamesvr.UniversalConsecratePutOnTributeReq.create({
            StatueType: statueType,
            TributeItemID: tributeID
        });
        operationSvr.send(req);
    }

    //取消贡品
    sendPutOffTributeReq(statueType: number, pos: number) {
        let req = gamesvr.UniversalConsecratePutOffTributeReq.create({
            StatueType: statueType,
            TributePos: pos
        });
        operationSvr.send(req);
    }

    //贡品加速
    sendSpeedUpTributeReq(statueType: number, flag: boolean) {
        let req = gamesvr.UniversalConsecrateSpeedUpTributeReq.create({
            StatueType: statueType,
            SpeedUpFlag: flag
        });
        operationSvr.send(req);
    }

    //领取贡品奖励
    sendGetRewardOfTributeReq(statueType: number) {
        let req = gamesvr.UniversalConsecrateReceiveTributeRewardReq.create({
            StatueType: statueType,
        });
        operationSvr.send(req);
    }

    //领取雕像等级奖励
    sendGetRewardOfStatueLvReq(statueType: number, lv: number) {
        let req = gamesvr.UniversalConsecrateReceiveStatueLevelRewardReq.create({
            StatueType: statueType,
            ReceiveLevel: lv
        });
        operationSvr.send(req);
    }

    //领取信仰奖励
    sendGetRewardOfStatusRefallReq(statueType: number, rewardIdx: number) {
        let req = gamesvr.UniversalConsecrateReceiveStatueBefallRewardReq.create({
            StatueType: statueType,
            ReceiveBefallRewardIndex: rewardIdx
        });
        operationSvr.send(req);
    }
}

let consecrateOpt = new ConsecrateOpt();
export {
    consecrateOpt
}
