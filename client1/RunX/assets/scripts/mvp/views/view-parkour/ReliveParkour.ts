/*
 * @Description:
 * @Autor: lixu
 * @Date: 2021-04-29 09:53:00
 * @LastEditors: lixu
 * @LastEditTime: 2021-11-03 16:22:20
 */
import { utils } from '../../../app/AppUtils';
import {eventCenter} from "../../../common/event/EventCenter";
import {parkourEvent} from "../../../common/event/EventData";
import { ViewBaseComponent } from '../../../common/components/ViewBaseComponent';
const {ccclass, property} = cc._decorator;

@ccclass
export default class ReliveParkour extends ViewBaseComponent {
    private btnRelive: cc.Node = null;
    private btnNoRelive: cc.Node = null;

    private progressBar: cc.ProgressBar = null;
    private progressCursor: cc.Node = null;

    private progress: number = 0;

    onInit(progress: number = 0){
        this.progress = progress;
        this._initView();
    }

    deInit(){
    }

    private _initView(){
        this.btnRelive = cc.find("rootNode/Relive", this.node);
        this.btnNoRelive = cc.find("rootNode/No_Relive", this.node);
        this.progressBar = cc.find( "rootNode/ProgressBar", this.node).getComponent(cc.ProgressBar);
        this.progressCursor = cc.find("rootNode/ProgressBar/Cussor", this.node);

        this.progressBar.progress = this.progress;
        this.progressCursor.x =  Math.floor(this.progressBar.totalLength * (this.progress - 0.5));
        cc.find("Label", this.progressCursor).getComponent(cc.Label).string = `当前关卡进度：${Math.floor(this.progress * 10000) / 100}%`;

        utils.addClickEventListener(this.btnRelive, this.onClickRelive.bind(this));
        utils.addClickEventListener(this.btnNoRelive, this.onClickNoRelive.bind(this));
    }

    onClickRelive(){
        eventCenter.fire(parkourEvent.RELIVE, true);
        this.closeView();
    }

    onClickNoRelive(){
        eventCenter.fire(parkourEvent.SHOW_RESULT, false);
        this.closeView();
        eventCenter.fire(parkourEvent.RELIVE, false);
    }

    onRelease(){

    }
}
