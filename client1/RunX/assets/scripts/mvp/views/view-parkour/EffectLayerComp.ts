import { eventCenter } from "../../../common/event/EventCenter";
import { parkourEvent } from "../../../common/event/EventData";
import StepWork from "../../../common/step-work/StepWork";
import { GROUPS_OF_NODE, ParkourBulletOwnerType } from "./ParkourConst";

/*
 * @Description:特效层
 * @Version: 1.0
 * @Autor: lixu
 * @Date: 2021-08-05 13:49:23
 * @LastEditors: lixu
 * @LastEditTime: 2021-12-30 17:52:17
 */
const {ccclass, property} = cc._decorator;

enum AnimType{
    AnimClip = 0,
    Spine
}

@ccclass
export default class EffectLayerComp extends cc.Component {

    private _isInit: boolean = false;

    onInit(...params: any[]){
        this._init();
    }

    private _init(){
        if(this._isInit) return;
        this._isInit = true;
        this._initEvents();
    }

    private _initEvents(){
        //子弹爆炸特效
        eventCenter.register(parkourEvent.ADD_BOOM_EFFECT, this, this._addEffect);
    }

    //增加一个特效
    getEffectNode(isAttach:boolean, ...params: any): cc.Node{
        let clip: cc.AnimationClip | sp.SkeletonData = params[0];
        let cb = params[1];
        let context = params[2];
        let initcb = params[3];
        let pos: cc.Vec2 = params[4];
        let effectNode = effectNodePool.getEffect(clip, this._onEffectFinish, context, cb, initcb);
        pos && effectNode.setPosition(pos);
        isAttach && (effectNode.parent = this.node);
        if(clip instanceof cc.AnimationClip){
            effectNode.getComponent(cc.Animation).play(clip.name);
            return effectNode;
        }
        effectNode.getComponent(sp.Skeleton).setAnimation(0, 'animation', false);
        return effectNode;
    }

    //移除一个特效
    removeEffectNode(effectNode: cc.Node){
        if(!cc.isValid(effectNode)) return;
        let animType = cc.isValid(effectNode.getComponent(cc.Animation)) ? AnimType.AnimClip : AnimType.Spine;
        effectNodePool.putEffect(effectNode, animType);
    }

    private _addEffect(...params: any[]){
        let clip: cc.AnimationClip | sp.SkeletonData = params[1];
        let pos = params[2];
        let bulletType = params[3];
        let cb = params[4];
        let initcb = params[5];
        let effectNode = effectNodePool.getEffect(clip, this._onEffectFinish, this, cb, initcb);
        effectNode.parent = this.node;
        effectNode.setPosition(pos.add(bulletType == ParkourBulletOwnerType.Player ? cc.v2(10, 0) : cc.v2(-10, 0)));
        if(clip instanceof cc.AnimationClip){
            effectNode.getComponent(cc.Animation).play(clip.name);
            return;
        }
        effectNode.getComponent(sp.Skeleton).setAnimation(0, 'animation', false);
    }

    private _onEffectFinish(event: cc.Event.EventCustom){
        let param: any = this;
        let finishCb = param.finishCb;
        let animType = cc.isValid(param.target.getComponent(cc.Animation)) ? AnimType.AnimClip : AnimType.Spine;
        finishCb && finishCb.call(param.context, param.target);
        effectNodePool.putEffect(param.target, animType);
    }

    deInit(){
        this._recycleReMainNodes();
    }

    //回收残余节点
    private _recycleReMainNodes(){
        let children = [...this.node.children];
        children.forEach((ele)=>{
          this.removeEffectNode(ele);
        });
    }

    onRelease(){
        eventCenter.unregisterAll(this);
        this._isInit = false;
    }
}

const PRE_BUILD_COUNT = 30;
const PER_FRAME_BUILD_COUNT = 5;

class EffectNodePool{
    private _effectPool: cc.NodePool  = null;
    private _effectSpPool: cc.NodePool = null;
    constructor(){}

    prebuild(cb: Function){
        this._effectPool = this._effectPool || new cc.NodePool();
        this._effectSpPool = this._effectSpPool || new cc.NodePool();
        let stepWork = new StepWork();
        for(let i = 0; i < PRE_BUILD_COUNT;){
            stepWork.addTask((callBack: Function) => {
                for(let j = 0; j < PER_FRAME_BUILD_COUNT; j++){
                    let node = new cc.Node();
                    this._initCocosAnimNode(node);
                    this.putEffect(node, AnimType.AnimClip)
                }
                callBack && callBack();
            });
            i += PER_FRAME_BUILD_COUNT;
        }

        for(let i = 0; i < PRE_BUILD_COUNT;){
            stepWork.addTask((callBack: Function) => {
                for(let j = 0; j < PER_FRAME_BUILD_COUNT; j++){
                    let node = new cc.Node();
                    this._initSpineNode(node);
                    this.putEffect(node, AnimType.Spine)
                }
                callBack && callBack();
            });
            i += PER_FRAME_BUILD_COUNT;
        }
        stepWork.start(()=> {cb && cb()});
    }

