import BattleOpt from "./BattleOpt";

export default class DataOperation {
    private static _instance: DataOperation = null;

    public static getInstance(): DataOperation {
        if (!this._instance) {
            this._instance = new DataOperation();
        }
        return this._instance;
    }

    public static destroy(): void {
        if (this._instance) {
            this._instance = null;
        }
    }
    
    // properties
    battleOpt: BattleOpt = null;

    private constructor() {
        this.battleOpt = new BattleOpt();
    }

    public init() {
        this.battleOpt.init();
    }
}

export let dataOptManager = DataOperation.getInstance();
