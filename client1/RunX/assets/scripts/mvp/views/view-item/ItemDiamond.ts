
import { eventCenter } from "../../../common/event/EventCenter";
import { parkourEvent } from "../../../common/event/EventData";
import ItemBase from "../view-parkour/ItemBase";
import { ItemEffect, ItemType, ItemWeights } from "../view-parkour/ParkourConst";

/*
 * @Description:钻石道具
 * @Version: 1.0
 * @Autor: lixu
 * @Date: 2021-06-25 16:18:52
 * @LastEditors: lixu
 * @LastEditTime: 2021-08-20 18:06:13
 */
const {ccclass, property} = cc._decorator;

const SCALE_TIME = 0.04;
const SCALE_NUM = 1.5;

@ccclass
export default class ItemDiamond extends ItemBase {
    @property({tooltip:'扫光延迟，单位s', type: cc.Float}) lightDelay: number = 2;
    protected _itemType: ItemType = ItemType.REWARD_DIAMNOND;

    onInit(...params: any[]){
        super.onInit(...params);
        this.node.scale = 1;
        this.play();
    }

    protected play(){
        let tween: cc.Tween = cc.tween().call(() =>{
            this._playLight();
        }).delay(this.lightDelay);
        cc.tween(this.node).repeatForever(tween).start();
    }

    getEffctNum(){
        return this._info.RunXItemUseEffect == ItemEffect.DIAMOND ? this._info.RunXItemUseNum : 0;
    }

    private _playLight(){
        let animComp = this.node.getComponent(cc.Animation);
        animComp.play();
    }

    protected handleItemEvent(){
        eventCenter.fire(parkourEvent.UPDTAE_ITEM, this._itemType, this.getEffctNum());
    }

    protected afterHandleItem(){
        cc.tween(this.node).to(SCALE_TIME, {scale: SCALE_NUM}).call(() =>{
            super.afterHandleItem();
        }).start();
    }

    protected getWeight(): number{
        return ItemWeights.DIAMOND;
    }

    protected stopAnim(){
        let animComp = this.node.getComponent(cc.Animation);
        animComp.stop();
        cc.Tween.stopAllByTarget(this.node);
    }
}
