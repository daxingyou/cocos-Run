import { BATTLE_STATE, ROLE_TYPE } from "../../../app/BattleConst";
import { eventCenter } from "../../../common/event/EventCenter";
import { battleEvent, commonEvent, GameResultEvent } from "../../../common/event/EventData";
import guiManager from "../../../common/GUIManager";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import UIBTRoleCtrl from "../view-battle/UIBTRoleCtrl";
import UIBTStateCtrl from "../view-battle/UIBTStateCtrl";
import UITimerCtrl from "../view-battle/UITimerCtrl";
import EffectAnimManager from "../view-battle/EffectAnimManager";
import BattleUiController from "../view-battle/BattleUiController";
import BattlePrepareView from "./BattlePrepareView";
import { preloadBuffPool, preloadHaloPool, preloadHitLabelPool, preloadItemRolePool, preloadRoleSpines } from "../../../common/res-manager/Preloaders";
import StepWork from "../../../common/step-work/StepWork";
import { CACHE_MODE, resourceManager } from "../../../common/ResourceManager";
import { battleUIOpt } from "../../operations/BattleUIOpt";
import { configUtils } from "../../../app/ConfigUtils";
import { pveData } from "../../models/PveData";
import { bagData } from "../../models/BagData";
import { audioManager, BGM_TYPE } from "../../../common/AudioManager";
import engineHook from "../../../app/EngineHook";
import { PVE_MODE, PVP_MODE } from "../../../app/AppEnums";
import { SCENE_NAME } from "../../../app/AppConst";
import moduleUIManager from "../../../common/ModuleUIManager";
import { pveTrialData } from "../../models/PveTrialData";
import { resPathUtils } from "../../../app/ResPathUrlUtils";
import { pveDataOpt } from "../../operations/PveDataOpt";
import { data, gamesvr } from "../../../network/lib/protocol";
import { pvpData } from "../../models/PvpData";
import { pvpDataOpt } from "../../operations/PvpDataOpt";
import { configManager } from "../../../common/ConfigManager";
import { cfg } from "../../../config/config";
import UITeamBuffCtrl from "../view-battle/UITeamBuffCtrl";
import { battleUIData } from "../../models/BattleUIData";
import { limitData } from "../../models/LimitData";
import { limitDataOpt } from "../../operations/LimitDataOpt";
import shakeManager from "../view-battle/ShakeManager";
import ShadeController from "../view-battle/ShadeController";
import { islandData } from "../../models/IslandData";
import { utils } from "../../../app/AppUtils";

const { ccclass, property } = cc._decorator;
const PRELOAD_TAG = "BATTLE_NODE"

@ccclass
export default class BattleScene extends ViewBaseComponent {
    @property(UITimerCtrl) timerCtrl: UITimerCtrl = null;
    @property(UIBTStateCtrl) btStateCtrl: UIBTStateCtrl = null;
    @property(UIBTRoleCtrl) heroCtrl: UIBTRoleCtrl = null;
    @property(UIBTRoleCtrl) monsterCtrl: UIBTRoleCtrl = null;
    @property(BattleUiController) uiController: BattleUiController = null;
    @property(UITeamBuffCtrl) teamBuffCtrl: UITeamBuffCtrl = null;

    @property(cc.Node) nodeBg: cc.Node = null;
    @property(cc.Node) prepareRoot: cc.Node = null;
    @property(cc.Node) nodeWating: cc.Node = null;
    @property(cc.Node) nodeWatingFinish: cc.Node = null;
    @property(cc.Node) ndControl: cc.Node = null;
    @property(cc.Node) ndRoleSeats: cc.Node = null;
    @property(sp.Skeleton) startSpine: sp.Skeleton = null;
    @property([cc.Node]) friendSkillList: cc.Node[] = [];
    @property(ShadeController) shadeCtrl: ShadeController = null;
    @property(cc.Node) settingBtn: cc.Node = null;

    private _effAnimCtrl: EffectAnimManager = null;
    private _prepareView: BattlePrepareView = null;
    private _preloadRes: string[] = [];
    private _bgPath: string = "";

    get prepareView (){
        return this._prepareView;
    }

