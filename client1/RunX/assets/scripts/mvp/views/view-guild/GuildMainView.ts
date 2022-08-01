import { VIEW_NAME } from "../../../app/AppConst";
import { ShopSubType } from "../../../app/AppEnums";
import { ItemInfo } from "../../../app/AppType";
import { utils } from "../../../app/AppUtils";
import { configUtils } from "../../../app/ConfigUtils";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { configManager } from "../../../common/ConfigManager";
import { eventCenter } from "../../../common/event/EventCenter";
import { guildEvent, taskEvent } from "../../../common/event/EventData";
import guiManager from "../../../common/GUIManager";
import moduleUIManager from "../../../common/ModuleUIManager";
import { RED_DOT_MODULE } from "../../../common/RedDotManager";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { cfg } from "../../../config/config";
import { data } from "../../../network/lib/protocol";
import { guildData } from "../../models/GuildData";
import { serverTime } from "../../models/ServerTime";
import { userData } from "../../models/UserData";
import ItemRedDot from "../view-item/ItemRedDot";
import GuildView from "./GuildView";
import ItemBossList from "./ItemBossList";

const {ccclass, property} = cc._decorator;
const GUILD_MAX_LV: number = 10;
const SHOW_MAX_COUNT: number = 99;

@ccclass
export default class GuildMainView extends ViewBaseComponent {
    @property(cc.Node) applyListBtn: cc.Node = null;
    @property(cc.Label) applyCountLb: cc.Label = null;
    @property(cc.Label) memberCountLb: cc.Label = null;
    @property(cc.Label) newsCountLb: cc.Label = null;
    @property([ItemBossList]) itemBossLists: ItemBossList[] = [];
    @property(cc.Node) bossContent: cc.Node = null;
    @property(cc.Node) guildBossResetTips: cc.Node = null;
    @property(cc.Label) bossLvLb: cc.Label = null;
    @property(ItemRedDot) newApplyRedDot: ItemRedDot = null;
    @property(ItemRedDot) taskRedDot: ItemRedDot = null;

    private _guildInfo: data.IFaction = null;
    private _closeCb: Function = null;
    private _spriteLoader: SpriteLoader = new SpriteLoader();
    private _root: GuildView = null;

    onInit (root: GuildView) {
        this._root = root;
        this.doInit();
        this._preGetData();
        this._refreshBossView();
        this._refreshLimitView();
        this._refreshBottomView();
    }

    doInit() {
        eventCenter.register(guildEvent.CHANGE_APPLY_LIST, this, this._refreshBottomView);
        eventCenter.register(guildEvent.UPDATE_DAILY_NEWS, this, this._refreshBottomView);
        eventCenter.register(guildEvent.UPDATE_BOSS_VIEW, this, this._refreshBossView);
        eventCenter.register(guildEvent.RECV_REWARD, this, this._recvGetReward);
        eventCenter.register(taskEvent.RECEIVE_REWARD, this, this._refreshRedDot);
        eventCenter.register(taskEvent.CHANGE_PROGRESS, this, this._refreshRedDot);
    }

    onRelease() {
        this.releaseSubView();
        eventCenter.unregisterAll(this);
        this.itemBossLists.forEach((_cmp, _index) => {
            _cmp.deInit();
        });
        this._spriteLoader.release();
    }

    onRefresh(): void {
        this._refreshRedDot();
    }

    private _refreshRedDot() {
        this.newApplyRedDot.setData(RED_DOT_MODULE.GUILD_NEW_APPLY);
        this.taskRedDot.setData(RED_DOT_MODULE.GUILD_TASKS)
    }

    private _preGetData() {
        this._guildInfo = guildData.guildInfo;
    }

    private _refreshBossView() {
        this.bossLvLb.string = `公会首领 Lv.${guildData.bossInfo.Level || 1}`;
        let isNeedReset: boolean = this._checkGuildBossIsNeedReset();
        let isAllReward: boolean = this._checkAllRewarded();
        let isShowEmety: boolean = isNeedReset && isAllReward; 
        this.bossContent.active = !isShowEmety;
        this.guildBossResetTips.active = isShowEmety;
        if(isShowEmety) {
            this.itemBossLists.forEach((_cmp, _index) => {
                _cmp.deInit();
            });
        } else {
            let bossList = this._getBossList();
            this.itemBossLists.forEach((_cmp, _index) => {
                _cmp.setData(bossList[_index] || 0, _index + 1, this._loadView.bind(this));
            });
        }
    }

    private _refreshLimitView() {
        let myRoleInfo = guildData.myGuildSelfInfo;
        let myMemberTyppe = guildData.getMemberTypeByUid(myRoleInfo.UserID);
        let limitCfg = this._getRoleLimit(myMemberTyppe);
        this.applyListBtn.active = !!limitCfg.GuildRoleAddPeople;
    }

