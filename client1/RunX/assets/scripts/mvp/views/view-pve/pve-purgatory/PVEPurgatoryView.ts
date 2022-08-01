import { ViewBaseComponent } from "../../../../common/components/ViewBaseComponent";
import guiManager from "../../../../common/GUIManager";
import { scheduleManager } from "../../../../common/ScheduleManager";
import { serverTime } from "../../../models/ServerTime";
import { utils } from "../../../../app/AppUtils";
import { VIEW_NAME } from "../../../../app/AppConst";
import { pveTrialData } from "../../../models/PveTrialData";
import ItemBag from "../../view-item/ItemBag";
import { cfg } from "../../../../config/config";
import { configManager } from "../../../../common/ConfigManager";
import { ItemBagPool } from "../../../../common/res-manager/NodePool";
import moduleUIManager from "../../../../common/ModuleUIManager";
import { configUtils } from "../../../../app/ConfigUtils";
import { eventCenter } from "../../../../common/event/EventCenter";
import { purgatoryEvent } from "../../../../common/event/EventData";
import { data, gamesvr } from "../../../../network/lib/protocol";
import ItemPurgatoryMap from "./ItemPurgatoryMap";
import { RANK_TYPE } from "../../view-rank/RankView";
import { PreloadItemHeadMonsterPool, PreloadItemPveBuffPool, PreloadItemPveShopPool } from "../../../../common/res-manager/Preloaders";

interface CountDownInfo {
    endTime: number,        // 结束时间戳(s)
    callback?: Function,     // 结束回调
    templateStr?: string    // 模板字符串
}

interface MapItem {
    info: data.ITrialPointInfo,
    node: cc.Node
}

const {ccclass, property} = cc._decorator;

@ccclass
export default class PVEPurgatoryView extends ViewBaseComponent { 

    @property(cc.Prefab) itemMapPrefab: cc.Prefab = null;

    @property(cc.Label) countdownRefresh: cc.Label = null;
    @property(cc.Label) curStoreyLabel: cc.Label = null;
    @property(cc.Node) layoutBossReward: cc.Node = null;
    @property(cc.Label) countdownFreeRevive: cc.Label = null;
    @property(cc.Sprite) freeReviveIcon: cc.Sprite = null;

    @property(cc.Node) map: cc.Node = null;
    @property(cc.Node) mapBg: cc.Node = null;
    @property(cc.Node) btnBuffs: cc.Node = null;
    @property(cc.Node) buffNode: cc.Node = null;

    functionID: number = null;                              // 页面functionID
    countDownScheduleID: number = null;                     // 倒计时scheduleID
    coutDownMap: Map<cc.Label, CountDownInfo> = new Map();  // key为Label组件，value为倒计时信息

    curStorey: number = 1;  // 当前层数

    itemBags: ItemBag[] = [];   // 缓存节点组件，用于释放

    mapItemMap: Map<number, MapItem> = new Map();   // pointUID - MapItem的map，便于查找更新，不保存空节点
    mapItemArray: Array<MapItem> = new Array();         // MapItem的数组缓存，保存全部

    isBuy: boolean = false;     // 缓存在购买弹窗的选择，用来显示购买结果

    battleBg: string = null;    // 战斗背景

    private _floorIdx: number = 0;  // 地板资源下标
    private _coverIdx: number = 0;  // 覆盖资源下标

    preInit(...rest: any[]): Promise<any> {
        return new Promise((resolve, reject) => {
            PreloadItemPveShopPool()
            .concact(PreloadItemPveBuffPool())
            .concact(PreloadItemHeadMonsterPool())
            .start(() => {
                resolve(true);
            });
        });
    }

    onInit(functionID: number) {
        this.functionID = functionID;

        this.prepareData();

        this.initView();

        eventCenter.register(purgatoryEvent.REFRESH_VIEW, this, this.onRefreshView);
        eventCenter.register(purgatoryEvent.UNMASK_POINT, this, this.onUnmaskPoint);
        eventCenter.register(purgatoryEvent.PURCHASE_RESULT, this, this.onPurchaseResult);
        eventCenter.register(purgatoryEvent.HP_ALTAR, this, this.onHpAltar);
        eventCenter.register(purgatoryEvent.LIVE_ALTAR, this, this.onLiveAltar);
        eventCenter.register(purgatoryEvent.ENTER_PVE_RES, this, this.onEnterPveRes);
    }

    onRelease() {
        this.stopCountDown();
        this.clearItemBags();

        eventCenter.unregisterAll(this);
        guiManager.removeCoinNode(this.node);
        cc.Tween.stopAllByTarget(this.buffNode);
    }

    prepareData() {
        this.curStorey = pveTrialData.getPurgatoryCurStorey();
    }

