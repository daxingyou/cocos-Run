
import { HERO_ENERGY_MAX } from "../../app/AppConst";
import { LESSON_TYPE, PVE_MODE } from "../../app/AppEnums";
import { PveConfig } from "../../app/AppType";
import { utils } from "../../app/AppUtils";
import { configUtils } from "../../app/ConfigUtils";
import { configManager } from "../../common/ConfigManager";
import { cfg } from "../../config/config";
import { data } from "../../network/lib/protocol";
import BaseModel from "./BaseModel";
import { pveFakeData } from "./PveFakeData";
import { pveTrialData } from "./PveTrialData";
import { userData } from "./UserData";

class PveData extends BaseModel {
    private _lessonRecords: ({ [k: string]: data.ILessonRecord } | null) = {};
    private _dreamRecords: ({ [k: string]: data.ILessonRecord } | null) = {};
    private _dailyRecords: ({ [k: string]: data.ILessonRecord } | null) = {};
    private _riseRoadRecords: ({ [k: string]: data.ILessonRecord } | null) = {};
    private _dreamCounts: data.IFightCount = {};
    private _chapterRewards: ({ [k: string]: boolean }) = {};
    private _teams: ({ [k: string]: data.ITeamInfo }) = {};
    private _lessonStageRewards: {[k: number]: boolean} = {};
    private _chapterStageRewards: {[k: number]: boolean} = {};
    private _lastPassLessonId: number = 0;
    private _latestPassLessonID: number = 0;  //最新的通关关卡(关卡编号最大的通关关卡)
    private _isRefreshLevelMap: boolean = false;

    //中转数据，用于战斗初始化使用
    private _pveConfig: PveConfig = null;

    get presetTeams() {
        return this._teams;
    }

    get records() {
        return this._lessonRecords;
    }

    get dreamRecords() {
        return this._dreamRecords;
    }

    get dailyRecords() {
        return this._dailyRecords;
    }

    get riseRoadRecords() {
        return this._riseRoadRecords;
    }

    get dreamCounts() {
        return this._dreamCounts;
    }

    get chapReward() {
        return this._chapterRewards;
    }

    set pveConfig(val: PveConfig) {
        this._pveConfig = val;
    }

    get pveConfig() {
        return this._pveConfig;
    }

    get magicDoor(): boolean {
        return (this.pveConfig && this.pveConfig.pveMode == PVE_MODE.MAGIC_DOOR);
    }

    get lessonStageRewards() {
        return this._lessonStageRewards;
    }

    get chapterStageRewards() {
        return this._chapterStageRewards;
    }

    get lastPassLessonId(): number {
        return this._lastPassLessonId;
    }

    get isRefreshLevelMap(){
        return this._isRefreshLevelMap;
    }

    set isRefreshLevelMap(isRefresh: boolean){
        this._isRefreshLevelMap = isRefresh;
    }

    //最新的通关关卡(关卡编号最大的通关关卡)
    get latestPassLessonId(): number {
        return this._latestPassLessonID;
    }

    clearPveConfig() {
        //每次战斗结束重置
        this._pveConfig = null;
    }

    setChapRewardToken(chapID: number) {
        let chap = chapID.toString();
        this._chapterRewards[chap] = true;
    }

    init() {
        this.clearPveConfig();
    }

    deInit() { 
        this._lessonRecords = {};
        this._dreamRecords = {};
        this._dailyRecords = {};
        this._riseRoadRecords = {};
        this._dreamCounts = {};
        this._chapterRewards = {};
        this._teams = {};
        this._lessonStageRewards = {};
        this._chapterStageRewards = {};
        this._lastPassLessonId = 0;
        this._latestPassLessonID = 0;
        this._isRefreshLevelMap = false;
    }

    initPveData(resData: data.IPVEData) {
        this._latestPassLessonID = 0;
        this._lessonRecords = resData.LessonRecords;
        this._dreamRecords = resData.DreamRecords;
        this._dailyRecords = resData.DailyRecords;
        this._riseRoadRecords = resData.RiseRoadRecords;
        this._dreamCounts = resData.DreamCount;
        this._chapterRewards = resData.ChapterRewards;
        this._teams = resData.Teams;
        this._lessonStageRewards = resData.MainSectionRewardMap;
        this._chapterStageRewards = resData.MainChapterRewardMap;
        this._initLastPastLessonID();
        pveFakeData.init();
    }

