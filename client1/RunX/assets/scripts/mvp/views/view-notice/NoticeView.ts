import { appCfg } from "../../../app/AppConfig";
import List from "../../../common/components/List";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { loginData, NoticeContent, NoticeInfo, NoticeInfos } from "../../models/LoginData";
import NoticeContentItem from "./NoticeContentItem";
import NoticeNameItem from "./NoticeNameItem";

const { ccclass, property } = cc._decorator;

@ccclass
export default class NoticeView extends ViewBaseComponent {
    @property(cc.Node)      noticeNameNode: cc.Node = null;
    @property(List)         leftNoticesList: List = null;
    @property(cc.Prefab)    noticeNamePfb: cc.Prefab = null;
    @property(cc.Node)      noticeContentNode: cc.Node = null;
    @property(cc.Prefab)    noticeContentPfb: cc.Prefab = null;
    @property(cc.Label)     noticeTitle: cc.Label = null;
    @property(cc.Node)      noticePicNode: cc.Node = null;
    @property(cc.ScrollView)      ctxScroll: cc.ScrollView = null;

    private _curSelectNotice: number = 0;

    onInit() {
        this.refreshView();
    }

    onRelease() {
    }

    refreshView() {
        this.refreshNoticeNameView();
        this.refreshNoticeContentView();
    }

    refreshNoticeNameView() {
        const noticeData = loginData.noticeDatas;
        const noticeInfos: NoticeInfos = noticeData.ServerNotices;
        if(noticeInfos) {
            this.leftNoticesList.numItems = noticeInfos.notices.length;
            this.leftNoticesList.selectedId = 0;
        }
    }

    onLeftNoticeNameRender(item: cc.Node, index: number) {
        const noticeData = loginData.noticeDatas;
        const noticeInfos: NoticeInfos = noticeData.ServerNotices;
        const noticeInfo: NoticeInfo = noticeInfos.notices[index];
        let noticeNameCmp = item.getComponent(NoticeNameItem);
        noticeNameCmp.setData(noticeInfo)
    }

    onLeftNoticeNameClick(item: cc.Node, index: number, lastIndex: number) {
        this._curSelectNotice = index;
        this.refreshNoticeContentView();
    }

    refreshNoticeContentView() {
        let currNotice: NoticeInfo = loginData.noticeDatas.ServerNotices.notices[this._curSelectNotice]
        if (currNotice) {
            this.noticeTitle.string = currNotice.noticeList.title;

            this.noticePicNode.active = false
            let heightTotal = 10;
            if (currNotice.picture) {
                let url = appCfg.remoteResUrl + currNotice.picture
                cc.assetManager.loadRemote(url, (err, texture) => {
                    if (!err) {
                        this.noticePicNode.active = true
                        let texture2D = <cc.Texture2D>texture
                        let sprite = this.noticePicNode.getComponent(cc.Sprite)
                        let spriteFrame = new cc.SpriteFrame(texture2D, new cc.Rect(0, 0, texture2D.width, texture2D.height))
                        sprite.spriteFrame = spriteFrame
                        this.noticePicNode.y = -texture2D.height/2 - 10
                        heightTotal += texture2D.height + 20;
                    }
                    this._updateContent(heightTotal, currNotice)
                });
            } else {
                this._updateContent(heightTotal, currNotice)
            }
        }
    }

    private _updateContent (picHeight: number, currNotice: NoticeInfo) {
        let content = this.noticeContentNode.children[1];
        if (!content) {
            content = cc.instantiate(this.noticeContentPfb);
            this.noticeContentNode.addChild(content);
        }

        let ctxItem = content.getComponent(NoticeContentItem);
        ctxItem.setData(currNotice.noticeList);
        let ctxHeight = ctxItem.getHeight();
        content.y = -picHeight;
        content.active = true;

        this.noticeContentNode.height = picHeight + ctxHeight;
        this.ctxScroll.scrollToTop(0)
    }

}
