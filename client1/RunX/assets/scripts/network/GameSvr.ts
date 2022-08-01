import { comm, worldsvr, gamesvr } from "./lib/protocol"
import { predefine } from "./Predefine"
import { logger } from "../common/log/Logger"
import { ConstVar, SessionDelegate } from "./NetInterface"

// 假设1：对于已经连接上但还没触发onopen回调的socket调用close，此socket的onopen回调之后不会触发
// 假设2：对于已经收到数据包但还没触发onmessage回调的socket调用close，此socket的onmessage回调之后不会触发
// 假设3：对于已经标记了出错的socket但还没触发onerror回调的socket调用close，此socket的onerror回调之后不会触发
// 假设4：对正在执行的通过setTimeout触发的函数调用clearTimeout没有什么副作用
// 假设5：对已经触发onerror或者onclose的socke再次调用close没有什么副作用
// 以上假设需要看标准或具体websocket的实现代码进行确认
// 如果假设1,2,3确实成立，onopen,opmessage,onerror最开始的那一行if语句可以去掉的
// 如果假设4,5不成立，需要修改clear方法，根据调用clear的时机的不同，不去调clearTimeout或socket的close

type LoginSuccCallback = (res: gamesvr.LoginRes) => void
type LoginFailCallback = (errdesc: string) => void

export default class GameSvr {
    private _socket: WebSocket = null
    private _timer: number = 0
    private _logined: boolean = false
    private _delegate: SessionDelegate = null

    private loginSucc(succ: LoginSuccCallback, res: gamesvr.LoginRes) {
        clearTimeout(this._timer)
        this._logined = true
        succ(res)
    }

    private loginFail(fail: LoginFailCallback, errdesc: string) {
        this.clear()
        fail(errdesc)
    }

    constructor() {
        for (let key in gamesvr.CMD) {
            let classname = ConstVar.transCMDtoClassName(key)
            if (classname == "") continue

            // @ts-ignore
            if (gamesvr[classname] == null) continue

            try {
                // @ts-ignore
                gamesvr[classname].CMD = gamesvr.CMD[key]
            } catch (err) {
                logger.error("no classname:", classname, "cmd is:", key)
            }
        }
    }

    clear() {
        if (this._socket != null) {
            let socket = this._socket
            this._socket = null
            socket.close()
            if (!this._logined) {
                clearTimeout(this._timer)
            }
            this._logined = false
        }
    }

    login(eviInfo: worldsvr.CheckAccountRes, gamesvrUrl: string, succ: LoginSuccCallback, fail: LoginFailCallback) {
        this.clear()

        this._socket = new WebSocket(gamesvrUrl)
        this._socket.binaryType = "arraybuffer"
        this._timer = setTimeout(() => { this.loginFail(fail, predefine.errdescTimeout) }, predefine.timeout)

        this._socket.onopen = (ev: Event) => {
            if (this._socket != ev.target) return

            this.send(gamesvr.LoginReq.create({
                UserID: eviInfo.UserID,
                Session: eviInfo.Session,
                Platform: eviInfo.Platform,
                Token: eviInfo.Token
            }))
        }

        this._socket.onmessage = (ev: MessageEvent) => {
            if (this._socket != ev.target) return

            let response = null
            let res = null

            try {
                response = comm.Response.decode(new Uint8Array(ev.data))

                let cmdname = gamesvr.CMD[response.CMD]
                let destsvr = gamesvr
                let resclassname = ""
                let camel = true
                for (let i = 0; i < cmdname.length; ++i) {
                    if (cmdname[i] == "_") {
                        camel = true
                    } else if (camel) {
                        camel = false
                        resclassname += cmdname[i]
                    } else {
                        resclassname += cmdname[i].toLowerCase()
                    }
                }
                if (response.Compressed) {
                    // @ts-ignore
                    let inflaor = new pako.Inflate()
                    inflaor.push(response.Msg)
                    response.Msg = inflaor.result
                }

                // @ts-ignore
                res = destsvr[resclassname].decode(response.Msg)
            } catch (e) {
                logger.error("can't decode message", response.CMD)
            }

            if (!this._logined) {
                if (res != null && response.CMD == gamesvr.CMD.LOGIN_RES) {
                    if (response.Errcode == 0) {
                        logger.info("[Login State], game svr address :", this._socket.url)
                        this.loginSucc(succ, res)
                    } else {
                        this.loginFail(fail, response.Desc)
                    }
                }
            } else {
                if (this._delegate && res != null) {
                    this._delegate.sessionRecv(response.CMD, response.Seq, {
                        Result: response.Errcode,
                        Desc: response.Desc,
                        Msg: res
                    });
                }
            }
        }

        this._socket.onerror = (ev: Event) => {
            if (this._socket != ev.target) return

            if (!this._logined) {
                this.loginFail(fail, predefine.errdescNet)
            } else {
                this.clear()
                this._delegate.sessionClosed(predefine.errdescNet)
            }
        }

        this._socket.onclose = (ev: Event) => {
            if (this._socket != ev.target) return

            if (!this._logined) {
                this.loginFail(fail, predefine.errdescSvrClose)
            } else {
                this.clear()
                this._delegate.sessionClosed(predefine.errdescSvrClose)
            }
        }
    }

    send(req: any, seq: number = 0): boolean {
        try {
            let request = comm.Request.create({
                Seq: seq,
                CMD: req.constructor.CMD,
                Msg: req.constructor.encode(req).finish(),
            })

            this._socket.send(comm.Request.encode(request).finish())
            return true
        } catch (e) {
            logger.error("send to gamesvr failed:", e)
            return false
        }
    }

    setSessionDelegate(delegate: SessionDelegate) {
        this._delegate = delegate
    }
}