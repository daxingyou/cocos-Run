import { VIEW_NAME } from "../../../../app/AppConst";
import { utils } from "../../../../app/AppUtils";
import { configUtils } from "../../../../app/ConfigUtils";
import { configManager } from "../../../../common/ConfigManager";
import guiManager from "../../../../common/GUIManager";
import { cfg } from "../../../../config/config";
import { data } from "../../../../network/lib/protocol";
import { pveTrialData } from "../../../models/PveTrialData";
import { pveDataOpt } from "../../../operations/PveDataOpt";
import MessageBoxView from "../../view-other/MessageBoxView";
import PVEPurgatoryView from "./PVEPurgatoryView";

const {ccclass, property} = cc._decorator;

@ccclass
export default class ItemPurgatoryMap extends cc.Component {
    @property([cc.SpriteFrame]) contentSpriteFrames: cc.SpriteFrame[] = [];         // 内容资源
    @property([cc.SpriteFrame]) coverSpriteFrames: cc.SpriteFrame[] = [];           // 覆盖资源
    @property([cc.SpriteFrame]) floorSpriteFrames: cc.SpriteFrame[] = [];           // 地板资源

    @property(cc.Sprite) floor: cc.Sprite = null;
    @property(cc.Sprite) content: cc.Sprite = null;
    @property(cc.Sprite) cover: cc.Sprite = null;
    @property(cc.Sprite) previewContent: cc.Sprite = null;

    pointInfo: data.ITrialPointInfo;
    root: PVEPurgatoryView;

    init(pointInfo: data.ITrialPointInfo, root: PVEPurgatoryView, floorIdx: number, coverIdx: number) {
        if (pointInfo == null) {
            this.floor.node.active = false;
            this.content.node.active = false;
            this.cover.node.active = false;
            this.previewContent.node.active = false;

            this.pointInfo = null;
            return;
        }

        this.pointInfo = pointInfo;
        this.root = root;

        // 地板 和 覆盖
        this.floor.spriteFrame = this.floorSpriteFrames[floorIdx];
        this.cover.spriteFrame = this.coverSpriteFrames[coverIdx];

        if (pointInfo.Status === data.TrialPointInfo.PointStatus.PSPreView) {
            this.previewContent.node.active = true;
        } else if (pointInfo.Status === data.TrialPointInfo.PointStatus.PSUnMask) {
            this.cover.node.active = false;
        }

        // 内容 和 预览
        this.content.spriteFrame = this.contentSpriteFrames[pointInfo.Type];
        this.previewContent.spriteFrame = this.contentSpriteFrames[pointInfo.Type];
    }

    deInit() {
        this.floor.node.active = true;
        this.content.node.active = true;
        this.cover.node.active = true;
        this.previewContent.node.active = false;
        
        this.pointInfo = null;
    }

    onClick() {
        if (this.pointInfo == null) {
            return;
        }

        let typeEnum = data.TrialPointInfo.PointType;
        let statusEnum = data.TrialPointInfo.PointStatus;

        // 翻开的情况下，弹出对应的弹窗
        if (this.pointInfo.Status === statusEnum.PSUnMask) {
            switch (this.pointInfo.Type) {
                case typeEnum.PTShop:
                    // 商店
                    guiManager.loadView(VIEW_NAME.SHOP_PURGATORY_VIEW, this.root.node, this.pointInfo.PointUID, this.pointInfo.PointID, this.root);
                    break;
                case typeEnum.PTHPAltar:
                    // 泉水
                    guiManager.loadView(VIEW_NAME.SPRING_PURGATORY_VIEW, this.root.node, this.pointInfo.PointUID);
                    break;
                case typeEnum.PTLiveAltar:
                    // 祭坛
                    guiManager.loadView(VIEW_NAME.ALTAR_PURGATORY_VIEW, this.root.node, this.pointInfo.PointUID);
                    break;
                case typeEnum.PTMonster:
                case typeEnum.PTBoss:
                    // 战斗
                    guiManager.loadView(VIEW_NAME.MONSTER_PURGATORY_VIEW, this.root.node, this.pointInfo, this.root.battleBg);
                    break;
                case typeEnum.PTTransGate:
                    // 传送门
                    guiManager.loadView(VIEW_NAME.PORTAL_PURGATORY_VIEW, this.root.node, this.pointInfo.PointUID);
                    break;
            }

            return;
        }

        // 达到最大翻块数量时，禁止
        let unmaskCount: number = 0;
        pveTrialData.purgatoryData.Points.forEach((point) => {
            if (point.Status === statusEnum.PSUnMask) {
                unmaskCount += 1;
            }
        });
        let moduleConfig = configUtils.getModuleConfigs();
        if (unmaskCount >= moduleConfig.PVEInfernalOpenMax) {
            let dialogConfig: cfg.Dialog = configUtils.getDialogCfgByDialogId(1000144);
            guiManager.showTips(utils.convertFormatString(dialogConfig.DialogText, [{num: moduleConfig.PVEInfernalOpenMax}]));
            return;
        }

        // 未翻开的情况下，请求翻开
        if (this.pointInfo.Status === statusEnum.PSMask ||
            this.pointInfo.Status === statusEnum.PSPreView) {

            pveDataOpt.reqTrialPurgatoryUnmask(this.pointInfo.PointUID);
        }
    }
}
