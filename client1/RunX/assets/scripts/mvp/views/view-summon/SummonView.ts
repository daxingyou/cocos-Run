import { CustomDialogId, RES_ICON_PRE_URL, TREASURE_SYS_POWER_TYPE, VIEW_NAME } from "../../../app/AppConst";
import { QUALITY_TYPE } from "../../../app/AppEnums";
import { utils } from "../../../app/AppUtils";
import { bagDataUtils } from "../../../app/BagDataUtils";
import { configUtils } from "../../../app/ConfigUtils";
import { resPathUtils } from "../../../app/ResPathUrlUtils";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { configManager } from "../../../common/ConfigManager";
import { eventCenter } from "../../../common/event/EventCenter";
import { gachaEvent, GuideEvents } from "../../../common/event/EventData";
import guiManager from "../../../common/GUIManager";
import moduleUIManager from "../../../common/ModuleUIManager";
import { redDotMgr, RED_DOT_MODULE } from "../../../common/RedDotManager";
import { preloadScriptIcons } from "../../../common/res-manager/Preloaders";
import StepWork from "../../../common/step-work/StepWork";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { cfg } from "../../../config/config";
import { data, gamesvr } from "../../../network/lib/protocol";
import { activityData } from "../../models/ActivityData";
import { bagData } from "../../models/BagData";
import { commonData } from "../../models/CommonData";
import { serverTime } from "../../models/ServerTime";
import { trackData } from "../../models/TrackData";
import { userData } from "../../models/UserData";
import { trackDataOpt } from "../../operations/TrackDataOpt";
import ActivityDoubleWeekCtrl from "../view-activity/ActivityDoubleWeekCtrl";
import ItemRedDot from "../view-item/ItemRedDot";
import MessageBoxView from "../view-other/MessageBoxView";
import ItemSummonBtn from "./ItemSummonBtn";

const { ccclass, property } = cc._decorator;

const COLOR_LABEL = [
    cc.Color.WHITE.fromHEX(`#FFF5E8`),
    cc.Color.WHITE.fromHEX(`#7E4931`),
]

const MAX_FIRE = 710;
const FIRE_OFFSET = 40

@ccclass
export default class SummonView extends ViewBaseComponent {

    // 顶部信息

    // 左边按钮区域
    @property(cc.Prefab) ndSummon: cc.Prefab = null;
    @property(cc.Node) ndBtnRoot: cc.Node = null;

    // 中间详细区域
    @property(cc.Sprite) spIcon: cc.Sprite = null;
    @property(cc.Label) lbProgress: cc.Label = null;
    @property(cc.Label) intro: cc.Label = null;

    @property(cc.Node) ndFree: cc.Node = null;
    @property(cc.Node) ndCost: cc.Node = null;
    @property(cc.Sprite) spCost: cc.Sprite = null;
    @property(cc.Label) lbCost: cc.Label = null;
    @property(cc.Sprite) spCost10: cc.Sprite = null;
    @property(cc.Label) lbCost10: cc.Label = null;
    @property(cc.Label) lbBtn: cc.Label = null;

    @property(cc.Sprite) sp20Draw: cc.Sprite = null;
    @property(cc.SpriteFrame) spf20Draw: cc.SpriteFrame[] = [];

    @property(cc.Sprite) spMouse: cc.Sprite = null;
    @property(cc.SpriteFrame) spfMouse: cc.SpriteFrame[] = [];

    @property(cc.Sprite) spBtn: cc.Sprite = null;
    @property(cc.SpriteFrame) spfBtn: cc.SpriteFrame[] = [];

    @property(cc.Node) ndDot: cc.Node = null;
    @property(cc.Node) ndMask: cc.Node = null;
    @property(ItemRedDot) freeItemRedDot: ItemRedDot = null;
    @property(ItemRedDot) tenItemRedDot: ItemRedDot = null;
    @property(ItemRedDot) battlePassRedDot: ItemRedDot = null;
    @property(cc.Label) lbTime: cc.Label = null;
    @property(ActivityDoubleWeekCtrl) doubleWeekCtrl: ActivityDoubleWeekCtrl = null;


    private _currSummon: cfg.SummonCard[] = [];
    private _btnList: ItemSummonBtn[] = [];
    private _currSelect: number = -1;
    private _iconLoader = new SpriteLoader();
    private _moduleId: number = -1;
    private _progress: number = 0;
    private _is20Drawing: boolean = false;
    private _currHero: number[] = []
    private _isInited: boolean = false;

