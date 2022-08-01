import { utils } from "../../../app/AppUtils";
import { configUtils } from "../../../app/ConfigUtils";
import { scheduleManager } from "../../../common/ScheduleManager";
import { serverTime } from "../../models/ServerTime";
import { userData } from "../../models/UserData";

const {ccclass, property} = cc._decorator;


@ccclass
export default class ItemHangupIcon extends cc.Component {
    @property(cc.SpriteFrame) rewardSpf: cc.SpriteFrame[] = [];
    @property(cc.Sprite) reward: cc.Sprite = null;
    @property(cc.ProgressBar) progress: cc.ProgressBar = null;
    @property(cc.Label) labelCountDown: cc.Label = null;

    countDownScheduleID: number = null; // 倒计时scheduleID
    curTime: number = null;             // 当前已挂机时间(s)
    maxTime: number = null;             // 最大挂机时间(s)

    onRefresh () {
        let hangup = userData.universalData.UniversalHangUpGainData;
   
        this.node.active = false;
        //主界面默认不显示
        if (this.node.name == "HANGUP-MAIN") {
            let interval = configUtils.getConfigModule("AccumulateRewardMainShowTime");
            let currInterval = serverTime.currServerTime() - utils.longToNumber(hangup.StartTime);
            if (interval && currInterval >= interval) {
                this.node.active = true;
            }
        } else {
            this.node.active = true
        }

        if (hangup && hangup.StartTime && this.node.active) {
            let intervalStr = configUtils.getConfigModule("AccumulateRewardShowPicture");
            let intervals = utils.parseStingList(intervalStr);
            let currInterval = serverTime.currServerTime() - utils.longToNumber(hangup.StartTime);
            for (let i = intervals.length - 1; i >= 0; i--) {
                let info = intervals[i];
                let time = parseInt(info[0]);
                let image = info[1];

                if (image && currInterval >= time) {
                    this.node.active = true;
                    this.reward.spriteFrame = this.rewardSpf[this.getSpriteIdx(image)];
                    
                    break;
                }
            }

            // 倒计时
            this.curTime = serverTime.currServerTime() - utils.longToNumber(hangup.StartTime);
            this.maxTime = configUtils.getModuleConfigs().AccumulateRewardMaxTime;
            this.curTime >= this.maxTime && (this.curTime = this.maxTime);
            this.updateShow();

            this.startCountDown();
        }
    }

    updateShow() {
        this.progress.progress = this.curTime / this.maxTime;
        this.labelCountDown.string = utils.getTimeIntervalHour(this.curTime, "HH:MM:SS");
    }

    startCountDown() {
        this.stopCountDown();

        this.countDownScheduleID = scheduleManager.schedule(this.countDown.bind(this), 1);
    }

    countDown() {
        this.curTime += 1;
        if (this.curTime >= this.maxTime) {
            this.curTime = this.maxTime;
            this.stopCountDown();
        }
        this.updateShow();
    }

    stopCountDown() {
        if (this.countDownScheduleID != null) {
            scheduleManager.unschedule(this.countDownScheduleID);
        }
    }

    onDestroy(): void {
        this.stopCountDown();
    }

    // 图集都放一起算了，不动态加载了
    getSpriteIdx (imgString: string) {
        switch (imgString) {
            case "AccumulateType1": {
                return 0;
            }
            case "AccumulateType2": {
                return 1;
            }
            case "AccumulateType3": {
                return 2;
            }
            case "AccumulateType4": {
                return 3;
            }
            case "AccumulateType5": {
                return 4;
            }
            case "AccumulateType6": {
                return 5;
            }
            default: {
                return 0
            }
        }
    }
}