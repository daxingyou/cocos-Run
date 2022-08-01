import { GIFT_STATE } from "../../../app/AppEnums";
import { bagDataUtils } from "../../../app/BagDataUtils";
import { redDotMgr, RED_DOT_MODULE, RED_DOT_TYPE } from "../../../common/RedDotManager";
import { cfg } from "../../../config/config";
import { pveTrialData } from "../../models/PveTrialData";

const {ccclass, property} = cc._decorator;

export interface RED_DOT_SUB_INFO {
    redDotType?: RED_DOT_TYPE,
    subName?: string,
    isClickCurToggle?: boolean,
    args?: any[]
}

@ccclass
export default class ItemRedDot extends cc.Component {
    @property(cc.Node)      redDot: cc.Node = null;
    @property(cc.Node)      newDot: cc.Node = null;
    @property(sp.SkeletonData) newSpineData: sp.SkeletonData = null;
    
    private _moduleName: RED_DOT_MODULE = null;
    private _subName: string = null;
    private _redDotType: RED_DOT_TYPE = null;
    private _isClickCurToggle: boolean = false;
    private _showData: boolean | {isRedDot?: boolean, isNew?: boolean} = false;
    private _args: any[] = [];
    get module(): string {
        let str: string = this._moduleName;
        if(this._subName && this._subName.length > 0){
            str = `${this._moduleName}_${this._subName}`;
        }
        return str;
    }

    set subName(str: string) {
        this._subName = str;
    }

    get showData(){
        return this._showData;
    }

    setData(module: RED_DOT_MODULE, subInfo?: RED_DOT_SUB_INFO) {
        this._showData = false;
        let preModule = this.module;
        this._moduleName = module;
        this._subName = null;
        if(subInfo) {
            this._redDotType = subInfo.redDotType || RED_DOT_TYPE.NORMAL;
            subInfo.subName && (this._subName = subInfo.subName);
            this._args = subInfo.args || [];
        }
        // if(preModule != this.module) {
            redDotMgr.register(this);
        // 
        this.refreshView();
    }

    start() {
        if(this._moduleName) {
            redDotMgr.register(this);
        }
    }

