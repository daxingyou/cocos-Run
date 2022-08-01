/*
 * @Author: fly
 * @Date: 2021-03-16 11:13:51
 * @LastEditTime: 2022-06-09 19:41:42
 * @Description: 项目通用枚举
 */

/**
 * 职业类型
 */
enum CAREER_TYPE {
    NONE = 0,
}

enum COIN_TYPE {
    HP = "Hp",
    COIN = "Coin",
    DAIMOND = "Diamond"
}

//头像（头像框）开启类型
enum HEAD_OPEN_TYPE{
    ExpLevel = 1,    //账号等级
    SvrTime  = 2,    //开服时间
    OwnHero = 3,    //拥有相应的英雄
}

/**
 * 修炼枚举
 */
enum CHARACTER_VIEW_TYPE {
    PRAGMATIC = 0,
    TREASURE = 1,
    SMELT = 2
}


//天赋点状态
enum GIFT_STATE {
    LOCK = 0,     //锁着
    UNLOCK,       //可激活
    ACTIVE,       //已激活
}

/**
 * 跑酷的操作方式
 */
enum PARKOUR_OPERATE {
    SLIDER = 1,
    CLICK,
}

/**
 * 全局事件
 */
enum GLOBAL_EVENT_TYPE {
    UPDATE_COIN = 'UPDATE_COIN',
    UPDATE_DIAMOND = 'UPDATE_DIAMOND',
    UPDATE_PHYSICAL = 'UPDATE_PHYSICAL',
}

/**
 * 关卡类型
 */
enum LESSON_TYPE {
    Parkour = 1,
    Battle,
}
/**
 * 关卡状态
 */
enum CHAPTER_STATE {
    Lock = 1,
    Passed,
    Current,
}

/**
 *
 */
enum HEAD_ICON {
    SQUARE = 1,
    CIRCLE,
    BIG
}

enum ABILITY_ICON_TYPE {
    NO_BG = 1,
    INCIUDE_BG
}

/**
 * 装备品质
 */
enum QUALITY_TYPE {
    N = 2,
    R,
    SR,
    SSR,
    SP,
}
/**
 * 英雄卦象
 */
enum HERO_TRIGRAMS {
    TIAN = 1,
    DI,
    FENG,
    LEI,
    SHUI,
    HUO,
    SHAN,
    ZE
}
/**
 * 英雄装备属性
 */
enum HERO_EQUIP_TYPE {
    TANK = 1,       // 坦克
    SOLDIER,        // 战士
    ASSASSIN        // 刺客
}
/**
 * 英雄定位
 * ATTACK 输出
 * TANK 承伤
 * CONTROL 控制
 * SUPPORT 辅助
 * THERAPY 治疗
 */
enum HERO_ABILITY {
    ATTACK = 1,
    TANK,
    CONTROL,
    SUPPORT,
    THERAPY
}
/**
 * 装备质地类型
 * PLATEARMOUR 板甲-坦克
 * LEATHERARMOUR 皮甲-战士
 * CLOTHARMOUR 布甲-盗贼
 * COMMONARMOUR 通用 饰品
 */
enum EQUIP_TEXTURE_TYPE {
    PLATE_ARMOUR = 1,
    LEATHER_ARMOUR,
    CLOTH_ARMOUR,
    COMMON_ARMOUR
}
/**
 * 头像类型
 * HEAD 头像
 * FRAME 头像框
 */
enum HEAD_TYPE {
    HEAD = 1,
    FRAME = 2.
}

enum LEVEL_EXP_TYPE {
    HERO = 1,
    EQUIP,
    USER,
    BEAST = 6
}
/**
 * 装备位置类型
 * WEAPON 武器
 * CHEST 胸甲
 * HELMET 头盔
 * BOOT 靴子
 * RING 戒指
 * NECKLACE 项链
 * EXCLUSIVE 专属
 * BEAST  灵兽
 */
