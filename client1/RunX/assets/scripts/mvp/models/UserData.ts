import { appCfg } from "../../app/AppConfig";
import { utils } from "../../app/AppUtils";
import { configUtils } from "../../app/ConfigUtils";
import PackageUtils from "../../app/PackageUtils";
import { eventCenter } from "../../common/event/EventCenter";
import { commonEvent, GuideEvents, hangUpEvent, useInfoEvent } from "../../common/event/EventData";
import { localStorageMgr } from "../../common/LocalStorageManager";
import { data, gamesvr } from "../../network/lib/protocol";
import HeroUnit from "../template/HeroUnit";
import { bagData } from "./BagData";
import BaseModel from "./BaseModel";

class UserData extends BaseModel {
    private _accountData: data.IAccountData = null;
    private _universalData: data.IUniversalData = null;
    private _userLv: number = 1;
    private _curExp: number = 0;                    //当前等级经验
    private _curMaxExp: number = 0;                 //当前等级最高经验
    private _capability: number = 0;                // 战斗力 有可能后续会放到 accountData里
    private _age: number = 18;
    private _msgs: gamesvr.SystemMessageNotify[] = [];
    private _auditAccount: string = '';
    private _preCapability: number = 0;             // 增长之前的战斗力

    get accountData() {
        return this._accountData;
    }

    get age () {
        return this._age;
    }

    get headId() {
        return this._accountData.HeadID;
    }

    get frameId() {
        return this._accountData.HeadFrameID;
    }

    get uId(){
        return this._accountData.UserID;
    }

    get lv(): number {
        return this._userLv;
    }

    get exp(): number {
        return this._curExp;
    }

    get maxExp() {
        return this._curMaxExp;
    }

    get capability() {
        return this._capability;
    }

    get auditAccount() {
        return this._auditAccount
    }

    set auditAccount(account: string) {
        this._auditAccount = account
    }

    get universalData(){
        return this._universalData || {};
    }

    get preCapability() {
        return this._preCapability;
    }

    init() { }

    deInit() {
        // 账号登出的时候调用，登录的时候再根据具体年龄处理相关防沉迷的操作
        this._age = 18;

        this._accountData = null;
        this._universalData = null;
        this._userLv = 1;
        this._curExp = 0;
        this._curMaxExp= 0;
        this._capability= 0;
        this._age= 18;
        this._msgs = [];
        this._auditAccount = '';
        this._preCapability= 0;
    }

    initUserData(res: data.IAccountData) {
        if(!res) return;

        this._accountData = res;
        this._userLv = 1;
        this._curMaxExp = 0;
        this._curExp = 0;
        this.updateLv();
        this._updateLocalCache();
    }

    initUniversalData(res: data.IUniversalData) {
        this._universalData = res;
    }

    updateUniversalState(){
        if (this._universalData && this._universalData.UniversalSageData){
            this._universalData.UniversalSageData.IsChoose = true;
        } else {
            this._universalData = {UniversalSageData: {IsChoose: true}};
        }
    }

    updateUsrName(name: string, universal?: boolean) {
        this._accountData.Name = name;
        if (!universal)
            this._accountData.ChangeNameCounter = (this._accountData.ChangeNameCounter || 0) +1;
    }

    updateUsrHead(hID: number) {
        this._accountData.HeadID = hID;
    }

    updateUsrFrame(fID: number) {
        this._accountData.HeadFrameID = fID;
    }

    updateExp(exp: number) {
        this._accountData.Exp = exp;
        let curLv: number = this._userLv;
        this.updateLv();
        if (this._userLv != curLv) {
            // 升级了
            this.updateCapability(0);
            eventCenter.fire(GuideEvents.UPDATE_GUIDE_CFGS, 'expChange');
        }
        eventCenter.fire(useInfoEvent.USER_EXP_CHANGE, curLv);

    }

    //计算最新的等级，等级经验，当前等级经验上限，即取即用
    updateLv() {
        let expConfigs = configUtils.getLevelExpConfigsByType(3);
        if (this._accountData.Exp) {
            let expCount: number = 0;
            for (const k in expConfigs) {
                this._userLv = Number(k);
                this._curMaxExp = Number(expConfigs[k].LevelExpNeedNum);
                this._curExp = this._accountData.Exp - expCount;
                expCount += expConfigs[k].LevelExpNeedNum;
                if (this._accountData.Exp < expCount) {
                    break;
                }
            }
        } else {
            this._userLv = 1;
            this._curMaxExp = Number(expConfigs[1].LevelExpNeedNum);
            this._curExp = 0;
        }
    }

