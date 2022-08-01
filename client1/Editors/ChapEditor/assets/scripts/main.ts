
import FloatTips from "./component/FloatTips";
import chapter from "./module/chapter";
import eleProps from "./module/eleProps";
import chapProp from "./module/chapProp";
import {PROP_MSG} from "./const/const";
const file_saver = require("FileSaver");
const {ccclass, property} = cc._decorator;

interface nodeProp{
    name: string,
    posx: number,
    posy: number,
    type: number,
    index: number,
}

@ccclass
export default class main extends cc.Component {

    @property(cc.Button) buttonFile: cc.Button = null;
    @property(cc.Node) optionMenu: cc.Node = null;
    @property(cc.Node) mainMap: cc.Node = null;
    @property(cc.Node) container: cc.Node = null;
    @property(chapter) chapterManager: chapter = null; 
    @property(eleProps) propPanel: eleProps = null;
    @property(chapProp) chapProp: chapProp = null;

    private moving: boolean = false;
    private midMouse: boolean = false;
    private startPosition: cc.Vec2 = new cc.Vec2();
    private movePosition: cc.Vec2 = new cc.Vec2();
    private endPosition: cc.Vec2 = new cc.Vec2();
    private lastPosition: cc.Vec3 = new cc.Vec3();
    @property(FloatTips) floatTips: FloatTips = null;
    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        window["app"] = this;
        // 注册主面板事件触摸监听回调
        this.mainMap.on(cc.Node.EventType.TOUCH_START,this.onTouchStartMain,this);
        this.mainMap.on(cc.Node.EventType.TOUCH_MOVE,this.onTouchMoveMain,this);
        this.mainMap.on(cc.Node.EventType.TOUCH_CANCEL,this.onTouchEndMain,this);
        this.mainMap.on(cc.Node.EventType.TOUCH_END,this.onTouchEndMain,this);

        this.mainMap.on(cc.Node.EventType.MOUSE_DOWN,this.onMouseDown,this);
        this.mainMap.on(cc.Node.EventType.MOUSE_WHEEL,this.onMouseWheel,this);
        this.mainMap.on(cc.Node.EventType.MOUSE_UP,this.onMouseUp,this);