    onInit () {
        this._initEvents();
        shakeManager.setCameraAndRoot(cc.find('EntryScene/Main Camera', cc.director.getScene()).getComponent(cc.Camera));
        let resetTask = this._resetView();

        // 加载资源
        this._loadSceneBg(this.stepWork);
        this._preloadRoleRes(this.stepWork);
        this._preloadItemPool(this.stepWork);
        guiManager.isDebug && this._loadDebugView(this.stepWork);
        this.stepWork.concact(resetTask);
    }

    private _initEvents() {
        eventCenter.register(battleEvent.BATTLE_START, this, this._whenBattleStart);
        eventCenter.register(battleEvent.ROUND_START, this, this._whenRoundStart);
        eventCenter.register(battleEvent.BATTLE_END, this, this._whenBattleEnd);
        eventCenter.register(GameResultEvent.PRE_CLOSE, this, this._onGameResultPreClose);
        eventCenter.register(battleEvent.ENTER_PVE_FAIL, this, this._revEnterPveFail);
        eventCenter.register(commonEvent.RESTART_CURR_GAME, this, this._restartCurr);
    }

    private _loadDebugView(stepWork: StepWork) {
        stepWork.addTask((callback: () => {}) => {
            this.loadSubView("BattleDebugView").then((view)=>{
                view.node.active = false;
                if (callback) callback();
            });
        });
    }

    deInit() {
        engineHook.frameInterval = engineHook.DEFAULT_INTERVAL;
        shakeManager.deInit();
        this.unscheduleAllCallbacks()
        if (this._effAnimCtrl)
            this._effAnimCtrl.deInit();
        this._effAnimCtrl = null;

        this.shadeCtrl.deInit();
        this.btStateCtrl.deInit();
        this.timerCtrl.deInit();
        this.heroCtrl.deInit();
        this.monsterCtrl.deInit();
        this.teamBuffCtrl.deInit();
        this.uiController.deInit();

        if (this._prepareView)
            this._prepareView.deInit();
    }

    private _resetView () {
        this._initBase();
        // 非资源加载
        let newTask = new StepWork();
        this._initBattleComp(newTask);
        this._showPrepareView(newTask);
        return newTask;
    }

    private _preloadItemPool (task: StepWork) {
        task
        .concact(preloadItemRolePool())
        .concact(preloadHitLabelPool())
        .concact(preloadBuffPool())
        .concact(preloadHaloPool())
    }

    private _showPrepareView (task: StepWork) {
        if (this._prepareView) {
            task.addTask(()=> {
                if (this._prepareView && cc.isValid(this._prepareView)) {
                    this._prepareView.onInit(this);
                }
            });
        } else {
            task.addTask((callback: Function) => {
                this.ndControl.active = false;
                guiManager.loadView("BattlePrepareView", this.prepareRoot, this)
                .then((view) => {
                    // @ts-ignore
                    this._prepareView = view;
                    callback();
                })
            })
        }
    }

    private _initBattleComp (task: StepWork) {
        task.addTask(() => {
            // uiController中控制英雄选位是否显示
            let shadowShow: boolean[];
            if (pveData && pveData.pveConfig && pveData.pveConfig.pveMode === PVE_MODE.RESPECT) {
                shadowShow = [false, false, true, false, false];
            } else if (pveData && pveData.pveConfig && pveData.pveConfig.pveMode === PVE_MODE.CLOUD_DREAM) {
                let lessCfg = configUtils.getCloudDreamLessonConfig(pveData.pveConfig.lessonId);
                if(lessCfg && lessCfg.PVECloudDreamLessonUsePosition && lessCfg.PVECloudDreamLessonUsePosition.length > 0) {
                    let posCfg = utils.parseStringTo1Arr(lessCfg.PVECloudDreamLessonUsePosition, ';');
                    posCfg.forEach(ele => {
                        shadowShow = shadowShow || [];
                        shadowShow.push(!!(parseInt(ele)))
                    })
                }
            }

            if (this.node && cc.isValid(this.node)) {
                this.timerCtrl.init();
                this.uiController.init(shadowShow);
                this.btStateCtrl.init(this);
                this.heroCtrl.init(this);
                this.monsterCtrl.init(this);
                this.teamBuffCtrl.init(this);
                this.shadeCtrl.init();
                shakeManager.init();
                battleUIOpt.registerBattle();
                this._effAnimCtrl = new EffectAnimManager();
            }
        })
    }

