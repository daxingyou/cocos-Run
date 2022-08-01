import { gamesvr } from "../network/lib/protocol";

// const
const CLOCK_LEN = 1000;
const UI_LEN = 650;
const CLOCK_INTERVAL = 100;
const BATTLE_ROLE_Z = 1;
const ROLE_MOVE_TIME = 0.1;
const NORMAL_ATTACK_ID = 500001;
const BACK_ATTACK_ID = 500002;          // 反击
const DOUBLE_ATTACK_ID = 500003;        // 连击
const SPUTTER_ATTACK_ID = 500004;       // 溅射
const PURSUE_ATTACK_ID = 500005;        // 追击
const ROLE_REBORN_ID = 900001;
const CLOCL_PROTECTER = 0.02;// 20毫秒的保护时间
const NORMAL_ATTACK_TIME = 0.7;
const PRE_SKILL_ANIMATION_TIME = 0;
const PRE_FRIEND_SKILL_ANIMATION_TIME = 2;
const BUFF_ACTIVITY_TIME = 0.8; 
const BT_DEFAULT_POS = [2,1,3,0,4];
const ROLE_RELATIVE_MOVE_Z_INDEX = 1;
const ROLE_Z_INDEX_INTERVAL = 3;        // zIndex间隔 计算上坦攻得 所以是3
const SHADE_LAYER_Z_INDEX = 50;         //黑屏层级

// type
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

/**
* 角色战斗状态
*/
enum ROLE_STATE {
    NORMAL = 0,
    DEAD
}

/**
* 角色类型
*/
enum ROLE_TYPE {
    INVALID = 0,
    HERO,
    MONSTER,
}

/**
* 攻击类型
*/
enum ATTACK_TYPE {
    MELEE = 1,  // 近战
    RANGED      // 远程
}

enum TEAM_TYPE {
    SELF = 0,
    OPPOSITE,
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
    MIN_HP_EMENY_PCT,
    RANDOM_ENEMY_4,                 // 随机4个敌人
    SELF_HP_PRECENT_LOW = 17,       // 血量百分比最低的队友
    ATTACK_TARGET_ENEMY,
    SELF_AND_FRIEND,                // 己方羁绊英雄
    SELF_FRIEND,                    // 自己和羁绊队友
}

enum HALO_RANGE {
    INVALID = 0,
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

enum SkillType {
    HeroActive = 1,             // 主动技能
    HeroPerks,                  // 被动技能
    EquipPerks,                 // 装备被动技能
    GiftPerks,                  // 天赋，宝物 技能
    GodCanEquip,                // 神系可装备技能
    GodCantEquip,               // 神系不可装备技能
    Friend,                     // 仙缘技能
    Suit,                       // 套装
    Exclusive                   // 专属
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
    ChangePropDirect,
    ChangeHpByProp,
    Sarcasm,
    ChangeActionTimer,
    SkillAttackByBuffCount,
    ConvergeFire,
    AttackWithBuff,
    AddBuffInOrder,
    MulAttackByBuff,
    DeathAttack,
    AddBuffMulti,
    BeAttackAddHp,
    AttackWithBuffExtra,
    ComboAttacks,
    AddFriendBuff,
    AddBuffWithFrontBuff,
    AttackByBuff,
    AttackByAllRolesBuffCount,

    NormalAttack = 999, // 这个后面要改，不能和技能ID一样
}

enum BATTLE_POS {
    ORIGIN = 1,
    FORWARD,
    TARGET,
    SUBSTITU,
}

enum BUFF_TYPE {
    GOOD = 1,
    BAD,
    NONE
}

/**
 * 流程 顺序
 */
enum TIME_TRIGGER {
    // 流程
    BATTLE_START = 1,   // 1. 战斗开始
    ROUND_START,        // 2. 回合开始
    ROUND_END,          // 3. 回合结束
    BATTLE_END,         // 4. 战斗结束

