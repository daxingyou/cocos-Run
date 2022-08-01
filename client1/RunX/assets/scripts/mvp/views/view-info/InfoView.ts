import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { eventCenter } from "../../../common/event/EventCenter";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { CustomDialogId, RES_ICON_PRE_URL, VIEW_NAME } from "../../../app/AppConst";
import { CGEvent, commonEvent, useInfoEvent } from "../../../common/event/EventData";
import { userData } from "../../models/UserData";
import { configUtils } from "../../../app/ConfigUtils";
import { userOpt } from "../../operations/UserOpt";
import { audioManager, AUDIO_STATE, MUSIC_STATE } from "../../../common/AudioManager";
import { configManager } from "../../../common/ConfigManager";
import { cfg } from "../../../config/config";
import { HEAD_TYPE } from "../../../app/AppEnums";
import { gamesvr } from "../../../network/lib/protocol";
import { appCfg } from "../../../app/AppConfig";
import MessageBoxView from "../view-other/MessageBoxView";
import PackageUtils, { isAndroid } from "../../../app/PackageUtils";
import guiManager from "../../../common/GUIManager";
import ItemRedDot from "../view-item/ItemRedDot";
import { RED_DOT_MODULE } from "../../../common/RedDotManager";

const { ccclass, property } = cc._decorator;
const defaultBgVol = 60;
const defaultComVol = 60;
interface CACHE_URL {
    headUrl: string,
    frameUrl: string
}

@ccclass
export default class InfoView extends ViewBaseComponent {
    @property(cc.Label) userName: cc.Label = null;
    @property(cc.Label) userLv: cc.Label = null;
    @property(cc.Label) exp: cc.Label = null;
    @property(cc.Node) headNode: cc.Node = null;
    @property(cc.Toggle) bgVolTog: cc.Toggle = null;
    @property(cc.Slider) bgVolSlid: cc.Slider = null;
    @property(cc.Toggle) commonVolTog: cc.Toggle = null;
    @property(cc.Slider) commonVolSlid: cc.Slider = null;
    @property(cc.EditBox) editName: cc.EditBox = null;
    @property(cc.Node) buttonSave: cc.Node = null;
    @property(cc.Node) buttonEdit: cc.Node = null;
    @property(cc.Label) userId: cc.Label = null;
    @property(cc.Label) svrName: cc.Label = null;
    @property(cc.Label) versionLB: cc.Label = null;
    @property(cc.Node) logNode: cc.Node = null;
    @property(ItemRedDot) headRedot: ItemRedDot = null;;

    private _bgVolume: number = defaultBgVol;
    private _commonVolume: number = defaultComVol;
    private _spriteLoader: SpriteLoader = null;
    private _latestUrl: CACHE_URL = {
        headUrl: null,
        frameUrl: null,
    };

    onInit() {
        this.logNode.active = false;
        //#ZQBDEBUG
        this.logNode.active = true
        //ZQBDEBUG#
        this._spriteLoader = new SpriteLoader();
        this.refershUsrInfo();
        this.initVolData();
        this.registerAllEvent();
        guiManager.addCoinNode(this.node);
        this._refreshRedDot();
        //预加载头像资源
        // this.stepWork.concact(preloadScriptIcons(this.getItemResPath(), "INFO_VIEW").stepWork);
    }

    deInit() {
        this._spriteLoader.release();
        guiManager.removeCoinNode(this.node);
        this._latestUrl = {
            headUrl: null,
            frameUrl: null,
        };
    }

    registerAllEvent() {
        eventCenter.register(useInfoEvent.USER_HEAD_CHANGE, this, this._recvUsrHeadChangeRes);
        eventCenter.register(useInfoEvent.USER_NAME_CHANGE, this, this._recvUsrNameChangeRes);
    }

