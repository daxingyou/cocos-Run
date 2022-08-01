/*
 * @Description:NPC引导组件
 * @Version: 1.0
 * @Autor: lixu
 * @Date: 2021-09-17 14:16:54
 * @LastEditors: lixu
 * @LastEditTime: 2021-11-04 14:39:10
 */

import { resPathUtils } from "../../../app/ResPathUrlUtils";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { cfg } from "../../../config/config";

const {ccclass, property} = cc._decorator;

const ActorAppearTime = 0.2;
const PrintTextDelay = 0.05;
const ContentPrefix = '    ';

//动画状态
enum ActionState{
    NotStarted = 0,
    Runing,
    Done
}

@ccclass
export default class ActorGuideView extends cc.Component {
    @property(cc.Node) actorLayer : cc.Node = null;
    @property(cc.Node) actorTemplate: cc.Node = null;;
    @property(cc.Label) contentLabel: cc.Label = null;
    @property(cc.Label) actorName: cc.Label = null;
    @property([cc.Vec3]) actorPosCfg: cc.Vec3[] = [];

    private _content: string = null;
    private _spLoader: SpriteLoader = null;
    private _actorTargetPos: cc.Vec2 = cc.v2();

    private _actorActionState: ActionState = ActionState.NotStarted;
    private _textActionState: ActionState = ActionState.NotStarted;

    onInit(){
        this.node.active = false;
    }

    deInit(){
        this.hide();
    }

    onRelease(){
        this.deInit();
        this._spLoader.release();
        this._spLoader = null;
    }

    isActionDone(){
        return this._actorActionState == ActionState.Done && this._textActionState == ActionState.Done;
    }

    skipToResult(){
        if(this.isActionDone()) return;
        this._actorActionState = ActionState.Done;
        this._textActionState = ActionState.Done;
        cc.Tween.stopAllByTarget(this.actorTemplate);
        cc.Tween.stopAllByTarget(this.contentLabel.node);
        this.contentLabel.string = `${ContentPrefix}${this._content}`;
        !this.actorName.node.active && (this.actorName.node.active = true);
        this.actorTemplate.setPosition(this._actorTargetPos);
    }

    show(guideCfg: cfg.FunctionGuide){
        if(!guideCfg) return;
        this.node.active = true;
        this.actorName.node.active = false;
        this._content = `${guideCfg.FunctionGuideText || ''}`;
        this.contentLabel.string = ContentPrefix;
        let modelID = guideCfg.FunctionGuideHeroModel;
        //没有配置模型
        if(!modelID){
            this._actorActionState = ActionState.Done;
            this._doActorSpeakAction();
            return;   
        }

        this._spLoader = this._spLoader || new SpriteLoader();
        this.actorName.string = guideCfg.FunctionGuideHeroName || '';
        let posType = guideCfg.FunctionGuidePosition;
        this.actorTemplate.parent = this.actorLayer;
        let actorPosCfg = this.actorPosCfg[posType - 1];
        this.actorTemplate.active = true;
        let startPos = cc.v2();
        if(actorPosCfg.z < 0){
            startPos.x = (cc.winSize.width >> 2) + 500;
        }else{
            startPos.x = -(cc.winSize.width >> 2) - 500;
        }
        startPos.y = actorPosCfg.y;
        this.actorTemplate.setPosition(startPos);
        this.actorTemplate.scaleX  = actorPosCfg.z;
        this._actorTargetPos.x = actorPosCfg.x;
        this._actorTargetPos.y =  actorPosCfg.y;
        this._actorActionState = ActionState.NotStarted;
        this._textActionState = ActionState.NotStarted;
        this._spLoader.changeSprite(this.actorTemplate.getComponent(cc.Sprite), resPathUtils.getModelPhotoPath(modelID), (err)=> {
            if(err) return;
            this._doActorAppearAction(this.actorTemplate, this._actorTargetPos);
        });
    }

    private _doActorAppearAction(node: cc.Node, targetPos: cc.Vec2){
        if(!cc.isValid(node) || !targetPos) return;
        cc.Tween.stopAllByTarget(node);
        this._actorActionState = ActionState.Runing;
        cc.tween(node).to(ActorAppearTime, {x: targetPos.x, y: targetPos.y}).call(()=>{
            this.actorName.node.active = true;
            this._actorActionState = ActionState.Done;
            this._doActorSpeakAction();
        }, this).start();
    }

    private _doActorSpeakAction(){
        if(!this._content || this._content.length == 0) return;
        cc.Tween.stopAllByTarget(this.contentLabel.node);
        let strLen = this._content.length;
        this._textActionState = ActionState.Runing;
        cc.tween(this.contentLabel.node).repeat(strLen, cc.tween().call(()=>{
            let currLen = (this.contentLabel.string).length - ContentPrefix.length;
            this.contentLabel.string = (this.contentLabel.string + this._content.substr(currLen, 1));
            if(currLen == (this._content.length - 1)){
                this._textActionState = ActionState.Done;
                return;
            }
        }, this).delay(PrintTextDelay)).start();
    }

    hide(){
        this._actorActionState = ActionState.NotStarted;
        this._textActionState = ActionState.NotStarted;
        cc.Tween.stopAllByTarget(this.actorTemplate);
        cc.Tween.stopAllByTarget(this.contentLabel.node);
        this._spLoader && this._spLoader.deleteSprite(this.actorTemplate.getComponent(cc.Sprite));
        this.node.active = false;
        this._content = null;
    }
}
