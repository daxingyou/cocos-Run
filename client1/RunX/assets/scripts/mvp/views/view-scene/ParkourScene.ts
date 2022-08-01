import { ActorManager } from '../view-parkour/ActorManager';
import { eventCenter } from "../../../common/event/EventCenter";
import { battleEvent, commonEvent, dailyLessonEvent, lvMapViewEvent, netEvent, parkourEvent, timeLimitEvent, useInfoEvent } from "../../../common/event/EventData";
import { ItemType, parkourConfig, getTerrCfgPath, getMapBgRes, getMapBgAbsPath, getParkRoleSpinePath, ItemNameSet, ItemNames, ParkourLazyLoadMaps, ParkourLazyLoadType, getTerrSkinPath, getParkSpineResPath, ValueType} from "../view-parkour/ParkourConst";
import { UILayerComp } from "../view-parkour/UILayerComp";
import { ParkourBuffType } from "../../template/Role";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import guiManager from '../../../common/GUIManager';
import { configManager } from '../../../common/ConfigManager';
import OperatorLayerComp from '../view-parkour/OperateLayerComp';
import StepWork from "../../../common/step-work/StepWork";
import { CacheData, CACHE_MODE, resourceManager } from "../../../common/ResourceManager";
import { preloadRoleSpines, preloadScriptIcons} from "../../../common/res-manager/Preloaders";
import MapBgComp from '../view-parkour/MapBgComp';
import MapTerrManager, { terrConfigManager, prebuildCollisionNode} from '../view-parkour/MapTerrManager';
import RoleLayerComp, { parkourSpineCache } from '../view-parkour/RoleLayerComp';
import {lazyLoadRes, ParkourStrConfig} from '../view-parkour/ParkourString';
import BulletManager, { bulletPoolManager } from '../view-parkour/BulletManager';
import { pveData } from "../../models/PveData";
import { configUtils } from '../../../app/ConfigUtils';
import { gamesvr } from "../../../network/lib/protocol";
import { pveDataOpt } from "../../operations/PveDataOpt";
import { ItemManager } from "../view-parkour/ItemManager";
import { audioCache, audioManager, BGM_TYPE } from "../../../common/AudioManager";
import { SCENE_NAME} from "../../../app/AppConst";
import { parkourItemPoolMananger, preloadParkourItems, prebuildParkourItems } from "../view-parkour/ItemPoolManager";
import { parkourItemConfig, parkourTrapSprikeCfg } from "../view-parkour/ParkourItemConfig";
import RoleLogicComp from "../view-parkour/RoleLogicComp";
import MonsterLayerComp from '../view-parkour/MonsterLayerComp';
import moduleUIManager from '../../../common/ModuleUIManager';
import EffectLayerComp, { effectNodePool } from '../view-parkour/EffectLayerComp';
import { userData } from '../../models/UserData';
import { operationSvr } from '../../../network/OperationSvr';
import MessageBoxView from '../view-other/MessageBoxView';

const { ccclass, property } = cc._decorator;
const PRELOAD_PARKOUR_TAG = 'PARKOUR_NODE';

/**
 * 跑酷玩法控制器
 */
@ccclass
class ParkourScene extends ViewBaseComponent {
    private static _ins: ParkourScene = null;
    private _coin: number = 0;
    private _diamond: number = 0;

    private _uiLayerComp: UILayerComp = null;  //ui层
    private _operateLayerComp: OperatorLayerComp = null;//操作层
    private _roleLayerComp: RoleLayerComp = null;    //角色层
    private _mapBgComp: MapBgComp = null;   //地形背景
    private _mapTerrManager: MapTerrManager = null; //地形
    private _itemManager: ItemManager = null;   //道具层
    private _bulletManager: BulletManager = null;   //子弹管理
    private _monsterLayerComp: MonsterLayerComp = null; //怪物管理
    private _effectLayerComp: EffectLayerComp = null; //特效层
    private _gameCameraNode: cc.Node = null;

    private _levelProgrss: number = 0;  //关卡进度

    private _isPaused: boolean = false; //是否暂停

    private _isInit: boolean = false;

    private _terrData: any = {}; //地形配置数据

    private _preloadRes: string[] = []; //预加载的资源

    private _roleList: number[] = null;//阵容列表

    private _isTest: boolean = false;

    private _cachedSpriteFrames: Map<string, cc.SpriteFrame>  = null;//缓存精灵帧

    //复活弹窗是否打开，防止同时打开多个
    private _isReliveWindowOpen: boolean = false;

    private _autoPlayCutLines: number[] = null;

    private _animClipCache: AnimClipCache = null;

