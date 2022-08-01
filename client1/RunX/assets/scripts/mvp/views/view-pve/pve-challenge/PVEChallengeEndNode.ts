import { CustomDialogId } from "../../../../app/AppConst";
import { utils } from "../../../../app/AppUtils";
import { configUtils } from "../../../../app/ConfigUtils";
import { configManager } from "../../../../common/ConfigManager";
import guiManager from "../../../../common/GUIManager";
import { ItemPveShopPool } from "../../../../common/res-manager/NodePool";
import { cfg } from "../../../../config/config";
import { data } from "../../../../network/lib/protocol";
import { bagData } from "../../../models/BagData";
import { pveTrialData } from "../../../models/PveTrialData";
import { pveDataOpt } from "../../../operations/PveDataOpt";
import ItemPveShop, { ItemPveShopInfo } from "../common/ItemPveShop";

const {ccclass, property} = cc._decorator;

@ccclass
export default class PVEChallengeEndNode extends cc.Component {

    @property(cc.Label) labelDialog: cc.Label = null;
    @property([cc.Node]) items: cc.Node[] = [];

    private _itemPveShops: ItemPveShop[] = [];

    onInit() {
        this.initView();
    }

    deInit() {
        this._itemPveShops.forEach((item) => {
            ItemPveShopPool.put(item);
        })
    }

    initView() {
        let dialogConfig: cfg.Dialog = configUtils.getDialogCfgByDialogId(99000070);
        if (dialogConfig && dialogConfig.DialogText) {
            this.labelDialog.string = dialogConfig.DialogText;
        }

        if (this._itemPveShops.length == 0) {
            let itemPveShop: ItemPveShop = null;
            pveTrialData.respectData.Items.forEach((item, idx) => {
                if (idx > 2) { return; }

                itemPveShop = ItemPveShopPool.get();
                this._itemPveShops.push(itemPveShop);
                this.items[idx].addChild(itemPveShop.node);
            });
        }

        this.refreshView();
    }

    refreshView() {
        // 商品创建出来之后不存在个数增减的问题，所以不做对应的处理
        pveTrialData.respectData.Items.forEach((item, idx) => {
            // 商品配置
            let itemShopConfig: cfg.PVEChallengeShop = configManager.getConfigByKey("pveChallengeShop", item.ShopID);
            let parseResultGain = utils.parseStingList(itemShopConfig.PVEChallengeShopItem);
            let parseResultCost = utils.parseStingList(itemShopConfig.PVEChallengeShopCost);
            let clickFunc = null;
            if (!item.Bought) {
                clickFunc = () => {
                    let itemCount: number = bagData.getItemCountByID(Number(parseResultCost[0][0]));
                    if (itemCount < Number(parseResultCost[0][1])) {
                        guiManager.showDialogTips(CustomDialogId.COMMON_ITEM_NOT_ENOUGH, Number(parseResultCost[0][0]));
                        return;
                    }
    
                    pveDataOpt.reqTrialRespectPurchase(item.ShopID);
                };
            }
            let itemPveShopInfo: ItemPveShopInfo = {
                gainID: Number(parseResultGain[0][0]),
                gainCount: Number(parseResultGain[0][1]),
                costID: Number(parseResultCost[0][0]),
                costCount: Number(parseResultCost[0][1]),
                restrictStr: `今日限购(${item.Bought ? 0 : 1}/1)`,
                isSellOut: item.Bought,
                discount: itemShopConfig.PVEChallengeShopDiscount,
                clickFunc: clickFunc
            }
            this._itemPveShops[idx]?.init(itemPveShopInfo);
        });
    }

    onRefresh() {
        this.refreshView();
    }
}
