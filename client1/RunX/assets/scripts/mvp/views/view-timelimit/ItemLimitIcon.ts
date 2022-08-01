import { CustomDialogId } from "../../../app/AppConst";
import { utils } from "../../../app/AppUtils";
import { configUtils } from "../../../app/ConfigUtils";
import { audioManager, SFX_TYPE } from "../../../common/AudioManager";
import { eventCenter } from "../../../common/event/EventCenter";
import { timeLimitEvent } from "../../../common/event/EventData";
import guiManager from "../../../common/GUIManager";
import { LimitIconPool } from "../../../common/res-manager/NodePool";
import { scheduleManager } from "../../../common/ScheduleManager";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { cfg } from "../../../config/config";
import { gamesvr } from "../../../network/lib/protocol";
import { commonData } from "../../models/CommonData";
import { limitData, TimeLimitData, TIME_LIMIT_TYPE } from "../../models/LimitData";
import { serverTime } from "../../models/ServerTime";
import ItemRedDot from "../view-item/ItemRedDot";

const {ccclass, property} = cc._decorator;

@ccclass
export default class ItemLimitIcon extends cc.Component {

    @property([cc.SpriteFrame])             limitIcons: cc.SpriteFrame[] = [];
    @property(cc.Sprite)                    limitIcon: cc.Sprite = null;
    @property(cc.Label)                     limitCountDownLb: cc.Label = null;
    @property(ItemRedDot)                   redot: ItemRedDot = null;

    private _limitData: TimeLimitData = null;
    private _countDownTime: number = 0;                 // 秒
    private _clickHandle: Function = null;              // 点击回调
    private _spriteLoader: SpriteLoader = null;
    private _schedulerID: number = 0;
    onInit(limitData: TimeLimitData, clickHandler?: Function) {
        this._limitData = limitData;
        this.node.scale = 1;
        this._clickHandle = clickHandler;

        cc.game.on(cc.game.EVENT_SHOW, this._concent, this);
        eventCenter.register(timeLimitEvent.END_RANDOM_FIGHT_BATTLE, this, this._endRandomFight);

        this.calculateTime();

        //计时器无效时，直接移除
        if(!this._checkIsValid()){
            this._timeEnd(false);
            return;
        }

        this.refreshView();
        this.refreshCountdown();
        this._updateRedot();
        this._doInAct();
        this.updateSchedule(true);
    }

    updateTimer () {
        this._concent();
    }

    onClose (isExplicit: boolean = true) {
        if(!isExplicit){
            LimitIconPool.put(this);
            return;
        }

        this._doOutAct(() => {
            this.node.removeFromParent();
            LimitIconPool.put(this);
        });
    }

    deInit() {
        this._spriteLoader && this._spriteLoader.release();
        this._spriteLoader = null;
        this._clickHandle = null;
        this._stopSchedule();
        this.redot.deInit();
        eventCenter.unregisterAll(this);
        cc.game.off(cc.game.EVENT_SHOW);
        this.unscheduleAllCallbacks();
    }

    private _concent() {
        this.calculateTime();
        //计时器无效时，直接移除
        if(!this._checkIsValid()){
            this._timeEnd(false);
            return;
        }
        this.refreshView();
        this.refreshCountdown();
    }

    calculateTime() {
      let curTime: number = serverTime.currServerTime();
        // 限时挑战
        if(TIME_LIMIT_TYPE.FIGHT == this._limitData.limitType) {
            let randomFightCfg: cfg.RandomFight = configUtils.getRandomFightConfig(this._limitData.fightId);
            randomFightCfg && (this._countDownTime = randomFightCfg.RandomFightHoldTime);
            let startTime: number = this._limitData.starTime;
            this._countDownTime -= (curTime - startTime);
        }

        //限时商店
        if(TIME_LIMIT_TYPE.SHOP == this._limitData.limitType) {
            let moduleCfg: cfg.ConfigModule = configUtils.getModuleConfigs();
            this._countDownTime = moduleCfg.RandomShopHoldTime;
            let startTime: number = this._limitData.starTime;
            this._countDownTime -= (curTime - startTime);
        }

        //限时礼包
        if(TIME_LIMIT_TYPE.GIFT_BAG == this._limitData.limitType) {
            this._countDownTime = this._limitData.endTime - curTime;
        }

    }

