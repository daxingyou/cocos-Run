import container from "../module/container";
import {nodeProp,routeProp} from "../const/type";
const {ccclass, property} = cc._decorator;

@ccclass
export default class DragableNode extends cc.Component {

    @property(cc.Node) target: cc.Node = null;
    @property(cc.Integer) type: number = 0;
    @property(cc.Node) tag: cc.Node = null;
    @property(cc.Boolean) isRoute: boolean = false;
    @property(cc.ScrollView) mainScrollView: cc.ScrollView = null;

    private _offset: cc.Vec2 = new cc.Vec2();
    private _oldPosition: cc.Vec3 = new cc.Vec3();
    private _oldRect: cc.Rect = new cc.Rect();
    private _container:container = null;
    private _isCloned: boolean = false;
    private _isSelecting: boolean = false;
    private _index: number = 0;
    private _reverse: boolean = false;
    private _heroName: string  = "";
    private _nodeProp: nodeProp = {
        "name" : "",
        "posx" : 0,
        "posy" : 0,
        "type" : this.type,
        "hero" : this._heroName,
        "index": this._index,
        "reverse" : this._reverse
    };
    private _routeProp: nodeProp = {
        "name" : "",
        "posx" : 0,
        "posy" : 0,
        "index": this._index,
        "reverse" : this._reverse
    }
    
    set isCloned(val:boolean){
        this._isCloned = val;
    }

