/*
 * @Description:
 * @Version: 1.0
 * @Autor: lixu
 * @Date: 2022-06-17 14:00:18
 * @LastEditors: lixu
 * @LastEditTime: 2022-07-08 12:06:07
 */

import { BagItemInfo } from "../../../../app/AppType";
import { ItemBagPool } from "../../../../common/res-manager/NodePool";
import { cfg } from "../../../../config/config";
import ItemBag from "../../view-item/ItemBag";

const {ccclass, property} = cc._decorator;

const REWARD_SPACE_X = 10;

@ccclass
export default class ItemXinMoRankReward extends cc.Component {
    @property(cc.Sprite) rankImg: cc.Sprite = null;
    @property(cc.Label) rankNo: cc.Label = null;
    @property(cc.Node) itemContainor: cc.Node = null;
    @property([cc.SpriteFrame]) rankSps: cc.SpriteFrame[] = [];

    private _cfg: cfg.PVEMindDemonReward = null;
    private _rewards: number[][] = null;
    private _items: ItemBag[] = null;
    private _clickHandler: Function = null;

    init(cfg: cfg.PVEMindDemonReward, rewards: number[][], clickHandler: Function) {
        this._cfg = cfg;
        this._rewards = rewards;
        this._clickHandler = clickHandler;
        this._initUI();
    }

    deInit() {
        this.rankImg.spriteFrame = null;
        this._cfg = null;
        this._rewards = null;
        this._clickHandler = null;
        if(this._items) {
            this._items.forEach(ele => {
                ItemBagPool.put(ele);
            });
            this._items.length = 0;
        }
    }

    private _initUI() {
        if(this._cfg.PVEMindDemonRankShow == '1' || this._cfg.PVEMindDemonRankShow == '2' || this._cfg.PVEMindDemonRankShow == '3') {
            this.rankImg.node.active = true;
            this.rankNo.node.active = false;
            this.rankImg.spriteFrame = this.rankSps[parseInt(this._cfg.PVEMindDemonRankShow) - 1];
        } else {
            this.rankImg.node.active = false;
            this.rankNo.node.active = true;
            this.rankNo.string = `${this._cfg.PVEMindDemonRankShow}`;
        }

        if(this._rewards) {
            let startX: number = undefined;
            let itemW: number = 0, scale = 0.75;
            this._rewards.forEach(ele => {
                this._items = this._items || [];
                let item = ItemBagPool.get();
                if(typeof startX == 'undefined') {
                    itemW = item.node.width * scale;
                    startX = 0;
                }
                item.node.setPosition(startX - (itemW >> 1), 0);
                item.node.parent = this.itemContainor;
                item.node.scale = scale;
                item.init({id: ele[0], count: ele[1], clickHandler: (itemInfo: BagItemInfo) => {
                    this._clickHandler && this._clickHandler(itemInfo);
                }});
                this._items.push(item);
                startX -= (itemW + REWARD_SPACE_X);
            });
        }
    }

}
