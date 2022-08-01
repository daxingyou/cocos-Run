import { configUtils } from "../../app/ConfigUtils";
import { cfg } from "../../config/config";
import { serverTime } from "../../mvp/models/ServerTime";
import { userData } from "../../mvp/models/UserData";
import { gamesvr } from "../../network/lib/protocol";
import { configManager } from "../ConfigManager";
import { logger } from "../log/Logger";
import {scheduleManager} from "../ScheduleManager";
import RichTextEx from "./rich-text/RichTextEx";

const {ccclass, property} = cc._decorator;
interface messageItem{
    text: string,
    duration: number,
    startTime?: number,
}

@ccclass
export default class ScrollMsg extends cc.Component {

    @property(cc.Node) maskNode: cc.Node = null;
    @property(RichTextEx) labelRt: RichTextEx = null;
    @property(cc.String) scrollMsg: string = "";
    
    /**
     * 滚动内容
     */
    contentArr: Array<gamesvr.SystemMessageNotify> = new Array<gamesvr.SystemMessageNotify>();
    startPos: cc.Vec3 = null
    private _playStatus: boolean = true;
    private _scheduleId: number = 0;

    set playStaus (val: boolean) {
        this._playStatus = val;
    }

    onLoad() {
        this.node.active = false;
    }

    /**
     * 开始滚动信息
     */
    startScroll() {
        let self = this;
        this.startPos = this.startPos || cc.v3(0, -this.maskNode.height,0);
        let scrollFunc = ()=> {
            self.contentArr = userData.getSystemMsgs().sort(self._sortFunc);
            let message = self._dealMsg(self.contentArr[0]);
            let currTime = serverTime.currServerTime();
            let matchTime = message && message.startTime ? (message.startTime <= currTime) : true;
            if (self.contentArr.length > 0 && self._playStatus && matchTime) {
                self.node.active = true;
                self.labelRt.string = message.text;
                if (!self.labelRt.node || !cc.isValid(self.labelRt.node)) return;

                self.labelRt.node.position = self.startPos;
                let distance:number = self.labelRt.node.parent.height;
                cc.tween(self.labelRt.node)
                    .by(0.5, {position: cc.v3(0, distance, 0)}, {easing: "sineIn"})
                    .delay(message.duration)
                    .by(0.5, { position: cc.v3(0, distance, 0) }, { easing: "sineOut" })
                    .call(()=> {
                        if (self.labelRt.node && cc.isValid(self.labelRt.node)) {
                            self.labelRt.string = "";
                            self.labelRt.node.position = self.startPos;
                            // 插队会导致排序混乱, 需重置数据
                            userData.delSystemMsg(self.contentArr[0]);
                            scrollFunc();
                        }
                       
                    })
                    .start();
            } else {
               self.pauseScroll();
            }
        }
        // 用节点显隐性作为动作播放标识
        if (!self.node.active && self._playStatus){
            scrollFunc();
            if (!this._scheduleId){
               this._scheduleId = scheduleManager.schedule(()=>{
                   !self.node.active && self._playStatus && scrollFunc();
                },2) 
            } 
        };
    }

    pauseScroll() {
        this.node.runAction(cc.sequence([cc.fadeOut(0.5), cc.callFunc(() => { 
            this.node.active = false;
            this.node.opacity = 255;
        }, this)]))
        this.labelRt.node.stopAllActions();
    }