    onInit(moduleId: number, partId: number) {
        this._moduleId = moduleId;
        if(!this._isInited){
            this._isInited = true;
            this._registerEvents();
            this._prepareData();
            this._resetUi();
            this._showLeftList();
            this.battlePassRedDot.setData(RED_DOT_MODULE.ACTIVITY_BATTLE_PASS_TOGGLE);
            this.stepWork.addTask(() => {
                this._checkSimulatingView();
            });

            // @todo 左侧子页签数量和索引不确定，后续可考虑用SummonCardId替换
            guiManager.addCoinNode(this.node, this._moduleId);
            this._delayLoadIcon();
            this.schedule(this._updateFireEffect, 0, cc.macro.REPEAT_FOREVER);
        }

        let idx = this._currSummon.findIndex((_summon => { return _summon.SummonCardId == partId }))
        this._selectSummon(idx != -1 && this._isOpenState(this._currSummon[idx]) ?  this._currSummon[idx].SummonCardId
            : this._currSummon.find(ele => { return this._isOpenState(ele)}).SummonCardId);
        this._currHero = bagData.heroList.map( _v => {return _v.ID});
    }

    private _registerEvents(){
        eventCenter.register(gachaEvent.GACHA_RES, this, this._showGachaReward);
        eventCenter.register(gachaEvent.SIMULATE_RES, this, this._showGachaSimulate);
        eventCenter.register(gachaEvent.SELECT_SIMULATE_RES, this, this._selectSimulateRes);
    }

    onRelease() {
        this._isInited = false;
        this.freeItemRedDot.deInit();
        this.tenItemRedDot.deInit();
        this.battlePassRedDot.deInit();
        this.unscheduleAllCallbacks();
        this._is20Drawing = false;
        guiManager.removeCoinNode(this.node);
        this._iconLoader.release();
        this.doubleWeekCtrl.deInit();
        this._btnList.forEach(_btn => {
            _btn.deInit();
            _btn.node.removeFromParent();
        })
        this._btnList.length = 0;
        eventCenter.unregisterAll(this);
        this.releaseSubView();
    }

    private _updateFireEffect () {
        let maxLen = MAX_FIRE + FIRE_OFFSET
        if (this.ndMask.width < this._progress * maxLen) {
            this.ndMask.width += 0.018 * maxLen;
            if (this.ndMask.width > maxLen)
                this.ndMask.width = maxLen;
            this.ndDot.x = this.ndMask.x + this.ndMask.width;
        } else if (this.ndMask.width > this._progress * maxLen) {
            this.ndMask.width = this._progress * maxLen;
            this.ndDot.x = this.ndMask.x + this.ndMask.width;
        }
    }

    onClickActivateBattlePass() {
        let battlePass = activityData.battlePassData && activityData.battlePassData.IsSpecial;
        moduleUIManager.jumpToModule(8000, 5);
    }

    onClickIntroduce() {
        this.loadSubView("SummonIntroduceView");
    }

    onClickSummonCardPool() {
        guiManager.loadModuleView("SummonCardPoolView", this._getCurrCfg().SummonCardShow);
        // this.loadSubView("SummonCardPoolView", this._getCurrCfg().SummonCardShow);
    }

    onClickBack() {
        this.closeView();
    }

    onRefresh(mID?: number, pID?: number, sId?: number, ...args: any[]): void {
        if(!pID) return;
        let idx = this._currSummon.findIndex((_summon => { return _summon.SummonCardId == pID }))
        this._selectSummon(this._currSummon[idx == -1 ? 0 : idx].SummonCardId);
    }


