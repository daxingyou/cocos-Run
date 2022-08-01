/*
 * @Description:跑酷道具基类，所有的道具类都继承自该类
 * @Autor: lixu
 * @Date: 2021-05-07 20:09:12
 * @LastEditors: lixu
 * @LastEditTime: 2021-08-23 16:15:16
 */
//道具组件
import {ItemType, RoleColliderType} from './ParkourConst';
import { cfg } from "../../../config/config";
import { ParkourScene } from '../view-scene/ParkourScene';
import { parkourItemPoolMananger } from './ItemPoolManager';
const {ccclass, property} = cc._decorator;

const VisibleRect = cc.rect(0, 0, cc.winSize.width, cc.winSize.height);
const MOVE_SPEED = 1800;
const MIN_DISTANCE = 45;

@ccclass
export default class ItemBase extends cc.Component {

    protected _itemType: ItemType = null;
    protected _isDestroy: boolean = false;
    protected _info: cfg.RunXItem = null;

    get itemType(){
        return this._itemType;
    }

    getKey(): string{
        return (this._info && this._info.ArtID) || null;
    }

    private _colliderComp: cc.Collider = null;
    private _target: cc.Node = null;
    private _isTrig: boolean = false;

    protected onInit(...params: any[]){
        this._isDestroy = false;
        this._colliderComp = this.node.getComponent(cc.BoxCollider);
        this._colliderComp.enabled = true;
        //设置道具配置
        if(params.length > 0 && !this._info){
          this._info = params[0];
        }
    }

    protected deInit(...params: any){
        this.stopAnim();
        this._isDestroy = true;
        this._target = null;
        this._isTrig = false;
        this.colliderComp && (this.colliderComp.enabled = false);
        this._colliderComp = null;
    }

    onRelease(){
        this._itemType = null;
        this._info = null;
    }

    unuse(){
        this.deInit();
    }

    reuse(...params: any[]){
        this.onInit(...params);
    }

    get colliderComp(){
        return this._colliderComp;
    }


    protected play(): void{

    }

    set target(target : cc.Node){
        this._target = target;
    }

    get target(){
        return this._target;
    }

    set isTrig(tragable: boolean){
        this._isTrig = tragable;
    }

    get isTrig(){
        return this._isTrig;
    }

    isActor(other: cc.Collider, self: cc.Collider){
        return (other.node.name === "Actor" && other.tag === RoleColliderType.NORMAL);
    }

    protected onCollisionEnter (other: cc.Collider, self: cc.Collider){
        if(!this._isDestroy &&this.isActor(other, self) && !cc.isValid(this.target) && !this.isTrig){
            this.colliderComp.enabled = false;
            this.target = other.node;
            this.isTrig = true;
            this.changeToItemLayer();
        }
    }

    protected changeToItemLayer(){
        let itemManager = ParkourScene.getInstance().getItemManager();
        if(!itemManager || !cc.isValid(itemManager)) return;
        let pos = this.node.parent.convertToWorldSpaceAR(this.node.position);
        itemManager.attachNodeToSelf(this.node);
        pos = this.node.parent.convertToNodeSpaceAR(pos);
        this.node.setPosition(pos);
    }


    update(dt: number){
      if(this._isDestroy) return;
      if(!this.target || !this.isTrig) return;

      let targetPos = this.target.parent.convertToWorldSpaceAR(this.target.position);
      targetPos.y += this.target.height / 2;
      targetPos.x += this.target.width / 2;
      targetPos = this.node.parent.convertToNodeSpaceAR(targetPos);

      let selfPos = this.node.getPosition();

      let delta = cc.v3(targetPos.x, targetPos.y, 0).sub(cc.v3(selfPos.x, selfPos.y, 0));
      let disrance = delta.mag();

      this.node.x = selfPos.x + MOVE_SPEED * dt * delta.x / disrance;
      this.node.y = selfPos.y + MOVE_SPEED * dt * delta.y / disrance;

      if(disrance <= MIN_DISTANCE){
          this.stopAnim();
          this._isDestroy = true;
          this.handleItemEvent();
          this.afterHandleItem();
      }
    }

    //停止道具动画
    protected stopAnim(){

    }

    //道具生效的事件处理
    protected handleItemEvent(){

    }

    protected afterHandleItem(){
        this.doRecycle();
    }

    lateUpdate(dt:number) {
        this._checkReCycle();
    }

    private _checkReCycle(){
        if(cc.isValid(this.node) && cc.isValid(this.node.parent)){
            let pos = this.node.getPosition();
            let worldPos =  this.node.parent.convertToWorldSpaceAR(pos);
            if(worldPos.x < 0 && !VisibleRect.intersects(this.node.getBoundingBoxToWorld())){
                this.doRecycle();
            }
        }
    }

    //回收道具的方法
    doRecycle(){
        parkourItemPoolMananger.putItem(this.getKey(), this.node);
    }

    protected getWeight(): number{
        return 0;
    }
}
