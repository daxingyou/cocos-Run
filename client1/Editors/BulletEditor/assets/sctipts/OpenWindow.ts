import { global } from './main';
import utils from './Utils';
/*
 * @Description: 
 * @Autor: lixu
 * @Date: 2021-05-25 10:09:36
 * @LastEditors: lixu
 * @LastEditTime: 2021-05-25 21:01:04
 */
const {ccclass, property} = cc._decorator;

@ccclass
export default class OpenWindow extends cc.Component {
    @property(cc.EditBox) dirPath: cc.EditBox = null;
    @property(cc.EditBox) nameEditBox:cc.EditBox = null;

    private cb: Function = null;

    onLoad(){
        this.node.active = false;
    }

    private initUI(...rest: any[]){
        let path: string = global.savePath;
        this.dirPath.string = path;
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
       let path = this.dirPath.string;
       if(!path || path.length == 0){
            global.showToastMsg("文件路径不能为空");
       }
       let fileName = this.nameEditBox.string;
        if(!fileName || fileName.length == 0){
            global.showToastMsg("文件名不能为空");
            return;
        }
        
        if(!cc.sys.isNative){
            global.showToastMsg("暂时不支持浏览器，请使用模拟器进行配置");
            return;
        }

        if(!jsb.fileUtils.isDirectoryExist(path)){
            global.showToastMsg("当前路径不存在，请检查");
            return;
        }

        let absolutePath = `${path}${fileName}.json`;
        if(!jsb.fileUtils.isFileExist(absolutePath)){
            global.showToastMsg("当前文件不存在，请检查");
            return;
        }
        
        this.hide();
        if(this.cb) this.cb(absolutePath);
   }
}
