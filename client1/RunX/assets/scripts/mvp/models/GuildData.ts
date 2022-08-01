import { TREASURE_SYS_POWER_TYPE } from "../../app/AppConst";
import { GuildDailyNews } from "../../app/AppType";
import { utils } from "../../app/AppUtils";
import { configManager } from "../../common/ConfigManager";
import { logger } from "../../common/log/Logger";
import {scheduleManager} from "../../common/ScheduleManager";
import { cfg } from "../../config/config";
import { data, gamesvr } from "../../network/lib/protocol";
import { guildOpt } from "../operations/GuildOpt";
import BaseModel from "./BaseModel";
import { taskData } from "./TaskData";
import { userData } from "./UserData";

class GuildData extends BaseModel {
    private _commonGuildInfo: data.IFactionData = null;                 // 登录发来的公会通用信息
    private _guildInfo: data.IFaction = null;                           // 公会所有信息
    private _dailyNewsList: GuildDailyNews[] = [];                      // 日常消息列表
    private _memberList: data.IFactionMember[] = [];                    // 成员列表
    private _tempRejectList: string[] = [];                             // 拒绝列表 做展示用的
    private _recommendGuilds: gamesvr.IFactionSearchInfo[] = [];        // 推荐公会
    private _isSignIn: boolean = false;                                 // 是否签到
    private _donateTimes: number = 0;                                   // 捐献次数
    private _completeTaskTimes: number = 0;                             // 完成公会任务数
    private _isNewApply: boolean = false;                                // 是否存在新的申请
    private _freeInspiredNum: number= 0;                               //今日已使用的免费鼓舞次数

    init() {

    }

    deInit() {
        this._commonGuildInfo = null;
        this._guildInfo = null;
        this._dailyNewsList = [];
        this._memberList = [];
        this._tempRejectList = [];
        this._recommendGuilds = [];
        this._isSignIn = false;
        this._donateTimes = 0;
        this._completeTaskTimes = 0;
        this._freeInspiredNum = 0;
        this._isNewApply = false;

    }

    get recommendGuilds() {
        return this._recommendGuilds;
    }

    get freeInspiredNum(){
        return this._freeInspiredNum;
    }

    //获取免费鼓舞此时
    getTotalFreeInspireCount(){
        let extra = taskData.getTreasureSysPowerParam(TREASURE_SYS_POWER_TYPE.LEI_MING_GU);
        return extra;
    }

    /**
     * 公会所有信息 有些东西可能不准 比如成员列表 动态信息列表
     */
    get guildInfo() {
        return this._guildInfo;
    }

    get memberList(): data.IFactionMember[] {
        logger.log('dueMemberList get memberList:', this._memberList);
        return this._memberList;
    }

    get applyList(): data.IFactionApplyMember[] {
        return this._guildInfo.Sundry.FactionApplyMemberList;
    }

    get myGuildSelfInfo() {
        return this._memberList.find( _m => {
            return _m.UserID == userData.uId;
        });
    }

    get dailyNewsInfo(): GuildDailyNews[] {
        return this._dailyNewsList;
    }

    get rejectList(): string[] {
        return this._tempRejectList;
    }

    get applyCDTime(): number {
        return this._commonGuildInfo ? utils.longToNumber(this._commonGuildInfo.AllowApplyTime) : 0;
    }

    get lv() {
        let lv = 1;
        if(this._guildInfo.Account.Exp) {
            let guildLevels: {[k: string]: cfg.GuildLevel} = configManager.getConfigs('guildLevel');
            if(guildLevels) {
                let needExp = 0;
                for(const k in guildLevels) {
                    if(guildLevels[k].GuildLevelExp) {
                        needExp += guildLevels[k].GuildLevelExp;
                        if(Number(this._guildInfo.Account.Exp) >= needExp) {
                            lv = guildLevels[k].GuildLevelID + 1;
                        }
                    }
                }
            }
        }
        return lv;
    }
    /**
     * 公会boss信息
     */
    get bossInfo(): data.IFactionExpedition {
        return this._guildInfo && this._guildInfo.Expedition;
    }

    get signState(): boolean {
        return this._isSignIn;
    }

    get donateTimes(): number {
        return this._donateTimes;
    }

    get completeTaskTimes(): number {
        return this._completeTaskTimes;
    }

    get isNewApply(): boolean {
        return this._isNewApply;
    }

    // get taskCount: number {
    //     return
    // }

