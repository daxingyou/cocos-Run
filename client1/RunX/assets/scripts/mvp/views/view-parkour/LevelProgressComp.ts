/*
 * @Description:
 * @Autor: lixu
 * @Date: 2021-04-27 19:22:20
 * @LastEditors: lixu
 * @LastEditTime: 2021-07-26 16:19:25
 */
const {ccclass, property} = cc._decorator;

@ccclass
export default class LevelProgressComp extends cc.Component {

    private _levelProgressComp: cc.ProgressBar = null;
    private _actorNode: cc.Node = null;
    private _progressLength: number = 0;

    private _headPath: string = null;

    onInit(...params: any[]){
        let progressNode = cc.find( "Progress", this.node);
        this._levelProgressComp = progressNode.getComponent(cc.ProgressBar);
        this._actorNode = cc.find("Head", this.node);
        this._progressLength = progressNode.width;
    }

    deInit(){

    }

    start(){
        //加载玩家头像
        if(this._headPath && this._headPath.length > 0){
            this.loadPlayerHead(this._headPath);
        }
    }

    //更新关卡进度
    updateProgrss(progress: number){
        if(progress < 0) progress = 0;
        if(progress > 1) progress = 1;
        this._levelProgressComp.progress = progress;
        this._actorNode.setPosition(cc.v2(this._progressLength * (progress - 0.5), 0));
    }

    //加载玩家头像
    private loadPlayerHead(path: string){

    }

    //播放角色受伤动画
    playActorBeHurtAnim(){

    }

    //播放角色使用技能动画
    playActorUseSkillAnim(){

    }
}
