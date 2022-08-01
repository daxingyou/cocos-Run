import { CustomDialogId, RES_ICON_PRE_URL, VIEW_NAME } from "../../../app/AppConst";
import guiManager from "../../../common/GUIManager";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { AntiAdditionCode } from "../../../app/AppEnums";
import { ChannelInfo, loginData } from "../../models/LoginData";
import { svrConfig, svrList } from "../../../network/SvrConfig";
import { configUtils } from "../../../app/ConfigUtils";
import { serverTime } from "../../models/ServerTime";
import { operationSvr } from "../../../network/OperationSvr";
import PackageUtils, { isAndroid } from "../../../app/PackageUtils";
import { appCfg } from "../../../app/AppConfig";
import { eventCenter } from "../../../common/event/EventCenter";
import { loginEvent, netEvent } from "../../../common/event/EventData";
import { localStorageMgr, SAVE_TAG } from "../../../common/LocalStorageManager";
import { preloadItemDoubleWeekIconPool, preloadItemLimitIconPool, preloadPrefab } from "../../../common/res-manager/Preloaders";
import { worldsvr } from "../../../network/lib/protocol";
import { utils } from "../../../app/AppUtils";

const { ccclass, property } = cc._decorator;

enum NOTICE_SYSSTATE{
    INITIATIVE = 1,     // 主动弹出
    NOT_INITIATIVE
}

@ccclass
export default class LoginView extends ViewBaseComponent {
    @property(cc.Node)              agreement: cc.Node = null;
    @property([cc.SpriteFrame])     stateSfs: cc.SpriteFrame[] = [];
    @property(cc.Sprite)            nodeChannelState: cc.Sprite = null;
    @property(cc.Label)             stateLb: cc.Label = null;
    @property(cc.Label)             lbChannelName: cc.Label = null;
    @property(cc.EditBox)           inputBox: cc.EditBox = null;
    @property(cc.Node)              changeView: cc.Node = null;
    @property(cc.Node)              ndSwitchNetDebug: cc.Node = null;
    @property(cc.Node)              changeBtn: cc.Node = null;

    private _loginHandler: (svrurl: string) => void = null;
    private _curChannelInfo: ChannelInfo = null;
    private _lastChannelInfos: number[] = [];
    private _svrChannelInfos: worldsvr.IGamesvrInfo[] = [];            // 返回的正式的服务器列表
    private _curSelectSrvId: number = 0;                                // 当前选择的服务器id

    onInit() {
        this._prepareData();
        // 检查是否主动弹出公告
        this._checkShowNotice();
        this._refreshServerNode();
        this._refreshUI();
        this._delayPreLoad();
    }

    onRelease() {
        this.releaseSubView();
    }

    init (loginHandler: (svrurl: string) => void) {
        this._loginHandler = loginHandler;
        this.loadSubView("AntiAddictionView", AntiAdditionCode.LOGIN, () => {
            this.loadSubView(VIEW_NAME.NOTICE_VIEW);
        })
    }

    private _delayPreLoad() {
        this.stepWork
        .concact(preloadItemLimitIconPool())
        .concact(preloadItemDoubleWeekIconPool())
        .concact(preloadPrefab(
            ['prefab/views/view-main/mainBg1', 'prefab/views/view-main/mainBg2', 'prefab/views/view-main/mainBg3', 'prefab/views/view-main/mainBg4'], 
            'mainBg').stepWork
        );
    }

    private _checkIsAutoShowNotice() {
        return loginData.noticeDatas.ServerNotices && loginData.noticeDatas.ServerNotices.systemState == NOTICE_SYSSTATE.INITIATIVE;
    }

    private _checkShowNotice() {
        if (!loginData.noticeDatas) return
        if (this._checkIsAutoShowNotice()) {
            this.loadSubView(VIEW_NAME.NOTICE_VIEW)
        }

       if(loginData.noticeDatas.StopServerNotice && NOTICE_SYSSTATE.INITIATIVE == loginData.noticeDatas.StopServerNotice.systemState) {
           this._loadStopServerView();
       }
    }

