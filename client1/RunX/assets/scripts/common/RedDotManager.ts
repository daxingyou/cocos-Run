import { activityUtils } from "../app/ActivityUtils";
import { CustomItemId } from "../app/AppConst";
import { BAG_ITEM_TYPE, EQUIP_PART_TYPE, EQUIP_TEXTURE_TYPE, HEAD_OPEN_TYPE, HEAD_TYPE, QUALITY_TYPE } from "../app/AppEnums";
import { utils } from "../app/AppUtils";
import { bagDataUtils } from "../app/BagDataUtils";
import { configUtils } from "../app/ConfigUtils";
import { cfg } from "../config/config";
import { activityData } from "../mvp/models/ActivityData";
import { bagData } from "../mvp/models/BagData";
import { divineData } from "../mvp/models/DivineData";
import { guildData } from "../mvp/models/GuildData";
import { mailData } from "../mvp/models/MailData";
import { pragmaticData } from "../mvp/models/PragmaticData";
import { pveData } from "../mvp/models/PveData";
import { pveTrialData } from "../mvp/models/PveTrialData";
import { pvpData } from "../mvp/models/PvpData";
import { serverTime } from "../mvp/models/ServerTime";
import { taskData, TASK_TYPE } from "../mvp/models/TaskData";
import { trackData } from "../mvp/models/TrackData";
import { userData } from "../mvp/models/UserData";
import { Equip } from "../mvp/template/Equip";
import HeroUnit from "../mvp/template/HeroUnit";
import ItemRedDot from "../mvp/views/view-item/ItemRedDot";
import { data } from "../network/lib/protocol";
import { configManager } from "./ConfigManager";
import { localStorageMgr, SAVE_TAG } from "./LocalStorageManager";

enum RED_DOT_MODULE{
    MAIN_HEAD = 'MAIN_HEAD',
    USER_HEAD = "USER_HEAD",
    USER_HEAD_TOGGLE = "USER_HEAD_TOGGLE",
    HEAD_FRAME = 'HEAD_FRAME',
    HEAD_FRAME_TOGGLE = 'HEAD_FRAME_TOGGLE',
    USER_INFO_HEAD = 'USER_INFO_HEAD',
    MAIN_HERO_HANDBOOK = 'MAIN_HERO_HANDBOOK',
    HERO_HANDBOOK_REWARD = 'HERO_HANDBOOK_REWARD',
    HERO_HANDBOOK_ITEM = 'HERO_HANDBOOK_ITEM',
    HERO_HANDBOOK_NEXT_PAGE = 'HERO_HANDBOOK_NEXT_PAGE',
    MAIN_MAIL = 'MAIN_MAIL',
    MAIL_ITEM = 'MAIL_ITEM',
    MAIL_REWARD = 'MAIL_REWARD',
    MAIL_ALL_REWARD = 'MAIL_ALL_REWARD',
    MAIN_HERO = 'MAIN_HERO',
    HERO_ITEM = 'HERO_ITEM',
    HERO_ADVANCE = 'HERO_ADVANCE',
    HERO_NEXT_PAGE = 'HERO_NEXT_PAGE',
    HERO_GIFT_ITEM = 'HERO_GIFT_ITEM',
    HERO_GIFT_TOGGLE = 'HERO_GIFT_TOGGLE',
    MAIN_BAG = 'MAIN_BAG',
    BAG_PROP_TOGGLE = 'BAG_PROP_TOGGLE',
    BAG_ITEM_PROP = 'BAG_ITEM_PROP',
    BAG_EQUIP_TOGGLE = 'BAG_EQUIP_TOGGLE',
    BAG_ITEM_EQUIP = 'BAG_ITEM_EQUIP',
    MAIN_SHOP = 'MAIN_SHOP',
    SHOP_GIFT_TOGGLE = 'SHOP_GIFT_TOGGLE',
    SHOP_GIFT_ITEM = 'SHOP_GIFT_ITEM',
    SHOP_RANDOM_TOGGLE = 'SHOP_RANDOM_TOGGLE',
    BAGVIEW_EQUIP_TOGGLE = 'BAGVIEW_EQUIP_TOGGLE',
    EQUIP_BROKEN_TOGGLE = 'EQUIP_BROKEN_TOGGLE',
    EQUIP_SPIRIT_TOGGLE = 'EQUIP_SPIRIT_TOGGLE',
    EQUIP_BROKEN_BUTTON = 'EQUIP_BROKEN_BUTTON',
    EQUIP_ENHANCE_TOGGLE = 'EQUIP_ENHANCE_TOGGLE',
    MAIN_SUMMON = 'MAIN_SUMMON',
    SUMMON_HERO_TOGGLE = 'SUMMON_HERO_TOGGLE',
    SUMMON_EQUIP_TOGGLE = 'SUMMON_EQUIP_TOGGLE',
    SUMMON_BEAST_TOGGLE = 'SUMMON_BEAST_TOGGLE',
    SUMMON_BUTTON = 'SUMMON_BUTTON',
    SUMMON_TEN_BUTTON = 'SUMMON_TEN_BUTTON',
    MAIN_LEVEL_MAP = 'MAIN_LEVEL_MAP',
    LEVEL_MAP_CHAPTER_REWARD = 'LEVEL_MAP_CHAPTER_REWARD',
    LEVEL_MAP_LESSON_REWARD = 'LEVEL_MAP_LESSON_REWARD',
    LEVEL_MAP_CHAPTER_LIST = 'LEVEL_MAP_CHAPTER_LIST',
    MAIN_TASK = 'MAIN_TASK',
    TASK_DAY_TOGGLE = 'TASK_DAY_TOGGLE',
    TASK_WEEK_TOGGLE = 'TASK_WEEK_TOGGLE',
    TASK_ACHIEVEMENT_TOGGLE = 'TASK_ACHIEVEMENT_TOGGLE',
    MAIN_PVE = 'MAIN_PVE',
    PVE_EXTREME_TOGGLE = 'PVE_EXTREME_TOGGLE',
    PVE_MAGIC_DOOR_REWARD = 'PVE_MAGIC_DOOR_REWARD',
    PVE_CLOUD_DREAM_REWARD = 'PVE_CLOUD_DREAM_REWARD',
    MAIN_ACTIVITY = 'MAIN_ACTIVITY',
    ACTIVITY_PHYSICAL_TOGGLE = 'ACTIVITY_PHYSICAL_TOGGLE',
    ACTIVITY_LEVEL_TOGGLE = 'ACTIVITY_LEVEL_TOGGLE',
    ACTIVITY_SIGN_TOGGLE = 'ACTIVITY_SIGN_TOGGLE',
    ACTIVITY_SIGN_ITEM = 'ACTIVITY_SIGN_ITEM',
    ACTIVITY_LOGIN_TOGGLE = 'ACTIVITY_LOGIN_TOGGLE',
    ACTIVITY_MONTHLY_CARD_TOGGLE = 'ACTIVITY_MONTHLY_CARD_TOGGLE',
    ACTIVITY_LOTTERY_TOGGLE = 'ACTIVITY_LOTTERY_TOGGLE',
    ACTIVITY_BATTLE_PASS_TOGGLE = 'ACTIVITY_BATTLE_PASS_TOGGLE',
    ACTIVITY_CUMULATIVE_RECHARGE_TOGGLE = 'ACTIVITY_CUMULATIVE_RECHARGE_TOGGLE',
    ACTIVITY_PER_DAY_RECHARGE_TOGGLE = 'ACTIVITY_PER_DAY_RECHARGE_TOGGLE',
    ACTIVITY_DOUBLE_WEEK_TOGGLE = 'ACTIVITY_DOUBLE_WEEK_TOGGLE',
    ACTIVITY_DOUBLE_WEEK_REWARD_TOGGLE = 'ACTIVITY_DOUBLE_WEEK_REWARD_TOGGLE',
    ACTIVITY_DOUBLE_WEEK_TASK_TOGGLE = 'ACTIVITY_DOUBLE_WEEK_TASK_TOGGLE',
    ACTIVITY_DOUBLE_WEEK_GIFT_TOGGLE = 'ACTIVITY_DOUBLE_WEEK_GIFT_TOGGLE',
    HERO_EQUIP_TOGGLE= 'HERO_EQUIP_TOGGLE',
    HERO_EQUIP_DRESS_TOGGLE= 'HERO_EQUIP_DRESS_TOGGLE',
    HERO_GIF_ICON= 'HERO_GIF_ICON',
    HERO_DETAIL_BUTTON = 'HERO_DETAIL_BUTTON',
    SEVENDAY_ENTRY = 'SEVEN_DAY_ENTRY',
    SEVENDAY_TASK = 'SEVEN_DAY_TASK',
    SEVENDAY_REWARD = 'SEVEN_DAY_REWARD',
    LOTTERY_TAKE = `LOTTERY_TAKE`,
    PVP_DEIFY_FIGHT_RECORD = 'PVP_DEIFY_FIGHT_RECORD',
    MAIN_GUILD = 'MAIN_GUILD',
    GUILD_BOSS_REWARD = 'GUILD_BOSS_REWARD',
    GUILD_NEW_APPLY = 'GUILD_NEW_APPLY',
    GUILD_TASKS = 'GUILD_TASKS',
    MAIN_DIVINE_SYSTEM = 'MAIN_DIVINE_SYSTEM',
    MAIN_CHARACTER = 'MAIN_CHARACTER',
    MAIN_TREASURE = 'MAIN_TREASURE',
    TREASURE_TOGGLE = 'TREASURE_TOGGLE',
    BAG_ITEM_TREASURE = 'BAG_ITEM_TREASURE',
    PRAGMATIC_TOGGLE = 'PRAGMATIC_TOGGLE',
    BAG_VIEW_EQUIP_ENHANCE_BTN = 'BAG_VIEW_EQUIP_ENHANCE_BTN',
    BAG_VIEW_EQUIP_BREAK_BTN = 'BAG_VIEW_EQUIP_BREAK_BTN',
    BAG_VIEW_EQUIP_SPIRIT_BTN = 'BAG_VIEW_EQUIP_SPIRIT_BTN',
    EQUIP_SPIRIT_NODE_SPIRIT_BTN = 'EQUIP_SPIRIT_NODE_SPIRIT_BTN',
    EQUIP_ENHANCE_NODE_ENGANCE_BTN = 'EQUIP_ENHANCE_NODE_ENGANCE_BTN',
    BAG_ITEM_MATERIAL = 'BAG_ITEM_MATERIAL',
    BAG_MATERIAL_TOGGLE = 'BAG_MATERIAL_TOGGLE',
    ONLINE_REWARD_BTN = 'ONLINE_REWARD_BTN',
    ONLINE_REWARD_DETAIL_ITEM = 'ONLINE_REWARD_ITEM',
    MAIN_TASK_TARGET_REWARD = 'MAIN_TASK_TARGET_REWARD',
	CHALLENGE_STAGE_AWARD = 'CHALLENGE_STAGE_AWARD',
}
/**
 * 为了展示new
 */
