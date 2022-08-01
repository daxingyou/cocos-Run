import { utils } from "../../../../app/AppUtils";
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
export default class UIBTStateActionRound extends UIBTStateBase {
    stateName: BATTLE_STATE = BATTLE_STATE.ACTION_ROUND;

    private _step: number = 0;
    private _currMsg:{
        msg: gamesvr.IRoundResult;
        seq: number 
    } = null
    private _isRoundEnd: boolean = false;

    whenEnter(args: gamesvr.IRoundResult, msgSeq: number,) {
        this._isRoundEnd = false;
        this._step = 0;
        eventCenter.register(battleEvent.EFFECT_EVENT, this, this._processEffectResult);
        this._currMsg = {msg: args, seq: msgSeq};
        battleUIOpt.processEffectRes(args.RoundStartRes)
    }

    whenLeave() {
        this._step = 0;
        this._currMsg = null;
        this.unscheduleAllCallbacks();
        eventCenter.unregisterAll(this);
    }

    private _processEffectResult(cmd: any, res: ItemResultData[], seq: number) {
        logger.log("[UIBTStateActionRound] Receive EffectResult", res);
        const processNext = ()=> {
            if(!this._currMsg) {
                battleUIOpt.finishCurrMsg(seq);
                return;
            }
            let msg = this._currMsg.msg;
            switch (this._step) {
                case 0: {
                    this._step++;
                    battleUIOpt.processEffectRes(utils.deepCopy(msg.ActionRes));
                    break;
                }
                case 1: {
                    this._step++;
                    battleUIOpt.processEffectRes(utils.deepCopy(msg.RoundEndRes));
                    break;
                }
                default: {
                    this._game.timerCtrl.backBegin(msg.Timer.RoundRole);
                    battleUIOpt.finishCurrMsg(seq);
                    break;
                }
            }
        }

        this._game.effAnimCtrl.process(res, () => {
            if(this._step >= 2) {
                this._allRoleMoveBack(seq, ()=> {
                    processNext();
                });
            } else {
                processNext();
            }
            // this._allRoleMoveBack(seq, ()=> {
            //     processNext();
            // });
        })
    }

    private _allRoleMoveBack (seq: number, moveBackHandler: Function) {
        let moveBackTime = this._game.heroCtrl.onAllMoveBack();
        moveBackTime = Math.max(moveBackTime, this._game.monsterCtrl.onAllMoveBack())+0.1;
        this.scheduleOnce(()=> {
            moveBackHandler && moveBackHandler();
        }, moveBackTime)
    }
}