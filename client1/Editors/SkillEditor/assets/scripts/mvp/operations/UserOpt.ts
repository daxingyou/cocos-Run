import { eventCenter } from "../../common/event/EventCenter";
import { logger } from "../../common/log/Logger";
import { modelManager } from "../models/ModeManager";
import { operationSvr } from "../../network/OperationSvr";
import { netEvent } from "../../common/event/EventData";
import { gamesvr } from "../../network/lib/protocol"
import { hasDirtyWord } from "../../common/DirtyWord";
import guiManager from "../../common/GUIManager";
import { useInfoEvent } from "../../common/event/EventData"
import { ConfigHead } from "../models/HeadData";

export default class UserOpt {

    private _headCfg: ConfigHead[] = new Array<ConfigHead>();
    private _frameCfg: ConfigHead[] = new Array<ConfigHead>();

    get headData() {
        return modelManager.HeadData;
    }

    get usrInfo() {
        return modelManager.userData.userInfo;
    }

    init() {
        this.registerEvent();
    }

    registerEvent() {
        eventCenter.register(netEvent.RECV_SERVER_RES, this, this.onRecvSvrMsg);
    }

    private onRecvSvrMsg(cmd: number, cmdSvr: number, recvMsg: { Result: number, Desc: string, Msg: any }) {
        logger.info('GMOpt', `recv server msg. cmd = ${cmd}, msg = ${JSON.stringify(recvMsg)}`);
        // 在基类中做统一检查处理
        if (!this.checkResponse(recvMsg)) {
            logger.error("Request failed:", recvMsg.Desc);
            return;
        }
        let res = recvMsg.Msg;
        switch (cmdSvr) {
            case gamesvr.CMD.CHANGE_NAME_RES:
                this.onRecvChangeNameRes(res);
                break;

            case gamesvr.CMD.CHANGE_HEAD_RES:
                this.onRecvChangeHeadRes(res);
                break;
            default:
                break;
        }
    }

    private checkResponse(recvMsg: { Result: number, Desc: string, Msg: any }) {
        return recvMsg && recvMsg.Result == 0;
    }

    private onRecvChangeNameRes(msg: gamesvr.ChangeNameRes) {
        let name: string = msg.Name;
        modelManager.userData.updateUsrName(name);
        eventCenter.fire(useInfoEvent.USER_NAME_CHANGE);
    }

    private onRecvChangeHeadRes(msg: gamesvr.ChangeHeadRes) {
        let headID: number = msg.HeadID;
        let frameID: number = msg.HeadFrameID;
        modelManager.userData.updateUsrHead(headID);
        modelManager.userData.updateUsrFrame(frameID);
        eventCenter.fire(useInfoEvent.USER_HEAD_CHANGE);
    }

    sendHeadFrameChangeReq(headID: number, frameID: number) {
        let findConfig = this.headData.getConfigByHeadId(headID);
        let findConfig1 = this.headData.getConfigByHeadId(frameID);
        if (!findConfig || !findConfig1) {
            cc.log(`当前HeadID[${headID}]/FrameID[${frameID}]不合法！`);
            return;
        }
        let sendData: gamesvr.ChangeHeadReq = gamesvr.ChangeHeadReq.create({
            HeadFrameID: frameID,
            HeadID: headID
        })
        operationSvr.send(sendData);
    }

    sendNameChangeReq(name: string) {
        //检查名字是否合法及敏感字检查
        if (hasDirtyWord(name) || name == "") {
            guiManager.showTips("设置失败,该昵称不合规！");
            return;
        }
        let sendData: gamesvr.ChangeNameReq = gamesvr.ChangeNameReq.create({
            Name: name
        })
        operationSvr.send(sendData);
    }
}