    set index(val:number){
        this._nodeProp.index = val;
        this._routeProp.index = val;
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
    set reverse(val:boolean){
        this._nodeProp.reverse = val;
        this._routeProp.reverse = val;
        this._reverse = val;
    }
    get reverse(){
        return this._reverse;
    }
    set heroName(val:string){
        if(this.isRoute) return;
        this._nodeProp.hero = val;
        this._heroName = val;
    }
    get heroName(){
        return this._heroName;
    }
    /**
     * @desc给配置保存使用
     * 地图节点没有英雄和类型
     */
    get prop(){
        this._routeProp.name = this.node.name;
        this._routeProp.posx = this.node.x;
        this._routeProp.posy = this.node.y;

        this._nodeProp.name = this.node.name;
        this._nodeProp.posx = this.node.x;
        this._nodeProp.posy = this.node.y;
        this._nodeProp.type = this.type;
        
        return this.isRoute ? this._routeProp : this._nodeProp;
    }
    
    set prop(val:any){
        this.node.x = val.posx;
        this.node.y = val.posy;
        this.reverse = val.reverse;
        this.index = val.index;
        this.type = val.type;
        this.heroName = val.hero;

        //this._nodeProp = val;
    }
    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    start () {
    }

    onLoad() {
        // this._nodeProp = {
        //     "name" : this.node.name,
        //     "posx" : this.node.x,
        //     "posy" : this.node.y,
        //     "type" : this.type,
        //     "hero" : this._heroName,
        //     "index": this._index,
        //     "reverse" : this._reverse
        // };
        this._container = this.target.getComponent("container");
        //注册节点的触摸监听事件
        this.node.on(cc.Node.EventType.TOUCH_START, this._onTouchStart, this);
        this.node.on(cc.Node.EventType.TOUCH_MOVE, this._onTouchMove, this);
        this.node.on(cc.Node.EventType.TOUCH_END, this._onTouchEnd, this);
        this.node.on(cc.Node.EventType.TOUCH_CANCEL, this._onTouchEnd, this);
        //注册节点的鼠标监听事件
        this.node.on(cc.Node.EventType.MOUSE_DOWN,this._onMouseDown,this);
        //键盘事件监听
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_UP,this._onKeyUp,this);
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN,this._onKeyDown,this);
    }

    _onTouchMove(touchEvent:any) {
        let location = touchEvent.getLocation();
        let pos:cc.Vec2 = this.node.parent.convertToNodeSpaceAR(location);
        let x:number = Math.floor(pos.x),y:number = Math.floor(pos.y);
        this.node.position = new cc.Vec3(x-this._offset.x,y-this._offset.y,0);
    }

    _onTouchStart(touchEvent:any){
        //缓存原始父节点
        this.clearBorder();
        this.mainScrollView.vertical = false;
        this._oldPosition = this.node.position;
        this._oldRect = this.node.getBoundingBox();
        //记录初始鼠标偏移值
        let location = touchEvent.getLocation();
        this._offset = this.node.convertToNodeSpace(location);
        this._offset.x =  Math.floor(this._offset.x - this.node.width/2);
        this._offset.y =  Math.floor(this._offset.y - this.node.height/2);
    }
    _onTouchEnd(touchEvent:any) {
        if (!this.target) {
            return;
        }
        //获取target节点在父容器的包围盒，返回一个矩形对象
        let rect:cc.Rect = this.target.getBoundingBox();
        let location:cc.Vec2 = touchEvent.getLocation();
        let point:cc.Vec2 = this.target.parent.convertToNodeSpaceAR(location);
        if (rect.contains(point) && !this._isCloned) {
            //在目标矩形内，修改节点坐标  
            let copyNode = cc.instantiate(this.node);
            let point = this.target.convertToNodeSpaceAR(location); 
            let x:number = Math.floor(point.x),y:number=Math.floor(point.y);
            copyNode.position = new cc.Vec3(x,y,0);
            copyNode.getComponent("DragableNode")._isCloned = true;
            copyNode.getComponent("DragableNode").drawBorder();
            this.node.position = this._oldPosition;
            if(this.isRoute) this._container.pushRoute(copyNode);
            if(!this.isRoute) this._container.pushNode(copyNode);
            
            //this.sendNodeChangedEvent(copyNode);
        }
        else if (rect.contains(point) && this._isCloned) {
            let point:cc.Vec2 = this.node.parent.convertToNodeSpaceAR(location);
            let x:number = Math.floor(point.x),y:number=Math.floor(point.y);
            if(!this._oldRect.contains(point)){
                //点击区域在框内不做移动
                this.node.position = new cc.Vec3(x-this._offset.x,y-this._offset.y,0);
            }
            this._container.selectingRoute = this.isRoute;
            this._container.drawBorderForOne(this._index);
            if(!this.isRoute){
                this._container.updateNodeProp(this._index);
                this._container.clearLines();
                this._container.redrawAllLines();
            }
            else{
                this._container.updateRouteProp(this._index);
            }
        }
        else{
            this.node.position = this._oldPosition;
        }
        this.mainScrollView.vertical = true;
    }

    _onMouseDown(mouseEvent:any){
        if(mouseEvent.getButton()==cc.Event.EventMouse.BUTTON_RIGHT && this._isSelecting){
            this._container.deleteNode(this._index,this.isRoute);
        }
    }
    
    _onKeyDown(event:cc.Event.EventKeyboard){
        if(!this.selected) return;
        switch(event.keyCode) {
            case cc.macro.KEY.up:
                this.node.y = this.node.y+1;
                break;
            case cc.macro.KEY.down:
                this.node.y = this.node.y-1;
                break;
            case cc.macro.KEY.left:
                this.node.x = this.node.x-1;
                break;
            case cc.macro.KEY.right:
                this.node.x = this.node.x+1;
                break;
        }
        //手动刷新章节属性和视图
        if(!this.isRoute){
            this._container.updateNodeProp(this._index);
            this._container.clearLines();
            this._container.redrawAllLines();
        }
        else{
            this._container.updateRouteProp(this._index);
        }
        this.sendNodeChangedEvent(this.node);
    }

    _onKeyUp(event:cc.Event.EventKeyboard){
        switch(event.keyCode) {
            case cc.macro.KEY.a:
                console.log('release a key');
                break;
        }
    }

    drawBorder(){
        let ctx: cc.Graphics = this.node.getComponent(cc.Graphics);
        let size: cc.Size = this.node.getContentSize();
        ctx.clear();
        ctx.lineWidth = 3;
        ctx.strokeColor = cc.Color.GREEN;
        ctx.moveTo(-size.width/1.8,-size.height/1.8);
        ctx.lineTo(-size.width/1.8,size.height/1.8);
        ctx.lineTo(size.width/1.8,size.height/1.8);
        ctx.lineTo(size.width/1.8,-size.height/1.8);
        ctx.lineTo(-size.width/1.8,-size.height/1.8);
        ctx.stroke(); 
    }

    clearBorder(){
        let ctx: cc.Graphics = this.node.getComponent(cc.Graphics);
        ctx.clear();
    }

    sendNodeChangedEvent(fromNode:cc.Node){
        fromNode.dispatchEvent(new cc.Event.EventCustom("container_node_changed",true));
    }

    showTag(show:boolean,index:number){
        if(this.tag){
            this.tag.scaleX = this.node.scaleX;
            this.tag.zIndex = 1;
            this.tag.active = show;
            this.tag.getComponentInChildren(cc.Label).string = String(index+1) || "";
        }
    }
    // update (dt) {}
}
