

import { activityUtils } from "../../../app/ActivityUtils";
import { BagItemInfo, ItemInfo } from "../../../app/AppType";
import { utils } from "../../../app/AppUtils";
import { configUtils } from "../../../app/ConfigUtils";
import { configCache } from "../../../common/ConfigCache";
import { configManager } from "../../../common/ConfigManager";
import moduleUIManager from "../../../common/ModuleUIManager";
import { ItemBagPool } from "../../../common/res-manager/NodePool";
import { cfg } from "../../../config/config";
import { activityData } from "../../models/ActivityData";
import { serverTime } from "../../models/ServerTime";
import { activityOpt } from "../../operations/ActivityOpt";
import ItemBag from "../view-item/ItemBag";

const {ccclass, property} = cc._decorator;

@ccclass
export default class ItemDoubleWeekWarOrder extends cc.Component {
    @property(cc.Label) dateLb: cc.Label = null;
    @property(cc.Node) freeRewardParent: cc.Node = null;
    @property(cc.Node) noFreeRewardParent: cc.Node = null;
    @property(cc.Button) takeBtn: cc.Button = null;
    @property(cc.Node) takeTips: cc.Node = null;
    @property(cc.Label) tokenTips: cc.Label = null;
    @property(cc.Node) redDot: cc.Node = null;

    private _weekSummonBattlePassCfg: cfg.ActivityWeekSummonBattlePass = null;
    private _viewRootNode: cc.Node = null;
    private _itemBags: ItemBag[] = null;
    private _activityID: number = 0;
    private _timeCfgs: number[] = null;
    private _atyCfg: cfg.ActivityWeekSummonList = null;

    get onlyID() {
        return this._weekSummonBattlePassCfg.OnlyID;
    }

    get needDay() {
        return this._weekSummonBattlePassCfg.NeedDay;
    }

    init(onlyID: number, activityID: number, rootNode: cc.Node) {
        this._weekSummonBattlePassCfg = configManager.getConfigByKey('activityWeekSummonBattlePass', onlyID);
        this._activityID = activityID;
        this._viewRootNode = rootNode;
        this._atyCfg = configUtils.getDoubleWeekListConfig(this._activityID);
        this._timeCfgs = activityUtils.calBeginEndTime(this._atyCfg.OpenTime, this._atyCfg.HoldTime);
        this._initUI();
    }

    deInit(): void {
        if(this._itemBags) {
            this._itemBags.forEach(ele => {
                ItemBagPool.put(ele);
            })
            this._itemBags.length = 0;
        }
        this._viewRootNode = null;
    }

    private _initUI() {
        this.dateLb.string = `第${this._weekSummonBattlePassCfg.NeedDay}天`;

        // 免费奖励
        if(this._weekSummonBattlePassCfg.FreeRewardShow && this._weekSummonBattlePassCfg.FreeRewardShow.length > 0) {
            let rewards: ItemInfo[] = [];
            utils.parseStingList(this._weekSummonBattlePassCfg.FreeRewardShow, (strArr: string[]) => {
                if(!strArr || !Array.isArray(strArr) || strArr.length == 0) return;
                rewards = rewards || [];
                rewards.push({itemId: parseInt(strArr[0]), num: parseInt(strArr[1])});
            });
            this._initReward(rewards, this.freeRewardParent);
        }

        // 战令奖励
        if(this._weekSummonBattlePassCfg.BattlePassRewardShow && this._weekSummonBattlePassCfg.BattlePassRewardShow.length > 0) {
            let rewards: ItemInfo[] = [];
            utils.parseStingList(this._weekSummonBattlePassCfg.BattlePassRewardShow, (strArr: string[]) => {
                if(!strArr || !Array.isArray(strArr) || strArr.length == 0) return;
                rewards = rewards || [];
                rewards.push({itemId: parseInt(strArr[0]), num: parseInt(strArr[1])});
            });
            this._initReward(rewards, this.noFreeRewardParent);
        }

        this._updateTakeState();
    }

