import { configUtils } from "../../../app/ConfigUtils";
import { ItemBuffPool } from "../../../common/res-manager/NodePool";
import { gamesvr } from "../../../network/lib/protocol";
import ItemBuff from "../view-item/ItemBuff";

const { ccclass, property } = cc._decorator;

const ROW_MAX_BUFF_COUNT: number = 5;

const BUFF_ANIMATION_CONFIG = {
    FADEOUT_TIME: 0.8,
    FADEIN_TIME: 0.5,
    MOVE_Y: 30,
    DEALIY_TIME: 1,
}

@ccclass
export default class BuffListCtrl extends cc.Component {

    @property(cc.Node) nodeBuffList: cc.Node = null;
    @property(cc.Node) buffsList: cc.Node = null;
    @property(cc.Node) templateItemBuffList: cc.Node = null;

    private _arrBuff: ItemBuff[] = [];
    private _buffs: gamesvr.IBuffResult[] = [];
    private _curActivityItemBuffsIndex: number = 0;
    private _switchAniEnd: boolean = true;
    private _itemBuffParentPool: cc.NodePool = new cc.NodePool();

    init() {
        this.deInit();
        // this.node.active = false;
    }

    deInit() {
        // this.nodeBuffList.removeAllChildren();
        this._arrBuff.forEach(_bComp => {
            if (_bComp && cc.isValid(_bComp)) {
                ItemBuffPool.put(_bComp);
            }
        });

        let buffChildren = [...this.buffsList.children]
        buffChildren.forEach(_c => {
            if(cc.isValid(_c) && _c.childrenCount > 0) {
                let subChildren = [..._c.children]
                subChildren.forEach(_cc => {
                    ItemBuffPool.put(_cc.getComponent(ItemBuff));
                });
                this._putItemBuffParent(_c);
            }
        });
        this._curActivityItemBuffsIndex = 0;
        this._arrBuff = [];
        this._buffs = [];
    }

    updateBuff(buffList: gamesvr.IBuff[]) {
        buffList.forEach(buff => {
            this._updateOneBuff({
                BuffID: buff.ID,
                Count: buff.Count,
                BuffUID: buff.UID,
            });
        });

        // this.node.active = this._arrBuff.length > 0;
    }

    // /**
    //  * @desc 根据BuffID查询身上挂着的ItemBuff
    //  *
    //  * @param {number} id
    //  * @param {number} uid
    //  * @returns {ItemBuff}
    //  * @memberof BuffListCtrl
    //  */
    // getBuff(Uid: number): gamesvr.IBuffResult {
    //     this.buffsList.children.forEach(_buffParent => {
    //         _buffParent.children.forEach(_buff => {
    //             let buffInfo = _buff.getComponent(ItemBuff);
    //             buffInfo.buff
    //         })
    //     })
    // }

    /**
     * @desc 获取所有的BUFF数据
     *
     * @returns {ItemBuff}
     * @memberof BuffListCtrl
     */
    getAllItem(): ItemBuff[] {
        return this._arrBuff;
    }

    /**
     * @desc 这里是通过EffectRes触发返回的接口效果
     *
     * @param {BuffResult} buffInfo 附加的Buff信息，或者是Buff激活带来的效果变化；这里一般要检测的是增量信息
     * @memberof BuffListCtrl
     */
    updateByEffRes(buffInfo: gamesvr.IBuffResult) {
        if (buffInfo == null) return;

        let buffCfg = configUtils.getBuffConfig(buffInfo.BuffID)
        if (!buffCfg || buffCfg.IfExhibition != 1) {
            return;
        }

        if (!buffInfo.Count || buffInfo.Count == 0) {
            this._removeBuff(buffInfo.BuffUID);
        } else {
            this._updateOneBuff(buffInfo);
        }
    }

