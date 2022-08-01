import WatcherComponent, { WatcherInfo } from "./WatcherComponent";


const watcherList = new Map<string, WatcherComponent>();

class WatcherHelper {
    public static addWatcher (info: WatcherInfo): string {
        const key = info.node.uuid;
        let watcher = info.parent.getComponent(WatcherComponent);
        if (!watcher) {
            watcher = info.parent.addComponent(WatcherComponent);
            watcherList.set(info.parent.uuid, watcher);
            watcher.setDestroyHandler((uuid: string) => {
                watcherList.delete(uuid);
            });
        }
        watcher.addWatcher(key, info);
        return key;
    }

    public static removeWatcher (node: cc.Node) {
        if (cc.isValid(node) && cc.isValid(node.parent)) {
            const watcher = node.parent.getComponent(WatcherComponent);
            if (watcher) {
                watcher.removeWatcher(node.uuid);
            }
        }
    }

    public static removeWatcherOnNode (node: cc.Node) {
        const _findAndRemoveWatcher = (wt: WatcherComponent): boolean => {
            let tnd = wt.node;
            while (cc.isValid(tnd)) {
                if (tnd.uuid === node.uuid) {
                    wt.enabled = false;
                    return true;
                }
                tnd = tnd.parent;
            }
            return false;
        }

        watcherList.forEach((watcher, uuid) => {
            _findAndRemoveWatcher(watcher);
        });
    }
}

export {
    WatcherHelper,
}