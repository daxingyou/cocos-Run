import FileDownloader from "./FileDownloader";

const CONCURRENT_DOWNLOADER_WIFI = 5;
const CONCURRENT_DOWNLOADER = 5;
const ERROR_TIMES = 6;

interface TaskInfo {
    url: string,
    destPath: string,
    md5: string,
    succ: boolean,
    errorTimes: number
}

export default class MulitDownloader {
    private _started: boolean = false;
    private _maxDownloader: number = 0;
    private _pool: FileDownloader[] = [];
    private _running: FileDownloader[] = [];
    private _nextTask: number = 0;
    private _tasks: TaskInfo[] = [];
    private _totalDoneCount: number = 0;
    private _doneCount: number = 0;
    private _progressCallback: Function = null;
    private _finishCallback: Function = null;

    constructor () {
    }

    init (isWifi: boolean) {
        this._maxDownloader = CONCURRENT_DOWNLOADER_WIFI;
        if (!isWifi) this._maxDownloader = CONCURRENT_DOWNLOADER;

        for (let i = 0; i < this._maxDownloader; i++) {
            this._pool.push(new FileDownloader());
        }
    }

    setCallback (progress: Function, finished: Function) {
        this._progressCallback = progress;
        this._finishCallback = finished;
    }

    progress () {
        if (this._doneCount >= this._tasks.length) {
            return 1;
        } else {
            return Math.min(this._doneCount / this._tasks.length, 0.99);
        }
    }

    clear () {
        if (this._started) return;
        
        this._nextTask = 0;
        this._tasks = [];
        this._doneCount = 0;
        this._totalDoneCount = 0;
        this._progressCallback = null;
        this._finishCallback = null;
    }

    addTask (url: string, destPath: string, md5: string) {
        if (this._started) return;
        
        this._tasks.push({
            url: url,
            destPath: destPath,
            md5: md5,
            succ: false,
            errorTimes: 0
        });
    }

    start () {
        if (this._started) return;

        let tasks: TaskInfo[] = [];
        this._tasks.forEach(task => {
            if (!task.succ) tasks.push(task);
        });

        this._tasks = tasks;
        this._totalDoneCount += this._doneCount;
        this._doneCount = 0;
        this._nextTask = 0;

        if (this._nextTask >= this._tasks.length) {
            this._finishCallback(true);
            return;
        }

        this._started = true;
        while (this._downloadOneTask(null)) {
            ;
        }
    }

    stop () {
        if (!this._started) return;

        this._running.forEach(downloader => {
            downloader.abort();
            this._pool.push(downloader);
        });
        this._running = [];
        this._started = false;
    }

    private _downloadOneTask (task: TaskInfo): boolean {
        if (this._pool.length == 0) return false;

        if (!task && this._nextTask >= this._tasks.length) return false;

        let downloader = this._pool.pop();
        this._running.push(downloader)
        if (!task) {
            task = this._tasks[ this._nextTask ];
            ++this._nextTask;
        }

        let url = task.url;
        if (task.errorTimes >= 1) {
            url = task.url + "?v=" + task.errorTimes;
        }

        downloader.start(url, task.destPath, task.md5, (succ: boolean, reason: any) => {
            this._pool.push(downloader);
            for (let i = 0; i < this._running.length; i++) {
                if (this._running[i] == downloader) {
                    this._running.splice(i, 1);
                    break;
                }
            }

            if (!succ) {
                ++task.errorTimes;
                if (task.errorTimes % ERROR_TIMES == 0) {
                    this.stop();
                    if (this._finishCallback) {
                        this._finishCallback(false, task, reason);
                    }
                } else {
                    this._downloadOneTask(task);
                }
                return;
            }

            task.succ = true;
            ++this._doneCount;
            
            if (this._progressCallback) {
                this._progressCallback(this._doneCount + this._totalDoneCount, this._tasks.length + this._totalDoneCount);
            }

            let has_new = this._downloadOneTask(null);
            if (!has_new && this._pool.length == this._maxDownloader && this._finishCallback) {
                this._started = false;
                this._finishCallback(true);
            }
        });
        return true;
    }
}