    private _updateOneBuff(buffInfo: gamesvr.IBuffResult) {
        let findBuffIndex = this._buffs.findIndex(_buff => {
            return _buff.BuffUID == buffInfo.BuffUID
        });
        if(buffInfo.Count > 0) {
            if(findBuffIndex > -1) {
                this._buffs[findBuffIndex] = buffInfo;
            } else {
                this._buffs.push(buffInfo);
            }
        } else {
            if(findBuffIndex > -1) {
                this._buffs.splice(findBuffIndex, 1);
            }
        }

        let addTeamIndex: number = findBuffIndex == -1 ? Math.ceil(this._buffs.length / ROW_MAX_BUFF_COUNT) :  Math.ceil((findBuffIndex + 1) / ROW_MAX_BUFF_COUNT);
        if(this._curActivityItemBuffsIndex == addTeamIndex - 1) {
            // 说明需要动态添加
            let itemBuffParent = this.buffsList.children[addTeamIndex - 1];
            if(!itemBuffParent) {
                itemBuffParent = this._getItemBuffParent();
                this.buffsList.addChild(itemBuffParent);
            }
            itemBuffParent.setPosition(cc.v3(0, 0, 0));
            let addIndex: number = (findBuffIndex) % ROW_MAX_BUFF_COUNT;
            let itemBuff = itemBuffParent.children[addIndex];
            let itemBuffCmp = null;
            if(!itemBuff) {
                itemBuffCmp = ItemBuffPool.get();
                itemBuff = itemBuffCmp.node;
                itemBuffParent.addChild(itemBuff);
            } else {
                itemBuffCmp = itemBuff.getComponent(ItemBuff);
            }
            itemBuffCmp.init(buffInfo);
        } else {
            let itemBuffParent = this.buffsList.children[addTeamIndex - 1];
            if(!itemBuffParent) {
                itemBuffParent = this._getItemBuffParent();
                this.buffsList.addChild(itemBuffParent);
            }
            itemBuffParent.setPosition(cc.v3(0, -BUFF_ANIMATION_CONFIG.MOVE_Y, 0));
            itemBuffParent.opacity = 0;
        }

        this._updateSwitchAni();
    }

    private _removeBuff(buffUID: number) {
        let buffIndex = this._buffs.findIndex(_buff => {
            return _buff.BuffUID == buffUID;
        });

        if(buffIndex > -1) {
            this._buffs.splice(buffIndex, 1);
        } else {
            return;
        }

        let parentIndex: number = Math.ceil((buffIndex + 1) / ROW_MAX_BUFF_COUNT);
        // 说明需要删除
        let itemBuffParent = this.buffsList.children[parentIndex - 1];
        let removeIndex = buffIndex % ROW_MAX_BUFF_COUNT;
        let itemBuffNode = itemBuffParent.children[removeIndex];
        if(cc.isValid(itemBuffNode)) {
            ItemBuffPool.put(itemBuffNode.getComponent(ItemBuff));
            itemBuffParent.getComponent(cc.Layout).updateLayout();
        }
    }
    /**
     * @desc 预先放进去一个buff占位置，播放飞行动画的时候，如果有多个buff同时在，就会存在位置重叠，所以预先放一个
     *  他的count数据是用来占位使用的，最终会根据传入的数据进行更新
     * 
     * @param {BuffResult} buffInfo 需要预先安置的buff信息
     * @memberof BuffListCtrl
     */
    preAddBuff(buffInfo: gamesvr.IBuffResult) {
        // let itemBuff = this.getBuff(buffInfo.BuffUID);
        // this.nodeBuffList.active = true;
        // if (itemBuff) {
        //     return;
        // } else {
        //     itemBuff = ItemBuffPool.get();
        //     itemBuff.init(buffInfo, true);
        //     this._arrBuff.push(itemBuff);
        //     this.nodeBuffList.addChild(itemBuff.node);
        //     this.nodeBuffList.getComponent(cc.Layout).updateLayout();
        // }
    }

    /**
     * @desc 获取指定buff的世界坐标位置；如果没有这个buff，就给定新增的下一个空位的位置
     *
     * @param {number} id
     * @returns {cc.Vec3}
     * @memberof BuffListCtrl
     */
    // getBuffWorldPosition(uid: number): cc.Vec3 {
    //     // let ret = cc.Vec3.ZERO;
    //     // let itemBuff = this.getBuff(uid);
    //     // if (!itemBuff) {
    //     //     itemBuff = ItemBuffPool.get();
    //     //     this.nodeBuffList.addChild(itemBuff.node);
    //     //     this.nodeBuffList.getComponent(cc.Layout).updateLayout();
    //     //     ret = this.nodeBuffList.convertToWorldSpaceAR(itemBuff.node.position);
    //     //     ItemBuffPool.put(itemBuff);
    //     // } else {
    //     //     ret = this.nodeBuffList.convertToWorldSpaceAR(itemBuff.node.position);
    //     // }
    //     // return cc.v3(ret.x, ret.y);
    // }

