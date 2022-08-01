import { WatcherHelper } from "../../../common/components/WatcherHelper";
import { configManager } from "../../../common/ConfigManager";
import { ItemBuffPool } from "../../../common/res-manager/NodePool";
import { gamesvr } from "../../../network/lib/protocol";
import ItemBuff from "../view-item/ItemBuff";


enum BUFF_ANIM_TYPE {
    GET             = 'buff-get',
    ACTIVATE        = 'buff-activate',
    REMOVE          = 'buff-remove',
}

/**
 * @desc 做Buff动画的参数；from、to、position；这三个都是世界坐标
 *
 * @interface BuffAnimInfo
 */
interface BuffAnimInfo {
    buffId: number;
    buffUID: number;
    type: BUFF_ANIM_TYPE;
    parent: cc.Node;
    role?: cc.Node;
    from?: cc.Vec3;
    to?: cc.Vec3;
    position?: cc.Vec3;
    complete?: Function;
    buffResult?: gamesvr.IBuffResult;
}

class BuffAnimationOnce {
    private _animInfo: BuffAnimInfo = null;
    private _item: ItemBuff = null;

    constructor (info: BuffAnimInfo) {
        this._animInfo = info;
    }

    stop () {
        this._finCallback();
    }

    play () {
        if (!this._animInfo) {
            return;
        }

        switch (this._animInfo.type) {
            case BUFF_ANIM_TYPE.GET: this._playGetAnim(); break;
            case BUFF_ANIM_TYPE.ACTIVATE: this._playActiviteAnim(); break;
            case BUFF_ANIM_TYPE.REMOVE: this._playRemoveAnim(); break;
            default: break;
        }
    }

    private _finCallback () {
        if (this._item) {
            WatcherHelper.removeWatcher(this._item.node);
            ItemBuffPool.put(this._item);
            this._item = null;
            this._animInfo.complete && this._animInfo.complete();
        }
    }

    private _playGetAnim () {
        // console.log(`_playGetAnim`);
        const itemBuff = ItemBuffPool.get();
        itemBuff.init({
            BuffID: this._animInfo.buffId, 
            BuffUID: this._animInfo.buffUID,
            RoleUID: 0,
            Delta: 0,
            Count: 0,
        });

        this._item = itemBuff;
        const finCallback = () => {
            this._finCallback();
        }

        this._animInfo.parent.addChild(itemBuff.node);
        WatcherHelper.addWatcher({
            node: itemBuff.node,
            parent: this._animInfo.parent,
            onDisable: () => {
                finCallback();
            },
        });
        
        itemBuff.node.setPosition(this._animInfo.parent.convertToNodeSpaceAR(this._animInfo.from));

        const dest = this._animInfo.parent.convertToNodeSpaceAR(this._animInfo.to);
        // let toPos = this._animInfo.target.buffListCtrl.getBuffWorldPosition(this._animInfo.buffId, this._animInfo.buffUID);
        // const dest = this._animInfo.parent.convertToNodeSpaceAR(toPos);
        itemBuff.node.scale = 1.6;
        itemBuff.node.runAction(
            cc.sequence(
                cc.spawn(
                    cc.scaleTo(0.25, 1).easing(cc.easeCubicActionOut()),
                    cc.moveTo(0.25, cc.v2(dest.x, dest.y)).easing(cc.easeCubicActionOut()),
                ),
                cc.callFunc(() => {
                    finCallback();
                })
            )
        )
    }

    private _playActiviteAnim () {
        // console.log(`_playActiviteAnim`);
        let buffCfg = configManager.getConfigByKey("buff", this._animInfo.buffId);
        if (1/*!buffCfg || buffCfg.UseEffect == 0*/) {
            // 通用效果，在buff处闪一下
            const finCallback = () => {
                this._finCallback();
            }
            
            const itemBuff = ItemBuffPool.get();
            if (this._animInfo.buffResult) {
                itemBuff.init({...this._animInfo.buffResult});
            } else {
                itemBuff.init({
                    BuffID: this._animInfo.buffId, 
                    BuffUID:  this._animInfo.buffUID,
                    RoleUID: 0,
                    Delta: 0,
                    Count: 0,
                });
            }

            this._item = itemBuff;
            this._animInfo.parent.addChild(itemBuff.node);
            WatcherHelper.addWatcher({
                node: itemBuff.node,
                parent: this._animInfo.parent,
                onDisable: () => {
                    finCallback();
                },
            });

            // this._animInfo.parent.convertToNodeSpaceAR(this._animInfo.position, itemBuff.node.position);
            itemBuff.node.setPosition(cc.v2(0, 0));
            itemBuff.node.zIndex = -1;
            itemBuff.node.scale = 1.5;
            itemBuff.node.opacity = 0;
            itemBuff.node.runAction(
                cc.sequence(
                    cc.spawn(
                        cc.fadeIn(0.25).easing(cc.easeExponentialInOut()),
                        cc.scaleTo(0.25, 1),
                    ),
                    cc.callFunc(() => {
                        finCallback();
                    })
                )
            );
        } else {
            // 播放buff生效效果
            // const checkBuffType = (buffCfg: any, count: number) => {
            //     let isDeBuff = false;
            //     if (buffCfg.Type === BUFF_TYPE.BAD || (buffCfg.Type === BUFF_TYPE.NONE && count < 0)) {
            //         isDeBuff = true;
            //     }
            //     return isDeBuff;
            // }

            // const onComplete = () => {
            //     this._animInfo.complete && this._animInfo.complete();
            // }
            // // onComplete();
            // const buffCount = this._animInfo.buffResult ? this._animInfo.buffResult.Count : 1;
            // const animation = checkBuffType(buffCfg, buffCount) ? 'buff' : 'debuff';
            // const skpPath = `uigfx/fx_take_buff/fx_take_buff`;
            // playAnimationOnce(ANIM_TYPE.Skeleton, {
            //     path: skpPath,
            //     animation: animation,
            //     scale: 0.33,
            //     node: this._animInfo.parent,
            //     offset: this._animInfo.parent.convertToNodeSpaceAR(this._animInfo.position)
            // })
            // .then(onComplete)
            // .catch(onComplete);
        }
    }

    private _playRemoveAnim () {

    }
}

const playBuffAnimation = (info: BuffAnimInfo): BuffAnimationOnce => {
    const anim = new BuffAnimationOnce(info);
    anim.play();
    return anim;
}

export {
    playBuffAnimation,
    BuffAnimInfo,
    BUFF_ANIM_TYPE,
    BuffAnimationOnce,
}