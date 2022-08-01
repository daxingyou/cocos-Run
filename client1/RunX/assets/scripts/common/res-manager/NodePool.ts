import { resourceManager, CACHE_MODE, CacheData } from "../ResourceManager";
import { logger } from "../log/Logger";
import ItemRole from "../../mvp/views/view-item/ItemRole";
import HitLabel from "../../mvp/views/view-item/HitLabel";
import ItemBuff from "../../mvp/views/view-item/ItemBuff";
import ItemFloatLabel from "../../mvp/views/view-item/ItemFloatLabel";
import ItemHalo from "../../mvp/views/view-role/ItemHalo";
import ItemBuffFloatLabel from "../../mvp/views/view-item/ItemBuffFloatLabel";
import ItemLimitIcon from "../../mvp/views/view-timelimit/ItemLimitIcon";
import ItemBag from "../../mvp/views/view-item/ItemBag";
import ItemQualityEffect from "../../mvp/views/view-item/ItemQualityEffect";
import ItemHeadCircle from "../../mvp/views/view-item/ItemHeadCircle";
import ItemHeadSquare from "../../mvp/views/view-item/ItemHeadSquare";
import ItemLevelMapLesson from "../../mvp/views/view-levelmap/ItemLevelMapLesson";
import ItemLevelMapRoadLine from "../../mvp/views/view-levelmap/ItemLevelMapRoadLine";
import ItemModelSpine from "../../mvp/views/view-item/ItemModelSpine";
import ItemLevelMapMoveRole from "../../mvp/views/view-levelmap/ItemLevelMapMoveRole";
import ItemPragmaticSkillIcon from "../../mvp/views/view-pragmatic/ItemPragmaticSkillIcon";
import ItemDoubleWeekIcon from "../../mvp/views/view-activity/ItemDoubleWeekIcon";
import HeroListItem from "../../mvp/views/view-hero/HeroListItem";
import ShopItem from "../../mvp/views/view-shop/ShopItem";
import MailItem from "../../mvp/views/view-mail/MailItem";
import ItemLotteryIcon from "../../mvp/views/view-activity/ItemLotteryIcon";
import ItemStrategyDesc from "../../mvp/views/view-strategy/item/ItemStrategyDesc";
import ItemOnlineDetail from "../../mvp/views/view-online/ItemOnlineDetail";
import ItemIslandMapTile from "../../mvp/views/view-pve/pve-fairyisland/ItemIslandMapTile";
import ItemPveShop from "../../mvp/views/view-pve/common/ItemPveShop";
import ItemPveBuff from "../../mvp/views/view-pve/common/ItemPveBuff";
import ItemHeadMonster from "../../mvp/views/view-item/ItemHeadMonster";
import ItemPveRole from "../../mvp/views/view-pve/common/ItemPveRole";

interface NodeCacheInfo<ItemType> {
    item: ItemType;
    key: string;
}

interface PoolInfo {
    path: string;
    maxCount: number;
    releaseFunc: string;
    initCount?: number;
    createPreFrame?: number;
}

/**
 * @desc 阶段缓存辅助类；可以为节点提供缓存
 *  自己每次get出去的资源，要自己put回来进行释放
 *  具体的用法，参考下边的导出接口
 *  每个使用的组件，如果有自己的释放函数，要把释放的函数名在PoolInfo中传入进来
 *
 * @class NodePool
 * @template ItemType
 */
class NodePool<ItemType extends cc.Component> {
    private _info: PoolInfo = null;
    private _freePool: NodeCacheInfo<ItemType>[] = [];
    private _usedPool: NodeCacheInfo<ItemType>[] = [];
    private _itemType: { prototype: ItemType } = null;
    private _cacheMode: CACHE_MODE = CACHE_MODE.NONE;
    private _prefab: cc.Prefab = null;

    constructor(info: PoolInfo, itemType: { prototype: ItemType }, cacheMode = CACHE_MODE.NONE) {
        this._info = info;
        this._itemType = itemType;
        this._info.maxCount = this._info.maxCount;
        this._cacheMode = cacheMode;
    }