    private _updateSwitchAni() {
        if(this._switchAniEnd && this.buffsList.childrenCount >= 2) {
            let curItemParent = this._getCurItemParent();
            let nextItemParent = this._getNextItemParent();
            if(curItemParent && nextItemParent) {
                curItemParent.stopAllActions();
                curItemParent.runAction(cc.sequence(
                    cc.spawn(
                        cc.moveTo(BUFF_ANIMATION_CONFIG.FADEOUT_TIME, cc.v2(0, BUFF_ANIMATION_CONFIG.MOVE_Y)), 
                        cc.fadeOut(BUFF_ANIMATION_CONFIG.FADEOUT_TIME)
                    ),
                    cc.callFunc(() => {
                        curItemParent.y = -BUFF_ANIMATION_CONFIG.MOVE_Y;
                        this._updateItemBuffParent(this._curActivityItemBuffsIndex);
                    })
                ));
                if(this._updateItemBuffParent(this._getNextIndex())) {
                    this._switchAniEnd = false;
                    nextItemParent.stopAllActions();
                    nextItemParent.runAction(cc.sequence(
                        cc.spawn(
                            cc.moveTo(BUFF_ANIMATION_CONFIG.FADEIN_TIME, cc.v2(0, 0)), 
                            cc.fadeIn(BUFF_ANIMATION_CONFIG.FADEIN_TIME)
                        ),
                        cc.delayTime(BUFF_ANIMATION_CONFIG.DEALIY_TIME),
                        cc.callFunc(() => {
                            this._curActivityItemBuffsIndex++;
                            this._curActivityItemBuffsIndex = (this._curActivityItemBuffsIndex % Math.ceil(this._buffs.length / ROW_MAX_BUFF_COUNT));
                            this._switchAniEnd = true;
                            this._updateSwitchAni();
                        })
                    ))
                }
            }
        }
    }

    private _updateItemBuffParent(index: number): boolean {
        let isShow: boolean = false;
        if(index < 0) return isShow;
        let curMaxIndex = Math.ceil(this._buffs.length / ROW_MAX_BUFF_COUNT);
        if(curMaxIndex <= 0) return isShow;
        let itemBuffParent = this.buffsList.children[index];
        if(!cc.isValid(itemBuffParent)) return isShow;
        if(index >= curMaxIndex) {
            this._putItemBuffParent(itemBuffParent);
            return isShow;
        } else {
            // 满足显示需求 需要刷新
            isShow = true;
            let start = index * ROW_MAX_BUFF_COUNT;
            for(let i = 0; i < ROW_MAX_BUFF_COUNT; ++i) {
                let buffData = this._buffs[start + i];
                if(!buffData) continue;
                let itemBuff = itemBuffParent.children[(start + i) % ROW_MAX_BUFF_COUNT];
                let itemBuffCmp = null;
                if(!itemBuff) {
                    itemBuffCmp = ItemBuffPool.get();
                    itemBuff = itemBuffCmp.node;
                    itemBuffParent.addChild(itemBuff);
                } else {
                    itemBuffCmp = itemBuff.getComponent(ItemBuff);
                }
                itemBuffCmp.init(buffData);
            }
            return isShow;
        }
    }

    private _getItemBuffParent() {
        if(this._itemBuffParentPool.size() > 0) {
            return this._itemBuffParentPool.get();
        } else {
            return cc.instantiate(this.templateItemBuffList);
        }
    }

    private _putItemBuffParent(itemBuffParent: cc.Node) {
        if(cc.isValid(itemBuffParent)) {
            let children = [...itemBuffParent.children]
            children.forEach(_c => {
                if(cc.isValid(_c)) {
                    _c.removeFromParent();
                    ItemBuffPool.put(_c.getComponent(ItemBuff));
                }
            });
            this._itemBuffParentPool.put(itemBuffParent);
        }
    }

    private _getCurItemParent() {
        return this.buffsList.children[this._curActivityItemBuffsIndex];
    }

    private _getNextItemParent() {
        return this.buffsList.children[this._getNextIndex()];
    }

    private _getNextIndex(): number {
        return this._curActivityItemBuffsIndex + 1 >= Math.ceil(this._buffs.length / ROW_MAX_BUFF_COUNT) ? 0 : (this._curActivityItemBuffsIndex + 1);
    }
}