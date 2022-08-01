import { BuffFloatLabelPool } from "../../../common/res-manager/NodePool";
import {scheduleManager} from "../../../common/ScheduleManager";
import { BuffFloatLabel } from "../view-item/ItemBuffFloatLabel";

const SHOW_INTERVAL = 600;

class BuffFloatLabelWithTarget {
    private _lastShowTime = 0;
    private _queue: BuffFloatLabel[] = [];
    constructor () {
    }

    show (info: BuffFloatLabel) {
        this._queue.push(info);
        this._checkShow();
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
                    const item = BuffFloatLabelPool.get();
                    item.show(info, () => {
                        BuffFloatLabelPool.put(item);
                    });
                    
                    const id = scheduleManager.scheduleOnce(() => {
                        this._checkShow();
                    }, (SHOW_INTERVAL + 10) / 1000);
                }
            }
        }
    }

    stopAll () {
        this._queue = [];
    }
}

class BuffFloatLabelHelper {
    private _targets = new Map<string, BuffFloatLabelWithTarget>();
    constructor () {
    }

    show (info: BuffFloatLabel) {
        if (!this._targets.has(info.parent.uuid)) {
            this._targets.set(info.parent.uuid, new BuffFloatLabelWithTarget());
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

const buffFloatLabelHelper = new BuffFloatLabelHelper();

export default buffFloatLabelHelper;