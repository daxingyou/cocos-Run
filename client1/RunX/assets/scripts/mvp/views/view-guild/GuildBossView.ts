import { CustomDialogId, CustomItemId, VIEW_NAME } from "../../../app/AppConst";
import { utils } from "../../../app/AppUtils";
import { configUtils } from "../../../app/ConfigUtils";
import { resPathUtils } from "../../../app/ResPathUrlUtils";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { configManager } from "../../../common/ConfigManager";
import { eventCenter } from "../../../common/event/EventCenter";
import { bagDataEvent, guildEvent } from "../../../common/event/EventData";
import guiManager from "../../../common/GUIManager";
import { ItemBagPool, ItemHeroHeadSquarePool } from "../../../common/res-manager/NodePool";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { cfg } from "../../../config/config";
import { data } from "../../../network/lib/protocol";
import { bagData } from "../../models/BagData";
import { guildData } from "../../models/GuildData";
import { serverTime } from "../../models/ServerTime";
import { userData } from "../../models/UserData";
import { guildOpt } from "../../operations/GuildOpt";
import ItemBag from "../view-item/ItemBag";
import ItemHeadSquare from "../view-item/ItemHeadSquare";

const enum BOSS_STATE {
    CANT_FIGHT,
    FIGHT_PRESET,
    FIGHTING,
    FIGHT_END
}

const {ccclass, property} = cc._decorator;

@ccclass
export default class GuildBossView extends ViewBaseComponent {
    @property(cc.Label) fightingCountdownLb: cc.Label = null;
    @property(cc.Node) startFightTips: cc.Node = null;
    @property(cc.Node) fightingTips: cc.Node = null;
    @property(cc.Label) startFightCountdownLb: cc.Label = null;
    @property(cc.Node) bossPowerBg: cc.Node = null;
    @property(cc.Node) bossPowerTips: cc.Node = null;
    @property(cc.Label) bossPowerLb: cc.Label = null;
    @property(cc.Node) guildPowerBg: cc.Node = null;
    @property(cc.Node) guildPowerTips: cc.Node = null;
    @property(cc.Node) reachPowerTips: cc.Node = null;
    @property(cc.Label) guildPowerLb: cc.Label = null;
    @property(cc.Node) cantFightTips: cc.Node = null;
    @property(cc.Node) fightTeamBtn: cc.Node = null;
    @property(cc.Label) fightTeamLb: cc.Label = null;
    @property(cc.Label) fightTeamCountLb: cc.Label = null;
    @property(cc.Node) fightInspireBtn: cc.Node = null;
    @property(cc.Label) fightInspireLb: cc.Label = null;
    @property(cc.Node) fightInspireCostIcon: cc.Node = null;
    @property(cc.Label) fightInspireCostLb: cc.Label = null;
    @property(cc.Node) isPassed: cc.Node = null;
    @property(cc.Node) selfTeamAddPowerTips: cc.Node = null;
    @property(cc.Label) selfTeamAddPowerLb: cc.Label = null;
    @property(cc.Node) selfTeamAddPowerIcon: cc.Node = null;
    @property(cc.Node) selfTeamContent: cc.Node = null;
    @property(cc.Node) winRewarded: cc.Node = null;
    @property(cc.Node) winRewardContent: cc.Node = null;
    @property(cc.Node) enterRewarded: cc.Node = null;
    @property(cc.Node) enterRewardContent: cc.Node = null;
    @property(cc.Node) fightBtn: cc.Node = null;
    @property(cc.Sprite) bossModel: cc.Sprite = null;
    @property(cc.Label) freeFightInspireLb: cc.Label = null;

    private _order: number = -1;
    private _loadView: Function = null;
    private _guildMonsterCfg: cfg.GuildMonster = null;
    private _bossState: BOSS_STATE = null;
    private _intervel: Function = null;
    private _spriteLoader: SpriteLoader = new SpriteLoader();

    onInit(order: number, loadView: Function) {
        this._order = order;
        this._loadView = loadView;
        // guiManager.addCoinNode(this.node);
        this.doInit();
        this._dueData();
    }