        this.registerAllEventHandler();
    }

    start () {
        cc.debug.setDisplayStats(false); 
    }

    registerAllEventHandler(){
        this.node.on(PROP_MSG.X_CHANGERD,this.onElePropXSet,this);
        this.node.on(PROP_MSG.Y_CHANGERD,this.onElePropYSet,this);
        this.node.on(PROP_MSG.H_CHANGERD,this.onElePropHSet,this);
        this.node.on(PROP_MSG.T_CHANGERD,this.onElePropTSet,this);
        this.node.on(PROP_MSG.R_CHANGERD,this.onElePropRSet,this);
        this.node.on(PROP_MSG.H_CHANGED,this.onChapPropHSet,this);
        this.node.on(PROP_MSG.W_CHANGED,this.onChapPropWSet,this);
        this.node.on("container_node_changed",this.onNodePropChanged,this);
        this.node.on("chap_changed",this.onChapContentChanged,this);
    }

    onTouchStartMain(event:cc.Touch){
        //if (!this.midMouse) return;
        this.moving = false;
        this.lastPosition = this.container.position;
        this.startPosition =  this.mainMap.convertToNodeSpaceAR(event.getLocation());
    }
    
    onTouchMoveMain(event:cc.Touch){
        if (!this.midMouse) return;
        this.moving = true;
        this.movePosition = this.mainMap.convertToNodeSpaceAR(event.getLocation());
        let distance: cc.Vec2 = this.movePosition.sub(this.startPosition);
        let distanceNew: cc.Vec3 = new cc.Vec3(distance.x,distance.y,0);
        this.container.position = this.lastPosition.add(distanceNew)

        //cc.log(`move dis:${distanceNew}`);
    }
    
    onTouchEndMain(event:cc.Touch){
        if (!this.midMouse) return;
        this.moving = false;
        this.endPosition = event.getLocation();
        this.lastPosition = this.container.position;
        // cc.log(`当前坐标:${this.endPosition},节点坐标:${this.mainMap.position}`);
    }

    onMouseDown(event:cc.Event.EventMouse){
        this.container.getComponent("container").drawBorderForOne(-1);
        this.midMouse = event.getButton()==cc.Event.EventMouse.BUTTON_MIDDLE;
    }

    onMouseUp(event:cc.Event.EventMouse){
        this.midMouse = false;
    }

    onMouseWheel(event:cc.Event.EventMouse){
        let zScale:number = event.getScrollY();
        // let pos: cc.Vec2 = this.container.convertToNodeSpaceAR(event.getLocation()); 
        // this.container.setAnchorPoint(pos.x/this.container.width,pos.y/this.container.height)
        this.container.setScale(this.container.scale+zScale/1200);
    }

    //快捷功能按钮
    onButtonReset(){
        let size:cc.Size = this.container.getContentSize();
        this.container.position = new cc.Vec3(-640,-360,0);
        this.container.scale = 1;
    }
    onButtonShowLines(){
        this.container.getComponent("container").showLine = true;
        this.container.getComponent("container").redrawAllLines();
    }
    onButtonHideLines(){
        this.container.getComponent("container").showLine = false;
        this.container.getComponent("container").clearLines();
    }
  
    /**
     * @desc 文件按钮操作
     */
    onButtonFileClick(event:cc.Event,customEvevtData:string){
        // if(!cc.sys.isNative)
        // {
        //      this.showTips("非原生平台无法进行文件操作!");
        //      return;
        // }
        this.optionMenu.active = !this.optionMenu.active;
    }

    onFileLoadSuccess(asset:any){
        this.chapterManager.loadChapters(asset);
    }

    onButtonSaveConfig(event:cc.Event,customEvevtData:string){
        if(cc.sys.isNative){
            let writePath: string = jsb.fileUtils.getWritablePath();
            let chapName: string = "chapter1.json"
            let config:any[] = this.container.getComponent("container").getConfig();
            jsb.fileUtils.writeStringToFile(JSON.stringify(config),`${writePath}${chapName}`);
            this.optionMenu.active = false;
            this.showTips("保存成功！");
            cc.log("sava path: ",`${writePath}${chapName}`);
        }
        else{ 
            let chapName: string = "barriers.json";
            let config: any[] = this.chapterManager.chapters;
            let blob = new Blob([JSON.stringify(config)], {type: "text/plain;charset=utf-8"});
            file_saver.saveAs(blob,chapName);
            this.optionMenu.active = false;
            this.showTips("配置保存成功！");
        }
    }
    //从主界面到属性
    onNodePropChanged(event:cc.Event.EventCustom){
        let target = event.target;
        this.propPanel.offX = target.position.x;
        this.propPanel.offY = target.position.y;
        this.propPanel.reverse = target.getComponent("DragableNode").reverse;
        this.propPanel.nodeType = target.getComponent("DragableNode").type;
        this.propPanel.nodeId = target.getComponent("DragableNode")._index;
        this.propPanel.heroName = target.getComponent("DragableNode")._heroName;
    }
    //从属性到主界面
    onElePropXSet(event:cc.Event.EventCustom){
        let target:cc.EditBox = event.target.getComponent(cc.EditBox);
        let val: number = Number(target.string);
        this.container.getComponent("container").setProp(PROP_MSG.X_CHANGERD,val);
    }
    
    onElePropYSet(event:cc.Event.EventCustom){
        let target:cc.EditBox = event.target.getComponent(cc.EditBox);
        let val: number = Number(target.string);
        this.container.getComponent("container").setProp(PROP_MSG.Y_CHANGERD,val);
    }
    
    onElePropHSet(event:cc.Event.EventCustom){
        let target:cc.EditBox = event.target.getComponent(cc.EditBox);
        let val: number = Number(target.string);
        this.container.getComponent("container").setProp(PROP_MSG.H_CHANGERD,"");
    }
    
    onElePropTSet(event:cc.Event.EventCustom){
        let target:cc.EditBox = event.target.getComponent(cc.EditBox);
        let val: number = Number(target.string);
        this.container.getComponent("container").setProp(PROP_MSG.T_CHANGERD,val);
    }

    onElePropRSet(event:cc.Event.EventCustom){
        let target: cc.Toggle = event.target.getComponent(cc.Toggle);
        let val: number = target.isChecked ? -1 : 1;
        this.container.getComponent("container").setProp(PROP_MSG.R_CHANGERD,val);
    }
    onChapPropHSet(event:cc.Event.EventCustom){
        let target: cc.EditBox = event.target.getComponent(cc.EditBox);
        let val: number = Number(target.string);
        this.container.height = val;
        this.container.getComponent("container").updateChapterSize(this.container.width,val);
        //if(val<720) this.container.parent.height = val;
    }
    onChapPropWSet(event:cc.Event.EventCustom){
        let target: cc.EditBox = event.target.getComponent(cc.EditBox);
        let val: number = Number(target.string);
        this.container.width = val;
        this.container.getComponent("container").updateChapterSize(val,this.container.height);
        //if(val<1280) this.container.parent.width = val;
    }
    onChapContentChanged(event:cc.Event.EventCustom){
        let target:chapter = event.target.getComponent("chapter");
        let displayNodeList:any[] = target.chapters[target.index].nodeList;
        let bigCnt:number = 0;
        let smallCnt:number = 0;
        displayNodeList.forEach((node:nodeProp)=>{
            bigCnt+=node.type-1;
            smallCnt+=(2-node.type);
        })
        this.chapProp.smallCnt = smallCnt;
        this.chapProp.bigCnt = bigCnt;
        this.chapProp.totalCnt = smallCnt+bigCnt;
        this.chapProp.cWidth = target.curChapSize.width;
        this.chapProp.cHeight = target.curChapSize.height;
    }
     // update (dt) {
    // }
    showTips (msg: string) {
        this.floatTips.show(msg);
    }
}