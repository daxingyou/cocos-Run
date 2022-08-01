
import { audioManager, BGM_TYPE } from "./AudioManager";
import { eventCenter } from "./event/EventCenter";
import { CGEvent } from "./event/EventData";

const {ccclass, property} = cc._decorator;

@ccclass
export default class VideoManager extends cc.Component {
    @property(cc.VideoPlayer) player: cc.VideoPlayer = null;
    @property(cc.Texture2D) skipBtnScoure: cc.Texture2D = null;

    private _manualClicked: boolean = false;
    private _finishCb: Function = null;

    get manualClicked(): boolean{
        return this._manualClicked;
    }

    set manualClicked(clicked: boolean){
      this._manualClicked = this._manualClicked || clicked;
      this.player.mute = !this._manualClicked
    }

    onInit(...params: any[]){
        this.player.node.active = false;
        this._manualClicked = cc.sys.isNative;
        this.player.mute = !this._manualClicked
        this._initEvents();
    }

    private _initEvents(){
        eventCenter.register(CGEvent.PLAY_CG, this, this.play);

        if(!cc.sys.isNative || cc.sys.os == cc.sys.OS_WINDOWS) return;
        if(cc.isValid(this.player) && cc.isValid(this.player.node)){
            this.player.node.on('meta-loaded', this._onVideoMetaLoaded, this);
            this.player.node.on('clicked', this._onVideoClick, this);
            this.player.node.on('completed', this._onVideoComplete, this);
            this.player.node.on('stopped', this._onVideoStop, this);
            //@ts-ignore
            this.skipBtnScoure && this.player.updateSkipBtnSource(this.skipBtnScoure);
        }
    }

    deInit(){

    }

    play(event?: any, finishCb?: Function){
        if(!cc.sys.isNative || cc.sys.os == cc.sys.OS_WINDOWS) {
            finishCb && finishCb();
            return;
        }
        this._finishCb = finishCb;
        this.player.node.active = true;
        audioManager.stopMusic();
        this.player.play();
        //@ts-ignore
        this.skipBtnScoure && this.player.updateSkipBtnSource(this.skipBtnScoure);
        //@ts-ignore
        this.player.setSkipBtnVisible(true);
    }

    stop(){
        this.player.stop();
    }

    onRelease(){
        this.deInit();
        eventCenter.unregisterAll(this);
        if(!cc.sys.isNative || cc.sys.os == cc.sys.OS_WINDOWS) return;
        if(cc.isValid(this.player) && cc.isValid(this.player.node)){
            this.player.node.off('clicked', this._onVideoClick, this);
            this.player.node.off('completed', this._onVideoComplete, this);
            this.player.node.off('stopped', this._onVideoStop, this);
            if(this.player.isPlaying()){
                this.stop();
            }
        }
    }

    private _onVideoComplete(){
        this.player.node.active = false;
        audioManager.playMusic(BGM_TYPE.NORMAL);
        this._finishCb && this._finishCb();
        this._finishCb = null;
    }

    private _onVideoStop(){
        this.player.node.active = false;
        audioManager.playMusic(BGM_TYPE.NORMAL);
        this._finishCb && this._finishCb();
        this._finishCb = null;
    }

    private _onVideoClick(){
        if(this._manualClicked) return;
        this._manualClicked = true;
        cc.isValid(this.player) && this.player.mute && (this.player.mute = !this._manualClicked);
    }

    private _onVideoMetaLoaded(){
        //@ts-ignore
        this.player.setSkipBtnVisible(true);
    }
}
