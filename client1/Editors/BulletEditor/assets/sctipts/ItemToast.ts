/*
 * @Description: 
 * @Autor: lixu
 * @Date: 2021-05-25 14:48:22
 * @LastEditors: lixu
 * @LastEditTime: 2021-05-25 15:00:48
 */

const {ccclass, property} = cc._decorator;

@ccclass
export default class ItemToast extends cc.Component {
    @property(cc.Label)
    label: cc.Label = null;

    reuse(msg: string){
        this.label.string = msg;
        this.node.setPosition(cc.v2());
    }

    unuse(){
        cc.Tween.stopAllByTarget(this.node);
        this.node.opacity = 255;
    }

    onDestroy(){
        cc.Tween.stopAllByTarget(this.node);
    }
}
