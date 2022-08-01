import { BagItemInfo } from "../../../../app/AppType";
import { ItemBagPool } from "../../../../common/res-manager/NodePool";
import { cfg } from "../../../../config/config";
import ItemBag from "../../view-item/ItemBag";

const {ccclass, property} = cc._decorator;

const REWARD_SPACE_X = 10;

@ccclass
export default class ItemXinMoDamageReward extends cc.Component {
    @property(cc.Label) desc: cc.Label = null;
    @property(cc.Node) itemContainor: cc.Node = null;

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
        this.desc.string = `${this._cfg.PVEMindDemonRankShow }`;
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
                    this._clickHandler && this._clickHandler(itemInfo)
                }});
                this._items.push(item);
                startX -= (itemW + REWARD_SPACE_X);
            });
        }
    }
}
