const {ccclass, property} = cc._decorator;
import {eventCenter} from '../../../common/event/EventCenter';
import {parkourEvent} from '../../../common/event/EventData';
import {GROUPS_OF_NODE, ItemNameSet, parkourConfig, TerrCollisionNodeName, TERR_LAYER, TERR_TYPE, TiledImageNamePrefix} from "./ParkourConst";
import TileMapHelper from './TileMapHelper';
import MapTerrComp from './MapTerrComp';
import { ParkourScene } from '../view-scene/ParkourScene';
import TerrCollisionComp from './terr/TerrCollisionComp';
import { resourceManager } from '../../../common/ResourceManager';
import { parkourItemConfig } from './ParkourItemConfig';
import { parkourItemPoolMananger } from './ItemPoolManager';
import StepWork from '../../../common/step-work/StepWork';
import {scheduleManager} from '../../../common/ScheduleManager';

const MAX_TILED_MAP_COUNT = 3;//最大的地形数量
const MIN_OFFSET_OF_REUSE = 100;    //地形节点复用的最小阈值
const TERR_RECYCLE_TAG = 1; //地形循环的标记

const END_DISTANCE = 200; //终点距离屏幕右边缘的距离， 防止角色到终点掉下去

//地形配置项
interface TerrConfigItem{
    //是否循环，一般有怪物的时候才循环
    recycle?: number
    //地形块的索引
    terrIdx?: number
}

interface RunningTerrConfig{
    //是否循环的地形块(对于循环的地形块，第一次出现都不算循环，后面的出现才算)
    recycle: boolean
    //地形块的索引
    terrIdx: number
}

@ccclass
export default class MapTerrManager extends cc.Component {
    @property(cc.Prefab) mapTerrPrefab: cc.Prefab = null;   //地形组件的预制体

    private _terrConfig: any = null;    //关卡的地形配置
    private _terrResSet: string[] = null;   //当前关卡的地形set集合
    private _terrResList: TerrConfigItem[] = null;  //当前关卡的地形序列
    private _monsterConfigs: any = null;  //怪物配置

    private _terrList: Array<cc.TiledMap> = null;   //关卡的所有地形块
    private _terrListConfigs: Array<RunningTerrConfig> = null;//关卡的所有地形块对应的配置
    private _terrLen: number = 0;   //地形的总长度
    private _isFinished: boolean = false;
    private _isMoveable: boolean = false;    //是否可移动
    private _moveSpeed: cc.Vec2 = null;
    private _startPos: cc.Vec2 = null; //用来记录地形开始位置，方便调整角色的位置
    private _movedDis: number = 0; //已经移动的距离
    private _isPaused: boolean = false; //是否暂停
    private _currTerrIdx = -1;  //最近使用的地形索引
    private _currFrameMoveDis: number = 0; //当前帧的移动距离
    private _lastBossWarnTerrIdx: number = NaN;//最近一次发生boss警告的地形索引

    private _currBuildTerrIdx = -1;
    private _currBuildCount = 0;

    private _currKeyIndex: number = -1;
    private _currKeyCursor: number = -1;
    private _isBuilding: boolean = false;
    private _terrCountConfig: Map<number, number> = null;
    private _tiledMapPathArr: number[] = null;
    private _totalFrames: number = -1;
    private _currFrame: number = 0;

    private _isInit: boolean = false;


    set startPos(pos: cc.Vec2){
        this._startPos = pos;
    }

    get startPos(): cc.Vec2{
        return this._startPos;
    }

    getMoveSpeedX(): number{
        return this._moveSpeed ? this._moveSpeed.x : 0;
    }

    onInit(){
        this._isFinished = false;
        this._init();
    }

    private _init(){
        if(this._isInit) return;
        this._isInit = true;
        this.initEvents();
    }

    deInit(){
        this._isMoveable = false;
        this.unschedule(this._splitLoadTerrNode);
        this.unschedule(this._splitBuildTerrNode);
        this.unschedule(this._buildTerrFinish);
        this._terrListConfigs && (this._terrListConfigs.length = 0);
        this._recycleReMainNodes();
        this._currTerrIdx = -1;
        this._currFrameMoveDis = 0;
        this._isPaused = false;
        this._lastBossWarnTerrIdx = NaN;
        this._currBuildTerrIdx = -1;
        this._currBuildCount = 0;
        this._terrLen = 0;
        this._movedDis = 0;
        this._isBuilding = false;
    }

    //回收残余节点
    private _recycleReMainNodes(){
        if(this._terrList){
            this._terrList.forEach(ele => {
                let mapTerrComp = ele.node.getComponent(MapTerrComp);
                mapTerrComp.deInit();
                mapTerrCacheManager.putTerrNode(mapTerrComp.terrFile, ele.node);
            });
            this._terrList.length = 0;
        }
    }

    onRelease(){
        eventCenter.unregisterAll(this);
        this._isInit = false;
        this._clear();
        mapTerrCacheManager.clearAll();
        terrConfigManager.clear();
        terrCollisionNodePool.clear();
    }

    private initEvents(){
        eventCenter.register(parkourEvent.MAP_FAST_MOVE, this, this.onTerrFastMove);
        eventCenter.register(parkourEvent.MAP_STOP_MOVE, this, this.onTerrStopMove);
        eventCenter.register(parkourEvent.MAP_NORMAL_MOVE, this, this.onTerrNormalMove);
        eventCenter.register(parkourEvent.ACTOR_ENTER_FINISH, this, this.onActorEnterFinish);
        eventCenter.register(parkourEvent.PAUSE_LOGIC, this, this.onPauseLogic);
        eventCenter.register(parkourEvent.RESUME_LOGIC, this, this.onResumeLogic);
    }

