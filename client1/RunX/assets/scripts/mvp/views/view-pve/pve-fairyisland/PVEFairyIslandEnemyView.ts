import { RES_ICON_PRE_URL, SCENE_NAME } from "../../../../app/AppConst";
import { PVE_MODE } from "../../../../app/AppEnums";
import { PveConfig } from "../../../../app/AppType";
import { configUtils } from "../../../../app/ConfigUtils";
import { ViewBaseComponent } from "../../../../common/components/ViewBaseComponent";
import { configManager } from "../../../../common/ConfigManager";
import { eventCenter } from "../../../../common/event/EventCenter";
import { islandEvent } from "../../../../common/event/EventData";
import guiManager from "../../../../common/GUIManager";
import moduleUIManager from "../../../../common/ModuleUIManager";
import { ItemBagPool } from "../../../../common/res-manager/NodePool";
import { cfg } from "../../../../config/config";
import { islandData, PointType } from "../../../models/IslandData";
import { pveData } from "../../../models/PveData";
import { pveTrialData } from "../../../models/PveTrialData";
import { userData } from "../../../models/UserData";
import ItemBag from "../../view-item/ItemBag";
import ItemIslandEnemy from "./ItemIslandEnemy";

const {ccclass, property} = cc._decorator;
@ccclass
export default class PVEFairyIslandEnemyView extends ViewBaseComponent {

    @property(cc.Layout) enemyLayout: cc.Layout = null;
    @property(cc.Layout) rewardLayout: cc.Layout = null;
    @property(cc.Label) title: cc.Label = null;
    @property(cc.Node) enemyTempNode: cc.Node = null;

    private _enemyType: PointType = PointType.PTBoss;
    private _enmeyList: number[] = [];
    private _rewardItemBag: ItemBag[] = [];
    /**
     * 
     * @param type 野怪类型
     * @param monsterGroupId 野怪组
     * @param dropId 掉落组
     */
    onInit(type: PointType, monsterGroupId: number, dropId: number): void {
        this._enemyType = type;
        this._initTitle();
        this._initEnemyItem(monsterGroupId);
        this._initRewards(type);
        this._registerEvent();
    }

    /**页面释放清理*/
    onRelease() {
        this._enmeyList.length = 0;
        eventCenter.unregisterAll(this);
        this._rewardItemBag.forEach(itemBag => {
            ItemBagPool.put(itemBag);
        })
    }

    /**页面来回跳转刷新*/
    onRefresh(): void {

    }

    private _registerEvent() {
        eventCenter.register(islandEvent.RECEIVE_BATTLE_RES, this, this.closeView);
    }

    private _initTitle() {
        switch (this._enemyType) {
            case PointType.PTBoss: this.title.string = `首领`; break;
            case PointType.PTElite: this.title.string = `精英`; break;
            case PointType.PTBoss: this.title.string = `普通卫士`; break;
        }
    }

    /**初始化英雄*/
    private _initEnemyItem(groupId: number) {
        this.enemyLayout.node.removeAllChildren();
        let monsterCfg: cfg.MonsterGroup = configManager.getConfigByKey("monsterGroup", groupId);
        if (!monsterCfg) return;
        
        this._addEnemyItemByMonsterId(monsterCfg?.MonsterId1);
        this._addEnemyItemByMonsterId(monsterCfg?.MonsterId2);
        this._addEnemyItemByMonsterId(monsterCfg?.MonsterId3);
        this._addEnemyItemByMonsterId(monsterCfg?.MonsterId4);
        this._addEnemyItemByMonsterId(monsterCfg?.MonsterId5);
    }

    private _addEnemyItemByMonsterId(mstId: number) {    
        if (!mstId) {
            this._enmeyList.push(0);
            return;
        }
        this._enmeyList.push(mstId);
        let item = cc.instantiate(this.enemyTempNode);
        item.parent = this.enemyLayout.node;
        this.enemyLayout.node.width += item.width;
        let enemeyComp = item.getComponent(ItemIslandEnemy);
        if (enemeyComp) {
            enemeyComp.node.scale = 1.3;
            enemeyComp.loadEnemeySp(mstId);
            enemeyComp.checkIsBoss(this._enemyType == PointType.PTBoss);
        }
    }

    /**初始化奖励*/
    private _initRewards(monsterType: number) {
        let layerID: number = pveTrialData.islandData.Progress + 1;
        let rewards = islandData.getRewardCfgByLayerID(layerID, monsterType);
        if (!rewards) return;
        let dropShow: string[] = rewards.split("|");
        dropShow.forEach(str => {
            let dropIds = str.split(";").map(Number);
            if (dropIds && dropIds.length) {
                let itemBag = ItemBagPool.get();
                itemBag.init({
                    id: dropIds[0],
                    count: dropIds[1],
                    clickHandler: () => { moduleUIManager.showItemDetailInfo(dropIds[0], dropIds[1], this.node); }
                });
                itemBag.node.scale = 0.9;
                itemBag.node.parent = this.rewardLayout.node;
                this._rewardItemBag.push(itemBag);
                this.rewardLayout.node.width += itemBag.node.width;
            }
        })
    }

    /**开始战斗*/
    startBattle() {
        let pveConfig: PveConfig = {
            lessonId: null,
            userLv: userData.lv,
            pveMode: PVE_MODE.FAIRY_ISLAND,
            monsterIds: this._enmeyList.concat(),
            pveListId: 17018
        }

        pveData.pveConfig = pveConfig;
        guiManager.loadScene(SCENE_NAME.BATTLE);
        this.closeView();
    }
}