/*
 * @Description: 功能引导系统中，挂载cc.Button组件的节点需要挂载的组件，用于向引导系统发送响应消息
 * @Version: 1.0
 * @Autor: lixu
 * @Date: 2021-09-23 09:39:47
 * @LastEditors: lixu
 * @LastEditTime: 2021-09-23 11:07:52
 */

import { FunctionGuideManager } from "./FunctionGuideView";

const {ccclass, property} = cc._decorator;

@ccclass
export default class GuideBtnComp extends cc.Component {

    init(...params: any){

    }

    //按钮被点击后，触发引导系统逻辑
    onGuideTrigged(){
        FunctionGuideManager.getIns().guideBtnClicked(this);
    }
}
