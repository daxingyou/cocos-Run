import { CHARACTER_VIEW_TYPE } from "../../../app/AppEnums";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import guiManager from "../../../common/GUIManager";
import { RED_DOT_MODULE } from "../../../common/RedDotManager";
import CoinNode from "../../template/CoinNode";
import ItemRedDot from "../view-item/ItemRedDot";
import SmeltView from "../view-smelt/SmeltView";
import TreasureView from "./TreasureView";

const {ccclass, property} = cc._decorator;

@ccclass
export default class CompoundView extends ViewBaseComponent {
  @property(cc.Node)                  subViewParent: cc.Node = null;
  @property(cc.ToggleContainer)       switchToggle: cc.ToggleContainer = null;
  @property(cc.Label)                 title:cc.Label = null;
  @property(ItemRedDot)               treasureRedDot: ItemRedDot = null;

  private _treasureCmp: TreasureView = null;
  private _smeltCmp: SmeltView = null;
  private _coinNode: cc.Node = null;
  private _moduleId: number = 0;
  private _curViewType: CHARACTER_VIEW_TYPE = CHARACTER_VIEW_TYPE.TREASURE;

    onInit(moduleId: number, viewType?: CHARACTER_VIEW_TYPE) {
        this._moduleId = moduleId;
        this._coinNode = guiManager.addCoinNode(this.node);

        let type = CHARACTER_VIEW_TYPE.TREASURE;
        if (viewType && viewType == CHARACTER_VIEW_TYPE.SMELT) {
            type = CHARACTER_VIEW_TYPE.SMELT
        }

        this.jumpToView(type);
        this.refreshRedDot();
    }

    onRelease() {
        this.treasureRedDot.deInit();
        guiManager.removeCoinNode(this.node);
        this._coinNode = null;

        this._treasureCmp && this._treasureCmp.closeView();
        this._smeltCmp && this._smeltCmp.closeView();
    }

    private _switchView(viewType: CHARACTER_VIEW_TYPE) {
        this.title.string = viewType == CHARACTER_VIEW_TYPE.SMELT? "炼宝":"灵宝";
    
        if (this._coinNode && this._moduleId) {
            this._coinNode.getComponent(CoinNode).init(this._moduleId + viewType);
        }

        let viewName = viewType == CHARACTER_VIEW_TYPE.SMELT? "SmeltView":"TreasureView";
        let subView = this.subViewParent.getChildByName(viewName);

        if(!cc.isValid(subView)) {
            let jumpFunc = (viewType: CHARACTER_VIEW_TYPE) => {
                this.jumpToView(viewType);
            }

            guiManager.loadView(viewName, this.subViewParent, jumpFunc).then((viewbaseCmp) => {
                // 其他子页面隐藏放异步回调里
                this.subViewParent.children.forEach(_c => {
                    if (cc.isValid(_c))
                        _c.active = _c.name == viewName;
                    });
                viewType == CHARACTER_VIEW_TYPE.TREASURE && (this._treasureCmp = viewbaseCmp as TreasureView);
                viewType == CHARACTER_VIEW_TYPE.SMELT && (this._smeltCmp = viewbaseCmp as SmeltView);
            });
            return;
        }

        viewType == CHARACTER_VIEW_TYPE.TREASURE && cc.isValid(this._treasureCmp) && this._treasureCmp.refreshView();
        viewType == CHARACTER_VIEW_TYPE.SMELT && cc.isValid(this._smeltCmp) && this._smeltCmp.onRefresh();

        this.subViewParent.children.forEach(_c => {
            if (cc.isValid(_c))
                _c.active = _c.name == subView.name;
        });
    }

    refreshRedDot() {
        this.treasureRedDot.setData(RED_DOT_MODULE.TREASURE_TOGGLE);
    }

    onClickToggle(toggle: cc.Toggle, customEventData: string) {
        let toggleIndex = parseInt(customEventData);
        if (this._curViewType != toggleIndex) {
            this._curViewType = toggleIndex as CHARACTER_VIEW_TYPE;
            this._switchView(toggleIndex as CHARACTER_VIEW_TYPE);
        }
    }

    jumpToView(viewType: CHARACTER_VIEW_TYPE) {
        let toggleNode = this.switchToggle.toggleItems[viewType - 1];
        if(toggleNode) {
            toggleNode.getComponent(cc.Toggle).check();
        }
        this._curViewType = viewType;
        this._switchView(viewType);
    }
}