    onClickOneDraw() {
        if (this._checkSimulating()){
            return;
        }

        let currId = this._currSelect;
        let curr = configUtils.getSummonCfg(currId);
        let need = curr.SummonCardCost;
        let own = bagData.getItemCountByID(need);
        let enough = own >= 1;

        let svrData = trackData.poolRecords[curr.SummonCardId];
        let currTime = serverTime.currServerTime();
        let freeDraw = svrData && currTime > svrData.FreeDrawTime;

        if (!enough && !freeDraw && !commonData.tmpCache.BLOCK_SUMMON_MSGBOX) {
            let _cfg = configUtils.getItemConfig(need);
            let _nameStr = _cfg ? _cfg.ItemName : "道具"

            let _subInfoStr = curr.SummonCardSupplement.split(";");
            let _subId = parseInt(_subInfoStr[0]);
            let _subCnt = parseInt(_subInfoStr[1]);

            let _cfgSub = configUtils.getItemConfig(_subId);
            let _nameStrSub = _cfgSub ? _cfgSub.ItemName : "钻石"
            let tipCfg: cfg.Dialog = {};
            let tipCfg2 = configUtils.getDialogCfgByDialogId(CustomDialogId.SUMMON_ITEM_NO_ENOUGH);
            Object.assign(tipCfg, configUtils.getDialogCfgByDialogId(2000012));
            tipCfg.DialogText = utils.convertFormatString(tipCfg.DialogText, [{itemname: _nameStr}, {itemnum: _subCnt}, {itemname: _nameStrSub}]);
            guiManager.showMessageBoxByCfg(this.node, tipCfg, (msgbox: MessageBoxView, checked?: boolean) => {
                    if (checked) commonData.blockSummonMsg = checked;
                    msgbox.closeView();
                }, (msgbox: MessageBoxView, checked?: boolean) => {
                    let ownSub = bagData.getItemCountByID(_subId);
                    if (checked) commonData.blockSummonMsg = checked;
                    if (ownSub >= _subCnt) {
                        trackDataOpt.reqGachaDraw(currId, 1)
                    } else {
                        guiManager.showTips(tipCfg2.DialogText.replace(/\%s/gi, _nameStr))
                    }
                    msgbox.closeView();
                }, true);
        } else {
            trackDataOpt.reqGachaDraw(currId, 1)
        }
    }

    onClickTenDraw() {
        if (this._checkSimulating()) {
            return;
        }
        const TEM_DRAW = 10;
        let currId = this._currSelect;
        let curr = this._currSummon.filter(_cfg => { return _cfg.SummonCardId == currId })[0];

        let need = curr.SummonCardCost;
        let own = bagData.getItemCountByID(need);
        let enough = own >= TEM_DRAW;

        const drawTenHandler = () => {
            let svrData = trackData.poolRecords[curr.SummonCardId];
            if (svrData.ContinuousDraw && svrData.ContinuousDraw >= curr.SummonCardTrigger) {
                trackDataOpt.reqGachaSimulate(currId)
            } else {
                trackDataOpt.reqGachaDraw(currId, TEM_DRAW)
            }
        }

        if (!enough && !commonData.tmpCache.BLOCK_SUMMON_MSGBOX) {
            let _cfg = configUtils.getItemConfig(need);
            let _nameStr = _cfg ? _cfg.ItemName : "道具"
            let _subInfoStr = curr.SummonCardSupplement.split(";");
            let _subId = parseInt(_subInfoStr[0]);
            let _subCnt = parseInt(_subInfoStr[1]) * (TEM_DRAW-own);
            let _cfgSub = configUtils.getItemConfig(_subId);
            let _nameStrSub = _cfgSub ? _cfgSub.ItemName : "钻石"
            let tipCfg: cfg.Dialog = {};
            let tipCfg2 = configUtils.getDialogCfgByDialogId(CustomDialogId.SUMMON_ITEM_NO_ENOUGH);
            Object.assign(tipCfg, configUtils.getDialogCfgByDialogId(2000012));
            tipCfg.DialogText = utils.convertFormatString(tipCfg.DialogText, [{itemname: _nameStr}, {itemnum: _subCnt}, {itemname: _nameStrSub}]);
            guiManager.showMessageBoxByCfg(this.node, tipCfg, (msgbox: MessageBoxView, checked?: boolean) => {
                    if (checked) commonData.blockSummonMsg = checked;
                    msgbox.closeView();
                }, (msgbox: MessageBoxView, checked?: boolean) => {
                    let ownSub = bagData.getItemCountByID(_subId);
                    if (checked) commonData.blockSummonMsg = checked;
                    if (ownSub >= _subCnt) {
                        drawTenHandler();
                    } else {
                        guiManager.showTips(tipCfg2.DialogText.replace(/\%s/gi, _nameStr))
                    }
                    msgbox.closeView();
                }, true);
        } else {
            drawTenHandler()
        }
    }

