//自定义按钮组件，支持 点击(click)/长按(longClick)/拖动(drag)操作
//如果需要长按操作，设置longClickTime必须最小为0.5
const {ccclass, property} = cc._decorator;

enum ClickType{
    None = -1,
    TouchStart,
    Click,
    LongClick,
    Draging,
    DragEnd,
    InterruptLongClick
}

type ClickHandlerFunc = (clickType: ClickType, target: cc.Node) => void;

const MIN_DRAG_DIS = 20;

const LongClickDelayTime = 0.5;

@ccclass
export default class UIClick extends cc.Component {

    @property isDrag: boolean = false;
    //判定为长按的时间
    @property longClickTime: number = 1.5;

    static currOper : UIClick = null;

    private _currTouchID: number = NaN;
    private _isClick: boolean = false;
    private _isLongClick: boolean = false;;
    private _isDragable: boolean = false;
    private _opHandler: ClickHandlerFunc = null;
    private _longClickProgressCb: Function = null;
    private _longClickStartSec: number = 0;
    private _clickStartPos: cc.Vec2 = null;

    set clickHandler(handler: ClickHandlerFunc){
        this._opHandler = handler;
    }

    set longClickProgressCb(cb: Function){
        this._longClickProgressCb = cb;
    }

    start() {
        this.node.on(cc.Node.EventType.TOUCH_START, this._onTouchStart, this);
        this.node.on(cc.Node.EventType.TOUCH_MOVE, this._onTouchMoved, this);
        this.node.on(cc.Node.EventType.TOUCH_END, this._onTouchEnded, this);
        this.node.on(cc.Node.EventType.TOUCH_CANCEL, this._onTouchCanceled, this);
    }

    deInit() {
        this._reset();
    }

    onDestroy(){
        this.node.off(cc.Node.EventType.TOUCH_START, this._onTouchStart, this);
        this.node.off(cc.Node.EventType.TOUCH_MOVE, this._onTouchMoved, this);
        this.node.off(cc.Node.EventType.TOUCH_END, this._onTouchEnded, this);
        this.node.off(cc.Node.EventType.TOUCH_CANCEL, this._onTouchCanceled, this);
        this._opHandler = null;
        this._longClickProgressCb = null;
    }

    private _onTouchStart(event: cc.Event.EventTouch){
        if(UIClick.currOper) return;
        UIClick.currOper = this;

        if(!isNaN(this._currTouchID)) return;
        this._isClick = true;
        this._isLongClick = false;
        this._isDragable = false;
        this._clickStartPos = event.getLocation();
        let locPos = this.node.convertToNodeSpaceAR(event.getLocation());
        this._clickStartPos = this.node.convertToWorldSpaceAR(locPos);
        if(this._isSupportLongClick()){
            this.scheduleOnce(this._checkLongClick, this.longClickTime);
            this._longClickStartSec = cc.director.getTotalTime();
            this.schedule(this._updateLongClickPb,0, cc.macro.REPEAT_FOREVER);
        }
        this._currTouchID = event.getID();
        this._opHandler && this._opHandler(ClickType.TouchStart, this.node);
    }

    private _checkLongClick(){
        this.unschedule(this._checkLongClick);
        this.unschedule(this._updateLongClickPb);
        this.node.pauseSystemEvents(true);
        if(!this._isClick) return;
        this._isClick = false;
        this._isDragable = false;
        this._isLongClick = true;
        this._longClickInterrupt();
        this._opHandler && this._opHandler(ClickType.LongClick, this.node);
        this._reset();
        this.node.resumeSystemEvents(true);
    }



    private _onTouchMoved(event: cc.Event.EventTouch){
        if(UIClick.currOper != this) return;
        if(isNaN(this._currTouchID) || this._currTouchID != event.getID()) return;
        //长按取消拖动监听
        if(this._isLongClick) return;
        let offset1 = event.getStartLocation().sub(event.getPreviousLocation());
        if(offset1.mag() >= MIN_DRAG_DIS && this.isDrag && !this._isDragable && this._isClick){
            this._isClick = false;
            this._isLongClick = false;
            this._isDragable = true;
            this.unschedule(this._checkLongClick);
            this.unschedule(this._updateLongClickPb);
            this._longClickInterrupt();
            let offset2 = event.getPreviousLocation().sub(event.getStartLocation());
            this.node.setPosition(this.node.getPosition().add(offset2));
        }

        if(this.isDrag && this._isDragable){
            let offset = event.getLocation().sub(event.getPreviousLocation());
            this.node.setPosition(this.node.getPosition().add(offset));
            this._opHandler && this._opHandler(ClickType.Draging, this.node);
        }
    }

    private _onTouchEnded(event: cc.Event.EventTouch){
        if(UIClick.currOper != this) return;
        if(isNaN(this._currTouchID) || this._currTouchID != event.getID()) return;

        this.unschedule(this._checkLongClick);
        this.unschedule(this._updateLongClickPb);
        this._longClickInterrupt();

        if(this._isClick){
            this._opHandler && this._opHandler(ClickType.Click, this.node);
            this._reset();
        }

        if(this.isDrag && this._isDragable){
            this._opHandler && this._opHandler(ClickType.DragEnd, this.node);
            this._reset();
        }
    }

    private _onTouchCanceled(event: cc.Event.EventTouch){
        if(UIClick.currOper != this) return;
        if(isNaN(this._currTouchID) || this._currTouchID != event.getID()) return;

        this.unschedule(this._checkLongClick);
        this.unschedule(this._updateLongClickPb);
        this._longClickInterrupt();

        if(this._isClick){
            this._opHandler && this._opHandler(ClickType.Click, this.node);
            this._reset();
        }

        if(this.isDrag && this._isDragable){
            this._opHandler && this._opHandler(ClickType.DragEnd, this.node);
            this._reset();
        }
    }

    private _isSupportLongClick(){
        return this.longClickTime >= LongClickDelayTime;
    }

    private _longClickInterrupt(){
        this._isSupportLongClick() && this._opHandler && this._opHandler(ClickType.InterruptLongClick, this.node);
    }

    private _updateLongClickPb(){
        let costTime = cc.director.getTotalTime() - this._longClickStartSec;
        costTime /= 1000;
        if(costTime < LongClickDelayTime || !this._longClickProgressCb) return;
        costTime -= LongClickDelayTime;
        let totalTime = this.longClickTime - LongClickDelayTime;
        this._longClickProgressCb(costTime / totalTime, this._clickStartPos);
        this._clickStartPos && (this._clickStartPos = null);
    }

    private _reset(){
        UIClick.currOper = null;
        this._currTouchID = NaN;
        this._isClick = false;
        this._isLongClick = false;
        this._isDragable = false;
        this._longClickStartSec = 0;
        this._clickStartPos = null;
    }
}

export {
    ClickType
}
