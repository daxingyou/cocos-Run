import { utils } from "../../../../app/AppUtils";
import { configUtils } from "../../../../app/ConfigUtils";
import { eventCenter } from "../../../../common/event/EventCenter";
import { guildWarEvent } from "../../../../common/event/EventData";
import { cfg } from "../../../../config/config";
import { serverTime } from "../../../models/ServerTime";
import { WARSTATE } from "./GuildWarCommon";
const { ccclass, property } = cc._decorator;

@ccclass
export default class ItemProcessComp extends cc.Component {
    @property(cc.Label) stateLb: cc.Label = null;
    @property(cc.Label) timeLb: cc.Label = null;
    @property(cc.ProgressBar) progressBar: cc.ProgressBar = null;

    private _state: WARSTATE = WARSTATE.WAR;
    //当前状态重置时间点(天)
    private _resetTime: number = 0;
    //开始时间(天)
    private _startTime: number = 0;

    private _leftTime:number = 0

    protected onEnable(): void {
        this._leftTime = this._getLeftTime();
        if (this._leftTime > 0) {
            this._caculateTimeAndProcessBar();
            this.schedule(this._starTimeDown,1);
        }
    }

    protected onDisable(): void {
        this.unscheduleAllCallbacks();
    }

    onRefreshShow() {
        this.unscheduleAllCallbacks();
        this._leftTime = this._getLeftTime();
        if (this._leftTime > 0) {
            this._caculateTimeAndProcessBar();
            this.schedule(this._starTimeDown,1);
        }
    }

    private _getLeftTime():number{
        let modelConfig: cfg.ConfigModule = configUtils.getModuleConfigs();
        let starTimeArr = utils.parseStingList(modelConfig.GuildBattleOpenTime);

        let time = serverTime.currServerTime();
        let now = new Date(time * 1000); // 当前日期
        //当前日期
        let nowDayOfWeek = now.getDay() || 7; // 本周第几天
        for (const timeStr of starTimeArr) {
            let starTime = Number(timeStr[0]), leftTime = Number(timeStr[1]);
            
            //还未开始
            if (nowDayOfWeek < starTime) {
                continue
            }
            //已经结束
            if (nowDayOfWeek > starTime + leftTime) {
                continue;
            }

            this._startTime = starTime;
            //备战状态
            if (nowDayOfWeek < starTime + 1) {
                this._state = WARSTATE.PREPARE;
                this.stateLb.string = '备战状态';
                this._resetTime = starTime + 1;
            } else if(nowDayOfWeek < starTime + leftTime) {
                this._state = WARSTATE.WAR
                this.stateLb.string = '战斗状态'
                this._resetTime = starTime + leftTime;
            }
        }
        let resetTime = this._resetTime > 7 ? (this._resetTime - 7) : this._resetTime;
        let leftTime = utils.getTimeStampByReset(resetTime);

        return leftTime;
    }

    private _starTimeDown() {
        --this._leftTime;
        //备战状态下时间结束--重新刷新数据
        if (this._state == WARSTATE.PREPARE && this._leftTime <= 0) {
            this._leftTime =  this._getLeftTime();
        } else if (this._state == WARSTATE.WAR && this._leftTime <= 0) {
            eventCenter.fire(guildWarEvent.GUILD_WAR_OVER);
            this.unschedule(this._starTimeDown);
            return;
        }

        this._caculateTimeAndProcessBar();
    }

    private _caculateTimeAndProcessBar() {
        let fillZero = (tagNum: number): string => {
            return tagNum < 10 ? `0${tagNum}` : `${tagNum}`;;
        }
        
        let timeStampArr = utils.getLeftTime(this._leftTime);
        let day = timeStampArr[0] || 0, hour = timeStampArr[1] || 0,
            min = timeStampArr[2], sec = timeStampArr[3];
        hour = day * 24 + hour;
        this.timeLb.string = fillZero(hour) + ":" + fillZero(min) + ":" + fillZero(sec);
        //进度条-全部转化成秒来计算
        let allTime = (this._resetTime - this._startTime - 1) * 24 * 60 * 60;
        let aredyTime = allTime - this._leftTime;
        this.progressBar.progress = aredyTime / allTime;

        if (this._state == WARSTATE.PREPARE) {
            this.progressBar.progress = this.progressBar.progress / 3;
        }
    }
}