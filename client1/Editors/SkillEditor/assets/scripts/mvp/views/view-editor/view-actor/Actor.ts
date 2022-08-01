import { RoleSkillInfo, EffectInfo, EffectConst, ANIMATION_GROUP, SkillActorInfo, ANIMATION_TAG, SKELETON_EVENT, GFX_TYPE, EffectGfxInfo, CUVE_TYPE, AOE_TYPE, EffectMoveInfo, ROLE_MOVE_TYPE, EffectBulletInfo, EffectShadowInfo, EffectAnimationInfo, ROLE_SHADOW_TYPE, EffectSfxInfo } from "./CardSkill";
import skeletonManager from "./SkeletonManager";
import shakeManager from "./ShakeManager";
import { logger } from "../../../../common/log/Logger";
import { CuveAnimationInfo } from "../../../../common/animation/CuveAnimation";
import { utils } from "../../../../app/AppUtils";
import SkeletonAnimationOnce from "../../../../common/animation/SkeletonAnimationOnce";
import CreatorAnimationOnce from "../../../../common/animation/CreatorAnimationOnce";
import { ANIM_TYPE } from "../../../../common/animation/AnimationOnce";
import CreatorPrefabOnce from "../../../../common/animation/CreatorPrefabOnce";
import scheduleManager from "../../../../common/ScheduleManager";
import { ROLE_TYPE } from "../../../../app/AppEnums";
import { ROLE_Z_INDEX_TYPE } from "../models/EditorConst";
import ItemRole from "../../view-item/ItemRole";
import { store } from "../store/EditorStore";
import { audioManager } from "../../../../common/AudioManager";

const {ccclass, property} = cc._decorator;
@ccclass
export default class Actor extends cc.Component{
    @property(sp.Skeleton)
    skeleton: sp.Skeleton = null;

    onLoad () {
        if (cc.isValid(this.skeleton)) {
            this.skeleton.setCompleteListener((trackEntry: any) => {
                this._onAnimationComplete(trackEntry);
            });
        }
    }

    init (spine: sp.Skeleton) {
        this.unscheduleAllCallbacks();
        this.skeleton = spine;
        this.skeleton.setCompleteListener((trackEntry: any) => {
            this._onAnimationComplete(trackEntry);
        });
        // this.skeleton.skeletonData.textures.forEach(tex => {
        //     tex.setMipmap(true);
        // });
        this._turnToIdle();
    }

    getSpine(): sp.Skeleton {
        return this.skeleton;
    }

    private _turnToIdle () {
        if (cc.isValid(this.skeleton)) {
            this.skeleton.setAnimation(0, 'Idle', true);
        }
    }

    /**
     * @desc 整个角色的动画状态也都不多，就不再用状态来驱动了
     * @param trackEntry 
     */
    _onAnimationComplete (trackEntry: any) {
        if (trackEntry.animation.name !== 'Idle' && trackEntry.animation.name !== 'dead') {
            this._turnToIdle();
        }
    }

    start () {
        this._turnToIdle();
    }

    private _lerpVec3 (start: cc.Vec3, end: cc.Vec3, ds: cc.Vec3): cc.Vec3 {
        const delt = end.sub(start);
        const xv = delt.x < 0 ? -1 : 1;
        const yv = delt.y < 0 ? -1 : 1;
        return start.add(cc.v3(ds.x * xv, ds.y * yv));
    }

