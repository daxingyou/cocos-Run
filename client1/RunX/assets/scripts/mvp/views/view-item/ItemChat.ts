import RichTextEx from "../../../common/components/rich-text/RichTextEx";
import { gamesvr } from "../../../network/lib/protocol";
import { CHAT_CHANNEL } from "../../models/ChatData";

const { ccclass, property } = cc._decorator;
@ccclass export default class ItemChat extends cc.Component {

    init(item: cc.Node, msg: gamesvr.IChatMessageNotify){
        let bg: cc.Node = item.getChildByName('main_bg');
        let title: cc.Node = bg.getChildByName('title');
        let msgNode: cc.Node = item.getChildByName('msgLayout');

        let titleLabel: cc.Label = title.getComponent(cc.Label);
        let msgLayout: cc.Layout = msgNode.getComponent(cc.Layout);
        let msgLable: any = msgNode.getComponentInChildren(cc.RichText);

        let minH: number = 35;
        let offsetY: number = 5;
        let h: number = 0;
        titleLabel.string =
            msg.Type == CHAT_CHANNEL.WORLD ? "世界" :
                msg.Type == CHAT_CHANNEL.SYSTEM ? "系统" : "公会";
        msgLable.string = msg.Type != CHAT_CHANNEL.SYSTEM ?
            `<color = #B88C5B>${msg.UserInfo.Name}: </c>${msg.Message}` : `${msg.Message}`;
        // tips: cc.Label刷新默认会在下一帧执行，因此需要强制更新
        // msgLable._forceUpdateRenderMsg();
        msgLayout.updateLayout();
        h = msgLayout.node.height + offsetY;
        item.height = h < minH ? minH : h;
    }

    deinit(){

    }
}