enum EQUIP_PART_TYPE {
    WEAPON = 1,
    CHEST,
    HELMET,
    BOOT,
    RING,
    NECKLACE,
    EXCLUSIVE,
    BEAST
}

//背包数据类型
enum BAG_ITEM_TYPE {
    PROP = 1,
    EQUIP,
    MATERIAL,
    ITEM_EXP,
    HERO,
    BEAST,
    HERO_CHIP = 50,
    TREASURE = 70,
    HEAD = 80,
    HEAD_FRAME = 90,
}



/**
 * 玩家可能调整的属性, 根据表Attribute
 */
enum HERO_PROP {
    BEGIN = 0,
    BASE_ATTACK = 1,        // 攻击
    DEFEND,                 // 防御
    MAX,                    // 血量
    SPEED,                  // 速度
    BASE_ATTACK_PCT,        // 攻击力百分比提高
    DEFEND_PCT,             // 防御值百分比提高
    HP_PCT,                 // 血量百分比提高
    SPEED_PCT,              // 速度百分比提高
    CRIT_RATE,              // 暴击率
    CRIT,                   // 暴击伤害
    RESIST_CRIT_RATE,       // 暴击抵抗率
    HIT_RATE,               // 命中率
    MISS,                   // 躲避率
    AVOID_INJURY,           // 免伤率
    PARRY_RATE,             // 招架率
    PARRY,                  // 招架效果
    REBORN,                 // 再生值
    VAMPIRE,                // 普攻吸血率
    VAMPIRE_RATE,           // 普攻吸血生效率
    RESIST_VAMPIRE,         // 普攻吸血生效抵抗率
    DOUBLE_HIT_RATE,        // 普攻连击率
    DOUBLE_HIT,             // 连击伤害
    SPUTTER_RATE,           // 普攻溅射攻击几率
    SPUTTER_PCT,            // 普攻溅射攻击伤害
    COUNTER_RATE,           // 普攻反击率
    COUNTER_PCT,            // 普攻反击伤害
    DEEP_HARM,              // 伤害加深
    SUSCEPT,                // 易伤百分比
    AVOID_HARM,             // 减少伤害，与DEEP_HARM互斥
    IGNORE_DEFENG,          // 忽略护甲
    IMMUNITY,               // 异常状态抵抗率
    SHIELD,                 // 护盾值
    IMMUNIE_DEBUFF,         // 免疫Debuff
    SUPER_BUFF,             // 无敌状态，免任何攻击
    RESIST_CRIT,            // 暴击抵抗程度
    POWER_MAX,              // 能量上限
    ATT_POWER,              // 攻击行为 回能量
    MAX_HP,                 // 带血的血量上限
    SKILL_MUL,              // 技能放大百分比
    EXTRA_HARM,             // 额外伤害
    TRUE_ATTACK,            // 真实伤害

    END,
}

