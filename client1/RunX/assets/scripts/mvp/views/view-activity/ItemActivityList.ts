import { utils } from "../../../app/AppUtils";
import { resPathUtils } from "../../../app/ResPathUrlUtils";
import { RED_DOT_DATA_TYPE, RED_DOT_MODULE } from "../../../common/RedDotManager";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { cfg } from "../../../config/config";
import { serverTime } from "../../models/ServerTime";
import ItemRedDot from "../view-item/ItemRedDot";
import {scheduleManager} from "../../../common/ScheduleManager";
import { activityUtils } from "../../../app/ActivityUtils";

const { ccclass, property } = cc._decorator;

@ccclass
export default class ItemActivityList extends cc.Component {
    @property(cc.Sprite) activityBg: cc.Sprite = null;
    @property(cc.Label) lbDayLeft: cc.Label = null;
    @property(cc.Label) lbName: cc.Label = null;
    @property(cc.Node) ndDayLeft: cc.Node = null;
    @property(cc.Node) ndSelect: cc.Node = null;
    @property(ItemRedDot) itemRedDot: ItemRedDot = null;

    private _iconLoader = new SpriteLoader();
    private _cfg: cfg.ActivityList = null;
    private _remainTime: number = -1;
    private _scheduleId: number = 0;
    private _handler: Function = null;
    private _btnIdx: number = 0;

    init(cfg: cfg.ActivityList, btnIdx: number, clickHandler?: Function) {
        this._cfg = cfg;
        this._btnIdx = btnIdx;
        this._handler = clickHandler;

        this.node.active = true;
        this.ndSelect.active = false;
        this._showView();
    }


    get activityId() {
        return this._cfg.ActiveListID;
    }

    set select(v: boolean) {
        this.ndSelect.active = v;
        // this._refreshRedDot();
    }

    get remainTime(){
        return this._remainTime;
    }

    deInit() {
        this.itemRedDot.deInit();
        this._iconLoader && this._iconLoader.release();
        this._scheduleId && scheduleManager.unschedule(this._scheduleId);
    }

    onEnable(){
        if(this._cfg)
            this._refreshRedDot();
    }

    onClick() {
        this._handler && this._handler(this._cfg.ActiveListFunctionID, this._btnIdx);
    }

    unuse(){
        this.deInit();
    }

    reuse(){

    }

    private _showView() {
        if (this._cfg) {
            if (this._cfg.ActiveListBtnImage) {
                let url = resPathUtils.getActivityBg(this._cfg.ActiveListBtnImage);
                this._iconLoader.changeSprite(this.activityBg, url);
            }

            if (!this._cfg.ActiveListBeginTime) {
                this.ndDayLeft.active = false;
            } else {
                let timeArr = activityUtils.calActivityTime(this._cfg.ActiveListID);
                let beginTime = timeArr[0], endTime = timeArr[1];
                let currTime = serverTime.currServerTime();
                
                if (beginTime && endTime && currTime >= beginTime && currTime < endTime) {
                    let leftTime = endTime - currTime;
                    let leftTimeFormate = utils.getTimeInterval(leftTime)

                    if (leftTime > 0){
                        this.lbDayLeft.string = `剩余${leftTimeFormate}`;
                        this._scheduleId = scheduleManager.schedule(() => {
                            let leftTime = endTime - serverTime.currServerTime();
                            if (leftTime > 0) {
                                let leftTimeFormate = utils.getTimeInterval(leftTime)
                                this.lbDayLeft.string = `剩余${leftTimeFormate}`;
                            } else{
                                scheduleManager.unschedule(this._scheduleId);
                                this.lbDayLeft.string = '已结束';
                            }
                        }, 1)
                    } else{
                        this.lbDayLeft.string = '已结束';
                    }
                } else {
                    this.ndDayLeft.active = false;
                }
            }
            this.lbName.string = `${this._cfg.ActiveListName}`
            this._refreshRedDot();
        }
    }

    private _refreshRedDot() {
        // 签到
        if(this._cfg.ActiveListID == 1) {
            this.itemRedDot.setData(RED_DOT_MODULE.ACTIVITY_SIGN_TOGGLE, {
                // isClickCurToggle: this.ndSelect.active 
            });
            return;
        }
        
         // 等级奖励
        if(this._cfg.ActiveListID == 2) {
            this.itemRedDot.setData(RED_DOT_MODULE.ACTIVITY_LEVEL_TOGGLE, {
                // isClickCurToggle: this.ndSelect.active 
            });
            return;
        }
        
        // 补充体力
        if(this._cfg.ActiveListID == 3) {
            this.itemRedDot.setData(RED_DOT_MODULE.ACTIVITY_PHYSICAL_TOGGLE, {
                // isClickCurToggle: this.ndSelect.active 
            });
            return;
        }
        
        //登陆奖励
        if (this._cfg.ActiveListFunctionID == 37001){
            this.itemRedDot.setData(RED_DOT_MODULE.ACTIVITY_LOGIN_TOGGLE, {
                args: [this._cfg.ActiveListFunctionID]
            });
            return;
        }

        // 月卡
        if(this._cfg.ActiveListFunctionID == 45000) {
            this.itemRedDot.setData(RED_DOT_MODULE.ACTIVITY_MONTHLY_CARD_TOGGLE);
            return;
        }
        
        // 每日抽奖
        if(this._cfg.ActiveListFunctionID == 41000) {
            this.itemRedDot.setData(RED_DOT_MODULE.ACTIVITY_LOTTERY_TOGGLE);
            return;
        }
        
        // 战令
        if(this._cfg.ActiveListFunctionID == 5000) {
            this.itemRedDot.setData(RED_DOT_MODULE.ACTIVITY_BATTLE_PASS_TOGGLE);
            return;
        }

        // 累计充值
        if(this._cfg.ActiveListFunctionID == 40000) {
            this.itemRedDot.setData(RED_DOT_MODULE.ACTIVITY_CUMULATIVE_RECHARGE_TOGGLE, {
                args: [this._cfg.ActiveListID]
            });
            return;
        }

        // 每日充值
        if(this._cfg.ActiveListFunctionID == 39000) {
            this.itemRedDot.setData(RED_DOT_MODULE.ACTIVITY_PER_DAY_RECHARGE_TOGGLE, {
                args: [this._cfg.ActiveListID]
            });
            return;
        }
    }

}