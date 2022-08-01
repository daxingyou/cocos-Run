
/**
 * @description
 * 
 * 适配背景图
 */

const {ccclass, property} = cc._decorator;

@ccclass
export default class BgAdapter extends cc.Component {
    onLoad () {
        if (!cc.isValid(this.node)) return;
        
        let widget = this.node.getComponent(cc.Widget);
        if (widget && widget.enabled) {
            return;
        }

        const nowWHRate = cc.winSize.width / cc.winSize.height;
        const currWHRate = this.node.width / this.node.height;
        if (nowWHRate > currWHRate) {
            this.node.width = this.node.height * nowWHRate;
        }
    }
}
