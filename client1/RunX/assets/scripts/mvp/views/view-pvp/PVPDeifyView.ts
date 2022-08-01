/*
 * @Author: xuyang
 * @Date: 2021-07-05 19:17:31
 * @Description: PVP-斩将封神
 */
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { RES_ICON_PRE_URL, VIEW_NAME } from "../../../app/AppConst";
import { utils } from "../../../app/AppUtils";
import { bagDataUtils } from "../../../app/BagDataUtils";
import { configUtils } from "../../../app/ConfigUtils";
import { configManager } from "../../../common/ConfigManager";
import { eventCenter } from "../../../common/event/EventCenter";
import { deifyCombatEvent } from "../../../common/event/EventData";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { cfg } from "../../../config/config";
import { data } from "../../../network/lib/protocol";
import { bagData } from "../../models/BagData";
import { pvpData } from "../../models/PvpData";
import { serverTime } from "../../models/ServerTime";
import { userData } from "../../models/UserData";
import { pvpDataOpt } from "../../operations/PvpDataOpt";
import { ItemBagPool } from "../../../common/res-manager/NodePool";
import List from "../../../common/components/List";
import PVPEnemyListItem from "./PVPEnemyListItem";
import moduleUIManager from "../../../common/ModuleUIManager";
import {scheduleManager} from "../../../common/ScheduleManager";
import RichTextEx from "../../../common/components/rich-text/RichTextEx";
import ItemBag from "../view-item/ItemBag";
import ItemRedDot from "../view-item/ItemRedDot";
import { RED_DOT_MODULE, RED_DOT_TYPE } from "../../../common/RedDotManager";
import guiManager from "../../../common/GUIManager";
import { PVE_MODE, PVP_MODE, ShopSubType } from "../../../app/AppEnums";

const { ccclass, property } = cc._decorator;

@ccclass
export default class PVPDeifyView extends ViewBaseComponent {
    @property(List) listView: List = null;
    @property(cc.Label) rank: cc.Label = null;
    @property(cc.Label) empty: cc.Label = null;
    @property(cc.Node) reward: cc.Node = null;
    @property(cc.Node) tipsNode: cc.Node = null;
    @property(RichTextEx) ticket: RichTextEx = null;

    @property(cc.Label) refreshTxt: cc.Label = null;

    //排行部分用户信息
    @property(cc.Node) userNode: cc.Node = null;
    @property(cc.Sprite) headFrame: cc.Sprite = null;
    @property(cc.Sprite) headImg: cc.Sprite = null;
    @property(cc.Label) userName: cc.Label = null;
    @property(cc.Label) userLv: cc.Label = null;
    @property(ItemRedDot) fightRecordRedDot: ItemRedDot = null;

    private _sId: number = 0;
    private _pvpId: number = 0;
    private _pvpCfg: cfg.PVPList = null;
    private _itemBags: ItemBag[] = [];
    private _sprLoader: SpriteLoader = new SpriteLoader();
    private _enemyList: data.IPVPSpiritEnemy[] = [];       //PVE数据列表

    onInit(pvpId: number) {
        pvpData.pvpConfig = null;
        this._pvpId = pvpId;
        this.registerEvent();

        guiManager.addCoinNode(this.node, pvpId);
        pvpDataOpt.reqPvpSpiritEnemyList();
    }

    deInit() {
        guiManager.removeCoinNode(this.node);
        this._clearItems();
        this._sprLoader.release();
    }

    private _clearItems() {
        this._itemBags.forEach(_i => {
            _i.node.removeFromParent();
            _i.deInit();
            ItemBagPool.put(_i)
        })
        this._itemBags = [];
    }


    registerEvent() {
        eventCenter.register(deifyCombatEvent.CHANGE_ENEMY_LIST, this, this._updateView);
        eventCenter.register(deifyCombatEvent.GET_ENEMY_LIST, this, this._updateView);
        eventCenter.register(deifyCombatEvent.CHANGE_RANK, this, this._updateView);
        eventCenter.register(deifyCombatEvent.FINISH_PVP_RES, this, this.refreshView);
    }

    onRelease() {
        this.deInit(); 
        this.releaseSubView();
        this.unscheduleAllCallbacks();
        this.listView._deInit()
        this._sId != 0 && scheduleManager.unschedule(this._sId);
        this._sId = 0;
        eventCenter.unregisterAll(this);
    }

    onRefresh() {
        if (this._pvpId) {
            this._updateView();
        }
    }

    onListRender(itemNode: cc.Node, idx: number) {
        let item = itemNode.getComponent(PVPEnemyListItem);
        item.init(this._pvpCfg,idx);
    }


    private _updateView() {
        this._pvpCfg = configManager.getConfigByKey("pvpList", this._pvpId);
        this._enemyList.length = 0;
        this._enemyList = utils.deepCopy(pvpData.spiritEnemyList) || [];
        this.refreshView();
    }