    private _playGfxInfo (gfxInfo: EffectGfxInfo, actorInfo: SkillActorInfo, group: ANIMATION_GROUP) {
        if (!EffectConst.isGfxValid(gfxInfo) || !actorInfo) {
            return;
        }

        let nodeJoint: cc.Node = actorInfo.target.getSkillGfxNode(gfxInfo.behindJoint);
        if (group === ANIMATION_GROUP.SOURCE) {
            nodeJoint = actorInfo.source.getSkillGfxNode(gfxInfo.behindJoint);
        }
        
        if (gfxInfo.aoe) {
            let isTop: boolean = gfxInfo.behindJoint ? !gfxInfo.behindJoint : true;
            if (gfxInfo.aoe == AOE_TYPE.SOURCE) {
                nodeJoint = actorInfo.source.getAoeNode(isTop);
            } else if (gfxInfo.aoe == AOE_TYPE.TARGET) {
                nodeJoint = actorInfo.target.getAoeNode(isTop);
            }
        }

        if (!nodeJoint) {
            logger.warn('Actor', `Can not find Joint for Gfx. aoe = ${gfxInfo.aoe}`);
            return;
        }

        let gfxEventHandler: Function = null;
        if (actorInfo && actorInfo.onSkeletonEvent) {
            gfxEventHandler = (trackEntry: any, event: any) => {
                actorInfo.onSkeletonEvent(SKELETON_EVENT.GFX, trackEntry, event);
            }
        }

        let offset = cc.v3(gfxInfo.offset.clone());
        if(gfxInfo.offsetScope){
            let offsetScope = cc.v3(gfxInfo.offsetScope);
            offsetScope.x *= Math.random();
            offsetScope.y *= Math.random();
            offset.add(offsetScope, offset);
        }

        let cuveInfo: CuveAnimationInfo = null;
        if (EffectConst.isCuveValid(gfxInfo.cuve) && actorInfo) {
            let arrPoint: cc.Vec3[] = [];

            // 如果有Source的话，要把挂节点给换掉的
            if (gfxInfo.cuve.source) {
                if (gfxInfo.cuve.source === EffectConst.JOINT_SOURCE) {
                    nodeJoint = actorInfo.source.getSkillGfxNode(gfxInfo.behindJoint);
                } else if (gfxInfo.cuve.source === EffectConst.JOINT_TARGET) {
                    nodeJoint = actorInfo.target.getSkillGfxNode(gfxInfo.behindJoint);
                }
            }
            
            // 找到target
            let nodeTarget: cc.Node = actorInfo.source.getSkillGfxNode(gfxInfo.behindJoint);
            if (gfxInfo.cuve.target == EffectConst.JOINT_TARGET) {
                nodeTarget = actorInfo.target.getSkillGfxNode(gfxInfo.behindJoint);
            }

            // @todo 这里不能直接return
            if (!nodeTarget) {
                logger.warn('Actor', `Can not find joint target for cuve.`);
                return;
            }

            // 这里要把nodeTarget 和 nodeJoint 以及 offset 给转换一下子才行的，不然层次不对；要挂在 stage 上边
            const realJoint = nodeJoint.parent.parent.parent;
            nodeJoint.convertToWorldSpaceAR(offset, offset);
            realJoint.convertToNodeSpaceAR(offset, offset);
            nodeJoint = realJoint;

            const cuveStart = offset.clone();

            // 确定目标点的位置，要转换到挂节点的坐标上
            const pos = nodeTarget.convertToWorldSpaceAR(cc.v2(gfxInfo.cuve.offset.x, gfxInfo.cuve.offset.y));
            const dest = nodeJoint.convertToNodeSpaceAR(pos);

            // offset 默认是起始点和终点的差值
            if (gfxInfo.cuve.cuve == CUVE_TYPE.LINE) {
                // 直接的话，直接放目标点就好了
                arrPoint.push(cc.v3(dest.x, dest.y));
            } else if (gfxInfo.cuve.cuve === CUVE_TYPE.BEZIER) {

                let willFlipY = false;
                if (utils.getRandomInt(10) > 5) {
                    willFlipY = true;
                }

                // 随机控制点设置
                arrPoint = gfxInfo.cuve.arrPoint.map(pt => {
                    let raw = cc.v3(pt.x, pt.y);
                    if (gfxInfo.cuve.randomX) {
                        let random = utils.getRandomInt(raw.x / 3);
                        if (utils.getRandomInt(10) > 5) {
                            raw.x -= random;
                        } else {
                            raw.x += random;
                        }
                    }

                    if (gfxInfo.cuve.randomY) {
                        let random = utils.getRandomInt(raw.y / 6);
                        if (utils.getRandomInt(10) > 5 || willFlipY) {
                            raw.y -= random;
                        } else {
                            raw.y += random;
                        }

                        if (willFlipY) {
                            raw.y *= -1;
                        }
                    }

                    raw = this._lerpVec3(cuveStart, cc.v3(dest.x, dest.y), raw);
                    return raw;
                });  

                arrPoint.push(cc.v3(dest.x, dest.y));
            }

            cuveInfo = {
                node: null,
                type: gfxInfo.cuve.cuve,
                arrPoint: arrPoint,
                time: gfxInfo.cuve.duration,
                ease: gfxInfo.cuve.ease,
            }
        }

        let angle = 0;
        if (gfxInfo.randomAngle) {
            angle = utils.getRandomInt(Math.abs(gfxInfo.randomAngle.x - gfxInfo.randomAngle.y));
            angle = angle + Math.min(gfxInfo.randomAngle.x, gfxInfo.randomAngle.y);
        }
        
        // const flipX = actorInfo.leftSide ? true : false;
        const flipX = gfxInfo.flipX;
        if (!gfxInfo.type || gfxInfo.type == GFX_TYPE.SKELETON) {
            let skeletonPlayer: SkeletonAnimationOnce = new SkeletonAnimationOnce(ANIM_TYPE.Skeleton, {
                path: EffectConst.toGfxPath(gfxInfo.skeleton),
                node: nodeJoint,
                animation: gfxInfo.animation,
                skin: gfxInfo.skin,
                delay: gfxInfo.delay,
                offset: offset,
                scale: gfxInfo.scale,
                scheduleHelper: scheduleManager,
                eventHandler: gfxEventHandler,
                cuveInfo: cuveInfo,
                angle: angle,
                flipX: flipX,
            });
            skeletonPlayer.play();
        } else if(gfxInfo.type == GFX_TYPE.COCOS_ANIMATION) {
            let skeletonPlayer: CreatorAnimationOnce = new CreatorAnimationOnce(ANIM_TYPE.CocosAnimation, {
                path: EffectConst.toGfxPath(gfxInfo.skeleton, ANIM_TYPE.CocosAnimation),
                node: nodeJoint,
                animation: gfxInfo.animation,
                skin: gfxInfo.skin,
                delay: gfxInfo.delay,
                offset: offset,
                scale: gfxInfo.scale,
                scheduleHelper: scheduleManager,
                eventHandler: gfxEventHandler,
                cuveInfo: cuveInfo,
                angle: angle,
                flipX: flipX,
            });
            skeletonPlayer.play();
        } else if (gfxInfo.type == GFX_TYPE.COCOS_PREFAB) {
            let skeletonPlayer: CreatorPrefabOnce = new CreatorPrefabOnce(ANIM_TYPE.CocosPrefab, {
                path: EffectConst.toGfxPath(gfxInfo.skeleton, ANIM_TYPE.CocosPrefab),
                node: nodeJoint,
                animation: gfxInfo.animation,
                skin: gfxInfo.skin,
                delay: gfxInfo.delay,
                offset: offset,
                scale: gfxInfo.scale,
                scheduleHelper: this,
                eventHandler: gfxEventHandler,
                cuveInfo: cuveInfo,
                angle: angle,
                flipX: flipX,
            });
            skeletonPlayer.play();
        }
    }

