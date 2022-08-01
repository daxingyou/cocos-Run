
import { cfg } from "../../../../config/config";
const {ccclass, property} = cc._decorator;

@ccclass
export default class ItemStrategyFAQ extends cc.Component {
    @property(cc.Node) rootNode: cc.Node = null;
    @property(cc.Label) questionLb: cc.Label = null;
    @property(cc.Label) answerLb: cc.Label = null;
    @property(cc.Button) btnDetail: cc.Button = null;
    @property(cc.Node) descContainor: cc.Node = null;

    private _cfg:cfg.StrategyFAQ = null;
    private _clickHandler: Function = null;
    private _isOpen: boolean = false;

    init(cfg: cfg.StrategyFAQ, isOpen: boolean, clickHandler: Function) {
        this._cfg = cfg;
        this._isOpen = isOpen;
        this._clickHandler = clickHandler;
        this._initUI();
    }

    deInit() {
        this._cfg = null;
        this._clickHandler = null;
    }

    private _initUI() {
        this.questionLb.string = this._cfg.StartegyFAQAsk || '';
        this.answerLb.string = this._cfg.StartegyFAQAnswer || '';
        this._updateItemSize(true);
    }

    onClickDetail() {
        this._clickHandler && this._clickHandler(this._cfg, this);
    }

    updateOpenState(isOpen: boolean): cc.Size {
        if(isOpen == this._isOpen) return null;
        this._isOpen = isOpen;
        return this._updateItemSize();
    }

    private _updateItemSize(isUpdateSize: boolean = false): cc.Size {
        let height = 0;
        if(this._isOpen){
            this.descContainor.active = true;
            //@ts-ignore
            this.answerLb._forceUpdateRenderData();
            let descContainorHeight = this.answerLb.node.height + 30;
            this.descContainor.height = descContainorHeight;
            height = this.rootNode.height + descContainorHeight - 10;
            isUpdateSize && (this.node.height = height);
        } else {
            this.descContainor.active = false;
            height = this.rootNode.height;
            isUpdateSize && (this.node.height = height);
        }

        return cc.size(this.node.width, height);
    }
 }
