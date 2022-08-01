/*
 * @Description: 三皇供奉的供奉格
 * @Version: 1.0
 * @Autor: lixu
 * @Date: 2022-06-07 19:38:31
 * @LastEditors: lixu
 * @LastEditTime: 2022-06-15 12:48:02
 */

import { utils } from "../../../../app/AppUtils";
import { configUtils } from "../../../../app/ConfigUtils";
import { resPathUtils } from "../../../../app/ResPathUrlUtils";
import { scheduleManager } from "../../../../common/ScheduleManager";
import { SpriteLoader } from "../../../../common/ui-helper/SpriteLoader";
import { cfg } from "../../../../config/config";
import { data } from "../../../../network/lib/protocol";
import { serverTime } from "../../../models/ServerTime";
import ItemRedDot from "../../view-item/ItemRedDot";

const {ccclass, property} = cc._decorator;

enum TributeBoxState {
    None = 0,
    Lock,
    Empty,
    Waitting,
    Running,
    Finished
}

@ccclass
export default class ItemGongFengBox extends cc.Component {
    @property(cc.Node) lockBg: cc.Node = null;
    @property(cc.Node) unlockBg: cc.Node = null;
    @property(cc.Node) addNode: cc.Node = null;
    @property(cc.Node) timeLbBg: cc.Node = null;
    @property(cc.Label) timeLb: cc.Label = null;
    @property(cc.Node) lockLbBg: cc.Node = null;
    @property(cc.Label) lockLb: cc.Label = null;
    @property(cc.Node) lockIcon: cc.Node = null;
    @property(cc.Sprite) itemSp: cc.Sprite = null;
    @property(cc.Button) btnTake: cc.Button = null;
    @property(ItemRedDot) redot: ItemRedDot = null;

    private _state: TributeBoxState = TributeBoxState.None;
    private _tributeInfo: data.IUniversalConsecrateTribute = null;
    private _lv: number = 0;
    private _clickHandler: Function = null;
    private _endTime: number = 0;
    private _startTime: number = 0;
    private _spLoader: SpriteLoader = null;

    private _schedulerID: number = 0;
    get state() {
        return this._state;
    }

    get tributeInfo() {
        return this._tributeInfo;
    }

    init(state: TributeBoxState, lv: number, tributeInfo: data.IUniversalConsecrateTribute, clickHandler: Function) {
        this._state = state;
        this._lv = lv;
        this._tributeInfo = tributeInfo;
        this._clickHandler = clickHandler;
        this._spLoader = this._spLoader || new SpriteLoader();
        this._removeScheduler();
        this._initCfg();
        this._initUI();
    }

    deInit() {
        this._spLoader && this._spLoader.release();
        this._removeScheduler();
        this._state = TributeBoxState.None;
        this._tributeInfo = null;
        this._clickHandler = null;
        this._clearTribute();
    }

    onClickBtn() {
        if(this._state <= TributeBoxState.Lock) return;

        //空的供奉栏,打开贡品背包
        if(this._state == TributeBoxState.Empty) {
          this._clickHandler && this._clickHandler(this._state, this);
          return
        }

        //未开始计时的贡品，回收
        if(this._state == TributeBoxState.Waitting) {
          this._clickHandler && this._clickHandler(this._state, this);
          return;
        }

        //正在倒计时
        if(this._state == TributeBoxState.Running) {
            this._clickHandler && this._clickHandler(this._state, this);
            return;
        }
    }

    onClickTakeBtn() {
        if(this._state == TributeBoxState.Finished) {
            this._clickHandler && this._clickHandler(this._state, this);
            return;
        }
    }

    private _initCfg() {
        if(this._state >= TributeBoxState.Waitting) {
            this._startTime = utils.longToNumber(this._tributeInfo.StartTime);
            let goodsCfg: cfg.ConsecrateGoods = configUtils.getConsecrateGoodsCfg(this._tributeInfo.ItemID);
            this._endTime = this._startTime + goodsCfg.ConsecrateGoodsDuration;
        }
    }

    private _removeScheduler() {
        this._schedulerID && scheduleManager.unschedule(this._schedulerID);
        this._schedulerID = 0;
    }

    private _initUI() {
        this.lockBg.active = this._state == TributeBoxState.Lock;
        this.unlockBg.active = this._state >= TributeBoxState.Empty;
        this.addNode.active = this._state == TributeBoxState.Empty;
        this.lockLbBg.active = this.lockLb.node.active = this.lockIcon.active = this._state == TributeBoxState.Lock;
        this.btnTake.node.active = this._state == TributeBoxState.Finished;
        this.timeLbBg.active = this.timeLb.node.active = this._state == TributeBoxState.Running;
        this.timeLb.node.active = (this._state == TributeBoxState.Running || this._state == TributeBoxState.Finished);
        this.redot.showRedDot(this._state == TributeBoxState.Finished);
        switch(this._state) {
            case TributeBoxState.Lock:
                this._clearTribute();
                this.lockLb.string = `雕像${this._lv}级解锁`;
                break;
            case TributeBoxState.Empty:
                this._clearTribute();
                break;
            case TributeBoxState.Waitting:
                this._addTribute();
                this._timeCountDownForWait();
                break;
            case TributeBoxState.Running:
                this._addTribute();
                this._timeCountDownForRunning();
                break;
            case TributeBoxState.Finished:
                this._addTribute();
                this.timeLb.string = '领取';
                break;
            default:
                this._clearTribute();
                break;
        }
    }

    private _clearTribute() {
        this.itemSp.node.active = false;
    }

    private _addTribute() {
        this._spLoader.changeSprite(this.itemSp, resPathUtils.getItemIconPath(this._tributeInfo.ItemID), () => {
            this.itemSp.node.active = true;
        })
    }

    private _timeCountDownForRunning() {
        let leftTime = this._endTime - serverTime.currServerTime();
        if(leftTime >= 0) {
            this._updateTimeLb(leftTime);
            this._schedulerID = scheduleManager.schedule(this._scheduleFn.bind(this), 1);
        }
    }

    private _timeCountDownForWait() {
        if(this._state != TributeBoxState.Waitting) return;
        this._schedulerID = scheduleManager.schedule(() => {
            let curTime = serverTime.currServerTime();
            if(this._startTime > curTime) {
                return;
            }
            this.updateState(TributeBoxState.Running, this._lv);
        }, 1);
    }

    private _scheduleFn() {
        let leftTime = this._endTime - serverTime.currServerTime();
        if(leftTime < 0) {
            this._removeScheduler();
            //变为领取状态
            this._state = TributeBoxState.Finished;
            this._initUI();
            return;
        }
        this._updateTimeLb(leftTime);
    }

    private  _updateTimeLb(leftTime: number) {
        let leftTimeData = utils.getLeftTime(leftTime);
          //小于24小时
        if(leftTimeData[0] == 0) {
            this.timeLb.string = `${leftTimeData[1]}:${leftTimeData[2]}:${leftTimeData[3]}`;
        } else {
            this.timeLb.string = `${leftTimeData[0]}天${leftTimeData[1]}时${leftTimeData[2]}分`;
        }
    }

    updateState(state: TributeBoxState, lv: number,) {
        this._state = state;
        this._lv = lv;
        this._removeScheduler();
        this._initCfg();
        this._initUI();
    }
}

export {
    TributeBoxState
}
