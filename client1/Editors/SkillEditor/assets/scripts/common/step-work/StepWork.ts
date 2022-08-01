/**
 * File: StepWork.ts
 * Description: 分布任务执行器
 *  分为两种任务：同步任务&异步任务
 *  1. 同步任务会每帧执行一个
 *  2. 异步任务最多同时执行 MAX_ASYNC_TASK（5） 个
 * 
 *  任务有优先级，优先级高的任务，一定在优先级低的任务之前完成
 * 
 */


import { logger } from "../log/Logger";
import scheduleManager from "../ScheduleManager";

enum TASK_STATE {
    NONE = 0,
    DOING,
    FINISH,
}

const WORK_TIMEOUT = 10;

const MAX_ASYNC_TASK = 5;

enum TASK_TYPE {
    SYNC = 0,
    ASYNC,
}

class BaseTask {
    private _state = TASK_STATE.NONE;
    private _name = '';
    protected _jobHandler: Function = null;
    protected _type: TASK_TYPE = TASK_TYPE.SYNC;

    constructor (name: string, handler: Function) {
        this._jobHandler = handler;
        this._name = name;
    }

    get state (): TASK_STATE {
        return this._state;
    }

    set state (v: TASK_STATE) {
        this._state = v;
    }

    get name (): string {
        return this._name;
    }

    get finished(): boolean {
        return this._state === TASK_STATE.FINISH;
    }

    exec () {
        logger.warn('StepWork', `need overwrite exec from BaseTask`);
    }

    get type (): TASK_TYPE {
        return this._type;
    }
}

/**
 * @desc 同步执行任务，每一个exec，都是一个同步执行的过程
 *
 * @class SyncTask
 * @extends {BaseTask}
 */
class SyncTask extends BaseTask {
    constructor (name: string, handler: Function) {
        super(name, handler);
        this._type = TASK_TYPE.SYNC;
    }

    exec () {
        if (this.state === TASK_STATE.NONE) {
            this.state = TASK_STATE.DOING;
            this._jobHandler && this._jobHandler();
            this.state = TASK_STATE.FINISH;
        }
    }
}

/**
 * @desc 异步执行任务，每一个exec的任务，都要有一个执行成功的返回值
 *
 * @class AsyncTask
 * @extends {BaseTask}
 */
class AsyncTask extends BaseTask {
    constructor (name: string, handler: Function) {
        super(name, handler);
        this._type = TASK_TYPE.ASYNC;
    }

    exec () {
        if (this.state === TASK_STATE.NONE) {
            this.state = TASK_STATE.DOING;
            this._jobHandler && this._jobHandler((err: any) => {
                this.state = TASK_STATE.FINISH;
                if (err) {
                    logger.error('StepWork', `AsyncTask name = ${this.name} execute failed. err = ${err}`);
                }
            });
        }
    }
}

interface SyncHandler {
    (): void;
};

interface AsyncHandler {
    (callback: Function): void;
}

interface TasksWithPriority {
    tasks: BaseTask[];
    priority: number;
}


enum WORK_STATUS {
    NONE = 0,
    DOING,
    DOING_SUB,
    FINISH,
}


/**
 * @desc 可以按照时间切片进行任务处理的模块，每一帧单独处理
 *  
 * @class StepWork
 */
class StepWork {
    private _state = WORK_STATUS.NONE;
    private _handler: Function = null;      // 完成任务的回调

    private _scheduleId = 0;                // schedule的Id，用来
    private _timeoutId = 0;                 // 超时的Id以及超时时间
    private _timeout = 0;

    private _currIndex = 0;                 // 当前优先级下的序列索引
    private _currPriorityIndex = 0;         // 优先级的索引

    private _subWork: StepWork = null;

    // 带优先级的队列
    private _tasksWithPriority: TasksWithPriority[] = [];

    constructor (timout = WORK_TIMEOUT) {
        this._timeout = timout;
    }

    isAsyncHandler (obj: any): obj is AsyncHandler {
        return obj.length > 0;
    }

