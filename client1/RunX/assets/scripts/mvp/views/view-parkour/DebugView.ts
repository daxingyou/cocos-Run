/*
 * @Description:跑酷参数调试工具
 * @Version: 1.0
 * @Autor: lixu
 * @Date: 2021-06-15 18:28:16
 * @LastEditors: lixu
 * @LastEditTime: 2021-08-27 15:24:22
 */
import { utils } from '../../../app/AppUtils';
import { ViewBaseComponent } from '../../../common/components/ViewBaseComponent';
import { eventCenter } from '../../../common/event/EventCenter';
import { parkourEvent } from '../../../common/event/EventData';
import guiManager from '../../../common/GUIManager';
import {parkourConfig} from './ParkourConst';

const {ccclass, property} = cc._decorator;

@ccclass
export default class DebugView extends ViewBaseComponent {

    @property(cc.Button) submitBtn: cc.Button = null;
    @property(cc.EditBox) xSpeed: cc.EditBox = null;
    @property(cc.EditBox) ySpeed: cc.EditBox = null;
    @property(cc.EditBox) yAddSpeed: cc.EditBox = null;
    @property(cc.EditBox) yMaxSpeed: cc.EditBox = null;
    @property(cc.EditBox) operDelay: cc.EditBox = null;
    @property(cc.EditBox) yFastDownSpeed: cc.EditBox = null;
    @property(cc.EditBox) autoPlayItemStartX: cc.EditBox = null;
    @property(cc.EditBox) autoPlayItemAreaWidth: cc.EditBox = null;
    @property(cc.EditBox) autoPlayMonsterStartX: cc.EditBox = null;
    @property(cc.EditBox) autoPlayCheckInterval: cc.EditBox = null;

    onInit(){

    }

    onEnable(){
        this.xSpeed.string = parkourConfig.terrMoveSpeed.x;
        this.ySpeed.string = parkourConfig.jumpStartSpeed.y
        this.yAddSpeed.string = parkourConfig.addSpeed.y;
        this.yMaxSpeed.string = parkourConfig.maxJumpSpeed.y;
        this.operDelay.string = parkourConfig.operDelay || 0;
        this.yFastDownSpeed.string = parkourConfig.fastDownSpeed;
        this.autoPlayItemStartX.string = parkourConfig.AutoPlayAreaStartX;
        this.autoPlayItemAreaWidth.string = parkourConfig.AutoPlayAreaWidth;
        this.autoPlayMonsterStartX.string = parkourConfig.AutoPlayMonsterAreaStartX;
        this.autoPlayCheckInterval.string = parkourConfig.AutoPlayTickInterval;
    }


    start(){
        utils.addClickEventListener(this.submitBtn.node, ()=>{
          if(isNaN(parseFloat(this.xSpeed.string)) || parseFloat(this.xSpeed.string) < 0) {
              guiManager.showTips("移速设置不合法!!!");
              return;
          }

          if(isNaN(parseFloat(this.ySpeed.string)) || parseFloat(this.ySpeed.string) < 0){
              guiManager.showTips("起跳速度设置不合法!!!");
              return;
          }

          if(isNaN(parseFloat(this.yAddSpeed.string)) || parseFloat(this.yAddSpeed.string) >=0 ){
              guiManager.showTips("重力设置不合法!!!");
              return;
          }

          if(isNaN(parseFloat(this.yMaxSpeed.string)) || parseFloat(this.yMaxSpeed.string) < 0){
              guiManager.showTips("下落最大速度设置不合法!!!");
              return;
          }

          if(isNaN(parseFloat(this.yFastDownSpeed.string)) || parseFloat(this.yFastDownSpeed.string) <= 0){
              guiManager.showTips("速降速度设置不合法!!!");
              return;
          }

          if(isNaN(parseInt(this.autoPlayItemStartX.string)) || parseInt(this.autoPlayItemStartX.string) <= 0){
              guiManager.showTips("自动模式===道具检测区域的起始X设置不合法!!!");
              return;
          }

          if(isNaN(parseInt(this.autoPlayItemAreaWidth.string)) || parseInt(this.autoPlayItemAreaWidth.string) <= 0){
              guiManager.showTips("自动模式===道具检测区域的宽度设置不合法!!!");
              return;
          }

          if(isNaN(parseInt(this.autoPlayMonsterStartX.string)) || parseInt(this.autoPlayMonsterStartX.string) <= 0){
              guiManager.showTips("自动模式===怪物检测区域的起始X设置不合法!!!");
              return;
          }

          if(isNaN(parseInt(this.autoPlayCheckInterval.string)) || parseInt(this.autoPlayCheckInterval.string) < 0){
              guiManager.showTips("自动模式===检测间隔设置不合法!!!");
              return;
          }


          // if(isNaN(parseFloat(this.operDelay.string))){
          //     guiManager.showTips("下落最大速度设置不合法!!!");
          //     return;
          // }
          let param : any = {};
          param.xSpeed = parseFloat(this.xSpeed.string);
          param.ySpeed = parseFloat(this.ySpeed.string);
          param.yAddSpeed = parseFloat(this.yAddSpeed.string);
          param.yMaxSpeed = parseFloat(this.yMaxSpeed.string);
          param.operDelay = parseFloat(this.operDelay.string);
          param.fastDownSpeed = parseFloat(this.yFastDownSpeed.string);
          param.AutoPlayAreaStartX = parseInt(this.autoPlayItemStartX.string);
          param.AutoPlayAreaWidth = parseInt(this.autoPlayItemAreaWidth.string);
          param.AutoPlayMonsterAreaStartX = parseInt(this.autoPlayMonsterStartX.string);
          param.AutoPlayTickInterval = parseFloat(this.autoPlayCheckInterval.string);
          eventCenter.fire(parkourEvent.CHANGE_DEBUG_CONFIG, param);
      });
  }
}
