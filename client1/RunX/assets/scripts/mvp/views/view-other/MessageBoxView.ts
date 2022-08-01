import RichTextEx from "../../../common/components/rich-text/RichTextEx";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";

const { ccclass, property } = cc._decorator;

type CB = (box: MessageBoxView, checked?: boolean) => void;

interface MsgboxInfo {
    content: string,
    leftStr?: string,
    leftCallback?: CB,
    rightStr?: string,
    rightCallback?: CB,
    titleStr?: string,
    closeBtn?: boolean
    showToggle?: boolean,
    descToggle?: string,
}

@ccclass
export default class MessageBoxView extends ViewBaseComponent {

    @property(cc.Label) content: cc.Label = null;
    @property(RichTextEx) contentRich: RichTextEx = null;
    @property(cc.Node) leftButton: cc.Node = null;
    @property(cc.Label) leftLabel: cc.Label = null;
    @property(cc.Node) rightButton: cc.Node = null;
    @property(cc.Label) rightLabel: cc.Label = null;
    @property(cc.Label) lbTitle: cc.Label = null;

    @property(cc.Button) btnClose: cc.Button = null;
    @property(cc.Button) btnMask: cc.Button = null;
    @property(cc.Toggle) toggle: cc.Toggle = null;
    @property(cc.Label)  toggleLabel: cc.Label = null;

    private leftCallback: CB = null;
    private rightCallback: CB = null;

    onInit(info: MsgboxInfo) {
        let isRichText = this._isRichText(info.content);
        if(isRichText){
            this.content.node.active = false;
            this.contentRich.node.active = true;
            this.contentRich.string = info.content;
        }else{
            this.content.node.active = true;
            this.contentRich.node.active = false;
            this.content.string = info.content;
        }

        if (info.leftStr != null) {
            this.leftButton.active = true;
            this.leftLabel.string = info.leftStr;
        } else {
            this.leftButton.active = true;
            this.leftLabel.string = "取  消";
        }

        if (info.rightStr != null) {
            this.rightButton.active = true;
            this.rightLabel.string = info.rightStr;
        } else {
            this.rightButton.active = false;
        }

        this.leftCallback = info.leftCallback;
        this.rightCallback = info.rightCallback;
        if (info.titleStr) this.lbTitle.string = info.titleStr;

        if (info.closeBtn) {
            this.btnClose.node.active = true;
            this.btnMask.interactable = true;
        } else {
            this.btnClose.node.active = false;
            this.btnMask.interactable = false;
        }

        this.toggle.node.active = info.showToggle;
        this.toggleLabel.string = info.descToggle || "本次登录不再提示"
    }

    onDestroy() {

    }

    onClickLeft() {
        if (this.leftCallback != null) {
            this.leftCallback(this, this.toggle.isChecked);
            this.closeView();
        } else {
            this.closeView();
        }
    }

    onClickRight() {
        if (this.rightCallback != null) {
            this.rightCallback(this, this.toggle.isChecked);
            this.closeView();
        } else {
            this.closeView();
        }
    }

    private _isRichText(text: string){
        if(!text || text.length == 0) return false;
        let template = /<color=#([0-9a-f]{6})>([\s\S]*)<(\/c)|(\/color)>/i;
        let regArr = text.match(template);
        return regArr && regArr.length > 0;
    }
}

export {
    CB,
    MsgboxInfo
}