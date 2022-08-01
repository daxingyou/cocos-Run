/*
 * @Author: fly
 * @Date: 2021-03-16 11:13:51
 * @LastEditTime: 2022-06-16 09:30:21
 * @Description: 项目通用类型
 */

import { cfg } from "../config/config";
import { ITEM_RECEIVED_TYPE } from "../mvp/views/view-item/ItemBag";
import { data, gamesvr } from "../network/lib/protocol";
import { PVE_MODE, PVP_MODE } from "./AppEnums";

/**
 * common
 */
interface Vec2 {
    x: number,
    y: number
}

/**
 * 初始配置表
 */
interface ConfigBasic {
    PlayerInitialDiamonds: number,
    PlayerInitialPhysical: number,
    PlayerInitialHero: number,
    PhysicalRecoveryLimit: number,
    PhysicalRecoveryInterval: number,
    ActivityResetTime: string,
    InitialHeadPortrait: string,
    CommonAttackEnergyUp: number
}

interface HeroEquipProp {
    attack: number,
    defend: number,
    hp: number,
    green: cfg.EquipGreen
    yellow: cfg.EquipYellow,
    castSoul: {[key: number] : number},
    beast?: {[key: number]: number}
}

/**
 * 物品信息数据结构
 */
interface ItemInfo {
    itemId: number;
    num: number;
}


interface RoadViewInfo {
    index: number,
    name: string,
    posx: number,
    posy: number,
    reverse: boolean,
}

interface LessonItemViewInfo {
    hero: string,
    index: number,
    name: string,
    posx: number,
    posy: number,
    reverse: boolean,
    type: number
}

interface BagItemInfo {
    id: number,
    seq?: number,
    count?: number,
    level?: number,
    star?: number,
    isMat?: boolean,            // 材料
    prizeItem?: boolean,        // 奖励物品
    getItem?: boolean,          // 掉落物品
    richTxt?: string,           // 富文本内容
    clickHandler?: Function
    extra?: boolean,            // 是否为赠送道具
    currEquip?: number,         // 正在装备的武将ID
    isShowCurrUser?: boolean,   // 想更灵活 控制是否显示是谁使用
    isNew?: boolean,
    receivedType?: ITEM_RECEIVED_TYPE   // 领取ICON类型，传空不显示
}

interface PveConfig {
    lessonId: number,
    pveMode: PVE_MODE,
    userLv: number,
    step?: number,  // 子战斗的序号
    passStep?: number[],
    doubleDrop?: boolean,
    banHeroList?: number[],
    useDefaultSquad?: boolean,
    adventureCfg?: cfg.AdventureLesson,
    dailyCfg?: cfg.PVEDailyLesson,
    riseRoadCfg?: cfg.PVERiseRoad,
    dreamlandCfg?: cfg.PVEDreamlandLesson,
    magicCfg?: cfg.PVEDaoistMagicLesson,
    pveListId?: number,
    monsterIds?: number[],      // 怪物ID数组
    battleBg?: string,          // 战斗场景
    monsterGroupID?: number,
    pointUID?: number,          // 无间炼狱 - 地图块UID
    monsterGroupIDs?: number[]  // 怪物阵容数组
}

interface PvpConfig {
    pvpMode: PVP_MODE
    enemySerial?: number,
    enemyUID?: string,
    fightId?: number,
    buffs?: number[],
    enemyList?: {[k: string]: number},
    replay?: gamesvr.IEnterBattleResult,
    replayDetail?: data.IPVPSpiritFight,
    step?: number,//子战斗序列
    passStep?: number[],
    idx?:number,//敌人序列
    enemyInfo?: data.IRankUser   // 缓存对阵敌人的信息，用于战报显示
}

// 物品转化成碎片
interface TransPiece {
    idx?: number,
    originId: number,
    originCnt: number,
    id: number,
    count: number
}


interface TmpCache {
    BLOCK_SUMMON_MSGBOX?: boolean,
    EQUIP_SPIRIT_COLDTIME?: number
    EverydayGiveItemCfg?: Map<number, number>
    FirstChargeClicked?: boolean
    RandomFightClicked?: boolean
    RandomShopClicked?: boolean
    BeastMaxLvCfg?: Map<number, number>
    BLOCK_EQUIP_ONCE_ENHANCE_CONFIRM?: boolean,
    BLOCK_PURGATORY_SHOP_QUIT_CONFIRM?: boolean
}

interface GuildDailyNews {
    ItemType: number,
    NewsType?: number,
    Targets?: string[],
    Time: number,
    Reasons?: string[]
}

interface EquipAttr {
    attributeId: number,
    value: number,
    new?: boolean
}

interface CustomPveFinishResult {
    LessonID: any,              // 有就填，没有也别置空，用于兼容旧的显示逻辑
    Past: boolean,              // 输赢
    Prizes: data.IItemInfo[],   // 奖励
    TotalExp?: number            // 经验
    Damage?: number             //伤害量
    Exp?: number                //经验
}

export {
    Vec2,           // 二维向量
    ConfigBasic,
    ItemInfo,
    LessonItemViewInfo,
    RoadViewInfo,
    BagItemInfo,
    PveConfig,
    HeroEquipProp,
    PvpConfig,
    TransPiece,
    TmpCache,
    GuildDailyNews,
    EquipAttr,
    CustomPveFinishResult
}
