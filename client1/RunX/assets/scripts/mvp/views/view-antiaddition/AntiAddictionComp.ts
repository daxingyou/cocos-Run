import { CustomDialogId } from "../../../app/AppConst";
import { utils } from "../../../app/AppUtils";
import { eventCenter } from "../../../common/event/EventCenter";
import { commonEvent } from "../../../common/event/EventData";
import guiManager from "../../../common/GUIManager";
import { serverTime } from "../../models/ServerTime";
import { userData } from "../../models/UserData";
import { antiAddictionOpt, FORBINDEN_TIME_HOUR } from "../../operations/AntiAddictionOpt";

const { ccclass, property } = cc._decorator;

@ccclass
export default class AntiAddictionComp extends cc.Component {

    private _timer: number = 0;

    @property(cc.Label) labelTime: cc.Label = null;
    
    init () {
        this._clear()
    }

    show () {
        let isAdult = userData.age >= 18;
        if (isAdult) {
            this._clear()
        } else {
            eventCenter.unregisterAll(this)
            eventCenter.register(commonEvent.GAME_RESUME, this, this._onGameResume)

            this.node.active = true;
            this._updateLabel();
            this._timer = setInterval(() => {
                this._updateLabel();
            }, 60000);
        }
    }

    private _onGameResume () {
        let isAdult = userData.age >= 18;
        if (isAdult) {
            this.node.active = false;
            clearTimeout(this._timer);
        } else {
            this._updateLabel()
        }
    }

    private _updateLabel () {
        if (!this.node.active) {
            return
        }
        
        let curr = new Date(serverTime.currServerTime() * 1000)

        // 极限情况，允许时间内打开游戏，然后锁屏，隔天（星期一）的允许时间登陆，这时候解锁屏幕也要强退！
        let rightDay = true
        let week = curr.getDay();
        let isWeekend = (week == 0 || week == 6 || week == 5)? true:false;
        let hour = curr.getHours();
        if (!isWeekend) {
            rightDay = false;
        }

        if (hour != FORBINDEN_TIME_HOUR) {
            rightDay = false;
        }

        let y = curr.getFullYear()
        let m = curr.getMonth() + 1
        let d = curr.getDate();
        let endTime = `${y}-${m}-${d} ${FORBINDEN_TIME_HOUR + 1}:00:00`
        let endStamp = new Date(endTime)
        let leftSecond = endStamp.getTime()/1000 - curr.getTime()/1000
        if (leftSecond <= 0) leftSecond = 0;

        this.labelTime.string = `剩余游戏时间${utils.getTimeLeft(leftSecond + 60)}`;

        if (leftSecond <= 0 || leftSecond >= 3600 || !rightDay) {
            guiManager.showDialogTips(CustomDialogId.ANTI_ADDICTION);
            this._clear()
            antiAddictionOpt.additionForceExitGame();
        }
    }

    private _clear () {
        if (this._timer) clearTimeout(this._timer)
        this.node.active = false;
    }

}