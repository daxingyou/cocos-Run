import { cfg } from "../../../config/config";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { configManager } from "../../../common/ConfigManager";
import ItemSummonPool from "./ItemSummonPool";
import { logger } from "../../../common/log/Logger";

const { ccclass, property } = cc._decorator;

@ccclass
export default class SummonCardPoolView extends ViewBaseComponent {
    @property(cc.Prefab)    poolPrefab: cc.Prefab = null;
    @property(cc.Node)      ndPoolRoot: cc.Node = null;
    @property(cc.Node)      ctxRange: cc.Node = null;

    private _summonPools: ItemSummonPool[] =[];

    onInit (summonShowId: number) {
        let summonCfg: cfg.SummonCardShow[] = configManager.getConfigByKV("summonShow", "SummonCardShowGroupId", summonShowId);
        if (summonCfg && summonCfg.length) {
            this._showCardList(summonCfg);
        } else {
            logger.error('卡池配置异常');
            this.closeView();
        }
    }

    onRelease () {
        this.unscheduleAllCallbacks();
        this._summonPools.forEach( _p => {
            _p.deInit();
            _p.node.removeFromParent();
        });
        this._summonPools.length = 0;
    }

    private _showCardList (cards: cfg.SummonCardShow[]) {
        cards = cards.sort( (_l, _r) => {
            return (_l.SummonCardShowId || 0) - (_r.SummonCardShowId || 0);
        })
        
        let self = this;

        cards.forEach( (_onePool, _idx) => {
            self.scheduleOnce(()=> {
                let nodeIns = cc.instantiate(this.poolPrefab);
                this.ndPoolRoot.addChild(nodeIns);
                let comp = nodeIns.getComponent(ItemSummonPool);
                comp.init(_onePool);
                self._summonPools.push(comp);
                let ceil = self.ctxRange.convertToWorldSpaceAR(cc.v2(0, self.ctxRange.height/2)).y;
                let floor = self.ctxRange.convertToWorldSpaceAR(cc.v2(0, -self.ctxRange.height/2)).y;
                comp.setShowRange(ceil, floor);
            }, 0.1*(_idx+1));
        })
    }
}