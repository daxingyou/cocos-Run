/**
 * @author liulongpo
 * @date 2022-6-7
 * @description 致师之礼-主界面
 */

import { VIEW_NAME } from "../../../../app/AppConst";
import { utils } from "../../../../app/AppUtils";
import { ViewBaseComponent } from "../../../../common/components/ViewBaseComponent";
import { scheduleManager } from "../../../../common/ScheduleManager";
import { pveTrialData } from "../../../models/PveTrialData";
import { serverTime } from "../../../models/ServerTime";
import PVEChallengeReadyNode from "./PVEChallengeReadyNode";
import { configManager } from "../../../../common/ConfigManager";
import { cfg } from "../../../../config/config";
import { REWARD_TYPE } from "../../view-levelmap/ItemLevelReward";
import ItemStageAward from "./ItemStageAward";
import PVEchallengeStartNode from "./PVEChallengeStartNode";
import guiManager from "../../../../common/GUIManager";
import { eventCenter } from "../../../../common/event/EventCenter";
import { respectEvent } from "../../../../common/event/EventData";
import { configUtils } from "../../../../app/ConfigUtils";
import { redDotMgr, RED_DOT_MODULE } from "../../../../common/RedDotManager";
import { data } from "../../../../network/lib/protocol";
import { pveDataOpt } from "../../../operations/PveDataOpt";
import PVEChallengeEndNode from "./PVEChallengeEndNode";
import { PreloadItemPveShopPool } from "../../../../common/res-manager/Preloaders";

const {ccclass, property} = cc._decorator;

enum SUB_NODE_TYPE {
    READY = 0,
    START,
    OVER
}

export enum CHALLENGE_REWARD_STATE {
    NOT_RECEIVE = 0,
    CAN_RECEIVE,
    HAVE_RECEIVED
}

@ccclass
export default class PVEChallengeView extends ViewBaseComponent {

    // -------------- 页面上的节点或组件 --------------
    @property(cc.Prefab) itemStageAwardPrefab: cc.Prefab = null;
    @property([cc.Prefab]) subViewPrefabs: cc.Prefab[] = []; // 0: 准备节点 1：开始节点 2：通关节点

    @property(cc.Label) labelCountDown: cc.Label = null;
    @property(cc.Node) countDownNode: cc.Node = null;
    @property(cc.Node) btnOnceReceive: cc.Node = null;

    @property(cc.Node) subNodeParent: cc.Node = null;
    @property(cc.Node) stageAwardsParent: cc.Node = null;

    stageAwardItems: ItemStageAward[] = []; // 左侧的奖励栏数组，下标与配置数组下标对应
    
    // -------------- 初始化需要的数据 --------------
    monsterLevel: number = -1;   // 怪物库等级
    rewardLevel: number = -1;    // 阶段奖励库等级
    shopLevel: number = -1;      // 商品库等级

    maxChallengeLevel: number = 0;  // 当前阶段关卡数

    rewardConfigs: cfg.PVEChallengeReward[] = [];   // 当前节点奖励配置
    monsterConfigs: cfg.PVEChallengeMonster = null; // 当前节点怪物配置

    lastSubNodeType: SUB_NODE_TYPE = null;              // 上次子节点类型
    subNodeType: SUB_NODE_TYPE = SUB_NODE_TYPE.READY;   // 当前子节点类型

    functionID: number = 0;

    countDownScheduleID: number = -1;
    targetTime: number;

    subNodeComp: PVEChallengeReadyNode | PVEchallengeStartNode | PVEChallengeEndNode = null;    // 子节点脚本，用于调用deInit()

    preInit(...rest: any[]): Promise<any> {
        return new Promise((resolve, reject) => {
            PreloadItemPveShopPool()
            .start(() => {
                resolve(true);
            });
        });
    }

    onInit(functionID: number): void {
        this.functionID = functionID;

        this.prepareData();
        this.initView();

        // 监听
        eventCenter.register(respectEvent.REFRESH_VIEW, this, this.onRefresh);
        eventCenter.register(respectEvent.RECEIVE_AWARD, this, this.onReceiveAward);
        eventCenter.register(respectEvent.BUY_SHOP_SUCCESS, this, this.onBuyShopSuccess);
    }