    initView() {
        // 货币栏
        guiManager.addCoinNode(this.node, this.functionID);

        this.refreshView();

        // 更新地图
        this.refreshMap();
    }

    refreshView() {
        let self = this;

        // 试炼重置倒计时
        this.addCountDown(this.countdownRefresh, {
            endTime: serverTime.currServerTime() + utils.getRestTimeForActivityResetCron()
        });

        // 当前层数
        this.curStoreyLabel.string = `${this.curStorey}层`;

        // 首领奖励
        this.initBossReward();

        // 复活按钮倒计时
        let lastTime: number = utils.longToNumber(pveTrialData.purgatoryData.FreeReliveTime);
        let restTime: number = lastTime + configUtils.getModuleConfigs().PVEInfernalResurrectionFreeCD - serverTime.currServerTime();
        if (restTime <= 0) {
            this.countdownFreeRevive.string = "";
            utils.setSpriteGray(this.freeReviveIcon, false);
        } else {
            utils.setSpriteGray(this.freeReviveIcon, true);
            this.addCountDown(this.countdownFreeRevive, {
                endTime: lastTime + configUtils.getModuleConfigs().PVEInfernalResurrectionFreeCD,
                callback: () => {
                    utils.setSpriteGray(this.freeReviveIcon, false);
                }
            })
        }
    }

    refreshMap() {
        let self = this;

        this.mapItemMap.clear();

        let basicConfig: cfg.PVEInfernalBasic = configManager.getConfigByKey("pveInfernalBasic", this.curStorey);

        // 更新战斗背景
        this.battleBg = basicConfig.PVEInfernalBasicBattleScene;

        // 获取地图Size
        let parseResult = utils.parseStingList(basicConfig.PVEInfernalBasicMassifAll);
        let mapSize: cc.Size = new cc.Size(Number(parseResult[0][0]), Number(parseResult[0][1]));

        // 地板和地块的资源下标
        this._floorIdx = 0;
        let floorImg: string = basicConfig.PVEInfernalBasicMassifImage;
        if (floorImg && floorImg.length > 0) {
            let match = floorImg.match(/[0-9]+/);
            match.length > 0 && (this._floorIdx = Number(match[0]));
        }

        this._coverIdx = 0;
        let coverImg: string = basicConfig.PVEInfernalBasicCoverImage;
        if (coverImg && coverImg.length > 0) {
            let match = coverImg.match(/[0-9]+/);
            match.length > 0 && (this._coverIdx = Number(match[0]));
        }
        
        // 调整数组大小并放入MapItem
        let mapCount: number = mapSize.width * mapSize.height;
        for (let i = 0; i < mapCount || i < this.mapItemArray.length; ++i) {
            if (this.mapItemArray[i] != null) {
                this.mapItemArray[i].info = null;
                this.mapItemArray[i].node.getComponent(ItemPurgatoryMap).deInit();
            } else {
                this.mapItemArray.push({
                    info: null,
                    node: cc.instantiate(this.itemMapPrefab)
                });
            }
        }

        if (mapCount < this.mapItemArray.length) {
            let mapItems = this.mapItemArray.splice(mapCount, this.mapItemArray.length - mapCount);
            mapItems.forEach((mapItem) => {
                mapItem.node.removeFromParent();
                mapItem.node.destroy();
            });
        }

        // 根据MapSize设置map的宽高
        let tempNode: cc.Node = cc.instantiate(this.itemMapPrefab);
        let layout: cc.Layout = this.map.getComponent(cc.Layout);
        this.map.width = mapSize.width * (tempNode.width + layout.spacingX) - layout.spacingX;
        this.map.height = mapSize.height * (tempNode.height + layout.spacingY) - layout.spacingY;
        this.mapBg.setContentSize(this.map.width + tempNode.width / 3, this.map.height + tempNode.height / 3);

        // 根据节点信息设置数组元素并缓存至mapItemMap中，以UID计算数组下标保证不变
        let arrIdx: number = -1;
        let points: data.ITrialPointInfo[] = pveTrialData.purgatoryData.Points;
        for (let i = 0; i < pveTrialData.purgatoryData.Points.length; ++i) {
            if (i >= this.mapItemArray.length) { break; }

            arrIdx = points[i].PointUID % this.mapItemArray.length;
            this.mapItemArray[arrIdx].info = points[i];
            this.mapItemMap.set(points[i].PointUID, this.mapItemArray[arrIdx]);
        }

        // 以refreshTime为种子打乱数组，保证每个用户每天生成的地图是一样的，再将对应节点添加到map上
        utils.randomArray(this.mapItemArray, pveTrialData.purgatoryData.RefreshTime);
        this.mapItemArray.forEach((item) => {
            item.node.getComponent(ItemPurgatoryMap).init(item.info, this, this._floorIdx, this._coverIdx);
            item.node.removeFromParent();
            self.map.addChild(item.node);
        });
    }

