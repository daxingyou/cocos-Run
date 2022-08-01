/*
 * @Author: fly
 * @Date: 2021-03-16 13:57:38
 * @LastEditTime: 2022-05-19 18:31:27
 * @Description: 事件定义
 */

let _curEvtId: number = 0;
function _newEvtId() {
    _curEvtId++;
    return _curEvtId;
};

let commonEvent = {
    EVENT_TEST: _newEvtId(),
    GAME_RESUME: _newEvtId(),
    GAME_PAUSE: _newEvtId(),
    CAPABILITY_CHANGE: _newEvtId(),
    UPDATE_CAPABILITY: _newEvtId(),
    GLOBAL_TIPS: _newEvtId(),
    TIME_DAY_RESET: _newEvtId(),
    TIME_WEEK_RESET: _newEvtId(),
    NEW_TASK_FINISHED: _newEvtId(),
    CHECKOUT_ACCOUNT: _newEvtId(),
    RESTART_CURR_GAME: _newEvtId(),// 重新开始当前游戏，可能是战斗可能是跑酷
    HIDE_LOADING: _newEvtId(),
    SVR_ERROR: _newEvtId(),
    JUMP_MODULE: _newEvtId(),
    USERDATA_REFRESH: _newEvtId()   // 数据跨天更新
}

let testEvent = {
    EVENT_SKILL_TEST: _newEvtId(),
}

let netEvent = {
    LOGIN_RESULT: _newEvtId(),
    NET_CHECK_ACC_RES: _newEvtId(),
    NET_LOGIN_SUCC: _newEvtId(),
    NET_LOGIN_FAIL: _newEvtId(),
    NET_CLOSED: _newEvtId(),
    NET_RECONNECTED: _newEvtId(),
    RECV_SERVER_RES: _newEvtId(),

    // 测试用
    SWITCH_NET: _newEvtId(),
}

//跑酷事件
let parkourEvent = {
    MAP_INIT_FINISH: _newEvtId(),   //地图初始化完成
    GO_DOWN: _newEvtId(),  //速降点击
    GO_UP: _newEvtId(),    //上跳点击
    MAP_FAST_MOVE: _newEvtId(),   //地图快速移动
    MAP_STOP_MOVE: _newEvtId(),     //地图停止移动
    MAP_NORMAL_MOVE: _newEvtId(),   //地图正常移动
    ACTOR_ENTER_FINISH: _newEvtId(),    //主角进入场景
    LEVEL_FINISH: _newEvtId(),    //通关
    UPDATE_HP: _newEvtId(),    //更新血量
    UPDTAE_ITEM: _newEvtId(),   //更新道具
    ADD_BUFF: _newEvtId(),  //增加BUFF
    REMOVE_BUFF: _newEvtId(),   //移除buff
    RELIVE: _newEvtId(),    //复活
    PRODUCT_ITEM: _newEvtId(),  //生成道具
    CAMERA_MOVE: _newEvtId(),    //相机移动
    USE_ITEM: _newEvtId(),    //使用道具
    UPDATE_LEVEL_PROGRESS: _newEvtId(), //更新关卡进度
    SHOOT: _newEvtId(), //射击
    RESET_OPERATE_TYPE: _newEvtId(),    //重置操作方式
    SHOW_RESULT: _newEvtId(),   //展示结算
    PAUSE_LOGIC: _newEvtId(),   //暂停逻辑帧
    RESUME_LOGIC: _newEvtId(),  //继续逻辑帧
    CHANGE_DEBUG_CONFIG: _newEvtId(),   //debug模式下修改配置
    SHOW_RESUME_COUNT_DOWN: _newEvtId(), //继续倒计时
    AUTO_PLAY: _newEvtId(),  //自动模式
    ADD_BOOM_EFFECT: _newEvtId(),  //增加爆炸特效
    EXIT_CURR_GAME: _newEvtId(),  //退出
}

