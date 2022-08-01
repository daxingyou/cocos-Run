import { audioManager, SFX_TYPE } from "../../../common/AudioManager";

/*
 * @Description: 危险警告view
 * @Version: 1.0
 * @Autor: lixu
 * @Date: 2021-07-23 11:34:55
 * @LastEditors: lixu
 * @LastEditTime: 2021-10-15 12:26:29
 */
const {ccclass, property} = cc._decorator;

@ccclass
export default class ParkourWarnView extends cc.Component {
    @property(sp.Skeleton) effectComp: sp.Skeleton = null;

    private _currAnimName: string = null;

    onInit(...params: any[]){

    }

    deInit(...params: any[]){
        this._clear();
    }

    show(...params: any[]){
          if(this.node.active) return;
          this.node.active = true;
          this.effectComp.clearTrack(0);
          this._currAnimName = 'star';
          this.effectComp.setAnimation(0, this._currAnimName, false);
          audioManager.playSfx(SFX_TYPE.MONSTER_APPEAR_WARN);
          this.effectComp.setCompleteListener(() => {
              if(this._currAnimName == 'star'){
                  this._currAnimName = 'end';
                  this.effectComp.setAnimation(0, this._currAnimName, false);
                  return;
              }

              if(this._currAnimName == 'end'){
                  this._clear();
              }
          });
    }

    private _clear(){
        this._currAnimName = null;
        audioManager.stopSfx(SFX_TYPE.MONSTER_APPEAR_WARN);
        this.effectComp.clearTrack(0);
        this.node.active = false;
    }

}
