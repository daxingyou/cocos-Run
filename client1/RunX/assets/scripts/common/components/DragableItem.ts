
/*
 * @Description: ScrollView可拖动的Item
 * @Autor: lixu
 * @Date: 2021-05-19 20:22:23
 * @LastEditors: lixu
 * @LastEditTime: 2022-03-31 11:26:57
 */
const {ccclass, property} = cc._decorator;

const MIN_DISTANCE_OF_TOUCH = 5;
const LONG_CLICK_TIME = 1.5;
const LongClickDelayTime = 0.5;


@ccclass
export default class DragableItem extends cc.Component {

    private _scrollView: cc.ScrollView = null;
    private _isDrag: boolean = false;
    private _isClick: boolean = false;
    private _isLongClick: boolean = false;
    private _minAngleOfDrag : number = 30;
    private _isDelWhenUsed: boolean = true;

    private _copyNode: cc.Node = null;
    private _parentOfDragNode: cc.Node = null;
    private _clickHandler: (comp: DragableItem, ...rest: any[]) => boolean = null;
    private _dragHandler: (comp: DragableItem, ...rest: any[]) => boolean = null;
    private _delCallback: (comp: DragableItem, ...rest: any[]) => void = null;
    private _longClickCb: Function = null;
    private _customParam: any = null;
    private _longClickProgressCb: Function = null;
    private _longClickStartSec: number = 0;
    private _clickStartPos: cc.Vec2 = null;
    private _longClickInterruptCb: Function = null;

    static currSele: DragableItem = null;
    static isBeHoldID: number = NaN;

    /**
     * @description: 拖动组件初始化
     * @param {cc.ScrollView} 组件挂载的节点所在的CCScrollView
     * @param {cc.Node} 拖拽后生成Node挂载在哪个节点上
     * @param {boolean} 选中的item使用后是否删除
     * @param {number} 算作拖动的角度的最小阈值
     * @param {function} clickHandle  点击的回调
     * @param {function} dragHandler  拖动结束的回调
     * @return {*}
     * @author: lixu
     */
    init(scrollView: cc.ScrollView, parentOfDragNode: cc.Node, isDelWhenUsed: boolean = true, minAngleOfDrag?: number, clickHandle?: (comp: DragableItem) => boolean, dragHandler?: (comp: DragableItem) => boolean, delCallback?: (comp: DragableItem) => void, longClickHandler?: Function, customparam?: any){
        this._scrollView = scrollView;
        this._parentOfDragNode = parentOfDragNode;
        this._minAngleOfDrag = minAngleOfDrag || this._minAngleOfDrag;
        this._isDelWhenUsed = isDelWhenUsed;
        this._clickHandler = clickHandle;
        this._dragHandler = dragHandler;
        this._delCallback = delCallback;
        this._customParam = customparam;
        this._longClickCb = longClickHandler;
        this._registEvent();
    }

    set longClickProgressCb(cb: Function){
        this._longClickProgressCb = cb;
    }

    set longClickInterruptCb(cb: Function){
        this._longClickInterruptCb = cb;
    }

    private _onTouchStart(event: cc.Event.EventTouch){
        //已经有被选中的Item,则其他的item不做处理
        if(DragableItem.currSele) return;
        DragableItem.currSele = this;

        //防止多点触摸
        if(!isNaN(DragableItem.isBeHoldID)) return;
        DragableItem.isBeHoldID = event.getID();

        this._isClick = true;
        this._isLongClick = false;
        this._isDrag = false;
        this._longClickStartSec = cc.director.getTotalTime();
        this._clickStartPos = event.getLocation();
        let locPos = this.node.convertToNodeSpaceAR(event.getLocation());
        this._clickStartPos = this.node.convertToWorldSpaceAR(locPos);
        this.scheduleOnce(this._checkLongClick, LONG_CLICK_TIME);
        this.schedule(this._updateLongClickPb, 0, cc.macro.REPEAT_FOREVER);
    }

    private _updateLongClickPb(){
        let costTime = cc.director.getTotalTime() - this._longClickStartSec;
        costTime /= 1000;
        if(costTime < LongClickDelayTime || !this._longClickProgressCb) return;
        costTime -= LongClickDelayTime;
        let totalTime = LONG_CLICK_TIME - LongClickDelayTime;
        this._longClickProgressCb(costTime / totalTime, this._clickStartPos);
        this._clickStartPos && (this._clickStartPos = null);
    }

    private _checkLongClick(){
        this.unschedule(this._checkLongClick);
        this.unschedule(this._updateLongClickPb);
        if(!this._isClick) return;
        this._isClick = false;
        this._isDrag = false;
        this._isLongClick = true;
        if(cc.isValid(this._scrollView)){
            this._scrollView.enabled = false;
        }
        this._longClickInterrupt();
        this._longClickCb && this._longClickCb(this._customParam);
    }

