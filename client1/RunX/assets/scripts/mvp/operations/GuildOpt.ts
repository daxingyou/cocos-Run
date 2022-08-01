import { GuildPositionType } from "../../app/AppEnums";
import { utils } from "../../app/AppUtils";
import { configUtils } from "../../app/ConfigUtils";
import { eventCenter } from "../../common/event/EventCenter";
import { guildEvent } from "../../common/event/EventData";
import guiManager from "../../common/GUIManager";
import { logger } from "../../common/log/Logger";
import { data, gamesvr } from "../../network/lib/protocol";
import { operationSvr } from "../../network/OperationSvr";
import { guildData } from "../models/GuildData";
import { userData } from "../models/UserData";
import { BaseOpt } from "./BaseOpt";


class GuildOpt extends BaseOpt {
    init() {
        this.registerAllEvent();
    }

    registerAllEvent() {
        this.addEventListener(gamesvr.CMD.FACTION_GET_FACTION_INFO_RES, this._recvGetGuildInfo);
        this.addEventListener(gamesvr.CMD.FACTION_GET_FACTION_LIST_RES, this._recvRecommendGuildsList);
        this.addEventListener(gamesvr.CMD.FACTION_APPLY_JOIN_FACTION_RES, this._recvApplyJoin);
        this.addEventListener(gamesvr.CMD.FACTION_CREATE_FACTION_RES, this._recvCreateGuild);
        this.addEventListener(gamesvr.CMD.FACTION_ADD_APPLICANT_NOTIFY, this._recvAddApplyNotify);
        this.addEventListener(gamesvr.CMD.FACTION_PUSH_APPLICANT_NOTIFY, this._recvPushApplyNotify);
        this.addEventListener(gamesvr.CMD.FACTION_FAST_JOIN_FACTION_RES, this._recvQuickJoin);
        this.addEventListener(gamesvr.CMD.FACTION_DISPOSE_APPLICANT_RES, this._recvChangeApplyState);
        this.addEventListener(gamesvr.CMD.FACTION_ADD_MEMBER_NOTIFY, this._recvAddMemberNotify);
        this.addEventListener(gamesvr.CMD.FACTION_JOIN_FACTION_NOTIFY, this._recvJoinGuildNotify);
        this.addEventListener(gamesvr.CMD.FACTION_SET_APPLY_RES, this._recvChangeCloseApply);
        this.addEventListener(gamesvr.CMD.FACTION_CHANGE_SET_APPLY_NOTIFY, this._recvChangeCloseApplyNotify);
        this.addEventListener(gamesvr.CMD.FACTION_SET_AUTO_ACCEPT_RES, this._recvChangeAutoApprove);
        this.addEventListener(gamesvr.CMD.FACTION_CHANGE_SET_AUTO_ACCEPT_NOTIFY, this._recvChangeAutoApproveNotify);
        this.addEventListener(gamesvr.CMD.FACTION_DISPOSE_ALL_APPLICANT_RES, this._recvChangeAllApplyState);
        this.addEventListener(gamesvr.CMD.FACTION_CHANGE_NAME_RES, this._recvChangeName);
        this.addEventListener(gamesvr.CMD.FACTION_ONLINE_MEMBER_NOTIFY, this._recvMemberOnlineNotify);
        this.addEventListener(gamesvr.CMD.FACTION_OFFLINE_MEMBER_NOTIFY, this._recvMemberOfflineNotify);
        this.addEventListener(gamesvr.CMD.FACTION_CHANGE_BULLETIN_RES, this._recvChangeNotice);
        this.addEventListener(gamesvr.CMD.FACTION_NOMINATE_MEMBER_NOTIFY, this._recvChangePositionNotify);
        this.addEventListener(gamesvr.CMD.FACTION_KICK_OUT_MEMBER_RES, this._recvKickOut);
        this.addEventListener(gamesvr.CMD.FACTION_KICK_OUT_MEMBER_NOTIFY, this._recvKickOutNotify);
        this.addEventListener(gamesvr.CMD.FACTION_EXIT_FACTION_RES, this._recvExit);
        this.addEventListener(gamesvr.CMD.FACTION_EXIT_FACTION_NOTIFY, this._recvExitNotify);
        this.addEventListener(gamesvr.CMD.FACTION_DISSOLVE_FACTION_NOTIFY, this._recvDissolveNotify);
        this.addEventListener(gamesvr.CMD.FACTION_ADD_NEWS_FEED_NOTIFY, this._recvAddDailyNewsNotify);
        this.addEventListener(gamesvr.CMD.FACTION_EXPEDITION_JOIN_RES, this._recvJoinFight);
        this.addEventListener(gamesvr.CMD.FACTION_EXPEDITION_URGE_RES, this._recvFightInspire);
        this.addEventListener(gamesvr.CMD.FACTION_EXPEDITION_ORDER_RESULT_NOTIFY, this._recvFightEndNotify);
        this.addEventListener(gamesvr.CMD.FACTION_EXPEDITION_RECEIVE_JOIN_REWARD_RES, this._recvGetJoinReward);
        this.addEventListener(gamesvr.CMD.FACTION_EXPEDITION_RECEIVE_WIN_REWARD_RES, this._recvGetWinReward);
        this.addEventListener(gamesvr.CMD.FACTION_EXPEDITION_LEVEL_REFRESH_NOTIFY, this._recvResetGuildBoss);
        this.addEventListener(gamesvr.CMD.FACTION_SIGN_IN_RES, this._recvSignIn);
        this.addEventListener(gamesvr.CMD.FACTION_DONATE_RES, this._recvDonate);
    }

