import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";

const { ccclass, property } = cc._decorator;

@ccclass
export default class PrivaceUrlView extends ViewBaseComponent {

    private _agreeHandler: Function = null

    onInit (handler: Function) {
        this._agreeHandler = handler
    }

    onClickPrivacy () {
        cc.sys.openURL("http://m.game.zqgame.com/common/privacy.jsp");
    }

    onClickUserProtocol () {
        cc.sys.openURL("http://m.game.zqgame.com/common/agreement.jsp");
    }


    onClickAgree () {
        this._agreeHandler && this._agreeHandler()
        this.closeView()
    }

    onClickReject () {
        this.closeView()
        // cc.game.end();
    }

}