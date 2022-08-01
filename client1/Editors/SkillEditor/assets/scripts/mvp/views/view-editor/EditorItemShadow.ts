import { EffectShadowInfo } from "./view-actor/CardSkill";
import { store } from "./store/EditorStore";
import { actionSelectShake, actionSelectWhoneShadow } from "./actions/EditorActions";
import { EditorEvent } from "./models/EditorConst";


const {ccclass, property} = cc._decorator;

@ccclass
export default class EditorItemShadow extends cc.Component {
    @property(cc.Node) nodeBg: cc.Node = null;
    @property(cc.Label) labelId: cc.Label = null;
    @property(cc.Label) labelDelay: cc.Label = null;
    @property(cc.Label) labelOpacity: cc.Label= null;
    @property(cc.Label) labelColor: cc.Label= null;
    @property(cc.Label) labelGfx: cc.Label = null;

    private _data: EffectShadowInfo = null;
    private _handler: (type: string, data: any) => void;

    updateData (data: EffectShadowInfo, handler: (type: string, _data: any) => void) {
        this._data = data;
        this._handler = handler;
        this._updateData();
        this.select = false;
    }
    private _updateData(){
        this.labelId.string = this._data.id + '';
        this.labelDelay.string = `${this._data.delay || 0}`;
        this.labelOpacity.string = `${this._data.opacity || 255}`;
        this.labelColor.string = `${this._data.color || 0}`;
        this.labelGfx.string = (typeof this._data.isPlayGfx != 'undefined' && this._data.isPlayGfx) ? "YES" : "NO";
        this.labelGfx.node.color = (typeof this._data.isPlayGfx != 'undefined' && this._data.isPlayGfx) ? cc.Color.GREEN : cc.Color.GRAY;
    }

    deInit () {
        this._data = null;
    }

    get data () : EffectShadowInfo{
        return this._data;
    }

    onClick () {
        store.dispatch(actionSelectWhoneShadow(this.data.id));
    }

    onClickDelete () {
        this._handler && this._handler('deleteItem', this._data);
        this._handler = null;
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