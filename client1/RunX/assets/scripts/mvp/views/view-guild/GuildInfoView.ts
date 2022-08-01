import { CustomDialogId, RES_ICON_PRE_URL, VIEW_NAME } from "../../../app/AppConst";
import { utils } from "../../../app/AppUtils";
import { configUtils } from "../../../app/ConfigUtils";
import ButtonEx from "../../../common/components/ButtonEx";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { configManager } from "../../../common/ConfigManager";
import { eventCenter } from "../../../common/event/EventCenter";
import { bagDataEvent, commonEvent, guildEvent } from "../../../common/event/EventData";
import guiManager from "../../../common/GUIManager";
import { logger } from "../../../common/log/Logger";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { cfg } from "../../../config/config";
import { data, gamesvr } from "../../../network/lib/protocol";
import { guildData } from "../../models/GuildData";
import { serverTime } from "../../models/ServerTime";
import { guildOpt } from "../../operations/GuildOpt";

const GUILD_MAX_LV: number = 10;

const {ccclass, property} = cc._decorator;

@ccclass
export default class GuildInfoView extends ViewBaseComponent {
    @property(cc.Label) guildName: cc.Label = null;
    @property(cc.Sprite) chairmanHeadSp: cc.Sprite = null;
    @property(cc.Sprite) chairmanFrameSp: cc.Sprite = null;
    @property(cc.Label) chairmanName: cc.Label = null;
    @property(cc.Label) chairmanLv: cc.Label = null;
    @property(cc.Label) guildLv: cc.Label = null;
    @property(cc.Label) guildExp: cc.Label = null;
    @property(cc.Label) guildNotice: cc.Label = null;
    @property(cc.Sprite) guildExpFilled: cc.Sprite = null;
    @property(cc.Node) applyBtn: cc.Node = null;
    @property(cc.Node) appliedBtn: cc.Node = null;
    @property(cc.Node) editNoticeBtn: cc.Node = null;
    @property(cc.Node) exitGuildBtn: cc.Node = null;
    @property(cc.Node) disbandGuildBtn: cc.Node = null;
    @property(cc.Node) changeNameBtn: cc.Node = null;
    @property(ButtonEx) signBtn: ButtonEx = null;
    @property(cc.Label) signTips: cc.Label = null;
    @property(ButtonEx) donateBtn: ButtonEx = null;
    @property(cc.Label) applyCDTime: cc.Label = null;

    private _spriteLoader: SpriteLoader = new SpriteLoader();
    private _loadView: Function = null;
    private _searchInfo: gamesvr.FactionSearchInfo = null;
    private _isLoaded: boolean = false;

    onInit(loadView: Function, searchInfo: gamesvr.FactionSearchInfo) {
        if(!this._isLoaded) {
            this.doInit();
            this._isLoaded = true;
        }
        this._loadView = loadView;
        if(!guildData.guildInfo) {
            this._searchInfo = searchInfo;
            this._refreshListInfo();
        } else {
            this._searchInfo = null;
            this._refreshMainInfo();
        }
    }

    doInit() {
        eventCenter.register(guildEvent.APPLY_JOIN, this, this._onRecvApply);
        eventCenter.register(guildEvent.CHANGE_NAME, this, this._onChangeName);
        eventCenter.register(guildEvent.CHANGE_NOTICE, this, this._onChangeNotice);
        eventCenter.register(guildEvent.SIGN_IN, this, this._onRecvSign);
        eventCenter.register(commonEvent.TIME_DAY_RESET, this, this._refreshMainBottoms);
        eventCenter.register(bagDataEvent.GUILD_EXP_CHANGE, this, this._recvGuildExpChange);
        eventCenter.register(guildEvent.UPDATE_GUILD_INFO, this, this._refreshGuildExpView);
    }

    onRelease() {
        this._isLoaded = false;
        this._spriteLoader.release();
        this.releaseSubView();
        this.unscheduleAllCallbacks();
        eventCenter.unregisterAll(this);
    }

    private _refreshMainInfo() {
        const guildInfo = guildData.guildInfo;
        if(!guildInfo) {
            this.node.active = false;
            logger.warn('GuildInfoView _refreshMainInfo guildInfo 不存在', guildData.guildInfo);
            return;
        }
        this.node.active = true;
        const guildBaseInfo = guildInfo.Account;
        this.guildName.string = guildBaseInfo.Name;

        this._refreshGuildExpView();

        const guildSundry = guildInfo.Sundry;

        this.guildNotice.string = guildSundry.BulletinText ? guildSundry.BulletinText : this._getInitNotice(guildSundry.BulletinID);
        let chairmanInfo = guildData.getChairmanMember();
        this.chairmanLv.string = this._getUserLv(Number(chairmanInfo.Exp || 0)) + '';
        this.chairmanName.string = chairmanInfo.Name;

        let headUrl = `${RES_ICON_PRE_URL.HEAD_IMG}/` + configUtils.getHeadConfig(chairmanInfo.HeadID).HeadFrameImage;
        let frameUrl = `${RES_ICON_PRE_URL.HEAD_FRAME}/` + configUtils.getHeadConfig(chairmanInfo.HeadFrameID).HeadFrameImage;
        this._spriteLoader.changeSpriteP(this.chairmanHeadSp, headUrl);
        this._spriteLoader.changeSpriteP(this.chairmanFrameSp, frameUrl);
        this._refreshMainBottoms();

        
    }

