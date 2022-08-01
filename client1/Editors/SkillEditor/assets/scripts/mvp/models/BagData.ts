import { ITEM_TYPE, TIMER_STATE } from "../../app/AppEnums";
import { configManager } from "../../common/ConfigManager";
import { data } from "../../network/lib/protocol";
import { optManager } from "../operations/OptManager";
import { EquipInfo, HeroBasicInfo, LevelExp, LevelStar } from "./HeroData";
import { modelManager } from "./ModeManager";

/**
 * 物品信息
 * ItemSort 所属背包标签 1：道具 2：装备 3：材料
 * ItemGetAccess 获取途径
 * ItemIntroduce 道具描述
 * ItemUseEffect 使用效果 1 跳转到指定模块 2 掉落库 3 从道具中选择
 * ItemUseEffectNum 使用效果参数
 * ItemSuperposition 是否叠加
 * ItemType 物品类型
 */
interface ItemConfig {
    ItemId: number,
    ItemName: string,
    ItemQuality: number,
    ItemIcon?: string,
    ItemSort?: number,
    ItemGetAccess: string,
    ItemIntroduce: string,
    ItemUseEffect?: number,
    ItemUseEffectNum?: string,
    ItemSuperposition: number,
    ItemType?: number,
}

export {
    ItemConfig
}

export default class BagData {
    private _bagData: data.IBagData = null;

    private _heroList: data.IBagUnit[] = [];
    private _equipList: data.IBagUnit[] = [];
    private _heroChipList: data.IBagUnit[] = [];
    private _headFrameList: data.IBagUnit[] = [];
    /**
     * 初始化背包数据
     */
    init(bagData: data.IBagData) {
        this._bagData = bagData;
        this.dueData();
    }
    /**
     * 处理数据
     */
    dueData() {
        // this.extractHeroBasicData();
        for (const k in this._bagData.Items) {
            let bagItem: data.IBagItem = this._bagData.Items[k];
            if (bagItem.Array.length > 0) {
                for (let i = 0; i < bagItem.Array.length; ++i) {
                    let itemUnit: data.IBagUnit = bagItem.Array[i];
                    // 英雄的id 需要的时候需要修改 可能需要排序
                    if (optManager.bagDataOpt.checkIsHeroBasic(itemUnit.ID)) {
                        this._heroList.push(itemUnit);
                    }
                    // 装备id 需要扩的时候需要修改 可能需要排序
                    else if (itemUnit.ID >= 311301 && itemUnit.ID <= 346505) {
                        this._equipList.push(itemUnit);
                    }
                    else if (optManager.bagDataOpt.checkIsHeroChip(itemUnit.ID)) {
                        this._heroChipList.push(itemUnit);
                    } else if (itemUnit.ID >= 10000 && itemUnit.ID <= 10003) {
                        this._headFrameList.push(itemUnit);
                    } else if (itemUnit.ID >= 20000 && itemUnit.ID <= 20003) {
                        this._headFrameList.push(itemUnit);
                    }
                    // 其他 材料 包括体力 等
                    else {
                        let itemType: ITEM_TYPE = optManager.bagDataOpt.getItemTypeById(itemUnit.ID);
                        let itemCount: number = itemUnit.Count.low;
                        switch (itemType) {
                            case ITEM_TYPE.COIN:
                                modelManager.userData.userInfo.coin = itemCount;
                                break;
                            case ITEM_TYPE.DIAMOND:
                                modelManager.userData.userInfo.diamond = itemCount;
                                break;
                            case ITEM_TYPE.PHYSICAL:
                                modelManager.userData.userInfo.physical = itemCount;
                                break;
                            case ITEM_TYPE.HONOUR:
                                modelManager.userData.userInfo.honour = itemCount;
                                break;
                            case ITEM_TYPE.REPUTATION:
                                modelManager.userData.userInfo.reputation = itemCount;
                                break;
                            default:
                                break;
                        }
                    }
                }
            }
        }
        // test
        this._heroList.unshift({
            Combinable: true,
            Count: 1,
            HeroUnit: {
                Exp: 1,
                Star: 3,
                Equips: {
                    "311301": { Count: 1, ID: 311301, Seq: 6, Combinable: true, EquipUnit: { Star: 1, Exp: 600 } },
                    "312302": { Count: 1, ID: 312302, Seq: 7, Combinable: true, EquipUnit: { Star: 3, Exp: 1 } }
                }
                // Equips: [{
                //     Combinable: true,
                //     Count: 1,
                //     HeroUnit: {
                //     },
                //     EquipUnit: {
                //         Star: 1,
                //         Exp: 1,
                //     },
                //     ID: 311301,
                //     Seq: 6,
                //     UpdateTime: 1620271117,

                // }],
            },
            ID: 175311,
            Seq: 5,
            UpdateTime: 1620271117
        });

        this._equipList.concat([{
            Combinable: true,
            Count: 1,
            HeroUnit: {
            },
            EquipUnit: {
                Star: 1,
                Exp: 1,
            },
            ID: 311301,
            Seq: 6,
            UpdateTime: 1620271117,

        }, {
            Combinable: true,
            Count: 1,
            HeroUnit: {
            },
            EquipUnit: {
                Star: 3,
                Exp: 1,
            },
            ID: 312302,
            Seq: 7,
            UpdateTime: 1620271117,

        }]);
    }
    /**
     * 抽取英雄数据
     */
    // private _bagHeroList
    extractHeroBasicData() {

    }

