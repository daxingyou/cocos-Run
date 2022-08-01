/*
 * @Description: 石头障碍
 * @Autor: lixu
 * @Date: 2021-05-14 13:48:11
 * @LastEditors: lixu
 * @LastEditTime: 2021-08-18 20:03:30
 */
import TrapBase from '../view-parkour/TrapBase';
import { TRAP_TYPE} from '../view-parkour/ParkourConst';
import { parkourItemPoolMananger } from '../view-parkour/ItemPoolManager';
import { ActorManager } from '../view-parkour/ActorManager';
import RoleLogicComp from '../view-parkour/RoleLogicComp';
const {ccclass, property} = cc._decorator;

@ccclass
export default class ItemStone extends TrapBase {
    protected _trapType: TRAP_TYPE = TRAP_TYPE.HINDER;

    onCollisionEnter(other: cc.Collider, self: cc.Collider){
        this.checkBeDestory(other, self);
    }

    onCollisionStay(other: cc.Collider, self: cc.Collider){
        this.checkBeDestory(other, self);
    }

    onCollisionExit(other: cc.Collider, self: cc.Collider){

    }


    //陷阱被破坏
    checkBeDestory(other: cc.Collider, self: cc.Collider){
        let isActor = this.isActor(other, self);
        if(this.trapType == TRAP_TYPE.HINDER && isActor){
            let roleComp = other.node.getComponent(RoleLogicComp);
            let roleInfo = ActorManager.getInstance().getRoleInfo(roleComp);
            if(!roleInfo.isDead() && roleInfo.isPengZhuangState()){ //碰撞状态
                this.doRecycle();
            }
        }
    }

    //Override
    protected doRecycle(){
        parkourItemPoolMananger.putItem(this.getKey(), this.node);
    }
}
