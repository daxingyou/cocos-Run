import guiManager from "../GUIManager";

const {ccclass, property} = cc._decorator;

const CAMERA_NAME = "UISnapCamera";
let POP_ACTION_TAG = 0;

@ccclass
export default class PopAction extends cc.Component {
    @property(cc.Boolean)       isShowOpenAction: boolean = false;

    private _iShowCloseAction: boolean = false;

    private _openInTime: number = 0.1;
    private _closeOutTime: number = 0.1;
    private _cb: Function = null;
    private _curAction: cc.Action = null;

    set isShowCloseAction(useAction: boolean){
        this._iShowCloseAction = useAction;
    }


    showOpenAction(initFunc?: Function) {
        this._reset();
        this._iShowCloseAction = true;
        if(this.isShowOpenAction) {
            this._cb = initFunc;
            let preScale: cc.Vec2 = cc.v2(this.node.scaleX, this.node.scaleY);
            this.node.setScale(cc.v2(0, 0));
            let curAction = cc.sequence(
                  cc.callFunc(() => {
                      this._cb && this._cb();
                      this._cb = null;
                  }, this),
                  cc.scaleTo(this._openInTime, preScale.x, preScale.y).easing(cc.easeOut(1)),
                  cc.callFunc(() => {
                      this._curAction && this.node.stopAction(this._curAction);
                      this._curAction = null;
                  }, this)
              );
            this._curAction = this.node.runAction(curAction);
        } else {
            initFunc && initFunc();
        }
    }

    showCloseAction(endCb?: Function) {
        this._reset();
        if(!this._iShowCloseAction){
            endCb && endCb();
            return;
        }
        this._cb = endCb;
        this._curAction = this.node.runAction(cc.sequence(
            cc.fadeOut(this._closeOutTime).easing(cc.easeIn(1)),
            cc.callFunc(() => {
                this._cb && this._cb();
                this._cb = null;
                this._curAction && this.node.stopAction(this._curAction);
                this._curAction = null;
            }, this)
        ));
    }

    private _reset(){
        this._curAction && this.node.stopAction(this._curAction);
        this._curAction = null;
        this._cb = null;
    }

    onDestroy(){
        this._reset();
    }
}
