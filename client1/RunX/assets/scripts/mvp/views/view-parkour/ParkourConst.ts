/*
 * @Description:
 * @Autor: lixu
 * @Date: 2021-05-07 20:09:12
 * @LastEditors: lixu
 * @LastEditTime: 2021-11-16 14:47:01
 */
import { utils } from '../../../app/AppUtils';

enum GROUPS_OF_NODE{
    DEFAULT         = 0,        //默认的碰撞分组，主要用于主相机
    OUTSIDE         = 1,        //屏幕外部的碰撞器所在的分组
    LAND            = 2,        //地形所在的分组
    REWARD          = 3,        //道具所在的分组
    ACTOR           = 4,        //角色所在的分组
    TRAP            = 5,        //障碍所在的分组
    PARKOUR_DEFAULT = 6,        //跑酷的默认分组，主要用于让跑酷的相机渲染的ui
    BULLET          = 7,        //子弹所在的分组
    MONSTER         = 8,        //怪物所在的分组
}

//陷阱分类
enum TRAP_TYPE{
    FIXED = 0,  //固定型
    POPED = 1,  //弹出型
    HINDER = 2, //障碍物,正常情况下不能被穿透
}

enum TRAP_COLLISION_TYPE{
    DAMAGE = 0,  //计算伤害的碰撞器的TAG
    TRAG = 1    //带有触发范围的陷阱的触发器的TAG
}

enum TERR_LAYER{
    SHADE = "shade",    //地形碰撞层
    LOOT = "loot",      //道具层
    STONES = "stones",  //障碍层
}

enum TERR_TYPE {
    FLAT = 0,   //平地类型
    UPSLOPE,    //上坡类型
    DOWNGRADE, //下坡类型
}

//道具类型
enum ItemType {
    REWARD_GOLD = 0,        //金币
    REWARD_BOX,         //宝箱
    REWARD_DIAMNOND,    //钻石
    REWARD_OTHER,       //奖励类型的其他道具
    USED_SKILL,         //使用类型的技能道具
    USED_BLOOD,       //使用类型的恢复道具
    USED_STRONG,         //强化道具
}

//道具效果类型
enum ItemEffect{
    GOLD = 1,
    DIAMOND,
    STRONG,
    CHONG_CI,
    ADD_BLOOD
}

//地形中道具名称表(道具节点的名称、挂载的组件名称、预制体名称三者必须一样)
const ItemNames = {
    COIN: 'ItemGold',   //金币
    MID_COIN: 'ItemMidGold',  //中金币
    LARGE_COIN: 'ItemLargeGold',  //大金币
    DIAMOND: 'ItemDiamond',   //钻石
    STRONG: 'ItemStrong',   //强化
    BLOOD: 'ItemBlood',  //血包
    CHONG_CI: 'ItemSprint',   //冲刺
    STONE: 'ItemStone', //石头
    TIE_STONE: 'ItemTieStone',  //钢块
    SPRIKE: 'ItemTrapSprike',   //突刺
    FIRE: 'ItemTrapFire',   //天火
    BOMB: 'ItemTrapBomb',   //炸弹
}

//道具名称的Set集合
const ItemNameSet: Set<string> = new Set<string>();

//权重值
const ItemWeights = {
    COIN: 50,   //金币
    MID_COIN: 80,  //中金币
    LARGE_COIN: 100,  //大金币
    DIAMOND: 120,   //钻石
    STRONG: 200,   //强化
    BLOOD: 200,  //血包
    CHONG_CI: 200,   //冲刺
    STONE: 0, //石头
    TIE_STONE: 0,  //钢块
    SPRIKE: -100,   //突刺
    FIRE: - 100,    //天火
    BOMB: -100,     //炸弹
    BULLET: -100,   //子弹
    MONSTER: 1, //怪物
}

//数值类型
enum ValueType {
    AbsoluteValue = 1,  //绝对值
    Percentage      //百分比
}

//基础土块的名称
const TileSetBasicPNGName = "run_basic32";
enum TileSetBasicGIDS{
    PingDi = 0,   //水平
    XiaPo,      //下坡
    ShangPo,    //上坡
    Gold,       //金币
    Diamond,    //钻石
    ChongCi,    //冲刺
}

const TileSetItemPNGName = 'run_item32';
enum TileSetItemGIDS{
  Coin = 0,           //小金币
  Mid_Coin,           //中金币
  Large_Coin,         //大金币
  ChongCi,            //冲刺
  Strong,             //强化
  Blood,              //回复
  Diamond,            //钻石
}

//基础陷阱层的名称
const TileSetTerrPNGName = "run_stones";
enum TileSetTerrGIDS{
    Bomb = 0,   //炸弹
    LiBa,       //篱笆
    Tie,        //铁块
    Sprike,     //突刺
    Fire,       //火焰
    DropFire,   //掉落的火球
}

//怪物类型
enum ParkourMonsterType{
    Solider = 1,
    Boss
}

