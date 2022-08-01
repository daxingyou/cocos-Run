import blurManager from "../BlurManager";

const {ccclass} = cc._decorator;

@ccclass
export default class Blur extends cc.Component {
    onEnable () {
        blurManager.asBlurContainer(this.node)
        blurManager.snap()
    }
}