    private _playBulletInfo (bullet: EffectBulletInfo, actorInfo: SkillActorInfo, group: ANIMATION_GROUP) {
        if (!EffectConst.isBulletValid(bullet) || !actorInfo) {
            return;
        }

        // actorInfo.target.node.parent.zIndex = 2;
        // actorInfo.source.node.parent.zIndex = group === ANIMATION_GROUP.SOURCE? 3:1;
        // 找到target
        let nodeTarget: cc.Node = actorInfo.target.getSkillGfxNode(false);
        // 挂在谁那里
        let nodeJoint: cc.Node = actorInfo.source.getSkillGfxNode(false);
        if (group === ANIMATION_GROUP.SOURCE) {
            nodeTarget = actorInfo.source.getSkillGfxNode(false);
            nodeJoint = actorInfo.target.getSkillGfxNode(false);
        }

        let gfxEventHandler: Function = null;
        if (actorInfo && actorInfo.onSkeletonEvent) {
            gfxEventHandler = (trackEntry: any, event: any) => {
                actorInfo.onSkeletonEvent(SKELETON_EVENT.GFX, trackEntry, event);
            }
        }

        let offsetS = cc.v3(bullet.posSource.clone());
        let offsetT = cc.v3(bullet.posTarget.clone());
        let cuveInfo: CuveAnimationInfo = null;

        let arrPoint: cc.Vec3[] = [];

        // 这里要把nodeTarget 和 nodeJoint 以及 offset 给转换一下子才行的，不然层次不对；要挂在 stage 上边
        const cuveStart = offsetS.clone();
        const realJoint = nodeJoint.parent.parent;
        nodeJoint.convertToWorldSpaceAR(offsetS, offsetS);
        realJoint.convertToNodeSpaceAR(offsetS, cuveStart);
        nodeJoint = realJoint;


        // 确定目标点的位置，要转换到挂节点的坐标上
        const pos = nodeTarget.convertToWorldSpaceAR(offsetT);
        const dest = nodeJoint.convertToNodeSpaceAR(pos);

        let points: cc.Vec3[][] = [];
        // offset 默认是起始点和终点的差值
        if (bullet.cuve == CUVE_TYPE.LINE) {
            // 直接的话，直接放目标点就好了
            arrPoint.push(cc.v3(dest.x, dest.y));
            points.push(arrPoint);
        } else if (bullet.cuve === CUVE_TYPE.BEZIER) {
            for (let i = 0; i < bullet.count; i++) {
                let willFlipY = false;
                if (utils.getRandomInt(10) > 5) {
                    willFlipY = true;
                }
                // 随机控制点设置
                let bzerPoint = bullet.arrPoint.map(pt => {
                    let raw = cc.v3(pt.x, pt.y);
                    if (bullet.randomX) {
                        let random = utils.getRandomInt(raw.x / 2);
                        if (utils.getRandomInt(10) > 5) {
                            raw.x -= random;
                        } else {
                            raw.x += random;
                        }
                    }

                    if (bullet.randomY) {
                        let random = utils.getRandomInt(raw.y / 3);
                        if (utils.getRandomInt(10) > 5/* || willFlipY*/) {
                            raw.y -= random;
                        } else {
                            raw.y += random;
                        }

                        if (willFlipY) {
                            raw.y *= -1;
                        }
                    }

                    raw = this._lerpVec3(cuveStart, cc.v3(dest.x, dest.y), raw);
                    return raw;
                });  

                bzerPoint.push(cc.v3(dest.x, dest.y));
                points.push(bzerPoint);
            }
        }

        cuveInfo = {
            node: null,
            type: bullet.cuve,
            arrPoint: [],
            time: bullet.duration,
            ease: bullet.ease,
        }
        
        let angle = 0;
        if (bullet.randomAngle) {
            angle = utils.getRandomInt(Math.abs(bullet.randomAngle.x - bullet.randomAngle.y));
            angle = angle + Math.min(bullet.randomAngle.x, bullet.randomAngle.y);
        }
        
        // const flipX = actorInfo.leftSide ? true : false;
        const flipX = group === ANIMATION_GROUP.SOURCE? true:false;
       
        for (let i = 0; i < bullet.count; i++) {
            let interval = bullet.interval && bullet.interval > 0.1? bullet.interval:0.1;
            let delay = i * interval;
            let arr = bullet.cuve == CUVE_TYPE.LINE? points[0]:points[i];
            let curve = utils.deepCopy(cuveInfo);
            // @ts-ignore
            curve.arrPoint = arr;
            this.scheduleOnce(()=>{
                let bulletPlayer: CreatorPrefabOnce = new CreatorPrefabOnce(ANIM_TYPE.CocosPrefab, {
                    path: EffectConst.toGfxPath(bullet.prefab, ANIM_TYPE.CocosPrefab),
                    node: nodeJoint,
                    animation: "",
                    skin: "",
                    delay: bullet.delay,
                    offset: bullet.posSource.clone(),
                    scale: bullet.scale,
                    scheduleHelper: this,
                    eventHandler: gfxEventHandler,
                    // @ts-ignore
                    cuveInfo: curve,
                    angle: angle,
                    flipX: flipX,
                });
                bulletPlayer.play();
            }, delay)
        }
    }

