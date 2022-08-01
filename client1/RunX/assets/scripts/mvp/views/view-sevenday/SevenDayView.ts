import { utils } from "../../../app/AppUtils";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { configManager } from "../../../common/ConfigManager";
import { eventCenter } from "../../../common/event/EventCenter";
import { logger } from "../../../common/log/Logger";
import { cfg } from "../../../config/config";
import { taskData } from "../../models/TaskData";
import { userData } from "../../models/UserData";
import { serverTime } from "../../models/ServerTime";
import { activityEvent, commonEvent, lvMapViewEvent, taskEvent } from "../../../common/event/EventData";
import { ItemBagPool } from "../../../common/res-manager/NodePool";
import { bagData } from "../../models/BagData";
import { data, gamesvr } from "../../../network/lib/protocol";
import { CustomDialogId, VIEW_NAME } from "../../../app/AppConst";
import { activityData } from "../../models/ActivityData";
import { activityOpt } from "../../operations/ActivityOpt";
import { redDotMgr, RED_DOT_MODULE } from "../../../common/RedDotManager";
import List from "../../../common/components/List";
import guiManager from "../../../common/GUIManager";
import {scheduleManager} from "../../../common/ScheduleManager";
import ItemBag from "../view-item/ItemBag";
import ItemRedDot from "../view-item/ItemRedDot";
import moduleUIManager from "../../../common/ModuleUIManager";
import { activityUtils } from "../../../app/ActivityUtils";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";

enum REWARD_INDEX {
    POINT,
    TYPE,
    ID,
    COUNT
}

enum REWARD_TYPE {
    ITEM = 1,
    HERO,
    EQUIP
}

const MAX_DAY = 7;
const {ccclass, property} = cc._decorator;
@ccclass
export default class SevenDayView extends ViewBaseComponent {
    @property(cc.ToggleContainer)   navContainer: cc.ToggleContainer = null;
    @property(List)                 tasksList: List = null;
    @property(cc.Label)             remainTime: cc.Label = null;
    @property(cc.Label)             point: cc.Label = null;
    @property(cc.Node)              emptyItemNode: cc.Node = null;
    @property(cc.Node)              emptyCountNode: cc.Node = null;
    @property(cc.Node)              countTmp: cc.Node = null;
    @property(cc.ProgressBar)       progressBar: cc.ProgressBar = null;
    @property(cc.Sprite)            heroImg: cc.Sprite = null;

    private _activityId: number = 0;
    private _day: number = 0;
    private _lastTogIdx: number = 0;
    private _scheduleId: number = 0;
    private _itemBags: ItemBag[] = [];
    private _tasks: cfg.TaskTarget[] = [];

    private _spLoader: SpriteLoader = null;

    onInit(mID: number, pID: number, sID: number) {
        this._activityId = mID;
        this._registerEvent();
        this._initView();
        guiManager.addCoinNode(this.node, mID);
    }

    onRelease() {
        this._spLoader && this._spLoader.release();
        this._spLoader = null;
        this.deInit();
        guiManager.removeCoinNode(this.node);
        eventCenter.unregisterAll(this);
    }

    onRefresh(){
        this.tasksList._onScrolling();
    }

    deInit(){
        this.tasksList._deInit();
        this._clearItems();
        if (this._scheduleId)
            scheduleManager.unschedule(this._scheduleId);
    }

    private _clearItems() {
        this._itemBags.forEach(_i => {
            ItemBagPool.put(_i)
        })
        this._itemBags = [];
        // 直接清理，不用deInit
        this.emptyCountNode.destroyAllChildren();
        this.progressBar.progress = 0;
    }

    private _registerEvent() {
        eventCenter.register(commonEvent.TIME_DAY_RESET, this, this._recvTimeReset);
        eventCenter.register(taskEvent.CHANGE_PROGRESS, this, this._recvTaskProgressChange);
        // 主线任务不走进度通知
        eventCenter.register(lvMapViewEvent.FINISH_PVE_RES, this, this._recvTaskProgressChange);
        eventCenter.register(taskEvent.RECEIVE_SEVEN_DAY_REWARD, this, this._recvTaskReceiveReward);
        eventCenter.register(activityEvent.SEVENDAY_REWARD_TAKE, this, this._recvSevenDayReward);
    }

    private _initView() {
        this._prepareData();
        this._setupHeroImg();
    }

