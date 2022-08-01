import Main from "../main";

/*
 * @Description: 原子级的子弹组件, 不可再进行拆分
 * @Version: 1.0
 * @Autor: lixu
 * @Date: 2021-06-23 19:07:44
 * @LastEditors: lixu
 * @LastEditTime: 2021-08-05 20:09:14
 */
const {ccclass, property} = cc._decorator;


@ccclass
export default class MicroBullet extends cc.Component {
    @property(cc.Animation) flyAnim: cc.Animation = null;
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
        this._playAnim(this.flyAnim);
    }

    playBoom(){
        this._initAnim(this.flyAnim);
        if(!this.boomClip) return;
        Main.getInstance().mainController.effectLayer.addEffect(this.boomClip, this.node.parent.convertToWorldSpaceAR(this.node.getPosition()));
    }

    private _playAnim(comp: cc.Animation){
        let clipName = comp.defaultClip ? comp.defaultClip.name : null;
        if(!clipName){
            let clips = comp.getClips();
            if(clips && clips.length > 0){
                clipName = clips[0].name;
            }
        }

        if(!clipName){
            cc.warn('MicroBullet没有设置子弹的动画资源clip');
            return;
        }
        comp.play(clipName);
    }

    private _initAnim(comp: cc.Animation){
        if(!comp) return;
        comp.stop();
        let spriteComp = comp.node.getComponent(cc.Sprite);
        if(!spriteComp) return;
        spriteComp.spriteFrame = null;
    }
}
