/*
 * @Author: xuyang
 * @Description: 活动-抽奖页面
 */
import { configManager } from "../../../common/ConfigManager";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { eventCenter } from "../../../common/event/EventCenter";
import { cfg } from "../../../config/config";
import { redDotMgr, RED_DOT_MODULE } from "../../../common/RedDotManager";
import { uiHelper } from "../../../common/ui-helper/UIHelper";
import { CustomDialogId, VIEW_NAME } from "../../../app/AppConst";
import { gamesvr } from "../../../network/lib/protocol";
import { activityEvent } from "../../../common/event/EventData";
import { activityData } from "../../models/ActivityData";
import { activityOpt } from "../../operations/ActivityOpt";
import guiManager from "../../../common/GUIManager";
import moduleUIManager from "../../../common/ModuleUIManager";
import ItemRedDot from "../view-item/ItemRedDot";
import { appCfg } from "../../../app/AppConfig";
import ItemActivityLottery from "./ItemLotteryIcon";
import ItemLotteryIcon from "./ItemLotteryIcon";
import { preloadItemLotteryIconPool } from "../../../common/res-manager/Preloaders";
import { ItemLotteryIconPool } from "../../../common/res-manager/NodePool";
import ActivityHomeView from "./ActivityHomeView";

const { ccclass, property } = cc._decorator;

const MAX_COUNT = 8;

@ccclass
export default class ActivityLotteryView extends ViewBaseComponent {

    @property(cc.Node) mask: cc.Node = null;
    @property(cc.Label) tips: cc.Label = null;
    @property(cc.Label) tipsTitle: cc.Label = null;
    @property(cc.Label) title: cc.Label = null;
    @property(cc.Button) takeBtn: cc.Button = null;
    @property(ItemRedDot) redDot: ItemRedDot = null;
    @property([cc.Node]) cards: cc.Node[] = [];

    private _moduleId: number = 0;
    private _parentComp: ActivityHomeView = null;
    private _cycle = false;
    private _lotteryCfgs: cfg.ActivityDayDraw[] = null;
    private _rootView: ViewBaseComponent = null;
    private _cardItems: Map<number, ItemLotteryIcon> = new Map<number, ItemLotteryIcon>();

    preInit(...rest: any[]): Promise<any> {
        return new Promise((resolve, reject) => {
            preloadItemLotteryIconPool().start(() => resolve(true));
        });
    }

    onInit(moduleId: number, parentComp: ActivityHomeView) {
        this._moduleId = moduleId;
        this._parentComp = parentComp;
        this._rootView = uiHelper.getRootViewComp(this.node.parent);
        if(appCfg.UseTestMoney){
            let chargeLabel = cc.find('rootNode/bg/charge_btn/txt', this.node).getComponent(cc.Label);
            chargeLabel.string = '前往消耗';
        }
        this._registerEvent();
        this._prepareData();
        this._refreshView();
        this._refreshRewardView();
        this.redDot.setData(RED_DOT_MODULE.LOTTERY_TAKE);
    }

    onRelease() {
        this._lotteryCfgs = null;
        this._parentComp = null;
        this.redDot.deInit();
        this.node.stopAllActions()
        this._clearItems();
        eventCenter.unregisterAll(this);
    }

    private _registerEvent() {
        eventCenter.register(activityEvent.DALIY_DATA_CLEAR_NOTIFY, this, this._resetView);
        eventCenter.register(activityEvent.LOTTERY_TAKE_RES, this, this._recvLotteryRes);
        eventCenter.register(activityEvent.LOTTERY_CHANGE_NOTIFY, this, this._recvLotteryNotify);
    }

    private _clearItems() {
      this._cardItems.forEach(ele => {
            ItemLotteryIconPool.put(ele);
      });
      this._cardItems.clear();
    }

    private _prepareData(){
        let lotteryData = activityData.lotteryData;
        if(!lotteryData || !lotteryData.Period) return;
        if(this._lotteryCfgs) return;

        this._lotteryCfgs = configManager.getConfigList("lottery")
            .filter((_cfg:cfg.ActivityDayDraw) =>{
                return _cfg.Team == lotteryData.Period
        });
    }

    private _refreshView(){
        let titleDiaCfg: cfg.Dialog = configManager.getConfigByKey("dialogue", CustomDialogId.ACTIVITY_LOTTERY_TITLE);
        if (titleDiaCfg && titleDiaCfg.DialogText)
            this.title.string = titleDiaCfg.DialogText;

        let dayRechargeCnt = activityData.lotteryData ? activityData.lotteryData.DayRechargeCount : 0;
        let totalCnt = activityData.lotteryData ? activityData.lotteryData.CanLotteryCount : 0;
        let useCnt = activityData.lotteryData ? activityData.lotteryData.UseLotteryCount : 0;

        if (!dayRechargeCnt) {
            this.tips.string = "今日任意付费即可领取";
            this.tipsTitle.node.active = true;
        } else if (useCnt < totalCnt) {
            this.tips.string = "免费领取";
            this.tipsTitle.node.active = true;
        } else {
            this.tips.string = "今日抽奖次数已用完";
            this.tipsTitle.node.active = true;
        }
    }

