/*
 * @Description:关卡进度
 * @Version: 1.0
 * @Autor: lixu
 * @Date: 2021-07-24 17:33:11
 * @LastEditors: lixu
 * @LastEditTime: 2021-08-23 17:45:26
 */

import BossHpBarComp from "./BossHPBarComp";
import LevelProgressComp from "./LevelProgressComp";
import { MonsterInfo } from "./ParkourMonster";

const {ccclass, property} = cc._decorator;

enum ProgressViewType{
    LevelProgressView = 1,
    BossHPView
}

@ccclass
export default class ProgressView extends cc.Component {
    @property(BossHpBarComp) bossHPView: BossHpBarComp = null;
    @property(LevelProgressComp) levelProgressView: LevelProgressComp = null;

    private _curViewType:ProgressViewType = ProgressViewType.LevelProgressView;
    private _curBossInfo: MonsterInfo = null;

    onInit(){
        this._curViewType = ProgressViewType.LevelProgressView;
        this.bossHPView.onInit();
        this.levelProgressView.onInit();
        this._setViewVisible();
    }

    deInit(){
        this.bossHPView.deInit();
        this.updateLevelProgress(0);
        this.levelProgressView.deInit();
        this._curBossInfo = null;
    }

    private _setViewVisible(){
        this.levelProgressView.node.active  = this._curViewType == ProgressViewType.LevelProgressView;
        this.bossHPView.node.active = this._curViewType == ProgressViewType.BossHPView;
        if(this._curViewType == ProgressViewType.BossHPView && this._curBossInfo){
           this.bossHPView.resetBossUI(this._curBossInfo);
           this._curBossInfo = null;
        }
    }

    private _switchView(){
        cc.Tween.stopAllByTarget(this.node);
        let targetScaleY = this._curViewType == ProgressViewType.LevelProgressView ? 1 : -1;
        cc.tween(this.node).to(0.15, {scaleY: 0}).call(this._setViewVisible, this).to(0.15, {scaleY: targetScaleY}).start();
    }

    showView(viewType: ProgressViewType, bossInfo?: MonsterInfo){
        if(this._curViewType == viewType) return;
        this._curViewType  = viewType;
        this._curBossInfo = bossInfo;
        this._switchView();
    }

    //更新关卡进度
    updateLevelProgress(progress: number){
        if(!this.levelProgressView) return;
        this.levelProgressView.updateProgrss(progress);
    }

    //播放角色受伤动画
    playActorBeHurtAnim(){
        if(!this.levelProgressView) return;
        this.levelProgressView.playActorBeHurtAnim();
    }

    //播放角色使用技能动画
    playActorUseSkillAnim(){
        if(!this.levelProgressView) return;
        this.levelProgressView.playActorUseSkillAnim();
    }
}

export {
  ProgressViewType
}
