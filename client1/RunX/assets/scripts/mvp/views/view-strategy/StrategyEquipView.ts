
import UIGridView, { GridData } from "../../../common/components/UIGridView";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { configManager } from "../../../common/ConfigManager";
import { eventCenter } from "../../../common/event/EventCenter";
import { cfg } from "../../../config/config";
import ItemStrategyEquip from "./item/ItemStrategyEquip";

const {ccclass, property} = cc._decorator;

@ccclass
export default class StrategyEquipView extends ViewBaseComponent {

    @property(UIGridView) uiGridView: UIGridView = null;
    @property(cc.Prefab) prefab: cc.Prefab = null;

    private _equipCfgs: cfg.StrategyEquip[] = null;

    private _nodePool: cc.NodePool = null;

    protected onInit(...args: any[]): void {
        this._equipCfgs = this._equipCfgs || configManager.getConfigList('strategyEquip');
        this._nodePool = this._nodePool || new cc.NodePool();
        this._initUI();
    }

    deInit() {
        this._equipCfgs = null;
        this.uiGridView.clear();
        this._nodePool && this._nodePool.clear();
    }

    protected onRelease(): void {
        eventCenter.unregisterAll(this);
        this.deInit();
    }

    private _initUI() {
        if(!this._equipCfgs || this._equipCfgs.length == 0) return;

        let gridData: GridData[] = this._equipCfgs.map((ele, idx) => {
            return {
                key: idx + '',
                data: ele
            }
        });

        this.uiGridView.init(gridData, {
            onInit: (item: ItemStrategyEquip, gridData: GridData) => {
              item.init(gridData.data);
            },
            releaseItem: (item: ItemStrategyEquip) => {
                item.deInit();
                item.node.active = true;
                this._nodePool.put(item.node);
            },
            getItem: ():ItemStrategyEquip  =>  {
                let node = this._getItem();
                return node.getComponent(ItemStrategyEquip);
            }
        })
    }

    private _getItem() {
        if(this._nodePool.size() > 0) {
            return this._nodePool.get();
        }

        let node = cc.instantiate(this.prefab);
        return node;
    }
}
