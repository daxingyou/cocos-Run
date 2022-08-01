/*
 * @Author: xuyang
 * @Date: 2021-05-24 17:36:16
 * @Description: 聊天数据类
 */
import { CustomDialogId } from "../../app/AppConst";
import { configUtils } from "../../app/ConfigUtils";
import { configManager } from "../../common/ConfigManager";
import { localStorageMgr, SAVE_TAG } from "../../common/LocalStorageManager";
import { cfg } from "../../config/config";
import { data, gamesvr } from "../../network/lib/protocol";
import { friendData } from "./FriendData";
import { serverTime } from "./ServerTime";

export enum CHAT_CHANNEL {
    WORLD = 1,
    GUILD,
    PRIVATE,
    SYSTEM,
}

export default class ChatData {

    private _chatData: gamesvr.IChatMessageNotify[] = [];       //所有新消息
    private _chatDataWorld: gamesvr.IChatMessageNotify[] = [];  //世界消息
    private _chatDataSystem: gamesvr.IChatMessageNotify[] = []; //系统消息
    private _chatDataGuild: gamesvr.IChatMessageNotify[] = [];  //公会消息
    private _bubbleID: number = -1;
    private _blockList: data.IOtherData[] = [];

    private _haveUnReadWorldMsg: boolean = false;
    private _haveUnReadSystemMsg: boolean = false;
    private _haveUnReadGuildMsg: boolean = false;

    get chatDataList() {
        return this._chatData;
    }

    get chatDataWorld() {
        return this._chatDataWorld;
        // return !this.checkInBlack(ele.UserInfo.UserID);
    }

    get chatDataGuild() {
        return this._chatDataGuild;
        // return !this.checkInBlack(ele.UserInfo.UserID);
    }

    get chatDataSystem() {
        return this._chatDataSystem;
    }

    get bubbleID() {
        return this._bubbleID;
    }

    set bubbleID(val: number) {
        if (this._bubbleID != val) {
            this._bubbleID = val;
            this.setBubbleIdToCache();
        }
    }

    get haveUnreadMsgWorld() {
        return this._haveUnReadWorldMsg;
    }

    get haveUnreadMsgSys() {
        return this._haveUnReadSystemMsg;
    }

    get haveUnreadMsgGuild() {
        return this._haveUnReadGuildMsg;
    }

    //初始化
    init(...args: any[]) {
        let dialogCfg = configUtils.getDialogCfgByDialogId(CustomDialogId.CHAT_DEFAULT_MSG);
        this._chatData.push({
            Type: 4,
            Message: dialogCfg.DialogText,
            ReceivedTime: serverTime.currServerTime()
        });
        this._chatDataSystem.push({
            Type: 4,
            Message: dialogCfg.DialogText,
            ReceivedTime: serverTime.currServerTime()
        });
        this.loadChatDataFromCache();
    }

    deInit() {
        this._chatData = [];
        this._chatDataWorld = [];
        this._chatDataSystem = [];
        this._chatDataGuild = [];
        this._blockList = [];
        this._haveUnReadWorldMsg = false;
        this._haveUnReadSystemMsg = false;
        this._haveUnReadGuildMsg = false;
        this._bubbleID = -1;
    }

    pushMsg(item: gamesvr.IChatMessageNotify) {
        let worldMsgNum = configManager.getConfigByKey("chatChannel", CHAT_CHANNEL.WORLD).ChatChannelMessageNum || -1;
        let systemMsgNum = configManager.getConfigByKey("chatChannel", CHAT_CHANNEL.SYSTEM).ChatChannelMessageNum || -1;
        let guildMsgNum = configManager.getConfigByKey("chatChannel", CHAT_CHANNEL.GUILD).ChatChannelMessageNum || -1;
        if (item.Type == CHAT_CHANNEL.WORLD) {
            if (this._chatDataWorld.length == worldMsgNum)
                this.chatDataWorld.shift();
            this._chatDataWorld.push(item);
            this._haveUnReadWorldMsg = true;
        }
        if (item.Type == CHAT_CHANNEL.SYSTEM) {
            if (this._chatDataSystem.length == systemMsgNum)
                this._chatDataSystem.shift();
            this._chatDataSystem.push(item);
            this._haveUnReadSystemMsg = true;
        }
        if (item.Type == CHAT_CHANNEL.GUILD) {
            if (this._chatDataGuild.length == guildMsgNum)
                this._chatDataGuild.shift();
            this._chatDataGuild.push(item);
            this._haveUnReadGuildMsg = true;
        }
        this._chatData.push(item);
    }

    setBubbleIdToCache() {
        localStorageMgr.setAccountStorage(SAVE_TAG.BUBBLE_ID, this._bubbleID)
    }
    //从缓存拉取消息队列
    loadChatDataFromCache() {
        //聊天气泡
        let cacheData = localStorageMgr.getAccountStorage(SAVE_TAG.BUBBLE_ID)
        if (cacheData) {
            this._bubbleID = Number(cacheData);
        } else {
            this._bubbleID = this.getBubbleCfg()[0].ChatBubbleId;
        }
    }

    //刷新黑名单
    refreshBlackList() {
        this._blockList = friendData.friendData.BlockedList;
    }
    //确认是否在黑名单
    checkInBlack(val: string) {
        return this._blockList.filter(block => { return block.UserID == val; }).length != 0;
    }
    //解析气泡配置数据
    getBubbleCfg() {
        let config = configManager.getConfigs("chatBubble");
        let result = [];
        for (const k in config) {
            result.push(config[k]);
        }
        return result;
    }
    //更新已读已读状态
    updateReadStatus(channel: CHAT_CHANNEL) {
        channel == CHAT_CHANNEL.WORLD && (this._haveUnReadWorldMsg = false);
        channel == CHAT_CHANNEL.SYSTEM && (this._haveUnReadSystemMsg = false);
        channel == CHAT_CHANNEL.GUILD && (this._haveUnReadGuildMsg = false);
    }
}

let chatData = new ChatData();
export { chatData }