    onRelease() {
        this.node.stopAllActions();
        this.startSpine.clearTracks();
        this.deInit();
        this._prepareView && this._prepareView.closeView();
        this._prepareView = null;
        this.releaseSubView();
        resourceManager.release(this._bgPath);
        eventCenter.unregisterAll(this);
        this._releaseRoleRes();
        battleUIOpt.unRegisterBattle();
    }

    /**
     * @description 战斗界面重置，清空战斗信息
     * 1. 清除战斗残留的特效和
     * 2. 重置备战/战斗界面
     * 3. 清除战斗逻辑的消息队列
     */
    onRestart(multBattle?:boolean) {
        audioManager.playMusic(BGM_TYPE.NORMAL);
        //巅峰对决-多阵容重置游戏不走战斗请求，需要处理类接收本地发放得消息
        if (!multBattle) battleUIOpt.unRegisterBattle();
        this.deInit();
        let resetTask = this._resetView();
        this.stepWork.concact(resetTask);
        this.stepWork.start(()=> {});
    }

    onClickLeaveGame() {
         guiManager.loadScene(SCENE_NAME.MAIN).then(()=>{
            moduleUIManager.showModuleView();
        });
    }

    onClickSetting () {
        battleUIOpt.pause()
        this.loadSubView("BattleSettingView", this._restartShowBattle.bind(this), this._restartCurr.bind(this), this._directExitBattle.bind(this));
    }

    private _initBase () {
        this.nodeWating.active = false;
        this.ndControl.active = false;
        this.ndRoleSeats.active = true;

        this.scheduleOnce(() => {
            this.friendSkillList.forEach((_c, _index) => {
                if(cc.isValid(_c)) {
                    _c.x = (_index <= 0 ? -1 : 1) * cc.winSize.width / 2;
                }
            });
        }, 0.2);
    }

    /**
     * 重新开始战斗，打开备战界面，可以重新选阵容
     * @param cmd 
     * @param lessionId 
     */
    private _restartCurr (cmd: any, lessionId: number) {
        if (pveData.pveConfig && pveData.pveConfig.useDefaultSquad)
            pveData.pveConfig.useDefaultSquad = false;
        this.onRestart();
    }

    /**
     * 回放功能可以直接退出
     * @param cmd 
     * @param lessionId 
     */
    private _directExitBattle (cmd: any, lessionId: number) {
        if (pvpData.pvpConfig) {
            pvpData.clearPvpConfig();
        }
        this.prepareView && this.prepareView.onClickExit();
    }

    private _onGameResultPreClose(event: number, cb: Function){
        cb && cb();
    }

    /**
     * 重新播放战斗，按照之前的战斗逻辑重新播放，不可以选整容
     */
    private _restartShowBattle () {
        this.nodeWating.active = true;
        if (pveData.pveConfig) pveData.pveConfig.useDefaultSquad = false;
        this.deInit();

        let resetTask = this._resetView();
        this.stepWork.concact(resetTask);
        this.stepWork.start(()=> {
            this.nodeWating.active = false;
            battleUIOpt.restart();
        })
    }

    get effAnimCtrl() {
        return this._effAnimCtrl;
    }

    /**
     * @description 逻辑层已经进入其他状态，回合真正结束
     */
    whenRoundEnd () {
        this.heroCtrl.onRoundEnd();
        this.monsterCtrl.onRoundEnd();
    }

