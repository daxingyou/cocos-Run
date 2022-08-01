import { configUtils } from "../../../app/ConfigUtils";
import { ANIM_TYPE } from "../../../common/animation/AnimationOnce";
import { logger } from "../../../common/log/Logger";
import { getItemEffectOption } from "../view-battle/EffectAnimationOption";
import ItemRole from "../view-item/ItemRole";
import skillDisplayManager from "./SkillDisplayManager";

interface EffectGlowInfo {
    delay?: number;
    duration: number;
}

interface EffectAnimationInfo {
    actor?: string;
    animation: string;
    delay?: number;
    flipX?: boolean;
}

interface KeyValue {
    [index: string]: number;
}

interface RoleInfo {
    name: string;
    timeOffset?: number;
    width?: number;
    height?: number;
}

/**
 * @desc 特效类型
 *
 * @enum {string}
 */
enum GFX_TYPE {
    SKELETON = 'skeleton',                  // spine骨骼动画
    COCOS_ANIMATION = 'cocos-animation',    // cocos做的动画帧 cc.Animation
    COCOS_PREFAB = 'cocos-prefab',          // cocos的Prefab（cocos的粒子、拖尾等，不需要控制和选择的，只需要挂接就行的）
}

/**
 * @desc 角色移动类型
 *
 * @enum {string}
 */
 enum ROLE_MOVE_TYPE {
     NONE = 'None-move',                     // 不需要移动
     DEFAULT = 'default-move',               // 默认目标角色前边
     RELATIVE = 'relative-pos',              // 相对于角色原点的位置
     ABSOLUTE = 'absolute-pos',              // 相对于屏幕中点的绝对位置
}


enum CUVE_TYPE {
    LINE = 'line',
    BEZIER = 'bezier',
}

enum EASE_TYPE {
    INSINE = 'insine',
    OUTSINE = 'outsine',
    INOUTSINE = 'inoutsize',
    NONE = "NONE",
}

//振屏振幅的衰减方式
const SHAKE_REDUCT_TYPE: any = {
  NONE: 0,
  LINE: 1,
  SIN: 2,
}

//角色影子类型
enum ROLE_SHADOW_TYPE{
  PART = 0,   //局部分身，执行角色部分的动作
  WHOLE       //全程分身，角色整套动作的完整复刻
}

/**
 * @desc 特效曲线参数信息
 * @param target 曲线起点的挂节点（虽然名字叫做target，但是是起点的相对挂节点信息，所以有点方）
 * @param offset 目标点的便宜（曲线的目标点的便宜）
 * @param cuve 曲线类型 CUVE_TYPE
 * @param duration 需要的时间
 * @param arrPoint 控制点信息（对于beziar来说，是两个点，对于LINE来说，不需要）
 * @param randomX 随机跳动值
 *
 * @interface GfxCuveInfo
 */
interface GfxCuveInfo {
    target: string;
    offset: cc.Vec3;
    cuve: CUVE_TYPE;
    duration: number;
    arrPoint: cc.Vec3[];
    ease: EASE_TYPE;
    randomX?: number;
    randomY?: number;
    source?: string;
}

interface EffectGfxInfo {
    joint?: string;
    skeleton: string;
    animation: string;
    delay?: number;
    scale?: number;
    offset?: cc.Vec3;
    offsetScope: cc.Vec3,
    skin?: string;
    type?: string;
    cuve?: GfxCuveInfo;
    randomAngle?: cc.Vec3;
    aoe?: string;
    behindJoint?: boolean;
    flipX?: boolean;
}

interface EffectBulletInfo {
    prefab: string,
    delay?: number,
    interval?: number,
    count?: number,
    duration: number,
    posSource: cc.Vec3,
    posTarget: cc.Vec3,

    cuve: CUVE_TYPE,
    ease: EASE_TYPE,
    randomX?: number,
    randomY?: number,

    arrPoint?: cc.Vec3[],
    randomAngle?: cc.Vec3,
    scale?: number
}

