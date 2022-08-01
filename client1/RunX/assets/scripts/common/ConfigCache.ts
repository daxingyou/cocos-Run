/*
 * @Description: 配置缓存
 * @Version: 1.0
 * @Autor: lixu
 * @Date: 2022-06-23 11:35:06
 * @LastEditors: lixu
 * @LastEditTime: 2022-07-26 17:35:38
 */

import { LEVEL_EXP_TYPE } from "../app/AppEnums";
import { ItemInfo } from "../app/AppType";
import { utils } from "../app/AppUtils";
import { cfg } from "../config/config";
import { configManager } from "./ConfigManager";

interface EquipLvInfo {
    lv: number,
    minExp: number
    maxExp: number
}

// 悟道配置的缓存数据
interface WuDaoConfigCache{
    TeamID: number   // 组ID
    HeroType: number  // 编号
    LeadEnlightenmentIDs?: number[], // 包含的LeadEnlightenmentID
    Skills?: Map<number, Array<number>>, // 技能组
}

class ConfigCache {

    // 装备的等级配置缓存 <quaility, EquipLvInfo[]>
    private _equipLvExpCache: Map<number, EquipLvInfo[]> = null;
    // 灵兽的等级配置缓存 <quaility, EquipLvInfo[]>
    private _beastLvExpCache: Map<number, EquipLvInfo[]> = null;
    // 存在关卡奖励的主线关卡配置, <K, V> : <关卡ID, 奖励数组>
    private _adventureLvOfRewardCache: Map<number, ItemInfo[]> = null;
    // 存在关卡礼包的主线关卡配置, <K, V> : <关卡ID, 礼包ID>
    private _adventureLvOfGiftCache: Map<number, number> = null;
    // 太虚幻境章节与对应关卡的映射, <K, V> : <章节ID, 关卡ID数组>
    private _dreamLandChapterCache: Map<number, number[]> = null;
    // 存在章节礼包的太虚幻境关卡配置, <K, V> : <关卡ID, 礼包ID>
    private _dreamLandGiftCache: Map<number, number> = null;

    // 活动预览配置的有序ActivityNextShowId数组
    private _activityPreviewIDs: number[] = null;
    // 礼包类别配置，对shopGift表的缓存, <K，V>： <礼包类型, 礼包ID数组>
    private _shopGiftCache: Map<number, number[]> = null;
    // ActivityWeekSummonBattlePass表的缓存, <K, V>: <FunctionID, OnlyID[]>
    private _weekSummonBattlePassCache: Map<number, number[]> = null;
    // 悟道LeadEnlightenment表的缓存, <K, V> : <LeadEnlightenmentTeamID, WuDaoConfigCache>
    private _wuDaoCache: Map<number, WuDaoConfigCache> = null;
    // PVEList 的缓存, 主要是对pve进行分类, <K, V>: <PVEListType, PVEListFunctionId[]>
    private _pveListCache: Map<number, Array<number>> = null;

    init() {

    }

    deInit() {

    }

    // 获取灵兽的等级配置
    getBeastExpCfgs(quality: number) {
        this._initEquipLevelCfg(LEVEL_EXP_TYPE.BEAST);
        return this._beastLvExpCache.get(quality);
    }

    // 获取装备的等级配置
    getEquipExpCfgs(quality: number) {
        this._initEquipLevelCfg(LEVEL_EXP_TYPE.EQUIP);
        return this._equipLvExpCache.get(quality);
    }

    // 获取主线关卡奖励配置
    getAdventureLvRewards() {
        this._initAdventureLessonCfg();
        return this._adventureLvOfRewardCache;
    }

    // 通过主线关卡ID获取关卡奖励配置
    getAdventureLvRewardByLessonID(lessonID: number) {
        this._initAdventureLessonCfg();
        return this._adventureLvOfRewardCache.get(lessonID);
    }

    // 获取主线关卡礼包配置
    getAdventureLvGifts() {
        this._initAdventureLessonCfg();
        return this._adventureLvOfGiftCache;
    }

    // 通过主线关卡ID获取关卡礼包配置
    getAdventureLvGiftByLessonID(lessonID: number) {
        this._initAdventureLessonCfg();
        return this._adventureLvOfGiftCache.get(lessonID);
    }

    // 获取太虚幻境章节配置
    getDreamLandLessonsByChapterID(chapterID: number) {
        this._initDreamLandLessonCfg();
        return this._dreamLandChapterCache.get(chapterID)
    }

