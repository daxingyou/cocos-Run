/*
 * @Description: 突刺陷阱
 * @Autor: lixu
 * @Date: 2021-05-14 13:09:40
 * @LastEditors: lixu
 * @LastEditTime: 2021-11-02 14:12:16
 */
import TrapBase from '../view-parkour/TrapBase';
import { ItemWeights, ParkourLazyLoadType, TRAP_TYPE} from '../view-parkour/ParkourConst';
import { parkourItemPoolMananger } from '../view-parkour/ItemPoolManager';
import { ActorManager } from '../view-parkour/ActorManager';
import RoleLogicComp from '../view-parkour/RoleLogicComp';
import { ParkourScene } from '../view-scene/ParkourScene';
import { lazyLoadRes } from '../view-parkour/ParkourString';
import { parkourSpineCache } from '../view-parkour/RoleLayerComp';
const {ccclass, property} = cc._decorator;

@ccclass
export default class ItemTrapSprike extends TrapBase {
    @property(cc.Node) renderNode: cc.Node = null;
    //陷阱触发区域
    @property({tooltip: "陷阱触发区域"}) trigRect: cc.Rect = cc.rect(0,0, 60, 100);
    protected _trapType: TRAP_TYPE = TRAP_TYPE.FIXED;
    private _isTrig: boolean = false;

    private set isTrig(value: boolean){

        if(this._isTrig == value) return;
        this._isTrig = value;
        this._setCollider(this._isTrig);
        let animComp = this.renderNode.getComponent(sp.Skeleton);
        animComp.clearTrack(0);
        if(this._isTrig){
            animComp.setAnimation(0,'animation2', false);
            animComp.addAnimation(0, 'animation3', false);
        }
    }

    private get isTrig(): boolean{
        return this._isTrig;
    }

    protected onInit(...params: any[]){
        super.onInit(...params);
        this._initSpineData();
        this.isTrig = false;
        this._setCollider();
        Promise.resolve().then(()=> {
            let animComp = this.renderNode.getComponent(sp.Skeleton);
            animComp.clearTrack(0);
            animComp.setAnimation(0, 'animation', false);
        });
    }

    private _initSpineData(){
        let spineComp: sp.Skeleton = this.renderNode.getComponent(sp.Skeleton);
        if(cc.isValid(spineComp) && !spineComp.skeletonData){
            spineComp.skeletonData = parkourSpineCache.getSpineData(ParkourScene.getInstance().getCurrTrapSprikePath());
        }
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
        this.isTrig = false;
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
        return ItemWeights.SPRIKE;
    }
}
