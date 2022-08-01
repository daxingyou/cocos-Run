import { configManager } from "../common/ConfigManager";
import { logger } from "../common/log/Logger";
import { cfg } from "../config/config";
import { userData } from "../mvp/models/UserData";
import { HERO_PROP_MAP, QUALITY_TYPE } from "./AppEnums";
import { utils } from "./AppUtils";
import { EFFECT_TYPE } from "./BattleConst";

// @ts-ignore
declare var require;
class ConfigUtils {
    getHeroConfig(heroId: number) {
        let cfg = configManager.getConfigByKey("hero", heroId);
        if (cfg) return <cfg.HeroProperty>cfg;
        else {
            // logger.error("[ConfigUtils] cant find hero Config", heroId);
        }
        return null
    }

    getMonsterConfig(monsterId: number): cfg.Monster {
        let cfg = configManager.getConfigByKey("monster", monsterId);
        if (cfg) return <cfg.Monster>cfg;
        else {
            //logger.error("[ConfigUtils] cant find monster Config", monsterId);
        }
        return null
    }

    getItemConfig(itemId: number) {
        let cfg = configManager.getConfigByKey("item", itemId);
        if (cfg) return <cfg.Item>cfg;
        else {
            // logger.error("[ConfigUtils] cant find item Config", itemId);
        }
        return null
    }

    getBeastConfig(beastID: number) {
        let cfg = configManager.getConfigByKey("beast", beastID);
        if(cfg) return cfg as cfg.Beast;
        return null;
    }

    getSkillConfig(skillId: number, heroId: number = 0) {
        let cfg = configManager.getConfigByKey("skill", skillId);
        // if (cfg) return <cfg.Skill>cfg;
        if(cfg) {
            return <cfg.Skill>cfg;
        }
        else {
            // logger.info("[ConfigUtils] cant find skill", skillId);
        }
        return null
    }

    getConfig(type: EFFECT_TYPE, id: number) {
        if (type == EFFECT_TYPE.SKILL) {
            return <cfg.Skill>this.getSkillConfig(id);
        } else if (type == EFFECT_TYPE.BUFF) {
            return <cfg.SkillBuff>this.getBuffConfig(id);
        }

        return null;
    }

    getBuffConfig(buffId: number):cfg.SkillBuff {
        let cfg = configManager.getConfigByKey("buff", buffId);
        // if (cfg) return <cfg.SkillBuff>cfg;
        if(cfg) {
            return <cfg.SkillBuff>cfg;
        }
        else {
            logger.info("[ConfigUtils] cant find buff", buffId);
        }
        return null
    }

    getHaloConfig(haloId: number) {
        let cfg = configManager.getConfigByKey("halo", haloId);
        // if (cfg) return <cfg.SkillHalo>cfg;
        if(cfg) {
            return <cfg.SkillHalo>cfg
        }
        else {
            logger.warn("[ConfigUtils] cant find halo", haloId);
        }
        return null
    }

    getChapterConfig(chapterId: number) {
        let cfg = configManager.getConfigByKey("chapter", chapterId);
        if (cfg) return <cfg.AdventureChapter>cfg;
        else {
            logger.error("[ConfigUtils] cant find chapter", chapterId);
        }
        return null
    }

    getLessonConfig(lessonId: number) {
        let cfg = configManager.getConfigByKey("lesson", lessonId);
        if (cfg) return <cfg.AdventureLesson>cfg;
        else {
            //logger.error("[ConfigUtils] cant find lesson", lessonId);
        }
        return null
    }

    getLessonsByChapterId(chapterId: number) {
        let cfgs: cfg.AdventureLesson[] = configManager.getConfigByKV('lesson', 'LessonChapter', chapterId);
        return cfgs;
    }

    getEquipConfig(equipId: number) {
        let cfg = configManager.getConfigByKey("equip", equipId);
        if (cfg) return <cfg.Equip>cfg;
        else {
            //  logger.error("[ConfigUtils] cant find equip", equipId);
        }
        return null;
    }

