import EditorUIPlayButton from "./EditorUIPlayButton";
import EditorUtils from "./EditorUtils";

const {ccclass, property} = cc._decorator;

@ccclass
export default class EditorUITimeline extends cc.Component {
    @property(cc.ProgressBar)
    progress: cc.ProgressBar = null;

    @property(EditorUIPlayButton)
    buttonPlay: EditorUIPlayButton = null;

    @property(cc.Node)
    nodeBar: cc.Node = null;

    private _step: number = 0.01;

    onLoad () {
        this.progress.progress = 0;
        this.nodeBar.x = this.progress.barSprite.node.x;

        // this.nodeBar.on(cc.Node.EventType.TOUCH_MOVE, this._onTouchMove, this);
        // cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this._onKeyDown, this);
        this.buttonPlay.node.on(EditorUtils.EVENT_PLAY_CLICKED, (event: cc.Event.EventCustom) => {
            if (event.detail == 0) {
                const event = new cc.Event.EventCustom(EditorUtils.EVENT_TIMELINE_PLAY, true);
                event.detail = this.value;
                this.node.dispatchEvent(event);
            } else {
                const event = new cc.Event.EventCustom(EditorUtils.EVENT_TIMELINE_PAUSE, true);
                event.detail = this.value;
                this.node.dispatchEvent(event);
            }
        });
    }

    set value (v: number) {
        if (v == this.progress.progress) {
            return;
        }

        this.progress.progress = Math.max(0, Math.min(1, v));
        this.nodeBar.x = this.progress.barSprite.node.x + this.progress.barSprite.node.width;
    }

    get value (): number {
        return this.progress.progress;
    }

    set step (v: number) {
        this._step = Math.max(0, Math.min(0.5, v));
    }

    play () {
        this.buttonPlay.play();
    }

    pause () {
        this.buttonPlay.pause();
    }

    get paused (): boolean {
        return this.buttonPlay.paused;
    }

    reset () {
        this.value = 0;
        this.buttonPlay.status = 1;
    }

    private _onTouchMove (event: any) {
        const currTouch: cc.Touch = event.currentTouch;
        const deltX = currTouch.getDelta().x;

        const maxWidth = this.progress.totalLength;
        const width = Math.max(0, Math.min(maxWidth, this.progress.barSprite.node.width + deltX));
        const v = width / this.progress.totalLength;
        this.value = v;
    }

    private _onKeyDown (event: any) {
        switch (event.keyCode) {
            case cc.macro.KEY.right: {
                this.value = this.value + this._step;
            } break;
            case cc.macro.KEY.left: {
                this.value = this.value - this._step;
            } break;
            default: break;
        }
    }
}