import { EffectGfxInfo, EffectConst, GFX_TYPE, CUVE_TYPE, EASE_TYPE, GfxCuveInfo, EffectBulletInfo } from "./view-actor/CardSkill";
import { EditorEvent } from "./models/EditorConst";
import { store } from "./store/EditorStore";
import EditorUICheckbox from "./EditorUICheckbox";
import UIVec2 from "./UIVec2";
import UICombox from "./components/UICombox";
import EditorUtils from "./EditorUtils";

const {ccclass, property} = cc._decorator;

@ccclass
export default class EditorUIBullet extends cc.Component {
    @property(UICombox) comboxPrefab: UICombox = null;
    @property(cc.EditBox) editDelay: cc.EditBox = null;
    @property(cc.EditBox) editInterval: cc.EditBox = null;
    @property(cc.EditBox) editCnt: cc.EditBox = null;
    @property(cc.EditBox) editDuration: cc.EditBox = null;
    @property(UIVec2) sourceOffset: UIVec2 = null;
    @property(UIVec2) targetOffset: UIVec2 = null;

    @property(UICombox) comboxCuveType: UICombox = null;
    @property(UICombox) comboxEase: UICombox = null;

    @property(EditorUICheckbox) checkRandomX: EditorUICheckbox = null;
    @property(EditorUICheckbox) checkRandomY: EditorUICheckbox = null;

    @property(UIVec2) point1: UIVec2 = null;
    @property(UIVec2) point2: UIVec2 = null;
    @property(UIVec2) randomAngle: UIVec2 = null;
    @property(cc.EditBox) editScale: cc.EditBox = null;

    onLoad () {
        store.registerReady(this._onEditorPrepare, this);
    }

    private _onEditorPrepare () {
        this.comboxPrefab.setHandler(data => {
            this._onGfxFileChanged(data);
            this._dispatchEvent();
        });

        this.comboxPrefab.addItem(EditorUtils.GfxCocosPrefab);

        this._registerEditBoxEvent(this.editDelay, 'editBulletDelay');
        this._registerEditBoxEvent(this.editInterval, 'editInterval');
        this._registerEditBoxEvent(this.editCnt, 'editCnt');
        this._registerEditBoxEvent(this.editDuration, 'editDuration');
        this._registerEditBoxEvent(this.editScale, 'editScale');

        this.sourceOffset.node.on(EditorEvent.UI_VEC2_CHANGED, () => { this._dispatchEvent(); });
        this.targetOffset.node.on(EditorEvent.UI_VEC2_CHANGED, () => { this._dispatchEvent(); });
        this.point1.node.on(EditorEvent.UI_VEC2_CHANGED, () => { this._dispatchEvent(); });
        this.point2.node.on(EditorEvent.UI_VEC2_CHANGED, () => { this._dispatchEvent(); });
        this.randomAngle.node.on(EditorEvent.UI_VEC2_CHANGED, () => { this._dispatchEvent(); });

        this.comboxCuveType.addItem([CUVE_TYPE.LINE, CUVE_TYPE.BEZIER]);
        this.comboxCuveType.setHandler(data => { this._dispatchEvent(); });

        this.comboxEase.addItem([EASE_TYPE.NONE,EASE_TYPE.INSINE, EASE_TYPE.OUTSINE, EASE_TYPE.INOUTSINE]);
        this.comboxEase.setHandler(data => { this._dispatchEvent(); });
        
        this.checkRandomX.init(null, () => { this._dispatchEvent(); });
        this.checkRandomY.init(null, () => { this._dispatchEvent(); });
    }

    private _registerEditBoxEvent (editBox: cc.EditBox, name: string) {
        const handler = new cc.Component.EventHandler();
        handler.target = this.node;
        handler.component = "EditorUIBullet";
        handler.handler = '_onTextChanged';
        handler.customEventData = name;        
        editBox.textChanged.push(handler);
    }

    private _onTextChanged (editbox: cc.EditBox, customData: string) {
        this._dispatchEvent();
    }

    private _dispatchEvent () {
        const event = new cc.Event.EventCustom(EditorEvent.BULLET_CHANGED, true);
        event.detail = this.data;
        this.node.dispatchEvent(event);
    }

    get data () : EffectBulletInfo {
        const prefab = this.comboxPrefab.selected;
        const delay = parseFloat(this.editDelay.string);
        const interval = parseFloat(this.editInterval.string);
        const count = parseInt(this.editCnt.string);
        const scale = parseInt(this.editScale.string);
        const duration = parseFloat(this.editDuration.string);
        const posS = this.sourceOffset.value;
        const posT = this.targetOffset.value;
        const randomAngle = this.randomAngle.value;
        const cuveType = this.comboxCuveType.selected;
        const ease = this.comboxEase.selected;
        const pointArr = [this.point1.value, this.point2.value];

        if (prefab.length < 2 || duration <= 0 || cuveType.length < 2 || count <= 0) {
            return null;
        }

        return {
            prefab: prefab,
            delay: delay,
            interval: interval,
            count: count,
            duration: duration,
            posSource: posS,
            posTarget: posT,
            arrPoint: pointArr,
            randomAngle: randomAngle,
            scale: scale,
            // @ts-ignore
            cuve: cuveType,
            // @ts-ignore
            ease: ease,
            randomX: this.checkRandomX.select ? 1 : 0,
            randomY: this.checkRandomY.select ? 1 : 0,
        };
    }

    clear () {
        this.data = null;
    }

    set data (data: EffectBulletInfo) {
        data = data || {prefab: "", cuve: null, posSource: cc.Vec3.ZERO, posTarget: cc.Vec3.ZERO, ease: null, duration: 0, count: 0, delay: 0, interval: 0, scale: 1, arrPoint: [cc.Vec3.ZERO, cc.Vec3.ZERO]};

        this.comboxPrefab.selected = data.prefab || "";

        this.editDelay.string = (data.delay || 0) + '';
        this.editInterval.string = (data.interval || 0) + '';
        this.editCnt.string = (data.count || 1) + '';
        this.editDuration.string = (data.duration || 0) + '';
        this.editScale.string = (data.scale || 1) + '';

        this.sourceOffset.value = data.posSource;
        this.targetOffset.value = data.posTarget;

        this.randomAngle.value = data.randomAngle || cc.Vec3.ZERO;
        if (data.arrPoint.length === 2) {
            this.point1.value = data.arrPoint[0] || cc.Vec3.ZERO;
            this.point2.value = data.arrPoint[1] || cc.Vec3.ZERO;
        }

        this.comboxCuveType.selected = data.cuve || CUVE_TYPE.LINE;
        this.comboxEase.selected = data.ease || EASE_TYPE.INSINE;

        this.checkRandomX.select = data.randomX ? true : false;
        this.checkRandomY.select = data.randomY ? true : false;
    }

    private _onGfxFileChanged (data: string) {
        if (data && data.length > 0) {

        }
    }
}
