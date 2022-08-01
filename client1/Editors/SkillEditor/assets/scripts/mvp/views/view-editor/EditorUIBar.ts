
import EditorUITimeline from "./EditorUITimeline";
import EditorUtils from "./EditorUtils";
import engineHook from "./EditorGameHook";
import EditorSkillInfo from "./EditorSkillInfo";
import { ANIMATION_GROUP, EffectConst, RoleSkillInfo, SkillActorInfo, AnimationGroupInfo, SkillEventInfo, SKILL_EVENT } from "./view-actor/CardSkill";
import { store } from "./store/EditorStore";
import { stateCurrSkill, getUIRole, getRoleInfo } from "./reducers/EditorReducers";
import guiManager from "../../../common/GUIManager";
import UICombox from "./components/UICombox";
import Actor from "./view-actor/Actor";
import ItemRole from "../view-item/ItemRole";
import { HitLabelPool } from "../../../common/res-manager/NodePool";
import EditorUICheckbox from "./EditorUICheckbox";
import shakeManager from "./view-actor/ShakeManager";
import SkillEditor from "./SkillEditor";
import EditorUISwitchButton from "./EditorUISwitchButton";


const MAX_SLOW_FACTOR = 16;

const {ccclass, property} = cc._decorator;
@ccclass
export default class EditorUIBar extends cc.Component {
    @property(EditorUITimeline) timeline: EditorUITimeline = null;
    @property(cc.Label) labelTime: cc.Label = null;
    @property(UICombox) comboxSourceGroup: UICombox = null;
    @property(UICombox) comboxTargetGroup: UICombox = null;
    @property(EditorSkillInfo) currSkill: EditorSkillInfo = null;
    @property(cc.Label) labelSlow: cc.Label = null;
    @property(EditorUICheckbox) loopCheckBox: EditorUICheckbox = null;
    @property(EditorUISwitchButton) shadeBtn: EditorUISwitchButton = null;

    private _currInfo: RoleSkillInfo = null;
    private _slowFactor: number = 1;

    private _actorSource: Actor = null;
    private _actorTarget: Actor = null;    

    onLoad () {
        // from ANIMATION_GROUP's Key
        this.comboxSourceGroup.addItem(['SOURCE']);
        this.comboxTargetGroup.addItem(['TARGET', "TARGET_RESIST"]);

        this.comboxSourceGroup.selected = 'SOURCE';
        this.comboxTargetGroup.selected = 'TARGET';

        this.timeline.node.on(EditorUtils.EVENT_TIMELINE_PLAY, () => {
            this._onPlayClicked(true);
        });
        this.timeline.node.on(EditorUtils.EVENT_TIMELINE_PAUSE, () => {
            this._onPlayClicked(false);
        });
        this.timeline.node.on(EditorUtils.EVENT_TIMELINE_CHANGED, (event: cc.Event.EventCustom) => {
            this._onTimelineChanged(event);
        });

        this._updateSlow();

        store.registerReady(this._onLoadFinish, this);
        store.subscribe(stateCurrSkill, this._onCurrSkillChanged, this);

        this.loopCheckBox.select = false;
        this.shadeBtn.select = false;
    }

    private _onLoadFinish() {
        this._actorSource = store.sourceRole.node.getComponent(Actor);
        this._actorTarget = store.targetRole.node.getComponent(Actor);
    }

    private _onCurrSkillChanged () {
        this._resetCurrSkillInfo();
        this._updateTimeLabel();
    }

    private _resetCurrSkillInfo () {
        // this._currInfo = this.currSkill.data;
        this._currInfo = store.getState().stateCurrSkill.skillInfo;
    }

    private _onPlayClicked (play: boolean) {
        if (play) {
            // 说明是新开始的；需要reset一下
            if (this.timeline.value < 0.005) {
                engineHook.resumeTimer();
                this._resetSkillAnimation();
                this._playCardSkill();
                if (this.loopCheckBox.select == false) {            
                    this.schedule(this._updateTimeline, 0);
                }
            } else {
                engineHook.resumeTimer();
            }
        } else {
            engineHook.pauseTimer();
        }
    }

    private _onTimelineChanged (event: cc.Event.EventCustom) {
        const info = event.detail;
        const value = info.value;
        if (value >= 1 || value <= 0) {
            this.timeline.pause();
            this._resetSkillAnimation();
            engineHook.resumeTimer();
        }

        this._updateTimeLabel();
        if (this.timeline.paused) {
            this._updateToTime(this._timelineToTime(info.value), this._timelineToTime(info.lastValue));
        }
    }

    private _updateToTime (time: number, lastTime: number) {
    }