    private _initLastPastLessonID(){
        if(!this._lessonRecords || Object.getOwnPropertyNames(this._lessonRecords).length <= 0) return;
        for(let k in this._lessonRecords){
            if(!this._lessonRecords.hasOwnProperty(k)) continue;
            let lessonID = parseInt(k);
            if(isNaN(lessonID) || lessonID <= 0) return;
            this._latestPassLessonID = Math.max(this._latestPassLessonID, lessonID);
        }
    }

    /**
     * @description 打完一场战斗之后更新数据
     * @param lessonId
     * @param record
    */
    updatePveRecord(lessonId: number, record: data.ILessonRecord) {
        //区分章节关卡和关卡
        let lessonMode = this.getLessonMode(lessonId);
        if (lessonMode == PVE_MODE.DREAM_LESSON) {
            this._dreamRecords[lessonId] = record;
        } else if (lessonMode == PVE_MODE.ADVENTURE_LESSON) {
            this._lessonRecords[lessonId] = record;
            this._lastPassLessonId = lessonId;
            this._latestPassLessonID = Math.max(this._latestPassLessonID, lessonId);
            this._isRefreshLevelMap = true;
        } else if (lessonMode == PVE_MODE.DAILY_LESSON) {
            this._dailyRecords[lessonId] = record;
        } else if (lessonMode == PVE_MODE.RISE_ROAD) {
            this._riseRoadRecords[lessonId] = record;
        }
    }

    updateDreamCount (v: data.IFightCount) {
        this._dreamCounts = v;
    }

    getTeamByIndex(index: number) {
        return this._teams[index];
    }

    updateTeamByIndex(team: data.ITeamInfo, teamIndex: number) {
        if (team && team.Heroes) {
            this._teams[teamIndex] = team;
        }
    }

    /**
     * @description 获取上一次通关的 lessonID
     */
    getLastPastLessonId() {
        return this._lastPassLessonId;
    }

    /**
     * @description 获取当前最新关卡
     * @returns
     */
    getCurrLessonId() {
        let lessonId: number = 0;
        const chapter = this.getCurrChapterId();
        const lessonCfgs: cfg.AdventureLesson[] = configManager.getConfigByKV('lesson', 'LessonChapter', chapter);
        if(!lessonCfgs || lessonCfgs.length == 0) return lessonId;
        lessonCfgs.sort((_a, _b) => { return _a.LessonId - _b.LessonId; });
        lessonCfgs.some(_lesson => {
            if(!this.checkLessonIsPast(_lesson.LessonId) && this.checkIsMainRoad(_lesson.LessonId)) {
              lessonId = _lesson.LessonId;
              return true;
            }
            return false;
        });
        return lessonId;
    }

    //获取最新的通关关卡
    getCurrPassedLesson() {
        let lessonID = 0;
        for(let k in this._lessonRecords) {
            if(!this._lessonRecords.hasOwnProperty(k)) continue;
            let currLesson = parseInt(k);
            lessonID = Math.max(lessonID, currLesson);
        }
        return lessonID;
    }

    /**
     * @description 获取当前最新章节
     * @returns
     */
    getCurrChapterId() {
        let chapterId: number = 1001;
        const lessonCfgs: cfg.AdventureLesson[] = configManager.getConfigByKV('lesson', 'LessonLast', 1);
        if(!lessonCfgs || lessonCfgs.length == 0) return chapterId;

        lessonCfgs.some(_lesson => {
            if(!this.checkLessonIsPast(_lesson.LessonId)){
                chapterId = _lesson.LessonChapter;
                return true;
            }
            return false;
        });
        return chapterId;
    }

