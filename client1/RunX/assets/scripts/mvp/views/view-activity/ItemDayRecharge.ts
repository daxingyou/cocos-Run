import { utils } from "../../../app/AppUtils";
import { ItemBagPool } from "../../../common/res-manager/NodePool";
import { uiHelper } from "../../../common/ui-helper/UIHelper";
import { cfg } from "../../../config/config";
import { activityUtils } from "../../../app/ActivityUtils";
import { activityData } from "../../models/ActivityData";
import { configUtils } from "../../../app/ConfigUtils";
import { bagDataUtils } from "../../../app/BagDataUtils";
import { Equip } from "../../template/Equip";
import ItemBag from "../view-item/ItemBag";
import ItemRedDot from "../view-item/ItemRedDot";
import RichTextEx from "../../../common/components/rich-text/RichTextEx";
import moduleUIManager from "../../../common/ModuleUIManager";
import { activityOpt } from "../../operations/ActivityOpt";

const {ccclass, property} = cc._decorator;

@ccclass
export default class ItemDayRecharge extends cc.Component {
    @property(cc.Label)             nameLB: cc.Label = null;
    @property(RichTextEx)           introduceLB: RichTextEx = null;
    @property(RichTextEx)           progressLB: RichTextEx = null;
    @property(cc.ProgressBar)       progress: cc.ProgressBar = null;
    @property(cc.Node)              jumpBtn: cc.Node = null;
    @property(cc.Node)              rewardBtn: cc.Node = null;
    @property(cc.Node)              rewarded: cc.Node = null;
    @property(cc.Node)              rewardContent: cc.Node = null;
    @property(ItemRedDot)           itemRedDot: ItemRedDot = null;

    private _rechargeCfg: cfg.ActivityDayRecharge = null;
    private _activityId: number = 0;
    private _itemBags: ItemBag[] = [];
    
    set activityId(val: number){
        this._activityId = val;
    }

    init(cfg: cfg.ActivityDayRecharge, root?: cc.Node) {
        this._rechargeCfg = cfg;
        this._initView();
    }

    deInit() {
        this.itemRedDot.deInit();
        this._clearItems();
    }

    reuse(){

    }

    unuse() {
        this.deInit();
    }

    private _clearItems() {
        this._itemBags.forEach(_i => {
            _i.node.removeFromParent();
            _i.deInit();
            ItemBagPool.put(_i)
        })
        this._itemBags = [];
    }

    private _initView() {
        let period = activityUtils.getRechargeActivityPeriod();
        if (!period) return;
        let dayRechargeData = activityData.dayRechargeData;
        if (dayRechargeData) {
            let rechargeData = activityData.dayRechargeData.ActivityDailyRechargePeriodMap[period] || {};
            let curCount = (rechargeData.DayRechargeCount || 0) / 100;
            let targetCount = Number(this._rechargeCfg.NeedMoney || 0) /100;
            let isCompleted = curCount >= targetCount,
                isRewarded = rechargeData.DayReceiveRewardMap && rechargeData.DayReceiveRewardMap[this._rechargeCfg.Num];
            let desc = configUtils.getDialogCfgByDialogId(99000058).DialogText;
            desc = desc.replace(/%d/g, `${this._rechargeCfg.NeedMoney / 100}`);
            this.introduceLB.string = desc;
            this.progressLB.string = `<color=#FF2D23>${curCount}</color>/${targetCount}`;
            this.progress.progress = curCount / targetCount;
            this.progress.node.active = !isCompleted && !isRewarded;
            this.progressLB.node.active = !isCompleted && !isRewarded;
            this.jumpBtn.active = !isCompleted;
            let isHasReward = isCompleted && !isRewarded;
            this.rewardBtn.active = isHasReward;
            this.rewardBtn.getComponent(cc.Button).interactable = true;
            this.itemRedDot.showRedDot(isHasReward);
            this.rewarded.active = isCompleted && isRewarded;
        }

        // 刷新奖励展示
        this._clearItems();
        let rewards = utils.parseStingList(this._rechargeCfg.RewardShow);
        let rootView = uiHelper.getRootViewComp(uiHelper.getRootViewComp(this.node.parent).node.parent);
        // 单个物品特殊处理一下，（utils.parseStingList）方法后边需要统一下数据返回格式
        if (this._rechargeCfg.RewardShow.search('|') == -1){
            rewards = [rewards];
        }
        for(let i = 0; i < rewards.length; ++i) {
            let itemId: number = Number(rewards[i][0]);
            let count: number = Number(rewards[i][1]);
            let item = this.rewardContent.children[i];
            if(!item) {
                item = ItemBagPool.get().node;
                item.scale = 0.8;
                this.rewardContent.addChild(item);
                this._itemBags.push(item.getComponent(ItemBag));
            }
            item.active = true;

            let cfg1 = configUtils.getItemConfig(itemId);
            let cfg2 = configUtils.getEquipConfig(itemId);
            let cfg3 = configUtils.getHeroBasicConfig(itemId);
            if (cfg1) {
                item.getComponent(ItemBag).init({
                    id: itemId,
                    count: count,
                    clickHandler: () => {
                        moduleUIManager.showItemDetailInfo(itemId, count, rootView.node)
                    }
                })
            }
            if (cfg2) {
                let equip = new Equip(bagDataUtils.buildDefaultEquip(itemId));
                item.getComponent(ItemBag).init({
                    id: itemId,
                    count: count,
                    level: equip.getEquipLevel(),
                    star: equip.equipData.EquipUnit.Star,
                    clickHandler: () => {
                        moduleUIManager.showItemDetailInfo(itemId, count, rootView.node)
                    }
                })
            }
            if (cfg3) {
                let star = bagDataUtils.getHeroInitStar(itemId);
                item.getComponent(ItemBag).init({
                    id: itemId,
                    star: star,
                    prizeItem: true,
                    clickHandler: () => {
                        moduleUIManager.showItemDetailInfo(itemId, count, rootView.node)
                    }
                })
            }
            
        }

        // 代码设置宽度和坐标，取消Widget
        this.node.width = this.node.parent?.width;
        this.node.x = 0;
    }

    onClickJumpBtn() {
        moduleUIManager.jumpToModule(25000, 2);
    }
    /**
     *
     */
    onClickRewardBtn() {
        let period = activityUtils.getRechargeActivityPeriod();
        let nowDay = activityUtils.getDayRechargeActivityDay(this._activityId); // 本周第几天
        if (period)
            activityOpt.takeDayRechargeReward(period, nowDay, [this._rechargeCfg.Num]);
    }

}
