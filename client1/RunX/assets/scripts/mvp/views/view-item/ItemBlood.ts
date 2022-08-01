/*
 * @Description: 恢复型道具
 * @Autor: lixu
 * @Date: 2021-05-14 11:22:03
 * @LastEditors: lixu
 * @LastEditTime: 2021-08-19 15:08:02
 */

import ItemBase from '../view-parkour/ItemBase';
import { ItemEffect, ItemType, ItemWeights} from '../view-parkour/ParkourConst';
import {eventCenter} from '../../../common/event/EventCenter';
import {parkourEvent} from '../../../common/event/EventData';
import { parkourItemPoolMananger } from '../view-parkour/ItemPoolManager';
import RoleLogicComp from '../view-parkour/RoleLogicComp';
const {ccclass, property} = cc._decorator;
const ANIMATION_INTERVAL = 3;
@ccclass
export default class ItemBlood extends ItemBase {
    protected _itemType: ItemType = ItemType.USED_BLOOD;

    onInit(...params: any[]){
        super.onInit(...params)
        this.play();
    }

    protected play(){
        this.schedule(this._playAnim, ANIMATION_INTERVAL, cc.macro.REPEAT_FOREVER, Math.random());
    }

    getEffctNum(): number{
        return this._info.RunXItemUseEffect == ItemEffect.ADD_BLOOD ? this._info.RunXItemUseNum : 0;
    }

    protected handleItemEvent(){
        eventCenter.fire(parkourEvent.USE_ITEM, this.itemType, this.target.getComponent(RoleLogicComp), this.getEffctNum());
    }

    private _playAnim(){
        let animComp = this.node.getComponent(cc.Animation);
        animComp.play();
    }

    protected stopAnim(){
      let animComp = this.node.getComponent(cc.Animation);
      animComp.stop();
      this.unschedule(this._playAnim);
    }

    protected getWeight(): number{
        return ItemWeights.BLOOD;
    }
}
