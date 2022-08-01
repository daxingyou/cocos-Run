import { logger } from "../log/Logger";

const {ccclass, property} = cc._decorator;

interface WatcherInfo {
    node: cc.Node;
    parent: cc.Node;
    onDisable: Function;
    keepAfterCall?: boolean;
}

@ccclass
export default class WatcherComponent extends cc.Component {
    private _watchers = new Map<string, WatcherInfo>();
    private _destroyHandler: Function = null;

    private _listenedChildren = false;

    onDisable () {
        this._watchers.forEach((v, k) => {
            v.onDisable();
            if (!v.keepAfterCall) {
                this._watchers.delete(k);
            }
        })

        this.node.off(cc.Node.EventType.CHILD_REMOVED, this._onChildrenRemoved, this);

        this._destroyHandler && this._destroyHandler(this.node.uuid);
        this.destroy();
    }

    setDestroyHandler (_handler: Function) {
        this._destroyHandler = _handler;
    }

    addWatcher (key: string, info: WatcherInfo) {
        if (this._watchers.has(key)) {
            logger.warn(`key = ${key} already exits. parent = ${info.parent.name}`);
        }
        this._watchers.set(key, info);

        if (!this._listenedChildren) {
            this.node.on(cc.Node.EventType.CHILD_REMOVED, this._onChildrenRemoved, this);
            this._listenedChildren = true;
        }
        // console.log(`add watcher for key = ${key}`);
    }

    removeWatcher (key: string) {
        this._watchers.delete(key);
        // console.log(`remove watcher for key = ${key}`);
    }

    private _onChildrenRemoved (node: cc.Node) {
        const tmpWatchers = new Map<string, WatcherInfo>();
        this._watchers.forEach((v, k) => {
            tmpWatchers.set(k, v);
        })

        const keyToDelete: string[] = [];
        tmpWatchers.forEach((v, k) => {
            if (v.node === node) {
                v.onDisable();
                logger.warn(`WatcherHelper`, `Parent has changed. watcher on disable. node = ${node.name}`);
                if (!v.keepAfterCall) {
                    keyToDelete.push(k);
                }
            }
        });

        keyToDelete.forEach(v => {
            this._watchers.delete(v);
        });
    }
}

export {
    WatcherInfo
};