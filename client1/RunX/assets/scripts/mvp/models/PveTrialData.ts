/*
 * @Author: xuyang
 * @Date: 2021-07-28 11:32:46
 * @Description: 极限试炼数据
 */
import { PVE_MODE } from "../../app/AppEnums";
import { CustomPveFinishResult } from "../../app/AppType";
import { utils } from "../../app/AppUtils";
import { configManager } from "../../common/ConfigManager";
import { cfg } from "../../config/config";
import { data } from "../../network/lib/protocol";
import { bagData } from "./BagData";
import BaseModel from "./BaseModel";
import { pveData } from "./PveData";

class PveTrialData extends BaseModel {
    //用户类数据
    private _hellData: data.ITrialHellData = {};
    private _cloudData: data.ITrialCloudDreamData = {};
    private _miracalData: data.ITrialMiracleDoorData = {};
    private _respectData: data.ITrialRespectData = {};
    private _islandData: data.ITrialIslandData = {};
    // 心魔法相数据
    private _trialDevilData: {data?: data.ITrialDevilData, selfRank?: number, prizes?: data.IItemInfo[], roundDamage?: number} = {};
    // 无间炼狱
	private _purgatoryData: data.ITrialPurgatoryData = {};
    // 阴阳宝鉴
    private _yyBookData: data.ITrialLightDarkData = {};
    trigramsHeroIDs: number[] = [];     // 缓存卦象上的英雄，要在卦象更新时重置
    isTrigramsActive: boolean = false;  // 缓存卦象是否激活

    //管理类数据,只能主动请求
    private _hellInfo: data.ITrialHell = {};
    private _cloudInfo: data.ITrialCloudDream = {};
    private _miracalInfo: data.ITrialMiracleDoor = {};
    private _cloudChapId: number = 1;

    get hellData() {
        return this._hellData;
    }

    get cloudData() {
        return this._cloudData;
    }

    get miracalData(){
        return this._miracalData;
    }

    get islandData() {
        return this._islandData;
    }

    get hellInfo() {
        return this._hellInfo;
    }

    get cloudInfo() {
        return this._cloudInfo;
    }

    get miracalInfo(){
        return this._miracalInfo;
    }

    get cloudChapId(){
        return this._cloudChapId;
    }

    get respectData(){
        return this._respectData;
    }

    get trialDevilData() {
        return this._trialDevilData;
    }
	
	get purgatoryData() {
        return this._purgatoryData;
    }

    get yyBookData() {
        return this._yyBookData;
    }

    init() {}

    deInit() {
        this._hellData = {};
        this._cloudData = {};
        this._miracalData = {};
        this._hellInfo = {};
        this._cloudInfo = {};
        this._miracalInfo = {};
        this._cloudChapId = 1;
        this._respectData = {};
        this._islandData = {};
        this._trialDevilData = {};
		this._purgatoryData = {};
        this._yyBookData = {};
        this.trigramsHeroIDs = [];    
        this.isTrigramsActive = false; 
    }

    initPveTrialData(resData: data.ITrialData) {
        this._hellData = resData.TrialHellData;
        this._cloudData = resData.TrialCloudDreamData;
        this._miracalData = resData.TrialMiracleDoorData;
        this.syncCloudChapId();
        this._respectData = resData.TrialRespectData;
        this._islandData = resData.TrialIslandData;
        this._trialDevilData.data = resData.TrialDevilData;
		this._purgatoryData = resData.TrialPurgatoryData;
        this._yyBookData = resData.TrialLightDarkData;
    }


    updatePveTrialCloudReward(){
        this._cloudData.ReceiveRewardMap[this._cloudChapId] = true;
        this.syncCloudChapId();
    }

    updatePveTrialMiracalReward() {
        this._miracalData.IsReceiveReward = true;
    }

    IslandFinishData: CustomPveFinishResult = null;

