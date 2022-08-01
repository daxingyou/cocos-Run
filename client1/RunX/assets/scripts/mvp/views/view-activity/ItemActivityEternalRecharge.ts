import { activityUtils } from "../../../app/ActivityUtils";
import { utils } from "../../../app/AppUtils";
import { configUtils } from "../../../app/ConfigUtils";
import RichTextEx from "../../../common/components/rich-text/RichTextEx";
import moduleUIManager from "../../../common/ModuleUIManager";
import { ItemBagPool } from "../../../common/res-manager/NodePool";
import { uiHelper } from "../../../common/ui-helper/UIHelper";
import { cfg } from "../../../config/config";
import { activityData } from "../../models/ActivityData";
import { activityOpt } from "../../operations/ActivityOpt";
import ItemBag from "../view-item/ItemBag";
import ItemRedDot from "../view-item/ItemRedDot";

const {ccclass, property} = cc._decorator;
@ccclass
export default class ItemActivityEternalRecharge extends cc.Component {
    @property(cc.Label)             nameLB: cc.Label = null;
    @property(RichTextEx)           introduceLB: RichTextEx = null;
    @property(RichTextEx)           progressLB: RichTextEx = null;
    @property(cc.ProgressBar)       progress: cc.ProgressBar = null;
    @property(cc.Node)              jumpBtn: cc.Node = null;
    @property(cc.Node)              rewardBtn: cc.Node = null;
    @property(cc.Node)              rewarded: cc.Node = null;
    @property(cc.Node)              rewardContent: cc.Node = null;
    @property(ItemRedDot)           itemRedDot: ItemRedDot = null;

    private _rechargeCfg: cfg.ActivityCumulativeRecharge = null;
    private _activityId: number = 0;
    private _itemBags: ItemBag[] = [];
    
    set activityId(val: number){
        this._activityId = val;
    }

    init(cfg: cfg.ActivityCumulativeRecharge, root?: cc.Node) {
        this._rechargeCfg = cfg;
        this._initView();
    }

    onRelease() {
        this._clearItems();
    }

    reuse(){

    }

    unuse() {
        this._clearItems();
    }

    private _clearItems() {
        this.itemRedDot.deInit();
        this._itemBags.forEach(_i => {
            ItemBagPool.put(_i)
        })
        this._itemBags = [];
    }

    private _initView() {
        let period = this._rechargeCfg.Stage;
        let eterRechargeData = activityData.eterRechargeData;
        if (eterRechargeData) {
            let rechargeData = activityData.eterRechargeData.ActivityEternalRechargePeriodMap[period] || {};
            let curCount = (rechargeData.RechargeCount || 0) / 100;
            let targetCount = Number(this._rechargeCfg.NeedMoney || 0) / 100;
            let isCompleted = curCount >= targetCount,
                isRewarded = rechargeData.ReceiveRewardMap && rechargeData.ReceiveRewardMap[this._rechargeCfg.Num];
            let desc = configUtils.getDialogCfgByDialogId(99000090).DialogText;
            desc = utils.convertFormatString(desc, [{num:this._rechargeCfg.NeedMoney / 100}]);
            // desc = desc.replace(/%d/g, `${this._rechargeCfg.NeedMoney / 100}`);
            this.introduceLB.string = desc;
            this.progressLB.string = `<color=#FF2D23>${curCount}</color>/${targetCount}`;
            this.progress.progress = curCount / targetCount;
            this.progress.node.active = !isCompleted && !isRewarded;
            this.progressLB.node.active = !isCompleted && !isRewarded;
            this.jumpBtn.active = !isCompleted;
            let isHasReward = isCompleted && !isRewarded;
            this.rewardBtn.active = isHasReward
            this.rewardBtn.getComponent(cc.Button).interactable = true;
            this.itemRedDot.showRedDot(isHasReward);
            this.rewarded.active = isCompleted && isRewarded;

            // 代码设置宽度和坐标，取消Widget
            this.node.width = this.node.parent?.width;
            this.node.x = 0;
        }

        // 刷新奖励展示
        let rewards = utils.parseStingList(this._rechargeCfg.RewardShow);
        let rootView = uiHelper.getRootViewComp(uiHelper.getRootViewComp(this.node.parent).node.parent);
        // 单个物品特殊处理一下，（utils.parseStingList）方法后边需要统一下数据返回格式
        if (this._rechargeCfg.RewardShow.search('|') == -1){
            rewards = [rewards];
        }
        rewards.forEach((ele, i) => {
            let itemId: number = parseInt(ele[0]);
            let count: number = parseInt(ele[1]);
            let item = this.rewardContent.children[i];
            if(!item) {
                item = ItemBagPool.get().node;
                item.scale = 0.8;
                this.rewardContent.addChild(item);
                this._itemBags.push(item.getComponent(ItemBag));
            }
            item.active = true;
            item.getComponent(ItemBag).init({
                id: itemId,
                count: count,
                prizeItem: true,
                clickHandler: () => {
                    moduleUIManager.showItemDetailInfo(itemId, count, rootView.node)
                }
            })
        });
    }

    onClickJumpBtn() {
        moduleUIManager.jumpToModule(25000, 2);
    }
    /**
     *
     */
    onClickRewardBtn() {
        let period = activityUtils.getCumulativeRechargeActivityPeriod(this._activityId) || 0;    
        activityOpt.takeEnternalCumulativeRechargeReward(period, [this._rechargeCfg.Num]);
    }
}