// opt -> view
let battleEvent = {
    VIEW_UPDTAE_TIMER: _newEvtId(),
    BATTLE_TIMER_TICKING: _newEvtId(),
    BATTLE_START: _newEvtId(),
    ROUND_START: _newEvtId(),
    ROUND_ACTION: _newEvtId(),
    ROUND_POSE_EFFECT: _newEvtId(),
    ROUND_END: _newEvtId(),
    CHANGE_IDLE: _newEvtId(),
    BATTLE_END: _newEvtId(),
    EFFECT_EVENT: _newEvtId(),
    STATE_ANIM_FINISH: _newEvtId(),
    CLOSE_BATTLE_POP: _newEvtId(),
    ROLE_STATE_CHANGE: _newEvtId(),

    ENTER_PVE_FAIL: _newEvtId(),
    FINISH_PVE_RES_FAIL: _newEvtId(),
}

//战斗统计事件
let battleStatisticEvent = {
    START_BATTLE_NO_VIEW: _newEvtId(),
    BATTLE_START: _newEvtId(),
    ROUND: _newEvtId(),
    EFFECT_EVENT:_newEvtId(),
    BATTLE_END: _newEvtId(),
    OPEN_STATISTIC_VIEW: _newEvtId(),
}

/**
 * 关卡数据事件
 */
let lvMapViewEvent = {
    ENTER_PVE_RES: _newEvtId(),
    FINISH_PVE_RES: _newEvtId(),
    LESSON_STAGE_REWARD_RES: _newEvtId(),
    CHAPTER_STAGE_REWARD_RES: _newEvtId(),
}

/**
 * 登录事件
 */
let loginEvent = {
    SDK_INIT_COMPLETE: _newEvtId(),
    SDK_LOGIN_SUCC: _newEvtId(),
    SDK_LOGIN_FAIL: _newEvtId(),
    SDK_LOGOUT: _newEvtId(),
    SDK_AUTH: _newEvtId(),

    SELECT_CHANNEL: _newEvtId(),
    LOGIN_SUCCESS: _newEvtId(),
    CHANGE_BIGCHANNEL: _newEvtId(),
    CHANGE_NOTICE: _newEvtId(),
    RECV_ROMATECFG: _newEvtId(),
}
/**
 * 用户信息界面
 */
let useInfoEvent = {
    USER_HEAD_CHANGE: _newEvtId(),
    USER_NAME_CHANGE: _newEvtId(),
    USER_EXP_CHANGE: _newEvtId(),
    USER_LEVEL_CHANGE: _newEvtId(),
    USER_MSG_NOTIFY: _newEvtId(),
    GAME_EXP_ADD: _newEvtId(),
    USE_EXCHANGE_CODE: _newEvtId(),
    SAGE_QA_RES: _newEvtId(),
    UNIVERSAL_VIEW_USER_INFO: _newEvtId(),
    REPORT_USER: _newEvtId(),
}
/**
 * 英雄界面事件
 */
let heroViewEvent = {
    COMPOUND_HERO_SUC: _newEvtId(),
    ADD_HERO_STAR_SUC: _newEvtId(),
    HERO_DRESS_EQUIP: _newEvtId(),
    HERO_UNDRESS_EQUIP: _newEvtId(),
    HERO_ONCE_DRESS_EQUIP: _newEvtId(),
    HERO_ONCE_UNDRESS_EQUIP: _newEvtId(),
    OPEN_EQUIP_LIST_VIEW: _newEvtId(),
    GAIN_GIFT: _newEvtId(),
    SELECT_GIFT_SKILL: _newEvtId(),
    HERO_POWER_CHANGE: _newEvtId(),
}
/**
 * 背包界面事件
 */
let bagDataEvent = {
    ITEM_CHANGE: _newEvtId(),
    ITEM_USE: _newEvtId(),
    EQUIP_ENHANCED: _newEvtId(),
    EQUIP_BROKE: _newEvtId(),
    EQUIP_CAST_SOUL: _newEvtId(),
    EQUIP_CAST_SOUL_CHOOSE: _newEvtId(),
    SMELT_SUCCESS: _newEvtId(),
    SPLIT_SUCCESS: _newEvtId(),
    REVERT_SUCCESS: _newEvtId(),
    GUILD_EXP_CHANGE: _newEvtId(),
    EQUIP_TOTAL_ENHANCED: _newEvtId()
}
/**
 * 邮件模块事件
 */
