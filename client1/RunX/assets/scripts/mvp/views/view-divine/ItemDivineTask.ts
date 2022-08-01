import { configUtils } from "../../../app/ConfigUtils";
import { eventCenter } from "../../../common/event/EventCenter";
import { divineEvent } from "../../../common/event/EventData";
import guiManager from "../../../common/GUIManager";
import { ItemBagPool } from "../../../common/res-manager/NodePool";
import { data } from "../../../network/lib/protocol";
import { serverTime } from "../../models/ServerTime";
import { divineOpt } from "../../operations/DivineOpt";
import ItemBag from "../view-item/ItemBag";
import MessageBoxView from "../view-other/MessageBoxView";
import ItemDivineBase from "./ItemDivineBase";

enum TASK_STATE {
    INVALID,
    COMPLETE,
    DISPATCHING,
    NOT_DISPATCH
}

const {ccclass, property} = cc._decorator;

@ccclass
export default class ItemDivineTask extends ItemDivineBase {
   
    @property(cc.ProgressBar) completingProgress: cc.ProgressBar = null;
    @property(cc.Label) completedTips: cc.Label = null;
    @property(cc.Label) countdownLb: cc.Label = null;
    @property(cc.Node) dispatchBtnTips: cc.Node = null;
    @property(cc.Node) dispatchBtn: cc.Node = null;
    @property(cc.Node) receiveRewardBtnTips: cc.Node = null;
    @property(cc.Node) receiveRewardBtn: cc.Node = null;
    @property(cc.Node) cancelBtn: cc.Node = null;
    @property(cc.Node) cancelBtnTips: cc.Node = null;
    @property([cc.SpriteFrame]) qualitySPArr: cc.SpriteFrame[] = [];
    @property(cc.Node) itemClickNode: cc.Node = null;

    private _interval: Function = null;
    private _completedFunc: Function = null;
    init(taskId: number, loadView: Function, completedFunc?: Function) {
        super.baseInit(taskId, loadView);
        this.addEvent();
        this._completedFunc = completedFunc;
        this._refreshStateView();
    }

    addEvent() {
        eventCenter.register(divineEvent.CANCEL_TASK_SUC, this, this._recvCancelTask);
    }

    deInit() {
        this._stopInterval();
        eventCenter.unregisterAll(this);
        let bagChilds = [...this.itemBagParent.children]
        bagChilds.forEach(_c => {
            ItemBagPool.put(_c.getComponent(ItemBag));
        });
        this.unscheduleAllCallbacks();
    }

    unuse() {
        this.deInit();
    }

    reuse() {

    }

    private _refreshStateView() {
        const taskData = this._getDivineTaskData();
        let state = this._getTaskState(taskData);

        this.dispatchBtn.active = TASK_STATE.NOT_DISPATCH == state;
        cc.isValid(this.itemClickNode) && (this.itemClickNode.active = TASK_STATE.NOT_DISPATCH == state);
        this.dispatchBtnTips.active = TASK_STATE.NOT_DISPATCH == state;
        this.taskCostTime.node.active = TASK_STATE.NOT_DISPATCH == state;

        this.receiveRewardBtn.active = TASK_STATE.COMPLETE == state;
        this.receiveRewardBtnTips.active = TASK_STATE.COMPLETE == state;
        this.completedTips.node.active = TASK_STATE.COMPLETE == state;

        this.countdownLb.node.active = TASK_STATE.DISPATCHING == state;
        this.completingProgress.node.active = TASK_STATE.DISPATCHING == state;
        this.cancelBtn.active = TASK_STATE.DISPATCHING == state;
        this.cancelBtnTips.active = TASK_STATE.DISPATCHING == state;

        if(TASK_STATE.DISPATCHING == state) {
            this._refreshDispatchingView();
        }
    }

    private _refreshDispatchingView() {
        const taskData = this._getDivineTaskData();
        const dispatchItemCfg = this._getDispatchItemCfg();
        let endTime = Number(taskData.ExecuteTime) + dispatchItemCfg.CostTime;
        this._refreshDispatchingProgress();
        this._startInterval(endTime, () => { this._refreshStateView(); this._completedFunc && this._completedFunc(); });
    }

    private _refreshDispatchingProgress() {
        const taskData = this._getDivineTaskData();
        const dispatchItemCfg = this._getDispatchItemCfg();
        let endTime = Number(taskData.ExecuteTime) + dispatchItemCfg.CostTime;
        let curTime = serverTime.currServerTime();
        this.completingProgress.progress = endTime > curTime ? ((endTime - curTime) / dispatchItemCfg.CostTime) : 0;
    }

    onClickDispatchBtn() {
        this._loadView('DivineDispatchView', this._taskId);
    }

    onClickReceiveBtn() {
        divineOpt.sendReceiveReward([this._taskId]);
    }

    onClickCancelBtn() {
        guiManager.showMessageBox(this.node.parent.parent.parent.parent, {
            content: '是否召回任务？会重置任务时间',
            rightStr:"确定",
            rightCallback: (msgBox: MessageBoxView) => {
                msgBox.closeView()
                divineOpt.sendCancelTask(this._taskId);
            },
            leftCallback: (msgBox: MessageBoxView) => {
                msgBox.closeView()
            },
            leftStr:"取消"
        })
    }

    private _recvCancelTask(eventId: number, taskId: number) {
        if(taskId == this._taskId) {
            this._stopInterval();
        }
    }

    private _startInterval(endTime: number, endFunc?: Function) {
        this._stopInterval();
        let curTime = serverTime.currServerTime();
        if(endTime <= curTime) {
            this.scheduleOnce(() => {
                endFunc && endFunc();
            }, 1);
            return;
        }
        
        let countdownTime = endTime - curTime;
        this.countdownLb.string = `${this._convertToCountdownTime(countdownTime)}`;
        this._interval = () => {
            let curTime = serverTime.currServerTime();
            let countdownTime = endTime - curTime;
            this.countdownLb.string = `${this._convertToCountdownTime(countdownTime)}`;
            this._refreshDispatchingProgress();
            if(countdownTime <= 0) {
                this._stopInterval();
                endFunc && endFunc();
            }
        }
        this.schedule(this._interval, 1);
    }

    private _stopInterval() {
        if(this._interval) {
            this.unschedule(this._interval);
            this._interval = null;
        }
    }

    private _getTaskState(task: data.IDivineExpeditionTask) {
        if(task) {
            let startTime = Number(task.ExecuteTime) || 0;
            if(startTime > 0) {
                let dispatchItemCfg = configUtils.getDispatchTaskConfig(task.TaskID);
                if(dispatchItemCfg) {
                    let curTime = serverTime.currServerTime();
                    let needTime = dispatchItemCfg.CostTime;
                    if(needTime + startTime < curTime) {
                        return TASK_STATE.COMPLETE;
                    } else {
                        return TASK_STATE.DISPATCHING;
                    }
                }
                return TASK_STATE.INVALID;
            } else {
                return TASK_STATE.NOT_DISPATCH;
            }         
        }
        return TASK_STATE.INVALID;
    }

    protected setQualityBG(quality: number){
        let quaiityBGSp = this.qualityBg.getComponent(cc.Sprite);
        quality < this.qualitySPArr.length && (quaiityBGSp.spriteFrame = this.qualitySPArr[quality - 1]);
    }
}
