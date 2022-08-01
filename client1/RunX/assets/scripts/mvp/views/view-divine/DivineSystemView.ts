import { CustomDialogId, CustomItemId, VIEW_NAME } from "../../../app/AppConst";
import { QUALITY_TYPE } from "../../../app/AppEnums";
import { ItemInfo } from "../../../app/AppType";
import { utils } from "../../../app/AppUtils";
import { configUtils } from "../../../app/ConfigUtils";
import List from "../../../common/components/List";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { configManager } from "../../../common/ConfigManager";
import { eventCenter } from "../../../common/event/EventCenter";
import { commonEvent, divineEvent } from "../../../common/event/EventData";
import guiManager from "../../../common/GUIManager";
import { cfg } from "../../../config/config";
import { data, gamesvr } from "../../../network/lib/protocol";
import { bagData } from "../../models/BagData";
import { divineData } from "../../models/DivineData";
import { serverTime } from "../../models/ServerTime";
import { divineOpt } from "../../operations/DivineOpt";
import MessageBoxView, { MsgboxInfo } from "../view-other/MessageBoxView";
import ItemDivineTask from "./ItemDivineTask";

enum TASK_STATE {
    INVALID,
    COMPLETE,
    NOT_DISPATCH,
    DISPATCHING
}

const TASK_QUALITY_NAMES = ['白色', '白色', '绿色', '蓝色', '紫色', '橙色'];

const {ccclass, property} = cc._decorator;

@ccclass
export default class DivineSystemView extends ViewBaseComponent {
    @property(List) tasksList: List = null;
    @property(cc.Label) level: cc.Label = null;
    @property(cc.Label) upgradeTips: cc.Label = null;
    @property(cc.Label) taskStarIntervalTips: cc.Label = null;
    @property(cc.Label) taskMaxCount: cc.Label = null;
    @property(cc.Label) upgradeProgressTips: cc.Label = null;
    @property(cc.Label) resetTime: cc.Label = null;
    @property(cc.ProgressBar) upgradeProgress: cc.ProgressBar = null;
    @property(cc.Node) onceDispatchBtn: cc.Node = null;
    @property(cc.Node) onceDispatchBtnTips: cc.Node = null;
    @property(cc.Node) onceReceiveBtn: cc.Node = null;
    @property(cc.Node) onceReceiveBtnTips: cc.Node = null;
    @property(cc.Node) todayIsOverTips: cc.Node = null;
    @property(cc.Node) refreshBtn: cc.Node = null;
    @property(cc.Node) refreshBtnTips: cc.Node = null;
    @property(cc.Node) isMaxIcon: cc.Node = null;

    private _tasksList: number[] = [];
    private _interval: Function = null;

    onInit() {
        eventCenter.register(divineEvent.RECV_TASK_LIST, this, this._recvGetTaskList);
        eventCenter.register(divineEvent.RECEIVE_REWARD, this, this._recvReceiveReward);
        eventCenter.register(divineEvent.DISPATCH_SUC_EVENT, this, this._recvDispatchSuc);
        eventCenter.register(divineEvent.CANCEL_TASK_SUC, this, this._recvCancelDispatchSuc);
        eventCenter.register(commonEvent.TIME_DAY_RESET, this, this._onDayReset);

        this._dueData();
        guiManager.addCoinNode(this.node);
    }
    
    onRelease() {
        guiManager.removeCoinNode(this.node);
        eventCenter.unregisterAll(this);
        this.tasksList._deInit();
        this.releaseSubView();
    }

    private _recvGetTaskList() {
        this._dueData();
    }
    
    private _dueData() {
        this._tasksList = this._getTasksList();
        this._refreshView();
    }

    private _onDayReset() {
        this._refreshCommonView();
    }

    private _refreshView() {
        this._refreshListView();
        this._refreshCommonView();
    }

