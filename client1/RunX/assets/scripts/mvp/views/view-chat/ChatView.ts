/*
 * @Author: xuyang
 * @Date: 2021-05-22 16:40:59
 * @Description: 聊天主界面
 */
import List from "../../../common/components/List";
import guiManager from "../../../common/GUIManager";
import {scheduleManager} from "../../../common/ScheduleManager";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { data, gamesvr } from "../../../network/lib/protocol";
import { eventCenter } from "../../../common/event/EventCenter";
import { chatEvent } from "../../../common/event/EventData";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { CustomDialogId, VIEW_NAME } from "../../../app/AppConst";
import { configManager } from "../../../common/ConfigManager";
import { chatData, CHAT_CHANNEL } from "../../models/ChatData";
import { chatOpt } from "../../operations/ChatOpt";
import { cfg } from "../../../config/config";
import { serverTime } from "../../models/ServerTime";
import { guildData } from "../../models/GuildData";
import { hasDirtyWord } from "../../../common/DirtyWord";
import { localStorageMgr, SAVE_TAG } from "../../../common/LocalStorageManager";
import ItemChatCtx from "./ItemChatCtx";
import ItemChatCtxSys from "./ItemChatCtxSys";

enum PAGE_TYPE { WORLD, GUILD, SYSTEM };

const { ccclass, property } = cc._decorator;

@ccclass
export default class ChatView extends ViewBaseComponent {

    @property([cc.Node]) navButtons: cc.Node[] = [];
    @property([cc.Node]) pages: cc.Node[] = [];
    @property(List) chatList: List = null;
    @property(cc.Node) menuNode: cc.Node = null;
    @property(cc.EditBox) inputBox: cc.EditBox = null;
    @property(cc.Button) worldSendBtn: cc.Button = null;
    @property(cc.Sprite) worldSendSpr: cc.Sprite = null;
    @property(cc.Label) worldSendLb: cc.Label = null;

    private _scheduleid: number = -1;
    private _curPage: PAGE_TYPE = PAGE_TYPE.WORLD;
    private _spriteLoader: SpriteLoader = new SpriteLoader();
    private _msgWorldList: gamesvr.IChatMessageNotify[] = [];
    private _msgGuildList: gamesvr.IChatMessageNotify[] = [];
    private _msgSystemList: gamesvr.IChatMessageNotify[] = [];


    onInit() {
        this.node.stopAllActions();
        this.node.setContentSize(cc.size(cc.visibleRect.width, cc.visibleRect.height));
        cc.tween(this.node)
            .by(0, { x: -this.node.width / 2 })
            .call(() => {
                this.node.active = true;
                this.refreshChatView();
            })
            .by(0.1, { x: this.node.width / 2 })
            .start();
        this.registerAllEvent();
    }

    registerAllEvent() {
        eventCenter.register(chatEvent.CHAT_NOTIFY, this, this.refreshChatView);
        eventCenter.register(chatEvent.ADD_BLOCK, this, this.refreshChatView);
        eventCenter.register(chatEvent.RMV_BLOCK, this, this.refreshChatView);
        eventCenter.register(chatEvent.CHAT_NOTIFY, this, this._recvSendMsgRes);
    }