    getEquipGreenConfig(equipId: number) {
        let cfg = configManager.getConfigByKey("equipGreen", equipId);
        if (cfg) return <cfg.EquipGreen>cfg;
        else {
            //  logger.error("[ConfigUtils] cant find equip", equipId);
        }
        return null;
    }

    getEquipYellowConfig(equipId: number) {
        let cfg = configManager.getConfigByKey("equipYellow", equipId);
        if (cfg) return <cfg.EquipYellow>cfg;
        else {
            //  logger.error("[ConfigUtils] cant find equip", equipId);
        }
        return null;
    }

    /**
     * 经验材料配置
     * @returns
     */
    getItemExpConfig(itemId: number) {
        let cfg = configManager.getConfigByKey("itemExp", itemId);
        if (cfg) return <cfg.ItemExp>cfg;
        else {
            //logger.error("[ConfigUtils] cant find bagItem", itemId);
        }
        return null;
    }

    /**
     * 突破材料配置
     * @returns
     */
    getLevelStarConfig(itemId: number) {
        let cfg = configManager.getConfigByKey("levelStar", itemId);
        if (cfg) return <cfg.LevelStar>cfg;
        else {
            //logger.error("[ConfigUtils] cant find bagItem", itemId);
        }
        return null;
    }
    /**
     * 突破材料config 通过 材料类型跟品质
     * @param type 1英雄  2装备
     * @param quality 品质
     * @returns k: level, v: cfg.LevelStar
     */
    getLevelStarByTypeAndQuality(type: number, quality: QUALITY_TYPE, beastType?: number) {
        let cfgs = configManager.getConfigs("levelStar");
        if (cfgs) {
            let levelStars: { [k: string]: cfg.LevelStar } = {};
            for (const k in cfgs) {
                if (cfgs[k].LevelStarType == type && cfgs[k].LevelStarQuality == quality && (typeof beastType === 'undefined' ||cfgs[k].LevelStarBeastType == beastType)) {
                    levelStars[cfgs[k].LevelStarNum] = cfgs[k];
                }
            }
            return levelStars;
        }
        return null;
    }

    /**
     * 按照头像/头像框ID获取配置
     */
    getHeadConfig(hID: number) {
        let cfg = configManager.getConfigByKey("headFrame", hID);
        if (cfg) return <cfg.HeadFrame>cfg;
        else {
            //logger.error("[ConfigUtils] cant find bagItem", hID);
        }
        return null;
    }

    /**
     * 获得levelExp config
     * @param levelExpId
     * @returns
     */
    getLevelExpConfig(levelExpId: number) {
        let cfg = configManager.getConfigByKey("levelExp", levelExpId);
        if (cfg) return <cfg.LevelExp>cfg;
        else {
            //logger.error("[ConfigUtils] cant find bagItem", hID);
        }
        return null;
    }
    /**
     *
     * @param type 1预留给英雄 2装备  3账号  4账号巅峰等级
     */
    getLevelExpConfigsByType(type: number, quality?: number) {
        let typeConfigs: { [k: string]: cfg.LevelExp } = {};
        let levelExpConfigs = configManager.getConfigs('levelExp');
        let index: number = 1;
        for (const k in levelExpConfigs) {
            let cfg:cfg.LevelExp = levelExpConfigs[k];
            if (cfg.LevelExpType == type && (typeof quality == 'undefined' || cfg.LevelExpQuality == quality)) {
                typeConfigs[index] = cfg;
                ++index;
            }
        }
        return typeConfigs;
    }

    /**
     * 获得装备铸魂 config
     * @param equipCastSoulId
     * @returns
     */
    getEquipCastSoulConfig(equipCastSoulId: number) {
        let cfg = configManager.getConfigByKey("equipCastSoul", equipCastSoulId);
        if (cfg) return <cfg.EquipCastSoul>cfg;
        else {
            //logger.error("[ConfigUtils] cant find bagItem", hID);
        }
        return null;
    }

