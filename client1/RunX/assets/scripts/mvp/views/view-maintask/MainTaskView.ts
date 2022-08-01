import { VIEW_NAME } from "../../../app/AppConst";
import { TaskState } from "../../../app/AppEnums";
import List from "../../../common/components/List";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { configManager } from "../../../common/ConfigManager";
import { eventCenter } from "../../../common/event/EventCenter";
import { mainTaskEvent, taskEvent } from "../../../common/event/EventData";
import guiManager from "../../../common/GUIManager";
import { logger } from "../../../common/log/Logger";
import { cfg } from "../../../config/config";
import { gamesvr } from "../../../network/lib/protocol";
import { mainTaskData } from "../../models/MainTaskData";
import { taskData } from "../../models/TaskData";
import ItemTask from "../view-task/ItemTask";
import ItemMainTask from "./ItemMainTask";
import ItemMainTaskReward from "./ItemMainTaskReward";

const { ccclass, property } = cc._decorator;
export const TOP_TARGET_ITEM_WIDTH = 100;
export const TOP_TARGET_ITEM_HERIGHT = 150;
@ccclass
export default class MainTaskView extends ViewBaseComponent {
    @property(cc.Node) topTargetContent: cc.Node = null;
    @property(cc.Node) itemList: cc.Node = null;
    @property(cc.Prefab) targetTempPrefab: cc.Prefab = null;
    @property(cc.ProgressBar) bar: cc.ProgressBar = null;
    @property(List) childTaskList: List = null;
    @property(cc.Node) childListContent: cc.Node = null;

    private _tasks: cfg.TaskTarget[] = [];
    /**滑动条每一节的单位长度*/
    private _processBarTempLen: number = 0;
    private _targetRewardItem: ItemMainTaskReward[] = [];
    
    protected onInit(...args: any[]): void {
        this._registerEvent();
        this._preConfigData();
        this._preTopTargetItemInit();
        this._initChildTaskData();
        this._initScollView();
    }  

    private _registerEvent() {
        eventCenter.register(taskEvent.RECEIVE_REWARD, this, this._recvTaskReceiveReward);
        eventCenter.register(mainTaskEvent.MAIN_TASK_RES, this, this._reciveTopTargetItemReward)
    }

    protected onRelease(): void {
        eventCenter.unregisterAll(this);
        this._targetRewardItem.forEach(item => {
            item.deInit();
        })
        this.itemList.width = 0;
        this.topTargetContent.width = 0;

        this.childTaskList._deInit();
    }

    onRefresh() {
        this._tasks = this._getTasksByType();
        this.childTaskList.numItems = this._tasks.length;
    }

    /**检测主线任务节点是否全完成 */
    private _checkMainTaskReceived():boolean {
        let receiveTaskArr = this._tasks.filter((item) => {
            return taskData.getTaskIsReceiveReward(item.TargetID);
        });
        let result = receiveTaskArr.length == this._tasks.length;
        if (result) {
            this._targetRewardItem[mainTaskData.mainRewardId - 1].setTargetState(TaskState.Completed);
            mainTaskData.setMainTaskState(mainTaskData.mainRewardId, TaskState.Completed);
        } 
        return result;
    }

    private _preConfigData() {
        let taskCfg = configManager.getConfigs(`mainTaskReward`);
        for (const k in taskCfg) {
            let value: cfg.TaskMainReward = taskCfg[k];
            let state = mainTaskData.getMainTaskState(value.TaskMainRewardID);
            if (!state) {
                mainTaskData.setMainTaskState(value.TaskMainRewardID,state)    
            }
        }
    }

