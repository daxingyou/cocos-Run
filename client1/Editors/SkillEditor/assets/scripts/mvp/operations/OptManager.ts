/*
 * @Author: fly
 * @Date: 2021-03-16 19:05:56
 * @LastEditTime: 2021-03-16 19:05:56
 * @Description: file content
 */

import BagDataOpt from "./BagDataOpt";
import BattleUIOpt from "./BattleUIOpt";
import LevelMapOpt from "./LevelMapOpt";
import UserOpt from "./UserOpt"
import { LoginOpt } from "./LoginOpt";
import HeroOpt from "./HeroOpt";

export default class OptManager {
    private static _instance: OptManager = null;

    public static getInstance(): OptManager {
        if (!this._instance) {
            this._instance = new OptManager();
        }
        return this._instance;
    }

    public static destroy(): void {
        if (this._instance) {
            this._instance = null;
        }
    }

    private constructor() {
        this._battleUIOpt = new BattleUIOpt();
        this._levelMapOpt = new LevelMapOpt();
        this._loginOpt = new LoginOpt();
        this._bagDataOpt = new BagDataOpt();
        this._usrOpt = new UserOpt();
        this._heroOpt = new HeroOpt();
    }

    public init() {
        this.loginOpt.init();
        this._battleUIOpt.init();
        this._usrOpt.init();
    }
    /**
     * 登录成功才会初始化关卡数据
     */
    public initChapter() {
        this.levelMapOpt.init();
    }
        
    // 战斗UI数据控制类
    private _battleUIOpt: BattleUIOpt = null;
    get battleUIOpt() {
        return this._battleUIOpt;
    }

    // 关卡地图控制类
    private _levelMapOpt: LevelMapOpt = null;
    get levelMapOpt() {
        return this._levelMapOpt;
    }
    // 登录模块控制类
    private _loginOpt: LoginOpt = null;
    get loginOpt() {
        return this._loginOpt;
    }

    private _bagDataOpt: BagDataOpt = null;
    get bagDataOpt() {
        return this._bagDataOpt;
    }

    private _usrOpt: UserOpt = null;
    get usrOpt() {
        return this._usrOpt;
    }

    private _heroOpt: HeroOpt = null;
    get heroOpt() {
        return this._heroOpt;
    }
}

export let optManager = OptManager.getInstance();
