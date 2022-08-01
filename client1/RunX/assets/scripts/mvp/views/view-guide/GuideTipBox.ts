import { HEAD_ICON } from "../../../app/AppEnums";
import { resPathUtils } from "../../../app/ResPathUrlUtils";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { cfg } from "../../../config/config";
import { GuideTipPosType } from "./FunctionGuideView";

/*
 * @Description: 功能引导提示组件
 * @Version: 1.0
 * @Autor: lixu
 * @Date: 2021-09-16 16:18:12
 * @LastEditors: lixu
 * @LastEditTime: 2021-11-05 12:14:37
 */
const {ccclass, property} = cc._decorator;

const arrowCfg = {rotate: -45};
const bgCfg = {x: 360, y: 137};
const textCfg = {lx: -135, ly:0, rx: -185, ry: 0};

@ccclass
export default class GuideTipBox extends cc.Component {
    @property(cc.Node) lightCirecle: cc.Node = null;
    @property(sp.Skeleton) effectAnim: sp.Skeleton = null;

    private _spLoader: SpriteLoader = null;

    onInit(){
        this.node.active = false;
    }

    deInit(){
        this._clear();
    }

    onRelease(){
        this.deInit();
        this._spLoader = null;
    }

    show(pos: cc.Vec2, content: cfg.FunctionGuide){
        if(!content) return;
        pos = this.node.parent.convertToNodeSpaceAR(pos);
        this.node.x = pos.x;
        this.node.y = pos.y;
        this._init(content);
        this.node.active = true;
        this._isShowLightCircle(content) && this._showLightCireCle();
        this._showEffectCirecle();
    }

    hide() {
        this.effectAnim.clearTracks();
        cc.isValid(this.lightCirecle) && cc.Tween.stopAllByTarget(this.lightCirecle);
        this.node.active = false;
        this._clear();
    }

    private _init(cfg: cfg.FunctionGuide){
        let posType: GuideTipPosType = cfg.FunctionGuidePosition;
        let bgX, bgY;
        let signTag;
        let labelOffsetX, labelOffsetY;
        switch(posType){
            case GuideTipPosType.LEFT_TOP:
              bgX = -bgCfg.x;
              bgY = bgCfg.y;
              signTag = -1;
              labelOffsetX = textCfg.lx;
              labelOffsetY = textCfg.ly;
              break;
            case GuideTipPosType.LEFT_BOTTOM:
              bgX = -bgCfg.x;
              bgY = -bgCfg.y;
              signTag = -1;
              labelOffsetX = textCfg.lx;
              labelOffsetY = textCfg.ly;
              break;
            case GuideTipPosType.RIGHT_TOP:
              bgX = bgCfg.x;
              bgY = bgCfg.y;
              signTag = 1;
              labelOffsetX = textCfg.rx;
              labelOffsetY = textCfg.ry;
              break;
            case GuideTipPosType.RIGHT_BOTTOM:
              bgX = bgCfg.x;
              bgY = -bgCfg.y;
              signTag = 1;
              labelOffsetX = textCfg.rx;
              labelOffsetY = textCfg.ry;
              break;
        }
        this.effectAnim.node.angle =  90 * (posType - GuideTipPosType.LEFT_TOP) +  arrowCfg.rotate;

        let bgNode = cc.find('bg', this.node);
        bgNode.x = bgX;
        bgNode.y = bgY;

        let headFrame = cc.find('headFrame', this.node);
        let headNode = cc.find('head', this.node);
        headFrame.x = headNode.x = bgNode.x + ((bgNode.width >> 1) - 50) * signTag;
        headFrame.y = headNode.y = bgNode.y;
        headNode.scaleX = -signTag;
        headNode.width = headFrame.width - 5;
        headNode.height = headFrame.height - 5;
        this._setHead(headFrame, headNode, cfg.FunctionGuideHeroModel);

        let labelNode = cc.find('text', this.node);
        labelNode.x = bgNode.x + labelOffsetX;
        labelNode.y = bgNode.y + labelOffsetY;
        this._setText(bgNode, labelNode.getComponent(cc.Label), cfg.FunctionGuideText);
    }

    private _setHead(headFrame: cc.Node, headNode: cc.Node, modelID: number){
        let url: string = resPathUtils.getHeroCircleHeadIcon(modelID, HEAD_ICON.CIRCLE);
        if(!url || url.length === 0){
            headNode.active = false;
            headFrame.active = false;
            return;
        }
        headNode.active = false;
        headFrame.active = true;
        this._spLoader = this._spLoader || new SpriteLoader();
        this._spLoader.changeSprite(headNode.getComponent(cc.Sprite), url, (err) => {
            if(err) return;
            headNode.active = true;
        });
    }

    private _setText(bgNode: cc.Node, lableComp: cc.Label, text: string){
        if(!text || text.length === 0){
          bgNode.active = false;
          lableComp.node.active = false;
          return;
        }

        bgNode.active = true;
        lableComp.node.active = true;
        lableComp.string = text;
    }

    private _isShowLightCircle(cfg: cfg.FunctionGuide): boolean{
        if(typeof cfg.FunctionGuideLight != 'undefined' && cfg.FunctionGuideLight == 1){
          this.lightCirecle.active = true;
          return true;
        }
        this.lightCirecle.active = false;
        return false;
    }

    private _showLightCireCle(){
        if(!cc.isValid(this.lightCirecle)) return;
        this.lightCirecle.scale = 10;
        this.lightCirecle.opacity = 255;
        cc.tween(this.lightCirecle).to(0.7, {scale : 1, opacity: 0}, {easing: 'smooth'}).start();
    }

    private _showEffectCirecle(){
        if(!cc.isValid(this.effectAnim)) return;
        this.effectAnim.clearTracks();
        this.effectAnim.setAnimation(0, 'animation', true);
    }

    private _clear() {
        this._spLoader && this._spLoader.release();
    }
}
