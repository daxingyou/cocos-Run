import { EffectInfo, ANIMATION_TAG, ANIMATION_GROUP } from "./view-actor/CardSkill";
import EditorUIShake from "./EditorUIShake";
import EditorUIAnimation from "./EditorUIAnimation";
import EditorUIGfx from "./EditorUIGfx";
import { store } from "./store/EditorStore";
import { stateCurrEffect, getCurrEffectInfo } from "./reducers/EditorReducers";
import { StateCurrEffect, EditorEvent } from "./models/EditorConst";
import { actionUpdateEffectInfo } from "./actions/EditorActions";
import EditorUIGlow from "./EditorUIGlow";
import UICombox from "./components/UICombox";
import EditorUISwitchButton from "./EditorUISwitchButton";
import EditorUIRoleMove from "./EditorUIRoleMove";
import EditorUIBullet from "./EditorUIBullet";
import EditorUIShadow from "./EditorUIShadow";
const {ccclass, property} = cc._decorator;

@ccclass
export default class EditorEffectInfo extends cc.Component {
    @property(EditorUIShake)        shakeInfo: EditorUIShake = null;
    @property(EditorUIAnimation)    animationInfo: EditorUIAnimation = null;        // 动作
    @property(EditorUIGfx)          gfxInfo: EditorUIGfx = null;                    // 特效
    @property(EditorUIBullet)       bulletInfo: EditorUIBullet = null;              // 子弹
    @property(EditorUIGlow)         glowInfo: EditorUIGlow = null;                  // 光效
    @property(EditorUIRoleMove)     moveInfo: EditorUIRoleMove = null;              // 移动
    @property(EditorUIShadow)       shadowInfo: EditorUIShadow = null;              // 影子
    @property(UICombox)             comboxTag: UICombox = null;                     // 类型标记
    @property(cc.Layout)            layoutContent: cc.Layout = null;                    
    @property(cc.ScrollView)        scroll: cc.ScrollView = null;

    @property(EditorUISwitchButton)     btnAnimSwitch: EditorUISwitchButton = null;
    @property(EditorUISwitchButton)     btnGfxSwitch: EditorUISwitchButton = null;
    @property(EditorUISwitchButton)     btnMoveSwitch: EditorUISwitchButton = null;
    

    private _data: EffectInfo = null;

    onLoad () {
        this._registerEvent();
        for (let i=1; i<ANIMATION_TAG.END;) {
            if (ANIMATION_TAG[i]) {
                this.comboxTag.addItem(ANIMATION_TAG[i]);
            }
            i = i << 1;
        }
        this.comboxTag.selected = ANIMATION_TAG[ANIMATION_TAG.Source_anim];
        this._updateLayout();
    }

    private _registerEvent () {
        this.animationInfo.node.on(EditorEvent.ANIMATION_CHANGED, (event: cc.Event.EventCustom) => {
            store.dispatch(actionUpdateEffectInfo(this.data));
            event.stopPropagation();
        });

        this.gfxInfo.node.on(EditorEvent.GFX_CHANGED, (event: cc.Event.EventCustom) => {
            store.dispatch(actionUpdateEffectInfo(this.data));
            event.stopPropagation();
        });

        this.moveInfo.node.on(EditorEvent.MOVE_CHANGED, (event: cc.Event.EventCustom) => {
            store.dispatch(actionUpdateEffectInfo(this.data));
            event.stopPropagation();
        });

        this.shadowInfo.node.on(EditorEvent.SHADOW_CHANGE, (event: cc.Event.EventCustom) => {
            store.dispatch(actionUpdateEffectInfo(this.data));
            event.stopPropagation();
        });

        this.bulletInfo.node.on(EditorEvent.BULLET_CHANGED, (event: cc.Event.EventCustom) => {
            store.dispatch(actionUpdateEffectInfo(this.data));
            event.stopPropagation();
        });

        // this.shakeInfo.node.on(EditorEvent.SHAKE_CHANGED, (event: cc.Event.EventCustom) => {
        //     store.dispatch(actionUpdateEffectInfo(this.data));
        //     event.stopPropagation();
        // });

        // this.glowInfo.node.on(EditorEvent.GLOW_CHANGED, (event: cc.Event.EventCustom) => {
        //     store.dispatch(actionUpdateEffectInfo(this.data));
        //     event.stopPropagation();
        // });

        // this.sfxInfo.node.on(EditorEvent.SFX_CHANGED, (event: cc.Event.EventCustom) => {
        //     store.dispatch(actionUpdateEffectInfo(this.data));
        //     event.stopPropagation();
        // })

        this.comboxTag.setHandler(() => {
            store.dispatch(actionUpdateEffectInfo(this.data));
            this._updateSubSwitch();
        });

        store.subscribe(stateCurrEffect, this._onCurrEffectChange, this);
    }

