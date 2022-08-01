import blurManager from "../BlurManager";

const {ccclass, property, menu, disallowMultiple} = cc._decorator;

@ccclass
@disallowMultiple
@menu('自定义组件/模糊背景')
export default class Blur extends cc.Component {
    @property({ type: cc.Float}) brightness: number = 0.6;
    @property({ tooltip: "加载后初始化模糊背景"}) needSnap: boolean = false;
    onLoad () {
        blurManager.brightness = this.brightness;
        blurManager.asBlurContainer(this.node);
        blurManager.snap();
        cc.tween(this.node).to(0, { color: cc.color(128, 128, 128) }).to(0.02, {color: cc.color(255,255,255)}).start();
    }

    isViewBaseComp(){
        return false;
    }

    protected onEnable(): void {
        if (this.needSnap) {
            blurManager.snap();
        }
    }
}