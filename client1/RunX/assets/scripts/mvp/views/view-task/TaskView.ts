import { VIEW_NAME } from "../../../app/AppConst";
import { utils } from "../../../app/AppUtils";
import List from "../../../common/components/List";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { configManager } from "../../../common/ConfigManager";
import { eventCenter } from "../../../common/event/EventCenter";
import { commonEvent, lvMapViewEvent, taskEvent, useInfoEvent } from "../../../common/event/EventData";
import guiManager from "../../../common/GUIManager";
import { redDotMgr, RED_DOT_MODULE } from "../../../common/RedDotManager";
import { cfg } from "../../../config/config";
import { gamesvr } from "../../../network/lib/protocol";
import { taskData, TASK_TYPE } from "../../models/TaskData";
import { userData } from "../../models/UserData";
import ItemRedDot from "../view-item/ItemRedDot";
import { taskDataOpt } from "../../operations/TaskDataOpt";
import ItemTask from "./ItemTask";
import { serverTime } from "../../../mvp/models/ServerTime";
import {TaskState} from '../../../app/AppEnums';
import GetAllRewardBtn from "../view-common/GetAllRewardBtn";

export interface TASK_INFO {
    taskId: number,
    curCount?: number,
    targetCount?: number,
    isRewarded?: boolean,
    isCompleted?: boolean
}

const {ccclass, property} = cc._decorator;
@ccclass
export default class TaskView extends ViewBaseComponent {
    @property(List)             tasksList: List = null;
    @property(ItemRedDot)       dayItemRedDot: ItemRedDot = null;
    @property(ItemRedDot)       weekItemRedDot: ItemRedDot = null;
    @property(ItemRedDot)       achievementItemRedDot: ItemRedDot = null;
    @property(cc.Label)         resetTaskTimeLabel: cc.Label = null;
    @property(cc.Node)          getAllBtn: cc.Node = null;

    private _resetScheduler: Function = null;
    private _taskType: TASK_TYPE = TASK_TYPE.DAY;
    private _tasks: cfg.TaskTarget[] = [];
    onInit(mID: number, pID: number, sID: number, taskType?: TASK_TYPE) {
        this._taskType = taskType ? taskType : TASK_TYPE.DAY;
        this._registerEvent();
        this._initRedDot();
        this._initView();
        guiManager.addCoinNode(this.node, mID, pID);
    }

    onRelease() {
        this.dayItemRedDot.deInit();
        this.weekItemRedDot.deInit();
        this.achievementItemRedDot.deInit();
        eventCenter.unregisterAll(this);
        guiManager.removeCoinNode(this.node);
        this._resetScheduler && this.unschedule(this._resetScheduler);
        this._resetScheduler = null;
        this.releaseSubView();
        this.tasksList._deInit();
    }

    onRefresh() {
        this._tasks = this._getTasksByType(this._taskType);
        this.tasksList.numItems = this._tasks.length;
    }

    _registerEvent() {
        eventCenter.register(taskEvent.CHANGE_PROGRESS, this, this._recvTaskProgressChange);
        // 主线任务不走进度通知
        eventCenter.register(lvMapViewEvent.FINISH_PVE_RES, this, this._recvTaskProgressChange);
        eventCenter.register(taskEvent.RECEIVE_REWARD, this, this._recvTaskReceiveReward);
        eventCenter.register(useInfoEvent.USER_EXP_CHANGE, this, this._recvUserExpChange);
        eventCenter.register(commonEvent.TIME_DAY_RESET, this, this._recvDayReset);
        eventCenter.register(commonEvent.TIME_WEEK_RESET, this, this._recvWeekReset);
    }

    private _initView() {
        this._tasks = this._getTasksByType(this._taskType);
        this.tasksList.numItems = this._tasks.length;
        this._updateGetAllRewardBtn();
        this._updateTaskResetTime();
        this.tasksList.scrollTo(0)
    }

    onItemTaskRender(item: cc.Node, index: number) {
        let data = this._tasks[index];
        item.getComponent(ItemTask).onInit(data, this.node);
    }

    private _initRedDot() {
        this.dayItemRedDot.setData(RED_DOT_MODULE.TASK_DAY_TOGGLE,{
            isClickCurToggle: this._taskType == TASK_TYPE.DAY
        });
        this.weekItemRedDot.setData(RED_DOT_MODULE.TASK_WEEK_TOGGLE,{
            isClickCurToggle: this._taskType == TASK_TYPE.WEEK
        });
        this.achievementItemRedDot.setData(RED_DOT_MODULE.TASK_ACHIEVEMENT_TOGGLE,{
            isClickCurToggle: this._taskType == TASK_TYPE.ACHIEVEMENT
        });
    }

    private _refreshRedDot(isAll: boolean = false) {
        if(isAll){
            redDotMgr.fire(RED_DOT_MODULE.TASK_DAY_TOGGLE);
            redDotMgr.fire(RED_DOT_MODULE.TASK_WEEK_TOGGLE);
            redDotMgr.fire(RED_DOT_MODULE.TASK_ACHIEVEMENT_TOGGLE);
            redDotMgr.fire(RED_DOT_MODULE.MAIN_TASK);
            return;
        }

        switch(this._taskType) {
            case TASK_TYPE.DAY: {
                redDotMgr.fire(RED_DOT_MODULE.TASK_DAY_TOGGLE);
                break;
            }
            case TASK_TYPE.WEEK: {
                redDotMgr.fire(RED_DOT_MODULE.TASK_WEEK_TOGGLE);
                break;
            }
            case TASK_TYPE.ACHIEVEMENT: {
                redDotMgr.fire(RED_DOT_MODULE.TASK_ACHIEVEMENT_TOGGLE);
                break;
            }
            default:
                break;
        }
        redDotMgr.fire(RED_DOT_MODULE.MAIN_TASK);
    }

