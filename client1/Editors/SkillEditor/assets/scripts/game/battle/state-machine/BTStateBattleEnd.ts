import { eventCenter } from "../../../common/event/EventCenter";
import { modelManager } from "../../../mvp/models/ModeManager";
import { csCmd } from "../../CS";
import BaseState from "./BaseState";

export default class BTStateBattleEnd extends BaseState {

    enter() {
        this.battleLogic.fire(csCmd.BATTLE_END_NOTIFY);
        this.stateCtrl.gameEnd();
        this.battleLogic.gameEnd();

        // 过关 增加关卡数据
        modelManager.userData.addLesson();
    }

    leave() {
        eventCenter.unregisterAll(this);
    }
}