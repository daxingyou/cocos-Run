import { BATTLE_STATE, TIME_TRIGGER } from "../../../app/AppEnums";
import { EventInfo, OneActionInfo } from "../../BattleType";
import { ResultData } from "../../CSInterface";
import BattleLogic from "../BattleLogic";
import BattleStateControl from "./BattleStateControl";

export default class BaseState {
    protected battleLogic: BattleLogic = null;
    protected stateCtrl: BattleStateControl = null;
    protected currAction: OneActionInfo = null;

    constructor (stateCtrl: BattleStateControl, battleLogic: BattleLogic) {
        this.stateCtrl = stateCtrl;
        this.battleLogic = battleLogic;
    }

    init (para?: any) {
        this.enter(para);
    }

    deInit () {
        this.leave();
    }

    process (cmd: string, args: any) {

    }

    setCurrMainAction (curr: OneActionInfo) {
        this.currAction = curr;
    }

    protected gotoState (state: BATTLE_STATE) {
        this.doWork(this, () => {
            this.battleLogic.clearWorks();
            if (!this.battleLogic.checkGameEnd()) {
                this.stateCtrl.gotoState(state);
            } else {
                this.stateCtrl.gotoState(BATTLE_STATE.BATTLE_END);
            }
        }, false, 'gotoState');
    }

    protected setTimePoint (currTime: TIME_TRIGGER, paras: EventInfo, toHead: boolean = false) {
        this.doWork(this, () => {
            let triggerRes: ResultData[] = [];
            this.battleLogic.setTimePoint(currTime, paras, triggerRes);
            this.battleLogic.addResultList(triggerRes);
        }, toHead, `setTimePoint${TIME_TRIGGER[currTime]}`);
    }

    protected doWork (target: BaseState, callback: () => void, toHead?: boolean, name = 'default') {
        this.battleLogic.addStepWork(target, callback, toHead, name);
    }

    protected enter (para?: any) {}
    protected leave () {}
}
