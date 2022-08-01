import { activityUtils } from "../../../app/ActivityUtils";
import { VIEW_NAME } from "../../../app/AppConst";
import List from "../../../common/components/List";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { configManager } from "../../../common/ConfigManager";
import { eventCenter } from "../../../common/event/EventCenter";
import { activityEvent } from "../../../common/event/EventData";
import guiManager from "../../../common/GUIManager";
import moduleUIManager from "../../../common/ModuleUIManager";
import { uiHelper } from "../../../common/ui-helper/UIHelper";
import { cfg } from "../../../config/config";
import { gamesvr } from "../../../network/lib/protocol";
import { activityData } from "../../models/ActivityData";
import { activityOpt } from "../../operations/ActivityOpt";
import GetAllRewardBtn from "../view-common/GetAllRewardBtn";
import ItemActivityEternalRecharge from "./ItemActivityEternalRecharge";

const {ccclass, property} = cc._decorator;
@ccclass
export default class ActivityEternalRechargeView extends ViewBaseComponent {

    @property(List) taskList: List = null;
    @property(cc.Button) getAllRewardBtn: cc.Button = null;

    private _activityID: number = 0;
    private _cfgs: cfg.ActivityCumulativeRecharge[] = [];

    onInit(actId: number): void {
        this._activityID = actId;
        this._initView();


        eventCenter.register(activityEvent.ERERNAL_RECHARGE_CHANGE_NTF, this, this._initView);
        eventCenter.register(activityEvent.RECV_ETERNAL_RECHARGE_RES, this, this._recvRewardRes);
    }

    /**页面释放清理*/
    onRelease() {
        eventCenter.unregisterAll(this);
    }

    /**页面来回跳转刷新*/
    onRefresh(): void {
        this._initView();
    }

    private _initView() {
        this._prepareData();
        this._updateGetAllRewardBtn();
    }

    private _prepareData() {
        let activtyIsOpen = activityUtils.checkActivityOpen(this._activityID);
        if (activtyIsOpen) {
            this._cfgs = [];
            this._cfgs = configManager.getConfigList("cumulativeRecharge").filter((_cfg: cfg.ActivityCumulativeRecharge) => {
                //永久累充期数为0
                if (_cfg.Stage == 0) {
                    return true;
                } 
                return false;
            });
            
            //已领取的放最下边
            this._cfgs.sort((recharA, recharB) => {
                let recvMapA = activityData.eterRechargeData.ActivityEternalRechargePeriodMap[0]?.ReceiveRewardMap;
                let isCompletedA = recvMapA ? recvMapA[recharA.Num] : null;
                let isCompletedB = recvMapA ? recvMapA[recharB.Num] : null;
                if (isCompletedA && isCompletedB) {
                    return recharA.NeedMoney - recharB.NeedMoney;
                } else if (isCompletedA) {
                    return 1;
                } else if (isCompletedB) {
                    return -1;  
                } 
                return recharA.NeedMoney - recharB.NeedMoney
            })

            this.taskList && (this.taskList.numItems = this._cfgs.length);
        }
    }

    itemRender(item:cc.Node,idx:number) {
        let data = this._cfgs[idx];
        let itemTask = item.getComponent(ItemActivityEternalRecharge);
        itemTask.init(data);
        itemTask.activityId = this._activityID;
    }

    jumpRecharge() {
        moduleUIManager.jumpToModule(25000, 2);
    }

    //获取可领取的任务项集合
    private _getCanTakeRewards(): number[]{
        return activityUtils.getEternalCumulativeRechargeAtysWithNotGet(this._activityID);
    }

    //更新一键领取按钮状态
    private _updateGetAllRewardBtn(){
        let completedTasks = this._getCanTakeRewards();
        this.getAllRewardBtn.getComponent(GetAllRewardBtn).gray = !(completedTasks && completedTasks.length > 0);
    }

    private _recvRewardRes(cmd: any, data: gamesvr.ActivityEternalRechargeReceiveRewardRes, idx: number) {
        if (!cc.isValid(this.node)) return;
        let rootView = uiHelper.getRootViewComp(this.node.parent);
        if (data && data.Prizes.length) {
            guiManager.loadView(VIEW_NAME.GET_ITEM_VIEW, rootView.node, data.Prizes);
        }
        this._initView();
    }


    onClickAutoTake() {
        let period = activityUtils.getCumulativeRechargeActivityPeriod(this._activityID) || 0;
        let completedTasks = this._getCanTakeRewards(); 
        if (completedTasks && completedTasks.length > 0){
            activityOpt.takeEnternalCumulativeRechargeReward(period, completedTasks);
            return;
        }
        this.getAllRewardBtn.getComponent(GetAllRewardBtn).showNotReward();
    }
}
