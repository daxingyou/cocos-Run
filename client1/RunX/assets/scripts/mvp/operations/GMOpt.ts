import { data, gamesvr } from "../../network/lib/protocol";
import { operationSvr } from "../../network/OperationSvr";
import { logger } from "../../common/log/Logger";
import { eventCenter } from "../../common/event/EventCenter";
import { BaseOpt } from "./BaseOpt";
import { pveData } from "../models/PveData";
import { pveTrialData } from "../models/PveTrialData";

class GMOpt extends BaseOpt {
    init() {
        super.init();
        this.addEventListener(gamesvr.CMD.GET_ITEM_RES, this.getItemRes)
        this.addEventListener(gamesvr.CMD.CLIENT_HOTUPDATE_NOTIFY, this.clientHotUpdateNotify)
        this.addEventListener(gamesvr.CMD.CHEAT_FINISH_PVE_RES, this._receieveCheatPveFinishRes);
        this.addEventListener(gamesvr.CMD.CHEAT_FINISH_TRIAL_PURGATORY_RES, this._receiveCheatTrialPurgatoryRes);
    }

    deInit() {
        eventCenter.unregisterAll(this);
    }

    getItemReq(id: number, count: number) {
        operationSvr.send(gamesvr.GetItemReq.create({
            ID: id,
            Count: count
        }))
    }

    getItemRes(recvMsg: { Result: number, Desc: string, Msg: gamesvr.IGetItemRes }) {
        logger.log('gmOpt', `res = ${recvMsg.Msg}`);
    }

    clientHotUpdateNotify(receMsg: { Result: number, Desc: string, Msg: gamesvr.IClientHotupdateNotify }) {
        let hotUpdateMsg = receMsg.Msg.Message;
        // 切换页面时检查是否有热更 @todo
    }

    //添加邮件
    sendAddMailReq(prizes: data.IItemInfo[]) {
        let mail = gamesvr.AddMailReq.create({
            Tag: 0,
            Desc: "测试邮件\n\n\n\n\n\n\n测试邮件\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n",
            Title: "邮件名称7个字",
            Prizes: prizes
        })
        operationSvr.send(mail);
    }

    reqCheatFinishPve(lessonId: number) {
        if (!lessonId) return;

        let req: gamesvr.CheatFinishPveReq = gamesvr.CheatFinishPveReq.create({
            LessonID: lessonId,
        })
        operationSvr.send(req);
    }

    private _receieveCheatPveFinishRes(recvMsg: { Result: number, Desc: string, Msg: gamesvr.CheatFinishPveRes }) {
        if (!this._checkResValid(recvMsg)) {
            return;
        }
        let msg = recvMsg.Msg;

        if (msg.LessonID) {
            // 更新数据
            for (let i = 0; i < msg.Record.length; i++) {
                pveData.updatePveRecord(msg.LessonID[i], msg.Record[i]);
            }
            if (msg.DreamCount) pveData.updateDreamCount(msg.DreamCount);
        }
    }

    reqCheatFinishTrialPurgatory(progress: number) {
        let req = gamesvr.CheatFinishTrialPurgatoryReq.create({
            Progress: progress
        })
        operationSvr.send(req);
    }

    private _receiveCheatTrialPurgatoryRes(recvMsg: { Result: number, Desc: string, Msg: gamesvr.CheatFinishTrialPurgatoryRes }) {
        if (!this._checkResValid(recvMsg)) {
            return;
        }

        let msg = recvMsg.Msg;
        if (msg.TrialPurgatoryData) {
            pveTrialData.updatePurgatoryData(msg.TrialPurgatoryData);
        }
    }
}
let gmOpt = new GMOpt();
export {
    gmOpt
}