    private _playRoleMovement (moveInfo: EffectMoveInfo, actorInfo: SkillActorInfo, group: ANIMATION_GROUP) {
        if (!moveInfo || !actorInfo) {
            return;
        }

        let finnalPos = cc.v2(moveInfo.position.clone());
        let posType = moveInfo.type? moveInfo.type: ROLE_MOVE_TYPE.NONE;
        if (posType == ROLE_MOVE_TYPE.NONE) {
            return;
        }
        let delay = moveInfo.delay? moveInfo.delay:0;
        let time = moveInfo.time? moveInfo.time:0;

        let itemRole = group == ANIMATION_GROUP.SOURCE ? actorInfo.source : actorInfo.target;
        let targetRole = group == ANIMATION_GROUP.SOURCE ? actorInfo.target : actorInfo.source;
        let ROLE_FORMAT_GAP = targetRole.roleType == ROLE_TYPE.MONSTER ? -150 : 150;
        let sourceWroldPos = itemRole.node.convertToWorldSpaceAR(cc.v2(0, 0));
        let moveFlip = sourceWroldPos.x < cc.winSize.width/2? 1:-1;;
        if (posType == ROLE_MOVE_TYPE.DEFAULT) {
            let targetWorldPos = targetRole.node.convertToWorldSpaceAR(cc.v2(ROLE_FORMAT_GAP, 0));
            finnalPos = itemRole.node.parent.convertToNodeSpaceAR(targetWorldPos);
            finnalPos.x += moveInfo.position.x;
            finnalPos.y += moveInfo.position.y;
        } else if (posType == ROLE_MOVE_TYPE.RELATIVE){
            finnalPos = cc.v2(moveInfo.position.x * moveFlip, moveInfo.position.y);
        }else {
            let realWroldX = cc.winSize.width/2 + moveInfo.position.x;
            let realWroldY = cc.winSize.height/2 + moveInfo.position.y;
            finnalPos = itemRole.node.parent.convertToNodeSpaceAR(cc.v2(realWroldX, realWroldY));
        }

        if (!delay) {
            itemRole.node.stopAllActions();
            itemRole.node.runAction(cc.moveTo(time, finnalPos))
            return;
        }

        this.scheduleOnce(()=>{
            itemRole.node.stopAllActions();
            itemRole.node.runAction(cc.moveTo(time, finnalPos))
        }, delay);
    }