    onRelease(): void {
        this.stageAwardItems.forEach((item) => {
            item.deInit();
        });

        this.stageAwardItems = null;
        this.stopCoundDown();

        this.subNodeComp && (this.subNodeComp.deInit());

        guiManager.removeCoinNode(this.node);
        eventCenter.unregisterAll(this);
    }

    prepareData() {
        // 根据玩家进入等级计算对应的等级
        let basicConfig: cfg.PVEChallengeBasic = pveTrialData.getChallengeBasicConfig();
        this.monsterLevel = basicConfig.PVEChallengeBasicMonster;
        this.rewardLevel = basicConfig.PVEChallengeBasicReward;
        this.shopLevel = basicConfig.PVEChallengeBasicShop;

        // 获得当前阶段关卡数
        this.maxChallengeLevel = pveTrialData.getChallengeMaxLevel(this.monsterLevel);

        let respectData = pveTrialData.respectData;
        if (respectData.Heroes.length == 0) {
            // 还未开始挑战
            this.subNodeType = SUB_NODE_TYPE.READY;
        } else if (respectData.Progress < this.maxChallengeLevel) {
            // 挑战中
            this.subNodeType = SUB_NODE_TYPE.START;
        } else {
            // 通关
            this.subNodeType = SUB_NODE_TYPE.OVER;
        }

        // 获得当前阶段的奖励配置
        this.rewardConfigs = pveTrialData.getChallengeRewardConfigs(this.rewardLevel);

        // 获得当前节点的怪物配置
        this.monsterConfigs = pveTrialData.getChallengeMonsterConfig(this.monsterLevel, respectData.Progress + 1);
    }

    initView() {
        // 展示右上角物品栏
        guiManager.addCoinNode(this.node, this.functionID);

        // 倒计时
        this.startCountDown(utils.getRestTimeForActivityResetCron());
        
        // 刷新页面
        this.refreshView();

        // 刷新红点
        redDotMgr.fire(RED_DOT_MODULE.CHALLENGE_STAGE_AWARD);
    }

    refreshView() {
        // 展示左边的奖励
        this.showStageAward();

        // 切换对应的子节点
        this.switchSubNode(this.subNodeType);
    }

    onRefresh(): void {
        this.prepareData();
        this.refreshView();
    }

    /** 展示左边的奖励 */
    showStageAward() {
        // 生成并缓存奖励节点
        if (this.stageAwardItems.length != this.rewardConfigs.length) {
            this.stageAwardItems = [];
            this.stageAwardsParent.removeAllChildren();

            let item: cc.Node = null;
            for (let i = 0; i < this.rewardConfigs.length; ++i) {
                item = cc.instantiate(this.itemStageAwardPrefab);
                this.stageAwardsParent.addChild(item);

                this.stageAwardItems.push(item.getComponent(ItemStageAward));
            }
        }

        // 根据数据进行刷新
        let haveRewardCanReceive: boolean = false;  // 是否有可领取的奖励

        let itemComp: ItemStageAward = null;
        let awardState: CHALLENGE_REWARD_STATE = CHALLENGE_REWARD_STATE.NOT_RECEIVE;
        for (let i = 0; i < this.rewardConfigs.length; ++i) {
            if (this.rewardConfigs[i].PVEChallengeRewardNeed > pveTrialData.respectData.Progress) {
                awardState = CHALLENGE_REWARD_STATE.NOT_RECEIVE;
            } else if (pveTrialData.respectData.RewardRecords.indexOf(this.rewardConfigs[i].PVEChallengeRewardId) > -1) {
                awardState = CHALLENGE_REWARD_STATE.HAVE_RECEIVED;
            } else {
                awardState = CHALLENGE_REWARD_STATE.CAN_RECEIVE;
                haveRewardCanReceive = true;
            }

            itemComp = this.stageAwardItems[i];
            itemComp.onInit(this, this.rewardConfigs[i], awardState);
        }

        // 一键领取按钮根据状态置灰
        utils.setButtonInteractable(this.btnOnceReceive.getComponent(cc.Button), haveRewardCanReceive);
    }

