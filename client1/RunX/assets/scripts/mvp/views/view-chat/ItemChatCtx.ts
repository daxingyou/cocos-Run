import { RES_ICON_PRE_URL } from "../../../app/AppConst";
import { configUtils } from "../../../app/ConfigUtils";
import { configManager } from "../../../common/ConfigManager";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { gamesvr } from "../../../network/lib/protocol";
import { userData } from "../../models/UserData";

const { ccclass, property } = cc._decorator;

@ccclass
export default class ItemChatCtx extends cc.Component {

    // 自己的
    @property(cc.Label)  lbNameSelf: cc.Label = null;
    @property(cc.Node)   ndSelf: cc.Node = null;
    @property(cc.Label)  textSelf: cc.Label = null;
    @property(cc.Node)   layoutSelf: cc.Node = null;
    @property(cc.Label)  lbTimeSelf: cc.Label = null;

    @property(cc.Label)  lbLvSelf: cc.Label = null;
    @property(cc.Sprite) headSelf: cc.Sprite = null;
    @property(cc.Sprite) frameSelf: cc.Sprite = null;

    // 别人的
    @property(cc.Label)  lbNameOther: cc.Label = null;
    @property(cc.Node)   ndOther: cc.Node = null;
    @property(cc.Label)  textOther: cc.Label = null;
    @property(cc.Node)   layoutOther: cc.Node = null;
    @property(cc.Label)  lbTimeOther: cc.Label = null;

    @property(cc.Label)  lbLvOther: cc.Label = null;
    @property(cc.Sprite) headOther: cc.Sprite = null;
    @property(cc.Sprite) frameOther: cc.Sprite = null;

    @property(cc.Label)  lbTextCheck: cc.Label = null;
    @property(cc.Label)  lbTextCheckRS: cc.Label = null;

    private _info: gamesvr.IChatMessageNotify = null;
    private _handler: Function = null;
    private _spriteLoader: SpriteLoader = new SpriteLoader();

    init (info: gamesvr.IChatMessageNotify, clickHander: Function = null) {
        if (!info) {
            return;
        }

        this._info = info;
        this._handler = clickHander;

        let paddingX = 10; let paddingY = 7; let minHeight = 120;
        let fromOthers = info.UserInfo.UserID != userData.accountData.UserID;
        this.ndOther.active = fromOthers;
        this.ndSelf.active = !fromOthers;

        let layout = fromOthers? this.layoutOther : this.layoutSelf;
        let msgTxt = fromOthers? this.textOther : this.textSelf;
     
        this.lbTextCheck.string = info.Message;
        this.lbTextCheckRS.string = info.Message;
        //@ts-ignore
        this.lbTextCheck._forceUpdateRenderData();

        //@ts-ignore
        this.lbTextCheckRS._forceUpdateRenderData();

        msgTxt.overflow = cc.Label.Overflow.NONE;
        if (this.lbTextCheck.node.width > 320) {
            msgTxt.overflow = cc.Label.Overflow.RESIZE_HEIGHT;
            msgTxt.node.width = 320;
            layout.width = 340;
            layout.height = this.lbTextCheckRS.node.height + 10;
        } else {
            msgTxt.overflow = cc.Label.Overflow.NONE;
            // msgTxt.node.height = this.lbTextCheck.node.height;
            layout.height = this.lbTextCheck.node.height + paddingY * 2;
            layout.width = this.lbTextCheck.node.width + paddingX * 2;
        }

        this.lbTextCheck.string = ""
        this.lbTextCheckRS.string = ""
        //设置自适应容器留白
        msgTxt.string = info.Message;

        //填充其他信息
        let timeTxt = fromOthers? this.lbTimeOther : this.lbTimeSelf;
        let nameTxt = fromOthers? this.lbNameOther : this.lbNameSelf;
        let levelTxt = fromOthers? this.lbLvOther : this.lbLvSelf;
        let headImage= fromOthers? this.headOther : this.headSelf;
        let headFrame = fromOthers? this.frameOther : this.frameSelf;
        // let headBtn = itemNode.getChildByName("playerHead");
        let headUrl = configUtils.getHeadConfig(info.UserInfo.HeadID).HeadFrameImage;
        let frameUrl = configUtils.getHeadConfig(info.UserInfo.HeadFrameID).HeadFrameImage;
        let bubbleID = (info.MsgFrameId && info.MsgFrameId > 0) ? info.MsgFrameId : 1;
        let bubbleUrl = configManager.getConfigByKey("chatBubble", bubbleID).ChatBubbleLeft;
        timeTxt.getComponent(cc.Label).string = this._transformDate(info.ReceivedTime * 1000);
        nameTxt.getComponent(cc.Label).string = info.UserInfo.Name;
        levelTxt.getComponent(cc.Label).string = this._calUserLv(info.UserInfo.Exp || 0).toString();
        this._loadSprInNode(`${RES_ICON_PRE_URL.HEAD_IMG}/${headUrl}`, headImage);
        this._loadSprInNode(`${RES_ICON_PRE_URL.HEAD_FRAME}/${frameUrl}`, headFrame);
        this._loadSprInNode(`${RES_ICON_PRE_URL.CHAT_BUBBLE}/${bubbleUrl}`, layout.getComponent(cc.Sprite));
        this.node.height = Math.max(minHeight, msgTxt.node.height + 90);
    }

    unuse () {
        this.deInit();
    }

    deInit () {
        this.ndOther.active = false;
        this.ndSelf.active = false;
        this._spriteLoader.release();
        this._handler = null
    }

    onClickChat () {
        // this.loadSubView(VIEW_NAME.USER_INFO_VIEW, uInfo)
        this._handler && this._handler(this._info.UserInfo)
    }
    
    /**
     * @desc 时间戳转时分秒时间
     * @param date 时间戳
     * @returns 
     */
    private _transformDate(date: number) {
        const time = new Date(date);
        let year = time.getFullYear();
        let month = time.getMonth() + 1;
        let day = time.getDate();
        let hours = time.getHours();
        let minutes = time.getMinutes();
        let seconds = time.getSeconds();
        let h = String(hours), m = String(minutes), s = String(seconds);
        if (hours < 10) { h = "0" + h; }
        if (minutes < 10) { m = "0" + m; }
        if (seconds < 10) { s = "0" + s; }
        return `${h}:${m}:${s}`
    }

    
    /**
     * ========================================
     * 辅助计算方法
     * ========================================
     */

    private _calUserLv (exp: number): number {
        let expConfigs = configUtils.getLevelExpConfigsByType(3);
        let level: number = 1;
        if (exp) {
            let expCount: number = 0;
            let key: number = 0;
            for (const k in expConfigs) {
                expCount += expConfigs[k].LevelExpNeedNum;
                if (exp < expCount) {
                    level = Number(k);
                    break;
                }
                level = Number(k);
            }
        }
        return level;
    }

     /**
     * @desc 加载玩家头像
     * @param url 头像地址
     * @param pnode 头像节点
     */
    private _loadSprInNode(url: string, pnode: cc.Sprite) {
        if (!pnode || !cc.isValid(pnode)) {
            return;
        }
        let imgUrl = url.search("textures/") == -1 ? `textures/${url}` : url;
        pnode.node.active = true;
        this._spriteLoader.changeSprite(pnode.getComponent(cc.Sprite), imgUrl)
    }

}