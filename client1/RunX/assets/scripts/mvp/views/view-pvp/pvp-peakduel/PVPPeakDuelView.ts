import { VIEW_NAME, CustomDialogId } from "../../../../app/AppConst";
import { PVP_MODE } from "../../../../app/AppEnums";
import { utils } from "../../../../app/AppUtils";
import { configUtils } from "../../../../app/ConfigUtils";
import List from "../../../../common/components/List";
import { ViewBaseComponent } from "../../../../common/components/ViewBaseComponent";
import { configManager } from "../../../../common/ConfigManager";
import { eventCenter } from "../../../../common/event/EventCenter";
import { peakDuelEvent } from "../../../../common/event/EventData";
import guiManager from "../../../../common/GUIManager";
import moduleUIManager from "../../../../common/ModuleUIManager";
import { cfg } from "../../../../config/config";
import { data, gamesvr } from "../../../../network/lib/protocol";
import { pvpData } from "../../../models/PvpData";
import { userData } from "../../../models/UserData";
import { pvpDataOpt } from "../../../operations/PvpDataOpt";
import ItemPeakDuelRank from "./ItemPeakDuelRank";

const {ccclass, property} = cc._decorator;
@ccclass
export default class PVPPeakDuelView extends ViewBaseComponent {
    @property(List) rankList: List = null;
    @property(ItemPeakDuelRank) selfRank: ItemPeakDuelRank = null;
    @property(cc.Node) noTag: cc.Node = null;
    @property(cc.Label) timeDown: cc.Label = null;
    @property(cc.Label) intgel: cc.Label = null;
    @property(cc.Label) attackTimes: cc.Label = null;

    private _time = 0;

    onInit(fid:number): void {
        this._registerEvent();
        this._initView();

        guiManager.addCoinNode(this.node, fid);
    }

    private _registerEvent() {
        eventCenter.register(peakDuelEvent.RECV_RANK_RES, this, this._reflashRankList);
        eventCenter.register(peakDuelEvent.RANK_INTERGEL_NTY, this, this._initIntergelInfo);
    }

    /**页面释放清理*/
    onRelease() {
        this.rankList._deInit();
        eventCenter.unregisterAll(this);
        guiManager.removeCoinNode(this.node);
        this.unscheduleAllCallbacks();
    }

    /**页面来回跳转刷新*/
    onRefresh(): void {
        this._setResultTimeDownFuc();
        this._refreshAttackTimes();
        this._initSelfRankInfo();
        this._initIntergelInfo();
        pvpDataOpt.reqPvpPeakDuelRankList();
    }

    /**刷新排行榜-pvpdata数据驱动*/
    private _reflashRankList(cmd: any, msg: gamesvr.RankPvpPeakDuelGetListRes) {
        let rankNums = msg.PVPPeakDuelIntegralList.length || 0;
        this.noTag.active = (rankNums<=0);
        this.rankList.numItems = rankNums;

        this._initSelfRankInfo();
    }

    private _initView() {
        pvpDataOpt.reqPvpPeakDuelRankList();
        this._setResultTimeDownFuc();
        this.intgel.string = '' + (pvpData.peakDuelData?.Integral || 0);
        this._refreshAttackTimes();
    }

    private _initSelfRankInfo() {
        let selfUserId = pvpData.peakDuelRankInfo?.PVPPeakDuelIntegralUnit?.User?.UserID || userData.accountData.UserID;
        let index = pvpData.peakDuelRankInfo.PVPPeakDuelIntegralList.findIndex((value) => {
            return selfUserId== value.User.UserID;
        });
        this.selfRank && this.selfRank.onInit(null,index);
    }

    private _setResultTimeDownFuc() {
        let timeStampArr = utils.getLeftTime(utils.getTimeStampByReset(1));
        let day = timeStampArr[0], hour = timeStampArr[1], min = timeStampArr[2], sec = timeStampArr[3];
        if (day) {
            this.timeDown.string = `结算倒计时:${day}天`;
        } else if (hour) {
            this.timeDown.string = `结算倒计时:${hour}时`;   
        } else {
            this.timeDown.string = `结算倒计时:${min}:${sec}`;
            this._time = min * 60 + sec;
            this.schedule(this._timeDownFuc,1);
        }
    }
    private _timeDownFuc() {
        if (--this._time < 0) {
            this.timeDown.string = `结算倒计时 : 7天`;
            this.unschedule(this._timeDownFuc);
            return
        } 
        let timeStampArr = utils.getLeftTime(this._time);
        let min = timeStampArr[2], sec = timeStampArr[3];
        this.timeDown.string = `结算倒计时:${min}:${sec}`;
    }

    private _refreshAttackTimes() {
        let count = pvpData.getPeakDuekAttakTimes();
        this.attackTimes.string = count + '';
    }

    private _initIntergelInfo() {
        this.intgel.string = pvpData.peakDuelData.Integral + "";
    }

    onRankListItemRender(item: cc.Node, index: number) {
        let rankInfo: data.IPVPPeakDuelIntegral = pvpData.peakDuelRankInfo?.PVPPeakDuelIntegralList[index];
        if (!rankInfo) return;
        let rankComp = item.getComponent(ItemPeakDuelRank);
        rankComp.onInit(rankInfo,index);
        rankComp.node.opacity = 0;
        rankComp.node.runAction(cc.fadeIn(0.4 * index));
    }

    openRewardPreview() {
        this.loadSubView("PVPPeakDuelRewardPreview");
    }

    openRuleView() {
        this.loadSubView(VIEW_NAME.PVE_CHALLENGE_RULE_VIEW, CustomDialogId.PVP_PEAK_DUEL_RULE);
    }

    //购买进攻凭证
    onBuyAttackID() {
        //邀请函物品id
        let modelConfig: cfg.ConfigModule = configUtils.getModuleConfigs();
        let itemID = modelConfig?.PVPTopBattleUseItemId || 0;

        //moneyShow对应条目
        let moneyCfg: cfg.MoneyShow = null;
        let moenyshowCfg = configManager.getConfigs("moneyShow");
        for (let index in moenyshowCfg) {
            let cfg: cfg.MoneyShow = moenyshowCfg[index];
            if (cfg.MoneyShowItemId == itemID) {
                moneyCfg = cfg;
                break;
            }
        }
        
        //跳转商店
        if (moneyCfg && moneyCfg.MoneyShowUseResult){
            let parseList = utils.parseStingList(moneyCfg.MoneyShowUseResult);
            parseList = moneyCfg.MoneyShowUseResult.search(";") == -1 ? parseList : parseList[0];
            let moduleId = parseList && parseList[0] || 0;
            let partId = parseList && parseList[1] || 0;
            let subId = parseList && parseList[2] || 0;
            moduleUIManager.jumpToModule(parseInt(moduleId), parseInt(partId), parseInt(subId), itemID);
            return;
        }
    }

    openFightRecord() {
        this.loadSubView("PVPPeakDuelRecordView");
    }

    openChallegeTask() {
        this.loadSubView("PVPPeakDuelTaskView");
    }

    openChoseEnemyView() {
        this.loadSubView("PVPPeakDuelChoseEnemyView");
    }

    openDefensiveView() {
        this.loadSubView(VIEW_NAME.PREINSTALL_VIEW, true,PVP_MODE.PEAK_DUEL);
    }
}