    private _prepareData() {
        // 获得服务器返回的数据 保存服务器
        this._svrChannelInfos = svrConfig.fetchGamesvrs;

        let defaultSvrId = this._svrChannelInfos[this._svrChannelInfos.length - 1].GamesvrID;
        this._curSelectSrvId = defaultSvrId;
        this._lastChannelInfos = [];

        // 读取本地的最近登录
        let localChannel = localStorageMgr.getLocalStorage(SAVE_TAG.LAST_SVR)
        if (localChannel) {
            let lastRecord = localChannel[localChannel.length - 1];
            let svrInfo = this._svrChannelInfos.filter(v => { return v.GamesvrID == lastRecord })[0]
            if (svrInfo) {
                this._curSelectSrvId = lastRecord;
                this._lastChannelInfos = localChannel;
            }
        }
    }

    private _refreshServerNode() {
        let svrCfg = configUtils.getGameSvrCfg(svrConfig.worldTag, this._curSelectSrvId)
        let svrInfo = this._svrChannelInfos.filter(v => { return v.GamesvrID == this._curSelectSrvId })[0];

        if (svrCfg && svrInfo) {
            this._curChannelInfo = {
                id: svrInfo.GamesvrID,
                url: svrInfo.URL,
                name: svrCfg.ServerName,
                state: svrInfo.State
            }
        } else {
            this._curChannelInfo = {
                id: svrCfg.ServerID,
                name: svrCfg.ServerName,
                state: worldsvr.ServerState.MAINTAIN
            }
        }
        this._refreshSelectedChannel();
    }

    private _refreshUI () {
        this.ndSwitchNetDebug.active = false
         this.changeBtn.active = !cc.sys.isNative || cc.sys.platform == cc.sys.WIN32;
        //#ZQBDEBUG
        this.ndSwitchNetDebug.active = true
        //ZQBDEBUG#

        let first = localStorageMgr.getLocalStorage(SAVE_TAG.FIRST_LOGIN);
        if (!first) {
            this.agreement.active = false;
        } else {
            this.agreement.active = true;
        }

    }

    onClickSwithOuter () {
        //#ZQBDEBUG
        guiManager.showDialogTips(CustomDialogId.LOGIN_SEVER_CHANGING);
        eventCenter.fire(netEvent.SWITCH_NET, svrList.outerUrl);
         //ZQBDEBUG#
    }

    onClickSwithInner () {
        //#ZQBDEBUG
        guiManager.showDialogTips(CustomDialogId.LOGIN_SEVER_CHANGING);
        eventCenter.fire(netEvent.SWITCH_NET, svrList.innerUrl);
        //ZQBDEBUG#
    }
    
    onClickSwithDexNet() {
        //#ZQBDEBUG
        guiManager.showDialogTips(CustomDialogId.LOGIN_SEVER_CHANGING);
        eventCenter.fire(netEvent.SWITCH_NET, svrList.dexUrl);
        //ZQBDEBUG#
    }

    onClickSwithZekunNet() {
        //#ZQBDEBUG
        guiManager.showDialogTips(CustomDialogId.LOGIN_SEVER_CHANGING);
        eventCenter.fire(netEvent.SWITCH_NET, svrList.zeKunUrl);
         //ZQBDEBUG#
    }

    onClickSwithTestNet() {
        //#ZQBDEBUG
        guiManager.showDialogTips(CustomDialogId.LOGIN_SEVER_CHANGING);
        eventCenter.fire(netEvent.SWITCH_NET, svrList.liuUrl);
         //ZQBDEBUG#
    }

