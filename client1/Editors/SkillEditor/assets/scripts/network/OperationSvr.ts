import { evidencesvr, gamesvr } from "./lib/protocol"
import EvidenceSvr from "./EvidenceSvr"
import GameSvr from "./GameSvr"
import { logger } from "../common/log/Logger"
import { ConstVar, SessionDelegate } from "./NetInterface"
import { netEvent } from "../common/event/EventData"
import { eventCenter } from "../common/event/EventCenter"
import { modelManager } from "../mvp/models/ModeManager"
import OnlineSvr from "./OnlineSvr"
import { svrConfig } from "./SvrConfig"

export default class OperationSvr implements SessionDelegate {
    // gamesvrOK为true时，调用send接口后一定会发生下面的事情：
    //   1. 收到回包（除非发送的协议服务器不给你回包）
    //   2. 或产生NET_RECONNECTED或NET_CLOSED事件
    // gamesvrOK为false时，调用send接口直接会返回false:
    //   保证后续不会发送任何事情是与本次的send调用有关系
    get gamesvrOK (): boolean {
        return this._enableHeartBeat
    }

    // reconnectable为true时，表示reconnect接口是可以调用的:
    //   调用后会发生NET_RECONNECTED或NET_CLOSED事件中的一个
    // reconnectable为false时，表示reconnect接口不可用，用了也无效
    //   其实只有在连接断开，并且账号信息有效，并且没有正在进行的重连或登录时，reconnect接口才有用
    get reconnectable (): boolean {
        return this._disconnected && this._lastAccountRes != null
    }

    // 表示当前是否断开了，正在连不算断开
    get disconnected (): boolean {
        return this._disconnected
    }

    private _onlinesvr: OnlineSvr = null
    private _evidencesvr: EvidenceSvr = null
    private _gamesvr: GameSvr = null
    private _lastAccountRes: evidencesvr.CheckAccountRes = null
    private _enableHeartBeat: boolean = false
    private _heartBeater: number = 0
    private _heartBeatCount: number = 0

    private _disconnected: boolean = true
    private _retryReconnect: number = 0
    private _gamesvrUrl: string = ""

    constructor() {
        this._onlinesvr = new OnlineSvr()
        this._evidencesvr = new EvidenceSvr()
        this._gamesvr = new GameSvr()
        this._gamesvr.setSessionDelegate(this)
    }

    private startHeartBeat() {
        if (this._enableHeartBeat) return

        this._enableHeartBeat = true
        this._heartBeatCount = 0
        this._heartBeater = setInterval(()=>{
            if (this._heartBeatCount >= ConstVar.maxbeatCount) {
                this._gamesvr.clear()
                this.sessionClosed("heart beat timeout")
            } else {
                this._heartBeatCount++
                this._gamesvr.send(gamesvr.HeartBeatReq.create())
            }
        }, ConstVar.heartbeatInterval)
    }

    private stopHeartBeat() {
        if (!this._enableHeartBeat) return

        this._enableHeartBeat = false
        clearInterval(this._heartBeater)
    }

    clear() {
        this._evidencesvr.clear()
        this._gamesvr.clear()
        this._lastAccountRes = null
        this.stopHeartBeat()

        this._disconnected = true
        this._retryReconnect = 0
    }

    queryGamesvrs() {
        this._onlinesvr.clear()
        this._onlinesvr.queryGamesvrs((res)=>{
            svrConfig.fetchGamesvrs = res.GamesvrInfos
            eventCenter.fire(netEvent.FETCH_SERVER_RES)
        }, (errdesc)=>{
            eventCenter.fire(netEvent.NET_ERROR, errdesc)
        })
    }

    login(account:string, gamesvrurl:string) {
        this.clear()

        this._disconnected = false
        this._evidencesvr.checkAccount(account, (res)=>{
            this._lastAccountRes = res

            this._gamesvr.login(res.UserID, gamesvrurl, (res)=>{
                this.startHeartBeat()
                modelManager.updateByLoginResponse(res)
                this._gamesvrUrl = gamesvrurl

                eventCenter.fire(netEvent.NET_LOGIN_SUCC, res)
            }, (errdesc)=>{
                this.clear()
                eventCenter.fire(netEvent.NET_LOGIN_FAIL, errdesc)
            })
        }, (errdesc)=>{
            this.clear()
            eventCenter.fire(netEvent.NET_LOGIN_FAIL, errdesc)
        })
    }

    send(req:any, seq:number = 0): boolean {
        if (!this.gamesvrOK) return false
        return this._gamesvr.send(req, seq)
    }

    sessionRecv(cmd:number, seq:number, res:{ Result: number, Desc: string, Msg: any }) {
        if (cmd == gamesvr.CMD.HEART_BEAT_RES) {
            this._heartBeatCount--
        } else if (cmd == gamesvr.CMD.DIFF_LOGIN_NOTIFY) {
            this._gamesvr.clear()
            this.stopHeartBeat()
            this._disconnected = true
            eventCenter.fire(netEvent.NET_CLOSED)
        } else {
            logger.info('OperationSvr', "recv res", cmd, seq)

            if (gamesvr.CMD[cmd]) {
                eventCenter.fire(netEvent.RECV_SERVER_RES, cmd, res)
            }
        }
    }

    sessionClosed(errdesc:string) {
        this.stopHeartBeat()
        this._disconnected = true
        if (this.reconnectable && this._retryReconnect < 1) {
            this._retryReconnect++
            this.reconnect()
        } else {
            eventCenter.fire(netEvent.NET_CLOSED)
        }
    }

    private doReconnect() {
        this._disconnected = false
        this._gamesvr.login(this._lastAccountRes.UserID, this._gamesvrUrl, (res)=>{
            this._retryReconnect = 0
            this.startHeartBeat()
            modelManager.updateByLoginResponse(res)
            eventCenter.fire(netEvent.NET_RECONNECTED, res)
        }, (errdesc)=>{
            this._disconnected = true
            eventCenter.fire(netEvent.NET_CLOSED)
        })
    }

    get lastAccount () {
        if (this._lastAccountRes && this._lastAccountRes.UserID) {
            return this._lastAccountRes.UserID
        } 
        return "";
    }

    reconnect() {
        logger.info("call reconnect:", this.reconnectable)
        if (!this.reconnectable) return
        this.doReconnect()
    }
}

export let operationSvr = new OperationSvr()