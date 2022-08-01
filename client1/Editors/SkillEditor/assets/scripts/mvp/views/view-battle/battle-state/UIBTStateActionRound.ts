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
export default class UIBTStateActionRound extends UIBTStateBase {
    stateName: BATTLE_STATE = BATTLE_STATE.ACTION_ROUND;
    
    whenEnter() {
        eventCenter.register(battleEvent.EFFECT_EVENT, this, this._processEffectResult)
    }

    whenLeave() {
        eventCenter.unregisterAll(this);
    }

    private _processEffectResult (cmd: any, res: ItemResultData[], seq: number) {
        logger.log("[UIBTStateActionRound] Receive EffectResult", res);
        this._game.effAnimCtrl.process(res, ()=> {
            let currMsg = optManager.battleUIOpt.getMsgList();
           
            if (currMsg && currMsg.length == 0 && optManager.battleUIOpt.getCurrSeq() == seq) {
                optManager.battleUIOpt.finishCurrMsg(seq);
                optManager.battleUIOpt.sendGame(csCmd.REQ_ACTION_FINISH, {});
                eventCenter.unregisterAll(this);
            } else {
                optManager.battleUIOpt.finishCurrMsg(seq);
            }
        })
    }

}