import guiManager from "../../../common/GUIManager"
const {ccclass, property} = cc._decorator;

@ccclass
export default class GetAllRewardBtn extends cc.Component {
    @property(cc.SpriteFrame) bgNormalSf: cc.SpriteFrame = null;
    @property(cc.SpriteFrame) bgDisableSf: cc.SpriteFrame = null;
    @property(cc.Sprite) bgNode: cc.Sprite = null;
    @property(cc.Label) tipLabel: cc.Label = null;
    
    private _isGray: boolean = false;

    set gray(isGray: boolean){
        if(isGray == this._isGray) return;
        this._isGray = isGray;
        this._updateBgSf();
    }

    get gray(){
        return this._isGray;
    }

    start(){
        this._updateBgSf();
    }    

    private _updateBgSf(){
        let bgSp = this._isGray ? this.bgDisableSf : this.bgNormalSf;
        this.bgNode && bgSp && (this.bgNode.spriteFrame = bgSp);
    }

    showNotReward(){
        guiManager.showDialogTips(1000131);
    }
}
