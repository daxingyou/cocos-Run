/*
 * @Description: 冲刺道具
 * @Autor: lixu
 * @Date: 2021-05-14 11:05:17
 * @LastEditors: lixu
 * @LastEditTime: 2021-08-19 15:02:08
 */
import ItemBase from '../view-parkour/ItemBase';
import { ItemEffect, ItemType, ItemWeights } from '../view-parkour/ParkourConst';
import {eventCenter} from '../../../common/event/EventCenter';
import {parkourEvent} from '../../../common/event/EventData';
import { parkourItemPoolMananger } from '../view-parkour/ItemPoolManager';
import RoleLogicComp from '../view-parkour/RoleLogicComp';

const {ccclass, property} = cc._decorator;
const ANIMATION_INTERVAL = 3;

@ccclass
export default class ItemSprint extends ItemBase {
    protected _itemType: ItemType = ItemType.USED_SKILL;

    onInit(...params: any[]){
        super.onInit(...params)
        this.play();
    }

    protected play(){
        this.schedule(this._playAnim, ANIMATION_INTERVAL, cc.macro.REPEAT_FOREVER, Math.random());
    }

    getEffctNum(): number{
        return this._info.RunXItemUseEffect == ItemEffect.CHONG_CI ? this._info.RunXItemUseNum/1000 : 0;
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
        return ItemWeights.CHONG_CI;
    }
}