    refreshView() {
        //挑战次数
        let numShow = this._pvpCfg.PVPListNumShow;
        let cnt = bagData.getItemCountByID(numShow);
        let rank = pvpData.spiritData.Rank;
        let deifyCfg = configUtils.getDeifyCfgByRank(rank);

        this.ticket.string = `挑战次数：<color=#E97D23>${cnt}</c>`;
        this.rank.string = rank ?`${rank}` : "未上榜";
        this.userNode.active = !!rank;
        this.listView.numItems = this._enemyList.length;
        //当前奖励
        this._clearItems();
        if(deifyCfg && deifyCfg.PVPDeifyDayReward){
            let parseArr = utils.parseStingList(deifyCfg.PVPDeifyDayReward);
            parseArr.forEach((ele) => {
                if (ele && ele.length) {
                    let item = ItemBagPool.get();
                    let itemID = parseInt(ele[0]);
                    let itemCount = parseInt(ele[1]);
                    item.init({
                        id: itemID,
                        count: itemCount,
                        clickHandler: () => { this.onClickItem(itemID, itemCount)}
                    })
                    item.node.parent = this.reward;
                    this._itemBags.push(item);
                }
            })
            this.empty.node.active = false;
            this.reward.active = true;
        }else{
            this.empty.node.active = true;
            this.reward.active = false;
        }
           
        // 下一阶段奖励提示
        let gap = this.getNextLevelGap();
        if (gap){
            this.tipsNode.getComponentInChildren(cc.Label).string = `再提高${gap}名提升奖励`;
            this.tipsNode.active = true;
        }else 
            this.tipsNode.active = false;
        // 刷新时间
        let lastTime = Math.max(serverTime.currServerTime() - pvpData.spiritData.LastTradeTime,0);
        let cfgTime = configUtils.getModuleConfigs().PVPDeifyChangeCD || 0;
        let refreshBtn = this.refreshTxt.node.parent.getComponent(cc.Button);
        this._sId != 0 && scheduleManager.unschedule(this._sId);
        this._sId = 0;
        let delayTime = cfgTime - lastTime;
        if (delayTime > 0){
            // @ts-ignore
            refreshBtn._switchGrayMaterial(true, refreshBtn._sprite);
            this.refreshTxt.string = `换一批(${delayTime})`;
            this._sId = scheduleManager.schedule(() => {
                delayTime--;
                if (delayTime > 0){
                    this.refreshTxt.string = `换一批(${delayTime})`;
                } else {
                    // @ts-ignore
                    refreshBtn._switchGrayMaterial(false, refreshBtn._sprite);
                    this.refreshTxt.string = `换一批`;
                    scheduleManager.unschedule(this._sId);
                    this._sId = 0;
                }
            }, 1.2);
        } else {
            // @ts-ignore
            refreshBtn._switchGrayMaterial(false, refreshBtn._sprite);
            this.refreshTxt.string = `换一批`;
        }
        // 角色信息展示
        this.userName.string = `${userData.accountData.Name}`;
        this.userLv.string = `${userData.lv}`;
        let headUrl = `${RES_ICON_PRE_URL.HEAD_IMG}/` + configUtils.getHeadConfig(userData.accountData.HeadID).HeadFrameImage;
        let frameUrl = `${RES_ICON_PRE_URL.HEAD_FRAME}/` + configUtils.getHeadConfig(userData.accountData.HeadFrameID).HeadFrameImage;
        this._sprLoader.changeSprite(this.headImg, headUrl);
        this._sprLoader.changeSprite(this.headFrame, frameUrl);

        this.fightRecordRedDot.setData(RED_DOT_MODULE.PVP_DEIFY_FIGHT_RECORD, {
            redDotType: RED_DOT_TYPE.NEW
        });
    }


    // ========================================
    // 点击事件
    // ========================================
    onClickDefensive () {
        this.loadSubView(VIEW_NAME.PREINSTALL_VIEW, true,PVP_MODE.DEIFY_COMBAT);
        // guiManager.loadView(VIEW_NAME.PREINSTALL_VIEW, null, true);
    }

    onClickRefresh(){
        if(this._sId != 0){
            guiManager.showDialogTips(1000133);
            return;
        }
        pvpDataOpt.reqTradeEnemies();
    }

    onClickRecord(){
        this.loadSubView("PVPDeifyCombatLogView");
    }

    onClickReward(){
        this.loadSubView("PVPDeifyRankRewardView");
    }

    onClickReputationShop(){
        moduleUIManager.jumpToModule(25000, 0, ShopSubType.Honour);
    }

    onClickItem(itemID: number, count: number) {
        let config = configUtils.getItemConfig(itemID);
        let config1 = configUtils.getEquipConfig(itemID);
        if (config) {
            let newitem: data.IBagUnit = { ID: itemID, Count: count, Seq: 0 };
            this.loadSubView(VIEW_NAME.TIPS_ITEM, newitem);
        } else if (config1) {
            let item: data.IBagUnit = bagDataUtils.buildDefaultEquip(itemID);
           this.loadSubView(VIEW_NAME.TIPS_EQUIP, item);
        }
    }

    // ========================================
    // 辅助计算方法
    // ========================================
    getNextLevelGap(){
        let rank = pvpData.spiritData.Rank;
        let deifyCfg = configUtils.getDeifyCfgByRank(rank);
        if (deifyCfg){
            let rankArea = deifyCfg.PVPDeifyRankSection;
            if (rankArea) {
                let lower = parseInt(rankArea.split(";")[0]);
                if (rank==1){
                    return 0;
                }
                return rank - lower + 1;
            }
        }
        return null;
    }
}
