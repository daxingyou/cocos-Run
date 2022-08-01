import { eventCenter } from "../../common/event/EventCenter";
import { operationSvr } from "../../network/OperationSvr";
import { data, gamesvr } from "../../network/lib/protocol";
import { commonEvent, hangUpEvent, useInfoEvent } from "../../common/event/EventData";
import { configUtils } from "../../app/ConfigUtils";
import { BaseOpt } from "./BaseOpt";
import { userData } from "../models/UserData";
import { logger } from "../../common/log/Logger";
import { friendData } from "../models/FriendData";
import { pveTrialData } from "../models/PveTrialData";
import { pveDataOpt } from "./PveDataOpt";

class UserOpt extends BaseOpt {

    init() {
        this.registerAllEvent();
    }

    registerAllEvent() {
        this.addEventListener(gamesvr.CMD.CHANGE_NAME_RES, this._onRecvChangeNameRes);
        this.addEventListener(gamesvr.CMD.CHANGE_HEAD_RES, this._onRecvChangeHeadRes);
        this.addEventListener(gamesvr.CMD.SYSTEM_MESSAGE_NOTIFY, this._onRecvSystemMessage);
        this.addEventListener(gamesvr.CMD.EXCHANGE_CODE_USE_RES, this._onRecvUseExchangeRes);
        this.addEventListener(gamesvr.CMD.UNIVERSAL_SAGE_CHOSEN_ROAD_RES, this._onRecvUniversalRes);

        this.addEventListener(gamesvr.CMD.UNIVERSAL_HANG_UP_GAIN_PREVIEW_REWARD_RES, this._onRecvHangUpPreviewRes);
        this.addEventListener(gamesvr.CMD.UNIVERSAL_HANG_UP_GAIN_RECEIVE_REWARD_RES, this._onRecvHangUpRewardRes);
        this.addEventListener(gamesvr.CMD.UNIVERSAL_HANG_UP_GAIN_CHAPTER_CHANGE_NOTIFY, this._onRecvHangUpChapterNotify);
        this.addEventListener(gamesvr.CMD.UNIVERSAL_HANG_UP_GAIN_FAST_HANG_UP_RES, this._recvUniversalHangUpGainFastHangUpRes);
        this.addEventListener(gamesvr.CMD.UNIVERSAL_VIEW_USER_INFORM_RES, this._recvUniversalViewUserInfo);

        this.addEventListener(gamesvr.CMD.USERDATA_REFRESH_NOTIFY, this._onRecvUserdataRefreshNotify);

        eventCenter.register(useInfoEvent.GAME_EXP_ADD, this, this._addGameExp);
    }

    private _onRecvChangeNameRes(recvMsg: { Result: number, Desc: string, Msg: gamesvr.ChangeNameRes }) {
        // if (!this._checkResValid(recvMsg)) {
        //     return;
        // }
        let msg = recvMsg.Msg;
        let name = msg.Name;
        name && userData.updateUsrName(name);
        eventCenter.fire(useInfoEvent.USER_NAME_CHANGE, recvMsg);
    }

    private _onRecvChangeHeadRes(recvMsg: { Result: number, Desc: string, Msg: gamesvr.ChangeHeadRes }) {
        if (!this._checkResValid(recvMsg)) {
            return;
        }
        let msg = recvMsg.Msg;
        let headID: number = msg.HeadID;
        let frameID: number = msg.HeadFrameID;
        userData.updateUsrHead(headID);
        userData.updateUsrFrame(frameID);
        eventCenter.fire(useInfoEvent.USER_HEAD_CHANGE);
    }

    private _onRecvSystemMessage(recvMsg: { Result: number, Desc: string, Msg: gamesvr.SystemMessageNotify }){
        if (!this._checkResValid(recvMsg)) {
            return;
        }
        let msg = recvMsg.Msg;
        if (msg)
        {
            userData.putSystemMsg(msg);
            eventCenter.fire(useInfoEvent.USER_MSG_NOTIFY, msg);
        }
    }

    private _addGameExp(cmd: any, totalExp: number) {
        if (totalExp){
            userData.updateExp(totalExp);
        }
    }


    private _onRecvUseExchangeRes(recvMsg: { Result: number, Desc: string, Msg: gamesvr.ExchangeCodeUseRes}){
        if (!this._checkResValid(recvMsg)) {
            return;
        }
        let msg = recvMsg.Msg;
        if (msg) {
            eventCenter.fire(useInfoEvent.USE_EXCHANGE_CODE, msg.Prizes);
        }
    }

    private _onRecvUniversalRes(recvMsg: { Result: number, Desc: string, Msg: gamesvr.UniversalSageChosenRoadRes}){
        if (!this._checkResValid(recvMsg)) {
            return;
        }
        let msg = recvMsg.Msg;
        if (msg) {
            userData.updateUniversalState();
            if (msg.Name) userData.updateUsrName(msg.Name, true);
            if (msg.Prizes) eventCenter.fire(useInfoEvent.SAGE_QA_RES, msg.Prizes);
        }
    }