    getNextChapterId(chapterId: number) {
        const chapterCfg = configUtils.getChapterConfig(chapterId);
        if(chapterCfg && chapterCfg.ChapterBehind) {
            return chapterCfg.ChapterBehind;
        }
        return 0;
    }
    /**
     * 获取当前关卡配置
     * @returns 
     */
    getCurrLessonCfg(): cfg.AdventureLesson {
        let lastPast = this.getLastPastLessonId();
        if (lastPast) {
            let pastCfg: cfg.AdventureLesson = configUtils.getLessonConfig(lastPast);
            let currCfg: cfg.AdventureLesson = configManager.getConfigByKV("lesson", "LessonOrder", lastPast)[0];
            // if(currCfg.LessonChapter != pastCfg.LessonChapter) {
            //     // 需要切换地图的情况 并且存在章节奖励
            //     if(!this.checkCanAddChapter()) {
            //         return pastCfg;
            //     } else {
            //         if (currCfg) {
            //             return currCfg;
            //         }
            //     }
            // } else {
                if (currCfg) {
                    return currCfg;
                }
            // }
        }
        return configManager.getAnyConfig("ConfigAdventureLesson")[0];
        // return configManager.getConfigs("lesson")[0];
    }

    /**
     * @description 根据id返回怪物组
     * @param lessonId 
     * @returns 怪物组数组，必须打完全部才能通关
     */
    getMonsterGroupByLesson(lessonId: number): number[] {
        let dreamLessonCfg: cfg.PVEDreamlandLesson = configManager.getConfigByKey("dreamlandLesson", lessonId);
        let lessonCfg: cfg.AdventureLesson = configManager.getConfigByKey("lesson", lessonId);
        let dailyLesson: cfg.PVEDailyLesson = configManager.getConfigByKey("pveDailyLesson", lessonId);
        let riseRoadLesson: cfg.PVERiseRoad = configManager.getConfigByKey("pveRiseRoad", lessonId);
        let groundList: number[] = [];
        if (lessonCfg && lessonCfg.LessonType == LESSON_TYPE.Battle) {
            if (lessonCfg.LessonMonsterGroupId) {
                let monsterGroups = lessonCfg.LessonMonsterGroupId.split(";").map( _v => { return parseInt(_v)})
                groundList = groundList.concat(monsterGroups)
                return groundList;
            }
        }
        else if (dreamLessonCfg && dreamLessonCfg.PVEDreamlandLessonMonsterGroupId) {
            let tempMonsterGroup = dreamLessonCfg.PVEDreamlandLessonMonsterGroupId;
            groundList.push(tempMonsterGroup);
            return groundList;
        }
        else if (dailyLesson && dailyLesson.PVEDailyLessonMonsterGroupId) {
            let tempMonsterGroup = dailyLesson.PVEDailyLessonMonsterGroupId;
            // for (let i = 0; i < tempMonsterGroup.length; ++i) {
            //     let monsterGroupId: string = tempMonsterGroup[i];
            //     groundList.push(parseInt(monsterGroupId));
            // }
            groundList.push(tempMonsterGroup);
            return groundList;
        }
        else if (riseRoadLesson && riseRoadLesson.PVERiseRoadMonsterGroupId) {
            let tempMonsterGroup = riseRoadLesson.PVERiseRoadMonsterGroupId;
            // for (let i = 0; i < tempMonsterGroup.length; ++i) {
            //     let monsterGroupId: string = tempMonsterGroup[i];
            //     groundList.push(parseInt(monsterGroupId));
            // }
            groundList.push(tempMonsterGroup);
            return groundList;
        }

        return groundList;
    }

    getMagicMonsterList(lessonId: number){
        let magicLesson: cfg.PVEDaoistMagicLesson = configManager.getConfigByKey("pveMagicLesson", lessonId);
        let monsterGroup = [1,1,1,1,1];
        if (magicLesson && magicLesson.PVECopyArray){
            let magicHeroGroupCfg: cfg.PVEDaoistMagicHeroGroup = 
                configManager.getConfigByKey("pveMagicHeroGroup", (magicLesson.PVECopyArray));
            monsterGroup = magicHeroGroupCfg.PVEDaoistMagicHeroGroupRule.split("|").map(_mid=>{
                return parseInt(_mid);
            }).splice(0,5);
        }
        return monsterGroup;
    }
    /**
     * 判断是否满足进入关卡条件
     * @returns 
     */
    checkMeetEnterCondition() {
        let lessCfg = this.getCurrLessonCfg();
        let isMeet: boolean = true;
        let enterConditionInfos = utils.parseStingList(lessCfg.LessonEnterCondition);
        for (let i = 0; i < enterConditionInfos.length; ++i) {
            // 等级
            if (enterConditionInfos[0] == 1) {
                return userData.lv >= Number(enterConditionInfos[1]);
            }
        }
        return isMeet;
    }

