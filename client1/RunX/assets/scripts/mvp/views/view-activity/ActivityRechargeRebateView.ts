/*
 * @Author: xuyang
 * @Description: 活动-充值返利页面
 */
import { configManager } from "../../../common/ConfigManager";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { eventCenter } from "../../../common/event/EventCenter";
import { cfg } from "../../../config/config";
import List from "../../../common/components/List";
import moduleUIManager from "../../../common/ModuleUIManager";
import { activityOpt } from "../../operations/ActivityOpt";
import { activityEvent } from "../../../common/event/EventData";
import { gamesvr } from "../../../network/lib/protocol";

const { ccclass, property } = cc._decorator;
@ccclass
export default class ActivityRechargeRebateView extends ViewBaseComponent {
    @property(List) listview: List = null;
    @property(cc.Label) progressLb: cc.Label = null;

    private _selectedId: number = -1;
    private _rebateCfgs: cfg.ActivityRechargeRebate[] = [];

    onInit(moduleId: number, partId: number, subId: number) {
        eventCenter.register(activityEvent.REBATE_RECHARGE_RES, this, this._refreshView)
        this._prepareData();
        // this._refreshView();
    }

    onRelease() {
        this.listview._deInit();
        eventCenter.unregisterAll(this);
    }

    onRefresh() {
        this._prepareData();
    }

    private _prepareData(){
        this._rebateCfgs = configManager.getConfigList("rechargeRebate");
        activityOpt.takeRebateRechargeCount();
    }

    private _refreshView(cmd: any, msg: gamesvr.ActivityRechargeRebateObtainRes){
        let rechargeCnt = msg.RechargeCount ? msg.RechargeCount/100 : 0
        //先加载列表再做跳转
        let jumpIdx = -1;
        this._rebateCfgs.forEach((cfg, index) => {
            let min = index ? this._rebateCfgs[index - 1].RebateLevel : 1;
            let max = cfg.RebateLevel;
            if (rechargeCnt >= min && rechargeCnt < max){
                jumpIdx = index;
            }
        })
        this._selectedId = jumpIdx;
        this.listview.numItems = this._rebateCfgs.length;
        if (jumpIdx > -1){
            this.listview.scrollTo(jumpIdx, 0);
            this.progressLb.string = `当前已累计充值：${rechargeCnt}元`;
        } else {
            this.progressLb.string = `当前暂未充值`;
        }
    }

    onListRender(itemNode: cc.Node, idx:number){
        let selBg = itemNode.getChildByName("sel_bg");
        let title = itemNode.getChildByName("title_txt");
        let desc = itemNode.getChildByName("desc_txt");

        selBg.active = this._selectedId == idx;
        title.getComponent(cc.Label).string = this._rebateCfgs[idx].RebateLevelName;
        desc.getComponent(cc.Label).string = this._rebateCfgs[idx].RebateLevelIntroduce;
    }

    onSelectRender(itemNode: cc.Node, idx: number) {
        if (itemNode && idx > -1){
            let selBg = itemNode.getChildByName("sel_bg");
            selBg.active = true;
        }
    }

    onClickCharge(event?: cc.Event, customEventData?: string){
        moduleUIManager.jumpToModule(25000, 1);
    }

   
}