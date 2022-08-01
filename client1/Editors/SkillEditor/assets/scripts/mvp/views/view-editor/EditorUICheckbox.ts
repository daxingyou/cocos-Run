
const {ccclass, property} = cc._decorator;

@ccclass
export default class EditorUICheckbox extends cc.Component {
    @property(cc.Label)
    labelTitle: cc.Label = null;

    @property(cc.Button)
    button: cc.Button = null;

    @property(cc.Node)
    nodeSelect: cc.Node = null;

    private _data: any = null;
    private _handler: Function = null;

    init (_data: any, clickHandler: Function, initState: boolean = false) {
        this._data = _data;
        this._handler = clickHandler;

        this.select = initState;
        if (this._handler) {
            this._handler(this._data, initState);
        }    
    }

    get select (): boolean {
        return this.nodeSelect.active;
    }

    set select (v: boolean) {
        this.nodeSelect.active = v;
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