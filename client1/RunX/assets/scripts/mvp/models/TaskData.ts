import { activityUtils } from "../../app/ActivityUtils";
import { BAG_ITEM_TYPE, TaskState, TASK_CONDITION_TYPE } from "../../app/AppEnums";
import { utils } from "../../app/AppUtils";
import { configUtils } from "../../app/ConfigUtils";
import { configManager } from "../../common/ConfigManager";
import { logger } from "../../common/log/Logger";
import { cfg } from "../../config/config";
import { data } from "../../network/lib/protocol";
import { Equip } from "../template/Equip";
import HeroUnit from "../template/HeroUnit";
import { bagData } from "./BagData";
import BaseModel from "./BaseModel";
import { guildData } from "./GuildData";
import { mainTaskData } from "./MainTaskData";
import { pveData } from "./PveData";
import { pveTrialData } from "./PveTrialData";
import { pvpData } from "./PvpData";
import { userData } from "./UserData";

export enum TASK_TYPE {
    DAY = 1,
    WEEK,
    ACHIEVEMENT,
    HANDBOOK,
    GUILD = 10,
    PEAKDUEL = 12 //巅峰对决
}

interface TaskStatus {
    Condition: number,
    Dirty: boolean,
    Finish: boolean
}

enum TASK_FINISH_TYPE {
    DAY = 1001,
    WEEK,
    USER_LEVEL = 1009,
    MAP_LEVEL = 1011,
    HERO_STAR = 1013,
    RECHARGE = 1014,
    PART_IN_PVE = 1015,
    PASS_CLOUD_DREAM_TIMES = 1016,
    PASS_CLOUD_DREAM_FLOOR = 1017,      // 云端梦境
    PASS_DREAM_LAND_MAP = 1018,         // 太虚幻境
    PASS_NINE_GHOST_TIMES = 1019,
    HAS_HERO_STAR_QUALITY = 1020,
    HAS_HERO_HIGHER_STAR_QUALITY = 1021,
    HAS_HERO_STAR_HIGHER_QUALITY = 1022,
    HAS_HERO_HIGHER_STAR_HIGHER_QUALITY = 1023,
    HAS_EQUIP_STAR_QUALITY = 1024,
    HAS_EQUIP_HIGHER_STAR_QUALITY = 1025,
    HAS_EQUIP_STAR_HIGHER_QUALITY = 1026,
    HAS_EQUIP_HIGHER_STAR_HIGHER_QUALITY = 1027,
    GUILD_COST_PHYSICAL = 1010,
    GUILD_JOIN_PVP = 1003,
    GUILD_HERO_SUMMON = 1005,
    GUILD_EQUIP_SUMMON = 1006,
    GUILD_COST_QI_YUN_ASKED_TICKETS = 1007,
    GUILD_JOIN_QI_MEN_TIMES = 1008,
    SUMMON__HERO_GACHA_SIMULATE = 1030,
    SUMMON__EQUIP_GACHA_SIMULATE = 1031,
    JOIN_PEAK_DUEL_PVP = 1032, //参与巅峰对决
    WIN_PEAK_DUEL_PVP = 1033, //胜利巅峰对决x次
    JOIN_WU_JIAN_LIAN_YU = 1034,   //无间炼狱战斗次数
    PASS_WU_JIAN_LIAN_YU_LV = 1035,   //通关无间炼狱层数
    JOIN_PENG_LAI_XIAN_DAO = 1036,  //蓬莱仙岛战斗次数
    PASS_PENG_LAI_XIAN_DAO = 1037,  //蓬莱仙岛通关次数
    JOIN_ZHI_SHI_ZHI_LI = 1038, //致师之礼战斗次数
    PASS_ZHI_SHI_ZHI_LI = 1039, //致师之礼通关次数
    JOIN_XIN_MO_FA_XIANG = 1040, //心魔法相战斗次数
    JOIN_YIN_YANG_BAO_JIAN = 1041, //阴阳宝鉴战斗次数
}

const ALWAYS_DIRTY = [
    TASK_FINISH_TYPE.USER_LEVEL,
    TASK_FINISH_TYPE.PASS_CLOUD_DREAM_FLOOR,
    TASK_FINISH_TYPE.PASS_DREAM_LAND_MAP,
    TASK_FINISH_TYPE.HAS_HERO_STAR_QUALITY,
    TASK_FINISH_TYPE.HAS_HERO_HIGHER_STAR_QUALITY ,
    TASK_FINISH_TYPE.HAS_HERO_STAR_HIGHER_QUALITY,
    TASK_FINISH_TYPE.HAS_HERO_HIGHER_STAR_HIGHER_QUALITY,
    TASK_FINISH_TYPE.HAS_EQUIP_STAR_QUALITY, 
    TASK_FINISH_TYPE.HAS_EQUIP_HIGHER_STAR_QUALITY,
    TASK_FINISH_TYPE.HAS_EQUIP_STAR_HIGHER_QUALITY,
    TASK_FINISH_TYPE.HAS_EQUIP_HIGHER_STAR_HIGHER_QUALITY,
]

class TaskData extends BaseModel {
    private _taskTargetData: data.ITaskTargetData = new data.TaskTargetData();
    private _taskFinishData: {[k: number]: TaskStatus} = {};

