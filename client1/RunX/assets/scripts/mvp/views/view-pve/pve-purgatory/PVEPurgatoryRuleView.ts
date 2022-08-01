import { configUtils } from "../../../../app/ConfigUtils";
import { ViewBaseComponent } from "../../../../common/components/ViewBaseComponent";
import { cfg } from "../../../../config/config";

const {ccclass, property} = cc._decorator;

@ccclass
export default class PVEPurgatoryRuleView extends ViewBaseComponent {

    @property(cc.Label) descContent: cc.Label = null;
    @property(cc.Node) content: cc.Node = null;

    onInit() {
        let dialogConfig: cfg.Dialog = configUtils.getDialogCfgByDialogId(99000066);
        if (dialogConfig && dialogConfig.DialogText) {
            this.descContent.string = dialogConfig.DialogText;
        }

        let self = this;
        this.scheduleOnce(() => {
            self.content.height = self.descContent.node.height;
        }, 0);
        
    }

    onBtnClose() {
        this.closeView();
    }
}