    private _refreshMainBottoms() {
        if(guildData.guildInfo) {
            this.applyBtn.active = false;
            this.applyCDTime.node.active = false;
            this.appliedBtn.active = false;
            this.signBtn.node.active = true;
            this.donateBtn.node.active = true;
            this.signBtn.setGray(guildData.signState);
            this.signTips.string = `${guildData.signState ? '已签到' : '签到'}`;
            let myRoleInfo = guildData.myGuildSelfInfo;
            let myMemberTyppe = guildData.getMemberTypeByUid(myRoleInfo.UserID);
            let limitCfg = this._getRoleLimit(myMemberTyppe);
            this.editNoticeBtn.active = !!limitCfg.GuildRoleNotice;
            this.changeNameBtn.active = !!limitCfg.GuildRoleRename;
            // this.exitGuildBtn.active = myMemberTyppe != data.FACTION_MEMBER_TYPE.PRESIDENT;
            this.exitGuildBtn.active = false;
            // this.disbandGuildBtn.active = myMemberTyppe == data.FACTION_MEMBER_TYPE.PRESIDENT;
            this.disbandGuildBtn.active = false;
        }
    }

    private _refreshListInfo() {
        if(!this._searchInfo) {
            logger.warn('GuildInfoView _refreshListInfo searchInfo 不存在', this._searchInfo);
            this.node.active = false;
            return;
        }
        this.node.active = true;
        this.guildName.string = this._searchInfo.Name;
        this.chairmanName.string = this._searchInfo.President.Name;

        this.chairmanLv.string = `${this._getUserLv((Number(this._searchInfo.President.Exp || 0)))}`;

        this._refreshGuildExpView();

        let headUrl = `${RES_ICON_PRE_URL.HEAD_IMG}/` + configUtils.getHeadConfig(this._searchInfo.President.HeadID).HeadFrameImage;
        let frameUrl = `${RES_ICON_PRE_URL.HEAD_FRAME}/` + configUtils.getHeadConfig(this._searchInfo.President.HeadFrameID).HeadFrameImage;
        this._spriteLoader.changeSpriteP(this.chairmanHeadSp, headUrl);
        this._spriteLoader.changeSpriteP(this.chairmanFrameSp, frameUrl);

        this.guildNotice.string = this._searchInfo.BulletinText ? this._searchInfo.BulletinText : this._getInitNotice(this._searchInfo.BulletinID);

        
        this._refreshListBottoms();
    }

    private _refreshListBottoms() {
        // 直接关闭公会界面的按钮
        this.exitGuildBtn.active = false;
        this.disbandGuildBtn.active = false;
        this.editNoticeBtn.active = false;
        this.changeNameBtn.active = false;
        this.signBtn.node.active = false;
        this.donateBtn.node.active = false;
        this.applyCDTime.node.active = false;
        this.unscheduleAllCallbacks();
        // 刷新公会列表界面的按钮
        if(this._searchInfo) {
            this._applyBtnCountDown();
            //IsAlreadyApply 协议里表示可以申请
            this.appliedBtn.active = !this._searchInfo.IsAlreadyApply;
        }
    }

    private _applyBtnCountDown() {
        let isApply =  this._searchInfo.IsAlreadyApply && (!guildData.applyCDTime || serverTime.currServerTime() > guildData.applyCDTime);
        this.applyBtn.active = isApply;

        let isApplyCD = this._searchInfo.IsAlreadyApply && guildData.applyCDTime && serverTime.currServerTime() <= guildData.applyCDTime
        this.applyCDTime.node.active = isApplyCD;
        if(!isApplyCD) return;

        this.applyCDTime.string = `${utils.getTimeInterval(guildData.applyCDTime - serverTime.currServerTime())}后可再次加入公会`;
        this.schedule(() => {
            let leftTime = guildData.applyCDTime - serverTime.currServerTime();
            if(leftTime < 0) {
                this.unscheduleAllCallbacks();
                this._applyBtnCountDown();
                return;
            }
            this.applyCDTime.string = `${utils.getTimeInterval(leftTime)}后可再次加入公会`;
        }, 1);
    }

    private _refreshGuildExpView() {
        let exp: number = 0;
        if(this._searchInfo) {
            exp = this._searchInfo.Exp || 0
        } else {
            exp = guildData.guildInfo.Account.Exp || 0;
        }

        const guildLv = this._getGuildLv(Number(exp));
        this.guildLv.string = `Lv.${guildLv}`;

        let curExp: number = this._getGuildCurExp((Number(exp)));
        let upgradeExp: number = this._getUpgradeExp(guildLv);
        this.guildExp.string = guildLv >= GUILD_MAX_LV ? 'max' : `${curExp}/${upgradeExp}`;
        this.guildExpFilled.fillRange = guildLv >= GUILD_MAX_LV ? 1 : (curExp / upgradeExp);
    }

