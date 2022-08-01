import { EffectInfo, ANIMATION_TAG } from "./view-actor/CardSkill";
import { store } from "./store/EditorStore";
import { actionAddEffectInfo, actionRemoveEffectInfo, actionSelectEffect, actionUpdateEffectInfo } from "./actions/EditorActions";
import { EditorEvent } from "./models/EditorConst";

const {ccclass, property} = cc._decorator;

@ccclass
export default class EditorItemEffect extends cc.Component {
    @property(cc.Label) labelId: cc.Label = null;
    @property(cc.Label) labelTag: cc.Label = null;
    @property(cc.Node) nodeBg: cc.Node = null;
    @property(cc.EditBox) editSeq: cc.EditBox = null;

    private _data: EffectInfo = null;
    private _handler: (type: string, data: any) => void;

    updateData (data: EffectInfo, handler: (type: string, _data: any) => void) {
        this._data = data;
        this._data.tag = this._data.tag || 0;
        this._handler = handler;

        this.labelId.string = this._data.id + '';
        this.labelTag.string = ANIMATION_TAG[data.tag];
        this.select = false;
        this.editSeq.string = this._data.seq || this._data.seq == 0? this._data.seq + "" : "";

        this._registerEditBoxEvent(this.editSeq, 'editItemEffectSeq');
    }

    deInit () {
        this._data = null;
        this.editSeq.textChanged = [];
    }

    private _registerEditBoxEvent (editBox: cc.EditBox, name: string) {
        const handler = new cc.Component.EventHandler();
        handler.target = this.node;
        handler.component = "EditorItemEffect";
        handler.handler = '_onTextChanged';
        handler.customEventData = name;
        editBox.textChanged.push(handler);
    }

    private _onTextChanged() {
        store.dispatch(actionSelectEffect(this.data.id));
        store.dispatch(actionUpdateEffectInfo(this.data));
    }

    get data () : EffectInfo{
        this._data.seq = parseFloat(this.editSeq.string);
        return this._data;
    }

    onClick () {
        store.dispatch(actionSelectEffect(this.data.id));
    }

    onClickDelete () {
        store.dispatch(actionRemoveEffectInfo(this.data));
    }

    onClickAdd () {
        const event = new cc.Event.EventCustom(EditorEvent.COPY_ITEM_EFFECT, true);
        event.detail = this.data;
        this.node.dispatchEvent(event);
    }

    set select (v: boolean) {
        if (v) {
            this.nodeBg.color = cc.Color.ORANGE;
        } else {
            this.nodeBg.color = cc.Color.WHITE;            
        }
    }
}