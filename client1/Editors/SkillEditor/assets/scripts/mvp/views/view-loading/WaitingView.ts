

enum LOAD_STATE {
    NONE = 0,
    FADEIN,
    LOADING,
    FADEOUT,
}

const FADE_TIME = 0.3;

const MAX_LOAD_TIME = 20000;

const {ccclass, property} = cc._decorator;
@ccclass
export default class WaitingView extends cc.Component {
    @property(cc.Node)      nodeBG: cc.Node = null;

    private _state: LOAD_STATE = LOAD_STATE.NONE;
    private _waitSeq: Function[] = [];

    private _lastLoadTime = 0;

    show (loadHandler: Function) {
        if (this._state != LOAD_STATE.NONE) {
            this._waitSeq.push(loadHandler);
            return;
        }
        
        this._lastLoadTime = Date.now();
        this.node.opacity = 0;
        this.node.active = true;

        this._realShow(loadHandler);
    }

    private _checkNext (): boolean {
        if (this._waitSeq.length > 0) {
            this._realShow(this._waitSeq.shift());
            return true;
        } else {
            return false;
        }
    }

    private _realShow (loadHandler: Function) {
        // 根据当前的状态，来判断是否需要fade
        if (this._state === LOAD_STATE.LOADING) {
            this._lastLoadTime = Date.now();
            loadHandler();
        } else {
            if (this._state === LOAD_STATE.NONE || this._state === LOAD_STATE.FADEOUT) {
                this._state = LOAD_STATE.FADEIN;
                this.node.runAction(cc.sequence(
                    cc.fadeIn(FADE_TIME).easing(cc.easeCubicActionOut()),
                    cc.delayTime(FADE_TIME/2),
                    cc.callFunc(() => {
                        this._lastLoadTime = Date.now();
                        this._state = LOAD_STATE.LOADING;
                        loadHandler();
                    })
                ));
            }
        }
    }

    hide () {
        if (this._state === LOAD_STATE.LOADING) {
            if (!this._checkNext()) {
                this._realHide ();
            }
        }
    }

    private _realHide () {
        this._state = LOAD_STATE.FADEOUT;
        this.node.runAction(cc.sequence(
            cc.fadeOut(FADE_TIME / 3).easing(cc.easeCubicActionIn()),
            cc.callFunc(() => {
                this._state = LOAD_STATE.NONE;
                if (!this._checkNext()) {
                    this.node.active = false;
                }
            })
        ));
    }

    private _reset () {
        this._state = LOAD_STATE.NONE;
        this._waitSeq = [];
        this.node.stopAllActions();
        this.node.active = false;
    }

    update () {
        if (this._state !== LOAD_STATE.NONE && Date.now() - this._lastLoadTime > MAX_LOAD_TIME) {
            console.log(`Wait Time has overload. clear all wait state.`);
            this._reset();
        }
    }
}