interface EffectMoveInfo {
    delay?: number,
    type?: string;
    time?: number;
    position?: cc.Vec3;
}

interface EffectShadowInfo{
  id: number,
  type?: ROLE_SHADOW_TYPE,
  color?: number,
  opacity?: number,
  delay?: number,
  isPlayGfx?: boolean
}

interface EffectSfxInfo {
    id: number;
    url?: string;
    delay?: number;
    start?: number
}

enum SKELETON_EVENT {
    ANIMATION = 'animation',
    GFX       = 'gfx',
}

enum SKILL_EVENT {
    HIT_TARGET      = 'hit-target',
    // GET_BUFF        = 'get-buff',
}

/**
 *@desc 敏感的目标类型。遇到指定类型的效果，才会触发TargetGroupAnimation
 * @param NONE 不限定。遇到的每一个有Item的ResultData效果，都会播放
 * @param ATTACK 攻击类型。只有遇到Block变化，或者HP变化的ResultData，才会播放
 * @param STATE 属性、BUFF变化，要触发这一类动画
 * @enum {number}
 */
enum TARGET_EFFECT {
    NONE            = 'none',
    ATTACK          = 'attack',
    STATE           = 'state',
    LOOP            = 'loop'
}

interface SkillEventInfo {
    type: SKILL_EVENT;
    time: number;
    group: string;
}

interface SkillEventHandler {
    (eventInfo: SkillEventInfo, transData?: any): void;
}

interface EffectInfo {
    id: number;
    tag: number;                        // ANIMATION_TAG
    animation?: EffectAnimationInfo;
    gfxInfo?: EffectGfxInfo;
    bulletInfo?: EffectBulletInfo;
    roleMove?: EffectMoveInfo;
    shadowInfo?: EffectShadowInfo[];
    glowInfo?: EffectGlowInfo;
    minTime?: number;
    maxTime?: number;
    sfxInfo?: EffectSfxInfo;
    seq?: number
}

interface AnimationGroupInfo {
    group: string;
    duration: number;
}

interface RoleSkillInfo {
    id: number;                             // 技能ID
    effectList: EffectInfo[];               // 技能的效果列表
    arrEvent?: SkillEventInfo[];            // 事件列表
    arrGroupInfo?: AnimationGroupInfo[];    // 分组时间
    targetEffect?: TARGET_EFFECT;           // 类型, attack/state
    shakes?: ShakeInfo[];                // 振屏
    shadows?: EffectShadowInfo[];           //全段分身
    sfxInfos?: EffectSfxInfo;               // 音效
    desc?: string;                          // 辅助描述
}

//振屏结构
interface ShakeInfo{
    id: number,
    times: number;          //次数
    duration: number;       //持续时间
    ori?: cc.Vec3,          //初始位置
    amplitude?: cc.Vec3;    //振幅
    delay?: number;         //开始时间
    reduct?: number;        //衰减方式
}

/**
 * @desc 在调用Actor的PlaySkill时传入的参数；这个只计算了Animation跟Gfx，并没有计算Glow跟Shake
 * @param transData 用来透传的；事件回调时，会把这个数据透传给各个回调
 * @param playDeathAnim 是否需要播放死亡动画
 * @param onStart 根据传入的Group，在第一个真正开始播放的动画/特效时调用，去掉了delay的
 * @param onComplete 整个Group播放完成后的回调，时间最久的那个
 * @param onSkeletonEvent 如果是有骨骼动画的播放，并且在骨骼动画中有自定义事件，就会通过这个回传出去；骨骼动画事件扩展使用
 *          onSkeletonEvent(skeletonEvent, trackEntry, event)
 *          skeletonEvent: SKELETON_EVENT
 *          trackEntry: TrackEntry spine.TrackEntry
 *          event: spine.Data {data: EventData, intValue, floatValue, stringValue, time, volume, balance}. EventData: {name: intValue, floatValue, stringValue, audioPath, volume, balance}
 * @param source 特效的挂节点属性，这个Effect的发起者（类型：ItemRole）
 * @param target 特效的挂节点属性，这个Effect的目标点（类型：ItemRole）
 * @param leftSide 是在屏幕的左边么？特效会根据这个属性，调整翻转面（配置的时候，统一都按照右边来配置，所以如果是左边的动效，就要翻转）
 * @param skillId 技能Id 或者 BuffId, haloId
 * @interface SkillActorInfo
 */