//属性枚举到英雄属性的映射
const HERO_PROP_MAP = {
    [HERO_PROP.BASE_ATTACK] : 'Attack',                       // 攻击
    [HERO_PROP.DEFEND] : 'Defend',                            // 防御
    [HERO_PROP.MAX] : 'Hp',                                   // 血量
    [HERO_PROP.SPEED] : 'Speed',                              // 速度
    [HERO_PROP.CRIT_RATE] : 'Critical',                       // 暴击率
    [HERO_PROP.CRIT] : 'CriticalHarm',                        // 暴击伤害
    [HERO_PROP.RESIST_CRIT_RATE] : 'NoCritical',              // 暴击抵抗率
    [HERO_PROP.BASE_ATTACK_PCT]: 'AttackPercent',             // 攻击力百分比
    [HERO_PROP.DEFEND_PCT] : 'DefendPercent',                 // 防御值百分比提高
    [HERO_PROP.HP_PCT] : 'HpPercent',                         // 血量百分比提高
    [HERO_PROP.AVOID_INJURY] : 'HarmImmunity',                // 免伤率
    [HERO_PROP.MISS] : 'Miss',                                // 躲避率
    [HERO_PROP.VAMPIRE] : 'Blood',                            // 普攻吸血率
    [HERO_PROP.VAMPIRE_RATE] : 'BloodValue',                  // 吸血收益值
    [HERO_PROP.DEEP_HARM] : 'Harm',                           // 伤害加深
    [HERO_PROP.IGNORE_DEFENG] : 'Through',                    // 忽略护甲
    [HERO_PROP.COUNTER_RATE] : 'CounterAttack',               // 普攻反击率
    [HERO_PROP.COUNTER_PCT] : 'CounterAttackValue',           // 反击收益值
    [HERO_PROP.SPUTTER_RATE] : 'Sputtering',                  // 普攻溅射攻击几率
    [HERO_PROP.PARRY_RATE] : 'Parry',                         // 招架率
    [HERO_PROP.PARRY] : 'ParryValue',                         // 招架收益值
    [HERO_PROP.HIT_RATE] : 'Hit',                             // 命中率
    [HERO_PROP.SPUTTER_PCT] : 'SputteringValue',              // 溅射收益值
    [HERO_PROP.IMMUNITY] : 'DebuffImmunity',                  // 异常状态抵抗率
    [HERO_PROP.DOUBLE_HIT] : 'DoubleHitValue',                // 连击收益率
    [HERO_PROP.DOUBLE_HIT_RATE] : 'Continuity',                // 连击触发率

}

/**
 * PVE模式
 * 普通章节
 * 太虚幻境
 * 日常试炼
 * 飞升之路
 */
enum PVE_MODE {
    ADVENTURE_LESSON,
    DREAM_LESSON,   // 太虚幻境
    DAILY_LESSON,   // 日常试炼（跑酷）
    RISE_ROAD,      // 众仙传道
    NINE_HELL,      // 九幽森罗
    CLOUD_DREAM,    // 云端梦境
    MAGIC_DOOR,     // 奇门遁甲
    RESPECT,        // 致师之礼
    FAIRY_ISLAND,    //蓬莱仙岛
    XIN_MO_FA_XIANG,  //心魔法相
	PURGATORY,       // 无间炼狱
    YYBOOK,          // 阴阳宝鉴 
    MAIN_SCENE_TEST,
    RANDOM_FIGHT,   // 随机战斗
    NONE
}

enum PVP_MODE{
    DEIFY_COMBAT,   // 鹤鸣武会
    IMMORTALS_RANK,  // 齐云问道
    PEAK_DUEL, // 巅峰对决
    GUILD_WAR // 公会战
}

enum SEX {
    FEMALE = 0,
    MALE
}

enum AntiAdditionCode {
    LOGIN = 0,              // 正常登陆
    ADULT,                  // 已成年
    NON_ADULT_NORMAL,       // 未成年但是符合条件

    // 登陆
    NON_ADULT_TIMEOUT,          // 未成年时间已满
    NON_ADULT_TIME_FORBIDDEN,   // 未成年禁玩时间

    // 充值
    NON_ADULT_UNDER8,   // 低于8岁不能充值
    NON_ADULT_8TO16,    // 8-16
    NON_ADULT_8TO16_TOTAL,    // 8-16 - 累计
    NON_ADULT_16TO18,   // 16-18
    NON_ADULT_16TO18_TOTAL,   // 16-18 - 累计
}

enum GuildPositionType {
    CHAIRMAN = 1,       // 会长
    VICE_CHAIRMAN,      // 副会长
    NORMAL_MEMBER       // 普通成员
}

enum GuildDailyNewsType {
    CREATE = 0,
    APPOINT,
    UNAPPOINT,
    JOIN,
    EXIT,
    CHANGE_NAME,
    KICK_OUT
}

enum ALLTYPE_TYPE {
    HERO_ABILITY = 1,
    HERO_EQUIP_TYPE,
    HERO_TRIGRAMS,
    HERO_FIVE_PROP,
    HERP_PROP_LEVEL,
    HERO_EQUIP_PART
}

