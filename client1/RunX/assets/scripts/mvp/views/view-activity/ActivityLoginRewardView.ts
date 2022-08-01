import { utils } from "../../../app/AppUtils";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { eventCenter } from "../../../common/event/EventCenter";
import { cfg } from "../../../config/config";
import { serverTime } from "../../models/ServerTime";
import { activityEvent, commonEvent} from "../../../common/event/EventData";
import { data } from "../../../network/lib/protocol";
import { VIEW_NAME } from "../../../app/AppConst";
import { activityUtils } from "../../../app/ActivityUtils";
import { configManager } from "../../../common/ConfigManager";
import { activityData } from "../../models/ActivityData";
import { activityOpt } from "../../operations/ActivityOpt";
import { redDotMgr, RED_DOT_MODULE } from "../../../common/RedDotManager";
import guiManager from "../../../common/GUIManager";
import {scheduleManager} from "../../../common/ScheduleManager";
import ItemActivityLogin from "./ItemActivityLogin";
import ActivityHomeView from "./ActivityHomeView";

enum REWARD_INDEX {
    TYPE,
    ID,
    COUNT
}

interface RewardItem{
    itemId: number,
    count: number,
    day: number,
    token: boolean,
    activityId: number,
    heroRes?: string
}

const MAX_DAY = 7;
const {ccclass, property} = cc._decorator;
@ccclass
export default class ActivityLoginRewardView extends ViewBaseComponent {
    @property(cc.Node)              takeButton: cc.Node = null;
    @property(cc.Node)              tokenButton: cc.Node = null;
    @property(cc.Node)              itemRoot: cc.Node = null;
    @property(cc.Label)             remainTime: cc.Label = null;
    @property(cc.Prefab)            prefabItem: cc.Prefab = null;

    private _activityId: number = 0;
    private _day: number = 0;
    private _scheduleId: number = 0;
    private _rewards: RewardItem[] = [];
    private _iconItems: ItemActivityLogin[] = [];
    private _root: ActivityHomeView = null

    onInit(mID: number, rootView: ActivityHomeView) {
        this._activityId = mID;
        this._root = rootView;
        this._initView();
        eventCenter.register(commonEvent.TIME_DAY_RESET, this, this._recvTimeReset);
        eventCenter.register(activityEvent.LOGIN_REWARD_TAKE, this, this._recvLoginReward);
    }

    onRelease() {
        if (this._scheduleId) 
            scheduleManager.unschedule(this._scheduleId);
        this._iconItems.forEach(_icon => {
            _icon.deInit();
            _icon.node.removeFromParent();
        })
        this._iconItems = [];
        eventCenter.unregisterAll(this);
    }

    onRefresh(){
        // this.rewardList._onScrolling();
    }
    
    private _initView() {
        this._prepareData();
        this._updateRewards();
        this._initRemainTime();

        let haveUntokenReward =  this._rewards.some(reward => {
            return !reward.token && reward.day <= this._day;
        })
        let allToken = !this._rewards.some(reward => {
            return !reward.token;
        })
        
        this.takeButton.active = haveUntokenReward;
        this.tokenButton.active = allToken;
    }

    private _initRemainTime() {
        let timeArr = activityUtils.calActivityTime(this._activityId);
        let closeTime = timeArr[1];
        let remainTime = closeTime - serverTime.currServerTime();
        if (this._scheduleId){
            scheduleManager.unschedule(this._scheduleId);
        }
        if (remainTime && remainTime > 0){
            this.remainTime.string = `活动结束时间：${utils.getTimeInterval(remainTime)}后`;
            this._scheduleId = scheduleManager.schedule(() => {
                let remainTime = closeTime - serverTime.currServerTime(); 
                if (remainTime && remainTime > 0){
                    this.remainTime.string = `活动结束时间：${utils.getTimeInterval(remainTime)}后`;
                } else {
                    // 发送请求获取最新活动配置
                    guiManager.showTips("活动已结束");
                    this.remainTime.string = `活动已结束`;
                    scheduleManager.unschedule(this._scheduleId);
                }
            }, 1)
        } else {
            this.remainTime.string = `活动已结束`;
        }
    }

    private _recvTimeReset() {
        this._initView();
    }

    private _recvLoginReward(cmd: any, rewards: data.IItemInfo[]) {
        if (this._root)
            guiManager.loadView(VIEW_NAME.GET_ITEM_VIEW, this._root.node, rewards);
    
        this._initView();
        redDotMgr.fire(RED_DOT_MODULE.ACTIVITY_LOGIN_TOGGLE);
        redDotMgr.fire(RED_DOT_MODULE.MAIN_ACTIVITY);
    }

    private _prepareData(){
        let currTime = serverTime.currServerTime();
        let timeArr = activityUtils.calActivityTime(this._activityId);
        let activityCfg: cfg.ActivityList = configManager.getConfigByKey("activityList", this._activityId);
        // 活动内容
        if (activityCfg && activityCfg.ActiveListFunctionID){
            let activityId = activityCfg.ActiveListFunctionID;
            let loginCfg: cfg.ActivityOpenServiceLogin = configManager.getConfigByKey("activityLogin", activityId);
            let loginRewardMap = ! activityData.serviceLoginData ? null
                    : activityData.serviceLoginData.ActivityOpenServiceLoginActivityMap[activityId];

            if (loginCfg){
                let rewardRes = utils.parseStingList(loginCfg.ActivityOpenServiceLoginRewardShow);
                let heroRes = loginCfg.ActivityOpenServiceLoginRewardType.split("|");
                if (rewardRes && rewardRes.length) {
                    this._rewards.splice(0);
                    rewardRes.forEach((res, index) => {
                        this._rewards.push({
                            itemId: Number(res[REWARD_INDEX.ID]), 
                            count: Number(res[REWARD_INDEX.COUNT]), 
                            day: index,
                            activityId: activityId,
                            token: loginRewardMap && loginRewardMap.ReceiveLoginRewardMap[index],
                            heroRes: heroRes[index]
                        });
                    });
                }
            }
        }
        // 当前第几天
        this._day = Math.floor((currTime - timeArr[0]) / (24 * 60 * 60));
    }

    private _updateRewards () {
        if (!this._rewards || !this._rewards.length) {
            return;
        }

        for (let i = 0; i < this._rewards.length; i++) {
            let _r = this._rewards[i];

            let _item = this._iconItems[i];
            if (!_item || !cc.isValid(_item)) {
                let _ndItem = cc.instantiate(this.prefabItem);
                _item = _ndItem.getComponent(ItemActivityLogin);
                this._iconItems.push(_item)
                this.itemRoot.addChild(_ndItem)
            }
            _item.init(_r, this._day);
        }
    }

    onClickAutoTake(){
        if (this._rewards && this._rewards.length && this._day > -1){
            let takeIds: number[] = [];
            this._rewards.forEach(reward => {
                if (!reward.token && reward.day <= this._day){
                    takeIds.push(reward.day);
                }
            })
            takeIds.length && activityOpt.takeLoginReward(this._rewards[0].activityId, takeIds);
        }
    }

}

export { RewardItem };