    initVolData() {
        let audioStatus: any = audioManager.audioStatus;
        let bgVol: number = audioStatus.musicVolume;
        let comVol: number = audioStatus.audioVolume;
        let bgStat: boolean = audioStatus.musicState == MUSIC_STATE.ON;
        let comStat: boolean = audioStatus.audioState == AUDIO_STATE.ON;
        let isValid: Function = (vol: any) => { return Number(vol) >= 0 && Number(vol) < 100; }

        this._bgVolume = isValid(bgVol) ? bgVol : defaultBgVol;
        this._commonVolume = isValid(comVol) ? comVol : defaultComVol;
        this.bgVolTog.isChecked = bgStat;
        this.commonVolTog.isChecked = comStat;
        //进度条初始化
        this.bgVolSlid.progress = this._bgVolume;
        this.commonVolSlid.progress = this._commonVolume;
        this.initSliderWithProgress(this.bgVolSlid);
        this.initSliderWithProgress(this.commonVolSlid);

        this.placeNodeMaterial(this.bgVolSlid.node, !bgStat);
        this.placeNodeMaterial(this.commonVolSlid.node, !comStat);
    }

    refershUsrInfo() {
        let headImg: cc.Node = this.headNode.getChildByName("head_image");
        let headFrame: cc.Node = this.headNode.getChildByName("head_frame");
        let lvBar: cc.ProgressBar = this.headNode.getComponentInChildren(cc.ProgressBar);
        let uInfo = userData.accountData;

        userData.updateLv();
        this.userName.string = `${uInfo.Name}`;
        this.userLv.string = `${userData.lv || 0}`;
        this.exp.string = (userData.maxExp) ? `经验：${userData.exp}/${userData.maxExp}` : "满级";
        lvBar.progress = (userData.maxExp) ? (userData.exp || 0) / (userData.maxExp || Infinity) : 1;
        this.userId.string = `${userData.accountData.UserRoleID}`;
        this.versionLB.string = `游戏版本:${PackageUtils.getPackageVersion()}-${appCfg.getVersion()}`;

        //头像与头像框部分,每次加载前需手动释放引用，但保留最后一次更新头像
        this._latestUrl.headUrl = `${RES_ICON_PRE_URL.HEAD_IMG}/` + configUtils.getHeadConfig(uInfo.HeadID).HeadFrameImage;
        this._latestUrl.frameUrl = `${RES_ICON_PRE_URL.HEAD_FRAME}/` + configUtils.getHeadConfig(uInfo.HeadFrameID).HeadFrameImage;
        this.loadSprInNode(this._latestUrl.headUrl, headImg);
        this.loadSprInNode(this._latestUrl.frameUrl, headFrame);
    }

    loadSprInNode(url: string, pnode: cc.Node) {
        let imgUrl = url.search("textures/") == -1 ? `textures/${url}` : url;
        let nodeSpr = pnode.getComponent(cc.Sprite);
        this._spriteLoader.changeSprite(nodeSpr, imgUrl);
    }


    onClickEditClick(event: cc.Event, customEventData: number) {
        this.loadSubView("EditNameView");
    }

    onClickSaveClick(event: cc.Event, customEventData: number) {
        this.editName.node.active = false;
        this.buttonSave.active = false;
        this.userName.node.active = true;
        this.buttonEdit.active = true;
        //向服务发送更改请求
        if (userData.accountData.Name != this.editName.string)
            userOpt.reqChangeName(this.editName.string);
    }

    private _refreshRedDot() {
        this.headRedot.setData(RED_DOT_MODULE.USER_INFO_HEAD)
    }

    onClickPlayPV(){
        eventCenter.fire(CGEvent.PLAY_CG);
    }

    onClickShowLog () {
        this.loadSubView("ConsoleView");
    }

    onSlideBgCallBack(target: cc.Slider) {
        let volume = Math.floor(target.progress * 100) / 100;
        if (volume != this._bgVolume) {
            this._bgVolume = volume;
            audioManager.musicVolume = this._bgVolume;
        }
        this.initSliderWithProgress(target);
    }

    onSlideComCallBack(target: cc.Slider) {
        let volume = Math.floor(target.progress * 100) / 100;
        if (volume != this._commonVolume){
            this._commonVolume = volume;
            audioManager.audioVolume = this._commonVolume;
        }
        this.initSliderWithProgress(target);
    }

    initSliderWithProgress(slider: cc.Slider) {
        let handleBg: cc.Node = slider.node.getChildByName("handleBg");
        let totalWidth: number = slider.node.width;
        let percent: number = Math.floor(slider.progress * 100) / 100;
        handleBg.width = percent * totalWidth;
    }

    onCheckedBgCallBack(target: cc.Toggle) {
        let musicOn = target.isChecked;
        audioManager.musicState = musicOn ? MUSIC_STATE.ON : MUSIC_STATE.OFF;
        this.placeNodeMaterial(this.bgVolSlid.node, !musicOn);
    }

