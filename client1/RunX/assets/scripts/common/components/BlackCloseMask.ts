/*
 * @Author: xuyang
 * @Date: 2021-07-07 11:22:11
 * @Description: 可点击关闭黑色遮罩
 */

import { ViewBaseComponent } from "./ViewBaseComponent";

const { ccclass, property } = cc._decorator;

@ccclass
export default class BlackCloseBg extends cc.Component {


    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    start() {

    }

    onClickThis() {
        let root = this.getRootViewComp(this.node);
        if (root) {
            root.closeView();
        }
    }
    /**
     * 取最邻近的View父节点
     */
    getRootViewComp(node: cc.Node): ViewBaseComponent {
        let viewComp = node.getComponent(ViewBaseComponent);
        if (viewComp) {
            return viewComp;
        } else if (node.parent) {
            return this.getRootViewComp(node.parent);
        }
        return null;
    }
    // update (dt) {}
}
