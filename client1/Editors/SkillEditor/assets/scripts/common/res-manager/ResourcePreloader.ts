import StepWork from "../step-work/StepWork";

interface LoadCallback {
    (err?: any): void;
}

interface LoadHandler {
    (path: string, callback?: LoadCallback): void;
}

interface ReleaseHandler {
    (path: string): void;
}

interface PreloaderInfo {
    name: string;                       // Loader 的 name
    loadeHandler: LoadHandler;
    releaseHandler: ReleaseHandler;
    arrResource: string[];
}

class PreloaderValue {
    private _info: PreloaderInfo = null;
    private _arrRes: string[] = [];
    private _stepWork: StepWork = null;

    constructor (info: PreloaderInfo) {
        this._info = info;
        this._stepWork = new StepWork();
    }

    get name (): string {
        return this._info.name;
    }

    get stepWork (): StepWork {
        return this._stepWork;
    }

    release () {
        this._arrRes.forEach(resName => {
            this._info.releaseHandler(resName);
        });
        this._arrRes.length = 0;
    }

    addRes (res: string) {
        this._arrRes.push(res);
    }

    toString (): string {
        return this._arrRes.join('++');
    }
}

class ResourcePreloader {
    public static addLoader (info: PreloaderInfo): PreloaderValue {
        const retValue = new PreloaderValue(info);
        const stepWork = retValue.stepWork;

        const isAsyncJob = info.loadeHandler.length > 1;
        info.arrResource.forEach(resName => {
            if (isAsyncJob) {
                stepWork.addTask((callback: (err: any)=>void) => {
                    info.loadeHandler(resName, (err: any) => {
                        // logger.debug('ResourcePreloader', `load Async task name = ${resName}`);
                        if (!err) {
                            retValue.addRes(resName);
                        }
                        callback(err);
                    })
                }, `Preloader_${resName}`);
            } else {
                stepWork.addTask(() => {
                    // logger.debug('ResourcePreloader', `load sync task name = ${resName}`);
                    info.loadeHandler(resName);
                    retValue.addRes(resName);
                }, `Preloader_${resName}`);
            }
        })
        return retValue;
    }
}

export {
    ResourcePreloader,
    PreloaderValue,
    PreloaderInfo,
    LoadHandler,
    LoadCallback,
    ReleaseHandler,
}

