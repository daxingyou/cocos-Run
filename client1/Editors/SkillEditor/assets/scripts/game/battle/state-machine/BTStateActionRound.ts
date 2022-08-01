import { TIME_TRIGGER } from "../../../app/AppEnums";
import { csCmd } from "../../CS";
import { dataManager } from "../../data-manager/DataManager";
import BaseState from "./BaseState";

export default class BTStateActionRound extends BaseState  {
    
    // private _currRole: number = -1;

    enter () {
        this.battleLogic.fire(csCmd.ROUND_START_NOTIFY);
        let currRole = this.stateCtrl.clockCtrl.getCurrActionRole();
        let role = dataManager.battleData.getRoleByUid(currRole);
        role && role.whenRoundBegin();
        
        if (role) {
            this.setTimePoint(TIME_TRIGGER.ROUND_START, {currRole: role});
            this.setTimePoint(TIME_TRIGGER.SKILL_ACTION_START, {currRole: role});
        }
    }

    leave () {
        let currRole = this.stateCtrl.clockCtrl.getCurrActionRole();
        let role = dataManager.battleData.getRoleByUid(currRole);

        let currAction = this.currAction;
        
        // 行动者回去之后
        this.setTimePoint(TIME_TRIGGER.ROLE_ACTION_FINISH, {currRole: role, currAction: currAction});

        this.currAction = null;
        role && role.whenRoundEnd();

        this.setTimePoint(TIME_TRIGGER.ROUND_END, {currRole: role});

        if (currRole) {
            this._finishAction(currRole);
        }
    }

    private _finishAction (roldUid: number) {
        this.stateCtrl.clockCtrl.roleFinishAct(roldUid);
    }

}