interface SkillActorInfo {
    transData?: any;
    playDeathAnim?: boolean;
    onStart?: Function;
    onComplete?: Function;
    onAnimationStart?: Function;
    onSkillEvent?: SkillEventHandler;
    onSkeletonEvent?: Function;
    source?: ItemRole;
    target?: ItemRole;
    leftSide?: boolean;
    skillId?: number;
}

interface SkillSaperateInfo {
    seq: number,
    total?: number[]
}

interface GroupTimeInfo {
    start: number;
    end: number;
}

/**
 * 扩展用做动作控制识别的标识
 *
 * @enum {number}
 */
enum ANIMATION_TAG {
    Source_anim             = 0x0001,
    Source_gfx              = 0x0002,
    Target_anim             = 0x0004,
    // TARGET_ANIMATION_BLOCK      = 0x0008,
    Target_gfx              = 0x008,
    Source_move             = 0x010,
    END                     = 0xFFFF,
}

enum ANIMATION_GROUP {
    SOURCE                  = ANIMATION_TAG.Source_anim | ANIMATION_TAG.Source_gfx | ANIMATION_TAG.Source_move,
    TARGET_RESIST           = ANIMATION_TAG.Target_gfx,
    TARGET                  = ANIMATION_TAG.Target_anim | ANIMATION_TAG.Target_gfx,
    // MOVE                    = ANIMATION_TAG.Source_move,
    ALL                     = ANIMATION_TAG.Source_anim | ANIMATION_TAG.Source_gfx | ANIMATION_TAG.Target_anim | ANIMATION_TAG.Target_gfx,
}

enum AOE_TYPE {
    NONE            = 'none',
    SOURCE          = 'aoe-source',
    TARGET          = 'aoe-target',
}

class EffectConst {
    public static ACTOR_HERO        = 'actor-hero';
    public static ACTOR_MONSTER     = 'actor-monster';

    public static ACTOR_SOURCE      = 'actor-source';
    public static ACTOR_TARGET      = 'actor-target';

    public static JOINT_SOURCE      = 'joint-source';
    public static JOINT_TARGET      = 'joint-target';
    public static JOINT_SOURCE_AOE  = 'joint-source-aoe';
    public static JOINT_TARGTET_AOE = 'joint-target-aoe';

    public static SHAKE_TRANSLATE   = 'shake-translate';
    public static SHAKE_SCALE       = 'shake-scale';
    public static SHAKE_ORI_HERO    = 'shake-ori-hero';
    public static SHAKE_ORI_MONSTER = 'shake-ori-monster';
    public static SHAKE_ORI_SCENE   = 'shake-ori-scene';

    public static isAnimationValid(anim: EffectAnimationInfo) : boolean {
        if (!anim) {
            return false;
        }

        if (!anim.animation || anim.animation.length < 2) {
            return false;
        }

        return true;
    }

    public static isCuveValid (cuve: GfxCuveInfo): boolean {
        if (!cuve) {
            return false;
        }

        if (!cuve.target) {
            return false;
        }

        if (cuve.duration <= 0) {
            return false;
        }

        return true;
    }

    public static isBulletValid(bullet: EffectBulletInfo) : boolean {
        if (!bullet) {
            return false;
        }

        if (!bullet.count || bullet.prefab.length < 2 || !bullet.duration) {
            return false;
        }

        return true;
    }