    reqEnterGame (heroes: number[],battleArray?:Map<number,number[]>) {
        this.nodeWating.active = true;
        this.settingBtn && (this.settingBtn.active = true);
        // pve 入口
        if (pveData.pveConfig) {
            let pve = pveData.pveConfig;
            switch (pve.pveMode) {
                case PVE_MODE.CLOUD_DREAM: {
                    pveDataOpt.reqEnterPveCloud(pve.lessonId, heroes);
                    break;
                }
                case PVE_MODE.NINE_HELL: {
                    pveDataOpt.reqEnterPveHell(pve.lessonId, heroes);
                    break;
                }
                case PVE_MODE.MAGIC_DOOR: {
                    pveDataOpt.reqEnterPveMiracal(pve.lessonId, heroes);
                    break;
                }
                case PVE_MODE.RANDOM_FIGHT: {
                    if(limitData.enterRandomFightData) {
                        limitDataOpt.sendEnterLimitFightBattle(limitData.enterRandomFightData.ID, heroes);
                    }
                    break;
                }
                case PVE_MODE.RESPECT: {
                    pveDataOpt.reqEnterPveRespect(pve.monsterIds[2], heroes[2]);
                    break;
                }
                case PVE_MODE.FAIRY_ISLAND: {
                    pveDataOpt.reqTrialIslandBattle(islandData.chosePointUid,heroes);
                    break;
                }
                case PVE_MODE.XIN_MO_FA_XIANG:
                    pveDataOpt.reqEnterTrialDevilPve(heroes);
                    break;
				case PVE_MODE.PURGATORY: 
                    pveDataOpt.reqTrialPurgatoryEnterPve(pve.pointUID, heroes);
                    break;
                case PVE_MODE.YYBOOK:
                    let useHeroMap: {[key: number]: boolean} = {};
                    pve.banHeroList.forEach((item) => { useHeroMap[item] = true; });
                    pveDataOpt.reqTrialLightDarkEnter(heroes, pve.step, useHeroMap);
                    break;
                default: {
                    if (pve.pveMode != PVE_MODE.NONE) {
                        let step = pve.step;
                        let banHeroes = pve.banHeroList;
                        pveDataOpt.reqEnterPve(
                            pve.lessonId || pveData.getCurrLessonId(),
                            pve.doubleDrop,
                            heroes,
                            step,
                            banHeroes,
                        );
                    }
                    break;
                }
            }
        } else if (pvpData.pvpConfig) { 
        // PVP入口
            switch (pvpData.pvpConfig.pvpMode) {
                case PVP_MODE.DEIFY_COMBAT: {
                    pvpDataOpt.reqEnterPvpSpirit(pvpData.pvpConfig.enemySerial, heroes, pvpData.pvpConfig.enemyUID, pvpData.pvpConfig.enemyList);
                    break;
                }
                case PVP_MODE.IMMORTALS_RANK: {
                    pvpDataOpt.reqEnterPvpFairy(pvpData.pvpConfig.fightId, heroes, pvpData.pvpConfig.buffs);
                    break;
                }
                case PVP_MODE.PEAK_DUEL: {
                    let isAllow = false;
                    let result: data.IPvpPeakDuelDefensiveLineupHero[] = [];
                    for (let k = 0; k < battleArray.size; k++){
                        let heros = battleArray.get(k);
                        isAllow = this._checkArrayIsAllZero(heros.concat());

                        let defensLis: data.IPvpPeakDuelDefensiveLineupHero = {};
                        if (!heros) defensLis["DefensiveHeroList"] = [0, 0, 0, 0, 0];
                        defensLis["DefensiveHeroList"] = heros;
                        result.push(defensLis)

                        if (!isAllow) break;
                    }   
                    if (!isAllow) {
                        guiManager.showTips("每个队伍至少上一人");
                        this.nodeWating.active = false;
                    }
                    else {
                        this.settingBtn && (this.settingBtn.active = false);
                        pvpData.pvpConfig.step = 0;
                        pvpDataOpt.reqEnterPvpPeakDuel(pvpData.pvpConfig.idx,result);    
                    }
                    break;
                }
                default: {
                    break;
                }
            }
        }

    }

    private _revEnterPveFail (cmd: any, err: string) {
        console.log("[Battle Scene], receieve Enter Pve Res", err)
        guiManager.showTips("进入战斗失败：err "+ err)
        this.nodeWating.active = false;
    }

