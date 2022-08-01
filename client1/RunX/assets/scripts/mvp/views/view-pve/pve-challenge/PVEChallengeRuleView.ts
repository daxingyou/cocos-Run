import { CustomDialogId } from "../../../../app/AppConst";
import { ViewBaseComponent } from "../../../../common/components/ViewBaseComponent";
import { configManager } from "../../../../common/ConfigManager";
import { cfg } from "../../../../config/config";

const {ccclass, property} = cc._decorator;

@ccclass
export default class PVEChallengeRuleView extends ViewBaseComponent {

    @property(cc.Label) descContent: cc.Label = null;

    onInit(dialogId?: number): void {
        this.initRule(dialogId);
    }

    // 显示Dialog玩法说明
    initRule(dialogId?: number) {
        let ruleDialogID = dialogId ? dialogId : CustomDialogId.PVE_CHANLLENGE_RULE_CONTENT;
        let contentDialog: cfg.Dialog = configManager.getConfigByKey("dialogue", ruleDialogID);
        if (contentDialog && contentDialog.DialogText) {
            this.descContent.string = contentDialog.DialogText;
        }
    }

    // 关闭按钮
    onClickBtnClose() {
        this.closeView();
    }
}
