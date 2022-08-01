import { eventCenter } from "../../../../common/event/EventCenter";

const {ccclass, property} = cc._decorator;
@ccclass
export default class ItemMemberRank extends cc.Component {
    @property(cc.SpriteFrame) rankSps: cc.SpriteFrame[] = [];
    @property(cc.Sprite) rankindexSp: cc.Sprite = null;
    @property(cc.Label) randIndexLb: cc.Label = null;
    @property(cc.Label) nameLb: cc.Label = null;
    @property(cc.Label) lvLb: cc.Label = null;
    @property(cc.Label) challegeCountLb: cc.Label = null;
    @property(cc.Label) getIntegelLb: cc.Label = null;

    onInit(): void {
        this._registerEvent();
    }

    /**item释放清理*/
    deInit() {
       eventCenter.unregisterAll(this);
    }

    private _registerEvent() {

    }
    itemClick() {

    }
}