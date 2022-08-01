import {eventCenter} from '../../../common/event/EventCenter';
import {parkourEvent} from '../../../common/event/EventData';
import MapBgLayer from './MapBgLayer';
import { configManager } from '../../../common/ConfigManager';
import { ParkourScene } from '../view-scene/ParkourScene';
import guiManager from '../../../common/GUIManager';
import {ParkourStrConfig} from './ParkourString';
import { pveData } from '../../models/PveData';
import { configUtils } from '../../../app/ConfigUtils';
import StepWork from "../../../common/step-work/StepWork";

const {ccclass, property} = cc._decorator;

@ccclass
export default class MapBgComp extends cc.Component {
    //前景节点
    @property(cc.Node) frontBgNode: cc.Node = null;
    private _layers: Array<MapBgLayer> =  null;//存储地图背景层节点
    private _isMoveable: boolean = false;
    //是否在快速移动
    private _isFastMove:boolean = false;

    private _isInit: boolean  = false;

    onInit(){
        this._init();
        this._allCompDoAction('onInit');
    }

    private _init(){
        if(this._isInit) return;
        this._isInit = true;
        this.initEvents();
    }

    deInit(){
        this._allCompDoAction('deInit');
        this._isMoveable = false;
        this._isFastMove = false;
    }

    onRelease(){
        eventCenter.unregisterAll(this);
        this._isInit = false;
        this._allCompDoAction('onRelease');
        this._layers && (this._layers.length = 0);
        this._layers = null;
    }

    initEvents (){
        eventCenter.register(parkourEvent.MAP_FAST_MOVE, this, this.onMapFastMove);
        eventCenter.register(parkourEvent.MAP_STOP_MOVE, this, this.onMapStopMove);
        eventCenter.register(parkourEvent.MAP_NORMAL_MOVE, this, this.onMoveNormalMove);
        eventCenter.register(parkourEvent.ACTOR_ENTER_FINISH, this, this.onActorEnterFinish);
        eventCenter.register(parkourEvent.LEVEL_FINISH, this, this.onMapStopMove);
        eventCenter.register(parkourEvent.PAUSE_LOGIC, this, this.onPauseLogic);
        eventCenter.register(parkourEvent.RESUME_LOGIC, this, this.onResumeLogic);
    }

    onPauseLogic(){
        this._allCompDoAction('pause');
    }

    onResumeLogic(){
        this._allCompDoAction('resume');
    }

    //地图快速移动
    onMapFastMove(){
        this._isMoveable = true;
        if(this._isFastMove) return;
        this._isFastMove = true;
        this._allCompDoAction('fastMove');
    }

    //地图停止移动
    onMapStopMove(){
        this._isMoveable = false;
        this._isFastMove = false;
        this._allCompDoAction('stopMove');
    }

    //地图正常速度移动
    onMoveNormalMove() {
        this._isMoveable = true;
        this._isFastMove = false;
        this._allCompDoAction('normalMove');
    }

    //主角进入场景
    onActorEnterFinish() {
        this._isMoveable = true;
        this._isFastMove = false;
        this._allCompDoAction('normalMove');
    }

    //构建地图背景层
    buildLayer(finishHandler?: Function) {
        let currLessonCfg =  configUtils.getLessonConfig(pveData.getCurrLessonId());
        let pveCfg = pveData.pveConfig;
        let mapBgIdx = currLessonCfg.LessonRunBg;
        if (pveCfg && (pveCfg.adventureCfg || pveCfg.dailyCfg)) {
            mapBgIdx = pveCfg.adventureCfg ? pveCfg.adventureCfg.LessonRunBg : pveCfg.dailyCfg.PVEDailyLessonRunBg;
        }

        if(ParkourScene.getInstance().isTest){
            mapBgIdx = 4;
        }
        let mapBgs: any[] = configManager.getConfigByKey('runMapBg', mapBgIdx);
        if(!mapBgs){
            guiManager.showTips(ParkourStrConfig.NoLevelBgConfig);
            finishHandler && finishHandler();
            return
        }
       
        mapBgs.sort((a, b)=>{
            return b.LessonRunBgImageLevel - a.LessonRunBgImageLevel;
        });
       
        this._layers = this._layers || [];

        let tasks: Promise<any>[] = [];
        mapBgs.forEach((value: any) => {
            tasks.push(this._createLayerNode(value));
        });
        if(tasks.length === 0){
            finishHandler && finishHandler();
            return;
        }
        Promise.all(tasks).then(()=> {
            finishHandler && finishHandler();
        });
    }

    private async _createLayerNode(value: any){        
        let layerNode = new cc.Node("bg"+ value.LessonRunBgImageLevel);
        layerNode.setAnchorPoint(cc.Vec2.ZERO);
        layerNode.setPosition(cc.Vec2.ZERO)
        layerNode.width = layerNode.height = cc.Vec2.ZERO.x;
        let mapLayerComp = layerNode.addComponent(MapBgLayer);
        this._layers.push(mapLayerComp);
        await mapLayerComp.buildMapBg(value);
        value.LessonRunBgImageLevel > 0 ? this.node.addChild(layerNode) : this.frontBgNode.addChild(layerNode);
        return true;
    }

    reBuildIn(cb: Function){
        if(!this._layers){
            cb && cb();
            return;
        }
        let subWork = new StepWork();
        this._layers.forEach((ele) => {
            subWork.addTask(() => {
                ele.reBuildIn()
            })
        });
        subWork.start(() =>{
            cb && cb();
        })
    }

    private _allCompDoAction(action: string, ...param: any){
        if(!action || action.length <= 0 || !this._layers || this._layers.length <= 0) return;
        this._layers.forEach((elem: any) => {
            elem[action] && elem[action].apply(elem, param);
        });
    }
}