    /** 切换要显示的节点 */
    switchSubNode(subNodeType: SUB_NODE_TYPE) {
        // 切换子页面移除添加新节点，因为不存在来回切换，就不做缓存了
        // 同子页面做一次刷新即可
        if (subNodeType === this.lastSubNodeType) {
            let subNode = this.subNodeParent.children[0];

            if (subNodeType === SUB_NODE_TYPE.READY) {
                subNode.getComponent(PVEChallengeReadyNode).onRefresh();
            } else if (subNodeType === SUB_NODE_TYPE.START) {
                subNode.getComponent(PVEchallengeStartNode).onRefresh(this.maxChallengeLevel, this.monsterConfigs);
            } else if (subNodeType === SUB_NODE_TYPE.OVER) {
                subNode.getComponent(PVEChallengeEndNode).onRefresh();
            }
        } else {
            this.subNodeComp && (this.subNodeComp.deInit());
            this.subNodeParent.removeAllChildren();

            let prefab: cc.Prefab = this.subViewPrefabs[subNodeType];
            let subNode = cc.instantiate(prefab);
            this.subNodeParent.addChild(subNode);

            if (subNodeType === SUB_NODE_TYPE.READY) {
                this.subNodeComp = subNode.getComponent(PVEChallengeReadyNode);
                subNode.getComponent(PVEChallengeReadyNode).onInit(this.loadSubView.bind(this));
            } else if (subNodeType === SUB_NODE_TYPE.START) {
                this.subNodeComp = subNode.getComponent(PVEchallengeStartNode);
                subNode.getComponent(PVEchallengeStartNode).onInit(this, this.loadSubView.bind(this), this.maxChallengeLevel, this.monsterConfigs);
            } else if (subNodeType === SUB_NODE_TYPE.OVER) {
                this.subNodeComp = subNode.getComponent(PVEChallengeEndNode);
                subNode.getComponent(PVEChallengeEndNode).onInit();
            }
        }
    }

    /**
     * 开始倒计时
     * @param targetTime 剩余时间
     */
    startCountDown(targetTime: number) {
        if (targetTime <= 0) {
            this.stopCoundDown();
            return;
        }

        if (this.countDownScheduleID > 0) {
            this.stopCoundDown();
        }

        this.countDownNode.active = true;
        this.targetTime = targetTime;
        this.countDown();
        this.countDownScheduleID = scheduleManager.schedule(this.countDown.bind(this), 1);
    }

    countDown() {
        if (this.targetTime <= 0) {
            this.stopCoundDown();
            return;
        }
        this.labelCountDown.string = utils.getTimeInterval(this.targetTime);
        this.targetTime -= 1;
    }

    /**
     * 结束倒计时
     */
    stopCoundDown() {
        this.countDownNode.active = false;
        scheduleManager.unschedule(this.countDownScheduleID);
    }

    // 关闭按钮
    onClickBtnBack() {
        this.closeView();
    }

    // 展示规则
    onClickBtnShowRule() {
        this.loadSubView(VIEW_NAME.PVE_CHALLENGE_RULE_VIEW);
    }

    // 一键领取
    onClickBtnOnceReceive() {
        pveDataOpt.reqTrialRespectRewardAll();
    }

    // 获得奖励
    onReceiveAward(cmd: any, awardIDs: number[]) {
        if (this.node && this.node.isValid){
            let itemInfos: data.IItemInfo[] = [];
            
            let config: cfg.PVEChallengeReward = null;
            let parseResult: any[] = null;
            for (let i = 0; i < awardIDs.length; ++i) {
                config = configManager.getConfigByKey("pveChallengeReward" , awardIDs[i]);
                parseResult = utils.parseStingList(config.PVEChallengeRewardShow);
                for (let j = 0; j < parseResult.length; ++j) {
                    itemInfos.push(data.ItemInfo.create({ID: parseResult[j][0], Count: parseResult[j][1]}));
                }
            }

            guiManager.loadView(VIEW_NAME.GET_ITEM_VIEW, this.node, itemInfos);
        }
    }

    // 成功购买商品
    onBuyShopSuccess(cmd: any, shopID: number) {
        if (this.node && this.node.isValid){
            let itemShopConfig: cfg.PVEChallengeShop = configManager.getConfigByKey("pveChallengeShop", shopID);
            let parseReuslt: any[] = utils.parseStingList(itemShopConfig.PVEChallengeShopItem);

            let itemInfo: data.IItemInfo = data.ItemInfo.create({ID: parseReuslt[0][0], Count: parseReuslt[0][1]});
            guiManager.loadView(VIEW_NAME.GET_ITEM_VIEW, this.node, [itemInfo]);
        }
    }
}