    private _refreshListView() {
        this.tasksList.numItems = this._tasksList.length;
        this.todayIsOverTips.active = this._tasksList.length <= 0;
        let isAllDispatch = this._checkTasksIsAllDispatch();
        let hasReceive = this._checkHasNotReceiveTask();
        this.onceDispatchBtn.active = !isAllDispatch && !hasReceive;
        this.onceDispatchBtnTips.active = !isAllDispatch && !hasReceive;
        this.onceReceiveBtn.active = hasReceive;
        this.onceReceiveBtnTips.active = hasReceive;
        this.refreshBtn.active = !isAllDispatch;
        this.refreshBtnTips.active = !isAllDispatch;
    }

    onTaskItemRender(item: cc.Node, index: number) {
        let taskId = this._tasksList[index];
        let itemDivineTask = item.getComponent(ItemDivineTask);
        itemDivineTask.init(taskId, this._loadView.bind(this) /*this._dueData.bind(this)*/);
    }

    private _refreshCommonView() {
        let dispatchLevelCfg = configUtils.getDispatchLevelConfig(divineData.divineLv);
        this.level.string = `等级：${divineData.divineLv}级`;
        let upgradeNeeds = dispatchLevelCfg.LevelUpNeed.split(';');
        let upgradeNeedQuality = Number(upgradeNeeds[0]);
        let upgradeNeedStar = Number(upgradeNeeds[1]);
        let upgradeNeedCount = Number(upgradeNeeds[2]);
        let curCompletedCount: number = divineData.getCompletedTaskCount();
        const isLvMax: boolean = this._checkLvIsMax();
        this.upgradeTips.node.active = !isLvMax;
        this.upgradeProgress.node.active = !isLvMax;
        this.upgradeProgressTips.node.active = !isLvMax;
        this.isMaxIcon.active = isLvMax;
        if(!isLvMax) {
            this.upgradeTips.string = `再完成${upgradeNeedCount - curCompletedCount}个${TASK_QUALITY_NAMES[upgradeNeedQuality]}${upgradeNeedStar}星以上任务可升级`;
            this.upgradeProgress.progress = curCompletedCount / upgradeNeedCount;
            this.upgradeProgressTips.string = `${curCompletedCount}/${upgradeNeedCount}`;
        }
        let starInterval = this._getTaskStarInterval(dispatchLevelCfg.Star);
        this.taskStarIntervalTips.string = `任务星级：${starInterval.start}-${starInterval.end}`;
        this.taskMaxCount.string = `数量上限：${dispatchLevelCfg.TaskNumMax}`;
        let nextDayTime = utils.getTodayZeroTime(true) + 24 * 60 * 60;
        this._startInterval(nextDayTime);
    }

    onClickOnceDispatchBtn() {
        this._loadView('DivineOnceDispatchView', this._loadView.bind(this));
    }

    onClickOnceReceiveBtn() {
        let receiveTasks = this._getReceiveTasks();
        if(receiveTasks.length > 0) {
            divineOpt.sendReceiveReward(receiveTasks);
        }
    }

    onClickRefreshTaskBtn() {
        let costNum = configUtils.getConfigModule('DispatchRefreshCost') || 100;
        this._showMassageBox({
            content: `是否花费${costNum}仙玉对所有未执行的任务进行刷新？刷新会随机出现高星级，高品质任务，可获得更多奖励`,
            rightCallback: () => {
                let diamondNum = bagData.getItemByID(CustomItemId.DIAMOND) ? Number(bagData.getItemByID(CustomItemId.DIAMOND).Array[0].Count) : 0;
                if(diamondNum < costNum) {
                    guiManager.showDialogTips(CustomDialogId.COMMON_ITEM_NOT_ENOUGH, CustomItemId.DIAMOND);
                } else {
                    if(this._checkHasHighQualityTask()) {
                        let dialogCfg = configUtils.getDialogCfgByDialogId(99000046);
                        let dialogText = '当前存在高品质派遣，是否刷新？';
                        if(dialogCfg) {
                            dialogText = dialogCfg.DialogText;
                        }
                        this._showMassageBox({
                            content: dialogText,
                            rightCallback: () => {
                                divineOpt.sendRefreshList();
                            },
                            rightStr:"确定",
                            leftCallback: (msgBox: MessageBoxView)=> {
                                msgBox.closeView()
                            },
                            leftStr: "取消",
                        })
                    } else {
                        divineOpt.sendRefreshList();
                    }
                }
            },
            rightStr:"确定",
            leftCallback: (msgBox: MessageBoxView)=> {
                msgBox.closeView()
            },
            leftStr: "取消",
        });
    }