    refreshChatView() {
        //筛选不同频道数据
        this._msgSystemList = chatData.chatDataSystem;
        this._msgWorldList = chatData.chatDataWorld;
        this._msgGuildList = chatData.chatDataGuild;
        //设置消息红点
        let showDotSys = chatData.haveUnreadMsgSys;
        let showDotWorld = chatData.haveUnreadMsgWorld;
        let showDotGuild = chatData.haveUnreadMsgGuild;
        this.navButtons[PAGE_TYPE.WORLD].getChildByName("dot").active = showDotWorld;
        this.navButtons[PAGE_TYPE.SYSTEM].getChildByName("dot").active = showDotSys;
        this.navButtons[PAGE_TYPE.GUILD].getChildByName("dot").active = showDotGuild;
        //切换至不同页签
        switch (this._curPage) {
            case PAGE_TYPE.WORLD:
                this.onClickNavWorld(); chatData.updateReadStatus(CHAT_CHANNEL.WORLD); break;
            case PAGE_TYPE.GUILD:
                this.onClickNavGuild(); chatData.updateReadStatus(CHAT_CHANNEL.GUILD); break;
            case PAGE_TYPE.SYSTEM:
                this.onClickNavSystem(); chatData.updateReadStatus(CHAT_CHANNEL.SYSTEM); break;
        }
    }
    //世界聊天信息,公会聊天
    onChatListRender(item: cc.Node, idx: number) {
        let itemComp = item.getComponent(ItemChatCtx);
        let itemData = this._curPage == PAGE_TYPE.WORLD ? this._msgWorldList[idx] : this._msgGuildList[idx];
        itemComp.init(itemData, (uInfo: data.IOtherData)=> {
            this.loadSubView(VIEW_NAME.USER_INFO_VIEW, {UserID: uInfo.UserID, Exp: uInfo.Exp, Name: uInfo.Name});
        })
    }

    //系统聊天信息
    onSystemListRender(item: cc.Node, idx: number) {
        let itemData = this._msgSystemList[idx];
        let itemComp = item.getComponent(ItemChatCtxSys);
        itemComp.initSystem(itemData)
    }

    onEditCallBack(txt: string, editbox: cc.EditBox) {
        let label = cc.instantiate(editbox.textLabel.node);
        let bg = editbox.background.node;
        let menu = editbox.node.parent;
        let sendBtn = menu.getChildByName("btn_send");
        let clearBtn = menu.getChildByName("btn_clear");
        editbox.placeholder = txt.replace(/\n/,"");
        editbox.string = txt.replace(/\n/,"");
        //@ts-ignore
        // label.getComponent(cc.Label)._forceUpdateRenderData();
        // editbox.node.height = label.height;
        // bg.height = label.height + 20;
        // menu.height = label.height + 45;
        //垂直居中对齐输入框
        // sendBtn.getComponent(cc.Widget).updateAlignment();
        // clearBtn.getComponent(cc.Widget).updateAlignment();
        // editbox.node.getComponent(cc.Widget).updateAlignment();
    }

    /**
     * @desc 发送即时消息
     * @returns 
     */
    onClickSendMsg(event: cc.Event) {
        let target = event.target.getComponent(cc.Button);
        let msg = this.inputBox.string;
        
        let bubbleID = chatData.bubbleID;
        let channel = this._curPage == PAGE_TYPE.WORLD ? CHAT_CHANNEL.WORLD : CHAT_CHANNEL.GUILD;
        let saveTag = this._curPage == PAGE_TYPE.WORLD ? SAVE_TAG.WORLD_CD : SAVE_TAG.GUILD_CD;
        let worldCfg: cfg.ChatChannel = configManager.getConfigByKey("chatChannel", channel);
        let coldTime = worldCfg.ChatChannelSendCD || 0;
        // 公会聊天校验
        if (this._curPage == PAGE_TYPE.GUILD && !guildData.guildInfo){
            guiManager.showDialogTips(CustomDialogId.CHAT_GUILD_NO_EXIST);
            return;
        }
        // 空消息过滤
        if (!msg) {
            guiManager.showDialogTips(CustomDialogId.CHAT_EMPTY);
            return;
        }
        if (hasDirtyWord(msg)) {
            guiManager.showTips("文本含有敏感词汇，发送聊天失败。");
            return
        }

        chatOpt.sendChatReq(msg, bubbleID, channel);
        //启动定时器
        let materialGrey: cc.Material = cc.Material.getBuiltinMaterial('2d-gray-sprite');
        let materialNormal: cc.Material = cc.Material.getBuiltinMaterial('2d-sprite');
        if (coldTime && coldTime > 0) {
            target.interactable = false;
            this.worldSendLb.string = `发送(${coldTime})`;
            // this.worldSendSpr.setMaterial(0, materialGrey);
        }
        let passTime = 0;
        scheduleManager.unschedule(this._scheduleid);
        this._scheduleid = scheduleManager.schedule(() => {
            passTime += 1;
            this.worldSendBtn.interactable = passTime >= coldTime;
            // this.worldSendSpr.setMaterial(0, passTime >= coldTime ? materialNormal : materialGrey);
            this.worldSendLb.string = passTime >= coldTime ? "发送" : `发送(${Math.floor(coldTime - passTime)})`;
            if (passTime >= coldTime) {
                scheduleManager.unschedule(this._scheduleid);
            }
        }, 1);

        localStorageMgr.setAccountStorage(saveTag, serverTime.currServerTime())
    }
    /**
     * 清理聊天框内容
     */
    onClickInputClear() {
        this.inputBox.string = "";
        this.onEditCallBack("", this.inputBox);
    }

