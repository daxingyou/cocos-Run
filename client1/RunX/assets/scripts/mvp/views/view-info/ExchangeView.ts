import { CustomDialogId, VIEW_NAME } from "../../../app/AppConst";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { eventCenter } from "../../../common/event/EventCenter";
import { useInfoEvent } from "../../../common/event/EventData";
import guiManager from "../../../common/GUIManager";
import { data } from "../../../network/lib/protocol";
import { userOpt } from "../../operations/UserOpt";

const { ccclass, property } = cc._decorator;

@ccclass
export default class ExchangeView extends ViewBaseComponent {

    @property(cc.Node) confirmButton: cc.Node = null;
    @property(cc.EditBox) inputArea: cc.EditBox = null;

    onInit() {
        eventCenter.register(useInfoEvent.USE_EXCHANGE_CODE, this, this.onRecvUseExchangeCode)
    }

    onRelease(){
        eventCenter.unregisterAll(this);
    }

    onExchangeClick(event: cc.Event, customEventData: number) {
        let seriesNum: string = this.inputArea.string;
        userOpt.useExchangeCode(seriesNum);
    }

    onClickPaste() {
        guiManager.showLockTips();
    }

    onRecvUseExchangeCode(cmd: any, prizes: data.IItemInfo[]){
        if (prizes && prizes.length) {
            guiManager.showDialogTips(CustomDialogId.INFO_EXCHANGE);
            this.loadSubView(VIEW_NAME.GET_ITEM_VIEW, prizes);
            this.inputArea.string = ""
        }
    }

}
