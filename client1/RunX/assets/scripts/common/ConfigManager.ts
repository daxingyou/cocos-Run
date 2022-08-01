/*
 * @Author:
 * @Date: 2021-03-16 13:57:19
 * @LastEditTime: 2022-06-08 09:58:33
 * @Description: 配置管理类
 */

import { utils } from "../app/AppUtils";
import { logger } from "./log/Logger";

function toMap(arr: any[], keyname: string) {
    let result = {};
    for (let i = 0; i < arr.length; ++i) {
        // @ts-ignore
        result[arr[i][keyname]] = arr[i];
    }
    return result;
}

function toMapWithClassify(arr: any[], keyname: string) {
    let result: any = {};
    arr.forEach((elem) => {
        result[elem[keyname]] = result[elem[keyname]] || [];
        result[elem[keyname]].push(elem);
    });
    return result;
}

//解析为树结构的映射
function toMultiLvMap(arr: any[], isLeafArr: boolean = false, ...keys: any[]) {
    let mapLvs = (keys && keys.length) || 0;
    if (mapLvs == 0) return arr;
    let result: any = {};
    arr.forEach(elem => {
        _parseObj(elem, result, keys, isLeafArr);
    });
    return result;
}

function _parseObj(srcObj: any, targetObj: any, keys: any[], isLeafArr: boolean = false) {
    let mapLvs = (keys && keys.length) || 0;
    if (mapLvs == 0) return;
    let currObj = targetObj;
    for (let i = 0; i < mapLvs; i++) {
        if (i === mapLvs - 1) {
            if(isLeafArr){
                currObj[srcObj[keys[i]]] = currObj[srcObj[keys[i]]] || [];
                currObj[srcObj[keys[i]]].push(srcObj);
            }else{
                currObj[srcObj[keys[i]]] = srcObj;
            }
            continue;
        }
        currObj[srcObj[keys[i]]] = currObj[srcObj[keys[i]]] || {};
        currObj = currObj[srcObj[keys[i]]];
    }
}

