import { configUtils } from "../../app/ConfigUtils";
import { configManager } from "../../common/ConfigManager";
import moduleUIManager from "../../common/ModuleUIManager";
import { ItemBagPool } from "../../common/res-manager/NodePool";
import { cfg } from "../../config/config";
import { data } from "../../network/lib/protocol";
import { bagData } from "./BagData";
import { pveTrialData } from "./PveTrialData";

export interface POINT {
    line: number,
    col:number,
}

 
/**根据PveCommonEvent表格记录一下id*/
export enum PointType {
    PTInvalid = 0,
    PTMonster = 1,
    PTLiveAltar = 2,
    PTHPAltar = 3,
    PTShop = 4,
    PTBox = 5,
    PTBuff = 6,
    PTPreview = 7,
    PTDeBuff = 8,
    PTTrap = 9,
    PTTransGate = 10,
    PTBoss = 11,
    PTElite = 12
 }

export default class IslandData {
    private _curPointIndex: POINT = null;
    private _chosePointUid: number = 0;
    private _pointMap: Map<number, data.ITrialPointInfo> = new Map();


    get curPointIndex() { return this._curPointIndex; }
    get chosePointUid() { return this._chosePointUid; }

    init() { }
    deInit() {
        this._curPointIndex = null;
        this._chosePointUid = 0;
        this._pointMap.clear();
    }

    setPointMap(point:data.ITrialPointInfo) {
        this._pointMap.set(point.PointUID, point);
    }   

    getPointByUid(uid: number) { return this._pointMap.get(uid); }

    chosePoint(pointUid:number) {
        this._chosePointUid = pointUid;
    }

    /**根据传入过来得uid进行转换*/
    setCurPointIndex(pointUID: number) {
        if (!pointUID) { 
            this._curPointIndex = null;
            return;
        } 
        this._curPointIndex = this.rechangeMapTileByUid(pointUID);
    }

     /**地图快 行列<--->uid 转换-*/
    rechangeMapTileByUid(PointUID: number): POINT {
        let line = Math.floor(PointUID / 10), col = PointUID % 10;
        return { line: line, col: col } as POINT;
    }

    rechangeUidByMapTile(line: number, col: number): number {
        let pointUid = line * 10 + col;
        return pointUid;
    }

    /**
     * 
     * @param layerId 层数ID
     * @param monsterType 野怪类型
     * @returns 
     */
    getRewardCfgByLayerID(layerId:number = 1,monsterType:PointType = PointType.PTBoss):string {
        let levelId = pveTrialData.islandData?.RefreshLevel;
        if (!levelId) return null;

        //显示一层首领奖励
        let islandMonsterCfg: { [k: string]: cfg.PVEFairyIslandMonster } = configManager.getConfigs("pveFairyIslandMonster");
        if (!islandMonsterCfg) return null;
        for (let k in islandMonsterCfg) {
            let cfg: cfg.PVEFairyIslandMonster = islandMonsterCfg[k];
                                            
            if (cfg.PVEFairyIslandMonsterLevel == levelId && 
                cfg.PVEFairyIslandMonsterType == monsterType &&
                cfg.PVEFairyIslandMonsterLayer == layerId)
            {
                return cfg.PVEFairyIslandMonsterDropShow;
            }
        }

        return null;
    }

    /**获取复活仙丹的背包数量*/
    getResurrectionItemId(): number {
        let itemId = configUtils.getConfigModule(`PVEFairyIslandResurrectionItem`);
        let remain = bagData.getItemCountByID(itemId);
        return remain || 0;
    }
}

let islandData = new IslandData();
export {
    islandData,
}