    reqChangeHead(headID: number, frameID: number) {
        let findConfig = configUtils.getHeadConfig(headID);
        let findConfig1 = configUtils.getHeadConfig(frameID);
        if (!findConfig || !findConfig1) {
            logger.error(`当前HeadID[${headID}]/FrameID[${frameID}]不合法！`);
            return;
        }
        let sendData: gamesvr.ChangeHeadReq = gamesvr.ChangeHeadReq.create({
            HeadFrameID: frameID,
            HeadID: headID
        })
        operationSvr.send(sendData);
    }

    reqChangeName(name: string) {
        let sendData: gamesvr.ChangeNameReq = gamesvr.ChangeNameReq.create({
            Name: name
        })
        operationSvr.send(sendData);
    }

    sendCapabilityChange(preNum: number, endNum: number) {
        eventCenter.fire(commonEvent.CAPABILITY_CHANGE, preNum, endNum);
    }

    addBlockList(user: data.IOtherData) {
        friendData.addBlockList(user);
    }

    removeBlockList(userid: string) {
        friendData.removeBlockList(userid);
    }

    useExchangeCode(code: string){
        let req = gamesvr.ExchangeCodeUseReq.create({
             ExchangeCodeContent: code
        })
        operationSvr.send(req);
    }

    reqHangUpGainPreview(){
        let req = gamesvr.UniversalHangUpGainPreviewRewardReq.create({})
        operationSvr.send(req);
    }

    private _onRecvHangUpPreviewRes (recvMsg: { Result: number, Desc: string, Msg: gamesvr.UniversalHangUpGainPreviewRewardRes}) {
        if (!this._checkResValid(recvMsg)) {
            return;
        }

        eventCenter.fire(hangUpEvent.HANGUP_PREVIEW_RES, recvMsg.Msg);
    }

    reqHangUpReward (){
        let req = gamesvr.UniversalHangUpGainReceiveRewardReq.create({})
        operationSvr.send(req);
    }

    private _onRecvHangUpRewardRes (recvMsg: { Result: number, Desc: string, Msg: gamesvr.UniversalHangUpGainReceiveRewardRes}) {
        if(!this._checkResValid(recvMsg)) {
            return;
        }
        let msg = recvMsg.Msg;
        if(!msg) return;

        userData.updateHangupAfterReward(recvMsg.Msg);
        recvMsg.Msg.TotalExp && userData.updateExp(recvMsg.Msg.TotalExp);
        eventCenter.fire(hangUpEvent.HANGUP_REWARD_RES, msg)
    }

    /**
     * 快速挂机
     */
    reqUniversalHangUpGainFastHangUp() {
        let req = gamesvr.UniversalHangUpGainFastHangUpReq.create({});

        operationSvr.send(req);
    }

    private _recvUniversalHangUpGainFastHangUpRes(recvMsg: { Result: number, Desc: string, Msg: gamesvr.UniversalHangUpGainFastHangUpRes}) {
        if (!this._checkResValid(recvMsg)) {
            return;
        }

        let msg = recvMsg.Msg;
        if (msg.TotalExp) {
            userData.updateExp(msg.TotalExp);
        }
        userData.universalData.UniversalHangUpGainData.FastHangUpCount = msg.FastHangUpCount;

        eventCenter.fire(hangUpEvent.HANGUP_FAST_RES, msg);
        eventCenter.fire(hangUpEvent.REFRESH_VIEW);
    }

    private _onRecvHangUpChapterNotify (recvMsg: { Result: number, Desc: string, Msg: gamesvr.UniversalHangUpGainChapterChangeNotify}) {
        // eventCenter.fire(hangUpEvent.HANGUP_CHAPTER_CHANGE, recvMsg)
        if (recvMsg && recvMsg.Msg && recvMsg.Msg.ChapterID) {
            userData.updateHangupChapter(recvMsg.Msg.ChapterID);
        }
    }

    sendUniversalChooseMap(name: string, map: {[k: string]: number}){
        let req = gamesvr.UniversalSageChosenRoadReq.create({
            Name: name,
            ChosenMap: map
        })
        operationSvr.send(req);
    }

    //获取其他玩家基本信息
    reqUniversalViewuserInfo( uid: string) {
        if(!uid || uid.length == 0) return;
        let req = gamesvr.UniversalViewUserInformReq.create({
            UserID: uid
        });

        operationSvr.send(req);
    }

    private _recvUniversalViewUserInfo(recvMsg: { Result: number, Desc: string, Msg: gamesvr.IUniversalViewUserInformRes}) {
      if (!this._checkResValid(recvMsg)) {
            return;
        }

        let msg = recvMsg.Msg;
        eventCenter.fire(useInfoEvent.UNIVERSAL_VIEW_USER_INFO, msg);
    }

    private _onRecvUserdataRefreshNotify(recvMsg: { Result: number, Desc: string, Msg: gamesvr.UserdataRefreshNotify}) {
        if (!this._checkResValid(recvMsg)) {
            return;
        }

        let msg = recvMsg.Msg;

        msg.TrialRespectData && (pveDataOpt.updateRespectData(msg.TrialRespectData));
        msg.TrialPurgatoryData && (pveDataOpt.updatePurgatoryData(msg.TrialPurgatoryData));
        msg.TrialIslandData && (pveDataOpt.updateIslandData(msg.TrialIslandData))

        eventCenter.fire(commonEvent.USERDATA_REFRESH, msg);
    }
}

let userOpt = new UserOpt();
export { userOpt }