    onRelease() {
        this._stopIntervel();
        eventCenter.unregisterAll(this);
        this._spriteLoader.release();
        if(this.winRewardContent.childrenCount > 0) {
            let children = [...this.winRewardContent.children]
            children.forEach(_c => {
                let itemBagCmp = _c.getComponent(ItemBag);
                ItemBagPool.put(itemBagCmp);
            });
        }

        if(this.enterRewardContent.childrenCount > 0) {
            let children = [...this.enterRewardContent.children]
            children.forEach(_c => {
                let itemBagCmp = _c.getComponent(ItemBag);
                ItemBagPool.put(itemBagCmp);
            });
        }
        // guiManager.removeCoinNode(this.node);
        this._clearHeadSquare();
        this.releaseSubView();
    }

    doInit() {
        eventCenter.register(guildEvent.JOIN_FIGHT_SUC, this, this._recvJoinFightSuc);
        eventCenter.register(guildEvent.FIGHT_INSPIRE_SUC, this, this._recvInspireSuc);
        eventCenter.register(guildEvent.RECV_REWARD, this, this._recvGetReawrd);
        eventCenter.register(guildEvent.UPDATE_BOSS_VIEW, this, this._dueData);
        eventCenter.register(bagDataEvent.ITEM_CHANGE, this, this._refreshStateView);
    }

    private _dueData() {
        let isNeedReset = this._checkGuildBossNeedReset();
        if(isNeedReset) {
            this.closeView();
            return;
        }
        let bossInfo = guildData.bossInfo;
        if(bossInfo) {
            this._guildMonsterCfg = configManager.getOneConfigByManyKV('guildMonster', "GuildMonsterLevel", bossInfo.Level || 1, "GuildMonsterOrder", this._order);
            if(this._guildMonsterCfg) {
                this._refreshCommonView();
                this._refreshView();
            }
        }
    }

    private _refreshView() {
        this._resetView();
        this._refreshBossState();
        this._refreshStateView();
    }

    private _refreshStateView() {
        switch(this._bossState) {
            case BOSS_STATE.CANT_FIGHT: {
                this._refreshCantFightView();
                break;
            }
            case BOSS_STATE.FIGHT_PRESET: 
            case BOSS_STATE.FIGHTING: {
                this._refreshPresetView();
                this._refreshPresetRoleView();
                break;
            }
            case BOSS_STATE.FIGHT_END: {
                this._refreshFightEndView();
                break;
            }
            default: {
                break;
            }
        }
    }

    private _refreshCommonView() {
        let updateRewardFunc = (rewardsString: string, content: cc.Node) => {
            let rewards = rewardsString.split('|');
            for(let i = 0; i < rewards.length; ++i) {
                let item = content.children[i];
                let itemInfo = rewards[i].split(';');
                let itemBagCmp = null;
                if(!item) {
                    itemBagCmp = ItemBagPool.get();
                    item = itemBagCmp.node;
                    content.addChild(item);
                }
                if(itemBagCmp) {
                    let itemId: number = Number(itemInfo[0]);
                    itemBagCmp.init({
                        id: itemId,
                        count:  Number(itemInfo[1]),
                        clickHandler: () => {
                            let newitem: data.IBagUnit = { ID: itemId, Count: Number(itemInfo[1]), Seq: 0 };
                            this._loadView(VIEW_NAME.TIPS_ITEM, newitem);
                        }
                    });
                }
            }
        }

        updateRewardFunc(this._guildMonsterCfg.GuildMonsterWinRewardShow, this.winRewardContent);
        updateRewardFunc(this._guildMonsterCfg.GuildMonsterJoinRewardShow, this.enterRewardContent);

        // 刷新下已领取标识的位置
        this.scheduleOnce(() => {
            this.winRewarded.x = this.winRewardContent.x + this.winRewardContent.width + this.winRewarded.width / 2 + 20;
            this.enterRewarded.x = this.enterRewardContent.x + this.enterRewardContent.width + this.enterRewarded.width / 2 + 20;
        }, 0.02);

        this.bossPowerLb.string = `${this._guildMonsterCfg.GuildMonsterNeedNum}`;

        // this.bossModel.node.color = cc.Color.WHITE;
        let bossModelUrl = resPathUtils.getGuildBossModel(this._guildMonsterCfg.GuildMonsterImage);
        this._spriteLoader.changeSprite(this.bossModel, bossModelUrl);
    }

