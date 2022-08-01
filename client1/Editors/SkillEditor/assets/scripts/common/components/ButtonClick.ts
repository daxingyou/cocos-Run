import {audioManager, SFX_TYPE} from "../../common/AudioManager"
const {ccclass, property} = cc._decorator;
@ccclass
export default class ButtonClick extends cc.Component{

    @property({
        displayName: "按钮声音", 
        tooltip:"按钮点击提示音",
        type: cc.AudioClip,
    })
    clickSound: cc.AudioClip = null;

    onLoad() {
        this.node.on(cc.Node.EventType.TOUCH_START,this.playClip, this);
    }

    playClip(){
       if (this.clickSound) {
            let audioStatus:any = audioManager.audioStatus;
            let audioId: number = cc.audioEngine.play(this.clickSound,false,audioStatus.audioVolume);
            cc.audioEngine.setFinishCallback(audioId, () => {
            });
        } else {
           audioManager.playSfx(SFX_TYPE.BUTTON_CLICK);
        }
        return true;
    }

};