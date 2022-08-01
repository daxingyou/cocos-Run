import { PVE_MODE } from "../../app/AppEnums";
import { PveConfig } from "../../app/AppType";
import { configManager } from "../../common/ConfigManager";
import { eventCenter } from "../../common/event/EventCenter";
import { battleEvent, cloudDreamEvent, dailyLessonEvent, dreamlandEvent, GuideEvents, islandEvent, lvMapViewEvent, magicDoorEvent, nineHellEvent, purgatoryEvent, pveTeamEvent, respectEvent, trialDevilEvent, yyBookEvent } from "../../common/event/EventData";
import { redDotMgr, RED_DOT_MODULE } from "../../common/RedDotManager";
import { data, gamesvr } from "../../network/lib/protocol";
import { operationSvr } from "../../network/OperationSvr";
import { pveData } from "../models/PveData";
import { pveTrialData } from "../models/PveTrialData";
import { userData } from "../models/UserData";
import { BaseOpt } from "./BaseOpt";
import { taskData, TASK_FINISH_TYPE } from "../models/TaskData";
import { utils } from "../../app/AppUtils";
import { configUtils } from "../../app/ConfigUtils";
import { CustomItemId } from "../../app/AppConst";
import { islandData } from "../models/IslandData";

class PveDataOpt extends BaseOpt {

    init() {
        this.addEventListener(gamesvr.CMD.ENTER_PVE_RES, this._receievePveRes);
        this.addEventListener(gamesvr.CMD.FINISH_PVE_RES, this._receievePveFinishRes);
        this.addEventListener(gamesvr.CMD.PRE_SET_TEAM_RES, this._recvSetTeamRes);
        this.addEventListener(gamesvr.CMD.CHAPTER_REWARD_RES, this._recvPveChapRewardRes);
        //极限试炼（九幽、云端、奇门遁甲）
        this.addEventListener(gamesvr.CMD.TRIAL_HELL_GET_PVE_RES, this._recvTrialHellRes);
        this.addEventListener(gamesvr.CMD.TRIAL_HELL_ENTER_PVE_RES, this._recvEnterHellRes);
        this.addEventListener(gamesvr.CMD.TRIAL_HELL_FINISH_PVE_RES, this._recvFinishHellRes);

        this.addEventListener(gamesvr.CMD.TRIAL_CLOUD_DREAM_GET_PVE_RES, this._recvTrialCloudRes);
        this.addEventListener(gamesvr.CMD.TRIAL_CLOUD_DREAM_ENTER_PVE_RES, this._recvEnterCloudRes);
        this.addEventListener(gamesvr.CMD.TRIAL_CLOUD_DREAM_FINISH_PVE_RES, this._recvFinishCloudRes);
        this.addEventListener(gamesvr.CMD.TRIAL_CLOUD_DREAM_RECEIVE_REWARD_RES, this._recvTrialCloudRewardRes);

        this.addEventListener(gamesvr.CMD.TRIAL_MIRACLE_DOOR_GET_PVE_RES, this._recvTrialMiracalRes);
        this.addEventListener(gamesvr.CMD.TRIAL_MIRACLE_DOOR_ENTER_PVE_RES, this._recvEnterMiracalRes);
        this.addEventListener(gamesvr.CMD.TRIAL_MIRACLE_DOOR_FINISH_PVE_RES, this._recvFinishMiracalRes);
        this.addEventListener(gamesvr.CMD.TRIAL_MIRACLE_DOOR_RECEIVE_REWARD_RES, this._recvTrialMiracalRewardRes);

        this.addEventListener(gamesvr.CMD.PVE_MAIN_RECEIVE_CHAPTER_REWARD_RES, this._recvChapterStageRewards);
        this.addEventListener(gamesvr.CMD.PVE_MAIN_RECEIVE_SECTION_REWARD_RES, this._recvLessonStageRewards);

        this.addEventListener(gamesvr.CMD.SWEEP_PVE_RES, this._recvMopUpLesson);

        // 极限试炼 - 致师之礼
        this.addEventListener(gamesvr.CMD.TRIAL_RESPECT_START_RES, this._recvTrialRespectStartRes);
        this.addEventListener(gamesvr.CMD.TRIAL_RESPECT_ENTER_PVE_RES, this._recvTrialRespectEnterPveRes);
        this.addEventListener(gamesvr.CMD.TRIAL_RESPECT_REWARD_RES, this._recvTrialRespectRewardRes);
        this.addEventListener(gamesvr.CMD.TRIAL_RESPECT_REWARD_ALL_RES, this._recvTrialRespectRewardAllRes);
        this.addEventListener(gamesvr.CMD.TRIAL_RESPECT_CHANGE_ENEMY_RES, this._recvTrialRespectChangeEnemyRes);
        this.addEventListener(gamesvr.CMD.TRIAL_RESPECT_PURCHASE_RES, this._recvTrialRespectPurchaseRes);

        //蓬莱仙岛
        this.addEventListener(gamesvr.CMD.TRIAL_ISLAND_ENTER_PVE_RES, this._recvTrialIslandBattleRes);
        this.addEventListener(gamesvr.CMD.TRIAL_ISLAND_RELIVE_RES, this._recvReliveRes); 
        this.addEventListener(gamesvr.CMD.TRIAL_ISLAND_LIVE_ALTAR_RES, this._recvPortalRes);
        this.addEventListener(gamesvr.CMD.TRIAL_ISLAND_HP_ALTAR_RES, this._recvHpAltarRes); 
        this.addEventListener(gamesvr.CMD.TRIAL_ISLAND_SELECT_BUFF_RES, this._recvSelectBuffRes);
        this.addEventListener(gamesvr.CMD.TRIAL_ISLAND_TRANSGATE_RES, this._recvTransGateRes);

        // 心魔法相
        this.addEventListener(gamesvr.CMD.RANK_TRIAL_DEVIL_DAMAGE_GET_LIST_RES, this._recvTrialDevilRankListRes);
        this.addEventListener(gamesvr.CMD.TRIAL_DEVIL_ENTER_PVE_RES, this._recvTrialDevilEnterPveRes);
		// 极限试炼 - 无间炼狱
        this.addEventListener(gamesvr.CMD.TRIAL_PURGATORY_RELIVE_RES, this._recvTrialPurgatoryReliveRes);
        this.addEventListener(gamesvr.CMD.TRIAL_PURGATORY_UNMASK_RES, this._recvTrialPurgatoryUnmaskRes);
        this.addEventListener(gamesvr.CMD.TRIAL_PURGATORY_PURCHASE_RES, this._recvTrialPurgatoryPurchaseRes);
        this.addEventListener(gamesvr.CMD.TRIAL_PURGATORY_HP_ALTAR_RES, this._recvTrialPurgatoryHpAltarRes);
        this.addEventListener(gamesvr.CMD.TRIAL_PURGATORY_LIVE_ALTAR_RES, this._recvTrialPurgatoryLiveAltarRes);
        this.addEventListener(gamesvr.CMD.TRIAL_PURGATORY_ENTER_PVE_RES, this._recvTrialPurgatoryEnterPveRes);
        this.addEventListener(gamesvr.CMD.TRIAL_PURGATORY_TRANSGATE_RES, this._recvTrialPurgatoryTransgateRes);
        // 极限试炼 - 阴阳宝鉴
        this.addEventListener(gamesvr.CMD.TRIAL_LIGHT_DARK_ACTIVATE_HEXAGRAM_RES, this._recvTrialLightDarkActivateHexagramRes);
        this.addEventListener(gamesvr.CMD.TRIAL_LIGHT_DARK_ENTER_RES, this._recvTrialLightDarkEnterRes);
        this.addEventListener(gamesvr.CMD.TRIAL_LIGHT_DARK_FINISH_RES, this._recvTrialLightDarkFinishRes);
    }