let mailEvent = {
    READ: _newEvtId(),
    CLEAR: _newEvtId(),
    TAKE: _newEvtId(),
    TAKE_ALL: _newEvtId(),
}
/**
 * 聊天模块事件
 */
let chatEvent = {
    CHAT_NOTIFY: _newEvtId(),
    ADD_BLOCK: _newEvtId(),
    RMV_BLOCK: _newEvtId(),
    SEND_MSG_RES: _newEvtId(),
}

/**
 * 商店事件
 */
let shopEvent = {
    BUY_PRODUCT: _newEvtId(),
    BUY_CHARGE: _newEvtId(),
    BUY_GIFT: _newEvtId(),
    BUY_CURRENCY_GIFT: _newEvtId(),
    BUY_RANDOM: _newEvtId(),
    REFRESH_RANDOM: _newEvtId(),
    RECV_FIRST_CHARGE_REWARD: _newEvtId(),
}

/**
 * 召唤抽卡事件
 */
let gachaEvent = {
    GACHA_RES: _newEvtId(),
    SIMULATE_RES: _newEvtId(),
    SAVE_SIMULATE_RES: _newEvtId(),
    SELECT_SIMULATE_RES: _newEvtId(),
    BUY_BATTLEPASS_RES: _newEvtId(),
}

/**
 * 预设编队事件
 */
let pveTeamEvent = {
    SAVE_TEAM: _newEvtId(),
}

/**
 * 太虚幻境事件
 */
let dreamlandEvent = {
    ENTER_PVE_RES: _newEvtId(),
    FINISH_PVE_RES: _newEvtId(),
    CHAP_REWARD_TOKEN: _newEvtId()
}

/**
 * 日常试炼事件
 */
let dailyLessonEvent = {
    ENTER_PVE_DAILY_RES: _newEvtId(),
    FINISH_PVE_DAILY_RES: _newEvtId(),
    ENTER_PVE_RISEROAD_RES: _newEvtId(),
    FINISH_PVE_RISEROAD_RES: _newEvtId(),
    SWEET_PVE_RES: _newEvtId(),
}

/**
 * 云端梦境
 */
let cloudDreamEvent = {
    ENTER_PVE_RES: _newEvtId(),
    FINISH_PVE_RES: _newEvtId(),
    TAKE_REWARD_RES: _newEvtId(),
    SYNC_CLOUD_INFO: _newEvtId(),
}

/**
 * 九幽森罗
 */
let nineHellEvent = {
    ENTER_PVE_RES: _newEvtId(),
    FINISH_PVE_RES: _newEvtId(),
    SYNC_HELL_INFO: _newEvtId(),
}

/**
 * 奇门遁甲
 */
let magicDoorEvent = {
    ENTER_PVE_RES: _newEvtId(),
    FINISH_PVE_RES: _newEvtId(),
    SYNC_MAGIC_INFO: _newEvtId(),
    TAKE_REWARD_RES: _newEvtId(),
}

/**
 * 致师之礼
 */
let respectEvent = {
    START_SUCCESS: _newEvtId(),
    ENTER_PVE_RES: _newEvtId(),
    REFRESH_VIEW: _newEvtId(),
    RECEIVE_AWARD: _newEvtId(),
    BUY_SHOP_SUCCESS: _newEvtId()
}

/**蓬莱仙岛事件*/
let islandEvent = {
    RECEIVE_BATTLE_RES: _newEvtId(),
    RECEIVE_BATTLE_FAIL:_newEvtId(),
    RECEIVE_RELIVE_RES: _newEvtId(),
    RECEIVE_BUFF_RES: _newEvtId(),
    RECEIVE_POTAL_RES: _newEvtId(),
    RECEIVE_ADD_HP_RES: _newEvtId(),
    RECEIVE_TRANS_GATE_RES: _newEvtId(),
}