    private _checkSimulatingView() {
        let records = trackData.poolRecords;
        for (let key in records) {
            let _r = records[key]
            if (_r && _r.OpenSimulate) {
                let self = this;
                // 模拟一个res强制打开之前的模拟结果界面
                let res: gamesvr.GachaSimulateRes = {
                    GachaID: parseInt(key),
                    GachaRecord: _r,
                    toJSON: null
                }
                this.loadSubView("SummonSimulateResView", res,
                    // 暂存回调
                    (summonId: number, seq: number) => {
                        trackDataOpt.reqSaveGachaSimulate(summonId, seq);
                    },
                    // 确认回掉
                    (summonId: number, seq: number) => {
                        trackDataOpt.reqSelectGachaSimulate(summonId, seq);
                    },
                    // 继续回掉
                    (summonId: number) => {
                        trackDataOpt.reqGachaSimulate(summonId);
                    },
                    // 查看模拟记录
                    (summonId: number, seq: number) => {
                        self.loadSubView("SummonSimulateSaveView", summonId);
                    },
                    this._seleNewSSRHero(res.GachaRecord.CurrentSimulate.Prizes)
                );
                break;
            }
        }
    }

    private _checkSimulating(){
        let records = trackData.poolRecords;
        for (let key in records) {
            let _r = records[key]
            if (_r && _r.OpenSimulate) {
                return true;
            }
        }
        return false;
    }

    private _showGachaReward(cmd: any, res: gamesvr.IGachaCardRes) {
        let curr = this._getCurrCfg();
        if (curr) {
            this._updatePrice(curr);
            this._updateLeftTime(curr);
            this._updateProgress(curr);
        }

        let itemTransform = bagDataUtils.getItemTransform(res.Prizes, this._currHero)
        guiManager.loadView("GetSSRView", this.node, res.Prizes, () => {
            return this.loadSubView(VIEW_NAME.GET_ITEM_VIEW, res.Prizes, [], itemTransform);
        });

        this._currHero = bagData.heroList.map( _v => {return _v.ID});
        if(res.Prizes.length == 1) {
            redDotMgr.fire(RED_DOT_MODULE.SUMMON_BUTTON);
            redDotMgr.fire(RED_DOT_MODULE.SUMMON_BEAST_TOGGLE);
            redDotMgr.fire(RED_DOT_MODULE.SUMMON_HERO_TOGGLE);
            redDotMgr.fire(RED_DOT_MODULE.SUMMON_EQUIP_TOGGLE);
        } else {
            redDotMgr.fire(RED_DOT_MODULE.SUMMON_TEN_BUTTON);
        }
        redDotMgr.fire(RED_DOT_MODULE.ACTIVITY_DOUBLE_WEEK_TOGGLE);
    }

    /**
     * 选择确认20连斩的结果
     * @param cmd
     * @param res
     */
    private _selectSimulateRes(cmd: any, res: gamesvr.SelectSimulateRes) {
        // 20连斩确认结果 不播摸石头的动画了
        let curr = this._getCurrCfg();
        if (curr) {
            this._updatePrice(curr);
            this._updateLeftTime(curr);
            this._updateProgress(curr);
            this._refreshRedDot();
        }
        this._is20Drawing = false;
        this._setTenDrawBtnStyle(this._is20Drawing);
        let itemTransform = bagDataUtils.getItemTransform(res.Prizes, this._currHero);
        return this.loadSubView(VIEW_NAME.GET_ITEM_VIEW, res.Prizes, [], itemTransform);
    }

    private _seleNewSSRHero(prize: data.IItemInfo[]): number[]{
        if(!prize || prize.length == 0) return null;
        let newHeroSSR: number[] = [];
        for (let i = 0; i < prize.length; i++) {
            let _p = prize[i].ID;
            let cfg = configUtils.getHeroBasicConfig(_p);
            cfg && cfg.HeroBasicQuality == QUALITY_TYPE.SSR && newHeroSSR.push(_p);
        }
        return newHeroSSR;
    }

    private _showGachaSimulate(cmd: any, res: gamesvr.GachaSimulateRes) {
        let self = this;
        this.loadSubView("SummonSimulateResView", res,
            // 暂存回调
            (summonId: number, seq: number) => {
                trackDataOpt.reqSaveGachaSimulate(summonId, seq);
            },
            // 确认回掉
            (summonId: number, seq: number) => {
                trackDataOpt.reqSelectGachaSimulate(summonId, seq);
            },
            // 继续回掉
            (summonId: number) => {
                trackDataOpt.reqGachaSimulate(summonId);
            },
            // 查看模拟记录
            (summonId: number, seq: number) => {
                self.loadSubView("SummonSimulateSaveView", summonId);
            },
            this._seleNewSSRHero(res.GachaRecord.CurrentSimulate.Prizes),
        );
    }