    private _updateSubSwitch () {
        if (this.data.tag == ANIMATION_TAG.Source_anim || this.data.tag == ANIMATION_TAG.Target_anim) {
            if (this.btnAnimSwitch.nodeClose.active) { this.btnAnimSwitch.onClick(); }
            if (this.btnGfxSwitch.nodeOpen.active) { this.btnGfxSwitch.onClick(); }
            if (this.btnMoveSwitch.nodeOpen.active) {  this.btnMoveSwitch.onClick(); }
        } else if (this.data.tag == ANIMATION_TAG.Source_gfx || this.data.tag == ANIMATION_TAG.Target_gfx) {
            if (this.btnGfxSwitch.nodeClose.active) { this.btnGfxSwitch.onClick(); }
            if (this.btnAnimSwitch.nodeOpen.active) { this.btnAnimSwitch.onClick(); }   
            if (this.btnMoveSwitch.nodeOpen.active) { this.btnMoveSwitch.onClick(); }
        } else if (this.data.tag == ANIMATION_TAG.Source_move) {
            if (this.btnGfxSwitch.nodeOpen.active) { this.btnGfxSwitch.onClick(); }
            if (this.btnAnimSwitch.nodeOpen.active) { this.btnAnimSwitch.onClick(); }   
            if (this.btnMoveSwitch.nodeClose.active) { this.btnMoveSwitch.onClick(); }
        }
    }

    private _onCurrEffectChange (cmd: string, state: StateCurrEffect) {
        this.clear();
        if (state.id > 0) {
            const info = getCurrEffectInfo(store.getState());
            if (info) {
                this.data = info;
                this._updateSubSwitch();
            }
        }
    }

    get data () : EffectInfo {
        if (!this._data) {
            return null;
        }

        let ret: EffectInfo = {
            id: this._data.id,
            seq: this._data.seq,
            tag: this.tag,
            animation: this.animationInfo.data,
            gfxInfo: this.gfxInfo.data,
            roleMove: this.moveInfo.data,
            bulletInfo: this.bulletInfo.data,
            // shakeInfo: this.shakeInfo.data,
            // glowInfo: this.glowInfo.data,
            // sfxInfo: this.sfxInfo.data,
        };

        let shadowInfo = this.shadowInfo.data;
        shadowInfo && shadowInfo.length > 0 && (ret.shadowInfo = shadowInfo);
        return ret;
    }

    get tag (): number {
        let selected = this.comboxTag.selected;
        // @ts-ignore
        return ANIMATION_TAG[selected] || ANIMATION_TAG.Source_anim;
    }

    clear () {
        this.data = null;
    }

    set data (data: EffectInfo) {
        if (!data) {
            this.animationInfo.clear();
            this.gfxInfo.clear();
            this.moveInfo.clear();
            this.bulletInfo.clear();
            this.shadowInfo.clear();
            // this.shakeInfo.clear();
            // this.glowInfo.clear();
        } else {
            this.animationInfo.data = data.animation;
            this.gfxInfo.data = data.gfxInfo;
            this.moveInfo.data = data.roleMove;
            this.bulletInfo.data = data.bulletInfo;
            this.shadowInfo.data = data.shadowInfo;
            // this.shakeInfo.data = data.shakeInfo;
            // this.glowInfo.data = data.glowInfo;
            // this.sfxInfo.data = data.sfxInfo;
            if (data.tag === undefined) {
                this.comboxTag.selected = ANIMATION_TAG[ANIMATION_TAG.Source_anim];
            } else {
                let k = ANIMATION_TAG[data.tag];
                this.comboxTag.selected = k || ANIMATION_TAG[ANIMATION_TAG.Source_anim];
            }            
        }
        this._data = data;
    }

    private _updateLayout () {
        this.layoutContent.updateLayout();
        const height = this.layoutContent.node.height;
        this.scroll.content.height = height;        
    }
}


