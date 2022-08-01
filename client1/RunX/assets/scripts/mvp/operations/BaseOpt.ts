/*
 * @Author: 王旭洋
 * @Date: 2021-05-12 16:48:14
 * @LastEditTime: 2021-05-27 17:53:29
 * @Description: Opt基类
 */
import { eventCenter } from "../../common/event/EventCenter";
import { commonEvent } from "../../common/event/EventData";
import { gamesvr } from "../../network/lib/protocol";
import { SvrOpt } from "./SvrOpt"

export class BaseOpt {
    public init() {
    }

    /**
     * @description: 基础服务响应
     * @param {number} cmd
     * @param {number} cmdSvr
     * @param {object} recvMsg
     * @return {*}
     */

    public addEventListener(cmd: gamesvr.CMD, func: Function) {
        SvrOpt.addEventListener(cmd, func, this);
    }

    /**
     * @description: 检测服务消息是否异常
     * @param {object} recvMsg
     * @return {*}
     */
    protected _checkResValid(recvMsg: { Result: number, Desc: string, Msg: any }) {
        let check = recvMsg && recvMsg.Result == 0;
        if (!check)
            eventCenter.fire(commonEvent.SVR_ERROR, recvMsg.Desc);
        return recvMsg && recvMsg.Result == 0;
    }

    /**
     * @description: 反初始化操作，比如用户登出，切换账号的时候清除数据
     */
    public deInit() {
    }

}
