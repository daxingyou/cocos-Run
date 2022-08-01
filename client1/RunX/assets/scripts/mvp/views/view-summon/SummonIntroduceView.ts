import { CustomDialogId } from "../../../app/AppConst";
import { configUtils } from "../../../app/ConfigUtils";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { configManager } from "../../../common/ConfigManager";
import { cfg } from "../../../config/config";

const { ccclass, property } = cc._decorator;

@ccclass
export default class SummonIntroduceView extends ViewBaseComponent {

    @property(cc.Label) intro: cc.Label = null;
    @property(cc.Label) tips: cc.Label = null;
    onInit () {
        this.showIntroduece();
    }

    showIntroduece(){
        let introCfg = configUtils.getDialogCfgByDialogId(CustomDialogId.SUMMON_TWENTY_INTRODUCE);
        let tipsCfg = configUtils.getDialogCfgByDialogId(CustomDialogId.SUMMON_TWENTY_TIPS);
        this.intro.string = introCfg ? introCfg.DialogText : "";
        this.tips.string = tipsCfg ? tipsCfg.DialogText : "";
    }
}