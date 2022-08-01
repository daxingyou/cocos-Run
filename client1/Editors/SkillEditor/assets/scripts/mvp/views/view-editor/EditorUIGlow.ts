import { EffectAnimationInfo, EffectConst, EffectGlowInfo } from "./view-actor/CardSkill";
import { EditorEvent } from "./models/EditorConst";
import EditorUICheckbox from "./EditorUICheckbox";

const {ccclass, property} = cc._decorator;

@ccclass
export default class EditorUIGlow extends cc.Component {
    @property(EditorUICheckbox)
    checkEnable: EditorUICheckbox = null;

    @property(cc.EditBox)
    editDelay: cc.EditBox = null;

    @property(cc.EditBox)
    editDuration: cc.EditBox = null;

    onLoad () {        
        this._registerEditBoxEvent(this.editDelay, 'editDelay');
        this._registerEditBoxEvent(this.editDuration, 'editDuration');
        this.checkEnable.init({}, () => {
            this._dispatchEvent();
        });
    }

    private _registerEditBoxEvent (editBox: cc.EditBox, name: string) {
        const handler = new cc.Component.EventHandler();
        handler.target = this.node;
        handler.component = "EditorUIGlow";
        handler.handler = '_onTextChanged';
        handler.customEventData = name;
        editBox.textChanged.push(handler);
    }

    private _onTextChanged (editbox: cc.EditBox, customData: string) {
        this._dispatchEvent();
    }

    private _dispatchEvent () {
        const event = new cc.Event.EventCustom(EditorEvent.GLOW_CHANGED, true);
        event.detail = this.data;
        this.node.dispatchEvent(event);
    }
    
    get data () : EffectGlowInfo {
        const delay = parseFloat(this.editDelay.string) || 0;
        const duration = parseFloat(this.editDuration.string) || 0;
        const enabled = this.checkEnable.select;

        if (duration < 0.01 || !enabled) {
            return null;
        }

        return {
            delay: delay,
            duration: duration,
        };
    }

    clear () {
        this.data = null;
    }

    set data (data: EffectGlowInfo) {
        data = data || {duration: 0, delay: 0};
        this.checkEnable.select = data.duration > 0.01;
        this.editDelay.string = (data.delay || 0) + '';
        this.editDuration.string = (data.duration || 0) + '';
    }
}
