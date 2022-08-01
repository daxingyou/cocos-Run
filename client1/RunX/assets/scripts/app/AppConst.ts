/*
 * @Author: your name
 * @Date: 2021-05-20 21:07:32
 * @LastEditTime: 2021-09-10 17:47:04
 * @LastEditors: lixu
 * @Description: In User Settings Edit
 * @FilePath: \RunX\assets\scripts\app\AppConst.ts
 */
const SCENE_NAME = {
    MAIN: "MainScene",
    BATTLE: "BattleScene",
    RUN_COOL: "ParkourScene"    //跑酷场景名
}

const VIEW_NAME = {
    MAP_VIEW: "LevelMapView",
    CHANNEL_VIEW: "ChannelView",
    NOTICE_VIEW: "NoticeView",
    INFO_VIEW: "InfoView",
    HEAD_VIEW: "HeadView",
    GIFT_VIEW: "ExchangeView",
    HERO_VIEW: "HeroView",
    HERO_MOREPROPERTY_VIEW: 'HeroMorePropertyView',
    EQUIP_PROPERTY_VIEW: 'EquipPropertyView',
    EQUIPS_LIST_VIEW: 'EquipsListView',
    SPIRIT_BEAST_LIST_VIEW: 'SpiritBeastListView',
    BAG_VIEW: 'BagView',
    EQUIP_ENHANCE_VIEW: 'EquipEnhanceView',
    PREINSTALL_VIEW: 'PreinstallView',
    EQUIP_INFO_VIEW: 'EquipInfoView',
    EQUIP_BREAK_MATERIAL: 'EquipBreakMatView',
    HERO_PROPERTY_VIEW: 'HeroPropertyView',
    BAGITEM_USE_VIEW: 'BagItemUseView',
    MAIL_VIEW: 'MailView',
    GET_ITEM_VIEW: 'GetItemView',
    PARKOUR_PREPARE_VIEW: 'ParkourPrepareView',
    CHAT_VIEW: "ChatView",
    USER_INFO_VIEW: "UserInfoView",
    CHAT_SETTING_VIEW: "ChatSettingView",
    BLACK_LIST_VIEW: "BlackListView",
    GIFT_CHOOSE_VIEW: "GiftChooseView",
    DREAMLAND_VIEW: "DreamlandView",
    DREAMLAND_CHAP_PEIZE_VIEW: "DreamlandChapterPrizeView",
    GIFT_PROPERTY_VIEW: 'GiftPropertyView',
    TIPS_HERO: 'TipsHero',
    TIPS_EQUIP: 'TipsEquip',
    TIPS_ITEM: 'TipsItem',
    TIPS_SKILL: 'TipsSkill',
    TIPS_MONSTER: 'TipsMonster',
    RANK_VIEW: 'RankView',
    FRIENDS_POPVIEW: 'FriendsPopView',
    RANDOM_FIGHT_VIEW: 'RandomFightView',
    RANDOM_SHOP_VIEW: 'RandomShopView',
    ITEM_HERO_SHOW: 'ItemHeroShow',
    PRAGMATIC_VIEW: 'PragmaticView',
    TREASURE_VIEW: 'TreasureView',
    COMPOUND_VIEW: 'CompoundView',
    SWITCH_MAIN_VIEW: 'SwitchMainView',
    TASK_VIEW: 'TaskView',
    SMELT_VIEW: 'SmeltView',
    GUILD_VIEW: 'GuildView',
    GUILD_MAIN_VIEW: 'GuildMainView',
    GUILD_LIST_VIEW: 'GuildListView',
    GUILD_CREATE_VIEW: 'GuildCreateView',
    GUILD_EDIT_NOTICE_VIEW: 'GuildEditNoticeView',
    GUILD_LEVEL_DETAIL_VIEW: 'GuildLevelDetailView',
    GUILD_MEMBER_LIST_VIEW: 'GuildMemberListView',
    GUILD_DAILY_NEWS_VIEW: 'GuildDailyNewsView',
    GUILD_APPLY_LIST_VIEW: 'GuildApplyListView',
    GUILD_CHANGE_NAME_VIEW: 'GuildChangeNameView',
    ONLINE_REWARD_VIEW: 'OnlineRewardView',
    MAIN_TASK_REWARD_VIEW: 'MainTaskView',
    EQUIP_ONCE_ENHANCE_CONFIRM_VIEW: 'EquipOnceEnhanceConfirmView',
	PVE_CHALLENGE_RULE_VIEW: 'PVEChallengeRuleView',
    PVE_CHALLENGE_SELECT_HERO_VIEW: 'PVEChallengeSelectHeroView',
    PVE_CHALLENGE_MY_HEROES_VIEW: 'PVEChallengeMyHeroesView',
    PVE_PURGATORY_RULE_VIEW: 'PVEPurgatoryRuleView',
    PVE_PURGATORY_BOSS_REWARD_VIEW: 'PVEPurtogaryBossRewardView',
    PVE_PURGATORY_REVIVE_VIEW: 'PVEPurgatoryReviveView',
    PVE_PURGATORY_MY_HEROES_VIEW: 'PVEPurgatoryMyHeroesView',
    PVE_PURGATORY_MY_BUFF_VIEW: 'PVEPurgatoryMyBuffView',
    BUFF_PURGATORY_VIEW: 'BuffPurgatoryView',
    SHOP_PURGATORY_VIEW: 'ShopPurgatoryView',
    SPRING_PURGATORY_VIEW: 'SpringPurgatoryView',
    ALTAR_PURGATORY_VIEW: 'AltarPurgatoryView',
    MONSTER_PURGATORY_VIEW: 'MonsterPurgatoryView',
    PORTAL_PURGATORY_VIEW: 'PortalPurgatoryView',
    PVE_FAIRYISLAND_REWARD_PREVIEW: 'PVEFairyIsLandRewardPreview',
    PVE_FAIRYISLAND_ENEMY_VIEW: 'PVEFairyIslandEnemyView',
    PVE_FAIRYISLAND_EFFECT_POPVIEW: 'PVEFairyIslandEffectPopView',
    PVE_FAIRYISLAND_MYHERO_VIEW: 'PVEFairyIslandMyHeroView',
    PVE_FAIRYISLAND_BUFF_VIEW: 'PVEFairyIslandBuffView',
    PVE_YYBOOK_VIEW: 'PVEYYBookView',
    PVE_YYBOOK_SELECT_HERO_VIEW: 'PVEYYBookSelectHeroView',
    ACTIVITY_LUXURY_GIFT_VIEW: 'ActivityLuxuryGiftView'
}

