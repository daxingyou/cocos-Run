import { eventCenter } from "../../../common/event/EventCenter";
import BattleScene from "../view-scene/BattleScene";
import UIBTStateBase from "./battle-state/UIBTStateBase";

const { ccclass, property } = cc._decorator;

@ccclass
export default class UIBTStateCtrl extends cc.Component {
    @property([UIBTStateBase])  battleState: UIBTStateBase[] = [];

    private _currIndex: number = -1;

    init (game: BattleScene) {
        this.battleState.forEach(element => {
            element.init(this, game);
        });
    }

    deInit () {
        this.battleState.forEach(element => {
            element.deInit();
        });
        eventCenter.unregisterAll(this);
    }

    enter () {
        if (this.battleState[this._currIndex]) {
            this.battleState[this._currIndex].enter();
        }
    }

    currStat (): UIBTStateBase {
        return this.battleState[this._currIndex];
    }

    gotoState (stateName: string) {
        if (this.battleState[this._currIndex]) {
            if (!this.battleState[this._currIndex].checkStateFinish()) {
                return;
            } else {
                this.battleState[this._currIndex].leave();
            }
        }

        for (let i = 0; i < this.battleState.length; i++) {
            if (this.battleState[i].stateName == stateName) {
                this._currIndex = i;
                this.battleState[i].enter();
            }
        }
    }
}