    // 获取太虚幻境关卡奖励
    getDreamLandGifts() {
        this._initDreamLandLessonCfg();
        return this._dreamLandGiftCache;
    }

     // 通过太虚幻境关卡ID获取章节礼包配置
    getDreamLandGiftByLessonID(lessonID: number) {
        this._initDreamLandLessonCfg();
        return this._dreamLandGiftCache.get(lessonID);
    }

    // 获取活动预览配置的有序数组
    getActivityPreviewCfgs() {
        this._initActivityPreviewCfg();
        return this._activityPreviewIDs;
    }

    // 通过礼包类型获取所有礼包
    getShopGiftsByType(type: number) {
        this._initShopGiftCfg();
        return this._shopGiftCache.get(type);
    }

    // 通过FunctionID 获取其包含的所有ActivityWeekSummonBattlePass配置项ID集合
    getAtyWeekSummonBattlePassByFunctionID(funcID: number): number[] {
        this._initAtyWeekSummonBattlePass();
        return this._weekSummonBattlePassCache.get(funcID);
    }

    // 获取悟道缓存配置
    getWuDaoCache() {
        this._initWuDaoCache();
        return this._wuDaoCache;
    }

    // 通过TeamID 获取悟道配置
    getWuDaoCfgsByTeamID(teamID: number) {
        this._initWuDaoCache();
        return this._wuDaoCache.get(teamID);
    }

    // 通过类型获取悟道配置
    getWuDaoCfgsByHeroType(heroType: number) {
        this._initWuDaoCache();
        for(let [k, v] of this._wuDaoCache) {
            if(v.HeroType == heroType) {
                return v;
            }
        }
        return null;
    }

    // 获取PVEList的配置
    getPVEListCfgs() {
        this._initPVEList();
        return this._pveListCache;
    }

    // 获取PVEList的某个类型
    getPVEListCfgsByType(type: number) {
        this._initPVEList();
        return this._pveListCache.get(type);
    }

    // 初始化装备/灵兽等级
    private _initEquipLevelCfg(type: LEVEL_EXP_TYPE) {
        if(type == LEVEL_EXP_TYPE.EQUIP && this._equipLvExpCache) return;
        if(type == LEVEL_EXP_TYPE.BEAST && this._beastLvExpCache) return;

        let cfgMap: Map<number, EquipLvInfo[]> = null;
        if(type == LEVEL_EXP_TYPE.EQUIP) {
            cfgMap = this._equipLvExpCache = new Map();
        } else if (type == LEVEL_EXP_TYPE.BEAST) {
            cfgMap = this._beastLvExpCache = new Map();
        }

        if(!cfgMap) return;
        let expConfig: cfg.LevelExp[] = configManager.getConfigList('levelExp');
        let expMap: Map<number, cfg.LevelExp[]> = null;
        expConfig.forEach(ele => {
            if (ele.LevelExpType == type) {
                let expCfg: cfg.LevelExp = ele;
                expMap = expMap || new Map();
                if(!expMap.has(expCfg.LevelExpQuality)) {
                    expMap.set(expCfg.LevelExpQuality, []);
                }
                expMap.get(expCfg.LevelExpQuality).push(expCfg);
            }
        });

        expMap && expMap.forEach((ele, quality) => {
            if(ele && ele.length > 1) ele.sort((aCfg, bCfg) => {return aCfg.LevelExpLevel - bCfg.LevelExpLevel});
            cfgMap.set(quality, []);
            let curExp = 0;
            ele.forEach(expCfg => {
                let arr =  cfgMap.get(quality);
                if(arr && arr.length > 0) {
                    arr[arr.length - 1].maxExp = curExp;
                }
                cfgMap.get(quality).push({lv: expCfg.LevelExpLevel, minExp: curExp, maxExp: curExp});
                curExp += expCfg.LevelExpNeedNum;
            })
        });
    }