    initGuildData(guildInfo: data.IFactionData) {
        this._commonGuildInfo = guildInfo;
        this._isSignIn = guildInfo.IsSignIn || false;
        this._donateTimes = guildInfo.DonateCount || 0;
        this._freeInspiredNum = guildInfo.ExpeditionFreeUrgeCount || 0;

        if(!!guildInfo.FactionID && utils.longToNumber(guildInfo.FactionID) > 0) {
            // 说明我自己有公会
            scheduleManager.scheduleOnce(() => {
                guildOpt.sendGetGuildInfo();
            }, 0.5);
        }
    }

    updateGuildInfo(guildInfo: data.IFaction) {
        this._guildInfo = guildInfo;
        this.dueMemberList(guildInfo.Sundry.FactionMemberMap);
        this.dueDailyNewsInfo(guildInfo.Sundry.NewsFeedList);
    }

    updateExp(exp: number) {
        this._guildInfo.Account.Exp += exp || 0;
    }

    dueMemberList(memberMap: {[k: string]: data.IFactionMember}) {
        this._memberList = [];
        for(const k in memberMap) {
            this._memberList.push(memberMap[k]);
        }
        this._sortMemberList();
    }

    private _sortMemberList() {
        // 根据在线情况 和 职位 排序
        this._memberList.sort((_a, _b) => {
            let aType = this.getMemberTypeByUid(_a.UserID);
            let bType = this.getMemberTypeByUid(_b.UserID);
            if(_a.IsOnline == _b.IsOnline) {
                if(aType == bType) {
                    return  _b.Power - _a.Power;
                } else {
                    return aType - bType;
                }
            } else {
                return _a.IsOnline ? -1 : 1;
            }
        });
    }

    dueDailyNewsInfo(guildDailyNewsInfo: data.INewsFeed[]) {
        if(guildDailyNewsInfo.length <= 0) {
            return;
        }
        this._dailyNewsList = [];
        guildDailyNewsInfo.sort((_a, _b) => {
            return _b.Time - _a.Time;
        });
        let checkTodayIsActivity = (zeroTime: number): boolean => {
            let isFind = guildDailyNewsInfo.find(_info => {
                return Number(_info.Time) >= zeroTime && Number(_info.Time) < (zeroTime + 60 * 60 * 24);
            });
           return cc.isValid(isFind);
        }

        let addSpecialFunc = (zeroTime: number) => {
            if(checkTodayIsActivity(zeroTime)) {
                this._dailyNewsList.unshift({
                    ItemType: 2,
                    Time: zeroTime,
                });
            }
        }

        let days = utils.getTodayZeroTime(true);
        addSpecialFunc(days);
        for(let count = 0; count < guildDailyNewsInfo.length;) {
            let curData = guildDailyNewsInfo[count];
            if(curData.Time < days) {
                days -= (60 * 60 * 24);
                addSpecialFunc(days);
            } else {
                // TODO 原因列表可能需要解析下
                this._dailyNewsList.unshift({
                    ItemType: 1,
                    Time: curData.Time,
                    NewsType: curData.Type,
                    Reasons: curData.paramList
                });
                count++;
            }
        }
        this._dailyNewsList.reverse();
    }

    addDailyNewsInfo(guildDailyNewsInfo: data.INewsFeed) {
        if(this.guildInfo && this.guildInfo.Sundry) {
            this.guildInfo.Sundry.NewsFeedList.push(guildDailyNewsInfo);
            this.dueDailyNewsInfo(this.guildInfo.Sundry.NewsFeedList);
        }
    }

    addMember(member: data.IFactionMember) {
        this._memberList.push(member);
        // 根据在线情况 和 职位 排序
        this._memberList.sort((_a, _b) => {
            let aType = this.getMemberTypeByUid(_a.UserID);
            let bType = this.getMemberTypeByUid(_b.UserID);
            if(_a.IsOnline == _b.IsOnline) {
                if(aType == bType) {
                    return  _b.Power - _a.Power;
                } else {
                    return aType - bType;
                }
            } else {
                return _a.IsOnline ? -1 : 1;
            }
        });
    }

    kickOutMember(userId: string) {
        let index = this._memberList.findIndex(_m => {
            return _m.UserID == userId;
        });
        if(index > -1) {
            this._memberList.splice(index, 1);
            // 是否有职位
            let viceIndex = this._guildInfo.Sundry.VicePresidentUserIDList.indexOf(userId);
            if(viceIndex > -1) {
                this._guildInfo.Sundry.VicePresidentUserIDList.splice(viceIndex, 1);
            }
        }
    }

    changeMemberOnlineInfo(useId: string, isOnline: boolean, lastOnlineTime: number = 0) {
        let member = this.getMemberByUid(useId);
        if(member) {
            if(member.IsOnline != isOnline) {
                member.IsOnline = isOnline;
                if(!isOnline) {
                    member.LastOnlineTime = lastOnlineTime;
                }
            }
        }
    }

