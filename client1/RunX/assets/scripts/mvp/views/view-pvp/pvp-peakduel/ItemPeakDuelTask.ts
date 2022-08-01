import { configManager } from "../../../../common/ConfigManager";
import { eventCenter } from "../../../../common/event/EventCenter";
import { peakDuelEvent } from "../../../../common/event/EventData";
import { ItemBagPool } from "../../../../common/res-manager/NodePool";
import { cfg } from "../../../../config/config";
import { taskData } from "../../../models/TaskData";
import { taskDataOpt } from "../../../operations/TaskDataOpt";
import ItemBag from "../../view-item/ItemBag";

const {ccclass, property} = cc._decorator;
@ccclass
export default class ItemPeakDuelTask extends cc.Component {
    @property(cc.Node) itemBagNode: cc.Node = null;
    @property(cc.Label) desLb: cc.Label = null;
    @property(cc.Node) jumpNode: cc.Node = null;
    @property(cc.Node) awardNode: cc.Node = null;
    @property(cc.Node) rewardedNode: cc.Node = null;

    private _itemBag: ItemBag = null;
    private _taskId = 0;
    onInit(taskId: number): void {
        this._taskId = taskId;
        this._registerEvent();
        this.reflashTaskState();
        this._initView();
    }

    /**item释放清理*/
    deInit() {
        ItemBagPool.put(this._itemBag);
        eventCenter.unregisterAll(this);
    }

    private _registerEvent() {

    }

    private _initView() {
        let taskCfg:cfg.TaskTarget = configManager.getConfigByKey("task", this._taskId);
        let rewardInfo:number[] = taskCfg.TaskRewardShow.split(";").map(Number);
        let itemBag = ItemBagPool.get();
        itemBag.init({
            id: rewardInfo[0],
            count: rewardInfo[1]
        })
        itemBag.node.scale = 0.9;
        itemBag.node.parent = this.itemBagNode;
        this._itemBag = itemBag;

        this.desLb.string = taskCfg.TaskIntroduce;
    }

    private _setBtnState(isComplt: boolean, isRecv: boolean = false) {
        this.jumpNode.active = !isComplt;
        this.awardNode.active = (isComplt && !isRecv);
        this.rewardedNode.active = (isComplt && isRecv);
        if (this.rewardedNode.active) {
            let button = this.rewardedNode.getComponent(cc.Button);
            if (!button) return;
            button.interactable = false;
            button.enableAutoGrayEffect = true;
        }
    }

    reflashTaskState() {
        let isComplt = taskData.getTaskIsCompleted(this._taskId);
        let isRecv = taskData.getTaskIsReceiveReward(this._taskId);
        this._setBtnState(isComplt, isRecv);
    }

    /**领取奖励*/
    sendGetRewardOpt() {
        taskDataOpt.sendReceiveTaskReward([this._taskId]);
    }

    openGoTaskPeakDuel() {
        eventCenter.fire(peakDuelEvent.PEAK_DUEL_TASK_GOTO_NTY);
    }
}