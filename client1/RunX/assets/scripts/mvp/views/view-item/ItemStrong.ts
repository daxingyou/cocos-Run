/*
 * @Description:强化道具
 * @Version: 1.0
 * @Autor: lixu
 * @Date: 2021-07-22 15:57:55
 * @LastEditors: lixu
 * @LastEditTime: 2021-08-19 15:41:13
 */
import { eventCenter } from "../../../common/event/EventCenter";
import { parkourEvent } from "../../../common/event/EventData";
import ItemBase from "../view-parkour/ItemBase";
import { parkourItemPoolMananger } from "../view-parkour/ItemPoolManager";
import { ItemEffect, ItemType, ItemWeights } from "../view-parkour/ParkourConst";
import RoleLogicComp from "../view-parkour/RoleLogicComp";

const {ccclass, property} = cc._decorator;
const ANIMATION_INTERVAL = 3;
@ccclass
export default class ItemStrong extends ItemBase {
  protected _itemType: ItemType = ItemType.USED_STRONG;

  onInit(...params: any[]){
      super.onInit(...params)
      this.play();
  }

  protected play(){
      this.schedule(this._playAnim, ANIMATION_INTERVAL, cc.macro.REPEAT_FOREVER, Math.random());
  }

  getEffctNum(): number{
      return this._info.RunXItemUseEffect == ItemEffect.STRONG ? this._info.RunXItemUseNum : 0;
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
      return ItemWeights.STRONG;
  }
}
