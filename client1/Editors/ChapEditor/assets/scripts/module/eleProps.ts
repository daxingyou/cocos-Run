// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html
import {PROP_MSG} from "../const/const";
const {ccclass, property} = cc._decorator;
enum NodeType{
    "SMALL_TYPE",
    "BIG_TYPE"
}

@ccclass
export default class eleProps extends cc.Component {

    @property(cc.EditBox) offsetX: cc.EditBox = null;
    @property(cc.EditBox) offsetY: cc.EditBox = null;
    @property(cc.EditBox) type: cc.EditBox = null;
    @property(cc.EditBox) heroID: cc.EditBox = null;
    @property(cc.Label) nodeID: cc.Label = null;
    @property(cc.Toggle) checkBox: cc.Toggle = null;

    private _offX:number = 0;
    private _offY:number = 0;
    private _NodeId:number = 0;
    private _heroName:string = "";
    private _type:NodeType = NodeType.SMALL_TYPE;

    get offX(){
        return this._offX;
    }

    get offY(){
        return this._offY;
    }

    set offX(val:number){
        this._offX = val;
        this.offsetX.string = String(val);
    }
    
    set offY(val:number){
        this._offY = val;
        this.offsetY.string = String(val);
    }

    set heroName(val:string){
        this._heroName = val;
        this.heroID.string = String(val);
    } 
    
    set nodeId(val:number){
        this._NodeId = val;
        this.nodeID.string = `关卡编号: ${String(val)}`;
    } 
    
    set nodeType(val:number){
        this._type = val;
        this.type.string = String(val);
    } 

    set reverse(val:boolean){
        this.checkBox.isChecked = val;
    }
    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    start () {

    }

    onEditInputEnd(target:cc.EditBox,customEvevtData:string){
        let input:string = target.string;
        if(!Number(input) && Number(input)!=0){
            switch(customEvevtData){
                case "x":
                    this.offsetX.string ="0";
                    break;
                case "y":
                    this.offsetY.string ="0";
                    break
                case "hero":
                    this.heroID.string = "";
                    break
                case "type":
                    this.type.string = "0";
                    break;
                default:
                    break;
            }
            cc.warn("不能设置非数字的坐标偏移！");
            return;
        }else{
            switch(customEvevtData){
                case "x":
                    this._offX = Number(input);
                    this.sendProps2Container(target.node,PROP_MSG.X_CHANGERD);
                    break;
                case "y":
                    this._offY = Number(input);
                    this.sendProps2Container(target.node,PROP_MSG.Y_CHANGERD);
                    break
                case "hero":
                    this._heroName = (input);
                    this.sendProps2Container(target.node,PROP_MSG.H_CHANGERD);
                    break
                case "type":
                    this._type = Number(input);
                    this.sendProps2Container(target.node,PROP_MSG.T_CHANGERD);
                    break;
                default:
                    break;
            }
        }
    }

    onRevertToggleChecked(target:cc.Toggle,customEvevtData:string){
        let checkState:boolean = target.isChecked;
        this.sendProps2Container(target.node,PROP_MSG.R_CHANGERD);
    }

    sendProps2Container(fromNode:cc.Node,eventName:string){
        fromNode.dispatchEvent(new cc.Event.EventCustom(eventName,true));
    }
    // update (dt) {}
}
