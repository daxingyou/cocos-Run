/*
 * @Description:
 * @Version: 1.0
 * @Autor: lixu
 * @Date: 2021-10-28 15:10:54
 * @LastEditors: lixu
 * @LastEditTime: 2022-02-21 18:23:24
 */

import { configUtils } from "../../../app/ConfigUtils";
import { resPathUtils } from "../../../app/ResPathUrlUtils";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import guiManager from "../../../common/GUIManager";
import { userData } from "../../models/UserData";
import GetSSRPVItem from "./GetSSRPVItem";

const {ccclass, property} = cc._decorator;

@ccclass
export default class GetSSRPVView extends ViewBaseComponent {

    @property(GetSSRPVItem) backPVItem: GetSSRPVItem = null;
    @property(GetSSRPVItem) frontPVItem: GetSSRPVItem = null;

    private _showSSRHeroList: number[] = null;
    private _closeCb: Function = null;
    private _isCapTipPlayed: boolean = false;

    onInit(showList: number[], closeCb: Function, isPlayCapTip: boolean){
        this._closeCb = closeCb;
        this._showSSRHeroList = this._showSSRHeroList || [];
        showList && showList.forEach(ele => {
            this._showSSRHeroList.push(ele);
        });
        this.goNext(isPlayCapTip);
    }

    deInit(){
        this.backPVItem.deInit();
        this.frontPVItem.deInit();
    }

    onRelease(){
        this._isCapTipPlayed = false;
        this.backPVItem.onRelease();
        this.frontPVItem.onRelease();
    }

    goNext(isPlayCapTip: boolean){
        if(this._showSSRHeroList.length == 0){
          this._closeView();
          return;
        }

        let currHero = this._showSSRHeroList.shift();
        this.deInit();
        new Promise((resolve, reject) => {
            let heroCfg = configUtils.getHeroBasicConfig(currHero);
            this.backPVItem.onInit(resPathUtils.getModelPhotoPath(heroCfg.HeroBasicModel)).then(() => {
                resolve(true);
            });
        }).then(() => {
            isPlayCapTip && this.playCapabilityChange();
            this.backPVItem.play();
            this.frontPVItem.play();
        });
    }

    playCapabilityChange() {
        // if(this._isCapTipPlayed) return;
        // this._isCapTipPlayed = true;
        // const preCapability = userData.preCapability;
        // const capability = userData.capability;
        // guiManager.showCapabilityChange(preCapability, capability);
    }

    private _closeView(){
        this.closeView();
        this._closeCb && this._closeCb();
        this._closeCb = null;
    }
}