    /**
     * 获得英雄基础属性
     * @param heroBasicId
     * @returns
     */
    getHeroBasicConfig(heroBasicId: number) {
        let cfg = configManager.getConfigByKey("heroBasic", heroBasicId);
        if (cfg) return <cfg.HeroBasic>cfg;
        else {
            //logger.error("[ConfigUtils] cant find bagItem", hID);
            // todo 因为有可能是碎片 到时候选个性能最好的
            let cfgs: { [k: string]: cfg.HeroBasic } = configManager.getConfigs("heroBasic");
            let keys = configManager.getConfigKeys("heroBasic");
            for (let i = 0; i < keys.length; ++i) {
                if (cfgs[keys[i]].HeroBasicItem == heroBasicId) {
                    return cfgs[keys[i]];
                }
            }
        }
        return null;
    }
    /**
     * 获得仙缘信息
     * @param heroFriendId
     * @returns
     */
    getHeroFriendConfig(heroFriendId: number) {
        let cfg = configManager.getConfigByKey("heroFriend", heroFriendId);
        if (cfg) return <cfg.HeroFriend>cfg;
        else {
            //logger.error("[ConfigUtils] cant find bagItem", hID);
        }
        return null;
    }

    /**
     * 获得英雄天赋信息
     * @param heroGiftId
     * @returns
     */
    getHeroGiftConfig(heroGiftId: number) {
        let cfg = configManager.getConfigByKey("heroGift", heroGiftId);
        if (cfg) return <cfg.HeroGift>cfg;
        else {
            //logger.error("[ConfigUtils] cant find bagItem", hID);
        }
        return null;
    }

    getHeroGiftConfigsByHeroId(heroId: number) {
        let heroBasicId: number = this.getHeroConfig(heroId).HeroId;
        let configs = configManager.getConfigs('heroGift');
        let giftList: cfg.HeroGift[] = [];
        for(const k in configs) {
            if (configs[k].HeroGiftHeroId == heroBasicId) {
                giftList.push(configs[k]);
            }
        }
        return giftList;
    }

    /**
     * 获得英雄属性config
     * @param heroId
     * @returns
     */
    getHeroPropertyConfig(heroId: number) {
        let cfg = configManager.getConfigByKey("heroProperty", heroId);
        if (cfg) return <cfg.HeroProperty>cfg;
        else {
            //logger.error("[ConfigUtils] cant find heroProperty", heroId);
        }
        return null;
    }

    /**
     * 获得英雄特殊属性
     * @param heroId
     * @returns
     */
    getHeroSpecialAttributeConfig(heroId: number) {
        let cfg: cfg.HeroSpecialAttribute = configManager.getConfigByKey("heroAttribute", heroId);
        return cfg;
    }
    /**
     * @description: 获取跑酷角色配置
     * @param {number} heroID 角色ID
     * @return {*}
     * @author: lixu
     */
    getRunXHeroConfig(heroID: number) {
        let cfg = configManager.getConfigByKey('runXHeros', heroID);
        if (cfg) return <cfg.RunXHeros>cfg;
        return null;
    }

    /**
     * @description: 获取跑酷角色的属性配置
     * @param {number} quality  角色的品质
     * @param {number} starLevel    角色的星级
     * @return {*}
     * @author: lixu
     */
    getRunXHeroAttr(quality: number, starLevel: number) {
        let qualitys: cfg.RunXHeroAttribute[] = configManager.getConfigByKey('runXHeroAttribute', quality);
        if (!qualitys) return null;

        for (let i = 0, len = qualitys.length; i < len; i++) {
            let ele = qualitys[i];
            if (ele.StarLevel === starLevel) {
                return ele;
            }
        }
        return null;
    }

    getSummonCfg(summonId: number): cfg.SummonCard {
        let cfg = configManager.getConfigByKey('summon', summonId)
        if (cfg) return cfg
        return null;
    }

