import ItemBullet from "../../view-item/ItemBullet";
import { ActorManager } from "../ActorManager";
import { ParkourBulletOwnerType, RoleColliderType } from "../ParkourConst";
import ParkourMonster from "../ParkourMonster";
import RoleLogicComp from "../RoleLogicComp";
import MicroBullet from "./MicroBullet";

/*
 * @Description: 具有碰撞器的一颗子弹，其子节点为挂载MicroBullet组件的节点
 * @Version: 1.0
 * @Autor: lixu
 * @Date: 2021-06-23 18:59:28
 * @LastEditors: lixu
 * @LastEditTime: 2021-08-16 16:19:15
 */
const {ccclass, property} = cc._decorator;

@ccclass
export default class SonBullet extends cc.Component {
    @property({type: [MicroBullet]}) bullets: MicroBullet[] = [];

    private _itemBulletComp: ItemBullet = null;
    private _isValid: boolean = false;  //是否有效子弹，防止同一个子弹同时打中两个角色，对两个角色同时造成伤害

    private _animComp: cc.Animation = null;
    private _originalPos: cc.Vec2 = null;
    private _originalScale: cc.Vec2 = null;
    private _originalAngle: number = 0;
    private _originalSize: cc.Size = null;
    private _originalColor: cc.Color = null;
    private _originalOpacity: number = null;
    private _originalSkew: cc.Vec2 = null;
    private _isinit: boolean = false;
    private _onBoomCb: Function = null;

    onInit(itemBullet: ItemBullet, ...rest: any[]){
        this._itemBulletComp = itemBullet;
        !this._isinit && this._init();
        this.node.active = true;
        this.init();
        this.bullets.forEach(ele => {
            ele.onInit();
        });
    }

    deInit(...rest: any[]){
        this._isValid = false;
        this.bullets.forEach(ele => {
            ele.deInit();
        });
    }

    onCollisionEnter(other: cc.Collider, self: cc.Collider){
        if(!this._isValid) return;
        if((other.node.name == 'Monster' && this._itemBulletComp.getBulletOwnerType() == ParkourBulletOwnerType.Player && other.node.getComponent(ParkourMonster).getMonsterInfo() && !other.node.getComponent(ParkourMonster).getMonsterInfo().isDead() && other.node.getComponent(ParkourMonster).isInView())
        || (other.node.name == 'Actor' && this._itemBulletComp.getBulletOwnerType() == ParkourBulletOwnerType.Monster && !ActorManager.getInstance().getRoleInfo(other.node.getComponent(RoleLogicComp)).isDead()) && other.tag == RoleColliderType.NORMAL){
            if(!this._itemBulletComp.bullet.isThrough){
                this._isValid = false;
                this._itemBulletComp.onEnterCollision(this, other, self);
            }
        }
    }

    isAttackValid(): boolean{
        return this._isValid;
    }

    onCollisionStay(other: cc.Collider, self: cc.Collider){

    }

    onCollisionExit(other: cc.Collider, self: cc.Collider){

    }

    playFly(){
        this._animComp && this._playAnim(this._animComp);
        this.bullets.forEach(ele => {
            ele.playFly();
        });
    }

    playBoom(cb: Function){
        this._animComp && this._animComp.stop();
        this._onBoomCb = cb;
        this.bullets.forEach(ele => {
            ele.playBoom(this._itemBulletComp.getBulletOwnerType());
        });
        this._boomFinish();
    }

    //子弹自爆
    autoPlayBoom(cb: Function){
        if(!this._isValid) return;
        this._isValid = false;
        this.playBoom(cb);
    }

    private _boomFinish(){
        this.node.active = false;
        this._onBoomCb && this._onBoomCb(this);

    }

    private _init(){
        this._animComp = this.node.getComponent(cc.Animation);
        this._originalPos = cc.v2(this.node.x, this.node.y);
        this._originalScale = cc.v2(this.node.scaleX, this.node.scaleY);
        this._originalAngle = this.node.angle;
        this._originalSize = cc.size(this.node.width, this.node.height);
        this._originalColor = cc.color(this.node.color.getR(), this.node.color.getG(), this.node.color.getB(), this.node.color.getA());
        this._originalOpacity = this.node.opacity;
        this._originalSkew = cc.v2(this.node.skewX, this.node.scaleY);
        this._isinit = true;
    }

    private init(){
        this._animComp && this._animComp.stop();
        this._isValid = true;
        this.node.x = this._originalPos.x;
        this.node.y = this._originalPos.y;
        this.node.scaleX = this._originalScale.x;
        this.node.scaleY = this._originalScale.y;
        this.node.angle = this._originalAngle;
        this.node.width = this._originalSize.width;
        this.node.height = this._originalSize.height;
        this.node.color = this._originalColor.clone();
        this.node.opacity = this._originalOpacity;
        this.node.skewX = this._originalSkew.x;
        this.node.skewY = this._originalSkew.y;
    }

    private _playAnim(animComp: cc.Animation){
        let clipName = animComp.defaultClip ? animComp.defaultClip.name : null;
        if(!clipName){
            let clips = animComp.getClips();
            if(clips && clips.length > 0){
                clipName = clips[0].name;

            }
        }
        if(!clipName){
            cc.warn('SonBullet: 没有设置子弹的动画资源clip');
            return;
        }
        animComp.play(clipName);
    }
}