    /**
     * 刷新登录界面展示的当前选择关卡
     */
    private _refreshSelectedChannel() {
        let sf = this.stateSfs[this._curChannelInfo.state];
        this.nodeChannelState.spriteFrame = sf;
        let stateString = '火爆';
        switch(this._curChannelInfo.state) {
            case worldsvr.ServerState.FULL: {
                stateString = '火爆';
                break;
            }
            case worldsvr.ServerState.MAINTAIN: {
                stateString = '维护';
                break;
            }
            case worldsvr.ServerState.CROWD: {
                stateString = '拥挤';
                break;
            }
            case worldsvr.ServerState.SMOOTH: {
                stateString = '新服';
                break;
            }
            default: {
                break;
            }
        }
        this.stateLb.string = stateString;
        this.lbChannelName.string = `${this._curChannelInfo.name}`;
    }

    onClickChangeChannel() {
        this.loadSubView(VIEW_NAME.CHANNEL_VIEW, (svrId: number) => {
            this._curSelectSrvId = svrId;
            this._refreshServerNode();
        });
    }

    onClickAgree () {
        if (this.agreement.active) {
            this.agreement.active = false
        } else {
            this.loadSubView("PrivaceUrlView", ()=> {
                localStorageMgr.setLocalStorage(SAVE_TAG.FIRST_LOGIN, 1);
                this.agreement.active = true
            });
        }
    }

    /**
     * 适龄提示
     */
    onClickEligible() {
        this.loadSubView("EligibleView");
    }

    /**
     * 点击用户协议
     */
    onClickAgreementUser() {
        cc.sys.openURL("http://m.game.zqgame.com/common/agreement.jsp");
        // this.loadSubView("PrivaceView");
    }
    /**
     * 点击用户 隐私保护协议
     */
    onClickAgreementProtect() {
        // this.loadSubView("PrivaceView");
        cc.sys.openURL("http://m.game.zqgame.com/common/privacy.jsp");
    }

    onClickStart() {
        if (this.agreement.active) {
            if(worldsvr.ServerState.MAINTAIN == this._curChannelInfo.state) {
                this._loadStopServerView();
                return;
            }

            this._saveLastChannel();

            let gamesvrurl = "ws://" + this._curChannelInfo.url
            this._loginHandler && this._loginHandler(gamesvrurl);
        } else {
            guiManager.showDialogTips(CustomDialogId.LOGIN_PROTOCOL_CHECK);
        }
    }

    onClickNotice() {
        this.loadSubView(VIEW_NAME.NOTICE_VIEW);
    }

    //设置测试账号
    onClickChangeAccount() {
        //#ZQBDEBUG
        this.changeView.active = true;
        //ZQBDEBUG#
        PackageUtils.changeAccount();
    }

    onClickAccountViewClose() {
        this.changeView.active = false;
    }

    onClickAccountConfirm() {
        let inputStr = this.inputBox.string;
        if (inputStr != "") {
            utils.setUserAccount(inputStr);
            this.changeView.active = false;
            eventCenter.fire(loginEvent.SDK_LOGOUT)
        }
    }

    private _loadStopServerView() {
        if (!loginData.noticeDatas) {
            guiManager.showTips("服务器正在维护中。")
            return;
        }

        // 特殊处理停服公告
        if(loginData.noticeDatas.StopServerNotice) {
            let stopServerNotice = loginData.noticeDatas.StopServerNotice;
            guiManager.showMessageBox(guiManager.sceneNode, {
                titleStr: stopServerNotice.title || '停服公告',
                content: stopServerNotice.content || '服务器维护中'
            });
        }
    }

    /**
     * 保存最近登录
     */
    private _saveLastChannel() {
        let lastChannel = this._lastChannelInfos;
        let findIndex: number = lastChannel.indexOf(this._curSelectSrvId);
        if (findIndex == -1) {
            lastChannel.push(this._curSelectSrvId);
            localStorageMgr.setLocalStorage(SAVE_TAG.LAST_SVR, lastChannel)
        } else {
            if (findIndex != lastChannel.length - 1) {
                [lastChannel[findIndex], lastChannel[lastChannel.length - 1]] = [lastChannel[lastChannel.length - 1], lastChannel[findIndex]]
                localStorageMgr.setLocalStorage(SAVE_TAG.LAST_SVR, lastChannel)
            }
        }
    }
}
