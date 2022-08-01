
//子弹依附节点的类型
enum BULLET_ATTACH_TYPE{
    ROLE = 1,
    SCREEN,
}

//子弹运动过程的目标位置类型
enum BULLET_TARGET_POS_TYPE{
    FIX = 0,    //固定位置
    FOLLOW_ONCE,    //追踪怪物一次
    FOLLOW_ALWAYS   //持续追踪怪物
}

//子弹运动过程的旋转方式
enum BULLET_ROTATION_TYPE{
    STATIC = 1, //发射时候固定旋转角度
    DYNAMIC,    //运动过程中改变旋转角度，可以达到曲线运动
}

//单个子弹
interface BulletEntity{
    //子弹名称
    name: string,
    //子弹ID
    ID: number,
    //发射延迟
    delay?: number,
    //依附的节点类型
    attachType: BULLET_ATTACH_TYPE,
    //发射位置的x坐标
    startPosx: number[],
    //发射位置的y坐标
    startPosy: number[], 
    //目标位置x
    endPosx?: number,
    //目标位置y
    endPosy?: number,
    //目标点的类型
    targetPosType: BULLET_TARGET_POS_TYPE,
    //单次追踪目标点的延迟时间
    targetFollowDelay?: number,
    //运动多长时间销毁
    destroyTime?: number,
    //运动多长距离销毁
    destroyDis?: number,
    //销毁效果
    destroyEffect?: boolean,
    //开始运动的线速度
    startLineVel: number,
    //线性加速度
    addLineVel: number,
    //最大线性速度
    maxLineVel?: number,
    //最小线性速度
    minLineVel?: number,
    //目标旋转角度
    targetRotation: number,
    //旋转方式
    rotationType: BULLET_ROTATION_TYPE,
    //动态旋转中初始角速度
    startAngularVel?: number,
    //动态旋转中角速度的加速度
    addAngularVel?: number,
    //动态旋转中的最大角速度
    maxAngularVel?: number,
    //动态旋转中的最小角速度
    minAngularVel?: number,
    //起始旋转角，由所属的子弹小组的旋转角决定
    startRotation?: number
}

//子弹组
interface BulletGroupEntity{
    name: string,
    groupId: number,
    littleGroups:BulletLittleGroupEntity[],
    bullets: BulletEntity[]
}

//子弹小组
interface BulletLittleGroupEntity{
    //子弹小组名称
    name: string,
    //子弹小组的索引
    idx: number,
    //子弹小组下的子弹ID
    bullets:number[]
    //子弹小组X的偏移量
    startPosx?: number,
    //子弹小组y的偏移量
    startPosy?: number,
    //子弹小组的发射延迟
    delay?: number
    //子弹小组的目标旋转角度
    targetRotation?: number,
}

export {
    BULLET_ATTACH_TYPE,
    BULLET_TARGET_POS_TYPE,
    BULLET_ROTATION_TYPE,
    BulletEntity,
    BulletGroupEntity,
    BulletLittleGroupEntity
}