//怪物行为中碰撞类型
enum ParkourMonsterMoveType{
    None = 0,
    Collision = 1
}

//子弹所属类型
enum ParkourBulletOwnerType{
    None = 0,
    Player,
    Monster
}

enum RoleColliderType {
  NORMAL = 0, //普通碰撞器
  LAND = 1,   //地形碰撞器
}

let parkourConfig = Object.create(null);
parkourConfig.actorPos = cc.v2(300, 0);    //角色正常情况下的x轴的位置
parkourConfig.terrMoveSpeed = cc.v2(704, 0);    //角色正常在x轴的移动速度
parkourConfig.resetTerrFastMoveSpeed = () =>{   //重置加速移动的x轴移动速度
    parkourConfig.terrFastMoveSpeed.x =  parkourConfig.terrMoveSpeed.x * 3;
};
parkourConfig.terrFastMoveSpeed = cc.v2(parkourConfig.terrMoveSpeed.x * 3, 0);
parkourConfig.jumpStartSpeed = cc.v2(0, 1200);  //跳跃的起始速度
parkourConfig.maxJumpSpeed = cc.v2(10, 1300);   //跳跃的最大速度
parkourConfig.fastDownSpeed = 1300; //速降的速度
parkourConfig.addSpeed = cc.v2(0, -3000);   //跳跃加速度
parkourConfig.MAX_CONTINUE_JUMP_COUNT = 2;  //最大连跳次数
parkourConfig.MOVE_SPEED_X_ON_PASS = 500;   //通关时候，角色退场的x轴移动速度
parkourConfig.OperateDelay = 0.05;   //英雄的操作间隔
parkourConfig.HeroOffset = 50;  //英雄之间的间距

//自动模式的判断区域的起始x坐标
parkourConfig.AutoPlayAreaStartX =  200;
//自动模式的判断区域的宽度
parkourConfig.AutoPlayAreaWidth = 300;
//自动模式的判断区域，从上到下排列
parkourConfig.AutoPlayAreas = [
    cc.rect(parkourConfig.AutoPlayAreaStartX, 0, parkourConfig.AutoPlayAreaWidth, 0),
    cc.rect(parkourConfig.AutoPlayAreaStartX, 0, parkourConfig.AutoPlayAreaWidth, 0),
    cc.rect(parkourConfig.AutoPlayAreaStartX, 0, parkourConfig.AutoPlayAreaWidth, 0),
    cc.rect(parkourConfig.AutoPlayAreaStartX, 0, parkourConfig.AutoPlayAreaWidth, 0),
    cc.rect(parkourConfig.AutoPlayAreaStartX, 0, parkourConfig.AutoPlayAreaWidth, 0),
]

//自动模式的怪物判断区域的起始x坐标
parkourConfig.AutoPlayMonsterAreaStartX =  350;
//自动模式的怪物判断区域，从上到下排列
parkourConfig.AutoPlayMonsterAreas = [
  cc.rect(parkourConfig.AutoPlayMonsterAreaStartX, 0, parkourConfig.AutoPlayMonsterAreaStartX, 0),
  cc.rect(parkourConfig.AutoPlayMonsterAreaStartX, 0, parkourConfig.AutoPlayMonsterAreaStartX, 0),
  cc.rect(parkourConfig.AutoPlayMonsterAreaStartX, 0, parkourConfig.AutoPlayMonsterAreaStartX, 0),
  cc.rect(parkourConfig.AutoPlayMonsterAreaStartX, 0, parkourConfig.AutoPlayMonsterAreaStartX, 0),
  cc.rect(parkourConfig.AutoPlayMonsterAreaStartX, 0, parkourConfig.AutoPlayMonsterAreaStartX, 0),
]
//自动模式的tick间隔事件
parkourConfig.AutoPlayTickInterval = 0.2;
//每个区域的权重数组
parkourConfig.AutoPlayWeightArr = [0, 0, 0, 0, 0];

const HP_BAR_LERP_RATIO = 0.05; //血条效果的插值系数
const HP_BAR_LERP_MIN_TRRESSHOLD = 2; //血条效果插值运算的最小阈值

const TerrCollisionNodeName = 'TerrCollisionComp';  //地形碰撞节点的名字，需要与TerrCollisionComp组件名保持一致
const TerrConfigRootPath = 'config/level/';    //地形配置文件的根目录
const bulletCfgPath = 'config/bullets/';   //子弹配置文件的根目录
const MapBgRootPath = 'textures/parkour/bgImage/';    //跑酷地图背景的根目录
const ActorPrefabPath = 'prefab/hero/Actor';  //跑酷角色的预制体路径
const ROLE_SPINE_DIR = 'spine/role/';
const PARKOUR_SPINE_DIR = 'spine/parkour/'; //跑酷其他spine资源的相对路径
const Bullet_prefab_Dir = 'prefab/bullet/'; //所有的子弹预制体存放路径
const Item_Prefab_Path = 'prefab/item/';   //跑酷中道具预制体存放目录
const TiledImagesDir = 'textures/parkour/tiledImage/';//跑酷地形皮肤存储路径
const TiledImageNamePrefix = 'run_chapter'; //跑酷地形皮肤名称的前缀