const ModuleName = {
    1000: "InfoView",
    1002: "HeadView",
    1007: "NoticeView",
    11000: 'MailView',
    12000: "ChatView",
    16000: "LevelMapView",
    17001: "PVEDailyLessonView",
    17002: "PVEDailyLessonView",
    17003: "PVEDailyLessonView",
    17004: "PVEDailyLessonView",
    17005: "PVERiseRoadView",
    17006: "PVEDailyLessonView",
    17007: "PVEDailyLessonView",
    17012: "DreamlandView",
    19000: "PragmaticView",
    20000: "HeroView",
    22000: 'BagView',
    23000: 'TaskView',
    25000: 'ShopView',
    26000: 'GuildView',
    27000: "SummonView",
    33000: 'RankView',
    34000: 'SwitchMainView',
    47000: 'CompoundView',
    47001: 'CompoundView',
    47002: 'CompoundView',
    48000: 'ActivityDoubleWeekView',
    49000: 'RandomShopView',
    50000: 'RandomFightView',
}
//资源路径映射
const ResConfig = {
    runCoolScenePath: "prefab/scene/ParkourScene",    //跑酷场景
}

//常用货币的ItemID
const CustomItemId = {
    GOLD: 10010001,
    DIAMOND: 10010002,
    PHYSICAL: 10010003,
    HONOR: 10010004,
    REPUTATION: 10010005,
    EXP: 10010006,
    PRAGMATIC_SKILL_POINT: 10010007,
    GONG_FENG_SPEED_UP_COIN: 10010012,
    XUANTIE: 10013001,
    SIGNIN_REFRESH_CARD: 10060101,
    SIGNIN_TICKET: 10060102,
    BATTLE_PASS_EXP: 10062001,
    GUILD_EXP: 10010009,
    ZI_YV: 99999999,
}

