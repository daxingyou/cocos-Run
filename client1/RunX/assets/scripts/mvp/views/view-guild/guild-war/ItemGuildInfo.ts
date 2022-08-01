import { eventCenter } from "../../../../common/event/EventCenter";

const {ccclass, property} = cc._decorator;
@ccclass
export default class ItemGuildInfo extends cc.Component {
    @property(cc.Node) emtyNode: cc.Node = null;
    @property(cc.Node) infoNode: cc.Node = null;
    @property(cc.Label) nameLb: cc.Label = null;
    @property(cc.Label) powerLb: cc.Label = null;
    @property(cc.Label) leaderLb: cc.Label = null;

    onInit(isSelf:boolean): void {
        this.emtyNode.active = !isSelf;
        this.infoNode.active = isSelf;
    }

    /**item释放清理*/
    deInit() {
       
    }
}