let CONFIGS = [
    {
        name: "skill", path: "ConfigSkill",
        custom: function (arr: any[]) { return toMap(arr, "SkillId"); }
    },
    {
        name: "monster", path: "ConfigMonster",
        custom: function (arr: any[]) { return toMap(arr, "MonsterId"); }
    },
    {
        name: "hero", path: "ConfigHeroProperty",
        custom: function (arr: any[]) { return toMap(arr, "HeroId"); }
    },
    {
        name: "heroAttribute", path: "ConfigHeroSpecialAttribute",
        custom: function (arr: any[]) { return toMap(arr, "HeroId"); }
    },
    {
        name: "buff", path: "ConfigSkillBuff",
        custom: function (arr: any[]) { return toMap(arr, "BuffId"); }
    },
    {
        name: "function", path: "ConfigFunctionConfig",
        custom: function (arr: any[]) { return toMap(arr, "FunctionId"); }
    },
    {
        name: "chapter", path: "ConfigAdventureChapter",
        custom: function (arr: any[]) { return toMap(arr, "ChapterId"); }
    },
    {
        name: "lesson", path: "ConfigAdventureLesson",
        custom: function (arr: any[]) { return toMap(arr, "LessonId"); }
    },
    {
        name: "item", path: "ConfigItem",
        custom: function (arr: any[]) { return toMap(arr, "ItemId"); }
    },
    {
        name: 'heroBasic', path: "ConfigHeroBasic",
        custom: function (arr: any[]) { return toMap(arr, 'HeroBasicId'); }
    },
    {
        name: 'monsterGroup', path: "ConfigMonsterGroup",
        custom: function (arr: any[]) { return toMap(arr, 'MonsterGroupId'); }
    },
    {
        name: 'heroFriend', path: "ConfigHeroFriend",
        custom: function (arr: any[]) { return toMap(arr, 'HeroFriendId'); }
    },
    {
        name: 'heroGift', path: "ConfigHeroGift",
        custom: function (arr: any[]) { return toMap(arr, 'HeroGiftId'); }
    },
    {
        name: 'levelExp', path: "ConfigLevelExp",
        custom: function (arr: any[]) { return toMap(arr, 'LevelExpId'); }
    },
    {
        name: 'levelStar', path: "ConfigLevelStar",
        custom: function (arr: any[]) { return toMap(arr, 'LevelStarId'); }
    },
    {
        name: 'equip', path: "ConfigEquip",
        custom: function (arr: any[]) { return toMap(arr, 'EquipId'); }
    },
    {
        name: 'equipCastSoul', path: "ConfigEquipCastSoul",
        custom: function (arr: any[]) { return toMap(arr, 'EquipCastSoulId'); }
    },
    {
        name: 'halo', path: "ConfigSkillHalo",
        custom: function (arr: any[]) { return toMap(arr, 'SkillHaloId'); }
    },
    {
        name: 'heroProperty', path: "ConfigHeroProperty",
        custom: function (arr: any[]) { return toMap(arr, 'HeroId'); }
    },
    {
        name: 'headFrame', path: "ConfigHeadFrame",
        custom: function (arr: any[]) { return toMap(arr, 'HeadFrameId'); }
    },
    {
        name: 'equipGreen', path: "ConfigEquipGreen",
        custom: function (arr: any[]) { return toMap(arr, 'ID'); }
    },
    {
        name: 'equipYellow', path: "ConfigEquipYellow",
        custom: function (arr: any[]) { return toMap(arr, 'ID'); }
    },
    {
        name: 'runMapBg', path: 'ConfigLessonRunBg',
        custom: function (arr: any[]) { return toMapWithClassify(arr, 'LessonRunBgChapterId'); }
    },
    {
        name: 'itemExp', path: "ConfigItemExp",
        custom: function (arr: any[]) { return toMap(arr, 'ItemExpUseId'); }
    },
    {
        name: 'runXHeros', path: 'ConfigRunXHeros',
        custom: function (arr: any[]) { return toMap(arr, 'RunXHeroID'); }
    },
    {
        name: 'runXHeroAttribute', path: 'ConfigRunXHeroAttribute',
        custom: function (arr: any[]) { return toMapWithClassify(arr, 'RunXHeroQuality'); }
    },
    {
        name: 'allType', path: 'ConfigALLType',
        custom: function (arr: any[]) { return toMap(arr, 'HeroTypeId'); }
    },
    {
        name: 'quality', path: 'ConfigQuality',
        custom: function (arr: any[]) { return toMap(arr, 'QualityId'); }
    },
    {
        name: 'runXBullet', path: 'ConfigRunXBullet',
        custom: function (arr: any[]) { return toMap(arr, 'BulletID'); }
    },
    {
        name: 'chatBubble', path: 'ConfigChatBubble',
        custom: function (arr: any[]) { return toMap(arr, 'ChatBubbleId'); }
    },
    {
        name: 'chatChannel', path: 'ConfigChatChannel',
        custom: function (arr: any[]) { return toMap(arr, 'ChatChannelId'); }
    },
    {
        name: 'model', path: 'ConfigModel',
        custom: function (arr: any[]) { return toMap(arr, 'ModelId'); }
    },
    {
        name: 'summon', path: 'ConfigSummonCard',
        custom: function (arr: any[]) { return toMap(arr, 'SummonCardId'); }
    },
    {
        name: 'summonShow', path: 'ConfigSummonCardShow',
        custom: function (arr: any[]) { return toMap(arr, 'SummonCardShowId'); }
    },
    {
        name: 'getAccess', path: 'ConfigGetAccess',
        custom: function (arr: any[]) { return toMap(arr, 'GetAccessId'); }
    },
    {
        name: 'dialogue', path: 'ConfigDialog',
        custom: function (arr: any[]) { return toMap(arr, 'DialogId'); }
    },
    {
        name: 'dreamlandLesson', path: 'ConfigPVEDreamlandLesson',
        custom: function (arr: any[]) { return toMap(arr, 'PVEDreamlandLessonId'); }
    },
    {
        name: 'dreamlandChapter', path: 'ConfigPVEDreamlandChapter',
        custom: function (arr: any[]) { return toMap(arr, 'PVEDreamlandChapterId'); }
    },
    {
        name: 'basic', path: 'ConfigConfigBasic',
    },
    {
        name: 'attribute', path: 'ConfigAttribute',
        custom: function (arr: any[]) { return toMap(arr, 'AttributeId'); }
    },
    {
        name: 'runXTrap', path: 'ConfigRunXTraps',
        custom: function (arr: any[]) { return toMultiLvMap(arr, false, 'StonesImage', 'StonesId'); }
    },
    {
        name: 'commodity', path: 'ConfigShopCommodity',
        custom: function (arr: any[]) { return toMap(arr, 'ShopCommodityId'); }
    },
    {
        name: 'gift', path: 'ConfigShopGift',
        custom: function (arr: any[]) { return toMap(arr, 'ShopGiftId'); }
    },
    {
        name: 'shopRandom', path: 'ConfigShopRandom',
        custom: function (arr: any[]) { return toMap(arr, 'ShopCommodityId'); }
    },
    {
        name: 'rechargeAndroid', path: 'ConfigShopRechargeAndroid',
        custom: function (arr: any[]) { return toMap(arr, 'ShopRechargeAndroidId'); }
    },
    {
        name: 'rechargeIOS', path: 'ConfigShopRechargeIOS',
        custom: function (arr: any[]) { return toMap(arr, 'ShopRechargeIOSId'); }
    },
    {
        name: 'combatPower', path: 'ConfigPower'
    },
    {
        name: 'runXMonster', path: 'ConfigRunXMonster',
        custom: function(arr: any[]) {return toMap(arr, 'MonsterID');}
    },
    {
        name: 'runXMonsterAction', path: 'ConfigRunXMonsterAction',
        custom: function(arr: any[]) {return toMapWithClassify(arr, 'RumMonsterActionID');}
    },
    {
        name: 'equipSuit', path: 'ConfigEquipSuit',
        custom: function (arr: any[]) { return toMap(arr, 'SuitId'); }
    },
    {
        name: 'pveList', path: 'ConfigPVEList',
        custom: function (arr: any[]) { return toMap(arr, 'PVEListFunctionId'); }
    },
    {
        name: 'pveDailyLesson', path: 'ConfigPVEDailyLesson',
        custom: function (arr: any[]) { return toMap(arr, 'PVEDailyLessonId'); }
    },
    {
        name: 'pveRiseRoad', path: 'ConfigPVERiseRoad',
        custom: function (arr: any[]) { return toMap(arr, 'PVERiseRoadId'); }
    },
    {
        name: 'advertShow', path: 'ConfigAdvertShow',
        custom: function (arr: any[]) { return toMap(arr, 'AdvertShowId'); }
    },
    {
        name: 'runXItem', path: 'ConfigRunXItem',
        custom: function (arr: any[]) { return toMultiLvMap(arr, false, 'StonesImage', 'StonesId'); }
    },
    {
        name: 'randomFight', path: 'ConfigRandomFight',
        custom: function (arr: any[]) { return toMap(arr, 'RandomFightId'); }
    },
    {
        name: 'randomShop', path: 'ConfigRandomShop',
        custom: function (arr: any[]) { return toMap(arr, 'RandomShopId'); }
    },
    {
        name: 'cloudDreamChapter', path: 'ConfigPVECloudDreamChapter',
        custom: function (arr: any[]) { return toMap(arr, 'PVECloudDreamChapterId'); }
    },
    {
        name: 'cloudDreamLesson', path: 'ConfigPVECloudDreamLesson',
        custom: function (arr: any[]) { return toMap(arr, 'PVECloudDreamLessonId'); }
    },
    {
        name: 'pveCopy', path: 'ConfigPVECopy',
        custom: function (arr: any[]) { return toMap(arr, 'PVECopyId'); }
    },
    {
        name: 'pveMagicLesson', path: 'ConfigPVEDaoistMagicLesson',
        custom: function (arr: any[]) { return toMap(arr, 'PVECopyId'); }
    },
    {
        name: 'pveMagicDoor', path: 'ConfigPVEDaoistMagic',
        custom: function (arr: any[]) { return toMap(arr, 'PVEDaoistMagicID'); }
    },
    {
        name: 'pveMagicHero', path: 'ConfigPVEDaoistMagicHero',
        custom: function (arr: any[]) { return toMap(arr, 'RetrievalID'); }
    },
    {
        name: 'pveMagicHeroGroup', path: 'ConfigPVEDaoistMagicHeroGroup',
        custom: function (arr: any[]) { return toMap(arr, 'PVEDaoistMagicHeroGroupId'); }
    },
    {
        name: 'skillChange', path: 'ConfigSkillChange',
        custom: function (arr: any[]) { return toMap(arr, 'ChangeID'); }
    },
    {
        name: 'changeBg', path: 'ConfigChangeBg',
        custom: function (arr: any[]) { return toMap(arr, 'ChangeBgID'); }
    },
    {
        name: 'leadSkillList', path: 'ConfigLeadSkillList',
        custom: function (arr: any[]) { return toMap(arr, 'LeadSkillListId'); }
    },
    {
        name: 'leadSkillLevel', path: 'ConfigLeadSkillLevel',
        custom: function (arr: any[]) { return toMap(arr, 'LeadSkillLevelId'); }
    },
    {
        name: 'moneyShow', path: 'ConfigMoneyShow',
        custom: function (arr: any[]) { return toMap(arr, 'MoneyShowId'); }
    },
    {
        name: 'pvpList', path: 'ConfigPVPList',
        custom: function (arr: any[]) { return toMap(arr, 'PVPListFunctionId'); }
    },
    {
        name: 'pvpDeify', path: 'ConfigPVPDeify',
        custom: function (arr: any[]) { return toMap(arr, 'PVPDeifyId'); }
    },
    {
        name: 'pvpImmortals', path: 'ConfigPVPImmortals',
        custom: function (arr: any[]) { return toMap(arr, 'PVPImmortalsId'); }
    },
    {
        name: 'leadTreasure', path: 'ConfigLeadTreasure',
        custom: function (arr: any[]) { return toMap(arr, 'ItemID'); }
    },
    {
        name: 'handBook', path: 'ConfigHandBook',
        custom: function (arr: any[]) { return toMap(arr, 'HandBookHeroID'); }
    },
    {
        name: 'task', path: 'ConfigTaskTarget',
        custom: function (arr: any[]) { return toMap(arr, 'TargetID'); }
    },
    {
        name: 'sevenDay', path: 'ConfigActivitySevenDayTask',
        custom: function (arr: any[]) { return toMap(arr, 'ActivitySevenDayTaskID'); }
    },
    {
        name: 'activityLogin', path: 'ConfigActivityOpenServiceLogin',
        custom: function (arr: any[]) { return toMap(arr, 'ActivityOpenServiceLoginID'); }
    },
    {
        name: 'randomName', path: 'ConfigRandomName',
        custom: function (arr: any[]) { return toMap(arr, 'RandomNameID'); }
    },
    {
        name: 'heroIntroduce', path: 'ConfigHeroIntroduce',
        custom: function (arr: any[]) { return toMap(arr, 'HeroIntroduceID'); }
    },
    {
        name: 'activityList', path: 'ConfigActivityList',
        custom: function (arr: any[]) { return toMap(arr, 'ActiveListID'); }
    },
    {
        name: 'activitySignIn', path: 'ConfigActivitySignIn',
        custom: function (arr: any[]) { return toMap(arr, 'SignInID'); }
    },
    {
        name: 'activityGetPower', path: 'ConfigActivityGetPower',
        custom: function (arr: any[]) { return toMap(arr, 'GetPowerID'); }
    },
    {
        name: 'activityLevelReward', path: 'ConfigActivityLevelReward',
        custom: function (arr: any[]) { return toMap(arr, 'LevelRewardID'); }
    },
    {
        name: 'battlePass', path: 'ConfigBattlePass',
        custom: function (arr: any[]) { return toMap(arr, 'ID'); }
    },
    {
        name: 'failGuide', path: 'ConfigFailGuide',
        custom: function (arr: any[]) { return toMap(arr, 'FailGuideId'); }
    },
    {
        name: 'guildLevel', path: 'ConfigGuildLevel',
        custom: function (arr: any[]) { return toMap(arr, 'GuildLevelID'); }
    },
    {
        name: 'guildRole', path: 'ConfigGuildRole',
        custom: function (arr: any[]) { return toMap(arr, 'GuildRoleID'); }
    },
    {
        name: 'guildMonster', path: 'ConfigGuildMonster',
        custom: function (arr: any[]) { return toMap(arr, 'GuildMonsterID'); }
    },
    {
        name: 'guildDonate', path: 'ConfigGuildDonate',
        custom: function (arr: any[]) { return toMap(arr, 'ID'); }
    },
    {
        name: 'shopType', path: 'ConfigShopType',
        custom: function (arr: any[]) { return toMap(arr, 'ShopTypeID'); }
    },
    {
        name: 'produce', path: 'ConfigProduce',
        custom: function (arr: any[]) { return toMap(arr, 'ProduceId'); }
    },
    {
        name: 'smeltRandom', path: 'ConfigSmeltRandom',
        custom: function (arr: any[]) { return toMap(arr, 'SmeltRandomID'); }
    },
    {
        name: 'smeltRandomBatching', path: 'ConfigSmeltRandomBatching',
        custom: function (arr: any[]) { return toMap(arr, 'SmeltRandomBatchingID'); }
    },
    {
        name: 'smeltRecipe', path: 'ConfigSmeltChangeless',
        custom: function (arr: any[]) { return toMap(arr, 'SmeltChangelessItemID'); }
    },
    {
        name: 'dispatchTask', path: 'ConfigDispatchTask',
        custom: function (arr: any[]) { return toMap(arr, 'ID'); }
    },
    {
        name: 'dispatchLevel', path: 'ConfigDispatchLevel',
        custom: function (arr: any[]) { return toMap(arr, 'ID'); }
    },
    {
        name: 'sageQA', path: 'ConfigSageQA',
        custom: function (arr: any[]) { return toMap(arr, 'ID'); }
    },
    {
        name: 'lottery', path: 'ConfigActivityDayDraw',
        custom: function (arr: any[]) { return toMap(arr, 'ID'); }
    },
    {
        name: 'rechargeRebate', path: 'ConfigActivityRechargeRebate',
        custom: function (arr: any[]) { return toMap(arr, 'RebateID'); }
    },
    {
        name: 'dayRecharge', path: 'ConfigActivityDayRecharge',
        custom: function (arr: any[]) { return toMap(arr, 'ID'); }
    },
    {
        name: 'cumulativeRecharge', path: 'ConfigActivityCumulativeRecharge',
        custom: function (arr: any[]) { return toMap(arr, 'ID'); }
    },
    {
        name: 'doubleWeekList', path: 'ConfigActivityWeekSummonList',
        custom: function (arr: any[]) { return toMap(arr, 'ID'); }
    },
    {
        name: 'doubleWeekReward', path: 'ConfigActivityWeekSummonReward'
    },
    {
        name: 'doubleWeekTask', path: 'ConfigActivityWeekSummonTask'
    },
    {
        name: 'monthlyCard', path: 'ConfigActivityMonthCard',
        custom: function (arr: any[]) { return toMap(arr, 'ID'); }
    },
    {
        name: 'shopGiftScene', path: 'ConfigShopGiftScene',
        custom: function (arr: any[]) { return toMap(arr, 'GiftID'); }
    },
    {
        name: 'functionGuide', path: 'ConfigFunctionGuide',
        custom: function (arr: any[]) {
            let lvKeys: string[] = ['FunctionGuideCondition', 'FunctionGuideTeam'];
            let guideArr =  toMultiLvMap(arr, true, ...lvKeys);
            let keys = Object.keys(guideArr);
            keys.forEach((ele) => {
                let data = guideArr[ele];
                let key1 = Object.keys(data);
                data['groups'] = [];
                for(let i = 0, len = key1.length; i < len; i++){
                  data['groups'].push(parseInt(key1[i]));
                  data[key1[i]].sort((a:any, b:any) => {
                      return a.FunctionGuideOrder - b.FunctionGuideOrder;
                  });
                }
                data['groups'].sort((a:any, b:any) => {return b - a});
            });
            return guideArr;
        }
    },
    {
        name: 'game', path: 'ConfigGame'
    },
    {
        name: 'LeadEnlightenment', path: 'ConfigLeadEnlightenment',
        custom: function (arr: any[]) { return toMap(arr, 'LeadEnlightenmentID') }
    },
    {
        name: 'reportReason', path: 'ConfigReportReason',
        custom: function (arr: any[]) { return toMap(arr, 'ReportReasonId') }
    },
    {
        name: 'rankName', path: 'ConfigRankName',
        custom: function (arr: any[]) { return toMap(arr, 'RankNameId') }
    },
    {
        name: 'rankReward', path: 'ConfigRankReward',
        custom: function (arr: any[]) { return toMapWithClassify(arr, 'RankType') }
    },
    {
        name: 'strategyStrong', path: 'ConfigStrategyStrong',
        custom: function (arr: any[]) { return toMap(arr, 'StrategyStrongId') }
    },
    {
        name: 'strategyFAQ', path: 'ConfigStrategyFAQ',
        custom: function (arr: any[]) { return toMap(arr, 'StartegyFAQId') }
    },
    {
        name: 'strategyEquip', path: 'ConfigStrategyEquip',
        custom: function (arr: any[]) { return toMap(arr, 'StrategyEquipId') }
    },
    {
        name: 'strategyMoney', path: 'ConfigStrategyMoney',
        custom: function (arr: any[]) { return toMap(arr, 'StrategyMoneyId') }
    },
    {
        name: 'strategyTeam', path: 'ConfigStrategyTeam',
        custom: function (arr: any[]) { return toMap(arr, 'StrategyTeamId') }
    },
    {
        name: 'strategyHero', path: 'ConfigStrategyHero',
        custom: function (arr: any[]) { return toMap(arr, 'StrategyHeroId') }
    },
    {
        name: 'onlineReward', path: 'ConfigOnlineReward',
        custom: function (arr: any[]) { return toMap(arr, 'OnlineRewardID') }
    },
    {
        name: 'beast', path: 'ConfigBeast',
        custom: function (arr: any[]) { return toMap(arr, 'BeastID') }
    },
    {
        name: 'mainTaskReward', path: 'ConfigTaskMainReward',
        custom: function (arr: any[]) { return toMap(arr, 'TaskMainRewardID') }
    },
    {
      name: 'consecrate', path: 'ConfigConsecrate',
      custom: function(arr: any[]) { return toMapWithClassify(arr, 'ConsecrateType')}
    },
    {
      name: 'consecrateGoods', path: 'ConfigConsecrateGoods',
      custom: function(arr: any[]) { return toMap(arr, 'ConsecrateGoodsID')}
    },
    {
      name: 'consecrateCome', path: 'ConfigConsecrateCome',
      custom: function(arr: any[]) { return toMap(arr, 'ConsecrateComeID')}
    },
    {
      name: 'pveChallengeBasic', path: 'ConfigPVEChallengeBasic',
      custom: function(arr: any[]) { return toMap(arr, 'PVEChallengeBasicId')}
    },
    {
      name: 'pveChallengeMonster', path: 'ConfigPVEChallengeMonster',
      custom: function(arr: any[]) { return toMap(arr, 'PVEChallengeMonsterId')}
    },
    {
      name: 'pveChallengeReward', path: 'ConfigPVEChallengeReward',
      custom: function(arr: any[]) { return toMap(arr, 'PVEChallengeRewardId')}
    },
    {
      name: 'pveChallengeShop', path: 'ConfigPVEChallengeShop',
      custom: function(arr: any[]) { return toMap(arr, 'PVEChallengeShopId')}
    },
    {
        name: 'pveFairyIslandBuff', path: 'ConfigPVEFairyIslandBuff',
        custom: function(arr: any[]) { return toMap(arr, 'PVEFairyIslandBuffId')}
    },
    {
        name: 'pveFairyIslandMonster', path: 'ConfigPVEFairyIslandMonster',
        custom: function(arr: any[]) { return toMap(arr, 'PVEFairyIslandMonsterId')}
    },
    {
        name: 'pveMindDemonMonster', path: 'ConfigPVEMindDemonMonster',
        custom: function(arr: any[]) { return toMap(arr, 'PVEMindDemonMonsterOpenDay')}
    },
    {
        name: 'pveMindDemonReward', path: 'ConfigPVEMindDemonReward',
        custom: function(arr: any[]) { return toMapWithClassify(arr, 'PVEMindDemonRewardType')}
    },
	{
      name: 'pveInfernalBasic', path: 'ConfigPVEInfernalBasic',
      custom: function(arr: any[]) { return toMap(arr, 'PVEInfernalBasicId')}
    },
    {
     name: 'pveInfernalBuff', path: 'ConfigPVEInfernalBuff',
     custom: function(arr: any[]) { return toMap(arr, 'PVEInfernalBuffId')}
    },
    {
     name: 'pveInfernalShop', path: 'ConfigPVEInfernalShop',
     custom: function(arr: any[]) { return toMap(arr, 'PVEInfernalShopId')}
    },
    {
     name: 'pveInfernalMonster', path: 'ConfigPVEInfernalMonster',
     custom: function(arr: any[]) { return toMap(arr, 'PVEInfernalMonsterId')}
    },
    {
     name: 'pveInfernalTrap', path: 'ConfigPVEInfernalTrap',
     custom: function(arr: any[]) { return toMap(arr, 'PVEInfernalTrapId')}
    },
    {
        name: 'pvpTopBattleRank', path: 'ConfigPVPTopBattleRank',
        custom: function(arr: any[]) { return toMap(arr, 'PVPTopBattleRankId')}
    },
    {
        name: 'firstPay', path: 'ConfigFirstPay',
        custom: function(arr: any[]) {return toMap(arr, 'FirstPayId')}
    },
    {
        name: 'activityHeroGrowUp', path: 'ConfigActivityHeroGrowUp',
        custom: function(arr: any[]) {return toMap(arr, 'ActivityHeroGrowUpId')}
    },
	  {
        name: 'pveOpenDoor', path: 'ConfigPVEOpenDoor',
        custom: function(arr: any[]) { return toMap(arr, 'PVEOpenDoorId')}
    },
    {
        name: 'activityPreview', path: 'ConfigActivityNextShow',
        custom: function(arr: any[]) { return toMap(arr, 'ActivityNextShowId');}
    },
    {
        name: 'activityFeastGift', path: 'ConfigActivityFeastGift',
        custom: function(arr: any[]) { return toMap(arr, 'ActivityFeastGiftId');}
    },
    {
        name: 'activityWeekSummonBattlePass', path: 'ConfigActivityWeekSummonBattlePass',
        custom: function(arr: any[]) { return toMap(arr, 'OnlyID');}
    },
    {
        name: 'activityMonthCardGift', path: 'ConfigActivityMonthCardGift',
        custom: function(arr: any[]) { return toMap(arr, 'ActivityMonthCardGiftDay');}
    },
    {
        name: 'guildBattleBuild', path: 'ConfigGuildBattleBuild',
        custom: function(arr: any[]) { return toMap(arr, 'GuildBattleBuildId');}
    },
    {
        name: 'guildBattleRank', path: 'ConfigGuildBattleRank',
        custom: function(arr: any[]) { return toMap(arr, 'GuildBattleRankId');}
    },
];
declare var require: any;

