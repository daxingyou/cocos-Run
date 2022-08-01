import { EffectAnimationInfo, EffectConst } from "./view-actor/CardSkill";
import { EditorEvent } from "./models/EditorConst";
import Actor from "./view-actor/Actor";
import { store } from "./store/EditorStore";
import UICombox from "./components/UICombox";
import EditorUICheckbox from "./EditorUICheckbox";

const NONE_ANIM = "None"
const FLIP_STATE = ["X-Forward","X-Backward"];
const ROLE_ANIMATIONS = [NONE_ANIM, 'Attack1', 'Attack2', 'Attack3', 'Attack4', 'Charge', 'Cheer', 'Die', 'Hit1', "Hit2", 'Idle', 'Jump', 'Release', 'Roll', 'Run', 'Skill'];
const {ccclass, property} = cc._decorator;

@ccclass
export default class EditorUIAnimation extends cc.Component {
    @property(UICombox)         comboxAnimation: UICombox = null;
    @property(UICombox)         comboxActor: UICombox = null;
    @property(cc.EditBox)       editDelay: cc.EditBox = null;
    @property(EditorUICheckbox) flipX: EditorUICheckbox = null;

    private _actorFrom: Actor = null;
    private _actorTo: Actor = null;

    onLoad () {
        this.comboxActor.setHandler(data => {
            this._onActorChanged(data);
        });
        this.comboxActor.addItem([EffectConst.ACTOR_SOURCE, EffectConst.ACTOR_TARGET]);

        // this.comboxAnimation.addItem(ROLE_ANIMATIONS);

        this.comboxAnimation.setHandler(data => {
            this._dispatchEvent();
        });

        this.flipX.init({}, () => {
            this._dispatchEvent();
        });

        store.registerReady(this._onLoadFinish, this);

        this._registerEditBoxEvent(this.editDelay, 'editDelay');
        cc.director.on('UPDATE_HERO', this.loadAnimations, this);
    }

    loadAnimations() {
        let sourceActor = store.sourceRole.node.getComponent(Actor);
        let spine = sourceActor.getSpine();
        if(spine) {
            let animations: string[] = [];
            let animaitonsJson = spine.skeletonData.skeletonJson.animations;
            for(const k in animaitonsJson) {
                animations.push(k);
            }
            this.comboxAnimation.addItem(animations);
            console.log('加载', spine.skeletonData.name, '动作完成：', animations);
        }
    }

    private _onLoadFinish() {
        this._actorFrom = store.sourceRole.node.getComponent(Actor);
        this._actorTo = store.targetRole.node.getComponent(Actor);
    }

    private _registerEditBoxEvent (editBox: cc.EditBox, name: string) {
        const handler = new cc.Component.EventHandler();
        handler.target = this.node;
        handler.component = "EditorUIAnimation";
        handler.handler = '_onTextChanged';
        handler.customEventData = name;
        editBox.textChanged.push(handler);
    }

    private _onTextChanged (editbox: cc.EditBox, customData: string) {
        this._dispatchEvent();
    }

    private _dispatchEvent () {
        const event = new cc.Event.EventCustom(EditorEvent.ANIMATION_CHANGED, true);
        event.detail = this.data;
        this.node.dispatchEvent(event);
    }
    
    _onActorChanged (data: string) {
    }

    get data () : EffectAnimationInfo {
        const animation = this.comboxAnimation.selected;
        const delay = parseFloat(this.editDelay.string);
        const actor = this.comboxActor.selected;

        if (animation.length < 2 || actor.length < 2 || (animation == NONE_ANIM && !this.flipX.select)) {
            return null;
        }

        return {
            animation: animation,
            actor: actor,
            delay: delay,
            flipX: this.flipX.select,
        };
    }

    clear () {
        this.data = null;
    }

    set data (data: EffectAnimationInfo) {
        data = data || {animation: '', actor: EffectConst.ACTOR_SOURCE};
        this.comboxActor.selected = data.actor;
        this._onActorChanged(data.actor);
        this.comboxAnimation.selected = data.animation;
        this.editDelay.string = (data.delay || 0) + '';
    }
}
