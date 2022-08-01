
import { BATTLE_STATE, TIME_TRIGGER } from "../../../app/AppEnums";
import { csCmd, EffectResultNotify } from "../../CS";
import BaseState from "./BaseState";

export default class BTStateBattleStart extends BaseState  {
    
    enter () {
        this.stateCtrl.clockCtrl.prepareTimer();
        let initTimer = this.stateCtrl.clockCtrl.getCurrInfo();
        this.battleLogic.fire(csCmd.BATTLE_START_NOTIFY, {
            timer: initTimer
        });

        this.setTimePoint(TIME_TRIGGER.BATTLE_START, {});

        this.doWork(this, () => {
            let resultList = this.battleLogic.getResultList();
            let effectNotify: EffectResultNotify = {
                Results: resultList
            }
            this.battleLogic.fire(csCmd.EFFECT_RESULT_NOTIFY, effectNotify);
            this.battleLogic.clearResultList();
        }, false, 'BATTLE_START_BUFF_RESULT_NOTIFY');


        this.gotoState(BATTLE_STATE.IDLE);
    }

    leave () {
        this.stateCtrl.clockCtrl.onBegin();
    }
}