/*
 * @Description: 
 * @Version: 1.0
 * @Autor: lixu
 * @Date: 2021-08-17 17:48:59
 * @LastEditors: lixu
 * @LastEditTime: 2021-08-17 19:28:23
 */

const {ccclass, property} = cc._decorator;

@ccclass
export default class SettingWindow extends cc.Component {

    @property(cc.EditBox) heroX: cc.EditBox = null;
    @property(cc.EditBox) heroY: cc.EditBox = null;
    @property(cc.Button) confirmBtn: cc.Button = null;

    private cb: Function = null;

    onLoad(){
        this.node.active = false;
    }

    private initUI(...rest: any[]){
        let heroPos = rest[0];
        this.heroX.string = Math.floor(heroPos.x).toString();
        this.heroY.string = Math.floor(heroPos.y).toString();
    }

    show(cb: Function, ...rest: any[]){
        this.cb = cb;
        if(cc.isValid(this.node) && !this.node.active){
            this.node.active = true;
            this.initUI(...rest);
        }
    }

    hide(){
        if(cc.isValid(this.node) && this.node.active){
            this.node.active = false;
        }
    }

    onClickConfirm(){
        let heroPos = cc.v2(parseInt(this.heroX.string), parseInt(this.heroY.string));
        this.hide();
        if(this.cb) this.cb(heroPos);
    }
}
