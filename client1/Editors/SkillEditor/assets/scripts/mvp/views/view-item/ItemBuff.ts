import { configUtils } from "../../../app/ConfigUtils";
import { BuffResult } from "../../../game/CSInterface";

const {ccclass, property} = cc._decorator;

@ccclass
export default class ItemBuff extends cc.Component {
    @property(cc.Label)      lbName: cc.Label = null;
    
    private _buff: BuffResult = null;

    init (buff: BuffResult) {
        this._buff = buff
        let cfg = configUtils.getBuffConfig(buff.BuffId);
        this.lbName.string = cfg.Name;
    }

    deInit () {
        
    }

    get buff () {
        return this._buff;
    }
}