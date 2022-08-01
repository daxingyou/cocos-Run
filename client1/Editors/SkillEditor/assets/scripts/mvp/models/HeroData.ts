import { EQUIP_PART_TYPE, EQUIP_QUALITY, EQUIP_TEXTURE_TYPE, EQUIP_YELLOW_TYPE, HERO_ABILITY, HERO_EQUIP_TYPE, HERO_FRIEND_TYPE, HERO_GIFT_TYPE, HERO_MELEEORLONG_TYPE, HERO_QUALITY, HERO_TRIGRAMS, LEVEL_EXP_TYPE, SKILL_TYPE } from "../../app/AppEnums";
import { data } from "../../network/lib/protocol";
import { modelManager } from "./ModeManager";

const { ccclass, property } = cc._decorator;


/*****************英雄系统相关的*************** */
/**
 * HeroBasicId 英雄id
 * HeroBasicName 英雄名字
 * HeroBasicQuality 英雄品质
 * HeroBasicTrigrams 卦象
 * HeroBasicEquipType 装备类型
 * HeroBasicAbility 定位
 * HeroBasicModel 模型id
 * HeroBasicCapabilityMap 五维图
 * HeroBasicPropertyLevel 四维品质
 * HeroBasicFriend 仙缘id
 * HeroBasicItem 道具碎片
 * HeroBasicSkill 必杀技
 * HeroBasicPassive 被动技
 * HeroBasicExclusive 专属id
 * HeroBasicGift 天赋id
 * HeroBasicIntroduce 介绍id
 */
interface HeroBasicInfo {
    HeroBasicId: number,
    HeroBasicName: string,
    HeroBasicQuality: HERO_QUALITY,
    HeroBasicTrigrams: HERO_TRIGRAMS,
    HeroBasicEquipType: HERO_EQUIP_TYPE,
    HeroBasicAbility: HERO_ABILITY,
    HeroBasicModel: number,
    HeroBasicCapabilityMap: string,
    HeroBasicPropertyLevel: string,
    HeroBasicFriend: string,
    HeroBasicItem: number,
    HeroBasicSkill?: string,
    HeroBasicPassive?: string,
    HeroBasicExclusive?: number,
    HeroBasicGift?: string,
    HeroBasicIntroduce?: number,
}
/**
 * 英雄仙缘信息
 * HeroFriendId 仙缘id
 * HeroFriendNeedHero 激活需求
 * HeroFriendGetSkill 激活技能
 */
interface HeroFriendInfo {
    HeroFriendId: number,
    HeroFriendType: HERO_FRIEND_TYPE,
    HeroFriendNeedHero?: string,
    HeroFriendGetSkill?: number
}
/**
 * 英雄天赋信息
 * HeroGiftId 天赋id
 * HeroGiftNeedLevel 需要等级
 * HeroGiftType 天赋类型
 * HeroGiftIcon 天赋icon
 * HeroGiftAttribute 属性值
 * HeroGiftCost 消耗道具
 */
interface HeroGiftInfo {
    HeroGiftId: number,
    HeroGiftNeedLevel: number,
    HeroGiftType?: HERO_GIFT_TYPE,
    HeroGiftIcon?: string,
    HeroGiftAttribute?: string,
    HeroGiftCost?: string
}
/**
 * 英雄属性
 * HeroId 英雄id
 * Name 英雄名字
 * Quality 英雄品质
 * Type 英雄类型
 * Trigrams 卦象
 * Hp 血量
 * HpAdd 血量增值
 * Attack 攻击
 * AttackAdd 攻击增值
 * Defend 防御
 * DefendAdd 防御增值
 * Critical 暴击
 * CriticalAdd 暴击增值
 * CriticalHarm 暴击伤害
 * CriticalHarmAdd 暴击伤害增值
 * Speed 速度
 * SpeedAdd 速度增值
 * HoldSkill 持有技能池
 * MeleeOrLong 英雄攻击距离
 */
interface HeroProperty {
    HeroId: number,
    Name: string,
    Quality: HERO_QUALITY,
    Type: HERO_EQUIP_TYPE,
    Trigrams: HERO_TRIGRAMS,
    Hp: string,
    HpAdd: string,
    Attack: string,
    AttackAdd: string,
    Defend: string,
    DefendAdd: string,
    Critical: string,
    CriticalAdd: string,
    CriticalHarm: string,
    CriticalHarmAdd: string,
    Speed: string,
    SpeedAdd: string,
    HoldSkill: string,
    MeleeOrLong: HERO_MELEEORLONG_TYPE
}
/**
 * 武器信息
 * EquipId 武器id
 * EquipName 武器名字
 * SuitId 套装id
 * Quality 品质
 * TextureType 质地
 * WhitAttack 白色攻击
 * WhiteDefend 白色防御
 * WhiteHp 白色血量
 * WhitAttackAdd 白色攻击增值
 * WhiteDefendAdd 白色防御增值
 * WhiteHpAdd 白色血量增值
 * GreenID 特殊属性 EquipGreen表
 * YellowType 黄字类型 黄字 查询 黄字属性表  技能 查询技能表
 * TellowId 黄字对应的id
 * Icon
 * Illustrate 描述
 */