    deInit() {

    }

    /**
     * 接受 获得公会信息
     * @param recvMsg 
     * @returns 
     */
    private _recvGetGuildInfo(recvMsg: { Result: number, Desc: string, Msg: gamesvr.FactionGetFactionInfoRes }) {
        if(!this._checkResValid(recvMsg)) {
            return;
        }
        let Msg = recvMsg.Msg;
        guildData.updateGuildInfo(Msg.Faction);
        eventCenter.fire(guildEvent.UPDATE_GUILD_INFO);
    }

    sendGetGuildInfo() {
        let req = new gamesvr.FactionGetFactionInfoReq({
        });
        operationSvr.send(req);
    }

    /**
     * 接收推荐公会信息
     * @param recvMsg 
     * @returns 
     */
    private _recvRecommendGuildsList(recvMsg: { Result: number, Desc: string, Msg: gamesvr.FactionGetFactionListRes }) {
        if(!this._checkResValid(recvMsg)) {
            return;
        }
        let Msg = recvMsg.Msg;
        guildData.updateRecommendGuilds(Msg.FactionSearchInfoList);
        eventCenter.fire(guildEvent.UPDATE_GUILDS_LIST, Msg.FactionSearchInfoList);
    }

    sendRecommendGuildsList(name: string = '') {
        // 发送请求推荐公会列表
        let req = new gamesvr.FactionGetFactionListReq({
            Name: name
        });
        operationSvr.send(req);
    }

    /**
     * 申请加入公会
     * @param recvMsg 
     * @returns 
     */
    private _recvApplyJoin(recvMsg: { Result: number, Desc: string, Msg: gamesvr.FactionApplyJoinFactionRes }) {
        if(!this._checkResValid(recvMsg)) {
            return;
        }
        // TODO 需要返回guildId
        guildData.updateApplyInfo(utils.longToNumber(recvMsg.Msg.FactionID));
        eventCenter.fire(guildEvent.APPLY_JOIN);
    }

    sendApplyJoin(guildId: number) {
        let req = new gamesvr.FactionApplyJoinFactionReq({
            FactionID: guildId
        });
        operationSvr.send(req);
    }

    /**
     * 创建公会
     * @param recvMsg 
     * @returns 
     */
    private _recvCreateGuild(recvMsg: { Result: number, Desc: string, Msg: gamesvr.FactionCreateFactionRes }) {
        if(!this._checkResValid(recvMsg)) {
            return;
        }
        let Msg = recvMsg.Msg;
        guildData.updateGuildInfo(Msg.Faction);
        eventCenter.fire(guildEvent.CREATE_GUILD, Msg.Faction);
    }
    
    sendCreateGuild(name: string) {
        let req = new gamesvr.FactionCreateFactionReq({
            Name: name
        });
        operationSvr.send(req);
    }