    private _treasureAchieveData: data.ITreasureData = null;

    private _epochData: data.IEpochData = null

    get tasks() {
        return this._taskTargetData;
    }

    init() {
        this._taskFinishData = {}
        this._treasureAchieveData = null;
        this._epochData = null;
    }

    deInit() {
        this._taskFinishData = {}
        this._treasureAchieveData = null;
        this._epochData = null;
    }

    initTask(taskData: data.ITaskData) {
        this._taskTargetData = taskData && taskData.TaskTargetData ? taskData.TaskTargetData : new data.TaskTargetData();

        if(taskData.TaskMainData && taskData.TaskMainData.ReceiveRewardMap) {
            let mainTaskReward = taskData.TaskMainData.ReceiveRewardMap;
            for (const k in mainTaskReward) {
                if (mainTaskReward[k]) {
                    mainTaskData.setMainTaskState(Number(k), TaskState.Received);
                    mainTaskData.setRewardId(Number(k) + 1);
                }

            }
        }

        // 任务完成清单
        configManager.getConfigList("task").forEach((_cfg: cfg.TaskTarget)=>{
            this.getTaskIsCompleted(_cfg.TargetID)
        });
    }

    initRankRewardData(data: data.IEpochData) {
        this._epochData = data;
    }

    updateRankRewardData (rewardList: number[]) {
        if(!rewardList ||rewardList.length == 0) return;
        this._epochData = this._epochData || {};
        this._epochData.EpochRewardData = this._epochData.EpochRewardData || {};
        this._epochData.EpochRewardData.ReceiveRankRewardIDMap =  this._epochData.EpochRewardData.ReceiveRankRewardIDMap || {};
        rewardList.forEach(ele => {
            this._epochData.EpochRewardData.ReceiveRankRewardIDMap[ele+''] = true;
        });
    }

    isRankRewardReceived(rankRewardID: number) {
        if(!this._epochData || !this._epochData.EpochRewardData || !this._epochData.EpochRewardData.ReceiveRankRewardIDMap) return false;

        return this._epochData.EpochRewardData.ReceiveRankRewardIDMap[rankRewardID];
    }

    onDayReset(): void {
        this.resetDayTasks();
        this.resetDoubleWeekTasks();
    }

    //初始化宝物相关的任务
    initTreasureTask(treasureTask: data.ITreasureData){
        this._treasureAchieveData = treasureTask;
    }

    //更新宝物相关的任务
    updateTreasureTask(treasureTasks: {AchieveID?: number, Count?: number}[]){
        if(!treasureTasks || treasureTasks.length == 0) return;
        this._treasureAchieveData = this._treasureAchieveData || new data.TreasureData();
        this._treasureAchieveData.TreasureAchieve = this._treasureAchieveData.TreasureAchieve || {};
        this._treasureAchieveData.TreasureAchieve.Achieve = this._treasureAchieveData.TreasureAchieve.Achieve || {};
        treasureTasks.forEach(ele => {
            this._treasureAchieveData.TreasureAchieve.Achieve[ele.AchieveID] = ele.Count;
        });
    }

    //更新宝物相关的权益
    updateTreasureProfit(treasureProfits: {SystemPowerType?: number, Value?: number}[]){
        if(!treasureProfits || treasureProfits.length == 0) return;
        this._treasureAchieveData = this._treasureAchieveData || new data.TreasureData();
        this._treasureAchieveData.TreasureProfit = this._treasureAchieveData.TreasureProfit || {};
        this._treasureAchieveData.TreasureProfit.Profit = this._treasureAchieveData.TreasureProfit.Profit || {};
        treasureProfits.forEach(ele => {
            this._treasureAchieveData.TreasureProfit.Profit[ele.SystemPowerType] = ele.Value;
        });
    }

    //获取宝物对应任务的完成计数
    getTreasureTaskAchieveCnt (achieveID: number){
        if(!achieveID || !this._treasureAchieveData || !this._treasureAchieveData.TreasureAchieve || !this._treasureAchieveData.TreasureAchieve.Achieve) return 0;
        return this._treasureAchieveData.TreasureAchieve.Achieve[achieveID] || 0;
    }

    //获取宝物的权益参数
    getTreasureSysPowerParam (treasureType: number){
        if(!treasureType || !this._treasureAchieveData || !this._treasureAchieveData.TreasureProfit || !this._treasureAchieveData.TreasureProfit.Profit) return 0;
        return this._treasureAchieveData.TreasureProfit.Profit[treasureType] || 0;
    }

    //宝物权限是否有效
    isOpenTreasureSysPower (treasureType: number){
        if(!treasureType || !this._treasureAchieveData || !this._treasureAchieveData.TreasureProfit || !this._treasureAchieveData.TreasureProfit.Profit) return false;
        return typeof this._treasureAchieveData.TreasureProfit.Profit[treasureType] != 'undefined';
    }

    updateReward(taskIds: number[]) {
        taskIds.forEach((taskId) =>{
            const taskCfg = configUtils.getTaskByTaskId(taskId);
            if(taskCfg && TASK_TYPE.GUILD == taskCfg.TargetModule) {
                // 如果是公会任务 就增加公会任务的完成次数
                guildData.addCompleteTaskTimes();
            }
            this._taskTargetData.ReceiveRewardMap[taskId] = true;
        })
    }

