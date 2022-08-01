import { NoticeContent } from "../../models/LoginData";

const { ccclass, property } = cc._decorator;

const TOP_OFFSET = 5;
const TITLE_HEIGHT = 41;

@ccclass
export default class NoticeContentItem extends cc.Component {
    @property(cc.Label)         titleLb: cc.Label = null;
    @property(cc.Label)         contentLb: cc.Label = null;

    private _contentData: NoticeContent = null;

    setData(contentData: NoticeContent) {
        this._contentData = contentData;
        this.refreshView()
    }

    refreshView() {
        // if (this._contentData.title) {
        //     this.titleLb.string = `${this._contentData.title}`;
        //     this.titleLb.node.active = true;
        // } else {
        //     this.titleLb.node.active = false;
        // }
        this.titleLb.node.active = false;
        
        this.contentLb.string = `${this._contentData.content}`;
        this.contentLb.node.y = this.titleLb.node.active? -46:0
        // @ts-ignore
        this.contentLb._forceUpdateRenderData();
    }

    getHeight () {
        let totalHeight = TOP_OFFSET;
        if (this.titleLb.node.active) {
            totalHeight += TITLE_HEIGHT;
        }

        totalHeight += this.contentLb.node.height
        return totalHeight;
    }
}
