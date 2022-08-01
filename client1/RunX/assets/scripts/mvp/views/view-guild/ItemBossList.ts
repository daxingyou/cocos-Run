import { utils } from "../../../app/AppUtils";
import { configUtils } from "../../../app/ConfigUtils";
import { resPathUtils } from "../../../app/ResPathUrlUtils";
import { eventCenter } from "../../../common/event/EventCenter";
import { guildEvent } from "../../../common/event/EventData";
import guiManager from "../../../common/GUIManager";
import { RED_DOT_MODULE } from "../../../common/RedDotManager";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { guildData } from "../../models/GuildData";
import { serverTime } from "../../models/ServerTime";
import { userData } from "../../models/UserData";
import { guildOpt } from "../../operations/GuildOpt";
import ItemRedDot from "../view-item/ItemRedDot";

const enum REWARD_STATE {
    CANT_REWARD,
    CAN_REWARD,
    REWARDED
}

const enum GUILD_BOSS_REWARD_TYPE {
    JOIN,
    WIN
}

const {ccclass, property} = cc._decorator;

@ccclass
export default class ItemBossList extends cc.Component {
    @property(cc.Node) title: cc.Node = null;
    @property(cc.Label) timeLb: cc.Label = null;
    @property(cc.Node) curBg: cc.Node = null;
    @property(cc.Node) normalBg: cc.Node = null;
    @property(cc.Sprite) bossHead: cc.Sprite = null;
    @property([cc.Node]) canReward: cc.Node[] = [];
    @property(ItemRedDot) rewardRedDot: ItemRedDot = null;
    
    private _guildMonsterID: number = 0;
    private _order: number = 0;
    private _intervel: Function = null;
    private _spriteLoader: SpriteLoader = new SpriteLoader();
    private _loadView: Function = null;
    private _isInited: boolean = false;

    private _doInit() {
        if(this._isInited) return;
        this._isInited = true;
        eventCenter.register(guildEvent.RECV_REWARD, this, this._refreshView);
    }

    deInit() {
        this._isInited = false;
        this.rewardRedDot.deInit();
        eventCenter.unregisterAll(this);
        this._stopIntervel();
        this._spriteLoader.release();
    }

    setData(guildMonsterID: number, order: number, loadView: Function) {
        this._doInit();
        this._guildMonsterID = guildMonsterID;
        this._order = order;
        this._loadView = loadView;
        this._refreshView();
        // TODO 需要补充领取奖励展示逻辑
    }

    private _refreshView() {
        let curTime = serverTime.currServerTime();
        // let curTime = svrConfig.testTime;
        let todayZeroTime = utils.getTodayZeroTime(true);
        // todayZeroTime = 1638633600;

        let str: string = '';
        let startTime = this._getBossStartTime();
        let endTime = this._getBossEndTime();
        let descTime: number = 0;
        let intervelStr: string = '';
        let curOrder: number = (guildData.bossInfo.Order || 0) + 1;
        let isSel = this._order == curOrder;
        let isNeedReset: boolean  = this._checkGuildBossIsNeedReset();
        if(curTime < startTime) {
            descTime = startTime;
            str = `挑战时间：${Math.ceil((startTime - curTime) / 60 / 60)}小时后`;
            intervelStr = `挑战时间：%d后`
        } else if(curTime < endTime) {
            descTime = endTime;
            str = `挑战中：${Math.ceil((endTime - curTime) / 60 / 60)}小时后结束`;
            intervelStr = `挑战中：%d后结束`;
        } else {
            if(isSel && !isNeedReset) {
                str = `挑战时间：${Math.ceil((startTime - todayZeroTime + this.getOneDayRemainTime()) / 60 / 60)}小时后`;
            } else {
                str = `今日挑战已结束`;
            }
        }
        if(!isNeedReset && isSel && this._checkNeedCountDownIntervel(curTime, descTime)) {
            this._startIntervel(intervelStr, Math.abs(descTime - curTime));
        } else {
            this.timeLb.string = str;
        }

        this.timeLb.node.active = isSel;
        this.title.active = isSel;
        this.curBg.active = isSel;
        this.normalBg.active = !isSel;

        let winRewardState = this._checkWinRewardState();
        let joinRewardState = this._checkJoinRewardState();

        this.canReward[GUILD_BOSS_REWARD_TYPE.JOIN].active = winRewardState != REWARD_STATE.CAN_REWARD && joinRewardState == REWARD_STATE.CAN_REWARD;
        this.canReward[GUILD_BOSS_REWARD_TYPE.WIN].active = winRewardState == REWARD_STATE.CAN_REWARD;

        let guildMonsterCfg = configUtils.getGuildMonsterCfg(this._guildMonsterID);
        if(guildMonsterCfg) {
            let url = resPathUtils.getGuildBossHead(guildMonsterCfg.GuildMonsterHead);
            this._spriteLoader.changeSprite(this.bossHead, url);
        }

        this._refreshRedDotView();
    }