    private _getCurrCfg() {
        return configUtils.getSummonCfg(this._currSelect);
    }


    private _showLeftList() {
        for (let i = 0; i < this._currSummon.length; i++) {
            let _s = this._currSummon[i];
            let _ndSummon = cc.instantiate(this.ndSummon);
            this.ndBtnRoot.addChild(_ndSummon);
            let _comp = _ndSummon.getComponent(ItemSummonBtn);
            if (_comp) {
                _comp.init(_s, this._isOpenState.bind(this), this._selectSummon.bind(this));
                this._btnList.push(_comp);
            }
        }
    }

    private _selectSummon(summonId: number) {
        if (this._currSelect == summonId) return;
        let cfg: cfg.SummonCard = configUtils.getSummonCfg(summonId);
        if(!this._isOpenState(cfg)) {
            // 等级未达到开启条件
            if(userData.lv < cfg.SummonCardOpenCondition) {
                let dialogCfg = configUtils.getDialogCfgByDialogId(CustomDialogId.GRADE_NO_MATCH);
                let text = utils.convertFormatString(dialogCfg.DialogText, [{ levelnum: cfg.SummonCardOpenCondition}]);
                guiManager.showTips(text);
            }
            return;
        }

        this._currSelect = summonId;
        this._btnList.forEach(_comp => {
            _comp.select = (_comp.summonId == summonId)
        })
        this._updateDoubleWeek();
        this._updateDetail();
        this._refreshRedDot();
    }

    private _updateDoubleWeek() {
        const summonCfg = configUtils.getSummonCfg(this._currSelect);
        if(summonCfg) {
            this.doubleWeekCtrl.init(summonCfg.SummonCardType);
        }
    }

    private _updateDetail() {
        let curr = this._getCurrCfg();
        if (curr) {
            let introCfg = configUtils.getDialogCfgByDialogId(CustomDialogId.SUMMON_CARD_TIPS);
            this._updateMainBg(curr);
            this._updateProgress(curr);
            this._updatePrice(curr);
            this._updateLeftTime(curr);

            this.intro.string = introCfg ? introCfg.DialogText : "";
        }
    }

    private _updateMainBg(curr: cfg.SummonCard) {
        let url = resPathUtils.getSummonBg(curr.SummonCardImage);
        this._iconLoader.changeSprite(this.spIcon, url);
    }

    private _updateProgress(curr: cfg.SummonCard) {
        let svrData = trackData.poolRecords[curr.SummonCardId];
        if (svrData && svrData.SimulateRecords) {
            let currContinus = svrData.ContinuousDraw || 0;
            let max = curr.SummonCardTrigger;
            this.lbProgress.string = `${currContinus}`;
            let is20Draw = currContinus >= max;
            this._setTenDrawBtnStyle(is20Draw || this._is20Drawing);
            this._progress = currContinus / max;
            if (this._progress > 1) this._progress = 1;
        }
    }

    //设置10/20连斩按钮状态
    private _setTenDrawBtnStyle(is20Draw: boolean){
        this.sp20Draw.spriteFrame = is20Draw? this.spf20Draw[0]:this.spf20Draw[1];
        this.spBtn.spriteFrame = is20Draw? this.spfBtn[0]:this.spfBtn[1];
        this.spMouse.spriteFrame = is20Draw? this.spfMouse[0]:this.spfMouse[1];
        this.lbBtn.string = is20Draw? `吉仙福讯`:`十连抽`;
        this.lbBtn.node.color = is20Draw? COLOR_LABEL[0]:COLOR_LABEL[1];
    }

    private _updatePrice(curr: cfg.SummonCard) {
        let costUrl = resPathUtils.getItemIconPath(curr.SummonCardCost);
        let surplusTimes = this._getFreeNumber(curr);
        this._updateFreeTip(surplusTimes)
        if (surplusTimes > 0) {
            this.ndCost.active = false;
        } else {
            this.ndCost.active = true;
            this._iconLoader.changeSprite(this.spCost, costUrl);
        }
        this._iconLoader.changeSprite(this.spCost10, costUrl);
        this.lbCost.string = "x1";
        this.lbCost10.string = "x10";
    }

