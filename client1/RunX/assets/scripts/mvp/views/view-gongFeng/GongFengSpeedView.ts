/*
 * @Description:
 * @Version: 1.0
 * @Autor: lixu
 * @Date: 2022-06-10 09:34:46
 * @LastEditors: lixu
 * @LastEditTime: 2022-06-15 18:51:30
 */

import { CustomItemId } from "../../../app/AppConst";
import { CONSECRATE_STATUE_NAME } from "../../../app/AppEnums";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import guiManager from "../../../common/GUIManager";
import { data } from "../../../network/lib/protocol";
import { bagData } from "../../models/BagData";
import { consecrateOpt } from "../../operations/ConsecrateOpt";
import { ConsecreateStatueLVData } from "./items/ItemGongFengMain";

const {ccclass, property} = cc._decorator;

enum GONG_FENG_SPEED_TYPE {
    NONE = 0,
    SINGLE,
    ALL
}

@ccclass
export default class GongFengSpeedView extends ViewBaseComponent {
    @property(cc.Label) title: cc.Label = null;
    @property(cc.Node) allTribute: cc.Node = null;
    @property(cc.Node) curTribute: cc.Node = null;

    private _statueID: number = 0;
    private _statueInfo: data.IUniversalConsecrateStatue = null;
    private _speedType: GONG_FENG_SPEED_TYPE = GONG_FENG_SPEED_TYPE.NONE;
    private _tributeInfo: data.IUniversalConsecrateTribute = null;  //单个贡品加速时使用
    private _oriCurTributePos: cc.Vec2 = null;
    private _lvData: ConsecreateStatueLVData = null;

    protected onInit(statueID: number, statueInfo: data.IUniversalConsecrateStatue, speedType: GONG_FENG_SPEED_TYPE, lvData: ConsecreateStatueLVData, tributeInfo?: data.IUniversalConsecrateTribute): void {
        this._statueID = statueID;
        this._statueInfo = statueInfo;
        this._speedType = speedType;
        this._lvData = lvData;
        this._tributeInfo = tributeInfo;
        this._oriCurTributePos = this._oriCurTributePos || this.curTribute.getPosition();
        this.node.active = true;
        this._initUI()
    }

    protected onRelease(): void {
        this.allTribute.getComponent('ItemConsecrateSpeed').deInit();
        this.curTribute.getComponent('ItemConsecrateSpeed').deInit();
        this._statueInfo = null;
        this._lvData = null;
        this._speedType = GONG_FENG_SPEED_TYPE.NONE;
    }

    private _initUI() {
        this.title.string = `${CONSECRATE_STATUE_NAME[this._statueID + '']}雕像加速`;
        if(this._speedType == GONG_FENG_SPEED_TYPE.ALL) {
            this.allTribute.active = true;
            this.allTribute.getComponent('ItemConsecrateSpeed').init(GONG_FENG_SPEED_TYPE.ALL, this._statueInfo, this._lvData, this._onSpeedClick.bind(this));
            this.curTribute.setPosition(this._oriCurTributePos);
        } else {
            this.allTribute.active = false;
            this.curTribute.x = 0;
        }
        this.curTribute.getComponent('ItemConsecrateSpeed').init(GONG_FENG_SPEED_TYPE.SINGLE, this._statueInfo, this._lvData, this._onSpeedClick.bind(this), this._tributeInfo);
    }

    onClickClose() {
        this.hideView();
    }

    hideView() {
        this.allTribute.getComponent('ItemConsecrateSpeed').deInit();
        this.curTribute.getComponent('ItemConsecrateSpeed').deInit();
        this.node.active = false;
    }

    private _onSpeedClick(type: GONG_FENG_SPEED_TYPE, leftTime: number, isFinished: boolean = false) {
        // 供奉时间流逝完，关闭加速界面
        if(isFinished) {
            if(type == GONG_FENG_SPEED_TYPE.ALL) {
                this.hideView();
            }
            return;
        }

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
    }
}

export {
    GONG_FENG_SPEED_TYPE
}
