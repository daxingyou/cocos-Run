
/*
 * @Description:特效层，目前放置子弹击中效果
 * @Version: 1.0
 * @Autor: lixu
 * @Date: 2021-08-05 13:49:23
 * @LastEditors: lixu
 * @LastEditTime: 2021-08-13 15:41:30
 */
const {ccclass, property} = cc._decorator;

@ccclass
export default class EffectLayerComp extends cc.Component {
    addEffect(...params: any[]){
        let clip: cc.AnimationClip = params[0];
        let pos = params[1];
        let effectNode = effectNodePool.getEffect(clip, this._onEffectFinish, this);
        effectNode.parent = this.node;
        effectNode.setPosition(pos);
        effectNode.getComponent(cc.Animation).play(clip.name);
    }

    private _onEffectFinish(event: cc.Event.EventCustom){
        let param: any = this;
        effectNodePool.putEffect(param.target)
    }

    deInit(){
        effectNodePool.clear();
    }
}

class EffectNodePool{
    private _effectPool: cc.NodePool = null;
    constructor(){}

    getEffect(effect: cc.AnimationClip, finishCb?: (event: cc.Event.EventCustom) => void, target?: any){
        let pool = this._getPool();
        let effectNode: cc.Node = null;
        if(pool.size() > 0){
            effectNode = pool.get();
            this._initEffect(effectNode, effect, finishCb, target);
            return effectNode;
        }
        effectNode = new cc.Node();
        this._initEffect(effectNode, effect, finishCb, target);
        return effectNode;
    }

    private _initEffect(effectNode: cc.Node, clip: cc.AnimationClip, finishCb?: (event: cc.Event.EventCustom) => void, target?: any){
        let animComp = effectNode.getComponent(cc.Animation);
        if(!animComp){
            animComp = effectNode.addComponent(cc.Animation);
        }
        
        let spriteComp = effectNode.getComponent(cc.Sprite);
        if(!spriteComp){
            spriteComp = effectNode.addComponent(cc.Sprite);
        }
        spriteComp.spriteFrame = null;
        animComp.addClip(clip);
        finishCb && animComp.on(cc.Animation.EventType.FINISHED, finishCb, {context: target, target: effectNode});
    }

    private _getPool(){
        this._effectPool = this._effectPool || new cc.NodePool();
        return this._effectPool;
    }

    putEffect(effectNode: cc.Node){
        if(!cc.isValid(effectNode)) return;
        let effectPool = this._getPool();
        let animComp: cc.Animation = effectNode.getComponent(cc.Animation);
        animComp.off(cc.Animation.EventType.FINISHED);
        effectNode.removeComponent(animComp);
        let spriteComp = effectNode.getComponent(cc.Sprite);
        spriteComp.spriteFrame = null;
        effectPool.put(effectNode);
    }

    clear(){
        if(this._effectPool){
            this._effectPool.clear();
        }
        this._effectPool = null;
    }
}

const effectNodePool = new EffectNodePool();
