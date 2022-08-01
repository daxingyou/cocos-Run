import { VIEW_NAME } from "../../../app/AppConst";
import { utils } from "../../../app/AppUtils";
import { configManager } from "../../../common/ConfigManager";
import { eventCenter } from "../../../common/event/EventCenter";
import { onlineEvent } from "../../../common/event/EventData";
import guiManager from "../../../common/GUIManager";
import { cfg } from "../../../config/config";
import { data, gamesvr } from "../../../network/lib/protocol";
import { activityData } from "../../models/ActivityData";
import { onlineData, ONLINE_ITEM_RESULT } from "../../models/OnlineData";
import { onlineOpt } from "../../operations/OnlineOpt";
import { MAX_ITEM_COUNT } from "./OnlineRewardView";

const {ccclass, property} = cc._decorator;
@ccclass
export default class ItemOnlineReward extends cc.Component{
    @property(cc.Label) timeDownLabel: cc.Label = null;
    @property(cc.Node) redDot: cc.Node = null;
    @property(cc.Node) redDotNew: cc.Node = null;

    private _timeDownNum: number = 0;

    public get acData(): data.IActivityOnlineReward{
        return activityData.onlineRewardData;
    }

    protected onEnable(): void {
        eventCenter.register(onlineEvent.TIME_REFLASH, this, this._reflashOnlineItem);
        eventCenter.register(onlineEvent.REWARD_RES_NTY, this, this._checkOver);
        eventCenter.register(onlineEvent.AUTO_RECIVE_CHECK, this, this._reflashRedDot);
        eventCenter.register(onlineEvent.ONLINE_REWARDS_RES, this, this._getRewardsRes);
        this.init();
    }

    protected onDisable(): void {
        eventCenter.unregisterAll(this);
        this.deInit();
    }

    protected onDestroy(): void {
        this._clear();
    }

    init() {
        this._initOnlineData();
        this._reflashOnlineItem();
    }
          
    deInit() {
        this._stopSchedule();
    }

    private _initOnlineData() {
        //单次游戏不重复赋值
        if (!!onlineData.getAllTimeByIndex()) return;
        let rewards = configManager.getConfigs("onlineReward");
        for (const el in rewards) {
            let cfg: cfg.OnlineReward = rewards[el];  
            onlineData.timeInit(Number(el), cfg.OnlineRewardTimeDemand);
        }

        //保存物品领取信息
        for (let k in this.acData.ReceiveIDMap) {
            if (this.acData.ReceiveIDMap[k]) {
                onlineData.onlineIdStateSave(Number(k),ONLINE_ITEM_RESULT.RECEIVED);    
            }
        }

        onlineData.setAcData(this.acData);

        this._checkOver();
    }
    
    private _reflashOnlineItem() {
        let runTime = onlineData.runTime(this.acData);
        let leftTime = onlineData.leftTime(runTime);
        if (!leftTime) {
            this.deInit();
            this._checkOver();
            this.timeDownLabel.string = `奖励可领取`;
        } else {
            this._timeDownNum = leftTime;
            this.timeDownLabel.string = utils.getTimeIntervalHour(this._timeDownNum, null, true);
            this.schedule(this._timeDownFunc, 1, cc.macro.REPEAT_FOREVER);    
        }

        this._initIcon()
    }

    /**倒计时*/
    private _timeDownFunc() {
        if (this._timeDownNum < 0) {
            this._stopSchedule();
            return;
        }
        this.timeDownLabel.string = utils.getTimeIntervalHour(this._timeDownNum, null, true);
        if (--this._timeDownNum < 0) {
            onlineData.next();
            let runTime = onlineData.runTime(this.acData);
            this._timeDownNum = onlineData.leftTime(runTime);
            this._initIcon()
        }
    }

    //初始化icon
    private _initIcon() {
        let rewardMap = [];
        onlineData.onlineStateMap.forEach((valve, key) => {
            if (valve == ONLINE_ITEM_RESULT.WAITRECEIVED) {
                rewardMap.push(key);
            }
        });
    }

    private _stopSchedule() {
        this.unschedule(this._timeDownFunc);
    }

    openView() {
        this._stopSchedule();
    }

    private _clear() {
        this._timeDownNum = 0;
        this.redDot && (this.redDot.active = false);
        this.redDotNew && (this.redDotNew.active = false);
    }

    /**检测是否结束*/
    private _checkOver():boolean {
        let stateMap = this.acData.ReceiveIDMap;
        let result:number = 0;
        for (let k in stateMap) {
            if (stateMap[k]) result++;
        }
        let over: boolean = (result == MAX_ITEM_COUNT);

        //第二层判断，游戏过程中领取的数据没同步到活动数据里面去
        let runTime = onlineData.runTime(this.acData);
        let leftTime = onlineData.leftTime(runTime);
        //如果第一层判定通过，且没有剩余时间了
        if (!over && !leftTime) {
            //检测是否还有未领取的按钮
            over = onlineData.checkIsAllReceived();
        }
        
        if (over) this.node.removeFromParent(true);
        return over;
    }

    private _reflashRedDot() {
        this.redDot && (this.redDot.active = true);
    }

    private _getRewardsRes(cmd: any, msg: gamesvr.ActivityOnlineRewardReceiveRewardRes) {
        if (msg && msg.Prizes.length) {
            let result = this._checkRedDotItem();
            this.redDot.active = (result.length > 0);
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
        return result;
    }
    
}