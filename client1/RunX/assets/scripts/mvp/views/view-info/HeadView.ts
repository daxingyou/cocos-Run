/*
 * @Author: your name
 * @Date: 2021-05-18 22:11:27
 * @LastEditTime: 2021-06-03 09:28:30
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: \RunX\assets\scripts\mvp\views\view-info\HeadView.ts
 */
import guiManager from "../../../common/GUIManager";
import List from "../../../common/components/List";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { eventCenter } from "../../../common/event/EventCenter";
import { useInfoEvent } from "../../../common/event/EventData";
import { configUtils } from "../../../app/ConfigUtils";
import { userOpt } from "../../operations/UserOpt";
import { HEAD_TYPE } from "../../../app/AppEnums";
import { userData } from "../../models/UserData";
import { cfg } from "../../../config/config";
import { bagData } from "../../models/BagData";
import { utils } from "../../../app/AppUtils";
import { data } from "../../../network/lib/protocol";
import { CustomDialogId, RES_ICON_PRE_URL } from "../../../app/AppConst";
import ItemRedDot from "../view-item/ItemRedDot";
import { redDotMgr, RED_DOT_DATA_TYPE, RED_DOT_MODULE, RED_DOT_TYPE } from "../../../common/RedDotManager";
import { bagDataUtils } from "../../../app/BagDataUtils";

const { ccclass, property } = cc._decorator;

const HEAD_TAG = 0;
const HRAD_FRAME_TAG = 1;

@ccclass
export default class HeadView extends ViewBaseComponent {

    @property(List) mainList: List = null;
    @property(cc.Node) headNode: cc.Node = null;
    @property(cc.Node) frameNode: cc.Node = null;
    @property(cc.Label) headDescript: cc.Label = null;
    @property(cc.Label) headName: cc.Label = null;
    @property(cc.Node) confirmButton: cc.Node = null;
    @property(cc.Node) usingNode: cc.Node = null;
    @property(cc.Label) lockTxt: cc.Label = null;
    @property(ItemRedDot) headFTogRedDot: ItemRedDot = null;
    @property(ItemRedDot) headTogRedot: ItemRedDot = null;

    private _spriteLoader: SpriteLoader = null;
    private _headCfg: cfg.HeadFrame[] = [];
    private _frameCfg: cfg.HeadFrame[] = [];
    private _selMode: number = -1;
    private _lastSelHId: number = -1;
    private _lastSelFId: number = -1;

    onInit() {
        this._genCfg();
        this._refreshUserInfo();
        this.onBtnHeadClick();
        this.registerAllEvent();
        this.refreshRedDot();
    }

    /**
     * 拉取config配置到本地数据
     */
    private _genCfg() {
        this._headCfg = bagDataUtils.getValidHeadsByType(HEAD_TYPE.HEAD);
        this._frameCfg = bagDataUtils.getValidHeadsByType(HEAD_TYPE.FRAME);
    }

    /**
     * 按照配置ID获取其在配置表中索引值
     * @param hID 配置ID
     * @returns
     */
    getHeadIndex(hID: number) {
        for (let index = 0; index < this._headCfg.length; index++) {
            const ele = this._headCfg[index];
            if (ele.HeadFrameId == hID) {
                return index;
            }
        }
        return -1;
    }
    /**
     * 按照配置ID获取其在配置表中索引值
     * @param hID 配置ID
     * @returns 
     */
    getFrameIndex(hID: number) {
        for (let index = 0; index < this._frameCfg.length; index++) {
            const ele = this._frameCfg[index];
            if (ele.HeadFrameId == hID) {
                return index;
            }
        }
        return -1;
    }

    registerAllEvent() {
        eventCenter.register(useInfoEvent.USER_HEAD_CHANGE, this, this._onHeadChange);
        eventCenter.register(useInfoEvent.USER_NAME_CHANGE, this, this._refreshUserInfo);
    }

    private _onHeadChange() {
        this._refreshUserInfo();
        if (this._selMode == HEAD_TAG) {
            this.mainList.numItems = this._headCfg.length;
            this.mainList.selectedId = this._lastSelHId;
        }
        else if (this._selMode == HRAD_FRAME_TAG) {
            this.mainList.numItems = this._frameCfg.length;
            this.mainList.selectedId = this._lastSelFId;
        }
    }

    private _refreshUserInfo() {
        let uInfo = userData.accountData;
        let hConfig: cfg.HeadFrame = configUtils.getHeadConfig(uInfo.HeadID);
        let fConfig: cfg.HeadFrame = configUtils.getHeadConfig(uInfo.HeadFrameID);
        this._loadSprInNode(`${RES_ICON_PRE_URL.HEAD_IMG}/${hConfig.HeadFrameImage}`, this.headNode);
        this._loadSprInNode(`${RES_ICON_PRE_URL.HEAD_FRAME}/${fConfig.HeadFrameImage}`, this.frameNode);
        //设置当前使用头像
        this._lastSelHId = this.getHeadIndex(uInfo.HeadID);
        this._lastSelFId = this.getFrameIndex(uInfo.HeadFrameID);
    }