    onClickApplyJoin() {
        guildOpt.sendApplyJoin(this._searchInfo.FactionID);
    }

    onClickSignInBtn() {
        if(guildData.signState) {
            guiManager.showDialogTips(99000048);
        } else {
            guildOpt.sendSignIn();
        }
    }

    onClickDonateBtn() {
        this._loadView('GuildDonateView', this._loadView);
    }

    private _onRecvApply() {
        guiManager.showTips(configUtils.getDialogCfgByDialogId(1000121).DialogText);
        if (guildData.guildInfo) {
            // this.applyBtn.active = false;
            // this.exitGuildBtn.active = true;
        } else {
            this.applyBtn.active = false;
            this.applyCDTime.node.active = false;
            this.unscheduleAllCallbacks();
            this.appliedBtn.active = true;
        }   
    }

    private _onRecvSign(eventId: number, prizes: data.IItemInfo[]) {
        guiManager.showDialogTips(99000049);
        this._loadView(VIEW_NAME.GET_ITEM_VIEW, prizes);
        this.signBtn.setGray(true);
        this.signTips.string = '已签到';
    }

    private _getInitNotice(dialogId: number): string {
        let dialogCfg = configUtils.getDialogCfgByDialogId(dialogId);
        return dialogCfg ? dialogCfg.DialogText : '';
    }

    private _onChangeName(eventId: number, name: string) {
        guiManager.showTips('公会改名成功');
        this.guildName.string = `${name}`;
    }

    private _onChangeNotice(eventId: number, notice: string) {
        guiManager.showTips('公会修改公告成功');
        this.guildNotice.string = `${notice}`;
    }

    private _recvGuildExpChange() {
        guildOpt.sendGetGuildInfo();
    }

    private _getUserLv(exp: number): number {
        let expConfigs = configUtils.getLevelExpConfigsByType(3);
        if (exp) {
            let expCount: number = 0;
            for (const k in expConfigs) {
                expCount += expConfigs[k].LevelExpNeedNum;
                if (exp < expCount) {
                    return Number(k);
                }
            }
            return utils.getUserMaxLv();
        } else {
           return 1;
        }
    }

    private _getGuildCurExp(exp: number): number {
        if(exp) {
            let guildLevels: {[k: string]: cfg.GuildLevel} = configManager.getConfigs('guildLevel');
            if(guildLevels) {
                for(const k in guildLevels) {
                    if(guildLevels[k].GuildLevelExp && guildLevels[k].GuildLevelExp <= exp) {
                        exp -= guildLevels[k].GuildLevelExp;
                    }
                }
            }
        }
        return exp;
    }

    private _getUpgradeExp(lv: number) {
        let cfg = configUtils.getGuildLevelCfg(lv);
        return cfg.GuildLevelExp;
    }

    onClickEditNotice() {
        if(guildData.myGuildSelfInfo) {
            let myMemberTyppe = guildData.getMemberTypeByUid(guildData.myGuildSelfInfo.UserID);
            let guildInfo = guildData.guildInfo;
            if(data.FACTION_MEMBER_TYPE.PRESIDENT == myMemberTyppe) {
                this._loadView(VIEW_NAME.GUILD_EDIT_NOTICE_VIEW, guildInfo.Account.ID);
            }
        }
    }

    onClickLevelDetail() {
        this._loadView(VIEW_NAME.GUILD_LEVEL_DETAIL_VIEW);
    }

    onClickChangeName() {
        this._loadView(VIEW_NAME.GUILD_CHANGE_NAME_VIEW, this._loadView.bind(this));
    }

    onClickDisband() {
        guiManager.showMessageBox(this.node.parent, {
            titleStr: '解散公会',
            content: configUtils.getDialogCfgByDialogId(CustomDialogId.GUILD_DISBAND).DialogText,
            leftStr: '取消',
            rightStr: '确定',
            rightCallback: () => {
                guildOpt.sendExit();
            }
        });
    }

    onClickExit() {
        guiManager.showMessageBox(this.node.parent, {
            titleStr: '退出公会',
            content: '确定退出公会？',
            leftStr: '取消',
            rightStr: '确定',
            rightCallback: () => {
                guildOpt.sendExit();
            }
        })
    }

    private _getRoleLimit(position: data.FACTION_MEMBER_TYPE): cfg.GuildRole {
        let cfg = configUtils.getGuildRoleCfg(position);
        return cfg;
    }

    private _getGuildLv(exp: number) {
        let lv: number = 1;
        let guildLevels: {[k: string]: cfg.GuildLevel} = configManager.getConfigs('guildLevel');
        if(guildLevels) {
            let needExp = 0;
            for(const k in guildLevels) {
                if(guildLevels[k].GuildLevelExp) {
                    needExp += guildLevels[k].GuildLevelExp;
                    if(exp >= needExp) {
                        lv = guildLevels[k].GuildLevelID + 1;
                    }
                }
            }
        }
        return lv;
    }
}