    private _playRoleAnim(animation: EffectAnimationInfo, oringinalScale: number, cb: Function){
        let anim = animation ? animation.animation : "";

        // 动画播放
        if (EffectConst.isAnimationValid(animation)) {
            let doAction = () => {
                cb && cb();
                this.skeleton.setAnimation(0, anim, false);
            }

            // 镜像翻转
            this.skeleton.node.scaleX = (animation.flipX ? -oringinalScale : oringinalScale);
            if(!animation.delay){
                doAction();
            }else{
                this.scheduleOnce(() => {
                    doAction();
                }, animation.delay);
            }
        }
    }

    playCardSkill (skillInfo: RoleSkillInfo, group: ANIMATION_GROUP, actorInfo?: SkillActorInfo) {
        if (!skillInfo) {
            return;
        }

        if (actorInfo) {
            const timeInfo = EffectConst.filterGroupTime(skillInfo, group);
            // 才算是有效的Timeinfo
            if (timeInfo.end > timeInfo.start && timeInfo.end > 0.01) {
                // 如果是施法者 需要将层级调为最高
                if(ANIMATION_GROUP.SOURCE == group) {
                    if(actorInfo.source) {
                        actorInfo.source.changeRoleZIndex(ROLE_Z_INDEX_TYPE.SOURCE_ATTACK);
                    }
                }
                if (actorInfo.onStart) {
                    if (timeInfo.start > 0) {
                        this.scheduleOnce(() => {
                            actorInfo.onStart(actorInfo.transData);
                        }, timeInfo.start);
                    } else {
                        actorInfo.onStart(actorInfo.transData);
                    }
                }
                if (actorInfo.onComplete) {
                    this.scheduleOnce(() => {
                        actorInfo.onComplete(actorInfo.transData);
                    }, timeInfo.end);
                }
                let originScale = Math.abs(this.skeleton.node.scale);
                this.scheduleOnce(() => {
                    //影子直接移除
                    if(this.node.getComponent(ItemRole).isShadow && cc.isValid(this.node,true)){
                        this.unscheduleAllCallbacks();
                        this.node.targetOff(this.node);
                        this.node.getComponent(ItemRole).deInit();
                        this.node.destroy();
                        return;
                    }
                    if (group == ANIMATION_GROUP.SOURCE) {
                        actorInfo.source.node.stopAllActions();
                        this.node.stopAllActions();
                        actorInfo.source.node.runAction(cc.moveTo(0.3, cc.v2(0, 0)));
                        this.skeleton.node.scaleX = 
                            actorInfo.source.roleType == ROLE_TYPE.MONSTER ? -originScale : originScale;
                        // 复位攻击方的zIndex
                        actorInfo.source.resetRoleZIndex();
                    }
                    if (group == ANIMATION_GROUP.TARGET || group == ANIMATION_GROUP.TARGET_RESIST) {
                        actorInfo.target.node.stopAllActions();
                        actorInfo.target.node.runAction(cc.moveTo(0.3, cc.v2(0, 0)));
                        this.skeleton.node.scaleX = 
                            actorInfo.target.roleType == ROLE_TYPE.MONSTER ? -originScale : originScale;
                    }
                }, timeInfo.end);
            }
        }

        // 自定义事件回调
        if (actorInfo && actorInfo.onSkillEvent && skillInfo.arrEvent) {
            // 回调各种时间函数
            skillInfo.arrEvent.forEach(eventInfo => {
                // @ts-ignore
                if (ANIMATION_GROUP[eventInfo.group] == group) {
                    this.scheduleOnce(() => {
                        actorInfo.onSkillEvent(eventInfo, actorInfo.transData);
                    }, eventInfo.time);
                }
            });
        }

        if (actorInfo && actorInfo.onSkeletonEvent) {
            this.skeleton.setEventListener((trackEntry: any, event: any) => {
                actorInfo.onSkeletonEvent(SKELETON_EVENT.ANIMATION, trackEntry, event);
            });
        } else {
            this.skeleton.setEventListener(null);
        }
        
        for (let i=0; i<skillInfo.effectList.length; ++i) {
            const info: EffectInfo = skillInfo.effectList[i];
            this.playEffect(info, skillInfo, group, actorInfo);
        }
        
        // 音效
        this._playSfx(skillInfo.sfxInfos);
        
        //技能全过程影子
        if(!skillInfo.shadows || skillInfo.shadows.length == 0 || (group & ANIMATION_GROUP.SOURCE) == 0 || this.node.getComponent(ItemRole).isShadow) return;
        this._playWholeShadowInfo( skillInfo.shadows, skillInfo, group, actorInfo);
       
    }