    public static isGfxValid(gfx: EffectGfxInfo) : boolean {
        if (!gfx) {
            return false;
        }

        if (!gfx.skeleton || gfx.skeleton.length < 2) {
            return false;
        }

        const type = gfx.type || GFX_TYPE.SKELETON;
        if (type == GFX_TYPE.SKELETON || type == GFX_TYPE.COCOS_ANIMATION) {
            if (!gfx.animation || gfx.animation.length < 2) {
                return false;
            }
        }

        return true;
    }

    public static isShakeValid(shake: ShakeInfo) : boolean {
        if (!shake) {
            return false;
        }

        if (shake.id === 0) {
            return false;
        }

        if (shake.duration < 0.1 || shake.times < 1) {
            return false;
        }

        let zero = cc.Vec2.ZERO;
        if (!shake.amplitude || zero.fuzzyEquals(cc.v2(shake.amplitude.x, shake.amplitude.y), 0.1)) {
            return false;
        }
        return true;
    }

    public static calculateTime(skillInfo: RoleSkillInfo, seq?: number): GroupTimeInfo {
        const ret = {
            start: 0,
            end: 0,
        };
        for (let i=0; i<skillInfo.effectList.length; ++i) {
            const info: EffectInfo = skillInfo.effectList[i];
            let infoSeq = info.seq? info.seq:0;
            let seqNeed = seq? seq:0;
            if (infoSeq != seqNeed) {
                continue;
            }

            ret.start = Math.min(ret.start, info.minTime || 0);
            ret.end = Math.max(ret.end, info.maxTime || 0);
        }
        return ret;
    }

    public static filterGroupTime (skillInfo: RoleSkillInfo, group: ANIMATION_GROUP, targetEffect: TARGET_EFFECT, seq?: number): GroupTimeInfo {
        const ret = {
            start: 0,
            end: 0,
        };

        for (let i=0; i<skillInfo.effectList.length; ++i) {
            const info: EffectInfo = skillInfo.effectList[i];
            // 如果Group不匹配的话，直接返回
            // TODO 如果是状态类型 也给他计时 因为存在施法动作 需要给受击者也等待
            if(skillInfo.targetEffect != targetEffect) {
                return ret;
            }
            if (info.tag && (info.tag & group) == 0) {
                continue;
            }

            let infoSeq = info.seq? info.seq:0;
            let seqNeed = seq? seq:0;
            if (infoSeq != seqNeed) {
                continue;
            }

            ret.start = Math.min(ret.start, info.minTime || 0);
            ret.end = Math.max(ret.end, info.maxTime || 0);
        }
        return ret;
    }

    public static filterGroupSeqTime(skillInfo: RoleSkillInfo, group: ANIMATION_GROUP, targetEffect: TARGET_EFFECT, seq?: number): GroupTimeInfo {
        const ret = {
            // TODO 如果是seq == 0 默认是从0开始的 应该不会有动作直接默认不从0开始吧 不会吧不会吧
            start: (seq ? seq : 0) > 0 ? 10 : 0,
            end: 0,
        };
        // 这里方法是直接计算本次seq的最小delay 然后算出本次seq的时间
        let tempSkillList = skillInfo.effectList;
        tempSkillList.sort((_a, _b) => {
            let aIndex = _a.seq ? _a.seq : 0;
            let bIndex = _b.seq ? _b.seq : 0;
            return aIndex - bIndex;
        });
        for (let i=0; i<tempSkillList.length; ++i) {
            const info: EffectInfo = tempSkillList[i];

            let infoSeq = info.seq? info.seq:0;
            let seqNeed = seq? seq:0;
          
            if(infoSeq > seqNeed) {
                if(infoSeq == seqNeed + 1) {
                    if(info.animation) {
                        ret.end = Math.min(ret.end, info.animation.delay || 0);
                    }
                    if(info.gfxInfo) {
                        ret.end = Math.min(ret.end, info.gfxInfo.delay || 0);
                    }
                    if(info.roleMove) {
                        ret.end = Math.min(ret.end, info.roleMove.delay || 0);
                    }
                } else {
                    continue;
                }
            } else if(infoSeq == seqNeed) {
                if(info.animation) {
                    ret.start = Math.min(ret.start, info.animation.delay || 0);
                }
                if(info.gfxInfo) {
                    ret.start = Math.min(ret.start, info.gfxInfo.delay || 0);
                }
                if(info.roleMove) {
                    ret.start = Math.min(ret.start, info.roleMove.delay || 0);
                }
                ret.end = Math.max(ret.end, info.maxTime || 0);
            }
        }
        // console.log('filterGroupSeqTime effectId:', skillInfo.id, " seq:", seq, ' time:', ret);
        return ret;
    }