    /**
     * @description 打完一场战斗之后更新数据,通关及英雄详情
     * @param lessonId
     * @param record
    */
    updatePveTrialRecord(lessonId: number, past: boolean, heros?:any[]) {
        let pveMode = pveData.pveConfig ? pveData.pveConfig.pveMode : null;
        if (pveMode == PVE_MODE.NINE_HELL) {
            this._hellData.PassLessonMap[lessonId] = past;
            past && heros && heros.forEach((hero)=>{
                this._hellData.UseHeroMap[hero] = true;
            });
        } else if (pveMode == PVE_MODE.CLOUD_DREAM) {
            if(!past || !heros || heros.length == 0) return;
            this._cloudData.TrialCloudDreamPassLessonMap = this._cloudData.TrialCloudDreamPassLessonMap || {};
            let useHeros: any = null;
            heros.forEach(ele => {
                useHeros = useHeros || {};
                useHeros[ele] = true;
            });
            this._cloudData.TrialCloudDreamPassLessonMap[lessonId] = this._cloudData.TrialCloudDreamPassLessonMap[lessonId] || {};
            this._cloudData.TrialCloudDreamPassLessonMap[lessonId].UseHeroMap = useHeros;
        } else if (pveMode == PVE_MODE.MAGIC_DOOR){
            this._miracalData.PassLessonMap[lessonId] = past;
        }
    }

    // 云端梦境最新的章节
    syncCloudChapId(){
        let curChapterID = 1;
        //没有章节通关数据
        if(!this._cloudData || !this._cloudData.TrialCloudDreamPassLessonMap || Object.keys(this._cloudData.TrialCloudDreamPassLessonMap).length == 0){
            this._cloudChapId = curChapterID;
            return;
        }

        for (let k in this._cloudData.TrialCloudDreamPassLessonMap) {
            let lessonCfg = configManager.getConfigByKey("cloudDreamLesson", k);
            let chapID = lessonCfg ? lessonCfg.PVECloudDreamLessonChapter : 0;
            curChapterID = Math.max(curChapterID, chapID );
        }

        let chapLimit = 1;
        configManager.getConfigList("cloudDreamLesson").forEach(cfg => {
            chapLimit = Math.max(cfg.PVECloudDreamLessonChapter, chapLimit);
        })
        if (this._cloudData.ReceiveRewardMap[curChapterID]) curChapterID += 1;
        this._cloudChapId = Math.min(curChapterID, chapLimit);
    }
    /**
     * @desc 同步九幽活动信息
     * @param hellInfo 活动配置信息
     */
    updateHellInfo(hellInfo: data.ITrialHell){
        this._hellInfo = hellInfo;
    }

    /**
    * @desc 同步云端梦境活动信息
    * @param hellInfo 活动配置信息
    */
    updateCloudInfo(cloudInfo: data.ITrialCloudDream) {
        this._cloudInfo = cloudInfo;
    }

    /**
    * @desc 同步奇门遁甲活动信息
    * @param hellInfo 活动配置信息
    */
    updateMiracalInfo(miracalInfo: data.ITrialMiracleDoor) {
        this._miracalInfo = miracalInfo;
    }

    //@desc 极限试炼部分的禁用数据
    checkBanHero(heroID: number) {
        let pveMode = pveData.pveConfig ? pveData.pveConfig.pveMode : null;
        if (pveMode == PVE_MODE.NINE_HELL) {
            let heroUsed = this._hellData.UseHeroMap.hasOwnProperty(heroID)
                && this._hellData.UseHeroMap[heroID];
            return heroUsed;
        }

        if (pveMode == PVE_MODE.RESPECT || pveMode == PVE_MODE.PURGATORY || pveMode == PVE_MODE.FAIRY_ISLAND) {
            let heroState = pveData.getHeroStateInPVE(heroID);
            if (heroState) {
                return heroState.hpPercent <= 0;
            }
        }

        if (pveMode == PVE_MODE.XIN_MO_FA_XIANG) {
            let trialDevilData = this._trialDevilData.data;
            if(trialDevilData && trialDevilData.Heroes && trialDevilData.Heroes.length > 0) {
                return  trialDevilData.Heroes.some(ele => {
                    return ele.ID == heroID && ele.HPPercent == 0;
                })
            }
        }

        if (pveMode == PVE_MODE.YYBOOK) {
            return pveTrialData.yyBookData.ActivateHeroIDList.indexOf(heroID) >= 0;
        }

        return false;
    }

