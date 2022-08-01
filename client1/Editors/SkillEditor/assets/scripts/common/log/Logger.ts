/*
 * @Author:
 * @Date: 2021-03-16 14:12:16
 * @LastEditTime: 2021-03-16 14:20:11
 * @Description: 日志类
 */

import { LogInterface, LogFilter, LogTransform, LogBackendConsole, LogBackendNative, LogCache, LogCacheRichTex, LogBackendNode } from "./tslogger/LogImpl";
import { isNative } from "../../app/PackageUtils";

const MAX_CACHE_LOG = 100;

let dateFormat = (fmt: string, date: Date) => {
    let ret;
    const opt = {
        "Y+": date.getFullYear().toString(),        // 年
        "m+": (date.getMonth() + 1).toString(),     // 月
        "d+": date.getDate().toString(),            // 日
        "H+": date.getHours().toString(),           // 时
        "M+": date.getMinutes().toString(),         // 分
        "S+": date.getSeconds().toString(),         // 秒
        "L+": date.getMilliseconds().toString()     // 毫秒
    };
    for (let k in opt) {
        ret = new RegExp("(" + k + ")").exec(fmt);
        if (ret) {
            //@ts-ignore
            fmt = fmt.replace(ret[1], (ret[1].length == 1) ? (opt[k]) : (opt[k].padStart(ret[1].length, "0")))
        };
    };
    return fmt;
}

class Logger {
    private _impl: LogInterface = null;
    private _filter: LogFilter = null;
    private _cache: LogCache = new LogCache();
    private _cacheWithFormat: LogCacheRichTex = new LogCacheRichTex();

    constructor () {
        this._impl = new LogInterface();
        this._filter = new LogFilter();
        let backends: LogTransform = new LogBackendConsole();
        try {
            //@ts-ignore
            if (cc && cc.sys.isNative) {
                backends = new LogBackendNative();
            }
        } catch (error) {
            backends = new LogBackendNode();
        }

        this._filter.append(this._cache);
        this._filter.append(this._cacheWithFormat);
        this._impl.append(this._filter).append(backends);
    }

    debug (name: string, ...param: any[]): Logger {
        this._impl.debug(name, ...param);
        return this;
    }

    info (name: string, ...param: any[]): Logger {
        this._impl.info(name, ...param);
        return this;
    }

    warn (name: string, ...param: any[]): Logger {
        this._impl.warn(name, ...param);
        return this;
    }

    error (name: string, ...param: any[]): Logger {
        this._impl.error(name, ...param);

        if (isNative()) {
            let log = this._cache.cache[this._cache.cache.length - 1]
            let pos = log.indexOf(']')
            if (pos != -1) {
                log = log.substr(pos + 1, log.length - pos - 1)
            }
            log = "[LOGGER-ERROR]"+log

            // @ts-ignore
            window.__errorHandler("LOGGER-ERROR", 0, log, "")
        }
        return this;
    }

    log (name: string, ...param: any[]): Logger {
        this._impl.debug(name, ...param);
        return this;
    }

    getCacheLogs () {
        return this._cache.cache;
    }

    clearCacheLogs () {
        this._cache.clear();
    }

    getCacheWithFormat () {
        return this._cacheWithFormat.cache;
    }
}

let createLogger = function (){
    return console;
}

let logger = new Logger();

export {
    logger,
    createLogger,
}

