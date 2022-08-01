import { ItemBuffPool } from "../../../common/res-manager/NodePool";
import { BuffData } from "../../../game/BattleType";
import { BuffResult } from "../../../game/CSInterface";
import ItemBuff from "../view-item/ItemBuff";

const {ccclass, property} = cc._decorator;

@ccclass
export default class BuffListCtrl extends cc.Component {

    @property(cc.Node)          nodeBuffList: cc.Node = null;

    private _arrBuff: ItemBuff[] = [];

    init () {
        this.deInit();
        this.node.active = false;
    }

    deInit () {
        // this.nodeBuffList.removeAllChildren();
        this._arrBuff.forEach( _bComp => {
            if (_bComp && cc.isValid(_bComp)) {
                ItemBuffPool.put(_bComp);
            }
        })

        this._arrBuff = [];
    }

    updateBuff (buffList: BuffData[]) {
        buffList.forEach(buff => {
            this._updateOneBuff({
                BuffId: buff.buffId,
                Count: buff.count,
                Delta: 0,
                RoleId: 0
            });
        });

        this.node.active = this._arrBuff.length > 0;
    }

    /**
     * @desc 根据BuffID查询身上挂着的ItemBuff
     *
     * @param {number} id
     * @param {number} uid
     * @returns {ItemBuff}
     * @memberof BuffListCtrl
     */
    getBuff (id: number): ItemBuff {
        let ret: ItemBuff = null;
        this._arrBuff.some(item => {
            if (item.buff.BuffId === id) {
                ret = item;
                return true;
            }
            return false;
        });
        return ret;
    }

    /**
     * @desc 获取所有的BUFF数据
     *
     * @returns {ItemBuff}
     * @memberof BuffListCtrl
     */
    getAllItem (): ItemBuff[] {
        return this._arrBuff;
    }


    /**
     * @desc 这里是通过EffectRes触发返回的接口效果
     *
     * @param {BuffResult} buffInfo 附加的Buff信息，或者是Buff激活带来的效果变化；这里一般要检测的是增量信息
     * @memberof BuffListCtrl
     */
    updateByEffRes (buffInfo: BuffResult) {
        if (buffInfo == null) return;

        const itemBuff = this.getBuff(buffInfo.BuffId);
        if (buffInfo.Count == 0) {
            if (itemBuff) {
                this._removeBuff(itemBuff);
            }
        } else {
            this._updateOneBuff(buffInfo);
        }
        this.node.active = this._arrBuff.length > 0;
    }    

    private _updateOneBuff (buffInfo: BuffResult) {
        let itemBuff = this.getBuff(buffInfo.BuffId);
        if (!itemBuff) {
            // let newItem = cc.instantiate(this.itemBuff)
            // itemBuff = newItem.getComponent(ItemBuff);
            itemBuff = ItemBuffPool.get();
            this.nodeBuffList.addChild(itemBuff.node);
            this._arrBuff.push(itemBuff);
            itemBuff.init(buffInfo);
        } else {
            itemBuff.init(buffInfo);
        }
    }

    private _removeBuff (itemBuff: ItemBuff) {
        if (!itemBuff) {
            return;
        }

        const node = itemBuff.node;
        if (cc.isValid(node)) {
            const index = this._arrBuff.indexOf(itemBuff);
            if (index >= 0) {
                this._arrBuff.splice(index, 1);
                ItemBuffPool.put(itemBuff);
            }
        }
    }
}