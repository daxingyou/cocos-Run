import { MAPLAYER } from "./GuildWarCommon";

const {ccclass, property} = cc._decorator;
@ccclass
export default class ItemHoleLine extends cc.Component {
    @property(cc.Node) line: cc.Node = null;
    onInit(parent: cc.Node, startPos: cc.Vec3, endPos: cc.Vec3): void {
        this.node.parent = parent;
        this.node.zIndex = MAPLAYER.LINE;
        let pos: cc.Vec3 = cc.v3((startPos.x + endPos.x) / 2, (startPos.y + endPos.y) / 2, 0);
        let length: number = Math.sqrt(Math.pow(startPos.x - endPos.x, 2) + Math.pow(startPos.y - endPos.y, 2));
        let angle: number = Math.atan((endPos.y - startPos.y)/(endPos.x - startPos.x)) / Math.PI * 180;
        angle < 0 && (angle += 180);

        this.node.setPosition(pos);
        this.line.width = length;
        this.line.angle = angle;
        this._registerEvent();
    }


    private _registerEvent() {

    }

}