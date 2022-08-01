import { utils } from "../../app/AppUtils";
import BaseModel from "./BaseModel";

/**
 * 服务器时间
 */
class ServerTime extends BaseModel {
    private _serverTime: number = 0;
    private _openServerTime: number = 0;
    private _localTime: number = 0;

    get openServerTime(){
        return this._openServerTime;
    }
    
    initServerTime (serverTime: any) {
        this._serverTime = utils.longToNumber(serverTime);
        this._localTime = Date.now();
    }

    initOpenSeverTime (openServerTime: any) {
        this._openServerTime = utils.longToNumber(openServerTime);
    }
    /**
     * @description 返回服务器时间（单位：秒）
     * @returns 
     */
    currServerTime () {
        return this._serverTime + Math.floor((Date.now() - this._localTime) / 1000);
    }
}

let serverTime = new ServerTime();
export {serverTime}