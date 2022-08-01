
import { cfg } from "../../../../config/config";

const {ccclass, property} = cc._decorator;

@ccclass
export default class ItemStrategyMoneyItem extends cc.Component {
    @property(cc.Label) title: cc.Label = null;
    @property(cc.Sprite) icon: cc.Sprite = null;
    @property(cc.Node) checkMark: cc.Node = null;

    private _cfg: cfg.StrategyMoney = null;
    private _clickHandler: Function = null;

    init(cfg: cfg.StrategyMoney, clickHandler?: Function) {
        this._cfg = cfg;
        this._clickHandler = clickHandler;
    }

    deInit() {
        this._clickHandler = null;
        this._cfg = null;
    }

    onClick() {
        this._clickHandler && this._clickHandler(this, this._cfg.StrategyMoneyId);
    }
}
