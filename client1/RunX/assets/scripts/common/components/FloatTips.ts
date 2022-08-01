import ItemTips from "./ItemTips";

const {ccclass, property} = cc._decorator;

const SHOW_INTERVAL = 0.4;

@ccclass
export default class FloatTips extends cc.Component {

    @property(cc.Node) nodeItem: cc.Node = null;
    @property(cc.Float) interval: number = 0.4;
    @property(cc.Boolean) taskShow: boolean = false;

    private _contentList: string[] = [];
    private _lastShowTime = 0;
    private _taskShow = false;

    onLoad () {
        this.nodeItem.active = false;
    };

    show (content: string) {
        this._contentList.push(content);
    }

    hideAll(){
        this._contentList.splice(0);
        this.node.removeAllChildren();
    }

    update () {
        this._checkShow();
    }

    private _checkShow () {
        if (this._contentList.length == 0) {
            return;
        }
        
        const delt = (Date.now() - this._lastShowTime)/1000;
        if (delt >= this.interval) {
            let node = cc.instantiate(this.nodeItem);
            this.node.addChild(node);
            let itemTips = node.getComponent(ItemTips);
            if (this.taskShow){
                itemTips.showTask(this._contentList.shift());
            } else
                itemTips.show(this._contentList.shift());
            this._lastShowTime = Date.now();
        }
    }
}