/*
 * @Author: xuyang
 * @Date: 2021-07-05 19:17:31
 * @Description: PVP-论道修仙
 */
import { CustomDialogId, TREASURE_SYS_POWER_TYPE, VIEW_NAME } from "../../../app/AppConst";
import { utils } from "../../../app/AppUtils";
import { configUtils } from "../../../app/ConfigUtils";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { configManager } from "../../../common/ConfigManager";
import { eventCenter } from "../../../common/event/EventCenter";
import { bagDataEvent, immortalsEvent } from "../../../common/event/EventData";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { cfg } from "../../../config/config";
import { data } from "../../../network/lib/protocol";
import { bagData } from "../../models/BagData";
import { pvpData } from "../../models/PvpData";
import { userData } from "../../models/UserData";
import { pvpDataOpt } from "../../operations/PvpDataOpt";
import { resPathUtils } from "../../../app/ResPathUrlUtils";
import { bagDataUtils } from "../../../app/BagDataUtils";
import { ItemBagPool } from "../../../common/res-manager/NodePool";
import moduleUIManager from "../../../common/ModuleUIManager";
import RichTextEx from "../../../common/components/rich-text/RichTextEx";
import ItemBag from "../view-item/ItemBag";
import List from "../../../common/components/List";
import PVPFightListItem from "./PVPFightListItem";
import guiManager from "../../../common/GUIManager";
import { ShopSubType } from "../../../app/AppEnums";
import { taskData } from "../../models/TaskData";

const { ccclass, property } = cc._decorator;
const MAX_BUFF = 2;

enum RANK_TYPE {INTEGRAL=1, RANK};

@ccclass
export default class PVPImmortalsView extends ViewBaseComponent {
    @property(List) listView: List = null;
    @property(cc.Label) rank: cc.Label = null;
    @property(cc.Sprite) rankIcon: cc.Sprite = null;
    @property(RichTextEx) pointGain: RichTextEx = null;
    @property(RichTextEx) ticket: RichTextEx = null;
    @property(cc.Label) intro: cc.Label = null;
    // 奖励相关
    @property(cc.Node) reward: cc.Node = null;
    @property(cc.Node) tipsNode: cc.Node = null;
    // 战绩相关
    @property(cc.Label) grade: cc.Label = null;
    @property(cc.Label) winCnt: cc.Label = null;
    @property(cc.Label) point: cc.Label = null;
    @property(cc.ProgressBar) progressBar: cc.ProgressBar = null;
    // buff相关
    @property(cc.Label) buffIntro: cc.Label = null;
    @property(cc.Label) buffNull: cc.Label = null;
    @property(cc.Label) buffPrice: cc.Label = null;
    @property(cc.Label) buffDiscountPrice: cc.Label = null;
    @property(cc.Label) buffPriceIntro: cc.Label = null;
    @property(cc.Sprite) buffPriceIcon: cc.Sprite = null;
    @property([cc.Toggle]) buffs: cc.Toggle[] = [];
    // 其他
    @property(cc.Node) ticketNode: cc.Node = null;
    @property(cc.Node) fightNode: cc.Node = null;
    @property(cc.Sprite) ticketIcon: cc.Sprite = null;

    private _pvpId: number = 0;
    private _pvpCfg: cfg.PVPList = null;
    private _minRank: number = 0;
    private _holdBuffs: number[] = [];
    private _openFight: boolean = false;
    private _itemBags: ItemBag[] = [];
    private _fightList: data.IPVPFairyFightUser[] = [];
    private _canBuyBuff: boolean = true;    
    private _sprLoader: SpriteLoader = new SpriteLoader();

    get holdBuff(){
        let buffIndex:number[] = [];
        this.buffs.forEach((buff,index)=>{
            if (buff.isChecked) buffIndex.push(index);
        })
        return buffIndex;
    }

    onInit(pvpId: number) {
        this._pvpId = pvpId;
        this.registerEvent();
        this.prepareData();
        guiManager.addCoinNode(this.node, pvpId);
    }

    private _clearItems() {
        this._itemBags.forEach(_i => {
            ItemBagPool.put(_i)
        })
        this._itemBags = [];
    }

    registerEvent() {
        eventCenter.register(immortalsEvent.CHANGE_TICKET, this, this.prepareData);
        eventCenter.register(immortalsEvent.GET_RANK, this, this.refreshRankInfo);
        eventCenter.register(immortalsEvent.FINISH_PVP_RES, this, this.refreshView);
        eventCenter.register(bagDataEvent.ITEM_CHANGE, this, this.refreshView);
    }

    onRelease() {
        guiManager.removeCoinNode(this.node);
        this._sprLoader.release();
        this._clearItems();
        this.releaseSubView();
        this.unscheduleAllCallbacks();
        this.listView._deInit();
        eventCenter.unregisterAll(this);
    }

