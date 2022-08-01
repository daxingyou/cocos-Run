/*
 * @Author: fly
 * @Date: 2021-03-16 11:13:51
 * @LastEditTime: 2021-03-16 13:42:17
 * @Description: 项目通用枚举
 */

/**
 * 职业类型
 */
enum CAREER_TYPE {
    NONE = 0,
}

/**
* 战斗状态机
*/
enum BATTLE_STATE {
    NONE = "NONE",
    IDLE = "BTStateIdle",
    BATTLE_START = "BTStateBattleStart",
    ACTION_ROUND = "BTStateActionRound",
    BATTLE_END = "BTStateEnd"
}

enum ROLE_STATE {
    NORMAL = 0,
    DEAD
}

enum ROLE_TYPE {
    INVALID = 0,
    HERO,
    MONSTER,
}

enum ATTACK_TYPE {
    MELEE = 0,
    RANGED
}


enum TEAM_TYPE {
    SELF = 0,
    OPPOSITE,
}

enum GAME_TYPE {
    BATTLE = 0,     // pve战斗
    RUN_COOL,       // 跑酷
}

enum TIMER_STATE {
    STOP = 0,
    MOVING,
    ACTING,
    WAIT_ACT,
    DEAD,
}

enum TARGET_TYPE {
    INVALID = 0,
    SELF,           // 自己
    ALL_SELF,       // 己方
    RANDOM_SELF_1,  // 随机1个队友
    RANDOM_SELF_2,  // 随机2个队友
    SELF_AROUND,    // 自己+左右各1队友
    DEFAULT,        // 默认
    ALL_ENEMY,      // 全体敌人
    RANDOM_ENEMY_1, // 随机1个敌人
    RANDOM_ENEMY_2, // 随机2个敌人
    RANDOM_ENEMY_3, // 随机3个敌人
    DEFAULT_AROUND, // 默认当前敌人目标+左右各1敌人
    RANDOM_1,       // 1个任意目标
    RANDOM_ENEMY_ALL,    // 不重复随机（默认目标是第一个）
    ALL,            // 全体
}

enum HALO_RANGE {
    SELF_AROUND = 1,
    SELL_ALL,
    DEFAULT,
    DEFAULT_AROUND,
    ENEMY_ALL,
    ALL,
}

enum EFFECT_TYPE {
    INVALID = 0,
    NORMAL_ATTACK = 1,
    SKILL,
    BUFF,
    HALO,
    OTHER
}

enum ResultType {
    RTInvalid = 0,
    RTSkillLight,
    RTBuffLight,
    RTHaloLight,
    RTHPResult,
    RTRoleDead,
    RTNormalAttackResult,
    RTSkillAttackResult,
    RTChangePower,
    RTBuffCntChange,
    RTHaloChange,
    RTRolePropChange,
}

enum SkillType {
    HeroActive = 1,
    HeroPerks,
    EquipPerks,
    GiftPerks,
}

enum EffectType {
    SkillAttack = 1,
    AddBuff,
    ChangeRoleProp,
    TrueAttack,
    ChangePower,
    AdditionAttack,
    LightningAttack,
    TrueAttackFromSkill,
    ChangeHp,
    AttackAddBuff,
    AddHalo,
    AddBuffWithData,
    ChangeRolePropByBuff,
    FightBack,
    Substitution,
    AddBuffByCondition,
    NormalAttack = 999, // 这个后面要改，不能和技能ID一样
}

/**
 * // 流程 顺序
 * 1. 战斗开始
 * 2. 回合开始
 * 3. 回合结束
 * 4. 战斗结束
 * 
 * // 事件
 * 5. 触发技能（主动、被动）
 * 6. 发动攻击（普攻，大招） -> 可以修改攻击属性，受到攻击的人去修改相关受到伤害的属性 等等 -> 实际扣血 => 进行攻击
 * 7. 受到伤害 （可能是各种）-> 发动攻击结算完， 扣血完
 * 8. 受到血量变化之后 -> 
 * 9. 角色死亡时候 ->
 * 10. 角色数量变化时（可以用不到）
 * 11. 能量变化
 */

enum TIME_TRIGGER {
    // 流程
    BATTLE_START = 1,
    ROUND_START,
    ROUND_END,
    BATTLE_END,

