import { ViewBaseComponent } from "../../../../common/components/ViewBaseComponent";
import { configManager } from "../../../../common/ConfigManager";
import { ItemPveBuffPool } from "../../../../common/res-manager/NodePool";
import ItemPveBuff, { PveBuffInfo, PVE_BUFF_TYPE } from "../common/ItemPveBuff";
import PVEPurgatoryView from "./PVEPurgatoryView";

const {ccclass, property} = cc._decorator;

@ccclass
export default class BuffPurgatoryView extends ViewBaseComponent {
    
    @property(cc.Node) itemBuffParent: cc.Node = null;

    root: PVEPurgatoryView = null;
    
    isBuff: boolean = true;

    private _itemPveBuff: ItemPveBuff = null; 

    onInit(buffID: number, root: PVEPurgatoryView) {
        this.root = root;

        let buffConfig = configManager.getConfigByKey("pveInfernalBuff", buffID);
        this.isBuff = buffConfig.PVEInfernalBuffType === 1;
        let buffInfo: PveBuffInfo = { 
            buffType: buffConfig.PVEInfernalBuffType === 1 ? PVE_BUFF_TYPE.BUFF : PVE_BUFF_TYPE.DEBUFF,
            buffStr: buffConfig.PVEInfernalBuffIntroduce,
            heroTypeForm: buffConfig.PVEInfernalBuffHeroTypeForm,
            heroTypeFormNum: buffConfig.PVEInfernalBuffHeroTypeFormNum
        }

        this._itemPveBuff = ItemPveBuffPool.get();
        this._itemPveBuff.init(buffInfo);
        this.itemBuffParent.addChild(this._itemPveBuff.node);
    }

    onRelease() {
        ItemPveBuffPool.put(this._itemPveBuff);
    }

    onBtnClose() {
        this.root.showBuffAni(this.isBuff);
        this.closeView();
    }
}