    updateTaskProgress(DataMap: { [k: string]: number }) {
        let needUpdateTaskFinishData: boolean = false;

        for (let key in DataMap) { 
            let v = DataMap[key];
            if (v) {
                let groupID = parseInt(key);
                this._updateTaskProgress(groupID, v)

                !needUpdateTaskFinishData && (needUpdateTaskFinishData = true);
            }
        }

        if (needUpdateTaskFinishData) {
            // 每次更新任务进度都需要设置dirty标志位，这样就会重新计算对应任务的完成程度
            for (let key in this._taskFinishData) {
                let _v = this._taskFinishData[key];
                if (_v) {
                    switch (_v.Condition) {
                        case TASK_FINISH_TYPE.HERO_STAR:
                        case TASK_FINISH_TYPE.MAP_LEVEL:
                        case TASK_FINISH_TYPE.USER_LEVEL:
                        case TASK_FINISH_TYPE.PASS_CLOUD_DREAM_FLOOR: 
                        case TASK_FINISH_TYPE.PASS_DREAM_LAND_MAP: 
                        case TASK_FINISH_TYPE.HAS_HERO_STAR_QUALITY: 
                        case TASK_FINISH_TYPE.HAS_HERO_HIGHER_STAR_QUALITY : 
                        case TASK_FINISH_TYPE.HAS_HERO_STAR_HIGHER_QUALITY: 
                        case TASK_FINISH_TYPE.HAS_HERO_HIGHER_STAR_HIGHER_QUALITY: 
                        case TASK_FINISH_TYPE.HAS_EQUIP_STAR_QUALITY: 
                        case TASK_FINISH_TYPE.HAS_EQUIP_HIGHER_STAR_QUALITY: 
                        case TASK_FINISH_TYPE.HAS_EQUIP_STAR_HIGHER_QUALITY: 
                        case TASK_FINISH_TYPE.HAS_EQUIP_HIGHER_STAR_HIGHER_QUALITY: {
                            break;
                        }
                        case TASK_FINISH_TYPE.PART_IN_PVE:
                        case TASK_FINISH_TYPE.PASS_CLOUD_DREAM_TIMES:
                        case TASK_FINISH_TYPE.PASS_NINE_GHOST_TIMES:
                        case TASK_FINISH_TYPE.DAY:
                        case TASK_FINISH_TYPE.WEEK: 
                        case TASK_FINISH_TYPE.SUMMON__HERO_GACHA_SIMULATE:
                        case TASK_FINISH_TYPE.SUMMON__EQUIP_GACHA_SIMULATE: {
                            _v.Dirty = true;
                            break;
                        }
                        default: {
                            _v.Dirty = true;
                            break;
                        }
                    }
                }
            }
        }
    }

    private _updateTaskProgress (targetGroupId: number, Count: number) {
        this._taskTargetData.GroupCountMap[targetGroupId] = Count;
    }

