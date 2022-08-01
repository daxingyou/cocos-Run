/*
 * @Author: xuyang
 * @Date: 2021-06-16 20:06:12
 * @Description: 根据屏幕尺寸作宽屏适配
 */
const { ccclass, property } = cc._decorator;

enum ALIGN_MODE {
    HORIZONTAL,
    VERTICAL,
    ORIGIN,
}

@ccclass         
export default class SafeAreaEX extends cc.SafeArea {

    @property({
        tooltip: "组件的布局模式",
        type: cc.Enum(ALIGN_MODE)
    })
    align: ALIGN_MODE = ALIGN_MODE.HORIZONTAL;

    updateArea() {
        // TODO Remove Widget dependencies in the future
        let widget = this.node.getComponent(cc.Widget);
        if (!widget ) {
            return;
        }

        if (CC_EDITOR) {
            widget.top = widget.bottom = widget.left = widget.right = 0;
            widget.isAlignTop = widget.isAlignBottom = widget.isAlignLeft = widget.isAlignRight = true;
            return;
        }
        // IMPORTANT: need to update alignment to get the latest position
        widget.updateAlignment();
        let lastPos = this.node.position;
        let lastAnchorPoint = this.node.getAnchorPoint();
        //
        widget.isAlignTop = widget.isAlignBottom = widget.isAlignLeft = widget.isAlignRight = true;
        let screenWidth = cc.winSize.width, screenHeight = cc.winSize.height;
        let safeArea = cc.sys.getSafeAreaRect();
        if(this.align != ALIGN_MODE.HORIZONTAL){
            widget.top = screenHeight - safeArea.y - safeArea.height;
            widget.bottom = safeArea.y;
        }
        if (this.align != ALIGN_MODE.VERTICAL) {
            widget.left = safeArea.x;
            widget.right = screenWidth - safeArea.x - safeArea.width;
        }
        widget.updateAlignment();
        // set anchor, keep the original position unchanged
        let curPos = this.node.position;
        let anchorX = lastAnchorPoint.x - (curPos.x - lastPos.x) / this.node.width;
        let anchorY = lastAnchorPoint.y - (curPos.y - lastPos.y) / this.node.height;
        this.node.setAnchorPoint(anchorX, anchorY);
        //@ts-ignore
        //cc._widgetManager.add(widget);
        cc.log("safeArea, X:", safeArea.x, "Width:", safeArea.width, );
    }
}