    /**
     * 获取ConfigModule配置信息
     */
    getConfigModule(key: string) {
        let config = configManager.getAnyConfig('ConfigConfigModule');
        return config[0][key] || null;
    }
    /**
     * 获得怪我整容信息
     * @param monsterGroupId
     * @returns
     */
    getMonsterGroupConfig(monsterGroupId: number) {
        let config: cfg.MonsterGroup = configManager.getConfigByKey('monsterGroup', monsterGroupId);
        return config;
    }
    /**
     * 获得品质信息
     * @param qualityId
     * @returns
     */
    getQualityConfig(qualityId: QUALITY_TYPE) {
        let config: cfg.Quality = configManager.getConfigByKey('quality', qualityId);
        return config;
    }
    /**
     * 获得新手引导 对话表
     * @returns
     */
    getGuideTalkConfig() {
        let config: cfg.TalkText = configManager.getAnyConfig('ConfigTalkText');
        return config;
    }

    getRunxBulletConfig(bulletID: number) {
        let config = configManager.getConfigByKey('runXBullet', bulletID);
        return config;
    }

    getModuleConfigs(): cfg.ConfigModule {
        let cfgs: cfg.ConfigModule = configManager.getAnyConfig('ConfigConfigModule')[0];
        return cfgs;
    }

    getAccessConfig(aId: number) {
        let cfg = configManager.getConfigByKey('getAccess', aId);
        if (cfg) return <cfg.GetAccess>cfg;
        return null;
    }

    getFunctionConfig(fId: number) {
        let cfg = configManager.getConfigByKey('function', fId);
        if (cfg) return <cfg.FunctionConfig>cfg;
        return null;
    }

    getModelConfig(modelId: number) {
        let cfg: cfg.Model = configManager.getConfigByKey('model', modelId);
        return cfg;
    }

    /**
     * 获得属性介绍表
     * @param attributeId
     * @returns
     */
    getAttributeConfig(attributeId: number) {
        let cfg: cfg.Attribute = configManager.getConfigByKey('attribute', attributeId);
        return cfg;
    }

    getBasicConfig() {
        let cfg: cfg.ConfigBasic = configManager.getConfigs("basic")[0];
        return cfg;
    }

    //陷阱的配置
    getTrapConfig(atlasName: string, gid: number): cfg.RunXTraps{
        let cfg: any = configManager.getConfigByKey('runXTrap', atlasName);

        if(!cfg) return null;
        for(let k in cfg){
            if(k == `${gid}`){
                return cfg[k];
            }
        }
        return null;
    }

    /**
     * 获得战斗力相关的配置
     * @param key
     * @returns
     */
    getCombatPowerConfig() {
        let cfg: cfg.Power = configManager.getConfigs('combatPower')[0];
        return cfg;
    }

    //跑酷怪物配置
    getRunXMonsterCfg(monsterID: number){
        let cfg: cfg.RunXMonster = configManager.getConfigByKey('runXMonster', monsterID);
        return cfg;
    }

    //获取怪物的行为序列
    getRunXMonsterActionCfg(actionID: number): cfg.RunXMonsterAction[]{
        let cfg: cfg.RunXMonsterAction[] = configManager.getConfigByKey("runXMonsterAction", actionID);
        return cfg;
    }

    /**
     * 获得装备套装效果config
     * @param suitId
     * @returns
     */
    getEquipSuitConfig(suitId: number) {
        let cfg: cfg.EquipSuit = configManager.getConfigByKey('equipSuit', suitId);
        return cfg;
    }
    /**
     * 获得替换技能表 skillReplace 已经弃用
     * @param heroId
     * @param skill
     * @returns
     */
    getSkillReplaceConfig(heroId: number, skill: number) {
        // let cfgs = configManager.getConfigs('skillReplace');
        // for(const k in cfgs) {
        //     let cfg = cfgs[k];
        //     if (cfg.HeroID == heroId && cfg.SkillID == skill) {
        //         return cfg;
        //     }
        // }
        // return null;
    }

    /**
     * 根据地形中的图集名和图块索引查找道具配置
     * @param atlasName
     * @param gid
     * @returns
     */
    getRunXItemCfg(atlasName: string, gid: number): cfg.RunXItem{
        let cfg = configManager.getConfigByKey('runXItem', atlasName);
        if(!cfg) return null;
        for(let k in cfg){
            if(k == `${gid}`){
                return cfg[k];
            }
        }
        return null;
    }

