

import UIGridView, { GridData } from "../../../common/components/UIGridView";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { configCache } from "../../../common/ConfigCache";
import { configManager } from "../../../common/ConfigManager";
import { eventCenter } from "../../../common/event/EventCenter";
import { StrategyEvents } from "../../../common/event/EventData";
import { scheduleManager } from "../../../common/ScheduleManager";
import { cfg } from "../../../config/config";
import { bagData } from "../../models/BagData";
import { pragmaticData } from "../../models/PragmaticData";
import { userData } from "../../models/UserData";
import { strategyOpt } from "../../operations/StrategyOpt";
import ItemStrategyStrong from "./item/ItemStrategyStrong";

const {ccclass, property} = cc._decorator;

interface StrategyStrongData {
    type: number,
    curV: number,
    maxV: number
}

@ccclass
export default class StrategyStrongView extends ViewBaseComponent {

    @property(UIGridView) uiGridView: UIGridView = null;
    @property(cc.Prefab) prefab: cc.Prefab = null;

    private _strongCfgs: cfg.StrategyStrong[] = null;

    private _nodePool: cc.NodePool = null;

    private _schedulerOfGetData: number = 0;
    private _strongData: Map<number, StrategyStrongData> = null;

    preInit(...rest: any[]): Promise<any> {
        eventCenter.register(StrategyEvents.RECV_STRONG_RES, this, this._recvStrategyStrongRes);
        return new Promise((resolve, reject) => {
            this._stopScheduler();
            strategyOpt.sendEpochStrategyViewProgressReq();
            this._schedulerOfGetData = scheduleManager.schedule(() => {
                if(this._strongData) {
                    this._stopScheduler();
                    resolve(true);
                }
            }, 0);
        });
    }

    protected onInit(...args: any[]): void {
        this._strongCfgs = this._strongCfgs || configManager.getConfigList('strategyStrong');
        this._nodePool = this._nodePool || new cc.NodePool();
        this._initUI();
    }

    deInit() {
        this._strongCfgs = null;
        this.uiGridView.clear();
        this._nodePool && this._nodePool.clear();
    }

    protected onRelease(): void {
        eventCenter.unregisterAll(this);
        this._stopScheduler();
        this.deInit();
    }

    private _initUI() {
        if(!this._strongCfgs || this._strongCfgs.length == 0) return;

        let gridData: GridData[] = this._strongCfgs.map((ele, idx) => {
            return {
                key: idx + '',
                data: ele
            }
        });

        this.uiGridView.init(gridData, {
            onInit: (item: ItemStrategyStrong, gridData: GridData) => {
              item.init(gridData.data, this._strongData.get(gridData.data.StrategyStrongId));
            },
            releaseItem: (item: ItemStrategyStrong) => {
                item.deInit();
                item.node.active = true;
                this._nodePool.put(item.node);
            },
            getItem: ():ItemStrategyStrong  =>  {
                let node = this._getItem();
                return node.getComponent(ItemStrategyStrong);
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

    private _recvStrategyStrongRes(event: number, data: {[key: string] : number}) {
        data = data || {}
        let localData = new Map();
        for (let k in data) {
            if(!data.hasOwnProperty(k)) continue;
            let key = parseInt(k);
            let value = data[k];
            let curData: StrategyStrongData = null;
            switch(key) {
                case 1:
                  //角色等级
                  curData = {type: key, curV: userData.lv, maxV: value || 0}
                  break;
                case 2:
                  //拥有英雄的总星级
                  curData = {type: key, curV: this._getHeroStar(), maxV: value || 0};
                  break;
                case 3:
                  // 修炼等级
                  curData = {type: key, curV: this._getPragmaticLv(), maxV: value || 0};
                  break;
                case 4:
                  // 悟道等级
                  curData = {type: key, curV: this._getWuDaoLv(), maxV: value || 0};
                  break;
                case 5:
                  // 宝物等级
                  curData = {type: key, curV: this._getTreasureLv(), maxV: value || 0};
                  break;

            }
            curData && localData.set(key, curData);
        }
        this._strongData = localData;
    }

    private _stopScheduler() {
        if(!this._schedulerOfGetData) return;
        scheduleManager.unschedule(this._schedulerOfGetData);
        this._schedulerOfGetData = null;
    }

    private _getHeroStar() {
        let allHeroes = bagData.heroList;
        let allStar = 0;
        allHeroes && allHeroes.length > 0 && allHeroes.forEach(ele => {
            allStar += ele.HeroUnit.Star || 1;
        });
        return allStar;
    }

    private _getPragmaticLv() {
        let pragmaticSkills = pragmaticData.skills || {};
        let lv = 0;
        for(let k in pragmaticSkills) {
            if(pragmaticSkills.hasOwnProperty(k)){
                lv += pragmaticSkills[k];
            }
        }
        return lv;
    }

    private _getWuDaoLv() {
        let cfgs = configCache.getWuDaoCache();
        let curWuDaoLv: number = 0;
        if(!cfgs || cfgs.size == 0) return curWuDaoLv;
        cfgs.forEach((v, k) => {
            let groupID = v.TeamID;
            let wuDaoData = pragmaticData.getWuDaoLv(`${groupID}`);
            wuDaoData && wuDaoData.Level && (curWuDaoLv += wuDaoData.Level);
        });
        return curWuDaoLv;
    }

    private _getTreasureLv() {
      let leadTreasureList = bagData.getTreasures();
      let treasureLv = 0;
      leadTreasureList && leadTreasureList.length > 0 && leadTreasureList.forEach(ele => {
          let treasureProp = bagData.treasureProp;
          treasureLv += treasureProp.get(ele.ItemID).lv;
      })
      return treasureLv;
    }
}

export {
    StrategyStrongData
}