    // 事件
    ROLE_MAKE_ATTACK,
    ROLE_CHANGE_HP,
    ROLE_BE_ATTACKED,
    ROLE_DEAD,
    ROLE_COUNT_CHANGE,
    POWER_CHANGE,
    BUFF_EFFECT_LIGHT,
    SKILL_EFFECT_LIGHT,
    GAIN_BUFF,
    BUFF_COUNT_CHANGE,

    ROLE_ACTION_FINISH,

    SKILL_ACTION_START = 100
}

enum SKILL_CONDITION {
    POWER_OVER_100 = 1,
    MATE_ACTING,
    ATTACKING,
    ADD_BUFF
}

enum PRIMARY_TYPE {
    ALL = 0,
    SELF,
    MATE,
    OPPOSITE
}

enum COIN_TYPE {
    HP = "Hp",
    COIN = "Coin",
    DAIMOND = "Diamond"
}

enum MSG_TYPE {
    WORLD = "世界",
    COMMUNITY = "公会"
}

/**
 * 跑酷的操作方式
 */
enum OPERATE_TYPE_OF_PARKOUR {
    OPERATE_TYPE_OF_SLIDER = 1,
    OPERATE_TYPE_OF_CLICK,
}

/**
 * 玩家可能调整的属性, 根据表Attribute
 */
enum HERO_PROP {
    BEGIN = 0,
    BASE_ATTACK = 1,
    DEFEND,
    MAX,
    CRIT_RATE,
    CRIT,
    SPEED,
    AVOID_INJURY,
    PARRY,
    PARRY_RATE,
    HIT_RATE,
    MISS,
    VAMPIRE_RATE,
    VAMPIRE,
    ADD_BASE,
    IGNORE_DEFENG,
    BASE_ATTACK_PCT,
    DOUBLE_HIT_RATE,
    DOUBLE_HIT,

    DEFEND_PCT,
    SPEED_PCT,
    RESIST_VAMPIRE,
    RESIST_CRIT_RATE,
    RESIST_CRIT,
    COUNTER_RATE,
    COUNTER_PCT,
    SPUTTER_RATE,
    SPUTTER_PCT,
    IMMUNITY,

    POWER_MAX,
    ATT_POWER,
    MAX_HP,
    SKILL_MUL,
    EXTRA_HARM,
    TRUE_ATTACK,
    SUSCEPT,
    END,
}
/**
 * 全局事件
 */
enum GLOBAL_EVENT_TYPE {
    UPDATE_COIN = 'UPDATE_COIN',
    UPDATE_DIAMOND = 'UPDATE_DIAMOND',
    UPDATE_PHYSICAL = 'UPDATE_PHYSICAL',
}

enum BATTLE_POS {
    ORIGIN = 1,
    FORWARD,
    TARGET
}

