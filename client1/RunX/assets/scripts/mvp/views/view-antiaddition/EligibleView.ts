import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { eventCenter } from "../../../common/event/EventCenter";
import { loginEvent, netEvent } from "../../../common/event/EventData";

const { ccclass, property } = cc._decorator;

@ccclass
export default class EligibleView extends ViewBaseComponent{
   // null

   onInit () {
      eventCenter.register(netEvent.NET_LOGIN_FAIL, this, this.closeView);
      eventCenter.register(netEvent.NET_CHECK_ACC_RES, this, this._recvFetchRes);

      eventCenter.register(loginEvent.SDK_INIT_COMPLETE, this, this.closeView);
      eventCenter.register(loginEvent.SDK_LOGIN_SUCC, this, this.closeView);
      eventCenter.register(loginEvent.SDK_LOGIN_FAIL, this, this.closeView);
      eventCenter.register(loginEvent.SDK_AUTH, this, this.closeView);
   }

   onRelease () {
      eventCenter.unregisterAll(this)
   }

   private _recvFetchRes (cmd: number, succ: boolean, errdesc: string) {
      this.closeView()
   }
}