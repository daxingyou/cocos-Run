import { VIEW_NAME } from "../../../app/AppConst";
import { utils } from "../../../app/AppUtils";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { configManager } from "../../../common/ConfigManager";
import { eventCenter } from "../../../common/event/EventCenter";
import { onlineEvent } from "../../../common/event/EventData";
import guiManager from "../../../common/GUIManager";
import { logger } from "../../../common/log/Logger";
import { ItemOnlineDetailPool } from "../../../common/res-manager/NodePool";
import { data, gamesvr } from "../../../network/lib/protocol";
import { activityData } from "../../models/ActivityData";
import { onlineData, ONLINE_ITEM_RESULT } from "../../models/OnlineData";
import { onlineOpt } from "../../operations/OnlineOpt";
import ItemBag from "../view-item/ItemBag";
import ItemOnlineDetail from "./ItemOnlineDetail";
const { ccclass, property } = cc._decorator;
export const MAX_ITEM_COUNT = 12;
@ccclass
export default class OnlineRewardView extends ViewBaseComponent{
    @property(cc.Prefab) rewardTempItem: cc.Prefab = null;
    @property(cc.Layout) onlineLayout: cc.Layout = null;
    @property(cc.Label) timeLb: cc.Label = null;
    @property(cc.Button) autoReciveBtn: cc.Button = null;

    public get acData(): data.IActivityOnlineReward{
        return activityData.onlineRewardData;
    }

    private _time = 0;
    protected onInit(...args: any[]): void {
        this._preInitItem();
        this._reflashTime();
        this._checkRedDotItem();
    }


    protected onRelease(): void {
        let parent = this.onlineLayout.node;
        while (parent.childrenCount > 0) {
            let child = parent.children[0];
            let itemDetail = child.getComponent(ItemOnlineDetail);
            if (child && itemDetail) {
                // logger.log(`OnlineRewardView资源回池:${itemDetail.isRewarded.spriteFrame.name}`);
                ItemOnlineDetailPool.put(itemDetail);
            }
        }
    }

    protected onEnable(): void {
        eventCenter.register(onlineEvent.ONLINE_REWARDS_RES, this, this._getRewardsRes);
        eventCenter.register(onlineEvent.AUTO_RECIVE_CHECK, this, this._checkRedDotItem);
    }

    protected onDisable(): void {
        eventCenter.unregisterAll(this);
    }

    private _preInitItem() {
        let onlineCfg = configManager.getConfigs(`onlineReward`);
        let keys = Object.keys(onlineCfg);
        let index = 0;
        while (this.onlineLayout.node.childrenCount < keys.length) {
            try { 
                let itemDetail = ItemOnlineDetailPool.get();
                // logger.log(`OnlineRewardView资源出池:${itemDetail.isRewarded.spriteFrame.name}`);
                itemDetail.init(++index);
                //将已领取的item状态改变
                let isGetReward: boolean = this.acData.ReceiveIDMap[index];
                if (isGetReward) itemDetail.setItemResultState(ONLINE_ITEM_RESULT.RECEIVED);
                
                this.onlineLayout.node.addChild(itemDetail.node);    
            } catch (err) {
                logger.error(`OnlineRewardView`, `preInitItem is null, error:${err}`);
            }
        }
        this.onlineLayout.node.height = 83 * Math.ceil(keys.length / 5);
    }

    private _reflashTime() {
        let runTime = onlineData.runTime(this.acData);
        this._time = onlineData.leftTime(runTime);
        if (this._time) {
            this.timeLb.string = `下个阶段奖励:` + utils.getTimeIntervalHour(this._time, null, true);
            this.schedule(this._timeDownFunc, 1, cc.macro.REPEAT_FOREVER);    
        } else {
            this.timeLb.node.active = false;
        }   
    }

    //倒计时
    private _timeDownFunc() {
        if (this._time < 0) {
            this._stopSchedule();
            return;
        } 
        this.timeLb.string = `下个阶段奖励:` + utils.getTimeIntervalHour(this._time, null, true);
        if (--this._time < 0) {
            this._time = onlineData.next();
        }
    }

    private _stopSchedule() {
        this.unschedule(this._timeDownFunc);
    }


    private _getRewardsRes(cmd: any, msg: gamesvr.ActivityOnlineRewardReceiveRewardRes) {
        if (msg && msg.Prizes.length) {
            guiManager.loadView(VIEW_NAME.GET_ITEM_VIEW, this.node.parent, msg.Prizes);
            this._checkRedDotItem();

            //每次领取道具的时候判定一次在线奖励是否全领取完毕
            if (this._checkOnlineRewardOver()) {
                eventCenter.fire(onlineEvent.REWARD_RES_NTY);
            }
        }
    }

    /**检测是否有未领取元素*/
    private _checkRedDotItem():number[] {
        let result:number[] = [];
        let stateMap: Map<number, ONLINE_ITEM_RESULT> = onlineData.onlineStateMap;
        stateMap.forEach((state, index, map) => {
            if (state == ONLINE_ITEM_RESULT.WAITRECEIVED) {
                result.push(index);
            }
        }); 
        this.autoReciveBtn.node.active = (result.length > 0);
        return result;
    }

    /**检测在线奖励是否领取完成*/
    private _checkOnlineRewardOver(): boolean {
        let stateMap: Map<number, ONLINE_ITEM_RESULT> = onlineData.onlineStateMap;
        let result: number = 0;
        stateMap.forEach((state, index, map) => {
            if (state == ONLINE_ITEM_RESULT.RECEIVED)
                result++;
        });
        return (result == MAX_ITEM_COUNT);
    }

    autoReciveClick() {
        let result = this._checkRedDotItem();
        onlineOpt.sendGetRewardReq(result);
    }

    //关闭页面的时候重新启动外部的计时器
    closeView(isUseCloseAction?: boolean): void {
        super.closeView();
        this._stopSchedule();
        eventCenter.fire(onlineEvent.TIME_REFLASH)
    }
}