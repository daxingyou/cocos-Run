import { gamesvr } from "../../../network/lib/protocol";

const { ccclass, property } = cc._decorator;

@ccclass
export default class ItemChatCtxSys extends cc.Component {
    @property(cc.Label)  textSys: cc.Label = null;
    @property(cc.Node)   layoutSys: cc.Node = null;
    @property(cc.Label)  lbTimeSys: cc.Label = null;
    
    @property(cc.Label)  lbTextCheck: cc.Label = null;
    @property(cc.Label)  lbTextCheckRS: cc.Label = null;

    private _info: gamesvr.IChatMessageNotify = null;

    initSystem (info: gamesvr.IChatMessageNotify) {
        let paddingX = 10; let paddingY = 7; let minHeight = 120;

        this._info = info;

        this.textSys.overflow = cc.Label.Overflow.NONE;
        this.lbTextCheck.string = info.Message;
        this.lbTextCheckRS.string = info.Message;

        //@ts-ignore
        this.lbTextCheck._forceUpdateRenderData();
         //@ts-ignore
        this.lbTextCheckRS._forceUpdateRenderData();

        if (this.lbTextCheck.node.width > 420) {
            this.textSys.overflow = cc.Label.Overflow.RESIZE_HEIGHT;

            this.textSys.node.width = 420;
            this.layoutSys.width = 440;
            this.layoutSys.height = this.lbTextCheckRS.node.height + paddingY * 2;
        } else {
            this.textSys.overflow = cc.Label.Overflow.NONE;
            this.layoutSys.width = this.lbTextCheck.node.width + paddingX * 2 + 10;
            this.layoutSys.height = this.lbTextCheck.node.height + paddingY * 2;
        }
        this.textSys.string = info.Message;
        this.lbTextCheck.string = "";
        this.lbTextCheckRS.string = ""
        this.lbTimeSys.string = this._transformDate(info.ReceivedTime * 1000);
        this.node.height = Math.max(minHeight, paddingY * 2 + this.textSys.node.height + 70);
    }

    deInit () {

    }

    onClickChat () {

    }
    
    /**
     * @desc 时间戳转时分秒时间
     * @param date 时间戳
     * @returns 
     */
    private _transformDate(date: number) {
        const time = new Date(date);
        let year = time.getFullYear();
        let month = time.getMonth() + 1;
        let day = time.getDate();
        let hours = time.getHours();
        let minutes = time.getMinutes();
        let seconds = time.getSeconds();
        let h = String(hours), m = String(minutes), s = String(seconds);
        if (hours < 10) { h = "0" + h; }
        if (minutes < 10) { m = "0" + m; }
        if (seconds < 10) { s = "0" + s; }
        return `${h}:${m}:${s}`
    }
}