    private _resetView() {
        this.fightingCountdownLb.node.active = false;
        this.isPassed.active = false;
        this.fightTeamLb.node.active = false;
        this.fightTeamCountLb.node.active = false;
        this.fightInspireBtn.active = false;
        this.fightInspireCostIcon.active = false;
        this.fightInspireCostLb.node.active = false;
        this.fightingTips.active = false;

        this.fightBtn.active = false;
        this.fightTeamBtn.active = false;

        this.fightInspireLb.node.active = false;
        this.freeFightInspireLb.node.active = false;

        this.startFightTips.active = false;
        this.startFightCountdownLb.node.active = false;

        this.enterRewarded.active = false;
        this.winRewarded.active = false;

        this.guildPowerBg.active = false;
        this.guildPowerLb.node.active = false;
        this.guildPowerTips.active = false;
        this.reachPowerTips.active = false;

        this.selfTeamAddPowerLb.node.active =  false;
        this.selfTeamAddPowerTips.active = false;
        this.selfTeamAddPowerIcon.active = false;

        this.cantFightTips.active = false;
        this.selfTeamContent.active = false;

        this._clearHeadSquare();
    }

    private _refreshCantFightView() {
        // this.bossModel.node.color = cc.Color.BLACK;
        this.cantFightTips.active = true;
        this.enterRewarded.active = this._checkEnterRewarded();
        this.winRewarded.active = this._checkWinRewarded();
    }

    //更新鼓舞状态
    private _updateInspireState(){
        let freeInspireTotalNum = guildData.getTotalFreeInspireCount();
        let surplusFreeNum = freeInspireTotalNum - guildData.freeInspiredNum;
        if(surplusFreeNum > 0){
            this.freeFightInspireLb.node.active = true;
            this.freeFightInspireLb.string = '免费';
            this.fightInspireCostIcon.active = false;
            this.fightInspireCostLb.node.active = false;
            return;
        }

        this.freeFightInspireLb.node.active = false;
        this.fightInspireCostIcon.active = true;
        this.fightInspireCostLb.node.active = true;
        let inspireCost = configUtils.getConfigModule('GuildMonsterAddFightCostMoney');
        let inspireColor = cc.color().fromHEX('#E7C57F');
        if(inspireCost > bagData.gold) {
            inspireColor = cc.Color.RED;
        }
        this.fightInspireCostLb.node.color = inspireColor;
        this.fightInspireCostLb.string = `x ${inspireCost}`;
    }

    private _refreshPresetRoleView() {
        let isToFighted = this._checkSelfIsFighted();
        this.fightBtn.active = !isToFighted && BOSS_STATE.FIGHT_PRESET == this._bossState;
        if(isToFighted) {
            this.fightBtn.active = false;
            this.selfTeamAddPowerLb.node.active = true;
            let selfTeamPower = this._getSelfFightPower();
            this.selfTeamAddPowerLb.string = `${selfTeamPower}`;
            this.selfTeamAddPowerTips.active = true;
            this.selfTeamAddPowerIcon.active = true;
            this.scheduleOnce(() => {
                this.selfTeamAddPowerIcon.x = this.selfTeamAddPowerLb.node.x + this.selfTeamAddPowerLb.node.width + 30;
            });
            this.selfTeamContent.active = true;
            let selfFightTeamInfo = this._getSelfFightTeamInfo();
            for(let i = 0; i < selfFightTeamInfo.HeroIDList.length; ++i) {
                let heroId = selfFightTeamInfo.HeroIDList[i];
                let squareHead = this.selfTeamContent.children[i];
                let squareHeadCmp = null;
                if(!squareHead) {
                    squareHeadCmp = ItemHeroHeadSquarePool.get();
                    squareHead = squareHeadCmp.node;
                    this.selfTeamContent.addChild(squareHead);
                    squareHead.scale = 1;
                } else {
                    squareHeadCmp = squareHead.getComponent(ItemHeadSquare);
                }
                let clickHandle = () => {
                    this._loadView(VIEW_NAME.TIPS_HERO, heroId);
                };
                if(squareHeadCmp) {
                    squareHeadCmp.init(heroId, clickHandle.bind(this));
                }
            }
        }
    }

