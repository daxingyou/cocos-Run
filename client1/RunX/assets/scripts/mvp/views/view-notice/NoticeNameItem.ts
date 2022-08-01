import { NoticeInfo } from "../../models/LoginData";

const { ccclass, property } = cc._decorator;

@ccclass
export default class NoticeNameItem extends cc.Component {
    @property(cc.Label)             noticeNameLb: cc.Label = null;
    @property(cc.Node)              selectBg: cc.Node = null;

    private _noticeInfo: NoticeInfo = null;
    onLoad() {
    }

    setData(noticeInfo: NoticeInfo) {
        this._noticeInfo = noticeInfo;
        this.refreshView()
    }

    refreshView() {
        this.noticeNameLb.string = `${this._noticeInfo.name}`;
    }
}
