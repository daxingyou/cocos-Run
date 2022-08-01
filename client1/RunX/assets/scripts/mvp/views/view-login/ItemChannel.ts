import { worldsvr } from "../../../network/lib/protocol";
import { svrConfig } from "../../../network/SvrConfig";
import { ChannelInfo } from "../../models/LoginData";

const { ccclass, property } = cc._decorator;

@ccclass
export default class ItemChannel extends cc.Component {
    @property(cc.Label)             channelNameLb: cc.Label = null;
    @property(cc.Sprite)            channelState: cc.Sprite = null;
    @property([cc.SpriteFrame])     stateSfs: cc.SpriteFrame[] = [];
    @property(cc.Node)              isNewNode: cc.Node = null;

    private _channelInfo: ChannelInfo = null;
    private _callFunc: Function = null;
    setData(channelInfo: ChannelInfo, callFunc: Function) {
        this._channelInfo = channelInfo;
        callFunc && (this._callFunc = callFunc);
        this.refreshView();
    }

    deInit() {
        this._callFunc = null; 
    }

    unuse() {
        this.deInit();
    }

    reuse() {

    }

    refreshView() {
        this.channelNameLb.string = `${this._channelInfo.name}`;
        // TODO 暂时去掉新服
        // this.isNewNode.active = this._channelInfo.state == CHANNEL_STATE.NEW;
        this.isNewNode.active = false;
        
        this.refreshState();
    }

    refreshState() {
        let sf = this.stateSfs[this._getState()];
        this.channelState.spriteFrame = sf;
    }

    onClickItem() {
        this._callFunc && this._callFunc(this._channelInfo.id);
    }

    private _getState(): worldsvr.ServerState {
        let find = svrConfig.fetchGamesvrs.find(_s => {
            return _s.GamesvrID == this._channelInfo.id;
        });
        if(find) {
            return find.State;
        }
        return worldsvr.ServerState.MAINTAIN;
    }
}