    onPauseLogic(){
        this._isPaused = true;
    }

    onResumeLogic(){
        this._isPaused = false;
    }

    private _initData(params: any){
        this._terrConfig = params;
        this._terrResSet = (this._terrConfig.terrs as Array<string>);
        this._terrResList = (this._terrConfig.terrCfg as Array<TerrConfigItem>);
        this._monsterConfigs = this._terrConfig.monsterCfg;
        this._terrList  = this._terrList || [];
        this._terrListConfigs = this._terrListConfigs || [];
    }

    //获取每种地形的最大可能出现次数,最多同时${MAX_TILED_MAP_COUNT}次数
    private _getEveryTerrMaxCount(terrList: TerrConfigItem[]){
        let terrCountMap: Map<number, number> = new Map<number, number>();
        if(terrList.length < MAX_TILED_MAP_COUNT){
            for(let i = 0, len = terrList.length; i < len; i++){
                let config = terrList[i];
                let addCount = config.recycle == TERR_RECYCLE_TAG ? MAX_TILED_MAP_COUNT : 1;
                if(terrCountMap.has(config.terrIdx)){
                    let count = terrCountMap.get(config.terrIdx);
                    terrCountMap.set(config.terrIdx, Math.min(count + addCount, MAX_TILED_MAP_COUNT));
                }else{
                    terrCountMap.set(config.terrIdx,  addCount);
                }
            }
            return terrCountMap;
        }
        for(let i = 0, len = terrList.length - MAX_TILED_MAP_COUNT; i <= len; i++){
            //最后一次要算后面剩余的元素
            if(i == len){
                let tempCount: Map<number, number> = new Map<number, number>();
                for(let k = i; k < terrList.length; k++){
                    let config = terrList[k];
                    let count = tempCount.has(config.terrIdx) ? tempCount.get(config.terrIdx) : 0
                    count += config.recycle == TERR_RECYCLE_TAG ? MAX_TILED_MAP_COUNT : 1;
                    count =  Math.min(count, MAX_TILED_MAP_COUNT);
                    tempCount.set(config.terrIdx, count);
                }
                tempCount.forEach((elem, idx) => {
                    terrCountMap.set(idx, Math.max(elem, terrCountMap.has(idx) ? terrCountMap.get(idx) : 0));
                });
                break;
            }

            let config = terrList[i];
            if(terrCountMap.has(config.terrIdx) && terrCountMap.get(config.terrIdx) >= MAX_TILED_MAP_COUNT) continue;
            let oldCount = terrCountMap.has(config.terrIdx) ? terrCountMap.get(config.terrIdx) : 0;
            let count = config.recycle == TERR_RECYCLE_TAG ? MAX_TILED_MAP_COUNT : 1;
            if(count < MAX_TILED_MAP_COUNT){
              for(let j = 1; j < MAX_TILED_MAP_COUNT; j++){
                if(terrList[i + j].terrIdx === config.terrIdx){
                    count++;
                }
              }
            }

            count = Math.max(count, oldCount);
            count = Math.min(count, MAX_TILED_MAP_COUNT);
            terrCountMap.set(config.terrIdx, count);
        }
        return terrCountMap;
    }

    //获取当前帧的移动距离
    getCurrFrameMoveDis(): number{
        return this._currFrameMoveDis;
    }

    //实例化地形节点，并对地形文件进行解析和缓存
    private _loadTerrNode(terrPath: string, isInitTerr: boolean){
        if(!terrPath || terrPath.length === 0) return;
        let node = cc.instantiate(this.mapTerrPrefab);
        //实例化的地形节点为何要立即放到场景树
        // node.parent = this.node;
        node.getComponent(cc.TiledMap).tmxAsset = terrConfigManager.getTiledMapAssets(terrPath);
        terrConfigManager.addTiledMapLen(terrPath, node.width);
        node.getComponent(MapTerrComp).initShadeLayer(terrPath);
        isInitTerr && node.getComponent(MapTerrComp).onInit(terrPath, false);
        node.getComponent(MapTerrComp).setLayerConfig(terrPath);
        mapTerrCacheManager.putTerrNode(terrPath, node);
    }

    //分帧加载地形节点
    private _splitLoadTerrNode(resolve: Function, reject: Function){
        if(!this._terrCountConfig || this._terrCountConfig.size === 0) {
            this.unschedule(this._splitLoadTerrNode);
            this._isBuilding = false;
        }
        if(!this._isBuilding) {
            resolve(null);
            return;
        }
        this._currKeyIndex === -1 && (this._currKeyIndex = 0);
        this._currKeyCursor += 1;
        this._currFrame += 1;
        if(this._currFrame > this._totalFrames){
            //进行下一个阶段(添加地形中的道具，陷阱等元素)
            this._currFrame = -1;
            this._totalFrames = -1;
            this._currKeyCursor = -1;
            this._currKeyIndex = -1;

            let preBuildCount = Math.min(this._terrResList.length, MAX_TILED_MAP_COUNT);
            for(let i = 0 ; i < preBuildCount; i++){
                let config = this._terrResList[i];
                //怪物没有全部死亡的时候，需要进行地形循环，因此需要创建${MAX_TILED_MAP_COUNT}个地形块
                if(config.recycle == TERR_RECYCLE_TAG && this._isRecycleValid()){
                    preBuildCount = MAX_TILED_MAP_COUNT;
                    break;
                }
            }
            this._currBuildCount = preBuildCount;
            this.unschedule(this._splitLoadTerrNode);
            this.schedule(this._splitBuildTerrNode.bind(this, resolve, reject), 0,preBuildCount, 0);
        }else{
            let currCount = this._terrCountConfig.get(this._tiledMapPathArr[this._currKeyIndex]);
            if(this._currKeyCursor >= currCount){
                this._currKeyCursor = 0;
                this._currKeyIndex += 1;
            }
            let terrPath = this._terrResSet[this._tiledMapPathArr[this._currKeyIndex]];
            this._loadTerrNode(terrPath, this._currKeyCursor === 0);
        }
    }