    private _refreshPresetView() {
        this.startFightTips.active = this._bossState == BOSS_STATE.FIGHT_PRESET;
        this.fightingTips.active = this._bossState == BOSS_STATE.FIGHTING;
        this.startFightCountdownLb.node.active = this._bossState == BOSS_STATE.FIGHT_PRESET;
        this.fightingCountdownLb.node.active = this._bossState == BOSS_STATE.FIGHTING;
        let curTime = serverTime.currServerTime();
        // let curTime = svrConfig.testTime;
        let endTime = this._getBossEndTime();
        let startTime = this._getBossStartTime();
        if(curTime < startTime){
            let countdownTime = this._getBossStartTime() - curTime;
            this.startFightCountdownLb.string = Math.ceil(countdownTime / 60 / 60) + '';
            this._startIntervel('', countdownTime, this.startFightCountdownLb, false);
        } else if(curTime < endTime) {
            this._startIntervel('挑战结束倒计时：%d', endTime - curTime, this.fightingCountdownLb);
        } else {
            let todayZeroTime = utils.getTodayZeroTime(true);
                // todayZeroTime = 1638633600;
            this.startFightCountdownLb.string = Math.ceil((startTime - todayZeroTime + this.getOneDayRemainTime()) / 60 / 60) + '';
        }

        this.fightTeamBtn.active = true;
        this.fightTeamLb.node.active = true;
        this.fightTeamCountLb.node.active = true;
        this.fightTeamCountLb.string = `已出战人数 ${utils.getObjLength(guildData.bossInfo.FactionExpeditionHeroList)}/${utils.getObjLength(guildData.guildInfo.Sundry.FactionMemberMap)}`;

        this.fightInspireBtn.active = true;
        this.fightInspireLb.node.active = true;

        this._updateInspireState()

        this.guildPowerTips.active = true;
        this.guildPowerBg.active = true;
        this.guildPowerLb.node.active = true;
        let guildPower: number = this._getGuildPower();
        this.guildPowerLb.string = `${guildPower}`;
        let isReachPower = guildPower >= (this._guildMonsterCfg.GuildMonsterNeedNum || 0);
        this.reachPowerTips.active = isReachPower;
        this.guildPowerLb.node.color = isReachPower ? cc.Color.WHITE : cc.Color.RED;
        
       
    }

    private _refreshFightEndView() {
        this.enterRewarded.active = this._checkEnterRewarded();
        this.winRewarded.active = this._checkWinRewarded();
        this.isPassed.active = true;
    }

    private _clearHeadSquare() {
        let children = [...this.selfTeamContent.children]
        children.forEach(_c => {
            let cmp = _c.getComponent(ItemHeadSquare);
            ItemHeroHeadSquarePool.put(cmp);
        })
    }

    private _refreshBossState() {
        let bossInfo = guildData.bossInfo;
        let curOrder = (bossInfo.Order || 0) + 1;
        if(this._order < curOrder) {
            this._bossState = BOSS_STATE.FIGHT_END;
        } else if(this._order == curOrder) {
            let curTime = serverTime.currServerTime();
            // let curTime = svrConfig.testTime;

            let startTime: number = this._getBossStartTime();
            let endTime: number = this._getBossEndTime();
            if(curTime < startTime) {
                this._bossState = BOSS_STATE.FIGHT_PRESET;
            } else if(curTime < endTime) {
                this._bossState = BOSS_STATE.FIGHTING;
            } else {
                this._bossState = BOSS_STATE.FIGHT_PRESET;
            }
        } else {
            this._bossState = BOSS_STATE.CANT_FIGHT;
        }
    }

    private _recvJoinFightSuc() {
        let isNeedReset = this._checkGuildBossNeedReset();
        if(isNeedReset) {
            this.closeView();
        } else {
            this._refreshPresetView();
            this._refreshPresetRoleView();
        }
    }

    private _recvInspireSuc() {
        guiManager.showTips(`鼓舞成功`);
        this._refreshPresetView();
    }

    private _recvGetReawrd() {
        this._refreshFightEndView();
    }