//常用货币的ItemID
const CustomDialogId = {
    ACTIVITY_SIGNIN_TITLE: 99000005,
    ACTIVITY_SIGNIN_HERO_TIPS: 99000006,
    ACTIVITY_SIGNIN_REFRESH_TIPS: 990000011,
    ACTIVITY_LEVELREWARD_TITLE: 99000007,
    ACTIVITY_LEVELREWARD_TITLE2: 99000008,
    ACTIVITY_LEVELREWARD_CHARGE: 99000009,
    ACTIVITY_LOTTERY_TITLE: 99000047,
    SUMMON_TWENTY_INTRODUCE: 99000012,
    PVP_IMMORTAL_INTRODUCE: 99000026,
    SUMMON_CARD_TIPS: 99000027,
    SUMMON_TWENTY_TIPS: 99000028,
    CHAT_DEFAULT_MSG: 99000029,
    BATTLE_PASS_BUY: 99000044,
    BATTLE_PASS_FOREVER: 99000045,
    PVP_RANKCHANGE_DESC: 1000006,
    UNOPEN: 1000012,
    GRADE_NO_MATCH: 1000119,
    TASK_NO_FINISH: 1000014,
    NET_RECONNECTING: 1000015,
    NET_DISCONNECT: 1000016,
    CHAT_ADD_BLOCK: 1000017,
    CHAT_REMOVE_BLOCK: 1000018,
    CHAT_SET_BUBBLE: 1000019,
    CHAT_EMPTY: 1000020,
    CHAT_GUILD_NO_EXIST: 1000118,
    ACTIVITY_GET_HP: 1000021,
    ACTIVITY_ITEM_NO_ENOUGH: 1000022,
    ANTI_ADDICTION: 1000023,
    BAG_ITEM_USED: 1000024,
    BAG_ITEM_NO_ENOUGH: 1000025,
    BAG_ITEM_NO_SUPPORT: 1000026,
    EQUIP_BREAK_MAT_NO_AVALIABLE: 1000027,
    EQUIP_BREAK_MATCH_LIMIT: 1000028,
    EQUIP_BREAK_GOLD_NO_ENOUGH: 1000029,
    EQUIP_BREAK_MAT_NO_ENOUGH: 1000030,
    EQUIP_BREAK_SUCCESS: 1000031,
    EQUIP_ENHANCE_LIMIT: 1000032,
    EQUIP_ENHANCE_GOLD_NO_ENOUGH: 1000033,
    EQUIP_ENHANCE_SUCCESS: 1000034,
    EQUIP_SPIRIT_SAVED: 1000035,
    EQUIP_SPIRIT_MAT_NO_SELECT: 1000036,
    EQUIP_SPIRIT_GOLD_NO_ENOUGH: 1000037,
    EQUIP_SPIRIT_MAT_NO_ENOUGH: 1000038,
    DREAMLAND_GOLD_NO_ENOUGH: 1000040,  
    DREAMLAND_HP_NO_ENOUGH: 1000041,
    DREAMLAND_DIAMOND_NO_ENOUGH: 1000042,
    DREAMLAND_TICKET_NO_ENOUGH: 1000043,
    GUILD_NO_APPLYMENT: 1000044,
    GUILD_INPUT_NAME: 1000045,
    GUILD_INPUT_INVALID: 1000046,
    GUILD_CHOOSE_REASON: 1000047,
    GUILD_OPREATE_NO_SELF: 1000048,
    GUILD_OPREATE_NO_AUTH: 1000049,
    GUILD_APPLY_LIMIT: 1000050,
    HERO_EQUIP_NO_AVALIABLE: 1000051,
    HERO_EQUIP_OFF: 1000052,
    HERO_EQUIP_ON: 1000053,
    HERO_NO_EQUIP: 1000055,
    HERO_EQUIP_CONDITION: 1000056,
    HERO_GIFT_ACTIVED: 1000057,
    HERO_GRADE_NO_MATCH: 1000058,
    HERO_GIFT_CONDITION: 1000059,
    HERO_GIFT_SKILL_CHANGED: 1000060,
    HERO_FRIEND_SAME: 1000061,
    HERO_FRIEND_UNOPEN: 1000062,
    HERO_POWER_FILTER_NO_SUPPORT: 1000063,
    HERO_GAIN_NEW: 1000064,
    HERO_UPGRADE_SUNCESS: 1000065,
    HERO_CHIPS_NO_ENOUGH: 1000066,
    INFO_CHANGE_NAME: 1000067,
    INFO_EXCHANGE: 1000068,
    INFO_HEAD_NO_AVALIABLE: 1000069,
    INFO_CHANGE_HEAD: 1000070,
    PVE_NINEHELL_HERO_BAN: 1000071,
    LEVELMAP_NO_DEFAULT_SQUAD: 1000072,
    LEVELMAP_HP_NO_ENOUGH: 1000073,
    LEVELMAP_GRADE_NO_MATCH: 1000074,
    LOGIN_SEVER_CHANGING: 1000075,
    LOGIN_PROTOCOL_CHECK: 1000076,
    MAIL_AUTO_REMOVED: 1000077,
    MAIL_TOKEN: 1000078,
    MAIL_AUTO_TOKEN: 1000079,
    GTE_HP_BUY_SUCCESS: 1000080,
    GTE_HP_EXCHANGE_SUCCESS: 1000081,
    GTE_HP_ITEM_NO_ENOUGH: 1000082,
    GTE_HP_ITEM_NO_AVALIABLE: 1000083,
    PARKOUR_ONE_ROLE_LEAST: 1000084,
    PRAGMATIC_NO_SKILL: 1000085,
    PRAGMATIC_ITEM_NO_ENOUGH: 1000086,
    PREINSTALL_TEAM_FULL: 1000087,
    PREINSTALL_TEAM_NO_CHANGE: 1000088,
    PREINSTALL_TEAM_SAVED: 1000089,
    PVE_DOUBLE_ITEM_NO_ENOUGH: 1000090,
    PVE_TICKET_NO_ENOUGH: 1000091,
    PVE_GRADE_NO_MATCH: 1000092,
    PVE_TASK_NO_MATCH: 1000093,
    PVP_IMMORTAL_GOLD_NO_ENOUGH: 1000094,
    PVP_TICKET_NO_ENOUGH: 1000095,
    BATTLE_ONE_ROLE_LEAST: 1000096,
    BATTLE_RANK_CHANGED: 1000097,
    BATTLE_NO_SQUAD: 1000098,
    BATTLE_TEAM_FULL: 1000099,
    LIMIT_SHOP_TIPS1: 1000100,
    LIMIT_SHOP_TIPS2: 1000101,
    SHOP_GIFT_NO_SUPPORT: 1000102,
    SHOP_MATCH_LIMIT: 1000005,
    SMELT_GOLD_NO_ENOUGH: 1000104,
    SMELT_CHOOSE_CORE: 1000125,
    SMELT_MAT_NO_ENOUGH: 1000106,
    SUMMON_ALREADY_STASHED: 1000107,
    SUMMON_CHOOSE_RESULT: 1000108,
    SUMMON_STASHED: 1000109,
    SUMMON_BATTLE_PASS_OPEND: 1000110,
    SUMMON_ITEM_NO_ENOUGH: 1000111,
    TASK_NO_DESTINATION: 1000112,
    LIMIT_SHOP_TIPS3: 1000113,
    LIMIT_SHOP_TIPS4: 1000114,
    LIMIT_SHOP_ITEM_NO_ENOUGH: 1000115,
    LIMIT_SHOP_SOLD_OUT: 1000116,
    GUILD_CHANGENAME_ITEM_NOTENOUGH: 1000117,
    GUILD_DISBAND: 2000013,
    CONFIRM_OPERATION: 2000001,
    SMELT_NO_ENOUGH: 1000122,
    SEVENDAY_UNOPEN: 1000123,
    REVERT_NO_EQUIP: 1000126,
    COMMON_ITEM_NOT_ENOUGH: 1000127,
    RANDOM_SHOP_TIPS: 1000129,
    RANDOM_SHOP_OVERTIME: 1000130,
    EQUIP_MEET_CURRENT_MAX_LEVEL: 1000140,
    EQUIP_ONCE_ENHANCE_CONFIRM_TITLE: 99000063,
    EQUIP_ONCE_ENHANCE_CONFIRM_CONTENT: 99000064,
    PVE_CHANLLENGE_RULE_CONTENT: 99000065,
    /**蓬莱仙岛相关*/
    PVE_ISLAND_RESUREGENCE: 99000072,
    PVE_ISLAND_RECOVE_HALF_HP: 99000073,
    PVE_ISLAND_RECOVE_ALL_HP_REDUCEITEM: 99000074,
    PVE_ISLAND_BATTLE_RULE: 99000076,
    PVE_ISLAND_GAME_RULE: 99000082,
    PVE_ISLAND_PORTAL_DES: 99000083,
    PVP_PEAK_DUEL_RULE:99000088,
}