    private _currTerrSkin: number = NaN;  //皮肤类型

    private _currResult: boolean = null;  //当前局的结果
    private _hasUploaded: boolean = false;  //结果上报

    private _isStart: boolean = false;
    static getInstance(): ParkourScene {
        return ParkourScene._ins;
    }

    get isTest(): boolean{
        return this._isTest;
    }

    getItemManager(): ItemManager{
        return this._itemManager;
    }

    getMapTerrManager(): MapTerrManager{
        return this._mapTerrManager;
    }

    getMonsterLayerComp(): MonsterLayerComp{
        return this._monsterLayerComp;
    }

    getBulletManager(): BulletManager{
        return this._bulletManager;
    }

    getAnimClipCache(): AnimClipCache{
        return this._animClipCache;
    }

    getUILayerComp(): UILayerComp{
        return this._uiLayerComp;
    }

    getEffectLayerComp(): EffectLayerComp{
        return this._effectLayerComp;
    }

    getCurrTrapSprikePath(): string{
        return getParkSpineResPath(parkourTrapSprikeCfg[this._currTerrSkin]);
    }

    //Override
    protected onInit(...args: any[]) {
        ParkourScene._ins = this;
        if(args && args.length != 0){
            this._isTest = !!(args[0]);
            this._roleList = args[1];
        }
        guiManager.setMainCameraClearFlags(cc.Camera.ClearFlags.DEPTH | cc.Camera.ClearFlags.STENCIL);
        this._init();
        !this._animClipCache && (this._animClipCache = new AnimClipCache());
        this._setCollisionEnable(true);
        this._goPreloadRes();
        this._preloadNodesPools();
        this.stepWork.concact(this._getBuildTask())
        .concact(prebuildParkourItems())
        .concact(prebuildCollisionNode())
        .concact(this._otherLoadWorker());
        this.stepWork.concact(this._getStartTask());
    }

    private _init(){
        if(this._isInit) return;
        this._isInit = true;
        if(ItemNameSet.size == 0){
          for(let k in ItemNames){
              ItemNameSet.add(ItemNames[k]);
            }
        }
        this._initUI();
        this.initEvents();
    }

    //碰撞检测的开关
    private _setCollisionEnable(enable: boolean) {
        cc.director.getCollisionManager().enabled = enable;
        cc.macro.ENABLE_TILEDMAP_CULLING = true;
        cc.director.getCollisionManager().enabledDebugDraw = false;
    }

    private _clear(){
        this._autoPlayCutLines && (this._autoPlayCutLines.length = 0);
        this._autoPlayCutLines = null;

        if(this._animClipCache){
            this._animClipCache.clear();
        }
        this._animClipCache = null;

        this._cachedSpriteFrames && this._cachedSpriteFrames.clear();
        this._cachedSpriteFrames = null;
    }

    getAutoCutLines(){
        this._autoPlayCutLines = this._autoPlayCutLines || [...parkourConfig.AutoPlayWeightArr, 0];
        return this._autoPlayCutLines;
    }

    deInit(){
        this._coin = 0;
        this._diamond = 0;
        this._levelProgrss = 0;
        this.unscheduleAllCallbacks();
        this._mapTerrManager.deInit();
        this._monsterLayerComp.deInit();
        this._roleLayerComp.deInit();
        this._itemManager.deInit();
        this._bulletManager.deInit();
        this._effectLayerComp.deInit();
        this._mapBgComp.deInit();
        this._operateLayerComp.deInit();
        this._uiLayerComp.deInit();
        this._isPaused = false;
        this._currResult = null;
        this._hasUploaded = false;
        this.subView.forEach(ele => {
            //@ts-ignore
            ele.deInit && ele.deInit();
        });
    }

    updateAutoPlayArea(){
        let cutLines = this._autoPlayCutLines;
        parkourConfig.AutoPlayAreas.forEach((ele, idx) => {
            ele.x = parkourConfig.AutoPlayAreaStartX;
            ele.y = cutLines[idx + 1];
            ele.height = cutLines[idx] -  cutLines[idx + 1];
            ele.width = parkourConfig.AutoPlayAreaWidth;
        });

        let monsterAreaWidth: number = NaN;
        parkourConfig.AutoPlayMonsterAreas.forEach((ele, idx)=>{
            ele.x = parkourConfig.AutoPlayMonsterAreaStartX;
            ele.y = cutLines[idx + 1];
            ele.height = cutLines[idx] -  cutLines[idx + 1];
            isNaN(monsterAreaWidth) && (monsterAreaWidth = cc.winSize.width - ele.x);
            ele.width = monsterAreaWidth;
        });
    }

