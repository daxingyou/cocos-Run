import { utils } from "../../../../app/AppUtils";
import { configUtils } from "../../../../app/ConfigUtils";
import { eventCenter } from "../../../../common/event/EventCenter";
import { cfg } from "../../../../config/config";
import { serverTime } from "../../../models/ServerTime";

const {ccclass, property} = cc._decorator;
@ccclass
export default class GuildWarBtn extends cc.Component {
    @property(cc.Label) timeLb: cc.Label = null;

    //剩余的时间 -- 截取到重置当天 -- 星期x
    private _resetTime = 0;
    private _timeTag = '后开始';

    onInit(): void {
        this._registerEvent();
    }

    protected onEnable(): void {
        this._refreshTime();
    }

    protected onDisable(): void {
        this.unscheduleAllCallbacks();
    }

    /**item释放清理*/
    deInit() {
       eventCenter.unregisterAll(this);
    }

    private _refreshTime() {
        let modelConfig: cfg.ConfigModule = configUtils.getModuleConfigs();
        let starTimeArr = utils.parseStingList(modelConfig.GuildBattleOpenTime);

        let time = serverTime.currServerTime();
        let now = new Date(time * 1000); // 当前日期
        //当前日期
        let nowDayOfWeek = now.getDay() || 7; // 本周第几天
        for (const timeStr of starTimeArr) {
            let starTime = timeStr[0], leftTime = timeStr[1];
            
            //还未开始
            if (nowDayOfWeek < starTime) {
                this._timeTag = `后开始`;
                this._resetTime = starTime;
                break;
            }

            //即将结束
            if (nowDayOfWeek < starTime + leftTime) {
                this._timeTag = `后结束`;
                let endTime = starTime + leftTime;
                this._resetTime = endTime > 7 ? 1 : endTime;
                break;
            }
        }
        let leftTime = utils.getTimeStampByReset(this._resetTime);
        let timeStampArr = utils.getLeftTime(leftTime);
        let day = timeStampArr[0], hour = timeStampArr[1], min = timeStampArr[2], sec = timeStampArr[3];
        if (day) {
            this.timeLb.string = `${day}天` + this._timeTag;
        } else if (hour) {
            this.timeLb.string = `${hour}时` + this._timeTag;
        } else {
            this.timeLb.string = `${min}:${sec}` + this._timeTag;
            this.schedule(this._starTimeDown,1);
        }
    }
    private _starTimeDown() {
        let leftTime = utils.getTimeStampByReset(this._resetTime);
        //已重置 按理说不应该
        if (leftTime < 0) this.unscheduleAllCallbacks();
        let timeStampArr = utils.getLeftTime(leftTime);
        let min = timeStampArr[2], sec = timeStampArr[3];
        this.timeLb.string = `${min}:${sec}` + this._timeTag;
    }

    private _registerEvent() {

    }

}