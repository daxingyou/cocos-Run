
class ScheduleManager {
    private _seq = 0;
    private _handlers = new Map();
    private _ccInst: cc.Component = null;
    constructor () {
    }

    init (ccInst: cc.Component) {
        this._ccInst = ccInst;
    }    

    /**
     * @desc 按照指定时间提供回调，仅执行一次
     *
     * @param {Function} handler 要执行的回调函数
     * @param {number} interval 秒，可以接收浮点数
     * @returns {number} 返回一个唯一的ID，如果要取消回调，需要使用提供的ID
     * @memberof ScheduleManager
     */
    scheduleOnce (handler: Function, interval: number): number {
        const id = this._newId();
        const func = () => {
            if (this._handlers.has(id)) {
                handler();
            }
            this._removeHandler(id);
        }
        this._handlers.set(id, func);
        this._ccInst.scheduleOnce(func, interval);
        return id;
    }

    schedule (handler: Function, interval: number): number {
        const id = this._newId();
        const func = (dt: number) => {
            handler(dt);
        }
        this._handlers.set(id, func);
        this._ccInst.schedule(func, interval);
        return id;
    }

    unschedule (id: number) {
        if (this._handlers.has(id)) {
            this._ccInst.unschedule(this._handlers.get(id));
            this._removeHandler(id);
        }
    }

    private _removeHandler (id: number) {
        this._handlers.delete(id);
    }

    private _newId (): number {
        return ++this._seq;
    }
}

let scheduleManager = new ScheduleManager();

export {
    scheduleManager as default
}