    /**
     * 修改公会公告
     * @param recvMsg 
     * @returns 
     */
    private _recvChangeNotice(recvMsg: { Result: number, Desc: string, Msg: gamesvr.FactionChangeBulletinRes }) {
        if(!this._checkResValid(recvMsg)) {
            return;
        }
        let Msg = recvMsg.Msg;
        // 修改公会公告
        guildData.changeNotice(Msg.BulletinText);
        eventCenter.fire(guildEvent.CHANGE_NOTICE, Msg.BulletinText);
    }

    sendChangeNotice(guildId: number, notice: string) {
        let req = new gamesvr.FactionChangeBulletinReq({
            BulletinText: notice
        });
        operationSvr.send(req);
    }

     /**
     * 修改公会名字
     * @param recvMsg 
     * @returns 
     */
      private _recvChangeName(recvMsg: { Result: number, Desc: string, Msg: gamesvr.FactionChangeNameRes }) {
        if(!this._checkResValid(recvMsg)) {
            return;
        }
        let Msg = recvMsg.Msg;
        // 修改公会名称
        guildData.changeName(Msg.Name);
        eventCenter.fire(guildEvent.CHANGE_NAME, Msg.Name);
    }

    sendChangeName(name: string) {
        let req = new gamesvr.FactionChangeNameReq({
            Name: name
        });
        operationSvr.send(req);
    }

    /**
     * 快速加入公会
     */
    private _recvQuickJoin(recvMsg: { Result: number, Desc: string, Msg: gamesvr.FactionFastJoinFactionRes }) {
        if(!this._checkResValid(recvMsg)) {
            return;
        }
        let Msg = recvMsg.Msg;
        // eventCenter.fire(guildEvent.ENTER_GUILD_SUC);
    }

    sendQuickJoin(guildIdList: number[]) {
        let req = new gamesvr.FactionFastJoinFactionReq({
            FactionIDList: guildIdList
        });
        operationSvr.send(req);
    }

    // /**
    //  * 查找公会
    //  * @param name 
    //  */
    // sendFind(name: string) {
    //     let req = new gamesvr.ActivityLevelReceiveRewardReq({
    //     });
    //     operationSvr.send(req);
    // }

    // /**
    //  * 解散公会
    //  * @param recvMsg 
    //  * @returns 
    //  */
    // private _recvDisband(recvMsg: { Result: number, Desc: string, Msg: gamesvr.ChangeHeadRes }) {
    //     if(!this._checkResValid(recvMsg)) {
    //         return;
    //     }
    //     let Msg = recvMsg.Msg;
    //     eventCenter.fire(guildEvent.DISBAND_GUILD);
    // }

    // sendDisband(guildId: number) {
    //     let req = new gamesvr.ActivityLevelReceiveRewardReq({
    //     });
    //     operationSvr.send(req);
    //     //TODO 测试用
    //     eventCenter.fire(guildEvent.DISBAND_GUILD);
    // }
    /**
     * 退出公会
     * @param recvMsg 
     * @returns 
     */
    private _recvExit(recvMsg: { Result: number, Desc: string, Msg: gamesvr.FactionExitFactionRes }) {
        if(!this._checkResValid(recvMsg)) {
            return;
        }
        let Msg = recvMsg.Msg;
        guildData.clearGuildInfo();
        eventCenter.fire(guildEvent.FIRE_OUT_GUILD);
    }

    sendExit() {
        let req = new gamesvr.FactionExitFactionReq({
        });
        operationSvr.send(req);
    }
    /**
     * 修改关闭入会申请
     * @param recvMsg 
     * @returns 
     */
    private _recvChangeCloseApply(recvMsg: { Result: number, Desc: string, Msg: gamesvr.FactionSetApplyRes }) {
        if(!this._checkResValid(recvMsg)) {
            return;
        }
        let Msg = recvMsg.Msg;
        // TODO 修改是否打开入会申请
        guildData.guildInfo.Sundry.IsApply = Msg.IsApply;
        eventCenter.fire(guildEvent.CHANGE_CLOSE_APPLY, Msg.IsApply);
    }