    /**
     * 通过道具id查找道具配置
     * @param id
     * @returns
     */
    getRunXItemCfgByID(id: number): cfg.RunXItem{
        let cfg: Array<cfg.RunXItem> = configManager.getAnyConfig('ConfigRunXItem');
        for(let i = 0, len = cfg.length; i < len; i++){
            let itemCfg = cfg[i];
            if(itemCfg.RunXItemId == id){
                return itemCfg;
            }
        }
        return null;
    }

    /**
     * 获得限时挑战配置表
     * @param randomFightId 限时挑战配置表id
     * @returns
     */
    getRandomFightConfig(randomFightId: number): cfg.RandomFight {
        let cfg: cfg.RandomFight = configManager.getConfigByKey('randomFight', randomFightId);
        return cfg;
    }

    /**
     * 获得限时挑战配置表
     * @param randomFightId 限时挑战配置表id
     * @returns
     */
    getRandomShopConfig(randomShopId: number): cfg.RandomShop {
        let cfg: cfg.RandomShop = configManager.getConfigByKey('randomShop', randomShopId);
        return cfg;
    }

    getSkillChangeConfig(changeId: number): cfg.SkillChange {
        let cfg: cfg.SkillChange = configManager.getConfigByKey('skillChange', changeId);
        return cfg;
    }

    getChangeBgConfig(changeBgId: number): cfg.ChangeBg {
        let cfg: cfg.ChangeBg = configManager.getConfigByKey('changeBg', changeBgId);
        return cfg;
    }

    getLeadSkillListConfig(leadSkillListId: number): cfg.LeadSkillList {
        let cfg: cfg.LeadSkillList = configManager.getConfigByKey('leadSkillList', leadSkillListId);
        return cfg;
    }

    getLeadSkillLevelConfig(leadSkillLevelId: number): cfg.LeadSkillLevel {
        let cfg: cfg.LeadSkillLevel = configManager.getConfigByKey('leadSkillLevel', leadSkillLevelId);
        return cfg;
    }

    getLeadSkillLevelConfigByLevel(groupId: number, skillLevel: number): cfg.LeadSkillLevel {
        let leadSkillLevelCfgs = configManager.getConfigs('leadSkillLevel');
        for(const k in leadSkillLevelCfgs) {
            if(groupId == leadSkillLevelCfgs[k].LeadSkillLevelGroup && skillLevel == leadSkillLevelCfgs[k].LeadSkillLevelSkillLevel) {
               return leadSkillLevelCfgs[k];
            }
        }
        return null;
    }

    getLeadTreasureConfig(treasureId: number): cfg.LeadTreasure {
        let cfg: cfg.LeadTreasure = configManager.getConfigByKey('leadTreasure', treasureId);
        return cfg;
    }

    getLeadTreasureConfigsByTreasureGroupId(treasureGroupId: number): cfg.LeadTreasure[] {
        let treasureCfgs: cfg.LeadTreasure[] = [];
        let cfgs: {[k: number]: cfg.LeadTreasure} = configManager.getConfigs('leadTreasure');
        if(cfgs) {
            let isFind = false;
            for(const k in cfgs) {
                if(cfgs[k].ItemID == treasureGroupId) {
                    if(!isFind) {
                        isFind = true;
                    }
                    treasureCfgs.push(cfgs[k]);
                } else {
                    if(isFind) {
                        return treasureCfgs;
                    }
                }
            }
        }
        return treasureCfgs;
    }

    // 获取指定排名的斩将封神配置
    getDeifyCfgByRank(rank: number){
        let deifyCfgs: cfg.PVPDeify[] = configManager.getConfigList("pvpDeify");
        for( let k in deifyCfgs){
            let cfg = deifyCfgs[k];
            let rankArea = cfg.PVPDeifyRankSection;
            if (rankArea && rank) {
                let lower = parseInt(rankArea.split(";")[0]);
                let upper = parseInt(rankArea.split(";")[1]);
                if (upper && lower && lower <= rank && rank <= upper) {
                    return cfg;
                }
            }
        }
        return null;
    }