    getTaskGroupCompletedCount(taskId: number): number {
        let cfg = configUtils.getTaskByTaskId(taskId);
        if(TASK_FINISH_TYPE.HERO_STAR == cfg.TargetType) {
            let goalParam = cfg.TargetGoalParam.split(';');
            let heroId: number = Number(goalParam[0]);
            let star: number = Number(goalParam[1]);
            let heroUnit: HeroUnit = bagData.getHeroById(heroId);
            let curStar = 0;
            if(heroUnit) {
                curStar = heroUnit.star;
            }
            return curStar;
        } else if(TASK_FINISH_TYPE.MAP_LEVEL == cfg.TargetType) {
            // TODO  应该不会有人设计关卡是倒序这么变态的的吧
            return pveData.latestPassLessonId;
        } else if(TASK_FINISH_TYPE.USER_LEVEL == cfg.TargetType) {
            return userData.lv;
        } else if(TASK_FINISH_TYPE.PASS_CLOUD_DREAM_FLOOR == cfg.TargetType) {
            let chapterId = pveTrialData.cloudChapId;
            let curChapterCfg = configUtils.getCloudDreamChapterConfig(chapterId);
            return curChapterCfg.PVECloudDreamChapterNum - 1;
        } else if(TASK_FINISH_TYPE.HAS_HERO_STAR_QUALITY == cfg.TargetType) {
            let goalParam = cfg.TargetGoalParam.split(";");
            let goalStar = Number(goalParam[0]);
            let goalQuality = Number(goalParam[1]);
            let heros = bagData.getItemsByType(BAG_ITEM_TYPE.HERO);
            let count: number = 0;
            for(let i = 0; i < heros.length; ++i) {
                let heroUnit = new HeroUnit(heros[i]);
                if(heroUnit && heroUnit.isHeroBasic) {
                    if(heroUnit.star == goalStar && heroUnit.heroCfg.HeroBasicQuality == goalQuality) {
                        count++; 
                    }
                }
            }
            return count;
        } else if(TASK_FINISH_TYPE.HAS_HERO_HIGHER_STAR_QUALITY == cfg.TargetType) {
            let goalParam = cfg.TargetGoalParam.split(";");
            let goalStar = Number(goalParam[0]);
            let goalQuality = Number(goalParam[1]);
            let heros = bagData.getItemsByType(BAG_ITEM_TYPE.HERO);
            let count: number = 0;
            for(let i = 0; i < heros.length; ++i) {
                let heroUnit = new HeroUnit(heros[i]);
                if(heroUnit && heroUnit.isHeroBasic) {
                    if(heroUnit.star >= goalStar && heroUnit.heroCfg.HeroBasicQuality == goalQuality) {
                        count++; 
                    }
                }
            }
            return count;
        } else if(TASK_FINISH_TYPE.HAS_HERO_STAR_HIGHER_QUALITY == cfg.TargetType) {
            let goalParam = cfg.TargetGoalParam.split(";");
            let goalStar = Number(goalParam[0]);
            let goalQuality = Number(goalParam[1]);
            let heros = bagData.getItemsByType(BAG_ITEM_TYPE.HERO);
            let count: number = 0;
            for(let i = 0; i < heros.length; ++i) {
                let heroUnit = new HeroUnit(heros[i]);
                if(heroUnit && heroUnit.isHeroBasic) {
                    if(heroUnit.star == goalStar && heroUnit.heroCfg.HeroBasicQuality >= goalQuality) {
                        count++; 
                    }
                }
            }
            return count;
        } else if(TASK_FINISH_TYPE.HAS_HERO_HIGHER_STAR_HIGHER_QUALITY == cfg.TargetType) {
            let goalParam = cfg.TargetGoalParam.split(";");
            let goalStar = Number(goalParam[0]);
            let goalQuality = Number(goalParam[1]);
            let heros = bagData.getItemsByType(BAG_ITEM_TYPE.HERO);
            let count: number = 0;
            for(let i = 0; i < heros.length; ++i) {
                let heroUnit = new HeroUnit(heros[i]);
                if(heroUnit && heroUnit.isHeroBasic) {
                    if(heroUnit.star >= goalStar && heroUnit.heroCfg.HeroBasicQuality >= goalQuality) {
                        count++; 
                    }
                }
            }
            return count;
        } else if(TASK_FINISH_TYPE.HAS_EQUIP_STAR_QUALITY == cfg.TargetType) {
            let goalParam = cfg.TargetGoalParam.split(";");
            let goalStar = Number(goalParam[0]);
            let goalQuality = Number(goalParam[1]);
            let equips = bagData.getItemsByType(BAG_ITEM_TYPE.EQUIP);
            let count: number = 0;
            for(let i = 0; i < equips.length; ++i) {
                let equipUnit = new Equip(equips[i]);
                if(equipUnit) {
                    if(equipUnit.equip.Star == goalStar && equipUnit.equipCfg.Quality == goalQuality) {
                        count++;
                    }
                }
            }
            return count;
        } else if(TASK_FINISH_TYPE.HAS_EQUIP_HIGHER_STAR_QUALITY == cfg.TargetType) {
            let goalParam = cfg.TargetGoalParam.split(";");
            let goalStar = Number(goalParam[0]);
            let goalQuality = Number(goalParam[1]);
            let equips = bagData.getItemsByType(BAG_ITEM_TYPE.EQUIP);
            let count: number = 0;
            for(let i = 0; i < equips.length; ++i) {
                let equipUnit = new Equip(equips[i]);
                if(equipUnit) {
                    if(equipUnit.equip.Star >= goalStar && equipUnit.equipCfg.Quality == goalQuality) {
                        count++;
                    }
                }
            }
            return count;
        } else if(TASK_FINISH_TYPE.HAS_EQUIP_STAR_HIGHER_QUALITY == cfg.TargetType) {
            let goalParam = cfg.TargetGoalParam.split(";");
            let goalStar = Number(goalParam[0]);
            let goalQuality = Number(goalParam[1]);
            let equips = bagData.getItemsByType(BAG_ITEM_TYPE.EQUIP);
            let count: number = 0;
            for(let i = 0; i < equips.length; ++i) {
                let equipUnit = new Equip(equips[i]);
                if(equipUnit) {
                    if(equipUnit.equip.Star == goalStar && equipUnit.equipCfg.Quality >= goalQuality) {
                        count++;
                    }
                }
            }
            return count;
        } else if(TASK_FINISH_TYPE.HAS_EQUIP_HIGHER_STAR_HIGHER_QUALITY == cfg.TargetType) {
            let goalParam = cfg.TargetGoalParam.split(";");
            let goalStar = Number(goalParam[0]);
            let goalQuality = Number(goalParam[1]);
            let equips = bagData.getItemsByType(BAG_ITEM_TYPE.EQUIP);
            let count: number = 0;
            for(let i = 0; i < equips.length; ++i) {
                let equipUnit = new Equip(equips[i]);
                if(equipUnit) {
                    if(equipUnit.equip.Star >= goalStar && equipUnit.equipCfg.Quality >= goalQuality) {
                        count++;
                    }
                }
            }
            return count;
        } else {
            return this._taskTargetData && this._taskTargetData.GroupCountMap && this._taskTargetData.GroupCountMap[cfg.TargetGroupID] ? this._taskTargetData.GroupCountMap[cfg.TargetGroupID] : 0;
        }
    }

