import RichTextEx from "../../../common/components/rich-text/RichTextEx";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { logger } from "../../../common/log/Logger";
import { svrConfig } from "../../../network/SvrConfig";
import { userData } from "../../models/UserData";


const {ccclass, property} = cc._decorator

const MAX_LOGS = 255;

@ccclass
export default class ConsoleView extends ViewBaseComponent {
    @property(cc.Node) nodeItem: cc.Node = null;
    @property(cc.Node) content: cc.Node = null;
    @property(cc.Label) lbBase: cc.Label = null;

    private _nowSeq = 0;
    private _items: cc.Node[] = [];

    private _logs: any[] = [];
    
    onInit() {
        this.nodeItem.active = false;
        this.lbBase.string = `服务器：${svrConfig.worldsvr}, 玩家ID： ${userData.accountData.UserID}`
        this._prepareLogs();
    }

    onRelease () {
    }

    private _prepareLogs () {
        const logs = [...logger.getCacheWithFormat()];
        if (logs.length == 0) {
            return;
        }

        const cacheMaxKey = logs[logs.length - 1].key;
        
        let nowKey = this._nowSeq;
        if (this._logs.length > 0) {
            nowKey = this._logs[this._logs.length - 1].key;
        }

        if (cacheMaxKey > nowKey) {
            let idx = -1;
            if (this._nowSeq <= logs[0].key) {
                idx = 0;
            } else {
                for (let i = logs.length - 1; i >= 0; i--) {
                    if (logs[i].key <= this._nowSeq) {
                        idx = i;
                        break;
                    }
                }
            }

            if (idx >= 0) {
                logs.splice(0, idx);
                this._logs = this._logs.concat(logs);
            }
        }
    }

    private _addOneItem (info: any) {
        let node = cc.instantiate(this.nodeItem);
        node.getComponent(RichTextEx).string = info.info;
        node.active = true;
        this.content.addChild(node);
        this._nowSeq = Math.max(info.key, this._nowSeq);
        this._items.push(node);

        if (this._items.length > MAX_LOGS) {
            const remove = this._items.shift();
            remove.destroy();
        }
    }

    update () {
        if (this._logs.length > 0) {
            const info = this._logs.shift();
            this._addOneItem(info);
        }
    }
}