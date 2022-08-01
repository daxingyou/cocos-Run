import { ResultType, ROLE_TYPE } from "../../../app/AppEnums";
import { logger } from "../../../common/log/Logger";
import ScheduleManager from "../../../common/ScheduleManager";
import scheduleManager from "../../../common/ScheduleManager";
import { ItemResultData } from "../../../game/BattleType";
import { modelManager } from "../../models/ModeManager";
import ItemRole from "../view-item/ItemRole";
import BattleScene from "../view-scene/BattleScene";
import EffectAnimCtrl from "./EffectAnimCtrl";

interface ItemResultListInfo {
    itemResultList: ItemResultData[],
    callback: Function
}
export default class EffectAnimManager {
    private _isProcessing: boolean = false;
    private _itemResults: Array<ItemResultListInfo> = [];
    private _effAnimCtrl: EffectAnimCtrl = null;

    private  _game: BattleScene = null;

    init (game: BattleScene) {
        this._isProcessing = false;
        this._itemResults = [];

        this._effAnimCtrl = new EffectAnimCtrl();
        this._effAnimCtrl.init(game);
        this._game = game;
    }

    deInit () {
        this._itemResults = [];
        if (this._effAnimCtrl) {
            this._effAnimCtrl.deInit();
            this._effAnimCtrl = null;
        }
    }

    /**
     * 效果处理
     * @param effResArr 
     * @param callback 
     */
    process (effResArr: ItemResultData[], callback: () => void) {
        if (effResArr == null) {
            if (callback) callback();
            return;
        }

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

        let currUid: number[] = [];
        itemResultList.itemResultList.forEach( _eff => {
            if (_eff && _eff.ItemResults.length > 0) {
                _eff.ItemResults.forEach( _itemEff => {
                    if (_itemEff.ResultType == ResultType.RTSkillLight) {
                        let uid = _itemEff.SkillLightResult.User;
                        if (currUid.indexOf(uid) == -1)
                            currUid.push(uid);
                    }
                    if (_itemEff.ResultType == ResultType.RTBuffLight) {
                        let uid = _itemEff.BuffLightResult.User;
                        if (currUid.indexOf(uid) == -1)
                            currUid.push(uid);
                    }
                })
            }
        })

        if (currUid.length) {
            let time = 0;
            currUid.forEach( (_r, _idx) => {
                let role = modelManager.battleUIData.getRoleByUid(_r);
                let actRole: ItemRole = null;
                if (role.roleType == ROLE_TYPE.HERO) {
                    let targetNode = this._game.heroCtrl.getRoleNode(_r);
                    if (targetNode) actRole = targetNode.getComponent(ItemRole);
                } else {
                    let targetNode = this._game.monsterCtrl.getRoleNode(_r);
                    if (targetNode) actRole = targetNode.getComponent(ItemRole);
                }
    
                if (actRole)
                    time = Math.max(actRole.moveBack(), time);
            });
            ScheduleManager.scheduleOnce(()=> {
                finishCallBack()
            }, time);
        } else {
            finishCallBack();
        }

        // 下一帧再执行下一个请求，防止同一帧执行太多请求卡帧
        scheduleManager.scheduleOnce(() => {
            this._isProcessing = false;
            this._effAnimCtrl.deInit();
            this._processOne();
        }, 0);
    }
}