    getTaskIsReceiveReward(taskId: number) {
        return this._taskTargetData && this._taskTargetData.ReceiveRewardMap && this._taskTargetData.ReceiveRewardMap[taskId] ? this._taskTargetData.ReceiveRewardMap[taskId] : false
    }

    getTaskIsCompleted(taskId: number) {
        let cfg = configUtils.getTaskByTaskId(taskId);
        
        let curr = this._taskFinishData[taskId];
        // 如果数据没改变，没必要重新计算完成情况，之前会导致非常卡顿
        if (curr && !curr.Dirty && ALWAYS_DIRTY.indexOf(cfg.TargetType) == -1) {
            return curr.Finish
        }

        let isFinish:boolean = false;
        switch (cfg.TargetType) {
            case TASK_FINISH_TYPE.HERO_STAR: {
                let goalParam = cfg.TargetGoalParam.split(';');
                let heroId: number = Number(goalParam[0]);
                let star: number = Number(goalParam[1]);
                let heroUnit: HeroUnit = bagData.getHeroById(heroId);
                let curStar = 0;
                if(heroUnit) {
                    curStar = heroUnit.star;
                }
                isFinish = curStar >= star
                break;
            }
            case TASK_FINISH_TYPE.MAP_LEVEL: {
                let record = pveData.records[cfg.TargetGoalParam];
                isFinish = record && record.Past;
                break;
            }
            case TASK_FINISH_TYPE.USER_LEVEL: {
                isFinish = userData.lv >= Number(cfg.TargetGoalParam);
                break;
            }
            case TASK_FINISH_TYPE.PART_IN_PVE: {
                let goalParam = cfg.TargetGoalParam.split(';');
                let moduleId: number = Number(goalParam[0]);
                let goalPartInTimes: number = Number(goalParam[1]);
                let partInTimes: number = this._taskTargetData.GroupCountMap[cfg.TargetGroupID] ? this._taskTargetData.GroupCountMap[cfg.TargetGroupID] : 0;
                isFinish = partInTimes >= goalPartInTimes;
                break;
            }
            case TASK_FINISH_TYPE.PASS_CLOUD_DREAM_TIMES:
            case TASK_FINISH_TYPE.PASS_NINE_GHOST_TIMES: {
                let goalTimes: number = Number(cfg.TargetGoalParam);
                let passTimes: number = this._taskTargetData.GroupCountMap[cfg.TargetGroupID] ? this._taskTargetData.GroupCountMap[cfg.TargetGroupID] : 0;
                isFinish = passTimes >= goalTimes;
                break;
            }
            case TASK_FINISH_TYPE.PASS_CLOUD_DREAM_FLOOR: {
                // 云端梦境
                let chapterId = pveTrialData.cloudChapId;
                let goalFloor = Number(cfg.TargetGoalParam);
                let curChapterCfg = configUtils.getCloudDreamChapterConfig(chapterId);
                isFinish = curChapterCfg.PVECloudDreamChapterNum > goalFloor;
                break;
            }
            case TASK_FINISH_TYPE.PASS_DREAM_LAND_MAP: {
                // 太虚幻境
                let goalLessonId: number = Number(cfg.TargetGoalParam);
                let lastPassLessonId = pveData.getDreamLastLessonId();
                isFinish = lastPassLessonId >= goalLessonId;
                break;
            }
            case TASK_FINISH_TYPE.HAS_HERO_STAR_QUALITY: {
                let goalParam = cfg.TargetGoalParam.split(";");
                let goalStar = Number(goalParam[0]);
                let goalQuality = Number(goalParam[1]);
                let goalCount = Number(goalParam[2]);
                let heros = bagData.getItemsByType(BAG_ITEM_TYPE.HERO);
                let count: number = 0;
                for(let i = 0; i < heros.length; ++i) {
                    let heroUnit = new HeroUnit(heros[i]);
                    if(heroUnit && heroUnit.isHeroBasic) {
                        if(heroUnit.star == goalStar && heroUnit.heroCfg.HeroBasicQuality == goalQuality) {
                            count++;
                            if(count >= goalCount) {
                                isFinish = true;
                            }
                        }
                    }
                }
                isFinish = false;
                break;
            }
            case TASK_FINISH_TYPE.HAS_HERO_HIGHER_STAR_QUALITY : {
                let goalParam = cfg.TargetGoalParam.split(";");
                let goalStar = Number(goalParam[0]);
                let goalQuality = Number(goalParam[1]);
                let goalCount = Number(goalParam[2]);
                let heros = bagData.getItemsByType(BAG_ITEM_TYPE.HERO);
                let count: number = 0;
                for(let i = 0; i < heros.length; ++i) {
                    let heroUnit = new HeroUnit(heros[i]);
                    if(heroUnit && heroUnit.isHeroBasic) {
                        if(heroUnit.star >= goalStar && heroUnit.heroCfg.HeroBasicQuality == goalQuality) {
                            count++;
                            if(count >= goalCount) {
                                isFinish = true;
                            }
                        }
                    }
                }
                isFinish = false;
                break;
            }
            case TASK_FINISH_TYPE.HAS_HERO_STAR_HIGHER_QUALITY: {
                let goalParam = cfg.TargetGoalParam.split(";");
                let goalStar = Number(goalParam[0]);
                let goalQuality = Number(goalParam[1]);
                let goalCount = Number(goalParam[2]);
                let heros = bagData.getItemsByType(BAG_ITEM_TYPE.HERO);
                let count: number = 0;
                for(let i = 0; i < heros.length; ++i) {
                    let heroUnit = new HeroUnit(heros[i]);
                    if(heroUnit && heroUnit.isHeroBasic) {
                        if(heroUnit.star == goalStar && heroUnit.heroCfg.HeroBasicQuality >= goalQuality) {
                            count++;
                            if(count >= goalCount) {
                                isFinish = true;
                            }
                        }
                    }
                }
                isFinish = false;
                break;
            }
            case TASK_FINISH_TYPE.HAS_HERO_HIGHER_STAR_HIGHER_QUALITY: {
                let goalParam = cfg.TargetGoalParam.split(";");
                let goalStar = Number(goalParam[0]);
                let goalQuality = Number(goalParam[1]);
                let goalCount = Number(goalParam[2]);
                let heros = bagData.getItemsByType(BAG_ITEM_TYPE.HERO);
                let count: number = 0;
                for(let i = 0; i < heros.length; ++i) {
                    let heroUnit = new HeroUnit(heros[i]);
                    if(heroUnit && heroUnit.isHeroBasic) {
                        if(heroUnit.star >= goalStar && heroUnit.heroCfg.HeroBasicQuality >= goalQuality) {
                            count++;
                            if(count >= goalCount) {
                                isFinish = true;
                            }
                        }
                    }
                }
                isFinish = false;
                break;
            }
            case TASK_FINISH_TYPE.HAS_EQUIP_STAR_QUALITY: {
                let goalParam = cfg.TargetGoalParam.split(";");
                let goalStar = Number(goalParam[0]);
                let goalQuality = Number(goalParam[1]);
                let goalCount = Number(goalParam[2]);
                let equips = bagData.getItemsByType(BAG_ITEM_TYPE.EQUIP);
                let count: number = 0;
                for(let i = 0; i < equips.length; ++i) {
                    let equipUnit = new Equip(equips[i]);
                    if(equipUnit) {
                        if(equipUnit.equip.Star == goalStar && equipUnit.equipCfg.Quality == goalQuality) {
                            count++;
                            if(count >= goalCount) {
                                isFinish = true;
                            }
                        }
                    }
                }
                isFinish = false;
                break;
            }
            case TASK_FINISH_TYPE.HAS_EQUIP_HIGHER_STAR_QUALITY: {
                let goalParam = cfg.TargetGoalParam.split(";");
                let goalStar = Number(goalParam[0]);
                let goalQuality = Number(goalParam[1]);
                let goalCount = Number(goalParam[2]);
                let equips = bagData.getItemsByType(BAG_ITEM_TYPE.EQUIP);
                let count: number = 0;
                for(let i = 0; i < equips.length; ++i) {
                    let equipUnit = new Equip(equips[i]);
                    if(equipUnit) {
                        if(equipUnit.equip.Star >= goalStar && equipUnit.equipCfg.Quality == goalQuality) {
                            count++;
                            if(count >= goalCount) {
                                isFinish = true;
                            }
                        }
                    }
                }
                isFinish = false;
                break;
            }
            case TASK_FINISH_TYPE.HAS_EQUIP_STAR_HIGHER_QUALITY: {
                let goalParam = cfg.TargetGoalParam.split(";");
                let goalStar = Number(goalParam[0]);
                let goalQuality = Number(goalParam[1]);
                let goalCount = Number(goalParam[2]);
                let equips = bagData.getItemsByType(BAG_ITEM_TYPE.EQUIP);
                let count: number = 0;
                for(let i = 0; i < equips.length; ++i) {
                    let equipUnit = new Equip(equips[i]);
                    if(equipUnit) {
                        if(equipUnit.equip.Star == goalStar && equipUnit.equipCfg.Quality >= goalQuality) {
                            count++;
                            if(count >= goalCount) {
                                isFinish = true;
                            }
                        }
                    }
                }
                isFinish = false;
                break;
            }
            case TASK_FINISH_TYPE.HAS_EQUIP_HIGHER_STAR_HIGHER_QUALITY: {
                let goalParam = cfg.TargetGoalParam.split(";");
                let goalStar = Number(goalParam[0]);
                let goalQuality = Number(goalParam[1]);
                let goalCount = Number(goalParam[2]);
                let equips = bagData.getItemsByType(BAG_ITEM_TYPE.EQUIP);
                let count: number = 0;
                for(let i = 0; i < equips.length; ++i) {
                    let equipUnit = new Equip(equips[i]);
                    if(equipUnit) {
                        if(equipUnit.equip.Star >= goalStar && equipUnit.equipCfg.Quality >= goalQuality) {
                            count++;
                            if(count >= goalCount) {
                                isFinish = true;
                            }
                        }
                    }
                }
                isFinish = false;
                break;
            }
            case TASK_FINISH_TYPE.DAY:
            case TASK_FINISH_TYPE.WEEK: {
                let completedCount: number = 0;
                // TODO 敢这样是因为服务器不想记录这种的任务完成 所以才敢这样做
                // 本身也不该这样遍历，应该考虑在最开始初始化一遍日、周任务的计数，后续如有对应任务完成做自增即可 TODO
                // 查找条件不太合理，但是每日任务和每周任务的TargetGroupID没有重复的，所以可用
                // 用一个缓存结构 将2层循环拆成1层，后续如果还有需要，可考虑再对task这个配置做优化，直接先根据TargetModule获取对应的配置
                let tempMap: {[key: string]: boolean} = {};
                for(const k in this._taskTargetData.GroupCountMap) {
                    tempMap[cfg.TargetModule+"_"+k] = true;
                }
                let configs = configManager.getConfigs("task");
                let configKeys = configManager.getConfigKeys("task");
                let config: cfg.TaskTarget = null;
                for (let i = 0; i < configKeys.length; ++i) {
                    config = configs[configKeys[i]];
                    if (tempMap[config.TargetModule+"_"+config.TargetGroupID] && this.getTaskIsCompleted(config.TargetID)) {
                        ++completedCount;
                    }
                }

                isFinish = completedCount >= Number(cfg.TargetGoalParam);
                break;
            }
            case TASK_FINISH_TYPE.SUMMON__HERO_GACHA_SIMULATE:
            case TASK_FINISH_TYPE.SUMMON__EQUIP_GACHA_SIMULATE: {
                isFinish = this._taskTargetData && this._taskTargetData.GroupCountMap && this._taskTargetData.GroupCountMap[cfg.TargetGroupID] > 0;
                break;
            }
            //两个任务都是走默认的计数逻辑
            // case TASK_FINISH_TYPE.JOIN_PEAK_DUEL_PVP: {
            //     let fightList = pvpData.peakDuelData?.FightList;
            //     isFinish = !!(fightList && fightList.length);
            //     break;
            // }
            // case TASK_FINISH_TYPE.WIN_PEAK_DUEL_PVP: {
            //     let fightList = pvpData.peakDuelData?.FightList;
            //     if (fightList && fightList.length) {
            //         isFinish = (fightList.length >= Number(cfg.TargetGoalParam));
            //     } else {
            //         isFinish = false;
            //     }
            //     break;
            // }
            default: {
                let condiStr = cfg.TaskShowCondition;
                let isCondiMeet = true;
                if(condiStr && condiStr.length > 0) {
                    utils.parseStingList(condiStr, (condi: string[]) => {
                        if(!isCondiMeet) return;
                        let condiType = parseInt(condi[0]), condiValue = parseFloat(condi[1]);

                        //宝物相关的任务
                        if(condiType == TASK_CONDITION_TYPE.TREASURE_SYS_POWER) {
                            isCondiMeet = this.isOpenTreasureSysPower(condiValue)
                        }
                    });
                }

                let curCount: number = this._taskTargetData.GroupCountMap && this._taskTargetData.GroupCountMap[cfg.TargetGroupID] ? this._taskTargetData.GroupCountMap[cfg.TargetGroupID] : 0;
                let targetCount: number = Number(cfg.TargetGoalParam);
                isFinish = isCondiMeet && curCount >= targetCount;
                break;
            }
        }
        this._taskFinishData[taskId] = {
            Finish: isFinish,
            Dirty: false,
            Condition: cfg.TargetType
        }
        return isFinish
    }

