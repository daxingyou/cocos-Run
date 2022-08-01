import { resourceManager, CACHE_MODE, CacheData } from "../ResourceManager";
import { logger } from "../log/Logger";
import ItemRole from "../../mvp/views/view-item/ItemRole";
import HitLabel from "../../mvp/views/view-item/HitLabel";
import ItemBuff from "../../mvp/views/view-item/ItemBuff";

interface NodeCacheInfo <ItemType> {
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
    private _itemType: {prototype: ItemType} = null;
    private _cacheMode: CACHE_MODE = CACHE_MODE.NONE;
    private _prefab: cc.Prefab = null;

    constructor (info: PoolInfo, itemType: {prototype: ItemType}, cacheMode = CACHE_MODE.NONE) {
        this._info = info;
        this._itemType = itemType;
        this._info.maxCount = this._info.maxCount;
        this._cacheMode = cacheMode;
    }

    get path (): string {
        return this._info.path;
    }

    get initCount (): number {
        return this._info.initCount || this._info.maxCount;
    }

    get maxCount (): number {
        return this._info.maxCount;
    }

    get createPreFrame (): number {
        return this._info.createPreFrame || 1;
    }

    get releaseFunc (): string {
        return this._info.releaseFunc;
    }

    get nowCount (): number {
        return this._freePool.length + this._usedPool.length;
    }

    /**
     * @desc 获取指定类型节点；如果指定了key，会优先按照符合条件的key进行返回；自己get的资源，要自己put回收！
     *
     * @param {string} [key]
     * @returns {Promise<ItemType>}
     * @memberof NodePool
     */
    get (key?: string): ItemType {
        if (!this._prefab) {
            logger.error('NodePool', `there is no prefab for path = ${this.path}. did you forget to call preload ?`);
            return null;
        }

        if (this._freePool.length === 0) {
            const node = this._loadItemNode();
            const item = node.getComponent(this._itemType);
            if (item) {
                this._addToUsed({item: item, key: key});
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
            this._addToUsed({item: info.item, key: key || info.key});
            
            return info.item;
        }
    }

    /**
     * @desc 释放节点，传入指定类型的组件即可释放
     *
     * @param {ItemType} item
     * @memberof NodePool
     */
    put (item: ItemType) {
        if (!item || !cc.isValid(item.node)) {
            return;
        }
        
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
                if(el.item === item) {
                    idx = inex;
                    return true;
                }
                return false;
            });
            this._releaseItem(item);
            logger.log('NodePool', `destroy item. name = ${item.name}。 count = ${this._freePool.length + this._usedPool.length}. index = ${idx}. uuid = ${item.uuid}`);
            item.node.destroy();
        }
    }

    /**
     * @desc 资源释放；会释放所有预加载的节点，以及使用中的节点；最后会释放所加载的prefab
     *
     * @memberof NodePool
     */
    release () {
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

    private _releaseItem (item: ItemType) {
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

    private _loadItemNode (): cc.Node {
        return cc.instantiate(this._prefab);
    }

    private _addToUsed (itemInfo: NodeCacheInfo<ItemType>) {
        if (this._usedPool.length + this._freePool.length < this.maxCount) {
            this._usedPool.push(itemInfo);
        }
    }

    private _addToFree (itemInfo: NodeCacheInfo<ItemType>): boolean {
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
    preloadPrefab (callback: Function) {
        if (this._prefab) {
            callback();
        } else {
            resourceManager.load(this.path, cc.Prefab, this._cacheMode)
            .then((ret: CacheData) => {
                this._prefab = ret.res;
                callback();
            }).catch( err => {
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
    preloadOneFrameItem (): boolean {
        let result = false;
        for (let i = 0; i < this.createPreFrame; i++) {
            if ( this.nowCount < this.initCount ) {
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
        maxCount: 15,
        createPreFrame: 5,
        releaseFunc: 'deInit',
    }, 
    ItemBuff
);

export {
    NodePool,
    ItemRolePool,
    HitLabelPool,
    ItemBuffPool
}