    /**
     * ==============================
     * @desc 太虚幻境部分内容
     * ==============================
     */
    getDreamLastLessonId() {
        let nearLessonID = 0;
        for (let key in this._dreamRecords) {
            if(!this._dreamRecords.hasOwnProperty(key)) continue;
            if (this._dreamRecords[key] && this._dreamRecords[key].Past) {
                nearLessonID = Math.max(parseInt(key), nearLessonID);
            }
        }
        return nearLessonID;
    }

    getDreamCurLessonId() {
        let config = configManager.getConfigs("dreamlandLesson");
        let nearLessonID = this.getDreamLastLessonId();
        let lessonId: number;
        let initId: number = -1;
        for (const k in config) {
            let ele: cfg.PVEDreamlandLesson = config[k];
            if (ele.PVEDreamlandLessonOrder == nearLessonID) {
                lessonId = ele.PVEDreamlandLessonId;
            } else if (!ele.PVEDreamlandLessonOrder) {
                initId = ele.PVEDreamlandLessonId;
            }
        }
        // 优先级: 有进度、完成进度、零进度
        lessonId = lessonId || nearLessonID || initId;
        return lessonId;
    }

    /**
     * @desc 暂时只包含非极限试炼部分的数据（后续考虑废弃）
     * @param lessonId 章节ID
     * @returns 
     */
    getLessonMode(lessonId: number): PVE_MODE {
        let dreamLessonCfg: cfg.PVEDreamlandLesson = configManager.getConfigByKey("dreamlandLesson", lessonId);
        let lessonCfg: cfg.AdventureLesson = configManager.getConfigByKey("lesson", lessonId);
        let dailyLesson: cfg.PVEDailyLesson = configManager.getConfigByKey("pveDailyLesson", lessonId);
        let riseRoadLesson: cfg.PVERiseRoad = configManager.getConfigByKey("pveRiseRoad", lessonId);
        if (dreamLessonCfg) return PVE_MODE.DREAM_LESSON;
        if (lessonCfg) return PVE_MODE.ADVENTURE_LESSON;
        if (dailyLesson) return PVE_MODE.DAILY_LESSON;
        if (riseRoadLesson) return PVE_MODE.RISE_ROAD;
        return PVE_MODE.NONE;
    }
    
    //@desc 多阵容战斗的英雄只能用一次
    checkPveBanHero(heroID: number) {
        if(this._pveConfig && this.pveConfig.banHeroList) {
            if (this._pveConfig.banHeroList.indexOf(heroID) != -1)
                return true
        }
        return false;
    }

    checkHeroBan (heroID: number) {
        return pveTrialData.checkBanHero(heroID) || this.checkPveBanHero(heroID);
    }

    checkLessonIsPast(lessonId: number) {
        return !!this._lessonRecords[lessonId] && this._lessonRecords[lessonId].Past;
    }

    checkCanAddChapter(): boolean {
        let lastPast = this.getLastPastLessonId();
        let chapterId: number = 0;
        if (lastPast) {
            let pastCfg: cfg.AdventureLesson = configUtils.getLessonConfig(lastPast);
            chapterId = pastCfg.LessonChapter;
        } else {
            return true;
        }
        // 关卡奖励判断判断
        let lessonCfgs = configManager.getConfigByKV('lesson', 'LessonChapter', chapterId);
        for(const k in lessonCfgs) {
            if(lessonCfgs[k].LessonChapter == chapterId) {
                if(lastPast >= lessonCfgs[k].LessonId && lessonCfgs[k].LessonProgressRewardShow && !this._lessonStageRewards[lessonCfgs[k].LessonId]) {
                    return false;
                }
            }
        }
        return true;
    }

