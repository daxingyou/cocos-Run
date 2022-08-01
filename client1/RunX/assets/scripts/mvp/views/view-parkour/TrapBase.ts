/*
 * @Description: 陷阱基类
 * @Autor: lixu
 * @Date: 2021-05-14 11:45:40
 * @LastEditors: lixu
 * @LastEditTime: 2021-11-15 11:20:52
 */
import { utils } from '../../../app/AppUtils';
import { eventCenter } from '../../../common/event/EventCenter';
import { parkourEvent } from '../../../common/event/EventData';
import { cfg } from '../../../config/config';
import { data } from '../../../network/lib/protocol';
import {RoleColliderType, TRAP_TYPE, ValueType} from './ParkourConst';
const {ccclass, property} = cc._decorator;

@ccclass
export default class TrapBase extends cc.Component {

    protected _trapType: TRAP_TYPE = null;
    private _collider: cc.Collider = null;
    protected _isDestroy: boolean = false;
    protected _info: cfg.RunXTraps = null;

    get trapType(){
        return this._trapType;
    }

    getKey(): string{
        return (this._info && this._info.ArtID) || null;
    }

    reuse(...params: any[]){
        this.onInit(...params);
    }

    unuse(){
        this.deInit();
    }

    //伤害为攻击目标血量的万分比
    get damage(){
        return (this._info && this._info.Damage / 10000) || 0;
    }

    get damageType(){
        return ValueType.Percentage;
    }

    getRewards(){
        return this._parseDrops(this._info.DropProps);
    }

    protected onInit(...params: any[]){
        this._isDestroy = false;
        //陷阱配置
        if(params.length > 0 && !this._info){
            this._info = params[0]
        }
    }

    protected deInit(...params: any[]){

    }

    onRelease(){
        this._trapType = null;
        this._info = null;
    }

    private _parseDrops(drops: string): data.IItemInfo[]{
        if(!drops || drops.length == 0) return null;
        return utils.parseStr2Iteminfo(drops);
    }

    isActor(other: cc.Collider, self: cc.Collider){
        return (other.node.name === "Actor" && other.node.active && other.tag === RoleColliderType.NORMAL);
    }

    lateUpdate(dt:number) {
        this._checkReCycle();
    }

    private _checkReCycle(){
        if(cc.isValid(this.node) && cc.isValid(this.node.parent)){
            let pos = this.node.getPosition();
            let worldBox = this.node.getBoundingBoxToWorld();
            if(worldBox.xMax < 0){
                this.doRecycle();
            }
        }
    }

    protected _generateReward(){
      let reward = this.getRewards();
      if(!reward || reward.length == 0) return;
      let pos = this.node.parent.convertToWorldSpaceAR(this.node.getPosition());
      eventCenter.fire(parkourEvent.PRODUCT_ITEM, pos, reward);
    }

    protected doRecycle(){
        this._isDestroy = true;
    }
}