    //设置图标
    refreshView() {
        //自定义Icon
        if(this._limitData.iconPath){
            this._spriteLoader = this._spriteLoader || new SpriteLoader();
            this._spriteLoader.changeSprite(this.limitIcon, this._limitData.iconPath);
            return;
        }

        // icon
        this.limitIcon.spriteFrame = this.limitIcons[this._limitData.limitType];
    }

    //更新计时文本
    refreshCountdown() {
        let countDownString: string = utils.parseSecondsToHours(this._countDownTime);
        this.limitCountDownLb.string = countDownString;
    }

    /**
     *
     * @param isExplicit 是否展示关闭动画
     */
    private _timeEnd (isExplicit: boolean = true) {
        // 限时挑战
        if (TIME_LIMIT_TYPE.FIGHT == this._limitData.limitType) {
            guiManager.showDialogTips(CustomDialogId.LIMIT_SHOP_TIPS3);
        }

        // 限时商店
        if (TIME_LIMIT_TYPE.SHOP == this._limitData.limitType) {
            guiManager.showDialogTips(CustomDialogId.LIMIT_SHOP_TIPS4);
        }

        limitData.delLimitData(this._limitData);
        //重置限时礼包
        this._limitData.limitType == TIME_LIMIT_TYPE.GIFT_BAG && limitData.resetLimitedTimeGiftBagData();
        this.onClose(isExplicit);
    }

    private _endRandomFight(eventId: any, msg: gamesvr.TimeLimitFantasyFinishPveRes) {
        if(this._limitData.ID && this._limitData.ID == utils.longToNumber(msg.ID) && msg.Past) {
            this._stopSchedule();
            this._timeEnd();
        } else {
            this.calculateTime();
        }
    }

    updateSchedule(isStart: boolean) {
        if(!isStart){
            this._stopSchedule();
            this._timeEnd();
            return;
        }

        if(this._schedulerID) return;
        this._schedulerID = scheduleManager.schedule(this._countDownInterval.bind(this), 1);
    }

    private _countDownInterval() {
        --this._countDownTime;
        this.refreshCountdown();
        if(this._countDownTime <= 0) {
            this._stopSchedule();
            this._timeEnd();
        }
    }

    private _stopSchedule() {
        this._schedulerID && scheduleManager.unschedule(this._schedulerID);
        this._schedulerID = 0;
        this._countDownTime = 0;
    }

    private _doInAct (cb?: Function) {
        let preScale: cc.Vec2 = cc.v2(this.node.scaleX, this.node.scaleY);
        this.node.scale = 0;
        cc.tween(this.node)
            .to(0.3, {scaleX: preScale.x + 0.1, scaleY: preScale.y + 0.1})
            .to(0.1, {scaleX: preScale.x, scaleY: preScale.y})
            .call(() => {
                cb && cb();
            })
            .start();
    }

    private _doOutAct (cb?: Function) {
        cc.tween(this.node)
            .by(0.1, { scale: 1.02 })
            .to(0.3, { scale: 0 })
            .call(() => {
                cb && cb();
            })
            .start();
    }

    private _updateRedot(){
        //限时挑战
        if(TIME_LIMIT_TYPE.FIGHT == this._limitData.limitType) {
            this.redot.showRedDot(!commonData.tmpCache.RandomFightClicked);
            return;
        }

        //限时商店
        if(TIME_LIMIT_TYPE.SHOP == this._limitData.limitType) {
            this.redot.showRedDot(!commonData.tmpCache.RandomShopClicked);
            return;
        }
    }

    onClickIcon() {
        //限时挑战
        if(TIME_LIMIT_TYPE.FIGHT == this._limitData.limitType) {
            commonData.tmpCache.RandomFightClicked = true;
        }

        //限时商店
        if(TIME_LIMIT_TYPE.SHOP == this._limitData.limitType) {
            commonData.tmpCache.RandomShopClicked = true;
            return;
        }
        this._updateRedot();
        this._clickHandle && this._clickHandle(this._limitData);
        audioManager.playSfx(SFX_TYPE.BUTTON_CLICK);
    }

    //计时器 < 0时， 对应的限时功能就无效了
    private _checkIsValid(){
        return this._countDownTime >= 0;
    }
}
