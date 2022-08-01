import { BATTLE_STATE } from "../../../../app/BattleConst";
import { eventCenter } from "../../../../common/event/EventCenter";
import { battleEvent } from "../../../../common/event/EventData";
import { logger } from "../../../../common/log/Logger";
import { ItemResultData } from "../../../../app/BattleType";
import { gamesvr } from "../../../../network/lib/protocol";
import { battleUIOpt } from "../../../operations/BattleUIOpt";
import UIBTStateBase from "./UIBTStateBase";

const { ccclass, property } = cc._decorator;

@ccclass
export default class UIBTStateBattleStart extends UIBTStateBase {
    stateName: BATTLE_STATE = BATTLE_STATE.BATTLE_START;

    whenEnter(notify: gamesvr.IBattleStartResult, seq: number) {
        eventCenter.register(battleEvent.EFFECT_EVENT, this, this._processEffectResult);
    }

    whenLeave() {
        eventCenter.unregisterAll(this);
    }

    whenProcess() {

    }

    private _processEffectResult(cmd: any, res: ItemResultData[], seq: number) {
        logger.log("[UIBTStateBattleStart] Receive EffectResult", res);
        this._game.effAnimCtrl.process(res, () => {
            battleUIOpt.finishCurrMsg(seq);
        })
    }

}