    onClickFightBtn() {
        this.loadSubView('GuildBossFightTeamView');
    }

    onClickFightTeamBtn() {
        this.loadSubView('GuildBossTeamListView', this._loadView);
    }

    onClickInspireBtn() {
        if(BOSS_STATE.FIGHTING == this._bossState) {
            guiManager.showTips(`开战过程中，无法鼓舞`);
            return;
        }
        // TODO 鼓舞请求
        let inspireCost = configUtils.getConfigModule('GuildMonsterAddFightCostMoney');
        if(bagData.gold < inspireCost) {
            guiManager.showDialogTips(CustomDialogId.COMMON_ITEM_NOT_ENOUGH, CustomItemId.GOLD);
            return;
        }
        if(this._checkCanInspire()) {
            guildOpt.sendFightInspire();
        } else {
            guiManager.showTips(`已达到最大鼓舞次数`);
        }
    }
    /**
     * 获得开战时间 秒
     * @returns 
     */
     private _getBossStartTime(): number {
        let todayZeroTime = utils.getTodayZeroTime(true);
        // todayZeroTime = 1638633600;

        let guildMonsterFightTime = configUtils.getConfigModule('GuildMonsterFightTime');
        let fightStartTime = guildMonsterFightTime.split('|')[0].split(';')
        let startIntervel = Number(fightStartTime[0]) * 60 * 60 + Number(fightStartTime[1]) * 60;
        return todayZeroTime + startIntervel;
    }

    /**
     * 获得开战结束时间 秒
     * @returns 
     */
    private _getBossEndTime(): number {
        let todayZeroTime = utils.getTodayZeroTime(true);
        // todayZeroTime = 1638633600;

        let guildMonsterFightTime = configUtils.getConfigModule('GuildMonsterFightTime');
        let fightEndTime = guildMonsterFightTime.split('|')[1].split(';')
        let startIntervel = Number(fightEndTime[0]) * 60 * 60 + Number(fightEndTime[1]) * 60;
        return todayZeroTime + startIntervel;
    }

    private _checkEnterRewarded(): boolean {
        const joinResultInfo = guildData.bossInfo.FactionExpeditionOrderResultMap[this._order];
        if(!joinResultInfo) return false;
        let resultInfo = joinResultInfo.FactionExpeditionOrderInfoList[joinResultInfo.FactionExpeditionOrderInfoList.length - 1];
        if(resultInfo.JoinUserIDMap[userData.uId]) {
            return resultInfo.ReceiveJoinRewardMap && resultInfo.ReceiveJoinRewardMap[userData.uId];
        }
        return false;
    }

    private _checkWinRewarded(): boolean {
        const joinResultInfo = guildData.bossInfo.FactionExpeditionOrderResultMap[this._order];
        if(!joinResultInfo) return false;
        let resultInfo = joinResultInfo.FactionExpeditionOrderInfoList[joinResultInfo.FactionExpeditionOrderInfoList.length - 1];
        if(resultInfo.IsWin) {
            let winResultInfo = guildData.bossInfo.FactionExpeditionOrderWinRewardMap[this._order];
            if(!winResultInfo) return false;
            if(winResultInfo.ReceiveWinRewardMap[userData.uId]) {
                return true;
            }
        }
        return false;
    }

    private _checkSelfIsFighted() {
        return !!guildData.bossInfo.FactionExpeditionHeroList[userData.uId];
    }

    private _getSelfFightTeamInfo(): data.IFactionExpeditionHero {
        return guildData.bossInfo.FactionExpeditionHeroList[userData.uId];
    }

    private _getSelfFightPower(): number {
        let selfFightInfo = guildData.bossInfo.FactionExpeditionHeroList[userData.uId];
        let inspireAdd: number = configUtils.getConfigModule('GuildMonsterCostAddFight') / 10000;
        let guildInspireTimes = guildData.getGuildInspireCount();
        let power = 0;
        if(selfFightInfo) {
            power = selfFightInfo && selfFightInfo.Power 
            ? Number(selfFightInfo.Power) : 0;
        }
        return Math.round(power * (1 + inspireAdd * guildInspireTimes));
    }