enum RED_DOT_NEW_DATA_TYPE {
    HERO,
    HEAD_FRAME,
    HEAD,
    EQUIP,
    TREASURE,
    RANDOM_SHOP,
    PROP,
    MATERIAL,
}

enum RED_DOT_TYPE {
    NORMAL = 1,             // 普通红点
    NEW,                    // new
    TOGGLE                  // 选中就会消失
}

interface RED_DOT_INFO {
    cmps: Map<string, ItemRedDot>
}

interface NEW_DATA_INFO {
    data: any[],
    isCanClear: boolean
}

class RedDotManager {
    private _redDotMap: Map<string, RED_DOT_INFO> = new Map();
    private _moduleData: Map<RED_DOT_NEW_DATA_TYPE, any> = new Map();       // 存储上次数据
    private _newData: Map<RED_DOT_NEW_DATA_TYPE, NEW_DATA_INFO> = new Map();
    deInit() {
        this._redDotMap.clear();
        this._moduleData.clear();
        this._newData.clear();
    }

    register(redDotCmp: ItemRedDot) {
        if(!cc.isValid(redDotCmp)) return;
        let moduleName: string = redDotCmp.module;
        if(!this._redDotMap.has(moduleName)) {
            this._redDotMap.set(moduleName, {cmps: new Map()});
        }

        let cmps = this._redDotMap.get(moduleName).cmps;
        if(!cmps.has(redDotCmp.uuid)){
          cmps.set(redDotCmp.uuid, redDotCmp);
        }
    }

    fire(moduleName: RED_DOT_MODULE, subName: string = '') {
        let name: string = moduleName;
        if(subName.length > 0){
            name = `${moduleName}_${subName}`;
        }
        let module = this._redDotMap.get(name);
        if(!module) return;

        let cmps = module.cmps;
        if(!cmps || cmps.size == 0) return;

        let inValidCmps: string[] = null;
        cmps.forEach(ele => {
            if(!cc.isValid(ele) || !cc.isValid(ele.node)){
                inValidCmps = inValidCmps || [];
                inValidCmps.push(ele.uuid);
                return;
            }
            ele.refreshView();
        });
        inValidCmps && inValidCmps.length > 0 && inValidCmps.forEach(ele => {
            cmps.delete(ele);
        });
    }

    unregister(redDotCmp: ItemRedDot) {
        if(!redDotCmp) return;
        let moduleName = redDotCmp.module;
        let module = this._redDotMap.get(moduleName);

        if(!module) return;
        let cmps = module.cmps;
        if(!cmps || cmps.size == 0) {
            this._redDotMap.delete(moduleName);
            return;
        }

        cmps.has(redDotCmp.uuid) && cmps.delete(redDotCmp.uuid);
        cmps.size == 0 && this._redDotMap.delete(moduleName);
    }

    getRedDot(moduleName: string, subName: any = null): ItemRedDot {
        let name = moduleName;
        subName && (name = `${moduleName}_${subName}`);
        let module = this._redDotMap.get(name);
        if(!module) return null;

        let cmps = module.cmps;
        if(!cmps || cmps.size == 0) return null;
        return cmps.values().next().value;
    }

    removeRedDot(moduleName: string, subName: any = null) {
        let name = moduleName;
        subName && (name = `${moduleName}_${subName}`);
        if(!this._redDotMap.has(name)) return;
        this._redDotMap.delete(name);
    }

    updateData(bagData?: data.IBagUnit[]) {
        this.updateNewData(RED_DOT_NEW_DATA_TYPE.HERO);
        this.updateNewData(RED_DOT_NEW_DATA_TYPE.EQUIP);
        this.updateNewData(RED_DOT_NEW_DATA_TYPE.HEAD_FRAME);
        this.updateNewData(RED_DOT_NEW_DATA_TYPE.HEAD);
        this.updateNewData(RED_DOT_NEW_DATA_TYPE.TREASURE, bagData);
        this.updateNewData(RED_DOT_NEW_DATA_TYPE.PROP, bagData);
        this.updateNewData(RED_DOT_NEW_DATA_TYPE.MATERIAL, bagData);
    }

    getRedDotState(module: RED_DOT_MODULE) {
        switch(module) {
            case RED_DOT_MODULE.HEAD_FRAME: {
                break;
            }
        }
    }

    /********************************** 英雄模块 ************************************ */

    //检查是否有可穿戴的装备
    private _checkHeroCanDressEquip(heroUnit: HeroUnit){
        if(!heroUnit) return false;
        let heroId = heroUnit.heroCfg.HeroBasicId;
        return (!heroUnit.getHeroEquipByPart(EQUIP_PART_TYPE.BOOT) && bagDataUtils.isHasDressedEquip(EQUIP_PART_TYPE.BOOT, heroId))
        || (!heroUnit.getHeroEquipByPart(EQUIP_PART_TYPE.CHEST) && bagDataUtils.isHasDressedEquip(EQUIP_PART_TYPE.CHEST, heroId))
        || (!heroUnit.getHeroEquipByPart(EQUIP_PART_TYPE.HELMET) && bagDataUtils.isHasDressedEquip(EQUIP_PART_TYPE.HELMET, heroId))
        || (!heroUnit.getHeroEquipByPart(EQUIP_PART_TYPE.NECKLACE) && bagDataUtils.isHasDressedEquip(EQUIP_PART_TYPE.NECKLACE, heroId))
        || (!heroUnit.getHeroEquipByPart(EQUIP_PART_TYPE.RING) && bagDataUtils.isHasDressedEquip(EQUIP_PART_TYPE.RING, heroId))
        || (!heroUnit.getHeroEquipByPart(EQUIP_PART_TYPE.WEAPON) && bagDataUtils.isHasDressedEquip(EQUIP_PART_TYPE.WEAPON, heroId))
        || (!heroUnit.getHeroEquipByPart(EQUIP_PART_TYPE.EXCLUSIVE) && bagDataUtils.isHasDressedEquip(EQUIP_PART_TYPE.EXCLUSIVE, heroId))
    }

    //检查是否有可加的天赋点
    private _checkHeroCanAddGift(heroUnit: HeroUnit) {
        if(!heroUnit || !heroUnit.isHeroBasic) return false;
        let heroCfg = heroUnit.heroCfg;
        let gifts: cfg.HeroGift[] = configManager.getConfigByManyKV('heroGift', 'HeroGiftHeroId', heroCfg.HeroBasicId);
        if(!gifts || gifts.length == 0) return false;

        let heroGifts = heroUnit.gift || {};
        let checkCanAddFunc = (cfg: cfg.HeroGift) => {
            if(heroUnit.gift[cfg.HeroGiftId]) return false;
            if(cfg.HeroGiftNeedLevel > heroUnit.lv) return false;
            if(cfg.HeroGiftOrder && !heroGifts[cfg.HeroGiftOrder]) return false;
            if(cfg.HeroGiftCost && cfg.HeroGiftCost.length > 0){
                let costs = utils.parseStingList(cfg.HeroGiftCost);
                let result = costs.every(ele => {
                    let itemId: number = parseInt(ele[0]);
                    let count: number = parseFloat(ele[1]);
                    let bagCount = bagData.getItemCountByID(itemId);
                    return bagCount >= count;
                });
                return result;
            }
            return true;
        }
        return gifts.some(ele => {
            return checkCanAddFunc(ele);
        });
    }

    getHeroItemState(heroId: number, module: RED_DOT_MODULE) {
        let heroUnit = new HeroUnit(heroId);
        let result = {isNew: false, isRedDot: false}

        let heroCfg = heroUnit.heroCfg;
        let chips: number = bagData.getItemCountByID(heroCfg.HeroBasicItem);
        let needCount = 0;
        let starCfg = configManager.getOneConfigByManyKV('levelStar', 'LevelStarType', 1, 'LevelStarQuality', heroCfg.HeroBasicQuality, 'LevelStarNum', heroUnit.star);
        if(starCfg) {
            needCount = starCfg.LevelStarNeedSelf;
        }

        //装备红点
        if(RED_DOT_MODULE.HERO_EQUIP_TOGGLE == module 
            || RED_DOT_MODULE.HERO_ITEM == module
            || RED_DOT_MODULE.HERO_DETAIL_BUTTON == module 
            || RED_DOT_MODULE.MAIN_HERO == module) 
        {
            result.isRedDot = this._checkHeroCanDressEquip(heroUnit);
        }

        //天赋红点
        if(RED_DOT_MODULE.HERO_GIFT_TOGGLE == module
            || RED_DOT_MODULE.HERO_ITEM == module
            || RED_DOT_MODULE.HERO_DETAIL_BUTTON == module
            || RED_DOT_MODULE.MAIN_HERO == module)
        {
            result.isRedDot = this._checkHeroCanAddGift(heroUnit) || result.isRedDot;
        }

        //碎片合成
        if(!heroUnit.isHeroBasic && RED_DOT_MODULE.HERO_EQUIP_TOGGLE != module
              && RED_DOT_MODULE.HERO_GIFT_TOGGLE != module
              && RED_DOT_MODULE.HERO_DETAIL_BUTTON != module){
            // 可合成
            result.isRedDot = chips >= needCount || result.isRedDot;
            return result;
        }

        if(RED_DOT_MODULE.HERO_ITEM == module || RED_DOT_MODULE.MAIN_HERO == module) {
            let newDataInfo = this._newData.get(RED_DOT_NEW_DATA_TYPE.HERO);
            newDataInfo && newDataInfo.data && newDataInfo.data.some( _h => {
                    if(_h.ID == heroUnit.basicId){
                        result.isNew = true;
                        return true;
                    }
                    return false;
                });
        }

        //升星
        if(!(RED_DOT_MODULE.HERO_GIFT_TOGGLE == module 
                || RED_DOT_MODULE.HERO_EQUIP_TOGGLE == module
                || RED_DOT_MODULE.HERO_DETAIL_BUTTON == module )) {
            heroUnit.star < 6 && (result.isRedDot = chips >= needCount || result.isRedDot);
        }

        return result;
    }