    //分帧构建地形节点
    private _splitBuildTerrNode(resolve: Function, reject: Function){
        if(!this._isBuilding) {
            resolve(null);
            return;
        }

        this._currBuildTerrIdx += 1;
        if(this._currBuildTerrIdx >= this._currBuildCount){
            //地形构建完成，进行下一步
            this._currBuildTerrIdx = -1;
            this._currBuildCount = 0;
            this.unschedule(this._splitBuildTerrNode);
            this.scheduleOnce(this._buildTerrFinish.bind(this, resolve, reject), 0);
        }else{
            //检查构建的地形是否要使用循环地形
            let config = this._terrResList[this._currTerrIdx];
            let monsterConfig = null;
            if(!config || config.recycle != TERR_RECYCLE_TAG || !this._isRecycleValid()){
                this._currTerrIdx += 1;
                //地形配置的指针移动时，检查当前地形是否配有怪物
                if(this._monsterConfigs && this._monsterConfigs[`${this._currTerrIdx}`]){
                    monsterConfig =  this._monsterConfigs[`${this._currTerrIdx}`];
                }
                config = this._terrResList[this._currTerrIdx];
                this._terrListConfigs.push({terrIdx: this._currTerrIdx, recycle: false});
            }else{
                this._terrListConfigs.push({terrIdx: this._currTerrIdx, recycle: true});
            }
            let terrPath = this._terrResSet[config.terrIdx];
            let terrNode = mapTerrCacheManager.getTerrNode(terrPath);

            //配置有怪物的时候, 设置将要生成的怪物
            monsterConfig && (monsterConfig as Array<any>).length > 0
                && ParkourScene.getInstance().getMonsterLayerComp().addPrebuildMonsterConfig(terrNode, monsterConfig);

            terrNode.name = `${this._currTerrIdx}`;
            if( mapTerrCacheManager.isUseNodePool()){
                terrNode.setPosition(cc.v2());
                terrNode.parent = this.node;
            }
            terrNode.getComponent(MapTerrComp).onInit(terrPath, true);
            this._terrList.push(terrNode.getComponent(cc.TiledMap));
        }
    }

    private _buildTerrFinish(resolve: Function, reject: Function){
        if(!this._isBuilding){
            resolve(null);
            return;
        }
        this._terrResList.forEach((elem) => {
            let terrPath = this._terrResSet[elem.terrIdx];
            this._terrLen += terrConfigManager.getTiledMapLen(terrPath);
        });

        //总关卡长度减去已经出现的部分地形长度
        this._terrLen -= (cc.winSize.width + END_DISTANCE);
        let currPosX = 0;
        let currPosY = 0;
        this._terrList.forEach((elem, idx) => {
            elem.node.x = currPosX;
            elem.node.y = currPosY;
            currPosX += elem.node.width;
        });
        this.getStartPos();
        this._isBuilding = false;
        resolve(null);
    }

    //构建地形
    buildLayer(params: any): Promise<any>{
        this._initData(params);
        if(this._isBuilding || !this._terrResSet || this._terrResSet.length <= 0 
            ||!this._terrResList || this._terrResList.length <= 0) return Promise.resolve(null);
        this._isBuilding = true;
        return new Promise((resolve, reject) => {
                this._terrCountConfig = this._getEveryTerrMaxCount(this._terrResList);
                let count = 0;
                this._tiledMapPathArr = this._tiledMapPathArr || [];
                this._terrCountConfig.forEach((ele, idx) => {
                    this._tiledMapPathArr.push(idx);
                    count += ele;
                });
                if(count == 0){
                    cc.error("关卡地图配置异常====", JSON.stringify(this._terrConfig), JSON.stringify(this._terrCountConfig));
                    this._isBuilding = false;
                    resolve(null);
                    return;
                }
                this._totalFrames = count;
                this.schedule(this._splitLoadTerrNode.bind(this, resolve, reject), 0, count, 0);
        });
    }

    //重构地形
    reBuildIn(): Promise<any>{
        if(this._isBuilding || !this._terrResSet || this._terrResSet.length <= 0 ||!this._terrResList || this._terrResList.length <= 0) return Promise.resolve(true);
        return new Promise((resolve, reject) => {
            let preBuildCount = Math.min(this._terrResList.length, MAX_TILED_MAP_COUNT);
            for(let i = 0, len = this._terrResList.length; i < MAX_TILED_MAP_COUNT && i < len; i++){
                let config = this._terrResList[i];
                if(config.recycle == TERR_RECYCLE_TAG && this._isRecycleValid()){
                    preBuildCount = MAX_TILED_MAP_COUNT;
                    break;
                }
            }
            this._currBuildCount = preBuildCount;
            this._isBuilding = true;
            this.schedule(this._splitBuildTerrNode.bind(this, resolve, reject), 0, preBuildCount, 0);
        });
    }

