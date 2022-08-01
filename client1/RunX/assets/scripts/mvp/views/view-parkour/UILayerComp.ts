import {eventCenter} from "../../../common/event/EventCenter";
import {parkourEvent} from "../../../common/event/EventData";
import { utils } from '../../../app/AppUtils';
import guiManager from '../../../common/GUIManager';
import DebugView from './DebugView';
import { ParkourScene } from "../view-scene/ParkourScene";
import PauseTip from "./PauseTip";
import ParkourWarnView from "./ParkourWarnView";
import ProgressView from "./ProgressView";
import { ParkourStrConfig } from "./ParkourString";
import { parkourConfig } from "./ParkourConst";
import { userData } from "../../models/UserData";
import { localStorageMgr, SAVE_TAG } from "../../../common/LocalStorageManager";
import { configUtils } from "../../../app/ConfigUtils";
const {ccclass, property} = cc._decorator;

const DRAW_AUX_LINE = false;

/**
 * UI层组件
 */
@ccclass
class UILayerComp extends cc.Component {

    @property(PauseTip) pauseTipView: PauseTip = null;
    @property(ParkourWarnView) warnView: ParkourWarnView = null;
    private _progressComp: ProgressView = null;
    private _isInit: boolean = false;
    private _autoPlayAreaNodes: cc.Label[] = null;
    private _autoPlayBulletsNodes: cc.Label[] = null;
    private _autoPlayMonsterAreaNodes: cc.Label[] = null;
    private _autoPlayAllAreaNodes: cc.Label[] = null;
    private _autoPlayIsPlayerContainNodes: cc.Label[] = null;
    private _debugView: DebugView = null;
    private _isDebugViewLoading: boolean = false;

    private _isAuto: boolean = false;

    onInit() {
        this.node.active = true;
        this._init();
        this._setBtnsVisible();
        this.pauseTipView.onInit();
        this.updateLevelProgress(0);
        this.warnView.onInit();
    }

    private _init(){
        if(this._isInit) return;
        this._isInit = true;
        this._initUI();
        this.initEvents();
    }

    private _setBtnsVisible(){
        let autoBtn = cc.find('AutoMode', this.node);
        cc.isValid(autoBtn) && (autoBtn.active = configUtils.checkFunctionOpen(30000));
    }

    //设置自动模式，只能在onInit执行完之后调用，用于外部调用
    setAutoPlay(){
        if(!configUtils.checkFunctionOpen(30000)) return;
        this._isAuto = localStorageMgr.getAccountStorage(SAVE_TAG.PARKOUR_AUTO) == true;
        let autoPlayToggle = cc.find('AutoMode', this.node).getComponent(cc.Toggle);
        autoPlayToggle.isChecked = this._isAuto;
        cc.find('AutoMode/label_unsel', this.node).active = !this._isAuto;
        cc.find('AutoMode/label_sel', this.node).active = this._isAuto;
        eventCenter.fire(parkourEvent.AUTO_PLAY, this._isAuto);
    }

    deInit(){
        this.node.active = false;
        this.pauseTipView.deInit();
        this.warnView.deInit();
        this._progressComp && this._progressComp.deInit();
        this.updateCoin();
        this.updateDiamond();
        localStorageMgr.setAccountStorage(SAVE_TAG.PARKOUR_AUTO , this._isAuto);
    }

    onRelease(){
        eventCenter.unregisterAll(this);
        this._isInit = false;
        this._clearDebugInfo();
        this._progressComp = null;
        cc.isValid(this._debugView) && this._debugView.closeView();
        this._debugView = null;
    }

    private _clearDebugInfo(){
        this._autoPlayAreaNodes && (this._autoPlayAreaNodes.length = 0);
        this._autoPlayAreaNodes = null;

        this._autoPlayMonsterAreaNodes && (this._autoPlayMonsterAreaNodes.length = 0);
        this._autoPlayMonsterAreaNodes = null;

        this._autoPlayAllAreaNodes && (this._autoPlayAllAreaNodes.length = 0);
        this._autoPlayAllAreaNodes = null;

        this._autoPlayBulletsNodes && (this._autoPlayBulletsNodes.length = 0);
        this._autoPlayBulletsNodes = null;

        this._autoPlayIsPlayerContainNodes && (this._autoPlayIsPlayerContainNodes.length = 0);
        this._autoPlayIsPlayerContainNodes = null;
    }