    clearTrailCloudData(){
        if(!this._cloudData) return;
        this._cloudData.IsReceiveSweepReward = false;
        this._cloudData.TrialCloudDreamPassLessonMap = {};
        this._cloudData.ReceiveRewardMap = {};
    }

    clearTrailMiracleData() {
        if (this._miracalData) {
            this._miracalData.IsReceiveReward = false;
            this._miracalData.PassLessonMap = {};
        }
    }

    clearTrailHellData() {
        if (this._hellData) {
            this._hellData.UseHeroMap = {};
            this._hellData.PassLessonMap = {};
        }
    }

    // ----------------- 致师之礼 -----------------
    /** 致师之礼-缓存战斗结果 */
    challengeFinishData: CustomPveFinishResult = null;

    /**
     * 致师之礼-更新全部数据
     * @param respectData 新的数据
     */
    updateRespectData(respectData: data.ITrialRespectData) {
        this._respectData = respectData;
    }

    /**
     * 致师之礼-获取基础配置
     * @returns 基础配置
     */
    getChallengeBasicConfig(): cfg.PVEChallengeBasic {
        let curLevel: number = this.respectData.RefreshLv;

        let basicConfigs: {[key: number]: cfg.PVEChallengeBasic} = configManager.getConfigs("pveChallengeBasic");
        let targetBasicConfig: cfg.PVEChallengeBasic = null;
        let basicConfig: cfg.PVEChallengeBasic = null;
        for (let k in basicConfigs) {
            basicConfig = basicConfigs[k];
            if (curLevel <= basicConfig.PVEChallengeBasicPlayerLevel && 
                (targetBasicConfig == null || basicConfig.PVEChallengeBasicPlayerLevel < targetBasicConfig.PVEChallengeBasicPlayerLevel)) {

                targetBasicConfig = basicConfig;
            }
        }
        
        return targetBasicConfig;
    }

    /**
     * 致师之礼-根据怪物等级获取对应最大关卡数
     * @param monsterLevel 怪物等级
     * @returns 最大关卡数目
     */
    getChallengeMaxLevel(monsterLevel: number) {
        let maxChallengeLevel = 0;

        let monsterConfigs: {[key: number]: cfg.PVEChallengeMonster} = configManager.getConfigs("pveChallengeMonster");
        let monsterConfig: cfg.PVEChallengeMonster = null;
        for (let k in monsterConfigs) {
            monsterConfig = monsterConfigs[k];
            if (monsterConfig.PVEChallengeMonsterLevel === monsterLevel) {
                maxChallengeLevel += 1;
            }
        }

        return maxChallengeLevel;
    }

    /**
     * 致师之礼-根据阶段奖励库等级获取配置数组
     * @param rewardLevel 奖励等级
     * @returns 奖励配置数组
     */
    getChallengeRewardConfigs(rewardLevel: number) {
        let result: cfg.PVEChallengeReward[] = [];

        let rewardConfigs: {[key: number]: cfg.PVEChallengeReward} = configManager.getConfigs("pveChallengeReward");
        let rewardConfig: cfg.PVEChallengeReward = null;
        for (let k in rewardConfigs) {
            rewardConfig = rewardConfigs[k];
            if (rewardConfig.PVEChallengeRewardLevel === rewardLevel) {
                result.push(rewardConfig);
            }
        }

        result.sort((a, b) => {
            return a.PVEChallengeRewardNeed - b.PVEChallengeRewardNeed;
        });

        return result;
    }

    /**
     * 致师之礼-根据怪物库等级及当前进度获取怪物配置
     * @param monsterLevel 怪物等级
     * @param curLevel 当前关卡
     * @returns 怪物配置
     */
    getChallengeMonsterConfig(monsterLevel: number, curLevel: number) {
        let monsterConfig: cfg.PVEChallengeMonster = null;

        let monsterConfigs: {[key: number]: cfg.PVEChallengeMonster} = configManager.getConfigs("pveChallengeMonster");
        for (let k in monsterConfigs) {
            if (monsterConfigs[k].PVEChallengeMonsterLevel === monsterLevel
                && monsterConfigs[k].PVEChallengeMonsterRound === curLevel) {

                monsterConfig = monsterConfigs[k];
            }
        }
        return monsterConfig;
    }

