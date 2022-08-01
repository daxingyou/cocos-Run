/*
 * @Description:
 * @Version: 1.0
 * @Autor: lixu
 * @Date: 2022-06-10 19:34:57
 * @LastEditors: lixu
 * @LastEditTime: 2022-06-15 19:59:13
 */

import { VIEW_NAME } from "../../../app/AppConst";
import { utils } from "../../../app/AppUtils";
import { configUtils } from "../../../app/ConfigUtils";
import { audioManager, SFX_TYPE } from "../../../common/AudioManager";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { eventCenter } from "../../../common/event/EventCenter";
import { ConsecrateEvents } from "../../../common/event/EventData";
import guiManager from "../../../common/GUIManager";
import { ItemBagPool } from "../../../common/res-manager/NodePool";
import { cfg } from "../../../config/config";
import { data } from "../../../network/lib/protocol";
import { consecrateData } from "../../models/ConsecrateData";
import { consecrateOpt } from "../../operations/ConsecrateOpt";
import ItemBag from "../view-item/ItemBag";
import GetItemView from "../view-other/GetItemView";

const {ccclass, property} = cc._decorator;

@ccclass
export default class GongFengBeFallView extends ViewBaseComponent {
    @property(cc.Node) ndTitle: cc.Node = null;
    @property(cc.Node) rootNode: cc.Node = null;
    @property(sp.Skeleton)  bgEff: sp.Skeleton = null;
    @property(cc.Node) contentNode: cc.Node = null;
    @property([cc.Button]) takeBtns: cc.Button[] = [];

    private _items: Map<number, ItemBag[]> = new Map();
    private _statueID: number = 0;
    private _rewardData: Array<Array<number>> = null;
    private _rewardIdxs: number[] = [];
    private _isSel: boolean = false;
    private _finishCb: Function = null;
    private _isInited: boolean = false;

    protected onInit(statueID: number, finshCb: Function): void {
        audioManager.playSfx(SFX_TYPE.EQUIO_BROKE);
        this._statueID = statueID;
        this._finishCb = finshCb;
        this._init();
        this._initCfg();
        this.contentNode.active = false;
        this.node.active = true;
        this._initUI();
        this._playBgEff();
        this.scheduleOnce(() => {
            this.contentNode.active = true;
        }, 0.3);
    }

    hide() {
        this._deInit();
        this.node.active = false;
    }

    private _deInit() {
        this._clearItems();
        this._isSel = false;
        this._rewardData = null;
        this._isSel = false;
        this._finishCb = null;
    }

    private _init() {
        if(this._isInited) return;
        this._isInited = true;
        eventCenter.register(ConsecrateEvents.RECV_TAKE_BEFALL_REWARD, this, this._onRecvReward);
    }

    protected onRelease(): void {
        eventCenter.unregisterAll(this);
        this._deInit();
        this._isInited = false;
    }

    private _clearItems() {
        this._items.forEach(ele => {
            ele && ele.forEach(ele1 => {
                ItemBagPool.put(ele1);
            })
        });
        this._items.clear();
    }

    onClickTakeBtn(event: cc.Event) {
        if(this._isSel) return;
        this._isSel = true;
        let target  = event.target;
        let idx = this.takeBtns.findIndex(ele => {
            return ele.node == target;
        });
        if(idx != -1) {
            consecrateOpt.sendGetRewardOfStatusRefallReq(this._statueID, this._rewardIdxs[idx]);
        }
    }

    private _initCfg() {
        this._rewardData = this._rewardData || [];
        this._rewardData.length = 0;
        let comeCfg: cfg.ConsecrateCome = configUtils.getConsecrateComeCfg(this._statueID);
        utils.parseStingList( comeCfg.ConsecrateComeReward, (strArr: string[]) => {
            this._rewardData.push([parseInt(strArr[0]), parseInt(strArr[1])]);
        })
    }

    private _initUI() {
          this._clearItems();
          this._rewardIdxs.length = 0;
          let rewardArr = consecrateData.getStatueInfo(this._statueID).RandomBefallRewardIndexList;
          this.takeBtns.forEach((ele, idx) => {
            let itemData = this._rewardData[rewardArr[idx]];
            this._rewardIdxs.push(rewardArr[idx]);
            let itemBag = ItemBagPool.get();
            if(!this._items.has(idx)) {
                this._items.set(idx, []);
            }
            this._items.get(idx).push(itemBag);
            itemBag.node.setPosition(ele.node.getPosition().add(cc.v2(0, 80)));
            itemBag.init({id: itemData[0], count: itemData[1]});
            this.rootNode.addChild(itemBag.node);
         });
    }

    private _onRecvReward(event: number, statueType: number, prizes: data.IItemInfo[], exp: number) {
        if(statueType != this._statueID) return;
        prizes && prizes.length > 0 && guiManager.loadView(VIEW_NAME.GET_ITEM_VIEW, this.node, prizes).then((view) => {
            if(!view) return;
            (view as GetItemView).closeFunc = this._onGetItemViewClosedCb.bind(this);
        });
    }

    private _onGetItemViewClosedCb() {
        this._finishCb && this._finishCb(this);
    }


    private _playBgEff(){
        if(this.ndTitle.parent == this.node){
            //@ts-ignore
            let bones = this.bgEff.attachUtil.generateAttachedNodes('bone5');
            if(bones && bones.length > 0){
                this.ndTitle.setPosition(cc.Vec2.ZERO);
                this.ndTitle.parent = bones[0];
            }
        }

        this.bgEff.clearTracks();
        this.bgEff.setAnimation(0, 'animation', false);
    }
}