    // 初始化主线关卡奖励和礼包配置
    private _initAdventureLessonCfg() {
        if(this._adventureLvOfRewardCache || this._adventureLvOfGiftCache) return;
        let lessonCfgs = configManager.getConfigKeys('lesson');
        if(!lessonCfgs) return;
        lessonCfgs.forEach(ele => {
            let cfg = configManager.getConfigByKey('lesson', ele);
            if(!cfg) return;
            let lessonID = parseInt(ele);
            if(cfg.LessonProgressRewardShow && cfg.LessonProgressRewardShow.length > 0) {
                this._adventureLvOfRewardCache = this._adventureLvOfRewardCache || new Map();
                !this._adventureLvOfRewardCache.has(lessonID) && this._adventureLvOfRewardCache.set(lessonID, []);
                utils.parseStingList(cfg.LessonProgressRewardShow, (strArr: string[]) => {
                    if(!strArr || !Array.isArray(strArr) || strArr.length == 0) return;
                    this._adventureLvOfRewardCache.get(lessonID).push({itemId: parseInt(strArr[0]), num: parseInt(strArr[1])});
                });
            }

            if(cfg.LessonGift) {
                this._adventureLvOfGiftCache = this._adventureLvOfGiftCache || new Map();
                this._adventureLvOfGiftCache.set(lessonID, cfg.LessonGift);
            }
        });
    }

    // 初始化太虚幻境章节与关卡的关系
    private _initDreamLandLessonCfg() {
        if(this._dreamLandChapterCache) return;
        let lessonCfgs = configManager.getConfigKeys('dreamlandLesson');
        if(!lessonCfgs) return;
        lessonCfgs.forEach(ele => {
            let cfg = configManager.getConfigByKey('dreamlandLesson', ele);
            if(!cfg) return;
            let chapterID = cfg.PVEDreamlandLessonChapter;
            this._dreamLandChapterCache = this._dreamLandChapterCache || new Map();
            if(!this._dreamLandChapterCache.has(chapterID)) {
                this._dreamLandChapterCache.set(chapterID, []);
            }
            this._dreamLandChapterCache.get(chapterID).push(cfg.PVEDreamlandLessonId);

            if(cfg.PVEDreamlandLessonChapterShopGift) {
                this._dreamLandGiftCache = this._dreamLandGiftCache || new Map();
                this._dreamLandGiftCache.set(cfg.PVEDreamlandLessonId, cfg.PVEDreamlandLessonChapterShopGift);
            }
        });
    }

    private _initActivityPreviewCfg() {
        if(this._activityPreviewIDs) return;
        this._activityPreviewIDs = this._activityPreviewIDs || [];
        let configs: cfg.ActivityNextShow[] = configManager.getConfigList('activityPreview');
        if(!configs || configs.length == 0) return;
        configs.sort((l, r) => {return l.ActivityNextShowOrder - r.ActivityNextShowOrder});
        configs.forEach(ele => {
            this._activityPreviewIDs.push(ele.ActivityNextShowId);
        })
    }

    private _initShopGiftCfg() {
        if(this._shopGiftCache) return;
        let gifts = configManager.getConfigKeys('gift');
        if(!gifts) return;
        gifts.forEach(ele => {
            let giftCfg: cfg.ShopGift = configManager.getConfigByKey('gift', ele);
            if(!giftCfg) return;
            let giftType = giftCfg.ShopGiftType;
            this._shopGiftCache = this._shopGiftCache || new Map();
            if(!this._shopGiftCache.has(giftType)) {
              this._shopGiftCache.set(giftType, []);
            }
            this._shopGiftCache.get(giftType).push(giftCfg.ShopGiftId);
        });
    }

    private _initAtyWeekSummonBattlePass() {
        if(this._weekSummonBattlePassCache) return;
        let cfgs = configManager.getConfigKeys('activityWeekSummonBattlePass');
        if(!cfgs) return;

        cfgs.forEach(ele => {
            let atyCfg: cfg.ActivityWeekSummonBattlePass = configManager.getConfigByKey('activityWeekSummonBattlePass', ele);
            if(!atyCfg) return;
            let funcID = atyCfg.FunctionID;
            this._weekSummonBattlePassCache = this._weekSummonBattlePassCache || new Map();
            if(!this._weekSummonBattlePassCache.has(funcID)) {
                this._weekSummonBattlePassCache.set(funcID, []);
            }
            this._weekSummonBattlePassCache.get(funcID).push(atyCfg.OnlyID);
        });

        this._weekSummonBattlePassCache.forEach(ele => {
            ele && ele.sort((l, r) => {
                let lCfg: cfg.ActivityWeekSummonBattlePass = configManager.getConfigByKey('activityWeekSummonBattlePass', l);
                let rCfg: cfg.ActivityWeekSummonBattlePass = configManager.getConfigByKey('activityWeekSummonBattlePass', r);
                return (lCfg.NeedDay || 0) - (rCfg.NeedDay || 0);
            })
        })
    }