    onCheckComCallBack(target: cc.Toggle) {
        let audioOn = target.isChecked;
        audioManager.audioState = audioOn ? AUDIO_STATE.ON : AUDIO_STATE.OFF;
        this.placeNodeMaterial(this.commonVolSlid.node, !audioOn);
    }

    placeNodeMaterial(node: cc.Node, grey: boolean) {
        let slider = node.getComponent(cc.Slider);
        node.children.forEach(child => {
            let sprComp = child.getComponent(cc.Sprite);
            let btnComp = child.getComponent(cc.Button);
            if (sprComp) {
                let materialGrey: cc.Material = cc.Material.getBuiltinMaterial('2d-gray-sprite');
                let materialNormal: cc.Material = cc.Material.getBuiltinMaterial('2d-sprite');
                sprComp.setMaterial(0, grey ? materialGrey : materialNormal);
                btnComp && (btnComp.normalMaterial = grey ? materialGrey : materialNormal);
            }
        });
        slider && (slider.enabled = !grey);
    }
    //跳转类按钮
    onClickNotice() {
        this.loadSubView(VIEW_NAME.NOTICE_VIEW)
    }

    onClickGift() {
        this.loadSubView(VIEW_NAME.GIFT_VIEW);
    }

    onClickAccount() {
        let self = this;
        guiManager.showMessageBox(this.node, {
            content: "该操作会返回登录界面，是否继续？",
            leftStr: "取消",
            leftCallback: (msgbox: MessageBoxView) => { msgbox.closeView() },
            rightStr: "确认",
            rightCallback: (msgbox: MessageBoxView) => {
                eventCenter.fire(commonEvent.CHECKOUT_ACCOUNT);
                msgbox.closeView();
                // @todo
                if (isAndroid()) {
                    // self.closeView();
                    PackageUtils.logout();
                } else {
                    // self.closeView();
                    guiManager.loadScene('LoginScene').then(() => {
                        
                    });
                }
            }
        })
    }

    onClickService() {
        guiManager.showLockTips();
    }

    onClickHeadEdit() {
        this.loadSubView(VIEW_NAME.HEAD_VIEW, null);
    }

    onRelease() {
        this.deInit();
        this.releaseSubView();
        eventCenter.unregisterAll(this);
    }

    //获取所有头像的资源路径
    getItemResPath(): string[] {
        let headFrameData: cfg.HeadFrame[] = configManager.getAnyConfig("ConfigHeadFrame");
        let resPathArr: string[] = [];
        headFrameData.forEach((ele) => {
            switch (ele.HeadFrameType) {
                case HEAD_TYPE.HEAD:
                    let resPath = `${RES_ICON_PRE_URL.HEAD_IMG}/${ele.HeadFrameImage}`;
                    resPathArr.push(resPath); break;
                case HEAD_TYPE.FRAME:
                    let resPath1 = `${RES_ICON_PRE_URL.HEAD_FRAME}/${ele.HeadFrameImage}`;
                    resPathArr.push(resPath1); break;
            }
        })
        return resPathArr;
    }

    private _recvUsrHeadChangeRes(){
        let headImg: cc.Node = this.headNode.getChildByName("head_image");
        let headFrame: cc.Node = this.headNode.getChildByName("head_frame");
        let uInfo = userData.accountData;
        this._latestUrl.headUrl = `${RES_ICON_PRE_URL.HEAD_IMG}/` + configUtils.getHeadConfig(uInfo.HeadID).HeadFrameImage;
        this._latestUrl.frameUrl = `${RES_ICON_PRE_URL.HEAD_FRAME}/` + configUtils.getHeadConfig(uInfo.HeadFrameID).HeadFrameImage;
        this.loadSprInNode(this._latestUrl.headUrl, headImg);
        this.loadSprInNode(this._latestUrl.frameUrl, headFrame);

        guiManager.showDialogTips(CustomDialogId.INFO_CHANGE_HEAD);
    }

    private _recvUsrNameChangeRes(cmd: any, recvMsg: { Result: number, Desc: string, Msg: gamesvr.ChangeNameRes }){
        let uInfo = userData.accountData;
        this.userName.string = `${uInfo.Name}`;
    }
}
