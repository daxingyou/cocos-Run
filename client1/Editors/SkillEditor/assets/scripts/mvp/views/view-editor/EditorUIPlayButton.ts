import { audioManager } from "../../../common/AudioManager";
import EditorUtils from "./EditorUtils";

const {ccclass, property} = cc._decorator;

enum PLAY_STATUS {
    PLAY = 0,
    PAUSE,
}

@ccclass
export default class EditorUIPlayButton extends cc.Component {
    @property(cc.Button)
    button: cc.Button = null;

    @property(cc.Node)
    nodePlay: cc.Node = null;

    @property(cc.Node)
    nodePause: cc.Node = null;

    private _status: PLAY_STATUS = PLAY_STATUS.PAUSE;

    onLoad () {
        this._status = PLAY_STATUS.PAUSE;
        this.nodePause.active = false;
    }

    play () {
        if (this._status === PLAY_STATUS.PAUSE) {
            this._status = PLAY_STATUS.PLAY;
            this.nodePause.active = true;
            this.nodePlay.active = false;
            this._fireButtonEvent();
            audioManager.resumeAllEffects();
        }
    }

    pause () {
        if (this._status === PLAY_STATUS.PLAY) {
            this._status = PLAY_STATUS.PAUSE;
            this.nodePause.active = false;
            this.nodePlay.active = true;
            this._fireButtonEvent();
            audioManager.pauseAllEffects();
        }
    }

    get paused (): boolean {
        return this._status === PLAY_STATUS.PAUSE;
    }

    set status (v: PLAY_STATUS) {
        this._status = v;
        if (v == PLAY_STATUS.PAUSE) {
            this.nodePause.active = false;
            this.nodePlay.active = true;
        } else {
            this.nodePause.active = true;
            this.nodePlay.active = false;            
        }
    }

    get status (): PLAY_STATUS {
        return this._status;
    }

    onClick () {
        if (this._status === PLAY_STATUS.PLAY) {
            this.pause();
        } else {
            this.play();
        }
    }

    private _fireButtonEvent () {
        const event = new cc.Event.EventCustom(EditorUtils.EVENT_PLAY_CLICKED, true);
        event.detail = this.status;
        this.node.dispatchEvent(event);
    }
}