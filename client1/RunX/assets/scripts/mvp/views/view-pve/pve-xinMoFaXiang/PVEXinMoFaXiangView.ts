import { SCENE_NAME } from "../../../../app/AppConst";
import { PVE_MODE } from "../../../../app/AppEnums";
import { BagItemInfo, PveConfig } from "../../../../app/AppType";
import { utils } from "../../../../app/AppUtils";
import { configUtils } from "../../../../app/ConfigUtils";
import { resPathUtils } from "../../../../app/ResPathUrlUtils";
import { ViewBaseComponent } from "../../../../common/components/ViewBaseComponent";
import { eventCenter } from "../../../../common/event/EventCenter";
import { commonEvent, trialDevilEvent } from "../../../../common/event/EventData";
import guiManager from "../../../../common/GUIManager";
import moduleUIManager from "../../../../common/ModuleUIManager";
import { ItemBagPool } from "../../../../common/res-manager/NodePool";
import { scheduleManager } from "../../../../common/ScheduleManager";
import { SpriteLoader } from "../../../../common/ui-helper/SpriteLoader";
import { cfg } from "../../../../config/config";
import { pveData } from "../../../models/PveData";
import { pveTrialData } from "../../../models/PveTrialData";
import { serverTime } from "../../../models/ServerTime";
import { userData } from "../../../models/UserData";
import { pveDataOpt } from "../../../operations/PveDataOpt";
import ItemBag from "../../view-item/ItemBag";

/**
 * 心魔法相
 */
const { ccclass, property } = cc._decorator;
@ccclass
export default class PVEXinMoFaXiangView extends ViewBaseComponent {
    @property(cc.Label) timeLb: cc.Label = null;
    @property(cc.Sprite) bossImg: cc.Sprite = null;
    @property(cc.Label) damageLb: cc.Label = null;
    @property(cc.Label) rankLb: cc.Label = null;
    @property(cc.Node) rewardContainor: cc.Node = null;
    @property(cc.Label) recommandTimes: cc.Label = null;

    private _rewardItems: ItemBag[] = null;
    private _spLoader: SpriteLoader = null;
    private _curMonsterCfg: cfg.PVEMindDemonMonster = null;
    private _schedulerID: number = 0;

    preInit(fID: number): Promise<any> {
        guiManager.addCoinNode(this.node, fID);
        return Promise.resolve(true);
    }

    protected onInit(fID: number): void {
        this._spLoader = this._spLoader || new SpriteLoader();
        this._registerEvents();
        this._updateCfgData();
        this._initUI();
        pveDataOpt.reqGetTrialDevilRankList(true);
    }

    protected onRelease(): void {
        guiManager.removeCoinNode(this.node);
        this._schedulerID && scheduleManager.unschedule(this._schedulerID);
        this._schedulerID = 0;
        eventCenter.unregisterAll(this);
        this._spLoader && this._spLoader.release();
        if(this._rewardItems) {
          this._rewardItems.forEach(ele => {
              ItemBagPool.put(ele);
          });
          this._rewardItems.length = 0;
        }
    }

    private _registerEvents() {
        eventCenter.register(commonEvent.TIME_DAY_RESET, this, this._onDayReset);
        eventCenter.register(trialDevilEvent.RECV_RANK_LIST, this, this._updateSelfRankNo);
        eventCenter.register(trialDevilEvent.ENTER_PVE_RES, this, this._recvEnterPveRes);
    }

    onClickRank() {
        guiManager.loadView('PVEXinMoFaXiangRankView', this.node);
    }

    onClickStartGame() {
        let trialDevilData = pveTrialData.trialDevilData;
        let suplusCnt = Math.max(Math.abs(this._curMonsterCfg.PVEMindDemonMonsterFightNum - (trialDevilData.data.FightNum || 0)));
        if(suplusCnt <= 0) {
            guiManager.showTips(`今日次数已用完`);
            return;
        }

        let monsterGroupCfg: cfg.MonsterGroup = configUtils.getMonsterGroupConfig(this._curMonsterCfg.PVEMindDemonMonsterLeaderGroup);
        if(!monsterGroupCfg) {
            guiManager.showTips('Boss阵容未配置');
            return;
        }

        let monsters: Array<number> = new Array(5);
        monsters[0] = monsterGroupCfg.MonsterId1 || 0;
        monsters[1] = monsterGroupCfg.MonsterId2 || 0;
        monsters[2] = monsterGroupCfg.MonsterId3 || 0;
        monsters[3] = monsterGroupCfg.MonsterId4 || 0;
        monsters[4] = monsterGroupCfg.MonsterId5 || 0;
        let pveConfig: PveConfig = {
            lessonId: 0,
            userLv: userData.lv,
            monsterIds: monsters,
            useDefaultSquad: false,
            pveMode: PVE_MODE.XIN_MO_FA_XIANG,
            pveListId: 17019,
            monsterGroupID: this._curMonsterCfg.PVEMindDemonMonsterLeaderGroup,
        }
        pveData.pveConfig = pveConfig;
        guiManager.loadScene(SCENE_NAME.BATTLE);
    }