const DEFAULT_ROLE_SP = `spine/role/FuXi_model`;

//最大百分比
const FULL_PERCENT = 10000;
const EnemySquadMaxCount: number = 3;           // 敌方阵容最大队伍数
const EnemySquadOneTeamMaxCount: number = 5;    // 敌方阵容每队最大人数
const Channel_Max_Num: number = 20;             // 登录界面每个最多展示多少个
const Start_HeroBasic_Id: number = 113111;      // 英雄的起始id
const End_HeroBasic_Id: number = 185311;        // 英雄的终止id
const Hero_Ability_Max: number = 10;            // 英雄属性的最大值
const HERO_ENERGY_MAX: number = 200;            // 英雄能量的最大值

//动态加载资源路径前缀
const RES_ICON_PRE_URL = {
    SKILL: 'textures/icon-skill/',
    HERO_TYPE: 'textures/hero-type/',
    BAG_ITEM: `textures/item`,
    CHAT_BUBBLE: `textures/chat-bubble-bg`,
    HEAD_IMG: `textures/head-hero`,
    HEAD_FRAME: `textures/head-frame`,
    HERO_PHOTO: `textures/hero-model`,
    SHOP: "textures/shop",
    DREAMLAND: "textures/dreamland",
    ACTIVITY: "textures/activity",
    PVE: "textures/pve-image",
    INTRODUCE_NAME: "textures/hero-name",
    BUFF_ICON: "textures/icon-skill/",
    ONLINE:"textures/online",
    BEAST_MODEL: "textures/beast-model/",
    HEAD_QUALITY: "textures/head-quality/"
}

