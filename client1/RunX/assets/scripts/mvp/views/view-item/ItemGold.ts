/*
 * @Description:
 * @Autor: lixu
 * @Date: 2021-06-03 19:25:40
 * @LastEditors: lixu
 * @LastEditTime: 2021-11-18 14:46:03
 */
import ItemBase from '../view-parkour/ItemBase';
import { ItemEffect, ItemType, ItemWeights} from '../view-parkour/ParkourConst';
import {eventCenter} from '../../../common/event/EventCenter';
import {parkourEvent} from '../../../common/event/EventData';

const {ccclass, property} = cc._decorator;

const SCALE_TIME = 0.04;
const SCALE_NUM = 1.5;

@ccclass
export default class ItemGold extends ItemBase {
    protected _itemType: ItemType = ItemType.REWARD_GOLD;

    private _spriteNode: cc.Node = null;

    onInit(...params: any[]){
        super.onInit(...params);
        this.node.scale = 1;
        this._spriteNode = this._spriteNode || this.node.getChildByName('sprite');
        this.play();
    }

    protected play(){
        this._playGoldRandomAnim();
    }

    getEffctNum(): number{
        return this._info.RunXItemUseEffect == ItemEffect.GOLD ? this._info.RunXItemUseNum : 0;
    }

    protected handleItemEvent(){
        eventCenter.fire(parkourEvent.UPDTAE_ITEM, this._itemType, this.getEffctNum());
    }

    protected preRecycle(){
        let originalAnchorX = this.node.anchorX, originalAnchorY = this.node.anchorY;
        let sp = cc.find('sprite', this.node);
        let childOriginalAnchorX = sp.anchorX, childOriginalAnchorY = this.node.anchorY;
        this.node.anchorX = this.node.anchorY = 0.5;
        sp.anchorY = sp.anchorX = 0.5;
        cc.tween(this.node).to(SCALE_TIME, {scale: SCALE_NUM}).call(() =>{
            super.preRecycle();
            this.node.anchorX = originalAnchorX;
            this.node.anchorY = originalAnchorY;
            sp.anchorY = childOriginalAnchorY;
            sp.anchorX = childOriginalAnchorX;
        }).start();
    }

    //随机播放金币的旋转动画
    private _playGoldRandomAnim(){
        if(!cc.isValid(this._spriteNode)) return;
        let animComp = this._spriteNode.getComponent(cc.Animation);
        animComp.play('gold');
    }

    protected stopAnim(){
        if(!cc.isValid(this._spriteNode)) return;
        let animComp = this._spriteNode.getComponent(cc.Animation);
        animComp.stop();
        cc.Tween.stopAllByTarget(this);
    }

    protected getWeight(): number{
        return ItemWeights.COIN;
    }
}
