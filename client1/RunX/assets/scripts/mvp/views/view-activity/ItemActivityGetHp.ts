import { RES_ICON_PRE_URL } from "../../../app/AppConst";
import { utils } from "../../../app/AppUtils";
import {scheduleManager} from "../../../common/ScheduleManager";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { cfg } from "../../../config/config";
import { activityData } from "../../models/ActivityData";
import { serverTime } from "../../models/ServerTime";
import { activityOpt } from "../../operations/ActivityOpt";

const { ccclass, property } = cc._decorator;

@ccclass export default class ItemActivityGetHp extends cc.Component {

    @property(cc.Node)      btnTake: cc.Node = null;
    @property(cc.Label)     txtHp: cc.Label = null;
    @property(cc.Label)     txtTime: cc.Label = null;
    @property(cc.Node)      iconToken: cc.Node = null;
    @property(cc.Sprite)    iconFruit: cc.Sprite = null;

    private _sprLoader = new SpriteLoader();
    private _cfg: cfg.ActivityGetPower = null
    private _scheduleID: number = 0;

    onInit (cfg: cfg.ActivityGetPower) {
        if (!cfg) return;
        this._cfg = cfg;
        let powerMap = activityData.spiritData ? activityData.spiritData.ReceiveSpiritMap : {};
        let timeParseRes = utils.parseStingList(cfg.GetPowerTime);
        if (timeParseRes && timeParseRes.length == 2){
            const beginDate = [0, 0, 0];
            const endDate =  [0, 0, 0];
            timeParseRes[0].length && timeParseRes[0].forEach((str: string, index: number) => {
                index < beginDate.length && (beginDate[index] = parseInt(str));
            });
            timeParseRes[1].length && timeParseRes[1].forEach((str: string, index: number) => {
                index < endDate.length && (endDate[index] = parseInt(str));
            });
            let beginTime =  beginDate.slice(0,2).map(num => {return utils.getzf(num)}).join(":");
            let endTime = endDate.slice(0, 2).map(num => {return utils.getzf(num)}).join(":");
            this.txtTime.string = `${beginTime}-${endTime}可领取`;
            this.btnTake.active = this._getPastTime(beginDate) < this._getPastTime() && this._getPastTime() < this._getPastTime(endDate) && !powerMap[cfg.GetPowerID];
            this.iconToken.active = powerMap[cfg.GetPowerID];

            // 启用定时器刷新
            if (this._scheduleID) scheduleManager.unschedule(this._scheduleID);
            this._scheduleID = scheduleManager.schedule(()=>{
                this.btnTake.active = this._getPastTime(beginDate) < this._getPastTime() && 
                    this._getPastTime() < this._getPastTime(endDate) && !powerMap[cfg.GetPowerID];
                this.iconToken.active = powerMap[cfg.GetPowerID];
            }, 1)
        }

        this.txtHp.string = `${cfg.GetPowerItem || 0}体力`;
        this.iconFruit.node.active = !this.iconToken.active;
        this._sprLoader.changeSprite(this.iconFruit, `${RES_ICON_PRE_URL.ACTIVITY}/${cfg.GetPowerImage}`);
    }

    deInit () {
        if (this._scheduleID) {
            scheduleManager.unschedule(this._scheduleID);
        }
        this._scheduleID = 0
        this._sprLoader.release();
    }

    onClickTake () {
        if (this._cfg && this._cfg.GetPowerID) {
            activityOpt.getSpiritReq(this._cfg.GetPowerID);
        }
    }

    /**
    * @desc 获取当前偏移时间
    * @param date【时、分、秒】
    * @returns 当前偏移时间（s）
    */
    private _getPastTime(date?: number[]){
        let now = new Date(serverTime.currServerTime() * 1000);
        let h = date ? date[0] : now.getHours(),
            m = date ? date[1] : now.getMinutes(),
            s = date ? date[2] : now.getSeconds();
        return now ? h*3600 + m*60 + s : 0;
    }
}