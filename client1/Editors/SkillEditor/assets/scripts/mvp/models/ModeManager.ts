/*
 * @Author: fly
 * @Date: 2021-03-16 19:05:43
 * @LastEditTime: 2021-03-16 19:05:44
 * @Description: file content
 */
import { gamesvr } from "../../network/lib/protocol";
import BagData from "./BagData";
import BattleUIData from "./BattleUIData";
import HeroData from "./HeroData";
import LevelMapData from "./LevelMapData";
import LoginData from "./LoginData";
import UserData from "./UserData";
import HeadData from "./HeadData"

class ModelManager {
    private static _instance: ModelManager = null;

    public static getInstance(): ModelManager {
        if (!this._instance) {
            this._instance = new ModelManager();
        }
        return this._instance;
    }

    public static destroy(): void {
        if (this._instance) {
            this._instance = null;
        }
    }

    private constructor() {
        this._battleUIData = new BattleUIData();
        this._levelMapData = new LevelMapData();
        this._loginData = new LoginData();
        this._userData = new UserData();
        this._bagData = new BagData();
        this._heroData = new HeroData();
        this._headData = new HeadData();
    }

    public init() {
        this._battleUIData.init();
        this._headData.init();
    }
    /**
     * 用户登录成功
     * @param res 
     */
    updateByLoginResponse(res: gamesvr.LoginRes) {
        // @todo upate loginRes
        // userDataManager.init(res);
        this.userData.init(res);
        // logger.log("[ModeManager] login response. res = ", res);
    }

    /**
     * 战斗相关类数据
     */
    private _battleUIData: BattleUIData = null;
    get battleUIData() {
        return this._battleUIData;
    }

    /**
     * 关卡数据类
     */
    private _levelMapData: LevelMapData = null;
    get levelMapData() {
        return this._levelMapData;
    }
    /**
     * 登录数据类
     */
    private _loginData: LoginData = null;
    get loginData() {
        return this._loginData;
    }
    /**
     * 用户数据类
     */
    private _userData: UserData = null;
    get userData() {
        return this._userData;
    }
    /**
     * 背包数据类
     */
    private _bagData: BagData = null;
    get bagData() {
        return this._bagData;
    }

    private _heroData: HeroData = null;
    get heroData() {
        return this._heroData;
    }
    /**
     * 头像数据类
     */
    private _headData: HeadData = null;
    get HeadData() {
        return this._headData;
    }
}

export let modelManager = ModelManager.getInstance();