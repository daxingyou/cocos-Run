import { audioManager, BGM_TYPE } from "../../../common/AudioManager";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { eventCenter } from "../../../common/event/EventCenter";
import { loginEvent, netEvent } from "../../../common/event/EventData";
import guiManager from "../../../common/GUIManager";
import { svrConfig } from "../../../network/SvrConfig";
import { loginState } from "../view-login/LoginState";

const { ccclass, property } = cc._decorator;

@ccclass
export default class LoginScene extends ViewBaseComponent {
    @property(cc.Label) 
    lbHint: cc.Label = null;

    onLoad() {
    }

    onInit() {
        audioManager.playMusic(BGM_TYPE.NORMAL);
        loginState.start(this);
        eventCenter.register(netEvent.SWITCH_NET, this, this._switchLocalNet);
        eventCenter.register(loginEvent.SDK_LOGOUT, this, this._skdLogOut);
    }

    onRelease() {
        eventCenter.unregisterAll(this);
    }

    showTips(tips: string) {
        this.lbHint.string = tips;
    }

    clearTips() {
        this.lbHint.string = "";
    }

    private _switchLocalNet (cmd: any, url: string) {
        svrConfig.worldsvrUrl = `ws://${url}:9100`;
        this.clearTips();
        this._clearMsgBox();
        loginState.restart();
    }

    private _skdLogOut () {
        this.clearTips();
        this._clearMsgBox();
        loginState.restart();
    }

    private _clearMsgBox () {
        guiManager.clearMessageBox(guiManager.sceneNode)
    }

}