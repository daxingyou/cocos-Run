import { CustomDialogId } from "../../../app/AppConst";
import { QUALITY_TYPE } from "../../../app/AppEnums";
import { utils } from "../../../app/AppUtils";
import { bagDataUtils } from "../../../app/BagDataUtils";
import { configUtils } from "../../../app/ConfigUtils";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { configManager } from "../../../common/ConfigManager";
import { eventCenter } from "../../../common/event/EventCenter";
import { gachaEvent } from "../../../common/event/EventData";
import guiManager from "../../../common/GUIManager";
import moduleUIManager from "../../../common/ModuleUIManager";
import { ItemBagPool } from "../../../common/res-manager/NodePool";
import StepWork from "../../../common/step-work/StepWork";
import { cfg } from "../../../config/config";
import { data, gamesvr } from "../../../network/lib/protocol";
import { activityData } from "../../models/ActivityData";
import { bagData } from "../../models/BagData";
import { trackData } from "../../models/TrackData";
import ItemBag from "../view-item/ItemBag";
import MessageBoxView from "../view-other/MessageBoxView";

const { ccclass, property } = cc._decorator;
const MAX_SIMULATE = 20;

interface uiCfg {
    bgHeight: number,
    titlePos: number,
    ctxPos: number,
    downLinePos: number
}

// 别人我为什么做的这么low，UI效果图排得没逻辑，我就写死了
const cfgCountLess5:uiCfg = {
    bgHeight: 260,
    titlePos:143.5,
    ctxPos: 70,     
    downLinePos: -127
}

const cfgCountLess10:uiCfg = {
    bgHeight: 350,
    titlePos: 182.221,
    ctxPos: 124.294,
    downLinePos:-175.583
}

const cfgCountMore10:uiCfg = {
    bgHeight: 350,
    titlePos: 182.221,
    ctxPos: 135.189,       
    downLinePos: -175.583
}

const X_SPACE = 25;
const Y_SPACE = 14;

@ccclass
export default class SummonSimulateResView extends ViewBaseComponent {
    @property(cc.Node)      itemRoot: cc.Node = null;
    @property(cc.Label)     lbProgress: cc.Label = null;
    @property(cc.Label)     lbBtnSave: cc.Label = null;
    @property(cc.Button)    BtnSave: cc.Button = null;

    // resize
    @property(cc.Node)      ndTitle: cc.Node = null;
    @property(cc.Node)      ndBg: cc.Node = null;
    @property(cc.Node)      ndLine: cc.Node = null;
    @property(cc.Node)      ndCtx: cc.Node = null;

    private _confirm: Function = null;
    private _continue: Function = null;
    private _save: Function = null;

    private _items: ItemBag[] = [];
    private _res: gamesvr.GachaSimulateRes = null;

    onInit (res: gamesvr.GachaSimulateRes,
            saveHandler: Function,
            confirmHandler: Function,
            continueHandler: Function,
            visitRecordHandler: Function,
            newSSRHero: number[] = []
        ) {

        if (!res.GachaRecord) return;

        eventCenter.register(gachaEvent.SAVE_SIMULATE_RES, this, this._onSaveSimulateRes);
        eventCenter.register(gachaEvent.SIMULATE_RES, this, this._delayCloseView);

        this._confirm = confirmHandler;
        this._save = saveHandler;
        this._continue = continueHandler;
        this._res = res;
        let items = res.GachaRecord.CurrentSimulate.Prizes;
        
        this._showPreGetHerosView(items, () => {
            let func = () => {
                // 可能点击太快了，收到res就没必要进来
                if (this.node && cc.isValid(this.node)) {
                    this._resizeCtx(items.length);
                    this._showSimulate();
                    this._updateBtn();
                }
            };
            if(!newSSRHero || newSSRHero.length == 0){
                func();
                return;
            }
            moduleUIManager.showGetNewSSRHero(newSSRHero, func, this.node, false);
            // this.stepWork.concact(new StepWork().addTask(() => {
            // }));
        });
    }