    private _showStartAnim(endFunc: Function) {
        this.startSpine.node.active = true;
        this.startSpine.setCompleteListener(() => {
            endFunc && endFunc();
            this.startSpine.setCompleteListener(null);
        });
        this.startSpine.setAnimation(0, 'start', false);
    }

    private _whenBattleStart (cmd: any, notify: gamesvr.IBattleStartResult, seq: number, startFunc: Function) {
        this._showBattleSpecialSkillView(true);
        this.nodeWating.active = false;
        this.ndRoleSeats.active = false;
        this.timerCtrl.initTimer(notify.Timer);
        this._effAnimCtrl.init(this);
        audioManager.playMusic(BGM_TYPE.BATTLE);
        this._showStartAnim(() => {
            this._resetUiPosition();
            this.heroCtrl.battleBegin();
            this.monsterCtrl.battleBegin();
            this.uiController.battleBegin();
            this.teamBuffCtrl.showTeamBuff(ROLE_TYPE.HERO, battleUIData.getSelfTeam().roles.map(_v => {return _v.roleId}), [])
            this.teamBuffCtrl.showTeamBuff(ROLE_TYPE.MONSTER, battleUIData.getOppositeTeam().roles.map(_v => {return _v.roleId}), [])
            this.btStateCtrl.gotoState(BATTLE_STATE.BATTLE_START, notify, seq);
            this.ndControl.active = true;
            this.startSpine.node.active = false;
            startFunc && startFunc();
        });
    }

    private _whenRoundStart(cmd: any, notify: gamesvr.IRoundResult, seq: number) {
        this.btStateCtrl.gotoState(BATTLE_STATE.IDLE, notify, seq);
        this.timerCtrl.addTimer(notify.Timer);
    }

    private _whenBattleEnd(cmd: any, notify: gamesvr.IBattleEndResult, seq: number) {
        this.timerCtrl.stopAll();
        this.effAnimCtrl.process([], ()=> {
            let moveBackTime = this.heroCtrl.onAllMoveBack();
            moveBackTime = Math.max(moveBackTime, this.monsterCtrl.onAllMoveBack()) + 0.2;
            if(notify && notify.TimeOut) {
                this.timerCtrl.playBombBoom(() => {
                    this.scheduleOnce(()=> {
                        this.btStateCtrl.gotoState(BATTLE_STATE.BATTLE_END, notify, seq);
                    }, moveBackTime)
                });
            } else {
                this.scheduleOnce(()=> {
                    this.btStateCtrl.gotoState(BATTLE_STATE.BATTLE_END, notify, seq);
                }, moveBackTime)
            }
        })
    }

    private _preloadRoleRes(stepWork: StepWork) {
        this._releaseRoleRes();

        let resPaths: string[] = [];
        let allHeroes = bagData.heroList;
        allHeroes.forEach( _hu => {
            if (_hu && _hu.ID) {
                let cfg = configUtils.getHeroBasicConfig(_hu.ID);
                if (cfg && cfg.HeroBasicModel) {
                    let spPath = resPathUtils.getModelSpinePath(cfg.HeroBasicModel);
                    if (spPath && resPaths.indexOf(spPath) == -1) {
                        resPaths.push(spPath);
                    }
                }
            }
        })

        // let monsters = this._prepareView.monster;
        // monsters.monsterIds.forEach( _mId => {
        //     let mCfg = configUtils.getMonsterConfig(_mId);
        //     if (mCfg.ModelId) {
        //         let spPath = resPathUtils.getModelSpinePath(mCfg.ModelId);
        //         if (spPath && resPaths.indexOf(spPath) == -1) {
        //             resPaths.push(spPath);
        //         }
        //     }
        // })

        this._preloadRes = this._preloadRes.concat(resPaths);
        stepWork.concact(preloadRoleSpines(this._preloadRes, PRELOAD_TAG).stepWork);

        
    }

    private _releaseRoleRes() {
        if (this._preloadRes.length > 0) {
            this._preloadRes.forEach(resPath => {
                resourceManager.release(resPath, CACHE_MODE.NONE, PRELOAD_TAG);
            });
            this._preloadRes = [];
        }
    }

