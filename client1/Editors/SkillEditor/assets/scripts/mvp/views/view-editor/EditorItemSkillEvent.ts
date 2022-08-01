import { EditorEvent } from "./models/EditorConst";
import { SkillEventInfo } from "./view-actor/CardSkill";

const {ccclass, property} = cc._decorator;

@ccclass
export default class EditorItemSkillEvent extends cc.Component {
    @property(cc.Label)
    labelType: cc.Label = null;

    @property(cc.Label)
    labelGroup: cc.Label = null;

    @property(cc.Label)
    labelDetail: cc.Label = null;

    private _data: SkillEventInfo = null;

    init (data: SkillEventInfo) {
        this._data = data;
        const eventInfo: SkillEventInfo = data;
        this.labelType.string = eventInfo.type;
        this.labelGroup.string = eventInfo.group;
        this.labelDetail.string = eventInfo.time + 's';
    }

    private _dispatchEvent (eventName: string) {
        const event = new cc.Event.EventCustom(eventName, true);
        event.detail = this._data;
        this.node.dispatchEvent(event);
    }

    onDeleteClick () {
        this._dispatchEvent(EditorEvent.DELETE_SKILLEVENT);
    }
}