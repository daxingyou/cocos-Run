import ItemTips from "./ItemTips";

const {ccclass, property} = cc._decorator;

const SHOW_INTERVAL = 0.4;

@ccclass
export default class FloatTips extends cc.Component {

    @property(cc.Node)
    nodeItem: cc.Node = null;

    private _contentList: string[] = [];
    private _lastShowTime = 0;

    onLoad () {
        this.nodeItem.active = false;
    };

    show (content: string) {
        this._contentList.push(content);
    }

    update () {
        this._checkShow();
    }

    private _checkShow () {
        if (this._contentList.length == 0) {
            return;
        }
        
        const delt = Date.now() - this._lastShowTime;
        if (delt >= SHOW_INTERVAL) {
            let node = cc.instantiate(this.nodeItem);
            this.node.addChild(node);
            let itemTips = node.getComponent(ItemTips);
            itemTips.show(this._contentList.pop());
            this._lastShowTime = Date.now();
        }
    }
}