    refreshRedDot() {
        this.headFTogRedDot.setData(RED_DOT_MODULE.HEAD_FRAME_TOGGLE);
        this.headTogRedot.setData(RED_DOT_MODULE.USER_HEAD_TOGGLE);
    }

    // 点击头像按钮
    onBtnHeadClick(event?: cc.Event, customEventData?: string) {
        if (this._selMode == HEAD_TAG) return;
        this._selMode = HEAD_TAG;
        this.mainList.numItems = this._headCfg.length;
        this.mainList.selectedId = this._lastSelHId;
    }
    // 点击头像框按钮
    onBtnFrameClick(event?: cc.Event, customEventData?: string) {
        if (this._selMode == HRAD_FRAME_TAG) return;
        this._selMode = HRAD_FRAME_TAG;
        this.mainList.numItems = this._frameCfg.length;
        this.mainList.selectedId = this._lastSelFId;
    }

    onListRender(item: cc.Node, idx: number) {
        let curHeadCfg = this._selMode == HEAD_TAG ? this._headCfg[idx] : this._frameCfg[idx];
        let prefix = this._selMode == HEAD_TAG ? RES_ICON_PRE_URL.HEAD_IMG : `${RES_ICON_PRE_URL.HEAD_FRAME}`;
        let imgUrl: string = `${prefix}/${curHeadCfg.HeadFrameImage}`;
        let redDotComp: ItemRedDot = cc.find('ItemRedDot', item).getComponent(ItemRedDot);
        redDotComp.setData(this._selMode == HEAD_TAG ? RED_DOT_MODULE.USER_HEAD : RED_DOT_MODULE.HEAD_FRAME
            , {args: [curHeadCfg.HeadFrameId], redDotType: RED_DOT_TYPE.NEW});
        this._loadSprInNode(imgUrl, item);
    }

    //选中单个头像/头像框
    onSelectItem(item: cc.Node, selectedId: number, lastSelectedId: number, val: number) {
        let uInfo = userData.accountData;
        let curCfg: cfg.HeadFrame = null;
        let node: cc.Node = null;
        let imgUrl: string = null;
        let isSel: boolean = false;
        let redotType: RED_DOT_DATA_TYPE = RED_DOT_DATA_TYPE.HEAD;
        switch (this._selMode) {
            //头像
            case HEAD_TAG:
                curCfg = this._headCfg[selectedId];
                imgUrl = `${RES_ICON_PRE_URL.HEAD_IMG}/${curCfg.HeadFrameImage}`;
                node = this.headNode;
                isSel = (this.getHeadIndex(uInfo.HeadID) == selectedId);
                this._lastSelHId = selectedId;
                redotType = RED_DOT_DATA_TYPE.HEAD;
                break;
            //头像框
            case HRAD_FRAME_TAG:
                curCfg = this._frameCfg[selectedId];
                imgUrl = `${RES_ICON_PRE_URL.HEAD_FRAME}/${curCfg.HeadFrameImage}`;
                node = this.frameNode;
                isSel = (this.getFrameIndex(uInfo.HeadFrameID) == selectedId);
                this._lastSelFId = selectedId;
                redotType = RED_DOT_DATA_TYPE.HEAD_FRAME;
                break;
        }
        
        this._loadSprInNode(imgUrl, node);
        this.headDescript.string = curCfg.HeadFrameOpenTask || "初始赠送";
        this.headName.string = curCfg.HeadFrameName;
        this.confirmButton.getComponent(cc.Button).interactable = !isSel;
        this.confirmButton.active = !isSel;
        let bagItem = bagData.getItemByID(curCfg.HeadFrameId);
        let ownHead: data.IBagUnit = item && bagItem.Array && bagItem.Array[0];
        this.lockTxt.node.active = !ownHead
        this.confirmButton.active = ownHead && !isSel;
        this.usingNode.active = ownHead && isSel;
        redDotMgr.clearNewData(redotType, ownHead);
        cc.find('ItemRedDot', item).getComponent(ItemRedDot).refreshView();
    }

    // 确认更换头像/头像框
    onSelectHeadConfirm() {
        let hID: number = this._headCfg[this._lastSelHId].HeadFrameId;
        let fID: number = this._frameCfg[this._lastSelFId].HeadFrameId;
        if ((hID != userData.accountData.HeadID || fID != userData.accountData.HeadFrameID)) {
            userOpt.reqChangeHead(hID, fID);
        }
    }

    // 动态加载图片至指定节点
    private _loadSprInNode(url: string, pnode: cc.Node) {
        this._spriteLoader = this._spriteLoader || new SpriteLoader();
        let imgUrl = url.search("textures/") == -1 ? `textures/${url}` : url;
        let nodeSpr = pnode.getComponent(cc.Sprite);
        this._spriteLoader.changeSprite(nodeSpr, imgUrl);
    }

    onRelease() {
        this.deInit();
        eventCenter.unregisterAll(this);
    }

    deInit() {
        this._spriteLoader && this._spriteLoader.release();
        this._spriteLoader = null;
        this._headCfg = null;
        this._frameCfg = null;
    }
}
