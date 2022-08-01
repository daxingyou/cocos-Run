import { utils } from "../../../app/AppUtils";
import { uiHelper } from "../../../common/ui-helper/UIHelper";
import { cfg } from "../../../config/config";
import { activityData } from "../../models/ActivityData";
import { ItemBagPool } from "../../../common/res-manager/NodePool";
import ItemBag from "../view-item/ItemBag";
import moduleUIManager from "../../../common/ModuleUIManager";
import { activityUtils } from "../../../app/ActivityUtils";
import guiManager from "../../../common/GUIManager";
import { activityOpt } from "../../operations/ActivityOpt";

const { ccclass, property } = cc._decorator;

@ccclass
export default class ItemBattlePassReward extends cc.Component {
    @property(cc.Node) lockNode: cc.Node = null;
    @property(cc.Node) normalTakeButton: cc.Node = null;
    @property(cc.Node) priorTakeButton: cc.Node = null;
    @property(cc.Node) normalToken: cc.Node = null;
    @property(cc.Node) priorToken: cc.Node = null;
    @property(cc.Node) normalRewardNode: cc.Node = null;
    @property(cc.Node) priorRewardNode: cc.Node = null;
    @property(cc.Toggle) openToggle: cc.Toggle = null;

    private _cfg: cfg.BattlePass = null;
    private _itemBags: ItemBag[] = [];
    
    init(cfg: cfg.BattlePass) {
        this._cfg = cfg;
        this._showView();
    }

    deInit() {
        this._clearItems();
    }

    unuse() {
        this.deInit();
    }

    reuse() {
    }

    private _clearItems() {
        this._itemBags.forEach(_i => {
            _i.node.removeFromParent();
            ItemBagPool.put(_i)
        })
        this._itemBags = [];
    }

    private _showView() {
        let homeNode = uiHelper.getRootViewComp(uiHelper.getRootViewComp(this.node).node.parent).node;
        this._clearItems();
        if (this._cfg && this._cfg.NormalRewardShow) {
            let parseArr = utils.parseStingList(this._cfg.NormalRewardShow);
            parseArr.forEach((ele, index) => {
                if (ele && ele.length) {
                    let item = ItemBagPool.get();
                    item.init({
                        id: parseInt(ele[0]),
                        count: parseInt(ele[1]),
                        prizeItem: true,
                        clickHandler: () => { moduleUIManager.showItemDetailInfo(parseInt(ele[0]), parseInt(ele[1]),homeNode); }
                    })
                    this._itemBags.push(item);
                    item.node.parent = this.normalRewardNode;
                }
            })
            this.normalRewardNode.active = true;
        }
        if (this._cfg && this._cfg.SpecialRewardShow) {
            let parseArr = utils.parseStingList(this._cfg.SpecialRewardShow);
            parseArr.forEach((ele, index) => {
                if (ele && ele.length) {
                    let item = ItemBagPool.get();
                    item.init({
                        id: parseInt(ele[0]),
                        count: parseInt(ele[1]),
                        prizeItem: true,
                        clickHandler: () => { moduleUIManager.showItemDetailInfo(parseInt(ele[0]), parseInt(ele[1]), homeNode); }
                    })
                    // 新创建节点，加入回收
                    this._itemBags.push(item);
                    item.node.parent = this.priorRewardNode;
                }
            })
            this.priorRewardNode.active = true;
        }

        // 区分至尊战令
        let battlePassLv = activityUtils.getBattlePassLv();
        let canTake = battlePassLv >= this._cfg.Level;
        let battlePassData = activityData.battlePassData;
        let normalToken = battlePassData && battlePassData.ReceiveNormalReward[this._cfg.Level];
        let priorToken = battlePassData && battlePassData.ReceiveSpecialReward[this._cfg.Level];
        let openPrior = battlePassData && activityData.battlePassData.IsSpecial;

        this.normalTakeButton.active = canTake && !normalToken;
        this.normalToken.active = canTake && normalToken;
        this.priorTakeButton.active = canTake && openPrior && !priorToken;
        this.priorToken.active = canTake && openPrior && priorToken;
        this.lockNode.active = !openPrior;

        this.openToggle.isChecked = canTake;
        this.openToggle.node.getComponentsInChildren(cc.Label).forEach(lb =>{
            lb.string = `${this._cfg.Level}`;
        })
    }

   
    onClickBuy() {
        let battlePassData = activityData.battlePassData;
        let openPrior = battlePassData && activityData.battlePassData.IsSpecial;
        // 当期未开启至尊战令走购买弹窗
        if (!openPrior) {
            let homeNode = uiHelper.getRootViewComp(uiHelper.getRootViewComp(this.node).node.parent).node;
            guiManager.loadView("ActivityBattlePassTipsView", homeNode);
        }
    }

    onClickTake(){
        activityOpt.takeBattlePassReward([this._cfg.Level]);
    }

    onClickKingTake() {
        activityOpt.takeBattlePassReward([this._cfg.Level]);
    }

}