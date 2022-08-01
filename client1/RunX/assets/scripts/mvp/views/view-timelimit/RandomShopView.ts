import guiManager from "../../../common/GUIManager";
import { gamesvr } from "../../../network/lib/protocol";
import { LimitShopItem, TimeLimitData } from "../../models/LimitData";
import { limitDataOpt } from "../../operations/LimitDataOpt";
import ItemLimitShop from "./ItemLimitShop";
import RandomBaseView from "./RandomBaseView";

const {ccclass, property} = cc._decorator;

@ccclass
export default class RandomShopView extends RandomBaseView {
    @property(cc.Prefab)                itemShopPfb: cc.Prefab = null;
    @property(cc.Node)                  shopNode: cc.Node = null;
    @property(cc.Node)                  coinRoot: cc.Node = null;

    private _itemShopPool: ItemLimitShop[] = []

    onRelease () {
        this._itemShopPool.forEach( _e => {
            if (_e && cc.isValid(_e)) {
                _e.deInit()
                _e.node.removeFromParent();
            }
        })
        this._itemShopPool = []
        guiManager.removeCoinNode(this.coinRoot);
    }

    refreshView() {
        guiManager.addCoinNode(this.coinRoot);
        this._limitData.shopList.forEach((_s, _index) => {
            let item = this.shopNode.children[_index];
            if(!item) {
                item = this._getItemShop();
                this.shopNode.addChild(item);
            }
            item.getComponent(ItemLimitShop).onInit(_s, () => {
                this._sendBuyShopItem(_s, _index);
            }, (viewName: string, ...args: any[]) => {
                this.loadView(viewName, ...args);
            });
        });
    }

    _recvBuyShopItem(eventId: number, srvData: gamesvr.TimeLimitTravelBuyShopRes, limitdata: TimeLimitData, shopId: number) {
        this.shopNode.children.forEach((_t, index) => {
            if(_t) {
                _t.getComponent(ItemLimitShop).onInit(this._limitData.shopList[index], () => {
                        this._sendBuyShopItem(this._limitData.shopList[index], index);
                    }, (viewName: string, ...args: any[]) => {
                        this.loadView(viewName, ...args);
                });
            }
        });
    }

    private _sendBuyShopItem(limitShopItem: LimitShopItem, index: number) {
        limitDataOpt.sendBuyLimitShopItem(limitShopItem.shopId, this._limitData);
    }

    private _getItemShop(): cc.Node {
        let itemNd =  cc.instantiate(this.itemShopPfb);
        this._itemShopPool.push(itemNd.getComponent(ItemLimitShop))
        return itemNd
    }
}