    onRefresh() {
        if (this._pvpId)
            this.prepareData();
    }

    onDisable() {
    }

    onListRender(itemNode: cc.Node, idx: number) {
        let item = itemNode.getComponent(PVPFightListItem);
        item.init(idx, ()=>{
            return this.holdBuff;
        },()=>{
            return this._canBuyBuff;
        });
    }

    prepareData() {
        this._pvpCfg = configManager.getConfigByKey("pvpList", this._pvpId);
        this._openFight = pvpData.fairyData.ChallengeTimes 
            && pvpData.fairyData.ChallengeTimes>0;
        this._fightList.splice(0);
        this._fightList = utils.deepCopy(pvpData.fairyData.FightUserList) || [];
        this.calMinRank();
        this.refreshView();
        pvpDataOpt.reqGetPvpFairyRank();
        pvpData.clearPvpConfig();
    }

    refreshView() {
        let numShow = this._pvpCfg.PVPListNumShow;
        let cnt = pvpData.fairyData.ChallengeTimes || 0;
        let moduleCfg = configUtils.getModuleConfigs();
        let gameIdx = (moduleCfg.PVPImmortalsFightNum || 5) - cnt;
        let point = moduleCfg.PVPImmortalsWinPoint.split(";")[gameIdx] || 0;

        this.ticket.string = `挑战次数：<color=#E97D23>${cnt}</c>`;
        this.pointGain.string = `本次胜利可获得积分：<color=#E97D23>${point}</c>`;
        this.winCnt.string = `${pvpData.fairyData.WinTimes || 0}`;
        this._sprLoader.changeSprite(this.ticketIcon, resPathUtils.getItemIconPath(numShow));

        this._openFight = cnt && cnt>0;
        this.fightNode.active = this._openFight;
        this.ticketNode.active = !this._openFight;

        if (this._openFight) {
            this.listView.numItems = this._fightList.length;
        }
        let introCfg = configUtils.getDialogCfgByDialogId(CustomDialogId.PVP_IMMORTAL_INTRODUCE);
        this.intro.string = introCfg ? introCfg.DialogText : "";
        this.refreshBuffInfo();
    }

    // 单独更新排行信息
    refreshRankInfo(){
        let rank = pvpData.getUserFairyRank(userData.uId);
        let integral = pvpData.fairyData.Integral;
        let immortalCfg: cfg.PVPImmortals = null;
        let cfgs: cfg.PVPImmortals[] = configManager.getConfigList("pvpImmortals");
        // 有排名读取排行信息
        if (rank && rank<=this._minRank){
            for (let _k in cfgs){
                let cfg = cfgs[_k];
                let lower = parseInt(cfg.PVPImmortalsRankSection.split(";")[0]);
                let upper = parseInt(cfg.PVPImmortalsRankSection.split(";")[1]);
                if (cfg.PVPImmortalsRankType == RANK_TYPE.RANK
                    && rank>=lower && rank<=upper){
                    immortalCfg = cfg;
                    break;
                }
            }
            // 排行信息提示
            this.tipsNode.active = rank!=1;
            this.tipsNode.getComponentInChildren(cc.Label).string = "提高排名后提升";
            // 展示进度条
            this.progressBar.progress = 0;
            this.point.string = `${integral}`;
            this.progressBar.node.getComponentInChildren(cc.Label).string = `${integral}`;
        }else if(integral || integral==0){
            for (let _k in cfgs) {
                let cfg = cfgs[_k];
                let lower = parseInt(cfg.PVPImmortalsRankSection.split(";")[0]);
                let upper = parseInt(cfg.PVPImmortalsRankSection.split(";")[1]);
                if (cfg.PVPImmortalsRankType == RANK_TYPE.INTEGRAL
                    && integral >= lower && integral <= upper) {
                    immortalCfg = cfg;
                    // 展示进度条
                    this.progressBar.progress = integral/upper;
                    this.progressBar.node.getComponentInChildren(cc.Label).string = `${integral} / ${upper}`;
                    // 排行信息提示
                    this.tipsNode.active = true;
                    this.point.string = `${integral}`;
                    this.tipsNode.getComponentInChildren(cc.Label).string = rank ? `提高排名后提升` : `再获得${upper-integral+1}积分提升`;
                    break; 
                }
            }
        }
        //奖励数据
        this._clearItems();
        if (immortalCfg && immortalCfg.PVPImmortalsRankReward) {
            let parseArr = utils.parseStingList(immortalCfg.PVPImmortalsRankReward);
            parseArr.forEach((ele) => {
                if (ele && ele.length) {
                    let item = ItemBagPool.get();
                    item.init({
                        id: parseInt(ele[0]),
                        count: parseInt(ele[1]),
                        clickHandler: () => { this.onClickItem(parseInt(ele[0]), parseInt(ele[1])); }
                    })
                    this._itemBags.push(item);
                    item.node.parent = this.reward;
                }
            })
        }
        this.rank.string = `${rank || "--"}`;
        this.grade.string = `${immortalCfg.PVPImmortalsRankName}`;
        this._sprLoader.changeSprite(this.rankIcon, `textures/pvp-image/${immortalCfg.PVPImmortalsRankImage}`);
    }