    initBossReward() {
        let basicConfig: cfg.PVEInfernalBasic = configManager.getConfigByKey("pveInfernalBasic", this.curStorey);
        if (basicConfig != null) {
            this.clearItemBags();

            let parseResult = utils.parseStingList(basicConfig.PVEInfernalBasicRewardShow);
            let itemBag: ItemBag = null;
            for (let i = 0; i < parseResult.length; ++i) {
                itemBag = ItemBagPool.get();
                itemBag.init({
                    id: parseInt(parseResult[i][0]),
                    count: parseInt(parseResult[i][1]),
                    clickHandler: () => { moduleUIManager.showItemDetailInfo(parseInt(parseResult[i][0]), parseInt(parseResult[i][1]), this.node); }
                });
                this.layoutBossReward.addChild(itemBag.node);
                this.itemBags.push(itemBag);
            }
        }
    }

    clearItemBags() {
        this.itemBags.forEach((itemBag) => {
            ItemBagPool.put(itemBag);
        });
        this.itemBags.splice(0, this.itemBags.length);
    }

    onRefreshView(event: number, refreshMap?: boolean) {
        this.prepareData();
        this.refreshView();

        if (refreshMap) {
            this.refreshMap();
        }
    }

    onUnmaskPoint(cmd: any, msg: gamesvr.TrialPurgatoryUnmaskRes) {
        // 打开宝箱
        if (msg.Prizes && msg.Prizes.length > 0) {
            guiManager.loadView(VIEW_NAME.GET_ITEM_VIEW, this.node, msg.Prizes);
        }

        // 获得buff
        if (msg.BuffID) {
            guiManager.loadView(VIEW_NAME.BUFF_PURGATORY_VIEW, this.node, msg.BuffID, this);
        }

        // 先知之眼
        if (msg.PreViewPoints && msg.PreViewPoints.length > 0) {
            msg.PreViewPoints.forEach((pointUID) => {
                this._updateMapItem(pointUID);
            });
            guiManager.showDialogTips(1000146);
        }

        // 英雄血量减少
        if (msg.Heroes && msg.Heroes.length > 0) {
            let pointID: number = this.mapItemMap.get(msg.PointUID).info.PointID;
            let trapConfig: cfg.PVEInfernalTrap = configManager.getConfigByKey("pveInfernalTrap", pointID);
            let percent = trapConfig.PVEInfernalTrapNum / 100;
            let dialogConfig = configUtils.getDialogCfgByDialogId(1000145);
            guiManager.showTips(utils.convertFormatString(dialogConfig.DialogText, [{num: percent}]));
        }

        // 地图被破坏
        if (msg.RemovePoints && msg.RemovePoints.length > 0) {
            msg.RemovePoints.forEach((pointUID) => {
                this._updateMapItem(pointUID);
            });

            let dialogConfig = configUtils.getDialogCfgByDialogId(1000148);
            guiManager.showTips(utils.convertFormatString(dialogConfig.DialogText, [{num: msg.RemovePoints.length}]));
        }

        // 更新翻开的地块
        this._updateMapItem(msg.PointUID);
    }

    onPurchaseResult(cmd: any, pointUID: number) {
        // 若购买成功，展示结果
        if (this.isBuy) {
            let mapItem = this.mapItemMap.get(pointUID);
            // 获取商品配置
            let shopConfig: cfg.PVEInfernalShop = configManager.getConfigByKey("pveInfernalShop", mapItem.info.PointID);
            let parseReuslt: any[] = utils.parseStingList(shopConfig.PVEInfernalShopItem);

            let itemInfo: data.IItemInfo = data.ItemInfo.create({ID: parseReuslt[0][0], Count: parseReuslt[0][1]});
            guiManager.loadView(VIEW_NAME.GET_ITEM_VIEW, this.node, [itemInfo]);
        }

        this._updateMapItem(pointUID);
    }

    onHpAltar(cmd: any, pointUID: number) {
        guiManager.showDialogTips(1000147);
        this._updateMapItem(pointUID);
    }

    onLiveAltar(cmd: any, pointUID: number) {
        guiManager.showDialogTips(1000147);
        this._updateMapItem(pointUID);
    }

    onEnterPveRes(cmd: any, msg: gamesvr.TrialPurgatoryEnterPveRes) {
        this._updateMapItem(msg.PointUID);
    }

