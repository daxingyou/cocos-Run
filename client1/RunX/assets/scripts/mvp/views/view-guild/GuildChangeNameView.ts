import { CustomDialogId, VIEW_NAME } from "../../../app/AppConst";
import { configUtils } from "../../../app/ConfigUtils";
import { resPathUtils } from "../../../app/ResPathUrlUtils";
import RichTextEx from "../../../common/components/rich-text/RichTextEx";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { eventCenter } from "../../../common/event/EventCenter";
import { bagDataEvent, guildEvent } from "../../../common/event/EventData";
import guiManager from "../../../common/GUIManager";
import { logger } from "../../../common/log/Logger";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { data } from "../../../network/lib/protocol";
import { bagData } from "../../models/BagData";
import { guildData } from "../../models/GuildData";
import { guildOpt } from "../../operations/GuildOpt";

const {ccclass, property} = cc._decorator;

@ccclass
export default class GuildChangeNameView extends ViewBaseComponent {
    @property(cc.EditBox) nameEditBox: cc.EditBox = null;
    @property(RichTextEx) costRichText: RichTextEx = null;
    @property(cc.Sprite) costItemSp: cc.Sprite = null;

    private _spriteLoader: SpriteLoader = new SpriteLoader();
    private _loadSubView: Function = null;
    onInit(loadSubView?: Function) {
        loadSubView && (this._loadSubView = loadSubView);
        this.doInit();
        this.nameEditBox.string = guildData.guildInfo.Account.Name;
        this._refreshCostView();
    }

    doInit() {
        eventCenter.register(bagDataEvent.ITEM_CHANGE, this, this._refreshCostView);
        eventCenter.register(guildEvent.CHANGE_NAME, this, this.closeView);
    }

    onRelease() {
        eventCenter.unregisterAll(this);
        this._spriteLoader.release();
    }

    private _refreshCostView() {
        let changeNeedItem = configUtils.getConfigModule('GuildRenameItem');
        if(changeNeedItem) {
            let count = bagData.getItemCountByID(changeNeedItem);
            let colorStr = count > 0 ? '<color=#73382D>' : '<color=#ff0000>';
            this.costRichText.string = `${colorStr}${count}</color><color=#73382D>/1</color>`;
            let url = resPathUtils.getItemIconPath(changeNeedItem);
            this._spriteLoader.changeSpriteP(this.costItemSp, url);
        } else {
            logger.warn('暂未配置创建公会消耗品，请检查配置');
        }
    }

    onClickCast () {
        let changeNeedItem = configUtils.getConfigModule('GuildRenameItem');
        let newItem: data.IBagUnit = {
            ID: changeNeedItem,
            Count: 1,
            Seq: 0
        }
        this._loadSubView(VIEW_NAME.TIPS_ITEM, newItem);
    }

    onClickChange() {
        let changeNeedItem = configUtils.getConfigModule('GuildRenameItem');
        if(changeNeedItem) {
            let count = bagData.getItemCountByID(changeNeedItem);
            if(count > 0) {
                if(this.nameEditBox.string == '') {
                    guiManager.showDialogTips(CustomDialogId.GUILD_INPUT_NAME);
                    return;
                }
                if(!this._checkName(this.nameEditBox.string)) {
                    guiManager.showDialogTips(CustomDialogId.GUILD_INPUT_INVALID);
                    return;
                }
                guildOpt.sendChangeName(this.nameEditBox.string);
            } else {
                guiManager.showDialogTips(CustomDialogId.GUILD_CHANGENAME_ITEM_NOTENOUGH);
                let newItem: data.IBagUnit = {
                    ID: changeNeedItem
                }
                this._loadSubView(VIEW_NAME.TIPS_ITEM, newItem);
            }
        } else {
            guiManager.showTips('暂未配置创建公会消耗品，请检查配置');
        }
    }

    private _checkName(str: string): boolean {
        return str.indexOf(' ') == -1 && str.length <= 7 && str != guildData.guildInfo.Account.Name;
    }
}
