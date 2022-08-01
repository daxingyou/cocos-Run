import { TIMER_STATE } from "../../../app/BattleConst";
import { eventCenter } from "../../../common/event/EventCenter";
import { battleEvent } from "../../../common/event/EventData";
import { gamesvr } from "../../../network/lib/protocol";
import ItemTimerRole from "./ItemTimerRole";

const {ccclass, property} = cc._decorator;
interface NextInfo {
    handler: Function,
    timer: gamesvr.ITimerInfo
}

const BOMB_ID = 19999;

@ccclass
export default class UITimerCtrl extends cc.Component {
    @property(cc.Node)      ndTamplate: cc.Node = null;
    @property(cc.Node)      ndInfoRoot: cc.Node = null;
    @property(cc.Node)      ndProgress: cc.Node = null;

    private _item: ItemTimerRole[] = [];
    private _state: TIMER_STATE = TIMER_STATE.STOP;
    private _next: NextInfo = null;

    init () {
        this.node.active = false;
        eventCenter.register(battleEvent.ROLE_STATE_CHANGE, this, this._updateRoleState);
    }

    deInit () {
        this.node.active = false;
        this._next = null;
        this._item.forEach( _item=> {
            _item.deInit();
            _item.node.removeFromParent();
        })
        this._item = [];
        eventCenter.unregisterAll(this);
        this.unscheduleAllCallbacks();
    }

    update () {
        if (this._state == TIMER_STATE.MOVING) {
            let isFinish = false;
            this._item.forEach( _item => {
                if (_item.uiDistance >= this.ndProgress.width) isFinish = true
            })
            if (isFinish) {
                if (this._next) {
                    this._next.timer && this.updateTimer(this._next.timer);
                    this._next.handler && this._next.handler();
                    this._state = TIMER_STATE.STOP;
                    this._next = null;
                }
                return;
            }
            this._item.forEach( _item => {
               _item.autoMove(this.ndProgress.width);
            })
        }
    }

    initTimer (info: gamesvr.ITimerInfo) {
        if (!info) return;
        this.node.active = true;

        if (info && info.RoleTimer) {
            let roles = info.RoleTimer;
            roles.forEach(_role => {
                let ndRole = cc.instantiate(this.ndTamplate);
                let item = ndRole.getComponent(ItemTimerRole);
                item.onInit(_role);
                ndRole.active = true;
                this.ndInfoRoot.addChild(ndRole);
                this._item.push(item);
                ndRole.zIndex = _role.Speed
            })
        }
      
        this._item.forEach( _item => {
            _item.uiDistance = 0;
        })
        this._state = TIMER_STATE.STOP;
    }

    addTimer(info: gamesvr.ITimerInfo) {
        if (!info) return;
        if (info && info.RoleTimer) {
            for(let i = 0; i < info.RoleTimer.length; ++i) {
                let timer = this.getItemByRoleId(info.RoleTimer[i].UID);
                if(!timer) {
                    let ndRole = cc.instantiate(this.ndTamplate);
                    let item = ndRole.getComponent(ItemTimerRole);
                    item.onInit(info.RoleTimer[i]);
                    ndRole.active = true;
                    this.ndInfoRoot.addChild(ndRole);
                    this._item.push(item);
                }
            }
        }
    }

    stopAll () {
        this._state = TIMER_STATE.STOP
    }

    getTimerPos (Uid: number) {
        for (let i =0; i < this._item.length; i++) {
            if (this._item[i].uId == Uid) {
                return this._item[i].uiDistance
            }
        }
        return 0;
    }

    private _updateRoleState (cmd: number, msg: gamesvr.IRoleDeadResult) {
        if (!msg) return
        let roleUid = msg.RoleUID;
        let item = this._getItem(roleUid);
        if (item)
            item.state = msg.RoleState;
    }

    private _getItem (uId: number) {
        for (let i = 0; i< this._item.length; i++) {
            if (this._item[i] && this._item[i].uId == uId) 
                return this._item[i]
        }
        return null
    }

    updateTimer (info: gamesvr.ITimerInfo) {
        if(this._state != TIMER_STATE.STOP) {
            if (!info) return;
            this.node.active = true;
    
            if (info && info.RoleTimer) {
                const findInfo = (uid: number)=> {
                    for (let i = 0; i < info.RoleTimer.length; i++) {
                        if (info.RoleTimer[i].UID == uid) return info.RoleTimer[i]
                    }
                    return null
                }
    
                this._item.forEach( _item => {
                    let find = findInfo(_item.uId);
                    if (find) _item.updateTimer(find, info.RoundRole)
                })
            }
        }
    }

    timerRun (notify: gamesvr.ITimerInfo, handler: Function) {
        this._next = {
            handler: handler,
            timer: notify
        }
        this._state = TIMER_STATE.MOVING;
    }

    backBegin (uid: number) {
        let item = this._getItem(uid);
        if (item) {
            item.uiDistance = 0;
            item.node.scale = 1;
        }

    }

    playBombBoom(endFunc: Function) {
        const bomb = this.getItemByRoleId(BOMB_ID);
        if(bomb) {
            bomb.showBoom(endFunc);
        } else {
            endFunc && endFunc();
        }
    }

    getItemByRoleId(roleId: number): ItemTimerRole {
        let timerItem = this._item.find(_t => {
            return _t.uId == roleId;
        });
        return timerItem;
    }
}
