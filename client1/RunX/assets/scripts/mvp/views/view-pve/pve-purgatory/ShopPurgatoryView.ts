import { CustomDialogId } from "../../../../app/AppConst";
import { utils } from "../../../../app/AppUtils";
import { configUtils } from "../../../../app/ConfigUtils";
import { ViewBaseComponent } from "../../../../common/components/ViewBaseComponent";
import { configManager } from "../../../../common/ConfigManager";
import guiManager from "../../../../common/GUIManager";
import { ItemBagPool, ItemPveShopPool } from "../../../../common/res-manager/NodePool";
import { cfg } from "../../../../config/config";
import { bagData } from "../../../models/BagData";
import { commonData } from "../../../models/CommonData";
import { pveDataOpt } from "../../../operations/PveDataOpt";
import MessageBoxView from "../../view-other/MessageBoxView";
import ItemPveShop from "../common/ItemPveShop";
import PVEPurgatoryView from "./PVEPurgatoryView";

const {ccclass, property} = cc._decorator;

@ccclass
export default class ShopPurgatoryView extends ViewBaseComponent {

    @property(cc.Node) itemPveShopParent: cc.Node = null;

    cost: {id: number, name: string, count: number} = null;

    pointUID: number;

    root: PVEPurgatoryView;

    private _itemPveShop: ItemPveShop = null;

    onInit(pointUID: number, pointID: number, root: PVEPurgatoryView) {
        this.pointUID = pointUID;
        this.root = root;

        // 获取商品配置
        let shopConfig: cfg.PVEInfernalShop = configManager.getConfigByKey("pveInfernalShop", pointID);

        // 商品道具配置
        let gainReuslt: any[] = utils.parseStingList(shopConfig.PVEInfernalShopItem);

        // 商品花费配置
        let costReuslt: any[] = utils.parseStingList(shopConfig.PVEInfernalShopCost);
        let costConfig: cfg.Item = configUtils.getItemConfig(costReuslt[0][0]);
        this.cost = {id: Number(costReuslt[0][0]), name: costConfig.ItemName, count: Number(costReuslt[0][1])};

        this._itemPveShop = ItemPveShopPool.get();
        this._itemPveShop.init({
            gainID: Number(gainReuslt[0][0]),
            gainCount: Number(gainReuslt[0][1]),
            costID: Number(costReuslt[0][0]),
            costCount: Number(costReuslt[0][1]),
            discount: shopConfig.PVEInfernalShopDiscount
        });

        this.itemPveShopParent.addChild(this._itemPveShop.node);
    }

    onRelease() {
        ItemPveShopPool.put(this._itemPveShop);
    }

    onBtnClose() {
        this.closeView();
    }

    onBtnNo() {
        let self = this;

        if (!commonData.blockPurgatoryShopQuitConfirm) {
            let dialogConfig = configUtils.getDialogCfgByDialogId(2000023);
            guiManager.showMessageBoxByCfg(this.node, dialogConfig, (msgBox: MessageBoxView, checked?: boolean) => {
                checked && (commonData.blockPurgatoryShopQuitConfirm = checked);
                msgBox.closeView();
            }, (msgBox: MessageBoxView, checked?: boolean) => {
                checked && (commonData.blockPurgatoryShopQuitConfirm = checked);
                this.root.isBuy = false;
                pveDataOpt.reqTrialPurgatoryPurchase(self.pointUID, false);
                self.onBtnClose();
                msgBox.closeView();
            }, true);
        } else {
            this.root.isBuy = false;
            pveDataOpt.reqTrialPurgatoryPurchase(self.pointUID, false);
            self.onBtnClose();;
        }
    }

    onBtnYes() {
        // 购买商品
        let itemCount: number = bagData.getItemCountByID(this.cost.id);
        if (itemCount < this.cost.count) {
            guiManager.showDialogTips(CustomDialogId.COMMON_ITEM_NOT_ENOUGH, this.cost.id);
            return;
        }

        this.root.isBuy = true;
        pveDataOpt.reqTrialPurgatoryPurchase(this.pointUID, true);
        this.onBtnClose();
    }
}
