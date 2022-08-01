import { logger } from "../../../common/log/Logger";
import {scheduleManager} from "../../../common/ScheduleManager";
import { ItemResultData } from "../../../app/BattleType";
import { buffAnimHelper } from "../view-role/BuffAnimationHelper";
import BattleScene from "../view-scene/BattleScene";
import EffectAnimCtrl from "./EffectAnimCtrl";
import { battleUtils } from "../../../app/BattleUtils";

interface ItemResultListInfo {
    itemResultList: ItemResultData[],
    callback: Function
}
export default class EffectAnimManager {
    private _isProcessing: boolean = false;
    private _itemResults: Array<ItemResultListInfo> = [];
    private _effAnimCtrl: EffectAnimCtrl = null;

    private _game: BattleScene = null;
    private _timerId: number[] = [];
    init (game: BattleScene) {
        this._isProcessing = false;
        this._itemResults = [];

        this._effAnimCtrl = new EffectAnimCtrl();
        this._effAnimCtrl.init(game);
        this._game = game;
        this._timerId = [];
    }

    deInit () {
        this._itemResults = [];
        this._unscheduleAllCallbacks();
        buffAnimHelper.stopAll();
        if (this._effAnimCtrl) {
            this._effAnimCtrl.deInit();
            this._effAnimCtrl = null;
        }
    }

    private _unscheduleAllCallbacks () {
        this._timerId.forEach(timeId => {
            scheduleManager.unschedule(timeId);
        });
        this._timerId = [];
    }

    /**
     * 效果处理
     * @param effResArr 
     * @param callback 
     */
    process (effResArr: ItemResultData[], callback: () => void) {
        if (effResArr == null || effResArr.length == 0) {
            if (callback) callback();
            return;
        }

        battleUtils.resetZHelper();
        logger.log(`EffectAnimManager`, `process effectResArr.`);
        this._itemResults.push({ itemResultList: effResArr, callback: callback });
        this._processOne();
    }


    /**
     * 施法者的技能特效
     * @param itemUID 
     * @param roleUID 
     */
    processUseInfo (itemUID: number, roleUID: number) {
        if (this._effAnimCtrl) {
            // this._effAnimCtrl.processUseInfo(itemUID, roleUID);
        }
    }

    private _processOne () {
        if (this._isProcessing) return;
        if (this._itemResults.length == 0) return;

        let effectInfo = this._itemResults.shift();
        if (effectInfo == null) {
            this._processOne();
            return;
        }

        this._isProcessing = true;
        this._effAnimCtrl.process(effectInfo.itemResultList, () => {
            this._processFinish(effectInfo);
        });     
    }

    private _processFinish (itemResultList: ItemResultListInfo) {
        const finishCallBack = () => {
            if (itemResultList && itemResultList.callback) {
                itemResultList.callback();
            }
        }

        finishCallBack ();

        // 下一帧再执行下一个请求，防止同一帧执行太多请求卡帧
        let timerId = scheduleManager.scheduleOnce(() => {
            this._isProcessing = false;
            if(this._effAnimCtrl) {
                this._effAnimCtrl.deInit();
            }
            this._processOne();
        }, 0);
        this._timerId.push(timerId);
    }
}
