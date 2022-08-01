/*
 * @Description:
 * @Version: 1.0
 * @Autor: lixu
 * @Date: 2022-05-27 18:17:19
 * @LastEditors: lixu
 * @LastEditTime: 2022-05-30 13:42:25
 */

import DynamicScrollView from "../../../common/components/DynamicScrollView";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { configManager } from "../../../common/ConfigManager";
import { cfg } from "../../../config/config";
import ItemStrategyFAQ from "./item/ItemStrategyFAQ";

const {ccclass, property} = cc._decorator;

@ccclass
export default class StrategyFAQView extends ViewBaseComponent {
    @property(DynamicScrollView) uiGridView: DynamicScrollView = null;
    @property(cc.Prefab) prefab: cc.Prefab = null;

    private _FAQCfgs: cfg.StrategyFAQ[] = null;
    private _nodePool: cc.NodePool = null;

    private _openState: Map<number, boolean> = null;

    protected onInit(...args: any[]): void {
        this._FAQCfgs = this._FAQCfgs || configManager.getConfigList('strategyFAQ');
        this._nodePool = this._nodePool || new cc.NodePool();
        this._openState = this._openState || new Map();
        this._openState.clear();
        this._initUI();
    }

    deInit() {
        this.releaseSubView();
        this._openState && this._openState.clear();
        this._FAQCfgs = null;
        this.uiGridView.clear();
        this._nodePool && this._nodePool.clear();
    }

    protected onRelease(): void {
        this.deInit();
    }

    private _initUI() {
        if(!this._FAQCfgs || this._FAQCfgs.length == 0) return;
        this._FAQCfgs.forEach((ele, idx) => {
            this._openState.set(ele.StartegyFAQId, false);
        })

        this.uiGridView.init(this._FAQCfgs.length, {
            initItem: (idx: number, node: cc.Node) => {
              let cfg: cfg.StrategyFAQ = this._FAQCfgs[idx];
              if(!this._openState.has(cfg.StartegyFAQId)) {
                  this._openState.set(cfg.StartegyFAQId, false);
              }
              let isOpen = this._openState.get(cfg.StartegyFAQId);
              let item = node.getComponent(ItemStrategyFAQ);
              item.init(cfg, isOpen, this._switchOpenState.bind(this));
            },
            releaseItem: (node: cc.Node) => {
                let item = node.getComponent(ItemStrategyFAQ);
                item.deInit();
                this._nodePool.put(item.node);
            },
            getItem: (idx: number):cc.Node  =>  {
                return this._getItem();
            }
        });
    }

    private _getItem() {
        if(this._nodePool.size() > 0) {
            return this._nodePool.get();
        }

        let node = cc.instantiate(this.prefab);
        return node;
    }

    private _switchOpenState(cfg: cfg.StrategyFAQ, item: ItemStrategyFAQ) {
        let lastState = this._openState.get(cfg.StartegyFAQId);
        this._openState.set(cfg.StartegyFAQId, !lastState);
        let newSize = item.updateOpenState(this._openState.get(cfg.StartegyFAQId));
        if(!newSize) return;
        let idx = cfg.StartegyFAQId - 1;
        this.uiGridView.updateItemSize(idx, newSize);
    }
}

