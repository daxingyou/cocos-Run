/*
 * @Author: xuyang
 * @Date: 2021-05-19 20:36:45
 * @Description: 邮件主页面
 */
import List from "../../../common/components/List";
import guiManager from "../../../common/GUIManager";
import {scheduleManager} from "../../../common/ScheduleManager";
import { data } from "../../../network/lib/protocol";
import { CustomDialogId, VIEW_NAME } from "../../../app/AppConst";
import { mailEvent } from "../../../common/event/EventData";
import { mailData } from "../../models/MailData";
import { mailOpt } from "../../operations/MailOpt";
import { configUtils } from "../../../app/ConfigUtils";
import { utils } from "../../../app/AppUtils";
import { eventCenter } from "../../../common/event/EventCenter";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { Equip } from "../../template/Equip";
import { serverTime } from "../../models/ServerTime";
import { bagDataUtils } from "../../../app/BagDataUtils";
import moduleUIManager from "../../../common/ModuleUIManager";
import GetAllRewardBtn from "../view-common/GetAllRewardBtn";
import { redDotMgr, RED_DOT_MODULE } from "../../../common/RedDotManager";
import { preloadMailItemPool } from "../../../common/res-manager/Preloaders";
import { ItemBagPool, MailItemPool } from "../../../common/res-manager/NodePool";
import { audioManager, SFX_TYPE } from "../../../common/AudioManager";

const { ccclass, property } = cc._decorator;

@ccclass
export default class MailView extends ViewBaseComponent {

    @property(List) mailList: List = null;
    @property(List) enclosureList: List = null;
    @property(cc.Node) buttonGet: cc.Node = null;
    @property(cc.Node) buttonGot: cc.Node = null;
    @property(cc.Node) buttonClear: cc.Node = null;
    @property(cc.Node) buttonTake: cc.Node = null;
    @property(cc.Node) mailContentNode: cc.Node = null;
    @property(cc.Label) mailContent: cc.Label = null;
    @property(cc.Label) mailName: cc.Label = null;
    @property(cc.Label) mailOverTime: cc.Label = null;
    @property(cc.Node) emptyNode: cc.Node = null;

    private _mailListData: data.IMailItem[] = [];
    private _prizeListData: data.IItemInfo[] = [];
    private _selectId: number = -1;
    private _scheduleid: number = null;
    private _lastSeleItem: data.IMailItem = null;

    preInit(...rest: any[]): Promise<any> {
        return new Promise((resolve, reject) => {
            preloadMailItemPool().start(() => {
                resolve(true);
            });
        });
    }

    onInit(moduleId: number) {
        this.registerAllEvent();
        this.mailList.setupExternalPool(MailItemPool);
        this.enclosureList.setupExternalPool(ItemBagPool);
        this.updateView();
        guiManager.addCoinNode(this.node, moduleId);
    }

    registerAllEvent() {
        eventCenter.register(mailEvent.CLEAR, this, this._onClear);
        eventCenter.register(mailEvent.TAKE, this, this.onMailToken);
        eventCenter.register(mailEvent.TAKE_ALL, this, this.onMailTokenAll);
    }

    onRelease() {
        this._lastSeleItem = null;
        guiManager.removeCoinNode(this.node);
        this.releaseSubView();
        this.unscheduleAllCallbacks();
        this.enclosureList._deInit();
        this.mailList._deInit();
        eventCenter.unregisterAll(this);
        scheduleManager.unschedule(this._scheduleid);
    }

    private _onClear() {
        this.updateView();
        redDotMgr.fire(RED_DOT_MODULE.MAIN_MAIL);
    }

    updateView() {
        //数据清理
        this.mailContentNode.active = false;
        this.enclosureList.node.parent.active = false;
        this._mailListData = this.getMailList();
        let mailCnt = this._mailListData.length;
        this.mailList.numItems = mailCnt;
        mailCnt && this.mailList.scrollTo(0,0);
        this.buttonTake.getComponent(GetAllRewardBtn).gray = !this._checkUnTakeMails();
        this.buttonClear.active = this._mailListData.length != 0;
        this.emptyNode.active = this._mailListData.length == 0;
        this.mailList.node.parent.active = this._mailListData.length != 0;
        if (this._mailListData.length) this.mailList.selectedId = 0;
    }

