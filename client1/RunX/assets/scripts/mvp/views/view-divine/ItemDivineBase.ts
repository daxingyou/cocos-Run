import { VIEW_NAME } from "../../../app/AppConst";
import { configUtils } from "../../../app/ConfigUtils";
import { ItemBagPool } from "../../../common/res-manager/NodePool";
import { cfg } from "../../../config/config";
import { divineData } from "../../models/DivineData";
import ItemBag from "../view-item/ItemBag";

const {ccclass, property} = cc._decorator;

@ccclass
export default class ItemDivineBase extends cc.Component {
    @property(cc.Node) starsParent: cc.Node = null;
    @property(cc.Node) qualityBg: cc.Node = null;
    @property(cc.Node) itemBagParent: cc.Node = null;
    @property(cc.Label) taskCostTime: cc.Label = null;

    protected _taskId: number = 0;
    protected _loadView: Function = null;
    baseInit(taskId: number, loadView: Function) {
        this._taskId = taskId;
        this._loadView = loadView;
        this._refreshBaseView();
    }

    unuse() {

    }

    reuse() {

    }

    protected setQualityBG(quality: number){

    }

    protected _refreshBaseView() {
        let taskData = divineData.getTaskById(this._taskId);
        let taskConfig = configUtils.getDispatchTaskConfig(taskData.TaskID);
        
        this.setQualityBG(taskConfig.DispatchQuality);

        // 刷新星级
        for(let i = 0; i < this.starsParent.childrenCount; ++i) {
            let star = this.starsParent.children[i];
            if(cc.isValid(star)) {
                star.active = i < taskConfig.DispatchStar;
            }
        }

        let itemBag = this.itemBagParent.children[0];
        let itemBagCmp: ItemBag = null;
        if(!itemBag) {
            itemBagCmp = ItemBagPool.get();
            itemBag = itemBagCmp.node;
            this.itemBagParent.addChild(itemBag);
        } else {
            itemBagCmp = itemBag.getComponent(ItemBag);
        }
        itemBag.scale = 0.7;
        itemBagCmp.init({
            id: taskConfig.RewardItemID,
            count: taskConfig.RewardNum,
            clickHandler: () => {
                this._loadView(VIEW_NAME.TIPS_ITEM, { ID: taskConfig.RewardItemID, Count: taskConfig.RewardNum});
            }
        });

        if(this.taskCostTime) {
            this.taskCostTime.string = `任务时长：${this._convertToCountdownTime(taskConfig.CostTime)}`;
        }
    }

    protected _getDivineTaskData() {
        return divineData.getTaskById(this._taskId);
    }

    protected _getDispatchItemCfg(): cfg.DispatchTask {
        const taskData = this._getDivineTaskData();
        return configUtils.getDispatchTaskConfig(taskData.TaskID);
    }

    protected _getDispatchLevelCfg(): cfg.DispatchLevel {
        return configUtils.getDispatchLevelConfig(divineData.divineLv);
    }

    protected _convertToCountdownTime(interval: number): string {
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
}