    private _resetSkillAnimation () {
        // 先找到所有的已经加加载的动画，给remove掉
        let children = [...this._actorSource.skeleton.node.children];
        children.forEach((node: cc.Node) => {
            if (node.name.indexOf('SkeletonOnce') >= 0) {
                node.removeFromParent(true);                
            }
        });

        children = [...this._actorTarget.skeleton.node.children];
        children.forEach((node: cc.Node) => {
            if (node.name.indexOf('SkeletonOnce') >= 0) {
                node.removeFromParent(true);
            }
        });

        // 然后把动画给复位
        // this.actorSource.skeleton.setToSetupPose();
        // this.actorTarget.skeleton.setToSetupPose();
    }

    private _timeToTimeline (time: number): number {
        const duration = this._getDuration();
        return duration > 0 ? time / duration : 0.0;
    }

    private _timelineToTime (v: number): number {
        return v * this._getDuration();
    }

    private _updateTimeline (dt: number) {
        // 更新时间轴的进度
        const nowTime = this._timelineToTime(this.timeline.value) + dt;
        this.timeline.value = this._timeToTimeline(nowTime);

        // 更新timeLabel
        this._updateTimeLabel();

        // 说明已经过完时间了；需要重置
        if (this.timeline.value >= 1) {
            this._resetSkillAnimation();
            this.unschedule(this._updateTimeline);
            this.timeline.reset();
        }
    }

    private _updateTimeLabel () {
        this.labelTime.string = `${this._timelineToTime(this.timeline.value).toFixed(2)}/${this._getDuration().toFixed(2)}(${this._getGroupTime().toFixed(2)})`;
    }
    
    private _getDuration (): number {
        const sourceInfo = EffectConst.filterGroupTime(this._currInfo, this.sourceGroup);
        const targetInfo = EffectConst.filterGroupTime(this._currInfo, this.targetGroup);
        return Math.max(sourceInfo.end, targetInfo.end);
    }

    private _getGroupTime (): number {
        let ret = -1;
        const arrGroupInfo = store.getState().stateCurrSkill.skillInfo.arrGroupInfo;
        if (arrGroupInfo && arrGroupInfo.length > 0) {
            arrGroupInfo.some((info: AnimationGroupInfo) => {
                if (info && info.group == this.comboxTargetGroup.selected) {
                    ret = info.duration;
                    return true;
                }
                return false;
            })
        }

        if (ret < 0) {
            ret = EffectConst.filterGroupTime(this._currInfo, this.targetGroup).end;
        }
        return ret;
    }

    private get targetGroup (): ANIMATION_GROUP {
        // @ts-ignore
        return ANIMATION_GROUP[this.comboxTargetGroup.selected]
    }

    private get sourceGroup (): ANIMATION_GROUP {
        // @ts-ignore
        return ANIMATION_GROUP[this.comboxSourceGroup.selected]
    }

