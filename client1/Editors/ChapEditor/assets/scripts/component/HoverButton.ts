const {ccclass, property} = cc._decorator;

@ccclass
export default class hoverButton extends cc.Component {
    @property(cc.Node) hoverNode:cc.Node = null;
    start(){
        this.node.on(cc.Node.EventType.MOUSE_ENTER,this.onMouseEnter,this);
        this.node.on(cc.Node.EventType.MOUSE_LEAVE,this.onMouseLeave,this);
    }
    onMouseEnter(evevt:cc.Event.EventMouse){
        this.hoverNode.active = true;
        this.scheduleOnce(()=>{
            this.hoverNode.active = false;
        },1)
    }
    onMouseLeave(evevt:cc.Event.EventMouse){
        this.hoverNode.active = false;
    }

}