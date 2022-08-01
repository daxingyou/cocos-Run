import { CLOCK_INTERVAL, CLOCK_LEN } from "../../../app/AppConst";
import { TIMER_STATE } from "../../../app/AppEnums";
import { logger } from "../../../common/log/Logger";
import { RoleTimer } from "../../CSInterface";
import { dataManager } from "../../data-manager/DataManager";
import BattleStateControl from "./BattleStateControl";

export default class ClockControl {
    // 定时器句柄
    private _timerHandler: number = 0;

    constructor (stateCtrl: BattleStateControl) {
        this._stateCtrl = stateCtrl;
    }

    private _stateCtrl: BattleStateControl = null;
    private _roleTimer: RoleTimer[] = [];
    // private _currRole: 

    init () {
  
    }

    deInit () {

    }

    clear () {
        this._roleTimer = [];
        this._clearTimer();
    }

    prepareTimer () {
        this.clear();
        let teams = dataManager.battleData.teams;
        teams.forEach ( _t => {
            _t.roles.forEach( _r => {
                this._roleTimer.push({
                    roleUid: _r.roleUID,
                    distance: 0,
                    currSpeed: _r.speed,
                    state: TIMER_STATE.STOP
                })
            })
        })
    }

    onBegin () {
        this._beginClock();
    }

    private _clearTimer () {
        if (this._timerHandler) {
            clearTimeout(this._timerHandler);
            this._timerHandler = 0;
        }
    }

    private _beginClock () {
        if (this._timerHandler) {
            this._clearTimer();
        }

        this._roleTimer.forEach( _timer => {
            if (_timer.state != TIMER_STATE.DEAD) {
                _timer.state = TIMER_STATE.MOVING
            }
        })

        let nextInterval = this._findNextInterval();
        this._timerHandler = setTimeout(() => {
            this.onTicking(nextInterval);
        }, nextInterval * CLOCK_INTERVAL);

    }

    private _findNextInterval (): number {
        let minTime: number = 10;
        this._roleTimer.forEach( _timer => {
            if (_timer.state != TIMER_STATE.DEAD) {
                let time = (CLOCK_LEN - _timer.distance) / _timer.currSpeed
                if (minTime > time) {
                    minTime = time
                }
            }
        })
        if (minTime < 0) minTime = 0;
        return minTime;
    }

    onTicking (interval: number) {
        let needActiveCnt: number = 0;
        this._roleTimer.forEach( _timer => {
            if (_timer.state != TIMER_STATE.DEAD) {
                _timer.distance += (_timer.currSpeed * interval);
                if ( _timer.distance >= CLOCK_LEN) {
                    needActiveCnt++;
                }
            }
        })

        this._roleTimer.sort((_l, _r)=> {
            if (_l.distance > _r.distance) {
                return -1;
            } else {
                return 1;
            }
        })

        if (needActiveCnt > 0) {
            logger.log("[Clock Control], currActCnt = ", needActiveCnt);

            for (let i = 0; i < this._roleTimer.length; i++) {
                if (i < needActiveCnt) {
                    this._roleTimer[i].state = i == 0? TIMER_STATE.ACTING: TIMER_STATE.WAIT_ACT;
                } else {
                    this._roleTimer[i].state = TIMER_STATE.STOP;
                }
            }
            this.onStop();
        } else {
            this._beginClock();
        }
    }

    onStop () {
        this._clearTimer();
        this._stateCtrl.activateRoleRound();
    }

    onResume () {
        this._beginClock();
    }

    onGameEnd () {
        for (let i = 0; i < this._roleTimer.length; i++) {
            this._roleTimer[i].state == TIMER_STATE.STOP
        }
    }

    getCurrActionRole (): number {
        for (let i = 0; i < this._roleTimer.length; i++) {
            if (this._roleTimer[i].state == TIMER_STATE.ACTING) {
                return this._roleTimer[i].roleUid;
            }
        }
        return 0;
    }

    getCurrInfo (){
        return this._roleTimer;
    }

    roleFinishAct (roleUid: number) {
        let invalidRoleIds: number[] = [];
        
        let currRoles = dataManager.battleData.getSelfTeam().roles;
        currRoles.forEach( _r => {
            if (!_r.isAlive()) invalidRoleIds.push(_r.roleUID);
        })

        currRoles = dataManager.battleData.getOppositeTeam().roles;
        currRoles.forEach( _r => {
            if (!_r.isAlive()) invalidRoleIds.push(_r.roleUID);
        })

        for (let i = 0; i < this._roleTimer.length; i++) {
            let uid = this._roleTimer[i].roleUid;
            if (uid == roleUid && this._roleTimer[i].state == TIMER_STATE.ACTING) {
                this._roleTimer[i].distance = 0;
                this._roleTimer[i].state = TIMER_STATE.STOP;
            }

            if (invalidRoleIds.indexOf(uid) != -1) {
                this._roleTimer[i].state = TIMER_STATE.DEAD;
            }
        }
    }

}