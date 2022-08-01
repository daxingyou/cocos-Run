import { logger } from "../log/Logger";
import { NodePool } from "../res-manager/NodePool";

const {ccclass, property} = cc._decorator;

/**
 * 该缓冲池用于与NodePool搭配使用，在虚拟列表场景下避免节点的移除和添加带来的消耗
 */
@ccclass
export default class TempNodePool<T extends cc.Component> {
    private _nodePool: Array<T> = [];
    private _parentNodePool: NodePool<T> = null;

    itemType: { prototype: T } = null;

    constructor(parentNodePool: NodePool<T>) {
        this._parentNodePool = parentNodePool;
        this.itemType = parentNodePool.itemType;
    }

    /**
     * 获取可用节点组件，优先从自身缓存拿，没有则从父节点池拿
     */
    get() {
        let item: T = null;
        if (this._nodePool.length > 0) {
            item = this._nodePool.pop();
            item.node.opacity = 255;
        } else {
            item = this._parentNodePool.get();
        }

        return item;
    }

    /** 放置到自身缓存
     * @param item 节点组件
     */
    put(item: T) {
        if (!item || !cc.isValid(item.node)) {
            return;
        }

        let releaseFunc = this._parentNodePool.releaseFunc;
        // @ts-ignore
        if (releaseFunc && releaseFunc.length > 0 && typeof item[this.releaseFunc] === 'function') {
            try {
                // @ts-ignore
                item[this.releaseFunc]();
            } catch (error) {
                logger.error(`NodePool`, `release item failed. error = ${error}`)
            }
        }

        // 透明度调为0
        item.node.opacity = 0;

        this._nodePool.push(item);
    }

    /**
     * 清空自身缓冲池
     */
    clear() {
        for (let i = 0; i < this._nodePool.length; ++i) {
             this._nodePool[i].node.opacity = 255;
            this._parentNodePool.put(this._nodePool[i]);
        }
        this._nodePool.splice(0, this._nodePool.length);
        this._parentNodePool = null;
    }

    /** 查找池子中的节点 */
    find(item: T) {
        let isFind: boolean = false;
        for (let i = 0; i < this._nodePool.length; ++i) {
            this._nodePool[i] === item && (isFind = true);
        }

        return isFind;
    }
}