    private _initReward(rewards: ItemInfo[], parent: cc.Node) {
        if(!rewards || rewards.length == 0) return;
        let itemW: number, startX:number;
        let scale = 0.8, spaceX = 10;
        rewards.forEach(ele => {
            let item = ItemBagPool.get();
            if(typeof startX == 'undefined') {
                itemW = item.node.width * scale;
                let totalW = itemW * rewards.length + spaceX * (rewards.length - 1);
                startX = -(totalW >> 1);
            }

            item.init({id: ele.itemId, count: ele.num, clickHandler: (itemInfo: BagItemInfo) => {
                moduleUIManager.showItemDetailInfo(itemInfo.id, itemInfo.count, this._viewRootNode);
            }});
            item.node.setPosition(startX + (itemW >> 1), 0);
            item.node.parent = parent;
            this._itemBags = this._itemBags || [];
            this._itemBags.push(item);
        });
    }

    updateState() {
        this._updateTakeState();
    }

    private _updateTakeState() {
        let atyCfg: cfg.ActivityWeekSummonList = this._atyCfg;
        let activityTimes = this._timeCfgs;
        let currTime = serverTime.currServerTime();
        let curDay = Math.floor((currTime - activityTimes[0]) / 86400) + 1;
        // 未达到登录天数
        if(curDay < this._weekSummonBattlePassCfg.NeedDay) {
            this.tokenTips.node.active = true;
            this.takeTips.active = false;
            this.takeBtn.node.active = false;
            this.tokenTips.string = `累计登录\n${curDay}/${configCache.getAtyWeekSummonBattlePassByFunctionID(atyCfg.FunctionID).length}`;
            return;
        }

        let data = activityData.doubleWeekData.ActivityDoubleWeekFunctionMap[`${this._activityID}`];
        let isSpe = data && data.IsSpecial ? data.IsSpecial : false;
        // 没有领取记录 或者战令开通的情况下没有战令领取记录
        if(!data || !data.ReceiveNormalReward || !data.ReceiveNormalReward[`${this._weekSummonBattlePassCfg.NeedDay}`]
              || (isSpe && (!data.ReceiveSpecialReward || !data.ReceiveSpecialReward[`${this._weekSummonBattlePassCfg.NeedDay}`])))
        {
            this.tokenTips.node.active = false;
            this.takeTips.active = false;
            this.takeBtn.node.active = true;
            return;
        }

        // 未开通战令
        if(!isSpe) {
            this.tokenTips.node.active = true;
            this.takeBtn.node.active = false;
            this.takeTips.active = false;
            this.tokenTips.string = `购买站令后\n可继续领取`;
            return;
        }

        this.tokenTips.node.active = false;
        this.takeBtn.node.active = false;
        this.takeTips.active = true;
    }

    onClickTakeBtn() {
        let atyCfg: cfg.ActivityWeekSummonList = this._atyCfg;
        let activityTimes = this._timeCfgs;
        let currTime = serverTime.currServerTime();
        let curDay = Math.floor((currTime - activityTimes[0]) / 86400) + 1;
        // 未达到登录天数
        if(curDay < this._weekSummonBattlePassCfg.NeedDay) {
            return;
        }
        let data = activityData.doubleWeekData.ActivityDoubleWeekFunctionMap[`${this._activityID}`];
        let isSpe = data && data.IsSpecial ? data.IsSpecial : false;
        // 能领的都领了
        if(data && data.ReceiveNormalReward && data.ReceiveNormalReward[`${this._weekSummonBattlePassCfg.NeedDay}`]
            && (!isSpe || (isSpe && data.ReceiveSpecialReward && data.ReceiveSpecialReward[`${this._weekSummonBattlePassCfg.NeedDay}`]))) {
            return;
        }
        activityOpt.sendTakePrizesOfDoubleWeekBattlePass(this._activityID, [this._weekSummonBattlePassCfg.NeedDay]);
    }
}
