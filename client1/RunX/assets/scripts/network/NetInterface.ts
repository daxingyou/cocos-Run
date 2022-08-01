
// 默认时间
const ConstVar = {
    heartbeatInterval: 10000,
    maxbeatCount: 2,

    // 
    transCMDtoClassName: (cmd: string): string => {
        if (cmd.length == 0) return ""
        if (cmd[0] >= "0" && cmd[0] <= "9") return ""
        if (cmd == "INVALID") return ""
    
        let msgClassName = ""
        let upper = true
        for (let i = 0; i < cmd.length; ++i) {
            if (cmd[i] == "_") {
                upper = true
            } else if (upper) {
                upper = false
                msgClassName += cmd[i].toUpperCase()
            } else {
                msgClassName += cmd[i].toLowerCase()
            }
        }
        return msgClassName
    }
}

interface SessionDelegate {
    sessionRecv: (cmd: number, seq: number, res: {Result: number, Desc: string, Msg: any})=>void
    sessionClosed: (errdesc:string)=>void
}

export {
    ConstVar,
    SessionDelegate,
}