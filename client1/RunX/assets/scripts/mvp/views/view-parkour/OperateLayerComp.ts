import {eventCenter} from "../../../common/event/EventCenter";
import {parkourEvent} from "../../../common/event/EventData";
import {PARKOUR_OPERATE} from '../../../app/AppEnums';
import { utils } from '../../../app/AppUtils';
import { localStorageMgr, SAVE_TAG } from "../../../common/LocalStorageManager";

const {ccclass, property} = cc._decorator;
const MIN_DISTANCE = 100;   //触发滑动的最小距离
const MIN_TANGENT = 1; //触发滑动的最小正切值

@ccclass
export default class OperatorLayerComp extends cc.Component{
    @property(cc.Node) btnDown: cc.Node = null;
    @property(cc.Node) btnUp: cc.Node = null;

    private _currOperateType: PARKOUR_OPERATE = null;
    private _startPos: cc.Vec2 = null;
    private _touchID: number = NaN;

    private _isPause: boolean = false;
    private _isAutoPlay: boolean = false;

    private _isInit: boolean = false;

    onLoad(){
        this.node.active = false;
    }

    onInit(){
        this.node.active = true;
        this._init();
    }

    private _init(){
        if(this._isInit) return;
        this._isInit = true;
        this._initUI();
        this.initEvents();
        this.onResetOperateType();
    }

    deInit(){
        this._isPause = false;
        this._isAutoPlay = false;
        this._startPos = null;
        this.node.active = false;
    }

    onRelease(){
        eventCenter.unregisterAll(this);
        if(cc.sys.OS_WINDOWS){
            cc.systemEvent.off(cc.SystemEvent.EventType.KEY_DOWN, this._onKeyDown, this);
        }
        this._isInit = false;
    }

    private _initUI(){
        utils.addClickEventListener(this.btnDown,null , null, this.onDownClicked.bind(this));
        utils.addClickEventListener(this.btnUp,null , null, this.onUPClicked.bind(this));
    }

    initEvents() {
        eventCenter.register(parkourEvent.RESET_OPERATE_TYPE, this, this.onResetOperateType);
        if(cc.sys.OS_WINDOWS){
            cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this._onKeyDown, this);
        }
    }

    private _onKeyDown(event: any){
        if(event.keyCode === cc.macro.KEY.up){
            this.onUPClicked();
        }

        if(event.keyCode === cc.macro.KEY.down){
            this.onDownClicked();
        }

        if(event.keyCode == cc.macro.KEY.space){
            if(this._isPause){
                eventCenter.fire(parkourEvent.RESUME_LOGIC);
            }else{
                eventCenter.fire(parkourEvent.PAUSE_LOGIC);
            }
            this._isPause = !this._isPause
        }
    }

    //自动模式
    setAutoPlay(isAuto: boolean){
        this._isAutoPlay = isAuto;
        this.node.active = !isAuto;
    }

    //向下按钮点击事件
    public onDownClicked(){
        if( this._isAutoPlay) return;
        eventCenter.fire(parkourEvent.GO_DOWN);
    }

    //向上按钮点击事件
    public onUPClicked(){
        if( this._isAutoPlay) return;
        eventCenter.fire(parkourEvent.GO_UP);
    }

    //暂停逻辑运行
    public onPauseAndResume(){
        if(cc.director.isPaused())
            cc.director.resume()
        else
            cc.director.pause();
    }

    //切换操作方式
    private switchOperateType(type: PARKOUR_OPERATE){
        if(this._currOperateType === type) return;
        this._currOperateType = type;

        this.btnDown.active = this._currOperateType == PARKOUR_OPERATE.CLICK;
        this.btnUp.active = this._currOperateType == PARKOUR_OPERATE.CLICK;
        if(this._currOperateType ===  PARKOUR_OPERATE.CLICK){
            this.node.off(cc.Node.EventType.TOUCH_START, this.onTouchStart, this);
            this.node.off(cc.Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
            this.node.off(cc.Node.EventType.TOUCH_END, this.onTouchEnd, this);
            this.node.off(cc.Node.EventType.TOUCH_CANCEL, this.onTouchCancel, this);
        }else{
            this.node.on(cc.Node.EventType.TOUCH_START, this.onTouchStart, this);
            this.node.on(cc.Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
            this.node.on(cc.Node.EventType.TOUCH_END, this.onTouchEnd, this);
            this.node.on(cc.Node.EventType.TOUCH_CANCEL, this.onTouchCancel, this);
        }
    }

    private onTouchStart(event: cc.Event.EventTouch){
        if(this._startPos || !isNaN(this._touchID)) return;
        let startPos = event.getLocation();
        this._startPos = cc.v2(startPos.x, startPos.y);
        this._touchID = event.getID();
    }

    private onTouchMove(event: cc.Event.EventTouch) {
        let currTouchID = event.getID();
        if(isNaN(this._touchID) && currTouchID != this._touchID) return;
        this._checkAction(event);
    }

    private onTouchEnd(event: cc.Event.EventTouch) {
        let currTouchID = event.getID();
        if(isNaN(this._touchID) &&currTouchID != this._touchID) return;
        this._checkAction(event);
    }

    private onTouchCancel(event: cc.Event.EventTouch){
        this._resetTouch();
    }

    private _checkAction(event: cc.Event.EventTouch){
        let currLocation = event.getLocation();
        currLocation = cc.v2(currLocation.x, currLocation.y);
        let vec = currLocation.sub(this._startPos);
        let dis = vec.mag();
        let tangent = Math.abs(vec.y / vec.x);

        if(tangent < MIN_TANGENT){
            this._resetTouch();
            return;
        }

        if(tangent >= MIN_TANGENT && dis>= MIN_DISTANCE){
            if(vec.y > 0){//上滑操作
                this.onUPClicked();
            }else{
                this.onDownClicked();
            }
            this._resetTouch();
        }
    }

    onResetOperateType(){
        let operateType = localStorageMgr.getAccountStorage(SAVE_TAG.PARKOUR_MODE) || PARKOUR_OPERATE.CLICK;
        this.switchOperateType(operateType);
    }

    private _resetTouch(){
        this._startPos = null;
        this._touchID = NaN;
    }
}
