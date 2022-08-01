import guiManager from "../../../common/GUIManager";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { eventCenter } from "../../../common/event/EventCenter";
import { VIEW_NAME } from "../../../app/AppConst";
import { optManager } from "../../operations/OptManager";
import { modelManager } from "../../models/ModeManager";
import { loginEvent } from "../../../common/event/EventData";
import { Channel_Info } from "../../models/LoginData";

const { ccclass, property } = cc._decorator;


@ccclass
export default class LoginScene extends ViewBaseComponent {
    @property({ type: cc.Toggle, tooltip: '用户协议Toggle' }) agreementToggle: cc.Toggle = null;
    // 当前选择的服务器信息
    @property({ type: cc.Node, tooltip: '当前选择服务器的状态' }) selectedChannelState: cc.Node = null;
    @property({ type: cc.Label, tooltip: '当前服务器的名称' }) selectedChannelNameLb: cc.Label = null;

    onInit() {
        this.addEvent();
        this.checkIsShowNoticeView();
        this.refreshSelectedChannelView();
    }

    addEvent() {
        // 注册选择频道 刷新首页展示
        eventCenter.register(loginEvent.SELECT_CHANNEL, this, this.refreshSelectedChannelView);
        eventCenter.register(loginEvent.LOGIN_SUCCESS, this, this.loginSuc);
    }

    checkIsShowNoticeView() {
        if (optManager.loginOpt.checkIsAutoShowNotice()) {
            guiManager.loadView(VIEW_NAME.NOTICEVIEW, this.node);
        }
    }
    /**
     * 刷新登录界面展示的当前选择关卡
     */
    refreshSelectedChannelView() {
        let channelInfo: Channel_Info = modelManager.loginData.selectedChannelInfo;
        let stateColor: cc.Color = cc.Color.GREEN;
        if (channelInfo.isFixed) {
            stateColor = cc.Color.GRAY;
        } else {
            if (channelInfo.isNew) {
                stateColor = cc.Color.YELLOW;
            } else {
                if (channelInfo.isHot) {
                    stateColor = cc.Color.RED;
                }
            }
        }
        this.selectedChannelState.color = stateColor;
        this.selectedChannelNameLb.string = `S${channelInfo.ChannelId}.${channelInfo.ChannelName}`;
    }

    onRelease() {
        this.releaseSubView();
    }

    loginSuc() {
        guiManager.showTips('登录成功');
        guiManager.loadScene('MainScene');
        // guiManager.hideLoading();
    }

    onClickChangeChannel() {
        guiManager.loadView(VIEW_NAME.CHANNELVIEW, this.node);
    }
    /**
     * 点击用户协议
     */
    onClickAgreementUser() {
        guiManager.showTips('点击用户协议');
    }
    /**
     * 点击用户 隐私保护协议
     */
    onClickAgreementProtect() {
        guiManager.showTips('点击隐私保护协议');
    }

    onClickStart() {
        if (this.agreementToggle.isChecked) {
            // guiManager.loadScene('MainScene');
            // todo 测试流程
            optManager.loginOpt.useLogin();
            guiManager.showTips('开始登录');
            // guiManager.showLoading(null);
        } else {
            guiManager.showTips('请同意用户协议');
        }
    }

    onClickAgreementToggle() {
        this.agreementToggle.isChecked = !this.agreementToggle.isChecked;
    }

    onClickNotice() {
        guiManager.loadView(VIEW_NAME.NOTICEVIEW, this.node);
    }

    onDestroy() {
        this.removeEvent();
    }

    removeEvent() {
        eventCenter.unregisterAll(this);
    }
}