    private _setupHeroImg(){
        let sevenDayCfg: cfg.ActivitySevenDayTask = configManager.getConfigByKey('sevenDay', this._activityId);
        let heroImg = sevenDayCfg.ActivitySevenDayShowImage;
        if(!heroImg) return;
        this._spLoader = this._spLoader || new SpriteLoader();
        this._spLoader.changeSprite(this.heroImg, heroImg);
    }

    private _initRemainTime() {
        let timeArr = activityUtils.calSevenDayTime(this._activityId);
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
                    guiManager.showTips("活动已结束")
                    this.closeView();
                }
            }, 1)
        }
    }

    private _initRewardInfo(){
        let sevenDayCfg: cfg.ActivitySevenDayTask = configManager.getConfigByKey('sevenDay', this._activityId);
        let curPoint = bagData.getItemCountByID(sevenDayCfg.ActivitySevenDayTaskMoney);
        let activityMap = activityData.sevenDayData.ActivitySevenDayActivityMap[this._activityId]
        let rewardMap = activityMap ? activityMap.ReceiveAnimateRewardMap : {};
        // this._clearItems();
        if (sevenDayCfg.ActivitySevenDayTaskMoneyRewardShow){
            let rewardRes = utils.parseStingList(sevenDayCfg.ActivitySevenDayTaskMoneyRewardShow);
            if (rewardRes && rewardRes.length){
                rewardRes.sort((_a, _b) => {
                    return _a[REWARD_INDEX.POINT] - _b[REWARD_INDEX.POINT];
                });
                rewardRes.forEach((_info, _i)=>{
                    let item = this._itemBags[_i];
                    
                    if (!item || !cc.isValid(item)) {
                        item = ItemBagPool.get();
                        this._itemBags.push(item);
                    }

                    let countNode = cc.instantiate(this.countTmp);
                    // 背包数据加载
                    item.init({
                        id: _info[REWARD_INDEX.ID],
                        count: _info[REWARD_INDEX.COUNT],
                        clickHandler: ()=>{
                            if (curPoint >= _info[REWARD_INDEX.POINT] && !rewardMap[_i]){
                                activityOpt.takeSevenDayReward(this._activityId, _i);
                            } else {
                                moduleUIManager.showItemDetailInfo(_info[REWARD_INDEX.ID], _info[REWARD_INDEX.COUNT], this.node);
                            }
                        }
                    })
                    // 加分数据加载
                    countNode.getComponentInChildren(cc.Label).string = _info[REWARD_INDEX.POINT];
                    countNode.getComponentInChildren(cc.Sprite).node.active = rewardMap[_i];
                    item.showBlack(rewardMap[_i]);
                    item.setRedDotData(RED_DOT_MODULE.SEVENDAY_REWARD, {args: [this._activityId, _i]});
                    item.node.x = countNode.x = this.emptyItemNode.width * (_info[REWARD_INDEX.POINT] / rewardRes[rewardRes.length - 1][REWARD_INDEX.POINT]);
                    item.node.scale = 0.8;
                    item.node.parent = this.emptyItemNode;
                    countNode.active = true;
                    countNode.parent = this.emptyCountNode;
                })
                this.progressBar.progress = (curPoint / rewardRes[rewardRes.length - 1][REWARD_INDEX.POINT]);
            }
        }
        this.point.string = `${curPoint}`;
    }

    private _initToggle(){
        this.navContainer.toggleItems.forEach((toggle, index)=>{
            if (index < this._day) {
                toggle.target.getComponent(cc.Sprite).spriteFrame = toggle.normalSprite;
                toggle.node.getChildByName('disabled').active = false;
                toggle.getComponentInChildren(ItemRedDot).setData(RED_DOT_MODULE.SEVENDAY_TASK, {args: [this._activityId, index]});
            } else{
                toggle.target.getComponent(cc.Sprite).spriteFrame = toggle.disabledSprite;
                toggle.node.getChildByName('disabled').active = true;
            }
        })
    }

    private _recvTimeReset() {
        this._initView();
    }

    private _recvTaskReceiveReward(eventId: number, msg: gamesvr.ActivitySevenDayReceiveTaskRewardRes) {
        // 不用更新任务列表数据，只用刷新数据
        let taskIndex = this._tasks.findIndex(task=>{
            return task.TargetID == msg.TargetID;
        });
       
        this.loadSubView(VIEW_NAME.GET_ITEM_VIEW, msg.Prizes);
        this._tasks = this._getTasksByDay(this._lastTogIdx + 1);
        this.tasksList.numItems = this._tasks.length;
        this._initRewardInfo();
        this._initToggle();
    }

    private _recvTaskProgressChange(eventId: number, msg: gamesvr.TaskTargetGroupCountChangeNotify) {
        this._tasks = this._getTasksByDay(this._lastTogIdx + 1);
        this.tasksList.numItems = this._tasks.length;
        this._initToggle();
    }

    private _recvSevenDayReward(cmd: any, rewards: data.IItemInfo[]) {
        this.loadSubView(VIEW_NAME.GET_ITEM_VIEW, rewards);
        this._initRewardInfo();
    }

    private _prepareData(){
        let currTime = serverTime.currServerTime();
        let timeArr = activityUtils.calSevenDayTime(this._activityId);
        let open = activityUtils.checkSevenDayOpen(this._activityId);
        this._day = Math.floor((currTime - timeArr[0]) / (24 * 60 * 60)) + 1;
        this._day = Math.min(this._day, MAX_DAY) 
        if (open && this._day > 0) {
            let priorIdx = this._getPriorIdx();
            if (!this.navContainer.toggleItems[(priorIdx || this._day) - 1].isChecked)
                this.navContainer.toggleItems[(priorIdx || this._day) - 1].isChecked = true;
            this._lastTogIdx = (priorIdx || this._day) - 1;
            this._initToggle();
            this._tasks = this._getTasksByDay(priorIdx || this._day);
            this.tasksList.numItems = this._tasks.length;
            this._initRemainTime();
            this._initRewardInfo();
        }
    }

    /**
     * @description 按天数获取任务
     * @param day 1-7天数
     * @returns 
     */
    private _getTasksByDay(day: number): cfg.TaskTarget[] {
        let showTasks: cfg.TaskTarget[] = [];
        let sevenDayCfg: cfg.ActivitySevenDayTask = configManager.getConfigByKey('sevenDay', this._activityId);
        if (sevenDayCfg.ActivitySevenDayTaskList){
            let parseRes = utils.parseStingList(sevenDayCfg.ActivitySevenDayTaskList);
            if (parseRes && parseRes[day - 1]){
                for (const k in parseRes[day - 1]) {
                    let taskCfg = configManager.getConfigByKey('task', parseRes[day - 1][k]);
                    if (taskData.checkSatisfyShow(taskCfg)) {
                        showTasks.push(taskCfg);
                    }
                }
            }
        }
        showTasks.sort((_a, _b) => {
            let aCompleted: boolean = taskData.getTaskIsCompleted(_a.TargetID);
            let aReceivedReward: boolean = taskData.getTaskIsReceiveReward(_a.TargetID);
            let bCompleted: boolean = taskData.getTaskIsCompleted(_b.TargetID);
            let bReceivedReward: boolean = taskData.getTaskIsReceiveReward(_b.TargetID);
            let a = aReceivedReward ? 3 : (aCompleted ? 1 : 2);
            let b = bReceivedReward ? 3 : (bCompleted ? 1 : 2);
            if (a == b) {
                return _a.TargetID - _b.TargetID;
            } else {
                return a - b;
            }
        });
        return showTasks;
    }

    private _getPriorIdx(){
        if (this._day > 0){
            for(let i = this._day; i>0 ; i--){
                let taskNew = redDotMgr.getSevenDayTaskTokenByIdx(this._activityId, i-1);
                if (taskNew) return i;
            }
        }
        return 0;
    }
    // 列表数据刷新
    onItemTaskRender(item: cc.Node, index: number) {
        let data = this._tasks[index];
        let itemTask = item.getComponent("ItemTask");
        itemTask.onInit(data);
        itemTask.activityId = this._activityId;
    }
    // 选择时间
    onClickToggle(toggle: cc.Toggle, customEventData: number) {
        let idx = this.navContainer.toggleItems.indexOf(toggle);
        if (toggle && toggle.isChecked && idx > -1){
            if (idx < this._day && idx != this._lastTogIdx){
                this._tasks = this._getTasksByDay(idx + 1);
                this.tasksList.numItems = this._tasks.length;
                this.tasksList.scrollTo(0, 0.1);
                this._lastTogIdx = idx;
                this._initRewardInfo();
            } else if (idx != this._lastTogIdx) {
                guiManager.showDialogTips(CustomDialogId.SEVENDAY_UNOPEN);
                this.navContainer.toggleItems[this._lastTogIdx].isChecked = true;
                // toggle.target.getComponent(cc.Sprite).spriteFrame = toggle.disabledSprite;
            }
        }
        this._initToggle();
    }
}