    onClickNavWorld() {
        let button = this.navButtons[PAGE_TYPE.WORLD];
        let page = this.pages[PAGE_TYPE.WORLD];
        this.navButtons.forEach(buttonNode => {
            let normal = buttonNode.getChildByName("normal");
            let choose = buttonNode.getChildByName("choose");
            let dot = buttonNode.getChildByName("dot");
            normal.active = true;
            choose.active = false;
        });
        button.getChildByName("normal").active = false;
        button.getChildByName("choose").active = true;
        button.getChildByName("dot").active = false;

        this.pages.forEach(pageItem => { pageItem.active = false; })
        page.active = true;
        this.menuNode.active = true;
        this._curPage = PAGE_TYPE.WORLD;
        this.onClickInputClear();
        //设置发送按钮CD,和文本最大长度
        let lastSendTime = localStorageMgr.getAccountStorage(SAVE_TAG.WORLD_CD) || 0
        let worldCfg = configManager.getConfigByKey("chatChannel", CHAT_CHANNEL.WORLD);
        let coldTime = worldCfg.ChatChannelSendCD || 0;
        let maxLength = worldCfg.ChatChannelTextLimit || -1;
        let passTime = (serverTime.currServerTime() - Number(lastSendTime));
        let materialGrey: cc.Material = cc.Material.getBuiltinMaterial('2d-gray-sprite');
        let materialNormal: cc.Material = cc.Material.getBuiltinMaterial('2d-sprite');

        this.worldSendBtn.interactable = passTime > coldTime;
        this.worldSendLb.string = passTime > coldTime ? "发送" : `发送(${Math.floor(coldTime - passTime)})`;
        //this.worldSendSpr.setMaterial(0, passTime > coldTime ? materialNormal : materialGrey);
        scheduleManager.unschedule(this._scheduleid);
        this._scheduleid = scheduleManager.schedule(() => {
            passTime += 1;
            this.worldSendBtn.interactable = passTime >= coldTime;
            //this.worldSendSpr.setMaterial(0, passTime >= coldTime ? materialNormal : materialGrey);
            this.worldSendLb.string = passTime >= coldTime ? "发送" : `发送(${Math.floor(coldTime - passTime)})`;
            if (passTime >= coldTime) {
                scheduleManager.unschedule(this._scheduleid);
            }
        }, 1);
        this.inputBox.maxLength = maxLength;
        //刷新容器数据
        let chatList = page.getComponent("List");
        chatList.numItems = this._msgWorldList.length;
        chatList.scrollTo(this._msgWorldList.length - 1, 0);

    }

