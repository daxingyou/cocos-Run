// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

const {ccclass, property} = cc._decorator;

@ccclass
export default class barriers extends cc.Component {

    @property(cc.Node) headNode: cc.Node = null;
    @property(cc.Node) headItem: cc.Node = null;

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    start () {

    }

    onLoad(){
        let headFiles:string[] = [
            "textures/heroHead/head1",
            "textures/heroHead/lesson_head_enemy1",
            "textures/heroHead/lesson_head_enemy2",
        ];
        headFiles.forEach((url:string,index:number)=>{
            cc.resources.load(url,cc.SpriteFrame,(err:Error,res:cc.SpriteFrame)=>{
                let node  = cc.instantiate(this.headItem);
                node.getComponent(cc.Sprite).spriteFrame = res;
                node.setAnchorPoint(0.5,0.5);
                node.x = index%2==0 ? 60 : 220;
                node.y = -Math.floor(index/2)*100 -60;
                node.active = true;
                node.parent = this.headNode;
                node.getComponent("DragableHero").heroName = url.split("/").pop();
            })
        })
        this.headNode.setContentSize(315,Math.ceil(headFiles.length/2)*100+60);
    }
    // update (dt) {}
}
