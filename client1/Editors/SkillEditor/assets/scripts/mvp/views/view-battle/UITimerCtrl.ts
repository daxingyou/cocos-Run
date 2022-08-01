import { CLOCK_LEN } from "../../../app/AppConst";
import { TIMER_STATE } from "../../../app/AppEnums";
import { eventCenter } from "../../../common/event/EventCenter";
import { battleEvent } from "../../../common/event/EventData";
import { UpdateTimerNotify } from "../../../game/CS";
import { RoleTimer } from "../../../game/CSInterface";
import ItemTimerRole from "./ItemTimerRole";

const {ccclass, property} = cc._decorator;

@ccclass
export default class UITimerCtrl extends cc.Component {
    @property(cc.Node)      ndTamplate: cc.Node = null;
    @property(cc.Node)      ndInfoRoot: cc.Node = null;
    @property(cc.Node)      ndProgress: cc.Node = null;

    private _currTimer: RoleTimer[] = [];
    private _item: ItemTimerRole[] = [];
    private _state: TIMER_STATE = TIMER_STATE.STOP;

    init () {
        this.node.active = false;
        this._currTimer = null;
        eventCenter.register(battleEvent.VIEW_UPDTAE_TIMER, this, this._updateTimer);
    }

    deInit () {
        this.node.active = false;
        this._item.forEach( _item=> {
            _item.deInit();
            _item.node.removeFromParent();
        })
        this._item = [];
        eventCenter.unregisterAll(this);
    }

    update () {
        if (this._state == TIMER_STATE.MOVING) {
            this._item.forEach( _item => {
               _item.autoMove(this.ndProgress.width);
            })
        }
    }

    initTimer (info: RoleTimer[]) {
        this.node.active = true;
        this._currTimer = info;

        info.forEach(_role => {
            let ndRole = cc.instantiate(this.ndTamplate);
            let item = ndRole.getComponent(ItemTimerRole);
            item.onInit(_role);
            ndRole.active = true;
            this.ndInfoRoot.addChild(ndRole);
            this._item.push(item);
        })

        this._item.forEach( _item => {
            _item.setDistance(0);
        })
        this._state = TIMER_STATE.MOVING;
    }

    private _updateTimer (cmd: number, notify: UpdateTimerNotify) {
        let _info = notify.timer;
        let isMoving = false;
        if (_info) {
           let info = _info;
           let totalDistance = this.ndProgress.width;
           this._item.forEach( _item => {
               info.forEach( _info => {
                   if (_item.uId == _info.roleUid) {
                       _item.updateInfo(_info);
                       let distance = totalDistance * (_info.distance / CLOCK_LEN);
                       if (distance > totalDistance) distance = totalDistance;
                       _item.setDistance(distance);
                       if (_info.state == TIMER_STATE.MOVING) {
                           isMoving = true;
                       }
                   }
               })
           })
        }
        this._state = isMoving? TIMER_STATE.MOVING:TIMER_STATE.STOP;
    }
}
