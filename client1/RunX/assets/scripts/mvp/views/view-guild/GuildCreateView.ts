import { CustomDialogId, VIEW_NAME } from "../../../app/AppConst";
import { configUtils } from "../../../app/ConfigUtils";
import { resPathUtils } from "../../../app/ResPathUrlUtils";
import RichTextEx from "../../../common/components/rich-text/RichTextEx";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { eventCenter } from "../../../common/event/EventCenter";
import { bagDataEvent, guildEvent } from "../../../common/event/EventData";
import guiManager from "../../../common/GUIManager";
import { logger } from "../../../common/log/Logger";
import moduleUIManager from "../../../common/ModuleUIManager";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { data } from "../../../network/lib/protocol";
import { bagData } from "../../models/BagData";
import { guildOpt } from "../../operations/GuildOpt";

const {ccclass, property} = cc._decorator;

@ccclass
export default class GuildCreateView extends ViewBaseComponent {
    @property(cc.EditBox) nameEditBox: cc.EditBox = null;
    @property(RichTextEx) costRichText: RichTextEx = null;
    @property(cc.Sprite) costItemSp: cc.Sprite = null;

    private _spriteLoader: SpriteLoader = new SpriteLoader();
    private _loadSubView: Function = null;
    onInit(loadSubView?: Function) {
        loadSubView && (this._loadSubView = loadSubView);
        this.doInit();
        this._refreshCostView();
    }

    doInit() {
        eventCenter.register(bagDataEvent.ITEM_CHANGE, this, this._refreshCostView);
        eventCenter.register(guildEvent.UPDATE_GUILD_INFO, this, this.closeView);
        eventCenter.register(guildEvent.CREATE_GUILD, this, this.closeView);
    }

    onRelease() {
        eventCenter.unregisterAll(this);
        this._spriteLoader.release();
    }

    private _refreshCostView() {
        let createNeedItem = configUtils.getConfigModule('GuildBuildItem');
        if(createNeedItem) {
            let count = bagData.getItemCountByID(createNeedItem);
            let colorStr = count > 0 ? '<color=#73382D>' : '<color=#ff0000>';
            this.costRichText.string = `${colorStr}${count}</color><color=#73382D>/1</color>`;
            let url = resPathUtils.getItemIconPath(createNeedItem);
            this._spriteLoader.changeSpriteP(this.costItemSp, url);
        } else {
            logger.warn('暂未配置创建公会消耗品，请检查配置');
        }
    }

    onClickCast () {
        let createNeedItem = configUtils.getConfigModule('GuildBuildItem');
        if(createNeedItem) {
            moduleUIManager.showItemDetailInfo(createNeedItem, 1, this.node);
        }
    }

    onClickCreate() {
        let createNeedItem = configUtils.getConfigModule('GuildBuildItem');
        if(createNeedItem) {
            let count = bagData.getItemCountByID(createNeedItem);
            if(count > 0) {
                if (this.nameEditBox.string == '') {
                    guiManager.showDialogTips(CustomDialogId.GUILD_INPUT_NAME);
                    return;
                }
                if(!this._checkName(this.nameEditBox.string)) {
                    guiManager.showDialogTips(CustomDialogId.GUILD_INPUT_INVALID);
                    return;
                }
                guildOpt.sendCreateGuild(this.nameEditBox.string);
            } else {
                guiManager.showDialogTips(CustomDialogId.GTE_HP_ITEM_NO_ENOUGH);
                let newItem: data.IBagUnit = {
                    ID: createNeedItem
                }
                moduleUIManager.showItemDetailInfo(createNeedItem, 1, this.node);
            }
        } else {
            guiManager.showTips('暂未配置创建公会消耗品，请检查配置');
        }
    }

    private _checkName(str: string): boolean {
        return str.indexOf(' ') == -1;
    }
}
