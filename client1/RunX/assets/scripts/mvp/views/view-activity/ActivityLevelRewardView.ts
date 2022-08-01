/*
 * @Author: xuyang
 * @Description: 活动-等级奖励页面
 */
import { configManager } from "../../../common/ConfigManager";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { eventCenter } from "../../../common/event/EventCenter";
import { cfg } from "../../../config/config";
import { CustomDialogId, VIEW_NAME } from "../../../app/AppConst";
import { configUtils } from "../../../app/ConfigUtils";
import { activityData } from "../../models/ActivityData";
import { gamesvr } from "../../../network/lib/protocol";
import { activityEvent } from "../../../common/event/EventData";
import { userData } from "../../models/UserData";
import { redDotMgr, RED_DOT_MODULE } from "../../../common/RedDotManager";
import { uiHelper } from "../../../common/ui-helper/UIHelper";
import guiManager from "../../../common/GUIManager";
import moduleUIManager from "../../../common/ModuleUIManager";
import ItemActivityLevelReward from "./ItemActivityLevelReward";
import UIGridView, { GridData } from "../../../common/components/UIGridView";

const { ccclass, property } = cc._decorator;
@ccclass
export default class ActivityLevelRewardView extends ViewBaseComponent {
    @property(UIGridView) listview: UIGridView = null;
    @property(cc.Prefab) itemPrefab: cc.Prefab = null;
    @property(cc.Label) title: cc.Label = null;
    @property(cc.Label) title2: cc.Label = null;
    @property(cc.Label) porgressTxt: cc.Label = null;
    @property(cc.ProgressBar) progressBar: cc.ProgressBar = null;

    private _levelCfgs: cfg.ActivityLevelReward[] = [];
    private _itemPool: cc.NodePool = new cc.NodePool();

    onInit(moduleId: number, partId: number, subId: number) {
        this.registerEvent();
        this._prepareData();
        this._refreshView();
    }

    onRelease() {
        eventCenter.unregisterAll(this);
        this.listview.clear();
        this._itemPool.clear();
    }

    onRefresh() {
        this._refreshView();
    }

    registerEvent() {
        eventCenter.register(activityEvent.LEVEL_REWARD_TAKE, this, this._recvTakeRewardRes);
        eventCenter.register(activityEvent.LEVEL_RECHARGE_CHANGE, this, this._recvRechargeChangeNotify);
    }

    private _prepareData(){
        this._levelCfgs = configManager.getConfigList("activityLevelReward");
    }

    private _refreshView(){
        // 配置文本填入
        let titleDiaCfg: cfg.Dialog = configManager.getConfigByKey("dialogue", CustomDialogId.ACTIVITY_LEVELREWARD_TITLE);
        let title2DiaCfg: cfg.Dialog = configManager.getConfigByKey("dialogue", CustomDialogId.ACTIVITY_LEVELREWARD_TITLE2);
        titleDiaCfg && titleDiaCfg.DialogText && (this.title.string = titleDiaCfg.DialogText);
        title2DiaCfg && title2DiaCfg.DialogText && (this.title2.string = title2DiaCfg.DialogText);

        let chargeDiaCfg: cfg.Dialog = configManager.getConfigByKey("dialogue", CustomDialogId.ACTIVITY_LEVELREWARD_CHARGE);
        let moduleCfg = configUtils.getModuleConfigs();
        let levelData = activityData.levelData;
        // 充值进度
        if (moduleCfg.LevelRewardKingCondition){
            let chargeCnt = activityData.levelData.RechargeAmount || 0;
            this.progressBar.progress = chargeCnt/moduleCfg.LevelRewardKingCondition;
            this.porgressTxt.string = this.progressBar.progress >= 1 ? chargeDiaCfg.DialogText : `${chargeCnt/100}/${moduleCfg.LevelRewardKingCondition/100}`;
        }

        //先加载列表再做跳转
        this._initListView();

        let meetKingReward = this.progressBar.progress >= 1;
        let jumpCfg: cfg.ActivityLevelReward = this._levelCfgs.find((cfg) => {
            let rewardTokenAll = meetKingReward ? levelData.ReceiveSpecialRewardMap[cfg.LevelRewardID] : levelData.ReceiveOrdinaryRewardMap[cfg.LevelRewardID];
            let meetLevel = cfg.LevelRewardGetLevel && userData.lv >= cfg.LevelRewardGetLevel
            return !rewardTokenAll && meetLevel;
        })
        jumpCfg && this.listview.scrollTo({key: jumpCfg.LevelRewardID+'', data: null});
    }

    private _initListView() {
        this.listview.clear();

        if(!this._levelCfgs || this._levelCfgs.length == 0) return;

        let gridData: GridData[] = this._levelCfgs.map((ele, idx) => {
            return {
                key: ele.LevelRewardID + '',
                data: ele,
            }
        });

        this.listview.init(gridData, {
            onInit: (item: ItemActivityLevelReward, data: GridData) => {
                let cfg: cfg.ActivityLevelReward = data.data;
                item.init(cfg, this.progressBar.progress >= 1, this.node.parent);
            },
            releaseItem: (item: ItemActivityLevelReward) => {
                item.deInit();
                this._itemPool.put(item.node);
            },

            getItem: (): ItemActivityLevelReward => {
                let node = this._getItemNode();
                node.active = true;
                return node.getComponent(ItemActivityLevelReward);
            }
        })
    }

    onClickCharge(event?: cc.Event, customEventData?: string){
        moduleUIManager.jumpToModule(25000, 2);
    }

    private _recvTakeRewardRes(cmd: any, msg: gamesvr.ActivityLevelReceiveRewardRes) {
        if (msg && msg.Prizes.length > 0) {
            let levelCfg: cfg.ActivityLevelReward = this._levelCfgs.find((cfg)=>{
                return cfg.LevelRewardID == msg.LevelRewardID
            })
            let meetKingReward = this.progressBar.progress >= 1;
            let activityHomeView = uiHelper.getRootViewComp(this.node.parent);

            let levelData = activityData.levelData;
            let jumpCfg: cfg.ActivityLevelReward = this._levelCfgs.find((cfg) => {
                let rewardTokenAll = meetKingReward ? levelData.ReceiveSpecialRewardMap[cfg.LevelRewardID]
                                    : levelData.ReceiveOrdinaryRewardMap[cfg.LevelRewardID];
                let meetLevel = cfg.LevelRewardGetLevel && userData.lv >= cfg.LevelRewardGetLevel
                return !rewardTokenAll && meetLevel;
            })

            levelCfg && this.listview.updateItem({key: levelCfg.LevelRewardID + '', data: levelCfg})
            jumpCfg && this.listview.scrollTo({key: jumpCfg.LevelRewardID +'', data: null});

            if (activityHomeView)
                guiManager.loadView(VIEW_NAME.GET_ITEM_VIEW, activityHomeView.node ,msg.Prizes);

            redDotMgr.fire(RED_DOT_MODULE.ACTIVITY_LEVEL_TOGGLE);
        }
    }

    private _recvRechargeChangeNotify(){
        this._refreshView();
        redDotMgr.fire(RED_DOT_MODULE.ACTIVITY_LEVEL_TOGGLE);
    }

    private _getItemNode() {
        if(this._itemPool.size() > 0){
            return this._itemPool.get();
        }
        return cc.instantiate(this.itemPrefab);
    }
}
