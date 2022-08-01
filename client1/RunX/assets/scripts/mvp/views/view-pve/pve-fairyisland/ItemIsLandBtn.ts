import { eventCenter } from "../../../../common/event/EventCenter";
const {ccclass, property} = cc._decorator;
@ccclass
export default class ItemIsLandBtn extends cc.Component {

    @property(cc.Label) btnTitle: cc.Label = null;
    @property(cc.Label) freeLabel: cc.Label = null;
    @property(cc.Label) remainLabel: cc.Label = null;

    private _remainNum: number = 0;
    private _freeNum: number = null;
    private _clickFunc: Function = null;

    /**
     * 
        @param remainNum 剩余数量 ;
        @param freeNum 免费次数 ;
        @param btnTitle 按钮标题 ;
        @param clickFunc 点击事件 ;
     */
    onInit(pram:{remainNum?:number,freeNum?:number,btnTitle?:string,clickFunc?:Function}): void {
        pram.clickFunc && (this._clickFunc = pram.clickFunc);
        this._freeNum = pram.freeNum;
        this._remainNum = pram.remainNum;
        pram.btnTitle && (this.btnTitle.string = pram.btnTitle);
        this._initView();
    }

    /**item释放清理*/
    deInit() {
        this._clickFunc = null;
       eventCenter.unregisterAll(this);
    }

    private _initView() {    
        this.freeLabel.node.active = !!this._freeNum;
        this.remainLabel.node.active = !!this._remainNum;
        this.remainLabel.string = `剩余数量${this._remainNum}`;
    }
    
    itemClick() {
        this._clickFunc && this._clickFunc();
    }
}