    //清除缓存
    private _clear(){
        this._terrConfig = null;
        this._startPos = null;
        this._movedDis = 0;
        this._terrList && (this._terrList.length = 0);
        this._terrList = null;
        this._terrListConfigs && (this._terrListConfigs.length = 0);
        this._terrListConfigs = null;
        this._terrResList = null;
        this._terrResSet = null;
        this._monsterConfigs = null;
        this._currTerrIdx = -1;
        this._currBuildTerrIdx = -1;
        this._currBuildCount = 0;
        this._currKeyIndex = -1;
        this._currKeyCursor = -1;
        this._isBuilding = false;
        this._lastBossWarnTerrIdx = NaN;
        this._terrCountConfig && this._terrCountConfig.clear();
        this._terrCountConfig = null;
        this._tiledMapPathArr && (this._tiledMapPathArr.length = 0);
        this._tiledMapPathArr = null;
        this._totalFrames = -1;
        this._currFrame = 0;
        this._moveSpeed = null;
    }

    //地图快速移动
    onTerrFastMove(){
        this._isMoveable = true;
        this._moveSpeed = parkourConfig.terrFastMoveSpeed;
    }

    //地图停止
    onTerrStopMove(){
        this._isMoveable = false;
    }

    //地形正常移动
    onTerrNormalMove() {
        this._isMoveable = true;
        this._moveSpeed = parkourConfig.terrMoveSpeed;
    }

    //角色进入场景
    onActorEnterFinish() {
        this._isMoveable = true;
        this._moveSpeed = parkourConfig.terrMoveSpeed;
    }

    update (dt: number){
        this._currFrameMoveDis = 0;
        if(this._isPaused) return;
        if(!this._isMoveable) return;
        if(this._isFinished) return;

        let isNeedReuse = false;
        let needWarn = false;
        let isRunningRecycleTerr = false;
        this._currFrameMoveDis = this._moveSpeed.x * dt;
        this._terrList.forEach((tiledMap: cc.TiledMap, idx: number) => {
            let node = tiledMap.node;
            let maxPosX = node.x + node.width;
            if(maxPosX < -MIN_OFFSET_OF_REUSE){
                if(!isNeedReuse && this._currTerrIdx < this._terrResList.length - 1) {
                    isNeedReuse = true;
                }
            }else{
                node.x -= this._currFrameMoveDis;
            }
            if(!this._isFinished && parseInt(node.name) == this._terrResList.length - 1 && node.x <= cc.winSize.width - node.width + END_DISTANCE){
                this._isFinished = true;
            }

            //计算当前是否正在循环地形，是的话，则不算进度
            if(!isRunningRecycleTerr && this._terrListConfigs[idx].recycle && node.x < cc.winSize.width && maxPosX >= cc.winSize.width){
                isRunningRecycleTerr = true;
            }

            //计算是否需要boss出现的告警
            if(idx !=  this._terrList.length -1 && !this._terrListConfigs[idx + 1].recycle
              && this._terrListConfigs[idx].terrIdx != this._lastBossWarnTerrIdx && Math.max(node.x, 0) < Math.min(cc.winSize.width, maxPosX)
              && ParkourScene.getInstance().getMonsterLayerComp().checkNodeContainBoss(this._terrList[idx +1].node) ){
                  this._lastBossWarnTerrIdx = this._terrListConfigs[idx].terrIdx;
                  needWarn = true;
            }
        }, this);

        //显示警告
        if(needWarn){
            ParkourScene.getInstance().getUILayerComp().showWarnView();
        }

        //检查怪物出场
        ParkourScene.getInstance().getMonsterLayerComp().checkMonsterAppear();
        if(isNeedReuse){
            let config = this._terrResList[this._currTerrIdx];
            if(!config) {
                cc.warn('地形切换异常=================', this._terrResSet, this._terrResList, this._currTerrIdx);
                return
            };
            let monsterConfig = null;
            let lastTerrIdx = this._currTerrIdx;
            if(config && config.recycle == TERR_RECYCLE_TAG && this._isRecycleValid()){
                //循环使用地图
            }else{
                this._currTerrIdx += 1;
                //检查当前地形是否配置有怪物
                if(this._monsterConfigs && this._monsterConfigs[`${this._currTerrIdx}`]){
                    monsterConfig =  this._monsterConfigs[`${this._currTerrIdx}`];
                }
            }

            if(this._currTerrIdx < this._terrResList.length){
                let tiledMap = this._terrList.shift();
                let terrFile = tiledMap.node.getComponent(MapTerrComp).terrFile;
                tiledMap.node.getComponent(MapTerrComp).deInit();
                mapTerrCacheManager.putTerrNode(terrFile, tiledMap.node);
                let lastNode = this._terrList[this._terrList.length - 1].node;
                let config = this._terrResList[this._currTerrIdx];
                let tileMapPath: string = this._terrResSet[config.terrIdx];
                let terrNode = mapTerrCacheManager.getTerrNode(tileMapPath);
                let pos = cc.v2(lastNode.x + lastNode.width, 0);
                terrNode.setPosition(pos);
                mapTerrCacheManager.isUseNodePool() && (terrNode.parent = this.node);
                terrNode.name = `${this._currTerrIdx}`;
                terrNode.getComponent(MapTerrComp).onInit(tileMapPath, true, true);
                this._terrList.push(terrNode.getComponent(cc.TiledMap));
                //需要种怪的地形
                if(monsterConfig){
                    ParkourScene.getInstance().getMonsterLayerComp().addPrebuildMonsterConfig(terrNode, monsterConfig);
                }

                //更新地形块对应的配置
                let tileConfg  = this._terrListConfigs.shift();
                tileConfg.terrIdx = this._currTerrIdx;
                tileConfg.recycle = (lastTerrIdx == this._currTerrIdx);
                this._terrListConfigs.push(tileConfg);
            }
        }
        //构建怪物
        ParkourScene.getInstance().getMonsterLayerComp().generateMonster();
        !isRunningRecycleTerr && (this._movedDis += this._currFrameMoveDis);
        if(this._isFinished){
            this._movedDis = this._terrLen;
            eventCenter.fire(parkourEvent.LEVEL_FINISH);
        }

        eventCenter.fire(parkourEvent.UPDATE_LEVEL_PROGRESS, this._movedDis, this._terrLen);
    }