    /**
     * @desc 加入任务，如果有异步的任务，要使用AsyncHandler接口类型标注，记得完成返回的调用
     *
     * @param {(SyncHandler | AsyncHandler)} jobHandler
     * @param {string} [name='defaultJob']
     * @param {number} [priority = 0] 0最低，越大越高；任务优先级，优先级高的总是会优先处理完之后，再处理优先级低的
     * @returns {StepWork}
     * @memberof StepWork
     */
    addTask (jobHandler: SyncHandler | AsyncHandler, name = 'defaultJob', priority = 0): StepWork {
        if (this.isAsyncHandler(jobHandler)) {
            return this._addTask(new AsyncTask(name, jobHandler), priority);
        } else {
            return this._addTask(new SyncTask(name, jobHandler), priority);
        }
    }

    /**
     * @desc 开始执行任务，优先级高的会优先执行，执行完之后才会执行低优先级的；同等优先级的，按照序列执行
     *
     * @param {Function} handler
     * @memberof StepWork
     */
    start (handler: Function) {
        if (this._state !== WORK_STATUS.NONE) {
            return;
        }

        this._state = WORK_STATUS.DOING;
        this._handler = handler;
        if (this._scheduleId == 0) {
            this._scheduleId = scheduleManager.schedule(() => {
                this._update();
            }, 0);

            this._timeoutId = scheduleManager.scheduleOnce(() => {
                logger.warn('StepWork', `work has already Timeout. need check work!!!!`);
            }, this._timeout);
        }
    }

    /**
     * @desc 停止任务；野蛮停止；不考虑后果，也没有回调！！
     *
     * @memberof StepWork
     */
    stop () {
        this._currIndex = 0;
        this._currPriorityIndex = 0;
        this._tasksWithPriority = [];
        this._scheduleId && scheduleManager.unschedule(this._scheduleId);
        this._timeoutId && scheduleManager.unschedule(this._timeoutId);
        this._scheduleId = 0;
        this._timeoutId = 0;
        this._state = WORK_STATUS.NONE;
        this._handler = null;

        if (this._subWork) {
            this._subWork.stop();
        }
        this._subWork = null;
    }

    get length (): number {
        return this._tasksWithPriority.length + (this._subWork ? this._subWork.length : 0);
    }

    get timeout (): number {
        return this._timeout;
    }

    private _finish () {
        this._handler && this._handler();
        this._handler = null;
        this.stop();
    }

    private get _currProcessTasks (): TasksWithPriority {
        if (this._currPriorityIndex < this._tasksWithPriority.length) {
            return this._tasksWithPriority[this._currPriorityIndex];
        }
        return null;
    }

    private get _currAsyncProcessTaskCount (): number {
        let ret = 0;
        const tasks = this._currProcessTasks;
        if (tasks && tasks.tasks.length > 0) {
            tasks.tasks.forEach(task => {
                if (task.type === TASK_TYPE.ASYNC && task.state === TASK_STATE.DOING) {
                    ++ret;
                }
            });
        }
        return ret;
    }

    /**
     * @desc 获取当前剩余的异步任务数量；包括执行中和未开始的
     *
     * @readonly
     * @private
     * @type {number}
     * @memberof StepWork
     */
    private get _leftAsyncTaskCount (): number {
        let ret = 0;
        const tasks = this._currProcessTasks;
        if (tasks && tasks.tasks.length > 0) {
            tasks.tasks.forEach(task => {
                if (task.type === TASK_TYPE.ASYNC && task.state !== TASK_STATE.FINISH) {
                    ++ret;
                }
            });
        }
        return ret;
    }

    private _appendOneAsyncTask (): boolean {
        const tasks = this._currProcessTasks;
        if (tasks && tasks.tasks.length > 0) {
            const ret = tasks.tasks.some(task => {
                if (task.type === TASK_TYPE.ASYNC && task.state === TASK_STATE.NONE) {
                    task.exec();
                    return true;
                }
                return false;
            });
            return ret;
        }
        return false;
    }

