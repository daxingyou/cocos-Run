import { PVE_MODE } from "../../../app/AppEnums";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { eventCenter } from "../../../common/event/EventCenter";
import { battleEvent } from "../../../common/event/EventData";
import { pveData } from "../../models/PveData";
import { pvpData } from "../../models/PvpData";
import { battleUIOpt } from "../../operations/BattleUIOpt";

const { ccclass, property } = cc._decorator;


@ccclass
export default class BattleSettingView extends ViewBaseComponent {
    @property(cc.Node) retreatBtn: cc.Node = null;
    @property(cc.Node) exitBtn: cc.Node = null;

    private _replay: Function = null;
    private _leave: Function = null;
    private _exit: Function = null;

    onInit (replay: Function, leave: Function, exit: Function) {
        this._leave = leave;
        this._replay = replay;
        this._exit = exit;

        let isShowRetreatBtn: boolean = true;
        if (!pvpData.pvpConfig || pveData.pveConfig && 
            (pveData.isPVEMode(PVE_MODE.RESPECT) || pveData.isPVEMode(PVE_MODE.PURGATORY))) {
            isShowRetreatBtn = false;
        }

        this.retreatBtn.active = isShowRetreatBtn;
        this.exitBtn.active = pvpData.isReplay;

        eventCenter.register(battleEvent.CLOSE_BATTLE_POP, this, this.closeView);
    }

    onRelease () {
        eventCenter.unregisterAll(this);
    }

    // 重新播放
    onClickRestart () {
        this._doCloseView();
        this._replay && this._replay();
    }

    // 回到备战界面
    onClickBackToPrepare () {
        this._doCloseView();
        this._leave && this._leave();
    }

    // 关闭窗口
    onClickContinue () {
        this._doCloseView();
    }

    // 回放界面才有的功能，直接退出战斗
    onClickExit () {
        this._doCloseView();
        this._exit && this._exit();
    }

    // 退出去之后继续播放
    private _doCloseView () {
        battleUIOpt.continue()
        this.closeView();
    }
    
}