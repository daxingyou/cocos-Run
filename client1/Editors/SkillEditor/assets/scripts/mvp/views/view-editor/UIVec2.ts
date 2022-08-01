import { EditorEvent } from "./models/EditorConst";

const {ccclass, property} = cc._decorator;
@ccclass
export default class UIVec2 extends cc.Component {
    @property(cc.EditBox)
    editX: cc.EditBox = null;

    @property(cc.EditBox)
    editY: cc.EditBox = null;

    onLoad () {
        this.editX.inputMode = cc.EditBox.InputMode.NUMERIC;
        this.editY.inputMode = cc.EditBox.InputMode.NUMERIC;

        this._registerEditBoxEvent(this.editX, 'editX');
        this._registerEditBoxEvent(this.editY, 'editY');
    }

    private _registerEditBoxEvent (editBox: cc.EditBox, name: string) {
        const handler = new cc.Component.EventHandler();
        handler.target = this.node;
        handler.component = "UIVec2";
        handler.handler = '_onTextChanged';
        handler.customEventData = name;
        editBox.textChanged.push(handler);
    }

    private _onTextChanged () {
        const event = new cc.Event.EventCustom(EditorEvent.UI_VEC2_CHANGED, true);
        event.detail = this.value;
        this.node.dispatchEvent(event);
    }

    get value (): cc.Vec3 {
        let x = parseFloat(this.editX.string) || 0;
        let y = parseFloat(this.editY.string) || 0;
        return cc.v3(x, y);
    }

    set value (v: cc.Vec3) {
        if (v.x)
            this.editX.string = v.x + '';
        
        if (v.y)
            this.editY.string = v.y + '';
    }
}