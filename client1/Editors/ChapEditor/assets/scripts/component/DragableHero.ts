import container from "../module/container"
const {ccclass, property} = cc._decorator;

@ccclass
export default class DragableHero extends cc.Component {

    @property(cc.Node) target: cc.Node = null;
    @property(cc.Node) mainView: cc.Node = null;
    @property(cc.Integer) type: number = 0;
    @property(cc.ScrollView) mainScrollView: cc.ScrollView = null;

    private _parentNode: cc.Node = null;
    private _oldPosition: cc.Vec3 = new cc.Vec3();
    private _container:container = null;
    private _cloned:boolean = false;
    private _heroName: string = "";
    
    set heroName(val:string){
        this._heroName = val;
    }
    get heroName(){
        return this._heroName;
    }
    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    start () {
       

    }

    onLoad() {
        this._container = this.target.getComponent("container");
        //注册节点的触摸监听事件
        this.node.on(cc.Node.EventType.TOUCH_START, this._onTouchStart, this);
        this.node.on(cc.Node.EventType.TOUCH_MOVE, this._onTouchMove, this);
        this.node.on(cc.Node.EventType.TOUCH_END, this._onTouchEnd, this);
        this.node.on(cc.Node.EventType.TOUCH_CANCEL, this._onTouchEnd, this);
        //注册节点的鼠标监听事件
        //this.node.on(cc.Node.EventType.MOUSE_DOWN,this._onMouseDown,this)
    }

    _onTouchMove(touchEvent:any) {
        if(this._cloned) return;
       // this.node.removeFromParent();
        let location = touchEvent.getLocation();
        this.node.position = this.node.parent.convertToNodeSpaceAR(location);
    }

    _onTouchStart(touchEvent:any){
        if(this._cloned) return;
        this.mainScrollView.vertical = false;
        this._parentNode = this.node.parent;
        this._oldPosition = this.node.position;
        //更换父节点避免mask遮挡
        let location = touchEvent.getLocation();
        this.node.parent = this.mainView;
        this.node.position = this.node.parent.convertToNodeSpaceAR(location);
    }
    _onTouchEnd(touchEvent:any) {
        if (!this.target || this._cloned) {
            return;
        }
        //获取target节点在父容器的包围盒，返回一个矩形对象
        let rect:cc.Rect = this.target.getBoundingBox();
        //使用target容器转换触摸坐标
        let location:cc.Vec2 = touchEvent.getLocation();
        let point:cc.Vec2 = this.target.parent.convertToNodeSpaceAR(location);
        if (rect.contains(point)) {
            let copyNode = cc.instantiate(this.node);
            this._container.displayNodes.forEach((node,index)=>{
                let nodeRect: cc.Rect = node.getBoundingBox();
                let point:cc.Vec2 = this.target.convertToNodeSpaceAR(location);
                if(nodeRect.contains(point)){
                    copyNode.position = new cc.Vec3(0,0,0);
                    copyNode.getComponent("DragableHero")._cloned = true;
                    this._container.addHero2Node(index,this._heroName);
                    //copyNode.parent=node;
                }
            })
        }
        //节点复原
        this.node.position = this._oldPosition;
        this.node.parent = this._parentNode;
        this.mainScrollView.vertical = true;
    }

    _onMouseDown(mouseEvent:any){
        if(mouseEvent.getButton()==cc.Event.EventMouse.BUTTON_RIGHT){
            this._container.deleteNode(this._index);
        }
    }
    // update (dt) {}
}
