import { eventCenter } from "../../../common/event/EventCenter";
import { commonEvent } from "../../../common/event/EventData";


enum LOAD_STATE {
    NONE = 0,
    FADEIN,
    LOADING,
    FADEOUT,
}

const FADE_TIME = 0.3;

const { ccclass, property } = cc._decorator;
@ccclass
export default class LoadingView extends cc.Component {
    @property(cc.Node) nodeBG: cc.Node = null;
    // @property(cc.Animation)     anim: cc.Animation = null;

    private _state: LOAD_STATE = LOAD_STATE.NONE;

    show(loadHandler: Function) {
        if (this._state != LOAD_STATE.NONE) {
            return;
        }

        this._state = LOAD_STATE.NONE;

        this.node.opacity = 0;
        this.node.active = true;
        // this.anim.play();
        this.node.runAction(cc.sequence(
            cc.fadeIn(FADE_TIME),
            cc.callFunc(() => {
                this._state = LOAD_STATE.LOADING;
                loadHandler();
            })
        ));
    }

    hide() {
        if (this._state === LOAD_STATE.LOADING) {
            this._realHide();
        }
    }

    private _realHide() {
        this._state = LOAD_STATE.FADEOUT;
        this.node.runAction(cc.sequence(
            cc.fadeOut(FADE_TIME),
            cc.callFunc(() => {
                this._state = LOAD_STATE.NONE;
                this.node.active = false;
                eventCenter.fire(commonEvent.HIDE_LOADING);
                // this.anim.stop();
            })
        ));
    }
}
