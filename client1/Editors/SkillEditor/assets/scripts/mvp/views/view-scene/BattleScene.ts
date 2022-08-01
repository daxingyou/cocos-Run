import { BATTLE_STATE } from "../../../app/AppEnums";
import { eventCenter } from "../../../common/event/EventCenter";
import { battleEvent } from "../../../common/event/EventData";
import guiManager from "../../../common/GUIManager";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { optManager } from "../../operations/OptManager";
import UIBTRoleCtrl from "../view-battle/UIBTRoleCtrl";
import UIBTStateCtrl from "../view-battle/UIBTStateCtrl";
import UITimerCtrl from "../view-battle/UITimerCtrl";
import { BattleStartNotify, csCmd } from "../../../game/CS";
import EffectAnimManager from "../view-battle/EffectAnimManager";
import BattleUiController from "../view-battle/BattleUiController";
import BattlePrepareView from "./BattlePrepareView";

const { ccclass, property } = cc._decorator;

@ccclass
export default class BattleScene extends ViewBaseComponent {
    @property(UITimerCtrl) timerCtrl: UITimerCtrl = null;
    @property(UIBTStateCtrl) btStateCtrl: UIBTStateCtrl = null;
    @property(UIBTRoleCtrl) heroCtrl: UIBTRoleCtrl = null;
    @property(UIBTRoleCtrl) monsterCtrl: UIBTRoleCtrl = null;
    @property(BattleUiController) uiController: BattleUiController = null;

    private _effAnimCtrl: EffectAnimManager = null;
    private _prepareView: BattlePrepareView = null;

    onInit() {
        eventCenter.unregisterAll(this);
        eventCenter.register(battleEvent.BATTLE_START, this, this._whenBattleStart);
        eventCenter.register(battleEvent.ROUND_START, this, this._whenRoundStart);
        eventCenter.register(battleEvent.CHANGE_IDLE, this, this._whenGoIdleState);
        eventCenter.register(battleEvent.BATTLE_END, this, this._whenBattleEnd);

        if (this._prepareView) {
            this._prepareView.onInit(this);
        } else {
            this.stepWork.addTask((callback: Function) => {
                this._showPrepareView(callback);
            })
        }

        this.timerCtrl.init();
        this.uiController.init();
        this.btStateCtrl.init(this);
        this.heroCtrl.init(this);
        this.monsterCtrl.init(this);

        optManager.battleUIOpt.registerBattle();

        this._effAnimCtrl = new EffectAnimManager();
    }

    deInit() {
        this.btStateCtrl.deInit();
        this.timerCtrl.deInit();
        this.heroCtrl.deInit();
        this.monsterCtrl.deInit();
        this._effAnimCtrl.deInit();

        this._effAnimCtrl = null;
        optManager.battleUIOpt.unRegisterBattle();
        if (this._prepareView)
            this._prepareView.deInit();
    }

    onRelease() {
        this.node.stopAllActions();
        eventCenter.unregisterAll(this);
        this.deInit();
        this._prepareView = null;
        this.releaseSubView();
    }

    onClickLeaveGame() {
        guiManager.loadScene('MainScene');
    }

    onClickRestart() {
        this.deInit();
        this.onInit();
    }

    prepareGameBegin() {
        // this.deInit();
        // this.onInit();
        // optManager.battleUIOpt.sendGame(csCmd.REQ_BATTLE_READY);
    }

    get effAnimCtrl() {
        return this._effAnimCtrl;
    }

    private _showPrepareView(loadCallBack: Function) {
        this.loadSubView("BattlePrepareView", this)
            .then((view) => {
                // @ts-ignore
                this._prepareView = view;
                loadCallBack();
            });
    }

    private _whenBattleStart(cmd: any, notify: BattleStartNotify) {
        let timerInfo = notify.timer;
        this.timerCtrl.initTimer(timerInfo);
        this._effAnimCtrl.init(this);

        this.heroCtrl.battleBegin();
        this.monsterCtrl.battleBegin();
        this.uiController.battleBegin();

        this.btStateCtrl.gotoState(BATTLE_STATE.BATTLE_START);
    }

    private _whenRoundStart() {
        this.btStateCtrl.gotoState(BATTLE_STATE.ACTION_ROUND);
    }

    private _whenGoIdleState() {
        this.btStateCtrl.gotoState(BATTLE_STATE.IDLE);
    }

    private _whenBattleEnd() {
        this.btStateCtrl.gotoState(BATTLE_STATE.BATTLE_END);
    }

}
