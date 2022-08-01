/*
 * @Author: xuyang
 * @Description: 活动-升级战令
 */
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { activityUtils } from "../../../app/ActivityUtils";
import { configUtils } from "../../../app/ConfigUtils";
import { bagData } from "../../models/BagData";
import { CustomDialogId, CustomItemId } from "../../../app/AppConst";
import { activityOpt } from "../../operations/ActivityOpt";
import guiManager from "../../../common/GUIManager";

const { ccclass, property } = cc._decorator;
@ccclass
export default class ActivityBattlePassUpgradeView extends ViewBaseComponent {
    @property(cc.Slider) levelSlider: cc.Slider = null;

    @property(cc.Label) oldLv: cc.Label = null;
    @property(cc.Label) newLv: cc.Label = null;
    @property(cc.Label) addLv: cc.Label = null;
    @property(cc.Label) costLb: cc.Label = null;

    private _addNum: number = 1;
    private _maxLv: number = 0;
    private _initLv: number = 0;
    private _curLv: number = 0;
    private _price: number = 0;
  
    onInit(moduleId: number, partId: number, subId: number) {
        this._prepareData();
        this._refreshView();
    }

    onClickBuy() {
        if (bagData.diamond < this._price * this._addNum ){
            guiManager.showDialogTips(CustomDialogId.COMMON_ITEM_NOT_ENOUGH, CustomItemId.DIAMOND);
            return;
        }
        if (this._addNum){
            activityOpt.buyBattlePassLevel(this._addNum);
            this.closeView();
        }
            
    }
    
    onSlideCallBack(){
        let newLv = this._initLv + 1 + Math.round(this.levelSlider.progress * (this._maxLv - this._initLv -1));
        if (newLv != this._curLv) {
            this._curLv = newLv;
            this._addNum = this._curLv - this._initLv;
        }
        this._refreshView();
    }
    
    onClickAdd(){
        let newLv = this._curLv + 1;
        if (newLv != this._curLv && newLv <= this._maxLv) {
            this._curLv = newLv;
            this._addNum = this._curLv - this._initLv;
            this._refreshView();
        }
    }

    onClickMinus(){
        let newLv = this._curLv - 1;
        if (newLv != this._curLv && newLv > this._initLv) {
            this._curLv = newLv;
            this._addNum = this._curLv - this._initLv;
            this._refreshView();
        }
    }

    refreshSlideStatus(){
        let handleBg: cc.Node = this.levelSlider.node.getChildByName("HandleBg");
        let progress = this._maxLv == this._initLv ? 1 : (this._curLv - this._initLv - 1) / (this._maxLv - this._initLv -1);
        handleBg.getComponent(cc.Sprite).fillRange = this.levelSlider.progress;
    }

    private _prepareData() {
        this._initLv = this._curLv = activityUtils.getBattlePassLv();
        this._curLv = this._initLv + this._addNum;
        this._maxLv = activityUtils.getBattlePassMaxLv();
        this._price = configUtils.getConfigModule("BattlePassLevelUpCost") || 0;       
    }

    private _refreshView(withoutSlider?: boolean){
        this.oldLv.string = this._initLv == this._maxLv ? "满级" : `${this._initLv}`;
        this.newLv.string = this._curLv == this._maxLv ? "满级" : `${this._curLv}`;
        this.addLv.string = this._addNum == 0 ? `` : `+${this._addNum}`;

        this.costLb.string = `${this._price * this._addNum}`;
        this.costLb.node.color = bagData.diamond < this._price * this._addNum ? cc.color(255, 0, 0) : cc.color(141, 90, 50);
        this.levelSlider.progress = this._curLv == this._maxLv ? 1 : (this._curLv - this._initLv - 1) / (this._maxLv - this._initLv - 1);

        this.refreshSlideStatus();
    }
}