    //从Model类读取数据并重设
    private getMailList() {
        let mailItems: data.IMailItem[] = [];
        let mailDataList = mailData.getMailData();
        for (let k in mailDataList) {
            mailItems.push(mailDataList[k]);
        }
        mailItems.sort((a, b) => {
            let recvTimeA = utils.longToNumber(a.ReceivedTime);
            let recvTimeB = utils.longToNumber(b.ReceivedTime);
            return recvTimeB - recvTimeA;
        })
        //加入排序规则
        mailItems.sort((a, b) => {
            let readA = a.Prizes && a.Prizes.length ? 1 : -1;
            let readB = b.Prizes && b.Prizes.length ? 1 : -1;
            return readA - readB;
        })
        mailItems.sort((a, b) => {
            let readA = a.Readed ? 1 : -1;
            let readB = b.Readed ? 1 : -1;
            return readA - readB;
        })
        return mailItems;
    }

    //检查是否存在未领取的邮件
    private _checkUnTakeMails(): boolean{
        if(!this._mailListData || this._mailListData.length == 0) return false;
        return this._mailListData.some((item) => {
            return item && item.Prizes && item.Prizes.length > 0 && !item.TakenOut;
        });
    }

    //列表数据刷新
    onMailListRender(item: cc.Node, idx: number) {
        let mailChosen = item.getChildByName('mail_choose');
        let name = item.getChildByName('name');
        let stateRead = item.getChildByName('state_read');
        let bgRead = item.getChildByName('mail_bg_read');
        let stateNormal = item.getChildByName('state_normal');
        let enclosure = item.getChildByName('state_enclosure');
        let overTime = item.getChildByName('time');
        let newIcon = item.getChildByName('new');
        let mailItem = this._mailListData[idx];

        //选中状态，在selecetRender里处理
        mailChosen.active = false;
        let existPrize = mailItem.Prizes && mailItem.Prizes.length > 0;
        name.getComponent(cc.Label).string = mailItem.Title;
        stateRead.active = mailItem.Readed || mailItem.TakenOut;
        bgRead.active = mailItem.Readed || mailItem.TakenOut;
        stateNormal.active = !mailItem.Readed && !mailItem.TakenOut;
        enclosure.active = existPrize && !mailItem.TakenOut;
        newIcon.active = existPrize ? !mailItem.TakenOut : !mailItem.Readed;

        let remianTime = (mailItem.ExpireTime - serverTime.currServerTime());
        let inComingDelete = (remianTime < 24 * 3600);
        let day = Math.floor(remianTime / (24 * 3600));
        overTime.getComponent(cc.Label).string = inComingDelete ? "即将删除" : `${day}天后删除`;

    }

    //选中邮件列表
    onMailSelectRender(item: cc.Node, sID: number) {
        let mailItem = this._mailListData[sID];
        if(this._lastSeleItem == mailItem) return;
        this._lastSeleItem = mailItem;
        //附件清单
        if (mailItem.Prizes && mailItem.Prizes.length != 0) {
            this.enclosureList.node.parent.active = true;
            this._prizeListData = mailData.extractItemInfo([mailItem]);
            this.buttonGet.active = !mailItem.TakenOut;
            this.buttonGot.active = mailItem.TakenOut;
            this.enclosureList.numItems = this._prizeListData.length;
        } else {
            this.enclosureList.node.parent.active = false;
        }
        this._selectId = sID;
        //收取时间、标题、内容
        this.mailContent.string = mailItem.Desc;
        this.mailName.string = mailItem.Title;
        this.mailContentNode.active = true;
        //点击自动发送已读更新请求
        let stateRead = item.getChildByName('state_read');
        let bgRead = item.getChildByName('mail_bg_read');
        let stateNormal = item.getChildByName('state_normal');
        let newIcon = item.getChildByName('new');
        !mailItem.Readed && (mailOpt.sendReadReq(mailItem.Seq));
        mailItem.Readed = true;
        stateRead.active = true;
        bgRead.active = true;
        stateNormal.active = false;
        newIcon.active = !mailItem.Readed || (mailItem.Prizes && mailItem.Prizes.length != 0 && !mailItem.TakenOut);

        //页面回弹
        let contentScView: cc.ScrollView = this.mailContentNode.getComponentInChildren(cc.ScrollView);
        contentScView.stopAutoScroll();
        contentScView.scrollToTop(0);
        //剩余时间
        scheduleManager.unschedule(this._scheduleid);
        this.mailOverTime.string = this.convertTime2Str((mailItem.ExpireTime - serverTime.currServerTime()));
        let remainTime = (mailItem.ExpireTime - serverTime.currServerTime());
        if (remainTime > 0) {
            this._scheduleid = scheduleManager.schedule(() => {
                let remainTime = (mailItem.ExpireTime - serverTime.currServerTime());
                // remianTime -= (29 * 24 * 3600 + 23 * 3600);
                if (remainTime > 0) {
                    this.mailOverTime.string = this.convertTime2Str(remainTime);
                } else {
                    this.mailOverTime.string = "";
                    mailData.clearMailData([mailItem.Seq]);
                    guiManager.showDialogTips(CustomDialogId.MAIL_AUTO_REMOVED);
                }
            }, 1)
        }
        audioManager.playSfx(SFX_TYPE.BUTTON_CLICK);
    }

