import { EffectGfxInfo, EffectConst, GFX_TYPE, CUVE_TYPE, EASE_TYPE, GfxCuveInfo } from "./view-actor/CardSkill";
import { EditorEvent } from "./models/EditorConst";
import { store } from "./store/EditorStore";
import EditorUICheckbox from "./EditorUICheckbox";
import UIVec2 from "./UIVec2";
import UICombox from "./components/UICombox";

const {ccclass, property} = cc._decorator;

@ccclass
export default class EditorUIMove extends cc.Component {
    @property(UICombox)
    comboxSource: UICombox = null;

    @property(UICombox)
    comboxTarget: UICombox = null;

    @property (UIVec2)
    offset: UIVec2 = null;

    @property(UICombox)
    comboxCuveType: UICombox = null;

    @property(cc.EditBox)
    editDuration: cc.EditBox = null;

    @property (UIVec2)
    point1: UIVec2 = null;

    @property (UIVec2)
    point2: UIVec2 = null;

    @property(UICombox)
    comboxEase: UICombox = null;

    @property(EditorUICheckbox)
    checkRandomX: EditorUICheckbox = null;

    @property(EditorUICheckbox)
    checkRandomY: EditorUICheckbox = null;

    onLoad () {
        store.registerReady(this._onEditorPrepare, this);
    }

    private _onEditorPrepare () {
        this.comboxTarget.addItem([EffectConst.JOINT_SOURCE, EffectConst.JOINT_TARGET, EffectConst.JOINT_SOURCE_AOE, EffectConst.JOINT_TARGTET_AOE]);
        this.comboxTarget.setHandler(data => {
            this._dispatchEvent();
        });
        this.comboxTarget.selected = EffectConst.JOINT_SOURCE;

        this.comboxSource.addItem([EffectConst.JOINT_SOURCE, EffectConst.JOINT_TARGET]);
        this.comboxSource.setHandler(data => {
            this._dispatchEvent();
        });
        this.comboxSource.selected = EffectConst.JOINT_TARGET;

        this.comboxCuveType.addItem([CUVE_TYPE.LINE, CUVE_TYPE.BEZIER]);
        this.comboxCuveType.setHandler(data => {
            this._dispatchEvent();
        });

        this.comboxEase.addItem([EASE_TYPE.INSINE, EASE_TYPE.OUTSINE, EASE_TYPE.INOUTSINE]);
        this.comboxEase.setHandler(data => {
            this._dispatchEvent();
        });

        this._registerEditBoxEvent(this.editDuration, 'editDuration');

        this.point1.node.on(EditorEvent.UI_VEC2_CHANGED, () => {
            this._dispatchEvent();
        });

        this.point2.node.on(EditorEvent.UI_VEC2_CHANGED, () => {
            this._dispatchEvent();
        });

        this.offset.node.on(EditorEvent.UI_VEC2_CHANGED, () => {
            this._dispatchEvent();
        });

        this.checkRandomX.init(null, () => {
            this._dispatchEvent();
        });

        this.checkRandomY.init(null, () => {
            this._dispatchEvent();
        });
    }

    private _registerEditBoxEvent (editBox: cc.EditBox, name: string) {
        const handler = new cc.Component.EventHandler();
        handler.target = this.node;
        handler.component = "EditorUIMove";
        handler.handler = '_onTextChanged';
        handler.customEventData = name;        
        editBox.textChanged.push(handler);
    }

    private _onTextChanged (editbox: cc.EditBox, customData: string) {
        this._dispatchEvent();
    }

    private _dispatchEvent () {
        const event = new cc.Event.EventCustom(EditorEvent.CUVE_CHANGED, true);
        event.detail = this.data;
        this.node.dispatchEvent(event);
    }

    get data () : GfxCuveInfo {
        const target = this.comboxTarget.selected;
        const cuveType = this.comboxCuveType.selected;
        const duration = parseFloat(this.editDuration.string);
        const point1 = this.point1.value;
        const point2 = this.point2.value;
        const ease = this.comboxEase.selected;
        const offset = this.offset.value;

        if (target.length < 2 || duration <= 0 || cuveType.length < 2) {
            return null;
        }

        return {
            source: this.comboxSource.selected,
            target: target,
            // @ts-ignore
            cuve: cuveType,
            offset: offset,
            arrPoint: [point1, point2],
            // @ts-ignore
            ease: ease,
            duration: duration,
            randomX: this.checkRandomX.select ? 1 : 0,
            randomY: this.checkRandomY.select ? 1 : 0,
        };
    }

    clear () {
        this.data = null;
    }

    set data (data: GfxCuveInfo) {
        data = data || {target: null, cuve: null, offset: cc.Vec3.ZERO, arrPoint: [], ease: null, duration: 0, source: null};

        this.comboxSource.selected = data.source || EffectConst.JOINT_TARGET;
        this.comboxTarget.selected = data.target || EffectConst.JOINT_SOURCE;
        this.comboxCuveType.selected = data.cuve || CUVE_TYPE.LINE;
        this.offset.value = data.offset;
        if (data.arrPoint.length === 2) {
            this.point1.value = data.arrPoint[0];
            this.point2.value = data.arrPoint[1];
        }
        this.comboxEase.selected = data.ease || EASE_TYPE.INSINE;
        this.editDuration.string = data.duration + '';

        this.checkRandomX.select = data.randomX ? true : false;
        this.checkRandomY.select = data.randomY ? true : false;
    }
}