    playEffect(info: EffectInfo, skillInfo: RoleSkillInfo, group: ANIMATION_GROUP, actorInfo?: SkillActorInfo){
        if(!info) return;
        // 如果Group不匹配的话，直接返回
        if (info.tag && (info.tag & group) == 0) {
            return;
        }

        const filterIndex = store.filterIndex;
        let effectSeq = info.seq ? info.seq : 0;
        if(filterIndex > -1 && effectSeq != filterIndex) {
            return;
        }

        const animation = info.animation;
        const gfxInfo = info.gfxInfo;
        const moveInfo = info.roleMove;
        const bulletInfo = info.bulletInfo;
        // const shakeInfo = info.shakeInfo;
        const glowInfo = info.glowInfo;
        const sfxInfo = info.sfxInfo;
        const shadowInfo = info.shadowInfo;
        
        let animInfo = {...animation};
        actorInfo && actorInfo.checkAnimation && (animInfo.animation = actorInfo.checkAnimation(animation.animation || ''));
        let originScale = Math.abs(this.skeleton.node.scale);
        let animRole = group == ANIMATION_GROUP.SOURCE ? actorInfo.source : actorInfo.target;
        originScale = animRole.roleType == ROLE_TYPE.MONSTER ? -originScale : originScale;

        this._playRoleAnim(animInfo, originScale, () => {
            if(this.node.getComponent(ItemRole).isShadow) return;
            this._playPartShadowInfo(shadowInfo, info, skillInfo, group, actorInfo);
        });
        
        let itemRole = this.node.getComponent(ItemRole);
        if(!itemRole.isShadow || itemRole.isPlayGfx){
            this._playGfxInfo(gfxInfo, actorInfo, group);
            this._playBulletInfo(bulletInfo, actorInfo, group);
        }
    
        this._playRoleMovement(moveInfo, actorInfo, group);
        // shakeManager.shake(shakeInfo);
        // if (!cc.sys.isNative) {
        //     if (glowInfo && glowInfo.duration > 0.01) {
        //         const playGlowEffect = () => {
        //             let shader = this.skeleton.node.getComponent(ShaderSpineGlow);
        //             if (!shader) {
        //                 shader = this.skeleton.node.addComponent(ShaderSpineGlow);
        //                 shader.skeleton = this.skeleton;
        //             }
        //             shader.duration = glowInfo.duration;
        //             shader.play();
        //         }
        //         if (glowInfo.delay && glowInfo.delay > 0) {
        //             this.scheduleOnce(() => {
        //                 playGlowEffect();
        //             }, glowInfo.delay);
        //         } else {
        //             playGlowEffect();
        //         }
        //     }
        // }

        // if (sfxInfo && sfxInfo.url.length > 0) {
        //     if (sfxInfo.delay && sfxInfo.delay > 0) {
        //         this.scheduleOnce(() => {
        //             audioManager.play(sfxInfo.url);
        //         }, sfxInfo.delay);
        //     } else {
        //         audioManager.play(sfxInfo.url);
        //     }
        // }
    }

