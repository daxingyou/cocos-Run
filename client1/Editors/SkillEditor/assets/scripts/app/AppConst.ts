const SCENE_NAME = {
    BATTLE: "BattleScene",
    RUN_COOL: "ParkourScene"    //跑酷场景名
}

const VIEW_NAME = {
    MAPVIEW: "LevelMapView",
    CHANNELVIEW: "ChannelView",
    NOTICEVIEW: "NoticeView",
    HEADVIEW: "HeadView",
    GIFTVIEW: "ExchangeView",
    HEROVIEW: "HeroView",
    HEROMOREPROPERTYVIEW: 'HeroMorePropertyView',
    EQUIPPROPERTYVIEW: 'EquipPropertyView',
}

//资源路径映射
const ResConfig = {
    runCoolScenePath: "prefab/scene/ParkourScene",    //跑酷场景
}

//本地存储使用的key
const LocalStoragKeys = {
    MUSIC_VOLUMN: "MUSIC_VOLUMN",   //音乐
    EFFECT_VOLUMN: "EFFECT_VOLUMN",  //音效
    VOICE_VOLUMN: "VOICE_VOLUMN",      //语音
    OPERATE_TYPE: "OPERATE_TYPE",       //跑酷操作方式
}

const CLOCK_LEN = 1000;
const CLOCK_INTERVAL = 100;
const BATTLE_ROLE_Z = 1;
const ROLE_MOVE_TIME = 0.3;
const NORMAL_ATTACK_ID = 500000;

const EnemySquadMaxCount: number = 3;              // 敌方阵容最大队伍数
const EnemySquadOneTeamMaxCount: number = 5;       // 敌方阵容每队最大人数
const Channel_Max_Num: number = 20;       // 登录界面每个最多展示多少个
const Start_HeroBasic_Id: number = 113111;    // 英雄的起始id
const End_HeroBasic_Id: number = 185311;    // 英雄的终止id
const Hero_Ability_Max: number = 10;          // 英雄属性的最大值

export {
    SCENE_NAME,
    CLOCK_LEN,
    CLOCK_INTERVAL,
    ResConfig,
    LocalStoragKeys,
    VIEW_NAME,
    BATTLE_ROLE_Z,
    ROLE_MOVE_TIME,
    NORMAL_ATTACK_ID,
    EnemySquadMaxCount,
    EnemySquadOneTeamMaxCount,
    Channel_Max_Num,
    Start_HeroBasic_Id,
    End_HeroBasic_Id,
    Hero_Ability_Max
}