    sendChangeCloseApply(state: boolean) {
        let req = new gamesvr.FactionSetApplyReq({
            IsApply: state
        });
        operationSvr.send(req);
    }
    /**
     * 修改自动入会申请
     * @param recvMsg 
     * @returns 
     */
    private _recvChangeAutoApprove(recvMsg: { Result: number, Desc: string, Msg: gamesvr.FactionSetAutoAcceptRes }) {
        if(!this._checkResValid(recvMsg)) {
            return;
        }
        let Msg = recvMsg.Msg;
        // 修改公会自动申请状态
        guildData.guildInfo.Sundry.IsAutoAccept = Msg.IsAutoAccept;
        guildData.guildInfo.Sundry.AutoAcceptLevel = Msg.AutoAcceptLevel;
        eventCenter.fire(guildEvent.CHANGE_AUTO_APPROVE, Msg);
    }

    sendChangeAutoApprove(state: boolean, minLv: number) {
        let req = new gamesvr.FactionSetAutoAcceptReq({
            IsAutoAccept: state,
            AutoAcceptLevel: minLv
        });
        operationSvr.send(req);
    }
    /**
     * 改变申请状态 同意还是拒绝
     * @param recvMsg 
     * @returns 
     */
    private _recvChangeApplyState(recvMsg: { Result: number, Desc: string, Msg: gamesvr.FactionDisposeApplicantRes }) {
        if(!this._checkResValid(recvMsg)) {
            return;
        }
        let Msg = recvMsg.Msg;
        // 修改一个状态
        guildData.changeApplyList(Msg.isAgree, Msg.ApplyUserID);
        eventCenter.fire(guildEvent.CHANGE_APPLY_LIST);
    }

    sendChangeApplyState(guildId: number, userId: string, isConfirm: boolean) {
        let req = new gamesvr.FactionDisposeApplicantReq({
            isAgree: isConfirm,
            ApplyUserID: userId
        });
        operationSvr.send(req);
    }

    /**
     * 一键改变申请列表
     */
    private _recvChangeAllApplyState(recvMsg: { Result: number, Desc: string, Msg: gamesvr.FactionDisposeAllApplicantRes }) {
        if(!this._checkResValid(recvMsg)) {
            return;
        }
        let Msg = recvMsg.Msg;
        guildData.changeApplyList(Msg.isAgree);
        // 修改全部状态
        eventCenter.fire(guildEvent.CHANGE_APPLY_LIST);
    }

    sendChangeAllApplyState(isConfirm: boolean) {
        let req = new gamesvr.FactionDisposeAllApplicantReq({
            isAgree: isConfirm
        });
        operationSvr.send(req);
    }

    private _recvChangePosition(recvMsg: { Result: number, Desc: string, Msg: gamesvr.FactionNominateMemberRes }) {
        if(!this._checkResValid(recvMsg)) {
            return;
        }
        let Msg = recvMsg.Msg;
        // TODO 修改改变成员职位
        eventCenter.fire(guildEvent.CHANGE_MEMBER_LIST);
    }

    sendChangePosition(userId: string, position: GuildPositionType) {
        let req = new gamesvr.FactionNominateMemberReq({
            OtherUserID: userId,
            OtherFactionMemberType: position
        });
        operationSvr.send(req);
    }

    private _recvKickOut(recvMsg: { Result: number, Desc: string, Msg: gamesvr.FactionKickOutMemberRes }) {
        if(!this._checkResValid(recvMsg)) {
            return;
        }
        let Msg = recvMsg.Msg;
        // TODO 删除成员
        eventCenter.fire(guildEvent.CHANGE_MEMBER_LIST);
    }

    sendKickOut(userId: string, reasons: number[], reasonStrs: string[]) {
        let req = new gamesvr.FactionKickOutMemberReq({
            KickOutUserID: userId,
            KickOutReasonList: reasons,
            KickOutReasonList2: reasonStrs,
        });
        operationSvr.send(req);
    }
    /**
     * 接受到新的入会申请
     * @param recvMsg 
     * @returns 
     */
    private _recvAddApplyNotify(recvMsg: { Result: number, Desc: string, Msg: gamesvr.FactionAddApplicantNotify }) {
        if(!this._checkResValid(recvMsg)) {
            return;
        }
        let Msg = recvMsg.Msg;
        guildData.addApplyMember(Msg.FactionApplyMemberUnit);
        eventCenter.fire(guildEvent.CHANGE_APPLY_LIST);
    }
    /**
     * 接收到改变成员权限
     * @param recvMsg 
     * @returns 
     */
    private _recvPushApplyNotify(recvMsg: { Result: number, Desc: string, Msg: gamesvr.FactionPushApplicantNotify }) {
        if(!this._checkResValid(recvMsg)) {
            return;
        }
        let Msg = recvMsg.Msg;
        // eventCenter.fire(guildEvent.CHANGE_MEMBER_LIST);

    }
    /**
     * 接受到添加新成员通知
     * @param recvMsg 
     * @returns 
     */
    private _recvAddMemberNotify(recvMsg: { Result: number, Desc: string, Msg: gamesvr.FactionAddMemberNotify }) {
        if(!this._checkResValid(recvMsg)) {
            return;
        }
        let Msg = recvMsg.Msg;
        guildData.addMember(Msg.FactionMemberUnit);
    }

