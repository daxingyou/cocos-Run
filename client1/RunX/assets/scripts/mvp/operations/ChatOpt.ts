
/*
 * @Author: xuyang
 * @Date: 2021-05-24 17:54:21
 * @Description: 聊天模块控制类
 **/
import { eventCenter } from "../../common/event/EventCenter";
import { data, gamesvr } from "../../network/lib/protocol";
import { operationSvr } from "../../network/OperationSvr";
import { BaseOpt } from "./BaseOpt";
import { chatEvent } from "../../common/event/EventData"
import { chatData } from "../models/ChatData";

import { CHAT_CHANNEL } from "../models/ChatData";
import { friendData } from "../models/FriendData";

class ChatOpt extends BaseOpt {


    init() {
        this.registerAllEvent();
    }

    //注册消息队列监听
    registerAllEvent() {
        this.addEventListener(gamesvr.CMD.CHAT_MESSAGE_NOTIFY, this._onMessageNotify);
        this.addEventListener(gamesvr.CMD.SEND_CHAT_RES, this._onSendMessageRes);
        this.addEventListener(gamesvr.CMD.BLOCK_USER_RES, this._onBlockUserResponse);
        this.addEventListener(gamesvr.CMD.REMOVE_BLOCKED_RES, this._RemoveBlockedRes);
    }

    //收到即时消息
    private _onMessageNotify(recvMsg: { Result: number, Desc: string, Msg: gamesvr.IChatMessageNotify }) {
        if (!this._checkResValid(recvMsg)) {
            return;
        }
        let msg = recvMsg.Msg;

        chatData.pushMsg(msg);
        eventCenter.fire(chatEvent.CHAT_NOTIFY);
    }
    // 消息发送回包
    private _onSendMessageRes(recvMsg: { Result: number, Desc: string, Msg: gamesvr.IChatMessageNotify }) {
        if (!this._checkResValid(recvMsg)) {
            return;
        }
        let msg = recvMsg.Msg;
        eventCenter.fire(chatEvent.SEND_MSG_RES);
    }
    //加入黑名单
    private _onBlockUserResponse(recvMsg: { Result: number, Desc: string, Msg: gamesvr.BlockUserRes }) {
        if (!this._checkResValid(recvMsg)) {
            return;
        }
        let msg = recvMsg.Msg;
        friendData.addBlockList(msg.UserInfo);
        chatData.refreshBlackList();
        eventCenter.fire(chatEvent.ADD_BLOCK);
    }

    //移出黑名单
    private _RemoveBlockedRes(recvMsg: { Result: number, Desc: string, Msg: gamesvr.RemoveBlockedRes }) {
        if (!this._checkResValid(recvMsg)) {
            return;
        }
        let msg = recvMsg.Msg;
        friendData.removeBlockList(msg.UserID)
        chatData.refreshBlackList();
        eventCenter.fire(chatEvent.RMV_BLOCK);
    }

    //发送即时消息
    sendChatReq(msg: string, frameID: number, type?: CHAT_CHANNEL) {
        let chatReq = gamesvr.SendChatReq.create({
            Type: type,
            Message: msg,
            MsgFrameId: frameID
        })
        operationSvr.send(chatReq);
    }

    //加入黑名单请求
    sendBlockReq(uData: data.OtherData | data.IOtherData) {
        let blockReq = gamesvr.BlockUserReq.create({
            UserInfo: uData
        })
        operationSvr.send(blockReq);
    }

    //移除黑名单请求
    sendRmvBlockReq(uID: string) {
        let rmvBlockReq = gamesvr.RemoveBlockedReq.create({
            UserID: uID
        })
        operationSvr.send(rmvBlockReq);
    }
    
}

let chatOpt = new ChatOpt();
export { chatOpt }
