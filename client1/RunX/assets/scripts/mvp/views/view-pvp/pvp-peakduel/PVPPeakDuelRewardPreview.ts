import { utils } from "../../../../app/AppUtils";
import List from "../../../../common/components/List";
import { ViewBaseComponent } from "../../../../common/components/ViewBaseComponent";
import { configManager } from "../../../../common/ConfigManager";
import { eventCenter } from "../../../../common/event/EventCenter";
import { cfg } from "../../../../config/config";
import { pvpData } from "../../../models/PvpData";
import { userData } from "../../../models/UserData";
import ItemBag from "../../view-item/ItemBag";
import ItemRankRewardPreview from "./ItemRankRewardPreview";

const {ccclass, property} = cc._decorator;
@ccclass
export default class PVPPeakDuelRewardPreview extends ViewBaseComponent {
    @property(List) rankRewardList: List = null;
    @property(cc.Label) selfRankNo: cc.Label = null;
    @property(cc.Label) timeDownLb: cc.Label = null;

    private _rewardLen: number = 0;
    private _time: number = 0;

    onInit(): void {
        this._prepareData();
        this._registerEvent();
        this._initTimeDown();
    }

    /**页面释放清理*/
    onRelease() {
        this.rankRewardList._deInit();
        eventCenter.unregisterAll(this);
    }

    /**页面来回跳转刷新*/
    onRefresh(): void {

    }

    private _registerEvent() {

    }

    private _prepareData() {
        let rankNoCfg = configManager.getConfigs("pvpTopBattleRank");
        this._rewardLen = Object.keys(rankNoCfg)?.length || 0;
        this.rankRewardList.numItems = this._rewardLen;

        let selfRankinfo = pvpData.peakDuelRankInfo?.PVPPeakDuelIntegralUnit;
        if (!selfRankinfo || !pvpData.peakDuelRankInfo.PVPPeakDuelIntegralList) {
            this.selfRankNo.string = '当前排名\n未上榜'
        } else {
            let index = pvpData.peakDuelRankInfo.PVPPeakDuelIntegralList.findIndex(val => {
                return userData.accountData.UserID == val.User.UserID;
            })
            this.selfRankNo.string = (index >= 0) ? (`当前排名\n${index+1}`) : "\n未上榜";
        }
    }


    private _initTimeDown() {
        let timeStampArr = utils.getLeftTime(utils.getTimeStampByReset(1));
        let day = timeStampArr[0], hour = timeStampArr[1], min = timeStampArr[2], sec = timeStampArr[3];
        if (day) {
            this.timeDownLb.string = `结算倒计时:${day}天`;
        } else if (hour) {
            this.timeDownLb.string = `结算倒计时:${hour}时`;   
        } else {
            this.timeDownLb.string = `结算倒计时:${min}:${sec}`;
            this._time = min * 60 + sec;
            this.schedule(this._timeDownFuc,1);
        }
    }

    private _timeDownFuc() {
        if (--this._time < 0) {
            this.timeDownLb.string = `结算倒计时 : 7天`;
            this.unschedule(this._timeDownFuc);
            return
        } 
        let timeStampArr = utils.getLeftTime(this._time);
        let min = timeStampArr[2], sec = timeStampArr[3];
        this.timeDownLb.string = `结算倒计时:${min}:${sec}`;
    }

    onRewardItemListRender(item: cc.Node, index:number) {
        let rankNoCfg: cfg.PVPTopBattleRank = configManager.getConfigByKey("pvpTopBattleRank", index + 1);
        if (rankNoCfg) {
            let rewardComp = item.getComponent(ItemRankRewardPreview);
            rewardComp.onInit(rankNoCfg)
        }
    }
}