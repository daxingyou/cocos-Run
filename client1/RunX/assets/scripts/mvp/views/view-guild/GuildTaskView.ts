import { VIEW_NAME } from "../../../app/AppConst";
import List from "../../../common/components/List";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { configManager } from "../../../common/ConfigManager";
import { eventCenter } from "../../../common/event/EventCenter";
import { commonEvent, taskEvent } from "../../../common/event/EventData";
import { cfg } from "../../../config/config";
import { gamesvr } from "../../../network/lib/protocol";
import { taskData, TASK_TYPE } from "../../models/TaskData";
import ItemTask from "../view-task/ItemTask";

const {ccclass, property} = cc._decorator;

@ccclass
export default class GuildTaskView extends ViewBaseComponent {
    @property(List) taskList: List = null;

    private _tasks: cfg.TaskTarget[] = [];
    private _loadView: Function = null;
    onInit(loadView?: Function) {
        loadView && (this._loadView = loadView);
        this.doInit();
        this._dueData();
    }

    doInit() {
        eventCenter.register(taskEvent.CHANGE_PROGRESS, this, this._recvTaskProgressChange);
        eventCenter.register(taskEvent.RECEIVE_REWARD, this, this._recvTaskReceiveReward);
        eventCenter.register(commonEvent.TIME_WEEK_RESET, this, this._dueData);
    }

    onRelease() {
        eventCenter.unregisterAll(this);
        this.taskList._deInit();
    }

    private _dueData() {
        this._tasks = this._getTasks();
        this._refreshView();
    }

    private _refreshView() {
        this.taskList.numItems = this._tasks.length;
    }

    onItemTaskRender(item: cc.Node, index: number) {
        const taskCfg = this._tasks[index];
        const itemTaskCmp = item.getComponent(ItemTask);
        itemTaskCmp.onInit(taskCfg, this.node.parent);
    }

    private _recvTaskProgressChange() {
        this._dueData();
    }

    private _recvTaskReceiveReward(eventId: number, msg: gamesvr.TaskTargetReceiveRewardRes) {
        this._loadView(VIEW_NAME.GET_ITEM_VIEW, msg.Prizes);
        this._dueData();
    }

    private _getTasks() {
        let showTasks: cfg.TaskTarget[] = [];
        let taskConfigs: {[k: number]: cfg.TaskTarget} = configManager.getConfigs('task');
        for(const k in taskConfigs) {
            let taskCfg = taskConfigs[k];
            if(Number(taskCfg.TargetModule) == TASK_TYPE.GUILD && taskData.checkSatisfyShow(taskCfg)) {
                showTasks.push(taskCfg);
            }
        }

        showTasks.sort((_a, _b) => {
            let aCompleted: boolean = taskData.getTaskIsCompleted(_a.TargetID);
            let aReceivedReward: boolean = taskData.getTaskIsReceiveReward(_a.TargetID);
            let bCompleted: boolean = taskData.getTaskIsCompleted(_b.TargetID);
            let bReceivedReward: boolean = taskData.getTaskIsReceiveReward(_b.TargetID);
            let a = aReceivedReward ? 3 : (aCompleted ? 1 : 2);
            let b = bReceivedReward ? 3 : (bCompleted ? 1 : 2);
            if(a == b) {
                return _a.TargetID - _b.TargetID;
            } else {
                return a - b;
            }
        });
        return showTasks;
    }
}
