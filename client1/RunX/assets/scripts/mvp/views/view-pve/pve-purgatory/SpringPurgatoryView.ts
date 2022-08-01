import { configUtils } from "../../../../app/ConfigUtils";
import { ViewBaseComponent } from "../../../../common/components/ViewBaseComponent";
import { pveDataOpt } from "../../../operations/PveDataOpt";

const {ccclass, property} = cc._decorator;

@ccclass
export default class SpringPurgatoryView extends ViewBaseComponent {

    pointUID: number;

    @property(cc.Label) descContent: cc.Label = null;

    onInit(pointUID: number) {
        this.pointUID = pointUID;

        this.descContent.string = configUtils.getDialogCfgByDialogId(99000073).DialogText;
    }

    onBtnClose() {
        this.closeView();
    }

    onBtnYes() {
        pveDataOpt.reqTrialPurgatoryHpAltar(this.pointUID);
        this.closeView();
    }
}
