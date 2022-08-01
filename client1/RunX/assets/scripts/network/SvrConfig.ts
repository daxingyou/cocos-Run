/*
 * @Author: Fly
 * @Date: 2021-09-13 10:37:38
 * @LastEditors: Fly
 * @LastEditTime: 2022-03-22 15:07:13
 * @Description: 
 */
import { worldsvr } from "./lib/protocol"

function getSvrUrl(ip: string, port: string) {
    return `ws://${ip}:${port}`;
}

let svrList = {
    //#ZQBDEBUG
    outerUrl: "pk-login.zqgame.com",// 外网服地址 139.159.160.130
    aduitUrl: "124.71.115.38",      // 审核地址
    //ZQBDEBUG#
    innerUrl: "192.168.130.58",     // 内网地址
    dexUrl: "192.168.55.25",        // fly服地址
    zeKunUrl: "192.168.55.20",      // 泽坤服地址
    liuUrl: "192.168.130.91",       // 测试专用服
    localhost: "localhost",         // 本地测试
}

let svrConfig = {
    // worldsvrUrl: "ws://121.37.247.132:9100",
    worldsvrUrl: "ws://pk-login.zqgame.com:9100",

    // 从server获取的信息
    isAudit: false,
    worldTag: 10,
    recommandSvr: "",
    fetchGamesvrs: <worldsvr.IGamesvrInfo[]>[],

    get worldsvr () {
        if (this.recommandSvr) {
            return getSvrUrl(this.recommandSvr, "9100")
        }
        return this.worldsvrUrl
    } 
}

export {
    svrList,
    svrConfig,
}

//#ZQBDEBUG
svrConfig.worldsvrUrl = getSvrUrl(svrList.innerUrl, "9100");
//ZQBDEBUG#