const EQUIP_MAX_STAR = 6;
const MAX_SIMULATE = 20;    // 20连抽模拟次数
const MAX_ROLE_TEAM = 5;    // 战斗每个队伍最大数
const SUBSTITU_MOVE_TIME = 0.2; // 跑过去坦攻的移动时间

//宝物权益类型
const TREASURE_SYS_POWER_TYPE  = {
  YU_JING_PING:             10001,                    //玉净瓶
  JIU_MING_SHEN_QIAN:       10002,                    //九命神签
  CAI_SHEN_JIN_NANG:        10003,                    //财神锦囊
  YUE_GUANG_BAO_HE:         10004,                    //月光宝盒
  GE_SHI_HUA_LONG:          10005,                    //隔世花笼
  QIAN_KUN_BAI_BAO_DAI:     10006,                    //乾坤百宝袋
  HUN_AN_LUO_YI:            10007,                    //混暗罗仪
  SHUI_SHEN_HUA_JI:         10008,                    //水神画戟
  SHEN_FENG_WU_YING:        10009,                    //神锋无影
  ITAN_JI_QIN:              10010,                    //天玑琴
  YUAN_GU_FENG_YIN:         10011,                    //远古封印符咒
  TONG_LING_TIE:            10012,                    //通灵帖
  RI_YUE_ZHU:               10013,                    //日月珠
  ZI_JIN_BO_YU:             10014,                    //紫金钵盂
  ZI_JIN_HU_LU:             10015,                    //紫金葫芦
  LING_YE_GUO:              10016,                    //灵晔果
  SUAN_ZHU_YU_PAN:          10017,                    //算珠玉盘
  LING_LONG_XIN:            10018,                    //七巧玲珑心
  YIN_GUO_DUN:              10019,                    //因果盾
  PAN_BI:                   10020,                    //判笔
  WU_ZI_JUAN:               10021,                    //无字卷
  SHEN_TU:                  10022,                    //神荼
  YAO_QIAN_SHU:             10023,                    //摇钱树
  HUI_YAO_LING_FAN:         10024,                    //回耀灵幡
  DING_JIE_MAO_DIAN:        10025,                    //定界锚点
  JI_XIE_RI_XIN:            10026,                    //机械日心
  LEI_MING_GU:              10027,                    //九转雷鸣鼓
  BA_GUA_LU:                10028,                    //八卦炉
}