    get path(): string {
        return this._info.path;
    }

    get itemType() {
        return this._itemType;
    }

    get initCount(): number {
        return this._info.initCount || this._info.maxCount;
    }

    get maxCount(): number {
        return this._info.maxCount;
    }

    get createPreFrame(): number {
        return this._info.createPreFrame || 1;
    }

    get releaseFunc(): string {
        return this._info.releaseFunc;
    }

    get nowCount(): number {
        return this._freePool.length + this._usedPool.length;
    }

    get isPreLoad(): boolean {
        return cc.isValid(this._prefab);
    }

    /**
     * @desc 获取指定类型节点；如果指定了key，会优先按照符合条件的key进行返回；自己get的资源，要自己put回收！
     *
     * @param {string} [key]
     * @returns {Promise<ItemType>}
     * @memberof NodePool
     */
    get(key?: string): ItemType {
        // console.log(`【get】【${this._itemType.name}】【可用 ${this._freePool.length}】【已用 ${this._usedPool.length}】`)
        if (!this._prefab) {
            logger.error('NodePool', `there is no prefab for path = ${this.path}. did you forget to call preload ?`);
            return null;
        }

        if (this._freePool.length === 0) {
            const node = this._loadItemNode();
            const item = node.getComponent(this._itemType);
            if (item) {
                this._addToUsed({ item: item, key: key });
                return item;
            } else {
                logger.error('NodePool', `Can not get Component for type = ${this._itemType}`);
                return null;
            }
        } else {
            let info: NodeCacheInfo<ItemType> = null;
            if (key && key.length > 0) {
                this._freePool.some((el: NodeCacheInfo<ItemType>, index: number) => {
                    if (el.key === key) {
                        info = el;
                        this._freePool.splice(index, 1);
                        return true;
                    }
                    return false;
                });
            }
            if (!info) {
                info = this._freePool.pop();
                if (!info.item.isValid) {
                    console.trace('stack:');
                }
            }
            this._addToUsed({ item: info.item, key: key || info.key });

            return info.item;
        }
    }

    /**
     * @desc 释放节点，传入指定类型的组件即可释放
     *
     * @param {ItemType} item
     * @memberof NodePool
     */
    put(item: ItemType) {
        if (!item || !cc.isValid(item.node)) {
            return;
        }
        // console.log(`【put】【${this._itemType.name}】【可用 ${this._freePool.length}】【已用 ${this._usedPool.length}】`)

        let find = this._usedPool.some((el: NodeCacheInfo<ItemType>, index: number) => {
            if (el.item === item) {
                this._usedPool.splice(index, 1);
                let result = this._addToFree(el);

                this._releaseItem(item);
                if (!result) {
                    el.item.destroy();
                }
                return true;
            }
            return false;
        });

        if (find) {
            return;
        }

        // 看看是否已经在free pool中了，如果在freepool中，就要做一层保护
        find = this._freePool.some((el: NodeCacheInfo<ItemType>, index: number) => {
            if (el.item === item) {
                logger.warn('NodePool', `节点请不要释放多次，已经释放过的，请不要再次释放！name = ${el.item.name}`);
                return true;
            }
            return false;
        });

        if (!find) {
            let idx = -1;
            this._freePool.some((el, inex) => {
                if (el.item === item) {
                    idx = inex;
                    return true;
                }
                return false;
            });
            this._releaseItem(item);
            // logger.log('NodePool', `destroy item. name = ${item.name}。 count = ${this._freePool.length + this._usedPool.length}. index = ${idx}. uuid = ${item.uuid}`);
            item.node.destroy();
        }
    }

    /**
     * @desc 资源释放；会释放所有预加载的节点，以及使用中的节点；最后会释放所加载的prefab
     *
     * @memberof NodePool
     */
    release() {
        // 先把使用中的，给release掉
        if (this._usedPool.length > 0) {
            logger.error('NodePool', `there still ${this._usedPool.length} node in use. Are u sure you released all Item = ${this.path}`);
            const temp = [...this._usedPool];
            temp.forEach(info => {
                this.put(info.item);
            });
            this._usedPool.length = 0;
        }

        // 在把空闲的给释放掉
        this._freePool.forEach(info => {
            this._releaseItem(info.item);
            if (cc.isValid(info.item.node)) {
                info.item.node.destroy();
            }
        });
        this._freePool.length = 0;

        // prefab的资源释放
        if (this._prefab) {
            resourceManager.release(this.path, this._cacheMode);
            this._prefab = null;
        }
    }