export class ConfigManager {
    private static _instance: ConfigManager = null;
    private _configs: object = null;
    private _configsKeys: {[key: string]: Array<any>} = null;   // 存储config的keys的数组，避免使用for-in遍历，效率很低
    private __DFKCache__: object = null;

    private constructor() {
        this._configs = {};
        this._configsKeys = {};
        this.__DFKCache__ = {};
    }

    static getInstance(): ConfigManager {
        if (!this._instance) {
            this._instance = new ConfigManager();
        }
        return this._instance;
    }

    async init() {

        // let resource = arguments[0];
        // if (!resource) {
        // 直接从ts文件里加载配置
        CONFIGS.forEach(info => {
            let cfgTs = utils.sRequire(info.path, `../config/`);
            //@ts-ignore
            this._configs[info.name] = info.custom ? info.custom(cfgTs) : cfgTs;
            //@ts-ignore
            if(typeof (this._configs[info.name]) == 'object' && !Array.isArray((this._configs[info.name]))) {
                //@ts-ignore
                this._configsKeys[info.name] = Object.keys(this._configs[info.name]);
            }
        }, this);

        // } else {
        //     // 从json文件里加载配置
        //     for (let i = 0; i < resource.length; i++) {
        //         let config = resource[i];
        //         this._configs[config.name] = config.json;
        //     }
        // }
    }