    getEffect(effect: cc.AnimationClip | sp.SkeletonData, finishCb?: (event: cc.Event.EventCustom) => void, target?: any, unuseCb?: Function, initCb?: Function){
      let animType = (effect instanceof cc.AnimationClip) ? AnimType.AnimClip : AnimType.Spine;
      let pool = this._getPool(animType);
        let effectNode: cc.Node = null;
        if(pool.size() > 0){
            effectNode = pool.get();
            this._initEffect(effectNode, effect, animType, finishCb, target, unuseCb, initCb);
            return effectNode;
        }
        effectNode = new cc.Node();
        this._initEffect(effectNode, effect, animType, finishCb, target, unuseCb, initCb);
        return effectNode;
    }

    private _initEffect(effectNode: cc.Node, clip: cc.AnimationClip | sp.SkeletonData, effType:AnimType,  finishCb?: (event: cc.Event.EventCustom) => void, target?: any, unuseCb?: Function, initCb?: Function){
        effectNode.groupIndex = GROUPS_OF_NODE.PARKOUR_DEFAULT;
        //Cocos动画
        if(effType == AnimType.AnimClip){
            this._initCocosAnimNode(effectNode);
            let animComp = effectNode.getComponent(cc.Animation);
            let spriteComp = effectNode.getComponent(cc.Sprite);
            cc.isValid(clip) && animComp.addClip(clip as cc.AnimationClip);
            initCb && initCb.call(target, animComp, spriteComp);
            finishCb && animComp.on(cc.Animation.EventType.FINISHED, finishCb, {context: target, target: effectNode, finishCb: unuseCb});
            return;
        }

        //spine
        this._initSpineNode(effectNode);
        let animComp = effectNode.getComponent(sp.Skeleton)
        animComp.skeletonData = (clip as sp.SkeletonData);
        initCb && initCb.call(target, animComp);
        finishCb && animComp.setCompleteListener(finishCb.bind({context: target, target: effectNode, finishCb: unuseCb}));
    }

    private _initSpineNode(effectNode: cc.Node){
        let animComp = effectNode.getComponent(sp.Skeleton);
        !cc.isValid(animComp) && (animComp = effectNode.addComponent(sp.Skeleton));
        animComp.skeletonData && animComp.clearTracks();
        animComp.skeletonData = null;
    }

    private _initCocosAnimNode(effectNode: cc.Node){
        if(!cc.isValid(effectNode)) return;
        let spriteComp = effectNode.getComponent(cc.Sprite);
        !cc.isValid(spriteComp) && (spriteComp = effectNode.addComponent(cc.Sprite));
        spriteComp.spriteFrame = null;
        spriteComp.sizeMode = cc.Sprite.SizeMode.TRIMMED;
        spriteComp.type = cc.Sprite.Type.SIMPLE;
        spriteComp.trim = true;
        let animComp = effectNode.getComponent(cc.Animation);
        !cc.isValid(animComp) && (effectNode.addComponent(cc.Animation));
    }

    private _getPool(animType: AnimType){
        if(animType == AnimType.AnimClip){
            this._effectPool = this._effectPool || new cc.NodePool();
            return this._effectPool;
        }
        this._effectSpPool = this._effectSpPool || new cc.NodePool();
        return this._effectSpPool;
    }

    putEffect(effectNode: cc.Node, animType: AnimType){
        if(!cc.isValid(effectNode)) return;
        let effectPool = this._getPool(animType);
        if(animType == AnimType.AnimClip){
            let animComp: cc.Animation = effectNode.getComponent(cc.Animation);
            animComp.off(cc.Animation.EventType.FINISHED);
            effectNode.anchorX = 0.5;
            effectNode.anchorY = 0.5;
            let spriteComp = effectNode.getComponent(cc.Sprite);
            spriteComp.spriteFrame = null;
            effectPool.put(effectNode);
            return;
        }

        let animComp: sp.Skeleton = effectNode.getComponent(sp.Skeleton);
        animComp.clearTracks();
        animComp.setCompleteListener(null);
    }

    clear(){
        this._effectPool && this._effectPool.clear();
        this._effectSpPool && this._effectSpPool.clear();
    }
}

export const effectNodePool = new EffectNodePool();