    get heroBasicList(): data.IBagUnit[] {
        return this._heroList;
    }

    get heroChipList(): data.IBagUnit[] {
        return this._heroChipList;
    }

    get equipList(): data.IBagUnit[] {
        return this._equipList;
    }

    get headFrameList(): data.IBagUnit[] {
        return this._headFrameList;
    }
    /**
     * 获得背包所有英雄 相同英雄放入同一数组
     * @param heroId 
     * @returns 
     */
    getHeroBasicInfosById(heroId: number): data.IBagUnit[] {
        // todo 如果到时候需要的话 根据获得时间去排序
        let heroList: data.IBagUnit[] = [];
        for (let i = 0; i < this._heroList.length; ++i) {
            if (this._heroList[i].ID == heroId) {
                heroList.push(this._heroList[i]);
            }
        }
        return heroList;
    }
    /**
     * 获得所有英雄碎片
     * @param heroId 
     * @returns 
     */
    getHeroChipInfosById(heroChipId: number): data.IBagUnit[] {
        // todo 如果到时候需要的话 根据获得时间去排序
        let heroChipList: data.IBagUnit[] = [];
        for (let i = 0; i < this._heroChipList.length; ++i) {
            if (this._heroChipList[i].ID == heroChipId) {
                heroChipList.push(this._heroChipList[i]);
            }
        }
        return heroChipList;
    }
    /**
     * 获得背包所有武器
     * @param equipId 
     * @returns 
     */
    getEquipInfosById(equipId: number): data.IBagUnit[] {
        // todo 如果到时候需要的话 根据获得时间去排序 是否呗使用
        let equipList: data.IBagUnit[] = [];
        for (let i = 0; i < this._equipList.length; ++i) {
            if (this._equipList[i].ID == equipId) {
                equipList.push(this._equipList[i]);
            }
        }
        return equipList;
    }
    /**
     * 获得所有展示的英雄 0 碎片满足合成 1 整卡 2 碎片不满足合成
     * @returns 
     */
    getHeroViewShowInfos(): data.IBagUnit[][] {
        let heroViewInfos: data.IBagUnit[][] = [];
        // 碎片
        for (let i = 0; i < this._heroChipList.length; ++i) {
            // 可以合成
            if (optManager.bagDataOpt.checkHeroChipIsCanCompound(this._heroChipList[i].ID)) {
                if (!heroViewInfos[0]) {
                    heroViewInfos[0] = new Array();
                }
                heroViewInfos[0].push(this._heroChipList[i]);
            } else {
                if (!heroViewInfos[2]) {
                    heroViewInfos[2] = new Array();
                }
                heroViewInfos[2].push(this._heroChipList[i]);
            }
        }
        // 整卡
        if (this._heroList.length > 0) {
            if (!heroViewInfos[1]) {
                heroViewInfos[1] = new Array();
            }
            // todo 可能需要排序
            heroViewInfos[1] = heroViewInfos[1].concat(this._heroList);
        }
        return heroViewInfos;
    }
    /**
     * 获得英雄列表通过index
     * @param index 
     * @returns 
     */
    getHeroViewInfoByIndex(index: number): data.IBagUnit {
        let curIndex: number = -1;
        let heroViewInfos = this.getHeroViewShowInfos();
        for (let i = 0; i < heroViewInfos.length; ++i) {
            let heroList: data.IBagUnit[] = heroViewInfos[i];
            if (heroList) {
                for (let j = 0; j < heroList.length; ++j) {
                    curIndex++;
                    if (curIndex == index) {
                        return heroList[j];
                    }
                }
            }
        }
        return null;
    }
    /**
     * 获得未装备武器
     * @returns 
     */
    getNotDressEquips(): data.IBagUnit[] {
        let notDressEquips: data.IBagUnit[] = [];
        for (let i = 0; i < this._heroList.length; ++i) {
            let hero = this._heroList[i];
            // 说明有穿戴装备
            if (hero.HeroUnit.Equips.length > 0) {
                for (let j = 0; j < hero.HeroUnit.Equips.length; ++j) {
                    let dressEquip = hero.HeroUnit.Equips[i];
                    let bagEquip = this._getBagEquip(dressEquip.ID, dressEquip.Seq);
                    if (bagEquip) {
                        notDressEquips.push(bagEquip);
                    }
                }
            }
        }
        return notDressEquips;
    }