    private _refreshBottomView() {
        this.applyCountLb.string = guildData.applyList.length > SHOW_MAX_COUNT ? '99+' : guildData.applyList.length + '';
        let guildLv: number = guildData.lv;
        let curMemberCount = guildData.memberList.length;
        let maxMemberCount = this._getGuildMemberMax(guildLv);
        this.memberCountLb.string = `${curMemberCount}/${maxMemberCount}`;
        this.newsCountLb.string = this.getDailyNewsLength() + '';
        // TODO 现在只有申请列表有 所以放这里了
        this._refreshRedDot();
    }

    private _recvGetReward(eventId: number, prizes: ItemInfo[]) {
        this._loadView(VIEW_NAME.GET_ITEM_VIEW, prizes);
        this._refreshBossView();
    }

    private _loadView (viewName: string, ...args: any[]) {
        this._root.loadGuildSubView(viewName, ...args);
    }

    onClickEditNotice() {
        let myMemberTyppe = guildData.getMemberTypeByUid(guildData.myGuildSelfInfo.UserID);
        if(data.FACTION_MEMBER_TYPE.PRESIDENT == myMemberTyppe) {
            this._loadView(VIEW_NAME.GUILD_EDIT_NOTICE_VIEW, this._guildInfo.Account.ID);
        }
    }

    onClickBossDetail() {
        this._loadView('GuildBossDetailView');
    }

    onClickShop() {
        moduleUIManager.jumpToModule(25000, 0, ShopSubType.ShengWang);
    }

    onClickApplyList() {
        this._loadView(VIEW_NAME.GUILD_APPLY_LIST_VIEW);
    }

    onClickMemberList() {
        this._loadView(VIEW_NAME.GUILD_MEMBER_LIST_VIEW);
    }

    onClickDailyNews() {
        this._loadView(VIEW_NAME.GUILD_DAILY_NEWS_VIEW);
    }

    onClickTaskBtn() {
        this._loadView('GuildTaskView', this._loadView.bind(this));
    }

    onClickCloseView() {
        if(this._closeCb) {
            this._closeCb();
        }
    }

    private _getGuildMemberMax(lv: number) {
        let cfg = configUtils.getGuildLevelCfg(lv);
        return cfg.GuildLevelPeopleNum;
    }
    
    getDailyNewsLength(): number {
        return guildData.dailyNewsInfo.filter(_daily => {
            return _daily.ItemType == 1 && this._checkIsToday(_daily.Time);
        }).length;
    }

    private _getRoleLimit(position: data.FACTION_MEMBER_TYPE): cfg.GuildRole {
        let cfg = configUtils.getGuildRoleCfg(position);
        return cfg;
    }

    private _checkIsToday(time: number): boolean {
        let zero = utils.getTodayZeroTime(true);
        return Number(time) >= zero;
    }

    private _getBossList(): number[] {
        let lv = guildData.bossInfo.Level || 1;
        let configs: cfg.GuildMonster[] = configManager.getConfigByManyKV('guildMonster', "GuildMonsterLevel", lv);
        return configs.map(_c => {
            return _c.GuildMonsterID;
        });
    }

    private _checkGuildBossIsNeedReset(): boolean {
        let curTime: number = serverTime.currServerTime();
        // let curTime: number = svrConfig.testTime;
        let day = new Date(curTime * 1000).getDay();
        let guildMonsterFightTime = configUtils.getConfigModule('GuildMonsterFightTime');
        let fightEndTime = guildMonsterFightTime.split('|')[1].split(';')
        let endIntervel = Number(fightEndTime[0]) * 60 * 60 + Number(fightEndTime[1]) * 60;
        let todayZeroTime = utils.getTodayZeroTime(true);
        // todayZeroTime = 1638633600;
        let endTime = todayZeroTime + endIntervel;
        return day == 0 && curTime >= endTime;
    }

    private _checkAllRewarded(): boolean {
        const bossInfo = guildData.bossInfo;
        let joinResults = bossInfo.FactionExpeditionOrderResultMap;
        for(const k in joinResults) {
            if(joinResults[k].FactionExpeditionOrderInfoList && joinResults[k].FactionExpeditionOrderInfoList.length > 0) {
                let curJoinInfo = joinResults[k].FactionExpeditionOrderInfoList[joinResults[k].FactionExpeditionOrderInfoList.length - 1];
                if(curJoinInfo.JoinUserIDMap[userData.uId] && !curJoinInfo.ReceiveJoinRewardMap[userData.uId]) {
                    return false;
                }
                
            }
        }
        let winRewards = bossInfo.FactionExpeditionOrderWinRewardMap;
        for(const k in winRewards) {
            if(joinResults[k].FactionExpeditionOrderInfoList && joinResults[k].FactionExpeditionOrderInfoList.length > 0) {
                let curJoinInfo = joinResults[k].FactionExpeditionOrderInfoList[joinResults[k].FactionExpeditionOrderInfoList.length - 1];
                let winReward = winRewards[k];
                if(curJoinInfo.JoinUserIDMap[userData.uId] && curJoinInfo.IsWin && (!winReward && !!winReward.ReceiveWinRewardMap && !winReward.ReceiveWinRewardMap[userData.uId])) {
                    return false;
                }
            }
        }
        return true;
    }
}
