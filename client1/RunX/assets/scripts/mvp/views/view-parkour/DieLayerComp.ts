/*
 * @Description: 屏幕外的死亡层
 * @Autor: lixu
 * @Date: 2021-06-03 19:25:41
 * @LastEditors: lixu
 * @LastEditTime: 2021-06-09 11:01:34
 */
const {ccclass, property} = cc._decorator;

/**
 * 死亡层的组件
 */
@ccclass
export default class DieLayerComp extends cc.Component {

    onCollisionEnter(other: cc.Collider, self: cc.Collider) {

    }

    onCollisionStay(other: cc.Collider, self: cc.Collider) {

    }

    onCollisionExit(other: cc.Collider, self: cc.Collider) {

    }
}
