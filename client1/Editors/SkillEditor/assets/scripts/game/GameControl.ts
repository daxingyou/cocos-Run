import BattleLogic from "./battle/BattleLogic";
import { dataManager } from "./data-manager/DataManager";
import { dataOptManager } from "./data-operation/DataOperation";

class GameControl {
    battleLogic: BattleLogic = null;

    init () {
        dataManager.init();
        dataOptManager.init();
    }

    deInit () {
    }

    // 准备进入战斗
    enterBattleInit () {
        if (this.battleLogic) {
            this.battleLogic.deInit();
            this.battleLogic = null;
        }
        this.battleLogic = new BattleLogic();
        this.battleLogic.init();
    }

    leaveBattleRelease () {
        if (this.battleLogic) {
            this.battleLogic.deInit();
            this.battleLogic = null;
        }
    }

    // 转发层
    processBattleMsg (cmd: string, args?: any) {
        if (this.battleLogic)
            this.battleLogic.process(cmd, args);
    }
}

export let gameControl = new GameControl();