    refreshView() {
        let isShow: boolean | {isRedDot?: boolean, isNew?: boolean} = false;
        switch(this._moduleName) {
            case RED_DOT_MODULE.HERO_ADVANCE: {
                isShow = redDotMgr.getHeroItemState(this._args[0], this._moduleName).isRedDot;
                break;
            }
            case RED_DOT_MODULE.HERO_DETAIL_BUTTON: {
                let defaultLocal = redDotMgr.getHeroGrowTipsShow(this._args[0]);
                if (!defaultLocal) {
                    isShow = false;
                } else {
                    isShow = redDotMgr.getHeroItemState(this._args[0], this._moduleName).isRedDot;
                }
                break
            }
            case RED_DOT_MODULE.HERO_EQUIP_TOGGLE:
            case RED_DOT_MODULE.HERO_GIFT_TOGGLE: {
                let defaultLocal = redDotMgr.getHeroGrowTipsShow(this._args[0]);
                if (!defaultLocal) {
                    isShow = false;
                    break;
                }
                isShow = redDotMgr.getHeroItemState(this._args[0], this._moduleName).isRedDot;
                break;
            }
            case RED_DOT_MODULE.HERO_ITEM: {
                let defaultLocal = redDotMgr.getHeroGrowTipsShow(this._args[0]);
                if (!defaultLocal) {
                    isShow = false;
                    break;
                }
                let redDotData = redDotMgr.getHeroItemState(this._args[0], this._moduleName);
                if(redDotData.isNew) {
                    this.showNew(true);
                    return;
                }
                isShow = redDotData.isRedDot;
                break;
            }
            case RED_DOT_MODULE.MAIN_HERO: {
                isShow = redDotMgr.getMainHeroState();
                break;
            }
            case RED_DOT_MODULE.MAIN_HERO_HANDBOOK: {
                isShow = redDotMgr.getHandBookState();
                break;
            }
            case RED_DOT_MODULE.HERO_HANDBOOK_ITEM: {
                isShow = redDotMgr.getHandBookItemState(this._args[0], this._moduleName);
                break;
            }
            case RED_DOT_MODULE.TASK_DAY_TOGGLE:
            case RED_DOT_MODULE.TASK_WEEK_TOGGLE:
            case RED_DOT_MODULE.TASK_ACHIEVEMENT_TOGGLE:
            case RED_DOT_MODULE.MAIN_TASK: {
                isShow = redDotMgr.getTaskToggleState(this._moduleName);
                break;
            }
            case RED_DOT_MODULE.MAIN_MAIL: {
                isShow= redDotMgr.getMailState();
                break;
            }
            case RED_DOT_MODULE.MAIN_BAG: {
                isShow = redDotMgr.getBagState();
                break;
            }
            case RED_DOT_MODULE.BAG_VIEW_EQUIP_BREAK_BTN:
            case RED_DOT_MODULE.EQUIP_BROKEN_TOGGLE:
            case RED_DOT_MODULE.EQUIP_BROKEN_BUTTON: {
                isShow = redDotMgr.getEquipItemBreakState(this._args[0]);
                break;
            }
            case RED_DOT_MODULE.EQUIP_ENHANCE_TOGGLE:
            case RED_DOT_MODULE.BAG_VIEW_EQUIP_ENHANCE_BTN:
            case RED_DOT_MODULE.EQUIP_ENHANCE_NODE_ENGANCE_BTN:
                isShow = redDotMgr.getEquipItemEnhanceState(this._args[0]);
                break;
            case RED_DOT_MODULE.BAG_MATERIAL_TOGGLE:
            case RED_DOT_MODULE.TREASURE_TOGGLE:
            case RED_DOT_MODULE.BAG_EQUIP_TOGGLE:
            case RED_DOT_MODULE.BAG_PROP_TOGGLE:
                isShow = redDotMgr.getBagToggleState(this._moduleName);
                break;
            case RED_DOT_MODULE.BAG_ITEM_PROP: {
                isShow = redDotMgr.getBagItemState(this._moduleName, this._args[0]);
                break;
            }
            case RED_DOT_MODULE.BAG_ITEM_MATERIAL:
                isShow = redDotMgr.getBagItemState(this._moduleName, this._args[0]);
                break;
            case RED_DOT_MODULE.BAG_ITEM_TREASURE:
            case RED_DOT_MODULE.BAG_ITEM_EQUIP: {
                isShow = redDotMgr.getBagItemState(this._moduleName, this._args[0]).isNew;
                break;
            }
            case RED_DOT_MODULE.MAIN_SHOP:
                isShow = redDotMgr.getRandomShopState() || redDotMgr.getShopState();
                break;
            case RED_DOT_MODULE.SHOP_GIFT_TOGGLE: {
                isShow = redDotMgr.getShopState();
                break;
            }
            case RED_DOT_MODULE.SHOP_RANDOM_TOGGLE:
                isShow = redDotMgr.getRandomShopState();
                break;
            case RED_DOT_MODULE.SHOP_GIFT_ITEM: {
                isShow = redDotMgr.getShopItemState(this._args[0]);
                break;
            }
            case RED_DOT_MODULE.MAIN_SUMMON: {
                isShow = redDotMgr.getSummonState();
                isShow = isShow || redDotMgr.getBattlePassToggleState();
                isShow = isShow || redDotMgr.getSummonDoubleWeekAtyState();
                break;
            }
            case RED_DOT_MODULE.SUMMON_EQUIP_TOGGLE:
            case RED_DOT_MODULE.SUMMON_HERO_TOGGLE:
            case RED_DOT_MODULE.SUMMON_BEAST_TOGGLE:
            case RED_DOT_MODULE.SUMMON_BUTTON: {
                isShow = redDotMgr.getSummonItemState(this._args[0]);
                break;
            }
            case RED_DOT_MODULE.SUMMON_TEN_BUTTON: {
                isShow = redDotMgr.getTenSummonItemState(this._args[0]);
                break;
            }
            case RED_DOT_MODULE.LEVEL_MAP_CHAPTER_REWARD:
            case RED_DOT_MODULE.LEVEL_MAP_LESSON_REWARD: {
                isShow = redDotMgr.getLevelMapItemState(this._moduleName, this._args[0])
                break;
            }
            case RED_DOT_MODULE.LEVEL_MAP_CHAPTER_LIST:
                isShow = redDotMgr.getLevelMapState();
                break;
            case RED_DOT_MODULE.MAIN_LEVEL_MAP: {
                isShow = redDotMgr.getLevelMapState();
                break;
            }
            case RED_DOT_MODULE.PVE_MAGIC_DOOR_REWARD: {
                isShow = redDotMgr.getMagicDoorState();
                break;
            }
            case RED_DOT_MODULE.PVE_CLOUD_DREAM_REWARD: {
                isShow = redDotMgr.getCloudDreamState();
                break;
            }
            case RED_DOT_MODULE.PVE_EXTREME_TOGGLE:
            case RED_DOT_MODULE.MAIN_PVE: {
                let cloudDream = redDotMgr.getCloudDreamState();
                if(cloudDream) {
                    isShow = true;
                    break;
                }
                let magicDoor = redDotMgr.getMagicDoorState();
                if(magicDoor){
                    isShow = magicDoor;
                    break;
                }

                let dreamland = redDotMgr.getDreamLandState();
                if(dreamland){
                    isShow = dreamland;
                    break;
                }
                
                break;
            }
            case RED_DOT_MODULE.MAIN_ACTIVITY: {
                isShow = redDotMgr.getMainActivityState();
                break;
            }
            case RED_DOT_MODULE.ACTIVITY_PHYSICAL_TOGGLE: {
                isShow = redDotMgr.getActivityGetPowerState();
                break;
            }
            case RED_DOT_MODULE.ACTIVITY_LEVEL_TOGGLE: {
                isShow = redDotMgr.getActivityLevelRewardState();
                break;
            }
            case RED_DOT_MODULE.ACTIVITY_SIGN_TOGGLE: {
                isShow = redDotMgr.getActivitySignState();
                break;
            }
            case RED_DOT_MODULE.ACTIVITY_LOGIN_TOGGLE: {
                isShow = redDotMgr.getActivityLoginState(this._args[0]);
                break;
            }
            case RED_DOT_MODULE.SEVENDAY_ENTRY: {
                isShow = redDotMgr.getSevenDayState(this._args[0]);
                break;
            }
            case RED_DOT_MODULE.SEVENDAY_TASK: {
                isShow = redDotMgr.getSevenDayTaskTokenByIdx(this._args[0], this._args[1]);
                break;
            }
            case RED_DOT_MODULE.SEVENDAY_REWARD: {
                isShow = redDotMgr.getSevenDayRewardTokenByIdx(this._args[0], this._args[1]);
                break;
            }
            case RED_DOT_MODULE.ACTIVITY_MONTHLY_CARD_TOGGLE: {
                isShow = redDotMgr.getMonthlyCardState();
                break;
            }
            case RED_DOT_MODULE.ACTIVITY_LOTTERY_TOGGLE:
            case RED_DOT_MODULE.LOTTERY_TAKE: {
                isShow = redDotMgr.getLotteryTakeStatus();
                break;
            }
            case RED_DOT_MODULE.ACTIVITY_BATTLE_PASS_TOGGLE: {
                isShow = redDotMgr.getBattlePassToggleState();
                break;
            }
            case RED_DOT_MODULE.ACTIVITY_CUMULATIVE_RECHARGE_TOGGLE:
                isShow = redDotMgr.getCumulativeRechargeTlgState(this._args[0]);
                break;
            case RED_DOT_MODULE.ACTIVITY_PER_DAY_RECHARGE_TOGGLE: 
                isShow = redDotMgr.getPerDayRechargeTlgState(this._args[0]);
                break;
            case RED_DOT_MODULE.ACTIVITY_DOUBLE_WEEK_TOGGLE: {
                isShow = redDotMgr.getDoubleWeekToggleState(this._args[0]);
                break;
            }
            case RED_DOT_MODULE.ACTIVITY_DOUBLE_WEEK_REWARD_TOGGLE: {
                isShow = redDotMgr.getDoubleWeekRewardsState(this._args[0]);
                break;
            }
            case RED_DOT_MODULE.ACTIVITY_DOUBLE_WEEK_TASK_TOGGLE: {
                isShow = redDotMgr.getDoubleWeekTasksState(this._args[0]);
                break;
            }
            case RED_DOT_MODULE.ACTIVITY_DOUBLE_WEEK_GIFT_TOGGLE:{
                isShow = redDotMgr.getDoubleWeekGiftsState(this._args[0]);
                break;
            }
            case RED_DOT_MODULE.PVP_DEIFY_FIGHT_RECORD: {
                isShow = redDotMgr.getPvpDeifyFightState();
                break;
            }
            case RED_DOT_MODULE.MAIN_GUILD: {
                isShow = redDotMgr.getMainGuildState();
                break;
            }
            case RED_DOT_MODULE.GUILD_BOSS_REWARD: {
                isShow = redDotMgr.getGuildItemBossHasRewardState(this._args[0]);
                break;
            }
            case RED_DOT_MODULE.GUILD_NEW_APPLY: {
                isShow = redDotMgr.getGuildNewApplyState();
                break;
            }
            case RED_DOT_MODULE.GUILD_TASKS: {
                isShow = redDotMgr.getGuildTasksState();
                break;
            }
            case RED_DOT_MODULE.MAIN_DIVINE_SYSTEM: {
                isShow = redDotMgr.getMainDivineSystemState();
                break;
            }
            case RED_DOT_MODULE.MAIN_TREASURE:
                isShow = redDotMgr.getMainTreasureState();
                break;
            case RED_DOT_MODULE.MAIN_CHARACTER:
            case RED_DOT_MODULE.PRAGMATIC_TOGGLE: {
                isShow = redDotMgr.getPragmaticToggleState();
                break;
            }
            case RED_DOT_MODULE.USER_HEAD:
                isShow = redDotMgr.getHeadState(this._args[0]);
                break;
            case RED_DOT_MODULE.USER_HEAD_TOGGLE:
                isShow = redDotMgr.getHeadToggleState();
                break;
            case RED_DOT_MODULE.HEAD_FRAME:
                isShow = redDotMgr.getHeadFrameState(this._args[0]);
                break;
            case RED_DOT_MODULE.HEAD_FRAME_TOGGLE:
                isShow = redDotMgr.getHeadFrameToggleState();
                break;
            case RED_DOT_MODULE.USER_INFO_HEAD:
                isShow = redDotMgr.getHeadFrameToggleState() || redDotMgr.getHeadToggleState();
                break;
            case RED_DOT_MODULE.BAG_VIEW_EQUIP_SPIRIT_BTN:
            case RED_DOT_MODULE.EQUIP_SPIRIT_TOGGLE:
            case RED_DOT_MODULE.EQUIP_SPIRIT_NODE_SPIRIT_BTN:
                isShow = redDotMgr.getEquipItemSpiritState(this._args[0]);
                break;
            case RED_DOT_MODULE.HERO_EQUIP_DRESS_TOGGLE: {
                let heroID = this._args[0];
                let equipPartType = this._args[1];
                let defaultLocal = redDotMgr.getHeroGrowTipsShow(heroID);
                if (!defaultLocal) {
                    isShow = false;
                } else {
                    isShow = bagDataUtils.isHasDressedEquip(equipPartType, heroID)
                }
                break;
            } case RED_DOT_MODULE.HERO_GIF_ICON: {
                // 这里放到外面计算，本来外面就算一遍
                let heroID = this._args[0];
                let giftState = this._args[1];
                let isEnough = this._args[2];
                let defaultLocal = redDotMgr.getHeroGrowTipsShow(heroID);
                if (!defaultLocal) {
                    isShow = false;
                } else {
                    isShow = giftState == GIFT_STATE.UNLOCK && isEnough;
                }
                break;
            } case RED_DOT_MODULE.CHALLENGE_STAGE_AWARD: {
                let rewardConfig: cfg.PVEChallengeReward = this._args[0];
                let data = pveTrialData.respectData;
                if (rewardConfig.PVEChallengeRewardNeed <= pveTrialData.respectData.Progress
                    && pveTrialData.respectData.RewardRecords.indexOf(rewardConfig.PVEChallengeRewardId) === -1) {

                    isShow = true;
                } else {
                    isShow = false;
                }
                break;
            }
            default: {
                break;
            }
        }
        this._showData = isShow;
        this.clear();
        this.showRedDot(isShow);
    }

