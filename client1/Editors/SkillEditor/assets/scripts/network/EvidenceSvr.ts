import { comm, evidencesvr } from "./lib/protocol"
import { predefine } from "./Predefine"
import { svrConfig } from "./SvrConfig"

// 假设1：对于已经连接上但还没触发onopen回调的socket调用close，此socket的onopen回调之后不会触发
// 假设2：对于已经收到数据包但还没触发onmessage回调的socket调用close，此socket的onmessage回调之后不会触发
// 假设3：对于已经标记了出错的socket但还没触发onerror回调的socket调用close，此socket的onerror回调之后不会触发
// 假设4：对正在执行的通过setTimeout触发的函数调用clearTimeout没有什么副作用
// 假设5：对已经触发onerror或者onclose的socke再次调用close没有什么副作用
// 以上假设需要看标准或具体websocket的实现代码进行确认
// 如果假设1,2,3确实成立，onopen,opmessage,onerror最开始的那一行if语句可以去掉的
// 如果假设4,5不成立，需要修改clear方法，根据调用clear的时机的不同，不去调clearTimeout或socket的close

type SuccCallback = (res:evidencesvr.CheckAccountRes)=>void
type FailCallback = (errdesc:string)=>void

export default class EvidenceSvr {
    private _socket: WebSocket = null
    private _timer: number = 0

    private doneSucc(succ:SuccCallback, res:evidencesvr.CheckAccountRes) {
        this.clear()
        succ(res)
    }

    private doneFail(fail:FailCallback, errdesc:string) {
        this.clear()
        fail(errdesc)
    }

    private genCheckAccountReqMsg(account:string): ArrayBuffer {
        let req = evidencesvr.CheckAccountReq.create({
            Account: account
        })

        let request = comm.Request.create({
            Seq: 0,
            CMD: evidencesvr.CMD.CHECK_ACCOUNT_REQ,
            Msg: evidencesvr.CheckAccountReq.encode(req).finish(),
        })

        return comm.Request.encode(request).finish()
    }

    clear () {
        if (this._socket != null) {
            this._socket.close()
            this._socket = null
            clearTimeout(this._timer)
        }
    }

    checkAccount(account: string, succ:SuccCallback, fail:FailCallback) {
        this.clear()

        this._socket = new WebSocket(svrConfig.evidencesvrUrl)
        this._socket.binaryType = "arraybuffer"
        this._timer = setTimeout(()=>{this.doneFail(fail, predefine.errdescTimeout)}, predefine.timeout)

        this._socket.onopen = (ev:Event)=>{
            if (this._socket != ev.target) return
            this._socket.send(this.genCheckAccountReqMsg(account))
        }

        this._socket.onmessage = (ev:MessageEvent)=>{
            if (this._socket != ev.target) return

            try {
                let response = comm.Response.decode(new Uint8Array(ev.data))
                let res = evidencesvr.CheckAccountRes.decode(response.Msg)

                if (response.Errcode == 0) {
                    this.doneSucc(succ, res)
                } else {
                    this.doneFail(fail, response.Desc)
                }
            } catch (e) {
                this.doneFail(fail, predefine.errdescProtocol)
            }
        }

        this._socket.onerror = (ev:Event)=>{
            if (this._socket != ev.target) return
            this.doneFail(fail, predefine.errdescNet)
        }

        this._socket.onclose = (ev:Event)=>{
            if (this._socket != ev.target) return
            this.doneFail(fail, predefine.errdescSvrClose)
        }
    }
}