    deInit() {
    }


    private _recvSetTeamRes(recvMsg: { Result: number, Desc: string, Msg: gamesvr.PreSetTeamRes }) {
        if (!this._checkResValid(recvMsg)) {
            return;
        }
        let msg = recvMsg.Msg;
        pveData.updateTeamByIndex(msg.TeamInfo, msg.TeamInfo.Index);
        if (msg.TeamInfo) {
            eventCenter.fire(pveTeamEvent.SAVE_TEAM, msg.TeamInfo.Index);
        }
    }

    private _receievePveRes(recvMsg: { Result: number, Desc: string, Msg: gamesvr.EnterPveRes }) {
        if (!this._checkResValid(recvMsg)) {
            eventCenter.fire(battleEvent.ENTER_PVE_FAIL, recvMsg.Desc);
        } else {
            let msg = recvMsg.Msg;
            if (msg.LessonID) {
                let cfg1 = configManager.getConfigByKey("dreamlandLesson", msg.LessonID);
                let cfg2 = configManager.getConfigByKey("lesson", msg.LessonID);
                let cfg3 = configManager.getConfigByKey("pveDailyLesson", msg.LessonID);
                let cfg4 = configManager.getConfigByKey("pveRiseRoad", msg.LessonID);
                if (cfg1) {
                    eventCenter.fire(dreamlandEvent.ENTER_PVE_RES, msg);
                } else if (cfg2) {
                    eventCenter.fire(lvMapViewEvent.ENTER_PVE_RES, msg);
                } else if (cfg3 ) {
                    eventCenter.fire(dailyLessonEvent.ENTER_PVE_DAILY_RES, msg);
                } else if (cfg4) {
                    eventCenter.fire(dailyLessonEvent.ENTER_PVE_RISEROAD_RES, msg);
                }
            }
        }
    }

    private _receievePveFinishRes(recvMsg: { Result: number, Desc: string, Msg: gamesvr.FinishPveRes }) {
        if (!this._checkResValid(recvMsg)) {
            eventCenter.fire(battleEvent.FINISH_PVE_RES_FAIL, recvMsg.Desc);
            return
        }
        let msg = recvMsg.Msg;

        if (msg.LessonID) {
            let pveMode = pveData.getLessonMode(msg.LessonID);
            // 更新数据
            if (msg.Past) {
                taskData.setTargetTypeDirty(TASK_FINISH_TYPE.MAP_LEVEL)
                pveData.updatePveRecord(msg.LessonID, msg.Record);
            }
            if (msg.DreamCount) pveData.updateDreamCount(msg.DreamCount);

            msg.Past && eventCenter.fire(GuideEvents.UPDATE_GUIDE_CFGS, 'passLv');
            if (pveMode == PVE_MODE.DREAM_LESSON) {
                eventCenter.fire(dreamlandEvent.FINISH_PVE_RES, msg);
            } else if (pveMode == PVE_MODE.ADVENTURE_LESSON) {
                eventCenter.fire(lvMapViewEvent.FINISH_PVE_RES, msg);
            } else if (pveMode == PVE_MODE.DAILY_LESSON) {
                eventCenter.fire(dailyLessonEvent.FINISH_PVE_DAILY_RES, msg);
            } else if (pveMode == PVE_MODE.RISE_ROAD) {
                eventCenter.fire(dailyLessonEvent.FINISH_PVE_RISEROAD_RES, msg);
            }
        }
    }

    private _recvPveChapRewardRes(recvMsg: { Result: number, Desc: string, Msg: gamesvr.ChapterRewardRes }) {
        if (!this._checkResValid(recvMsg)) {
            return;
        }
        let msg = recvMsg.Msg;
        if (msg.ChapterID) {
            pveData.setChapRewardToken(msg.ChapterID);
            eventCenter.fire(dreamlandEvent.CHAP_REWARD_TOKEN, msg);
        }
    }

    // 九幽森罗
    private _recvTrialHellRes(recvMsg: { Result: number, Desc: string, Msg: gamesvr.TrialHellGetPveRes }){
        if (!this._checkResValid(recvMsg)) {
            return;
        }
        let msg = recvMsg.Msg;
        if (msg.TrialHellUnit){
            pveTrialData.updateHellInfo(msg.TrialHellUnit);
            eventCenter.fire(nineHellEvent.SYNC_HELL_INFO, msg);
        }
    }

    private _recvEnterHellRes(recvMsg: { Result: number, Desc: string, Msg: gamesvr.TrialHellEnterPveRes }){
        if (!this._checkResValid(recvMsg)) {
            return;
        }
        let msg = recvMsg.Msg;
        let pveMode = pveData.pveConfig ? pveData.pveConfig.pveMode : null;
        if (msg && pveMode == PVE_MODE.NINE_HELL){
            eventCenter.fire(nineHellEvent.ENTER_PVE_RES, msg);
        }
    }

    private _recvFinishHellRes(recvMsg: { Result: number, Desc: string, Msg: gamesvr.TrialHellFinishPveRes }) {
        if (!this._checkResValid(recvMsg)) {
            return;
        }
        let msg = recvMsg.Msg;
        let pveMode = pveData.pveConfig ? pveData.pveConfig.pveMode : null;
        if (msg && pveMode == PVE_MODE.NINE_HELL) {
            pveTrialData.updatePveTrialRecord(msg.LessonID, msg.Past, msg.Heroes);
            eventCenter.fire(nineHellEvent.FINISH_PVE_RES, msg);
        }
    }
    
    // 云端梦境
    private _recvTrialCloudRes(recvMsg: { Result: number, Desc: string, Msg: gamesvr.TrialCloudDreamGetPveRes }) {
        if (!this._checkResValid(recvMsg)) {
            return;
        }
        let msg = recvMsg.Msg;
        if (msg.TrialCloudDreamUnit) {
            pveTrialData.updateCloudInfo(msg.TrialCloudDreamUnit);
            eventCenter.fire(cloudDreamEvent.SYNC_CLOUD_INFO, msg);
        }
    }