    private _releaseItem(item: ItemType) {
        // @ts-ignore
        if (this.releaseFunc && this.releaseFunc.length > 0 && typeof item[this.releaseFunc] === 'function') {
            try {
                // @ts-ignore
                item[this.releaseFunc]();
            } catch (error) {
                logger.error(`NodePool`, `release item failed. error = ${error}`)
            }
        }
        if (cc.isValid(item.node) && cc.isValid(item.node.parent)) {
            item.node.removeFromParent(false);
        }
        // logger.log('NodePool', `put item. name = ${item.name}`);
    }

    private _loadItemNode(): cc.Node {
        return cc.instantiate(this._prefab);
    }

    private _addToUsed(itemInfo: NodeCacheInfo<ItemType>) {
        if (this._usedPool.length + this._freePool.length < this.maxCount) {
            this._usedPool.push(itemInfo);
        }
    }

    private _addToFree(itemInfo: NodeCacheInfo<ItemType>): boolean {
        if (this._usedPool.length + this._freePool.length < this.maxCount) {
            if (this._freePool.indexOf(itemInfo) >= 0) {
                logger.error(`NodePool`, `You can't put same item twice. itemType = ${itemInfo.item.name}`);
            } else {
                this._freePool.push(itemInfo);
            }
            return true;
        }
        return false;
    }

    /**
     * @desc 提供给预加载使用的，一般情况下，不需要你们来调用
     *
     * @param {Function} callback
     * @memberof NodePool
     */
    preloadPrefab(callback: Function) {
        if (this._prefab) {
            callback();
        } else {
            resourceManager.load(this.path, cc.Prefab, this._cacheMode)
                .then((ret: CacheData) => {
                    this._prefab = ret.res;
                    callback();
                }).catch(err => {
                    callback(err);
                });
        }
    }

    /**
     * @desc 提供给预加载使用的，一般情况下，不需要你们来调用
     *
     * @param {Function} callback
     * @memberof NodePool
     */
    preloadOneFrameItem(): boolean {
        let result = false;
        for (let i = 0; i < this.createPreFrame; i++) {
            if (this.nowCount < this.initCount) {
                const node = this._loadItemNode();
                this._addToFree({
                    item: node.getComponent(this._itemType),
                    key: '',
                });
                result = true;
            }
        }
        return result;
    }
}


// maxCount不要改。希望他能够每次创建，不用复用node
const ItemRolePool = new NodePool<ItemRole>(
    {
        path: `prefab/item/ItemRole`,
        maxCount: 1,
        releaseFunc: 'deInit'
    },
    ItemRole
);

const HitLabelPool = new NodePool<HitLabel>(
    {
        path: `prefab/item/ItemHitLabel`,
        maxCount: 5,
        createPreFrame: 5,
        releaseFunc: null,
    },
    HitLabel
);

const ItemBuffPool = new NodePool<ItemBuff>(
    {
        path: `prefab/item/ItemBuff`,
        initCount: 5,
        maxCount: 20,
        createPreFrame: 5,
        releaseFunc: 'deInit',
    },
    ItemBuff
);

const ItemHaloPool = new NodePool<ItemHalo>(
    {
        path: `prefab/item/ItemHalo`,
        initCount: 5,
        maxCount: 10,
        createPreFrame: 5,
        releaseFunc: 'deInit',
    },
    ItemHalo
);

const FloatLabelPool = new NodePool<ItemFloatLabel>(
    {
        path: `prefab/item/ItemFloatLabel`,
        initCount: 3,
        maxCount: 5,
        createPreFrame: 3,
        releaseFunc: null,
    }, 
    ItemFloatLabel
);