    private _getBuildTask(){
        let buildTask = new StepWork();

        buildTask.addTask((callback: Function) =>{
            this._mapBgComp.buildLayer(() => {
                callback && callback();
             });
        });

        buildTask.addTask((callback: Function) =>{
            this._mapTerrManager.buildLayer(this._terrData).then(()=>{
                callback && callback();
            })
        });

        buildTask.concact(this._roleLayerComp.buildLayer(this._roleList, PRELOAD_PARKOUR_TAG, (resPath:string)=>{
            this._preloadRes.push(resPath);
        }));

        buildTask.concact(this._monsterLayerComp.buildLayer(this._terrData, PRELOAD_PARKOUR_TAG, (resPath: string) => {
          this._preloadRes.push(resPath);
        }));

        return buildTask;
    }

    private _getStartTask(): StepWork{
        let stepWork = new StepWork();
        stepWork.addTask(() => {
            this._mapBgComp.onInit();
            this._mapTerrManager.onInit();
            this._operateLayerComp.onInit();
            this._bulletManager.onInit();
            this._itemManager.onInit();
            this._monsterLayerComp.onInit();
            this._effectLayerComp.onInit();
        }).addTask(() => {
            this._uiLayerComp.onInit();
        });
        //角色层初始化比较耗时，因此内部采用分帧机制
        stepWork.concact(new StepWork().addTask((callback: Function) => {
            this._roleLayerComp.onInit(() => {
                callback && callback();
            });
        })).concact(new StepWork().addTask(() => {
            //原生平台上音乐的停止是个耗时操作，此处进行分帧
            audioManager.playMusic(BGM_TYPE.PARKOUR, true);
        }).addTask(() => {
            this.startGame();
            this._isStart = true;
        }));
        return stepWork;
    }

    private _initUI(){
       this._itemManager = this.node.getChildByName('ItemLayer').getComponent(ItemManager);
       this._uiLayerComp = this.node.getChildByName("UiLayer").getComponent(UILayerComp);
       this._operateLayerComp = this.node.getChildByName("OperateLayer").getComponent(OperatorLayerComp);
       this._roleLayerComp = this.node.getChildByName("RoleLayer").getComponent(RoleLayerComp);
       this._mapBgComp = this.node.getChildByName("BgLayer").getComponent(MapBgComp);
       this._mapTerrManager = this.node.getChildByName("TerrLayer").getComponent(MapTerrManager);
       this._bulletManager = this.node.getChildByName('BulletLayer').getComponent(BulletManager);
       this._monsterLayerComp = this.node.getChildByName('MonsterLayer').getComponent(MonsterLayerComp);
       this._effectLayerComp = this.node.getChildByName('EffectLayer').getComponent(EffectLayerComp);
       this._gameCameraNode = this.node.getChildByName("GameCamera");
    }

    //开始游戏
    startGame(){
        this.schedule(() => {
            if(this._isPaused) return;
            ActorManager.getInstance().update(cc.director.getDeltaTime());
        });
        this._roleLayerComp.startGame();
        this._uiLayerComp.setAutoPlay();
    }

    //注册事件
    private initEvents() {
        eventCenter.register(parkourEvent.MAP_INIT_FINISH, this, this.onMapInitFinsished);
        eventCenter.register(parkourEvent.UPDTAE_ITEM, this, this.onUpdateItem);
        eventCenter.register(parkourEvent.UPDATE_HP, this, this.onUpdateHp);
        eventCenter.register(parkourEvent.ADD_BUFF, this, this.onAddBuff);
        eventCenter.register(parkourEvent.REMOVE_BUFF, this, this.onRemoveBuff);
        eventCenter.register(parkourEvent.RELIVE, this, this.onRelive);
        eventCenter.register(parkourEvent.CAMERA_MOVE, this, this.onCameraTransform);
        eventCenter.register(parkourEvent.USE_ITEM, this, this.onUseItem);
        eventCenter.register(parkourEvent.UPDATE_LEVEL_PROGRESS, this, this.onUpdateLevelProgress);
        eventCenter.register(parkourEvent.SHOW_RESULT, this, this.onShowResult);
        eventCenter.register(parkourEvent.PAUSE_LOGIC, this, this.onPauseLogic);
        eventCenter.register(parkourEvent.RESUME_LOGIC, this, this.onResumeLogic);
        eventCenter.register(commonEvent.RESTART_CURR_GAME, this, this._restartGame);
        eventCenter.register(lvMapViewEvent.FINISH_PVE_RES, this, this._receieveFinishRes);
        eventCenter.register(dailyLessonEvent.FINISH_PVE_DAILY_RES, this, this._receieveFinishRes);
        eventCenter.register(parkourEvent.AUTO_PLAY, this, this.onAutoPlay);
        eventCenter.register(parkourEvent.EXIT_CURR_GAME, this, this._exitGame);
        eventCenter.register(netEvent.NET_RECONNECTED, this, this._onNetReconnect);
        if(guiManager.isDebug){
            eventCenter.register(parkourEvent.CHANGE_DEBUG_CONFIG, this, this.onChangeDebugParam);
        }
    }

