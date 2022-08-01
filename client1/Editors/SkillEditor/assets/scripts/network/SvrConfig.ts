import { onlinesvr } from "./lib/protocol"

let SvrConfig = {
    onlinesvrUrl: "ws://192.168.55.52:9600",
    evidencesvrUrl: "ws://192.168.55.52:9100",
    isAudit: false,
    isExperience: false,

    noticeRomate: "http://192.168.55.52:8080/remoteCfg/remoteCfg.json",

    fetchGamesvrs: <onlinesvr.IGamesvrInfo[]>[]
}

export let svrConfig = SvrConfig