    /**
     * 传入UID，则根据最新的Info刷新
     * @param pointUID 
     */
    private _updateMapItem(pointUID: number) {
        let info = pveTrialData.purgatoryData.Points.find((point) => {
            return point.PointUID === pointUID;
        });
        let mapItem = this.mapItemMap.get(pointUID);
        mapItem.info = info;
        mapItem.node.getComponent(ItemPurgatoryMap).init(mapItem.info, this, this._floorIdx, this._coverIdx);
    }


    onBtnRule() {
        guiManager.loadView(VIEW_NAME.PVE_PURGATORY_RULE_VIEW, this.node);
    }

    onBtnBossReward() {
        guiManager.loadView(VIEW_NAME.PVE_PURGATORY_BOSS_REWARD_VIEW, this.node);
    }

    onBtnRevive() {
        guiManager.loadView(VIEW_NAME.PVE_PURGATORY_REVIVE_VIEW, this.node, this);
    }

    onBtnRank() {
        moduleUIManager.jumpToModule(33000, RANK_TYPE.PURGATORY);
    }

    onBtnMyHeroes() {
        guiManager.loadView(VIEW_NAME.PVE_PURGATORY_MY_HEROES_VIEW, this.node, this);
    }

    onBtnBuffs() {
        guiManager.loadView(VIEW_NAME.PVE_PURGATORY_MY_BUFF_VIEW, this.node, this);
    }

    onBtnClose() {
        this.closeView();
    }


    /** 展示BUFF获得动画 
     * @param isBuff 是否增益
    */
    showBuffAni(isBuff: boolean) {
        this.buffNode.active = true;
        let particleSystem: cc.ParticleSystem = this.buffNode.getComponent(cc.ParticleSystem);
        this.scheduleOnce(() => {
            let color: cc.Color = isBuff ? cc.Color.RED : cc.Color.BLUE;
            particleSystem.startColor = color;
            particleSystem.endColor = color;
        });
        particleSystem.resetSystem();

        
        this.buffNode.setPosition(0, 0);
        

        // TODO
        // let transform = this.btnBuffs.getNodeToParentTransform();
        // let targetPoint = cc.v2(0, 0);
        // cc.AffineTransform.transformVec2(targetPoint, this.btnBuffs.getPosition(), transform);
        // let targetPoint = cc.v2(-195, -285);
        let targetPoint = cc.v2(0, 0);
        targetPoint.x = this.btnBuffs.x + this.btnBuffs.parent.x;
        targetPoint.y = this.btnBuffs.y + this.btnBuffs.parent.y;

        cc.tween(this.buffNode)
            .to(1, {x: targetPoint.x, y: targetPoint.y})
            .call(() => {
                particleSystem.stopSystem();
            })
            .delay(particleSystem.life + particleSystem.lifeVar)
            .set({active: false})
            .start();
    }

    /**
     * 添加倒计时Label
     * @param label label组件
     * @param countDownInfo 倒计时信息
     */
    addCountDown(label: cc.Label, countDownInfo: CountDownInfo) {
        // 首次加入，先做1次展示(避免定时器的执行时间不可控导致的显示问题)
        let restTime: number = countDownInfo.endTime - serverTime.currServerTime();
        if (restTime > 0) {
            this.coutDownMap.set(label, countDownInfo);

            let timeStr: string = utils.getTimeInterval(restTime);
            label.string = countDownInfo.templateStr ? utils.convertFormatString(countDownInfo.templateStr, [{time: timeStr}]) : timeStr;

            // 计时器未开启，开启计时器
            if (this.countDownScheduleID == null) {
                this.countDownScheduleID = scheduleManager.schedule(this.countDown.bind(this), 1);
            }
        } else {
            countDownInfo.callback != null && (countDownInfo.callback());
        }
    }

    countDown() {
        // 倒计时，到达目标时间，则移除并执行回调
        let removeKeys: cc.Label[] = [];
        this.coutDownMap.forEach((value, key) => {
            let restTime: number = value.endTime - serverTime.currServerTime();
            if (restTime > 0) {
                let timeStr: string = utils.getTimeInterval(restTime);
                key.string = value.templateStr ? utils.convertFormatString(value.templateStr, [{time: timeStr}]) : timeStr;
            } else {
                key.string = "";
                value.callback && (value.callback());
                removeKeys.push(key);
            }
        });

        if (removeKeys.length > 0) {
            this.removeCountDown(removeKeys);
        }
    }

    removeCountDown(labels: cc.Label[]) {
        labels.forEach((key) => {
            this.coutDownMap.delete(key);
        });

        if (this.coutDownMap.size === 0) {
            this.stopCountDown();
        }
    }

    stopCountDown() {
        this.coutDownMap.clear();
        scheduleManager.unschedule(this.countDownScheduleID);
        this.countDownScheduleID = null;
    }
}
