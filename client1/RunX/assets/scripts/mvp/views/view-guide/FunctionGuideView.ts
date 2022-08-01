import { configUtils } from "../../../app/ConfigUtils";
import List from "../../../common/components/List";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { eventCenter } from "../../../common/event/EventCenter";
import { commonEvent, GuideEvents, netEvent} from "../../../common/event/EventData";
import guiManager from "../../../common/GUIManager";
import { logger } from "../../../common/log/Logger";
import { cfg } from "../../../config/config";
import { functionGuideData } from "../../models/GuideData";
import { pveData } from "../../models/PveData";
import { userData } from "../../models/UserData";
import { guideOpt } from "../../operations/GuideOpt";
import ActorGuideView from "./ActorGuideView";
import GuideBtnComp from "./GuideBtnComp";
import GuideListComp from "./GuideListComp";
import GuideTipBox from "./GuideTipBox";

/*
 * @Description:  功能引导组件
 * @Version: 1.0
 * @Autor: lixu
 * @Date: 2021-09-16 19:21:29
 * @LastEditors: lixu
 * @LastEditTime: 2021-09-17 18:41:09
 */
const {ccclass, property} = cc._decorator;

//功能引导遮罩层的显示类型
enum GuideViewVisibleType{
    InVisible = 0,  //没有遮罩
    OnlyMaskVisible,  //仅有遮罩
    AllVisible  //有遮罩并且遮罩挖孔
}

enum GuideTipPosType {
  LEFT_TOP = 1,
  LEFT_BOTTOM,
  RIGHT_BOTTOM,
  RIGHT_TOP,
  LEFT1 = 1,
  LEFT2,
  RIGHT1,
  RIGHT2,
}

const GUIDE_TYPE_BTN = 1;
const GUIDE_TYPE_NPC = 2;
const GUIDE_TYPE_LIST = 3;
const GUIDE_SHOW_MASK = 1;

@ccclass
export default class FunctionGuideView extends ViewBaseComponent {
    @property(cc.Mask) maskComp : cc.Mask = null;
    @property(cc.Node) maskNode : cc.Node = null;
    @property(cc.Node) skipBtn: cc.Node = null;
    @property(ActorGuideView) actorGuideView: ActorGuideView  = null;
    @property(GuideTipBox) guideTipBoxView: GuideTipBox  = null;

    onInit(){
        this.maskComp.node.active = false;
        this.skipBtn.active = false;
        this.actorGuideView.onInit();
        this.guideTipBoxView.onInit();
    }

    deInit(){
        this.actorGuideView.deInit();
        this.guideTipBoxView.deInit();
    }

    onRelease(){
        this.actorGuideView.onRelease();
        this.guideTipBoxView.onRelease();
    }

    private _setMaskVisible(type: GuideViewVisibleType, config?: {spriteFrame: cc.SpriteFrame, pos: cc.Vec2, size: cc.Size, alphaThreshold?: number}){
        //@ts-ignore
        config = config || {};
        switch(type){
            case GuideViewVisibleType.InVisible:
              this.maskComp.node.active = false;
              this._setSkipVisible(false);
              break;
            case GuideViewVisibleType.OnlyMaskVisible:
              this.maskComp.enabled = false;
              this.maskComp.node.active = true;
              this.maskComp.node.x = this.maskComp.node.y = 0;

              this.maskNode.x = this.maskNode.y = 0
              this.maskNode.width = cc.winSize.width;
              this.maskNode.height = cc.winSize.height;
              this._setSkipVisible(true);
              break;
            case GuideViewVisibleType.AllVisible:
              this.maskComp.enabled = true;
              config.spriteFrame && (this.maskComp.spriteFrame = config.spriteFrame);
              if(config.pos){
                let pos = this.node.convertToNodeSpaceAR(config.pos);
                this.maskComp.node.setPosition(pos);
                this.maskNode.setContentSize(cc.winSize);
                this.maskNode.setPosition(cc.v2(-pos.x, -pos.y));
              }
              if(config.size){
                  this.maskComp.node.setContentSize(config.size);
              }
              typeof (config.alphaThreshold) != 'undefined' && (this.maskComp.alphaThreshold = config.alphaThreshold);
              this.maskComp.node.active = true;
              this._setSkipVisible(true);
              break;
        }
    }

