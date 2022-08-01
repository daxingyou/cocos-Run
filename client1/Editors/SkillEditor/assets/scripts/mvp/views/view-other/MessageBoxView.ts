import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";

const {ccclass, property} = cc._decorator;

type CB = (box:MessageBoxView)=>void;

@ccclass
export default class MessageBoxView extends ViewBaseComponent {

    @property(cc.Label)     content: cc.Label = null;
    @property(cc.Node)      leftButton: cc.Node = null;
    @property(cc.Label)     leftLabel: cc.Label = null;
    @property(cc.Node)      rightButton: cc.Node = null;
    @property(cc.Label)     rightLabel: cc.Label = null;
    @property(cc.Label)     lbTitle: cc.Label = null;

    private leftCallback: CB = null;
    private rightCallback: CB = null;

    onInit (content: string, 
            leftStr: string = null, leftCallback:CB = null, 
            rightStr: string = null, rightCallback:CB = null,
            titleStr?: string) {
        this.content.string = content;

        if (leftStr != null) {
            this.leftLabel.string = leftStr;
        } else {
            this.leftLabel.string = "确  定";
        }

        if (rightStr != null) {
            this.rightButton.active = true;
            this.rightLabel.string = rightStr;
        } else {
            this.rightButton.active = false;
        }

        this.leftCallback = leftCallback;
        this.rightCallback = rightCallback;
        if (titleStr) this.lbTitle.string = titleStr;
    }

    onDestroy() {

    }

    onClickLeft () {
        if (this.leftCallback != null) {
            this.leftCallback(this);
        } else {
            this.closeView();
        }
    }

    onClickRight () {
        if (this.rightCallback != null) {
            this.rightCallback(this);
        } else {
            this.closeView();
        }
    }
}