    private _recvDispatchSuc() {
        guiManager.showTips('派遣成功');
        this._tasksList = this._getTasksList();
        this._refreshListView();
        
    }

    private _recvCancelDispatchSuc() {
        guiManager.showTips('召回成功');
        this._tasksList = this._getTasksList();
        this._refreshListView();
    }

    private _getTasksList() {
        let tasksList = divineData.tasksList;
        let divineTasks = [];
        for(const k in tasksList) {
            tasksList[k] && divineTasks.push(parseInt(k));
        }
        divineTasks.sort((_a, _b) => {
            let taskA = divineData.getTaskById(_a);
            let taskB = divineData.getTaskById(_b);
            let taskAState = this._getTaskState(taskA);
            let taskBState = this._getTaskState(taskB);
            if(taskAState == taskBState) {
                let taskACfg = configUtils.getDispatchTaskConfig(taskA.TaskID);
                let taskBCfg = configUtils.getDispatchTaskConfig(taskB.TaskID);
                if(taskACfg.DispatchQuality == taskBCfg.DispatchQuality) {
                    return taskBCfg.DispatchStar - taskACfg.DispatchStar;
                } else {
                    return taskBCfg.DispatchQuality - taskACfg.DispatchQuality;
                }
            } else {
                return taskAState - taskBState;
            }
        });
        return divineTasks;
    }

    private _recvReceiveReward(eventId: number, itemInfo: ItemInfo[]) {
        this._loadView(VIEW_NAME.GET_ITEM_VIEW, itemInfo);
        this._dueData();
    }

    private _loadView(viewName: string, ...args: any[]) {
        this.loadSubView(viewName, ...args);
    }

    private _showMassageBox(msgInfo: MsgboxInfo) {
        guiManager.showMessageBox(this.node, msgInfo);
    }

    private _getTaskState(task: data.IDivineExpeditionTask) {
        if(task) {
            let startTime = Number(task.ExecuteTime || 0);
            if(startTime > 0) {
                let dispatchItemCfg = configUtils.getDispatchTaskConfig(task.TaskID);
                if(dispatchItemCfg) {
                    let curTime = serverTime.currServerTime();
                    let needTime = dispatchItemCfg.CostTime;
                    if(needTime + startTime > curTime) {
                        return TASK_STATE.DISPATCHING;
                    } else {
                        return TASK_STATE.COMPLETE;
                    }
                }
                return TASK_STATE.INVALID;
            } else {
                return TASK_STATE.NOT_DISPATCH;
            }         
        }
        return TASK_STATE.INVALID;
    }

    private _getTaskStarInterval(starIntervalStr: string): { start: number, end: number} {
        let stars = starIntervalStr.split('|');
        let start: number = 0;
        let end: number = 0;
        for(let i = 0; i < stars.length; ++i) {
            let starStr = stars[i].split(';');
            let star = Number(starStr[0]);
            let num = Number(starStr[1]);
            if(num > 0) {
                if(start == 0) {
                    start = star;
                }
                end = star;
            }
        }
        return { start: start, end: end };
    }

    private _getResetTime() {
        let curTime = serverTime.currServerTime();
        let todayZeroTime = utils.getTodayZeroTime(true);
        let oneDayTime = 24 * 60 * 60;
        return Math.floor((oneDayTime - (curTime - todayZeroTime)) / 60 / 60);
    }

