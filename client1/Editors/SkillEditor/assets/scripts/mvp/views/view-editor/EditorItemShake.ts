
import { EffectInfo, ANIMATION_TAG, ShakeInfo, SHAKE_REDUCT_TYPE } from "./view-actor/CardSkill";
import { store } from "./store/EditorStore";
import { actionAddEffectInfo, actionRemoveEffectInfo, actionSelectEffect, actionSelectShake, actionUpdateEffectInfo } from "./actions/EditorActions";
import { EditorEvent } from "./models/EditorConst";
import EditorUtils from "./EditorUtils";

const {ccclass, property} = cc._decorator;

@ccclass
export default class EditorItemShake extends cc.Component {
    @property(cc.Node) nodeBg: cc.Node = null;
    @property(cc.Label) labelId: cc.Label = null;
    @property(cc.Label) labelDelay: cc.Label = null;
    @property(cc.Label) labelDurationm: cc.Label= null;
    @property(cc.Label) labelTimes: cc.Label= null;
    @property(cc.Label) labelOriPos: cc.Label= null;
    @property(cc.Label) labelAmp: cc.Label= null;
    @property(cc.Label) labelReduct: cc.Label = null;

    private _data: ShakeInfo = null;
    private _handler: (type: string, data: any) => void;

    updateData (data: ShakeInfo, handler: (type: string, _data: any) => void) {
        this._data = data;
        this._handler = handler;
        this._updateData();
        this.select = false;
    }
    private _updateData(){
        this.labelId.string = this._data.id + '';
        this.labelDelay.string = `${this._data.delay || 0}`;
        this.labelDurationm.string = `${this._data.duration || 0}`;
        this.labelTimes.string = `${this._data.times || 0}`;
        let oriPos = this._data.ori || cc.v2();
        this.labelOriPos.string = `${oriPos.x},${oriPos.y}`;
        let amplitude = this._data.amplitude || cc.v2(0, 0);
        this.labelAmp.string = `${amplitude.x},${amplitude.y}`;
        let reductType = this._data.reduct || SHAKE_REDUCT_TYPE.NONE;
        this.labelReduct.string = EditorUtils.getShakeReductType(reductType)
    }

    deInit () {
        this._data = null;
    }

    get data () : ShakeInfo{
        return this._data;
    }

    onClick () {
        store.dispatch(actionSelectShake(this.data.id));
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