    onRelease () {
        this._items.forEach( _item => {
            ItemBagPool.put(_item)
        })
        this._items = [];
        eventCenter.unregisterAll(this);
        this.unscheduleAllCallbacks();
        this.releaseSubView();
    }

    private _delayCloseView () {
        // 等到新的界面打开了再关闭吧
        this.scheduleOnce(()=> {
            this.closeView();
        }, 0.1)
    }

    private _showPreGetHerosView(prizes: data.IItemInfo[], endFunc: Function, isShow: boolean = true) {
        if(!isShow) {
            endFunc && endFunc();
            return;
        }
        guiManager.loadView('GetSSRView', this.node.parent, prizes, endFunc);
    }

    onClickSave () {
        let saveInfo = this._checkCanSave();
        if (!saveInfo.can) {
            guiManager.showTips(saveInfo.info);
            !saveInfo.isMax && this.loadSubView("ActivityBattlePassTipsView");
            return;
        }

        let curr = trackData.poolRecords[this._res.GachaID];
        let currSeq = this._res.GachaRecord.CurrentSimulate.Seq;
        let history = curr.SimulateRecords;
        let find = history.filter( _h => {return _h.Seq == currSeq});
        if (find && find.length > 0) {
            guiManager.showDialogTips(CustomDialogId.SUMMON_ALREADY_STASHED);
            return;
        }

        this._save && this._save(this._res.GachaID, currSeq);
    }

    onClickCheckSave () {
        // this._checkSimulate && this._checkSimulate(this._res.GachaID, this._res.SimulatePrizes.Seq);
        // this.closeView();
        let self = this;
        this.loadSubView("SummonSimulateSaveView", this._res.GachaID, 
        (gachaId: number, seq: number)=> {
            self._confirm && self._confirm(gachaId, seq);
            self.closeView();
        },
        (gachaId: number, seq: number)=> {
            self._continue && self._continue(gachaId);
            self.closeView();
        });
    }

    onClickContinue () {
        let gachaId = this._res.GachaID;

        let currSimulate = trackData.poolRecords[gachaId];
        if (currSimulate.SeqCounter == MAX_SIMULATE) {
            guiManager.showDialogTips(CustomDialogId.SUMMON_CHOOSE_RESULT);
            return;
        }

        let continueHandler = () => {
            this._continue && this._continue(this._res.GachaID);
            // this.closeView();
        }

        let currPrize = this._res.GachaRecord.CurrentSimulate.Prizes;
        let hasSSR = 0;
        for (let i = 0; i < currPrize.length; i++) {
            let cfg: any = configUtils.getHeroBasicConfig(currPrize[i].ID);
            if (cfg && cfg.HeroBasicQuality >= QUALITY_TYPE.SSR) {
                hasSSR = 1;
                break;
            }
            if (!cfg) {
                cfg = configUtils.getEquipConfig(currPrize[i].ID);
                if (cfg && cfg.Quality >= QUALITY_TYPE.SSR) {
                    hasSSR = 2;
                    break;
                }
            }
        }
        
        let curr = trackData.poolRecords[this._res.GachaID];
        let currSeq = this._res.GachaRecord.CurrentSimulate.Seq;
        let history = curr.SimulateRecords;
        let find = history.filter( _h => {return _h.Seq == currSeq});
        let hasSaved = false;
        if (find && find.length > 0) {hasSaved = true;}

        if (hasSSR && !hasSaved) {
            let diaCfg:cfg.Dialog = configManager.getConfigByKey("dialogue", hasSSR == 1 ? 2000002 : 2000015);
            if (diaCfg) {
                guiManager.showMessageBoxByCfg(this.node, diaCfg,
                (msgbox: MessageBoxView)=>{
                    msgbox.closeView();
                }, 
                (msgbox: MessageBoxView)=>{
                    continueHandler();
                    msgbox.closeView();
                });
            } else {
                continueHandler();
            }
        } else {
            continueHandler();
        }
    }

