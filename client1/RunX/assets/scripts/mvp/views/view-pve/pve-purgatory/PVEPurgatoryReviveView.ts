import { CustomDialogId } from "../../../../app/AppConst";
import { utils } from "../../../../app/AppUtils";
import { configUtils } from "../../../../app/ConfigUtils";
import { ViewBaseComponent } from "../../../../common/components/ViewBaseComponent";
import { eventCenter } from "../../../../common/event/EventCenter";
import { purgatoryEvent } from "../../../../common/event/EventData";
import guiManager from "../../../../common/GUIManager";
import { cfg } from "../../../../config/config";
import { bagData } from "../../../models/BagData";
import { pveTrialData } from "../../../models/PveTrialData";
import { serverTime } from "../../../models/ServerTime";
import { pveDataOpt } from "../../../operations/PveDataOpt";
import PVEPurgatoryView from "./PVEPurgatoryView";

const {ccclass, property} = cc._decorator;

@ccclass
export default class PVEPurgatoryReviveView extends ViewBaseComponent {
    
    @property(cc.Label) descContent: cc.Label = null;
    @property(cc.Label) labelRestCount: cc.Label = null;
    @property(cc.Label) labelCountDown: cc.Label = null;

    root: PVEPurgatoryView = null;

    onInit(root: PVEPurgatoryView) {
        this.root = root;

        this.refreshView();

        eventCenter.register(purgatoryEvent.REVIVE_SUCCESS, this, this.onReviveSuccess);
        eventCenter.register(purgatoryEvent.REFRESH_VIEW, this, this.refreshView);
    }

    onRelease() {
        this.root.removeCountDown([this.labelCountDown]);
        eventCenter.unregisterAll(this);
    }

    refreshView() {
        let self = this;

        let moduleConfig: cfg.ConfigModule = configUtils.getModuleConfigs();
        let itemConfig = configUtils.getItemConfig(moduleConfig.PVEInfernalResurrectionItem);
        
        let dialogConfig: cfg.Dialog = configUtils.getDialogCfgByDialogId(99000074);
        if (dialogConfig != null) {
            this.descContent.string = utils.convertFormatString(dialogConfig.DialogText, [{itemname: itemConfig.ItemName}]);
        }

        this.labelRestCount.string = `剩余数量：${bagData.getItemCountByID(moduleConfig.PVEInfernalResurrectionItem)}`;

        let lastTime: number = utils.longToNumber(pveTrialData.purgatoryData.FreeReliveTime);
        let restTime: number = lastTime + configUtils.getModuleConfigs().PVEInfernalResurrectionFreeCD - serverTime.currServerTime();
        if (restTime <= 0) {
            this.labelCountDown.string = "本次免费";
        } else {
            this.root.addCountDown(this.labelCountDown, {
                endTime: lastTime + configUtils.getModuleConfigs().PVEInfernalResurrectionFreeCD,
                callback: () => {
                    self.labelCountDown.string = "本次免费";
                    self.root.removeCountDown([self.labelCountDown]);
                },
                templateStr: "%time后免费"
            })
        }
    }

    onBtnClose() {
        this.closeView();
    }

    onBtnYes() {
        // 所有英雄存活且满血，则不需复活
        let needRevive: boolean = pveTrialData.getPurgatoryHeroes().some((hero) => { return hero.HPPercent < 10000; });
        if (!needRevive) {
            guiManager.showDialogTips(1000142);
            return;
        }

        // 是否能免费复活，不能则消耗仙丹
        let lastTime: number = utils.longToNumber(pveTrialData.purgatoryData.FreeReliveTime);
        let restTime: number = lastTime + configUtils.getModuleConfigs().PVEInfernalResurrectionFreeCD - serverTime.currServerTime();
        if (restTime <= 0) {
            pveDataOpt.reqTrialPurgatoryRelive();
        } else {
            let itemID: number = configUtils.getModuleConfigs().PVEInfernalResurrectionItem;
            let itemCount: number = bagData.getItemCountByID(itemID);
            if (itemCount > 0) {
                pveDataOpt.reqTrialPurgatoryRelive();
            } else {
                guiManager.showDialogTips(CustomDialogId.COMMON_ITEM_NOT_ENOUGH, itemID);
            }
        }
    }

    onReviveSuccess() {
        guiManager.showDialogTips(1000143);
    }
}
