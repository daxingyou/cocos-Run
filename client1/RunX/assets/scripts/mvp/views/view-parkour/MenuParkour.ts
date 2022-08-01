/*
 * @Description:
 * @Autor: lixu
 * @Date: 2021-05-07 20:09:12
 * @LastEditors: lixu
 * @LastEditTime: 2021-12-07 11:49:51
 */
import { ViewBaseComponent } from '../../../common/components/ViewBaseComponent';
import {eventCenter} from "../../../common/event/EventCenter";
import { commonEvent, parkourEvent} from "../../../common/event/EventData";
import { PARKOUR_OPERATE } from '../../../app/AppEnums';
import { localStorageMgr, SAVE_TAG } from '../../../common/LocalStorageManager';
const {ccclass, property} = cc._decorator;

const sliderToggleIdx = 0;
const clickToggleIdx = 1;

@ccclass
export default class MenuParkour extends ViewBaseComponent {
    @property(cc.ToggleContainer) operationType: cc.ToggleContainer = null;

    private _currLession:number = 0;

    onInit (lessonId: number) {
        this._currLession = lessonId;
        this._initViews();
    }

    deInit(){
        this._currLession = 0;
    }

    private _initViews(){
        let currOperType = localStorageMgr.getAccountStorage(SAVE_TAG.PARKOUR_MODE) ||PARKOUR_OPERATE.CLICK
        let checkIdx = currOperType == PARKOUR_OPERATE.CLICK ?  clickToggleIdx: sliderToggleIdx;
        this.operationType.toggleItems[checkIdx].isChecked = true;
    }

    onCloseClick(){
        eventCenter.fire(parkourEvent.SHOW_RESUME_COUNT_DOWN);
        this.closeView();
    }

    onSwitchOperation(toggle: cc.Toggle) {
        let currOperType = localStorageMgr.getAccountStorage(SAVE_TAG.PARKOUR_MODE) ||PARKOUR_OPERATE.CLICK
        let operateType = PARKOUR_OPERATE.CLICK;
        if(toggle.node.name == "ToggleSlider"){
            operateType =  PARKOUR_OPERATE.SLIDER;
        }
        if(currOperType === operateType) return;

        localStorageMgr.setAccountStorage(SAVE_TAG.PARKOUR_MODE, operateType)

        //通知操作模块更新操作方式
        eventCenter.fire(parkourEvent.RESET_OPERATE_TYPE);
    }

    //重新开始
    onRestartClick(){
        this.closeView();
        eventCenter.fire(commonEvent.RESTART_CURR_GAME);
    }

    //继续
    onContinueClick(){
        this.closeView();
        eventCenter.fire(parkourEvent.SHOW_RESUME_COUNT_DOWN);
    }

    //撤退
    onBackClick(){
        this.closeView();
        eventCenter.fire(parkourEvent.EXIT_CURR_GAME);
    }

    onRelease(){

    }
}
