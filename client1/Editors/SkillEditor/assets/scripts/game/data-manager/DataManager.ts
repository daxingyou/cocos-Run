import BattleData from "./BattleData";

class DataManager {
    private static _instance: DataManager = null;

    public static getInstance(): DataManager {
        if (!this._instance) {
            this._instance = new DataManager();
        }
        return this._instance;
    }

    public static destroy(): void {
        if (this._instance) {
            this._instance = null;
        }
    }

    // properties
    battleData: BattleData = null;

    private constructor() {
        this.battleData = new BattleData();
    }

    public init() {
        this.battleData.init();
    }

}

export let dataManager = DataManager.getInstance();