    checkNewFinishedTask (targetGroupMap?: {[key: string]: boolean}) {
        let newTasks: number[] = [];
        let taskCfgs: any = configManager.getConfigs("task");
        let keys = configManager.getConfigKeys("task");
        for(let i = 0; i < keys.length; ++i) {
            let _cfg:cfg.TaskTarget  = taskCfgs[keys[i]];
            if ((targetGroupMap && targetGroupMap[_cfg.TargetGroupID]) || !targetGroupMap){
                let finished = this.getTaskIsCompleted(_cfg.TargetID);
                if (finished && _cfg.TaskOverShow) {
                    newTasks.push(_cfg.TargetID);
                }
            }
        }
        return newTasks;
    }

    resetDayTasks() {
        let tasksCfg: cfg.TaskTarget[] = configManager.getConfigList("task");
        let dayTasks = tasksCfg.filter(_taskCfg => {
            return _taskCfg.TargetModule == TASK_TYPE.DAY;
        });
        for(let i = 0; i < dayTasks.length; ++i) {
            let group = dayTasks[i].TargetGroupID;
            let progressData = this._taskTargetData.GroupCountMap[group];
            if(progressData) {
                delete this._taskTargetData.GroupCountMap[group];
            }
            let rewardData = this._taskTargetData.ReceiveRewardMap[group];
            if(rewardData) {
                delete this._taskTargetData.ReceiveRewardMap[group];
            }
        }
    }

