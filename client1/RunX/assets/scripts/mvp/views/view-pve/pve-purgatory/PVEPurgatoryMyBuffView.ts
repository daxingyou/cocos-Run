import UIGridView, { GridData } from "../../../../common/components/UIGridView";
import { ViewBaseComponent } from "../../../../common/components/ViewBaseComponent";
import { configManager } from "../../../../common/ConfigManager";
import { ItemPveBuffPool } from "../../../../common/res-manager/NodePool";
import { cfg } from "../../../../config/config";
import { pveTrialData } from "../../../models/PveTrialData";
import ItemPveBuff, { PveBuffInfo, PVE_BUFF_TYPE } from "../common/ItemPveBuff";

const {ccclass, property} = cc._decorator;

@ccclass
export default class PVEPurgatoryMyBuffView extends ViewBaseComponent {
    
    @property(UIGridView) buffList: UIGridView = null;

    poolMaxCount: number = 10;
    nodePool: cc.Node[] = [];

    onInit() {
        this.initView();
    }

    initView() {
        let gridDatas: GridData[] = [];

        let buffConfig: cfg.PVEInfernalBuff = null;
        let buffInfo: PveBuffInfo = null;
        pveTrialData.purgatoryData.BuffList.forEach((buffID, idx) => {
            buffConfig = configManager.getConfigByKey("pveInfernalBuff", buffID);
            buffInfo = { 
                buffType: buffConfig.PVEInfernalBuffType === 1 ? PVE_BUFF_TYPE.BUFF : PVE_BUFF_TYPE.DEBUFF,
                buffStr: buffConfig.PVEInfernalBuffIntroduce,
                heroTypeForm: buffConfig.PVEInfernalBuffHeroTypeForm,
                heroTypeFormNum: buffConfig.PVEInfernalBuffHeroTypeFormNum
            }
            gridDatas.push({key: String(idx), data: buffInfo});
        });

        this.buffList.init(gridDatas, {
            getItem: () => {
                return ItemPveBuffPool.get();
            },
            releaseItem: (item: ItemPveBuff) => {
                ItemPveBuffPool.put(item);
            },
            onInit: (item: ItemPveBuff, gridData: GridData) => {
                item.init(gridData.data);
            }
        })
    }

    onRelease() {
        this.buffList.clear();
    }

    onBtnClose() {
        this.closeView();
    }
}