    getConfigs(configName: string): any {
        //@ts-ignore
        return this._configs[configName] || null;
    }

    getConfigList(configName: string): any[] {
        let info = CONFIGS.find(ele => {
            return ele.name == configName;
        });
        if(!info) return [];
        return utils.sRequire(info.path, `../config/`)
    }

    getConfigByKey(configName: string, key: string | number): any {
        //@ts-ignore
        if (!!this._configs[configName]) {
            if (key != undefined && key != null) {
                //@ts-ignore
                return this._configs[configName][key];
            }
        }
        return null;
    }

    getConfigByKV(configName: string, mkey: string | number, mkv: number | string): any[] {
        let temp: any[] = null;
        let serchKey: string = `${configName}_${mkey}_${mkv}`;
        //@ts-ignore
        temp = this.__DFKCache__[serchKey];
        if (temp) {
            return temp;
        }

        temp = [];
        let config = this.getConfigs(configName);
        if (!config) return null;

        for (const k in config) {
            let item = config[k];
            if (item && typeof item == 'object') {
                let kv = item[`${mkey}`];
                // if (typeof kv == 'number' && kv == mkv) {
                if (kv == mkv) {
                    temp.push(item);
                }
            }
        }

        // @ts-ignore
        this.__DFKCache__[serchKey] = temp;
        return temp;
    }