    getStartPos(){
        if(!this._terrList && this._terrList.length <= 0) return;
        let firstNode = this._terrList[0];
        TileMapHelper.findTiledTile(TERR_LAYER.SHADE, firstNode, "shade", this, this.onHandleStartPos);
    }

    onHandleStartPos( layer: cc.TiledLayer, gid: number, colIdx: number, rowIdx: number): boolean{
        if(gid != 0){
            this._startPos = layer.node.convertToWorldSpaceAR(layer.getPositionAt(colIdx, rowIdx).add(cc.v2(0, layer.getMapTileSize().height)));
            eventCenter.fire(parkourEvent.MAP_INIT_FINISH, this._startPos);
            return false;
        }
        return true;
    }

    //当前循环地形的使用是否有效，暂时放在这里，后面需要根据当前地形的怪物状态来决定
    private _isRecycleValid(): boolean {
        return !ParkourScene.getInstance().getMonsterLayerComp().isAllMonsterDead();
    }

    // lateUpdate(dt: number){
    //     if(this._isPaused) return;
    //     if(!this._isMoveable) return;
    //     if(this._isFinished) return;
    //     if(ParkourScene.getInstance().getMonsterLayerComp().hasActiveMonster()) return;
    //     // this._rebuildTerrWhenAllMonsterDead();
    // }

    private _rebuildTerrWhenAllMonsterDead(){
        let startIdx = -1;
        let len = this._terrList.length;
        for(let i = len - 1; i >= 0; i--){
            let node = this._terrList[i].node;
            if(node.x > cc.winSize.width) continue;
            if(node.x < cc.winSize.width && node.x + node.width > cc.winSize.width){
                startIdx = i;
                break;
            }
        }

        if(startIdx == -1 || startIdx == (len - 1)) return;
        //当前的跟下一个不是同一个地形块配置，一定不是循环地形

        let delTerrIdx = -1;
        if(this._terrListConfigs[startIdx + 1].terrIdx != this._terrListConfigs[startIdx].terrIdx) return;
        for(let i = startIdx + 1; i < len; i++){
            let nextConfig = this._terrListConfigs[i];
            if(nextConfig.terrIdx != this._terrListConfigs[startIdx].terrIdx){
                break;
            }
            //需要移除地形块，并且补充新的地形块
            if(!nextConfig.recycle) break;

            //删除当前重复地形，并追加新的地形，新的地形要通过地形队列中的地形配置来决定追加的地形索引和地形的配置情况
            let tiledMap = this._terrList[i];
            let terrFile = tiledMap.node.getComponent(MapTerrComp).terrFile;
            tiledMap.node.getComponent(MapTerrComp).deInit();
            this._terrList.splice(i, 1);
            mapTerrCacheManager.putTerrNode(terrFile, tiledMap.node);
            delTerrIdx = this._terrListConfigs[i].terrIdx;
            this._terrListConfigs.splice(i, 1);
            i -= 1;
            len -= 1;
        }

        if(this._currTerrIdx == delTerrIdx){
           this._currTerrIdx ++;
        }

        if(this._currTerrIdx != delTerrIdx && !this._terrResList[this._currTerrIdx].recycle){
          this._currTerrIdx ++;
        }

        while(this._terrList.length < MAX_TILED_MAP_COUNT && this._terrResList.length){
            let config = this._terrResList[this._currTerrIdx];
            let tileMapPath: string = this._terrResSet[config.terrIdx];
            let terrNode = mapTerrCacheManager.getTerrNode(tileMapPath);
            let lastNode = this._terrList[this._terrList.length - 1].node;
            let pos = cc.v2(lastNode.x + lastNode.width, 0);
            terrNode.setPosition(pos);
            mapTerrCacheManager.isUseNodePool() && (terrNode.parent = this.node);
            terrNode.name = `${this._currTerrIdx}`;
            terrNode.getComponent(MapTerrComp).onInit(tileMapPath, true, true);
            this._terrList.push(terrNode.getComponent(cc.TiledMap));
            let isRecycle: boolean = (config.recycle == TERR_RECYCLE_TAG && config.terrIdx == this._terrListConfigs[this._terrListConfigs.length - 1].terrIdx);
            let terrConfig = {
              terrIdx: this._currTerrIdx,
              recycle: isRecycle
            };
            this._terrListConfigs.push(terrConfig);
            let monsterConfig = null;
            if(this._monsterConfigs && this._monsterConfigs[`${this._currTerrIdx}`] && !isRecycle){
                monsterConfig =  this._monsterConfigs[`${this._currTerrIdx}`];
                ParkourScene.getInstance().getMonsterLayerComp().addPrebuildMonsterConfig(terrNode, monsterConfig);
            }

            if(this._terrList.length < MAX_TILED_MAP_COUNT && !isRecycle){
                this._currTerrIdx++;
            }
        }
    }

