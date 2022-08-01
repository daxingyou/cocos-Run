import { VIEW_NAME } from "../../../app/AppConst";
import { BagItemInfo } from "../../../app/AppType";
import { bagDataUtils } from "../../../app/BagDataUtils";
import { configUtils } from "../../../app/ConfigUtils";
import guiManager from "../../../common/GUIManager";
import moduleUIManager from "../../../common/ModuleUIManager";
import { ItemBagPool } from "../../../common/res-manager/NodePool";
import { data } from "../../../network/lib/protocol";
import ItemBag from "../view-item/ItemBag";

const { ccclass, property } = cc._decorator;


@ccclass
export default class ItemSummonList extends cc.Component {

    @property(cc.Sprite)        bgSpr: cc.Sprite = null;
    @property(cc.Sprite)        bgSprChecked: cc.Sprite = null;
    @property(cc.Node)          titleBgChecked: cc.Node = null;

    @property(cc.Label)         lbNum: cc.Label = null;
    @property(cc.Node)          ndRoot: cc.Node = null;

    private _items: ItemBag[] = [];
    private _clickHandler: Function = null;
    private _record: data.ISimulateRecord = null;
    private _select: boolean = false;
    private _currIndex: number = -1;
    
    init (record: data.ISimulateRecord, isCurr: boolean = false, handler: Function) {
        this._record = record;
        this._clickHandler = handler;
        this._select = isCurr;

        this.lbNum.string = isCurr? "当前": `暂存${record.Seq + 1}`
        // this.bgSpr.spriteFrame = isCurr? this.bgSfs[0]:this.bgSfs[1];
        this.bgSpr.node.active = !isCurr;
        this.bgSprChecked.node.active = isCurr;
        this.titleBgChecked.active = isCurr;
        // 唯一识别，因为当前的可能和暂存的seqid是一样的
        this._currIndex = isCurr? -1:record.Seq;

        let self = this;
        let items = record.Prizes;

        if (items.length <= 0) {
            return;
        }

        let isHero = configUtils.getHeroBasicConfig(items[0].ID)?true:false
        let isEquip = configUtils.getEquipConfig(items[0].ID)?true:false
        let sortItem = items.sort((l,r) => {
            if (isHero) {
                let cfgL = configUtils.getHeroBasicConfig(l.ID)
                let cfgR = configUtils.getHeroBasicConfig(r.ID)
                return cfgL.HeroBasicQuality>cfgR.HeroBasicQuality? -1:1
            } else if (isEquip) {
                let cfgL = configUtils.getEquipConfig(l.ID)
                let cfgR = configUtils.getEquipConfig(r.ID)
                return cfgL.Quality>cfgR.Quality? -1:1
            }
            return 1
        })

        if (items && items.length) {
            items.forEach( (_i, _idx) => {
                self._addOneItem(_i, _idx)
            })
        }
    }

    deInit () {
        this._items.forEach( _item => {
            ItemBagPool.put(_item)
        })
        this._items.length = 0;
    }

    onClick () {
        this._clickHandler && this._clickHandler(this._currIndex);
    }

    get seq () {
        return this._record.Seq;
    }

    get seqIndex () {
        return this._currIndex;
    }

    set select (v: boolean) {
        this._select = v;
        this.bgSpr.node.active = !this._select;
        this.bgSprChecked.node.active = this._select;
        // this.bgSpr.spriteFrame = v? this.bgSfs[0]:this.bgSfs[1];
    }

    private _addOneItem (_item: data.IItemInfo, _idx: number) {
        let self = this;
        if (!self._items[_idx]) {
            let _item = ItemBagPool.get();
            self.ndRoot.addChild(_item.node);
            self._items[_idx] = _item;
        }

        let comp = self._items[_idx];
        if (comp) {
            comp.init({
                id: _item.ID,
                clickHandler: (info: BagItemInfo) => {
                    if (this._select) {
                        // guiManager.loadView(VIEW_NAME.TIPS_HERO, null, info.id)
                        moduleUIManager.showItemDetailInfo(info.id, info.count, null)
                    } else {
                        this._clickHandler && this._clickHandler(this._currIndex);
                    }
                }
            })
        }
    }
}