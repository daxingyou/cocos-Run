/*
 * @Author: fly
 * @Date: 2021-03-16 11:13:51
 * @LastEditTime: 2021-03-16 13:42:28
 * @Description: 项目通用类型
 */

import { MSG_TYPE } from "./AppEnums";

/**
 * common
 */
interface Vec2 {
    x: number,
    y: number
}

interface ItemChatData {
    msg: string,
    type: MSG_TYPE
}

/**
 * 模块默认数据
 * SummonCardStorageNum 默认暂存数量上限
 * PVEDreamlandFightNum 太虚幻境每日成功挑战最大次数
 * HeroGetPiece 英雄转化成碎片数量
 * PVEHellCopy PVE九幽森罗重置时间（天）
 * PVEDaoistMagicCopy PVE奇门遁甲重置时间（天）
 * PVPDeifySettleTime PVP斩将封神结算时间
 * PVPDeifyInitialRank PVP斩将封神初始排名
 * PVPDeifyFightNumMax PVP斩将封神每日次数
 */
interface ModuleInfo {
    SummonCardStorageNum: number,
    PVEDreamlandFightNum: number,
    HeroGetPiece: string,
    PVEHellCopy: number,
    PVEDaoistMagicCopy: number,
    PVPDeifySettleTime: string,
    PVPDeifyInitialRank: number,
    PVPDeifyFightNumMax: number,
    PVPDeifyResetTime: string,
    PVPDeifyBuyTimeCost: string
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

export {
    Vec2,           // 二维向量
    ItemChatData,
    ModuleInfo,
    ConfigBasic
}