import { CustomDialogId } from "../../../app/AppConst";
import { BagItemInfo } from "../../../app/AppType";
import { utils } from "../../../app/AppUtils";
import { configManager } from "../../../common/ConfigManager";
import { ItemBagPool } from "../../../common/res-manager/NodePool";
import { uiHelper } from "../../../common/ui-helper/UIHelper";
import { cfg } from "../../../config/config";
import { bagData } from "../../models/BagData";
import { taskData, TASK_FINISH_TYPE } from "../../models/TaskData";
import { taskDataOpt } from "../../operations/TaskDataOpt";
import ItemBag from "../view-item/ItemBag";
import ItemRedDot from "../view-item/ItemRedDot";
import guiManager from "../../../common/GUIManager";
import RichTextEx from "../../../common/components/rich-text/RichTextEx";
import moduleUIManager from "../../../common/ModuleUIManager";
import { bagDataUtils } from "../../../app/BagDataUtils";

const {ccclass, property} = cc._decorator;

export enum TaskType{
    
}

@ccclass
export default class ItemTask extends cc.Component {
    @property(cc.Label)             nameLB: cc.Label = null;
    @property(RichTextEx)           introduceLB: RichTextEx = null;
    @property(RichTextEx)           progressLB: RichTextEx = null;
    @property(cc.ProgressBar)       progress: cc.ProgressBar = null;
    @property(cc.Node)              jumpBtn: cc.Node = null;
    @property(cc.Node)              rewardBtn: cc.Node = null;
    @property(cc.Node)              rewarded: cc.Node = null;
    @property(cc.Node)              rewardContent: cc.Node = null;
    @property(ItemRedDot) itemRedDot: ItemRedDot = null;
    @property(cc.SpriteFrame) sprFrames: cc.SpriteFrame[] = []; 

    private _taskCfg: cfg.TaskTarget = null;
    private _itemBags: ItemBag[] = [];
    private _activityId: number = 0;
    private _rootNode: cc.Node = null;
    private _needShow: boolean = true;

    get groupId(): number {
        return this._taskCfg.TargetGroupID;
    }

    get taskId(): number {
        return this._taskCfg.TargetID;
    }

    set activityId(id: number ){
        this._activityId = id;
    }


    onInit(cfg: cfg.TaskTarget, root?: cc.Node,needShow:boolean = false) {
        this._taskCfg = cfg;
        this._rootNode = root;
        this._activityId = 0;
        this._needShow = needShow;
        this._initView();
    }

    deInit(){
        this.itemRedDot.deInit();
        this._clearItems();
    }

    reuse(){

    }

    unuse(){
        this.deInit();
    }

    private _clearItems() {
        this._itemBags.forEach(_i => {
            _i.node.removeFromParent();
            ItemBagPool.put(_i);
        })
        this._itemBags = [];
    }

