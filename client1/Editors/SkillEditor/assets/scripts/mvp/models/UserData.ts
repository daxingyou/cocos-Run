import { UserLocalStrongType } from "../../app/AppEnums";
import LocalStorageUtils from "../../app/LocalStorageUtils";
import { configManager } from "../../common/ConfigManager";
import { logger } from "../../common/log/Logger";
import { data, gamesvr } from "../../network/lib/protocol";
import { optManager } from "../operations/OptManager";
import { modelManager } from "./ModeManager";


/**
 * 
 */
class RegiseterTime {
    low: number = 0;
    high: number = 0;
    unsigned: boolean = false;
}

/**
 * 用户信息数据结构
 */
class UserInfo {
    ChapterId: number = 1;
    LessonId: number = 1;
    level: number = 1;
    exp: number = 0;
    physical: number = 10;
    coin: number = 0;
    diamond: number = 0;
    headID: number = 0;
    headFrameID: number = 0;
    name: string = '';
    registerTime: RegiseterTime = null;
    Account: number = 0;
    userId: string = '';
    honour: number = 0;
    reputation: number = 0;
    constructor() {
        this.ChapterId = 1;
        this.LessonId = 1;
        this.level = 1;
        this.exp = 0;
        this.physical = 10;
        this.coin = 0;
        this.diamond = 0;
        this.Account = 0;
        this.registerTime = new RegiseterTime();
        this.userId = '';
        this.honour = 0;
        this.reputation = 0;
    }
}

export {
    UserInfo,
}

export default class UserData {
    private _userInfo: UserInfo = null;
    private _itemConfig: any = null;
    private _srvUserData: gamesvr.LoginRes = null;

    get userInfo() {
        return this._userInfo;
    }

    set userInfo(userInfo: UserInfo) {
        this._userInfo = userInfo;
    }

    get itemConfig() {
        return this._itemConfig;
    }

    init(res: gamesvr.LoginRes) {
        // todo 读取服务器用户信息
        this._srvUserData = res;
        this._userInfo = new UserInfo();
        if (this._srvUserData.UserData) {
            if (this._srvUserData.UserData.AccountData) {
                let accountData = this._srvUserData.UserData.AccountData;
                this._userInfo.userId = accountData.UserID;
                this._userInfo.name = accountData.Name;
                this._userInfo.headID = accountData.HeadID;
                this._userInfo.headFrameID = accountData.HeadFrameID;
                this._userInfo.exp = accountData.Exp;
                this._userInfo.registerTime = accountData.RegisterTime;

            }
            if (this._srvUserData.UserData.BagData) {
                // 填充背包数据
                // modelManager.bagData.init(this._srvUserData.UserData.BagData);
                optManager.bagDataOpt.init(this._srvUserData.UserData.BagData);
            }
        }
        logger.log('服务器用户数据：', res);
        // 本地保存用户关卡数
        let local = LocalStorageUtils.getInstance().getString(UserLocalStrongType.UserInfo);
        if (local) {
            // this._userInfo = JSON.parse(local);
            let localData: UserInfo = JSON.parse(local);
            this._userInfo.ChapterId = localData.ChapterId;
            this._userInfo.LessonId = localData.LessonId;
        } else {
            this.saveUserInfo();
        }

        // this.initItemConfig();
    }
    /**
     * 取得当前用户的account
     * @returns 
     */
    getUserAccount(): string {
        let localData = LocalStorageUtils.getInstance().getString(UserLocalStrongType.Account);
        if (localData) {
            return JSON.parse(localData) + '';
        } else {
            let account: number = new Date().getTime();
            this.setUserAccount(account);
            return account + '';
        }
    }
    /**
     * 设置当前用户的account
     * @param account 
     */
    setUserAccount(account: number) {
        LocalStorageUtils.getInstance().setString(UserLocalStrongType.Account, JSON.stringify(account));
    }

    initItemConfig() {
        this._itemConfig = configManager.getConfigs('item');
    }

    get chapterId() {
        return this.userInfo.ChapterId;
    }

    set chapterId(chapterId: number) {
        this.userInfo.ChapterId = chapterId;
        this.saveUserInfo();
    }

    get lessonId() {
        return this.userInfo.LessonId;
    }

    set lessonId(lessinId: number) {
        this.userInfo.LessonId = lessinId;
        this.saveUserInfo();
    }

    addPhysical(phsicalNum: number) {
        this._userInfo.physical += phsicalNum;
        if (this._userInfo.physical <= 0) {
            this._userInfo.physical = 0;
        }
        this.saveUserInfo();
    }

    addCoin(coinNum: number) {
        this._userInfo.coin += coinNum;
        if (this._userInfo.coin <= 0) {
            this._userInfo.coin = 0;
        }
        this.saveUserInfo();
    }

    addDiamond(diamondNum: number) {
        this._userInfo.diamond += diamondNum;
        if (this._userInfo.diamond <= 0) {
            this._userInfo.diamond = 0;
        }
        this.saveUserInfo();
    }

    addLesson() {
        let lessonInfos = modelManager.levelMapData.getCurLessonInfos();
        // 大于当前章节的关卡 需要升章节
        if (this.lessonId >= lessonInfos[lessonInfos.length - 1].LessonOrder) {
            this.chapterId = this.userInfo.ChapterId + 1;
            this.lessonId = 1;
        } else {
            this.lessonId = this.userInfo.LessonId + 1;
        }
        // 通关 需要更新levelnao数据
        modelManager.levelMapData.initCurLessonInfo();
        optManager.levelMapOpt.fireRefreshRewardView();
    }

    updateUsrName(name: string) {
        this._userInfo.name = name;
    }

    updateUsrHead(hID: number) {
        this._userInfo.headID = hID;
    }

    updateUsrFrame(fID: number) {
        this._userInfo.headFrameID = fID;
    }

    saveUserInfo() {
        LocalStorageUtils.getInstance().setString(UserLocalStrongType.UserInfo, JSON.stringify(this._userInfo));
    }
}
