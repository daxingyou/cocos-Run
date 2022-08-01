import { CustomDialogId } from "../../../app/AppConst";
import { utils } from "../../../app/AppUtils";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { configManager } from "../../../common/ConfigManager";
import { uiHelper } from "../../../common/ui-helper/UIHelper";
import { cfg } from "../../../config/config";
import { activityData } from "../../models/ActivityData";
import { userData } from "../../models/UserData";
import { activityOpt } from "../../operations/ActivityOpt";
import { ItemBagPool } from "../../../common/res-manager/NodePool";
import ItemBag from "../view-item/ItemBag";
import guiManager from "../../../common/GUIManager";
import moduleUIManager from "../../../common/ModuleUIManager";
import ItemRedDot from "../view-item/ItemRedDot";

const { ccclass, property } = cc._decorator;

@ccclass
export default class ItemActivityLevelReward extends cc.Component {
    @property(cc.Label) tips: cc.Label = null;
    @property(cc.Node) rewardNode: cc.Node = null;
    @property(cc.Node) kingRewardNode: cc.Node = null;
    @property(cc.Node) rewardToken: cc.Node = null;
    @property(cc.Node) kingRewardToken: cc.Node = null;
    @property(cc.Node) kingRewardBtn: cc.Node = null;
    @property(cc.Node) rewardBtn: cc.Node = null;
    @property(ItemRedDot) itemRedDot: ItemRedDot = null;


    private _cfg: cfg.ActivityLevelReward = null;
    private _meetKingReward: boolean = false; 
    private _itemBags: ItemBag[] = [];
    private _homeNode: cc.Node = null;
    init(cfg: cfg.ActivityLevelReward, meetKingReward: boolean, homeNode: cc.Node) {
        this._cfg = cfg;
        this._meetKingReward = meetKingReward;
        this._homeNode = homeNode;
        this._showView();
    }

    deInit() {
        this.itemRedDot.deInit();
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
        this._clearItems();
        if (this._cfg && this._cfg.LevelRewardNormalShow) {
            let parseArr = utils.parseStingList(this._cfg.LevelRewardNormalShow);
            parseArr.forEach((ele, index) => {
                if (ele && ele.length) {
                    let item = ItemBagPool.get();
                    item.init({
                        id: parseInt(ele[0]),
                        count: parseInt(ele[1]),
                        prizeItem: true,
                        clickHandler: () => { moduleUIManager.showItemDetailInfo(parseInt(ele[0]), parseInt(ele[1]), this._homeNode); }
                    })
                    // 新创建节点，加入回收池
                    this._itemBags.push(item);
                    item.node.parent = this.rewardNode;
                }
            })
            this.rewardNode.active = true;
        } else {
            this.rewardNode.active = false;
        }
        if (this._cfg && this._cfg.LevelRewardKingShow) {
            let parseArr = utils.parseStingList(this._cfg.LevelRewardKingShow);
            parseArr.forEach((ele, index) => {
                if (ele && ele.length) {
                    let item = ItemBagPool.get();
                    item.init({
                        id: parseInt(ele[0]),
                        count: parseInt(ele[1]),
                        prizeItem: true,
                        clickHandler: () => { moduleUIManager.showItemDetailInfo(parseInt(ele[0]), parseInt(ele[1]), this._homeNode); }
                    })
                    // 新创建节点，加入回收池
                    this._itemBags.push(item);
                    item.node.parent = this.kingRewardNode;
                }

            })
            if (this.kingRewardNode.childrenCount && this.kingRewardNode.childrenCount > parseArr.length) {
                for (let k = parseArr.length; k < this.kingRewardNode.childrenCount; k++) {
                    let child = this.kingRewardNode.children[k];
                    this.kingRewardNode.removeChild(child);
                    child.destroy();
                }
            }
            this.kingRewardNode.active = true;
        } else {
            this.kingRewardNode.active = false;
        }
        let levelData = activityData.levelData;

        let isShowRedDot = !levelData.ReceiveOrdinaryRewardMap[this._cfg.LevelRewardID];
        let meetLevel = !this._cfg.LevelRewardGetLevel || userData.lv >= this._cfg.LevelRewardGetLevel;
        this.tips.string = `等级达到${this._cfg.LevelRewardGetLevel}级`;
        isShowRedDot && (this.rewardBtn.getComponent(cc.Button).interactable = meetLevel);
        this.rewardBtn.active = isShowRedDot;

        isShowRedDot = isShowRedDot && meetLevel;

        let isKingRewardBtnActive = levelData.ReceiveOrdinaryRewardMap[this._cfg.LevelRewardID] && !levelData.ReceiveSpecialRewardMap[this._cfg.LevelRewardID];
        this.kingRewardBtn.active = isKingRewardBtnActive;
        this.rewardToken.active = levelData.ReceiveOrdinaryRewardMap[this._cfg.LevelRewardID];
        this.kingRewardToken.active = levelData.ReceiveSpecialRewardMap[this._cfg.LevelRewardID];
        isShowRedDot = isShowRedDot || (isKingRewardBtnActive && this._meetKingReward);
        this._updateRedDot(isShowRedDot);
    }

    onClickTake(){
        let levelData = activityData.levelData;
        let notTake = !levelData.ReceiveOrdinaryRewardMap[this._cfg.LevelRewardID];
        let meetLevel = !this._cfg.LevelRewardGetLevel || userData.lv >= this._cfg.LevelRewardGetLevel;
        if(!notTake || !meetLevel) {
            this.rewardBtn.active = notTake;
            this.rewardBtn.getComponent(cc.Button).interactable = meetLevel;
            return;
        }
        activityOpt.takeLevelRewardReq(this._cfg.LevelRewardID);
    }

    onClickKingTake() {
        if (!this._meetKingReward){
            let cfg = configManager.getConfigByKey("dialogue", 2000004);
            guiManager.showMessageBoxByCfg(guiManager.sceneNode, cfg
                , (messageBox: ViewBaseComponent) => { messageBox.closeView()}
                , () => { moduleUIManager.jumpToModule(25000, 2); });
            return;
        }
        activityOpt.takeLevelRewardReq(this._cfg.LevelRewardID);
    }

    private _updateRedDot(visible: boolean){
        this.itemRedDot.showRedDot(visible);
    }

}
