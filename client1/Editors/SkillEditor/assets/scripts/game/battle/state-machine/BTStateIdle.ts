
import { csCmd } from "../../CS";
import BaseState from "./BaseState";

export default class BTStateIdle extends BaseState  {
    
    enter () {
        let currRole = this.stateCtrl.clockCtrl.getCurrActionRole();
        if (currRole) {
            this.stateCtrl.activateRoleRound();
        } else {
            this.stateCtrl.clockCtrl.onResume();
        }

        this.battleLogic.fire(csCmd.CHANGE_IDLE_STATE_NOTIFY);
    }

    leave () {
        
    }
}