    private _recvEnterCloudRes(recvMsg: { Result: number, Desc: string, Msg: gamesvr.TrialHellEnterPveRes }) {
        if (!this._checkResValid(recvMsg)) {
            return;
        }
        let msg = recvMsg.Msg;
        let pveMode = pveData.pveConfig ? pveData.pveConfig.pveMode : null;
        if (msg && pveMode == PVE_MODE.CLOUD_DREAM) {
            eventCenter.fire(cloudDreamEvent.ENTER_PVE_RES, msg);
        }
    }

    private _recvFinishCloudRes(recvMsg: { Result: number, Desc: string, Msg: gamesvr.TrialCloudDreamFinishPveRes }) {
        if (!this._checkResValid(recvMsg)) {
            return;
        }
        let msg = recvMsg.Msg;
        let pveMode = pveData.pveConfig ? pveData.pveConfig.pveMode : null;
        if (msg && pveMode == PVE_MODE.CLOUD_DREAM) {
            pveTrialData.updatePveTrialRecord(msg.LessonID, msg.Past, msg.Heroes);
            eventCenter.fire(cloudDreamEvent.FINISH_PVE_RES, msg);
        }
    }

    private _recvTrialCloudRewardRes(recvMsg: { Result: number, Desc: string, Msg: gamesvr.TrialCloudDreamReceiveRewardRes }) {
        if (!this._checkResValid(recvMsg)) {
            return;
        }
        let msg = recvMsg.Msg;
        let pveMode = pveData.pveConfig ? pveData.pveConfig.pveMode : null;
        if (msg) {
            pveTrialData.updatePveTrialCloudReward();
            eventCenter.fire(cloudDreamEvent.TAKE_REWARD_RES, msg);
        }
    }

    // 奇门遁甲
    private _recvTrialMiracalRes(recvMsg: { Result: number, Desc: string, Msg: gamesvr.TrialMiracleDoorGetPveRes }) {
        if (!this._checkResValid(recvMsg)) {
            return;
        }
        let msg = recvMsg.Msg;
        if (msg.TrialMiracleDoorUnit) {
            pveTrialData.updateMiracalInfo(msg.TrialMiracleDoorUnit);
            eventCenter.fire(magicDoorEvent.SYNC_MAGIC_INFO, msg);
        }
        // 为了防止 如果返回的慢了 需要更新下主界面的试炼红点
        redDotMgr.fire(RED_DOT_MODULE.MAIN_PVE);
    }

    private _recvEnterMiracalRes(recvMsg: { Result: number, Desc: string, Msg: gamesvr.TrialMiracleDoorEnterPveRes }) {
        if (!this._checkResValid(recvMsg)) {
            return;
        }
        let msg = recvMsg.Msg;
        let pveMode = pveData.pveConfig ? pveData.pveConfig.pveMode : null;
        if (msg && pveMode == PVE_MODE.MAGIC_DOOR) {
            eventCenter.fire(magicDoorEvent.ENTER_PVE_RES, msg);
        }
    }

    private _recvFinishMiracalRes(recvMsg: { Result: number, Desc: string, Msg: gamesvr.TrialMiracleDoorFinishPveRes}) {
        if (!this._checkResValid(recvMsg)) {
            return;
        }
        let msg = recvMsg.Msg;
        let pveMode = pveData.pveConfig ? pveData.pveConfig.pveMode : null;
        if (msg && pveMode == PVE_MODE.MAGIC_DOOR) {
            pveTrialData.updatePveTrialRecord(msg.LessonID, msg.Past);
            eventCenter.fire(magicDoorEvent.FINISH_PVE_RES, msg);
        }
    }

    private _recvTrialMiracalRewardRes(recvMsg: { Result: number, Desc: string, Msg: gamesvr.TrialMiracleDoorReceiveRewardRes }) {
        if (!this._checkResValid(recvMsg)) {
            return;
        }
        let msg = recvMsg.Msg;
        if (msg) {
            pveTrialData.updatePveTrialMiracalReward();
            eventCenter.fire(magicDoorEvent.TAKE_REWARD_RES, msg);
        }
    }

    private _recvLessonStageRewards(recvMsg: { Result: number, Desc: string, Msg: gamesvr.PveMainReceiveSectionRewardRes }) {
        if (!this._checkResValid(recvMsg)) {
            return;
        }
        let msg = recvMsg.Msg;
        if (msg) {
            pveData.lessonStageRewards[msg.LessonID] = true;
            eventCenter.fire(lvMapViewEvent.LESSON_STAGE_REWARD_RES, msg.Prizes, msg.LessonID);
        }
    }

    private _recvChapterStageRewards(recvMsg: { Result: number, Desc: string, Msg: gamesvr.PveMainReceiveChapterRewardRes }) {
        if (!this._checkResValid(recvMsg)) {
            return;
        }
        let msg = recvMsg.Msg;
        if (msg) {
            pveData.chapterStageRewards[msg.ChapterID] = true;
            eventCenter.fire(lvMapViewEvent.CHAPTER_STAGE_REWARD_RES, msg.Prizes);
        }
    }

    reqEnterPve(lessonId: number, double:boolean = false, heroes: number[] = [], step: number = 0, heroUsed: number[] = []) {

        let banHero: { [k: string]: boolean } = {};
        heroUsed.forEach( _v =>{ banHero[_v.toString()] = true;})

        let req: gamesvr.EnterPveReq = gamesvr.EnterPveReq.create({
            LessonID: lessonId,
            DoubleDrop: double,
            Heroes: heroes,
            TypeMainMonsterGroupIndex: step,
            TypeMainUseHeroMap: banHero
        })
        operationSvr.send(req);
    }

    reqFinishPve(lessonId: number, pass: boolean, heros: Array<number>, goldCount?: number) {
        if (!lessonId) return;
        
        let req: gamesvr.FinishPveReq = gamesvr.FinishPveReq.create({
            LessonID: lessonId,
            Past: pass,
            PveReport: {
                Heroes: heros || null,
                GainGold: goldCount
            }
        })
        let pveCfg = pveData.pveConfig;
        if(pveCfg && pveCfg.lessonId==lessonId)
            req.DoubleDrop = pveCfg.doubleDrop;
            
        operationSvr.send(req);
    }

    reqSetTeam(teamInfo: data.ITeamInfo) {
        let req = gamesvr.PreSetTeamReq.create({
            TeamInfo: teamInfo
        });
        operationSvr.send(req);
    }


    //主动请求同步活动配置
    reqGetTrialHellInfo(){
        let req = gamesvr.TrialHellGetPveReq.create({
        })
        operationSvr.send(req);
    }

    reqEnterPveHell(lessonId: number, heros: Array<number>) {
        if (!lessonId) return;
        let req = gamesvr.TrialHellEnterPveReq.create({
            LessonID: lessonId,
            Heroes: heros
        })
        operationSvr.send(req);
    }