    private _initWuDaoCache() {
        if(this._wuDaoCache) return;
        let wuDaocfgs = configManager.getConfigKeys('LeadEnlightenment');
        if(!wuDaocfgs) return;

        let cfgs: Map<number, cfg.LeadEnlightenment[]> = new Map();
        wuDaocfgs.forEach(ele => {
            let cfg: cfg.LeadEnlightenment = configManager.getConfigByKey('LeadEnlightenment', ele);
            if(!cfg) return;
            if(!cfgs.has(cfg.LeadEnlightenmentTeamID)) {
                cfgs.set(cfg.LeadEnlightenmentTeamID, []);
            }
            cfgs.get(cfg.LeadEnlightenmentTeamID).push(cfg);
        });

        cfgs.forEach((ele, idx) => {
            ele.sort((l, r) => {
                return l.LeadEnlightenmentLevel - r.LeadEnlightenmentLevel;
            });
            this._wuDaoCache = this._wuDaoCache || new Map();
            ele.forEach(wuDaoCfg => {
                if(!this._wuDaoCache.has(wuDaoCfg.LeadEnlightenmentTeamID)) {
                    this._wuDaoCache.set(wuDaoCfg.LeadEnlightenmentTeamID, {TeamID: wuDaoCfg.LeadEnlightenmentTeamID, HeroType: wuDaoCfg.LeadEnlightenmentHeroTypeFormNum});
                }

                let wuDaoCache = this._wuDaoCache.get(wuDaoCfg.LeadEnlightenmentTeamID);
                wuDaoCache.LeadEnlightenmentIDs = wuDaoCache.LeadEnlightenmentIDs || [];
                wuDaoCache.LeadEnlightenmentIDs.push(wuDaoCfg.LeadEnlightenmentID);

                wuDaoCache.Skills =  wuDaoCache.Skills || new Map();
                if(wuDaoCfg.LeadEnlightenmentSkillId1 || wuDaoCfg.LeadEnlightenmentSkillChangeId1) {
                    if(!wuDaoCache.Skills.has(1)) {
                      wuDaoCache.Skills.set(1, []);
                    }
                    wuDaoCache.Skills.get(1).push(wuDaoCfg.LeadEnlightenmentID);
                }

                if(wuDaoCfg.LeadEnlightenmentSkillId2 || wuDaoCfg.LeadEnlightenmentSkillChangeId2) {
                    if(!wuDaoCache.Skills.has(2)) {
                      wuDaoCache.Skills.set(2, []);
                    }
                    wuDaoCache.Skills.get(2).push(wuDaoCfg.LeadEnlightenmentID);
                }

                if(wuDaoCfg.LeadEnlightenmentSkillId3 || wuDaoCfg.LeadEnlightenmentSkillChangeId3) {
                    if(!wuDaoCache.Skills.has(3)) {
                      wuDaoCache.Skills.set(3, []);
                    }
                    wuDaoCache.Skills.get(3).push(wuDaoCfg.LeadEnlightenmentID);
                }
            })
        });
    }

    private _initPVEList() {
        if(this._pveListCache) return;

        this._pveListCache = new Map();
        let pveListKeys = configManager.getConfigKeys('pveList');
        if(!pveListKeys || pveListKeys.length == 0) return;
        let i = 0, len = pveListKeys.length;
        for(; i < len; i++) {
            let pveCfg: cfg.PVEList = configManager.getConfigByKey('pveList', pveListKeys[i]);
            if(!pveCfg) return;
            let lists: number[] = this._pveListCache.get(pveCfg.PVEListType);
            if(!lists) {
                lists = [];
                this._pveListCache.set(pveCfg.PVEListType, lists);
            }
            lists.push(pveCfg.PVEListFunctionId);
        }

        this._pveListCache.forEach(ele => {
            ele.sort((l, r) => {
                let pveLCfg: cfg.PVEList = configManager.getConfigByKey('pveList', l);
                let pveRCfg: cfg.PVEList = configManager.getConfigByKey('pveList', r);
                return (pveLCfg.PVEListNum || 0) - (pveRCfg.PVEListNum || 0);
            });
        })
    }
}

export let configCache = new ConfigCache();
