import List from "../../../common/components/List";

const {ccclass, property} = cc._decorator;

@ccclass
export default class Menu extends cc.Component {
    @property(List) list: List = null;
    @property(cc.Node) block: cc.Node = null;
    @property(cc.Label) curSelectLb: cc.Label = null;
    @property(cc.Node) stateIcon: cc.Node = null;

    private _datas: number[] = [];
    private _isOpen: boolean = false;
    private _curSelectIndex: number = -1;
    private _selectCb: Function = null;
    onInit() {

    }

    deInit() {
        this.list._deInit();
    }

    start() {
        this.block.active = false;
        this.list.node.active = false;
    }

    setData(datas: number[], selectCb?: Function) {
        this._datas = datas;
        selectCb && (this._selectCb = selectCb);
    }

    setCurSelect(index: number) {
        this._curSelectIndex = index;
        let str = this._datas[index].toString();
        this.curSelectLb.string = str;
        this._closeList();
        this._showBlock(false);
    }

    onRenderEvent(item: cc.Node, index: number) {
        let str = this._datas[index].toString();
        let label = item.getChildByName('label').getComponent(cc.Label);
        label.string = str;
    }

    onSelectEvent(item: cc.Node, index: number, lastIndex: number) {
        if(this._selectCb) {
            this._selectCb(index);
        }
    }

    private _openList() {
        this.list.node.active = true;
        if(!this.list.numItems || this.list.numItems <= 0) {
            this.list.numItems = this._datas.length;
        }
        this._refreshStateIcon();
    }

    private _closeList() {
        this._isOpen = false;
        this.list.node.active = false;
        this._refreshStateIcon();
    }

    private _refreshStateIcon() {
        let rotation = this._isOpen ? 180 : 0;
        this.stateIcon.angle = rotation;
    }

    onClickMenu() {
        this._isOpen = !this._isOpen;
        if(this._isOpen) {
            this._openList();
            this._showBlock(true);
        } else {
            this._showBlock(false);
            this._closeList();
        }
    }

    onClickBlock() {
        this._isOpen = false;
        this._closeList();
        this._showBlock(false);
        this._refreshStateIcon();
    }

    private _showBlock(isShow: boolean) {
        if(this.block.active != isShow) {
            this.block.active = isShow;
        }
    }
}
