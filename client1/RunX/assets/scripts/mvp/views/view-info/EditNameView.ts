import { CustomDialogId } from "../../../app/AppConst";
import { utils } from "../../../app/AppUtils";
import { configUtils } from "../../../app/ConfigUtils";
import { resPathUtils } from "../../../app/ResPathUrlUtils";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { configManager } from "../../../common/ConfigManager";
import { eventCenter } from "../../../common/event/EventCenter";
import { bagDataEvent, useInfoEvent } from "../../../common/event/EventData";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { cfg } from "../../../config/config";
import { gamesvr } from "../../../network/lib/protocol";
import { bagData } from "../../models/BagData";
import { userData } from "../../models/UserData";
import { userOpt } from "../../operations/UserOpt";
import RichTextEx from "../../../common/components/rich-text/RichTextEx";
import guiManager from "../../../common/GUIManager";
import moduleUIManager from "../../../common/ModuleUIManager";
import { hasDirtyWord } from "../../../common/DirtyWord";

const { ccclass, property } = cc._decorator;
const cfgsType1: cfg.RandomName[] = [];
const cfgsType2: cfg.RandomName[] = [];
const cfgsType3: cfg.RandomName[] = [];

@ccclass
export default class EditNameView extends ViewBaseComponent {

    @property(cc.Sprite) priceIcon: cc.Sprite = null;
    @property(RichTextEx) priceTxt: RichTextEx = null;
    @property(cc.Label) descTxt: cc.Label = null;
    @property(cc.Button) changeBtn: cc.Button = null;
    @property(cc.EditBox) inputArea: cc.EditBox = null;

    private _sprLoader: SpriteLoader = new SpriteLoader();
    private _canChangeName: boolean = true;

    onInit() {
        this.prepareData();
        this.showBuyStatus();
        this.registerEvent();
    }

    onRelease(){
        this._sprLoader.release();
        eventCenter.unregisterAll(this);
    }

    registerEvent(){
        eventCenter.register(useInfoEvent.USER_NAME_CHANGE, this, this._recvUsrNameChangeRes);
        eventCenter.register(bagDataEvent.ITEM_CHANGE, this, this.showBuyStatus);
    }

    showBuyStatus(){
        let changeCnt = userData.accountData.ChangeNameCounter;
        if (!changeCnt){
            this.descTxt.string = "首次免费";
            this.priceIcon.node.active = false;
            this.priceTxt.node.active = false;
        } else {
            let moduleCfg = configUtils.getModuleConfigs();
            let itemId = moduleCfg.ReNameCost;
            let holdCnt = bagData.getItemCountByID(itemId) || 0;
            let path = resPathUtils.getItemIconPath(itemId);

            this.priceIcon.node.active = true;
            this.priceTxt.node.active = true;
            this.descTxt.string = "确定修改";
            this.priceTxt.string = `<color=${holdCnt ? "#8a5e28" : "#ff0000"}>${holdCnt}</c>/${1}`;
            this._canChangeName = !!holdCnt;
            path && this._sprLoader.changeSprite(this.priceIcon, path);
        }
    }

    prepareData(){
        let nameCfgs: cfg.RandomName[] = configManager.getConfigList("randomName");
        cfgsType1.splice(0);
        cfgsType2.splice(0);
        cfgsType3.splice(0);
        nameCfgs.forEach(cfg=>{
            cfg.RandomNameType == 1 && cfgsType1.push(cfg);
            cfg.RandomNameType == 2 && cfgsType2.push(cfg);
            cfg.RandomNameType == 3 && cfgsType3.push(cfg);
        })
        this.inputArea.string = userData.accountData.Name;
    }

    onClickChangeName(event: cc.Event, customEventData: number) {
        if (this._canChangeName){
            let name = this.inputArea.string;
            if (hasDirtyWord(name)) {
                guiManager.showTips("文本含有敏感词汇，改名失败。");
                return;
            }
            if (!!name)
                userOpt.reqChangeName(name);
        } else {
            guiManager.showTips("改名卡不足");
        }
    }

    onEditCallBack(target: cc.EditBox){
        if (target && target.string == userData.accountData.Name){
            this.changeBtn.interactable = false;
        } else {
            this.changeBtn.interactable = true;
        }
    }
    /**
     * @description 生成随机昵称
     */
    onClickGenRandom() {
        this.inputArea.string = this._genRandomName();
        this.changeBtn.interactable = true;
    }
    
    onClickTicketItem() {
        let moduleCfg = configUtils.getModuleConfigs();
        let itemId = moduleCfg.ReNameCost;
        itemId && moduleUIManager.showItemDetailInfo(itemId, 0, this.node);
    }
    
    private _genRandomName(): string{
        let name = "";
        cfgsType1.length && (name += utils.getRandomInArray(cfgsType1).RandomNameText);
        cfgsType2.length && (name += utils.getRandomInArray(cfgsType2).RandomNameText);
        cfgsType3.length && (name += utils.getRandomInArray(cfgsType3).RandomNameText);
        if (name == this.inputArea.string || name == userData.accountData.Name){
            return this._genRandomName();
        }
        return name;
    }

    private _recvUsrNameChangeRes(cmd: any, recvMsg: { Result: number, Desc: string, Msg: gamesvr.ChangeNameRes }) {
        if (recvMsg && !recvMsg.Result) {
            guiManager.showDialogTips(CustomDialogId.INFO_CHANGE_NAME);
            this.closeView();
        } else if (recvMsg && recvMsg.Result && recvMsg.Desc) {
            guiManager.showTips(recvMsg.Desc);
        }
    }


}