    private _playCardSkill () {
        this.currSkill.onSaveClick();
        this._resetCurrSkillInfo();

        const hero = getUIRole(store.getState()).hero;
        const info = EffectConst.convertSkillWithRoleInfo(this._currInfo, getRoleInfo(hero, store.getState()));

        // this.scheduleOnce(()=> {
        //     this._actorSource.playCardSkill(info, this.sourceGroup, {
        //         source: this._actorSource.node.getComponent(ItemRole),
        //         target: this._actorTarget.node.getComponent(ItemRole),
        //     });
            
        //     this._actorTarget.playCardSkill(info, this.targetGroup, {
        //         source: this._actorSource.node.getComponent(ItemRole),
        //         target: this._actorTarget.node.getComponent(ItemRole),
        //         onSkillEvent: this._showHitLabel.bind(this),
        //     });
        // });

        const timeInfo = this._getDuration() || 0.01;
        let cnt = 0;
        let showShade = this.shadeBtn.select;
        this.schedule(()=> {
            cnt++
            if ((this.loopCheckBox.select == false && cnt > 1) || cnt > 10) {
                if(showShade){
                    let worldPos = this._actorSource.node.parent.parent.convertToWorldSpaceAR(this._actorSource.node.parent.getPosition());
                    worldPos = this._actorSource.node.parent.oriParent.convertToNodeSpaceAR(worldPos);
                    this._actorSource.node.parent.parent = this._actorSource.node.parent.oriParent;
                    this._actorSource.node.parent.setPosition(worldPos);
                    this._actorSource.node.parent.oriParent = null;

                    worldPos = this._actorTarget.node.parent.parent.convertToWorldSpaceAR(this._actorTarget.node.parent.getPosition());
                    worldPos = this._actorTarget.node.parent.oriParent.convertToNodeSpaceAR(worldPos);
                    this._actorTarget.node.parent.parent = this._actorTarget.node.parent.oriParent;
                    this._actorTarget.node.parent.setPosition(worldPos);
                    this._actorTarget.node.parent.oriParent = null;
                }
                
                SkillEditor.getInstance().setShadeVisible(false);
                this.unscheduleAllCallbacks();
                this._resetSkillAnimation();
                this.timeline.reset();
                
            } else {
                if(showShade){
                    SkillEditor.getInstance().setShadeVisible(true);
                    if(!cc.isValid(this._actorSource.node.parent.oriParent)){
                        this._actorSource.node.parent.oriParent = this._actorSource.node.parent.parent;
                        let worldPos = this._actorSource.node.parent.oriParent.convertToWorldSpaceAR(this._actorSource.node.parent.getPosition());
                        worldPos = SkillEditor.getInstance().shadeNode.convertToNodeSpaceAR(worldPos);
                        this._actorSource.node.parent.parent = SkillEditor.getInstance().shadeNode;
                        this._actorSource.node.parent.setPosition(worldPos);
                    }
                    
                    if(!cc.isValid(this._actorTarget.node.parent.oriParent)){
                        this._actorTarget.node.parent.oriParent = this._actorTarget.node.parent.parent;
                        worldPos = this._actorTarget.node.parent.oriParent.convertToWorldSpaceAR(this._actorTarget.node.parent.getPosition());
                        worldPos = SkillEditor.getInstance().shadeNode.convertToNodeSpaceAR(worldPos);
                        this._actorTarget.node.parent.parent = SkillEditor.getInstance().shadeNode;
                        this._actorTarget.node.parent.setPosition(worldPos);
                    }
                }
               
                this._playShake(info);
                this._actorSource.playCardSkill(info, this.sourceGroup, {
                    source: this._actorSource.node.getComponent(ItemRole),
                    target: this._actorTarget.node.getComponent(ItemRole),
                });
                this._actorTarget.playCardSkill(info, this.targetGroup, {
                    source: this._actorSource.node.getComponent(ItemRole),
                    target: this._actorTarget.node.getComponent(ItemRole),
                    onSkillEvent: this._showHitLabel.bind(this),
                });
            }
           
        }, timeInfo - 0.01, 100, 0.1) 
    }

    private _playShake(info: RoleSkillInfo){
        if(!info || !info.shakes || info.shakes.length === 0) return;
        info.shakes.forEach(ele => {
            if(!EffectConst.isShakeValid(ele)) return;
            shakeManager.shake(ele);
        });
    }

    setActorScource (ndScource: cc.Node) {
        let comp = ndScource.getComponent(Actor);
        if (!comp || !ndScource || !ndScource.active) {
            guiManager.showTips("找不到角色")
            return;
        }
        this._actorSource = ndScource.getComponent(Actor);
    }

    setTargetScource (ndTaget: cc.Node) {
        let comp = ndTaget.getComponent(Actor);
        if (!comp || !ndTaget || !ndTaget.active) {
            guiManager.showTips("找不到角色")
            return;
        }
        this._actorTarget = ndTaget.getComponent(Actor);
    }

    private _updateSlow () {
        engineHook.frameInterval = engineHook.DEFAULT_INTERVAL / this._slowFactor;
        this.labelSlow.string = `X${this._slowFactor}`;
    }

    private _showHitLabel (eventInfo: SkillEventInfo) {
        if (eventInfo && eventInfo.type == SKILL_EVENT.HIT_TARGET) {
            const hitLabel = HitLabelPool.get();
            hitLabel.show(this._actorTarget.node, () => {
                HitLabelPool.put(hitLabel);
            }, {
                RoleUID: 1,
                // Delta: -Math.floor(Math.random() * 100),
            }, {
                RoleUID: 1,
                TargetUid: 2,
                Attack: -Math.floor(Math.random() * 100)
            });
        }
    }

    onSlowClick () {
        this._slowFactor *= 2;
        if (this._slowFactor > MAX_SLOW_FACTOR) {
            this._slowFactor = 1;
        }
        this._updateSlow();
    }

    onEventClick () {
        guiManager.loadView('EditorSkillEventView', null, this._timelineToTime(this.timeline.value));
    }

    onGroupClick () {
        guiManager.loadView('EditorSkillGroupView', null, {
            group: this.comboxTargetGroup.selected,
            duration: this._getGroupTime(),
        });
    }

    //振屏
    onShakeClick() {
        guiManager.loadView('EditorShakeView', null);
    }

    //分身
    onShadowClick() {
        guiManager.loadView('EditorWholeShadowView', null);
    }

    // 音效
    onSfxClick() {
        guiManager.loadView('EditorUISfxView', null);
    }
}