import { BATTLE_STATE } from "../../../app/AppEnums";
import { logger } from "../../../common/log/Logger";
import { csCmd } from "../../CS";
import BattleLogic from "../BattleLogic";
import BaseState from "./BaseState";
import BTStateActionRound from "./BTStateActionRound";
import BTStateBattleEnd from "./BTStateBattleEnd";
import BTStateBattleStart from "./BTStateBattleStart";
import BTStateIdle from "./BTStateIdle";
import ClockControl from "./ClockControl";

export default class BattleStateControl {

    private _clockCtrl: ClockControl = null;
    private _battleLogic: BattleLogic = null;

    private _currState: BaseState = null;
    private _battleStart: BaseState = null;
    private _actionRound: BaseState = null;
    private _idleState: BaseState = null;
    private _battleEnd: BaseState = null;

    init (root: BattleLogic) {
        this._battleLogic = root;

        this._battleStart = new BTStateBattleStart(this, this._battleLogic);
        this._actionRound = new BTStateActionRound(this, this._battleLogic);
        this._idleState = new BTStateIdle(this, this._battleLogic);
        this._battleEnd = new BTStateBattleEnd(this, this._battleLogic);
        this._clockCtrl = new ClockControl(this);
    }

    deInit () {

    }

    gameEnd () {
        this._clockCtrl.onGameEnd();
    }

    gotoState (state: BATTLE_STATE, para?: any) {
        if (this._battleLogic.currState == state) {
            logger.warn('BattleState', `now is in same battle state. state = ${state}`);
            return;
        }
        logger.log('BattleState', `go to new state. state = ${state}`);

        if (this._currState) {
            this._currState.deInit();
            this._currState = null;
        }
        switch (state) {
            case BATTLE_STATE.BATTLE_START:
                this._currState = this._battleStart;
                break;

            case BATTLE_STATE.ACTION_ROUND:
                this._currState = this._actionRound;
                break;

            case BATTLE_STATE.IDLE:
                this._currState = this._idleState;
                break;

            case BATTLE_STATE.BATTLE_END:
                this._currState = this._battleEnd;
                break;
            default:
                break;
        }

        this._battleLogic.currState = state;
        if (this._currState) {
            this._currState.init(para);
        }
        this.asyncClockData();
    }

    activateRoleRound () {
        this.gotoState(BATTLE_STATE.ACTION_ROUND);
    }

    get clockCtrl () {
        return this._clockCtrl;
    }

    get currState () {
        return this._currState;
    }
    
    asyncClockData () {
        let curr = this._clockCtrl.getCurrInfo();
        this._battleLogic.fire(csCmd.UPDTAE_TIMER_NOTIFY, {
            timer: curr
        });
    }

}