const BuffFloatLabelPool = new NodePool<ItemBuffFloatLabel>(
    {
        path: `prefab/item/ItemBuffFloatLabel`,
        maxCount: 5,
        releaseFunc: null,
    }, 
    ItemBuffFloatLabel
);

const ItemBagPool = new NodePool<ItemBag>(
    {
        path: `prefab/item/ItemBag`,
        initCount: 5,
        maxCount: 40,
        createPreFrame: 5,
        releaseFunc: 'deInit',
    },
    ItemBag
);

// 暂时没用
const ItemHeroHeadCirclePool = new NodePool<ItemHeadCircle>(
    {
        path: `prefab/item/ItemHeadCircle`,
        initCount: 5,
        maxCount: 40,
        createPreFrame: 5,
        releaseFunc: 'deInit',
    },
    ItemHeadCircle
);

const ItemHeroHeadSquarePool = new NodePool<ItemHeadSquare>(
    {
        path: `prefab/item/ItemHeadSquare`,
        initCount: 20,
        maxCount: 40,
        createPreFrame: 5,
        releaseFunc: 'deInit',
    },
    ItemHeadSquare
);

const LimitIconPool = new NodePool<ItemLimitIcon>(
    {
        path: `prefab/views/view-timelimit/ItemLimitIcon`,
        initCount: 3,
        maxCount: 10,
        createPreFrame: 5,
        releaseFunc: 'deInit'
    },
    ItemLimitIcon
);

const ItemQualityPool = new NodePool<ItemQualityEffect>(
    {
        path: `prefab/item/ItemQualityEffect`,
        initCount: 5,
        maxCount: 30,
        createPreFrame: 5,
        releaseFunc: 'deInit',
    },
    ItemQualityEffect
);

const ItemLevelMapLessonPool = new NodePool<ItemLevelMapLesson>(
    {
        path: `prefab/views/view-levelmap/ItemLevelMapLesson`,
        initCount: 10,
        maxCount: 50,
        createPreFrame: 5,
        releaseFunc: 'deInit'
    },
    ItemLevelMapLesson
);

const ItemLevelMapRoadLinePool = new NodePool<ItemLevelMapRoadLine>(
    {
        path: `prefab/views/view-levelmap/ItemLevelMapRoadLine`,
        initCount: 10,
        maxCount: 50,
        createPreFrame: 5,
        releaseFunc: 'deInit'
    },
    ItemLevelMapRoadLine
);

const ItemModelSpinePool = new NodePool<ItemModelSpine>(
    {
        path: `prefab/item/ItemModelSpine`,
        initCount: 5,
        maxCount: 20,
        createPreFrame: 5,
        releaseFunc: 'deInit'
    },
    ItemModelSpine
)

const ItemLevelMapMoveRolePool = new NodePool<ItemLevelMapMoveRole>(
    {
        path: `prefab/views/view-levelmap/ItemLevelMapMoveRole`,
        initCount: 1,
        maxCount: 5,
        createPreFrame: 5,
        releaseFunc: 'deInit'
    },
    ItemLevelMapMoveRole
)

const ItemPragmaticSkillIconPool = new NodePool<ItemPragmaticSkillIcon>(
    {
        path: `prefab/views/view-pragmatic/item/ItemPragmaticSkillIcon`,
        initCount: 10,
        maxCount: 50,
        createPreFrame: 5,
        releaseFunc: 'deInit'
    },
    ItemPragmaticSkillIcon
)

const ItemDoubleWeekIconPool = new NodePool<ItemDoubleWeekIcon>(
    {
        path: `prefab/views/view-activity/ItemDoubleWeekIcon`,
        initCount: 2,
        maxCount: 5,
        createPreFrame: 5,
        releaseFunc: 'deInit'
    },
    ItemDoubleWeekIcon
)

//英雄、图鉴中使用
const ItemHeroListPool = new NodePool<HeroListItem>(
    {
        path: `prefab/views/view-hero/item/HeroListItem`,
        initCount: 16,
        maxCount: 30,
        createPreFrame: 4,
        releaseFunc: 'deInit'
    },
    HeroListItem
);