    reqFinishPveHell(lessonId: number, pass: boolean, heros: Array<number>) {
        if (!lessonId) return;
        let req = gamesvr.TrialHellFinishPveReq.create({
            LessonID: lessonId,
            Past: pass,
            Heroes: heros
        })
        operationSvr.send(req);
    }
    //主动请求同步活动配置
    reqGetTrialCloudInfo() {
        let req = gamesvr.TrialCloudDreamGetPveReq.create({
        })
        operationSvr.send(req);
    }

    reqEnterPveCloud(lessonId: number, heros: Array<number>) {
        if (!lessonId) return;
        let req = gamesvr.TrialCloudDreamEnterPveReq.create({
            LessonID: lessonId,
            Heroes: heros
        })
        operationSvr.send(req);
    }

    reqFinishPveCloud(lessonId: number, pass: boolean, heros: number[]) {
        if (!lessonId) return;
        let req = gamesvr.TrialCloudDreamFinishPveReq.create({
            LessonID: lessonId,
            Past: pass,
            Heroes: heros,
        })
        operationSvr.send(req);
    }

    reqTakeCloudReward(chapID: number) {
        if (!chapID) return;
        let req = gamesvr.TrialCloudDreamReceiveRewardReq.create({
            ChapterID: chapID,
        })
        operationSvr.send(req);
    }

    //主动请求同步活动配置
    reqGetTrialMiracalInfo() {
        let req = gamesvr.TrialMiracleDoorGetPveReq.create({
        })
        operationSvr.send(req);
    }

    reqEnterPveMiracal(lessonId: number, heros: Array<number>) {
        if (!lessonId) return;
        let req: gamesvr.TrialMiracleDoorEnterPveReq = gamesvr.TrialMiracleDoorEnterPveReq.create({
            LessonID: lessonId,
            ChooseIDList: heros,
        })
        operationSvr.send(req);
    }

    reqFinishPveMiracal(lessonId: number, pass: boolean) {
        if (!lessonId) return;
        let req: gamesvr.TrialMiracleDoorFinishPveReq = gamesvr.TrialMiracleDoorFinishPveReq.create({
            LessonID: lessonId,
            Past: pass,
        })
        operationSvr.send(req);
    }

    reqTakeMiracalReward() {
        if (!pveTrialData.miracalInfo) return;
        let req: gamesvr.TrialMiracleDoorReceiveRewardReq = gamesvr.TrialMiracleDoorReceiveRewardReq.create({
            PeriodID: pveTrialData.miracalInfo.CurrentPeriod,
        })
        operationSvr.send(req);
    }
    //领取太虚幻境章节奖励
    reqTakeDreamChapReward(chapID: number) {
        let req = gamesvr.ChapterRewardReq.create({
            ChapterID: chapID
        });
        operationSvr.send(req);
    }

    reqLessonStageRewards(lessonId: number) {
        let req = gamesvr.PveMainReceiveSectionRewardReq.create({
            LessonID: lessonId
        });
        operationSvr.send(req);
    }

    reqChapterStageRewards(chapterId: number) {
        let req = gamesvr.PveMainReceiveChapterRewardReq.create({
            ChapterID: chapterId
        });
        operationSvr.send(req);
    }

    // 打完一场战斗之后自动进入下一场，
    updateAdverturePveData (usedHeroes: number[]) {
        let heroUsed = pveData.pveConfig.banHeroList.concat(usedHeroes);

        let currPass = pveData.pveConfig.passStep.concat(pveData.pveConfig.step);
        let cfg = configUtils.getLessonConfig(pveData.pveConfig.lessonId);
        let nextStep = 0;
        if (cfg && cfg.LessonMonsterGroupId) {
            let len = cfg.LessonMonsterGroupId.split(";").length;
            for (let i = 0; i < len; i++) {
                if (currPass.indexOf(i) == -1) {
                    nextStep = i;
                    break;
                }
            }
        }
        let newPveCfg: PveConfig = {
            lessonId: pveData.pveConfig.lessonId,
            pveMode: PVE_MODE.ADVENTURE_LESSON,
            userLv: userData.lv,
            step: nextStep,
            passStep: currPass,
            useDefaultSquad: false,
            adventureCfg: pveData.pveConfig.adventureCfg,
            banHeroList: heroUsed
        }
        pveData.pveConfig = newPveCfg
    }

    //扫荡
    reqMopUpLesson(lessionId:number, doubleDrap: boolean = false, count: number = 1) {
        if(!lessionId) return;

        let req: gamesvr.SweepPveReq = gamesvr.SweepPveReq.create({
            LessonID: lessionId,
            DoubleDrop: doubleDrap,
            Count: count,
        });

        operationSvr.send(req);
    }
    
    private _recvMopUpLesson(recvMsg: { Result: number, Desc: string, Msg: gamesvr.SweepPveRes }) {
        if (!this._checkResValid(recvMsg)) {
            return;
        }

        let msg = recvMsg.Msg;
        let prizes = msg.Prizes;

        //按照ID归并,可合并的道具合并，不可合并的道具采用数组存储对应的数量
        let idMap = new Map<number, number>();
        let itemList: data.IItemInfo[] = [];

        let exp = msg.Exp;
        if (exp) {
            let expItem = prizes.find(ele => { return ele.ID == CustomItemId.EXP});
            if (expItem) {
                expItem.Count = utils.longToNumber(expItem.Count) + exp;
            } else {
                prizes.unshift({ ID: CustomItemId.EXP, Count: exp });
            }
        }

        prizes.forEach(item => {
            let oldV = idMap.has(item.ID) ? (idMap.get(item.ID) as number): 0;
            idMap.set(item.ID, oldV + utils.longToNumber(item.Count));
        });

        idMap.forEach((v, k) => {
            if(v <= 0) return;
            let equipCfg = configUtils.getEquipConfig(k);
            if(equipCfg){
                itemList.push(...(new Array(v).fill({ID: k, Count: 1})));
                return;
            }
            itemList.push({ID: k, Count: v});
        });

        eventCenter.fire(dailyLessonEvent.SWEET_PVE_RES, itemList);
    }

    // ----------------- 致师之礼 -----------------
    /**
     * 致师之礼-更新全部数据
     * @param respectData 新的数据
     */
     updateRespectData(respectData: data.ITrialRespectData) {
        pveTrialData.updateRespectData(respectData);
        eventCenter.fire(respectEvent.REFRESH_VIEW);
    }

    /**
     * 确认英雄开始挑战
     * @param heroIDs 英雄ID数组
     */
    reqTrialRespectStart(heroIDs: number[]) {
        let req = gamesvr.TrialRespectStartReq.create({
            Heroes: heroIDs
        });

        operationSvr.send(req);
    }

    private _recvTrialRespectStartRes(recvMsg: { Result: number, Desc: string, Msg: gamesvr.TrialRespectStartRes }) {
        if (!this._checkResValid(recvMsg)) {
            return;
        }

        this.updateRespectData(recvMsg.Msg.TrialRespectData);
        eventCenter.fire(respectEvent.START_SUCCESS);
    }