    getConfigNameByTableName(tableName: string): string {
        let name: string = null;
        CONFIGS.some(info => {
            if (info.path == tableName) {
                name = info.name;
                return true;
            } else if (tableName == "Property") {
                name = "property";
                return true;
            } else {
                return false;
            }
        });
        return name;
    }

    getConfigByManyKV(configName: string, mkey1: string | number, mkv1: number,
        mkey2?: string, mkv2?: number,
        mkey3?: string, mkv3?: number,
        mkey4?: string, mkv4?: number,
        mkey5?: string, mkv5?: number): any[] {
        let temp = [];
        let config = this.getConfigs(configName);
        if (!config) return null;

        let configKeys = this.getConfigKeys(configName);
        for (let i = 0; i < configKeys.length; ++i) {
            let item = config[configKeys[i]];
            if (item && typeof item == 'object') {
                // 这里注意，如果配置的值是0，则默认是无限制！
                // 比如职业配置了0，则说明职业1 2 3 4都符合
                let judge1 = (mkey1 != null) ? (item[`${mkey1}`] == 0 || item[`${mkey1}`] == mkv1) : true;
                let judge2 = (mkey2 != null) ? (item[`${mkey2}`] == 0 || item[`${mkey2}`] == mkv2) : true;
                let judge3 = (mkey3 != null) ? (item[`${mkey3}`] == 0 || item[`${mkey3}`] == mkv3) : true;
                let judge4 = (mkey4 != null) ? (item[`${mkey4}`] == 0 || item[`${mkey4}`] == mkv4) : true;
                let judge5 = (mkey5 != null) ? (item[`${mkey5}`] == 0 || item[`${mkey5}`] == mkv5) : true;

                if (judge1 && judge2 && judge3 && judge4 && judge5) {
                    temp.push(item);
                }
            }
        }

        return temp;
    }