    onAutoPlay(...params: any){
        if (!params || params.length <= 1) return;
        let isAuto = params[1];
        this._operateLayerComp.setAutoPlay(isAuto);
        let playerComp =  this._roleLayerComp.getPlayer();
        playerComp && playerComp.setAutoPlay(isAuto);
    }

    onMapInitFinsished(...params: any[]){
        if (!params || params.length <= 1) return;
        let roleStartPos = params[1];
        parkourConfig.actorPos.y = roleStartPos.y;
    }

    onChangeDebugParam(...params: any[]){
        let config = params[1];
        parkourConfig.terrMoveSpeed.x = config.xSpeed;
        parkourConfig.resetTerrFastMoveSpeed();
        parkourConfig.jumpStartSpeed.y = config.ySpeed;
        parkourConfig.addSpeed.y = config.yAddSpeed;
        parkourConfig.maxJumpSpeed.y = config.yMaxSpeed;
        parkourConfig.fastDownSpeed = config.fastDownSpeed;
        parkourConfig.AutoPlayAreaStartX = config.AutoPlayAreaStartX;
        parkourConfig.AutoPlayAreaWidth = config.AutoPlayAreaWidth;
        parkourConfig.AutoPlayMonsterAreaStartX = config.AutoPlayMonsterAreaStartX;
        parkourConfig.AutoPlayTickInterval = config.AutoPlayTickInterval;
    }

    onPauseLogic(){
        this._isPaused = true;
        this._roleLayerComp.setPaused(true);
        this._monsterLayerComp.setPaused(true);
    }

    onResumeLogic(){
        this._isPaused = false;
        this._roleLayerComp.setPaused(false);
        this._monsterLayerComp.setPaused(false);
    }

    //更新道具
    onUpdateItem(...params: any[]) {
        if (!params || params.length <= 1) return;
        let itemType = params[1];
        let itemCount = params[2];
        switch (itemType) {
            case ItemType.REWARD_GOLD:
                this._coin += itemCount;
                this._uiLayerComp.updateCoin(this._coin);
                break;
            case ItemType.REWARD_DIAMNOND:
                this._diamond += itemCount;
                this._uiLayerComp.updateDiamond(this._diamond);
        }
    }

    //更新血量
    onUpdateHp(...params: any[]) {
        if (!params || params.length <= 1) return;

        let comp: RoleLogicComp = params[1];
        let deltaHp: number = params[2];
        let valType: ValueType = params[3] || ValueType.AbsoluteValue;
        let roleInfo = ActorManager.getInstance().getRoleInfo(comp);
        if(valType == ValueType.Percentage){
            deltaHp *= roleInfo.maxHp;
        }
        roleInfo.hp += deltaHp;
        if (roleInfo.hp < 0) {
            roleInfo.hp = 0;
        }
        comp.updateHP(Math.floor(roleInfo.hp / roleInfo.maxHp * 100) / 100);

        if(roleInfo.isDead()){
            //播放死亡动画
            comp.goDie();
            roleInfo.setDeadSortID();
            let comps = ActorManager.getInstance().decRolesSortID(roleInfo, comp);
            this._roleLayerComp.catchUpFrames(comps);
        }

        if(ActorManager.getInstance().isAllRoleDead()){  //所有角色死亡
            eventCenter.fire(parkourEvent.PAUSE_LOGIC);
            !this._isReliveWindowOpen && this.openReliveView();
        }
    }

    //增加buff
    onAddBuff(...params: any[]) {
        if (!params || params.length <= 1) return;
        let comp: RoleLogicComp = params[1];
        let buffType: ParkourBuffType = params[2];
        let time: number = params[3];
        let isOver = params[4];
        let isTeam = params[5];
        //团队buff
        if(isTeam){
            ActorManager.getInstance().addBuff(buffType, time, isOver);
            return;
        }
        let roleInfo = ActorManager.getInstance().getRoleInfo(comp);
        roleInfo.addBuff(buffType, time, isOver);
    }