// 心魔法相
let trialDevilEvent = {
    RECV_RANK_LIST: _newEvtId(),
    ENTER_PVE_RES: _newEvtId(),
}

/**
 * 无间炼狱
 */
let purgatoryEvent = {
    REFRESH_VIEW: _newEvtId(),
    REVIVE_SUCCESS: _newEvtId(),
    UNMASK_POINT: _newEvtId(),
    PURCHASE_RESULT: _newEvtId(),
    HP_ALTAR: _newEvtId(),
    LIVE_ALTAR: _newEvtId(),
    ENTER_PVE_RES: _newEvtId()
}

/**
 *  斩将封神玩法事件
 */
let deifyCombatEvent = {
    ENTER_PVP_RES: _newEvtId(),
    FINISH_PVP_RES: _newEvtId(),
    CHANGE_ENEMY: _newEvtId(),
    CHANGE_ENEMY_LIST: _newEvtId(),
    CHANGE_RANK: _newEvtId(),
    CHANGE_DEFENSE: _newEvtId(),
    GET_ENEMY_LIST: _newEvtId(),
}

/**
 *  论道修仙玩法事件
 */
let immortalsEvent = {
    ENTER_PVP_RES: _newEvtId(),
    FINISH_PVP_RES: _newEvtId(),
    CHANGE_TICKET: _newEvtId(),
    GET_RANK: _newEvtId(),
}

/**
 * 排行榜界面事件
 */
let rankViewEvent = {
    REVE_RANK_HOME_RES: _newEvtId(),
    RECV_FIVE_RANK_RES: _newEvtId(),
    RECV_ALL_RANK_RES: _newEvtId(),
    RECV_ONE_RANK_RES: _newEvtId(),
    RECV_ADVENTURE_LIST_RES: _newEvtId(),
    RECV_DREAM_LIST_RES: _newEvtId(),
    RECV_PURGATORY_LIST_RES: _newEvtId(),
    RECV_RANK_REWARD: _newEvtId(),
    RECV_TAKE_RANK_REWARD: _newEvtId(),
}

/**
 * 巅峰对决事件
 */
let peakDuelEvent = {
    RECV_RANK_RES: _newEvtId(),
    RECV_CHANGE_ENEMY_RES: _newEvtId(),
    RECV_CHANGE_DEVENSIVE_TEAM_RES: _newEvtId(),
    PEAK_DUEL_TASK_GOTO_NTY: _newEvtId(),
    HERO_MULT_CHANGE_NTY: _newEvtId(),
    ENTER_PVP_RES: _newEvtId(),
    FINIS_PVP_NTY: _newEvtId(),
    ENTER_BATTLE_NTY: _newEvtId(),
    RANK_INTERGEL_NTY: _newEvtId(),
}

let guildWarEvent = {
    FIRE_TARGET_CHOSE_RES: _newEvtId(),
    ATTACK_SUCC_RES: _newEvtId(),
    TEAR_DOWN_SUCC: _newEvtId(),
    OPEN_CAMP_NTF: _newEvtId(),
    GUILD_WAR_OVER: _newEvtId(),
    CHOSE_GUILD_CAMP_OPT_RES: _newEvtId(),
}

/**
 * 限时活动事件
 */
let timeLimitEvent = {
    RECV_RANDOM_SHOP_EVENT: _newEvtId(),
    RECV_RANDOM_FIGHT_EVENT: _newEvtId(),
    FIGHT_LIMIT_TIME_END: _newEvtId(),
    RECV_BUY_SHOPITEM: _newEvtId(),
    ENTER_RANDOM_FIGHT_BATTLE: _newEvtId(),
    END_RANDOM_FIGHT_BATTLE: _newEvtId(),
    REVCE_QUERY_LIMIT_TIME_GIFT_BAG:_newEvtId(),
}

let divineEvent = {
    RECV_TASK_LIST: _newEvtId(),
    DISPATCH_SUC_EVENT: _newEvtId(),
    RECEIVE_REWARD: _newEvtId(),
    CANCEL_TASK_SUC: _newEvtId(),
}