    //零点重置
    onDayReset() {
        this.trialDevilData.data.FightNum = 0;
        this.trialDevilData.data.Heroes && (this.trialDevilData.data.Heroes.length = 0);
        this.trialDevilData.selfRank = -1;
        this._trialDevilData.data.TotalDamage = 0;
    }

    // 更新心魔法相数据
    updateTrialDevilData(fightNum: number, heros: data.ITrialRoleInfo[], damage: number, selfRank: number, prizes: data.IItemInfo[]) {
        this.trialDevilData.data = this.trialDevilData.data || {};
        !isNaN(fightNum) && (this.trialDevilData.data.FightNum = fightNum);
        heros && (this.trialDevilData.data.Heroes = heros);
        !isNaN(damage) && (this.trialDevilData.data.TotalDamage = damage);
        !isNaN(selfRank) && (this.trialDevilData.selfRank = selfRank);
        this.trialDevilData.prizes = prizes;
    }

    //清除心魔法相的奖励缓存数据
    clearTrialDevilCache() {
        this._trialDevilData.prizes = null;
        this._trialDevilData.roundDamage = 0;
    }

	// ----------------- 无间炼狱 -----------------
    purgatoryFiniData: CustomPveFinishResult = null;

    updatePurgatoryData(purgatoryData: data.ITrialPurgatoryData) {
        this._purgatoryData = purgatoryData;
    }

    /**
     * 获得当前所在层数
     */
    getPurgatoryCurStorey() {
        let infernalBasicConfigs: {[key: number]: cfg.PVEInfernalBasic} = configManager.getConfigs("pveInfernalBasic");
        let maxStorey: number = utils.getObjLength(infernalBasicConfigs);

        return this._purgatoryData.Progress + 1 > maxStorey ? maxStorey : this._purgatoryData.Progress + 1;
    }

    /**
     * 获得持有的英雄及状态(从背包中补全)
     */
    getPurgatoryHeroes() {
        let self = this;

        let heroIDS: number[] = [];
        bagData.heroList.forEach((item) => {
            let idx = self.purgatoryData.Heroes.findIndex((hero) => { return hero.ID === item.ID });
            if (idx === -1) {
                heroIDS.push(item.ID);
            }
        });

        heroIDS.forEach((heroID) => {
            self.purgatoryData.Heroes.push({
                ID: heroID, 
                HPPercent: 10000,
                Energy: 0
            });
        });
        
        return this.purgatoryData.Heroes;
    }

    /**
     * 更新英雄状态
     * @param heroes 新的英雄状态 
     */
    updatePurgatoryHeroes(heroes: data.ITrialRoleInfo[]) {
        this.getPurgatoryHeroes();

        let self = this;
        heroes.forEach((hero1) => {
            self.purgatoryData.Heroes.find((hero2) => {
                let isFind: boolean = false;
                if (hero1.ID === hero2.ID) {
                    isFind = true;

                    hero2.HPPercent = hero1.HPPercent;
                    hero2.Energy = hero1.Energy;
                }
                return isFind;
            });
        });
    }

    /**
     * 背包里的英雄数据根据 英雄血量数据刷新
     */
    getIslandHeroes() {
        let resultHeros:data.ITrialRoleInfo[] = [];
        bagData.heroList.forEach((item) => {
            let roleInfo: data.ITrialRoleInfo = {};
            roleInfo = { ID: item.ID, HPPercent: 10000, Energy: 0 };
            pveTrialData.islandData.Heroes.forEach(hero => {
                if (item.ID == hero.ID) {
                    roleInfo.HPPercent = hero.HPPercent;
                    roleInfo.Energy = hero.Energy;
                }
            })      
            resultHeros.push(roleInfo);
        });
        return resultHeros;
    }

    updateIslandData(islandData :data.ITrialIslandData) {
        this._islandData = islandData;
    }

    /**检测是否通关*/
    checkIsPassIslandAllLevel() :boolean{
        let points = this._islandData?.Points;
        if (!points || !points.length) return false;
        let endPoint = points[points.length - 1];
        return (endPoint.Status == data.TrialPointInfo.PointStatus.PSInvalid
                 && (this._islandData?.Progress == 2));
    }
}

let pveTrialData = new PveTrialData();
export { pveTrialData }
