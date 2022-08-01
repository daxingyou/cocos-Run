import container from "./container"

const {ccclass, property} = cc._decorator;

@ccclass
export default class toolBar extends cc.Component {

    @property(cc.Slider) slider: cc.Slider = null;
    @property(container) container: container = null;
    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    start () {

    }

    onSlideCallBackBarrier(target:cc.Slider) {
        // 回调的参数是 slider
        let progress = target.progress;
        this.container.setOpacityForAll(Math.ceil(progress*255))
     }

    onSlideCallBackBg(target:cc.Slider) {
        // 回调的参数是 slider
        let progress = target.progress;
        this.container.setOpacityForBg(Math.ceil(progress*255))
     }
    // update (dt) {}
}