    /**
     * 选好英雄进入战斗
     * @param monsterID 怪物ID
     * @param heroID 英雄ID
     */
    reqEnterPveRespect(monsterID: number, heroID: number) {
        let req = gamesvr.TrialRespectEnterPveReq.create({
            MonsterID: monsterID,
            HeroID: heroID
        });

        operationSvr.send(req);
    }
    private _recvTrialRespectEnterPveRes(recvMsg: { Result: number, Desc: string, Msg: gamesvr.TrialRespectEnterPveRes }) {
        if (!this._checkResValid(recvMsg)) {
            return;
        }

        let msg = recvMsg.Msg;

        pveTrialData.respectData.Progress = msg.Progress;
        pveTrialData.respectData.Heroes = msg.Heroes;
        pveTrialData.respectData.Monsters = msg.Monsters;

        // 修改玩家和敌人站位
        msg.EnterBattleResult.Teams.forEach((team) => {
            team.Roles[0].Pos = 2;
        });

        // 缓存战斗结果用于展示
        pveTrialData.challengeFinishData = {
            LessonID: "Challenge",
            Past: msg.Pass,
            Prizes: msg.Prizes
        }

        if (msg && pveData.pveConfig.pveMode === PVE_MODE.RESPECT) {
            eventCenter.fire(respectEvent.ENTER_PVE_RES, msg);
        }
    }

    /**
     * 领取奖励
     * @param rewardID 奖励ID
     */
    reqTrialRespectReward(rewardID: number) {
        let req = gamesvr.TrialRespectRewardReq.create({
            RewardID: rewardID
        });

        operationSvr.send(req);
    }

    private _recvTrialRespectRewardRes(recvMsg: { Result: number, Desc: string, Msg: gamesvr.TrialRespectRewardRes }) {
        if (!this._checkResValid(recvMsg)) {
            return;
        }

        let msg = recvMsg.Msg;
        // 返回的是领取记录，所以需要通过差异计算得到的奖励ID
        let awardIDs: number[] = msg.RewardRecords.filter((record) => {
            return pveTrialData.respectData.RewardRecords.indexOf(record) === -1;
        });

        pveTrialData.respectData.RewardRecords = msg.RewardRecords;
        eventCenter.fire(respectEvent.REFRESH_VIEW);
        redDotMgr.fire(RED_DOT_MODULE.CHALLENGE_STAGE_AWARD);
        eventCenter.fire(respectEvent.RECEIVE_AWARD, awardIDs);
    }

    /** 一键领取奖励 */
    reqTrialRespectRewardAll() {
        let req = gamesvr.TrialRespectRewardAllReq.create({});

        operationSvr.send(req);
    }

    private _recvTrialRespectRewardAllRes(recvMsg: { Result: number, Desc: string, Msg: gamesvr.TrialRespectRewardAllRes }) {
        if (!this._checkResValid(recvMsg)) {
            return;
        }

        let msg = recvMsg.Msg;
        // 返回的是领取记录，所以需要通过差异计算得到的奖励ID
        let awardIDs: number[] = msg.RewardRecords.filter((record) => {
            return pveTrialData.respectData.RewardRecords.indexOf(record) === -1;
        });

        pveTrialData.respectData.RewardRecords = msg.RewardRecords;
        eventCenter.fire(respectEvent.REFRESH_VIEW);
        redDotMgr.fire(RED_DOT_MODULE.CHALLENGE_STAGE_AWARD);
        eventCenter.fire(respectEvent.RECEIVE_AWARD, awardIDs);
    }

    /** 更换对手 */
    reqTrialRespectChangeEnemy() {
        let req = gamesvr.TrialRespectChangeEnemyReq.create({});

        operationSvr.send(req);
    }

    private _recvTrialRespectChangeEnemyRes(recvMsg: { Result: number, Desc: string, Msg: gamesvr.TrialRespectChangeEnemyRes }) {
        if (!this._checkResValid(recvMsg)) {
            return;
        }

        pveTrialData.respectData.Monsters = recvMsg.Msg.Monsters;
        eventCenter.fire(respectEvent.REFRESH_VIEW);
    }

    /** 购买商品 */
    reqTrialRespectPurchase(shopID: number) {
        let req = gamesvr.TrialRespectPurchaseReq.create({
            ShopID: shopID
        });

        operationSvr.send(req);
    }

    private _recvTrialRespectPurchaseRes(recvMsg: { Result: number, Desc: string, Msg: gamesvr.TrialRespectPurchaseRes }) {
        if (!this._checkResValid(recvMsg)) {
            return;
        }

        // 返回的是完整的商品状态，所以要通过差异比较得到购买的商品
        let msg = recvMsg.Msg;
        let shopID: number = null;
        pveTrialData.respectData.Items.find((item) => {
            if (item.Bought) {
                return false;
            }
            let backItem = msg.Items.find((value) => { return value.ShopID === item.ShopID; });
            if (backItem.Bought) {
                shopID = item.ShopID;
            }

            return backItem.Bought;
        });

        pveTrialData.respectData.Items = recvMsg.Msg.Items;

        if (shopID) {
            eventCenter.fire(respectEvent.REFRESH_VIEW);
            eventCenter.fire(respectEvent.BUY_SHOP_SUCCESS, shopID);
        }
    }

    /**▼▼▼▼▼▼▼▼▼▼▼ 蓬莱仙岛 ▼▼▼▼▼▼▼▼▼▼▼*/

    /**蓬莱仙岛战斗请求 */
    reqTrialIslandBattle(pointUID:number,heros:number[]) {
        let req = gamesvr.TrialIslandEnterPveReq.create({
            PointUID: pointUID,
            Heroes:heros
        });
        operationSvr.send(req);
    }

    private _recvTrialIslandBattleRes(recvMsg: { Result: number, Desc: string, Msg: gamesvr.TrialIslandEnterPveRes }) {
        if (!this._checkResValid(recvMsg)) {
            //进入战斗失败
            eventCenter.fire(battleEvent.ENTER_PVE_FAIL, recvMsg.Desc);
            return;
        }
        let msg = recvMsg.Msg;
        pveTrialData.islandData.Heroes = msg.Heroes;
        let index = pveTrialData.islandData.Points.findIndex((point) => {
            return (point.PointUID == msg.Point.PointUID);
        })
        if (index >= 0) { 
            islandData.setPointMap(msg.Point);
            pveTrialData.islandData.Points[index] = msg.Point;
        }
        else pveTrialData.islandData.Points.push(msg.Point);

        pveTrialData.IslandFinishData = {
            LessonID: "Island",
            Past: msg.Pass,
            Prizes: msg.Prizes
        }   
    
        eventCenter.fire(islandEvent.RECEIVE_BATTLE_RES, msg);        
    }

    /**复活请求*/
    reqRelive() {
        let req = gamesvr.TrialIslandReliveReq.create({});
        operationSvr.send(req);
    }