    /**
     * 接受加入公会通知
     * @param recvMsg 
     * @returns 
     */
    private _recvJoinGuildNotify(recvMsg: { Result: number, Desc: string, Msg: gamesvr.FactionJoinFactionNotify }) {
        if(!this._checkResValid(recvMsg)) {
            return;
        }
        let Msg = recvMsg.Msg;
        guildData.updateGuildInfo(Msg.Faction);
        eventCenter.fire(guildEvent.UPDATE_GUILD_INFO);
    }

    private _recvChangeCloseApplyNotify(recvMsg: { Result: number, Desc: string, Msg: gamesvr.FactionChangeSetApplyNotify }) {
        if(!this._checkResValid(recvMsg)) {
            return;
        }
        let Msg = recvMsg.Msg;
        // TODO 修改公会的同意入会申请状态
        guildData.guildInfo.Sundry.IsApply = Msg.IsApply;
        // eventCenter.fire(guildEvent.CHANGE_CLOSE_APPLY, Msg.IsApply);
    }
    /**
     * 收到改变自动审批信息的通知
     * @param recvMsg
     * @returns 
     */
    private _recvChangeAutoApproveNotify(recvMsg: { Result: number, Desc: string, Msg: gamesvr.FactionChangeSetAutoAcceptNotify }) {
        if(!this._checkResValid(recvMsg)) {
            return;
        }
        let Msg = recvMsg.Msg;
        // 修改公会自动申请状态
        guildData.guildInfo.Sundry.IsAutoAccept = Msg.IsAutoAccept;
        guildData.guildInfo.Sundry.AutoAcceptLevel = Msg.AutoAcceptLevel;
        // eventCenter.fire(guildEvent.CHANGE_AUTO_APPROVE);
    }

    /**
     * 接受到成员上线通知
     * @param recvMsg 
     * @returns 
     */
    private _recvMemberOnlineNotify(recvMsg: { Result: number, Desc: string, Msg: gamesvr.FactionOnlineMemberNotify }) {
        if(!this._checkResValid(recvMsg)) {
            return;
        }
        let Msg = recvMsg.Msg;
        // TODO 修改成员 离线信息
        guildData.changeMemberOnlineInfo(Msg.userID, true);
    }

    /**
     * 接受到成员下线通知
     * @param recvMsg 
     * @returns 
     */
    private _recvMemberOfflineNotify(recvMsg: { Result: number, Desc: string, Msg: gamesvr.FactionOfflineMemberNotify }) {
        if(!this._checkResValid(recvMsg)) {
            return;
        }
        let Msg = recvMsg.Msg;
        // TODO 修改成员 离线信息
        guildData.changeMemberOnlineInfo(Msg.userID, false, Msg.LastOnlineTime);
    }

    /**
     * 收到修改职位通知
     * @param recvMsg 
     * @returns 
     */
    private _recvChangePositionNotify(recvMsg: { Result: number, Desc: string, Msg: gamesvr.FactionNominateMemberNotify }) {
        if(!this._checkResValid(recvMsg)) {
            return;
        }
        let Msg = recvMsg.Msg;
        guildData.changeMemberPosition(Msg.UserID, Msg.FactionMemberType);
        eventCenter.fire(guildEvent.CHANGE_MEMBER_LIST);
    }

