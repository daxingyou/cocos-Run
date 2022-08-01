import { ItemHaloPool } from "../../../common/res-manager/NodePool";
import ItemHalo from "./ItemHalo";
import { gamesvr } from "../../../network/lib/protocol";

const {ccclass, property} = cc._decorator;

@ccclass
export default class HaloListCtrl extends cc.Component {

    @property(cc.Node)          ndHaloList: cc.Node = null;
    private _arrHalo:           ItemHalo[] = [];
    private _ownerId:           number = 0;

    init (owner: number) {
        this.deInit();
        this._ownerId = owner;
        this.node.active = true;
    }

    deInit () {
        // this.nodeBuffList.removeAllChildren();
        this._arrHalo.forEach( _hComp => {
            if (_hComp && cc.isValid(_hComp)) {
                _hComp.deInit();
                ItemHaloPool.put(_hComp);
            }
        })
        this._arrHalo = [];
        this._ownerId = 0;
    }

    updateHalo (haloList: gamesvr.IHalo[]) {
        haloList.forEach( _h => {
            this._updateOneHalo({
                HaloID: _h.ID,
                HaloUID: _h.UID,
                RoleUID: _h.UID,
                isAdd: true
            });
        });
    }

    /**
     * @desc 根据ID查询身上挂着的ItemHalo
     * @param {number} id
     * @param {number} uid
     * @returns {ItemHalo}
     * @memberof HaloListCtrl
     */
    getHalo (id: number, Uid: number): ItemHalo {
        let ret: ItemHalo = null;
        this._arrHalo.some(item => {
            if (item.haloId === id && item.haloUid === Uid) {
                ret = item;
                return true;
            }
            return false;
        });
        return ret;
    }

    /**
     * @desc 获取所有的Halo数据
     *
     * @returns {ItemHalo}
     * @memberof HaloListCtrl
     */
    getAllItem (): ItemHalo[] {
        return this._arrHalo;
    }


    /**
     * @desc 这里是通过EffectRes触发返回的接口效果
     *
     * @param {haloRes} res里面的Count = 1就是增加， = 0 就是移除
     * @memberof BuffListCtrl
     */
    updateByEffRes (haloRes: gamesvr.IHaloResult) {
        if (haloRes == null) return;

        const _itemHalo = this.getHalo(haloRes.HaloID, haloRes.HaloUID);
        if (!haloRes.isAdd) {
            if (_itemHalo) {
                this._disableHalo(_itemHalo);
            }
        } else {
            this._updateOneHalo(haloRes);
        }
    }

    disableHalo (haloUid: number) {
        for (let i = 0; i < this._arrHalo.length; i++) {
            if (this._arrHalo[i].haloUid == haloUid) {
                this._arrHalo[i].isValid = false;
                break;
            }
        }
    }

    enbleHalo (haloUid: number) {
        for (let i = 0; i < this._arrHalo.length; i++) {
            if (this._arrHalo[i].haloUid == haloUid) {
                this._arrHalo[i].isValid = true;
                break;
            }
        }
    }

    private _updateOneHalo (halo: gamesvr.IHaloResult) {
        let ownerId = this._ownerId;
        let itemHalo = this.getHalo(halo.HaloID, halo.HaloUID);
        if (!itemHalo) {
            itemHalo = ItemHaloPool.get();
            this.ndHaloList.addChild(itemHalo.node);
            this._arrHalo.push(itemHalo);
            itemHalo.init(halo, ownerId);
        } else {
            itemHalo.init(halo, ownerId);
        }
    }

    private _disableHalo (ItemHalo: ItemHalo) {
        if (!ItemHalo) {
            return;
        }

        const node = ItemHalo.node;
        if (cc.isValid(node)) {
            ItemHalo.valid = false;
        }
    }

}