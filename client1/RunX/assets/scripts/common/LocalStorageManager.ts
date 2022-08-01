import { logger } from "./log/Logger";
import {scheduleManager} from "./ScheduleManager";

let SAVE_TAG = {
    // LocalStorage
    LAST_ACCOUNT: "LastAccount",
    LAST_SVR: "LastServer",

    MUSIC_VOLUMN: "MUSIC_VOLUMN",       //音乐
    EFFECT_VOLUMN: "EFFECT_VOLUMN",     //音效
    VOICE_VOLUMN: "VOICE_VOLUMN",       //语音
    PV_PLAYED: 'PV_PLAYED',             //PV播放记录

    MUSIC_STATE: "MUSIC_STATE",
    AUDIO_STATE: "AUDIO_STATE",
    MUSIC_VOLUME: "MUSIC_VOLUME",
    AUDIO_VOLUME: "AUDIO_VOLUME",

    // AccountStorage
    CHAT_DATA_WORLD: "CHAT_DATA_WORLD",
    CHAT_DATA_SYSTEM: "CHAT_DATA_SYSTEM",
    BUBBLE_ID: "BUBBLE_ID",

    WORLD_CD: "WORLD_CD",
    GUILD_CD: "GUILD_CD",
    SYSTEM_CD: "SYSTEM_CD",
    LEVEL_KEY: 'Runx_LevelInfo',
    PARKOUR_MODE: "PARKOUR_MODE",       //跑酷操作方式
    PARKOUR_LAST_TEAM: "parkour_last_team",//最近跑酷的本地缓存key
    PARKOUR_AUTO: 'parkour_auto', //自动模式的本地缓存key

    RISE_ROAD: "RISE_ROAD_HERO_STICKY" ,
    BATTLE_LAST: "LAST_TEAMbvba",

    PVP_MULT_BATTLE_LAST_TEAM: "PVP_MULT_BATTLE_LAST_TEAM", //pvp多阵容key

    MAGIC_DOOR_LAST_TEAM: 'MAGIC_DOOR_LAST_TEAM',
    ISLAND_LAST_TEAM: 'ISLAND_LAST_TEAM',
    CHALLENGE_LAST_TIME: 'CHALLENGE_LAST_TIME',
    PURGATORY_LAST_TIME: 'PURGATORY_LAST_TIME',
    XIN_MO_LAST_TEAM: 'XIN_MO_LAST_TEAM',

    SPEED_STR: "BATTLE_SPEED",
    CHANGE_BG: "ChangeBg",

    LIMIT_GIFT: "LIMIT_GIFT",

    FIRST_LOGIN: "FirstLogin",

    PVE_MODE_DEFAULT_TEAM: 'PVE_MODE_%d',
    BATTLE_MULTI_TIPS: "BATTLE_MULTI_TIPS",
    GROW_TIPS: "GROW_TIPS",
}

let defaultStorage = {
    removeItem: () => {},
    setItem: () => {},
    getItem: () => {}
}

/**
 * 本地存储数据类
 * 
 * 所有的本地存储key在这里定义
 * 所有的本地存储接口放在这里
 * 使用时候只需要关注下面几个接口
 * 1. 不需要和账号绑定(e.g. 音量设置，上次登录账号)
 *  - setLocalStorage
 *  - getLocalStorage
 *  - removeLocalStorage
 * 2. 需要和账号绑定(e.g. 默认阵容)
 *  - setAccountStorage
 *  - getAccountStorage
 *  - removeAccountStorage
 */
class LocalStorageManager {
    private _account: string = "";
    private _userData: any = null;

    private _commCache: Map<string, any> = null;
    private _cacheQueue: Map<string|number, any> = null;
    private _schedulerID: number = null;


    constructor () {
        this._cacheQueue = new Map<string|number, any>();
        this._commCache = new Map<string, any>();
        this._setAccount();
    }

    private _setAccount () {
        this._account = this.getLocalStorage(SAVE_TAG.LAST_ACCOUNT);
    }

    private _setUserData () {
        if (!this._checkAccount()) return;

        let userDataStr = this._getItem(this._account)
        if (userDataStr) {
            try {
                this._userData = JSON.parse(userDataStr);
            } catch (error) {
                this._userData = {};
            }
        } else {
            this._userData = {};
        }
    }

    private _storeUserData () {
        if (!this._checkAccount()) return;

        let userData = JSON.stringify(this._userData);
        this._setItem(this._account, userData)
    }

    private get localStorage () {
        try {
            //@ts-ignore
            if (cc) {
                //@ts-ignore
                return cc.sys.localStorage;
            }
        } catch (error) {
        }
        return defaultStorage;
    }

    private _checkAccount () {
        if (!this._account) {
            this._setAccount();
            if (!this._account){
                logger.error(`LocalStorageManager`, `account is not exist`);
                return false;
            }
        }
        return true;
    }

    get account () {
        return this._account;
    }

    // 登录成功/新手引导生成
    set account (v: string) {
        this._account = v;
        this._setUserData();
    }

    /**
     * 游戏所有账号通用的本地存储
     * 
     * @param key 
     * @param data 
     */
    setLocalStorage (key: string|number, data: any) {
        this._commCache.set(`${key}`, data);
        let stringifyData = typeof(data)=="string" ? data : JSON.stringify(data);
        this._setItem(`${key}`, stringifyData)
    }

    getLocalStorage (key: string|number) {
        let data: any;
        if(this._commCache.has(`${key}`)){
            return this._commCache.get(`${key}`);
        }
        let dataStr = this._getItem(key)
        if (dataStr) {
            try {
                data = JSON.parse(dataStr);
                this._commCache.set(`${key}`, data);
            } catch (error) {
                data = null;
            }
        }
        return data;
    }

    removeLocalStorage (key: string|number) {
        this._commCache.has(`${key}`) && this._commCache.delete(`${key}`);
        this.localStorage.removeItem(key);
    }

    /**
     * 当前账号使用的本地存储
     * 
     * @param key 
     * @param data 
     */
    setAccountStorage (key: string|number, data: any) {
        if (!this._userData) {
            this._setUserData();
        }

        if (!this._userData) return;

        this._userData[key] = data;
        this._storeUserData();
    }

    getAccountStorage (key: string|number) {
        if (this._userData && this._userData[key] != null) {
            return this._userData[key];
        }
        return null;
    }

    removeAccountStorage (key: string|number) {
        if (this._userData && this._userData[key] != null) {
            delete this._userData[key];
            this._storeUserData();
        }
    }

    /*-----------------------------------------------------------------------------------------
    *
    *-----------------------------------------------------------------------------------------*/

    private _setItem (key: string, originMsg: string) {
        this._cacheQueue.set(key, originMsg);
        this._schedulerID == null && this._save();
    }

    private _getItem (key: string|number) {
        let itemStr = this.localStorage.getItem(key);
        return itemStr;
    }

    private _save(){
        if(!this._cacheQueue || this._cacheQueue.size == 0){
            return;
        }

        this._schedulerID = scheduleManager.schedule(() => {
            if(!this._cacheQueue || this._cacheQueue.size == 0){
                  this._schedulerID && scheduleManager.unschedule(this._schedulerID)
                  this._schedulerID = null;
                  return;
            }

            let entry = this._cacheQueue.entries().next();
            let curKey = entry.value[0];
            let currValue =  entry.value[1];
            this._cacheQueue.delete(curKey);
            this.localStorage.setItem(curKey, currValue);
        }, 0);
    }
}

let localStorageMgr = new LocalStorageManager();
export {
    localStorageMgr,
    SAVE_TAG
}
