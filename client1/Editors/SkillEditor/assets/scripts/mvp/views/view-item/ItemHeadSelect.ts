const {ccclass, property} = cc._decorator;

@ccclass
export default class ItemHeadSelect extends cc.Component {
    @property(cc.Sprite)     sprHead: cc.Sprite = null;

    private _heroId: number = 0;
    private _clickHandler: (heroId: number)=> {};
    
    init (heroId: number, clickHandler: ()=> {}) {
        this._heroId = heroId;
        this._clickHandler = clickHandler;
        this.node.active = true;
    }

    deInit () {
      
    }

    onClickHead () {
        this._clickHandler && this._clickHandler(this._heroId);
    }


}