    public static convertSkillWithRoleInfo (info: RoleSkillInfo, roleInfo: RoleInfo): RoleSkillInfo {
        if (!roleInfo) {
            return info;
        }

        const ret: RoleSkillInfo = {...info};

        roleInfo.timeOffset = roleInfo.timeOffset || 0;

        ret.effectList = [];
        info.effectList.forEach(v => {
            const eff = {...v};
            if (eff.tag == ANIMATION_TAG.Source_gfx || (eff.tag & ANIMATION_GROUP.TARGET)|| (eff.tag & ANIMATION_GROUP.TARGET_RESIST)) {
                eff.animation = v.animation ? {...v.animation} : null;
                if (eff.animation) {
                    eff.animation.delay = v.animation.delay || 0;
                    eff.animation.delay += roleInfo.timeOffset;
                    eff.animation.delay = Math.max(0, eff.animation.delay);
                }

                eff.gfxInfo = v.gfxInfo ? {...v.gfxInfo} : null;
                if (eff.gfxInfo) {
                    eff.gfxInfo.delay = v.gfxInfo.delay || 0;
                    eff.gfxInfo.delay += roleInfo.timeOffset;
                    eff.gfxInfo.delay = Math.max(0, eff.gfxInfo.delay);
                }

                eff.glowInfo = v.glowInfo ? {...v.glowInfo} : null;
                if (eff.glowInfo) {
                    eff.glowInfo.delay = v.glowInfo.delay || 0;
                    eff.glowInfo.delay += roleInfo.timeOffset;
                    eff.glowInfo.delay = Math.max(0, eff.glowInfo.delay);
                }

                eff.sfxInfo = v.sfxInfo ? {...v.sfxInfo} : null;
                if (eff.sfxInfo) {
                    eff.sfxInfo.delay = v.sfxInfo.delay || 0;
                    eff.sfxInfo.delay += roleInfo.timeOffset;
                    eff.sfxInfo.delay = Math.max(0, eff.sfxInfo.delay);
                }

                // eff.shakeInfo = v.shakeInfo ? {...v.shakeInfo} : null;
                // if (eff.shakeInfo) {
                //     eff.shakeInfo.delay = v.shakeInfo.delay || 0;
                //     eff.shakeInfo.delay += roleInfo.timeOffset;
                //     eff.shakeInfo.delay = Math.max(0, eff.shakeInfo.delay);
                // }

                eff.roleMove = v.roleMove ? {...v.roleMove} : null;
                if (eff.roleMove) {
                    eff.roleMove.delay = v.roleMove.delay || 0;
                    eff.roleMove.delay += roleInfo.timeOffset;
                    eff.roleMove.delay = Math.max(0, eff.roleMove.delay);
                }
            }
            ret.effectList.push(eff);
        })

        if (info.arrEvent) {
            ret.arrEvent = [];
            info.arrEvent.forEach(v => {
                const evt = {...v};
                // @ts-ignore
                if (ANIMATION_GROUP[v.group] === ANIMATION_GROUP.TARGET || ANIMATION_GROUP[v.group] === ANIMATION_GROUP.TARGET_RESIST) {
                    evt.time += roleInfo.timeOffset;
                    evt.time = Math.max(0, evt.time);
                }
                ret.arrEvent.push(evt);
            })
        }

        if (info.arrGroupInfo) {
            ret.arrGroupInfo = [];
            info.arrGroupInfo.forEach(v => {
                const gp = {...v};
                // @ts-ignore
                if (ANIMATION_GROUP[v.group] === ANIMATION_GROUP.TARGET || ANIMATION_GROUP[v.group] === ANIMATION_GROUP.TARGET_RESIST) {
                    // @ts-ignore
                    gp.duration = EffectConst.filterGroupTime(ret, ANIMATION_GROUP[v.group]);
                }
                ret.arrGroupInfo.push(gp);
            })
        }

        return ret;
    }

