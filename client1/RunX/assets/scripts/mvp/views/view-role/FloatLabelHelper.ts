
import { FloatLabelPool } from "../../../common/res-manager/NodePool";
import {scheduleManager} from "../../../common/ScheduleManager";
import ItemFloatLabel, { FloatLabel } from "../view-item/ItemFloatLabel";

const SHOW_INTERVAL = 600;

class FloatLabelWithTarget {
    private _lastShowTime = 0;
    private _queue: FloatLabel[] = [];
    private _items = new Map<string, ItemFloatLabel>();
    constructor () {
    }

    show (info: FloatLabel) {
        this._queue.push(info);
        this._checkShow();
    }

    private _releaseItem (item: ItemFloatLabel) {
        if (this._items.has(item.uuid)) {
            this._items.delete(item.uuid);
            FloatLabelPool.put(item);
        }
    }

    private _checkShow () {
        if (this._queue.length > 0) {
            const now = Date.now();
            if (now - this._lastShowTime > SHOW_INTERVAL - 50) {
                let info = this._queue.shift();
                while (!cc.isValid(info.parent)) {
                    if (this._queue.length == 0) {
                        info = null;
                        break;
                    }
                    info = this._queue.shift();
                }

                if (info) {
                    this._lastShowTime = now;
                    const item = FloatLabelPool.get();
                    item.show(info, () => {
                        this._releaseItem(item);
                    });
                    this._items.set(item.uuid, item);
                    
                    const id = scheduleManager.scheduleOnce(() => {
                        this._checkShow();
                    }, (SHOW_INTERVAL + 10) / 1000);
                }
            }
        }
    }

    stopAll () {
        this._queue = [];
        this._items.forEach(v => {
            v.stop();
            FloatLabelPool.put(v);
        });
        this._items.clear();
    }
}

class FloatLabelHelper {
    private _targets = new Map<string, FloatLabelWithTarget>();
    constructor () {
    }

    show (info: FloatLabel) {
        if (!this._targets.has(info.parent.uuid)) {
            this._targets.set(info.parent.uuid, new FloatLabelWithTarget());
        }

        const impl = this._targets.get(info.parent.uuid);
        impl.show(info);
    }

    stopAll () {
        this._targets.forEach(v => {
            v.stopAll();
        });
        this._targets.clear();
    }

    stopTarget (target: cc.Node) {
        if (this._targets.has(target.uuid)) {
            this._targets.get(target.uuid).stopAll();
        }
    }

}

const floatLabelHelper = new FloatLabelHelper();

export default floatLabelHelper;