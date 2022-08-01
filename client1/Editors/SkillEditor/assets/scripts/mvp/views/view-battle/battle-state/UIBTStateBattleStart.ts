import { BATTLE_STATE } from "../../../../app/AppEnums";
import { eventCenter } from "../../../../common/event/EventCenter";
import { battleEvent } from "../../../../common/event/EventData";
import { logger } from "../../../../common/log/Logger";
import { ItemResultData } from "../../../../game/BattleType";
import { csCmd } from "../../../../game/CS";
import { optManager } from "../../../operations/OptManager";
import UIBTStateBase from "./UIBTStateBase";

const {ccclass, property} = cc._decorator;

@ccclass
export default class UIBTStateBattleStart extends UIBTStateBase {
    stateName: BATTLE_STATE = BATTLE_STATE.BATTLE_START;
    
    whenEnter() {
        eventCenter.register(battleEvent.EFFECT_EVENT, this, this._processEffectResult)
    }

    whenLeave() {
        eventCenter.unregisterAll(this);
    }

    whenProcess() {

    }

    private _processEffectResult (cmd: any, res: ItemResultData[], seq: number) {
        logger.log("[UIBTStateBattleStart] Receive EffectResult", res);
        this._game.effAnimCtrl.process(res, ()=> {
            optManager.battleUIOpt.finishCurrMsg(seq);
        })
    }

}