    private _setSkipVisible(visible: boolean){
        this.skipBtn.active = visible;
    }

    onClickMask(event: cc.Event.EventTouch){
        //带有mask的组件，其子节点的点击/触摸事件在mask组件的作用范围内都被引擎屏蔽了
        let cfg = FunctionGuideManager.getIns().currStepGuideCfg;
        if(!cfg) return;
        if(cfg.FunctionGuideType == GUIDE_TYPE_NPC){
            if(this.actorGuideView.isActionDone()){
                FunctionGuideManager.getIns().execNextStep();
                return;
            }
            this.actorGuideView.skipToResult();
        }
    }

    onClickSkip(event: cc.Event.EventTouch){
        FunctionGuideManager.getIns().doGuideEnd();
    }

    show(type: GuideViewVisibleType, guideCfg: cfg.FunctionGuide, config?: {spriteFrame: cc.SpriteFrame, pos: cc.Vec2, size: cc.Size, alphaThreshold?: number}){
        this.node.active = true;
        this._setMaskVisible(type, config);
        //NPC引导
        if(guideCfg.FunctionGuideType == GUIDE_TYPE_NPC){
            this.guideTipBoxView.hide();
            this.actorGuideView.show(guideCfg);
        }

        //按钮或者列表
        if(guideCfg.FunctionGuideType == GUIDE_TYPE_BTN || guideCfg.FunctionGuideType == GUIDE_TYPE_LIST){
            this.actorGuideView.hide();
            this.guideTipBoxView.show(config.pos, guideCfg);
        }
    }

    hide(){
        this.actorGuideView.hide();
        this.guideTipBoxView.hide();
        this.node.active = false;
        if(cc.isValid(this.maskComp)){
            this.maskComp.spriteFrame  = null;
        }
    }
}

class FunctionGuideManager{

    private _isInit: boolean = false;
    private _currGuideData: cfg.FunctionGuide[] = null;
    private _currGuideStepIdx: number = -1;
    private _guideView: FunctionGuideView = null;
    private _currGuideView: cc.Node = null;
    private _isRuningGuide: boolean = false;

    //延迟引导的配置
    private _pendingGuideCfg: {cfg: cfg.FunctionGuide, node: cc.Node} = null;

    private static _ins:FunctionGuideManager = null;

    static getIns(): FunctionGuideManager{
        FunctionGuideManager._ins = FunctionGuideManager._ins || new FunctionGuideManager();
        return FunctionGuideManager._ins;
    }

    private constructor(){};

    init(parentNode: cc.Node){
        if(this._isInit) return;
        this._isInit = true;
        guiManager.loadView('FunctionGuideView', parentNode).then((view) => {
            this._guideView = view as FunctionGuideView;
        });
        this._initEvents();
    }

    private _initEvents(){
        //更新配置的消息
        eventCenter.register(commonEvent.HIDE_LOADING, this, this._onLoadingHided);
        eventCenter.register(GuideEvents.UPDATE_GUIDE_CFGS, this, this._onUpdateGuideCfgs);
        eventCenter.register(netEvent.NET_CLOSED, this, this._netFail);
        eventCenter.register(netEvent.NET_RECONNECTED, this, this._netConnected);
    }

    private _onLoadingHided(){
        if(guiManager.isLoadViewShow()) return;
        if(!this._pendingGuideCfg || !this._pendingGuideCfg.cfg || !cc.isValid(this._pendingGuideCfg.node)) return;
        let pendindGuideCfg = this._pendingGuideCfg;
        this._pendingGuideCfg = null;
        this.runGuide(pendindGuideCfg.cfg, pendindGuideCfg.node);
    }

    private _netConnected(){
        if(!cc.isValid(this._currGuideView) || !this._currGuideView.active || !this._currGuideView.isChildOf(cc.director.getScene())
              || !this._currGuideData || this._currGuideData.length == 0 || this._currGuideStepIdx >= this._currGuideData.length)
            return;
        if(!this.checkTrigger(this._currGuideView.name)) return;
        this.runGuide(this.checkTrigger(this._currGuideView.name), this._currGuideView);
    }


    private _netFail(){
        this.pauseGuide();
    }

