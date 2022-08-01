import { BATTLE_STATE } from "../../../app/BattleConst";
import { eventCenter } from "../../../common/event/EventCenter";
import { battleEvent } from "../../../common/event/EventData";
import { logger } from "../../../common/log/Logger";
import { ItemResultData } from "../../../app/BattleType";
import BattleScene from "../view-scene/BattleScene";
import UIBTStateBase from "./battle-state/UIBTStateBase";

const { ccclass, property } = cc._decorator;

interface StateInfo {
    stateName: string,
    stateResults: ItemResultData[],
    msgSeq: number,
    args: any
}

@ccclass
export default class UIBTStateCtrl extends cc.Component {
    @property([UIBTStateBase]) battleState: UIBTStateBase[] = [];

    private _willGotoState: StateInfo = null;
    private _currIndex: number = -1;

    init(game: BattleScene) {
        this.battleState.forEach(element => {
            element.init(this, game);
        });
        eventCenter.register(battleEvent.STATE_ANIM_FINISH, this, this._whenStateFinish);
    }

    deInit() {
        this.battleState.forEach(element => {
            element.deInit();
        });
        this._willGotoState = null;
        this._currIndex = -1;
        eventCenter.unregisterAll(this);
    }

    enter() {
        if (this.battleState[this._currIndex]) {
            this.battleState[this._currIndex].enter();
        }
    }

    currStat(): UIBTStateBase {
        return this.battleState[this._currIndex];
    }

    gotoState(stateName: string, args: any, seq?: number) {
        if (this.battleState[this._currIndex]) {
            if (!this.battleState[this._currIndex].checkStateFinish()) {
                logger.log("UIBTStateCtrl, amination is take too long, wait for finish")
                this._willGotoState = {
                    stateName: stateName,
                    stateResults: [],
                    msgSeq: seq,
                    args: args
                }
                return;
            } else {
                this.battleState[this._currIndex].leave();

                if (this.battleState[this._currIndex].stateName == BATTLE_STATE.BATTLE_END) {
                    // 如果战斗结束就不会进入下一个state了
                    this._currIndex = -1
                    return
                }
            }
        }

        for (let i = 0; i < this.battleState.length; i++) {
            if (this.battleState[i].stateName == stateName) {
                this._currIndex = i;
                this.battleState[i].enter(args, seq);
            }
        }
    }

    private _whenStateFinish() {
        if (this._willGotoState) {
            let currStat = this.battleState[this._currIndex];
            if (currStat) {
                if (!currStat.checkStateFinish()) {
                    return;
                } else {
                    currStat.leave();
                }
            }

            for (let i = 0; i < this.battleState.length; i++) {
                if (this.battleState[i].stateName == this._willGotoState.stateName) {
                    this._currIndex = i;
                    this.battleState[i].enter(
                        // this._willGotoState.stateResults, 
                        this._willGotoState.args,
                        this._willGotoState.msgSeq,
                    );
                    break;
                }
            }
            this._willGotoState = null;
        }
    }
}