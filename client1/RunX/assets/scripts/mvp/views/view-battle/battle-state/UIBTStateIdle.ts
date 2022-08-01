import { BATTLE_STATE, CLOCK_LEN } from "../../../../app/BattleConst";
import { eventCenter } from "../../../../common/event/EventCenter";
import { gamesvr } from "../../../../network/lib/protocol";
import UIBTStateBase from "./UIBTStateBase";

const {ccclass, property} = cc._decorator;

@ccclass
export default class UIBTStateIdle extends UIBTStateBase {
    stateName: BATTLE_STATE = BATTLE_STATE.IDLE;
    
    whenEnter(notify: gamesvr.IRoundResult, seq: number) {
        let currRole = notify.Timer.RoundRole;
        let currRoleTimerPos = this._game.timerCtrl.getTimerPos(currRole);
        if (currRoleTimerPos >= CLOCK_LEN) {
            this._game.timerCtrl.updateTimer(notify.Timer);
            this._game.btStateCtrl.gotoState(BATTLE_STATE.ACTION_ROUND, notify, seq)
        } else {
            this._game.timerCtrl.timerRun(notify.Timer, ()=> {
                this._game.btStateCtrl.gotoState(BATTLE_STATE.ACTION_ROUND, notify, seq)
            });
        }
    }

    whenLeave() {
        eventCenter.unregisterAll(this);
    }

    whenProcess() {
    }

}