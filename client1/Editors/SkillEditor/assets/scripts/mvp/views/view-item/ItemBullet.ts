
const {ccclass, property} = cc._decorator;

@ccclass
export default class NewClass extends cc.Component {

    private _speedX: number = 800;
    private _speedY: number = 0;
    private _visibleRect = cc.rect(0, 0, cc.winSize.width, cc.winSize.height);

    start () {
        this.initCollider();
    }

    initCollider(){
        let colliderComp = this.node.getComponent(cc.BoxCollider);
        colliderComp.size = cc.size(this.node.width, this.node.height);
    }
    
    onCollisionEnter(other: cc.Collider, self: cc.Collider){
      
    }

    update(dt: number){
       if(!this._visibleRect.intersects(this.node.getBoundingBox())){//子弹出了可视范围直接销毁
           this.node.destroy();
           return;
       }

       this.node.x += (this._speedX * dt);
       this.node.y += (this._speedY * dt);
    }
}