    //清除buff
    onRemoveBuff(...params: any[]) {
        if (!params || params.length <= 1) return;
        let comp: RoleLogicComp = params[1];
        let buffType: ParkourBuffType = params[2];
        let isTeam = params[3];
        //团队buff
        if(isTeam){
            ActorManager.getInstance().removeBuff(buffType);
            return;
        }
        let roleInfo = ActorManager.getInstance().getRoleInfo(comp);
        roleInfo.removeBuff(buffType);
        comp.removeBuffState(buffType);
    }

    //复活
    onRelive(event: number, isRelive: boolean, ...params: any[]) {
        this._isReliveWindowOpen = false;
        if(!isRelive) return;
        this._roleLayerComp.execRelive(...params);
    }

    //使用技能道具
    onUseItem(...params: any[]) {
        let rolesMap = ActorManager.getInstance().getRoleInfos();

        let itemType = params[1];
        let comp = params[2];
        let itemInfo = params[3];

        //加血道具
        if (itemType === ItemType.USED_BLOOD) {
            let roleInfos = ActorManager.getInstance().getRoleInfos();
            roleInfos.forEach((value, key) => {
                if(key.isDead()) return;
                key.hp += itemInfo;
                key.hp = Math.min(key.hp, key.maxHp);
                value.updateHP(key.hp / key.maxHp)
            });
        }

        //冲刺道具
        if (itemType === ItemType.USED_SKILL) {
            //全部都死了
            if(ActorManager.getInstance().isAllRoleDead()){
                return;
            }
            this._roleLayerComp.execChongCi(itemInfo);
        }

        //强化道具
        if (itemType === ItemType.USED_STRONG) {
            let roleInfos = ActorManager.getInstance().getRoleInfos();
            roleInfos.forEach((value, key) => {
                if(key.isDead()) return;
                key.addBuff(ParkourBuffType.STRONG, itemInfo);
            });
        }
    }

    //相机变换
    onCameraTransform(...params: any[]) {
        if (!params || params.length <= 1) return;
        let pos: cc.Vec2 = params[1];
        this._gameCameraNode.setPosition(pos);
    }

    getGameCamera(): cc.Node{
        return this._gameCameraNode;
    }

    onRelease() {
        audioManager.playMusic(BGM_TYPE.NORMAL);
        this.deInit();
        eventCenter.unregisterAll(this);
        this._isInit = false;
        this.releaseSubView();
        this._roleLayerComp.onRelease();
        this._monsterLayerComp.onRelease();
        this._mapTerrManager.onRelease();
        this._bulletManager.onRelease();
        this._effectLayerComp.onRelease();
        this._itemManager.onRelease();
        this._operateLayerComp.onRelease();
        this._uiLayerComp.onRelease();
        this._mapBgComp.onRelease();
        this._clear();
        effectNodePool.clear();
        parkourItemPoolMananger.release();
        parkourSpineCache.clear();
        ActorManager.getInstance().clear();
        this._releasePreloadRes();
        this._setCollisionEnable(false);
        this._terrData = null;
        this._roleList.length = 0;
        this._roleList = null;
        ParkourScene._ins = null;
        guiManager.setMainCameraClearFlags(cc.Camera.ClearFlags.COLOR | cc.Camera.ClearFlags.DEPTH | cc.Camera.ClearFlags.STENCIL);
    }

    //更新关卡进度
    onUpdateLevelProgress(...params: any[]) {
        if (!params || params.length <= 1) return;
        let currLen: number = params[1];
        let totalLen: number = params[2];
        let _levelProgrss = Math.ceil(currLen * 1000 / totalLen) / 1000;
        if(Math.abs(_levelProgrss - this._levelProgrss) >= 0.001){
            this._levelProgrss = _levelProgrss;
            this._uiLayerComp.updateLevelProgress(this._levelProgrss);
        }
    }

    //显示结算
    onShowResult(...params: any[]) {
        let result = params[1];
        this._currResult = result;
        eventCenter.register(netEvent.NET_CLOSED, this, this._netFail);
        if (operationSvr.disconnected) {
            operationSvr.reconnect();
        }else{
            this._uploadScore();
        }
    }

    private _onNetReconnect(){
         //关卡没结束，不上报
        if(this._currResult == null) return;
        this._uploadScore();
    }

    private _uploadScore(){
        if(this._hasUploaded) return;
        let lessonId = pveData.pveConfig ? pveData.pveConfig.lessonId : pveData.getCurrLessonId();
        pveDataOpt.reqFinishPve(lessonId, this._currResult, this._roleList, this._coin);
    }