let getMapBgRes = (mapBgConfig: any[]): string[] =>{
    if(!mapBgConfig || !Array.isArray(mapBgConfig) || mapBgConfig.length <= 0) return null;
    let res: Array<string> = [];
    for(let i = mapBgConfig.length; i > 0; i--){
        let config = mapBgConfig[i - 1];
        let resources = utils.parseStringTo1Arr(config.LessonRunBgImage || "");
        let level = config.LessonRunBgImageLevel;
        resources && resources.length > 0 && resources.forEach(ele => {
            res.push(`level_${level}/${ele}`);
        })
    }
    let set: Set<string> = new Set<string>(res);
    res.length = 0;
    set.forEach(ele => {
        res.push(ele);
    });
    return res;
}

let getMapBgAbsPath = function(bgName: string, chapterID: number, level?: number): string{
    let levelStr = "";
    !isNaN(level) && (levelStr = `level_${level}/`);
    return `${MapBgRootPath}style_${chapterID}/${levelStr}${bgName}`;
}

let getTerrCfgPath = function(cfgFileName: string): string{
    return `${TerrConfigRootPath}${cfgFileName}`;
}

let getParkSpineResPath = function(resName: string): string{
    return `${PARKOUR_SPINE_DIR}${resName}`;
}

let getParkRoleSpinePath = function(modelName: string): string{
    return `${ROLE_SPINE_DIR}${modelName}`
}

let getBulletCfgPath = function(bulletGroupID: number) : string{
    return `${bulletCfgPath}${bulletGroupID}`;
}

let getTerrSkinPath = function(skinID: number) : string{
    return `${TiledImagesDir}${TiledImageNamePrefix}${skinID}`
}

const NOT_EXIST_HERO_ID = 0;

const ParkourRoleActions = {
    Idle: 'Idle',   //站立待机
    Attack: 'Attack',   //攻击
    Hit: 'Hit',     //受击
    Die: 'Die',     //死亡
    Cheer: 'Cheer', //庆祝
    Run: 'Run',     //跑
    Jump: 'Jump',   //跳跃
    DoubleJump: 'DoubleJump', //二段跳
    Roll: 'Roll',   //翻滚
    FastDown: 'FastDown', //速降
    Charge: 'Charge',    //冲锋
    AutoDown: 'AutoDown', //自由落体的下落
}

enum ParkourRoleEffects {
    RunDirt = 1,    //奔跑状态的尘埃特效
    OneJumpDirt,           //一段跳的尘埃特效
    DoubleJumpDirt,     //二段跳的尘埃特效
    LandDirt,           //着陆的尘埃特效
    DeadDirt,           //死亡的尘埃特效，暂无特效
    AutoDown            //奔跑状态自由落体转换为一段跳的尘埃特效
}

const CameraConfig = {
    UP_SCOPE: 100,
    DOWN_SCOPE: - 100
}

enum ParkourLazyLoadType{
    Sound = 1,
    Sprite,
    AnimClip
}
//懒加载资源的资源模块和类型
const ParkourLazyLoadMaps = {
    [ParkourLazyLoadType.Sound]: cc.AudioClip,
    [ParkourLazyLoadType.Sprite]: cc.SpriteFrame,
    [ParkourLazyLoadType.AnimClip]: cc.AnimationClip
}

export {
    TRAP_TYPE,
    ItemType,
    GROUPS_OF_NODE,
    TERR_LAYER,
    TERR_TYPE,
    parkourConfig,
    getMapBgRes,
    ActorPrefabPath,
    NOT_EXIST_HERO_ID,
    ParkourRoleActions,
    ItemNames,
    TRAP_COLLISION_TYPE,
    TileSetBasicPNGName,
    TileSetTerrPNGName,
    TileSetBasicGIDS,
    TileSetTerrGIDS,
    Bullet_prefab_Dir,
    ParkourMonsterType,
    ParkourMonsterMoveType,
    ParkourBulletOwnerType,
    ItemEffect,
    TileSetItemPNGName,
    TileSetItemGIDS,
    ItemNameSet,
    ItemWeights,
    HP_BAR_LERP_RATIO,
    HP_BAR_LERP_MIN_TRRESSHOLD,
    RoleColliderType,
    CameraConfig,
    ParkourLazyLoadMaps,
    ParkourLazyLoadType,
    ParkourRoleEffects,
    Item_Prefab_Path,
    TerrCollisionNodeName,
    ValueType,
    getMapBgAbsPath,
    getTerrCfgPath,
    getParkSpineResPath,
    getParkRoleSpinePath,
    getBulletCfgPath,
    getTerrSkinPath,
    TiledImageNamePrefix
}
