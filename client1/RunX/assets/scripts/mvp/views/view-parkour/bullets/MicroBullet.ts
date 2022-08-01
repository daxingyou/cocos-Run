/*
 * @Description: 原子级的子弹组件, 不可再进行拆分
 * @Version: 1.0
 * @Autor: lixu
 * @Date: 2021-06-23 19:07:44
 * @LastEditors: lixu
 * @LastEditTime: 2021-10-29 18:56:33
 */

import { eventCenter } from "../../../../common/event/EventCenter";
import { parkourEvent } from "../../../../common/event/EventData";
import { ParkourBulletOwnerType } from "../ParkourConst";

const {ccclass, property} = cc._decorator;

@ccclass
export default class MicroBullet extends cc.Component {
    @property(sp.Skeleton) flyAnim: sp.Skeleton = null;
    @property(cc.AnimationClip) boomClip: cc.AnimationClip = null;

    onInit(...rest: any[]){
        this._initAnim(this.flyAnim);
    }

    deInit(...rest: any){
        this._initAnim(this.flyAnim);
    }

    playFly(){
        this._initAnim(this.flyAnim);
        if(!this.flyAnim){
            cc.warn('子弹预制体有问题: 没有配置子弹的飞行动画');
            return;
        }
        this._playAnim();
    }

    playBoom(bulletType: ParkourBulletOwnerType){
        this._initAnim(this.flyAnim);
        if(!this.boomClip) return;
        eventCenter.fire(parkourEvent.ADD_BOOM_EFFECT, this.boomClip, this.node.parent.convertToWorldSpaceAR(this.node.getPosition()), bulletType);
    }

    private _playAnim(){
        if(!this.flyAnim || !this.flyAnim.skeletonData) return;
        this.flyAnim.setAnimation(0, 'animation', true);
    }

    private _initAnim(comp: sp.Skeleton){
        if(!comp) return;
        comp.clearTracks();
    }
}