    showRedDot(isShow: boolean| {isRedDot?: boolean, isNew?: boolean}) {
        if(typeof isShow == 'object'){
            if(isShow.isNew){
               this.showNew(isShow.isNew);
            }else{
                this.redDot.active = isShow.isRedDot || false;
            }
            return;
        }

        if(RED_DOT_TYPE.NEW == this._redDotType) {
            this.showNew(isShow);
        } else {
            this.redDot.active = isShow;
        }
    }

    showNew(isShow: boolean) {
        this.newDot.active = isShow;
        let newSpine = this.newDot.children[0];
        if(isShow && !cc.isValid(newSpine) && this.newSpineData) {
            let newSpineNode = new cc.Node();
            let spine = newSpineNode.addComponent(sp.Skeleton);
            spine.skeletonData = this.newSpineData;
            spine.loop = true;
            spine.animation = 'animation';
            spine.premultipliedAlpha = true;
            spine.timeScale = 1;
            this.newDot.addChild(newSpineNode);
        }
    }

    clear() {
        this._showData = false;
        this.newDot && (this.newDot.active = false);
        this.redDot && (this.redDot.active = false);
    }

    deInit(){
        this.clear();
        redDotMgr.unregister(this);
        this._moduleName = null;
        this._subName = null;
        this._redDotType = null;
        this._args = null;
    }

    onDestroy() {
        this.deInit();
    }
}