    // 事件
    ROLE_MAKE_ATTACK,   // ※ 5. 发动攻击（普攻，大招） -> 可以修改攻击属性，受到攻击的人去修改相关受到伤害的属性 （坦攻..）
    ROLE_CHANGE_HP,     // ※ 6. 改变血量（免死，无敌）
    ROLE_BE_ATTACKED,   // 7. 受到伤害 （可能是各种）-> 发动攻击结算完， 扣血完
    ROLE_DEAD,
    ROLE_COUNT_CHANGE,
    POWER_CHANGE,
    BUFF_EFFECT_LIGHT,
    SKILL_EFFECT_LIGHT,
    GAIN_BUFF,
    GAIN_HALO,
    ATTACK_MISS,
    BUFF_COUNT_CHANGE,
    ROLE_ACTION_FINISH,

    // 下面的由于策划说不用，先没实现
    ROLE_ACTIONTIMER_CHANGE,
    // 角色发动致命攻击
    ROLE_MAKE_FATAL_ATTACK,
    SKILL_ACTION_START = 100    // 开发人员辅助用
}

enum SKILL_CONDITION {
    POWER_OVER_100 = 1,
    MATE_ACTING,
    ATTACKING,
    ADD_BUFF,
    ADD_HALO,
    POS_RANGE,
    INVALID,
    BUFF_CNT_LE,    // buff层数大于等于
    ATTACK_TYPE,    //
    POS_DISOPPOSITE = 11,
    FRIENDS_ACTIVE,             // 仙缘队友是否存在
    FIRST_HP_LOW,               // 第一次血量低于 百分比
    ACTIVE_BUFF,                // 是否拥有buff
    MATE_POWER_BELOW_VALUE,     // 队友能量不足多少
}

enum PRIMARY_TYPE {
    ALL = 0,
    SELF,
    MATE,
    OPPOSITE,
    FRIEND,
}

enum SKILL_CHANGE_TYPE {
    SKILL = 1,
    BUFF,
    HALO,
    EFFECT
}

enum NORMAL_ATTACK_TYPE {
    NORMAL,             // 普通攻击
    DOUBLE,             // 连击
    BACK,               // 反击
    PURSUIT             // 追击
}

enum LEAD_SKILL_ATTRIBUTE_RANGE {
    PLATE = 1,          // 板甲
    LEATHER,            // 皮甲
    CLOTH,              // 布甲
    SSR,                // SSR
    ALL,                // 全部
    PLATE_LEATHER,      // 板甲+皮甲
    LEATHER_CLOTH,      // 布甲+皮甲
    PLATE_CLOTH,      // 板甲+布甲
}

enum FRIEND_SKILL_ST {
    NORMAL = 1, // 正常
    ACTIVE,     // 激活
    HALF_ACTIVE, // 半激活
}

type BTResult = gamesvr.IResult

export {
    CLOCK_LEN,
    CLOCK_INTERVAL,
    BATTLE_ROLE_Z,
    ROLE_MOVE_TIME,
    NORMAL_ATTACK_ID,
    DOUBLE_ATTACK_ID,
    BACK_ATTACK_ID,
    SPUTTER_ATTACK_ID,
    PURSUE_ATTACK_ID,
    ROLE_REBORN_ID,
    NORMAL_ATTACK_TIME,
    PRE_SKILL_ANIMATION_TIME,
    BUFF_ACTIVITY_TIME,
    ROLE_RELATIVE_MOVE_Z_INDEX,
    ROLE_Z_INDEX_INTERVAL,
    BATTLE_STATE,   // 状态类型
    TIME_TRIGGER,   // 触发时机
    ROLE_STATE,
    ROLE_TYPE,
    TEAM_TYPE,
    TIMER_STATE,
    TARGET_TYPE,
    EFFECT_TYPE,
    ATTACK_TYPE,
    SkillType,
    EffectType,
    SKILL_CONDITION,
    PRIMARY_TYPE,
    HALO_RANGE,
    BATTLE_POS,
    BUFF_TYPE,
    SKILL_CHANGE_TYPE,
    LEAD_SKILL_ATTRIBUTE_RANGE,
    NORMAL_ATTACK_TYPE,
    CLOCL_PROTECTER,
    BTResult,
    UI_LEN,
    BT_DEFAULT_POS,
    FRIEND_SKILL_ST,
    SHADE_LAYER_Z_INDEX,
    PRE_FRIEND_SKILL_ANIMATION_TIME,
}