    onClickConfirm () {
        // this._confirm && this._confirm(this._res.GachaID, this._res.GachaRecord.CurrentSimulate.Seq);
        // this.closeView();
        this.onClickCheckSave();
    }

    private _resizeCtx (cnt: number) {
        let cfg: uiCfg = null;
        this.ndCtx.opacity = 0;
        if (cnt <= 5) {
            cfg = cfgCountLess5;
            this.ndCtx.width = cnt * 100 + (cnt - 1)* X_SPACE + 10;
            this.ndCtx.height = 105;
        } else if (cnt <= 10) {
            cfg = cfgCountLess10;
            this.ndCtx.width = 620;
            this.ndCtx.height = 220;
        } else {
            cfg = cfgCountMore10;
            this.ndCtx.width = 620;
            let lineCnt = Math.ceil(cnt/5);
            this.ndCtx.height = lineCnt * 100 + (lineCnt - 1) * Y_SPACE + 20;
        }
        this.ndTitle.y = cfg.titlePos;
        this.ndBg.height = cfg.bgHeight;
        this.ndLine.y = cfg.downLinePos;
        this.scheduleOnce(()=> {
            this.ndCtx.runAction(cc.fadeIn(0.1));
            this.ndCtx.y = cfg.ctxPos;
        })
    }

    private _showSimulate () {
        let self = this;
        let currSimulate = this._res.GachaRecord.CurrentSimulate;

        let items = currSimulate.Prizes;
        if (items && items.length) {
            items.forEach( _i => {
                self._addOneItem(_i)
            })
        }

        let seq = currSimulate.Seq + 1;
        this.lbProgress.string = `继续${seq}/20`;
    }

    private _onSaveSimulateRes() {
        guiManager.showDialogTips(CustomDialogId.SUMMON_STASHED);
        this._updateBtn();
    }

    private _updateBtn () {
        let currGacha = trackData.poolRecords[this._res.GachaID];
        let currSave = currGacha.SimulateRecords;
        let currSeq = this._res.GachaRecord.CurrentSimulate.Seq;

        let saved = false;
        currSave.forEach( _sim => {
            if (_sim.Seq == currSeq) saved = true;
        })
        
        if (saved) {
            this.lbBtnSave.string = "已暂存";
            this.BtnSave.interactable = false;
            this.BtnSave.node.children.forEach( _c => {
                _c.color = new cc.Color(77, 77, 77);
            })
        }
    }

    private _checkCanSave(): {can: boolean, isMax: boolean, info: string} {
        let currGacha = trackData.poolRecords[this._res.GachaID];
        let currSave = currGacha.SimulateRecords;

        let modeCfg = configUtils.getConfigModule("SummonCardStorageNum") || 1;
        let openBattlePass = activityData.battlePassData && activityData.battlePassData.IsSpecial;

        if (!openBattlePass) {
            if (currSave.length >= modeCfg) {
                return {
                    can: false,
                    isMax: false,
                    info: "暂存已满，请开通战令扩容",
                }
            }
        } else {
            if (currSave.length >= MAX_SIMULATE -1) {
                return {
                    can: false,
                    isMax: true,
                    info: "暂存已满!",
                }
            }
        }

        return {
            can: true,
            isMax: false,
            info: "",
        }
    }

    private _addOneItem (_item: data.IItemInfo) {
        let self = this;
        let bagItem = ItemBagPool.get();
        let ndItem = bagItem.node;
        self.itemRoot.addChild(ndItem);
        let isNew = bagData.getItemByID(_item.ID) == null
        if (bagItem) {
            self._items.push(bagItem);
            bagItem.init({
                id: _item.ID,
                // clickHandler: () => { moduleUIManager.showItemDetailInfo(_item.ID, 0, this.node); },
                getItem: true,
                isNew:isNew
            })

        }
    }
}