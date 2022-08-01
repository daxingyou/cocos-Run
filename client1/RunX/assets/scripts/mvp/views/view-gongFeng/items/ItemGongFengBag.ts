/*
 * @Description:
 * @Version: 1.0
 * @Autor: lixu
 * @Date: 2022-06-08 19:26:53
 * @LastEditors: lixu
 * @LastEditTime: 2022-06-15 18:14:45
 */
import { utils } from "../../../../app/AppUtils";
import { configUtils } from "../../../../app/ConfigUtils";
import { ItemBagPool } from "../../../../common/res-manager/NodePool";
import { cfg } from "../../../../config/config";
import { bagData } from "../../../models/BagData";
import ItemBag from "../../view-item/ItemBag";

const {ccclass, property} = cc._decorator;

const ITEM_SPACE_X = 10;

@ccclass
export default class ItemGongFengBag extends cc.Component {
    @property(cc.Label) nameLb: cc.Label = null;
    @property(cc.Node) itemRoot: cc.Node = null;
    @property(cc.Label) expLb: cc.Label = null;
    @property(cc.Label) xinYangLb: cc.Label = null;
    @property(cc.Label) timeLb: cc.Label = null;

    private _bagItem: ItemBag = null;
    private _clickHandler: Function = null;
    private _itemID: number = 0;
    init(itemID: number, clickHandler: Function) {
        this._itemID = itemID;
        this._clickHandler = clickHandler;
        this._initUI();
    }

    deInit() {
        this._clickHandler = null;
        if(this._bagItem) {
            ItemBagPool.put(this._bagItem);
            this._bagItem = null;
        }
    }

    private _initUI() {
        let goodsCfg: cfg.ConsecrateGoods = configUtils.getConsecrateGoodsCfg(this._itemID);
        this.nameLb.string = goodsCfg.ConsecrateGoodsName || '';
        this.expLb.string = `提供经验：${goodsCfg.ConsecrateGoodsEXP || 0}`;
        this.xinYangLb.string = `提供信仰：${goodsCfg.ConsecrateGoodsFaith || 0}`;
        this.timeLb.string = `${utils.getTimeInterval(goodsCfg.ConsecrateGoodsDuration || 0)}`;
        this._initRewardItems()
    }

    private _initRewardItems() {
        if(!this._bagItem) {
            this._bagItem = ItemBagPool.get();
            this._bagItem.node.scale = 0.8;
            this.itemRoot.addChild(this._bagItem.node);
        }
        this._bagItem.init({id: this._itemID, count: bagData.getItemCountByID(this._itemID)});
    }

    onClick() {
        this._clickHandler && this._clickHandler(this._itemID);
    }

    updateRewardItem() {
        this._initRewardItems();
    }
}
