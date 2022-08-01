import { BATTLE_STATE } from "../../../../app/AppEnums";
import { eventCenter } from "../../../../common/event/EventCenter";
import UIBTStateBase from "./UIBTStateBase";

const {ccclass, property} = cc._decorator;

@ccclass
export default class UIBTStateIdle extends UIBTStateBase {
    stateName: BATTLE_STATE = BATTLE_STATE.IDLE;
    
    whenEnter() {

    }

    whenLeave() {
        eventCenter.unregisterAll(this);
    }

    whenProcess() {
    }

}