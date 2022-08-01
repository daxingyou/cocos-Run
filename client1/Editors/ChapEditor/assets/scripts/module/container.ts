import main from "../main";
import DragableNode from "../component/DragableNode"
import {PROP_MSG} from "../const/const";
import {nodeProp,configItem,routeProp} from "../const/type";
const {ccclass, property} = cc._decorator;

@ccclass
export default class Container extends cc.Component {

    @property(cc.Graphics) graphicBoard: cc.Graphics = null; 
    @property(cc.Node) background: cc.Node = null;
    @property([cc.Node]) itemNodes: cc.Node[] = []; 
    @property(cc.Node) itemRoute: cc.Node = null; 
    @property(main) app: main = null; 
    @property(cc.Node) headItem: cc.Node = null;

    private _nodeStack: cc.Node[] = new Array<cc.Node>();
    private _routeStack: cc.Node[] =  new Array<cc.Node>();
    private _drawStack: object[] = new Array<object>();
    private _selectingID: number = -1;
    private _selectingRoute: boolean = false;
    private _bgResource: string = "";
    private _nodeProps: nodeProp[] = [];
    private _routeProps: nodeProp[] = [];
    private _showTag: boolean = false;
    private _selectNode:DragableNode = null;
    private _showLine: boolean = false;
    get displayNodes(){
        return this._nodeStack;
    }
    get selectNode(){
        return this.displayStack[this._selectingID];
    }
    get displayStack(){
        return this.selectingRoute ? this._routeStack : this._nodeStack;
    }
    get displayProp(){
        return this.selectingRoute ? this._routeProps : this._nodeProps;
    }
    set showLine(val:boolean){
        this._showLine = val;
    }
    set selectingRoute(val:boolean){
        this._selectingRoute = val;
    }
    get selectingRoute(){
        return this._selectingRoute;
    }
    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    start () {
        //this.registerAllListeners();
    }

    pushNode(addnode:cc.Node){
        if(!addnode || !this._nodeStack ) return;
        let index: number = this._nodeStack.length;
        let dAddNode: DragableNode =  addnode.getComponent("DragableNode");
        addnode.parent = this.node;
        addnode.zIndex = 1;
        dAddNode.index = index;
        dAddNode.showTag(this._showTag,index);
        this._nodeStack.push(addnode);
        this._selectingRoute = dAddNode.isRoute;
        this.drawBorderForOne(index);
        this.drawLine(index);
        this._nodeProps.push(dAddNode.prop);
        //手动更新章节内容
        this.addHero2Node(index,addnode.getComponent("DragableNode").heroName);
        this.app.chapterManager.curNodeProp = JSON.parse(JSON.stringify(this._nodeProps));
    }

    pushRoute(addRoute:cc.Node){
        if(!addRoute || !this._routeStack) return;
        let index: number = this._routeStack.length;
        let dAddRoute: DragableNode =  addRoute.getComponent("DragableNode");
        addRoute.parent = this.node;
        addRoute.zIndex = 0;
        addRoute.setContentSize(319,107);
        dAddRoute.index = index;
        this._selectingRoute = dAddRoute.isRoute;
        this._routeStack.push(addRoute);
        this.drawBorderForOne(index);
        this._routeProps.push(dAddRoute.prop);
        //手动更新章节内容
        this.app.chapterManager.curRouteProp = JSON.parse(JSON.stringify(this._routeProps));
    }

    popNode():cc.Node{
        if(!this._nodeStack || this._nodeStack.length==0) return;
        return this._nodeStack.pop();
    }

