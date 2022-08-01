/*
 * @Description:炸弹陷阱
 * @Version: 1.0
 * @Autor: lixu
 * @Date: 2021-08-24 19:30:25
 * @LastEditors: lixu
 * @LastEditTime: 2021-10-30 13:53:56
 */
import { parkourItemPoolMananger } from "../view-parkour/ItemPoolManager";
import { ItemWeights, TRAP_TYPE } from "../view-parkour/ParkourConst";
import TrapBase from "../view-parkour/TrapBase";
import { ParkourScene } from "../view-scene/ParkourScene";

const {ccclass, property} = cc._decorator;

const Active_offsetY = 100;
const EffectMoveTime: number = 2;
const EffectMoveDis: number = -300;

const BoomAninOffsetY = -100;

@ccclass
export default class ItemTrapBomb extends TrapBase {
    @property(cc.Node) renderNode: cc.Node = null;
    @property(sp.SkeletonData) boomClip: sp.SkeletonData= null;
    protected _trapType: TRAP_TYPE = TRAP_TYPE.FIXED;
    private _isTrig: boolean = false;
    private _activePos: number = cc.winSize.width + Active_offsetY;

    private set isTrig(value: boolean){
        if(this._isTrig == value) return;
        this._isTrig = value;
        if(!this._isTrig){
            this.renderNode.getComponent(sp.Skeleton).clearTracks();
            this._setCollider(false);
        }
        if(this._isTrig){
            this._setCollider(true);
            this._playAnim();
        }
    }

    private get isTrig(): boolean{
        return this._isTrig;
    }

    protected onInit(...params: any[]){
        super.onInit(...params);
        this._isTrig = false;
        this._setCollider();
    }

    private _setCollider(enable: boolean = false){
        let collider = this.node.getComponent(cc.CircleCollider);
        if(!collider) return;
        collider.enabled = enable;
    }

    update(dt: number){
        if(this.isTrig) return;
        this.checkBeTrig();
    }

    //弹出型陷阱被触发
    checkBeTrig(){
        let worldPos = this.node.parent.convertToWorldSpaceAR(this.node.getPosition());
        if(worldPos.x <= this._activePos){
          this.isTrig = true;
        }
    }

    onCollisionEnter(other: cc.Collider, self: cc.Collider){
        if(!this.isTrig) return;
        if(this._isDestroy) return;
        this.checkBeDestory(other, self);
    }

    //触发陷阱
    checkBeDestory(other: cc.Collider, self: cc.Collider){
        let isActor = this.isActor(other, self);
        if(isActor && !this._isDestroy){
            this._isDestroy = true;
            this._generateReward();
            let offset = (self as cc.CircleCollider).offset;
            let pos = this.node.parent.convertToWorldSpaceAR(this.node.getPosition());
            pos.x += offset.x;
            pos.y += (offset.y + BoomAninOffsetY);
            this.doRecycle();
            this._playBoomAnin(pos);
        }
    }

    private _playBoomAnin(pos: cc.Vec2){
        let effectNode = ParkourScene.getInstance().getEffectLayerComp().getEffectNode(true, this.boomClip, this._onBoomAnimFinish, this, null, pos);
        cc.tween(effectNode).by(EffectMoveTime, {x: EffectMoveDis}).start();
    }

    private _onBoomAnimFinish(effectNode: cc.Node){
        if(!cc.isValid(effectNode)) return;
        cc.Tween.stopAllByTarget(effectNode);
    }

    private _playAnim(){
        this.renderNode.getComponent(sp.Skeleton).setAnimation(0, 'animation', true);
    }

    protected doRecycle(){
      super.doRecycle();
      parkourItemPoolMananger.putItem(this.getKey(), this.node);
    }

    protected getWeight(): number{
      return ItemWeights.BOMB;
  }
}