    //获取指定区域的道具和陷阱的权重值
    getItemAndTrapWeight(): number[]{
        if(!this._terrList) return null;
        let weightArr: number[] =  parkourConfig.AutoPlayWeightArr.slice(0);
        this._terrList.forEach(ele => {
            let pos = ele.node.parent.convertToWorldSpaceAR(ele.node.getPosition());
            if(Math.max(pos.x, parkourConfig.AutoPlayAreas[1].xMin) < Math.min(pos.x + ele.node.width, parkourConfig.AutoPlayAreas[1].xMax)){
                ele.node.children.forEach((child) => {
                    if(ItemNameSet.has(child.name)){
                        let childPos = child.parent.convertToWorldSpaceAR(child.getPosition());
                        for(let i = 0, len = parkourConfig.AutoPlayAreas.length; i < len; i++){
                            if(parkourConfig.AutoPlayAreas[i].contains(childPos)){
                                let comp = child.getComponent(child.name);
                                if(comp && comp.getWeight){
                                    weightArr[i] += comp.getWeight();
                                }else{
                                    cc.warn(`道具层统计权重异常，${child.name}节点没有对应的组件！！！`);
                                }
                                break;
                            }
                        }

                    }
                });
            }
        });
        return weightArr;
    }

    /**
     * 获取一个世界坐标系下的点所在的地形块
     * @param point
     * @returns
     */
    private _getMapTerrContainPoint(point: cc.Vec2): MapTerrComp{
        if(!this._terrList) return null;
        for(let i = 0, len = this._terrList.length; i < len; i++){
            let tiledMapComp = this._terrList[i];
            let boundBox = tiledMapComp.node.getBoundingBoxToWorld();
            if(boundBox.contains(point)){
                return tiledMapComp.node.getComponent(MapTerrComp);
            }
        }
        return null;
    }

    getNearestPosInShadeLayer(point: cc.Vec2): any{
        let mapTerrComp = this._getMapTerrContainPoint(point);
        if(!mapTerrComp) return null;
        let tiledPos = mapTerrComp.getTilePositionWithPixel(point);
        if(tiledPos.x < 0 || tiledPos.y < 0) return null;
        let target = mapTerrComp.getNearestShadeLayerPos(tiledPos);
        return target;
    }
}

interface TiledInfo{
    x: number;
    y: number;
    gid: number;
}

interface TiledLayerInfo{
    gids: TiledInfo[];
    statisInfo?: Map<number, number>
}

/**
 *  跑酷地形TiledMap中Shade层地形节点的配置, 便于同一类型(平地，上坡或者下坡)相连的地形节点，合并为同一个碰撞节点
 */
interface TiledShadeInfo{
    startTileInfo: TiledInfo,
    type: TERR_TYPE,
    len: number
}

class TerrConfigManager{
    private _currSkinName: string = null;
    private _currSkinTexture: cc.Texture2D = null;
    private _terrConfigs: Map<string, Map<string, TiledLayerInfo>> = null;
    private _terrAssets: Map<string, cc.TiledMapAsset> = new Map<string, cc.TiledMapAsset>();
    private _terrLenConfig: Map<string, number> = new Map<string, number>();
    private _terrShadeLayerCfg: Map<string, TiledShadeInfo[]> = new Map<string, TiledShadeInfo[]>();

    clear(){
        if(this._terrConfigs){
            this._terrConfigs.forEach((value, key) => {
                value.forEach((value1, key1) => {
                    if(value1.gids){
                        value1.gids.length = 0
                        value1.gids = null;
                    }

                    if(value1.statisInfo){
                        value1.statisInfo.clear();
                        value1.statisInfo = null;
                    }
                    value.set(key1, null);
                });
                value.clear();
                this._terrConfigs.set(key, null);
            });
            this._terrConfigs.clear();
        }
        this._terrConfigs = null;

        if(this._terrShadeLayerCfg){
            this._terrShadeLayerCfg.forEach((value, key)=>{
                value && ( value.length = 0);
                this._terrShadeLayerCfg.set(key, null);
            });
            this._terrShadeLayerCfg.clear();
        }
        this._terrShadeLayerCfg =  null;

        this._terrAssets.clear();
        this._terrAssets = null;

        this._terrLenConfig.clear();
        this._terrLenConfig = null;

        cc.isValid(this._currSkinTexture) && resourceManager.release(this._currSkinName);
        this._currSkinName = null;
    }

    private _init(){
        this._terrConfigs = this._terrConfigs || new Map<string, Map<string, TiledLayerInfo>>();
        this._terrAssets =  this._terrAssets || new Map<string, cc.TiledMapAsset>();
        this._terrLenConfig = this._terrLenConfig  || new Map<string, number>();
        this._terrShadeLayerCfg = this._terrShadeLayerCfg || new Map<string, TiledShadeInfo[]>();
    }

    //获取某个地图文件的配置
    getConfig(mapKey: string, layerName: string): TiledLayerInfo{
        this._init();
        if(!this._terrConfigs.has(mapKey)) return null;
        let mapConfigs = this._terrConfigs.get(mapKey);
        if(!mapConfigs || !mapConfigs.has(layerName)) return null;
        return mapConfigs.get(layerName);
    }

    getConfigByMapKey(mapKey: string): Map<string, TiledLayerInfo>{
        this._init();
        if(!this._terrConfigs.has(mapKey)) return null;
        return this._terrConfigs.get(mapKey);
    }

    getTiledMapAssets(key: string): cc.TiledMapAsset{
        this._init();
        if(this._terrAssets.size == 0 || !this._terrAssets.has(key)) return null;
        return this._terrAssets.get(key);
    }