    //获取预加载的资源列表
    private _goPreloadRes(){
        this._loadMusicAndEffect(this.stepWork);
        this._loadTerrConfig(this.stepWork);
        this._loadMapTerrs(this.stepWork);
        this._loadMapBgs(this.stepWork);
        this._loadSpineData(this.stepWork);
        this._loadAnimClip(this.stepWork);
    }

    //预加载动画剪辑
    private _loadAnimClip(stepWork: StepWork){
        let resList = lazyLoadRes[ParkourLazyLoadType.AnimClip];
        if(!resList) return;
        for(let k in resList){
            stepWork.addTask((callback: Function) => {
                let path = resList[k];
                let asyncTask = resourceManager.load(path, ParkourLazyLoadMaps[ParkourLazyLoadType.AnimClip], CACHE_MODE.NONE, PRELOAD_PARKOUR_TAG);
                asyncTask.then((data) => {
                    this._animClipCache.addClip(path, data.res);
                    callback && callback();
                });
            });
        }
    }

    //预加载角色spine动画
    private _loadSpineData(stepWork: StepWork){
        if(!this._roleList || this._roleList.length === 0) return;
        let spineDatas: string[] = null;
        this._roleList.forEach(ele => {
            spineDatas = spineDatas || [];
            let model = configUtils.getModelConfig(configUtils.getHeroBasicConfig(ele).HeroBasicModel);
            let modelName = model && model.ModelAttack;    //默认的模型
            if(!model){
                cc.warn('RolePreviewComp', `role ${ele} has not model data!!!`);
                modelName = 'beibo';
            }
            modelName = getParkRoleSpinePath(modelName);
            if(spineDatas.indexOf(modelName) === -1){
                spineDatas.push(modelName);
                this._preloadRes.push(modelName);
            }
        });

        //加载陷阱(目前陷阱使用spine动画制作)
        if(!isNaN(this._currTerrSkin)){
            let modelName = getParkSpineResPath(parkourTrapSprikeCfg[this._currTerrSkin]);
            this._preloadRes.push(modelName);
            spineDatas.push(modelName);
        }
        stepWork.concact(preloadRoleSpines(spineDatas, PRELOAD_PARKOUR_TAG, (data: CacheData) => {
            (data.res as sp.SkeletonData).getRuntimeData();
            parkourSpineCache.addSpineData(data.name, data.res);
        }).stepWork);
    }

    //加载地形配置文件
    private _loadTerrConfig(stepWork: StepWork){
        let terrConfigName: string;
        let pveCfg = pveData.pveConfig;
        if(this.isTest){
            //测试使用的地形配置
            terrConfigName = "lesson";
            this._currTerrSkin = 4;
        }else{
            let lessonCfg = configUtils.getLessonConfig(pveData.getCurrLessonId());
            terrConfigName = lessonCfg.LessonFile;
            this._currTerrSkin = lessonCfg.LessonRunSkin;
            if(pveCfg && (pveCfg.adventureCfg || pveCfg.dailyCfg)){
                terrConfigName = pveCfg.adventureCfg ? pveCfg.adventureCfg.LessonFile :
                                pveCfg.doubleDrop ? pveCfg.dailyCfg.PVEDailyLessonDoubleFile : pveCfg.dailyCfg.PVEDailyLessonFile;
                this._currTerrSkin = pveCfg.adventureCfg ? pveCfg.adventureCfg.LessonRunSkin : pveCfg.dailyCfg.PVEDailyLessonRunSkin;
            }
        }
        terrConfigName = getTerrCfgPath(terrConfigName);
        stepWork.addTask((callback: () => {}) => {
            resourceManager.load(terrConfigName, cc.JsonAsset).then((data)=>{
                let terrConfig = data.res.json;
                for(let key in terrConfig){
                    this._terrData[key] = terrConfig[key];
                }
                resourceManager.release(terrConfigName);
                callback && callback()
            }).catch((err)=>{
                callback && callback();
            });
        });

        //有皮肤的场景，加载皮肤
        if(!isNaN(this._currTerrSkin)){
            stepWork.addTask((callback: () => {}) => { 
                let textureUrl = getTerrSkinPath(this._currTerrSkin);
                resourceManager.load(textureUrl, cc.Texture2D).then((data)=>{
                    terrConfigManager.setCurrTerrsSkin(textureUrl, data.res as cc.Texture2D);
                    callback && callback();
                }).catch((err)=>{
                    callback && callback();
                });
            });
        }
    }