    private _loadSceneBg(stepWork: StepWork) {
        this._bgPath = this._getBgPath();

        stepWork.addTask((callback: () => {}) => {
            resourceManager.load(this._bgPath, cc.SpriteFrame).then((info) => {
                this.nodeBg.getComponent(cc.Sprite).spriteFrame = info.res;
                if (callback) callback();
            }).catch(callback);
        });
    }

    showSubViewInGame(viewName: string, ...rest: any[]): Promise<ViewBaseComponent> {
        return this.loadSubView(viewName, ...rest);
    }

    private _getBgPath() {
        let bgPath = 'textures/lesson-bg/bg_fight1';
        let pveCfg = pveData.pveConfig;
        if(pveCfg && pveCfg.pveMode!=PVE_MODE.NONE){
            switch(pveCfg.pveMode){
                case PVE_MODE.ADVENTURE_LESSON:
                    bgPath = pveCfg.adventureCfg.LessonFightScene;
                    break;
                case PVE_MODE.DAILY_LESSON:
                    bgPath = pveCfg.dailyCfg.PVEDailyLessonFightBg;
                    break;
                case PVE_MODE.RISE_ROAD:
                    bgPath = pveCfg.riseRoadCfg.PVERiseRoadFightBg;
                    break;
                case PVE_MODE.CLOUD_DREAM:
                    let sceneIndex = pveTrialData.cloudInfo.LessonMap[pveCfg.lessonId].SceneIndex;
                    let cloudDreamLesson: cfg.PVECloudDreamLesson = configManager.getConfigByKey("cloudDreamLesson", pveCfg.lessonId); 
                    bgPath = cloudDreamLesson.PVECloudDreamLessonScene.split("|")[sceneIndex] || "";
                    break;
                case PVE_MODE.NINE_HELL:
                    let sceneIndex1 = pveTrialData.hellInfo.LessonMap[pveCfg.lessonId].SceneIndex;
                    let nineHellLesson: cfg.PVECopy = configManager.getConfigByKey("pveCopy", pveCfg.lessonId);
                    bgPath = nineHellLesson.PVECopyScene.split("|")[sceneIndex1] || "";
                    break;
                case PVE_MODE.MAGIC_DOOR:
                    bgPath = pveData.pveConfig.magicCfg.PVECopyScene;
                    break;
                case PVE_MODE.DREAM_LESSON:
                    bgPath = pveCfg.dreamlandCfg.PVEDreamlandLessonScene;
                    break;
                case PVE_MODE.RESPECT:
                case PVE_MODE.PURGATORY:
                case PVE_MODE.YYBOOK:
                    bgPath = pveCfg.battleBg;
                    break;
                case PVE_MODE.RANDOM_FIGHT:
                    let randomFightBg = configUtils.getConfigModule('RandomFightScene');
                    if(randomFightBg) {
                        bgPath = randomFightBg;
                    }
                    break;
                default:
                    break;
            }
            // 防止策划漏加
            if (bgPath && bgPath.search("textures/lesson-bg/") == -1) { bgPath = "textures/lesson-bg/"+ bgPath;}
        }
        return bgPath;
    }

    private _showBattleSpecialSkillView(isShow: boolean) {
        this.friendSkillList.forEach((_c, _index) => {
            if(cc.isValid(_c)) {
                _c.stopAllActions();
                _c.runAction(cc.moveTo(0.5, cc.v2(0, 0)));
            }
        });
    }

    private _checkArrayIsAllZero(nums: number[]): boolean {
        let result = false
        nums.forEach(num => {
            if (num > 0) result = true;
        })
        return result;
    }

    private _resetUiPosition () {
        this.friendSkillList.forEach((_c, _index) => {
            if(cc.isValid(_c)) { 
                _c.stopAllActions();
                _c.setPosition(cc.v2(0, 0))
            }
        });
    }

    onClickTest () {
        this.uiController.battlePreSkill.onInit([/*155211,*/ 115211,124111], 524121, false, ()=> {
           
        })
    }

    updateFriendView(teamBuffResult: gamesvr.ITeamBuffResult) {
        this.teamBuffCtrl.updateTeamBuff(teamBuffResult)
    }

    initFriendView() {

    }
}
