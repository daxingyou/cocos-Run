import { EditorEvent } from "./models/EditorConst";
import EditorUICheckbox from "./EditorUICheckbox";
import UIVec2 from "./UIVec2";

const {ccclass, property} = cc._decorator;

@ccclass
export default class EditorUIRandomAngle extends cc.Component {
    @property(EditorUICheckbox)
    checkEnable: EditorUICheckbox = null;

    @property(UIVec2)
    randomSection: UIVec2 = null;

    onLoad () {        
        this.randomSection.node.on(EditorEvent.UI_VEC2_CHANGED, () => {
            this._dispatchEvent();
        });

        this.checkEnable.init({}, () => {
            this._dispatchEvent();
        });
    }

    private _dispatchEvent () {
        const event = new cc.Event.EventCustom(EditorEvent.RANDOM_ANGLE_CHANGED, true);
        event.detail = this.data;
        this.node.dispatchEvent(event);
    }
    
    get data () : cc.Vec3 {
        let v = this.randomSection.value;
        const enabled = this.checkEnable.select;

        if (v.x == v.y || !enabled) {
            return null;
        }

        return v;
    }

    clear () {
        this.data = null;
    }

    set data (data: cc.Vec3) {
        data = data || cc.Vec3.ZERO;
        this.checkEnable.select = !(data.x == data.y)
        this.randomSection.value = data;
    }
}
