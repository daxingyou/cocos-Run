import PlayerMoveComp from "./PlayerMoveComp";
import { BaseState } from "./StateModule";

/*
 * @Description: 角色跟随组件
 * @Version: 2.0
 * @Autor: lixu
 * @Date: 2021-06-15 19:18:09
 * @LastEditors: lixu
 * @LastEditTime: 2021-08-26 11:16:12
 */
const {ccclass, property} = cc._decorator;

interface ActionInfo{
    name?: string,
    loop?: boolean,
    trackIdx?: number
}

interface FollowInfo{
    x?: number,
    y?: number,
    state?: BaseState,
    action?:  ActionInfo
}

//最大缓冲的帧长度
const MAX_FOLLOW_INFO_SIZE = 100;

@ccclass
export default class RoleFollowComp extends cc.Component {
    //被跟随的目标对象，会对该对象的实时位置和状态进行采集，用以跟踪其位置
    private _targetNode: cc.Node = null;
    //延迟帧数
    private _delayFrame: number = 0;
    //存储目标对象的移动轨迹和状态
    private _followList: Array<FollowInfo> = null;
    //对目标对象的位置进行捕获的步长
    private _captureStep: number = 0;
    //捕获目标对象参数的倒计时
    private _countDown: number = 0;

    set delayFrame(delayFrame: number){
        this._delayFrame = delayFrame;
    }

    get delayFrame(): number{
        return this._delayFrame;
    }

    set targetNode(target: cc.Node){
        this._targetNode = target;
    }

    get targetNode(): cc.Node{
        return this._targetNode;
    }

    set captureStep(step: number){
        this._captureStep = step;
    }

    get captureStep(): number{
        return this._captureStep;
    }

    onInit(params?: any){
        if(params){
            cc.isValid(params.targetNode) && (this._targetNode = params.targetNode);
            !isNaN(params.delayFrame) && (this._delayFrame = parseFloat(params.delayFrame));
            !isNaN(params.captureStep) && (this._captureStep = parseFloat(params.captureStep));
        }
        this._countDown = 0;
    }

    deInit(){
        this.clear();
    }

    clear(){
        this._followList && (this._followList.length = 0);
    }

    onRelease() {
        this.clear();
        this._followList = null;
        this._targetNode = null;
    }

    //对被跟随对象进行采样
    captureFollowInfo(dt: number){
        if(!cc.isValid(this._targetNode)) return;
        this._followList = this._followList ||  new Array<FollowInfo>();
        this._countDown -= dt;
        if(this._countDown <= 0) {
            while(this._followList.length >= MAX_FOLLOW_INFO_SIZE){
                this._followList.shift();
            }
            let comp: PlayerMoveComp = this._targetNode.getComponent(PlayerMoveComp);
            if(!comp){
                cc.warn('RoleFollowComp captureFollowInfo: targetNode has not PlayerMoveComp, cannot get currState!!!')
            }

            let state = null;
            let action: ActionInfo = null;
            if(comp){
                state = comp.getCurrState();
                action = comp.getCurrActionInfo();
                this._followList.push({x:this._targetNode.x, y: this._targetNode.y, state: state, action: action});
            }
            this._countDown = this._captureStep;
        }
    }

    //获取跟随对象的x坐标
    getCurrFollowTargetPosX(){
        if(!cc.isValid(this._targetNode)) return 0;
        return this._targetNode.x;
    }

    getCurrFollowInfo(isDelay: boolean = true): FollowInfo{
        if(isDelay && this._followList.length < this._delayFrame) return null;
        let followInfo = this._followList.shift();
        return followInfo;
    }

    //获取多余的帧数
    getMoreFollowInfos(): FollowInfo[]{
        if(this._followList.length < this.delayFrame) return null;
        let catchCount = this._followList.length - this._delayFrame + 1;
        catchCount = Math.min(catchCount, this._followList.length);
        if(catchCount <= 0) return null;
        return this._followList.splice(0, catchCount);
    }
}

export {
    ActionInfo
}