    private _recvReliveRes(recvMsg: { Result: number, Desc: string, Msg: gamesvr.TrialIslandReliveRes }) {
        if (!this._checkResValid(recvMsg)) {
            return;
        }

        let msg = recvMsg.Msg;
        pveTrialData.islandData.Heroes = msg.Heroes;
        pveTrialData.islandData.FreeReliveCount = msg.FreeReliveCount;
        pveTrialData.islandData.FreeReliveTime = msg.FreeReliveTime;
        eventCenter.fire(islandEvent.RECEIVE_RELIVE_RES,msg);
    }

    
    /**祭坛请求*/
    reqPortal(uid:number) {
        let req = gamesvr.TrialIslandLiveAltarReq.create({
            PointUID: uid
        });
        operationSvr.send(req);
    }

    private _recvPortalRes(recvMsg: { Result: number, Desc: string, Msg: gamesvr.TrialIslandLiveAltarRes }) {
        if (!this._checkResValid(recvMsg)) {
            return;
        }

        let msg = recvMsg.Msg;
        let i = pveTrialData.islandData.Heroes.indexOf(msg.Hero);
        if (i < 0) pveTrialData.islandData.Heroes.push(msg.Hero);
        else pveTrialData.islandData.Heroes[i] = msg.Hero
    
        //根据  pointUid 查找点状态-修改点状态
        let index = pveTrialData.islandData.Points.findIndex((point) => {
            return (point.PointUID == msg.PointUID);
        })
        if (index >= 0) { 
            pveTrialData.islandData.Points[index].Status = data.TrialPointInfo.PointStatus.PSInvalid;
            islandData.setPointMap(pveTrialData.islandData.Points[index]);
            eventCenter.fire(islandEvent.RECEIVE_POTAL_RES,msg.PointUID);
        }

        // eventCenter.fire(islandEvent.RECEIVE_RELIVE_RES);
    }

    reqHpAltar(uid:number) {
        let req = gamesvr.TrialIslandHpAltarReq.create({
            PointUID: uid
        });
        operationSvr.send(req);
    }

    private _recvHpAltarRes(recvMsg: { Result: number, Desc: string, Msg: gamesvr.TrialIslandHpAltarRes }) {
        if (!this._checkResValid(recvMsg)) {
            return;
        }

        let msg = recvMsg.Msg;
        pveTrialData.islandData.Heroes = msg.Heroes;
        
        //根据  pointUid 查找点状态-修改点状态
        let index = pveTrialData.islandData.Points.findIndex((point) => {
            return (point.PointUID == msg.PointUID);
        })
        if (index >= 0) { 
            pveTrialData.islandData.Points[index].Status = data.TrialPointInfo.PointStatus.PSInvalid;
            islandData.setPointMap(pveTrialData.islandData.Points[index]);
            eventCenter.fire(islandEvent.RECEIVE_ADD_HP_RES,msg.PointUID);
        }
    }

    reqSelectBuff(buffId:number) {
        let req = gamesvr.TrialIslandSelectBuffReq.create({
            BuffID:buffId
        });
        operationSvr.send(req);
    }

    private _recvSelectBuffRes(recvMsg: { Result: number, Desc: string, Msg: gamesvr.TrialIslandSelectBuffRes }) {
        if (!this._checkResValid(recvMsg)) {
            return;
        }
        pveTrialData.islandData.BuffList.push(recvMsg.Msg.BuffID);
        eventCenter.fire(islandEvent.RECEIVE_BUFF_RES);
    }

    reqTransGate(uid:number) {
        let req = gamesvr.TrialIslandTransgateReq.create({
            PointUID: uid
        })
        operationSvr.send(req);
    }

    private _recvTransGateRes(recvMsg: { Result: number, Desc: string, Msg: gamesvr.TrialIslandTransgateRes}) {
        if (!this._checkResValid(recvMsg)) {
            return;
        }
        let msg = recvMsg.Msg;
        pveTrialData.islandData.Points = msg.Points;
        pveTrialData.islandData.Progress = msg.Progress;
        islandData.setCurPointIndex(null);
        eventCenter.fire(islandEvent.RECEIVE_TRANS_GATE_RES,msg);
    }

    updateIslandData(islandData:data.ITrialIslandData) {
        pveTrialData.updateIslandData(islandData);
        eventCenter.fire(islandEvent.RECEIVE_TRANS_GATE_RES);
    }

/** ▲ ▲ ▲ ▲ ▲ ▲ ▲ ▲ ▲ ▲ ▲ ▲ ▲ 蓬莱仙岛 ---- end▲ ▲ ▲ ▲ ▲ ▲ ▲ ▲ ▲ ▲ ▲ ▲ ▲ */


    // 心魔法相排行榜
    reqGetTrialDevilRankList(isSelf: boolean = false) {
        let req = gamesvr.RankTrialDevilDamageGetListReq.create({
            SelfRankFlag: isSelf
        });
        operationSvr.send(req);
    }

    // 心魔法相排行榜
    private _recvTrialDevilRankListRes(recvMsg: { Result: number, Desc: string, Msg: gamesvr.IRankTrialDevilDamageGetListRes }) {
        if (!this._checkResValid(recvMsg)) {
            return;
        }

        let msg = recvMsg.Msg;
        msg.hasOwnProperty('RankIndex') && (pveTrialData.trialDevilData.selfRank = msg.RankIndex);
        // 不是专门取自己的排名时， 不会返回自己的排名，因此从列表中查找
        if(!msg.SelfRankFlag && msg.TrialDevilDamageList && msg.TrialDevilDamageList.length > 0) {
            pveTrialData.trialDevilData.selfRank = msg.TrialDevilDamageList.findIndex(ele => {return ele.User.UserID == userData.accountData.UserID});
        }
        eventCenter.fire(trialDevilEvent.RECV_RANK_LIST, msg.SelfRankFlag, msg.RankIndex, msg.TrialDevilDamageList);
    }

    // 心魔法向战斗
    reqEnterTrialDevilPve(heros: number[]) {
        let req = gamesvr.TrialDevilEnterPveReq.create({
            Heroes: heros
        });
        operationSvr.send(req);
    }

    // 心魔法相战斗
    private _recvTrialDevilEnterPveRes(recvMsg: { Result: number, Desc: string, Msg: gamesvr.ITrialDevilEnterPveRes }) {
        if (!this._checkResValid(recvMsg)) {
            return;
        }
        let msg = recvMsg.Msg;
        let lastTotalDamage = pveTrialData.trialDevilData.data.TotalDamage || 0;
        if(msg.hasOwnProperty('TotalDamage')) {
            pveTrialData.trialDevilData.roundDamage = msg.TotalDamage - lastTotalDamage;
        }

        pveTrialData.updateTrialDevilData(msg.FightNum, msg.Heroes, msg.TotalDamage, msg.RankIndex, utils.mergeItemList(msg.Prizes));
        let pveMode = pveData.pveConfig ? pveData.pveConfig.pveMode : null;
        if (msg && pveMode == PVE_MODE.XIN_MO_FA_XIANG) {
            eventCenter.fire(trialDevilEvent.ENTER_PVE_RES, msg);
        }
    }