    private _initUI(){
        this._progressComp = cc.find("ProgressView", this.node).getComponent(ProgressView);
        this._progressComp.onInit();
        guiManager.isDebug && this._addDebugBtn();
    }

    //测试模式下调用,该过程比较耗时
    private _addDebugBtn(){
        let debugBtn = new cc.Node();
        let labelComp = debugBtn.addComponent(cc.Label);
        labelComp.string = ParkourStrConfig.DebugParamSetting;
        labelComp.fontSize = 20;
        labelComp.cacheMode = cc.Label.CacheMode.CHAR;
        debugBtn.width = 150;
        debugBtn.height = 40;
        let btnComp = debugBtn.addComponent(cc.Button);
        let handler = new cc.Component.EventHandler();
        handler.target = this.node;
        handler.component = 'UILayerComp';
        handler.handler = 'onClickDebugBtn';
        btnComp.clickEvents.push(handler);
        debugBtn.parent = this.node;
        debugBtn.setPosition(cc.v2(cc.winSize.width - 50, cc.winSize.height - 200));
    }

    reDrawAutoPlayRect(){
        if(!guiManager.isDebug || !DRAW_AUX_LINE) return;
        let graphicComp = this.node.getComponent(cc.Graphics);
        if(!graphicComp){
            graphicComp = this.node.addComponent(cc.Graphics);
        }
        graphicComp.clear();
        this._drawAutoPlayRect();
    }

    private _drawAutoPlayRect(){
      if(!guiManager.isDebug || !DRAW_AUX_LINE) return;

        this._autoPlayAreaNodes = this._autoPlayAreaNodes || [];
        this._autoPlayBulletsNodes = this._autoPlayBulletsNodes || [];
        let graphicComp = this.node.getComponent(cc.Graphics);
        if(!graphicComp){
            graphicComp = this.node.addComponent(cc.Graphics);
        }
        graphicComp.lineWidth = 6;
        graphicComp.strokeColor = cc.Color.BLACK;
        //@ts-ignore
        parkourConfig.AutoPlayAreas.forEach((ele, idx) => {
            this._autoPlayAreaNodes.length <= idx && (this._autoPlayAreaNodes.push(this.getLabelNode(idx, -40, cc.Color.BLACK)));
            this._autoPlayBulletsNodes.length <= idx && (this._autoPlayBulletsNodes.push(this.getLabelNode(idx, -60, cc.Color.BLACK)));
            graphicComp.rect(ele.x, ele.y, ele.width, ele.height);
        });
        graphicComp.stroke();

        this._autoPlayMonsterAreaNodes= this._autoPlayMonsterAreaNodes || [];
        this._autoPlayAllAreaNodes= this._autoPlayAllAreaNodes || [];
        this._autoPlayIsPlayerContainNodes= this._autoPlayIsPlayerContainNodes || [];
        graphicComp.lineWidth = 4;
        graphicComp.strokeColor = cc.color(255, 0, 255, 120);
        // @ts-ignore
        parkourConfig.AutoPlayMonsterAreas.forEach((ele, idx) => {
            this._autoPlayMonsterAreaNodes.length <= idx && (this._autoPlayMonsterAreaNodes.push(this.getLabelNode(idx, -80, cc.Color.BLACK)));
            this._autoPlayAllAreaNodes.length <= idx && (this._autoPlayAllAreaNodes.push(this.getLabelNode(idx, -100, cc.Color.BLACK)));
            this._autoPlayIsPlayerContainNodes.length <= idx && (this._autoPlayIsPlayerContainNodes.push(this.getLabelNode(idx, -120, cc.Color.BLACK)));
            graphicComp.rect(ele.x, ele.y, ele.width, ele.height);
        })
        graphicComp.stroke();
    }