    clearGuildTasks() {
        let tasksCfg: cfg.TaskTarget[] = configManager.getConfigList("task");
        let dayTasks = tasksCfg.filter(_taskCfg => {
            // 公会任务 重置
            return TASK_TYPE.GUILD == _taskCfg.TargetModule;
        });
        for(let i = 0; i < dayTasks.length; ++i) {
            let group = dayTasks[i].TargetGroupID;
            let progressData = this._taskTargetData.GroupCountMap[group];
            if(progressData) {
                delete this._taskTargetData.GroupCountMap[group];
            }
            let rewardData = this._taskTargetData.ReceiveRewardMap[group];
            if(rewardData) {
                delete this._taskTargetData.ReceiveRewardMap[group];
            }
        }
    }

    resetWeekTasks() {
        let tasksCfg: cfg.TaskTarget[] = configManager.getConfigList("task");
        let dayTasks = tasksCfg.filter(_taskCfg => {
            // 每周任务 公会任务 都会重置
            return _taskCfg.TargetModule == TASK_TYPE.WEEK || TASK_TYPE.GUILD == _taskCfg.TargetModule;
        });
        for(let i = 0; i < dayTasks.length; ++i) {
            let group = dayTasks[i].TargetGroupID;
            let progressData = this._taskTargetData.GroupCountMap[group];
            if(progressData) {
                delete this._taskTargetData.GroupCountMap[group];
            }
            let rewardData = this._taskTargetData.ReceiveRewardMap[group];
            if(rewardData) {
                delete this._taskTargetData.ReceiveRewardMap[group];
            }
        }
    }