    private _checkHasNotReceiveTask() {
        let tasks = divineData.tasksList;
        for(const k in tasks) {
            let task = tasks[k];
            if(task) {
                if(task.IsExecute) {
                    let dispatchItemCfg = configUtils.getDispatchTaskConfig(task.TaskID);
                    if(dispatchItemCfg) {
                        let startTime = Number(task.ExecuteTime || 0);
                        let curTime = serverTime.currServerTime();
                        let needTime = dispatchItemCfg.CostTime;
                        if(curTime >= startTime + needTime) {
                            return true;
                        }
                    }
                }
            }
        }
        return false;
    }

    private _checkTasksIsAllDispatch(): boolean {
        let tasks = divineData.tasksList;
        for(const k in tasks) {
            let task = tasks[k];
            if(task) {
                if(!task.IsExecute) {
                    return false;
                }
            }
        }
        return true;
    }

    private _checkHasHighQualityTask(): boolean {
        let remindQuality = configUtils.getConfigModule('DispatchRemindQuality') || QUALITY_TYPE.SSR;
        let tasks = divineData.tasksList;
        for(const k in tasks) {
            let task = tasks[k];
            if(task && !task.IsExecute) {
                let taskId = task.TaskID;
                let taskCfg = configUtils.getDispatchTaskConfig(taskId);
                if(taskCfg) {
                    if(taskCfg.DispatchQuality >= remindQuality) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    private _startInterval(endTime: number, endFunc?: Function) {
        this._stopInterval();
        let curTime = serverTime.currServerTime();
        if(endTime <= curTime) {
            endFunc && endFunc();
            return;
        }
        
        let countdownTime = endTime - curTime;
        if(countdownTime > 60 * 60) {
            this.resetTime.string = `重置时间：${this._getResetTime()}小时后`;
        } else {
            this.resetTime.string = `重置时间：${this._convertToCountdownTime(countdownTime)}后`;
        }
        this._interval = () => {
            let curTime = serverTime.currServerTime();
            let countdownTime = endTime - curTime;
            if(countdownTime > 60 * 60) {
                this.resetTime.string = `重置时间：${this._getResetTime()}小时后`;
            } else {
                this.resetTime.string = `重置时间：${this._convertToCountdownTime(countdownTime)}后`;
            }
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

    private _convertToCountdownTime(interval: number): string {
        let timeStr = '';
        let pushTimeStr = (time: number, isShowDoubleZero: boolean = true, isEnd: boolean = false) => {
            if((!isShowDoubleZero && time > 0) || isShowDoubleZero) {
                timeStr += (time < 10 ? '0' + time : time) + '';
                if(!isEnd) {
                    timeStr += ":";
                }
            }
        }
        let hour: number = Math.floor(interval / 60 / 60);
        pushTimeStr(hour, false);
        let NotHourTime = interval % 3600;
        let minute = Math.floor(NotHourTime / 60);
        pushTimeStr(minute);
        let second = NotHourTime % 60;
        pushTimeStr(second, true, true);
        return timeStr;
    }

    private _getReceiveTasks() {
        let receiveTasks: number[] = [];
        let tasks = divineData.tasksList;
        for(const k in tasks) {
            let task = tasks[k];
            if(task) {
                if(task.IsExecute) {
                    let dispatchItemCfg = configUtils.getDispatchTaskConfig(task.TaskID);
                    if(dispatchItemCfg) {
                        let startTime = Number(task.ExecuteTime || 0);
                        let curTime = serverTime.currServerTime();
                        let needTime = dispatchItemCfg.CostTime;
                        if(curTime >= startTime + needTime) {
                            receiveTasks.push(Number(k));
                        }
                    }
                }
            }
        }
        return receiveTasks;
    }

    private _checkLvIsMax(): boolean {
        const curLv = divineData.divineLv;
        const dispatchLvs: cfg.DispatchLevel[] = configManager.getConfigList('dispatchLevel');
        if(dispatchLvs && dispatchLvs.length > 0) {
            const maxLv = dispatchLvs[dispatchLvs.length - 1].Level;
            return curLv >= maxLv;
        }
        return true;
    }

}
