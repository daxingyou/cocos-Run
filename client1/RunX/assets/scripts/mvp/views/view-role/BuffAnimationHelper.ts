import { playBuffAnimation, BUFF_ANIM_TYPE, BuffAnimationOnce } from "./BuffAnimationOnce";
import {scheduleManager} from "../../../common/ScheduleManager";
import { logger } from "../../../common/log/Logger";
import ItemRole from "../view-item/ItemRole";
import { gamesvr } from "../../../network/lib/protocol";

enum BUFF_ANIMATION_TYPE {
    GET = 0,
    ACTIVE,
    DUMMY,
}

interface BuffAnimInfo {
    type: BUFF_ANIMATION_TYPE;
    role: ItemRole;
    buffId: number,
    buffUID: number;
    buffInfo?: gamesvr.IBuffResult;
    onFinish: Function;
}

const ANIM_INTERVAL = 0.3;

class BuffAnimationWithTarget {
    private _animQueue: BuffAnimInfo[] = [];
    private _lastTime: number = ANIM_INTERVAL;
    private _valid = true;
    private _scheduleId = 0;

    private _processUIDs = new Map<number, BuffAnimationOnce>();

    constructor () {
    }

    init () {
        if (this._scheduleId) {
            scheduleManager.unschedule(this._scheduleId);
            this._scheduleId = 0;
        }

        this._lastTime = ANIM_INTERVAL;
        this._animQueue = [];
        this._valid = true;
        this._scheduleId = scheduleManager.schedule(this._checkPlay.bind(this), 0);
    }

    play (info: BuffAnimInfo) {
        if (!this._valid) {
            logger.error(`BuffAnimtionHelper`, `maybe not init. pls check`);
            this.init();
        }

        this._animQueue.push(info);
        this._checkPlay(0);
    }

    stopAll () {
        this._animQueue.forEach(v => {
            v.onFinish();
        });

        this._processUIDs.forEach(v => {
            if (v) {
                v.stop();
            }
        });
        this._processUIDs.clear();
        
        this._animQueue = [];
        this._valid = false;
        this._lastTime = ANIM_INTERVAL;
        if (this._scheduleId > 0) {
            scheduleManager.unschedule(this._scheduleId);
            this._scheduleId = 0;
        }
    }

    private _checkPlay (dt: number) {
        const getNextInfo = (): number => {
            let ret = -1;
            this._animQueue.some((v, idx) => {
                if (this._processUIDs.has(v.buffUID)) {
                    return false;
                }
                ret = idx;
                return true;
            })
            return ret;
        }

        this._lastTime += dt;
        if (this._animQueue.length > 0 && this._lastTime >= ANIM_INTERVAL) {
            const nextIdx = getNextInfo();
            if (nextIdx >= 0) {
                const info = this._animQueue[nextIdx];
                this._animQueue.splice(nextIdx, 1);
                this._processUIDs.set(info.buffUID, null);
                this._lastTime = 0;

                if (info.type === BUFF_ANIMATION_TYPE.GET) {
                    this._playGet(info);
                } else if (info.type === BUFF_ANIMATION_TYPE.ACTIVE) {
                    this._playActive(info);
                } else if (info.type === BUFF_ANIMATION_TYPE.DUMMY) {
                    this._playDummyBuff(info);
                }
            }
        }
    }

    private _playDummyBuff (info: BuffAnimInfo) {
        this._processUIDs.delete(info.buffUID);
        info.onFinish();
    }

    private _playGet (info: BuffAnimInfo) {
        // logger.log(`BuffAnimationHelper`, `step1 info Id = ${info.buffId}, uid = ${info.buffUID}`);
        const playStartAnim = (info: BuffAnimInfo, onComplete: Function) => {
            if (!this._valid) {
                onComplete();
                return;
            }

            onComplete();
        }

        const playFlyAnim = (info: BuffAnimInfo, onComplete: Function) => {
            if (!this._valid) {
                onComplete();
                return;
            }

            // logger.log(`BuffAnimationHelper`, `step3 info Id = ${info.buffId}, uid = ${info.buffUID}`);
            const buffInfo = info.buffInfo;
            const target = info.role;
            if (buffInfo && buffInfo.BuffID && cc.isValid(target)) {
                // TODO 暂时屏蔽 改成到时候获得buff 会谈提示问题
                
                // const node = target.node;
                // target.buffListCtrl.preAddBuff(buffInfo);
                // let from = node.convertToWorldSpaceAR(cc.v2(0, target.node.height * 0.4));
                // const anim = playBuffAnimation({
                //     buffId: buffInfo.BuffID,
                //     buffUID: buffInfo.BuffUID,
                //     type: BUFF_ANIM_TYPE.GET,
                //     parent: node,
                //     from: cc.v3(from.x, from.y),
                //     to: target.buffListCtrl.getBuffWorldPosition(buffInfo.BuffUID),
                //     // target: target,
                //     complete: () => {
                //         onComplete();
                //     }
                // });
                // this._processUIDs.set(info.buffUID, anim);
                onComplete();
            } else {
                onComplete();
            }
        }

        const buffList = info.role.buffListCtrl;
        if (buffList.getBuff(info.buffUID)) {
            this._processUIDs.delete(info.buffUID);
            info.onFinish();
        } else {
            playStartAnim(info, () => {
                playFlyAnim(info, () => {
                    this._processUIDs.delete(info.buffUID);
                    info.onFinish();
                })
            });
        }
    }

    private _playActive (info: BuffAnimInfo) {
        if (!this._valid) {
            this._processUIDs.delete(info.buffUID);
            info.onFinish();
            return;
        }

        const itemBuff = info.role.buffListCtrl.getBuff(info.buffUID);
        if (itemBuff) {
            let position = itemBuff.node.convertToWorldSpaceAR(cc.Vec3.ZERO);
            const anim = playBuffAnimation({
                buffId: info.buffId,
                buffUID: info.buffUID,
                type: BUFF_ANIM_TYPE.ACTIVATE,
                parent: itemBuff.node,
                role: info.role.node,
                position: cc.v3(position.x, position.y),
                buffResult: info.buffInfo,
                complete: () => {
                    this._processUIDs.delete(info.buffUID);
                    info.onFinish();
                }
            });
            this._processUIDs.set(info.buffUID, anim);
        } else {
            this._processUIDs.delete(info.buffUID);
            info.onFinish();
        }
    }
}

class BuffAnimationHelper {
    private _animTargets = new Map<string, BuffAnimationWithTarget>();
    constructor () {
    }

    play (info: BuffAnimInfo) {
        const key = this.key(info.role);
        if (this._animTargets.has(key)) {
            this._animTargets.get(key).play(info);
        } else {
            const animWithTarget = new BuffAnimationWithTarget();
            animWithTarget.init();
            this._animTargets.set(key, animWithTarget);
            animWithTarget.play(info);
        }
    }

    stopAll () {
        this._animTargets.forEach(v => {
            v.stopAll();
        });
        this._animTargets.clear();
    }

    /**
     * @desc 停止指定Target上的Buff动画。常见回合结束是，会有数据层的刷新，所以这个时候就要停止，避免出现两份数据！
     *
     * @param {ItemRole} target
     * @memberof BuffAnimationHelper
     */
    stopTarget (target: ItemRole) {
        const key = this.key(target);
        if (this._animTargets.has(key)) {
            const anim = this._animTargets.get(key);
            anim.stopAll();
        }
    }

    private key (target: ItemRole): string {
        return target.role.uid + '';
    }
}

const buffAnimHelper = new BuffAnimationHelper();

export {
    buffAnimHelper,
    BUFF_ANIMATION_TYPE,
}

