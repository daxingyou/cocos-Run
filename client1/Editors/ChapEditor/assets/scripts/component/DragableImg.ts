import container from "../module/container"
const {ccclass, property} = cc._decorator;

@ccclass
export default class DragableImg extends cc.Component {

    @property(cc.Node) target: cc.Node = null;
    @property(cc.Label) resLabel: cc.Label = null;
    @property(container) container: container = null;

    private _oldPosition: cc.Vec3 = new cc.Vec3();
    private _isSelecting: boolean = false;
    private _index: number = 0;
    set index(val:number){
        this._index = val;
    }
    get index(){
        return this._index;
    }
    set selected(val:boolean){
        this._isSelecting = val;
    }
    get selected(){
        return this._isSelecting;
    }
    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    start () {
       

    }

    onLoad() {
        //注册节点的触摸监听事件
        this.node.on(cc.Node.EventType.TOUCH_START, this._onTouchStart, this);
        this.node.on(cc.Node.EventType.TOUCH_MOVE, this._onTouchMove, this);
        this.node.on(cc.Node.EventType.TOUCH_END, this._onTouchEnd, this);
        this.node.on(cc.Node.EventType.TOUCH_CANCEL, this._onTouchEnd, this);
    }

    _onTouchMove(touchEvent:any) {
        let location = touchEvent.getLocation();
        //this.node.position = this.node.parent.convertToNodeSpaceAR(location);
    }

    _onTouchStart(touchEvent:any){
        //缓存原始父节点
        cc.log("ssss");
        this._oldPosition = this.node.position;
    }
    _onTouchEnd(touchEvent:any) {
        if (!this.target) {
            return;
        }
        //获取target节点在父容器的包围盒，返回一个矩形对象
        let rect:cc.Rect = this.target.getBoundingBox();
        //使用target容器转换触摸坐标
        let location:cc.Vec2 = touchEvent.getLocation();
        let point:cc.Vec2 = this.target.parent.convertToNodeSpaceAR(location);
        if (rect.contains(point)) {
            //在目标矩形内，修改节点坐标  
            let url: string = `bg/${this.resLabel.string}`;
            this.container.setBgResource(url);
        }
        this.node.position = this._oldPosition;
    }
    // update (dt) {}
}