    onClickToggle(toggle: cc.Toggle, customEventData: string) {
        if(customEventData != this._taskType.toString()) {
            this._taskType = parseInt(customEventData);
            this._initView();
        }
    }

    private _recvTaskProgressChange(eventId: number, msg: gamesvr.TaskTargetGroupCountChangeNotify) {
        this._initView();
        this._refreshRedDot(true);
    }

    private _recvTaskReceiveReward(eventId: number, msg: gamesvr.TaskTargetReceiveRewardRes) {
        this._initView();
        this.loadSubView(VIEW_NAME.GET_ITEM_VIEW, msg.Prizes);
        this._refreshRedDot();
    }

    private _recvUserExpChange(eventId: number, preUserLv: number) {
        
    }

    private _recvDayReset() {
        this._refreshRedDot();
        if(TASK_TYPE.DAY == this._taskType) {
            this._initView();
        }
    }

    private _recvWeekReset() {
        this._refreshRedDot();
        if(TASK_TYPE.WEEK == this._taskType) {
            this._initView();
        }
    }
    
    private _getTasksByType(type: TASK_TYPE): cfg.TaskTarget[] {
        let showTasks: cfg.TaskTarget[] = [];
        let taskConfigs: {[k: number]: cfg.TaskTarget} = configManager.getConfigs('task');
        for(const k in taskConfigs) {
            let taskCfg = taskConfigs[k];
            if(taskCfg.TargetModule == type && taskData.checkSatisfyShow(taskCfg)) {
                showTasks.push(taskCfg);
            }
        }
        
        //任务状态 1:已完成未领取，2:未完成   3:已完成已领取

        showTasks.sort((_a, _b) => {
            let aCompleted: boolean = taskData.getTaskIsCompleted(_a.TargetID);
            let aReceivedReward: boolean = taskData.getTaskIsReceiveReward(_a.TargetID);
            let bCompleted: boolean = taskData.getTaskIsCompleted(_b.TargetID);
            let bReceivedReward: boolean = taskData.getTaskIsReceiveReward(_b.TargetID);
            let a = aReceivedReward ? TaskState.Received : (aCompleted ? TaskState.Completed : TaskState.Undo);
            let b = bReceivedReward ? TaskState.Received : (bCompleted ? TaskState.Completed : TaskState.Undo);
            if(a == b) {
                return _a.TargetID - _b.TargetID;
            } else {
                return a - b;
            }
        });
        return showTasks;
    }

    private _updateTaskResetTime(){
        this._resetScheduler && this.unschedule(this._resetScheduler);
        this._resetScheduler = null;
        if(this._taskType == TASK_TYPE.DAY){
            this._resetScheduler = () => {
                let currTime = new Date(serverTime.currServerTime() * 1000);
                let leftTime = 86400 - currTime.getHours() * 3600 - currTime.getMinutes() * 60 - currTime.getSeconds();
                this.resetTaskTimeLabel.string = `${utils.getTimeLeft(leftTime)}后`;
            }
        }

        if(this._taskType == TASK_TYPE.WEEK){
            this._resetScheduler = () => {
                let currTime = new Date(serverTime.currServerTime() * 1000);
                let day = currTime.getDay();
                day == 0 && (day = 7);
                let leftTime = (8 - day) * 86400 - currTime.getHours() * 3600 - currTime.getMinutes() * 60 - currTime.getSeconds();
                this.resetTaskTimeLabel.string = `${utils.getTimeLeft(leftTime)}后`;
            }
        }

        if(this._resetScheduler){
            this._resetScheduler();
            this.resetTaskTimeLabel.node.parent.active = true;
            this.schedule(this._resetScheduler, 60);
        }else{
            this.resetTaskTimeLabel.node.parent.active = false;
        }
    }

    //获取可一键领取的任务集
    private _getReceivebleTasks(): number[]{
        if(!this._tasks || this._tasks.length == 0) return null;
        let completedTasks: number[] = null;
        this._tasks.forEach(ele => {
            let completed = taskData.getTaskIsCompleted(ele.TargetID);
            let received = taskData.getTaskIsReceiveReward(ele.TargetID);
            if(completed && !received){
                completedTasks = completedTasks || [];
                completedTasks.push(ele.TargetID); 
            }
        });
        return completedTasks;
    }

    //一键领取
    onClickAutoTake(){
        let completedTasks = this._getReceivebleTasks()
        if(!completedTasks || completedTasks.length == 0){
            this.getAllBtn.getComponent(GetAllRewardBtn).showNotReward();
            return;
        }
        taskDataOpt.sendReceiveTaskReward(completedTasks);
    }

    //更新一键领取按钮状态
    private _updateGetAllRewardBtn(){
        let completedTasks = this._getReceivebleTasks()
        this.getAllBtn.getComponent(GetAllRewardBtn).gray = !(completedTasks && completedTasks.length > 0);
    }
}