    getOneConfigByManyKV(configName: string, mkey1: string | number, mkv1: number,
        mkey2?: string, mkv2?: number,
        mkey3?: string, mkv3?: number,
        mkey4?: string, mkv4?: number,
        mkey5?: string, mkv5?: number): any {
        let config = this.getConfigs(configName);
        if (!config) return null;

        let keys = this.getConfigKeys(configName);
        for (let i = 0; i < keys.length; ++i) {
            let item = config[keys[i]];
            if (item && typeof item == 'object') {
                // 这里注意，如果配置的值是0，则默认是无限制！
                // 比如职业配置了0，则说明职业1 2 3 4都符合
                let judge1 = (mkey1 != null) ? (item[`${mkey1}`] == 0 || item[`${mkey1}`] == mkv1) : true;
                let judge2 = (mkey2 != null) ? (item[`${mkey2}`] == 0 || item[`${mkey2}`] == mkv2) : true;
                let judge3 = (mkey3 != null) ? (item[`${mkey3}`] == 0 || item[`${mkey3}`] == mkv3) : true;
                let judge4 = (mkey4 != null) ? (item[`${mkey4}`] == 0 || item[`${mkey4}`] == mkv4) : true;
                let judge5 = (mkey5 != null) ? (item[`${mkey5}`] == 0 || item[`${mkey5}`] == mkv5) : true;

                if (judge1 && judge2 && judge3 && judge4 && judge5) {
                    return item;
                }
            }
        }

        return null;
    }

    getMapEditConfig(configName: string) {
        let cfgTs = utils.sRequire(configName, `../config/mapEditConfig/`);
        if (cfgTs) {
            return cfgTs;
        }
        return null;
    }

    getAnyConfig(configName: string) {
        let cfgTs = utils.sRequire(configName, `../config/`);
        if (cfgTs) {
            return cfgTs;
        }
        return null;
    }

    /**
     * 获取缓存的keys数组进行遍历，不要直接用for-in，效率低，会造成卡顿
     * @param configName 配置名
     * @returns key数组
     */
    getConfigKeys(configName: string): Array<any> {
        return this._configsKeys[configName];
    }
}

export let configManager = ConfigManager.getInstance();