    onClickPlayIntro() {
        guiManager.loadView('PVEXinMoFaXiangIntroView', this.node);
    }

    onClickReward() {
        guiManager.loadView('PVEXinMoFaXiangRewardView', this.node, this._openItemTipView.bind(this));
    }

    private _initUI() {
        this._updateResetTime();
        this._updateSelfRankNo();
        this._updateBossInfo();
        this._genRewardPreview();
        this._startResetScheduler();
    }

    private _genRewardPreview() {
        let rewards: number[][] = [];
        if(this._curMonsterCfg.PVEMindDemonMonsterRewardShow && this._curMonsterCfg.PVEMindDemonMonsterRewardShow.length > 0) {
            utils.parseStingList(this._curMonsterCfg.PVEMindDemonMonsterRewardShow, (strArr: string[]) => {
                if(!strArr || strArr.length == 0) return;
                let itemID = parseInt(strArr[0]), cnt = parseInt(strArr[1]);
                rewards.push([itemID, cnt]);
            })
        }
        let rewardCnt = rewards.length;
        if(this._rewardItems && this._rewardItems.length > rewardCnt) {
            for(let i = rewardCnt, len = this._rewardItems.length; i < len; i++) {
                ItemBagPool.put(this._rewardItems[i]);
            }
            this._rewardItems.splice(rewardCnt, this._rewardItems.length - rewardCnt);
        }

        let spaceX = 10, scale = 0.8;
        let curStartX: number = undefined;
        let itemRwalW: number = 0;
        rewards.forEach((ele, idx) => {
            let item: ItemBag = null;
            this._rewardItems = this._rewardItems || [];
            if(this._rewardItems.length <= idx) {
                item = ItemBagPool.get();
                item.node.scale = scale;
                item.node.setParent(this.rewardContainor);
                this._rewardItems.push(item);
            }

            if(typeof curStartX == 'undefined') {
                itemRwalW = item.node.width * scale;
                let totalW = rewardCnt * itemRwalW + (rewardCnt - 1) * spaceX;
                curStartX = -(totalW >> 1);
            }

            item = item || this._rewardItems[idx];
            item.init({id: ele[0], count: ele[1], clickHandler: this._openItemTipView.bind(this)});
            item.node.setPosition(curStartX + (itemRwalW >> 1), 0);
            curStartX += (itemRwalW + spaceX);
        });
    }

    private _updateCfgData() {
        let now = serverTime.currServerTime();
        let date = new Date(now * 1000);
        let day = date.getDay();
        this._curMonsterCfg = configUtils.getMindDemonMonsterCfgByDay(day);
    }

    // 零点重置数据
    private _onDayReset() {
        this._updateCfgData();
        this._updateResetTime();
        this._updateBossInfo();
        this._genRewardPreview();
        pveDataOpt.reqGetTrialDevilRankList(true);
    }

    private _updateSelfRankNo() {
        let trialDevilData = pveTrialData.trialDevilData;
        this.rankLb.string = `${(typeof trialDevilData.selfRank == 'undefined' || trialDevilData.selfRank < 0) ? '尚未挑战' : (trialDevilData.selfRank + 1)} `;
    }

    private _updateBossInfo() {
        let trialDevilData = pveTrialData.trialDevilData;
        this.damageLb.string = (!trialDevilData.data.TotalDamage) ? '尚未挑战' : `${trialDevilData.data.TotalDamage}`;
        this.recommandTimes.string = `今日剩余次数：${Math.max(Math.abs(this._curMonsterCfg.PVEMindDemonMonsterFightNum - (trialDevilData.data.FightNum || 0)), 0)}`;
        this._spLoader.changeSprite(this.bossImg, resPathUtils.getGuildBossModel(this._curMonsterCfg.PVEMindDemonMonsterImageShow));
    }

    private _updateResetTime() {
        let leftTime = this._getLeftTime();
        let formatTime = utils.getLeftTime(leftTime);
        this.timeLb.string = `结算倒计时：${formatTime[1]}:${formatTime[2]}:${formatTime[3]}`
    }

    private _getLeftTime(): number {
        let now = serverTime.currServerTime();
        let date = new Date(now * 1000);
        let hour = date.getHours();
        let minute = date.getMinutes();
        let sec = date.getSeconds();
        return 86400 -  hour * 3600 - minute * 60 - sec;
    }

    private _startResetScheduler() {
        if(this._schedulerID) {
            scheduleManager.unschedule(this._schedulerID);
        }
        this._schedulerID = scheduleManager.schedule(this._updateResetTime.bind(this), 1);
    }

    private _recvEnterPveRes() {
        this._updateSelfRankNo();
        this._updateBossInfo();
    }

    private _openItemTipView(itemInfo: BagItemInfo) {
        moduleUIManager.showItemDetailInfo(itemInfo.id, itemInfo.count, this.node);
    }
}