    private _initView() {
        // this.nameLB.string `${this._taskCfg.}`
        this.introduceLB.string = `${this._taskCfg.TaskIntroduce}`;
        let isShowProgress: boolean = this._taskCfg.TargetType != TASK_FINISH_TYPE.MAP_LEVEL && this._taskCfg.TargetType != TASK_FINISH_TYPE.PASS_DREAM_LAND_MAP;
        let isCompleted: boolean = taskData.getTaskIsCompleted(this._taskCfg.TargetID),
            isRewarded = taskData.getTaskIsReceiveReward(this._taskCfg.TargetID);
            
        if(isShowProgress) {
            let curCount: number = 0;
            let targetCount: number = Number(this._taskCfg.TargetGoalParam);
            if(TASK_FINISH_TYPE.DAY == this._taskCfg.TargetType || TASK_FINISH_TYPE.WEEK == this._taskCfg.TargetType) {
                // 统计本类型的任务完成个数
                curCount = this.getCompletedTaskCount();
                isCompleted = curCount >= Number(this._taskCfg.TargetGoalParam);
            }
            //充值需要转换下单位
            else if (TASK_FINISH_TYPE.RECHARGE == this._taskCfg.TargetType) {
                curCount = taskData.getTaskGroupCompletedCount(this._taskCfg.TargetID);
                curCount = Math.round(curCount / 100);
                targetCount = Math.round(Number(this._taskCfg.TargetGoalParam) / 100);
            }
            else if (TASK_FINISH_TYPE.HERO_STAR == this._taskCfg.TargetType){
                let heroParams = this._taskCfg.TargetGoalParam.split(";").map(param=>{return Number(param)});
                let hero = bagData.getHeroById(heroParams[0]) ;
                if(hero) {
                    let gainHero = heroParams[1] == bagDataUtils.getHeroInitStar(heroParams[0]);
                    curCount = hero ? hero.star : 0;
                    targetCount = heroParams[1];
                    if (gainHero){
                        curCount = hero ? 1 : 0;
                        targetCount = 1;
                    }
                }
            } else if(TASK_FINISH_TYPE.PART_IN_PVE == this._taskCfg.TargetType) {
                let goalParam = this._taskCfg.TargetGoalParam.split(";");
                targetCount = Number(goalParam[1]);
                curCount = taskData.getTaskGroupCompletedCount(this._taskCfg.TargetID);
            } else if(TASK_FINISH_TYPE.HAS_HERO_STAR_QUALITY == this._taskCfg.TargetType
                || TASK_FINISH_TYPE.HAS_HERO_HIGHER_STAR_QUALITY == this._taskCfg.TargetType
                || TASK_FINISH_TYPE.HAS_HERO_STAR_HIGHER_QUALITY == this._taskCfg.TargetType
                || TASK_FINISH_TYPE.HAS_HERO_HIGHER_STAR_HIGHER_QUALITY == this._taskCfg.TargetType
                || TASK_FINISH_TYPE.HAS_EQUIP_STAR_QUALITY == this._taskCfg.TargetType
                || TASK_FINISH_TYPE.HAS_EQUIP_HIGHER_STAR_QUALITY == this._taskCfg.TargetType
                || TASK_FINISH_TYPE.HAS_EQUIP_STAR_HIGHER_QUALITY == this._taskCfg.TargetType
                || TASK_FINISH_TYPE.HAS_EQUIP_HIGHER_STAR_HIGHER_QUALITY == this._taskCfg.TargetType
            ) {
                let goalParam = this._taskCfg.TargetGoalParam.split(";");
                targetCount = Number(goalParam[2]);
                curCount = taskData.getTaskGroupCompletedCount(this._taskCfg.TargetID);
            } else {
                curCount = taskData.getTaskGroupCompletedCount(this._taskCfg.TargetID);
            }
            this.progressLB.string = `<color=#FF2D23>${curCount}</color>/${targetCount}`;
            this.progress.progress = curCount / targetCount;
        } else {
            this.progress.progress = 0;
        }
        this.progress.node.active = isShowProgress && !isCompleted && !isRewarded;
        this.progressLB.node.active = isShowProgress && !isCompleted && !isRewarded;
        //主线任务显示规则
        this._mainTaskProcessBarRender(isRewarded);

        this.jumpBtn.active = (!isCompleted && !!this._taskCfg.TaskJump);
        this.rewardBtn.active = isCompleted && !isRewarded;
        this.rewardBtn.getComponent(cc.Button).interactable = true;
        this.rewarded.active = isCompleted && isRewarded;
        // 刷新奖励展示
        let rewards = utils.parseStingList(this._taskCfg.TaskRewardShow);
        for(let i = 0; i < rewards.length; ++i) {
            let itemId: number = Number(rewards[i][0]);
            let itemCount: number = Number(rewards[i][1]);
            let item = this._itemBags[i];
            if(!item) {
                item = ItemBagPool.get();
                item.node.scale = 0.8;
                this.rewardContent.addChild(item.node);
                this._itemBags.push(item);
            }
            item.node.active = true;
            let bagItemInfo: BagItemInfo = {
                id: itemId,
                count: itemCount,
                clickHandler: () => {
                    moduleUIManager.showItemDetailInfo(itemId, itemCount, this._rootNode || uiHelper.getRootViewComp(this.node.parent).node);
                }
            }
            item.init(bagItemInfo);
        }

        for (let i = rewards.length; i < this._itemBags.length; i++) {
            if (this._itemBags[i] && cc.isValid(this._itemBags[i])) {
                this._itemBags[i].node.active = false
            }
        }
        
        this.refreshRedDot();
    }

    refreshRedDot() {
        if(this.itemRedDot) {
            const isCompleted = taskData.getTaskIsCompleted(this._taskCfg.TargetID);
            const isReceived = taskData.getTaskIsReceiveReward(this._taskCfg.TargetID);
            this.itemRedDot.showRedDot(isCompleted && !isReceived);
        }
    }

    onClickJumpBtn() {
        // TODO 跳转到相对应的模块
        let jumpCfg = this._taskCfg.TaskJump;
        if(!jumpCfg || jumpCfg.length == 0){
            guiManager.showDialogTips(CustomDialogId.TASK_NO_DESTINATION);
            return;
        }

        let jumpData = utils.parseStringTo1Arr(jumpCfg, ';');
        let mID: number = jumpData[0] ? parseInt(jumpData[0]) : 0;
        let pID: number = jumpData[1] ? parseInt(jumpData[1]) : 0;
        moduleUIManager.jumpToModule(mID, pID);
    }
    /**
     *
     */
    onClickRewardBtn() {
        // 活动任务区分处理
        if (this._activityId){
            taskDataOpt.finishSevneDayTask(this._activityId, this.taskId);
            return;
        }
        taskDataOpt.sendReceiveTaskReward([this.taskId]);
    }

    /**主线任务进度条渲染*/
    private _mainTaskProcessBarRender(isRewarded: boolean) {
        if (!this._needShow) return;
        
        this.progress.node.active = this._needShow;
        this.progressLB.node.active = !this._needShow;
        
        if (this.progress.barSprite && this.sprFrames.length) {
            let sprIndex = isRewarded ? 1 : 0;
            this.progress.barSprite.spriteFrame = this.sprFrames[sprIndex];
        }

        //已领取状态下
        if (isRewarded && this.rewarded && this.rewarded.getComponent(cc.Button)) {
            this.rewarded.getComponent(cc.Button).interactable = false;
            this.rewarded.getComponent(cc.Button).enableAutoGrayEffect = true;
        }
    }

    private getCompletedTaskCount(): number {
        let count: number = 0;
        for(const k in taskData.tasks.GroupCountMap) {
            let groupId: number = Number(k);
            let curCount: number = taskData.tasks.GroupCountMap[k];
            let cfg: cfg.TaskTarget = configManager.getOneConfigByManyKV('task', 'TargetModule', this._taskCfg.TargetModule, 'TargetGroupID', groupId);
            if(cfg && taskData.checkTaskOpened(cfg)) {
                let targetCount: number = Number(cfg.TargetGoalParam);
                if(curCount >= targetCount) {
                    ++count;
                }
            }
        }
        return count;
    }
}
