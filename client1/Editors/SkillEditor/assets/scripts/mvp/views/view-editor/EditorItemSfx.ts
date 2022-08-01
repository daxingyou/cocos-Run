
import { EffectInfo, ANIMATION_TAG, ShakeInfo, SHAKE_REDUCT_TYPE, EffectSfxInfo } from "./view-actor/CardSkill";
import { store } from "./store/EditorStore";
import { actionSelectShake, actionSelectWholeSfx } from "./actions/EditorActions";
import { EditorEvent } from "./models/EditorConst";
import EditorUtils from "./EditorUtils";
import { audioCache } from "../../../common/AudioManager";

const {ccclass, property} = cc._decorator;

@ccclass
export default class EditorItemSfx extends cc.Component {
    @property(cc.Node) nodeBg: cc.Node = null;
    @property(cc.Label) labelId: cc.Label = null;
    @property(cc.Label) labelName: cc.Label = null;
    @property(cc.Label) labelDuration: cc.Label= null;
    @property(cc.Label) labelDelay: cc.Label= null;
    @property(cc.Label) labelStartTime: cc.Label= null;

    private _data: EffectSfxInfo = null;
    private _handler: (type: string, data: any) => void;
    private _audioPath: string = null;

    updateData (data: EffectSfxInfo, handler: (type: string, _data: any) => void) {
        this._data = data;
        this._handler = handler;
        this._updateData();
        this.select = false;
    }
    private _updateData(){
        this.labelId.string = this._data.id + '';
        this.labelName.string = this._data.url || '';
        this.labelStartTime.string = `${this._data.start ? this._data.start : '--'}`;
        this.labelDelay.string = `${this._data.delay ? this._data.delay : '--'}`;
        this.labelDelay.string = `${this._data.delay || 0}`;
        this.labelDuration.string = '--';
        
        let audioPath = `sfx/skill/${this._data.url}`;
        this._audioPath = audioPath;
        let audioClip = audioCache.getAudioClip(audioPath);
        if(audioClip) {
            this.labelDuration.string = `${audioClip.duration}`;
            return;
        }
        
        audioCache.loadAudio(audioPath, (err: Error, clip: cc.AudioClip, url: string) => {
            if(err || url != this._audioPath) {
                return;
            }
            this.labelDuration.string = `${clip.duration}`;
        });
    }

    deInit () {
        this._audioPath = null;
        this._data = null;
    }

    get data () : EffectSfxInfo{
        return this._data;
    }

    onClick () {
        store.dispatch(actionSelectWholeSfx(this.data.id));
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