    onClickNavGuild() {
        let button = this.navButtons[PAGE_TYPE.GUILD];
        let page = this.pages[PAGE_TYPE.WORLD];
        this.navButtons.forEach(buttonNode => {
            let normal = buttonNode.getChildByName("normal");
            let choose = buttonNode.getChildByName("choose");
            let dot = buttonNode.getChildByName("dot");
            normal.active = true;
            choose.active = false;
        });
        button.getChildByName("normal").active = false;
        button.getChildByName("choose").active = true;
        button.getChildByName("dot").active = false;
        this.pages.forEach(pageItem => { pageItem.active = false; })
        page.active = true;
        this.menuNode.active = true;
        this._curPage = PAGE_TYPE.GUILD;
        this.onClickInputClear();

        //设置发送按钮CD,和文本最大长度
        let lastSendTime = localStorageMgr.getAccountStorage(SAVE_TAG.GUILD_CD) || 0
        let worldCfg = configManager.getConfigByKey("chatChannel", CHAT_CHANNEL.GUILD);
        let coldTime = worldCfg.ChatChannelSendCD || 0;
        let maxLength = worldCfg.ChatChannelTextLimit || -1;
        let passTime = (serverTime.currServerTime() - Number(lastSendTime));
        let materialGrey: cc.Material = cc.Material.getBuiltinMaterial('2d-gray-sprite');
        let materialNormal: cc.Material = cc.Material.getBuiltinMaterial('2d-sprite');

        this.worldSendBtn.interactable = passTime >= coldTime;
        // this.worldSendSpr.setMaterial(0, passTime >= coldTime ? materialNormal : materialGrey);
        this.worldSendLb.string = passTime >= coldTime ? "发送" : `发送(${Math.floor(coldTime - passTime)})`;

        scheduleManager.unschedule(this._scheduleid);
        this._scheduleid = scheduleManager.schedule(() => {
            passTime += 1;
            this.worldSendBtn.interactable = passTime >= coldTime;
            //this.worldSendSpr.setMaterial(0, passTime >= coldTime ? materialNormal : materialGrey);
            this.worldSendLb.string = passTime >= coldTime ? "发送" : `发送(${Math.floor(coldTime - passTime)})`;
            if (passTime >= coldTime) {
                scheduleManager.unschedule(this._scheduleid);
            }
        }, 1);
        this.inputBox.maxLength = maxLength;
        //刷新容器数据
        let chatList = page.getComponent("List");
        chatList.numItems = this._msgGuildList.length;
        chatList.scrollTo(this._msgGuildList.length - 1, 0);
    }

    onClickNavSystem() {
        let button = this.navButtons[PAGE_TYPE.SYSTEM];
        let page = this.pages[PAGE_TYPE.SYSTEM];
        this.navButtons.forEach(buttonNode => {
            let normal = buttonNode.getChildByName("normal");
            let choose = buttonNode.getChildByName("choose");
            let dot = buttonNode.getChildByName("dot");
            normal.active = true;
            choose.active = false;
        });
        button.getChildByName("normal").active = false;
        button.getChildByName("choose").active = true;
        button.getChildByName("dot").active = false;
        this.pages.forEach(pageItem => { pageItem.active = false; })
        page.active = true;
        this.menuNode.active = false;
        this._curPage = PAGE_TYPE.SYSTEM;
        //刷新容器数据
        let chatList = page.getComponent("List");
        chatList.numItems = this._msgSystemList.length;
        chatList.scrollTo(this._msgSystemList.length - 1, 0);
    }

    onClickSetting() {
        this.loadSubView(VIEW_NAME.CHAT_SETTING_VIEW);
    }

    private _recvSendMsgRes(){
        this.onClickInputClear();
    }
    /**
     * 关闭页面加动画
     */
    closeView() {
        cc.tween(this.node).by(0.3, { x: -this.node.width }).call(() => {
            this.node.active = false;
            this.node.x = 0;
            super.closeView();
        }).start();
    }

    onRelease() {
        this.chatList._deInit();
        this._curPage = PAGE_TYPE.WORLD;
        this._spriteLoader.release();
        this.releaseSubView();
        scheduleManager.unschedule(this._scheduleid);
        eventCenter.unregisterAll(this);
    }

    deInit() {

    }

    // update (dt) {}
}