    changeMemberPosition(userId: string, position: data.FACTION_MEMBER_TYPE) {
        if(data.FACTION_MEMBER_TYPE.VICE_PRESIDENT == position) {
            let index = this._guildInfo.Sundry.VicePresidentUserIDList.indexOf(userId);
            if(index == -1) {
                this._guildInfo.Sundry.VicePresidentUserIDList.push(userId);
            }
        } else if(data.FACTION_MEMBER_TYPE.CIVILIAN == position) {
            let index = this._guildInfo.Sundry.VicePresidentUserIDList.indexOf(userId);
            if(index > -1) {
                this._guildInfo.Sundry.VicePresidentUserIDList.splice(index, 1);
            }
        }
        this._sortMemberList();
    }

    changeName(name: string) {
        this._guildInfo.Account.Name = name;
    }

    changeNotice(notice: string) {
        this._guildInfo.Sundry.BulletinText = notice;
    }

    updateRecommendGuilds(recommendGuilds: gamesvr.IFactionSearchInfo[]) {
        this._recommendGuilds = recommendGuilds;
    }

    updateApplyInfo(guildId: number) {
        this._recommendGuilds.find(_r => {
            if(utils.longToNumber(_r.FactionID) == guildId){
                _r.IsAlreadyApply = !_r.IsAlreadyApply;
                return true;
            }
            return false;
        });
    }

    signIn() {
        this._isSignIn = true;
    }

    updateDonateCount(count: number = 1) {
        this._donateTimes = count || 0;
    }

    addCompleteTaskTimes() {
        this._completeTaskTimes += 1;
    }

    onDayReset() {
        this._isSignIn = false;
        this._donateTimes = 0;
        this._freeInspiredNum = 0;
    }

    clearRecommendGuilds() {
        this._recommendGuilds = [];
    }

    getMemberByUserId(userId: string): data.IFactionMember {
        let find = this._memberList.find(_m => {
            return _m.UserID == userId;
        });
        return find;
    }

    getChairmanMember(): data.IFactionMember {
        let chairmanUserId: string = this._guildInfo.Account.PresidentUserID;
        let find = this._memberList.find(_m => {
            return chairmanUserId == _m.UserID;
        });
        return find;
    }

    changeApplyList(isConfirm: boolean, userId?: string) {
        let applyList = this._guildInfo.Sundry.FactionApplyMemberList;
        if(!isConfirm) {
            if(userId && userId.length !== 0) {
                let findIndex = applyList.findIndex(_a => {
                    return _a.UserID == userId;
                });
                if(findIndex > -1) {
                    this._tempRejectList.push(applyList[findIndex].UserID);
                }
            } else {
                applyList.forEach(_a => {
                    this._tempRejectList.push(_a.UserID);
                });
            }
        } else {
            if(userId && userId.length !== 0) {
                let findIndex = applyList.findIndex(_a => {
                    return _a.UserID == userId;
                });
                if(findIndex > -1) {
                    applyList.splice(findIndex, 1);
                }
            } else {
                applyList = [];
            }
        }
        this._guildInfo.Sundry.FactionApplyMemberList = applyList;
    }

    addApplyMember(member: data.IFactionApplyMember) {
        if(member) {
            this._isNewApply = true;
        }
        let rejectIndex = this._tempRejectList.findIndex(_u => {
            return _u == member.UserID;
        });
        if(rejectIndex > -1) {
            this._tempRejectList.splice(rejectIndex, 1);
        }
        let findIndex = this._guildInfo.Sundry.FactionApplyMemberList.findIndex(_m => {
            return _m.UserID == member.UserID;
        });
        if(findIndex > -1) {
            this._guildInfo.Sundry.FactionApplyMemberList
            utils.swap(this._guildInfo.Sundry.FactionApplyMemberList, findIndex, 0);
        } else {
            this._guildInfo.Sundry.FactionApplyMemberList.unshift(member);
        }
    }

    /**
     * 更新公会boss信息
     * @param msg
     */
    updateFightInfo(msg: { [k: string]: data.IFactionExpeditionHero }, freeInspiredNum: number = 0) {
        this.guildInfo.Expedition.FactionExpeditionHeroList = msg;
        freeInspiredNum && (this._freeInspiredNum = freeInspiredNum);
    }