    getDreamLessonName(){
        let config = configManager.getConfigs("dreamlandLesson");
        let lessonID = pveData.getDreamCurLessonId();
        let chapID = config[lessonID].PVEDreamlandLessonChapter;
        let chapterCfg = configManager
            .getConfigByKey("dreamlandChapter", chapID);
        let nextChapter = chapterCfg.PVEDreamlandChapterBehind;
        let chapName = chapterCfg.PVEDreamlandChapterName;
        let chapPassed = pveData.dreamRecords[lessonID] && pveData.dreamRecords[lessonID].Past;
        let lessonList: cfg.PVEDreamlandLesson[] = [];
        //章节相对索引
        let curIndex = 0;
        for (const k in config) {
            let ele: cfg.PVEDreamlandLesson = config[k];
            if (ele.PVEDreamlandLessonChapter == chapID) {
                lessonList.push(ele);
            }
        }
        lessonList.sort((a, b) => {
            let orderA = a.PVEDreamlandLessonOrder || -1;
            let orderB = b.PVEDreamlandLessonOrder || -1;
            return orderA - orderB;
        }).forEach((ele, index) => {
            if (ele.PVEDreamlandLessonId == lessonID) {
                curIndex = index + 1;
            }
        })
        chapPassed &&= (lessonID == lessonList[lessonList.length - 1].PVEDreamlandLessonId);
        if (curIndex) chapName += `-${curIndex}`;
        if (!nextChapter && chapPassed) {
            return "已全部通关";
        }
        return chapName;
    }

    resetLastPassId() {
        this._lastPassLessonId = 0;
    }

    getChapterLessonCfgs(chapterId: number) {
        const lessonCfgs: cfg.AdventureLesson[] = configManager.getConfigByKV('lesson', 'LessonChapter', chapterId);
        if(lessonCfgs) {
            return lessonCfgs;
        }
        return null;
    }

    checkIsMainRoad(lessonId: number): boolean {
        const lessonCfg = configUtils.getLessonConfig(lessonId);
        const lessons: cfg.AdventureLesson[] = configManager.getConfigByManyKV('lesson', 'LessonLast', 1, 'LessonChapter', lessonCfg.LessonChapter);
        if(lessons.length > 0) {
            lessons.sort((_a, _b) => { return _a.LessonId - _b.LessonId; });
            let preLessonCfg = lessons[0];
            while(preLessonCfg) {
                if(preLessonCfg.LessonId == lessonId) {
                    return true;
                }
                if(preLessonCfg.LessonOrder) {
                    preLessonCfg = configUtils.getLessonConfig(preLessonCfg.LessonOrder);
                } else {
                    preLessonCfg = null;
                }
            }
        }
        return false;
    }

    /**
     * 根据英雄ID获取在当前PVE模式下的状态
     * @params heroID
     * @returns 英雄状态
     */
    getHeroStateInPVE(heroID: number) {
        let result: {hpPercent: number, energyPercent: number} = null

        if (this.pveConfig == null) {
            return result;
        }

        let heroes: data.ITrialRoleInfo[] = null;
        if (this.pveConfig.pveMode === PVE_MODE.RESPECT) {
            heroes = pveTrialData.respectData.Heroes;
        } else if (this.pveConfig.pveMode === PVE_MODE.PURGATORY) {
            heroes = pveTrialData.getPurgatoryHeroes();
        } else if (this.pveConfig.pveMode === PVE_MODE.FAIRY_ISLAND) {
            heroes = pveTrialData.getIslandHeroes();
        }

        let hero = heroes?.find((hero) => { return heroID === hero.ID });
        if (hero) {
            result = {
                hpPercent: hero.HPPercent / 10000,
                energyPercent: hero.Energy / HERO_ENERGY_MAX
            }
        } else if(this.pveConfig.pveMode == PVE_MODE.XIN_MO_FA_XIANG) {
            //  心魔法相
            let trialDevilData = pveTrialData.trialDevilData.data;
            if(trialDevilData.Heroes && trialDevilData.Heroes.length > 0) {
                trialDevilData.Heroes.some(ele => {
                    if(ele.ID == heroID) {
                        result = { hpPercent: ele.HPPercent / 10000, energyPercent: ele.Energy / HERO_ENERGY_MAX};
                        return true;
                    }
                    return false;
                });
            }

            result = result || {hpPercent: 1, energyPercent: 0};
        }

        return result;
    }

    /**
     * 判断当前是否是指定的PVE模式
     * @param pveMode PVE模式枚举值
     * @returns 布尔值
     */
    isPVEMode(pveMode: PVE_MODE) {
        let isPVEMode = false;
        if (pveData && pveData.pveConfig && pveData.pveConfig.pveMode == pveMode) {
            isPVEMode = true;
        }

        return isPVEMode;
    }
}

let pveData = new PveData();
export { pveData }