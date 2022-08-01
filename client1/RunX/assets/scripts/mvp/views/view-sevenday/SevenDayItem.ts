const { ccclass, property } = cc._decorator;
@ccclass
export default class SevenDayItem extends cc.Component{
    @property(cc.Sprite) icon: cc.Sprite = null;

    private _functionId: number = 0;
    private _clickHandler: Function = null;

    get functionId() {
        return this._functionId;
    }

    set functionId(id: number){
        this._functionId = id;
    }

    setClickHandler (handler: Function) {
        this._clickHandler = handler;
    }
   
    onClickIcon () {
        this._clickHandler && this._clickHandler(this._functionId)
    }
}