//任务状态
enum TaskState{
    Completed = 1,
    Undo,
    Received,
}

//商店类型
enum ShopSubType {
    Gold = 1,   //金币
    Diamond = 2,    //仙玉
    Honour = 3,     //荣誉
    DreamMoney = 4,     //梦境尘
    HuanLing = 5,       //幻灵
    ShengWang = 6,      //声望
}

// 双周活动类型
enum DoubleWeekType {
    ALL,
    HERO,
    EQUIP
}


enum TASK_CONDITION_TYPE {
  USER_LEVEL = 1,
  COMPLETE_FRONT,
  TREASURE_SYS_POWER,
  MUST_FINISH_VISIBLE
}

enum NODE_OPEN_CONDI_TYPE {
  USER_LV = 1,
  TASK,
}

enum NODE_LOCK_TYPE{
  HIDE = 0,
  GRAY,
  NORMAL
}

enum NumberValueType{
  REAL_VALUE = 1,
  PERCENT = 2,
}

/** 灵宝任务条件类型
 * 自行根据需要从配置表LeadTreasure中拓展
*/
enum TREASURE_CONDITION_TYPE {
    RECHARGE = 1001
}

enum BEAST_TYPE {
    FEI_QIN = 1,
    ZOU_SHOU,
    SHUI_ZU,
}

enum BEAST_RISE_LV_MATERIAL {
    FEI_QIN = 10010013,
    ZOU_SHOU = 10010014,
    SHUI_ZU = 10010015,
}

//三皇供奉主题类型
enum CONSECRATE_STATUE_TYPE {
    NV_WA = 1,
    PAN_GU,
    FU_XI
}

//三皇供奉贡品类型
enum CONSECRATE_GOODS_TYPE {
    NV_WA = 1,
    PAN_GU,
    FU_XI,
    UNIVERAL,
}


const CONSECRATE_STATUE_NAME = {
    [CONSECRATE_STATUE_TYPE.NV_WA]:  '女娲',
    [CONSECRATE_STATUE_TYPE.PAN_GU]: '盘古',
    [CONSECRATE_STATUE_TYPE.FU_XI]:  '伏羲'
}

// 心魔法相奖励类型
enum XIN_MO_REWARD_TYPE {
    BASE = 0,
    DAMAGE_LIST,
    RANK_LIST,
    NOT_ON_RANK_LIST
}

// 枚举类型
export {
    CAREER_TYPE,    // 职业类型
    COIN_TYPE,
    PARKOUR_OPERATE,
    GLOBAL_EVENT_TYPE,
    LESSON_TYPE,
    CHAPTER_STATE,
    QUALITY_TYPE,
    HERO_TRIGRAMS,
    HERO_EQUIP_TYPE,
    HERO_ABILITY,
    EQUIP_TEXTURE_TYPE,
    HEAD_TYPE,
    LEVEL_EXP_TYPE,
    EQUIP_PART_TYPE,
    BAG_ITEM_TYPE,
    HERO_PROP,
    HEAD_ICON,
    PVE_MODE,
    SEX,
    AntiAdditionCode,
    PVP_MODE,
    GuildPositionType,
    GuildDailyNewsType,
    ALLTYPE_TYPE,
    HERO_PROP_MAP,
    TaskState,
    CHARACTER_VIEW_TYPE,
    HEAD_OPEN_TYPE,
    ShopSubType,
    DoubleWeekType,
    TASK_CONDITION_TYPE,
    GIFT_STATE,
    NODE_OPEN_CONDI_TYPE,
    NODE_LOCK_TYPE,
    ABILITY_ICON_TYPE,
    NumberValueType,
    TREASURE_CONDITION_TYPE,
    BEAST_TYPE,
    BEAST_RISE_LV_MATERIAL,
    CONSECRATE_STATUE_TYPE,
    CONSECRATE_GOODS_TYPE,
    CONSECRATE_STATUE_NAME,
    XIN_MO_REWARD_TYPE
}
