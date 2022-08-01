/*
 * @Description:跑酷暂停后再继续的提示
 * @Version: 1.0
 * @Autor: lixu
 * @Date: 2021-06-15 18:28:16
 * @LastEditors: lixu
 * @LastEditTime: 2021-08-31 15:01:26
 */

const {ccclass, property} = cc._decorator;

const SCALE_TO = 0.3;

@ccclass
export default class PauseTip extends cc.Component {

    @property(cc.SpriteFrame) firstFrame: cc.SpriteFrame = null;
    @property(cc.SpriteFrame) secondFrame: cc.SpriteFrame = null;
    @property(cc.SpriteFrame) thirdFrame: cc.SpriteFrame = null;
    @property(cc.Node) insideCirle: cc.Node = null;
    @property(cc.Node) outsideCirle: cc.Node = null;

    private _spriteComp: cc.Sprite = null;

    onInit(){
        this.node.active = false;
        this._spriteComp = cc.find("pauseTip", this.node).getComponent(cc.Sprite);
    }

    deInit(){
        this.hide();
    }

    show(cb?: Function){
        this.node.active = true;

        let insideTween = cc.tween().call(()=>{
            this.insideCirle.opacity = 255;
            this.insideCirle.scale = 0.8;
        }, this).to(1, {scale: 1.5, opacity: 0}, {easing: 'smooth'});

        let outsideTween = cc.tween().call(()=>{
            this.outsideCirle.opacity = 255;
            this.outsideCirle.scale = 1;
        }, this).to(1, {scale: 2, opacity: 0}, {easing: 'smooth'});

        let curFrame = 4;
        let tweem = cc.tween().call(()=>{
            curFrame -= 1;
            this._spriteComp.spriteFrame = this._getCurFrame(curFrame);
            this._spriteComp.node.scale = 0.3;
            this._spriteComp.node.opacity = 255;
        }, this).to(0.3, {scale: 1.2}).to(0.1, {scale: 1}).delay(0.3).to(0.3, {scale: 0.3, opacity: 0}, {easing: 'smooth'});

        cc.tween(this._spriteComp.node).repeat(3, tweem).call(()=> {
            this.hide();
            cb && cb();
        }, this).start();
        cc.tween(this.insideCirle).repeat(3,insideTween).start();
        cc.tween(this.outsideCirle).repeat(3,outsideTween).start();
    }

    private _getCurFrame(frame: number){
        if(frame == 3) return this.thirdFrame;
        if(frame == 2) return this.secondFrame;
        return this.firstFrame;
    }

    hide(){
        cc.Tween.stopAllByTarget(this._spriteComp.node);
        cc.Tween.stopAllByTarget(this.insideCirle);
        cc.Tween.stopAllByTarget(this.outsideCirle);
        this._spriteComp.spriteFrame = null;
        this.node.active = false;
    }
}
