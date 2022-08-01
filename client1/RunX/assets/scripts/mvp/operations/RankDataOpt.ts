import { eventCenter } from "../../common/event/EventCenter";
import { rankViewEvent } from "../../common/event/EventData";
import { gamesvr } from "../../network/lib/protocol";
import { operationSvr } from "../../network/OperationSvr";
import { taskData } from "../models/TaskData";
import { BaseOpt } from "./BaseOpt";

class RankDataOpt extends BaseOpt {
    init() {
        this.addEventListener(gamesvr.CMD.RANK_POWER_FIVE_HERO_GET_LIST_RES, this._recvGetFiveRankRes);
        this.addEventListener(gamesvr.CMD.RANK_POWER_TOTAL_HERO_GET_LIST_RES, this._recvGetAllRankRes);
        this.addEventListener(gamesvr.CMD.RANK_POWER_ONE_HERO_GET_LIST_RES, this._recvGetOneRankRes);
        this.addEventListener(gamesvr.CMD.RANK_HOME_PAGE_GET_FIRST_RES, this._recvGetRankHomeRes);
        this.addEventListener(gamesvr.CMD.RANK_PVE_ADVENTURE_SCALE_GET_LIST_RES, this._recvGetPveAdventureRes);
        this.addEventListener(gamesvr.CMD.RANK_PVE_DREAM_SCALE_GET_LIST_RES, this._recvGetPveDreamListRes);
        this.addEventListener(gamesvr.CMD.RANK_TRIAL_PURGATORY_SCALE_GET_LIST_RES, this._recvRankTrialPurgatoryScaleGetListRes);
        this.addEventListener(gamesvr.CMD.EPOCH_REWARD_VIEW_REWARD_RES, this._recvEpochRewardViewRewardRes);
        this.addEventListener(gamesvr.CMD.EPOCH_REWARD_RECEIVE_REWARD_RES, this._recvEpochRewardReceivedRewardRes);
    }

    deInit() {
    }

    _recvGetFiveRankRes(recvMsg: { Result: number, Desc: string, Msg: gamesvr.RankPowerFiveHeroGetListRes }) {
        if (!this._checkResValid(recvMsg)) {
            return;
        }
        let msg = recvMsg.Msg;
        eventCenter.fire(rankViewEvent.RECV_FIVE_RANK_RES, msg);
    }

    _recvGetAllRankRes(recvMsg: { Result: number, Desc: string, Msg: gamesvr.RankPowerTotalHeroGetListRes }) {
        if (!this._checkResValid(recvMsg)) {
            return;
        }
        let msg = recvMsg.Msg;
        eventCenter.fire(rankViewEvent.RECV_ALL_RANK_RES, msg);
    }

    _recvGetOneRankRes(recvMsg: { Result: number, Desc: string, Msg: gamesvr.RankPowerOneHeroGetListRes }) {
        if (!this._checkResValid(recvMsg)) {
            return;
        }
        let msg = recvMsg.Msg;
        eventCenter.fire(rankViewEvent.RECV_ONE_RANK_RES, msg);
    }

    sendGetFiveRankReq() {
        let req = gamesvr.RankPowerFiveHeroGetListReq.create();
        operationSvr.send(req);
    }

    sendGetAllRankReq() {
        let req = gamesvr.RankPowerTotalHeroGetListReq.create();
        operationSvr.send(req);
    }

    sendGetOneRankReq() {
        let req = gamesvr.RankPowerOneHeroGetListReq.create();
        operationSvr.send(req);
    }

    // 获取排行榜主页数据
    sendGetRankHome() {
        let req = gamesvr.RankHomePageGetFirstReq.create();

        operationSvr.send(req);
    }

    private _recvGetRankHomeRes(recvMsg: { Result: number, Desc: string, Msg: gamesvr.IRankHomePageGetFirstRes }) {
        if (!this._checkResValid(recvMsg)) {
            return;
        }
        eventCenter.fire(rankViewEvent.REVE_RANK_HOME_RES, recvMsg.Msg);
    }

    // 获取主线冒险排行榜
    sendGetRankPveAdventuresReq() {
        let req = gamesvr.RankPveAdventureScaleGetListReq.create();

        operationSvr.send(req);
    }

    private _recvGetPveAdventureRes(recvMsg: { Result: number, Desc: string, Msg: gamesvr.IRankPveAdventureScaleGetListRes }) {
        if (!this._checkResValid(recvMsg)) {
            return;
        }
        eventCenter.fire(rankViewEvent.RECV_ADVENTURE_LIST_RES, recvMsg.Msg);
    }

    // 获取太虚幻境排行榜
    sendGetRankPveDreamListReq() {
        let req = gamesvr.RankPveDreamScaleGetListReq.create();
        operationSvr.send(req);
    }

    private _recvGetPveDreamListRes(recvMsg: { Result: number, Desc: string, Msg: gamesvr.IRankPveDreamScaleGetListRes }) {
        if (!this._checkResValid(recvMsg)) {
            return;
        }
        eventCenter.fire(rankViewEvent.RECV_DREAM_LIST_RES, recvMsg.Msg);
    }

    // 获取无间炼狱排行榜
    sendRankTrialPurgatoryScaleGetListReq() {
        let req = gamesvr.RankTrialPurgatoryScaleGetListReq.create();
        operationSvr.send(req);
    }

    private _recvRankTrialPurgatoryScaleGetListRes(recvMsg: { Result: number, Desc: string, Msg: gamesvr.IRankTrialPurgatoryScaleGetListRes }) {
        if (!this._checkResValid(recvMsg)) {
            return;
        }

        eventCenter.fire(rankViewEvent.RECV_PURGATORY_LIST_RES, recvMsg.Msg);
    }

    // 获取全服奖励状态
    sendEpochRewardViewRewardReq(rankType: number) {
        let req = gamesvr.EpochRewardViewRewardReq.create({
            ThemeID: rankType
        });

        operationSvr.send(req);
    }

    private _recvEpochRewardViewRewardRes(recvMsg: { Result: number, Desc: string, Msg: gamesvr.IEpochRewardViewRewardRes }) {
        if (!this._checkResValid(recvMsg)) {
            return;
        }

        eventCenter.fire(rankViewEvent.RECV_RANK_REWARD, recvMsg.Msg);
    }

    sendEpochRewardReceivedReewardReq(items: number[]) {
        let req = gamesvr.EpochRewardReceiveRewardReq.create({
           RankRewardIDList: items,
        });

        operationSvr.send(req);
    }

    private _recvEpochRewardReceivedRewardRes(recvMsg: { Result: number, Desc: string, Msg: gamesvr.IEpochRewardReceiveRewardRes }) {
        if (!this._checkResValid(recvMsg)) {
          return;
        }

        let msg = recvMsg.Msg;
        taskData.updateRankRewardData(msg.RankRewardIDList);
        eventCenter.fire(rankViewEvent.RECV_TAKE_RANK_REWARD, recvMsg.Msg);
    }

}

export let rankDataOpt = new RankDataOpt();