//和宝物有关的商品集合，key: 商品ID   value: LeadTreasure表中影响商品的项
const PRODUCR_WITH_TREASURE_MAP: {[idx: number]: number} = {
  310001 : TREASURE_SYS_POWER_TYPE.PAN_BI,
  320003 : TREASURE_SYS_POWER_TYPE.WU_ZI_JUAN,
};

//无效英雄标记,
const INVALID_HERO_TAG = 0;

// 全局点击的最少间隔，防止多点触碰
const GLOBAL_CLICK_INTERVAL = 200

//首充对应的FunctionConfig表中的ID
const FIRST_CHARGE_FUNC_ID = 42000;
//随机商店对应的FunctionConfig表中的ID
const RANDON_SHOP_FUNC_ID = 49000;
//随机战斗对应的FunctionConfig表中的ID
const RANDON_FIGHT_FUNC_ID = 50000;
//限时礼包对应的FunctionConfig表中的ID
const LIMIT_TIME_GIFT_FUNC_ID = 46000;
// 首充礼包ID
const FIRST_CHARGE_GIFT_ID = 350201;
// 活动预览对应的FunctionConfig表中的ID
const ACTIVITY_PREVIEW_FUNC_ID = 55000;

/** 玄铁换算到经验的比例 */
const XUANTIE_TO_EXP = 1;
const BEAST_RECHANGE_EXP = 1;
/**pvp多阵容 最大组数*/
const PVP_MULT_BALLTE_MAX = 3;

/** 卦象 */
const TRIGRAMS = ['', '天', '地', '风', '雷', '水', '火', '山', '泽'];

const PVE_LIST_TITLE: any = {
    1: '体力试炼',
    2: '日常试炼',
    3: '极限试炼',
    4: '限时试炼',
}

export {
    SCENE_NAME,
    ResConfig,
    VIEW_NAME,
    ModuleName,
    EnemySquadMaxCount,
    EnemySquadOneTeamMaxCount,
    Channel_Max_Num,
    Start_HeroBasic_Id,
    End_HeroBasic_Id,
    Hero_Ability_Max,
    CustomItemId,
    FULL_PERCENT,
    RES_ICON_PRE_URL,
    EQUIP_MAX_STAR,
    MAX_SIMULATE,
    MAX_ROLE_TEAM,
    SUBSTITU_MOVE_TIME,
    DEFAULT_ROLE_SP,
    CustomDialogId,
    PRODUCR_WITH_TREASURE_MAP,
    TREASURE_SYS_POWER_TYPE,
    GLOBAL_CLICK_INTERVAL,
    INVALID_HERO_TAG,
    FIRST_CHARGE_FUNC_ID,
    RANDON_SHOP_FUNC_ID,
    RANDON_FIGHT_FUNC_ID,
    LIMIT_TIME_GIFT_FUNC_ID,
    ACTIVITY_PREVIEW_FUNC_ID,
    XUANTIE_TO_EXP,
    HERO_ENERGY_MAX,
    FIRST_CHARGE_GIFT_ID,
    PVP_MULT_BALLTE_MAX,
    TRIGRAMS,
    BEAST_RECHANGE_EXP,
    PVE_LIST_TITLE
}