    //加载音频音效
    private _loadMusicAndEffect(stepWork: StepWork){
        let bgmOption = audioManager.getBGMOption(BGM_TYPE.PARKOUR);
        if(audioCache.getAudioClip(bgmOption.url)) return;
        stepWork.addTask((callback: () => {}) => {
            resourceManager.load(bgmOption.url, cc.AudioClip).then((data)=>{
                audioCache.putAudioClip(bgmOption.url, data.res);
                callback && callback();
            });
        });
    }

    //加载背景
    private _loadMapBgs(stepWork: StepWork){
        let currLessonCfg =  configUtils.getLessonConfig(pveData.getCurrLessonId());
        let pveCfg = pveData.pveConfig;
        let mapBgIdx = currLessonCfg.LessonRunBg;
        if (pveCfg && (pveCfg.adventureCfg || pveCfg.dailyCfg)){
            mapBgIdx = pveCfg.adventureCfg ? pveCfg.adventureCfg.LessonRunBg : pveCfg.dailyCfg.PVEDailyLessonRunBg;
        }
        if(this.isTest){
            mapBgIdx = 4;
        }
        let mapBgs = configManager.getConfigByKey('runMapBg', mapBgIdx);
        if(!mapBgs){
            guiManager.showTips(ParkourStrConfig.NoLevelBgConfig);
            return;
        }
        let res:Array<string> = getMapBgRes(mapBgs);
        if(!res || res.length <= 0) return;

        let elem = null;
        for(let i = 0, len = res.length; i < len; i++){
            elem = getMapBgAbsPath(res[i], mapBgIdx);
            res[i] = elem;
        }

        this._preloadRes.splice(this._preloadRes.length, 0, ...res);
        stepWork.concact(preloadScriptIcons(res, PRELOAD_PARKOUR_TAG).stepWork);
    }

    //加载地形
    private _loadMapTerrs(stepWork: StepWork){
        let stepWork1 = new StepWork();
        stepWork1.addTask((callback: () =>{})=> {
            let res: string[] = this._terrData.terrs;
            if(!res || res.length <= 0){
                callback && callback();
                return;
            }
            this._preloadRes.splice(this._preloadRes.length, 0, ...res);

            let innerWork = new StepWork();
            res.forEach(ele => {
                innerWork.addTask((cb: Function) => {
                    resourceManager.load(ele, cc.TiledMapAsset, CACHE_MODE.NONE, PRELOAD_PARKOUR_TAG).then((data) => {
                        terrConfigManager.addTiledMapAssets(ele, data.res);
                        cb && cb();
                    });
                });
            });
            innerWork.start(() => {
                callback && callback();
            })
        });
        stepWork.concact(stepWork1);
    }

    private _releasePreloadRes(){
        if(this._preloadRes.length <= 0) return;
        this._preloadRes.forEach((element) => {
            resourceManager.release(element, CACHE_MODE.NONE, PRELOAD_PARKOUR_TAG);
        })
        this._preloadRes.length = 0;
        this._preloadRes = null;
    }

    private _preloadNodesPools(){
        this.stepWork.concact(preloadParkourItems(parkourItemConfig, PRELOAD_PARKOUR_TAG, (prefabPath: string)=>{
            this._preloadRes.push(prefabPath);
        }));
    }

    private _receieveFinishRes(cmd: any, msg: gamesvr.FinishPveRes){

        if (msg.LessonID) {
            this._hasUploaded = true;
            let viewStr = msg && msg.Past? "GameWinView":"GameLoseView";
            guiManager.loadModuleView(viewStr, msg, 
                ()=> {
                    guiManager.loadScene(SCENE_NAME.MAIN);
                }
            ).then(()=>{
                if (pveData.pveConfig && pveData.pveConfig.userLv && pveData.pveConfig.userLv < userData.lv) {
                    guiManager.showLevelUpView(pveData.pveConfig.userLv).then(() => {
                        eventCenter.fire(useInfoEvent.GAME_EXP_ADD, msg.TotalExp);
                    });
                } else {
                    eventCenter.fire(useInfoEvent.GAME_EXP_ADD, msg.TotalExp);
                }
            });
        }
    }

    //退出游戏
    private _exitGame(){
        guiManager.loadScene(SCENE_NAME.MAIN).then(()=>{
            moduleUIManager.showModuleView();
        });
    }

