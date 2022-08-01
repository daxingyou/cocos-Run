import { VIEW_NAME } from "../../../app/AppConst";
import { utils } from "../../../app/AppUtils";
import { configUtils } from "../../../app/ConfigUtils";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { eventCenter } from "../../../common/event/EventCenter";
import { timeLimitEvent } from "../../../common/event/EventData";
import guiManager from "../../../common/GUIManager";
import { logger } from "../../../common/log/Logger";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { cfg } from "../../../config/config";
import { gamesvr } from "../../../network/lib/protocol";
import { TimeLimitData, TIME_LIMIT_TYPE } from "../../models/LimitData";
import { serverTime } from "../../models/ServerTime";
import ItemBag from "../view-item/ItemBag";
import ItemHeroShow from "../view-item/ItemHeroShow";

const {ccclass, property} = cc._decorator;

@ccclass
export default class RandomBaseView extends ViewBaseComponent {
    @property(cc.Label)         tipLb: cc.Label = null;
    @property(cc.Label)         countdownTimeLb: cc.Label = null;
    @property(cc.Node)          heroShowNode: cc.Node = null;
    @property(ItemHeroShow)     itemHeroShow: ItemHeroShow = null;

    protected _limitData: TimeLimitData = null;
    protected _spriteLoader: SpriteLoader = new SpriteLoader();
    protected _countdownTime: number = 0;                           // 秒
    protected _schedule: Function = null;
    onInit(msg: TimeLimitData) {
        this._limitData = msg;
        this.doInit();
        this.refreshCommonView();
    }

    doInit() {
        cc.game.on(cc.game.EVENT_SHOW, this._concent, this);
        eventCenter.register(timeLimitEvent.RECV_BUY_SHOPITEM, this, this._recvBuyShopItem);
        eventCenter.register(timeLimitEvent.END_RANDOM_FIGHT_BATTLE, this, this._recvEndLimitFight);
    }

    onRelease() {
        eventCenter.unregisterAll(this);
        cc.game.off(cc.game.EVENT_SHOW, this._concent, this);
        if(this._spriteLoader) {
            this._spriteLoader.release();
        }
        if(this.itemHeroShow) {
            this.itemHeroShow.onRelease();
        }
        this.releaseSubView();
        this.unscheduleAllCallbacks();
    }

    private _concent() {
        this.refreshCommonView();
    }

    refreshCommonView() {
        let moduleCfg: cfg.ConfigModule = configUtils.getModuleConfigs();
        if(!moduleCfg) {
            logger.error('RandomBaseView moduleCfg error:', this._limitData);
            return;
        }
        let text: string = '';
        let modelId: number = 0;
        if(TIME_LIMIT_TYPE.FIGHT == this._limitData.limitType) {
            // 限时挑战
            // 更新文字内容
            let randomFightTextList = utils.parseStingList(moduleCfg.RandomFightText);
            let fightTalkId = randomFightTextList[utils.getRandomInt(randomFightTextList.length)];
            let dialogCfg = configUtils.getDialogCfgByDialogId(fightTalkId);
            text = dialogCfg.DialogText;
            // TODO 去除怪物列表中 最厉害的
            modelId = this._getModelId(this._limitData.team) || 1050;
        } else if(TIME_LIMIT_TYPE.SHOP == this._limitData.limitType) {
            // 限时商店
            let randomShopTextList = utils.parseStingList(moduleCfg.RandomShopText);
            let shopText = randomShopTextList[this._limitData.textIndex];
            let dialogCfg = configUtils.getDialogCfgByDialogId(Number(shopText[1]));
            text = dialogCfg.DialogText;
            modelId = shopText[0] || 1004;
        }
        this.tipLb.string = text;
        this.calculateTime();
        this.refreshCountdown();
        this.refreshView();
        this.updateSchedule(true);

        if(this.itemHeroShow) {
            this.itemHeroShow.onInit(modelId);
        }
    }

    calculateTime() {
        let moduleCfg: cfg.ConfigModule = configUtils.getModuleConfigs();
        if(!moduleCfg) {
            logger.error('RandomBaseView moduleCfg error:', this._limitData);
            return;
        }
        if(TIME_LIMIT_TYPE.FIGHT == this._limitData.limitType) {
            let randomFightCfg: cfg.RandomFight = configUtils.getRandomFightConfig(this._limitData.fightId);
            if(randomFightCfg) {
                this._countdownTime = randomFightCfg.RandomFightHoldTime;
            }
        } else if(TIME_LIMIT_TYPE.SHOP == this._limitData.limitType) {
            this._countdownTime = moduleCfg.RandomShopHoldTime;
        }
        let curTime: number = serverTime.currServerTime();
        let startTime: number = this._limitData.starTime;
        this._countdownTime -= curTime - startTime;
    }

    refreshView() {
    }

    protected loadView(viewName: string, ...args: any[]) {
        this.loadSubView(viewName, ...args);
    }

    protected _recvBuyShopItem(eventId: number, srvData: gamesvr.TimeLimitTravelBuyShopRes, limitdata: TimeLimitData, shopId: number) {
    }

    protected _recvEndLimitFight(eventid: any, msg: gamesvr.TimeLimitFantasyFinishPveRes) {
        if(this._limitData.ID && this._limitData.ID == utils.longToNumber(msg.ID) && msg.Past) {
            this.stopSchedule();
            this.timeEnd();
        } else {
            this.calculateTime();
            this.refreshCountdown();
        }
    }

    refreshCountdown() {
        let countDownString: string = utils.parseSecondsToHours(this._countdownTime);
        this.countdownTimeLb.string = `剩余时间 ${countDownString}`;
    }

    timeEnd() {
        if(TIME_LIMIT_TYPE.FIGHT == this._limitData.limitType) {
            eventCenter.fire(timeLimitEvent.FIGHT_LIMIT_TIME_END);
        }
        this.closeView();
    }

    updateSchedule(isStart: boolean) {
        if(!isStart){
            this._schedule && this.stopSchedule();
            this.timeEnd();
            return;
        }

        if(this._schedule) return;

        this._schedule = () => {
            --this._countdownTime;
            this.refreshCountdown();
            if(this._countdownTime <= 0) {
                this.stopSchedule();
                this.timeEnd();
            }
        }
        this.schedule(this._schedule, 1);
    }

    stopSchedule() {
        this._schedule && this.unschedule(this._schedule);
        this._schedule = null;
        this._countdownTime = 0;
    }

    protected _getModelId(team: number[]) {
        let monsterId = team[0];
        let cfg = configUtils.getMonsterConfig(monsterId);
        if(cfg) {
            return cfg.ModelId;
        }
        return null;
    }
}