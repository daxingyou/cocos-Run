

const {ccclass, property} = cc._decorator;

@ccclass
export default class ItemStrategyDesc extends cc.Component {

    @property(cc.Label) label: cc.Label = null;
    @property(cc.Node) star: cc.Node = null;

    private _lbOriW: number = 0;

    init(desc: string, customWidth?: number) {
        this._lbOriW = this._lbOriW || this.label.node.width;
        customWidth && (this.label.node.width = customWidth);
        this.label.string = desc || '';
        this.label._forceUpdateRenderData();
    }

    deInit() {
        this.label.node.width =  this._lbOriW;
    }

    get itemHeight() {
        return Math.max(this.label.node.height, this.star.height);
    }
}
