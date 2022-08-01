

import { VIEW_NAME } from "../../../app/AppConst";
import { utils } from "../../../app/AppUtils";
import DynamicScrollView from "../../../common/components/DynamicScrollView";
import UIGridView, { GridData } from "../../../common/components/UIGridView";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { configManager } from "../../../common/ConfigManager";
import { eventCenter } from "../../../common/event/EventCenter";
import { cfg } from "../../../config/config";
import ItemStrategyRecommandTeam from "./item/ItemStrategyRecommandTeam";
import ItemStrategyStrong from "./item/ItemStrategyStrong";

const {ccclass, property} = cc._decorator;

interface StrategyStrongData {
    type: number,
    curV: number,
    maxV: number
}

@ccclass
export default class StrategyRecommandTeamView extends ViewBaseComponent {
    @property(DynamicScrollView) uiGridView: DynamicScrollView = null;
    @property(cc.Prefab) prefab: cc.Prefab = null;

    private _teamCfgs: cfg.StrategyTeam[] = null;
    private _nodePool: cc.NodePool = null;
    private _teamActorCfgs: Map<number, number[]> = null;
    private _openState: Map<number, boolean> = null;


    protected onInit(...args: any[]): void {
        this._teamCfgs = this._teamCfgs || configManager.getConfigList('strategyTeam');
        this._nodePool = this._nodePool || new cc.NodePool();
        this._teamActorCfgs = this._teamActorCfgs || new Map();
        this._openState = this._openState || new Map();
        this._openState.clear();
        this._initUI();
    }

    deInit() {
        this.releaseSubView();
        this._teamCfgs = null;
        this._teamActorCfgs.clear();
        this.uiGridView.clear();
        this._nodePool && this._nodePool.clear();
    }

    protected onRelease(): void {
        this.deInit();
    }

    private _initUI() {
        if(!this._teamCfgs || this._teamCfgs.length == 0) return;
        this._teamCfgs.forEach(ele => {
            this._openState.set(ele.StrategyTeamId, false);
        })

        this.uiGridView.init(this._teamCfgs.length, {
            initItem: (idx: number, node: cc.Node) => {
                let cfg: cfg.StrategyTeam = this._teamCfgs[idx];
                this._parseTeamCfg(cfg);
                let item = node.getComponent(ItemStrategyRecommandTeam);
                item.init(cfg, this._openState.get(cfg.StrategyTeamId), this._teamActorCfgs.get(cfg.StrategyTeamId), 
                    this._switchOpenState.bind(this), (HeroID: number) => {
                    this.loadSubView(VIEW_NAME.TIPS_HERO, HeroID);
                });
            },
            releaseItem: (node: cc.Node) => {
                let item = node.getComponent(ItemStrategyRecommandTeam);
                item.deInit();
                this._nodePool.put(item.node);
            },
            getItem: ():cc.Node  =>  {
                return this._getItem();
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

    private _parseTeamCfg(cfg: cfg.StrategyTeam) {
        if(!cfg || !cfg.StrategyTeamHero || cfg.StrategyTeamHero.length == 0) return;
        if(this._teamActorCfgs.has(cfg.StrategyTeamId)) return;

        let actorStr = cfg.StrategyTeamHero;
        let actorArr: string[] = utils.parseStringTo1Arr(actorStr, ';');
        let actorIDArr: number[] = null;

        actorArr && actorArr.forEach(ele => {
            if(!ele || ele.length == 0) return;
            actorIDArr = actorIDArr || [];
            actorIDArr.push(parseInt(ele));
        });
        this._teamActorCfgs.set(cfg.StrategyTeamId, actorIDArr);
    }

    private _switchOpenState(cfg: cfg.StrategyTeam, item: ItemStrategyRecommandTeam) {
        let lastState = this._openState.get(cfg.StrategyTeamId);
        this._openState.set(cfg.StrategyTeamId, !lastState);
        let newSize = item.updateOpenState(this._openState.get(cfg.StrategyTeamId));
        if(!newSize) return;
        let idx = this._teamCfgs.indexOf(cfg);
        this.uiGridView.updateItemSize(idx, newSize);
    }
}