	// ----------------- 无间炼狱 -----------------
    updatePurgatoryData(purgatoryData: data.ITrialPurgatoryData) {
        pveTrialData.updatePurgatoryData(purgatoryData);
        eventCenter.fire(purgatoryEvent.REFRESH_VIEW, true);
    }

    /** 请求复活且恢复所有英雄 */
    reqTrialPurgatoryRelive() {
        let req = gamesvr.TrialPurgatoryReliveReq.create({});

        operationSvr.send(req);
    }

    private _recvTrialPurgatoryReliveRes(recvMsg: { Result: number, Desc: string, Msg: gamesvr.TrialPurgatoryReliveRes }) {
        if (!this._checkResValid(recvMsg)) {
            return;
        }

        let msg = recvMsg.Msg;
        pveTrialData.purgatoryData.FreeReliveTime = msg.FreeReliveTime;
        pveTrialData.updatePurgatoryHeroes(msg.Heroes);

        eventCenter.fire(purgatoryEvent.REVIVE_SUCCESS);
        eventCenter.fire(purgatoryEvent.REFRESH_VIEW);
    }

    /**
     * 翻块
     * @param pointUID 地图块的UID
     */
    reqTrialPurgatoryUnmask(pointUID: number) {
        let req = gamesvr.TrialPurgatoryUnmaskReq.create({
            PointUID: pointUID
        });

        operationSvr.send(req);
    }

    private _recvTrialPurgatoryUnmaskRes(recvMsg: { Result: number, Desc: string, Msg: gamesvr.TrialPurgatoryUnmaskRes }) {
        if (!this._checkResValid(recvMsg)) {
            return;
        }

        let msg = recvMsg.Msg;
        
        let pointIndex: number = -1;
        let pointInfo: data.ITrialPointInfo = pveTrialData.purgatoryData.Points.find((point, idx) => {
            let isFind = point.PointUID === msg.PointUID;
            if (isFind) {
                pointIndex = idx;
            }
            return isFind;
        });
        
        // 直接触发，则消除该地图块,否则修改状态为翻开
        if (msg.TriggerEvent) {
            pveTrialData.purgatoryData.Points.splice(pointIndex, 1);
        } else {
            pointInfo.Status = data.TrialPointInfo.PointStatus.PSUnMask;
        }

        // 获得buff
        if (msg.BuffID) {
            pveTrialData.purgatoryData.BuffList.push(msg.BuffID);
        }

        // 先知之眼
        if (msg.PreViewPoints && msg.PreViewPoints.length > 0) {
            msg.PreViewPoints.forEach((pointUID) => {
                pveTrialData.purgatoryData.Points.find((point) => {
                    let isFind: boolean = false;
                    if (point.PointUID === pointUID) {
                        isFind = true;
                        point.Status = data.TrialPointInfo.PointStatus.PSPreView;
                    }
                    return isFind;
                });
            });
        }

        // 英雄状态变化
        if (msg.Heroes && msg.Heroes.length > 0) {
            pveTrialData.updatePurgatoryHeroes(msg.Heroes);
        }

        // 地图块被破坏
        if (msg.RemovePoints && msg.RemovePoints.length > 0) {
            pveTrialData.purgatoryData.Points = pveTrialData.purgatoryData.Points.filter((point) => {
                return msg.RemovePoints.indexOf(point.PointUID) === -1;
            });
        }

        // 发布事件通知页面进行展示
        eventCenter.fire(purgatoryEvent.UNMASK_POINT, msg);
    }

    /**
     * 购买或放弃商品
     * @param pointUID UID
     * @param buyOrGiveUp 是否购买
     */
    reqTrialPurgatoryPurchase(pointUID: number, buyOrGiveUp: boolean) {
        let req = gamesvr.TrialPurgatoryPurchaseReq.create({
            PointUID: pointUID,
            BuyOrGiveUp: buyOrGiveUp
        });

        operationSvr.send(req);
    }

    private _recvTrialPurgatoryPurchaseRes(recvMsg: { Result: number, Desc: string, Msg: gamesvr.TrialPurgatoryPurchaseRes }) {
        if (!this._checkResValid(recvMsg)) {
            return;
        }

        let msg = recvMsg.Msg;
        // 不论购买结果，都应清除该地图块
        let index = pveTrialData.purgatoryData.Points.findIndex((point) => {
            return point.PointUID === msg.PointUID;
        });
        pveTrialData.purgatoryData.Points.splice(index, 1);

        eventCenter.fire(purgatoryEvent.PURCHASE_RESULT, msg.PointUID);
    }

    /**
     * 治疗之泉
     * @param pointUID UID
     */
    reqTrialPurgatoryHpAltar(pointUID: number) {
        let req = gamesvr.TrialPurgatoryHpAltarReq.create({
            PointUID: pointUID
        });

        operationSvr.send(req);
    }

    private _recvTrialPurgatoryHpAltarRes(recvMsg: { Result: number, Desc: string, Msg: gamesvr.TrialPurgatoryHpAltarRes }) {
        if (!this._checkResValid(recvMsg)) {
            return;
        }

        let msg = recvMsg.Msg;
        // 英雄状态变化
        if (msg.Heroes && msg.Heroes.length > 0) {
            pveTrialData.updatePurgatoryHeroes(msg.Heroes);
        }

        // 清除该地图块
        let index = pveTrialData.purgatoryData.Points.findIndex((point) => {
            return point.PointUID === msg.PointUID;
        });
        pveTrialData.purgatoryData.Points.splice(index, 1);

        eventCenter.fire(purgatoryEvent.HP_ALTAR, msg.PointUID);
    }
    
    /**
     * 复活祭坛
     * @param pointUID UID
     */
    reqTrialPurgatoryLiveAltar(pointUID: number) {
        let req = gamesvr.TrialPurgatoryLiveAltarReq.create({
            PointUID: pointUID
        });

        operationSvr.send(req);
    }

    private _recvTrialPurgatoryLiveAltarRes(recvMsg: { Result: number, Desc: string, Msg: gamesvr.TrialPurgatoryLiveAltarRes }) {
        if (!this._checkResValid(recvMsg)) {
            return;
        }

        let msg = recvMsg.Msg;
        // 英雄状态变化
        if (msg.Hero) {
            pveTrialData.updatePurgatoryHeroes([msg.Hero]);
        }

        // 清除该地图块
        let index = pveTrialData.purgatoryData.Points.findIndex((point) => {
            return point.PointUID === msg.PointUID;
        });
        pveTrialData.purgatoryData.Points.splice(index, 1);

        eventCenter.fire(purgatoryEvent.LIVE_ALTAR, msg.PointUID);
    }