const ItemShopPool = new NodePool<ShopItem> (
    {
        path: `prefab/views/view-shop/ShopItem`,
        initCount: 20,
        maxCount: 25,
        createPreFrame: 5,
        releaseFunc: 'deInit'
    },
    ShopItem
);

const MailItemPool = new NodePool<MailItem> (
    {
        path: `prefab/views/view-mail/ItemMail`,
        initCount: 7,
        maxCount: 20,
        createPreFrame: 3,
        releaseFunc: 'deInit'
    },
    MailItem
);

const ItemLotteryIconPool = new NodePool<ItemLotteryIcon> (
    {
        path: `prefab/views/view-activity/ItemLotteryIcon`,
        initCount: 8,
        maxCount: 8,
        createPreFrame: 4,
        releaseFunc: 'deInit'
    },
    ItemLotteryIcon
);

const ItemStrategyDescPool = new NodePool<ItemStrategyDesc> (
    {
      path: `prefab/views/view-strategy/item/ItemStrategyDesc`,
      initCount: 15,
      maxCount: 50,
      createPreFrame: 5,
      releaseFunc: 'deInit'
    },
    ItemStrategyDesc
);

const ItemOnlineDetailPool = new NodePool<ItemOnlineDetail>(
    {
        path: `prefab/views/view-online/item/ItemReward`,
        initCount: 12,
        maxCount: 12,
        createPreFrame: 5,
        releaseFunc: 'deInit'
    },
    ItemOnlineDetail
);

const ItemIslandMapTilePool = new NodePool<ItemIslandMapTile>(
    {
        path: `prefab/views/view-pve/pve-fairyisland/ItemIsland`,
        initCount: 12,
        maxCount: 30,
        createPreFrame: 5,
        releaseFunc: 'deInit'
    },
    ItemIslandMapTile,
);

const ItemPveShopPool = new NodePool<ItemPveShop>(
    {
        path: `prefab/views/view-pve/common/ItemPveShop`,
        initCount: 3,
        maxCount: 3,
        createPreFrame: 5,
        releaseFunc: 'deInit'
    },
    ItemPveShop
);

const ItemPveBuffPool = new NodePool<ItemPveBuff>(
    {
        path: `prefab/views/view-pve/common/ItemPveBuff`,
        initCount: 3,
        maxCount: 5,
        createPreFrame: 5,
        releaseFunc: 'deInit'
    },
    ItemPveBuff
);

const ItemHeadMonsterPool = new NodePool<ItemHeadMonster>(
    {
        path: `prefab/item/ItemHeadMonster`,
        initCount: 5,
        maxCount: 5,
        createPreFrame: 5,
        releaseFunc: 'deInit'
    },
    ItemHeadMonster
);

const ItemPveRolePool = new NodePool<ItemPveRole>(
    {
        path: `prefab/views/view-pve/common/ItemPveRole`,
        initCount: 4,
        maxCount: 5,
        createPreFrame: 5,
        releaseFunc: 'deInit'
    },
    ItemPveRole
);

export {
    NodePool,
    ItemRolePool,
    HitLabelPool,
    ItemBuffPool,
    ItemHaloPool,
    FloatLabelPool,
    BuffFloatLabelPool,
    LimitIconPool,
    ItemBagPool,
    ItemHeroHeadCirclePool,
    ItemHeroHeadSquarePool,
    ItemQualityPool,
    ItemLevelMapLessonPool,
    ItemLevelMapRoadLinePool,
    ItemModelSpinePool,
    ItemLevelMapMoveRolePool,
    ItemPragmaticSkillIconPool,
    ItemDoubleWeekIconPool,
    ItemHeroListPool,
    ItemShopPool,
    MailItemPool,
    ItemLotteryIconPool,
    ItemStrategyDescPool,
    ItemOnlineDetailPool,
    ItemIslandMapTilePool,
    ItemPveShopPool,
    ItemPveBuffPool,
    ItemHeadMonsterPool,
    ItemPveRolePool
}
