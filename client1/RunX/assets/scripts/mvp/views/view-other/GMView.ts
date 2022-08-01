import { utils } from "../../../app/AppUtils";
import { configUtils } from "../../../app/ConfigUtils";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { configManager } from "../../../common/ConfigManager";
import guiManager from "../../../common/GUIManager";
import { cfg } from "../../../config/config";
import { data } from "../../../network/lib/protocol";
import { pveData } from "../../models/PveData";
import { pveTrialData } from "../../models/PveTrialData";
import { gmOpt } from "../../operations/GMOpt";

const { ccclass, property } = cc._decorator

@ccclass
export default class GMView extends ViewBaseComponent {
    @property(cc.EditBox) editItem: cc.EditBox = null;
    @property(cc.EditBox) editItemCount: cc.EditBox = null;
    @property(cc.EditBox) editGoldCount: cc.EditBox = null;
    @property(cc.EditBox) editDiamondCount: cc.EditBox = null;
    @property(cc.EditBox) editPLCount: cc.EditBox = null;
    @property(cc.EditBox) editHeroId: cc.EditBox = null;
    @property(cc.EditBox) editHeroCount: cc.EditBox = null;
    @property(cc.EditBox) editEquipmentId: cc.EditBox = null;
    @property(cc.EditBox) editEquipmentCount: cc.EditBox = null;
    @property(cc.EditBox) editPrizeContent: cc.EditBox = null;
    @property(cc.EditBox) editDreamPassContent: cc.EditBox = null;
    @property(cc.EditBox) editAdverturePassContent: cc.EditBox = null;
    @property(cc.EditBox) editPurgatoryPassContent: cc.EditBox = null;

    onInit() {
        this.editItemCount.string = '1';
        this.editGoldCount.string = '1';
        this.editDiamondCount.string = '1';
        this.editPLCount.string = '1';
        this.editHeroCount.string = '1';
        this.editEquipmentCount.string = '1';
    }

    onRelease() {

    }

    onClickItem() {
        let itemId = this.editItem.string;
        if (itemId && parseInt(itemId)) {
            let itemCfg = configManager.getConfigByKey('item', parseInt(itemId));
            if (!itemCfg) {
                guiManager.showTips(`没有找到道具配置，itemId = ${itemId}`);
            } else {
                let countStr = this.editItemCount.string;
                let count = parseInt(countStr) || 1;
                gmOpt.getItemReq(parseInt(itemId), count);
            }
        } else {
            guiManager.showTips(`请输入正确的ID`);
        }
    }

    onClickGold() {
        let countStr = this.editGoldCount.string;
        let count = parseInt(countStr) || 1;
        gmOpt.getItemReq(10010001, count);
    }

    onClickDiamond() {
        let countStr = this.editDiamondCount.string;
        let count = parseInt(countStr) || 1;
        gmOpt.getItemReq(10010002, count);
    }

    onClickPL() {
        let countStr = this.editPLCount.string;
        let count = parseInt(countStr) || 1;
        gmOpt.getItemReq(10010003, count);
    }

    onClickHero() {
        let heroId = this.editHeroId.string;
        if (heroId && parseInt(heroId)) {
            let itemCfg = configManager.getConfigByKey('heroBasic', parseInt(heroId));
            if (!itemCfg) {
                guiManager.showTips(`没有找到英雄配置，heroId = ${heroId}`);
            } else {
                let countStr = this.editHeroCount.string;
                let count = parseInt(countStr) || 1;
                gmOpt.getItemReq(parseInt(heroId), count);
            }
        } else {
            guiManager.showTips(`请输入正确的ID`);
        }
    }

    onClickEquipment() {
        let itemId = this.editEquipmentId.string;
        if(!itemId || itemId.length == 0 || isNaN(parseInt(itemId))) {
            guiManager.showTips(`请输入正确的ID`);
            return;
        }

        let itemID = parseInt(itemId);
        let equipCfg = configManager.getConfigByKey('equip', itemID);
        equipCfg = equipCfg || configUtils.getBeastConfig(itemID);

        if(!equipCfg) {
            guiManager.showTips(`没有找到道具配置，itemId = ${itemId}`);
            return;
        }

        let countStr = this.editEquipmentCount.string;
        let Count = parseInt(countStr);
        Count = isNaN(Count) ? 1 : Count;
        gmOpt.getItemReq(itemID, Count);
    }

    onClickMail(){
        let prizes: data.IItemInfo[] = [];
        utils.parseStingList(this.editPrizeContent.string).forEach((prize: string[])=>{
            if (prize && prize.length == 2){
                prizes.push({
                    ID: parseInt(prize[0]),
                    Count: parseInt(prize[1]),
                });
            }
        });

        gmOpt.sendAddMailReq(prizes);
    }

    onClickPassDream(){
        let dreamID = parseInt(this.editDreamPassContent.string); 
        let cfg = configUtils.getDreamLandLessonConfig(dreamID)
        if (!cfg) {
            guiManager.showTips("找不到配置，请查看dream lesson表")
            return;
        } 

        let record = pveData.dreamRecords[dreamID]
        if (record && record.Past) {
            guiManager.showTips("已经通关没必要再作弊了")
            return;
        }
        gmOpt.reqCheatFinishPve(dreamID)
    }

    onClickPassAdverture(){
        let advertureID = parseInt(this.editAdverturePassContent.string); 
        let cfg = configUtils.getLessonConfig(advertureID)
        if (!cfg) {
            guiManager.showTips("找不到配置，请查看adverture lesson表")
            return;
        } 

        let record = pveData.records[advertureID]
        if (record && record.Past) {
            guiManager.showTips("已经通关没必要再作弊了")
            return;
        }
        gmOpt.reqCheatFinishPve(advertureID)
    }

    onClickPassPurgatory(){
        let purgatoryID = parseInt(this.editPurgatoryPassContent.string); 
        let cfg: cfg.PVEInfernalBasic = configManager.getConfigByKey("pveInfernalBasic", purgatoryID);
        if (!cfg) {
            guiManager.showTips("找不到配置，请查看pveInfernalBasic表")
            return;
        } 

        let record = pveTrialData.purgatoryData;
        if (!record || record.Progress >= cfg.PVEInfernalBasicLevelOrder) {
            guiManager.showTips("已经通关没必要再作弊了");
            return;
        }
        gmOpt.reqCheatFinishTrialPurgatory(cfg.PVEInfernalBasicLevelOrder)
    }
}