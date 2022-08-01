/*
 * @Author: xuyang
 * @Date: 2021-05-24 14:30:32
 * @Description: 单例模式，只做消息转发，生命周期随应用销毁
 */
import { eventCenter } from "../../common/event/EventCenter";
import { netEvent } from "../../common/event/EventData";
import { logger } from "../../common/log/Logger";
import { gamesvr } from "../../network/lib/protocol";

interface FuncObj {
    respCallback: Function,
    obj: Object
}

export class svrOpt {
    private _callBackMap = new Map<gamesvr.CMD, FuncObj>();
    constructor() {
        this._callBackMap.clear();
        this.registerEvent();
    }

    /**
     * 注册服务消息监听
     */
    private registerEvent() {
        eventCenter.register(netEvent.RECV_SERVER_RES, this, this.onRecvSvrMsg);
    }

    /**
     * 处理服务消息并转发
     */
    private onRecvSvrMsg(cmd: number, cmdSvr: gamesvr.CMD, recvMsg: { Result: number, Desc: string, Msg: any }) {
        logger.info('SvrOpt, recv server msg. cmd =', cmdSvr);
        if (!this.checkResValid(recvMsg)) {
            // guiManager.showTips(recvMsg.Desc);
            let info = JSON.stringify(recvMsg)
            logger.error("receive server msg error, cmd = ", cmdSvr, "err info = ", info)
            // return;
        }
        if (this._callBackMap.get(cmdSvr)) {
            let dispObj = this._callBackMap.get(cmdSvr);
            dispObj.respCallback.apply(dispObj.obj, [recvMsg]);
        }
    }

    /**
     * @description: 服务事件转发器，不用每次手动注册
     * @param {gamesvr} cmd 服务指令ID
     * @param {Function} func 响应回调
     * @return {*}
     */
    public addEventListener(cmd: gamesvr.CMD, func: Function, obj: Object) {
        let dispObj: FuncObj = {
            respCallback: func,
            obj: obj
        }
        this._callBackMap.set(cmd, dispObj);
    }

    public rmvEventListener(obj: Object){
        this._callBackMap.forEach((_callBack, _k) =>{
            if (_callBack.obj == obj){
                this._callBackMap.delete(_k);
            }
        })
    }
    /**
     * @description: 检测服务消息是否异常
     * @param {object} recvMsg
     * @return {*}
     */
    private checkResValid(recvMsg: { Result: number, Desc: string, Msg: any }) {
        return recvMsg && recvMsg.Result == 0;
    }

    /**
     * @description: 反初始化操作，释放引用和事件
     */
    public deInit() {
        this._callBackMap.clear();
        eventCenter.unregisterAll(this);
    }
}

export let SvrOpt = new svrOpt();