    private _onUpdateGuideCfgs(...params: any[]){
        let event = params[1];
        if(event == 'login'){
            this._updateGuideCfg(`1;${userData.lv}`);
            this._updateGuideCfg(`2;${pveData.getLastPastLessonId()}`);
        }else if(event == 'passLv'){
            this._updateGuideCfg(`2;${pveData.getLastPastLessonId()}`);
        }else if(event == 'expChange'){
            this._updateGuideCfg(`1;${userData.lv}`);
        }
    }

    //根据条件更新引导组
    private _updateGuideCfg(condi: string){
        if(!condi || condi.length == 0) return;
        let newCfg = configUtils.getFunctionGuideCfg(condi);
        if(!newCfg || functionGuideData.isGuideFinished(condi)) return;
        //更新引导配置
        if(!this._currGuideData || (newCfg != this._currGuideData && newCfg[0].FunctionGuideTeam >  this._currGuideData[0].FunctionGuideTeam)){
            this._currGuideData = newCfg;
            this._currGuideStepIdx = functionGuideData.getStartIdx(condi);
        }
        //cc.warn('当前引导配置====', this._currGuideData, this._currGuideStepIdx);
    }

    get currGuideData(): cfg.FunctionGuide[]{
        return this._currGuideData;
    }

    get currStepGuideCfg(): cfg.FunctionGuide{
        if(!this._currGuideData || this._currGuideData.length == 0) return null;
        if(this._currGuideStepIdx < 0 && this._currGuideStepIdx >= this._currGuideData.length) return null;
        return this._currGuideData[this._currGuideStepIdx];
    }

    getCurrStartStepCfg(): cfg.FunctionGuide{
        if(!this._currGuideData) return null;
        let startCfg = null;
        this._currGuideData.some((ele) => {
            if(typeof ele.FunctionGuideRepeat != 'undefined' && ele.FunctionGuideRepeat == 0){
                startCfg = ele;
                return true;
            }
            return false;
        }, this);
        startCfg = startCfg || this._currGuideData[0];
        return startCfg;
    }

    getCurrEndStepCfg(): cfg.FunctionGuide{
        if(!this._currGuideData) return null;
         let endCfg = null;
        for(let i = this._currGuideData.length; i > 0; i--){
            let ele = this._currGuideData[i - 1];
            if(typeof ele.FunctionGuideRepeat != 'undefined' && ele.FunctionGuideRepeat == 1){
                endCfg = ele;
                break;
            }
        }
        endCfg = endCfg || this._currGuideData[this._currGuideData.length - 1];
        return endCfg;
    }

    checkTrigger(viewName: string): cfg.FunctionGuide{
        if(!viewName || viewName.length == 0 || !this._currGuideData || this._currGuideData.length <= 0 || this._currGuideStepIdx < 0) return null;
        let guideStepCfg = this._currGuideData[this._currGuideStepIdx];
        if(!guideStepCfg) return null;
        if(guideStepCfg.FunctionGuideViewName === viewName){
            return guideStepCfg;
        }
        return null;
    }

    getCurrGuideView(): cc.Node{
        return this._currGuideView;
    }