    /**
     * 接受被踢出的通知
     * @param recvMsg 
     * @returns 
     */
    private _recvKickOutNotify(recvMsg: { Result: number, Desc: string, Msg: gamesvr.FactionKickOutMemberNotify }) {
        if(!this._checkResValid(recvMsg)) {
            return;
        }
        let Msg = recvMsg.Msg;
        if(Msg.KickOutUserID == userData.uId) {
            guildData.clearGuildInfo();
            guildData.resetJoinGuideCDTime(Msg.AllowApplyTime);
            // taskData.clearGuildTasks();
            eventCenter.fire(guildEvent.FIRE_OUT_GUILD);
            let dialogCfg = configUtils.getDialogCfgByDialogId(2000018);
            guiManager.showMessageBoxByCfg(null, dialogCfg);
        } else {
            guildData.kickOutMember(Msg.KickOutUserID);
            eventCenter.fire(guildEvent.CHANGE_MEMBER_LIST);
        }
    }

    /**
     * 接受到退出公会的通知
     * @param recvMsg 
     * @returns 
     */
    private _recvExitNotify(recvMsg: { Result: number, Desc: string, Msg: gamesvr.FactionExitFactionNotify }) {
        if(!this._checkResValid(recvMsg)) {
            return;
        }
        let Msg = recvMsg.Msg;
        if(Msg.UserID == userData.uId) {
            guildData.clearGuildInfo();
            guildData.resetJoinGuideCDTime(utils.longToNumber(Msg.AllowApplyTime));
            // taskData.clearGuildTasks();
            eventCenter.fire(guildEvent.FIRE_OUT_GUILD);
        } else {
            guildData.kickOutMember(Msg.UserID);
            eventCenter.fire(guildEvent.CHANGE_MEMBER_LIST);
        }
    }

    /**
     * 接受到公会解散的通知
     * @param recvMsg 
     * @returns 
     */
     private _recvDissolveNotify(recvMsg: { Result: number, Desc: string, Msg: gamesvr.FactionDissolveFactionNotify }) {
        if(!this._checkResValid(recvMsg)) {
            return;
        }
        let Msg = recvMsg.Msg;
        guildData.clearGuildInfo();
        guildData.resetJoinGuideCDTime(utils.longToNumber(Msg.AllowApplyTime));
        // taskData.clearGuildTasks();
        eventCenter.fire(guildEvent.DISBAND_GUILD);
    }

    /**
     * 接受到新增动态消息的通知
     * @param recvMsg 
     * @returns 
     */
     private _recvAddDailyNewsNotify(recvMsg: { Result: number, Desc: string, Msg: gamesvr.FactionAddNewsFeedNotify }) {
        if(!this._checkResValid(recvMsg)) {
            return;
        }
        let Msg = recvMsg.Msg;
        guildData.addDailyNewsInfo(Msg.NewsFeedUnit);
        eventCenter.fire(guildEvent.UPDATE_DAILY_NEWS);
    }

    /**************************  公会活动 **************************** */

    private _recvJoinFight(recvMsg: { Result: number, Desc: string, Msg: gamesvr.FactionExpeditionJoinRes }) {
        if(!this._checkResValid(recvMsg)) {
            return;
        }
        guildData.updateFightInfo(recvMsg.Msg.FactionExpeditionHeroList);
        eventCenter.fire(guildEvent.JOIN_FIGHT_SUC);
    }


    sendJoinFight(order: number, heros: number[]) {
        let req = new gamesvr.FactionExpeditionJoinReq({
            ChallengeOrder: order,
            HeroIDList: heros
        });
        operationSvr.send(req);
    }

    private _recvFightInspire(recvMsg: { Result: number, Desc: string, Msg: gamesvr.FactionExpeditionUrgeRes }) {
        if(!this._checkResValid(recvMsg)) {
            return;
        }

        let msg = recvMsg.Msg;
        guildData.updateFightInfo(msg.FactionExpeditionHeroList, msg.ExpeditionFreeUrgeCount);
        eventCenter.fire(guildEvent.FIGHT_INSPIRE_SUC);
    }

    sendFightInspire() {
        let req = new gamesvr.FactionExpeditionUrgeReq({
        });
        operationSvr.send(req);
    }

    private _recvFightEndNotify(recvMsg: { Result: number, Desc: string, Msg: gamesvr.FactionExpeditionOrderResultNotify }) {
        if(!this._checkResValid(recvMsg)) {
            return;
        }
        if(recvMsg.Msg.FactionExpeditionOrderInfoUnit.IsWin) {
            guiManager.showTips(`战斗胜利`);
        } else {
            guiManager.showTips(`战斗失败`);
        }
        logger.log('_recvFightEndNotify:', recvMsg);
        guildData.updateFightResult(recvMsg.Msg);
        guildData.resetFightTeamData();
        eventCenter.fire(guildEvent.UPDATE_BOSS_VIEW)
    }

