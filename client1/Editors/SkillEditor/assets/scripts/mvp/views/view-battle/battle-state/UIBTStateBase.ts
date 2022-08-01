import { BATTLE_STATE } from "../../../../app/AppEnums";
import { logger } from "../../../../common/log/Logger";
import { ViewBaseComponent } from "../../../../common/components/ViewBaseComponent";
import BattleScene from "../../view-scene/BattleScene";
import UIBTStateCtrl from "../UIBTStateCtrl";

const {ccclass, property} = cc._decorator;

@ccclass
export default class UIBTStateBase extends ViewBaseComponent {
    stateName: BATTLE_STATE = null;

    protected _valid: boolean           = false;
    protected _game: BattleScene        = null;
    private _stateCtrl: UIBTStateCtrl   = null;

    init(stateCtrl: UIBTStateCtrl, game: BattleScene) {
        this._stateCtrl = stateCtrl;
        this._game = game;
        this.node.active = false;
    }

    deInit() {
        this.leave();
    }

    enter() {
        logger.log(`ui-${this.stateName}`, `whenEnter`);
        this.node.active = true;
        this.whenEnter();
    }

    leave() {
        logger.log(`ui-${this.stateName}`, `whenLeave`);
        this.node.active = false;
        this.whenLeave();
    }

    checkStateFinish (): boolean {
        return  true;
    }

    protected whenEnter() {
    }
    protected whenLeave() {
    }
    protected whenProcess(cmd?: any, para?: any) {
    }
}