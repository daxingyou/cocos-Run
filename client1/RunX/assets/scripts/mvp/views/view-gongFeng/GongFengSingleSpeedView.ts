/*
 * @Description:
 * @Version: 1.0
 * @Autor: lixu
 * @Date: 2022-06-10 09:34:46
 * @LastEditors: lixu
 * @LastEditTime: 2022-06-15 19:31:01
 */

import { CustomItemId } from "../../../app/AppConst";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import guiManager from "../../../common/GUIManager";
import { data } from "../../../network/lib/protocol";
import { bagData } from "../../models/BagData";
import { consecrateOpt } from "../../operations/ConsecrateOpt";
import ItemConsecrateSpeed from "./items/ItemConsecrateSpeed";
import { ConsecreateStatueLVData } from "./items/ItemGongFengMain";

const {ccclass, property} = cc._decorator;

enum GONG_FENG_SPEED_TYPE {
    NONE = 0,
    SINGLE,
    ALL
}

enum VIEW_STATE {
    CLOSED = 0,
    OPENING,
    OPENED,
    CLOSING
}

@ccclass
export default class GongFengSingleSpeedView extends ViewBaseComponent {
    @property(cc.Node) bgNode: cc.Node = null;
    @property(ItemConsecrateSpeed) item: ItemConsecrateSpeed = null;

    private _statueID: number = 0;
    private _statueInfo: data.IUniversalConsecrateStatue = null;
    private _tributeInfo: data.IUniversalConsecrateTribute = null;  //单个贡品加速时使用
    private _lvData: ConsecreateStatueLVData = null;
    private _viewState: VIEW_STATE = VIEW_STATE.CLOSED;

    preInit(...rest: any[]): Promise<any> {
        this.node.setContentSize(cc.winSize);
        this.bgNode.setContentSize(cc.winSize);
        return Promise.resolve();
    }

    protected onInit(statueID: number, statueInfo: data.IUniversalConsecrateStatue, lvData: ConsecreateStatueLVData, tributeInfo: data.IUniversalConsecrateTribute, pos: cc.Vec2): void {
        this._statueID = statueID;
        this._statueInfo = statueInfo;
        this._lvData = lvData;
        this._tributeInfo = tributeInfo;
        this.item.node.setPosition(this.node.convertToNodeSpaceAR(pos));
        this.node.active = true;
        this._viewState = VIEW_STATE.CLOSED;
        this._initUI();
        this._playOpenAnim();
    }

    protected onRelease(): void {
        this.item.deInit();
        cc.Tween.stopAllByTarget(this.item.node);
        this._viewState = VIEW_STATE.CLOSED;
        this._statueInfo = null;
        this._lvData = null;
    }

    private _initUI() {
        this.item.init(GONG_FENG_SPEED_TYPE.SINGLE, this._statueInfo, this._lvData, this._onSpeedClick.bind(this), this._tributeInfo);
    }

    private _playOpenAnim() {
        if(this._viewState != VIEW_STATE.CLOSED) return;
        this._viewState += 1;
        this.item.node.scale = 0;
        cc.Tween.stopAllByTarget(this.item.node);
        cc.tween(this.item.node).to(0.2, {scale: 1}, {easing: 'backOut'}).call(() => {
            this._viewState += 1;
        }).start();
    }

    onClickClose() {
        if(this._viewState != VIEW_STATE.OPENED) return;
        this._viewState += 1;
        this.hideView();
    }

    hideView() {
        cc.Tween.stopAllByTarget(this.item.node);
        cc.tween(this.item.node).to(0.2, {scale: 0}, {easing: 'backIn'}).call(() => {
            this.item.deInit();
            this.node.active = false;
            this._viewState += 1;
        }).start();
    }

    private _onSpeedClick(type: GONG_FENG_SPEED_TYPE, leftTime: number, isFinished: boolean = false) {
        if(isFinished) {
            this.hideView();
            return;
        }

        if(this._viewState != VIEW_STATE.OPENED) return;
        let needSpeedCoinCnt = 0;
        if(leftTime > 0) {
            let notEnoughMin = leftTime % 60;
            leftTime = leftTime - notEnoughMin;
            needSpeedCoinCnt = leftTime / 60;
        }

        let hasCnt = bagData.getItemCountByID(CustomItemId.GONG_FENG_SPEED_UP_COIN);
        if(needSpeedCoinCnt > hasCnt) {
            guiManager.showDialogTips(1000127, CustomItemId.GONG_FENG_SPEED_UP_COIN);
            return;
        }
        consecrateOpt.sendSpeedUpTributeReq(this._statueID, type == GONG_FENG_SPEED_TYPE.ALL);
        this.hideView();
    }
}

export {
    GONG_FENG_SPEED_TYPE
}
