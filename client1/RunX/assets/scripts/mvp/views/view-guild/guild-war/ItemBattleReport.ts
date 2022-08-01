import { eventCenter } from "../../../../common/event/EventCenter";

const {ccclass, property} = cc._decorator;
@ccclass
export default class ItemBattleReport extends cc.Component {
    @property(cc.Label) timeLb: cc.Label = null;
    @property(cc.Label) desLb: cc.Label = null;
    @property(cc.Node) detalNode: cc.Node = null;
    @property(cc.Node) lineNode: cc.Node = null;
    @property(cc.Node) dayLb: cc.Label = null;

    onInit(): void {
        this._registerEvent();
        this._checkIsNewDay();
    }

    /**item释放清理*/
    deInit() {
       eventCenter.unregisterAll(this);
    }

    private _checkIsNewDay() {
        this.lineNode.active = false;
        this.detalNode.active = true;
    }

    private _registerEvent() {

    }

    itemClick() {

    }
}