    /**目标奖励item加载*/
    private _preTopTargetItemInit() {
        this.itemList.getComponent(cc.Layout).paddingLeft = TOP_TARGET_ITEM_WIDTH;
        this.itemList.getComponent(cc.Layout).paddingRight = TOP_TARGET_ITEM_WIDTH;
        this.itemList.getComponent(cc.Layout).spacingX = TOP_TARGET_ITEM_WIDTH/2;
        let size = mainTaskData.mainTaskState.size;
        for (let i = 0; i < size; i++){
            let node = this._addTopTargetItemInList();
            node.parent = this.itemList;

            let taskCfg:cfg.TaskMainReward = configManager.getConfigByKey(`mainTaskReward`, i + 1);
            let comp = node.getComponent(ItemMainTaskReward);
            this._targetRewardItem.push(comp);

            let rewardInfo = taskCfg.TaskMainRewardExhibition.split(";").map(Number);
            let mainState = mainTaskData.getMainTaskState(i + 1);
            comp.init(rewardInfo[0], rewardInfo[1], i + 1,mainState);
        }
        this.itemList.width = TOP_TARGET_ITEM_WIDTH * (size + 2) + (size - 1) * TOP_TARGET_ITEM_WIDTH / 2;
    }   

    /**添加固定的预制节点--后续可以观察是否用到节点池*/
    private _addTopTargetItemInList():cc.Node {
        let node = cc.instantiate(this.targetTempPrefab);
        node.setContentSize(cc.size(TOP_TARGET_ITEM_WIDTH, TOP_TARGET_ITEM_HERIGHT));
        node.setPosition(0, 0);
        return node;
    }

    /**初始化子任务信息*/
    private _initChildTaskData(): void {
        //初始化
        this.childTaskList.numItems = 0;
        this._tasks = this._getTasksByType();
        this.childTaskList.numItems = this._tasks.length;
        this.childTaskList.scrollTo(0)

        this._checkMainTaskReceived()  
    }

    private _initScollView() {
        this.topTargetContent.width = this.itemList.width + 1;
        this.bar.node.width = this.bar.totalLength = this.itemList.width - 20;
        this._reflashProcessBar();
    }

    private _reciveTopTargetItemReward(cmd: any, result: gamesvr.TaskMainReceiveRewardRes) {
        if (mainTaskData.mainRewardId != result.TaskMainID) {
            logger.error(`主线任务，本地记录不符,mainTaskData.mainRewardID:${mainTaskData.mainRewardId},TaskMainID:${result.TaskMainID}`);
            return;
        }
        logger.log(`储存主线任务本地状态，id:${mainTaskData.mainRewardId},state:${TaskState.Received}`);
        mainTaskData.setMainTaskState(mainTaskData.mainRewardId, TaskState.Received);
        mainTaskData.next();
        this._initChildTaskData();

        if (result && result.Prizes.length) {
            guiManager.loadView(VIEW_NAME.GET_ITEM_VIEW, this.node.parent, result.Prizes);
        }
    }

    private _reflashProcessBar() {
        this._processBarTempLen = Number((1 / mainTaskData.mainTaskState.size).toFixed(3));
        let receiveTaskArr = this._tasks.filter((item) => {
           return taskData.getTaskIsReceiveReward(item.TargetID);
        });
        let index = mainTaskData.mainRewardId || 1;
        let tempRate = receiveTaskArr.length / this._tasks.length;
        this.bar.progress = this._processBarTempLen * (tempRate + index - 1);
    }

    private _getTasksByType(): cfg.TaskTarget[] {
        let showTasks: cfg.TaskTarget[] = [];
        let mainTaskConfigs:cfg.TaskMainReward = configManager.getConfigByKey('mainTaskReward', mainTaskData.mainRewardId);
        let childTaskCfg:number[] = mainTaskConfigs.TaskMainRewardTarget.split("|").map(Number);
        childTaskCfg.forEach(item => {
            let task = configManager.getConfigByKey(`task`, item);
            if (task) showTasks.push(task);
        })
        
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

    
    /**收到任务信息*/
    private _recvTaskReceiveReward(eventId: number, msg: gamesvr.TaskTargetReceiveRewardRes) {
        this._initChildTaskData();
        this.loadSubView(VIEW_NAME.GET_ITEM_VIEW, msg.Prizes);
        // this._refreshRedDot();
        this._reflashProcessBar();
        //检测
        this._checkMainTaskReceived()
    }

    onItemMainTaskRender(item: cc.Node, index: number) {
        let data = this._tasks[index];
        item.getComponent(ItemMainTask).onInit(data, this.node);
    }
}