    getMainHeroState(): boolean {
        let heros = bagData.getItemsByType(BAG_ITEM_TYPE.HERO);
        for(let i = 0; i < heros.length; ++i) {
            let curState = this.getHeroItemState(heros[i].ID, RED_DOT_MODULE.MAIN_HERO);
            if(curState.isNew || curState.isRedDot) {
                return true;
            }
        }
        return false;
    }

    clearHeroNewData(heroId: number) {
        let newDataInfo = this._newData.get(RED_DOT_NEW_DATA_TYPE.HERO);
        if(newDataInfo) {
            let newData = newDataInfo.data;
            if(newData && newData.length > 0) {
                let index = newData.findIndex(_h => { return _h.ID == heroId; });
                newData = newData.splice(index, 1);
            }
        }
    }

    //清除所有新英雄标记
    clearHeroAllNewData(){
        this.clearNewDataByType(RED_DOT_NEW_DATA_TYPE.HERO, true);
    }

    clearEquipAllNewData() {
        this.clearNewDataByType(RED_DOT_NEW_DATA_TYPE.EQUIP, true)
    }

    /********************************** 图鉴模块 ************************************ */
    getHandBookItemState(heroId: number, moduleName: RED_DOT_MODULE) {
        if(RED_DOT_MODULE.HERO_HANDBOOK_ITEM == moduleName) {
            let heroUnit = new HeroUnit(heroId);
            if(heroUnit && heroUnit.isHeroBasic) {
                let handCfgs: cfg.HandBook[] = configManager.getConfigByKV('handBook', 'HandBookHeroID', heroId);
                if(handCfgs && handCfgs.length > 0) {
                    let taskIds = handCfgs[0].HandBookHeroTask.split(';');
                    for(let i = 0; i < taskIds.length; ++i) {
                        let taskId: number = Number(taskIds[i]);
                        let taskCfg = configUtils.getTaskByTaskId(taskId);
                        if(taskCfg) {
                            let targetStar = Number(taskCfg.TargetGoalParam.split(';')[1]);
                            if(heroUnit.star >= targetStar && !taskData.getTaskIsReceiveReward(taskId)) {
                                return true;
                            }
                        }
                    }
                }
            }
        }
        return false;
    }

    getHandBookState() {
        let heros = bagData.getItemsByType(BAG_ITEM_TYPE.HERO);
        let checkCanRewardFunc = (heroId: number) => {
            let heroUnit = new HeroUnit(heroId);
            if(heroUnit && heroUnit.isHeroBasic) {
                let handCfgs: cfg.HandBook[] = configManager.getConfigByKV('handBook', 'HandBookHeroID', heroId);
                if(handCfgs && handCfgs.length > 0) {
                    let taskIds = handCfgs[0].HandBookHeroTask.split(';');
                    for(let i = 0; i < taskIds.length; ++i) {
                        let taskId: number = Number(taskIds[i]);
                        let taskCfg = configUtils.getTaskByTaskId(taskId);
                        if(taskCfg) {
                            let targetStar = Number(taskCfg.TargetGoalParam.split(';')[1]);
                            if(heroUnit.star >= targetStar && !taskData.getTaskIsReceiveReward(taskId)) {
                                return true;
                            }
                        }
                    }
                }
            }
            return false;
        }
        for(let i = 0; i < heros.length; ++i) {
            let heroId: number = heros[i].ID;
            let isCanReward = checkCanRewardFunc(heroId);
            if(isCanReward) {
                return true;
            }
        }
        return false;
    }

