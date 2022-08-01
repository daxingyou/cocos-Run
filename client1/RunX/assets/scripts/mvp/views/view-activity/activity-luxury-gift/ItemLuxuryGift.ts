import { utils } from "../../../../app/AppUtils";
import { ItemBagPool } from "../../../../common/res-manager/NodePool";
import ItemBag, { ITEM_RECEIVED_TYPE } from "../../view-item/ItemBag";

const {ccclass, property} = cc._decorator;

enum ITEM_LUXURY_GIFT_STATE {
    CAN_NOT_RECEIVE,    // 不能领
    CAN_RECEIVE,        // 可领取
    RECEIVED            // 已领取
}

@ccclass
export default class ItemLuxuryGift extends cc.Component {
    
    @property(cc.Sprite) sprite: cc.Sprite = null;
    @property(cc.Node) itemBagNode: cc.Node = null;
    @property(cc.Label) label: cc.Label = null;

    day: number = -1;
    private _itemBag: ItemBag = null;
    private _isGray: boolean = false;   // 变灰标志

    /**
     * 初始化
     * @param day 第几天
     * @param itemID 道具ID
     * @param itemCount 道具数量
     */
    init(day: number, itemID: number, itemCount: number) {
        this.day = day;
        this.label.string = `第${day}天`;
     
        this._itemBag = ItemBagPool.get();
        this._itemBag.init({id: itemID, count: itemCount});
        this._itemBag.node.parent = this.itemBagNode;
    }

    /**
     * 设置状态
     * @param state 状态枚举值 
     */
    setState(state: ITEM_LUXURY_GIFT_STATE) {
        if (state == null) {
            return;
        }

        if (state === ITEM_LUXURY_GIFT_STATE.CAN_NOT_RECEIVE && !this._isGray) {
            this._isGray = true;
            utils.setNodeAndChildrenGray(this.node, true);
        } else if (state === ITEM_LUXURY_GIFT_STATE.RECEIVED) {
            this._itemBag.showReceived(ITEM_RECEIVED_TYPE.RED);
        } else if (state === ITEM_LUXURY_GIFT_STATE.CAN_RECEIVE) {
            // 凌晨从灰变彩
            if (this._isGray) {
                this._isGray = false;
                utils.setNodeAndChildrenGray(this.node, false);
            }
        }
    }

    deInit() {
        this._isGray && utils.setNodeAndChildrenGray(this.node, false);
        ItemBagPool.put(this._itemBag);
        this._itemBag = null;
    }
}

export { ITEM_LUXURY_GIFT_STATE }
