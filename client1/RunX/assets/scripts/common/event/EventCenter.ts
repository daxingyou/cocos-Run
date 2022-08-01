/*
 * @Author: fly
 * @Date: 2021-03-16 13:57:35
 * @LastEditTime: 2022-05-20 15:54:02
 * @Description: 事件中心
 */

import { logger } from "../log/Logger";
import { UI_TYPE } from "../UIConfig";

interface CallBackTarget {
    target: object,
    callback: Function,
}

class EventCenter {
    private _handlers: {[key: string]: CallBackTarget[]} = null;
    private _currHandlers: {[key: string]: CallBackTarget[]} = null;

    constructor() {
        this._handlers = {};
        this._currHandlers = {};
    }

    private _exist(handles: CallBackTarget[], target: object): number {
        let index: number = -1;
        for (let i = 0; i < handles.length; i++) {
            if (handles[i].target == target) {
                index = i;
            }
        }
        return index;
    }

    private _removeOne(handles: CallBackTarget[], target: object): boolean {
        let index = this._exist(handles, target);
        if (index >= 0) {
            handles.splice(index, 1);
            return true;
        } else {
            return false;
        }
    }

    register(eventid: number|string, target: object, callBack: Function) {
        let eventId = (typeof eventid == 'number') ? eventid.toString() : eventid;
        let handlers: CallBackTarget[] = this._handlers[eventId] || [];
        this._handlers[eventId] = handlers;

        if (this._exist(handlers, target) == -1) {
            handlers.push({callback: callBack, target: target});
        }
    }

    unregister (eventid: number|string, target: object) {
        if (eventid == null || target == null) {
            logger.error(`EventCenter`, "unregister a null eventid or target. ignore.");
            return;
        }

        let eventId = (typeof eventid == 'number') ? eventid.toString() : eventid;
        let handlers: CallBackTarget[] = this._handlers[eventId];
        if (!handlers) return;

        if (this._removeOne(handlers, target)) {
            let unregEvent: CallBackTarget[] = this._currHandlers[eventId];
            if (unregEvent) {
                this._removeOne(unregEvent, target);
                if (unregEvent.length == 0) {
                    delete this._currHandlers[eventId];
                }
            }
        }

        if (handlers.length == 0) {
            delete this._handlers[ eventid ]
        }
    }

    unregisterAll (target: object) {
        if (target == null) {
            logger.error(`EventCenter`, "unregister all for a null target. ignore.")
            return;
        }

        for (let eventId in this._handlers) {
            this.unregister(eventId, target);
        }
    }

    fire (eventid: string|number, ...params: any[]) {
        if (eventid == null) {
            logger.error(`EventCenter`, "fire a null eventid. ignore.");
            return;
        }

        let eventId: string = (typeof eventid == 'number') ? eventid.toString() : eventid;
        let handlers: CallBackTarget[] = this._handlers[eventId];
        if (handlers == null) return;

        let dispatching: CallBackTarget[] = handlers.slice(0);
        this._currHandlers[eventId] = dispatching;

        for (let i = dispatching.length - 1; i >= 0; --i) {
            let _currEvent: CallBackTarget = dispatching[i];
            if (_currEvent.target && _currEvent.callback) {
                try {
                    let _args: any[] = [];
                    _args.push(eventid);
                    if (params) _args = _args.concat(params);                    
                    _currEvent.callback.apply(_currEvent.target, _args);
                } catch (error) {
                    logger.error('EventCenter', 'fireEvent error = ', error.stack);
                }
            }
        }
        this._currHandlers[eventId] = null;
    }

    /**
     * 判定界面是否存在依赖，因为页面关闭和加载都是异步操作,-
     * ------------------- 如若存在延迟太大导致节点属性更新延迟问题可使用父节点属性判定
     * ------------------- 关闭的页面都从父节点移除了，只存在缓存中
     * @param tar 
     * @returns 
     */
    private _ckTargetHierarchy(tar: object): boolean{
        //@ts-ignore
        let enabledInHierarchy = tar?.enabledInHierarchy, uiInfo = tar?.uiInfo;
        //节点存在viewBaseComp属性
        if (typeof enabledInHierarchy == 'boolean' && !enabledInHierarchy) {
            //  @ts-ignore
            logger.log(`事件系统发送信息 targets.EnableInHierarchy:${enabledInHierarchy}, ${tar.name}}`);
            return uiInfo == UI_TYPE.SCENE;    
        }
        return true
        
    }
}

let eventCenter = new EventCenter();
export {
    EventCenter as default,
    eventCenter
}