    runGuide(guideStepCfg: cfg.FunctionGuide, parentNode: cc.Node){
        if(!guideStepCfg && guideStepCfg != this._currGuideData[this._currGuideStepIdx]){
            cc.warn("引导不匹配：", guideStepCfg, this._currGuideData[this._currGuideStepIdx]);
            return;
        }
        if(!cc.isValid(parentNode)){
            cc.warn('引导界面无效', guideStepCfg);
            return;
        }

        if(this._isRuningGuide) return;

        if(guiManager.isLoadViewShow()){
              this._pendingGuideCfg = {cfg: guideStepCfg, node: parentNode};
              return;
        }

        this._isRuningGuide = true;
        this._currGuideView = parentNode;
        let targetImg: cc.Node = null;
        let maskVisibleType = GuideViewVisibleType.InVisible;

        if(guideStepCfg.FunctionGuideType == GUIDE_TYPE_NPC){
            maskVisibleType = GuideViewVisibleType.OnlyMaskVisible;
        }

        if((guideStepCfg.FunctionGuideType == GUIDE_TYPE_BTN ||  guideStepCfg.FunctionGuideType == GUIDE_TYPE_LIST) && (typeof guideStepCfg.FunctionGuideBlack != 'undefined') && guideStepCfg.FunctionGuideBlack == GUIDE_SHOW_MASK){
            maskVisibleType = GuideViewVisibleType.AllVisible;
        }

        if(guideStepCfg.FunctionGuideType == GUIDE_TYPE_BTN){
            targetImg = cc.find(guideStepCfg.FunctionGuideButtonName, parentNode);
        }

        if(guideStepCfg.FunctionGuideType == GUIDE_TYPE_LIST){
            targetImg = cc.find(guideStepCfg.FunctionGuideButtonName, parentNode);
        }

        guideStepCfg.FunctionGuideType == GUIDE_TYPE_BTN && this._addGuideBtnComp(targetImg);

        let updateParentTransform = (node: cc.Node) => {
            if(!cc.isValid(node)) return;
            let widgetComp = node.getComponent(cc.Widget);
            if(cc.isValid(widgetComp)){
                widgetComp.updateAlignment();
                return;
            }
            updateParentTransform(node.parent);
        }

        //目标引导对象未在场景树中激活时，直接跳过对目标对象的引导
        if((guideStepCfg.FunctionGuideType == GUIDE_TYPE_BTN || guideStepCfg.FunctionGuideType == GUIDE_TYPE_LIST) &&  cc.isValid(targetImg) && !targetImg.activeInHierarchy){
            this.execNextStep();
            return;
        }

        let cfg:any = {};
        if(guideStepCfg.FunctionGuideType == GUIDE_TYPE_BTN){
            if(!cc.isValid(targetImg)){
                logger.error(`FunctionGuideManager`,'引导步骤异常 guideCfg:', guideStepCfg);
                return;
            }
            //需要挖孔
            maskVisibleType == GuideViewVisibleType.AllVisible && targetImg.getComponent(cc.Sprite) && (cfg.spriteFrame = targetImg.getComponent(cc.Sprite).spriteFrame);
            updateParentTransform(targetImg);
            cfg.pos = targetImg.parent.convertToWorldSpaceAR(targetImg.position);
            cfg.size = targetImg.getContentSize();
        }

        if(guideStepCfg.FunctionGuideType == GUIDE_TYPE_LIST){
            if(!cc.isValid(targetImg) || !targetImg.getComponent(GuideListComp)){
                logger.error(`FunctionGuideManager`,'引导步骤异常 guideCfg:', guideStepCfg);
                return;
            }
            //需要挖孔
            maskVisibleType == GuideViewVisibleType.AllVisible && (cfg.spriteFrame = targetImg.getComponent(GuideListComp).template);
            let listComp = targetImg.getComponent(List);
            let scrollViewComp = targetImg.getComponent(cc.ScrollView);
            if((cc.isValid(listComp) && listComp.numItems <= 0) || (cc.isValid(scrollViewComp) && scrollViewComp.content.childrenCount <= 0)){
                this.execNextStep();
                return;
            }

            updateParentTransform(targetImg);
            let contentNode = scrollViewComp.content;
            let size: cc.Size = null;
            if(cc.isValid(listComp)){
                size = listComp.getItemByListId(0).getContentSize();
                this._addGuideBtnComp(listComp.getItemByListId(0));
            }else{
                size = scrollViewComp.content.children[0].getContentSize();
                this._addGuideBtnComp(scrollViewComp.content.children[0]);
            }

            cfg.pos = targetImg.parent.convertToWorldSpaceAR(targetImg.position);
            cfg.pos.x += size.width >> 1;

            let layoutComp: cc.Layout = null;
            cc.isValid(contentNode) && (layoutComp = contentNode.getComponent(cc.Layout));
            if(cc.isValid(layoutComp)){
                if(layoutComp.type == cc.Layout.Type.HORIZONTAL){
                    cfg.pos.x += layoutComp.paddingLeft;
                }
                if(layoutComp.type == cc.Layout.Type.VERTICAL){
                    cfg.pos.x += layoutComp.paddingTop;
                }
            }
            cfg.size = size;
        }

        if(guideStepCfg.FunctionGuideType == GUIDE_TYPE_NPC){
            cfg.pos = cc.v2(cc.winSize.width >> 1, cc.winSize.height >> 1);
        }

        let curEndStepCfg = this.getCurrEndStepCfg();
        //没有结束标记的引导步骤统一在引导UI更新前更新引导状态
        !(guideStepCfg === curEndStepCfg) &&  this.reqRecordGuideStepFinish(guideStepCfg.FunctionGuideID);
        this._guideView.show(maskVisibleType, guideStepCfg, cfg);
    }

