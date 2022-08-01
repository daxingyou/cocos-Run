
interface EventInfo {
    target: object,
    func: () => void,
    name?: string;
}

export default class BTStepWork {
    // 定时器句柄
    private _timerHandler: number = null;
    // 事件队列
    private _eventList: Array<EventInfo> = [];
    // 当前事件索引（当前事件包括子事件的数量，不包含查到队列尾部的事件）
    private _eventIndex: number = 0;
    // 子事件插入索引（事件产生的子事件深度优先处理）
    private _subEventIndex: number = 0;
    // 处理状态
    private _isProcessing: boolean = false;
    // 外部暂停
    private _isRunning: boolean = true;

    constructor () {
        this._timerHandler = 0;
        this._eventList = [];
        this._subEventIndex = 0;
        this._isProcessing = false;
    }

    stop () {
        this._isRunning = false;
        this._isProcessing = false;
    }

    resume () {
        this._isRunning = true;
        this._timerHandler && clearTimeout(this._timerHandler);
        this._timerHandler = setTimeout(() => {
            this._exec();
        }, 0);
    }

    clear () {
        this._eventList = [];
        this._eventIndex = 0;
        this._subEventIndex = 0;
        this._isRunning = true;
        this._timerHandler && clearTimeout(this._timerHandler);
        this._timerHandler = 0;
    }

    addStepWork (target: object, func: () => void, toHead: boolean, name: string, toEventBottom: boolean) {
        let eventInfo = { target: target, func: func, name: name };
        if (toHead) {
            this._eventList.splice(this._subEventIndex, 0, eventInfo);
            this._subEventIndex++;
            this._eventIndex++;
        } else if (toEventBottom) {
            let index = this._eventIndex > 0 ? (this._eventIndex - 1) : 0;
            this._eventList.splice(index, 0, eventInfo);
            this._eventIndex++;
        } else {
            this._eventList.push(eventInfo);
        }

        if (this._timerHandler == 0) {
            this._timerHandler = setTimeout(() => {
                this._exec();
            }, 0);
        }
    }

    private _exec () {
        if (this._isProcessing)
            return;

        while (this._eventList.length > 0 && this._isRunning) {
            this._isProcessing = true;
            const event = this._eventList.shift();
            if (event != null) {
                this._subEventIndex = 0;
                this._eventIndex--;
                if (this._eventIndex < 0) this._eventIndex = 0;
                event.func.apply(event.target);
            }
            this._isProcessing = false;
        }

        if (this._timerHandler) {
            clearTimeout(this._timerHandler);
            this._timerHandler = 0;
        }
    }
}
