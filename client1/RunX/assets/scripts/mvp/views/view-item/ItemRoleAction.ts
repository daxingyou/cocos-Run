import { logger } from "../../../common/log/Logger";
import Actor from "../view-actor/Actor";
import { ANIMATION_GROUP, RoleSkillInfo, SkillActorInfo, SkillSaperateInfo } from "../view-actor/SkillUtils";
import skillDisplayManager from "../view-actor/SkillDisplayManager";
import skeletonManager from "../../../common/SkeletonManager";

const {ccclass, property} = cc._decorator;

interface loopSpCatch {
    skeleton: sp.Skeleton,
    path: string
}

@ccclass
export default class ItemRoleAction extends cc.Component {
    @property(cc.Node)          nodeSkillGfx: cc.Node = null;
    @property(cc.Node)          nodeLoopGfx: cc.Node = null;
    @property(cc.Node)          nodeSkillGfxBehind: cc.Node = null;
    @property(cc.Node)          nodeLoopGfxBehind: cc.Node = null;

    private _skNode: cc.Node = null;
    private _loopSpine = new Map<number, loopSpCatch[]>()

    init (skNode: cc.Node) {
        this._clearCatch();
        this._skNode = skNode;
    }

    deInit () {
        this._clearCatch();
        this._skNode = null;
        this.unscheduleAllCallbacks();
        let actorComp = this.node.getComponent(Actor);
        actorComp && actorComp.deInit();
    }

    private _clearCatch () {
        this._loopSpine.forEach( (v, key) => {
            if (v.length) {
                v.forEach( _sp => {
                    if (_sp.skeleton && cc.isValid(_sp.skeleton)) {
                        _sp.skeleton.node.removeFromParent();
                        skeletonManager.releaseSkeleton(_sp.path, _sp.skeleton);
                    }
                })
            }
        })
        this._loopSpine.clear();
    }
    
    initActorSpine () {
        let actorComp = this.node.getComponent(Actor);
        let spine = this._skNode.getChildByName("sp");
        actorComp.init(spine.getComponent(sp.Skeleton));
    }

    getSkillGfxNode (behindRole?: boolean): cc.Node {
        return behindRole ? this.nodeSkillGfxBehind : this.nodeSkillGfx;
    }

    /**
     * 播放技能特效
     * @param user 
     * @param target 
     * @param itemId 
     */
    playSkillEffect (itemId: number, group: ANIMATION_GROUP, actorInfo?: SkillActorInfo, saperate?: SkillSaperateInfo): number {
        const src = actorInfo ? actorInfo.source : null;
        let skillInfo = skillDisplayManager.getSkill(itemId, src ? src.role.skeletonName : null);
        return this._playItemEffect(skillInfo, group, actorInfo, saperate);
    }

    playBeforeOrBehindSkillEffect(itemId: number, group: ANIMATION_GROUP, type: number, actorInfo?: SkillActorInfo,  saperate?: SkillSaperateInfo, endCb?: Function) {
        const src = actorInfo ? actorInfo.source : null;
        let skillInfo = null;
        if(1 == type) {
           skillInfo = skillDisplayManager.getFrontEffect(itemId, src ? src.role.skeletonName : null);
        } else if(2 == type) {
            skillInfo = skillDisplayManager.getBehindEffect(itemId, src ? src.role.skeletonName : null);
        }
        return this._playItemEffect(skillInfo, group, actorInfo, saperate, endCb);
    }
    
    /**
     * 播放buff激活特效
     * @param buffId 
     * @param group 
     * @param actorInfo 
     */
    playBuffSkillEffect (buffId: number, group: ANIMATION_GROUP, actorInfo?: SkillActorInfo): number {
        const src = actorInfo ? actorInfo.source : null;
        let skillInfo = skillDisplayManager.getBuffEffectSkill(buffId, src ? src.role.skeletonName : null);
        if (skillInfo == null) {
            logger.warn('ItemRole', `BUFF激活还没有配置效果。buffId = ${buffId}`);
        }

        return this._playItemEffect(skillInfo, group, actorInfo);
    }

    private _playItemEffect (skillInfo: RoleSkillInfo, group: ANIMATION_GROUP, actorInfo?: SkillActorInfo, saperate?: SkillSaperateInfo, endCb?: Function): number {
        let actorComp: Actor = this.node.getComponent("Actor");
        return actorComp.playSkill(skillInfo, group, actorInfo, saperate, endCb);
    }

    catchLoopSpine (keyId: number, info: {skeleton: sp.Skeleton, path: string}) {
        if (keyId) {
            if(this._loopSpine.has(keyId)) {
                let curr = this._loopSpine.get(keyId);
                curr.push(info);
            } else {
                this._loopSpine.set(keyId, [ info ])
            }
        }
    }

    disableLoopSpine (keyId: number) {
        if (keyId) {
            if(this._loopSpine.has(keyId)) {
                let spines = this._loopSpine.get(keyId);
                spines.forEach( _s => {
                    _s.skeleton.node.active = false;
                })
            }
        }
    }

    enableLoopSpine (keyId: number) {
        if (keyId) {
            if(this._loopSpine.has(keyId)) {
                let spines = this._loopSpine.get(keyId);
                spines.forEach( _s => {
                    _s.skeleton.node.active = true;
                })
            }
        }
    }

    getLoopSpine(keyId: number, isAnimationValid: boolean = false): loopSpCatch[] {
        return this._loopSpine.get(keyId);
    }

}

