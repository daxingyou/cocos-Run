import { utils } from "../../../app/AppUtils";
import { BATTLE_POS, ROLE_TYPE } from "../../../app/BattleConst";
import { battleUtils } from "../../../app/BattleUtils";
import { resPathUtils } from "../../../app/ResPathUrlUtils";
import { ANIM_TYPE } from "../../../common/animation/AnimationOnce";
import CreatorAnimationOnce from "../../../common/animation/CreatorAnimationOnce";
import CreatorPrefabOnce from "../../../common/animation/CreatorPrefabOnce";
import { CuveAnimationInfo } from "../../../common/animation/CuveAnimation";
import SkeletonAnimationOnce from "../../../common/animation/SkeletonAnimationOnce";
import { audioManager } from "../../../common/AudioManager";
import { logger } from "../../../common/log/Logger";
import {scheduleManager} from "../../../common/ScheduleManager";
import skeletonManager from "../../../common/SkeletonManager";
import ItemRole, { BASE_ANIM } from "../view-item/ItemRole";
import ItemRoleAction from "../view-item/ItemRoleAction";
import { ANIMATION_GROUP, AOE_TYPE, CUVE_TYPE, EffectAnimationInfo, EffectBulletInfo, EffectConst, EffectGfxInfo, EffectInfo, EffectMoveInfo, EffectSfxInfo, EffectShadowInfo, GFX_TYPE, RoleSkillInfo, ROLE_MOVE_TYPE, ROLE_SHADOW_TYPE, SKELETON_EVENT, SkillActorInfo, SkillSaperateInfo, TARGET_EFFECT } from "./SkillUtils";

const {ccclass, property} = cc._decorator;
@ccclass
export default class Actor extends cc.Component{
    @property(sp.Skeleton)  skeleton: sp.Skeleton = null;

