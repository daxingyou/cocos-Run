
const stringfy = (name: string, level: string, ...args: any[]): string => {
    let ret: any[] = [];
    if (name) {
        ret.push(name);
    }

    if (level) {
        ret.push(level);
    }

    ret = ret.concat(args);

    ret.forEach((v, i) => {
        if (v && typeof v === 'object') {
            if (v.constructor && v.constructor.isBuffer) {
                v = v.toString();
            } else {
                if (v instanceof Error) {
                    let info = v.message;
                    if (v.stack) {
                        info = info + '\n' + v.stack;
                    }
                    ret[i] = info;
                } else {
                    if (v.toString) {
                        ret[i] = v.toString();
                    } else {
                        try {
                            ret[i] = JSON.stringify(v);
                        } catch (err) {
                        }
                    }
                }
            }
        } else {
            ret[i] = v;
        }
    });

    return ret.join(' ');
}

const timeStamp = (): string => {
    let dateFormat = (fmt: string, date: Date): string => {
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

    return dateFormat('mm-dd HH:MM:SS LLL', new Date());
}

enum LOG_COLOR {
    Black = '#000',
    Red = '#c23621',
    Green = '#25bc26',
    Yellow = '#bbbb00',
    Blue = '#492ee1',
    Magenta = '#d338d3',
    Cyan = '#33bbc8',
    Gray = '#808080',
    Purple = '#708',
}

const getLogColor = (cr: LOG_COLOR, inverse: boolean): string => {
    if (inverse) {
        return `color: #fff; background: ${cr};`
    } else {
        return `color: ${cr};`;
    }
}

enum LOG_LEVEL {
    Debug,
    Info,
    Warn,
    Error,
}

class LogTransform {
    private _children: LogTransform[] = [];
    private _parent: LogTransform = null;

    constructor () {
    }

    get children (): LogTransform[] {
        return this._children;
    }

    write (name: string, level: LOG_LEVEL, ...args: any[]) {
    }

    /**
     * @desc 附加一个Log处理模块
     *
     * @param {LogTransform} child
     * @returns {LogTransform} 返回Child实例
     * @memberof LogTransform
     */
    append (child: LogTransform): LogTransform {
        this._children.push(child);
        return child;
    }

    remove (child: LogTransform) {
        const index = this._children.indexOf(child);
        if (index >= 0) {
            this._children.splice(index, 1);
        }
    }

    detach () {
        if (this._parent) {
            this._parent.remove(this);
            this._parent = null;
        }
    }

    toChildren (name: string, level: LOG_LEVEL, ...args: any[]) {
        this._children.forEach(t => {
            t.write(name, level, ...args);
        });
    }
}

interface LogFilterInfo {
    name: string;
    filter: LOG_LEVEL[];
}

class LogFilter extends LogTransform {
    private _white = new Map<string, LogFilterInfo>();
    private _black = new Map<string, LogFilterInfo>();

    constructor () {
        super();
    }

    write (name: string, level: LOG_LEVEL, ...args: any[]) {
        if (this._test(name, level)) {
            this.toChildren(name, level, ...args);
        }
    }

    allow (name: string, level: LOG_LEVEL) {
        if (this._white.has(name)) {
            const info = this._white.get(name);
            if (info.filter.indexOf(level) === -1) {
                info.filter.push(level);
            }
        } else {
            this._white.set(name, {
                name: name,
                filter: [level],
            });
        }
    }

    deny (name: string, level: LOG_LEVEL) {
        if (this._black.has(name)) {
            const info = this._black.get(name);
            if (info.filter.indexOf(level) === -1) {
                info.filter.push(level);
            }
        } else {
            this._black.set(name, {
                name: name,
                filter: [level],
            });
        }
    }

    clear () {
        this._black.clear();
        this._white.clear();
    }

    private _test (name: string, level: LOG_LEVEL): boolean {
        if (this._white.has(name)) {
            const filterInfo = this._white.get(name);
            const pass = filterInfo.filter.some(l => {
                return level >= l;
            });
            if (pass) {
                return true;
            }
        }

        if (this._black.has(name)) {
            const filterInfo = this._black.get(name);
            const pass = filterInfo.filter.some(l => {
                return level <= l;
            });
            if (pass) {
                return false;
            }
        }

        return true;
    }
}

class LogBackendConsole extends LogTransform {
    constructor () {
        super();
    }

    write (name: string, level: LOG_LEVEL, ...args: any[]) {
        let print = console.log;
        let color = LOG_COLOR.Gray;
        switch (level) {
            case LOG_LEVEL.Debug : print = console.log; color = LOG_COLOR.Gray; break;
            case LOG_LEVEL.Info : print = console.info; color = LOG_COLOR.Gray; break;
            case LOG_LEVEL.Warn : print = console.warn; color = LOG_COLOR.Yellow; break;
            case LOG_LEVEL.Error : print = console.error; color = LOG_COLOR.Red; break;
            default: print = console.log;
        }
        const str = [`[${timeStamp()}] ` + '%c' + `${name} `, getLogColor(color, false) ].concat(args);
        print.apply(console, str);
    }
}

class LogBackendNode extends LogTransform {
    constructor () {
        super();
    }

    write (name: string, level: LOG_LEVEL, ...args: any[]) {
        let print = console.log;
        switch (level) {
            case LOG_LEVEL.Debug : print = console.debug; break;
            case LOG_LEVEL.Info : print = console.info; break;
            case LOG_LEVEL.Warn : print = console.warn; break;
            case LOG_LEVEL.Error : print = console.error; break;
            default: print = console.log;
        }
        const msg = [`${timeStamp()} [${LOG_LEVEL[level]}] [${name}]`].concat(args);
        print.apply(console, msg);
    }
}

class LogBackendNative extends LogTransform {
    constructor () {
        super();
    }

    write (name: string, level: LOG_LEVEL, ...args: any[]) {
        let print = console.log;
        switch (level) {
            case LOG_LEVEL.Debug : print = console.debug; break;
            case LOG_LEVEL.Info : print = console.info; break;
            case LOG_LEVEL.Warn : print = console.warn; break;
            case LOG_LEVEL.Error : print = console.error; break;
            default: print = console.log;
        }

        const msg = [`${timeStamp()} [${LOG_LEVEL[level]}] [${name}]`].concat(args);
        print.apply(console, msg);
    }
}

class LogInterface extends LogTransform {
    constructor () {
        super();
    }

    debug (name: string, ...args: any[]) {
        this.toChildren(name, LOG_LEVEL.Debug, ...args);
    }

    info (name: string, ...args: any[]) {
        this.toChildren(name, LOG_LEVEL.Info, ...args);
    }

    warn (name: string, ...args: any[]) {
        this.toChildren(name, LOG_LEVEL.Warn, ...args);
    }

    error (name: string, ...args: any[]) {
        this.toChildren(name, LOG_LEVEL.Error, ...args);
    }
}

const DEFAULT_MAX_CACHE = 255;
class LogCache extends LogTransform {
    private _maxCache = DEFAULT_MAX_CACHE;
    private _cache: string[] = [];
    constructor () {
        super();
    }

    set maxCache (v: number) {
        this._maxCache = v;
    }

    get cache (): string[] {
        return this._cache;
    }

    clear () {
        this._cache = [];
    }

    write (name: string, level: LOG_LEVEL, ...args: any[]) {
        const str = stringfy(name, LOG_LEVEL[level], ...args);
        const msg = `[${timeStamp()}] ${str}`;
        this._cache.push(msg);

        if (this._cache.length >= this._maxCache) {
            this._cache.shift();
        }
    }
}

enum LogColorRichText {
    Gray = '<color=#808080>',
    Blue = '<color=#492ee1>',
    Green = '<color=#25bc26>',
    Red = '<color=#c23621>',
}

interface CacheRichInfo {
    key: number;
    info: string;
};

class LogCacheRichTex extends LogTransform {
    private _maxCache = 100;
    private _cache: CacheRichInfo[] = [];
    private _currId: number = 0;

    constructor () {
        super();
    }

    set maxCache (v: number) {
        this._maxCache = v;
    }

    get cache (): CacheRichInfo[] {
        return this._cache;
    }

    clear () {
        this._cache = [];
    }

    write (name: string, level: LOG_LEVEL, ...args: any[]) {
        const info = stringfy(null, null, ...args);
        let color = LogColorRichText.Gray;
        switch (level) {
            case LOG_LEVEL.Debug : color = LogColorRichText.Gray; break;
            case LOG_LEVEL.Info :  color = LogColorRichText.Gray; break;
            case LOG_LEVEL.Warn :  color = LogColorRichText.Blue; break;
            case LOG_LEVEL.Error : color = LogColorRichText.Red; break;
        }
        const str = `[${timeStamp()}] ${color}${name}</color> ${info}`;
        
        this._cache.push({
            key: ++this._currId,
            info: str,
        });

        if (this._cache.length >= this._maxCache) {
            this._cache.shift();
        }
    }
}

export {
    LOG_LEVEL,
    LogInterface,
    LogTransform,
    LogCache,
    LogFilter,
    LogBackendConsole,
    LogBackendNative,
    LogBackendNode,
    LogCacheRichTex,
}