    addTiledMapAssets(key: string, value: cc.TiledMapAsset){
        this._init();
        if(this._terrAssets.has(key)) return;
        //给地形设置新皮肤
        if(this._currSkinName && this._currSkinName.length > 0  && cc.isValid(this._currSkinTexture)){
          let newTexName = `${this._currSkinName.substring(this._currSkinName.lastIndexOf('/') + 1)}`;
          //@ts-ignore
          value.tmxXmlStr = (value.tmxXmlStr as string).replace(eval(`/${TiledImageNamePrefix}[0-9]*.png/g`), `${newTexName}.png`);
          //@ts-ignore
          value.tmxXmlStr = (value.tmxXmlStr as string).replace(eval(`/${TiledImageNamePrefix}[0-9]*.tsx/g`), `${newTexName}.tsx`);
          let textureNames: string[] = value.textureNames;
          let textures: cc.Texture2D[] = value.textures;
          //@ts-ignore
          let tsxFileNames: string[] = value.tsxFileNames;
          //@ts-ignore
          let tsxFiles: cc.TextAsset[] = value.tsxFiles;
          for(let i = 0, len = textureNames.length; i < len; i++){
              let textureName = textureNames[i];
              let matchs = textureName.match(eval(`/${TiledImageNamePrefix}[0-9]*.png$/g`));
              if(matchs && matchs.length > 0){
                  textureNames[i] && (textureNames[i] = textureName.replace(eval(`/${TiledImageNamePrefix}[0-9]*.png$/g`), `${newTexName}.png`));
                  let oldTexture = textures[i];
                  textures[i] = this._currSkinTexture;
                  this._currSkinTexture.addRef();
                  oldTexture.decRef();
                  break;
              }
          }

          for(let i = 0, len = tsxFileNames.length; i < len; i++){
              let filename = tsxFileNames[i];
              let matchs = filename.match(eval(`/${TiledImageNamePrefix}[0-9]*.tsx$/g`));
              if(matchs && matchs.length > 0){
                  tsxFileNames[i] && (tsxFileNames[i] = tsxFileNames[i].replace(eval(`/${TiledImageNamePrefix}[0-9]*.tsx$/g`), `${newTexName}.tsx`));
                  tsxFiles[i] && (tsxFiles[i].text = tsxFiles[i].text.replace(eval(`/${TiledImageNamePrefix}[0-9]*/g`), newTexName));
              }
          }
        }
        this._terrAssets.set(key, value);
    }

    addTiledShadeCfg(key: string, value: TiledShadeInfo){
        if(!key || key.length === 0 || !value) return;
        this._init();
        if(!this._terrShadeLayerCfg.has(key)){
            this._terrShadeLayerCfg.set(key, []);
        }
        let shadeCfg = this._terrShadeLayerCfg.get(key);
        shadeCfg.push(value);
    }

    getTiledShadeCfg(key: string): TiledShadeInfo[]{
        this._init();
        if(!this._terrShadeLayerCfg.has(key)) return null;
        return this._terrShadeLayerCfg.get(key);
    }

    //设置某个地形的长度
    addTiledMapLen(key: string, len: number){
        this._init();
        if(this._terrLenConfig.has(key) && this._terrLenConfig.get(key) > 0) return;
        this._terrLenConfig.set(key, len);
    }

    getTiledMapLen(key: string): number{
        this._init();
        if(!this._terrLenConfig.has(key)) return 0;
        return this._terrLenConfig.get(key);
    }

    //将地图的某个图层配置加入缓存
    addConfig(mapKey: string, layerName: string, layerInfo: TiledLayerInfo){
        if(!mapKey || !layerName || !layerInfo || !layerInfo.gids || layerInfo.gids.length == 0) return;
        this._init();
        if(!this._terrConfigs.has(mapKey)){
            this._terrConfigs.set(mapKey, new Map<string, TiledLayerInfo>());
        }
        let mapLayerConfigs = this._terrConfigs.get(mapKey);
        mapLayerConfigs.set(layerName, layerInfo);
    }

    //检查地形的对应图层信息是否已经缓存
    containLayer(mapKey: string, layerName: string): boolean{
        this._init();
        if(this._terrConfigs.size === 0 || !this._terrConfigs.has(mapKey)) return false;
        let layerConfigs = this._terrConfigs.get(mapKey);
        if(!layerConfigs || layerConfigs.size == 0 || !layerConfigs.has(layerName)) return false;
        let layerInfo = layerConfigs.get(layerName);
        if(!layerInfo) return false;
        return true;
    }

    //设置当前关卡中地形的皮肤名称和对应的纹理
    setCurrTerrsSkin(skinName: string, skinTexture: cc.Texture2D){
        if(!skinName || skinName.length == 0 || !cc.isValid(skinTexture)) return;
        this._currSkinName = skinName;
        this._currSkinTexture = skinTexture;
    }
}

const terrConfigManager = new TerrConfigManager();
const FreeTerrNodePos = cc.v2(5000, 10000);//闲置地形的存放位置

class MapTerrCacheManager{
    private _isUsedNodePool: boolean = true; //尽量不要使用对象池进行地形节点的缓存，因为对象池涉及到TMX文件的重新解析，效率非常低，掉帧严重，从而引起其他一系列的问题
    private _cache: Map<string, cc.NodePool> = null;
    private _cache2: Map<string, cc.Node[]> = null;

    isUseNodePool(): boolean{
        return this._isUsedNodePool
    }

    clearByKey(key: string){
        if(!this._isUsedNodePool){
            this._clearByKey2(key);
            return;
        }
        if(!this._cache || this._cache.size === 0 || !this._cache.has(key)) return;
        let pool = this._cache.get(key);
        if(!pool) return;
        for(let i = 0, len = pool.size(); i < len; i++){
          //@ts-ignore
          pool._pool[i].getComponent(MapTerrComp).onRelease();
        }
        pool.clear();
        this._cache.set(key, null);
    }

    private _clearByKey2(key: string){
        if(!this._cache2 || this._cache2.size === 0 || !this._cache2.has(key)) return;
        let pool = this._cache2.get(key);
        if(!pool) return;
        for(let i = 0, len = pool.length; i < len; i++){
            pool[i].getComponent(MapTerrComp).onRelease();
            pool[i].destroy();
        }
        pool.length = 0;
        this._cache2.set(key, null);
    }

