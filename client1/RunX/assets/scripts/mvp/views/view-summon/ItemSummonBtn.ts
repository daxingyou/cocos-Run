import { activityUtils } from "../../../app/ActivityUtils";
import { DoubleWeekType } from "../../../app/AppEnums";
import { utils } from "../../../app/AppUtils";
import { resPathUtils } from "../../../app/ResPathUrlUtils";
import { configManager } from "../../../common/ConfigManager";
import { RED_DOT_MODULE } from "../../../common/RedDotManager";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { cfg } from "../../../config/config";
import { serverTime } from "../../models/ServerTime";
import ItemRedDot from "../view-item/ItemRedDot";

const { ccclass, property } = cc._decorator;

@ccclass
export default class ItemSummonBtn extends cc.Component {
    @property(cc.Sprite)        summonBg: cc.Sprite = null;
    @property(cc.Label)         lbDayLeft: cc.Label = null;
    @property(cc.Label)         lbName: cc.Label = null;
    @property(cc.Node)          ndDayLeft: cc.Node = null;
    @property(cc.Node)          ndSelect: cc.Node = null;
    @property(cc.Node)          ndSelect2: cc.Node = null;
    @property(cc.Node)          ndActivity: cc.Node = null;
    @property(ItemRedDot)       itemRedDot: ItemRedDot = null;

    private _iconLoader = new SpriteLoader();
    private _cfg: cfg.SummonCard = null;
    private _handler: Function = null;
    private _checkStateFn: Function = null;
    init (cfg: cfg.SummonCard, checkStateFn: Function, clickHandler: Function) {
        this._cfg = cfg;
        this._checkStateFn = checkStateFn;
        this._handler = clickHandler;

        this.node.active = true;
        this.ndSelect.active = false;
        this.ndSelect2.active = false;
        this.ndActivity.active = false;
        this._showView();
        this._refreshRedDot();
    }

    deInit () {
        this._checkStateFn = null;
        this._handler = null;
        this._iconLoader && this._iconLoader.release();
    }

    onClick () {
        this._handler && this._handler(this._cfg.SummonCardId);
    }

    get summonId () {
        return this._cfg.SummonCardId;
    }

    set select (v: boolean) {
        this.ndSelect.active = v;
        this.ndSelect2.active = v;
        this._refreshRedDot();
    }

    private _showView () {
        if (this._cfg) {
            if (this._cfg.SummonCardTab) {
                let url = resPathUtils.getSummonBg(this._cfg.SummonCardTab);
                this._iconLoader.changeSprite(this.summonBg, url);
                let openState = this._checkStateFn(this._cfg);
                let material = cc.Material.getBuiltinMaterial(openState ? '2d-sprite' : '2d-gray-sprite');
                this.summonBg.setMaterial(0, material);
            }

            if (!this._cfg.SummonCardHoldTime || !this._cfg.SummonCardOpenTime || this._cfg.SummonCardOpenTime == "-1" ) {
               this.ndDayLeft.active = false; 
            } else {
                let beginStamp = utils.parseTimeToStamp(this._cfg.SummonCardOpenTime);
                let lastingTime = this._cfg.SummonCardHoldTime * 24 * 60 * 60 * 1000;
                let curr = serverTime.currServerTime() * 1000;
                
                let leftTime = (beginStamp + lastingTime) - curr;
                let leftTimeFormate = utils.getTimeLeft(leftTime/1000);
                this.lbDayLeft.string = `剩余${leftTimeFormate}`; 
            }
            this.lbName.string = `${this._cfg.SummonCardName}`
        }

        this.ndActivity.active = false;
        const configs: cfg.ActivityWeekSummonList[] = configManager.getConfigList('doubleWeekList');
        if(configs && configs.length > 0) {
            for(let i = 0; i < configs.length; ++i) {
                const config = configs[i];
                const isShow = this._checkActivityOpen(config);
                if(isShow) {
                    if ((config.ActivityType == DoubleWeekType.HERO && this._cfg.SummonCardType == 1) || (config.ActivityType == DoubleWeekType.EQUIP && this._cfg.SummonCardType == 2)) {
                        this.ndActivity.active = true;
                    }
                }
            }
        }
    }

    private _refreshRedDot() {
        if(this._cfg.SummonCardType == 1) {
            this.itemRedDot.setData(RED_DOT_MODULE.SUMMON_HERO_TOGGLE, {
                args: [this._cfg],
                isClickCurToggle: this.ndSelect.active || this.ndSelect2.active
            });
        } else if(this._cfg.SummonCardType == 2) {
            this.itemRedDot.setData(RED_DOT_MODULE.SUMMON_EQUIP_TOGGLE, {
                args: [this._cfg],
                isClickCurToggle: this.ndSelect.active || this.ndSelect2.active
            });
        } else if(this._cfg.SummonCardType == 3) {
          this.itemRedDot.setData(RED_DOT_MODULE.SUMMON_BEAST_TOGGLE, {
              args: [this._cfg],
              isClickCurToggle: this.ndSelect.active || this.ndSelect2.active
          });
        }
    }

    
    private _checkActivityOpen(cfg: cfg.ActivityWeekSummonList): boolean {
        const activityTimes = activityUtils.calBeginEndTime(cfg.OpenTime, cfg.HoldTime);
        let curTime = serverTime.currServerTime();
        return curTime >= activityTimes[0] && curTime < activityTimes[1];
    }

}