    //节点添加英雄
    addHero2Node(index:number,name:string){
        if(index<0 || index>=this._nodeStack.length) return;
        let tmpNode: cc.Node = null;
        let url:string = "textures/heroHead/"+name;
        let heroNode:any = this._nodeStack[index].getComponentInChildren("DragableHero");
        if(heroNode){
            heroNode.node.removeFromParent();
            heroNode.node.destroy();
        }
        cc.resources.load(url,cc.SpriteFrame,(err:Error,res:cc.SpriteFrame)=>{
            let node  = cc.instantiate(this.headItem);
            node.getComponent(cc.Sprite).spriteFrame = res;
            node.setAnchorPoint(0.5,0.5);
            node.setPosition(0,0);
            node.active = true;
            node.parent = this._nodeStack[index];
            node.zIndex = 0;
            node.getComponent("DragableHero")._cloned = true;
            node.getComponent("DragableHero").heroName = name;
            this._nodeStack[index].getComponent("DragableNode").heroName = name;
            this._nodeProps[index].hero = name;
            this.app.chapterManager.curNodeProp = JSON.parse(JSON.stringify(this._nodeProps));
            this.sendNodeChangedEvent(this._nodeStack[index]);
        })
    }

    deleteNode(index:number,isRoute:boolean){
        let displayStack = !isRoute ? this._nodeStack : this._routeStack;
        let displayProp = !isRoute ? this._nodeProps : this._routeProps;
        if((!index && index!=0) || index>=displayStack.length){
            cc.log("删除节点不存在或索引异常！",index);
            return;
        }
        let delNode:cc.Node = displayStack.splice(index,1)[0];
        delNode.removeFromParent();
        delNode.destroy();
        displayProp.splice(index,1);
        this.updateChapterData();
        //同时需要手动更新节点栈的index,并且清理关联线
        !isRoute && this.clearLines();
        this.displayStack.forEach((node,index)=>{
            let dNode = node.getComponent("DragableNode");
            dNode.index = index;
            if(!isRoute){
                dNode.showTag(this._showTag,index);
                this.drawLine(index);
            }
           
        })
        //手动更新章节内容
    }

    deleteSelNode(){
        if (this._selectingID==-1) return;
        this.deleteNode(this._selectingID,this._selectingRoute);
    }

    drawBorderForOne(index:number){
        let stack = this._selectingRoute ? this._routeStack : this._nodeStack;
        let clearStack = !this._selectingRoute ? this._routeStack : this._nodeStack;
        stack.forEach(node=>{
            let dNode = node.getComponent("DragableNode");
            if(dNode.index==index){
                this._selectingID = dNode.index;
                dNode.selected = true;
                dNode.drawBorder();
                this.sendNodeChangedEvent(node);
            }else{
                dNode.selected = false;
                dNode.clearBorder();
            }
        })
        clearStack.forEach(node=>{
            let dNode = node.getComponent("DragableNode");
            dNode.clearBorder();
            dNode.selected = false;
        })
    }

    drawLine(index:number){
        if (index<1 || !this._showLine) return;
        let rect0: cc.Rect = this._nodeStack[index].getBoundingBox(); //倒数第一个节点
        let rect1: cc.Rect = this._nodeStack[index-1].getBoundingBox(); //倒数第二个节点
        let bPos:cc.Vec2 = new cc.Vec2(rect1.x+rect1.width/2,rect1.y+rect1.height/2);
        let ePos:cc.Vec2 = new cc.Vec2(rect0.x+rect0.width/2,rect0.y+rect0.height/2);
        
        this.graphicBoard.lineWidth = 10;
        this.graphicBoard.strokeColor = cc.Color.RED;
        this.graphicBoard.moveTo(bPos.x,bPos.y);
        this.graphicBoard.lineTo(ePos.x,ePos.y);
        this.graphicBoard.stroke(); 
        
        let drawData:object = {
            "beginIndex": this._nodeStack.length-2,
            "endIndex": this._nodeStack.length-1,
            "beginPosition": bPos,
            "endPosition": ePos
        }
        this._drawStack.push(drawData);
    }

