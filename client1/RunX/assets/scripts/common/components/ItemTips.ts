import RichTextEx from "./rich-text/RichTextEx";

const {ccclass, property} = cc._decorator;

const FADE_TIME = 0.4;
const HOLD_TIME = 1;
@ccclass
export default class ItemTips extends cc.Component {
    @property(cc.Label)
    normalContent: cc.Label = null;
    @property(RichTextEx)
    richContent: cc.Label = null;

    show (info: string) {
        this.node.active = true;
        this.normalContent && (this.normalContent.string = info);
        this.richContent && (this.richContent.string = info);
        this.node.opacity = 0;
        this.node.runAction(cc.sequence(
            cc.spawn(
                cc.fadeIn(FADE_TIME),
                cc.moveBy(FADE_TIME, cc.v2(0, 60)).easing(cc.easeExponentialOut())
            ),
            cc.delayTime(HOLD_TIME),
            cc.fadeOut(FADE_TIME),
            cc.callFunc(() => {
                this.node.removeFromParent(true);
            })
        ))
    }

    showTask(info: string) {
        this.node.active = true;
        this.normalContent && (this.normalContent.string = info);
        this.richContent && (this.richContent.string = info);
        this.node.opacity = 0;
        this.node.runAction(cc.sequence(
            cc.spawn(
                cc.fadeIn(FADE_TIME),
                cc.moveBy(FADE_TIME, cc.v2(0, 60)).easing(cc.easeExponentialOut())
            ),
            cc.delayTime(HOLD_TIME*2),
            cc.fadeOut(FADE_TIME),
            cc.callFunc(() => {
                this.node.removeFromParent(true);
            })
        ))
    }
}