    private _updateFreeTip(freeNum: number){
        let isActive = freeNum > 0;
        this.ndFree.active = isActive;
        isActive && (this.ndFree.getComponent(cc.Label).string = `今日免费次数：${freeNum}`);
    }

    //获取免费次数
    private _getFreeNumber(summonCfg: cfg.SummonCard){
        return trackData.getSummonFreeCount(summonCfg);
    }

    private _updateLeftTime (cfg: cfg.SummonCard) {
       let total = cfg.SummonCardLimit;
       let curr = trackData.summonCardLimit[cfg.SummonCardId] || 0
       let left = total-curr < 0? 0:total-curr
       this.lbTime.string = `今日剩余次数：${left}`;
    }

    private _prepareData() {
        let allSummon = trackData.poolRecords;
        let showList: cfg.SummonCard[] = [];
        for (let key in allSummon) {
            let ele = allSummon[key];
            if(!ele) continue;
            let _summonId = parseInt(key);
            let _cfg: cfg.SummonCard = configUtils.getSummonCfg(_summonId);
            if (!_cfg) continue;

            ele.OpenSimulate && (this._is20Drawing = true);
            if(this._isOpenState(_cfg)) {
                showList.push(_cfg);
            } else if(_cfg.SummonCardLockShow != 1) {
                showList.push(_cfg);
            }
        }
        showList.sort((_l, _r) => {
            return (_r.SummonCardOrder || 0) - (_l.SummonCardOrder || 0);
        })
        this._currSummon = showList;
    }

    private _refreshRedDot() {
        this.freeItemRedDot.setData(RED_DOT_MODULE.SUMMON_BUTTON, {
            args: [this._getCurrCfg()]
        });
        this.tenItemRedDot.setData(RED_DOT_MODULE.SUMMON_TEN_BUTTON, {
            args: [this._getCurrCfg()]
        });
    }

    private _resetUi() {
        this.ndMask.width = FIRE_OFFSET;
        this.ndDot.x = this.ndMask.x + FIRE_OFFSET;
    }

    private _isOpenState(cfg: cfg.SummonCard): boolean {
        let openLv = cfg.SummonCardOpenCondition;
        if(openLv && userData.lv < openLv) return false;

        if (!cfg.SummonCardOpenTime || cfg.SummonCardOpenTime.length == 0 ||
            cfg.SummonCardOpenTime == "-1") return true;

        let lastDay = cfg.SummonCardHoldTime || 0;
        let lastTime = lastDay * 24 * 60 * 60 * 1000;
        let curr = serverTime.currServerTime() * 1000;
        let summonTime = utils.parseTimeToStamp(cfg.SummonCardOpenTime);

        if (summonTime && curr >= summonTime) {
            if (!lastDay) return true;
            if (curr <= summonTime + lastTime) return true
        }
        return false;
    }

    private _delayLoadIcon() {
        //异步执行预加载
        let paths:string[] = []
        for (let i = 0; i < this._currSummon.length; i++) {
            let _s = this._currSummon[i];
            let summonCfg: cfg.SummonCardShow[] = configManager.getConfigByKV("summonShow", "SummonCardShowGroupId", _s.SummonCardShow);
            summonCfg.forEach(_scfg => {
                let list = _scfg.SummonCardShowNormalContent.split(";").map( _s => {return parseInt(_s)});
                if (_scfg.SummonCardShowType == 1) {

                    list.forEach( _v => {
                        let cfg = configUtils.getHeroBasicConfig(_v)
                        let modelCfg: cfg.Model = configManager.getConfigByKey("model", cfg.HeroBasicModel)
                        if (modelCfg && modelCfg.ModelHeadIconSquare) {
                            let url = `textures/head-hero/${modelCfg.ModelHeadIconSquare}`;
                            paths.push(url)
                        }
                    })

                } else if (_scfg.SummonCardShowType == 2) {
                    list.forEach( _v => {
                        let cfg = configUtils.getEquipConfig(_v)
                        if (cfg && cfg.Icon) {
                            let url = `${RES_ICON_PRE_URL.BAG_ITEM}/${cfg.Icon}`;
                            paths.push(url)
                        }
                    })
                }
            })
        }

        this.scheduleOnce(()=> {
            let setpWork = new StepWork()
            setpWork.concact(preloadScriptIcons(paths, "SUMMONICON").stepWork);
            setpWork.start(()=> {});
        })
    }
}