    private _restartGame(){
        audioManager.stopMusic();
        audioManager.playMusic(BGM_TYPE.PARKOUR);
        guiManager.showGameLoading(() => {
           this.deInit();
        });
        this.scheduleOnce(() => {
            let startPri = 10;
            this.stepWork.addTask((callback: Function) => {
                this._mapBgComp.reBuildIn(() => {
                    callback && callback();
                });
            }, null, startPri--).addTask((callback: Function) => {
                this._mapTerrManager.reBuildIn().then(() => {
                    callback && callback();
                });
            }, null, startPri--).addTask((callback: Function) => {
                this._roleLayerComp.reBuildIn().then(() => {
                    callback && callback();
                });
            }, null, startPri--).addTask((callback: Function) => {
                this._monsterLayerComp.reBuildIn().then(() => {
                  callback && callback();
                });
            }, null, startPri--).concact(this._getStartTask());
            this.stepWork.start(() => {
                guiManager.hideGameLoading();
            });
        }, 0.5);
    }

    //打开菜单
    openMenuView(){
        let lessonId = pveData.pveConfig ? pveData.pveConfig.lessonId : pveData.getCurrLessonId();
        this.loadSubView('ParkourMenuView', lessonId);
    }

    //打开复活
    openReliveView(){
        this._isReliveWindowOpen = true;
        this.loadSubView('ReliveParkourView', this._levelProgrss);
    }

    private _otherLoad(worker: StepWork, resArr: any, type: typeof cc.Asset, cb: Function, mode?: CACHE_MODE, useTag?: string){
      if(!resArr) return;
      for(let k in resArr){
          let path: string = resArr[k];
          worker.addTask((callback: Function) => {
              resourceManager.load(path, type, mode, useTag).then((data)=>{
                  cb && cb(data, path);
                  callback && callback();
              });
          });
      }
    }

    private _getLoadCb(type: ParkourLazyLoadType): (data: CacheData, ...rest: any[]) => void{
        if(type == ParkourLazyLoadType.Sound){
            return (data: CacheData, path: string) => {
                audioCache.putAudioClip(path, data.res);
            };
        }

        if(type == ParkourLazyLoadType.Sprite){
            return (data: CacheData, path: string) => {
                this._cachedSpriteFrames =  this._cachedSpriteFrames || new Map<string, cc.SpriteFrame>();
                if(!this._cachedSpriteFrames.has(path)){
                    this._preloadRes.push(path);
                    this._cachedSpriteFrames.set(path, data.res);
                }
            };
        }

        if(type == ParkourLazyLoadType.AnimClip){
            return (data: CacheData, path: string) => {
                if(!this._animClipCache.getClip(path)){
                    this._preloadRes.push(path);
                    this._animClipCache.addClip(path, data.res);
                }
            };
        }
        return null;
    }

    private _otherLoadWorker(){
        let lazyLoadWork = new StepWork();
        for(let k in lazyLoadRes){
            let res = lazyLoadRes[k];
            let resType = ParkourLazyLoadMaps[k];
            let mode = resType != ParkourLazyLoadType.Sound ? CACHE_MODE.NONE : undefined;
            let tag = resType != ParkourLazyLoadType.Sound ? PRELOAD_PARKOUR_TAG : undefined;
            let cb = this._getLoadCb(parseInt(k));
            this._otherLoad(lazyLoadWork, res, resType, cb, mode, tag);
        }

        //预加载特效节点
        lazyLoadWork.addTask((callback: Function) => {
            effectNodePool.prebuild(() => {
                callback && callback();
            });
        });

        //预加载子弹
        lazyLoadWork.addTask((callback: Function) => {
            bulletPoolManager.prebuild(() => {
                callback && callback();
            });
        });

        return lazyLoadWork;
    }

    getSprite(url: string){
        if(!this._cachedSpriteFrames || this._cachedSpriteFrames.size == 0 || !this._cachedSpriteFrames.has(url)) return null;
        return this._cachedSpriteFrames.get(url);
    }

    private _netFail () {
        guiManager.showMessageBox(this.node, {
            content: "连接已经断开，请重连",
            leftStr: "重 连",
            leftCallback: (msgBox: MessageBoxView) => {
                msgBox.closeView();
                operationSvr.reconnect()
            },
            rightStr: "取 消",
            rightCallback: (msgBox: MessageBoxView) => {
                msgBox.closeView();
            },
        })
    }
}

class AnimClipCache{
    private _clips: Map<string, cc.AnimationClip> = null;

    constructor(){}

    getClip(key: string): cc.AnimationClip{
        if(!this._clips || !this._clips.has(key)) return null;
        return this._clips.get(key);
    }

    addClip(key: string, res: cc.AnimationClip){
        if(!key || key.length == 0 || !res) return;
        if(!this._clips){
            this._clips = new Map<string, cc.AnimationClip>();
        }
        if(this._clips.has(key) && this._clips.get(key)) return;
        this._clips.set(key, res);
    }

    clear(){
        if(this._clips){
            this._clips.clear()
        }
        this._clips = null;
    }
}

export {
    ParkourScene
}
