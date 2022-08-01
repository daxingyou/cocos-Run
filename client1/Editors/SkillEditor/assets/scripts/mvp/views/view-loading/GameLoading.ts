
enum LOAD_STATE {
    NONE = 0,
    FADEIN,
    LOADING,
    FADEOUT,
}

const SPEED = {
    1: 0.015,
    2: 0.015,
    3: 0.015
}

const {ccclass, property} = cc._decorator;
@ccclass
export default class GameLoading extends cc.Component {
    @property(cc.Node)          nodeBG: cc.Node = null;
    @property(cc.ProgressBar)   progress: cc.ProgressBar = null;

    private _state: LOAD_STATE = LOAD_STATE.NONE;

    private _initPosition () {
        if (this.progress) {
            let widget = this.progress.node.getComponent(cc.Widget);
            if (widget) widget.updateAlignment();

            this.progress.totalLength = this.progress.node.width;
            this.progress.barSprite.node.x = -0.5 * this.progress.totalLength;
            this.progress.progress = 0;
        }
    }

    show (loadHandler: Function) {
        if (this._state != LOAD_STATE.NONE) return;

        this._initPosition();
        this._showLabel();
        this.node.active = true;
        this._state = LOAD_STATE.FADEIN;
        loadHandler && loadHandler();
    }

    hide () {
        if (this._state !== LOAD_STATE.NONE) {
            this._realHide();
        }
    }

    update(dt: number) {
        if (this._state == LOAD_STATE.NONE) return;

        if (this.progress.progress >= 1) {
            if (this._state === LOAD_STATE.FADEOUT) {
                this._state = LOAD_STATE.NONE;
                this.node.active = false;
            }
            return;
        }

        if (this.progress.progress >= 0.999) {
            if (this._state == LOAD_STATE.LOADING) {
                return;
            }
        }
        
        if (this.progress.progress >= 0.6) {
            if (this._state === LOAD_STATE.FADEIN) {
                this._state = LOAD_STATE.LOADING;
            }
        }

        // @ts-ignore
        this.progress.progress += SPEED[this._state];
        if (this.progress.progress >= 1) {
            this.progress.progress = 1;
        }
    }

    private _showLabel () {

    }

    private _realHide () {
        this._state = LOAD_STATE.FADEOUT;
    }
}