    private _recvGetJoinReward(recvMsg: { Result: number, Desc: string, Msg: gamesvr.FactionExpeditionReceiveJoinRewardRes }) {
        if(!this._checkResValid(recvMsg)) {
            return;
        }
        guildData.updateJoinReward(recvMsg.Msg.Order);
        eventCenter.fire(guildEvent.RECV_REWARD, recvMsg.Msg.Prizes);
    }

    sendGetJoinReward(order: number) {
        let req = new gamesvr.FactionExpeditionReceiveJoinRewardReq({
            Order: order
        });
        operationSvr.send(req);
    }

    private _recvGetWinReward(recvMsg: { Result: number, Desc: string, Msg: gamesvr.FactionExpeditionReceiveWinRewardRes }) {
        if(!this._checkResValid(recvMsg)) {
            return;
        }
        guildData.updateWinReward(recvMsg.Msg.Order);
        eventCenter.fire(guildEvent.RECV_REWARD, recvMsg.Msg.Prizes);
    }

    sendGetWinReward(order: number) {
        let req = new gamesvr.FactionExpeditionReceiveWinRewardReq({
            Order: order
        });
        operationSvr.send(req);
    }


    private _recvSignIn(recvMsg: { Result: number, Desc: string, Msg: gamesvr.FactionSignInRes }) {
        if(!this._checkResValid(recvMsg)) {
            return;
        }
        guildData.signIn();
        eventCenter.fire(guildEvent.SIGN_IN, recvMsg.Msg.Prizes);
    }

    sendSignIn() {
        let req = new gamesvr.FactionSignInReq({
        });
        operationSvr.send(req);
    }

    private _recvDonate(recvMsg: { Result: number, Desc: string, Msg: gamesvr.FactionDonateRes }) {
        if(!this._checkResValid(recvMsg)) {
            return;
        }
        guildData.updateDonateCount(Number(recvMsg.Msg.DonateCount) || 0);
        eventCenter.fire(guildEvent.UPDATE_DONATE, recvMsg.Msg.Prizes);
    }

    sendDonate(donateId: number) {
        let req = new gamesvr.FactionDonateReq({
            DonateID: donateId
        });
        operationSvr.send(req);
    }

    // TODO 预留一个本周最后一个
    private _recvResetGuildBoss(recvMsg: { Result: number, Desc: string, Msg: gamesvr.FactionExpeditionLevelRefreshNotify }) {
        if(!this._checkResValid(recvMsg)) {
            return;
        }
        let level = recvMsg.Msg.Level;
        let order = recvMsg.Msg.Order;
        guildData.resetBossInfo(level, order);
        eventCenter.fire(guildEvent.UPDATE_BOSS_VIEW);
    }

    testFightEnd() {
        guiManager.showTips(`战斗失败`);
        let result = new gamesvr.FactionExpeditionOrderResultNotify();
        result.Order = 7;
        result.Level = 1;
        result.FactionExpeditionOrderInfoUnit = new data.FactionExpeditionOrderInfo();
        result.FactionExpeditionOrderInfoUnit.IsWin = true;
        result.FactionExpeditionOrderInfoUnit.JoinUserIDMap[userData.uId + ''] = true;
        guildData.updateFightResult(result);
        eventCenter.fire(guildEvent.UPDATE_BOSS_VIEW)
    }

    testGetWinReward(order: number) {
        guildData.updateWinReward(order);
        let rewards: data.IItemInfo[] = [];
        rewards.push({
            ID: 10019002,
            Count: 1
        });
        eventCenter.fire(guildEvent.RECV_REWARD, rewards);
    }

    testGetJoinReward(order: number) {
        guildData.updateJoinReward(order);
        let rewards: data.IItemInfo[] = [];
        rewards.push({
            ID: 10019002,
            Count: 1
        });
        eventCenter.fire(guildEvent.RECV_REWARD, rewards);
    }
}

let guildOpt = new GuildOpt();
export {
    guildOpt
}
