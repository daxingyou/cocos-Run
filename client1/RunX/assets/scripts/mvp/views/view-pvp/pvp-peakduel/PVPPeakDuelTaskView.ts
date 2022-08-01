import { VIEW_NAME } from "../../../../app/AppConst";
import List from "../../../../common/components/List";
import { ViewBaseComponent } from "../../../../common/components/ViewBaseComponent";
import { configManager } from "../../../../common/ConfigManager";
import { eventCenter } from "../../../../common/event/EventCenter";
import { peakDuelEvent, taskEvent } from "../../../../common/event/EventData";
import guiManager from "../../../../common/GUIManager";
import { cfg } from "../../../../config/config";
import { gamesvr } from "../../../../network/lib/protocol";
import { TASK_TYPE } from "../../../models/TaskData";
import ItemPeakDuelTask from "./ItemPeakDuelTask";

const {ccclass, property} = cc._decorator;
@ccclass
export default class PVPPeakDuelTaskView extends ViewBaseComponent {
    @property(List) taskList: List = null;
    
    private _taskItems: Map<number, ItemPeakDuelTask> = new Map();
    private _taskConfigs: number[] = [];

    onInit(): void {
        this._prepareData();
        this._registerEvent();
    }

    /**页面释放清理*/
    onRelease() {
        this._taskItems.clear();
        this.taskList._deInit();
        eventCenter.unregisterAll(this);
    }

    private _registerEvent() {
        eventCenter.register(taskEvent.RECEIVE_REWARD, this, this._getTaskCompleteReward);
        eventCenter.register(peakDuelEvent.PEAK_DUEL_TASK_GOTO_NTY, this, this.closeView);
    }   

    private _prepareData() {
        // 任务完成清单
        configManager.getConfigList("task").forEach((_cfg: cfg.TaskTarget)=>{
            if (_cfg.TargetModule == TASK_TYPE.PEAKDUEL)
                this._taskConfigs.push(_cfg.TargetID);
        });

        this.taskList.numItems = this._taskConfigs.length;
    }

    /**获得任务领取奖励*/
    private _getTaskCompleteReward(cmd:any,msg:gamesvr.TaskTargetReceiveRewardRes) {
        if (msg.Prizes && msg.Prizes.length) {
            let taskId = msg.TargetIDList[0];
            let itemTask: ItemPeakDuelTask = this._taskItems.get(taskId);
            if (!itemTask) return;
            itemTask.reflashTaskState();

            guiManager.loadView(VIEW_NAME.GET_ITEM_VIEW, this.node.parent, msg.Prizes);
        }
    }   

    onTaskItemRender(item: cc.Node, index: number) {
        let taskComp = item.getComponent(ItemPeakDuelTask);
        let taskId = this._taskConfigs[index];
        if (!taskComp || !taskId) return;

        taskComp.onInit(taskId);

        this._taskItems.set(taskId, taskComp);
    }
}