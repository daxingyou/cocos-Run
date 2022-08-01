import { worldsvr, gamesvr } from "./lib/protocol"
import WorldSvr from "./WorldSvr"
import GameSvr from "./GameSvr"
import { logger } from "../common/log/Logger"
import { ConstVar, SessionDelegate } from "./NetInterface"
import { commonEvent, GuideEvents, netEvent } from "../common/event/EventData"
import { eventCenter } from "../common/event/EventCenter"
import { modelManager } from "../mvp/models/ModeManager"
import { svrConfig } from "./SvrConfig"
import PackageUtils from "../app/PackageUtils"

export interface AccoutInfo {
    account: string,
    session: string,
    platform: string
}

const RECONNECT_TIME = 3

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
    //   其实只有在连接断开，并且账号信息与服务器地址有效，并且没有正在进行的重连或登录时，reconnect接口才有用
    get reconnectable (): boolean {
        return this._disconnected && this._lastAccountRes != null && this._gamesvrUrl != ""
    }

    // 表示当前是否断开了，正在连不算断开
    get disconnected (): boolean {
        return this._disconnected
    }

    private _worldsvr: WorldSvr = null
    private _gamesvr: GameSvr = null
    private _lastAccountRes: worldsvr.CheckAccountRes = null
    private _enableHeartBeat: boolean = false
    private _heartBeater: number = 0
    private _heartBeatCount: number = 0

    private _disconnected: boolean = true
    private _retryReconnect: number = 0
    private _gamesvrUrl: string = ""
    private _accInfo: AccoutInfo = null

    get accountInfo() {
        return this._lastAccountRes
    }

    get lastAccount () {
        if (this._lastAccountRes && this._lastAccountRes.UserID) {
            return this._lastAccountRes.UserID
        } 
        return "";
    }

    constructor() {
        this._worldsvr = new WorldSvr()
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
        this._gamesvr.clear()
        this.stopHeartBeat()

        this._disconnected = true
        this._retryReconnect = 0
    }

    setAccountInfo(accInfo: AccoutInfo) {
        this._accInfo = accInfo;
    }

    checkAccount() {
        this._worldsvr.clear()
        this._lastAccountRes = null

        this._worldsvr.checkAccount(this._accInfo, res => {
            this._lastAccountRes = res
            svrConfig.fetchGamesvrs = res.GamesvrInfos
            svrConfig.worldTag = res.WorldSvr

            eventCenter.fire(netEvent.NET_CHECK_ACC_RES, true)
        }, errdesc => {
            eventCenter.fire(netEvent.NET_CHECK_ACC_RES, false, errdesc)
        })
    }

    login(gamesvrurl: string) {
        this.clear()
        this._disconnected = false

        this._gamesvr.login(this._lastAccountRes, gamesvrurl, res => {
            this.startHeartBeat()
            this._gamesvrUrl = gamesvrurl
            modelManager.updateByLoginResponse(res)
            
            let accountData = res.UserData.AccountData;
            if (accountData.RegisterTime.equals(accountData.LastLoginTime)) {
                PackageUtils.reportCreateRole("9800", "正式服", accountData.UserRoleID, 
                    accountData.Name, accountData.RegisterTime.toString())
            }

            PackageUtils.reportLogin("9800", "正式服", accountData.UserRoleID, 
                accountData.Name, 1, accountData.RegisterTime.toString())

            eventCenter.fire(GuideEvents.UPDATE_GUIDE_CFGS, 'login');
            eventCenter.fire(netEvent.NET_LOGIN_SUCC, res)

        }, errdesc => {
            this.clear()
            eventCenter.fire(netEvent.NET_LOGIN_FAIL, errdesc)
        })
    }

    send(req: any, seq: number = 0): boolean {
        if (!this.gamesvrOK) return false
        if (operationSvr.disconnected) {
            operationSvr.reconnect()
            eventCenter.fire(commonEvent.GLOBAL_TIPS, "重新连接中，请稍后再尝试.")
            return false;
        }
        return this._gamesvr.send(req, seq)
    }

    sessionRecv(cmd: number, seq: number, res: { Result: number, Desc: string, Msg: any }) {
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

    sessionClosed(errdesc: string) {
        this.stopHeartBeat()
        this._disconnected = true
        if (this.reconnectable && this._retryReconnect < RECONNECT_TIME) {
            this._retryReconnect++
            this.reconnect()
        } else {
            eventCenter.fire(netEvent.NET_CLOSED)
        }
    }

    private doReconnect() {
        this._disconnected = false
        this._gamesvr.login(this._lastAccountRes, this._gamesvrUrl, (res)=>{
            this._retryReconnect = 0
            this.startHeartBeat()
            modelManager.updateByLoginResponse(res)
            eventCenter.fire(netEvent.NET_RECONNECTED, res)
        }, (errdesc)=>{
            this._disconnected = true
            eventCenter.fire(netEvent.NET_CLOSED)
        })
    }

    reconnect() {
        logger.info("call reconnect:", this.reconnectable)
        if (!this.reconnectable) return
        this.doReconnect()
    }
}

export let operationSvr = new OperationSvr()