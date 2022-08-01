import utils from './Utils';
/*
 * @Description: 
 * @Autor: lixu
 * @Date: 2021-05-25 10:09:36
 * @LastEditors: lixu
 * @LastEditTime: 2021-05-25 13:40:08
 */
const {ccclass, property} = cc._decorator;

@ccclass
export default class CreateGroupWindow extends cc.Component {
    @property(cc.EditBox) nameEditBox:cc.EditBox = null;

    private cb: Function = null;

    onLoad(){
        this.node.active = false;
    }

    private initUI(...rest: any[]){
        let name: string = null;
        rest && rest.length > 0 && (name = rest[1]);
        if(name)
            this.nameEditBox.string = name;
        else
            this.nameEditBox.string = '';
            
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

   onClickClose(){
       this.hide()
   }

   onClickConfirm(){
       let groupName = this.nameEditBox.string;
        if(!groupName || groupName.length == 0)
            groupName = `子弹组${Date.now()}`;
        this.hide();
        if(this.cb) this.cb(groupName);
   }
}
