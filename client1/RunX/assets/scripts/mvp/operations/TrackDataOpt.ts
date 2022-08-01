import { eventCenter } from "../../common/event/EventCenter";
import { gachaEvent} from "../../common/event/EventData";
import { gamesvr } from "../../network/lib/protocol";
import { operationSvr } from "../../network/OperationSvr";
import { trackData } from "../models/TrackData";
import { BaseOpt } from "./BaseOpt";

class TrackDataOpt extends BaseOpt {

    init() {
        this.addEventListener(gamesvr.CMD.GACHA_CARD_RES, this._receieveGachaRes);
        this.addEventListener(gamesvr.CMD.SAVE_SIMULATE_RES, this._receieveGachaSaveSimulateRes);
        this.addEventListener(gamesvr.CMD.GACHA_SIMULATE_RES, this._receieveGachaSimulateRes);
        this.addEventListener(gamesvr.CMD.SELECT_SIMULATE_RES, this._receieveSelectSimulateRes);
        this.addEventListener(gamesvr.CMD.CARD_POOL_STATUS_NOTIFY, this._updateCardPool);
        this.addEventListener(gamesvr.CMD.BUY_BATTLE_PASS_RES, this._receieveBuyBattlePassRes);
        this.addEventListener(gamesvr.CMD.SUMMON_CARD_COUNT_NOTIFY, this._updateGachaCountNotify);
        this.addEventListener(gamesvr.CMD.TREASURE_PROFIT_CARD_POOL_RECORD_CHANGE_NOTIFY, this._updatePoolRecordNty);
    }

    deInit() {
    }

    reqGachaDraw (summonId: number, count: number) {
        let req: gamesvr.GachaCardReq = gamesvr.GachaCardReq.create({
            GachaID: summonId,
            GachaCount: count,
        })
        operationSvr.send(req);
    }
    
    /**
     * @description 单抽/十抽 res
     * @param recvMsg 
     * @returns 
     */
     private _receieveGachaRes (recvMsg: { Result: number, Desc: string, Msg: gamesvr.GachaCardRes}) {
        if (!this._checkResValid(recvMsg)) {
            return;
        }
        let msg = recvMsg.Msg;
        trackData.updateRecord(msg.GachaID.toString(), recvMsg.Msg.GachaRecord)
        eventCenter.fire(gachaEvent.GACHA_RES, recvMsg.Msg);
        
    }
    
    reqSelectGachaSimulate (summonId: number, seq: number) {
        let req: gamesvr.SelectSimulateReq = gamesvr.SelectSimulateReq.create({
            GachaID: summonId,
            Seq: seq
        })
        operationSvr.send(req);
    }

     /**
     * @description 【二十连斩】确认结果 res
     * @param recvMsg 
     * @returns 
     */
    private _receieveSelectSimulateRes (recvMsg: { Result: number, Desc: string, Msg: gamesvr.SelectSimulateRes}) {
        if (!this._checkResValid(recvMsg)) {
            return;
        }
        let res = recvMsg.Msg;
        trackData.updateRecord(res.GachaID.toString(), res.GachaRecord)
        eventCenter.fire(gachaEvent.SELECT_SIMULATE_RES, recvMsg.Msg);
    }

    reqGachaSimulate (summonId: number) {
        let req: gamesvr.GachaSimulateReq = gamesvr.GachaSimulateReq.create({
            GachaID: summonId,
        })
        operationSvr.send(req);
    }
   
    /**
     * @description 【二十连斩】模拟结果 res
     * @param recvMsg 
     * @returns 
     */
    private _receieveGachaSimulateRes (recvMsg: { Result: number, Desc: string, Msg: gamesvr.GachaSimulateRes}) {
        if (!this._checkResValid(recvMsg)) {
            return;
        }

        let res = recvMsg.Msg;
        trackData.updateRecord(res.GachaID.toString(), res.GachaRecord)
        eventCenter.fire(gachaEvent.SIMULATE_RES, recvMsg.Msg);
    }

    reqSaveGachaSimulate (summonId: number, seq: number) {
        let req: gamesvr.SaveSimulateReq = gamesvr.SaveSimulateReq.create({
            GachaID: summonId,
            Seq: seq
        })
        operationSvr.send(req);
    }

    /**
     * @description 【二十连斩】暂存结果 res
     * @param recvMsg 
     * @returns 
    */
    private _receieveGachaSaveSimulateRes (recvMsg: { Result: number, Desc: string, Msg: gamesvr.SaveSimulateRes}) {
        if (!this._checkResValid(recvMsg)) {
            return;
        }
        let res = recvMsg.Msg;
        trackData.updateSaveSimulate(res.GachaID.toString(), res.SimulateRecord);
        eventCenter.fire(gachaEvent.SAVE_SIMULATE_RES, recvMsg.Msg);
    }

    reqBuyBattlePass () {
        let req: gamesvr.BuyBattlePassReq = gamesvr.BuyBattlePassReq.create({
        
        })
        operationSvr.send(req);
    }

    /**
     * @description 【二十连斩】暂存结果 res
     * @param recvMsg 
     * @returns 
    */
    private _receieveBuyBattlePassRes (recvMsg: { Result: number, Desc: string, Msg: gamesvr.BuyBattlePassRes}) {
        if (!this._checkResValid(recvMsg)) {
            return;
        }
        let res = recvMsg.Msg;
        trackData.updateBattlePass(true);
        eventCenter.fire(gachaEvent.BUY_BATTLEPASS_RES, recvMsg.Msg);
    }

    /**
     * @description 奖池更新notify
     * @param recvMsg 
     * @returns 
    */
    private _updateCardPool (recvMsg: { Result: number, Desc: string, Msg: gamesvr.CardPoolStatusNotify}) {
        let newRecord = recvMsg.Msg.GachaRecord;
        let key = recvMsg.Msg.GachaID;
        trackData.updateRecord(key.toString(), newRecord);
    }

    private _updateGachaCountNotify (recvMsg: { Result: number, Desc: string, Msg: gamesvr.SummonCardCountNotify}) {
        let msg = recvMsg.Msg;
        trackData.updateCardLimit(msg.GachaID.toString(), msg.GachaCount)
    }

    //宝物对二十连斩进度的修改
    private _updatePoolRecordNty(recvMsg: { Result: number, Desc: string, Msg: gamesvr.ITreasureProfitCardPoolRecordChangeNotify}) {
        if (!this._checkResValid(recvMsg)) {
            return;
        }

        let msg = recvMsg.Msg;
        trackData.updateCardContinuousDraw(`${msg.CardID}`,  msg.Value)
    }

}

let trackDataOpt = new TrackDataOpt();
export { trackDataOpt }