    updateAutoPlayDebugInfo(itemWeights: number[], bulletWeights: number[], monsterWeight: number[], playerIdx: number){
        if(this._autoPlayAreaNodes){
            this._autoPlayAreaNodes.forEach((ele, idx) =>{
                ele.string = `${ParkourStrConfig.ItemWeight}${itemWeights[idx]}`;
            });
        }

        if(this._autoPlayMonsterAreaNodes){
            this._autoPlayMonsterAreaNodes.forEach((ele, idx) =>{
                ele.string = `${ParkourStrConfig.MonsterWeight}${monsterWeight[idx]}`;
            });
        }

        if(this._autoPlayBulletsNodes){
            this._autoPlayBulletsNodes.forEach((ele, idx) =>{
                ele.string = `${ParkourStrConfig.BulletWeight}${bulletWeights[idx]}`;
            });
        }

        if(this._autoPlayAllAreaNodes){
            this._autoPlayAllAreaNodes.forEach((ele, idx) =>{
                ele.string = `${ParkourStrConfig.AllWeight}${monsterWeight[idx] + bulletWeights[idx] + itemWeights[idx]}`;
            });
        }

        if(this._autoPlayIsPlayerContainNodes){
          this._autoPlayIsPlayerContainNodes.forEach((ele, idx) =>{
              ele.string = `${ParkourStrConfig.IsHere}${playerIdx == idx}`;
          });
      }
    }

    private getLabelNode(idx: number, offset: number, color: cc.Color): cc.Label{
        let node = new cc.Node();
        node.parent = this.node;
        node.color = color;
        node.anchorX = 0;
        node.x = 0;
        let height = cc.winSize.height / parkourConfig.AutoPlayAreas.length;
        node.y = cc.winSize.height - height * idx + offset;
        let labelComp = node.addComponent(cc.Label);
        labelComp.fontSize = 12;
        labelComp.string = '';
        labelComp.horizontalAlign = cc.Label.HorizontalAlign.LEFT;
        return labelComp;
    }

    initEvents (){
        eventCenter.register(parkourEvent.SHOW_RESUME_COUNT_DOWN, this, this._playResumeAnin);
    }

    updateCoin (coin: number = 0){
        let coinLabel = cc.find("coin_label", this.node);
        coinLabel.getComponent(cc.Label).string = `${coin}`;
    }

    updateDiamond(diamond: number = 0){
        let coinLabel = cc.find("diamond_label", this.node);
        coinLabel.getComponent(cc.Label).string = `${diamond}`;
    }

    //菜单按钮点击事件
    onClickMenuBtn (event: cc.Event){
        eventCenter.fire(parkourEvent.PAUSE_LOGIC);
        ParkourScene.getInstance().openMenuView();
    }

    //自动模式切换
    onAutoModeCheck(toggle: cc.Toggle){
        let isAuto = toggle.isChecked;
        this._isAuto = isAuto;
        cc.find('AutoMode/label_unsel', this.node).active = !isAuto;
        cc.find('AutoMode/label_sel', this.node).active = isAuto;
        eventCenter.fire(parkourEvent.AUTO_PLAY, isAuto);
    }

    //调试按钮
    onClickDebugBtn(){
        if(cc.isValid(this._debugView)){
            this._debugView.node.active = !this._debugView.node.active;
            return;
        }
        if(this._isDebugViewLoading) return;
        this._isDebugViewLoading = true;
        guiManager.loadView('DebugSetting', this.node).then((view) =>{
            this._isDebugViewLoading = false;
            //@ts-ignore
            this._debugView = view;
        }).catch(() => {
            this._isDebugViewLoading = false;
        })
    }

    //更新关卡进度
    updateLevelProgress(progress: number){
        this._progressComp.updateLevelProgress(progress);
    }

    //播放角色受伤动画
    playActorBeHurtAnim(){
        this._progressComp.playActorBeHurtAnim();
    }

    //播放角色使用技能动画
    playActorUseSkillAnim(){
        this._progressComp.playActorUseSkillAnim();
    }

    //继续游戏
    private _playResumeAnin(){
        this.pauseTipView.show(() => {
            eventCenter.fire(parkourEvent.RESUME_LOGIC);
        });
    }

    getProgressView(): ProgressView{
        return this._progressComp;
    }

    //boss出场预警
    showWarnView(){
        this.warnView && this.warnView.show();
    }
}

export {
    UILayerComp
}