    private _onTouchMoved(event: cc.Event.EventTouch){
        //放置多选或者多点触摸
        if(!DragableItem.currSele || DragableItem.currSele != this) return;
        if(isNaN(DragableItem.isBeHoldID) || event.getID() != DragableItem.isBeHoldID) return;

        if(this._isLongClick) return;
        let vector = event.getStartLocation().sub(event.getLocation());
        if(this._isClick && vector.mag() >= MIN_DISTANCE_OF_TOUCH && !this._isDrag
        ){
            if(Math.abs(vector.y /vector.x) > Math.abs(Math.tan( this._minAngleOfDrag * Math.PI / 180))){
                this._isClick = false;
                this._isLongClick = false;
                this._isDrag = true;
                this.unschedule(this._checkLongClick);
                this.unschedule(this._updateLongClickPb);
                this._longClickInterrupt();
                if(this._scrollView && cc.isValid(this._scrollView)){
                    this._scrollView.enabled = false;
                    this._copyNode = cc.instantiate(this.node);
                    this._copyNode.parent = this._parentOfDragNode;
                }else{
                    this._copyNode = this.node;
                }
            }else{
                this._isLongClick = false;
                this._isClick = false;
                this._isDrag = false;
            }
        }

        //拖动状态下
        if(this._isDrag && cc.isValid(this._copyNode)){
            this._copyNode.setPosition((this._parentOfDragNode || this.node.parent).convertToNodeSpaceAR(event.getLocation()));
        }
    }

    private _onTouchEnded(event: cc.Event.EventTouch){
        //防止多选或者多点触摸
        if(!DragableItem.currSele || DragableItem.currSele != this) return;
        if(isNaN(DragableItem.isBeHoldID) || event.getID() != DragableItem.isBeHoldID) return;

        this.unschedule(this._checkLongClick);
        this.unschedule(this._updateLongClickPb);
        this._longClickInterrupt();

        if(this._isClick){
            this._itemBeUsed(this._clickHandler && this._clickHandler(this, this._customParam));
        }

        if(this._isDrag){
            this._itemBeUsed(this._dragHandler && this._dragHandler(this, this._copyNode, this._customParam));
        }
        this.unschedule(this._checkLongClick);
        this._reset();
    }

    /**
     * @des scrollView中默认勾选划动取消子节点的点击事件，触发cancel事件。
     */
    private _onTouchCancel(event: cc.Event.EventTouch){
        if(!DragableItem.currSele || DragableItem.currSele != this) return;
        if(isNaN(DragableItem.isBeHoldID) || event.getID() != DragableItem.isBeHoldID) return;

        this.unschedule(this._checkLongClick);
        this.unschedule(this._updateLongClickPb);
        this._longClickInterrupt();

        if(this._isDrag){
            this._itemBeUsed(this._dragHandler && this._dragHandler(this, this._copyNode, this._customParam));
        }
        this._reset();
    }


    private _longClickInterrupt(){
        this._longClickInterruptCb && this._longClickInterruptCb(this.node);
    }

    private _reset(){
        DragableItem.isBeHoldID = NaN;
        DragableItem.currSele = null;
        this._isClick = false;
        this._isDrag = false;
        this._isLongClick = false;
        this._clickStartPos = null;
        this._longClickStartSec = 0;
        if(cc.isValid(this._scrollView)){
            this._scrollView.enabled = true;
        }
        if(cc.isValid(this._copyNode, true) && this.node != this._copyNode){
            this._copyNode.destroy();
        }
    }

    private _itemBeUsed(isUsed: boolean = false){
        if(cc.isValid(this._copyNode, true) && this.node != this._copyNode){
            this._copyNode.destroy();
            this._copyNode = null;
        }
        if(isUsed && this._isDelWhenUsed && cc.isValid(this.node, true) && this.node != this._copyNode){
            this._unRegistEvent();
            this._delCallback && this._delCallback(this, this._customParam, () => {
                // if(cc.isValid(this.node, true)){
                //     this.node.destroy()
                // }
            });
        }
        this._copyNode = null;
    }

    private _unRegistEvent(){
        this.node.off(cc.Node.EventType.TOUCH_START, this._onTouchStart, this);
        this.node.off(cc.Node.EventType.TOUCH_MOVE, this._onTouchMoved, this);
        this.node.off(cc.Node.EventType.TOUCH_END, this._onTouchEnded, this);
        this.node.off(cc.Node.EventType.TOUCH_CANCEL, this._onTouchCancel, this);
    }

    private _registEvent(){
        this.node.on(cc.Node.EventType.TOUCH_START, this._onTouchStart, this);
        this.node.on(cc.Node.EventType.TOUCH_MOVE, this._onTouchMoved, this);
        this.node.on(cc.Node.EventType.TOUCH_END, this._onTouchEnded, this);
        this.node.on(cc.Node.EventType.TOUCH_CANCEL, this._onTouchCancel, this);
    }

    deInit() {
        this.unscheduleAllCallbacks();
        this._reset();
        this._unRegistEvent();
    }
}
