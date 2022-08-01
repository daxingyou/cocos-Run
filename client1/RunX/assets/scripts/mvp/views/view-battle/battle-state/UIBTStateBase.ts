import { BATTLE_STATE } from "../../../../app/BattleConst";
import { logger } from "../../../../common/log/Logger";
import BattleScene from "../../view-scene/BattleScene";
import UIBTStateCtrl from "../UIBTStateCtrl";
import { eventCenter } from "../../../../common/event/EventCenter";
import { battleEvent } from "../../../../common/event/EventData";

const {ccclass, property} = cc._decorator;

@ccclass
export default class UIBTStateBase extends cc.Component {
    stateName: BATTLE_STATE = null;

    protected _valid: boolean           = false;
    protected _game: BattleScene        = null;
    private _stateCtrl: UIBTStateCtrl   = null;
    private _registerAnimSeq: number = 0;

    init(stateCtrl: UIBTStateCtrl, game: BattleScene) {
        this._stateCtrl = stateCtrl;
        this._game = game;
        this.node.active = false;
    }

    deInit() {
        this.leave();
    }

    enter (args?: any, msgSeq?: number, ) {
        logger.log(`ui-${this.stateName}`, `whenEnter`);
        this.node.active = true;
        this.whenEnter(args, msgSeq);
    }

    leave() {
        logger.log(`ui-${this.stateName}`, `whenLeave`);
        this.node.active = false;
        this._registerAnimSeq = 0;
        this.whenLeave();
    }

    protected whenEnter(args?: any, msgSeq?: number, ) {
    }
    protected whenLeave() {
    }
    protected whenProcess(cmd?: any, para?: any) {
    }

    /**
     * @desc 登记动画播放
     * 针对不占用效果处理时间的程序动画，在切换游戏状态时可能还在继续播放，
     * 登记之后可以等到动画播完调用 releaseAnimPlaying后再进行切换游戏状态
     */
     registerAnimation (name: string) {
        // logger.log(`${this.stateName}`, `registerAnimation. name = `, name);
        this._registerAnimSeq++;
    }

    /**
     * @desc 程序动画播放完成后调用
     * 需要和 registerAnimPlaying 配套使用
     */
    releaseAnimation (name: string) {
        // logger.log(`${this.stateName}`, `releaseAnimation. currAnimSeq = ${this._registerAnimSeq}. name = `, name);
        this._registerAnimSeq--;
        if (this._registerAnimSeq <= 0) {
            this._registerAnimSeq = 0;
            eventCenter.fire(battleEvent.STATE_ANIM_FINISH);
        }
    }

    /**
     * @desc 当切换游戏状态时，检测是否还有登记中的动画在播放
     */
    checkStateFinish (): boolean {
        return this._registerAnimSeq == 0;
    }
}