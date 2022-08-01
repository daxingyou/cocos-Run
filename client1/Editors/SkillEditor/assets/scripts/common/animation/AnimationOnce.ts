import { logger } from "../log/Logger";
import { CuveAnimationInfo } from "./CuveAnimation";

/**
 * @desc 动画播放类型枚举
 *  Skeleton: spine骨骼动画
 *  CocosAnimation: creator的Animation动画，常见以Prefab提供
 *  CocosPrefab: 跟上边的区别在于。这个是没有动画的，最常见就是一个Prefab，可以按照Cuve提供的路径进行移动，回调动画以Cuve为准（常见拖尾）
 *
 * @enum {number}
 */
enum ANIM_TYPE {
    Skeleton            = 'skeleton',
    CocosAnimation      = 'cocos',
    CocosPrefab         = 'prefab',
}

interface AnimationOnceInfo {
    path: string;                   // 文件名 （sekelton：目录。cocos：prefab）
    node: cc.Node;                  // 动画挂节点
    animation: string;              // 动画名称
    delay?: number;                 // 延时播放；delay一般跟schedule要联合起来使用。
    offset?: cc.Vec3;               // 挂节点偏移量
    scale?: number;                 // 缩放大小
    skin?: string;                  // 皮肤
    color?: cc.Color;               // 颜色
    scheduleHelper?: any;           // 用来做schedule刷新用的
    eventHandler?: Function;        // 动画中的事件回调！！（这个参数，仅仅在Spine动画中生效）
    onStart?: Function;             // 加载成功开始播放（在creatorPrefab模式中，不生效）
    onComplete?: Function;          // 播放完成
    cuveInfo?: CuveAnimationInfo;   // 运动曲线控制（曲线运动信息，由cuveInfo提供）
    angle?: number;                 // 初始角度
    zIndex?: number;                // zIndex
    flipX?: boolean;                // 水平翻转
    timeScale?: number;             // 播放速率（只针对骨骼动画生效）
}

class AnimationOnce {
    private _type: ANIM_TYPE = ANIM_TYPE.Skeleton;
    private _info: AnimationOnceInfo = null;

    constructor (type: ANIM_TYPE, info: AnimationOnceInfo) {
        this._type = type;
        this._info = info;
    }

    get type (): ANIM_TYPE {
        return this._type;
    }

    get info (): AnimationOnceInfo {
        return this._info;
    }

    /**
     * @desc 根据初始化的信息，播放动画
     *  返回一个Promise。then结束表示动画完结
     *
     * @memberof AnimationOnce
     */
    play (): Promise<any> {
        logger.warn('AnimationOnce', `need overwrite play method`);
        return null;
    }

    /**
     * @desc 强制停止，并且会从父节点上移除；对应的一些事件也不会被触发！
     *
     * @memberof AnimationOnce
     */
    stop () {

    }
}

export {
    ANIM_TYPE,
    AnimationOnce,
    AnimationOnceInfo,
}