    /**
     * 更新公会boss战斗结果
     * @param msg
     */
    updateFightResult(msg: gamesvr.IFactionExpeditionOrderResultNotify) {
        this._guildInfo.Expedition.Level = msg.Level;
        let curOrder = (this._guildInfo.Expedition.Order || 0) + 1;
        let curOrderResultMap = this._guildInfo.Expedition.FactionExpeditionOrderResultMap[curOrder];
        if(!curOrderResultMap) {
            this._guildInfo.Expedition.FactionExpeditionOrderResultMap[curOrder] = new data.FactionExpeditionOrderResult();
        }
        this._guildInfo.Expedition.FactionExpeditionOrderResultMap[curOrder].FactionExpeditionOrderInfoList.push(msg.FactionExpeditionOrderInfoUnit);
        if(msg.FactionExpeditionOrderInfoUnit.IsWin) {
            this._guildInfo.Expedition.Order = msg.Order;
        } else {
            this._guildInfo.Expedition.Order = msg.Order;
        }
    }
    /**
     * 更新领取参与奖励结果
     * @param order 
     */
    updateJoinReward(order: number) {
        let infoList = this.guildInfo.Expedition.FactionExpeditionOrderResultMap[order];
        if(infoList && infoList.FactionExpeditionOrderInfoList && infoList.FactionExpeditionOrderInfoList.length > 0) {
            infoList.FactionExpeditionOrderInfoList[infoList.FactionExpeditionOrderInfoList.length - 1].ReceiveJoinRewardMap[userData.uId] = true;
        }
    }
    /**
     * 更新领取胜利奖励结果
     * @param order 
     */
    updateWinReward(order: number) {
        let curOrderWinResult = this.guildInfo.Expedition.FactionExpeditionOrderWinRewardMap[order];
        if(curOrderWinResult) {
            curOrderWinResult.ReceiveWinRewardMap[userData.uId] = true;
        } else {
            curOrderWinResult = new data.FactionExpeditionOrderWinReward();
            curOrderWinResult.ReceiveWinRewardMap[userData.uId] = true;
            this.guildInfo.Expedition.FactionExpeditionOrderWinRewardMap[order] = curOrderWinResult;
        }
    }
    /**
     * 重置备战队伍信息 战斗胜利后
     */
    resetFightTeamData() {
        this._guildInfo.Expedition.FactionExpeditionHeroList = {};
    }

    resetBossInfo(level: number, order: number) {
        this._guildInfo.Expedition.Level = level;
        this._guildInfo.Expedition.Order = order;
        this._guildInfo.Expedition.FactionExpeditionOrderResultMap = {};
        this._guildInfo.Expedition.FactionExpeditionOrderWinRewardMap = {};
    }

    clearGuildInfo() {
        this._guildInfo = null;
        this._memberList = [];
        this._dailyNewsList = [];
        this._commonGuildInfo.FactionID = 0;
    }

    resetJoinGuideCDTime(time: number){
        this._commonGuildInfo && (this._commonGuildInfo.AllowApplyTime = time);
    }

    clearRejectList() {
        let userId: string;
        let findIndex: number = -1;
        for(let i = 0; i < this._tempRejectList.length; ++i) {
            userId = this._tempRejectList[i];
            findIndex = this._guildInfo.Sundry.FactionApplyMemberList.findIndex(_a => {
                return _a.UserID == userId;
            });
            if(findIndex > -1) {
                this._guildInfo.Sundry.FactionApplyMemberList.splice(findIndex, 1);
            }
        }
        this._tempRejectList = [];
    }

    clearNewApplyState() {
        this._isNewApply = false;
    }

    getGuildInspireCount() {
        let inspireCount: number = 0;
        for(const k in this.guildInfo.Expedition.FactionExpeditionHeroList) {
            let expeditionInfo = this.guildInfo.Expedition.FactionExpeditionHeroList[k];
            inspireCount += (expeditionInfo.UrgeCount || 0);
        }
        return inspireCount;
    }

    getMemberTypeByUid(uId: string) {
        if (!this._guildInfo) return data.FACTION_MEMBER_TYPE.INVALID;
        if(this._guildInfo.Account.PresidentUserID == uId) {
            return data.FACTION_MEMBER_TYPE.PRESIDENT;
        } else if(this._guildInfo.Sundry.VicePresidentUserIDList.indexOf(uId) != -1) {
            return data.FACTION_MEMBER_TYPE.VICE_PRESIDENT;
        } else {
            return data.FACTION_MEMBER_TYPE.CIVILIAN;
        }
    }

    getMemberByUid(uId: string) {
        let member = this._memberList.find(_m => {
            return _m.UserID == uId;
        });
        return member;
    }

}

let guildData = new GuildData();
export {
    guildData
}
