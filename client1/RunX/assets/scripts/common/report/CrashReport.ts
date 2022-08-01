import { appCfg } from "../../app/AppConfig"
import PackageUtils from "../../app/PackageUtils"
import HttpRequest from "../../network/HttpRequest"
import { svrConfig } from "../../network/SvrConfig"
import { logger } from "../log/Logger"

interface BugID {
    res_version: string
    message: string
    stacks: string[][]
}

class Bug {
    id: BugID
    os: string
    time: number
    logs: string[]

    init (msg: string, stacks: string) {
        this.id = {
            res_version: appCfg.getVersion(),
            message: msg,
            stacks: []
        }

        if (stacks != null && stacks != "") {
            stacks.split('\n').forEach(line=>{
                if (this.id.stacks.length >= 10) {
                    return
                }

                let info = line.split('@') // 新的格式为 line:column@filepath@funcname
                let frame: string[] = []
                for (let i = 0; i < info.length; ++i) {
                    if (i == 0) {
                        let linecol = info[i].split(':')
                        frame.push(linecol[0] || "0") 
                        frame.push(linecol[1] || "0")
                    } else {
                        frame.push(info[i])
                    }
                }
                this.id.stacks.push(frame)
            })
        }

        this.os = cc.sys.os;
        this.time = new Date().getTime()
    }

    md5 () {
        // @ts-ignore
        const md5 = require("../../basic/md5.js")
        return md5.hex_md5(JSON.stringify(this.id))
    }
}

let bugCache: {[key:string]: number} = {}
async function reportBug (bug: Bug) {
    let md5val = bug.md5()
    logger.log("report bug", "md5 val is", md5val)

    // 10分钟内不再对同一bug进行上报
    if (bugCache[md5val] != null && bugCache[md5val] + 60 * 10 * 1000 > bug.time) {
        logger.log("report bug", "same bug in 10 min, return")
        return
    }

    bugCache[md5val] = bug.time

    // 检查此错误是否可上报，不可上报则不进行上报
    try {
        let result = await new HttpRequest().request(appCfg.reportUrl+"/clientbug-check", {md5:md5val}, null, true)
        logger.log("report bug", "check return", result)
        
        let resObj = JSON.parse(result)
        if (resObj.status != 0 || !resObj.data) {
            return
        }
    } catch (e) {
        logger.log("report bug", "failed by error", e)
        return
    }

    logger.log("report bug", "start upload bug")

    // 上报错误
    try {
        new HttpRequest().request(appCfg.reportUrl+"/clientbug-add", {md5:md5val, bug:bug}, null, true)
    } catch (e) {
        logger.log("report bug", "upload bug failed by error", e)
        return
    }
}

if (cc.sys.isNative) {
    // @ts-ignore
    window.__errorHandler = function (url: string, lineNum: number, msg: any, stacks: string) {
        let bug = new Bug()
        bug.init(msg, stacks)

        // 特殊处理一下, 现在原生下面启动游戏，总是会报一个错：Cannot set property 'width' of null
        // 这个错误发生第一次的jsb.onResize调用setCanvasSize时，此时cc.game.canvas还是空的，应该是引擎的问题
        // 对于这个错误暂时不上报
        if (bug.id.stacks.length == 2) {
            if (bug.id.stacks[0][3] == "setCanvasSize" && bug.id.stacks[1][3] == "jsb.onResize") {
                return
            }
        }

        let cacheLogs = logger.getCacheLogs()
        bug.logs = cacheLogs.slice(cacheLogs.length < 10 ? 0 : cacheLogs.length - 10, cacheLogs.length)

        logger.log(JSON.stringify(bug.id))
        reportBug(bug)
    }
}
