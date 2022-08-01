/*
 * @Author: xuyang
 * @Date: 2021-05-25 17:02:16
 * @Description: 黑名单详情页
 */
import List from "../../../common/components/List";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { data } from "../../../network/lib/protocol";
import { eventCenter } from "../../../common/event/EventCenter";
import { chatEvent } from "../../../common/event/EventData";
import { chatOpt } from "../../operations/ChatOpt";
import { CustomDialogId } from "../../../app/AppConst";
import { friendData } from "../../models/FriendData";
import guiManager from "../../../common/GUIManager";
import ItemBlackList from "./ItemBlackList";

enum PAGE_TYPE { WORLD, GUILD, SYSTEM };

const { ccclass, property } = cc._decorator;
@ccclass
export default class BlackListView extends ViewBaseComponent {

    @property(List) blackList: List = null;

    private _blackList: data.IOtherData[] = [];
    private _spriteLoader: SpriteLoader = new SpriteLoader();


    onInit() {
        this.refreshListView();
        this.registerEvent();
    }

    onRelease() {
        eventCenter.unregisterAll(this);
        this.blackList._deInit();
        this._spriteLoader.release();
    }

    registerEvent() {
        eventCenter.register(chatEvent.ADD_BLOCK, this, this._addBlockSuccess);
        eventCenter.register(chatEvent.RMV_BLOCK, this, this._removeBlockSuccess);
    }

    refreshListView() {
        this._blackList = friendData.friendData.BlockedList;
        this.blackList.numItems = this._blackList.length;
    }

    onBlackListRender(itemNode: cc.Node, idx: number) {
        let cfg = this._blackList[idx];
        let comp = itemNode.getComponent(ItemBlackList);
        if (!comp) return;

        comp.init(cfg, (userID: string)=> {
            chatOpt.sendRmvBlockReq(userID);
        })
    }

    private _addBlockSuccess(){
        guiManager.showDialogTips(CustomDialogId.CHAT_ADD_BLOCK);
        this.refreshListView();
    }

    private _removeBlockSuccess() {
        guiManager.showDialogTips(CustomDialogId.CHAT_REMOVE_BLOCK);
        this.refreshListView();
    }

}
