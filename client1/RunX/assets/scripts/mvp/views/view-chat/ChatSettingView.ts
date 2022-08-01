/*
 * @Author: xuyang
 * @Date: 2021-05-25 17:02:16
 * @Description: 聊天设置界面
 */
import List from "../../../common/components/List";
import guiManager from "../../../common/GUIManager";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { CustomDialogId, RES_ICON_PRE_URL, VIEW_NAME } from "../../../app/AppConst";
import { chatData } from "../../models/ChatData";
import { cfg } from "../../../config/config";
import ItemBubble from "./ItemBubble";

const { ccclass, property } = cc._decorator;
@ccclass
export default class ChatSettingView extends ViewBaseComponent {
    @property(cc.Node) bubbleRoot: cc.Node = null;
    @property(cc.Prefab) bubble: cc.Prefab = null;

    private _selected: cfg.ChatBubble = null;
    private _spriteLoader: SpriteLoader = new SpriteLoader();

    onInit() {
        this.refreshChatView();
    }

    onRelease() {
        this._spriteLoader.release();
        this.releaseSubView();
        this.bubbleRoot.children.forEach( _cNode => {
            let comp = _cNode.getComponent(ItemBubble)
            comp && comp.deInit();
        })
        this.bubbleRoot.removeAllChildren();
    }

    refreshChatView() {
        this.bubbleRoot.removeAllChildren();
        let allBubbles = chatData.getBubbleCfg();
        let bubbleID = chatData.bubbleID;
        this._selected = this._getBubbleCfg(allBubbles, bubbleID);

        allBubbles.forEach( (_cfg, _idx) => {
            let bubble = cc.instantiate(this.bubble);
            this.bubbleRoot.addChild(bubble);
            let comp = bubble.getComponent(ItemBubble)
            comp.init(_cfg, this._onSelect.bind(this));
            comp.setSelect(_cfg.ChatBubbleId == bubbleID)
        })
    }

    private _onSelect (cfg: cfg.ChatBubble) {
        this._selected = cfg;
        this.bubbleRoot.children.forEach( _cNode => {
            let comp = _cNode.getComponent(ItemBubble)
            comp && comp.setSelect(cfg.ChatBubbleId == comp.bubbleID);
        })
    }
    //确认使用气泡
    onClickConfirm() {
        if (!this._selected) return;

        let selectID = this._selected.ChatBubbleId
        chatData.bubbleID = selectID
        guiManager.showDialogTips(CustomDialogId.CHAT_SET_BUBBLE);
    }
    //查看黑名单
    onClickBlackList() {
        this.loadSubView(VIEW_NAME.BLACK_LIST_VIEW);
    }

    private _getBubbleCfg(allCfgs: cfg.ChatBubble[], bID: number) {
        if (!allCfgs || !bID) {
            return null
        }
        for (let i = 0; i < allCfgs.length; i++) {
            if (allCfgs[i].ChatBubbleId == bID) {
                return allCfgs[i];
            }
        }
        return null;
    }
}