/** 阴阳宝鉴事件 */
let yyBookEvent = {
    ACTIVE_TRIGRAMS: _newEvtId(),
    ENTER_RES: _newEvtId(),
    FINISH_RES: _newEvtId(),
    REFRESH_VIEW: _newEvtId()
}

/**
 * 活动事件
 */
let activityEvent  = {
    RECV_POWER_RES: _newEvtId(),
    RECV_SIGNIN_FLOP_RES: _newEvtId(),
    RECV_SIGNIN_HERO_CHANGE: _newEvtId(),
    RECV_SIGNIN_GET_HERO: _newEvtId(),
    LEVEL_RECHARGE_CHANGE: _newEvtId(),
    LEVEL_REWARD_TAKE: _newEvtId(),
    SEVENDAY_REWARD_TAKE: _newEvtId(),
    LOGIN_REWARD_TAKE: _newEvtId(),
    BATTLE_PASS_REWARD_TAKE: _newEvtId(),
    BATTLE_PASS_BUY: _newEvtId(),
    BATTLE_PASS_BUY_LEVEL: _newEvtId(),
    BATTLE_PASS_RESET: _newEvtId(),
    SPIRIT_TIME_REFRESH: _newEvtId(),
    LOTTERY_TAKE_RES: _newEvtId(),
    LOTTERY_CHANGE_NOTIFY: _newEvtId(),
    DALIY_RECHARGE_TAKE_RES: _newEvtId(),
    DALIY_RECHARGE_CHANGE_NOTIFY: _newEvtId(),
    CUMULATIVE_ECHARGE_TAKE_RES: _newEvtId(),
    CUMULATIVE_RECHARGE_CHANGE_NOTIFY: _newEvtId(),
    REBATE_RECHARGE_RES: _newEvtId(),
    DALIY_DATA_CLEAR_NOTIFY: _newEvtId(),
    DOUBLE_WEEK_REWARD_EXCHANGE_SUC: _newEvtId(),
    DOUBLE_WEEK_GIFT_BUY_SUC: _newEvtId(),
    BUY_MONTHLY_CARD_SUC: _newEvtId(),
    RECEIVE_MONTHLY_CARD_DAY_REWARD: _newEvtId(),
    RECV_HERO_GROW_UP_REWARD: _newEvtId(),
    RECV_BUY_HERO_GROW_UP_REWARD: _newEvtId(),
    RECV_ETERNAL_RECHARGE_RES: _newEvtId(),
    ERERNAL_RECHARGE_CHANGE_NTF: _newEvtId(),
    RECV_FEAST_GIFT_RES: _newEvtId(),
    FEAST_GIFT_CHANGE_NTF: _newEvtId(),
    DOUBLE_WEEK_BUY_BATTLE_PASS_NTY: _newEvtId(),
    DOUBLE_WEEK_TAKE_BATTLE_PASS_REWARD: _newEvtId(),
	LUXURY_GIFT_BUY_GIFT_NOTIFY: _newEvtId(),
    LUXURY_GIFT_RECEIVE_REWARD_RES: _newEvtId()
}

let antiAddictionEvent = {
    SHOW_ANTI_ADDICTION: _newEvtId(),
    ANTI_ADDICTION_TIMEOUT: _newEvtId(),
}

let pragmaticEvent = {
    CHANGE_LEAD_SKILL_SUC: _newEvtId(),
    RESET_LEAD_SKILLS_SUC: _newEvtId(),
    UPDTAE_WU_DAO_LV: _newEvtId(),
}

let taskEvent = {
    CHANGE_PROGRESS: _newEvtId(),
    RECEIVE_REWARD: _newEvtId(),
    RECEIVE_SEVEN_DAY_REWARD: _newEvtId(),
    TREASURE_ACHIEVE_COUNT_NTY: _newEvtId(),
}