    /**
     * @desc 自动绘制所有连线
     */
    redrawAllLines(){
        this.clearLines();
        //同时需要手动更新节点栈的index,并且清理关联线
        this._nodeStack.forEach((node,index)=>{
            let dNode = node.getComponent("DragableNode");
            dNode.index = index;
            this.drawLine(index);
        })
    }
    /**
     * 显示所有节点的标记值
     */
    showAllTages(show:boolean){
        this._showTag = show;
        this._nodeStack.forEach((node,index)=>{
            let dNode = node.getComponent("DragableNode");
            dNode.showTag(show,index);
        })
    }
    /**
     *@desc 清除所有的已绘制线，以便重新绘制
     */
    clearLines(){
        this.graphicBoard.clear();
        this._drawStack.slice(0);
    }
    /**
     * @desc 设置所有场景节点的透明度
     */
    setOpacityForAll(opacity:number){
        this._nodeStack.forEach(node=>{
           node.opacity = opacity;
        })
    }

    setOpacityForBg(opacity:number){
        this.background.opacity = opacity;
    }

    setBgResource(url:string){
        this._bgResource = url;
        cc.resources.load(url,cc.SpriteFrame,(err:Error,res:cc.SpriteFrame)=>{
            if(!err){
                this.background.getComponent(cc.Sprite).spriteFrame = res;
            }
            else{
                cc.error(`Load ${url} error!`,err)
            }
        })
        this.app.chapterManager.curbgRes = url.split("/").pop();
    } 

    getBgResource(){
        return this._bgResource;
    }

    getNodeConfig():cc.Node[]{
        let config:any[] = [];
        this._nodeStack.forEach((node)=>{
            if(node){
                config.push({
                    "name": node.name,
                    "posx": node.position.x,
                    "posy": node.position.y,
                    "hero":"",
                    "reverse": node.getComponent("DragableNode").reverse,
                    "type": node.getComponent("DragableNode").type,
                    "index":node.getComponent("DragableNode").index,
                })
               
            }
        })
        return config;
    }
    /**
     * @desc 清理桌面
     */
    clearDesk(){
        this._selectingID = -1;
        this._selectingRoute = false;
        this._nodeStack.forEach((node,index)=>{
            node.removeFromParent();
            node.destroy();
        })
        this._routeStack.forEach((node,index)=>{
            node.removeFromParent();
            node.destroy();
        })
        this._nodeStack.splice(0);
        this._nodeProps.splice(0);
        this._routeStack.splice(0);
        this._routeProps.splice(0);
        this.clearLines();
        //this.background.getComponent(cc.Sprite).spriteFrame = null;
    }

    loadFromCfg(config:configItem){
        config.routeList.forEach((node:nodeProp)=>{
            let tmpRoute: cc.Node = cc.instantiate(this.itemRoute);
            let scale =  node.reverse ? -1 : 1;
            tmpRoute.zIndex = 0;
            tmpRoute.position = new cc.Vec3(node.posx,node.posy,0);
            tmpRoute.setContentSize(319,107);
            tmpRoute.getComponent("DragableNode")._isCloned = true;
            tmpRoute.getComponent("DragableNode").reverse = node.reverse;
            tmpRoute.scaleX = scale;
            this.pushRoute(tmpRoute);
        })
        config.nodeList.forEach((node:nodeProp)=>{
            let tmpNode: cc.Node = cc.instantiate(this.itemNodes[node.type-1]);
            let childLabel: cc.Label = tmpNode.getComponentInChildren(cc.Label);
            let scale =  node.reverse ? -1 : 1;
            tmpNode.zIndex = 1;
            tmpNode.position = new cc.Vec3(node.posx,node.posy,0);
            tmpNode.getComponent("DragableNode")._isCloned = true;
            tmpNode.getComponent("DragableNode").reverse = node.reverse;
            tmpNode.getComponent("DragableNode").heroName = node.hero;
            tmpNode.scaleX = scale;
            childLabel.node.scaleX = scale;
            this.pushNode(tmpNode);
        })
        //按照配置设置画布尺寸
        config.width && (this.node.width = config.width);
        config.height && (this.node.height = config.height);
        this.app.chapterManager.sendNodeChangedEvent();
        // if (config.bgRes && config.bgRes!=""){
        //     this.setBgResource(`bg/${config.bgRes}`);
        // }
    }