    private _refreshRewardView(){
        for (let i = 0; i < MAX_COUNT; i++){
            if(!this.cards[i] || !this._lotteryCfgs[i]) continue;
            let card = this.cards[i];
            let cfg = this._lotteryCfgs[i];

            let itemComp: ItemActivityLottery = null;
            if(this._cardItems.has(i)){
              itemComp = this._cardItems.get(i);
            }

            if(!cc.isValid(itemComp)) {
                itemComp = ItemLotteryIconPool.get();
                this._cardItems.set(i, itemComp);
                itemComp.node.setPosition(cc.Vec2.ZERO);
                itemComp.node.active = true;
                card.addChild(itemComp.node);
            }

            let rewardArr = cfg.RewardShow.split(';');
            if (rewardArr.length) {
                let itemId = parseInt(rewardArr[0]);
                let count = parseInt(rewardArr[1]);
                 let token = activityData.lotteryData && activityData.lotteryData.ReceiveRewardMap[cfg.ID];
                itemComp.init({
                    id: itemId,
                    count: count,
                    prizeItem: true,
                    clickHandler: () => {
                        if (!this._cycle)
                            moduleUIManager.showItemDetailInfo(itemId, count, this._rootView.node)
                    },
                }, token);
            }
        }
    }

    private _recvLotteryRes(cmd: any, msg: gamesvr.ActivityDailyLotteryDepartRes){
        if (msg && msg.Prizes && msg.ID){
            let idx = this._lotteryCfgs.findIndex((_cfg) => {
                return _cfg.ID == msg.ID;
            });
            if (idx == -1) return;

            let actionDur = this.genTweenDuration(idx);
            let tween = cc.tween(this.mask).call(() => { 
                this._parentComp && (this._parentComp.forbidInputNode.active = true);
                this.mask.active = true;
                this._cycle = true;
            });
            if (actionDur.length) {
                actionDur.forEach((dur: number, index: number) => {
                    let pos = this.cards[(index + 1) % MAX_COUNT].position;
                    tween.delay(dur).to(0, { position: pos });
                })
            }
            tween.delay(1).call(() => { 
                guiManager.loadView(VIEW_NAME.GET_ITEM_VIEW, this._rootView.node, msg.Prizes);
                
                this._parentComp && (this._parentComp.forbidInputNode.active = false);
                this.mask.active = false;
                this._cycle = false;
                this.mask.position = this.cards[0].position;

                this._refreshView();
                this._refreshRewardView();
            }).start();

        } else {
            this._refreshView();
            this._refreshRewardView();
        }
        redDotMgr.fire(RED_DOT_MODULE.LOTTERY_TAKE);
    }

    private _recvLotteryNotify(cmd: any, msg: gamesvr.ActivityDailyLotteryLotteryCountNotify) {
        this._refreshView();
        this._refreshRewardView();
        redDotMgr.fire(RED_DOT_MODULE.LOTTERY_TAKE);
    }

    private _resetView() {
        this._refreshView();
        this._refreshRewardView();
        redDotMgr.fire(RED_DOT_MODULE.LOTTERY_TAKE);
    }

    onClickDraw(event: cc.Event, customEventData: string) {
        let totalCnt = activityData.lotteryData ? activityData.lotteryData.CanLotteryCount : 0;
        let useCnt = activityData.lotteryData ? activityData.lotteryData.UseLotteryCount : 0;

        if (!this._cycle){
            if (totalCnt - useCnt > 0) {
                activityOpt.takeLotteryReward();
            } else {
                guiManager.showTips("当前没有抽奖次数。");
            }
        }
    }

    onClickRecharge(event: cc.Event, customEventData: string) {
        moduleUIManager.jumpToModule(25000, 2);
    }

    genTweenDuration(segment: number){
        if (segment == 0) { segment = MAX_COUNT; }
        let step = MAX_COUNT * 3 + segment;
        let durArr = new Array<number>(step).fill(0.05);
        
        for (let i = 0; i < step; i++){
            if (i > 2* MAX_COUNT){
                durArr[i] = 0.1;
            }
            if (i == step - 3){
                durArr[i] = 0.2;
            }
            if (i == step - 2){
                durArr[i] = 0.4;
            }
            if (i == step - 1){
                durArr[i] = 0.6;
            }
        }
        return durArr;
    }
}