    private _playPartShadowInfo(shadowInfos: EffectShadowInfo[], effectInfo: EffectInfo,  playCardSkill: RoleSkillInfo, group: ANIMATION_GROUP, actorInfo?: SkillActorInfo){
        if(!shadowInfos || shadowInfos.length == 0 || !effectInfo) return;
        let effectInfo1 = EffectConst.getStandEffect(effectInfo);
        if(!effectInfo1) return;
        shadowInfos.forEach(ele => {
            this._clonePartShadow(ele, effectInfo1, playCardSkill, group, actorInfo);
        });
    }

    private _playWholeShadowInfo(shadowInfos: EffectShadowInfo[], playCardSkill: RoleSkillInfo, group: ANIMATION_GROUP, actorInfo?: SkillActorInfo){
        if(!shadowInfos || shadowInfos.length == 0 || !playCardSkill) return;
        shadowInfos.forEach(ele => {
            this._cloneWholeShadow(ele, playCardSkill, group, actorInfo);
        });
    }


     //部分技能动作的复刻
     private _clonePartShadow(shadowInfo: EffectShadowInfo, effectInfo: EffectInfo, playCardSkill: RoleSkillInfo, group: ANIMATION_GROUP, actorInfo?: SkillActorInfo){
        if(!shadowInfo || (shadowInfo.type && shadowInfo.type == ROLE_SHADOW_TYPE.WHOLE)) return;
        let actorInfoBackUp = {...actorInfo}; 
        let shadowNode = this._cloneOneRole(cc.color(shadowInfo.color, shadowInfo.color, shadowInfo.color, shadowInfo.opacity));
        shadowNode.getComponent(ItemRole).isPlayGfx = (typeof shadowInfo.isPlayGfx != 'undefined' && shadowInfo.isPlayGfx);
        actorInfoBackUp.source = shadowNode.getComponent(ItemRole);
        let delayTime = shadowInfo.delay || 0;
        delayTime = Math.max(delayTime, 0);

        let doAction = () => {
            shadowNode.getComponent(Actor).scheduleOnce(() => {
                shadowNode.getComponent(Actor).unscheduleAllCallbacks();
                shadowNode.targetOff(shadowNode);
                shadowNode.getComponent(ItemRole).deInit();
                shadowNode.destroy();
            }, effectInfo.maxTime);
            shadowNode.getComponent(Actor).playEffect(effectInfo, playCardSkill, group, actorInfoBackUp);
        }

        if(delayTime == 0){
            doAction();
            return;
        }
        shadowNode.getComponent(ItemRole).scheduleOnce(() => {
            doAction();
        }, delayTime);
    }