    getHeroEquips(heroInfo: data.IBagUnit) {
        if (heroInfo.HeroUnit.Equips.length > 0) {
            return heroInfo.HeroUnit.Equips;
        }
        return null;
    }

    getEquipBasicConfig(equip: data.IBagUnit): EquipInfo {
        return configManager.getConfigByKey('equip', equip.ID);
    }

    getEquipLevel(equip: data.IBagUnit) {
        let equipConfig = this.getEquipBasicConfig(equip);
        let expList = this.getEquipExpConfigByEquipConfig(equipConfig);
        let expCount: number = 0;
        let level: number = 1;
        for (let i = 0; i < expList.length; ++i) {
            expCount += expList[i].LevelExpNeedNum;
            if (equip.EquipUnit.Exp == 0 || equip.EquipUnit.Exp < expCount) {
                level = i + 1;
                break;
            }
        }
        level = level > 60 ? 60 : level;
        return level;
    }

    getEquipExpConfigByEquipConfig(equipConfig: EquipInfo): LevelExp[] {
        let expConfig: LevelExp[] = configManager.getConfigs('levelExp');
        let equipExpList: LevelExp[] = [];
        for (const k in expConfig) {
            if (expConfig[k].LevelExpType == 2 && expConfig[k].LevelExpQuality == equipConfig.Quality) {
                equipExpList.push(expConfig[k]);
            }
        }
        // expConfig.forEach(exp => {
        //     if (exp.LevelExpType == 2 && exp.LevelExpQuality == equipConfig.Quality) {
        //         equipExpList.push(exp);
        //     }
        // });
        return equipExpList;
    }
    /**
     * 获得英雄升星的星级config
     * @param heroConfig 
     * @returns 
     */
    getHeroStarConfigByHeroConfig(heroConfig: HeroBasicInfo): LevelStar[] {
        let starConfig: LevelStar[] = configManager.getConfigs('levelStar');
        let heroStarList: LevelStar[] = [];
        for (const k in starConfig) {
            if (starConfig[k].LevelStarType == 1 && starConfig[k].LevelStarQuality == heroConfig.HeroBasicQuality) {
                heroStarList.push(starConfig[k]);
            }
        }
        return heroStarList;
    }

    private _getBagEquip(equipId: number, seq: number) {
        for (let i = 0; i < this._equipList.length; ++i) {
            let equip = this._equipList[i];
            if (equip.ID == equipId && equip.Seq == seq) {
                return equip;
            }
        }
        return null;
    }
    /**
     * 装备特殊属性
     */
    getEquipYellowConfig(id: number) {
        // configManager.getConfigByKey('')
    }
    /**
     * 获得英雄碎片
     * @param heroChipId 
     * @returns 
     */
    getHeroChipByHeroId(heroChipId: number): number {
        let id: number = heroChipId;
        if (optManager.bagDataOpt.checkIsHeroBasic(heroChipId)) {
            id = optManager.bagDataOpt.heroBaseIdToChipId(heroChipId);
        }
        for (let k in this._heroChipList) {
            if (this._heroChipList[k].ID == id) {
                return this._heroChipList[k].Count;
            }
        }
        return 0;
    }
    /**
     * 通过英雄的品质获得需要升星的所有数据
     * @param heroInfo 
     * @returns 
     */
    getHeroLevelStarByQuality(heroInfo: data.IBagUnit) {
        let heroConfig = optManager.bagDataOpt.getHeroBaseConfigById(heroInfo.ID);
        return this.getHeroStarConfigByHeroConfig(heroConfig);
    }
    /**
     * 获得当前英雄星级升星所需要的碎片
     * @param heroInfo 
     * @returns 
     */
    getHeroNeedChipCountByHeroInfo(heroInfo: data.IBagUnit) {
        let starList: LevelStar[] = this.getHeroLevelStarByQuality(heroInfo);
        return starList[heroInfo.HeroUnit.Star - 1].LevelStarNum;
    }
}