    private _scheduleId: number = -1;
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
        this._turnToIdle();
    }

    deInit(){
        this.unscheduleAllCallbacks();
        scheduleManager.unschedule(this._scheduleId);
        this._scheduleId = -1;
        this.skeleton && this.skeleton.clearTracks();
    }

    private _turnToIdle () {
        let item = this.node.getComponent(ItemRole);
        item && item.changeIdle()
    }

    /**
     * @desc 整个角色的动画状态也都不多，就不再用状态来驱动了
     * @param trackEntry
     */
    private _onAnimationComplete (trackEntry: any) {
        this._turnToIdle();
    }

    start () {
        let item = this.node.getComponent(ItemRole);
        item && item.initIdle()
    }

    private _lerpVec3 (start: cc.Vec3, end: cc.Vec3, ds: cc.Vec3): cc.Vec3 {
        const delt = end.sub(start);
        const xv = delt.x < 0 ? -1 : 1;
        const yv = delt.y < 0 ? -1 : 1;
        return start.add(cc.v3(ds.x * xv, ds.y * yv));
    }

    private _playGfxInfoLoop (keyId: number, gfxInfo: EffectGfxInfo, actorInfo: SkillActorInfo, isAnimationValid: boolean, group: ANIMATION_GROUP) {
        if (!EffectConst.isGfxValid(gfxInfo) || !actorInfo) {
            return;
        }

        let owner = actorInfo.target
        if (!owner) {
            return;
        }

        // // 这里留着source和target主要是以后方便扩展
        // let nodeJoint: cc.Node = owner.getSkillGfxNode(gfxInfo.behindJoint);
        // if (!nodeJoint) {
        //     nodeJoint = actorInfo.source.getSkillGfxNode(gfxInfo.behindJoint);
        // }

        // if (!nodeJoint) {
        //     logger.warn('Actor', `Can not find Joint for Gfx loop. path = ${gfxInfo.skeleton}`);
        //     return;
        // }
        let isTop: boolean = gfxInfo.behindJoint ? false : true;
        let nodeJoint = owner.getLoopGfxNode(isTop)
        if (gfxInfo.aoe) {
            if (gfxInfo.aoe == AOE_TYPE.SOURCE) {
                nodeJoint = actorInfo.source && actorInfo.source.getAoeNode(isTop);
            } else if (gfxInfo.aoe == AOE_TYPE.TARGET) {
                nodeJoint = actorInfo.target && actorInfo.target.getAoeNode(isTop);
            }
        }

        // 同步下当前播放的effectId
        if(isAnimationValid) {
            // 以后做变身可能需要用到，暂时都是特效没有动作
            // owner.setCurLoopAmin(keyId);
        }

        if(owner.checkNeedCreateGfx(keyId, isAnimationValid)) {
            if (!gfxInfo.type || gfxInfo.type == GFX_TYPE.SKELETON) {
                let skeNode = skeletonManager.loadSkeleton(gfxInfo.skeleton);
                skeNode.then( (skeleton) => {
                    nodeJoint.addChild(skeleton.node);
                    let pos: cc.Vec3 = gfxInfo.offset ? cc.v3(gfxInfo.offset) : cc.v3();
                    if(gfxInfo.offsetScope){
                        let offsetScope = cc.v3(gfxInfo.offsetScope);
                        offsetScope.x *= Math.random();
                        offsetScope.y *= Math.random();
                        pos.add(offsetScope, pos);
                    }
                    let scale = gfxInfo.scale
                    const flipX = actorInfo.leftSide ? (group == ANIMATION_GROUP.SOURCE ? false : true) : (group == ANIMATION_GROUP.TARGET ? false : true);

                    if (scale) {
                        skeleton.node.scaleY = scale;
                        skeleton.node.scaleX = scale;
                    }
                    if (flipX) {
                        skeleton.node.scaleX = -skeleton.node.scaleX;
                        pos.x = -pos.x
                    }

                    skeleton.node.position = pos;
                    if (gfxInfo.skin && gfxInfo.skin.length > 1) {
                        skeleton.defaultSkin = gfxInfo.skin;
                    }
                    skeleton.setAnimation(0, gfxInfo.animation, true);
                    owner.catchLoopSpine(keyId, {path: gfxInfo.skeleton, skeleton: skeleton});
                })
            }
        } else {
            owner.showBuffLoopGfx(keyId, true);
        }
    }

    private _playGfxInfo (gfxInfo: EffectGfxInfo, actorInfo: SkillActorInfo, group: ANIMATION_GROUP, isLoop: boolean, isAnimationValid: boolean, minStartTime: number) {
        if (!EffectConst.isGfxValid(gfxInfo) || !actorInfo) {
            return;
        }

        if(isLoop) {
            this._playGfxInfoLoop(actorInfo.skillId, gfxInfo, actorInfo, isAnimationValid, group);
            return;
        }

        let nodeJoint: cc.Node = actorInfo.target && actorInfo.target.getSkillGfxNode(gfxInfo.behindJoint);
        if (group === ANIMATION_GROUP.SOURCE) {
            nodeJoint = actorInfo.source && actorInfo.source.getSkillGfxNode(gfxInfo.behindJoint);
        }

        if (gfxInfo.aoe) {
            let isTop: boolean = gfxInfo.behindJoint ? false : true;
            if (gfxInfo.aoe == AOE_TYPE.SOURCE) {
                nodeJoint = actorInfo.source && actorInfo.source.getAoeNode(isTop);
            } else if (gfxInfo.aoe == AOE_TYPE.TARGET) {
                nodeJoint = actorInfo.target && actorInfo.target.getAoeNode(isTop);
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

        let offset: cc.Vec3 = cc.v3();
        // aoeNodeOffset && offset.add(aoeNodeOffset, offset);
        offset.add(gfxInfo.offset, offset);
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
            if(!nodeJoint) {
                return;
            }
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

        const flipX = actorInfo.leftSide ? (group == ANIMATION_GROUP.SOURCE ? false : true) : (group == ANIMATION_GROUP.TARGET ? false : true);
        // const flipX = actorInfo.leftSide ? false : true;
        // const flipX = gfxInfo.flipX;
        let gfxDelay: number = (gfxInfo.delay ? gfxInfo.delay : 0) - minStartTime;
        if (!gfxInfo.type || gfxInfo.type == GFX_TYPE.SKELETON) {
            let skeletonPlayer: SkeletonAnimationOnce = new SkeletonAnimationOnce(ANIM_TYPE.Skeleton, {
                path: EffectConst.toGfxPath(gfxInfo.skeleton),
                node: nodeJoint,
                animation: gfxInfo.animation,
                skin: gfxInfo.skin,
                delay: gfxDelay,
                offset: offset,
                scale: gfxInfo.scale,
                scheduleHelper: scheduleManager,
                eventHandler: gfxEventHandler,
                cuveInfo: cuveInfo,
                angle: angle,
                flipX: flipX ? !gfxInfo.flipX : gfxInfo.flipX,
                // flipX: flipX,
            });
            skeletonPlayer.play();
        } else if(gfxInfo.type == GFX_TYPE.COCOS_ANIMATION) {
            let skeletonPlayer: CreatorAnimationOnce = new CreatorAnimationOnce(ANIM_TYPE.CocosAnimation, {
                path: EffectConst.toGfxPath(gfxInfo.skeleton, ANIM_TYPE.CocosAnimation),
                node: nodeJoint,
                animation: gfxInfo.animation,
                skin: gfxInfo.skin,
                delay: gfxDelay,
                offset: offset,
                scale: gfxInfo.scale,
                scheduleHelper: scheduleManager,
                eventHandler: gfxEventHandler,
                cuveInfo: cuveInfo,
                angle: angle,
                flipX: flipX ? !gfxInfo.flipX : gfxInfo.flipX,
                // flipX: flipX,
            });
            skeletonPlayer.play();
        } else if (gfxInfo.type == GFX_TYPE.COCOS_PREFAB) {
            let skeletonPlayer: CreatorPrefabOnce = new CreatorPrefabOnce(ANIM_TYPE.CocosPrefab, {
                path: EffectConst.toGfxPath(gfxInfo.skeleton, ANIM_TYPE.CocosPrefab),
                node: nodeJoint,
                animation: gfxInfo.animation,
                skin: gfxInfo.skin,
                delay: gfxDelay,
                offset: offset,
                scale: gfxInfo.scale,
                scheduleHelper: this,
                eventHandler: gfxEventHandler,
                cuveInfo: cuveInfo,
                angle: angle,
                flipX: flipX ? !gfxInfo.flipX : gfxInfo.flipX,
                // flipX: flipX,
            });
            skeletonPlayer.play();
        }
    }

    private _playBulletInfo (bullet: EffectBulletInfo, actorInfo: SkillActorInfo, group: ANIMATION_GROUP, minStartTime: number) {
        if (!EffectConst.isBulletValid(bullet) || !actorInfo) {
            return;
        }

        // 炸弹弹道得有目标和发起者啊，不然谁发射，射谁啊？
        if (!actorInfo.target || !actorInfo.source) {
            return;
        }

        // 找到target
        let nodeTarget: cc.Node = actorInfo.target.getSkillGfxNode(false);
        // 挂在谁那里
        let nodeJoint: cc.Node = actorInfo.source.getSkillGfxNode(false);

        let gfxEventHandler: Function = null;
        if (actorInfo && actorInfo.onSkeletonEvent) {
            gfxEventHandler = (trackEntry: any, event: any) => {
                actorInfo.onSkeletonEvent(SKELETON_EVENT.GFX, trackEntry, event);
            }
        }

        let offsetS = cc.v3(bullet.posSource.clone());
        let offsetT = cc.v3(bullet.posTarget.clone());
        let cuveInfo: CuveAnimationInfo = null;

        if(!nodeJoint) {
            return;
        }
        let arrPoint: cc.Vec3[] = [];
        // 这里要把nodeTarget 和 nodeJoint 以及 offset 给转换一下子才行的，不然层次不对；要挂在 stage 上边
        const cuveStart = offsetS.clone();
        // 放在角色上会更准确，但是层级会有问题
        // const realJoint = nodeJoint.parent.parent;
        const realJoint = nodeJoint.parent;
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

        const flipX = actorInfo.leftSide ? true : false;
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

    // 根据技能编辑器里面的移动效果去移动
    private _playRoleMovement(moveInfo: EffectMoveInfo, actorInfo: SkillActorInfo, group: ANIMATION_GROUP, minStartTime: number) {
        if (!moveInfo || !actorInfo) {
            return;
        }

        let finnalPos = cc.v2(moveInfo.position.clone());
        let posType = moveInfo.type ? moveInfo.type : ROLE_MOVE_TYPE.NONE;
        if (posType == ROLE_MOVE_TYPE.NONE) {
            return;
        }
        let delay = (moveInfo.delay ? moveInfo.delay : 0) - minStartTime;
        let time = (moveInfo.time ? moveInfo.time : 0);

        let itemRole = group == ANIMATION_GROUP.SOURCE ? actorInfo.source : actorInfo.target;
        let targetRole = group == ANIMATION_GROUP.SOURCE ? actorInfo.target : actorInfo.source;
        // let itemRole = actorInfo.source;
        // let targetRole = actorInfo.target;
        let moveFlip = actorInfo.leftSide ? 1 : -1;
        let ROLE_FORMAT_GAP = actorInfo.leftSide ? -150 : 150;

        // let startZIndex = (itemRole.node.parent && itemRole.node.parent.zIndex) || 0;
        battleUtils.updateMoveDefaultZIndex(itemRole);
        if (posType == ROLE_MOVE_TYPE.DEFAULT) {
            let targetWorldPos = targetRole.node.convertToWorldSpaceAR(cc.v2(ROLE_FORMAT_GAP, 0));
            finnalPos = itemRole.node.parent.convertToNodeSpaceAR(targetWorldPos);
            finnalPos.x += moveInfo.position.x * moveFlip;
            finnalPos.y += moveInfo.position.y;

            if (finnalPos.x > 600) finnalPos.x = 600
            if (finnalPos.x < -600) finnalPos.x = -600
        } else if (posType == ROLE_MOVE_TYPE.RELATIVE) {
            // 因为相对位置移动 不能用moveTo  都没有标记取到当前动作的目标 然后取它位置 只能用moveBy
            // 但同时，他移动的时候起始位置不一定在原位，技能编辑器里面的(x, y)其实是（Δx,Δy）所以要先转化
            finnalPos = cc.v2(moveInfo.position.x * moveFlip, moveInfo.position.y);
            itemRole.role.ePos.type = BATTLE_POS.TARGET;
            let currPos = itemRole.node.position;
            let deltaPos = finnalPos
            if (finnalPos.x) {deltaPos.x -= currPos.x;}
            if (finnalPos.y) {deltaPos.y -= currPos.y;}

            if (!delay) {
                itemRole.node.stopAllActions();
                itemRole.node.runAction(cc.moveBy(time, finnalPos));
                return;
            }
            this.scheduleOnce(() => {
                itemRole.node.stopAllActions();
                itemRole.node.runAction(cc.moveBy(time, finnalPos));
            }, delay);
            return;
        } else {
            // posType == ROLE_MOVE_TYPE.ABSOLUTE
            let realWroldX = cc.winSize.width / 2 + (moveInfo.position.x * moveFlip);
            let realWroldY = cc.winSize.height / 2 + moveInfo.position.y;
            finnalPos = itemRole.node.parent.convertToNodeSpaceAR(cc.v2(realWroldX, realWroldY));
        }
        // TODO 加这个是为了让有移动动作的标记下 统一由回合结束时 自动moveback 技能配置里统一不配置移动回去的动作
        itemRole.role.ePos.type = BATTLE_POS.TARGET;
        if (!delay) {
            // 只有对目标移动才有层级变化问题
            if (posType == ROLE_MOVE_TYPE.DEFAULT) {
                this._scheduleId = scheduleManager.scheduleOnce(() => {
                    this._scheduleId = -1;
                    if(itemRole.node) {
                        battleUtils.updateMoveZIndex(itemRole, targetRole, group);
                    }
                }, time / 5 * 4);
            }
            itemRole.node.stopAllActions();
            itemRole.node.runAction(cc.moveTo(time, finnalPos))
            return;
        }

        this.scheduleOnce(() => {
            if (posType == ROLE_MOVE_TYPE.DEFAULT) {
                this._scheduleId = scheduleManager.scheduleOnce(() => {
                    this._scheduleId = -1;
                    if(itemRole.node) {
                        battleUtils.updateMoveZIndex(itemRole, targetRole, group);
                    }
                }, time / 5 * 4);
            }
            itemRole.node.stopAllActions();
            itemRole.node.runAction(cc.moveTo(time, finnalPos));
        }, delay);
    }

    private _playRoleAnim (animation: EffectAnimationInfo, minStartTime: number, isLoop: boolean, cb: Function){
        let anim = animation ? animation.animation : "";
        // 动画播放
        if (EffectConst.isAnimationValid(animation)) {
            let originScaleX = this.skeleton.node.scaleX;
            const flipX = animation.flipX || false;

            let doAction = () => {
                if((!isLoop || anim != this.skeleton.animation) && this.skeleton.node){
                    this.skeleton.setAnimation(0, anim, isLoop);
                }
            };

            // 镜像翻转
            this.skeleton.node && (this.skeleton.node.scaleX = (flipX ? -originScaleX : originScaleX));
            if (animation.delay && animation.delay > minStartTime) {
                this.scheduleOnce(() => {
                    doAction();
                }, animation.delay - minStartTime);
            } else {
                doAction();
            }
            cb && cb();
        }
    }

    playSkill (skillInfo: RoleSkillInfo, group: ANIMATION_GROUP, actorInfo?: SkillActorInfo, saperate?: SkillSaperateInfo, endCb?: Function): number {
        if (!skillInfo || !this.skeleton) {
            return 0;
        }

        let seq = saperate && saperate.seq? saperate.seq:0;
        // 修改 兼容没有配置seq 》 1 的 而发来这个了 就需要重播 seq == 0的
        if(seq > 0) {
            let find = skillInfo.effectList.find(_effect => {
                let effectSeq = _effect.seq ? _effect.seq : 0;
                return effectSeq == seq;
            });
            if(!find) {
                seq = 0;
            }
        }
        const timeInfo = EffectConst.filterGroupSeqTime(skillInfo, group, skillInfo.targetEffect, seq);
        if (actorInfo) {
            // 才算是有效的Timeinfo
            if (timeInfo.end > timeInfo.start && timeInfo.end > 0.01) {
                if (actorInfo.onStart) {
                    if (timeInfo.start > 0) {
                        this.scheduleOnce(() => {
                            actorInfo.onStart(actorInfo.transData);
                        }, 0);
                    } else {
                        actorInfo.onStart(actorInfo.transData);
                    }
                }
                if (actorInfo.onComplete) {
                    this.scheduleOnce(() => {
                        actorInfo.onComplete(actorInfo.transData);
                    }, timeInfo.end - timeInfo.start);
                }
                this.scheduleOnce(() => {
                    let originScaleX = Math.abs(this.skeleton.node.scaleX);
                    // TODO 如果是攻击方 就不给他一个反转了 防止行动没结束 就回去了 现在统一到roundEnd的时候 统一回去
                    // if (group == ANIMATION_GROUP.SOURCE) {
                    //     // actorInfo.source.node.stopAllActions();
                    //     // actorInfo.source.node.runAction(cc.moveTo(0.3, cc.v2(0, 0)));
                    //     this.skeleton.node.scaleX =
                    //         actorInfo.source.role.roleType == ROLE_TYPE.MONSTER ? -originScaleX : originScaleX;
                    // }
                    if (group == ANIMATION_GROUP.TARGET || group == ANIMATION_GROUP.TARGET_RESIST) {
                        // actorInfo.target.node.stopAllActions();
                        // actorInfo.target.node.runAction(cc.moveTo(0.3, cc.v2(0, 0)));
                        if(this.skeleton.node) {
                            this.skeleton.node.scaleX =
                                actorInfo.target.role.roleType == ROLE_TYPE.MONSTER ? -originScaleX : originScaleX;
                        }
                    }
                    endCb && endCb();
                }, timeInfo.end - timeInfo.start);
            } else {
                endCb && endCb();
            }
        }

        const minStartTime: number = timeInfo.start;
        // 自定义事件回调
        if (actorInfo && actorInfo.onSkillEvent && skillInfo.arrEvent) {
            // 回调各种时间函数
            skillInfo.arrEvent.forEach( (eventInfo, idx) => {
                // @ts-ignore
                if (((ANIMATION_GROUP[eventInfo.group] & group) != 0) && seq == idx) {
                    let fireTime: number = eventInfo.time;
                    // if(idx > 0) {
                    //     // 计算间隔时间 不是从头开始
                    //     // fireTime -= skillInfo.arrEvent[idx - 1].time || 0 - minStartTime;
                    //     fireTime = 0;
                    // } else {
                        fireTime -= minStartTime;
                    // }
                    this.scheduleOnce(() => {
                        let _e = utils.deepCopy(eventInfo);
                        _e.type = eventInfo.type + seq.toString();
                        actorInfo.onSkillEvent(_e, actorInfo.transData);
                    }, fireTime);
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

        let isLoop: boolean = TARGET_EFFECT.LOOP == skillInfo.targetEffect;
        let tmpCache: any = {
            isAnimationValid: false,
            minStartTime: minStartTime,
            isLoop: isLoop
        }
        let maxTime: number = 0;
        for (let i = 0; i<skillInfo.effectList.length; ++i) {
            const info: EffectInfo = skillInfo.effectList[i];
            maxTime = Math.max(maxTime, info.maxTime);
            if(!this.playEffect(info, skillInfo, group, seq, tmpCache, actorInfo)) continue;
            this.node.getComponent(ItemRole).allShadowExec((ele: ItemRole) => {
                ele.node.getComponent(Actor)._realPlayWholeShadow(ele, ele.shadowCfg.delay || 0, skillInfo, group, saperate, actorInfo);
            });
        }

        //技能全过程影子
        if(seq == 0 && skillInfo.shadows && skillInfo.shadows.length != 0 && (group & ANIMATION_GROUP.SOURCE) > 0 && !this.node.getComponent(ItemRole).isShadow){
            this._playWholeShadowInfo( skillInfo.shadows, skillInfo, group, saperate, actorInfo);
        }

        //技能音效
        if(skillInfo.sfxInfos && skillInfo.sfxInfos.url && skillInfo.sfxInfos.url.length > 0 && !this.node.getComponent(ItemRole).isShadow) {
            this._playSkillSfxEffect(skillInfo.sfxInfos);
        }

        return maxTime;
    }

    playEffect(info: EffectInfo, skillInfo: RoleSkillInfo, group: ANIMATION_GROUP, seq: number, cacheInfo: any, actorInfo?: SkillActorInfo): boolean{
        if(!info) return false;

        // 如果Group不匹配的话，直接返回, 如果是循环buff，就不需要区分（暂时）
        if ((info.tag && (info.tag & group) == 0) && !cacheInfo.isLoop) {
            return false;
        }
        // 如果seq不匹配就返回
        let infoSeq = info.seq? info.seq:0;
        if (infoSeq != seq) {
            return false;
        }

        const animation = info.animation;
        const gfxInfo = info.gfxInfo;
        const moveInfo = info.roleMove;
        const bulletInfo = info.bulletInfo;
        //const shakeInfo = info.shakeInfo;
        const glowInfo = info.glowInfo;
        const sfxInfo = info.sfxInfo;
        const shadowInfo = info.shadowInfo;

        let animBackup = {...animation};
        actorInfo && actorInfo.playDeathAnim && (animBackup.animation = "Die");
        this._playRoleAnim(
            animBackup, 
            cacheInfo.minStartTime, 
            cacheInfo.isLoop, 
            () => {
                cacheInfo.isAnimationValid = true;
                if(this.node.getComponent(ItemRole).isShadow) return;
                this._playPartShadowInfo(shadowInfo, info, skillInfo, group, seq, cacheInfo, actorInfo);
            });

        let itemRole = this.node.getComponent(ItemRole);
        if (cacheInfo.isLoop && itemRole && animation) {
            let keyid = actorInfo? actorInfo.skillId:0
            itemRole.resetIdleState(keyid, animation.animation);
        }

        //影子可能不播放特效
        if(!itemRole.isShadow || itemRole.isPlayGfx){
            this._playGfxInfo(gfxInfo, actorInfo, group, cacheInfo.isLoop, cacheInfo.isAnimationValid, cacheInfo.minStartTime);
            this._playBulletInfo(bulletInfo, actorInfo, group, cacheInfo.minStartTime);
        }

        this._playRoleMovement(moveInfo, actorInfo, group, cacheInfo.minStartTime);
        return true;
    }

    private _playWholeShadowInfo(shadowInfos: EffectShadowInfo[], playCardSkill: RoleSkillInfo, group: ANIMATION_GROUP, saperate?: SkillSaperateInfo, actorInfo?: SkillActorInfo){
        if(!shadowInfos || shadowInfos.length == 0 || !playCardSkill) return;
        shadowInfos.forEach(ele => {
            this._cloneWholeShadow(ele, playCardSkill, group, saperate, actorInfo);
        });
    }

    //全套技能动作的复刻
    private _cloneWholeShadow(shadowInfo: EffectShadowInfo, playCardSkill: RoleSkillInfo, group: ANIMATION_GROUP, saperate?: SkillSaperateInfo, actorInfo?: SkillActorInfo){
        if(!shadowInfo || !shadowInfo.type || shadowInfo.type != ROLE_SHADOW_TYPE.WHOLE) return;
        let isplayGfx = (typeof shadowInfo.isPlayGfx != 'undefined' && !!shadowInfo.isPlayGfx);
        let shadowRole = this.node.getComponent(ItemRole).cloneOneShadow(isplayGfx, cc.color(shadowInfo.color, shadowInfo.color, shadowInfo.color, shadowInfo.opacity));
        shadowRole.shadowCfg = shadowInfo;
        this.node.getComponent(ItemRole).addShadow(shadowRole);
        if(!cc.isValid(shadowRole)) return;
        this._realPlayWholeShadow(shadowRole, shadowInfo.delay || 0, playCardSkill, group, saperate, actorInfo)
    }

    private _realPlayWholeShadow(shadowRole: ItemRole, delay: number, playCardSkill: RoleSkillInfo, group: ANIMATION_GROUP, saperate?: SkillSaperateInfo, actorInfo?: SkillActorInfo){
        if(!cc.isValid(shadowRole)) return;
        let delayTime = delay || 0;
        delayTime = Math.max(delayTime, 0);
        let actorInfoBackUp = {...actorInfo};
        actorInfoBackUp.source = shadowRole;
        let saperateBackup = {...saperate};
        let doAction = () => {
            shadowRole.node.getComponent(Actor).playSkill(playCardSkill, group, actorInfoBackUp, saperateBackup);
        }

        if(delayTime == 0){
            doAction();
            return;
        }
        shadowRole.scheduleOnce(() => {
            doAction();
        }, delayTime);
    }

    private _playPartShadowInfo(shadowInfos: EffectShadowInfo[], effectInfo: EffectInfo,  playCardSkill: RoleSkillInfo, group: ANIMATION_GROUP, seq: number, cacheInfo: any, actorInfo?: SkillActorInfo){
        if(!shadowInfos || shadowInfos.length == 0 || !effectInfo) return;
        shadowInfos.forEach(ele => {
            this._clonePartShadow(ele, effectInfo, playCardSkill, group, seq, cacheInfo, actorInfo);
        });
    }

    //部分技能动作的复刻
    private _clonePartShadow(shadowInfo: EffectShadowInfo, effectInfo: EffectInfo, playCardSkill: RoleSkillInfo, group: ANIMATION_GROUP, seq: number, cacheInfo: any, actorInfo?: SkillActorInfo){
        if(!shadowInfo || (shadowInfo.type && shadowInfo.type == ROLE_SHADOW_TYPE.WHOLE)) return;
        let actorInfoBackUp = {...actorInfo};
        let isplayGfx = (typeof shadowInfo.isPlayGfx != 'undefined' && !!shadowInfo.isPlayGfx);
        let shadowItemRole = this.node.getComponent(ItemRole).cloneOneShadow(isplayGfx, cc.color(shadowInfo.color, shadowInfo.color, shadowInfo.color, shadowInfo.opacity));
        actorInfoBackUp.source = shadowItemRole;
        let delayTime = shadowInfo.delay || 0;
        delayTime = Math.max(delayTime, 0);

        let doAction = () => {
          shadowItemRole.node.getComponent(Actor).scheduleOnce(() => {
                shadowItemRole.node.getComponent(Actor).unscheduleAllCallbacks();
                shadowItemRole.node.targetOff(shadowItemRole.node);
                shadowItemRole.deInit();
                shadowItemRole.node.getComponent(ItemRoleAction).deInit();
                shadowItemRole.node.destroy();
            }, effectInfo.maxTime - cacheInfo.minStartTime);
            shadowItemRole.node.getComponent(Actor).playEffect(effectInfo, playCardSkill, group, seq, cacheInfo, actorInfoBackUp);
        }

        if(delayTime == 0){
            doAction();
            return;
        }
        shadowItemRole.scheduleOnce(() => {
            doAction();
        }, delayTime);
    }

    // 播放技能音效
    private _playSkillSfxEffect(sfxInfos: EffectSfxInfo) {
          if(!sfxInfos || !sfxInfos.url || sfxInfos.url.length == 0) return;
          audioManager.play(resPathUtils.getSkillSfxPathByID(sfxInfos.url), false, null, sfxInfos.start);
    }
}
