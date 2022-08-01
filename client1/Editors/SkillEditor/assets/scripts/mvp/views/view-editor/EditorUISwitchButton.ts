
const {ccclass, property} = cc._decorator;

@ccclass
export default class EditorUISwitchButton extends cc.Component {
    @property(cc.Label)
    labelTitle: cc.Label = null;

    @property(cc.Button)
    button: cc.Button = null;

    @property(cc.Node)
    nodeOpen: cc.Node = null;

    @property(cc.Node)
    nodeClose: cc.Node = null;

    private _data: any = null;
    private _handler: Function = null;

    init (_data: any, clickHandler: Function) {
        this._data = _data;
        this._handler = clickHandler;
        this.select = true;
    }

    get select (): boolean {
        return this.nodeOpen.active;
    }

    set select (v: boolean) {
        this.nodeOpen.active = v;
        this.nodeClose.active = !v;
    }

    onClick () {
        this.select = !this.select;
        if (this._handler) {
            this._handler(this._data, this.select);
        }        
    }

    set title (v: string) {
        if (this.labelTitle) {
            this.labelTitle.string = v;
        }
    }
}