    convertTime2Str(remianTime: number) {
        if (remianTime > 24 * 3600) {
            return Math.floor(remianTime / (24 * 3600)) + "天后删除";
        } else if (remianTime > 3600) {
            let h = Math.floor(remianTime / 3600);
            let m = Math.floor((remianTime % 3600) / 60);
            let s = Math.floor(remianTime % 60);
            return `${h}小时后删除`;
        } else if (remianTime > 0) {
            let h = Math.floor(remianTime / 3600);
            let m = Math.floor((remianTime % 3600) / 60);
            let s = Math.floor(remianTime % 60);
            return `${m > 9 ? m : '0' + m}:${s > 9 ? s : '0' + s}后删除`;
        }
        return "";
    }
    //附件列表刷新
    onEnclosureListRender(item: cc.Node, idx: number) {
        let prizeItem = this._prizeListData[idx];
        let itemScript = item.getComponent("ItemBag");
        let config = configUtils.getItemConfig(prizeItem.ID);
        let config1 = configUtils.getEquipConfig(prizeItem.ID);
        let config2 = configUtils.getHeroConfig(prizeItem.ID);
        //区分装备和道具材料
        if (config1) {
            let equip = new Equip(bagDataUtils.buildDefaultEquip(prizeItem.ID));
            itemScript.init({
                id: prizeItem.ID,
                prizeItem: true,
                level: equip.getEquipLevel(),
                star: equip.equipData.EquipUnit.Star,
            });
        }

        if (config2) {
            itemScript.init({
                id: prizeItem.ID,
                prizeItem: true,
                star: bagDataUtils.getHeroInitStar(config2.HeroId),
            });
        }

        if (config) {
            itemScript.init({
                id: prizeItem.ID,
                count: utils.longToNumber(prizeItem.Count),
                prizeItem: true,
            });
        }
    }

    onEnclosureListSelect(item: cc.Node, sid: number) {
        let prizeItem = this._prizeListData[sid];
        let config = configUtils.getItemConfig(prizeItem.ID);
        let config1 = configUtils.getEquipConfig(prizeItem.ID);
        moduleUIManager.showItemDetailInfo(prizeItem.ID, prizeItem.Count , this.node);
    }

    onClickTakeAll() {
        if(!this._checkUnTakeMails()){
            this.buttonTake.getComponent(GetAllRewardBtn).showNotReward();
            return;
        }
        mailOpt.sendAllTakeReq();
    }

    onClickClearAll() {
        guiManager.showMessageBox(this.node, {
            content: "是否将所有已读邮件删除？",
            leftStr: "取消",
            leftCallback: null,
            rightStr: "确定",
            rightCallback: () => { mailOpt.sendAllClearReq(); }
        })
    }

    onClickTake() {
        let selItem = this._mailListData[this._selectId];
        if (selItem && selItem.Seq)
            mailOpt.sendTakeReq(selItem.Seq);
    }

    onMailToken(eid: any, item: data.IMailItem) {
        let seq = utils.longToNumber(item.Seq);
        for (let index in this._mailListData) {
            let ele = this._mailListData[Number(index)];
            let num = utils.longToNumber(ele.Seq);
            if (num == seq) {
                this._mailListData.splice(Number(index), 1, item);
            }
        }
        //判定当前是否在领取邮件
        let seq1 = utils.longToNumber(this._mailListData[this._selectId].Seq);
        if (seq1 == seq) {
            this.buttonGot.active = true;
            this.buttonGet.active = false;
            if (this.mailList.getItemByListId(this._selectId)) {
                let item: cc.Node = this.mailList.getItemByListId(this._selectId);
                let enclosure = item.getChildByName('state_enclosure');
                enclosure.active = false;
            }
            this.loadSubView(VIEW_NAME.GET_ITEM_VIEW, mailData.extractItemInfo([item]));
        }
        this.mailList.selectedId = this._selectId;
        this.buttonTake.getComponent(GetAllRewardBtn).gray = !this._checkUnTakeMails();
        guiManager.showDialogTips(CustomDialogId.MAIL_TOKEN);
        redDotMgr.fire(RED_DOT_MODULE.MAIN_MAIL);
    }

    onMailTokenAll(eid: any, items: data.IMailItem[]) {
        if (items && items.length != 0) {
            guiManager.showDialogTips(CustomDialogId.MAIL_AUTO_TOKEN);
            this.updateView();
            this.loadSubView(VIEW_NAME.GET_ITEM_VIEW, mailData.extractItemInfo(items));
            redDotMgr.fire(RED_DOT_MODULE.MAIN_MAIL);
        }

    }
}