enum BUFF_TYPE {
    GOOD = 1,
    BAD,
    NONE
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
 * 物品类型
 * COIN, 金币
    DIAMOND, 钻石
    PHYSICAL, 体力
    HONOUR, 荣誉
    REPUTATION, 声望
    TICKET_HERO, 英雄抽奖券
    TICKET_EQUIP, 装备抽奖券
    MATERIAL_STRENGTHEN, 强化材料
    MATERIAL_BREAK, 突破材料
    MATERIAL_BREAK_ALLPOWER, 突破万能材料
    MATERIAL_TALENT,    天赋材料
    MATERIAL_CASTSOUL,  铸魂材料
    EXP_HERO_ADD,   英雄经验材料
    PHYSICAL_ADD,   体力材料
 */
enum ITEM_TYPE {
    COIN,
    DIAMOND,
    PHYSICAL,
    HONOUR,
    REPUTATION,
    TICKET_HERO = 11,
    TICKET_EQUIP = 12,
    MATERIAL_STRENGTHEN = 13,
    MATERIAL_BREAK = 14,
    MATERIAL_BREAK_ALLPOWER = 15,
    MATERIAL_TALENT = 16,
    MATERIAL_CASTSOUL = 17,
    EXP_HERO_ADD = 18,
    PHYSICAL_ADD = 19,
    HEAD = 20,
    HEAD_FRAME = 21,
    HERO_CHIP = 50
}

/**
 * 物品品质
 */
enum ITEM_QUALITY {
    WHITE,
    GREEN,
    PAUPLE,
    ORIGAN,
}

enum UserLocalStrongType {
    UserInfo = 'RunX_UserInfo',
    Account = 'Runx_Account',
}

/**
 * 英雄品质
 */
enum HERO_QUALITY {
    R = 3,
    SR,
    SSR,
    SP
}
/**
 * 装备品质
 */
enum EQUIP_QUALITY {
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
    TANK = 1,
    SOLDIER,
    ASSASSIN
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
 * 英雄仙缘类型
 * BATTLE 战斗类型
 * RESIDENT 常驻类型
 */
enum HERO_FRIEND_TYPE {
    BATTLE = 1,
    RESIDENT
}
/**
 * 英雄天赋类型
 * SINGLE 单一
 * MULTI 复合
 */
enum HERO_GIFT_TYPE {
    SINGLE = 1,
    MULTI,
}

/**
 * 英雄攻击距离类型
 * MELEE 近战
 * LONG 远程
 */
enum HERO_MELEEORLONG_TYPE {
    MELEE,
    LONG
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
 * 装备黄字类型
 * PROTYPE 黄字属性
 * SKILL 技能
 */
enum EQUIP_YELLOW_TYPE {
    PROTYPE = 1,
    SKILL,
}
/**
 * 技能类型
 * INITIATIVE 主动
 * PASSIVE 被动
 * EQUIPPASSIVE 装备被动
 * HEROGIFTPASSIVE 主角宝物 天赋被动技能
 * GOLDCANEQUIPPASSIVE 神系可装备被动技能
 * GOLDCANTEQUIPPASSIVE 神系不可装备被动技能
 * HERORESTRAIN 英雄羁绊技能
 * EQUIPSUIT 装备套装技能
 */
enum SKILL_TYPE {
    INITIATIVE = 1,
    PASSIVE,
    EQUIP_PASSIVE,
    HERO_GIFT_PASSIVE,
    GOLDCAN_EQUIP_PASSIVE,
    GOLDCANT_EQUIP_PASSIVE,
    HERO_RESTRAIN,
    EQUIP_SUIT
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
    USER
}
/**
 * 装备位置类型
 * WEAPON 武器
 * HELMET 头盔
 * CHEST 胸甲
 * BOOT 靴子
 * RING 戒指
 * NECKLACE 项链
 * EXCLUSIVE 专属
 */
enum EQUIP_PART_TYPE {
    WEAPON = 1,
    CHEST,
    HELMET,
    BOOT,
    RING,
    NECKLACE,
    EXCLUSIVE
}

// 枚举类型
export {
    CAREER_TYPE,    // 职业类型
    BATTLE_STATE,   // 状态类型
    TIME_TRIGGER,   // 触发时机
    ROLE_STATE,
    ROLE_TYPE,
    TEAM_TYPE,
    GAME_TYPE,
    TIMER_STATE,
    TARGET_TYPE,
    EFFECT_TYPE,
    ResultType,
    ATTACK_TYPE,
    SkillType,
    EffectType,
    SKILL_CONDITION,
    PRIMARY_TYPE,
    COIN_TYPE,
    MSG_TYPE,
    OPERATE_TYPE_OF_PARKOUR,
    HERO_PROP,
    GLOBAL_EVENT_TYPE,
    BATTLE_POS,
    BUFF_TYPE,
    HALO_RANGE,
    LESSON_TYPE,
    CHAPTER_STATE,
    ITEM_TYPE,
    ITEM_QUALITY,
    UserLocalStrongType,
    HERO_QUALITY,
    EQUIP_QUALITY,
    HERO_TRIGRAMS,
    HERO_EQUIP_TYPE,
    HERO_ABILITY,
    HERO_FRIEND_TYPE,
    HERO_GIFT_TYPE,
    HERO_MELEEORLONG_TYPE,
    EQUIP_TEXTURE_TYPE,
    EQUIP_YELLOW_TYPE,
    SKILL_TYPE,
    HEAD_TYPE,
    LEVEL_EXP_TYPE,
    EQUIP_PART_TYPE
}