    private _refreshRedDotView() {
        this.rewardRedDot.setData(RED_DOT_MODULE.GUILD_BOSS_REWARD, {
            args: [this._order]
        });
    }

    onClickBossItem() {
        let winRewardState = this._checkWinRewardState();
        let joinRewardState = this._checkJoinRewardState();
        let isNeedReset = this._checkGuildBossIsNeedReset();
        if(winRewardState == REWARD_STATE.CAN_REWARD) {
            guildOpt.sendGetWinReward(this._order);
            // guildOpt.testGetWinReward(this._order);
        } else if(joinRewardState == REWARD_STATE.CAN_REWARD) {
            guildOpt.sendGetJoinReward(this._order);
            // guildOpt.testGetJoinReward(this._order);
        } else {
            if(isNeedReset) {
                guiManager.showTips('本周活动已结束，请等待下周活动开启');
            } else {
                this._loadView && this._loadView('GuildBossView', this._order, this._loadView);
            }
        }
    }

    private _checkWinRewardState(): REWARD_STATE {
        const joinResultInfo = guildData.bossInfo.FactionExpeditionOrderResultMap[this._order];
        if(!joinResultInfo) return REWARD_STATE.CANT_REWARD;
        let resultInfo = joinResultInfo.FactionExpeditionOrderInfoList[joinResultInfo.FactionExpeditionOrderInfoList.length - 1];
        if(resultInfo.IsWin) {
            let curOrdeWinResult = guildData.bossInfo.FactionExpeditionOrderWinRewardMap[this._order];
            let isRewarded = curOrdeWinResult && curOrdeWinResult.ReceiveWinRewardMap[userData.uId];
            if(!isRewarded) {
                return REWARD_STATE.CAN_REWARD;
            } else {
                return REWARD_STATE.REWARDED;
            }
        }
        return REWARD_STATE.CANT_REWARD;
    }

    private _checkJoinRewardState(): REWARD_STATE {
        const joinResultInfo = guildData.bossInfo.FactionExpeditionOrderResultMap[this._order];
        if(!joinResultInfo) return REWARD_STATE.CANT_REWARD;
        let resultInfo = joinResultInfo.FactionExpeditionOrderInfoList[joinResultInfo.FactionExpeditionOrderInfoList.length - 1];
        if(resultInfo.JoinUserIDMap[userData.uId]) {
            if(!resultInfo.ReceiveJoinRewardMap[userData.uId]) {
                return REWARD_STATE.CAN_REWARD;
            } else {
                return REWARD_STATE.REWARDED;
            }
        }
        return REWARD_STATE.CANT_REWARD;
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

    private _checkGuildBossIsNeedReset(): boolean {
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

    private _startIntervel(str: string, startIntervel: number) {
        if(this._intervel) {
            this._stopIntervel();
        }
        let updateStrFunc = (newStr: string, intervel: number) => {
            let countdownTime = this._convertToCountdownTime(intervel);
            let timeStr = newStr.replace('%d', countdownTime + '');
            this.timeLb.string = timeStr;
        }
        updateStrFunc(str, startIntervel);
        this._intervel = () => {
            updateStrFunc(str, startIntervel);
            --startIntervel;
            if(startIntervel <= 0 && this._intervel) {
                this._stopIntervel();
                // svrConfig.testTime += 200;
                // guildOpt.testFightEnd();
                this._refreshView();
            }
        }
        this.schedule(this._intervel, 1);
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

    private _stopIntervel() {
        if(this._intervel) {
            this.unschedule(this._intervel);
            this._intervel = null;
        }
    }
}
