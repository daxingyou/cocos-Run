/*
 * @Description:功能引导系统中，挂载List组件的节点需要挂载的组件，用于向引导系统发送响应消息
 * @Version: 1.0
 * @Autor: lixu
 * @Date: 2021-09-23 12:05:37
 * @LastEditors: lixu
 * @LastEditTime: 2021-09-23 15:41:11
 */

const {ccclass, property} = cc._decorator;

@ccclass
export default class GuideListComp extends cc.Component {
    @property(cc.SpriteFrame) template: cc.SpriteFrame = null;
}
