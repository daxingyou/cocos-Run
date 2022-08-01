import { utils } from "../../../../app/AppUtils";
import { configUtils } from "../../../../app/ConfigUtils";
import { ViewBaseComponent } from "../../../../common/components/ViewBaseComponent";
import { configManager } from "../../../../common/ConfigManager";
import guiManager from "../../../../common/GUIManager";
import { cfg } from "../../../../config/config";
import { pveTrialData } from "../../../models/PveTrialData";
import { userData } from "../../../models/UserData";
import { pveDataOpt } from "../../../operations/PveDataOpt";

const {ccclass, property} = cc._decorator;

@ccclass
export default class PortalPurgatoryView extends ViewBaseComponent {
    @property(cc.Label) descContent: cc.Label = null;

    private _pointUID: number;

    onInit(pointUID: number) {
        this._pointUID = pointUID;

        this.descContent.string = configUtils.getDialogCfgByDialogId(2000024).DialogText;
    }

    onBtnClose() {
        this.closeView();
    }

    onBtnYes() {
        let basicConfigs: {[key: number]: cfg.PVEInfernalBasic} = configManager.getConfigs("pveInfernalBasic");
        let curStorey = pveTrialData.getPurgatoryCurStorey();
        let nextBasicConfig: cfg.PVEInfernalBasic = basicConfigs[curStorey+1];

        if (nextBasicConfig == null) {
            // 到达最后一层
            guiManager.showDialogTips(1000150);
            return;
        } else if (userData.lv < nextBasicConfig.PVEInfernalBasicOpenLevel) {
            // 未达等级限制
            let dialogConfig: cfg.Dialog = configUtils.getDialogCfgByDialogId(1000092);
            let tips = utils.convertFormatString(dialogConfig.DialogText, [{d: nextBasicConfig.PVEInfernalBasicOpenLevel}]);
            guiManager.showTips(tips);
            return;
        }
        pveDataOpt.reqTrialPurgatoryTransgate(this._pointUID);
        this.closeView();
    }

}