    updateNodeProp(index:number){
        if(index<0 || index>=this.displayStack.length) return;
        this.displayProp[index] = this.displayStack[index].getComponent("DragableNode").prop;
        this.updateChapterData();
    }

    updateRouteProp(index:number){
        if(index<0 || index>=this._routeStack.length) return;
        this.displayProp[index] = this.displayStack[index].getComponent("DragableNode").prop;
        this.updateChapterData();
    }

    setProp(prop:string,val:number){
        if (this._selectingID<0 || (this._selectingID>=this._nodeStack.length && this._selectingID>=this._routeStack.length)) return;
        switch(prop){
            case PROP_MSG.X_CHANGERD:
                this.selectNode.x = val;
                this.selectingRoute && this.updateRouteProp(this._selectingID);
                !this.selectingRoute && this.updateNodeProp(this._selectingID);
                break;
            case PROP_MSG.Y_CHANGERD:
                this.selectNode.y = val;
                this.selectingRoute && this.updateRouteProp(this._selectingID);
                !this.selectingRoute && this.updateNodeProp(this._selectingID);
                break;
            case PROP_MSG.H_CHANGERD:
                if(this._selectingRoute) break;
                this.selectNode.getComponent("DragableNode").heroName = val;
                this.addHero2Node(this._selectingID,"");
                break;
            case PROP_MSG.T_CHANGERD:
                if(this._selectingRoute) break;
                let tmpNode: cc.Node = cc.instantiate(this.itemNodes[val-1]);
                let dTmpNode: DragableNode = tmpNode.getComponent("DragableNode");
                let tmpLabel:cc.Label = tmpNode.getComponentInChildren(cc.Label);
                let tmpPos: cc.Vec3 = this.selectNode.position;
                let nodeCfg: nodeProp = this._nodeProps[this._selectingID];

                //tmpNode.position = tmpPos;
                tmpNode.parent = this.node;
                tmpNode.scaleX = nodeCfg.reverse ? -1 : 1;
                tmpLabel.node.scaleX = nodeCfg.reverse ? -1 : 1;
                dTmpNode.isCloned = true;
                dTmpNode.prop = nodeCfg;
                dTmpNode.type = val;
                dTmpNode.showTag(this._showTag,this._selectingID)

                this.selectNode.destroy();
                this.displayNodes.splice(this._selectingID,1,tmpNode);
                this.displayProp.splice(this._selectingID,1,dTmpNode.prop);
                this.addHero2Node(this._selectingID,dTmpNode.prop.hero);
                // this.app.chapterManager.curNodeProp = JSON.parse(JSON.stringify(this.displayProp));
                break;
            case PROP_MSG.R_CHANGERD:
                let dSelectNode: DragableNode = this.selectNode.getComponent("DragableNode");
                this.selectNode.scaleX = val;
                dSelectNode.reverse = val!=1;
                dSelectNode.showTag(this._showTag,this._selectingID)
                if(!this._selectingRoute) {
                    this.addHero2Node(this._selectingID,dSelectNode.prop.hero);
                }
                this.displayProp.splice(this._selectingID,1,dSelectNode.prop);
                this.updateChapterData();
                break;
        }
        this.redrawAllLines();
    }
    updateChapterData(){
        if(!this._selectingRoute){
            this.app.chapterManager.curNodeProp = JSON.parse(JSON.stringify(this._nodeProps));
        }else{
            this.app.chapterManager.curRouteProp = JSON.parse(JSON.stringify(this._routeProps));
        }
    }
    updateChapterSize(w:number=1280,h:number=720){
        this.app.chapterManager.curChapSize = cc.size(w,h);
    }
    sendNodeChangedEvent(fromNode:cc.Node){
        fromNode.dispatchEvent(new cc.Event.EventCustom("container_node_changed",true));
    }
    //update (dt) {}
}
