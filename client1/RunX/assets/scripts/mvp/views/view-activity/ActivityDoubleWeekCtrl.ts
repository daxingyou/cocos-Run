import { activityUtils } from "../../../app/ActivityUtils";
import { DoubleWeekType } from "../../../app/AppEnums";
import { configManager } from "../../../common/ConfigManager";
import { eventCenter } from "../../../common/event/EventCenter";
import { commonEvent } from "../../../common/event/EventData";
import { ItemDoubleWeekIconPool } from "../../../common/res-manager/NodePool";
import { cfg } from "../../../config/config";
import { serverTime } from "../../models/ServerTime";
import ItemDoubleWeekIcon from "./ItemDoubleWeekIcon";

export const enum ACTIVITY_TIME_TYPE {
    OPEN_SERVER_TIME = 1,
    SERVER_TIME
}

const {ccclass, property} = cc._decorator;

@ccclass
export default class ActivityDoubleWeekCtrl extends cc.Component {
    @property(cc.Node) rootNode: cc.Node = null;
    @property(cc.Node) addParent: cc.Node = null;
    @property(cc.Float) spaceX: number = 10;

    private _doubleWeekList: number[] = [];
    private _willOpenList: number[] = [];
    private _activityType: DoubleWeekType = DoubleWeekType.ALL;
    private _iconList: ItemDoubleWeekIcon[] = null;
    start() {
        this._registerEvents();
    }

    private _registerEvents() {
        eventCenter.register(commonEvent.TIME_DAY_RESET, this, this._onDayReset);
    }

    init(activityType: DoubleWeekType = DoubleWeekType.ALL, subName?: string) {
        this._activityType = activityType;
        this._refreshView(subName);
    }

    deInit() {
        eventCenter.unregisterAll(this);
        this._clear();
    }

    private _onDayReset() {
        this._refreshView();
    }

    private _clear() {
        this._doubleWeekList.length = 0;
        this._willOpenList.length = 0;
        if( this._iconList && this._iconList.length > 0) {
            this._iconList.forEach(_c => {
                cc.isValid(_c) && ItemDoubleWeekIconPool.put(_c);
            });
            this._iconList.length = 0
        }
    }

    updateRedot(){
        
    }

    private _dueData() {
        this._clear();
        const configs: cfg.ActivityWeekSummonList[] = configManager.getConfigList('doubleWeekList');
        if(configs && configs.length > 0) {
            for(let i = 0; i < configs.length; ++i) {
                const config = configs[i];
                const isShow = this._checkIsNeedShow(config);
                if(isShow && (DoubleWeekType.ALL == this._activityType || this._activityType == config.ActivityType)) {
                    this._doubleWeekList.push(config.ID);
                }
            }
        }
        // 需要补充准备开启的活动
        if(this._doubleWeekList.length <= 0 && DoubleWeekType.ALL != this._activityType) {
            if(configs && configs.length > 0) {
                let activityId: number = 0;
                let minTime: number = 0;
                const curTime = serverTime.currServerTime();
                for(let i = 0; i < configs.length; ++i) {
                    const config = configs[i];
                    const activityTimes = activityUtils.calBeginEndTime(config.OpenTime, config.HoldTime);
                    const startTime = activityTimes[0];
                    if(this._activityType == config.ActivityType && curTime < startTime) {
                        // 如果类型相同 并且小于开启时间
                        if(minTime == 0 || startTime - curTime < minTime) {
                            minTime = startTime - curTime;
                            activityId = config.ID;
                        }
                    }
                }
                if(activityId > 0) {
                    this._willOpenList.push(activityId);
                }
            }
        }
    }

    private _refreshView(subName?: string) {
        this._dueData();
        this._iconList = this._iconList || [];

        for(let i = 0; i < this._doubleWeekList.length; ++i) {
            let itemDoubleWeekCmp = ItemDoubleWeekIconPool.get();
            this.addParent.addChild(itemDoubleWeekCmp.node);
            this._iconList.push(itemDoubleWeekCmp);
            itemDoubleWeekCmp.node.x = i * (itemDoubleWeekCmp.node.width + this.spaceX);
            itemDoubleWeekCmp.init(this._doubleWeekList[i], this.rootNode);
        }
        for(let i = 0; i < this._willOpenList.length; ++i) {
            const itemDoubleWeekCmp = ItemDoubleWeekIconPool.get();
            this.addParent.addChild(itemDoubleWeekCmp.node);
            this._iconList.push(itemDoubleWeekCmp);
            itemDoubleWeekCmp.node.x = i * (itemDoubleWeekCmp.node.width + this.spaceX);
            itemDoubleWeekCmp.init(this._willOpenList[i], this.rootNode);
        }
    }

    private _checkIsNeedShow(cfg: cfg.ActivityWeekSummonList): boolean {
        return activityUtils.checkWeekSummonAtyIsNeedShow(cfg);
    }
}