    getDialogCfgByDialogId(dialogId: number): cfg.Dialog {
        let cfg: cfg.Dialog = configManager.getConfigByKey('dialogue', dialogId);
        return cfg;
    }

    getTaskByTaskId(taskId: number): cfg.TaskTarget {
        let cfg: cfg.TaskTarget = configManager.getConfigByKey('task', taskId);
        return cfg;
    }

    getHeroIntroduceConfig(heroIntroduceId: number): cfg.HeroIntroduce {
        let cfg: cfg.HeroIntroduce = configManager.getConfigByKey('heroIntroduce', heroIntroduceId);
        return cfg;
    }
    /**
     * 太虚幻境
     * @param lessonId
     */
    getDreamLandLessonConfig(lessonId: number) {
        let cfg: cfg.PVEDreamlandLesson = configManager.getConfigByKey('dreamlandLesson', lessonId);
        return cfg;
    }

    getDreamLandChapterConfig(chapterId: number) {
        let cfg: cfg.PVEDreamlandChapter = configManager.getConfigByKey('dreamlandChapter', chapterId);
        return cfg;
    }

    /**
     * 云端梦境
     * @param lessonId
     */
    getCloudDreamLessonConfig(lessonId: number) {
        let cfg: cfg.PVECloudDreamLesson = configManager.getConfigByKey('cloudDreamLesson', lessonId);
        return cfg;
    }

    getCloudDreamChapterConfig(chapterId: number) {
        let cfg: cfg.PVECloudDreamChapter = configManager.getConfigByKey('cloudDreamChapter', chapterId);
        return cfg;
    }

    //检查引导配置
    getFunctionGuideCfg(condition: string): cfg.FunctionGuide[]{
        let cfg: any = configManager.getConfigByKey('functionGuide', condition);
        if(!cfg) return null;
        return cfg[cfg.groups[0]];
    }

    /**
     * 获得公会等级的信息
     * @param levelId
     * @returns
     */
    getGuildLevelCfg(levelId: number): cfg.GuildLevel {
        let cfg: cfg.GuildLevel = configManager.getConfigByKey('guildLevel', levelId);
        return cfg;
    }

    /**
     * 获取公会成员权限信息
     * @param position
     * @returns
     */
    getGuildRoleCfg(position: number): cfg.GuildRole {
        let cfg: cfg.GuildRole = configManager.getConfigByKey('guildRole', position);
        return cfg;
    }

    getGuildMonsterCfg(guildMonsterId: number): cfg.GuildMonster {
        let cfg: cfg.GuildMonster = configManager.getConfigByKey('guildMonster', guildMonsterId);
        return cfg;
    }

    getAllTypeCfg(heroTypeId: number): cfg.ALLType {
        let cfg: cfg.ALLType = configManager.getConfigByKey('allType', heroTypeId);
        return cfg;
    }

    /**
     * 获取当前环境所有游戏服务器配置
     * @param env
     * @returns
     */
    getGameSvrList(env: number): cfg.Game[] {
        return configManager.getConfigByKV("game", "EnvType", env)
    }

    /**
     * 获取游戏服务器配置
     * @param env
     * @param gameId
     * @returns
     */
    getGameSvrCfg(env: number, gameId: number): cfg.Game {
        let svrList = this.getGameSvrList(env)
        for (let i = 0; i < svrList.length; i++) {
            if (svrList[i].ServerID == gameId) {
                return svrList[i]
            }
        }
        return null
    }

    getDispatchTaskConfig(id: number): cfg.DispatchTask {
        return configManager.getConfigByKey('dispatchTask', id);
    }

    getDispatchLevelConfig(lv: number): cfg.DispatchLevel {
        let dispatchLevels = configManager.getOneConfigByManyKV('dispatchLevel', 'Level', lv);
        if(dispatchLevels) {
            return dispatchLevels;
        }
        return null;
    }

    getGuildDonateConfig(donateId: number): cfg.GuildDonate {
        const donateCfg = configManager.getConfigByKey('guildDonate', donateId);
        return donateCfg;
    }

