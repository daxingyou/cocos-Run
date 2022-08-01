import { logger } from "../../../../common/log/Logger";

const {ccclass, property} = cc._decorator;

@ccclass
export default class UIComboxItem extends cc.Component {
    private _label: cc.Label = null;
    private _data: any = null;
    private _originColor: cc.Color;
    private _handler: (data: any) => void;

    @property(cc.Node)
    nodeLabel: cc.Node = null;

    onLoad () {
        this._label = this.nodeLabel.getComponent(cc.Label);
        if (!this._label) {
            logger.warn('UICombox', `Can not find Label for UIComboxItem. name = ${this.node.name}`);
            return;
        }

        this._originColor = this.nodeLabel.color;

        this.node.on(cc.Node.EventType.TOUCH_START, this._onTouchStart, this);
        this.node.on(cc.Node.EventType.TOUCH_MOVE, this._onTouchMove, this);
        this.node.on(cc.Node.EventType.TOUCH_CANCEL, this._onTouchCancel, this);
        this.node.on(cc.Node.EventType.TOUCH_END, this._onTouchEnd, this);
    }

    _changeColor (reset = false) {
        if (reset) {
            this.nodeLabel.color = this._originColor;
        } else {
            this.nodeLabel.color = cc.Color.RED;
        }
    }

    _onTouchStart (event: cc.Event) {
        this._changeColor(false);
    }

    _onTouchMove (event: cc.Event) {
    }

    _onTouchCancel (event: cc.Event) {
        this._changeColor(true);
    }

    _onTouchEnd (event: cc.Event) {
        this._changeColor(true);
        this._handler(this._data);
    }

    setHandler (handler: (data: any) => void) {
        this._handler = handler;
    }

    get string (): string {
        if (this._label) {
            return this._label.string;
        }

        return this.nodeLabel.getComponent(cc.Label).string;
    }

    set string (v: string) {
        if (this._label) {
            this._label.string = v;
        }

        this._data = v;
        this.nodeLabel.getComponent(cc.Label).string = v;
    }
}