    /********************************** 任务模块 ************************************ */
    getTaskToggleState(moduleName: RED_DOT_MODULE): boolean {
        if(RED_DOT_MODULE.TASK_DAY_TOGGLE == moduleName || RED_DOT_MODULE.MAIN_TASK == moduleName) {
            let cfgs: cfg.TaskTarget[] = configManager.getConfigByKV('task', 'TargetModule', 1);
            if(cfgs) {
                for(let i = 0; i < cfgs.length; ++i) {
                    let cfg = cfgs[i];
                    if(taskData.checkSatisfyShow(cfg) && taskData.getTaskIsCompleted(cfg.TargetID) && !taskData.getTaskIsReceiveReward(cfg.TargetID)) {
                        return true;
                    }
                }
            }
        }
        if(RED_DOT_MODULE.TASK_WEEK_TOGGLE == moduleName || RED_DOT_MODULE.MAIN_TASK == moduleName) {
            let cfgs: cfg.TaskTarget[] = configManager.getConfigByKV('task', 'TargetModule', 2);
            if(cfgs) {
                for(let i = 0; i < cfgs.length; ++i) {
                    let cfg = cfgs[i];
                    if(taskData.getTaskIsCompleted(cfg.TargetID) && !taskData.getTaskIsReceiveReward(cfg.TargetID)) {
                        return true;
                    }
                }
            }
        }
        if(RED_DOT_MODULE.TASK_ACHIEVEMENT_TOGGLE == moduleName || RED_DOT_MODULE.MAIN_TASK == moduleName) {
            let cfgs: cfg.TaskTarget[] = configManager.getConfigByKV('task', 'TargetModule', 3);
            if(cfgs) {
                for(let i = 0; i < cfgs.length; ++i) {
                    let cfg = cfgs[i];
                    if(taskData.getTaskIsCompleted(cfg.TargetID) && !taskData.getTaskIsReceiveReward(cfg.TargetID)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    /********************************** 邮件模块 ************************************ */
    getMailState() {
        let mails = mailData.getMailData();
        for(const k in mails) {
            let mail = mails[k];
            if(!mail.Readed || (mail.Prizes && mail.Prizes.length != 0 && !mail.TakenOut)) {
                return true;
            }
        }
        return false;
    }

    /********************************** 背包模块 ************************************ */
    clearNewProp(bagItem: data.IBagUnit) {
        this.clearNewData(RED_DOT_NEW_DATA_TYPE.PROP, bagItem);
    }

    clearAllNewProps(){
        this.clearNewDataByType(RED_DOT_NEW_DATA_TYPE.PROP, true);
    }

    clearNewMaterial(bagItem: data.IBagUnit){
        this.clearNewData(RED_DOT_NEW_DATA_TYPE.MATERIAL, bagItem);
    }

    clearAllNewMaterials(){
        this.clearNewDataByType(RED_DOT_NEW_DATA_TYPE.MATERIAL, true);
    }

    getBagState() {
        const propState = this.getBagToggleState(RED_DOT_MODULE.BAG_PROP_TOGGLE);
        if(propState) return propState;
        const materialState = this.getBagToggleState(RED_DOT_MODULE.BAG_MATERIAL_TOGGLE);
        if(materialState) return materialState;
        const equipState = this.getBagToggleState(RED_DOT_MODULE.BAG_EQUIP_TOGGLE);
        if(equipState) return equipState;
        return false;
    }

    getBagToggleState(moduleName: RED_DOT_MODULE): boolean {
        if(RED_DOT_MODULE.BAG_PROP_TOGGLE == moduleName) {
            let newProps = this._newData.get(RED_DOT_NEW_DATA_TYPE.PROP);
            if(newProps && newProps.data && newProps.data.length > 0){
                return true;
            }
            const bagProps = bagData.getItemsByType(BAG_ITEM_TYPE.PROP);
            for(let i = 0; i < bagProps.length; ++i) {
                const prop = bagProps[i];
                const state = this.getBagItemState(RED_DOT_MODULE.BAG_ITEM_PROP, prop);
                if(state.isRedDot) {
                    return true
                }
            }
        } else if(RED_DOT_MODULE.BAG_EQUIP_TOGGLE == moduleName) {
            let equips = bagData.getItemsByType(BAG_ITEM_TYPE.EQUIP);
            for(let i = 0; i < equips.length; ++i) {
                let itemState = this.getBagItemState(RED_DOT_MODULE.BAG_ITEM_EQUIP, equips[i]);
                if(itemState.isNew || itemState.isRedDot) {
                    return true;
                }
            }
        } else if(RED_DOT_MODULE.TREASURE_TOGGLE == moduleName) {
            const bagProps = bagData.getItemsByType(BAG_ITEM_TYPE.TREASURE);
            for(let i = 0; i < bagProps.length; ++i) {
                const prop = bagProps[i];
                const state = this.getBagItemState(RED_DOT_MODULE.BAG_ITEM_TREASURE, prop);
                if(state.isNew || state.isRedDot) {
                    return true;
                }
            }
        } else if(RED_DOT_MODULE.BAG_MATERIAL_TOGGLE == moduleName){
            let newProps = this._newData.get(RED_DOT_NEW_DATA_TYPE.MATERIAL);
            if(newProps && newProps.data && newProps.data.length > 0){
                return true;
            }
        }
        return false;
    }

    getBagItemState(moduleName: RED_DOT_MODULE, bagItem: data.IBagUnit) {
        let isRedDot: boolean = false, isNew: boolean = false;
        if(bagItem) {
            if(RED_DOT_MODULE.BAG_ITEM_EQUIP == moduleName) {
                let newDataInfo = this._newData.get(RED_DOT_NEW_DATA_TYPE.EQUIP);
                if(newDataInfo) {
                    let newData = newDataInfo.data;
                    let equipId: number = bagItem.ID;
                    let seq: number = utils.longToNumber(bagItem.Seq);
                    if(newData && newData.length > 0) {
                        if(newData.find(_e => { return _e.ID == equipId && utils.longToNumber(_e.Seq) == seq; })) {
                            isNew = true;
                        }
                    }
                }
            } else if(RED_DOT_MODULE.BAG_ITEM_PROP == moduleName) {
                let cfg = configUtils.getItemConfig(bagItem.ID);
                if(cfg) {
                    isNew = this._checkPropIsNew(bagItem);
                    isRedDot = cfg.ItemComposeNum && bagData.getItemCountByID(bagItem.ID) >= cfg.ItemComposeNum;
                }
            } else if(RED_DOT_MODULE.BAG_ITEM_TREASURE == moduleName) {
                let newDataInfo = this._newData.get(RED_DOT_NEW_DATA_TYPE.TREASURE);
                if(newDataInfo) {
                    let newData = newDataInfo.data;
                    let equipId: number = bagItem.ID;
                    let seq: number = utils.longToNumber(bagItem.Seq);
                    if(newData && newData.length > 0) {
                        if(newData.find(_e => { return _e.ID == equipId })) {
                            isNew = true;
                        }
                    }
                }
            } else if(RED_DOT_MODULE.BAG_ITEM_MATERIAL == moduleName){
                isNew = this._checkMaterialIsNew(bagItem);
            }
        }
        return {isNew: isNew, isRedDot: isRedDot};
    }

    //检查道具是否新增
    private _checkPropIsNew(bagItem: data.IBagUnit){
        if(!bagItem) return false;
        let propCfg = configUtils.getItemConfig(bagItem.ID);
        if(!propCfg || !propCfg.ItemSort || propCfg.ItemSort != BAG_ITEM_TYPE.PROP) return false;
        let newDataInfo = this._newData.get(RED_DOT_NEW_DATA_TYPE.PROP);
        if(!newDataInfo) return false;
        let newData = newDataInfo.data;
        let propId: number = bagItem.ID;
        return newData.some(ele => {
            return propId == ele.ID;
        });
    }

    //检查材料是否新增
    private _checkMaterialIsNew(bagItem: data.IBagUnit){
        if(!bagItem) return false;
        let propCfg = configUtils.getItemConfig(bagItem.ID);
        if(!propCfg || !propCfg.ItemSort || propCfg.ItemSort != BAG_ITEM_TYPE.MATERIAL) return false;
        let newDataInfo = this._newData.get(RED_DOT_NEW_DATA_TYPE.MATERIAL);
        if(!newDataInfo) return false;
        let newData = newDataInfo.data;
        let propId: number = bagItem.ID;
        return newData.some(ele => {
            return propId == ele.ID;
        });
    }


    updateNewData(newDataType: RED_DOT_NEW_DATA_TYPE, item?: data.IBagUnit[]) {
        let preData: data.IBagUnit[] = this._moduleData.get(newDataType);

        let itemType = BAG_ITEM_TYPE.EQUIP;

        if(RED_DOT_NEW_DATA_TYPE.EQUIP == newDataType) {
            itemType = BAG_ITEM_TYPE.EQUIP;
        }

        if(RED_DOT_NEW_DATA_TYPE.HEAD_FRAME == newDataType) {
            itemType = BAG_ITEM_TYPE.HEAD_FRAME;
        }

        if(RED_DOT_NEW_DATA_TYPE.HEAD == newDataType) {
            itemType = BAG_ITEM_TYPE.HEAD;
        }

        if(RED_DOT_NEW_DATA_TYPE.TREASURE == newDataType) {
            itemType = BAG_ITEM_TYPE.TREASURE;
        }

        if(RED_DOT_NEW_DATA_TYPE.HERO == newDataType) {
            itemType = BAG_ITEM_TYPE.HERO;
        }

        //道具
        if(RED_DOT_NEW_DATA_TYPE.PROP == newDataType){
            itemType = BAG_ITEM_TYPE.PROP;
        }

        //材料
        if(RED_DOT_NEW_DATA_TYPE.MATERIAL == newDataType){
            itemType = BAG_ITEM_TYPE.MATERIAL;
        }


        let curData: data.IBagUnit[] = bagData.getItemsByType(itemType);

        if(itemType == BAG_ITEM_TYPE.HEAD || itemType == BAG_ITEM_TYPE.HEAD_FRAME){
            curData = curData.filter(ele => {
                let headID = ele.ID;
                let headCfg = configUtils.getHeadConfig(headID);
                let condis = headCfg.HeadFrameOpenCondition;
                if(!condis || condis.length == 0) return true;
                let condiArr = utils.parseStringTo1Arr(condis);
                let condiType = parseInt(condiArr[0]), condiValue = parseInt(condiArr[1]);
                if(condiType == HEAD_OPEN_TYPE.ExpLevel){
                    return userData.lv >= condiValue;
                }
        
                if(condiType == HEAD_OPEN_TYPE.SvrTime){
                    return serverTime.currServerTime() >= condiValue;
                }

                if(condiType == HEAD_OPEN_TYPE.OwnHero){
                    let heroUnit = bagData.getHeroById(condiValue);
                    return heroUnit && heroUnit.isHeroBasic;
                }

                return false;
            });
        }

        // 第一次 需要存一下数据
        if(!preData) {
            this._moduleData.set(newDataType, curData);  
            return;
        }

        let newData: data.IBagUnit[] = [];
        curData.forEach(ele => {
            let itemId: number = ele.ID;
            let seq: number = utils.longToNumber(ele.Seq);
            if(!preData.some(ele1 => {
                  return ele1.ID == itemId
                        && (BAG_ITEM_TYPE.EQUIP != itemType || (BAG_ITEM_TYPE.EQUIP == itemType && utils.longToNumber(ele1.Seq) == seq))
                        && (BAG_ITEM_TYPE.TREASURE != itemType || (BAG_ITEM_TYPE.TREASURE == itemType && item &&  -1 == item.findIndex(ele2 => {
                            return ele2.ID == itemId;
                        })));
              })){
                newData.push(ele);
            };
        });

        if(newData.length == 0) return;
        this._newData.set(newDataType, {
            data: newData,
            isCanClear: false
        });

        if(RED_DOT_NEW_DATA_TYPE.EQUIP == newDataType) {
            this.fire(RED_DOT_MODULE.MAIN_BAG);
        }

        if(RED_DOT_NEW_DATA_TYPE.TREASURE == newDataType) {
            this.fire(RED_DOT_MODULE.MAIN_TREASURE);
        }

        if(RED_DOT_NEW_DATA_TYPE.HERO == newDataType) {
            this.fire(RED_DOT_MODULE.MAIN_HERO);
        }
    }

    //更新商店刷新数据
    updateNewShopData(shopData: {[k: string]: boolean}){
        if(this._newData.has(RED_DOT_NEW_DATA_TYPE.RANDOM_SHOP))
            this._newData.delete(RED_DOT_NEW_DATA_TYPE.RANDOM_SHOP);

        if(!shopData) return;
        let randomShops: string[] = null;
        for(let k in shopData){
            if(shopData.hasOwnProperty(k)){
                randomShops = randomShops || [];
                randomShops.push(k);
            }
        }
        if(!randomShops || randomShops.length == 0) return;
        this._newData.set(RED_DOT_NEW_DATA_TYPE.RANDOM_SHOP,  {
            data: randomShops,
            isCanClear: false
        });
        this.fire(RED_DOT_MODULE.SHOP_RANDOM_TOGGLE);
        this.fire(RED_DOT_MODULE.MAIN_SHOP);
    }

    private _clearAllNewShopData(){
        if(this._newData.has(RED_DOT_NEW_DATA_TYPE.RANDOM_SHOP)){
            this._newData.delete(RED_DOT_NEW_DATA_TYPE.RANDOM_SHOP);
            this.fire(RED_DOT_MODULE.MAIN_SHOP);
        }
    }

    //清除商店
    clearNewShopData(key: number| string){
        if(!this._newData.has(RED_DOT_NEW_DATA_TYPE.RANDOM_SHOP)) return;
        
        let shopData = this._newData.get(RED_DOT_NEW_DATA_TYPE.RANDOM_SHOP);
        if(!shopData || !shopData.data || shopData.data.length == 0) return;
        let idx = shopData.data.findIndex(ele => {
            return key == ele;
        });
        idx != -1 && shopData.data.splice(idx, 1);
        if(shopData.data.length == 0) {
            this.fire(RED_DOT_MODULE.SHOP_RANDOM_TOGGLE);
            this.fire(RED_DOT_MODULE.MAIN_SHOP);
        }
    }

    clearAllNewShopData(){
        this.clearNewDataByType(RED_DOT_NEW_DATA_TYPE.RANDOM_SHOP);
    }

    clearNewData(newDataType: RED_DOT_NEW_DATA_TYPE, bagItem: data.IBagUnit) {
        let newDataInfo: NEW_DATA_INFO = this._newData.get(newDataType);
        if(!newDataInfo || newDataInfo.data.length <= 0) return;

        let itemType = BAG_ITEM_TYPE.EQUIP;
        if(RED_DOT_NEW_DATA_TYPE.EQUIP == newDataType) {
            itemType = BAG_ITEM_TYPE.EQUIP;
        }

        if(RED_DOT_NEW_DATA_TYPE.HEAD_FRAME == newDataType) {
            itemType = BAG_ITEM_TYPE.HEAD_FRAME;
        }

        if(RED_DOT_NEW_DATA_TYPE.HEAD == newDataType){
            itemType = BAG_ITEM_TYPE.HEAD;
        }

        if(RED_DOT_NEW_DATA_TYPE.TREASURE == newDataType) {
            itemType = BAG_ITEM_TYPE.TREASURE;
        }

        if(RED_DOT_NEW_DATA_TYPE.HERO == newDataType) {
            itemType = BAG_ITEM_TYPE.HERO;
        }

        if(RED_DOT_NEW_DATA_TYPE.PROP == newDataType){
            itemType = BAG_ITEM_TYPE.PROP;
        }

        if(RED_DOT_NEW_DATA_TYPE.MATERIAL == newDataType){
            itemType = BAG_ITEM_TYPE.MATERIAL;
        }

        //更新老数据
        let preData: data.IBagUnit[] = this._moduleData.get(newDataType);
        preData = preData || [];
        if(!preData.some(ele => { return ele.ID == bagItem.ID && (BAG_ITEM_TYPE.EQUIP != itemType 
            || (BAG_ITEM_TYPE.EQUIP == itemType && utils.longToNumber(ele.Seq) == utils.longToNumber(bagItem.Seq)))}))
        {
            preData.push(bagItem);
        }

        let newData: data.IBagUnit[] = newDataInfo.data;
        let index: number = newData.findIndex(_e => {
            return _e.ID == bagItem.ID && utils.longToNumber(_e.Seq) == utils.longToNumber(bagItem.Seq);
        });

        if(index == -1) return;
        newData.splice(index, 1);

        // 清除了就刷新
        if(BAG_ITEM_TYPE.EQUIP == itemType) {
            this.fire(RED_DOT_MODULE.BAG_ITEM_EQUIP, `${bagItem.ID}-${bagItem.Seq}`);
        }

        if(BAG_ITEM_TYPE.TREASURE == itemType) {
            this.fire(RED_DOT_MODULE.BAG_ITEM_TREASURE, `${bagItem.ID}-${bagItem.Seq}`);
        }

        //更新道具
        if(BAG_ITEM_TYPE.PROP == itemType) {
            this.fire(RED_DOT_MODULE.BAG_ITEM_PROP, `${bagItem.ID}`);
        }

        //更新材料
        if(BAG_ITEM_TYPE.MATERIAL == itemType) {
            this.fire(RED_DOT_MODULE.BAG_ITEM_MATERIAL, `${bagItem.ID}`);
        }

        //头像和头像框
        RED_DOT_NEW_DATA_TYPE.HEAD == newDataType && this.fire(RED_DOT_MODULE.USER_HEAD_TOGGLE);
        RED_DOT_NEW_DATA_TYPE.HEAD_FRAME == newDataType && this.fire(RED_DOT_MODULE.HEAD_FRAME_TOGGLE);
        if(RED_DOT_NEW_DATA_TYPE.HEAD == newDataType  || RED_DOT_NEW_DATA_TYPE.HEAD_FRAME == newDataType){
            this.fire(RED_DOT_MODULE.USER_INFO_HEAD);
        }
    }

    clearNewEquip(bagItem: data.IBagUnit){
        this.clearNewData(RED_DOT_NEW_DATA_TYPE.EQUIP, bagItem);
    }

    /********************************** 商店模块 ************************************ */
    getShopItemState(id: number) {
        // TODO 暂时屏蔽商店红点
        let cfg: cfg.ShopGift = configManager.getConfigByKey("gift", id);
        if(cfg) {
            if(!cfg.ShopGiftCost || cfg.ShopGiftCost == 0) {
                let shopGiftLimit = cfg.ShopGiftLimit;
                if(shopGiftLimit) {
                    let limits = shopGiftLimit.split(';');
                    // 每天限购
                    if(Number(limits[0]) == 1) {
                        let buyData = trackData.productRecords;
                        let curBuyData = buyData[id];
                        if(curBuyData) {
                            let limitCount: number = Number(limits[1]);
                            let todayZero = utils.getTodayZeroTime(true);
                            let todayBuyCount: number = 0;
                            for(let i = 0; i < curBuyData.PurchaseTime.length; ++i) {
                                if(utils.longToNumber(curBuyData.PurchaseTime[i]) >= todayZero) {
                                    todayBuyCount++;
                                }
                            }
                            return todayBuyCount < limitCount;
                        } else {
                            return true;
                        }
                    }
                }
            }
        }
        return false;
    }

    getShopState() {
        // 暂时屏蔽商店红点
        let cfgs: {[k: number]: cfg.ShopGift} = configManager.getConfigs('gift');
        for(const k in cfgs) {
            let cfg = cfgs[k];
            if(this.getShopItemState(cfg.ShopGiftId)) {
                return true;
            }
        }
        return false;
    }

    getRandomShopState() {
        if(!this._newData.has(RED_DOT_NEW_DATA_TYPE.RANDOM_SHOP)) return false;
        let shopData = this._newData.get(RED_DOT_NEW_DATA_TYPE.RANDOM_SHOP);
        if(!shopData || !shopData.data || shopData.data.length == 0) return false;
        return true;
    }

    getRandomShopItemState(key: number | string){
        if(!this._newData.has(RED_DOT_NEW_DATA_TYPE.RANDOM_SHOP)) return false;
        
        let shopData = this._newData.get(RED_DOT_NEW_DATA_TYPE.RANDOM_SHOP);
        if(!shopData || !shopData.data || shopData.data.length == 0) return false;
        return shopData.data.some(ele => {
            return ele == key;
        })
    }

    /********************************** 装备模块 ************************************ */
    getEquipItemBreakState(equip: data.IBagUnit) {
        let equipUnit = new Equip(equip);
        if(!equipUnit.checkEquipCanBroken()) {
            return false;
        }
        let breakMaterials = equipUnit.getBreakMaterial();
        let breakSpecialMaterials = equipUnit.getBreakSpecialMaterial();
        // 普通材料
        for(const k in breakMaterials) {
            let itemId: number = breakMaterials[k].ID;
            let needCount: number = breakMaterials[k].Count;
            let bagCount: number = bagData.getItemCountByID(itemId);
            if(needCount > bagCount) {
                return false;
            }
        }
        if(!breakSpecialMaterials || breakSpecialMaterials.length == 0) {
            return false;
        }
        return true;
    }

    getEquipBreakState() {
        let equips = bagData.getItemsByType(BAG_ITEM_TYPE.EQUIP);
        for(let i = 0; i < equips.length; ++i) {
            if(this.getEquipItemBreakState(equips[i])) {
                return true;
            }
        }
        return false;
    }

    //获取装备是否可铸魂
    getEquipItemSpiritState(equip: data.IBagUnit){
        let moduleCfg = configUtils.getModuleConfigs();
        let equipCfg = configUtils.getEquipConfig(equip.ID);
        let equipCastSoulCfg = utils.parseStingList(moduleCfg.ItemCastSoulNum);
        let castSoulCfgs = configManager.getConfigList("equipCastSoul");
        let itemLen = equipCastSoulCfg.length;
        return equipCastSoulCfg.some((ele)=>{
            let find = castSoulCfgs.findIndex(cfg => {
                return cfg.EquipCastSoulItemId == ele[0] && cfg.EquipCastSoulEquipType == equipCfg.TextureType
                    && cfg.EquipCastSoulEquipPart == equipCfg.PositionType;
            });
            if(!itemLen || find == -1) return false;
            let itemID = parseInt(ele[0]);
            let costNum = parseInt(ele[1]);
            let price = parseInt(ele[2]);
            let existCnt = bagData.getItemCountByID(itemID);
            return existCnt >= costNum;
        });
    }

    //获取装备的强化状态
    getEquipItemEnhanceState(equip: data.IBagUnit, quality?: QUALITY_TYPE, type?: EQUIP_TEXTURE_TYPE) {
        let equipUnit = new Equip(equip);
        //专属装备不能强化
        if(equipUnit.isExclusive()) return false;
        let initLv = equipUnit.getEquipLevel();
        let curMaxLv = bagDataUtils.curEquipMaxLevel;
        //当前星级的最大等级，无法再强化
        if(initLv >= curMaxLv) return false;

        //强化到了最大的等级
        if(initLv >= bagDataUtils.equipMaxLevel) return false;
       
        let materials =  bagDataUtils.getItemExpByQualityAndType(equip, quality, type);
        if(!materials || materials.length == 0) return false;
        let minExp : number = NaN;
        materials.forEach(ele => {
            let expCfg: cfg.ItemExp = null;
            if( bagDataUtils.isEquip(ele)){
                let equipCfg = configUtils.getEquipConfig(ele.ID);
                expCfg = configUtils.getItemExpConfig(equipCfg.Quality);
            }

            if( bagDataUtils.isMaterial(ele)){
                let itemCfg = configUtils.getItemConfig(ele.ID);
                expCfg = configUtils.getItemExpConfig(itemCfg.ItemQuality);
            }

            if(!expCfg) return;
            
            isNaN(minExp) && (minExp = expCfg.ItemExpBasicNum);
            minExp = Math.min(expCfg.ItemExpBasicNum + expCfg.ItemExpAccumulateExp, minExp);
        });
        
        if(isNaN(minExp) || minExp <= 0) return false;
        
        let currStarMaxExp = equipUnit.getEquipMaxExp();
        minExp = Math.min(minExp, currStarMaxExp - (equipUnit.equip.Exp | 0));
        let needGold = minExp * bagDataUtils.getEnhanceGoldMulti();
        return needGold <= bagData.gold
    }

    getMainTreasureState(): boolean {
        const treasureState = this.getBagToggleState(RED_DOT_MODULE.TREASURE_TOGGLE);
        if(treasureState) return true;
        return false;
    }

    /********************************** 召唤模块 ************************************ */
    getSummonItemState(summonCfg: cfg.SummonCard) {
        return trackData.getSummonFreeCount(summonCfg) > 0;
    }

    getTenSummonItemState(summonCfg: cfg.SummonCard) {
        let svrData = trackData.poolRecords[summonCfg.SummonCardId];
        return svrData && svrData.OpenSimulate;
    }

    getSummonState() {
        let records = trackData.poolRecords;
        for (let key in records) {
            let _r = records[key]
            if (_r && _r.OpenSimulate) {
                return true;
            }
        }
        let summons: {[k: number]: cfg.SummonCard} = configManager.getConfigs('summon');
        for(const k in summons) {
            let summon = summons[k];
            if(this.getSummonItemState(summon)) {
                return true;
            }
        }
        return false;
    }

    getSummonDoubleWeekAtyState(){
          let summonCfgs: cfg.SummonCard[] = configManager.getConfigList('summon');
          if(!summonCfgs || summonCfgs.length == 0) return false;
          let configs: cfg.ActivityWeekSummonList[] = configManager.getConfigList('doubleWeekList');
          return summonCfgs.some(ele => {
              let cardType = ele.SummonCardType;
              let doubleWeekList: number[] = [];
              for(let i = 0; i < configs.length; ++i) {
                  let config = configs[i];
                  let isShow = activityUtils.checkWeekSummonAtyIsNeedShow(config);
                  if(isShow && (cardType == config.ActivityType)) {
                    doubleWeekList.push(config.ID);
                  }
              }
              if(doubleWeekList.length == 0) return false;
              return doubleWeekList.some(atyID => {
                  return redDotMgr.getDoubleWeekToggleState(atyID);
              });
          })
    }

    /********************************** 冒险模块 ************************************ */
    getLevelMapItemState(moduleName: RED_DOT_MODULE, id: number) {
        if(RED_DOT_MODULE.LEVEL_MAP_LESSON_REWARD == moduleName) {
            return this.getLevelMapLessonState(id);
        } else {
            return this.getLevelMapChapterState(id);
        }
    }

    //获取关卡奖励是否可领取
    getLevelMapLessonState(lessonId: number){
        let lessonCfg = configUtils.getLessonConfig(lessonId);
        if(pveData.checkLessonIsPast(lessonId) && lessonCfg && lessonCfg.LessonProgressRewardShow) {
            if(!pveData.lessonStageRewards[lessonId]) {
                return true;
            }
        }
        return false;
    }

    //获取章节奖励是否可领取
    getLevelMapChapterState(chapterId: number) {
        let endLessonId = this._getEndLessonIdByChapterId(chapterId);
        if(endLessonId == 0) return false;

        let chapterCfg = configUtils.getChapterConfig(chapterId);
        //章节配置错误 或者 没有章节奖励 或者没有通关最后一关
        if(!chapterCfg || !chapterCfg.ChapterRewardShow || chapterCfg.ChapterRewardShow.length == 0 || !pveData.checkLessonIsPast(endLessonId)) return false;
        return !pveData.chapterStageRewards[chapterId];
    }

    //获取章节是否有关卡或者章节奖励可领取
    getLvMapRewardStateInChapter(chapterId: number){
        let state = this.getLevelMapChapterState(chapterId);
        if(state) return true;
        
        let lessonCfgs = configUtils.getLessonsByChapterId(chapterId);
        if(!lessonCfgs || lessonCfgs.length == 0) return false;
        return lessonCfgs.some(ele => {
            this.getLevelMapLessonState(ele.LessonId);
        });
    }

    private _getEndLessonIdByChapterId(chapterId: number) {
        let lessonCfgs: cfg.AdventureLesson[] = configManager.getConfigByKV('lesson', "LessonChapter", chapterId);
        let lessonID = 0;
        lessonCfgs && lessonCfgs.some((ele) => {
            if(ele.LessonLast){
                lessonID = ele.LessonId;
                return true;
            }
            return false;
        });
        return lessonID;
    }

    getLevelMapState() {
        let lessons = configManager.getConfigs('lesson');
        for(const k in lessons) {
            let lesson = lessons[k];
            if(this.getLevelMapItemState(RED_DOT_MODULE.LEVEL_MAP_LESSON_REWARD, lesson.LessonId)) {
                return true;
            }
        }
        let chapters = configManager.getConfigs('chapter');
        for(const k in chapters) {
            let chapter = chapters[k];
            if(this.getLevelMapItemState(RED_DOT_MODULE.LEVEL_MAP_CHAPTER_REWARD, chapter.ChapterId)) {
                return true;
            }
        }
        return false;
    }

    /********************************** 太虚幻境模块 ************************************ */
    getDreamLandState() {
        let curLessonId = pveData.getDreamCurLessonId();
        let configs = configManager.getConfigs("dreamlandLesson");
        let lessonCfg = configs[curLessonId];
        if(!lessonCfg) return false;

        let chapterId = lessonCfg.PVEDreamlandLessonChapter;
        let lastLessonCfg: cfg.PVEDreamlandLesson = null;
        let lastLessonOrder = -1;
        for (const k in configs) {
            let ele: cfg.PVEDreamlandLesson = configs[k];
            let order = ele.PVEDreamlandLessonOrder || 0;
            if (ele.PVEDreamlandLessonChapter == chapterId && order > lastLessonOrder) {
                lastLessonCfg = ele;
                lastLessonOrder = order;
            }
        }
        
        if(!lastLessonCfg) return  false;
        let chapPassed = curLessonId == lastLessonCfg.PVEDreamlandLessonId 
        && pveData.dreamRecords[curLessonId] 
        && pveData.dreamRecords[curLessonId].Past;
        return !!chapPassed;
    }

    /********************************** 云端梦境模块 ************************************ */
    getCloudDreamState() {
        let cloudData = pveTrialData.cloudData;
        if(utils.getObjLength(cloudData.PassLessonMap) <= 0) {
            return false;
        }
        let chapters: {[k: number]: cfg.PVECloudDreamChapter} = configManager.getConfigs('cloudDreamChapter');
        for(const k in chapters) {
            let chapterId = chapters[k].PVECloudDreamChapterId;
            let lessons: cfg.PVECloudDreamLesson[] = configManager.getConfigByKV('cloudDreamLesson', 'PVECloudDreamLessonChapter', chapterId);
            let isPass: boolean = true;
            for(let i = 0; i < lessons.length; ++i) {
                if(!cloudData.PassLessonMap[lessons[i].PVECloudDreamLessonId]) {
                    isPass = false;
                    return false;
                }
            }
            if(isPass) {
                if(!cloudData.ReceiveRewardMap || utils.getObjLength(cloudData.ReceiveRewardMap) <= 0 || !cloudData.ReceiveRewardMap[chapterId]) {
                    return true;
                }
            } else {
                return false;
            }
        }
        return false;
    }

    /********************************** 奇门遁甲模块 ************************************ */
    getMagicDoorState() {
        let pVECopyType = pveTrialData.miracalInfo.CurrentPeriod ? pveTrialData.miracalInfo.CurrentPeriod : null;
        if(pVECopyType) {
            let lessons: cfg.PVEDaoistMagicLesson[] = configManager.getConfigByKV('pveMagicLesson', 'PVECopyType', pVECopyType);
            let magicData = pveTrialData.miracalData;
            let isPass: boolean = true;
            for(let i = 0; i < lessons.length; ++i) {
                let lesson = lessons[i];
                if(!magicData.PassLessonMap || !magicData.PassLessonMap[lesson.PVECopyId]) {
                    isPass = false;
                    return false;
                }
            }
            if(isPass && !magicData.IsReceiveReward) {
                return true;
            }
        }
        return false;
    }

    /*********************************** 鹤鸣会武 PVP ************************************ */
    updatePvpDeifyFightState() {
        let isNewDefend = pvpData.hasNewDefendRecord;
        const itemRedDot = this.getRedDot(RED_DOT_MODULE.PVP_DEIFY_FIGHT_RECORD);
        if(itemRedDot) {
            itemRedDot.showNew(isNewDefend);
        }
    }

    getPvpDeifyFightState() {
        return pvpData.hasNewDefendRecord;
    }

    /********************************** 活动模块 ************************************ */
    getMainActivityState() {
        let isLevelReward = this.getActivityLevelRewardState();
        if(isLevelReward) {
            return true;
        }

        let isGetPower = this.getActivityGetPowerState();
        if(isGetPower) {
            return true;
        }

        let canSign = this.getActivitySignState();
        if(canSign) {
            return true;
        }

        let canTakeLoginReward = this.getActivityLoginState();
        if (canTakeLoginReward) {
            return true;
        }

        let canReceiveMonthlyCardDayReward = this.getMonthlyCardState();
        if(canReceiveMonthlyCardDayReward) {
            return true;
        }

        let lotteryTake = this.getLotteryTakeStatus();
        if(lotteryTake) return true;

        let battlePassState = this.getBattlePassToggleState();
        if(battlePassState) return true;

        let atyCfgs = configManager.getConfigList('activityList') || [];
        atyCfgs.sort((a, b) => {
            return (a.ActiveListOrder || 0) || (b.ActiveListOrder || 0);
        }); 
        let curCumuRechargeCfg: cfg.ActivityList = null
            , curPerDayRechargeCfg : cfg.ActivityList = null;
        atyCfgs.forEach(ele => {
            if(ele.ActiveListFunctionID != 40000 && ele.ActiveListFunctionID != 39000) return;
            let errInfo = activityUtils.checkMeetCond(ele.ActiveListFunctionID);
            let moduleOpen = true;
            errInfo && (moduleOpen = false);
            let meetTime = activityUtils.checkActivityOpen(ele.ActiveListID);
            if(!(moduleOpen && meetTime)) return;

            ele.ActiveListFunctionID == 40000 && (curCumuRechargeCfg = ele);
            ele.ActiveListFunctionID == 39000 && (curPerDayRechargeCfg = ele);     
        });
        let cumulativeRechargeState = curCumuRechargeCfg && this.getCumulativeRechargeTlgState(curCumuRechargeCfg.ActiveListID);
        if(cumulativeRechargeState) return true;
        
        let perDayRechargeState = curPerDayRechargeCfg && this.getPerDayRechargeTlgState(curPerDayRechargeCfg.ActiveListID);
        if(perDayRechargeState) return true;

        return false;
    }

    getActivityGetPowerState() {
        let cfgs: {[k: number]: cfg.ActivityGetPower} = configManager.getConfigs('activityGetPower');
        let getTime = (time: string, isEndTime: boolean = false) => {
            let timeSecond: number = 0;
            if(time.indexOf(";")) {
                time.split(";").forEach((_t, index) => {
                    timeSecond += Number(_t) * (index == 0 ? (60 * 60) : 60);
                });
                timeSecond += isEndTime ? 59 : 0;
            }
            return timeSecond;
        }
        let todayZeroTime = utils.getTodayZeroTime(true);
        if (!activityData.spiritData) {
            return false
        }
        for(const k in cfgs) {
            let times = cfgs[k].GetPowerTime.split("|");
            let start: string = times[0];
            let end: string = times[1];
            let startTime: number = getTime(start) + todayZeroTime;
            let endTime: number = getTime(end, true) + todayZeroTime;
            let curTime = serverTime.currServerTime();
            if(curTime >= startTime && curTime <= endTime && (!activityData.spiritData.ReceiveSpiritMap || !activityData.spiritData.ReceiveSpiritMap[cfgs[k].GetPowerID])) {
                return true;
            }
        }
        return false;
    }

    getActivityLevelRewardState() {
        let isVip: boolean = false;
        let moduleCfg = configUtils.getModuleConfigs();
        let levelData = activityData.levelData;
        if (!levelData) return false

        if(moduleCfg.LevelRewardKingCondition) {
            isVip = (levelData.RechargeAmount || 0) >= moduleCfg.LevelRewardKingCondition;
        }
        const cfgs: cfg.ActivityLevelReward[] = configManager.getConfigList('activityLevelReward');
        for(let i = 0; i < cfgs.length; ++i) {
            const cfg = cfgs[i];
            if(cfg.LevelRewardGetLevel <= userData.lv) {
                if(isVip) {
                    if(!levelData.ReceiveOrdinaryRewardMap || !levelData.ReceiveOrdinaryRewardMap[cfg.LevelRewardID]) {
                        return true;
                    }
                    if(isVip && (!levelData.ReceiveSpecialRewardMap || !levelData.ReceiveSpecialRewardMap[cfg.LevelRewardID])) {
                        return true;
                    }
                } else {
                    if(!levelData.ReceiveOrdinaryRewardMap || !levelData.ReceiveOrdinaryRewardMap[cfg.LevelRewardID]) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    getActivitySignState() {
        let freeSignTimes: number = bagData.getItemCountByID(CustomItemId.SIGNIN_TICKET);
        let signInData = activityData.signInData;
        if(signInData && signInData.FlopCardMap) {
            for(let i = 0; i < 6; ++i) {
                if(!signInData.FlopCardMap[i + 1]) {
                    return freeSignTimes > 0;
                }
            }
        }
        return false;
    }

    getActivityLoginState(activityListId?: number){
        let activityId = activityListId || activityUtils.getServiceLoginActivityId();
        if(!activityId) return false;
        let serviceLoginData = activityData.serviceLoginData;
        if(!serviceLoginData || !serviceLoginData.ActivityOpenServiceLoginActivityMap) return false;

        let rewardMap = serviceLoginData.ActivityOpenServiceLoginActivityMap;
        let rewardCanTake = false;
        let currTime = serverTime.currServerTime();
        let timeArr = activityUtils.calLoginRewardTime(activityId);
        let day = Math.floor((currTime - timeArr[0]) / (24 * 60 * 60));
        if (rewardMap && rewardMap[activityId]){
            let activityCfgs = rewardMap[activityId];
            for (let i=0; i<7; i++){
                if (activityCfgs.ReceiveLoginRewardMap && !activityCfgs.ReceiveLoginRewardMap[i] && i <= day){
                    rewardCanTake = true;
                    break;
                }
            }
        } else {
            rewardCanTake = true;
        }

        return rewardCanTake;
    }

    /**
     * @description 判定当前活动是否有任务/奖励未领取
     * @param activityId
     * @returns
     */
    getSevenDayState(activityId: number){
        let sevenDayCfg: cfg.ActivitySevenDayTask = configManager.getConfigByKey('sevenDay', activityId);
        let currTime = serverTime.currServerTime();
        let timeArr = activityUtils.calSevenDayTime(activityId);
        let haveUntakeTask = false;
        // 计算当前活动天数，只检测当前天数以及之前的任务
        let curDay = Math.floor((currTime - timeArr[0]) / (24 * 60 * 60)) + 1;
        if (sevenDayCfg && sevenDayCfg.ActivitySevenDayTaskList){
            let taskList = utils.parseStingList(sevenDayCfg.ActivitySevenDayTaskList).splice(0, curDay);
            taskList.forEach((dayList: any[]) => {
                if (dayList.length){
                    dayList.forEach((task: string) => {
                        if (taskData.getTaskIsCompleted(parseInt(task)) && !taskData.getTaskIsReceiveReward(parseInt(task))) {
                            haveUntakeTask = true;
                        }
                    })
                }
            })
        }
        // 当前积分满足但未领取奖励
        let rewardRes = utils.parseStingList(sevenDayCfg.ActivitySevenDayTaskMoneyRewardShow);
        let curPoint = bagData.getItemCountByID(sevenDayCfg.ActivitySevenDayTaskMoney);
        let activityMap = activityData.sevenDayData.ActivitySevenDayActivityMap[activityId]
        let rewardMap = activityMap ? activityMap.ReceiveAnimateRewardMap : {};
        let haveUntakeReward = false;
        if (rewardRes && rewardRes.length) {
            rewardRes.sort((_a, _b) => {
                return _a[0] - _b[0];
            });
            rewardRes.forEach((_info, _i) => {
                if (curPoint >= Number(_info[0]) && !rewardMap[_i]){
                    haveUntakeReward = true;
                }
            })
        }

        return haveUntakeTask || haveUntakeReward;
    }
    /**
     * @description 按照活动id和奖励索引判断是否有可领取奖励未领取
     * @param activityId
     * @param idx
     */
    getSevenDayRewardTokenByIdx(activityId: number, idx: number) {
        let sevenDayCfg: cfg.ActivitySevenDayTask = configManager.getConfigByKey('sevenDay', activityId);
        let activityMap = activityData.sevenDayData.ActivitySevenDayActivityMap[activityId]
        let rewardMap = activityMap ? activityMap.ReceiveAnimateRewardMap : {};
        let rewardRes = utils.parseStingList(sevenDayCfg.ActivitySevenDayTaskMoneyRewardShow);
        let curPoint = bagData.getItemCountByID(sevenDayCfg.ActivitySevenDayTaskMoney);

        if (rewardRes[idx] && curPoint){
            return Number(rewardRes[idx][0]) <= curPoint && !rewardMap[idx];
        }
        return false;
    }

    /**
     * @description 按照活动id和日期索引判断是否有可领取奖励未领取
     * @param activityId
     * @param idx
     */
    getSevenDayTaskTokenByIdx(activityId: number, idx: number) {
        let sevenDayCfg: cfg.ActivitySevenDayTask = configManager.getConfigByKey('sevenDay', activityId);
        let haveUntakeTask = false;
        if (sevenDayCfg && sevenDayCfg.ActivitySevenDayTaskList) {
            let taskList = utils.parseStingList(sevenDayCfg.ActivitySevenDayTaskList)[idx];
            taskList.forEach((task: string) => {
                if (taskData.getTaskIsCompleted(parseInt(task)) && !taskData.getTaskIsReceiveReward(parseInt(task))) {
                    haveUntakeTask = true;
                }
            })
        }
        return haveUntakeTask;
    }

    getLotteryTakeStatus(){
        let totalCnt = activityData.lotteryData ? activityData.lotteryData.CanLotteryCount : 0;
        let useCnt = activityData.lotteryData ? activityData.lotteryData.UseLotteryCount : 0;

        return (totalCnt - useCnt) > 0;
    }
    /**
     * 获得月卡活动的红点情况
     */
    getMonthlyCardState() {
        const monthlyCardData = activityData.monthlyCardData;
        if(monthlyCardData) {
            const todayZeroTime = utils.getTodayZeroTime();
            for(const k in monthlyCardData.ActivityMonthCardFastenMap) {
                const monthlyCard = monthlyCardData.ActivityMonthCardFastenMap[k];
                const overDueTime = monthlyCard.ExpiredTime;
                const monthlyCardCfg = configUtils.getMonthlyCardConfig(Number(k));
                if(monthlyCardCfg && !monthlyCardCfg.HoldTime) {
                    // 永久卡
                    if(monthlyCard.LastReceiveGetRewardTime < todayZeroTime) {
                        return true;
                    }
                }
                if(overDueTime >= todayZeroTime && overDueTime < todayZeroTime + 24 * 60 * 60) {
                    // 是在过期的这一天
                    if(monthlyCard.LastReceiveGetRewardTime >= todayZeroTime) {
                    } else {
                        return true;
                    }
                } else {
                    if(overDueTime >= todayZeroTime) {
                        if(monthlyCard.LastReceiveGetRewardTime >= todayZeroTime) {
                        } else {
                            return true;
                        }
                    }
                }
            }
        }
        return false;
    }
    /**
     * 战令
     * @returns
     */
    getBattlePassToggleState() {
        let battlePassLv = activityUtils.getBattlePassLv();
        let battlePassData = activityData.battlePassData;
        let battlePassCfgs: cfg.BattlePass[] = configManager.getConfigList("battlePass");

        if (!battlePassData) return false;

        let result = battlePassCfgs.some(ele => {
            if(ele.Level > battlePassLv) return false;
            return !battlePassData.ReceiveNormalReward[ele.Level] || (battlePassData.IsSpecial && !battlePassData.ReceiveSpecialReward[ele.Level]);
        });

        if(result) return true;

        //战令任务
        let taskCfgs: cfg.TaskTarget[] = configManager.getConfigList("task").filter(_task =>{
            return _task.TargetModule && _task.TargetModule == 8;
        });

        if(!taskCfgs) return false;

        return taskCfgs.some(ele => {
                let aCompleted: boolean = taskData.getTaskIsCompleted(ele.TargetID);
                let aReceivedReward: boolean = taskData.getTaskIsReceiveReward(ele.TargetID);
                return aCompleted && !aReceivedReward;
            });
    }

    getPerDayRechargeTlgState(activityId: number){
        let atys = activityUtils.getPerDayRechargeAtyIWithNotGet(activityId);
        return !!atys && atys.length > 0
    }

    getCumulativeRechargeTlgState(activityId: number){
        let atys = activityUtils.getCumulativeRechargeAtysWithNotGet(activityId);
        return !!atys && atys.length > 0
    }

    getDoubleWeekToggleState(activityId: number) {
        if (!activityData.doubleWeekData) return false;
        
        const cfg = configUtils.getDoubleWeekListConfig(activityId);
        if(cfg) {
            const activityTimes = activityUtils.calBeginEndTime(cfg.OpenTime, cfg.HoldTime);
            const startTime = activityTimes[0];
            const curTime = serverTime.currServerTime();
            if(curTime >= startTime) {
                const rewardState = this.getDoubleWeekRewardsState(activityId);
                if(rewardState) return true;

                const taskState = this.getDoubleWeekTasksState(activityId);
                if(taskState) return true;

                let giftState = this.getDoubleWeekGiftsState(activityId);
                if(giftState) return true;
            }
        }
        return false;
    }

    getDoubleWeekRewardsState(activityId: number) {
        const doubleWeekData = activityData.doubleWeekData.ActivityDoubleWeekFunctionMap && activityData.doubleWeekData.ActivityDoubleWeekFunctionMap[activityId];
        if(!doubleWeekData) return false;

        let doubleWeekConfig = configUtils.getDoubleWeekListConfig(activityId); 
        let doubleWeekRewardCfgs: cfg.ActivityWeekSummonReward[] = configManager.getConfigByKV('doubleWeekReward', 'FunctionID', doubleWeekConfig.FunctionID);
        if(!doubleWeekRewardCfgs || doubleWeekRewardCfgs.length == 0) return false;

        let canTake = false;
        let itemId, needCount, bagItemCount;
        doubleWeekRewardCfgs.some((cfg) => {
            let condiList = cfg.NeedMoney.split(';').map(_str => { return parseFloat(_str); });
            itemId = condiList[0];
            needCount = condiList[1];
            bagItemCount = bagData.getItemCountByID(itemId);
            if(needCount > bagItemCount) return false;

            if(!doubleWeekData.ReceiveOrderMap || !doubleWeekData.ReceiveOrderMap[cfg.GetOrder]){
                canTake = true;
                return true;
            }
            return false;
        });
        return canTake;
    }

    getDoubleWeekTasksState(activityId: number) {
        const doubleWeekConfig = configUtils.getDoubleWeekListConfig(activityId);
        const taskConfigs: cfg.ActivityWeekSummonTask[] = configManager.getConfigByKV('doubleWeekTask', 'FunctionID', doubleWeekConfig.FunctionID);
        taskConfigs.sort((_a, _b) => { return _a.RoundID - _b.RoundID; });
        const roundId = this._getCurTaskRound(taskConfigs);
        if(roundId <= 0) {
            return false;
        }
        const doubleWeekTaskCfg = taskConfigs.find(_taskCfg => { return _taskCfg.RoundID == roundId; });
        const tasks = doubleWeekTaskCfg.TaskList.split(";").map(_task => { return Number(_task); });
        for(let i = 0; i < tasks.length; ++i) {
            const completed = taskData.getTaskIsCompleted(tasks[i]);
            const reward = taskData.getTaskIsReceiveReward(tasks[i]);
            if(completed && !reward) {
                return true;
            }
        }
        return false;
    }

    getDoubleWeekGiftsState(activityId: number){
        let canTake = false;
        const doubleWeekConfig = configUtils.getDoubleWeekListConfig(activityId);
        if(!doubleWeekConfig.GiftID || doubleWeekConfig.GiftID.length == 0) return canTake;
        let _giftList: number[][] = [];
        utils.parseStingList(doubleWeekConfig.GiftID, (strArr: string[]) => {
            _giftList.push([parseInt(strArr[0]), parseInt(strArr[1])]);
        });

        _giftList.some((ele) => {
            let _aShopId = ele[0];
            let _aLimitCount = ele[1];
            let _aBuyCount = 0;
            activityData.doubleWeekData.ActivityDoubleWeekFunctionMap[activityId]
                && activityData.doubleWeekData.ActivityDoubleWeekFunctionMap[activityId].BuyGiftMap[_aShopId]
                && (_aBuyCount = activityData.doubleWeekData.ActivityDoubleWeekFunctionMap[activityId].BuyGiftMap[_aShopId]);
            let _aCanBuyCount = _aLimitCount - _aBuyCount;
            let shopCfg: cfg.ShopGift = configManager.getConfigByKey('gift', _aShopId);
            let costNum = Math.ceil(shopCfg.ShopGiftCost / 100);
            //只有免费的才显示红点
            if(_aCanBuyCount > 0 && costNum <= 0){
               canTake = true;
               return true;
            }
            return false;
        });
        return canTake;
    }

    private _getCurTaskRound(cfgs: cfg.ActivityWeekSummonTask[]): number {
        let roundId: number = 0;
        for(let i = 0; i < cfgs.length; ++i) {
            const doubleWeekConfig = cfgs[i];
            const tasks = doubleWeekConfig.TaskList.split(";").map(_task => { return Number(_task); });
            for(let j = 0; j < tasks.length; ++j) {
                const taskId = tasks[j];
                const isCompleted = taskData.getTaskIsCompleted(taskId);
                if(!isCompleted) {
                    roundId = doubleWeekConfig.RoundID;
                    return roundId;
                }
                const isRewarded = taskData.getTaskIsReceiveReward(taskId);
                if(!isRewarded) {
                    roundId = doubleWeekConfig.RoundID;
                    return roundId;
                }

            }
            roundId = doubleWeekConfig.RoundID;
        }
        return roundId;
    }

    /******************************************** 公会 ******************************************/
    getMainGuildState(): boolean {
        const isNewApply = this.getGuildNewApplyState();
        if(isNewApply) return isNewApply;
        const bossReward = this.getGuildBossHasReward();
        if(bossReward) return bossReward;
        let taskState = this.getGuildTasksState();
        if(taskState) return taskState;
        return false;
    }

    getGuildNewApplyState(): boolean {
        return guildData.isNewApply;
    }

    getGuildBossHasReward() {
        if(!guildData.bossInfo) return false;
        const bossResults = guildData.bossInfo.FactionExpeditionOrderResultMap;
        for(const k in bossResults) {
            const oneState = this.getGuildItemBossHasRewardState(Number(k));
            if(oneState) {
                return true;
            }
        }
        return false;
    }

    //工会任务是否有可领取的任务
    getGuildTasksState(){
        let taskConfigs: {[k: number]: cfg.TaskTarget} = configManager.getConfigs('task');
        for(const k in taskConfigs) {
            let taskCfg = taskConfigs[k];
            if(Number(taskCfg.TargetModule) == TASK_TYPE.GUILD && taskData.getTaskIsCompleted(taskCfg.TargetID)
                && !taskData.getTaskIsReceiveReward(taskCfg.TargetID)) {
                return true;
            }
        }
        return false;
    }

    getGuildItemBossHasRewardState(order: number) {
        if(!guildData.bossInfo) return false;
        const bossResults = guildData.bossInfo.FactionExpeditionOrderResultMap;
        const joinResultInfo = bossResults[order];
        if(!joinResultInfo) return false;
        const winRewardInfo = guildData.bossInfo.FactionExpeditionOrderWinRewardMap[order];
        const resultInfo = joinResultInfo.FactionExpeditionOrderInfoList[joinResultInfo.FactionExpeditionOrderInfoList.length - 1];
        const isJoin = resultInfo.JoinUserIDMap[userData.uId];
        const isJoinReward = !resultInfo.ReceiveJoinRewardMap[userData.uId];
        if(isJoin && isJoinReward) {
            return true;
        }
        const isWinReward = resultInfo.IsWin && !(winRewardInfo && winRewardInfo.ReceiveWinRewardMap[userData.uId]);
        if(isWinReward) {
            return true;
        }
        return false;
    }

    /***************************************** 神系 ****************************************** */
    getMainDivineSystemState() {
        const tasks = divineData.tasksList;
        let curTime = serverTime.currServerTime();
        for(const k in tasks) {
            const task = tasks[k];
            if(task && task.IsExecute) {
                const cfg = configUtils.getDispatchTaskConfig(task.TaskID);
                if(cfg) {
                    const costTime = cfg.CostTime;
                    if(Number(task.ExecuteTime) + costTime <= curTime) {
                        return true
                    }
                }
            }
        }
        return false;
    }


    /*************************************** 修炼 ****************************************** */
    getPragmaticToggleState() {
        let allCostCount: number = 0;
        let pragmaticSkills = pragmaticData.skills;
        for(let k in pragmaticSkills) {
            let data = pragmaticSkills[k];
            data && (allCostCount += this._getCostSkillPoint(parseInt(k), data));
        }
        let pragmaticItemId = CustomItemId.PRAGMATIC_SKILL_POINT;
        let count = bagData.getItemCountByID(pragmaticItemId);
        return count > allCostCount;
    }

    private _getCostSkillPoint(skillGroupId: number, lv: number) {
        let costSkillPoint: number = 0;
        let levelCfgs: cfg.LeadSkillLevel[] = configManager.getConfigByManyKV('leadSkillLevel', 'LeadSkillLevelGroup', skillGroupId, "LeadSkillLevelSkillLevel", lv);
        if(levelCfgs && levelCfgs.length > 0) {
            for(let i = 0; i < levelCfgs.length; ++i) {
                let levelCfg = levelCfgs[i];
                if(levelCfg.LeadSkillLevelSkillLevel <= lv) {
                    let costCount = levelCfg.LeadSkillLevelCost || 0;
                    costSkillPoint += costCount;
                }
            }
        }
        return costSkillPoint;
    }

    /*************************************** 头像/头像框 ****************************************** */
    getHeadFrameToggleState(){
        let data = this._newData.get(RED_DOT_NEW_DATA_TYPE.HEAD_FRAME);
        return data && data.data && data.data.length > 0;
    }

    getHeadToggleState() {
        let data = this._newData.get(RED_DOT_NEW_DATA_TYPE.HEAD);
        return data && data.data && data.data.length > 0;
    }

    getHeadState(headID: number){
        let data = this._newData.get(RED_DOT_NEW_DATA_TYPE.HEAD);
        if(!data || !data.data || data.data.length == 0) return false;
        return data.data.some(ele => {
            return ele && (ele as data.IBagUnit).ID == headID && ((ele as data.IBagUnit).Count != 0);
        });
    }

    getHeadFrameState(headFrameID: number){
        let data = this._newData.get(RED_DOT_NEW_DATA_TYPE.HEAD_FRAME);
        if(!data || !data.data || data.data.length == 0) return false;
        return data.data.some(ele => {
            return ele && (ele as data.IBagUnit).ID == headFrameID && ((ele as data.IBagUnit).Count != 0);
        });
    }

     /*************************************** public ****************************************** */
    clearNewDataByType(dataType: RED_DOT_NEW_DATA_TYPE, isClear: boolean = false) {
        if(dataType == RED_DOT_NEW_DATA_TYPE.RANDOM_SHOP){
            this._clearAllNewShopData();
            return;
        }

        let newDataInfo = this._newData.get(dataType);
        if(!newDataInfo) return;

        if(!isClear){
            newDataInfo.isCanClear = true;
            return;
        }

        if(!newDataInfo.data || newDataInfo.data.length <= 0) return;

        let moduleData: data.IBagUnit[] = this._moduleData.get(dataType);
        if(moduleData) {
            moduleData = moduleData.concat(newDataInfo.data);
            this._moduleData.set(dataType, moduleData);
        }
        this._newData.delete(dataType);
    }

    getNewData(dataType: RED_DOT_NEW_DATA_TYPE) {
        return this._newData.get(dataType);
    }

    // 是否显示英雄成长红点
    getHeroGrowTipsShow (heroID: number) {
        if (!heroID) return true

        let locol = localStorageMgr.getAccountStorage(SAVE_TAG.GROW_TIPS + heroID);
        // 关闭了成长提示
        if (locol && locol == 1)   {
            return false
        }
        return true
    }
}
let redDotMgr = new RedDotManager();
export {
    redDotMgr,
    RED_DOT_TYPE,
    RED_DOT_MODULE,
    RED_DOT_NEW_DATA_TYPE as RED_DOT_DATA_TYPE
}
