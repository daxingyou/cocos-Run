import {PROP_MSG} from "../const/const"
const {ccclass, property} = cc._decorator;

@ccclass
export default class chapProp extends cc.Component {

    @property(cc.Label) totalStr: cc.Label = null;
    @property(cc.Label) smallStr: cc.Label = null;
    @property(cc.Label) bigStr: cc.Label = null;
    
    @property(cc.EditBox) width: cc.EditBox = null;
    @property(cc.EditBox) height: cc.EditBox = null;

    private _totalCnt:number = 0;
    private _smallCnt:number = 0;
    private _bigCnt:number = 0;
    // LIFE-CYCLE CALLBACKS:

    get totalCnt(){return this._totalCnt;}
    get bigCnt(){return this._bigCnt;}
    get smallCnt(){return this._smallCnt;}

    set totalCnt(val:number){
        this._totalCnt = val;
        this.totalStr.string = `总关卡: ${val}`;
    }

    set bigCnt(val:number){
        this._bigCnt = val;
        this.bigStr.string = `大关卡: ${val}`;
    }

    set smallCnt(val:number){
        this._smallCnt = val;
        this.smallStr.string = `小关卡: ${val}`;
    }

    set cWidth(val:number){
        this.width.string = String(val);
    }

    set cHeight(val:number){
        this.height.string = String(val);
    }
    // onLoad () {}

    start () {

    }
    onEditInputEnd(target:cc.EditBox,customEvevtData:string){
        if(!Number(target.string)) target.string = String(customEvevtData=="h" ? 720 : 1280); 
        let eventName: string = customEvevtData=="h" ? PROP_MSG.H_CHANGED : PROP_MSG.W_CHANGED;
        target.node.dispatchEvent(new cc.Event.EventCustom(eventName,true));
    }
    // update (dt) {}
}