    private _dealMsg (msg: gamesvr.ISystemMessageNotify): messageItem {
        if (!msg) return null

        let moduleCfg = configUtils.getModuleConfigs();
        let item: messageItem = { text: "", duration: 5 };

        if (msg.Type == gamesvr.MessageType.TypeUser) {
            let msgData = msg.UserMessage;
            let diaCfg: cfg.Dialog = configManager.getConfigByKey("dialogue", msgData.MessageID);

            let text = diaCfg.DialogText;
            msgData.UserID && (text = text.replace(/\%userid/gi, msgData.UserID));
            msgData.UserName && (text = text.replace(/\%username/gi, msgData.UserName));

            if (msgData.GotSSRHero) {
                let heroCfg: cfg.HeroBasic = configManager.getConfigByKey("heroBasic", msgData.GotSSRHero.HeroID);
                let cardCfg: cfg.SummonCard = configManager.getConfigByKey("summon", msgData.GotSSRHero.CardPool);
                let itemCfg: cfg.Item = configManager.getConfigByKey("item", msgData.GotSSRHero.BoxID);

                heroCfg && (text = text.replace(/\%heroname/gi, heroCfg.HeroBasicName));
                cardCfg && (text = text.replace(/\%cardpool/gi, cardCfg.SummonCardName));
                itemCfg && (text = text.replace(/\%itemname/gi, itemCfg.ItemName));
            }

            if (msgData.GotSSREquip) {
                let equipCfg: cfg.Equip = configManager.getConfigByKey("equip", msgData.GotSSREquip.EquipmentID);
                let cardCfg: cfg.SummonCard = configManager.getConfigByKey("summon", msgData.GotSSREquip.CardPool);
                let itemCfg: cfg.Item = configManager.getConfigByKey("item", msgData.GotSSREquip.BoxID);

                equipCfg && (text = text.replace(/\%equipname/gi, equipCfg.EquipName));
                cardCfg && (text = text.replace(/\%cardpool/gi, cardCfg.SummonCardName));
                itemCfg && (text = text.replace(/\%itemname/gi, itemCfg.ItemName));
            }

            if (msgData.GotRankFirstInZJFS) {
                let enemyName = msgData.GotRankFirstInZJFS.EnemyName;
                enemyName && (text = text.replace(/\%enemyname/gi, enemyName));
            }

            item.duration = moduleCfg.NormalNoticeHoldTime ? moduleCfg.NormalNoticeHoldTime/1000 : 2;
            item.text = text;
            return item;

        } else if (msg.Type == gamesvr.MessageType.TypeSystem) {
            let msgData = msg.SystemMessage;
            let systemNotice = msgData.SystemNotice;
            let text = msgData.Content;

            item.text = text;
            item.duration = moduleCfg.SystemNoticeHoldTime ? moduleCfg.SystemNoticeHoldTime/1000 : systemNotice.Duration;
            item.startTime = systemNotice.Start;

            return item;
        } else {
            logger.error("ScrollMsg", "msg type is out of range. type is: ", msg.Type)
            return null
        }
    }

    // 排序规则：
    // 1. 系统类型消息
    // 2. 玩家类型消息-跑马灯/系统消息
    // 3. 玩家类型消息-自己的消息
    // 4. 玩家类型消息-消息先后
    private _sortFunc(msgA: gamesvr.SystemMessageNotify, msgB: gamesvr.SystemMessageNotify) {
        if (msgA.Type != msgB.Type) {

            return msgA.Type - msgB.Type
        } else {
            if (msgA.Type == gamesvr.MessageType.TypeSystem) {
                return 0
            }

            let diaCfgA: cfg.Dialog = configManager.getConfigByKey("dialogue", msgA.UserMessage.MessageID);
            let diaCfgB: cfg.Dialog = configManager.getConfigByKey("dialogue", msgB.UserMessage.MessageID);
            if (diaCfgA.DialogType != diaCfgB.DialogType) {
                return (diaCfgB.DialogType || 0) - (diaCfgA.DialogType || 0);
            }

            let selfUID = userData.accountData.UserID;
            if (msgA.UserMessage.UserID != msgB.UserMessage.UserID) {
                let orderA = (msgA.UserMessage.UserID == selfUID) ? -1 : 0;
                let orderB = (msgB.UserMessage.UserID == selfUID) ? -1 : 0;
                return orderA - orderB;
            }
            
            return 0
        }
    }

    onDestroy() {
        this.labelRt.node.stopAllActions();
        scheduleManager.unschedule(this._scheduleId);
    }
}