    updateCapability(recvCapability: number = 0, isSend: boolean = true, isPassive: boolean = false) {
        let capability: number = 0;
        let preCapability = this._capability;
        // 算一遍战斗力
        for (let i = 0; i < bagData.heroList.length; ++i) {
            let heroUnit: HeroUnit = bagData.getHeroById(bagData.heroList[i].ID);
            capability += heroUnit.getCapability(isPassive);
        }
        if (recvCapability > 0 && recvCapability != capability) {
            // logger.error('战斗力计算错误：', 'srv:', recvCapability, 'client:', capability);
            if (this._capability != recvCapability) {
                if (isSend) {
                    this._preCapability = this._capability;
                    // userOpt.sendCapabilityChange(this._capability, recvCapability);
                } else {
                    this._preCapability = recvCapability;
                }
                this._capability = recvCapability;
            }
        } else {
            if (this._capability != capability) {
                if (isSend) {
                    this._preCapability = this._capability;
                    // userOpt.sendCapabilityChange(this._capability, capability);
                } else {
                    this._preCapability = recvCapability;
                }
                this._capability = capability;
            }
        }

        if(preCapability != this._capability){
            eventCenter.fire(commonEvent.UPDATE_CAPABILITY);
        }
    }

    checkUpgrade(exp: number) {
        let expConfigs = configUtils.getLevelExpConfigsByType(3);
        let lv: number = 0;
        if (exp) {
            let expCount: number = 0;
            for (const k in expConfigs) {
                expCount += expConfigs[k].LevelExpNeedNum;
                lv = Number(k);
                if (exp < expCount) {
                    break;
                }
            }
        }
        return lv && lv > this._userLv;
    }

    updateAge () {
        let ageStr = PackageUtils.getAccountAge() || "0";
        let age = parseInt(ageStr);
        let userid = this._auditAccount
        // 审核账号年龄分级
        if (appCfg.audit.up18.indexOf(userid) >= 0) {
            age = 20
        } else if (appCfg.audit.in16to17.indexOf(userid) >= 0) {
            age = 17
        } else if (appCfg.audit.in9to15.indexOf(userid) >= 0) {
            age = 12
        } else if (appCfg.audit.down8.indexOf(userid) >= 0) {
            age = 6
        }
        this._age = age;
    }

    getSystemMsgs(){
        let systemMsgs: gamesvr.SystemMessageNotify[] = utils.deepCopy(this._msgs);
        return systemMsgs;
    }

    putSystemMsg(msg: gamesvr.SystemMessageNotify){
        msg && this._msgs.push(msg);
    }

    delSystemMsg(msg: gamesvr.SystemMessageNotify){
        let json = JSON.stringify(msg);
        for (let k = 0; k < this._msgs.length; k++) {
            let content = this._msgs[k];
            let contentJson = JSON.stringify(utils.deepCopy(content));
            if (contentJson == json) {
                this._msgs.splice(k, 1);
                break;
            }
        }
    }

    updateHangupChapter (chapterID: number) {
        if (this.universalData.UniversalHangUpGainData) {
            this.universalData.UniversalHangUpGainData.ChapterID = chapterID;
        } else {
            this.universalData.UniversalHangUpGainData = {ChapterID: chapterID};
        }
    }

    updateHangupAfterReward (msg: gamesvr.UniversalHangUpGainReceiveRewardRes) {
        this.universalData.UniversalHangUpGainData = this.universalData.UniversalHangUpGainData || {};
        this.universalData.UniversalHangUpGainData.LastCalTime = msg.LastCalTime;
        this.universalData.UniversalHangUpGainData.StartTime = msg.StartTime;
    }

    private _updateLocalCache() {
        localStorageMgr.account = this.uId.toString()
    }

    /**
     * 凌晨刷新数据
     */
    onDayReset() {
        // 冒险挂机 - 快速挂机次数清零
        this.universalData.UniversalHangUpGainData.FastHangUpCount = 0;
        eventCenter.fire(hangUpEvent.REFRESH_VIEW);
    }
}

let userData = new UserData();
export { userData }
