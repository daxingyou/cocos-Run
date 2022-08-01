import { activityUtils } from "../../../app/ActivityUtils";
import { configUtils } from "../../../app/ConfigUtils";
import { audioManager, SFX_TYPE } from "../../../common/AudioManager";
import guiManager from "../../../common/GUIManager";
import { RED_DOT_MODULE } from "../../../common/RedDotManager";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { serverTime } from "../../models/ServerTime";
import ItemRedDot from "../view-item/ItemRedDot";

let {ccclass, property} = cc._decorator;

@ccclass
export default class ItemDoubleWeekIcon extends cc.Component {
    @property(cc.Label) openTips: cc.Label = null;
    @property(cc.Node) tipsNode: cc.Node = null;
    @property(ItemRedDot) itemRedDot: ItemRedDot = null;

    private _activityId: number = 0;
    private _rootNode: cc.Node = null;
    private _spriteLoader: SpriteLoader = new SpriteLoader();
    init(id: number, rootNode: cc.Node) {
        this._activityId = id;
        this._rootNode = rootNode;
        this._refreshView();
    }

    deInit() {
        this.itemRedDot.deInit();
        this.unscheduleAllCallbacks();
        this._spriteLoader.release();
    }

    private _refreshView() {
        let cfg = configUtils.getDoubleWeekListConfig(this._activityId);
        if(cfg) {
            let iconUrl = cfg.EntryIcon;
            let sprite = this.node.getComponent(cc.Sprite);
            this._spriteLoader.changeSprite(sprite, iconUrl);
            let activityTimes = activityUtils.calBeginEndTime(cfg.OpenTime, cfg.HoldTime);
            let startTime = activityTimes[0];
            let curTime = serverTime.currServerTime();
            this.openTips.node.active = curTime < startTime;
            if(curTime < startTime) {
                let day = Math.ceil((startTime - curTime) / (24 * 60 * 60));
                this.openTips.string = `${day}天后开启`;
            } else {
            }
        }

        this.itemRedDot && this.itemRedDot.setData(RED_DOT_MODULE.ACTIVITY_DOUBLE_WEEK_TOGGLE, {
            args: [this._activityId]
        });

        this.tipsNode.active = this.openTips.node.active
    }

    onClickItem() {
        let cfg = configUtils.getDoubleWeekListConfig(this._activityId);
        if(cfg) {
            let activityTimes = activityUtils.calBeginEndTime(cfg.OpenTime, cfg.HoldTime);
            let startTime = activityTimes[0];
            let endTime = activityTimes[1];
            let curTime = serverTime.currServerTime();
            this.openTips.node.active = curTime < startTime;
            if(curTime >= startTime && curTime < endTime) {
                guiManager.loadView('ActivityDoubleWeekView', this._rootNode, this._activityId);
            } else {
                guiManager.showTips('活动暂未开启');
            }
            audioManager.playSfx(SFX_TYPE.BUTTON_CLICK);
        }
    }
}