interface EquipInfo {
    EquipId: number,
    EquipName: string,
    SuitId: number,
    Quality: EQUIP_QUALITY,
    TextureType: EQUIP_TEXTURE_TYPE,
    WhitAttack: number,
    WhiteDefend: number,
    WhiteHp: number,
    WhitAttackAdd: number,
    WhiteDefendAdd: number,
    WhiteHpAdd: number,
    GreenID: string,
    YellowType: EQUIP_YELLOW_TYPE,
    TellowId: number,
    Icon: string,
    Illustrate: string,
    PositionType: EQUIP_PART_TYPE,
}
/**
 * 装备铸魂信息
 * EquipCastSoulId 铸魂id
 * EquipCastSoulItemId 铸魂材料id
 * EquipCastSoulEquipPart 针对部位
 * EquipCastSoulEquipType 针对装备类型
 * EquipCastSoulPropertyId 属性id
 * EquipCastSoulValueRange 取值范围
 * EquipCastSoulMaxRange 显示范围
 * EquipCastSoulWeight 权重
 */
interface EquipCastSoul {
    EquipCastSoulId: number,
    EquipCastSoulItemId: number,
    EquipCastSoulEquipPart: string,
    EquipCastSoulEquipType: string,
    EquipCastSoulPropertyId: number,
    EquipCastSoulValueRange: string,
    EquipCastSoulMaxRange: string,
    EquipCastSoulWeight: number
}
/**
 * 技能信息
 * SkillId 技能id
 * Name 技能名字
 * Illustrate 技能描述
 * Type 技能类型
 * TakeTiming 生效时机
 * TakeTimingPrimary 生效时机主体
 * Condition 触发条件
 * ConditionValue1 条件参数
 * TargetType 目标类型
 * EffectId 技能效果id
 * ModelId 技能表现id
 * SkillLevel 技能等级
 * Icon
 * MeleeOrLong 近程or远程
 */
interface SkillInfo {
    SkillId: number,
    Name: string,
    Illustrate: string,
    Type: SKILL_TYPE,
    TakeTiming: number,
    TakeTimingPrimary: number,
    Condition: number,
    ConditionValue1: number,
    TargetType: number,
    EffectId: string,
    ModelId: number,
    SkillLevel: number
    Icon: string,
    MeleeOrLong: HERO_MELEEORLONG_TYPE
}
/**
 * 等级经验信息
 * LevelExpId 10000 + 品质 * 1000 + 等级
 * LevelExpType 类型
 * LevelExpQuality 品质
 * LevelExpLevel 等级
 * LevelExpNeedNum 升级所需经验
 */
interface LevelExp {
    LevelExpId: number,
    LevelExpType: LEVEL_EXP_TYPE,
    LevelExpQuality: EQUIP_QUALITY | HERO_QUALITY,
    LevelExpLevel: number,
    LevelExpNeedNum: number
}
/**
 * 升星信息
 * LevelStarId 10000 + 品质 * 1000 + 等级
 * LevelStarType 类型
 * LevelStarQuality 品质
 * LevelStarNum 星级
 * LevelStarNeedSelf 升星所需本体材料 英雄：本体碎片 装备：本体/本体替代材料
 * LevelStarNeedItem 升星所需要的其他材料
 * LevelStarNeedMoney 升星所需要的金币
 */
interface LevelStar {
    LevelStarId: number,
    LevelStarType: LEVEL_EXP_TYPE,
    LevelStarQuality: HERO_QUALITY,
    LevelStarNum: number,
    LevelStarNeedSelf: number,
    LevelStarNeedItem?: string,
    LevelStarNeedMoney?: number
}

export {
    LevelStar,
    LevelExp,
    SkillInfo,
    EquipCastSoul,
    EquipInfo,
    HeroProperty,
    HeroGiftInfo,
    HeroFriendInfo,
    HeroBasicInfo,
}

@ccclass
export default class HeroData {
    private _dressedEquips: data.IBagUnit[] = [];
    init() {

    }
    /**
     * 更新已经穿戴的列表
     */
    updateDressedEquips() {
        let heroList = modelManager.bagData.heroBasicList;
        for (const k in heroList) {
            let equips = heroList[k].HeroUnit.Equips;
            // 说明有装备
            if (equips.length > 0) {
                for (let j in equips) {
                    let equip = equips[j];
                    if (this._dressedEquips.indexOf(equip) == -1) {
                        this._dressedEquips.push(equip);
                    }
                }
            }
        }
    }
    /**
     * 获得英雄身上的装备
     * @param heroInfo 
     * @returns 
     */
    getHeroEquips(heroInfo: data.IBagUnit) {
        return heroInfo.HeroUnit.Equips;
    }
    /**
     * 获得英雄身上某个部位的装备
     * @param heroInfo 
     * @param partType 
     * @returns 
     */
    getHeroEquipByPart(heroInfo: data.IBagUnit, partType: EQUIP_PART_TYPE) {
        let heroEquips = this.getHeroEquips(heroInfo);
        if (heroEquips.length > 0) {
            for (const k in heroEquips) {
                let equipConfig = modelManager.bagData.getEquipBasicConfig(heroEquips[k]);
                if (equipConfig.PositionType == partType) {
                    return heroEquips[k];
                }
            }
        }
        return null;
    }
    /**
     * 根据部位筛选装备
     * @param equipPartType 
     * @returns 
     */
    getEquipsByType(equipPartType: EQUIP_PART_TYPE) {
        let equips = modelManager.bagData.equipList;
        let partEquips: data.IBagUnit[] = [];
        for (const k in equips) {
            let equipConfig: EquipInfo = modelManager.bagData.getEquipBasicConfig(equips[k]);
            // 部位相同
            if (equipConfig.PositionType == equipPartType) {
                partEquips.push(equips[k]);
            }
        }
        return partEquips;
    }
    /**
     * 判断是否装备呗装备
     * @param equip 
     * @returns 
     */
    checkEquipIsDressed(equip: data.IBagUnit) {
        return this._dressedEquips.indexOf(equip) > -1;
    }
}
