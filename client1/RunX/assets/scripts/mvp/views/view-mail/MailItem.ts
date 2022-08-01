import { data } from "../../../network/lib/protocol";
import { serverTime } from "../../models/ServerTime";

/*
 * @Description:
 * @Version: 1.0
 * @Autor: lixu
 * @Date: 2022-04-25 10:36:08
 * @LastEditors: lixu
 * @LastEditTime: 2022-04-25 10:46:42
 */
const { ccclass, property } = cc._decorator;

@ccclass
export default class MailItem extends cc.Component {
    @property(cc.Node) mailChosen: cc.Node = null;
    @property(cc.Label) mailName: cc.Label = null;
    @property(cc.Node) readState: cc.Node = null;
    @property(cc.Node) readBg: cc.Node = null;
    @property(cc.Node) normalState: cc.Node = null;
    @property(cc.Node) enclosureState: cc.Node = null;
    @property(cc.Label) overTime: cc.Label = null;
    @property(cc.Node) newIcon: cc.Node = null;

    private _mailItem :data.IMailItem = null;
    onInit(data: data.IMailItem) {
        this._mailItem = data;
        this._updateUI();
    }

    private _updateUI(){
        let data = this._mailItem;
          //选中状态，在selecetRender里处理
        this.mailChosen.active = false;
        let existPrize = data.Prizes && data.Prizes.length > 0;
        this.mailName.string = data.Title;
        this.readState.active = data.Readed || data.TakenOut;
        this.readBg.active = data.Readed || data.TakenOut;
        this.normalState.active = !data.Readed && !data.TakenOut;
        this.enclosureState.active = existPrize && !data.TakenOut;
        this,this.newIcon.active = existPrize ? !data.TakenOut : !data.Readed;

        let remianTime = (data.ExpireTime - serverTime.currServerTime());
        let inComingDelete = (remianTime < 24 * 3600);
        let day = Math.floor(remianTime / (24 * 3600));
        this.overTime.getComponent(cc.Label).string = inComingDelete ? "即将删除" : `${day}天后删除`;
    }

    reuse(...rest: any){

    }

    deInit(){
        this._mailItem = null;
    }

    unuse(){
        this.deInit()
    }

}
