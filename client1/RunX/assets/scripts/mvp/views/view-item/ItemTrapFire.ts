/*
 * @Description:天火陷阱
 * @Version: 1.0
 * @Autor: lixu
 * @Date: 2021-08-23 19:06:40
 * @LastEditors: lixu
 * @LastEditTime: 2021-09-03 11:10:26
 */
import { ActorManager } from "../view-parkour/ActorManager";
import { parkourItemPoolMananger } from "../view-parkour/ItemPoolManager";
import { ItemWeights, ParkourLazyLoadType, TRAP_TYPE } from "../view-parkour/ParkourConst";
import { lazyLoadRes } from "../view-parkour/ParkourString";
import RoleLogicComp from "../view-parkour/RoleLogicComp";
import TrapBase from "../view-parkour/TrapBase";
import { ParkourScene } from "../view-scene/ParkourScene";

const {ccclass, property} = cc._decorator;
const MOVE_SPEED: number = 1500;
const START_OFFSET_Y: number = 20;

@ccclass
export default class ItemTrapFire extends TrapBase {
    static AnimName: string[] = ['fire_1', 'fire_2', 'fire_3'];

    @property(cc.Node) renderNode: cc.Node = null;
    @property(cc.Node) renderNode1: cc.Node = null;
    @property({tooltip: "陷阱触发区域"}) trigRect: cc.Rect = cc.rect(0,0, 60, 100);
    protected _trapType: TRAP_TYPE = TRAP_TYPE.FIXED;
    private _isTrig: boolean = false;
    private _currStep: number = 0;
    private _targetPos: cc.Vec2 = null;
    private _moveTween: cc.Tween = null;

    private set isTrig(value: boolean){
        if(this._isTrig == value) return;
        this._isTrig = value;
        let animComp = this.renderNode.getComponent(cc.Animation);
        let animComp1 = this.renderNode1.getComponent(cc.Animation);

        if(this._isTrig){
            this._playAnim();
        }else{
            this._setCollider(false);
            animComp.stop();
            animComp1.stop();
            this.renderNode.getComponent(cc.Sprite).spriteFrame = null;
            this.renderNode1.getComponent(cc.Sprite).spriteFrame = null;

        }
    }

    private get isTrig(): boolean{
        return this._isTrig;
    }

    private _setStartPos(){
        let startPos = this.node.parent.convertToNodeSpaceAR(cc.v2(0, cc.winSize.height + START_OFFSET_Y));
        startPos.x = this.node.x;
        this.node.setPosition(startPos);
    }

    private _playAnim(){
        this._setStartPos();
        let animComp1 = this.renderNode1.getComponent(cc.Animation);
        animComp1.on(cc.Animation.EventType.FINISHED, this._onAnimFinished, this);
        this._currStep += 1;
        let animComp = this.renderNode.getComponent(cc.Animation);
        animComp.play(`fire_${this._currStep}`);

        let costTime: number = Math.round(Math.abs(this.node.y - this._targetPos.y) / MOVE_SPEED  * 100) / 100;
        this._moveTween = cc.tween(this.node).to(costTime , {y: this._targetPos.y}, {easing: 'quadIn'}).call(() => {
            this._onAnimFinished();
            animComp.stop();
            this.renderNode.getComponent(cc.Sprite).spriteFrame = null;
            this._moveTween = null;
        }, this).start();
    }

    private _onAnimFinished(){
        if(this._currStep < ItemTrapFire.AnimName.length){
            let animComp1 = this.renderNode1.getComponent(cc.Animation);
            this._currStep += 1;
            if(this._currStep == ItemTrapFire.AnimName.length){
                this._setCollider(true);
            }
            animComp1.play(`fire_${this._currStep}`);
        }
    }

    protected onInit(...params: any[]){
        super.onInit(...params);
        let targetPos = params[1];
        this._targetPos = targetPos;
        this.isTrig = false;
        this._setCollider();
    }

    update(dt: number){
        if(this.isTrig) return;
        this.checkBeTrig();
    }

    private _setCollider(enable: boolean = false){
        let collider = this.node.getComponent(cc.BoxCollider);
        if(!collider) return;
        collider.enabled = enable;
    }

    protected deInit(...params: any[]){
        super.deInit(...params);
        let animComp = this.renderNode.getComponent(cc.Animation);
        let animComp1 = this.renderNode1.getComponent(cc.Animation);
        animComp1.off(cc.Animation.EventType.FINISHED, this._onAnimFinished, this);
        animComp.stop();
        animComp1.stop();
        this.isTrig = false;
        this._currStep = 0;
        if(this._moveTween){
            this._moveTween.stop();
            this._moveTween = null;
        }
    }

    onCollisionEnter(other: cc.Collider, self: cc.Collider){
        if(!this.isTrig) return;
        if(this._isDestroy) return;
        this.checkBeDestory(other, self);
    }

    onCollisionStay(other: cc.Collider, self: cc.Collider){
        if(!this.isTrig) return;
        if(this._isDestroy) return;
        this.checkBeDestory(other, self);
    }

    //弹出型陷阱被触发
    checkBeTrig(){
        if(ActorManager.getInstance().isAllRoleDead()) return;
        let roles = ActorManager.getInstance().getRoleInfos();
        let worldPos = this.node.convertToWorldSpaceAR(cc.v2(this.trigRect.x, this.trigRect.y));
        let trigWorldRect = cc.rect(worldPos.x, worldPos.y, this.trigRect.width, this.trigRect.height);
        for(let [key, value] of roles.entries()){
            if(key.isDead()) continue;
            let bonudBox = value.node.getBoundingBoxToWorld();
            if(trigWorldRect.intersects(bonudBox)){
                this.isTrig = true;
                break;
            }
        }
    }

    //陷阱被破坏
    checkBeDestory(other: cc.Collider, self: cc.Collider){
        let isActor = this.isActor(other, self);
        if(isActor && !this._isDestroy){
          let roleComp = other.node.getComponent(RoleLogicComp);
            let roleInfo = ActorManager.getInstance().getRoleInfo(roleComp);
            if((!roleInfo.isDead() && roleInfo.isPengZhuangState())){ //碰撞状态
                this._generateReward();
                let size = (self as cc.BoxCollider).size;
                let pos = this.node.parent.convertToWorldSpaceAR(this.node.getPosition());
                pos.y += (size.height >> 1);
                this.doRecycle();
                this._playBoomAnin(pos);
            }
        }
    }

    private _playBoomAnin(pos: cc.Vec2){
        let animClipCache = ParkourScene.getInstance().getAnimClipCache();
        let clip = animClipCache.getClip(lazyLoadRes[ParkourLazyLoadType.AnimClip]['MonsterBoom']);
        ParkourScene.getInstance().getEffectLayerComp().getEffectNode(true, clip, null, this, null, pos);
    }

    protected doRecycle(){
        super.doRecycle();
        parkourItemPoolMananger.putItem(this.getKey(), this.node);
    }

    protected getWeight(): number{
        return ItemWeights.FIRE;
    }
}