    //全套技能动作的复刻
    private _cloneWholeShadow(shadowInfo: EffectShadowInfo, playCardSkill: RoleSkillInfo, group: ANIMATION_GROUP, actorInfo?: SkillActorInfo){
        if(!shadowInfo || !shadowInfo.type || shadowInfo.type != ROLE_SHADOW_TYPE.WHOLE) return;
        let actorInfoBackUp = {...actorInfo}; 
        let shadowNode = this._cloneOneRole(cc.color(shadowInfo.color, shadowInfo.color, shadowInfo.color, shadowInfo.opacity));
        shadowNode.getComponent(ItemRole).isPlayGfx = (typeof shadowInfo.isPlayGfx != 'undefined' && shadowInfo.isPlayGfx);
        let delayTime = shadowInfo.delay || 0;
        delayTime = Math.max(delayTime, 0);
        actorInfoBackUp.source = shadowNode.getComponent(ItemRole);
        let doAction = () => {
            shadowNode.getComponent(Actor).playCardSkill(playCardSkill, group, actorInfoBackUp);
        }
        if(delayTime == 0){
            doAction();
            return;
        }
        shadowNode.getComponent(ItemRole).scheduleOnce(() => {
            doAction();
        }, delayTime);
    }

    //克隆一个分身
    private _cloneOneRole(color: cc.Color = cc.Color.WHITE){        
        let shadowNode = cc.instantiate(this.node);
        this.node.getComponent(ItemRole).addShadowNode(shadowNode);
        shadowNode.getComponent(ItemRole).setOptBtnVisible(false);
        shadowNode.getComponent(ItemRole).shadow = true;
        shadowNode.getComponent(ItemRole).setActorSpineColor(color);
        this.node.parent.insertChild(shadowNode, this.node.getSiblingIndex());
        return shadowNode;
    }

    private _playSfx(sfxInfo: EffectSfxInfo) {
        if(!sfxInfo || !sfxInfo.url || sfxInfo.url.length == 0) return;
        let audioPath = `sfx/skill/${sfxInfo.url}`;
        if(!sfxInfo.delay) {
            audioManager.play(audioPath, false, null, sfxInfo.start);
            return;
        }

        this.scheduleOnce(() => {
            audioManager.play(audioPath, false, null, sfxInfo.start);
        }, sfxInfo.delay);
    }
}