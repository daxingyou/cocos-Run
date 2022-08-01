import { Channel_Max_Num } from "../../../app/AppConst";
import { eventCenter } from "../../../common/event/EventCenter";

const { ccclass, property } = cc._decorator;

@ccclass
export default class ItemBigChannel extends cc.Component {
    @property(cc.Label)                             channelNameLb: cc.Label = null;
    @property(cc.Node)                              selectBg: cc.Node = null;

    private _index: number = -1;                // 当前大平台选择Index
    setData(index: number) {
        this._index = index;
        this.refreshView();
    }

    deInit() {
        eventCenter.unregisterAll(this);
    }

    unuse() {
        this.deInit();
    }

    reuse() {

    }

    refreshView() {
        if(this._index == 0) {
            this.channelNameLb.string = '推荐服务器';
        } else {
            this.channelNameLb.string = `${(this._index - 1) * Channel_Max_Num + 1}-${(this._index - 1) * Channel_Max_Num + 20}`;
        }
    }
    
}
  
