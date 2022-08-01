
class EngineHook {
    public DEFAULT_INTERVAL = 1 / 60.0;

    private _sysFrameTime = 0;
    private _paused = false;    

    constructor () {
    }

    initialize () {
        cc.director.on(cc.Director.EVENT_BEFORE_UPDATE, this._onBeforeUpdate, this);
        cc.director.on(cc.Director.EVENT_AFTER_UPDATE, this._onAfterUpdate, this);
        this._sysFrameTime = this.DEFAULT_INTERVAL;
    }

    pauseTimer () {
        this._paused = true;
    }

    resumeTimer () {
        this._paused = false;
    }

    get frameInterval (): number {
        return this._sysFrameTime;
    }

    set frameInterval (v: number) {
        this._sysFrameTime = v;
    }

    get paused (): boolean {
        return this._paused;
    }

    updateSchedule (time: number) {
        let self = cc.director;
        const Obj = cc.Object;
        let updateFunc = () => {
            self.emit(cc.Director.EVENT_BEFORE_UPDATE);
            // Call start for new added components
            // @ts-ignore
            self._compScheduler.startPhase();
            // Update for components
            // @ts-ignore
            self._compScheduler.updatePhase(self._deltaTime);
            // Engine update with scheduler
            // @ts-ignore
            self._scheduler.update(self._deltaTime);
            // Late update for components
            // @ts-ignore
            self._compScheduler.lateUpdatePhase(self._deltaTime);
            // User can use this event to do things after update
            // @ts-ignore
            self.emit(cc.Director.EVENT_AFTER_UPDATE);
            // Destroy entities that have been removed recently
            // @ts-ignore
            Obj._deferredDestroy();            
        };

        let totalTime = 0;
        while (totalTime < time) {
            updateFunc();
            totalTime += this._sysFrameTime;
        }
    }

    private _onBeforeUpdate () {
        let deltTime = this._sysFrameTime;
        if (this._paused) {
            deltTime = 0;
        }
        // @ts-ignore
        cc.director._deltaTime = deltTime;
    }

    private _onAfterUpdate () {        
    }
}

const engineHook = new EngineHook();

export default engineHook;