let hangUpEvent = {
    HANGUP_PREVIEW_RES: _newEvtId(),
    HANGUP_REWARD_RES: _newEvtId(),
    HANGUP_CHAPTER_CHANGE: _newEvtId(),
    HANGUP_FAST_RES: _newEvtId(),
    REFRESH_VIEW: _newEvtId()
}

let onlineEvent = {
    TIME_REFLASH: _newEvtId(),
    ONLINE_REWARDS_RES: _newEvtId(),
    ITEM_STATE_NTY: _newEvtId(),
    AUTO_RECIVE_CHECK: _newEvtId(),
    REWARD_RES_NTY: _newEvtId(),
}

let mainTaskEvent = {
    MAIN_TASK_RES: _newEvtId(),
}

const CGEvent = {
    PLAY_CG: _newEvtId(),
}

//结算界面事件
const GameResultEvent = {
    PRE_CLOSE: _newEvtId()
}

const GuideEvents = {
    UPDATE_GUIDE_CFGS: _newEvtId(),
}

//攻略
const StrategyEvents = {
    RECV_STRONG_RES: _newEvtId(),
    RECV_HERO_RES: _newEvtId(),
}

//三皇供奉
const ConsecrateEvents = {
    RECV_ADD_TRIBUTE: _newEvtId(),
    RECV_REMOVE_TRIBUTE: _newEvtId(),
    RECV_SPEED_TRIBUTE: _newEvtId(),
    RECV_TAKE_TRIBUTE_REWARD: _newEvtId(),
    RECV_TAKE_LV_REWARD: _newEvtId(),
    RECV_TAKE_BEFALL_REWARD: _newEvtId(),
}

let guildEvent = {
    UPDATE_GUILDS_LIST: _newEvtId(),
    UPDATE_GUILD_INFO: _newEvtId(),
    FIRE_OUT_GUILD: _newEvtId(),
    UPDATE_GUIDE_INFO: _newEvtId(),
    UPDATE_GUILD_MEMBER_INFO: _newEvtId(),
    APPLY_JOIN: _newEvtId(),
    CREATE_GUILD: _newEvtId(),
    CHANGE_NAME:_newEvtId(),
    DISBAND_GUILD: _newEvtId(),
    CHANGE_NOTICE: _newEvtId(),
    CHANGE_CLOSE_APPLY: _newEvtId(),
    CHANGE_AUTO_APPROVE: _newEvtId(),
    CHANGE_MIN_LV: _newEvtId(),
    CHANGE_APPLY_LIST: _newEvtId(),
    CHANGE_MEMBER_LIST: _newEvtId(),
    UPDATE_DAILY_NEWS: _newEvtId(),
    JOIN_FIGHT_SUC: _newEvtId(),
    FIGHT_INSPIRE_SUC: _newEvtId(),
    RECV_REWARD: _newEvtId(),
    UPDATE_BOSS_VIEW: _newEvtId(),
    SIGN_IN: _newEvtId(),
    UPDATE_DONATE: _newEvtId(),
}

export {
    commonEvent,
    netEvent,
    parkourEvent,
    battleEvent,
    lvMapViewEvent,
    loginEvent,
    useInfoEvent,
    heroViewEvent,
    bagDataEvent,
    mailEvent,
    chatEvent,
    pveTeamEvent,
    gachaEvent,
    divineEvent,
    dreamlandEvent,
    dailyLessonEvent,
    cloudDreamEvent,
    magicDoorEvent,
    nineHellEvent,
    shopEvent,
    rankViewEvent,
    timeLimitEvent,
    antiAddictionEvent,
    pragmaticEvent,
    deifyCombatEvent,
    immortalsEvent,
    taskEvent,
    CGEvent,
    activityEvent,
    GuideEvents,
    guildEvent,
    battleStatisticEvent,
    GameResultEvent,
    testEvent,
    hangUpEvent,
    StrategyEvents,
    onlineEvent,
    mainTaskEvent,
    ConsecrateEvents,
    respectEvent,
    islandEvent,
    trialDevilEvent,
	purgatoryEvent,
    peakDuelEvent,
    yyBookEvent,
    guildWarEvent
}