    public static gfxNameToPath (name: string, type = ANIM_TYPE.Skeleton): string {
        switch (type) {
            case ANIM_TYPE.Skeleton: return `spine/${name}/${name}`;
            case ANIM_TYPE.CocosAnimation: return `prefab/gfxAnimation/${name}`;
            case ANIM_TYPE.CocosPrefab: return `prefab/gfxPrefab/${name}`;
            default: return name;
        }
    }

    public static gfxPathToName (path: string, type = ANIM_TYPE.Skeleton): string {
        const arr = path.split('/');
        if (arr.length > 0) {
            return arr[arr.length - 1];
        }
        return path;
    }

    public static toGfxPath (nameOrPath: string, type = ANIM_TYPE.Skeleton): string {
        if (nameOrPath.indexOf('/') > 0) {
            return nameOrPath;
        }
        return EffectConst.gfxNameToPath(nameOrPath, type);
    }

    public static getSkillInfoMaxSeq(effectId: number, group: ANIMATION_GROUP): number {
        const skillInfo = skillDisplayManager.getSkill(effectId);
        if(skillInfo) {
            const skillList = skillInfo.effectList;
            let maxSeq: number = 0;
            for(let i = 0; i < skillList.length; ++i) {
                const skillInfo = skillList[i];
                if(skillInfo.tag && (skillInfo.tag & group) == 0) {
                    continue;
                }
                const infoSeq = skillInfo.seq ? skillInfo.seq : 0;
                maxSeq = Math.max(maxSeq, infoSeq);
            }
            return maxSeq;
        }
        return 0;
    }

    public static getSkillEffectId(skillId: number, section?: number) {
        let skillCfg = configUtils.getSkillConfig(skillId);
        let templateId: number = 0;
        if(skillCfg && skillCfg.TemplateID) {
            if(skillCfg.TemplateID.indexOf(';') > -1) {
                if(typeof section == 'undefined') {
                    logger.warn(`此技能是需要区间的 但是未传区间字段 skillID：${skillId}`);
                    return templateId;
                } else {
                    let templateList = skillCfg.TemplateID.split('|');
                    for(let i = 0; i < templateList.length; ++i) {
                        let temp = templateList[i].split(';');
                        let curSection = Number(temp[0]);
                        let curTemplateId = Number(temp[1]);
                        if(section > curSection) {
                            templateId = curTemplateId;
                        }
                    }
                }
            } else {
                templateId = Number(skillCfg.TemplateID);
            }
        }
        return templateId;
    }
};

export {
    RoleSkillInfo,
    EffectInfo,
    EffectGfxInfo,
    EffectAnimationInfo,
    EffectGlowInfo,
    EffectConst,
    ANIMATION_TAG,
    ANIMATION_GROUP,
    SkillActorInfo,
    SKELETON_EVENT,
    SkillEventInfo,
    EffectSfxInfo,
    SKILL_EVENT,
    GFX_TYPE,
    CUVE_TYPE,
    EASE_TYPE,
    GfxCuveInfo,
    AnimationGroupInfo,
    AOE_TYPE,
    RoleInfo,
    TARGET_EFFECT,
    ROLE_MOVE_TYPE,
    EffectMoveInfo,
    SkillSaperateInfo,
    EffectBulletInfo,
    SHAKE_REDUCT_TYPE,
    ShakeInfo,
    ROLE_SHADOW_TYPE,
    EffectShadowInfo
}