    private _execSyncTask (): boolean {
        const tasks = this._currProcessTasks;
        if (tasks && tasks.tasks.length > 0) {
            while (this._currIndex < tasks.tasks.length) {
                const task = tasks.tasks[this._currIndex];
                if (task.type === TASK_TYPE.SYNC && task.state === TASK_STATE.NONE) {
                    task.exec();
                    return true;
                }
                ++this._currIndex;
            }
        }
        return false;
    }

    private _allTaskFinished (): boolean {
        const currTasks = this._currProcessTasks;
        if (!currTasks) {
            return true;
        }

        if (this._leftAsyncTaskCount == 0 && this._currIndex >= currTasks.tasks.length) {
            return true;
        }

        return false;
    }

    private _checkToGoNextPriority () {
        const tasks = this._currProcessTasks;
        if (tasks) {
            const v = tasks.tasks.some(task => {
                if (task.state != TASK_STATE.FINISH) {
                    return true;
                }
                return false;
            });
    
            if (!v) {
                this._currPriorityIndex++;
                this._currIndex = 0;
            }
        }
    }

    private _update () {
        if (this._state === WORK_STATUS.NONE || this._state === WORK_STATUS.FINISH) {
            return;
        }

        let appendAsync = true;
        // 先更新异步的Task
        if (this._currAsyncProcessTaskCount < MAX_ASYNC_TASK) {
            appendAsync = this._appendOneAsyncTask();
        }        

        let execSyncTask = this._execSyncTask();

        if (!appendAsync && !execSyncTask) {
            this._checkToGoNextPriority();
        }

        // 检查是否已经finish了
        if (this._allTaskFinished()) {
            // 检查一下subWork
            if (this._subWork) {
                scheduleManager.unschedule(this._scheduleId);
                this._scheduleId = 0;
                this._state = WORK_STATUS.DOING_SUB;
                this._subWork.start(() => {
                    this._finish();
                });
            } else {
                this._finish();
            }
        }
    }

    private _getTasksWithPriority (priority: number, append = false): TasksWithPriority {
        let ret = null;
        let currIndex = this._tasksWithPriority.length;
        this._tasksWithPriority.some((v, index) => {
            if (v.priority === priority) {
                ret = v;
                return true;
            } else if (v.priority < priority) {
                currIndex = index;
                return true;
            }
            return false;
        });
        
        if (!ret && append) {
            ret = {priority: priority, tasks: []};
            this._tasksWithPriority.splice(currIndex, 0, ret);            
        }

        return ret;
    }

    private _addTask (task: BaseTask, priority: number): StepWork {
        const tasks = this._getTasksWithPriority(priority, true);
        tasks.tasks.push(task);
        return this;
    }

    /**
     * @desc 多个任务可以串联起来执行；会按照任务的链条进行执行，排在前边的优先执行，完了之后再进入下一个Task
     *  example: 
     *      const stepWork = ...;
     *      const work2 = xxx;
     *      const anotherWork = xxx;
     *      stepWork.concat(work2).concat(anotherWork)
     *      
     *      stetpWork.start();
     *  执行顺序就是，stepWork -> work2 -> anotherWork
     *
     * @param {StepWork} stepWork
     * @returns {StepWork}
     * @memberof StepWork
     */
    concact (stepWork: StepWork): StepWork {
        if (this._state !== WORK_STATUS.NONE) {
            logger.error('StepWork', `Can not add work for status = ${this._state}`);
            return this;
        }

        this.addSubWork(stepWork);
        return this;
    }

    /**
     * @desc 添加子任务；业务层，请使用concact，不要使用addSubWork！！
     *
     * @param {StepWork} stepWork
     * @memberof StepWork
     */
    addSubWork (stepWork: StepWork) {
        this._timeout = this._timeout + stepWork.timeout;
        if (this._subWork) {
            this._subWork.addSubWork(stepWork);
        } else {
            this._subWork = stepWork;
        }
    }
}

export {
    StepWork as default,
    AsyncHandler,
    SyncHandler,
}
