/*
 * @Author: xuyang
 * @Date: 2021-05-20 10:59:47
 * @LastEditTime: 2021-06-02 13:58:01
 * @Description: 邮件操作类
 * @FilePath: \RunX\assets\scripts\mvp\operations\MailOpt.ts
 */

import { eventCenter } from "../../common/event/EventCenter";
import { data, gamesvr } from "../../network/lib/protocol";
import { operationSvr } from "../../network/OperationSvr";
import { BaseOpt } from "./BaseOpt";
import { mailEvent } from "../../common/event/EventData"
import { mailData } from "../models/MailData";
import { redDotMgr, RED_DOT_MODULE } from "../../common/RedDotManager";


class MailOpt extends BaseOpt {

    init() {
        this.registerAllEvent();
    }

    //注册消息队列监听
    registerAllEvent() {
        this.addEventListener(gamesvr.CMD.RECEIVE_MAIL_NOTIFY, this._onMailNotify);
        this.addEventListener(gamesvr.CMD.AUTO_CLEAR_MAIL_RES, this._onMailClear);
        this.addEventListener(gamesvr.CMD.TAKE_MAIL_RES, this._onMailToken);
        this.addEventListener(gamesvr.CMD.TAKE_ALL_MAIL_RES, this._onMailAllToken);
        this.addEventListener(gamesvr.CMD.READ_MAIL_RES, this._onMailRead);
    }

    //清理邮件成功响应
    private _onMailClear(recvMsg: { Result: number, Desc: string, Msg: gamesvr.AutoClearMailRes }) {
        if (!this._checkResValid(recvMsg)) {
            return;
        }
        let msg = recvMsg.Msg;
        if (msg.Seqs) {
            mailData.clearMailData(msg.Seqs);
            eventCenter.fire(mailEvent.CLEAR);
        }
    }
    //一键领取邮件
    private _onMailAllToken(recvMsg: { Result: number, Desc: string, Msg: gamesvr.TakeAllMailRes }) {
        if (!this._checkResValid(recvMsg)) {
            return;
        }
        let msg = recvMsg.Msg;
        if (msg.Mails) {
            mailData.updateTokenMail(msg.Mails);
            eventCenter.fire(mailEvent.TAKE_ALL, msg.Mails);
            redDotMgr.fire(RED_DOT_MODULE.MAIN_MAIL);
        }
    }
    //邮件已读
    private _onMailRead(recvMsg: { Result: number, Desc: string, Msg: gamesvr.ReadMailRes }) {
        if (!this._checkResValid(recvMsg)) {
            return;
        }
        let msg = recvMsg.Msg;
        if (msg.Seq) {
            mailData.setMailRead(msg.Seq);
            eventCenter.fire(mailEvent.READ);
            redDotMgr.fire(RED_DOT_MODULE.MAIN_MAIL);
        }
    }
    //邮件已领
    private _onMailToken(recvMsg: { Result: number, Desc: string, Msg: gamesvr.TakeMailRes }) {
        if (!this._checkResValid(recvMsg)) {
            return;
        }
        let msg = recvMsg.Msg;
        if (msg.Mail) {
            mailData.setMailToken(msg.Mail);
            eventCenter.fire(mailEvent.TAKE, msg.Mail);
            redDotMgr.fire(RED_DOT_MODULE.MAIN_MAIL);
        }
    }

    //邮件添加成功
    private _onMailNotify(recvMsg: { Result: number, Desc: string, Msg: gamesvr.ReceiveMailNotify }) {
        if (!this._checkResValid(recvMsg)) {
            return;
        }
        let msg = recvMsg.Msg;
        if (msg.Mail) {
            mailData.addMail(msg.Mail);
            redDotMgr.fire(RED_DOT_MODULE.MAIN_MAIL);
        }
    }
    //已读邮件
    sendReadReq(seq: any) {
        let read = gamesvr.ReadMailReq.create({
            Seq: seq
        })
        operationSvr.send(read);
    }
    //领取邮件
    sendTakeReq(seq: any) {
        let take = gamesvr.TakeMailReq.create({
            Seq: seq
        })
        operationSvr.send(take);
    }
    //一键已读
    sendAllClearReq() {
        let readAll = gamesvr.AutoClearMailReq.create({
        });
        operationSvr.send(readAll)
    }
    //一键领取
    sendAllTakeReq() {
        let takeAll = gamesvr.TakeAllMailReq.create({
        });
        operationSvr.send(takeAll)
    }
}

let mailOpt = new MailOpt();
export { mailOpt }