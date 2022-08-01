const {ccclass, property} = cc._decorator;

@ccclass
export default class YYBookLigature extends cc.Component {
    @property(cc.Sprite) ligature: cc.Sprite = null;

    init(startPos: cc.Vec2, endPos: cc.Vec2) {
        let pos: cc.Vec3 = cc.v3((startPos.x + endPos.x) / 2, (startPos.y + endPos.y) / 2, 0);
        let length: number = Math.sqrt(Math.pow(startPos.x - endPos.x, 2) + Math.pow(startPos.y - endPos.y, 2));
        let angle: number = Math.atan((endPos.y - startPos.y)/(endPos.x - startPos.x)) / Math.PI * 180;
        angle < 0 && (angle += 180);

        this.ligature.node.setPosition(pos);
        this.ligature.node.width = length;
        this.ligature.node.angle = angle;

        this.hide();
    }

    deInit() {
        
    }

    show(sp: cc.SpriteFrame) {
        this.ligature.spriteFrame = sp;
        this.ligature.node.active = true;
    }

    hide() {
        this.ligature.node.active = false;
    }
}
