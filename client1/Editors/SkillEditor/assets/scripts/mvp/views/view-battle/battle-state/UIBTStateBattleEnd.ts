import { BATTLE_STATE } from "../../../../app/AppEnums";
import { eventCenter } from "../../../../common/event/EventCenter";
import guiManager from "../../../../common/GUIManager";
import MessageBoxView from "../../view-other/MessageBoxView";
import UIBTStateBase from "./UIBTStateBase";

const {ccclass, property} = cc._decorator;

@ccclass
export default class UIBTStateBattleEnd extends UIBTStateBase {
    stateName: BATTLE_STATE = BATTLE_STATE.BATTLE_END;
    
    whenEnter() {
        // guiManager.showTips("游戏结束");
        guiManager.showMessageBox(this._game.node,
            "游戏结束！选择下一步操作",
            "退 出",
            (msgView: MessageBoxView)=> {
                msgView.closeView();
                this._game.onClickLeaveGame();
            },
            "重 来",
            (msgView: MessageBoxView)=> {
                msgView.closeView();
                this._game.onClickRestart();
            },
            "战斗结束"
             );
    }

    whenLeave() {
        eventCenter.unregisterAll(this);
    }

    whenProcess() {
    }

}