    refreshBuffInfo(){
        let buffInfos = utils.parseStingList(configUtils.getModuleConfigs().PVPImmortalsBuff).slice(0, MAX_BUFF);
        let dialogCfg = configManager.getConfigByKey("dialogue", 1000008);
        let prefix = dialogCfg ? dialogCfg.DialogText : "战斗开始时，";
        let buffCnt = 0;
        let buffCost = 0;
        let buffCostNum = 0;
        this._holdBuffs.splice(0);
        for (let k = 0; k < buffInfos.length; k++){
            let buffInfo = buffInfos[k];
            // 更新信息
            if (this.buffs[k].isChecked){
                let titleDiaCfg: cfg.Dialog = configManager.getConfigByKey("dialogue", Number(buffInfo[3]));
                buffCnt += 1;
                buffCost = parseFloat(buffInfo[1]);
                buffCostNum += parseFloat(buffInfo[2]);
                prefix = prefix + `${titleDiaCfg.DialogText || ""}; `;
                this._holdBuffs.push(k);
            }  
        }

        let discount = taskData.getTreasureSysPowerParam(TREASURE_SYS_POWER_TYPE.SHEN_FENG_WU_YING);
        discount && (discount /= 10000);

        let disPrice = buffCostNum * discount;
        let realPrice = buffCostNum - disPrice;

        this.buffNull.node.active = !buffCnt;
        this.buffIntro.node.active = !!buffCnt;
        this.buffPrice.node.active = !!buffCnt;
        this.buffPriceIcon.node.active = !!buffCnt;
        this.buffPriceIntro.node.active = !!buffCnt;
        this.buffDiscountPrice.node.active = !!disPrice;

        let itemConunt = bagData.getItemCountByID(buffCost);

        this._canBuyBuff = !(realPrice && itemConunt < realPrice);
        this.buffPrice.node.color = this._canBuyBuff ? cc.color(83, 42, 21) : cc.color(255, 0, 0);
        this.buffIntro.string = prefix;
        this.buffPrice.string = `${realPrice}`;

        if(disPrice) {
            this.buffPrice._forceUpdateRenderData();
            this.buffDiscountPrice.string = `(宝物减免:${disPrice})`;
            this.buffDiscountPrice.node.x = this.buffPrice.node.x + this.buffPrice.node.width + 5;
        }

        this._sprLoader.changeSprite(this.buffPriceIcon, resPathUtils.getItemIconPath(buffCost));
    }

    // ========================================
    // 点击事件
    // ========================================

    onClickRank(){
        this.loadSubView("PVPImmortalsRankView");
    }

    onClickReward(){
        this.loadSubView("PVPImmortalsRewardView");
    }

    onClickBuyTicket(){
        let numShow = this._pvpCfg.PVPListNumShow;
        if (numShow) {
            let num = bagData.getItemCountByID(numShow);
            if(!num){
                guiManager.showDialogTips(CustomDialogId.PVP_TICKET_NO_ENOUGH);
                return;
            }
        }
        pvpDataOpt.reqBuyFairyTicket();
    }

    onClickReputationShop(){
        moduleUIManager.jumpToModule(25000, 0, ShopSubType.Honour);
    }

    onClickToggle(){
        this.refreshBuffInfo();
    }

    onClickItem(itemID: number, Count: number) {
        let config = configUtils.getItemConfig(itemID);
        let config1 = configUtils.getEquipConfig(itemID);
        if (config) {
            let newitem: data.IBagUnit = { ID: itemID, Count: Count, Seq: 0 };
            this.loadSubView(VIEW_NAME.TIPS_ITEM, newitem);
        } else if (config1) {
            let item: data.IBagUnit = bagDataUtils.buildDefaultEquip(itemID);
           this.loadSubView(VIEW_NAME.TIPS_EQUIP, item);
        }
    }

    // ========================================
    // 辅助计算方法
    // ========================================

    calMinRank(){
        let cfgs: cfg.PVPImmortals[] = configManager.getConfigList("pvpImmortals");
        if (this._minRank) return;
        for (let _k in cfgs) {
            let cfg = cfgs[_k];
            if (cfg.PVPImmortalsRankType == RANK_TYPE.RANK) {
                let lower = parseInt(cfg.PVPImmortalsRankSection.split(";")[0]);
                let upper = parseInt(cfg.PVPImmortalsRankSection.split(";")[1]);
                this._minRank = Math.max(this._minRank, lower, upper);
            }
        }
    }

}