    resetDoubleWeekTasks() {
        const todayTime = utils.getTodayZeroTime(true);
        let clearActivityCfgs = [];
        const configs: cfg.ActivityWeekSummonList[] = configManager.getConfigList('doubleWeekList');
        for(let i = 0; i < configs.length; ++i) {
            const cfg = configs[i];
            const activityTimes = activityUtils.calBeginEndTime(cfg.OpenTime, cfg.HoldTime);
            const endTime = activityTimes[1];
            if(Math.abs(endTime - todayTime) <= 10) {
                clearActivityCfgs.push(cfg);
            }
        }
        // 充值双周活动
        for(let i = 0; i < clearActivityCfgs.length; ++i) {
            const cfg = clearActivityCfgs[i];
            const doubleWeekCfgs: cfg.ActivityWeekSummonTask[] = configManager.getConfigByKV('doubleWeekTask', 'FunctionID', cfg.FunctionID);
            if(doubleWeekCfgs && doubleWeekCfgs.length > 0) {
                for(let j = 0; j < doubleWeekCfgs.length; ++j) {
                    const tasks = doubleWeekCfgs[j].TaskList.split(';').map(_task => { return Number(_task); });
                    for(let k = 0; k < tasks.length; ++k) {
                        const taskCfg = configUtils.getTaskByTaskId(tasks[k]);
                        this._taskTargetData.GroupCountMap[taskCfg.TargetGroupID] = 0;
                        this._taskTargetData.ReceiveRewardMap[taskCfg.TargetGroupID] = false;
                    }
                }
            }
        }
    }

    checkSatisfyShow(cfg: cfg.TaskTarget) {
        if(typeof cfg.TaskShowCondition == 'undefined'){
            logger.warn(`任务未配置展示条件 任务ID：${cfg.TargetID}`);
            return false;
        }

        let conditions = utils.parseStingList(cfg.TaskShowCondition);
        let isReceived = this.getTaskIsReceiveReward(cfg.TargetID);
        let isFinish = this.getTaskIsCompleted(cfg.TargetID);
        return conditions.every(condition => {
            let type = parseInt(condition[0]), value = parseInt(condition[1]);
            if(!cfg.TaskGetShow && isReceived) return false;
            if(cfg.TaskGetShow && isReceived) return true;

            if(TASK_CONDITION_TYPE.USER_LEVEL == type) return userData.lv >= value;

            if(TASK_CONDITION_TYPE.COMPLETE_FRONT == type){
                let isFrontReceived = this.getTaskIsReceiveReward(value);
                return isFrontReceived && !isReceived;
            }

            //宝物相关的任务
            if(TASK_CONDITION_TYPE.TREASURE_SYS_POWER == type){
                return this.isOpenTreasureSysPower(value);
            }

            //完成后才可见
            if(TASK_CONDITION_TYPE.MUST_FINISH_VISIBLE == type){
                return isFinish;
            }

            return true;
        });
    }

    checkTaskOpened(cfg: cfg.TaskTarget){
        if(typeof cfg.TaskShowCondition == 'undefined'){
            logger.warn(`任务未配置展示条件 任务ID：${cfg.TargetID}`);
            return false;
        }
        let conditions = utils.parseStingList(cfg.TaskShowCondition);
        return conditions.every(condition => {
          let type = parseInt(condition[0]), value = parseInt(condition[1]);

          if(TASK_CONDITION_TYPE.USER_LEVEL == type) return userData.lv >= value;

          if(TASK_CONDITION_TYPE.COMPLETE_FRONT == type){
              let isFrontReceived = this.getTaskIsReceiveReward(value);
              return isFrontReceived;
          }

          //宝物相关的任务
          if(TASK_CONDITION_TYPE.TREASURE_SYS_POWER == type){
              return this.isOpenTreasureSysPower(value);
          }
          return true;
      });
    }

    setTargetTypeDirty (condition: number) {
        for (let key in this._taskFinishData) {
            let _v = this._taskFinishData[key];
            if (_v && _v.Condition == condition) {
                _v.Dirty = true
            }
        }
    }
}

let taskData = new TaskData();
export {
    taskData,
    TASK_FINISH_TYPE
}