    getDoubleWeekListConfig(id: number): cfg.ActivityWeekSummonList {
        const cfg = configManager.getConfigByKey('doubleWeekList', id);
        return cfg;
    }

    getMonthlyCardConfig(id: number): cfg.ActivityMonthCard {
        const cfg = configManager.getConfigByKey('monthlyCard', id);
        return cfg;
    }

    getAllTypeConfig(TypeForm: number, TypeFormNum: number): cfg.ALLType {
        let alltypeConfig = configManager.getConfigs('allType');
        for (const k in alltypeConfig) {
            if (alltypeConfig[k].HeroTypeForm == TypeForm && alltypeConfig[k].HeroTypeFormNum == TypeFormNum) {
                return alltypeConfig[k];
            }
        }
        return null;
    }

    // 根据属性名词获得属性配置
    getAttributeCfg(attrName: string) {
        // @ts-ignore
        let cfgArr: string[] = Object.values(HERO_PROP_MAP);
        let idx = cfgArr.indexOf(attrName);
        if (idx !== -1) {
            let keys: string[] = Object.keys(HERO_PROP_MAP);
            let key: string = keys[idx];
            let attributeCfg = configUtils.getAttributeConfig(parseInt(key));
            return attributeCfg;
        }
        return null;
    }

    //获取限时礼包配置
    getShopGiftCfgByID(giftBagID: number) : cfg.ShopGiftScene{
        return configManager.getConfigByKey('shopGiftScene', giftBagID);
    }

    //获取普通礼包配置
    getNormalShopGift(giftBagID: number) : cfg.ShopGift{
        return configManager.getConfigByKey('gift', giftBagID);
    }

    checkFunctionOpen(functionID: number): boolean{
        if(!functionID) return false;
        let cfg = this.getFunctionConfig(functionID);
        if(!cfg || !cfg.FunctionOpenCondition || cfg.FunctionOpenCondition.length == 0) return false;
        let isOpen = false;
        let condis = utils.parseStringTo1Arr(cfg.FunctionOpenCondition, '|');
        if(parseInt(condis[0]) == 1 && userData.lv >= parseInt(condis[1])){
            isOpen = true;
        }
        return isOpen;
    }

    getHandBookCfgByHeroID(heroId: number) : cfg.HandBook {
      return configManager.getConfigs("handBook")[heroId+''];
    }

    /**
     *
     * @param buffID 羁绊buffID
     * @returns
     */
    getHerosByFriendBuffID(buffID: number) {
        let cfgs:cfg.HeroFriend[] = configManager.getConfigByKV("heroFriend", "HeroFriendSkillBuff", buffID);
        if (cfgs && cfgs.length > 0 && cfgs[0].HeroFriendNeedHero) {
            let heros = cfgs[0].HeroFriendNeedHero.split("|").map( _v => { return parseInt(_v)});
            heros = heros.filter( (_v)=> {
                if (_v) return true;
                return false;
            })
            return heros;
        }
        return []
    }

    getConsecrateCfgByIDAndLv(consecreateID: number, lv: number) {
        //等级和索引相等，连续，并且有序，因此考虑到效率，可以这种方式直接取
        let cfgs: cfg.Consecrate[] = configManager.getConfigByKey('consecrate', consecreateID);
        return cfgs[lv - 1] || null;
    }

    getConsecrateGoodsCfg(goodID: number): cfg.ConsecrateGoods {
        return configManager.getConfigByKey('consecrateGoods', goodID);
    }

    getConsecrateComeCfg(id: number) {
        return configManager.getConfigByKey('consecrateCome', id);
    }

    /**
     * 获取心魔法相的配置
     * @param day 一周种的第几天
     */
    getMindDemonMonsterCfgByDay(day: number) {
        return configManager.getConfigByKey('pveMindDemonMonster', day);
    }

    getActivityHeroGrowUpCfgByGID(growUpID: number) {
        return configManager.getConfigByKey('activityHeroGrowUp', growUpID);
    }
};

export let configUtils = new ConfigUtils();
