import { configManager } from "../../common/ConfigManager";
import { eventCenter } from "../../common/event/EventCenter";
import { onlineEvent } from "../../common/event/EventData";
import { cfg } from "../../config/config";
import { data } from "../../network/lib/protocol";

/**在线奖励状态*/
enum ONLINE_ITEM_RESULT{
    /**待领取*/
    WAITRECEIVED = 1, 
    /**不能领取*/
    UNRECEIVED,
    /**已领取*/
    RECEIVED
}

export default class OnlineData{
    /**当前已领取到的下标*/
    private _onlineIndex: number = 1;
    /**记录每个下标对应的总时长*/
    private _timeMap: Map<number, number> = new Map();
    /**已运行时间*/
    private _allRunTime: number = 0;
    private _onlineStateMap: Map<number, ONLINE_ITEM_RESULT> = new Map();
    private _acData: data.IActivityOnlineReward = null;

    private get _dateTime(): number {
        return Math.floor(new Date().getTime() / 1000);
    }

    get onlineStateMap(): Map<number, ONLINE_ITEM_RESULT>{
        return this._onlineStateMap;
    }

    get allRunTime(): number{
        return this._allRunTime;
    }

    get onlineIndex(): number{
        return this._onlineIndex;
    }

    init() {
    
    }

    deInit() {
        this._clear();
    }

    setAcData(data:data.IActivityOnlineReward) {
        this._acData = data;
    }

    timeInit(index: number,allTime:number) {
        this._timeMap.set(index, allTime);
    }

    onlineIdStateSave(reciveId: number, state: ONLINE_ITEM_RESULT) {
        this.onlineStateMap.set(reciveId, state);

        //填充状态的时候如果有待领取状态同步给页面进行显示
        if (state == ONLINE_ITEM_RESULT.WAITRECEIVED) {
            eventCenter.fire(onlineEvent.AUTO_RECIVE_CHECK);
        }
    }

    onlineIdStateGet(reciveId:number) {
        return this._onlineStateMap.get(reciveId);
    }

    /**根据已领取的下标获取当前剩余时间*/
    getAllTimeByIndex(index?: number): number {
        if (!index) index = this._onlineIndex;
        return this._timeMap.get(index);
    }

    /**
     * @returns 剩余时间
     * @param time 游戏总运行时间
     */
    leftTime(time?: number): number{
        if (!time) time = this._allRunTime;
        for (let i = 1; i <= this._timeMap.size; i++){
            let allTime = this._timeMap.get(i);
            if (!allTime) continue;
            if (time >= allTime) { //老号运行时间大于当前阶段的时间
                if (!this._onlineStateMap.get(i)) this.onlineIdStateSave(i, ONLINE_ITEM_RESULT.WAITRECEIVED);
                continue;
            }

            //如果正式开始游戏时偷跑了过多时间，需要将中间漏掉的状态重新设置
            if (i - this._onlineIndex >= 1) {
                for (let k = this._onlineIndex; k < i; k++){
                    if (this._onlineStateMap.get(k)) continue;
                    this.onlineIdStateSave(k, ONLINE_ITEM_RESULT.WAITRECEIVED);
                }
            }
        
            this._onlineIndex = i;
            return (allTime - time);   
            
        }
        return null;
    }
       /**这是外部倒计时结束时调用的接口*/
    next(): number {
        let index = this._onlineIndex;
        if (!this._checkNextInvaild(index)) {
            let cfg:cfg.OnlineReward = configManager.getConfigByKey("onlineReward", index - 1);
            return cfg?.OnlineRewardTimeDemand || -1;
        }
        //保存当前未领取的状态
        this.onlineIdStateSave(index, ONLINE_ITEM_RESULT.WAITRECEIVED);
        eventCenter.fire(onlineEvent.ITEM_STATE_NTY, index);
        index = ++this._onlineIndex;
        let cfg: cfg.OnlineReward = configManager.getConfigByKey("onlineReward", index);
        if (!cfg) return -1;
        return cfg?.OnlineRewardTimeDemand || -1;
    }

    /**做个时间校验，防止越阶跳*/
    private _checkNextInvaild(_receivedIndex: number): boolean {
        let index = this._onlineIndex;
        let allRunTime = this.runTime();
        let curTime = this.getAllTimeByIndex(index);
        let nextTime = this.getAllTimeByIndex(index + 1);
        //当前已经是最后一阶了
        if (!nextTime) return false;
        //只有运行时间大于等于当前阶段最大时长，小于等于下一阶段才合法
        if (allRunTime >= curTime && allRunTime <= nextTime) return true;
        return false;
    }

    /**
     * @description 总在线时长，根据服务器传入数据结合本地时间换算
     * @param acData 后端记录的在线记录
     * @returns 
     */
    runTime(acData?: data.IActivityOnlineReward): number {
        if (!acData) acData = this._acData;
        //在线时长，第一次进入不会有字段;
        let onlineTime = acData.OnlineTotalTime || 0;
        let gameStartTime = acData?.StarTime?.low || this._dateTime;
        let runTime = this._dateTime - gameStartTime;
        this._allRunTime = onlineTime + runTime;
        return this._allRunTime;
    }

    /**检测是否已经全领取了*/
    checkIsAllReceived(): boolean {
        let result = true;
        this._onlineStateMap.forEach((state) => {
            if (state != ONLINE_ITEM_RESULT.RECEIVED) result = false;
        })
        return result;
    }

    private _clear() {
        this._timeMap.clear();
        this._onlineStateMap.clear();
        this._allRunTime = 0;
        this._onlineIndex = 1;
        this._acData = null;
        // this.timeDownNum = 0;
    }
}

let onlineData = new OnlineData();
export {
    onlineData,
    ONLINE_ITEM_RESULT
};