    /**
     * 进入战斗
     * @param pointUID 地图块UID 
     * @param heroes 选择的英雄
     */
    reqTrialPurgatoryEnterPve(pointUID: number, heroes: number[]) {
        let req = gamesvr.TrialPurgatoryEnterPveReq.create({
            PointUID: pointUID,
            Heroes: heroes
        });

        operationSvr.send(req);
    }

    _recvTrialPurgatoryEnterPveRes(recvMsg: { Result: number, Desc: string, Msg: gamesvr.TrialPurgatoryEnterPveRes }) {
        if (!this._checkResValid(recvMsg)) {
            return;
        }

        if (pveData.pveConfig.pveMode !== PVE_MODE.PURGATORY) {
            return;
        }

        let msg = recvMsg.Msg;

        // 更新英雄状态
        pveTrialData.updatePurgatoryHeroes(msg.Heroes);

        // 打赢小怪，消除地图块
        let index: number = -1;
        let point: data.ITrialPointInfo = pveTrialData.purgatoryData.Points.find((item, idx) => {
            let isFind: boolean = item.PointUID === msg.PointUID;
            if (isFind) {
                index = idx;
            }
            return isFind;
        });
        if (point.Type === data.TrialPointInfo.PointType.PTMonster && msg.Pass) {
            pveTrialData.purgatoryData.Points.splice(index, 1);
        }

        // 传送门
        if (msg.Point) {
            pveTrialData.purgatoryData.Points.find((point, idx) => {
                let isFind: boolean = false;
                if (point.PointUID === msg.Point.PointUID) {
                    isFind = true;
                    pveTrialData.purgatoryData.Points[idx] = msg.Point;
                }

                return isFind;
            });
        }

        // 生成战斗信息
        // 缓存战斗结果用于展示
        pveTrialData.purgatoryFiniData = {
            LessonID: "Purgatory",
            Past: msg.Pass,
            Prizes: msg.Prizes
        }

        eventCenter.fire(purgatoryEvent.ENTER_PVE_RES, msg);
    }

    /**
     * 传送门
     * @param pointUID 地图块UID
     */
    reqTrialPurgatoryTransgate(pointUID: number) {
        let req = gamesvr.TrialPurgatoryTransgateReq.create({
            PointUID: pointUID
        });

        operationSvr.send(req);
    }

    _recvTrialPurgatoryTransgateRes(recvMsg: { Result: number, Desc: string, Msg: gamesvr.TrialPurgatoryTransgateRes }) {
        if (!this._checkResValid(recvMsg)) {
            return;
        }

        let msg = recvMsg.Msg;
        pveTrialData.purgatoryData.Progress = msg.Progress;
        pveTrialData.purgatoryData.RefreshTime = msg.RefresTime;
        pveTrialData.purgatoryData.Points = msg.Points;
        pveTrialData.purgatoryData.BuffList = msg.BuffList;
        pveTrialData.updatePurgatoryHeroes(msg.Heroes);

        eventCenter.fire(purgatoryEvent.REFRESH_VIEW, true);
    }

    // ----------------- 阴阳宝鉴 -----------------
    /** 同步激活英雄ID到服务端，激活或关闭宝鉴
     * @param heroIDs 英雄ID数组
    */
    reqTrialLightDarkActivateHexagram(heroIDs: number[]) {
        let req = gamesvr.TrialLightDarkActivateHexagramReq.create({
            ActivateHeroIDList: heroIDs
        });

        operationSvr.send(req);
    }

    _recvTrialLightDarkActivateHexagramRes(recvMsg: { Result: number, Desc: string, Msg: gamesvr.TrialLightDarkActivateHexagramRes }) {
        if (!this._checkResValid(recvMsg)) {
            return;
        }

        let msg = recvMsg.Msg;
        pveTrialData.yyBookData.ActivateHeroIDList = msg.ActivateHeroIDList;
        let isActive: boolean = msg.ActivateHeroIDList.length === 4;
        eventCenter.fire(yyBookEvent.ACTIVE_TRIGRAMS, isActive);
    }

    /**
     * 请求进入战斗
     * @param heroIDs 上阵英雄ID 
     * @param monsterGroupIdx 怪物组下标
     * @param useHeroMap 已使用的英雄
     */
    reqTrialLightDarkEnter(heroIDs: number[], monsterGroupIdx: number, useHeroMap: {[key:string]: boolean}) {
        let req = gamesvr.TrialLightDarkEnterReq.create({
            Heroes: heroIDs,
            MonsterGroupIndex: monsterGroupIdx,
            UseHeroMap: useHeroMap
        });

        operationSvr.send(req);
    }

    _recvTrialLightDarkEnterRes(recvMsg: { Result: number, Desc: string, Msg: gamesvr.TrialLightDarkEnterRes }) {
        if (!this._checkResValid(recvMsg)) {
            return;
        }

        let msg = recvMsg.Msg;
        eventCenter.fire(yyBookEvent.ENTER_RES, msg);
    }

    /**
     * 请求完成战斗
     * @param past 是否通过
     */
    reqTrialLightDarkFinish(past: boolean) {
        let req = gamesvr.TrialLightDarkFinishReq.create({
            Past: past
        });

        operationSvr.send(req);
    }

    _recvTrialLightDarkFinishRes(recvMsg: { Result: number, Desc: string, Msg: gamesvr.TrialLightDarkFinishRes }) {
        if (!this._checkResValid(recvMsg)) {
            return;
        }

        let msg = recvMsg.Msg;
        (msg as any).LessonID = "YYBook";

        if (msg.Past) {
            // 赢了才需更新副本信息
            let yyBookData = pveTrialData.yyBookData;
            yyBookData.LightDarkID = msg.LightDarkID;
            yyBookData.HexagramIDList = msg.HexagramIDList;
            yyBookData.MonsterLineupIDList = msg.MonsterLineupIDList;
            yyBookData.SceneIndex = msg.SceneIndex;
            yyBookData.ActivateHeroIDList = msg.ActivateHeroIDList;

            pveTrialData.trigramsHeroIDs.splice(0, pveTrialData.trigramsHeroIDs.length);
            pveTrialData.isTrigramsActive = false;

            eventCenter.fire(yyBookEvent.REFRESH_VIEW);
        }

        eventCenter.fire(yyBookEvent.FINISH_RES, msg);
        
    }

    /** 更新数据进入下一个阵容战斗 
     * @param usedHeroes 该局使用过的英雄
    */
    updateYYBookPveData(usedHeroes: number[]) {
        let pveConfig: PveConfig = pveData.pveConfig;
        let heroUsed = pveConfig.banHeroList.concat(usedHeroes);
        let currPass = pveConfig.passStep.concat(pveConfig.step);
        let nextStep: number = 0;
        for (let i = 0; i < pveConfig.monsterGroupIDs.length; ++i) {
            if (currPass.indexOf(i) == -1) {
                nextStep = i;
                break;
            }
        }

        pveConfig.step = nextStep;
        pveConfig.passStep = currPass;
        pveConfig.banHeroList = heroUsed;
    }

}

let pveDataOpt = new PveDataOpt();
export { pveDataOpt }