    private _getGuildPower(): number {
        let inspireAdd: number = configUtils.getConfigModule('GuildMonsterCostAddFight') / 10000;
        let fightGuildMembers = guildData.bossInfo.FactionExpeditionHeroList;
        let guildPower: number = 0;
        let inspireCount: number = 0;
        for(const k in fightGuildMembers) {
            // TODO 需要乘鼓舞的战力
            guildPower += fightGuildMembers[k].Power ? Number(fightGuildMembers[k].Power) : 0;
            inspireCount += fightGuildMembers[k].UrgeCount ? Number(fightGuildMembers[k].UrgeCount) : 0;
        }
        guildPower = Math.round(guildPower * (1 + inspireCount * inspireAdd));
        return guildPower;
    }

    private _checkCanInspire(): boolean {
        let maxInspireLimit: number = configUtils.getConfigModule("GuildMonsterAddFightMax") || 500;
        let inspireCount = guildData.bossInfo.FactionExpeditionHeroList && guildData.bossInfo.FactionExpeditionHeroList[userData.uId] ? (guildData.bossInfo.FactionExpeditionHeroList[userData.uId].UrgeCount || 0) : 0;
        return inspireCount <= maxInspireLimit;
    }

    /**
     * 获得今日剩余时间 s
     * @returns 
     */
     getOneDayRemainTime(): number {
        let curTime = serverTime.currServerTime();
        // let curTime = svrConfig.testTime;

        let todayZeroTime = utils.getTodayZeroTime(true);
        // todayZeroTime = 1638633600;

        return 24 * 60 * 60 - (curTime - todayZeroTime);
    }

    private _checkNeedCountDownIntervel(curTime: number, descTime: number): boolean {
        return Math.abs(curTime - descTime) < 60 * 60;
    }

    private _checkGuildBossNeedReset() {
        let curTime: number = serverTime.currServerTime();
        // let curTime: number = svrConfig.testTime;
        let day = new Date(curTime * 1000).getDay();
        let guildMonsterFightTime = configUtils.getConfigModule('GuildMonsterFightTime');
        let fightEndTime = guildMonsterFightTime.split('|')[1].split(';')
        let endIntervel = Number(fightEndTime[0]) * 60 * 60 + Number(fightEndTime[1]) * 60;
        let todayZeroTime = utils.getTodayZeroTime(true);
        // todayZeroTime = 1638633600;
        let endTime = todayZeroTime + endIntervel;
        return day == 0 && curTime >= endTime;
    }

    private _convertToCountdownTime(interval: number): string {
        let timeStr = '';
        let pushTimeStr = (time: number, isShowDoubleZero: boolean = true, isEnd: boolean = false) => {
            if((!isShowDoubleZero && time > 0) || isShowDoubleZero) {
                timeStr += (time < 10 ? '0' + time : time) + '';
                if(!isEnd) {
                    timeStr += ":";
                }
            }
        }
        let hour: number = Math.floor(interval / 60 / 60);
        pushTimeStr(hour, false);
        let NotHourTime = interval % 3600;
        let minute = Math.floor(NotHourTime / 60);
        pushTimeStr(minute);
        let second = NotHourTime % 60;
        pushTimeStr(second, true, true);
        return timeStr;
    }


    private _startIntervel(str: string, startIntervel: number, countdownLb: cc.Label, isShow: boolean = true) {
        if(this._intervel) {
            this._stopIntervel();
        }
        let updateStrFunc = (tempStr: string, tempStartIntervel: number) => {
            let countdownStr = this._convertToCountdownTime(tempStartIntervel);
            let timeStr = tempStr.replace('%d', countdownStr);
            countdownLb.string = timeStr;
        }
        if(isShow) {
            updateStrFunc(str, startIntervel);
        }
        this._intervel = () => {
            if(isShow) {
                updateStrFunc(str, startIntervel);
            }
            --startIntervel;
            if(startIntervel <= 0 && this._intervel) {
                this._stopIntervel();
                // svrConfig.testTime += 200;
                this._refreshView();
            }
        }
        this.schedule(this._intervel, 1);
    }

    private _stopIntervel() {
        if(this._intervel) {
            this.unschedule(this._intervel);
            this._intervel = null;
        }
    }

}