    clearAll(){
        if(!this._isUsedNodePool){
            this._clearAll2();
            return;
        }
        if(!this._cache || this._cache.size === 0) return;
        this._cache.forEach((ele, key) => {
            this.clearByKey(key);
        });
        this._cache.clear();
        this._cache = null;
    }

    private _clearAll2(){
        if(!this._cache2 || this._cache2.size === 0) return;
        let keys = this._cache2.keys();
        for(let key of keys){
            this.clearByKey(key);
        }
        this._cache2.clear();
        this._cache2 = null;
    }

    putTerrNode(key: string, terrNode: cc.Node){
        if(!this._isUsedNodePool){
            this._putTerrNode2(key, terrNode);
            return;
        }
        if(!key || key.length === 0 || !cc.isValid(terrNode)) return;
        let pool: cc.NodePool = null;
        this._cache = this._cache || new Map<string, cc.NodePool>();
        if(!this._cache.has(key) || !this._cache.get(key)){
            this._cache.set(key, new cc.NodePool());
        }
        pool = this._cache.get(key);
        pool.put(terrNode);
    }

    private _putTerrNode2(key: string, terrNode: cc.Node){
        if(!key || key.length === 0 || !cc.isValid(terrNode)) return;
        let pool: cc.Node[] = null;
        this._cache2 = this._cache2 || new Map<string, cc.Node[]>();
        if(!this._cache2.has(key) || !this._cache2.get(key)){
            this._cache2.set(key, []);
        }
        pool = this._cache2.get(key);
        terrNode.setPosition(FreeTerrNodePos);
        pool.push(terrNode);
    }

    getTerrNode(key: string): cc.Node{
        if(!this._isUsedNodePool){
            return this._getTerrNode2(key);
        }
        this._cache = this._cache || new Map<string, cc.NodePool>();
        if(!this._cache || this._cache.size === 0 || !this._cache.has(key) || !this._cache.get(key) || this._cache.get(key).size() === 0){
            cc.error(`key = ${key}的地形节点缓存异常：地形节点没有缓存了`)
            return null;
        }
        let pool = this._cache.get(key);
        return pool.get();
    }

    private _getTerrNode2(key: string): cc.Node{
        this._cache2 = this._cache2 || new Map<string, cc.Node[]>();
        if(!this._cache2 || this._cache2.size === 0 || !this._cache2.has(key) || !this._cache2.get(key) || this._cache2.get(key).length === 0){
            cc.error(`key = ${key}的地形节点缓存异常：地形节点没有缓存了`)
            return null;
        }
        let pool = this._cache2.get(key);
        return pool.shift();
    }
}

let mapTerrCacheManager = new MapTerrCacheManager();

class TerrCollisionNodePool{
    private _capacity: number = 0;
    private _cachedCount: number = 0;
    private _pool: cc.NodePool = null;

    set capacity(capacity: number){
        this._capacity = capacity;
    }

    get capacity(){
        return this._capacity;
    }

    get cachedCount(){
        return this._cachedCount;
    }

    private _getPool(){
        return (this._pool = this._pool || new cc.NodePool(TerrCollisionComp));
    }

    get(...params: any[]){
        this._getPool();
        if(this._pool.size() > 0){
            return this._pool.get(...params);
        }

        let node = this._createNew();
        let comp = node.addComponent(TerrCollisionComp);
        comp.reuse(...params);
        return node;
    }

    private _createNew(){
        let node = new cc.Node();
        this._cachedCount += 1;
        node.name = TerrCollisionNodeName;
        node.groupIndex = GROUPS_OF_NODE.LAND;
        node.addComponent(cc.PolygonCollider);
        return node;
    }

    put(node: cc.Node){
        if(!cc.isValid(node) || node.name != TerrCollisionNodeName || !node.getComponent(cc.PolygonCollider) || !node.getComponent(TerrCollisionComp)){
            cc.warn('地形碰撞节点异常！！！', node.name);
            return;
        }
        this._getPool();
        this._pool.put(node);
    }

    addOneToPool(){
        let node = this._createNew();
        let comp = node.addComponent(TerrCollisionComp);
        this.put(node);
    }

    clear(){
        if(this._pool){
            for(let i = 0, len = this._pool.size(); i < len; i++){
                //@ts-ignore
                this._pool._pool[i].getComponent(TerrCollisionComp).onRelease && this._pool._pool[i].getComponent(TerrCollisionComp).onRelease();
            }
            this._pool.clear();
        }
        this._capacity = 0;
        this._cachedCount = 0
        this._pool = null;
    }
}

const terrCollisionNodePool = new TerrCollisionNodePool();

//预加载碰撞节点
let prebuildCollisionNode = function (): StepWork {
  let stepWork = new StepWork();
  stepWork.addTask((callback: () => {}) => {
      let schedulerID = scheduleManager.schedule(() => {
          if(terrCollisionNodePool.cachedCount >= terrCollisionNodePool.capacity){
              scheduleManager.unschedule(schedulerID);
              callback && callback();
              return;
          }

          for(let i = 0; i < 5 && terrCollisionNodePool.cachedCount < terrCollisionNodePool.capacity; i++){
              terrCollisionNodePool.addOneToPool();
          }
      }, 0);
  });
  return stepWork;
}

export {
    terrConfigManager,
    mapTerrCacheManager,
    TiledLayerInfo,
    TiledInfo,
    TiledShadeInfo,
    terrCollisionNodePool,
    prebuildCollisionNode
}