    //暂停引导
    pauseGuide(){
        if(this._currGuideStepIdx < 0) return;
        this._guideView.hide();
        this._isRuningGuide = false;
    }

    execNextStep(){
        if(!this._currGuideData || this._currGuideData.length == 0 || this._currGuideStepIdx + 1 >= this._currGuideData.length) {
            this.doGuideEnd();
            return;
        }
        let lastStepCfg = this._currGuideData[this._currGuideStepIdx];
        this.reqRecordGuideStepFinish(lastStepCfg.FunctionGuideID);
        this.pauseGuide();
        this._currGuideStepIdx += 1;
        let currStepCfg = this._currGuideData[this._currGuideStepIdx];
        if(currStepCfg.FunctionGuideViewName === lastStepCfg.FunctionGuideViewName){
            this.runGuide(currStepCfg, this._currGuideView);
        }
    }

    guideBtnClicked(guideBtnComp: GuideBtnComp){
        if(!cc.isValid(guideBtnComp)) return;
        this.execNextStep();
        //在当前帧结束的时候再移除组件，防止影响其他挂载事件的触发
        Promise.resolve().then(() => {
            this._removeGuideBtnComp(guideBtnComp);
        });
    }

    private _removeGuideBtnComp(guideBtnComp: GuideBtnComp){
        let btnComp = guideBtnComp.node.getComponent(cc.Button);
        if(cc.isValid(btnComp)){
            for(let i = 0, len = btnComp.clickEvents.length; i < len; i++){
                let ele = btnComp.clickEvents[i];
                //@ts-ignore
                if(ele._componentName == 'GuideBtnComp' && ele.handler == 'onGuideTrigged' && ele.target == btnComp.node){
                    btnComp.clickEvents.splice(i, 1);
                    i -= 1;
                    len -= 1;
                }
            }
        }
        guideBtnComp.node.removeComponent(guideBtnComp);
    }

    private _addGuideBtnComp(targetImg: cc.Node){
        if(!cc.isValid(targetImg)) return;
        let btnComp: cc.Button = null
        if(targetImg.getComponent(cc.Button)){
            btnComp = targetImg.getComponent(cc.Button);
        }else if(cc.isValid(targetImg.parent) && targetImg.parent.getComponent(cc.Button)){
            btnComp = targetImg.parent.getComponent(cc.Button);
        }

        if(cc.isValid(btnComp)){
            let guideComp = btnComp.node.getComponent(GuideBtnComp);
            if(!cc.isValid(guideComp)){
                guideComp = btnComp.node.addComponent(GuideBtnComp);
            }
            let hasHandler = btnComp.clickEvents.some((ele) => {
                //@ts-ignore
                return (ele._componentName == 'GuideBtnComp' && ele.handler == 'onGuideTrigged' && ele.target == btnComp.node);
            });

            if(!hasHandler){
                let handler = new cc.Component.EventHandler();
                handler.target = btnComp.node;
                handler.component = 'GuideBtnComp';
                handler.handler = 'onGuideTrigged';
                btnComp.clickEvents.unshift(handler);
            }
        }else{
            let guideComp = targetImg.getComponent(GuideBtnComp);
            if(!cc.isValid(guideComp)){
                guideComp = targetImg.addComponent(GuideBtnComp);
            }
        }
    }

    unInit(){
        eventCenter.unregisterAll(this);
        FunctionGuideManager._ins.clear();
        FunctionGuideManager._ins = null;
        this._isInit = false;
    }

    clear(){
        this._currGuideData = null;
        this._currGuideStepIdx = -1;
        this._currGuideView = null;
        this._isRuningGuide = false;
        cc.isValid(this._guideView) && this._guideView.hide();
    }

    doGuideEnd(){
        let cfg = this.getCurrEndStepCfg();
        if(!cfg){
            cc.warn('引导结束标记异常：', this.currGuideData);
            return;
        }
        this.reqRecordGuideStepFinish(cfg.FunctionGuideID);
        this.clear();
    }

    reqRecordGuideStepFinish(guideStepID: number){
        if(functionGuideData.isGuideStepFinish(guideStepID)) return;

        guideOpt.reqRecordFinishGuide(guideStepID);
    }
}

export {
    GuideViewVisibleType,
    GuideTipPosType,
    FunctionGuideManager,
}
