import { ShakeInfo, EffectConst } from "./view-actor/CardSkill";
import { EditorEvent } from "./models/EditorConst";
import UICombox from "./components/UICombox";

const {ccclass, property} = cc._decorator;

@ccclass
export default class EditorUIShake extends cc.Component {
    @property(UICombox)
    comboxType: UICombox = null;

    @property(cc.EditBox)
    editShakeAmplitudeX: cc.EditBox = null;

    @property(cc.EditBox)
    editShakeAmplitudeY: cc.EditBox = null;

    @property(cc.EditBox)
    editShakeTimes: cc.EditBox = null;

    @property(cc.EditBox)
    editShakeDuration: cc.EditBox = null;

    @property(cc.EditBox)
    editShakeDelay: cc.EditBox = null;

    @property(cc.EditBox)
    editOriX: cc.EditBox = null;

    @property(cc.EditBox)
    editOriY: cc.EditBox = null;

    @property(cc.EditBox)
    editRange: cc.EditBox = null;

    @property(cc.Node)
    nodeTranslate: cc.Node = null;
    
    @property(cc.Node)
    nodeScale: cc.Node = null;

    @property(cc.Layout)
    layout: cc.Layout = null;

    onLoad () {
        this.comboxType.setHandler((data) => {
            this._onTypeChanged(data);
            this._dispatchEvent();
        });
        this.comboxType.addItem([EffectConst.SHAKE_TRANSLATE, EffectConst.SHAKE_SCALE]);

        this._registerEditBoxEvent(this.editShakeAmplitudeX, 'editShakeAmplitudeX');
        this._registerEditBoxEvent(this.editShakeAmplitudeY, 'editShakeAmplitudeY');
        // this._registerEditBoxEvent(this.editShakeTimes, 'editShakeTimes');
        // this._registerEditBoxEvent(this.editShakeDuration, 'editShakeDuration');
        // this._registerEditBoxEvent(this.editShakeDelay, 'editShakeDelay');
        // this._registerEditBoxEvent(this.editOriX, 'editOriX');
        // this._registerEditBoxEvent(this.editOriY, 'editOriY');
        this._registerEditBoxEvent(this.editRange, 'editRange');
    }

    private _registerEditBoxEvent (editBox: cc.EditBox, name: string) {
        const handler = new cc.Component.EventHandler();
        handler.target = this.node;
        handler.component = "EditorUIShake";
        handler.handler = '_onTextChanged';
        handler.customEventData = name;        
        editBox.textChanged.push(handler);
    }

    private _onTextChanged (editbox: cc.EditBox, customData: string) {
        this._dispatchEvent();
    }

    private _dispatchEvent () {
        // const event = new cc.Event.EventCustom(EditorEvent.SHAKE_CHANGED, true);
        // event.detail = this.data;
        // this.node.dispatchEvent(event);
    }

    
    private _onTypeChanged (data: any) {
        if (data == EffectConst.SHAKE_TRANSLATE) {
            this.nodeTranslate.active = true;
            this.nodeScale.active = false;
        } else {
            this.nodeTranslate.active = false;
            this.nodeScale.active = true;
        }
        this.layout.updateLayout();
    }

    // get data () : EffectShakeInfo {
    //     const x = parseFloat(this.editShakeAmplitudeX.string);
    //     const y = parseFloat(this.editShakeAmplitudeY.string);
    //     const times = parseInt(this.editShakeTimes.string);
    //     const delay = parseFloat(this.editShakeDelay.string);
    //     const duration = parseFloat(this.editShakeDuration.string);
    //     const oriX = parseFloat(this.editOriX.string);
    //     const oriY = parseFloat(this.editOriY.string);
    //     const range = parseFloat(this.editRange.string);
    //     const type = this.comboxType.selected;

    //     const ret = {
    //         type: type,
    //         amplitude: cc.v2(x, y),
    //         times: times,
    //         delay: delay,
    //         duration: duration,
    //         ori: cc.v2(oriX, oriY),
    //         range: range
    //     };

    //     // if (EffectConst.isShakeValid(ret)) {
    //     //     return ret;
    //     // }
    //     return null;
    // }

    clear () {
        // this.data = null;
    }

    // set data (data: EffectShakeInfo) {
    //     data = data || {type: EffectConst.SHAKE_TRANSLATE, times: 0, duration: 0};
    //     this.comboxType.selected = data.type;
    //     this.editShakeTimes.string = data.times + '';
    //     this.editShakeDuration.string = data.duration + '';

    //     if (data.amplitude) {
    //         this.editShakeAmplitudeX.string = data.amplitude.x + '';
    //         this.editShakeAmplitudeY.string = data.amplitude.y + '';
    //     }

    //     if (data.ori) {
    //         this.editOriX.string = data.ori.x + '';
    //         this.editOriY.string = data.ori.y + '';
    //     }

    //     this.editRange.string = (data.range || 1) + '';
    //     this.editShakeDelay.string = (data.delay || 0) + '';

    //     this._onTypeChanged(data.type);
    // }
}