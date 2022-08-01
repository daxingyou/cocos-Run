import { CustomDialogId } from "../../../app/AppConst";
import { EQUIP_PART_TYPE } from "../../../app/AppEnums";
import { utils } from "../../../app/AppUtils";
import { bagDataUtils } from "../../../app/BagDataUtils";
import { configUtils } from "../../../app/ConfigUtils";
import List from "../../../common/components/List";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { eventCenter } from "../../../common/event/EventCenter";
import { heroViewEvent } from "../../../common/event/EventData";
import guiManager from "../../../common/GUIManager";
import { cfg } from "../../../config/config";
import { data } from "../../../network/lib/protocol";
import { bagData } from "../../models/BagData";
import { bagDataOpt } from "../../operations/BagDataOpt";
import { Equip } from "../../template/Equip";
import HeroUnit from "../../template/HeroUnit";
import EquipProps from "../view-bag/EquipProps";
import ItemBag from "../view-item/ItemBag";
import { MsgboxInfo } from "../view-other/MessageBoxView";
import EquipBasicInfoView from "./EquipBasicInfoView";


const { ccclass, property } = cc._decorator;

@ccclass
export default class EquipsListView extends ViewBaseComponent {
    @property(List)                         equipsList: List = null;
    @property(cc.Node)                      equipItemsParent: cc.Node = null;
    // 装备信息区域
    @property(cc.Node)                      equipInfoView: cc.Node = null;
    @property(EquipBasicInfoView)           equipBasicInfoCmp: EquipBasicInfoView = null;
    @property(EquipProps)                   equipPropsNode: EquipProps = null;
    @property(cc.Node)                      dressBtn: cc.Node = null;
    @property(cc.Node)                      replaceBtn: cc.Node = null;
    @property(cc.Node)                      unDressBtn: cc.Node = null;
    @property(cc.Node)                      sortNode: cc.Node = null;
    @property(cc.Node)                      emptyNode: cc.Node = null;


    private _equipPartType: EQUIP_PART_TYPE = null;
    private _equips: data.IBagUnit[] = [];
    private _equip: data.IBagUnit = null;
    private _curShowEquip: data.IBagUnit = null;
    private _heroId: number = null;
    private _filterData: number = 1;
    onInit(partType: EQUIP_PART_TYPE, heroId: number, equip: data.IBagUnit) {
        this.doInit();
        this._filterData = 1;
        this._equipPartType = partType;
        this._heroId = heroId;
        this._equip = equip;
        this._equips = this.getEquipsByPartType(this._equipPartType);
        this.sortEquips();
        this.updateEquipsView(equip);
        this.updateSortView();
    }

    doInit() {
        eventCenter.register(heroViewEvent.HERO_DRESS_EQUIP, this, this.onRecvDressSuc);
        eventCenter.register(heroViewEvent.HERO_UNDRESS_EQUIP, this, this.onRecvUnDressSuc);
    }

    onRelease() {
        eventCenter.unregisterAll(this);
        this.equipsList._deInit();
    }

    updateEquipsView(equip: data.IBagUnit) {
        if (!this._curShowEquip) {
            this.equipInfoView.active && (this.equipInfoView.active = false);
        }
        if(this._equips.length <= 0) {
            guiManager.showDialogTips(CustomDialogId.HERO_EQUIP_NO_AVALIABLE);
            this.emptyNode.active = true;
            return;
        }
        this.emptyNode.active = false;
        this.refreshEquipInfosView();
        this.scheduleOnce(() => {
            this.equipsList.numItems = this._equips.length;
            this.equipsList.itemSpecialComp = 'ItemBag';
            this.equipsList.updateAll();
            if(equip) {
                let index: number = this._equips.findIndex(item => {
                    return item.ID == equip.ID && utils.longToNumber(item.Seq) == utils.longToNumber(equip.Seq);
                });
                if(index > -1) {
                    this.equipsList.selectedId = index;
                }
            }
        });
    }
    /**
     * 更新装备信息
     */
    refreshEquipInfosView() {
        if (!this._curShowEquip) {
            this.equipInfoView.active = false;
            return;
        } else {
            !this.equipInfoView.active && (this.equipInfoView.active = true);
        }
        let equipProp = new Equip(this._curShowEquip).getEquipDetailInfo();
        this.equipBasicInfoCmp.setData(this._curShowEquip);
        this.equipPropsNode.equipData = this._curShowEquip;
        this.equipPropsNode.updateInfo(equipProp);
        this.equipPropsNode.showCastSoulProps(this._curShowEquip);
        this.unDressBtn.active = false;
        if (bagDataUtils.checkEquipIsDressed(this._curShowEquip)) {
            // 被当前自己装备
            if (this.checkEquipIsDressedByHero(this._heroId, this._curShowEquip)) {
                this.dressBtn.active && (this.dressBtn.active = false);
                this.replaceBtn.active && (this.replaceBtn.active = false);
                this.unDressBtn.active = true;
            } else {
                this.dressBtn.active && (this.dressBtn.active = false);
                !this.replaceBtn.active && (this.replaceBtn.active = true);
            }
        } else {
            if (this.checkIsDressedPart()) {
                !this.replaceBtn.active && (this.replaceBtn.active = true);
                this.dressBtn.active && (this.dressBtn.active = false);
            } else {
                this.replaceBtn.active && (this.replaceBtn.active = false);
                !this.dressBtn.active && (this.dressBtn.active = true);
            }
        }
    }

    onEquipsListRender(item: cc.Node, index: number) {
        if (item) {
            let euqip: Equip = new Equip(this._equips[index]);
            let cmp: ItemBag = item.getComponent(ItemBag);
            cmp.init({
                id: this._equips[index].ID,
                star: this._equips[index].EquipUnit.Star,
                level: euqip.getEquipLevel(),
                currEquip: bagDataUtils.checkEquipIsDressed(this._equips[index])
            });
        }
    }

    onSelectEquipRender(item: cc.Node, selectedId: number, lastSelectedId: number, val: number) {
        this._curShowEquip = this._equips[selectedId];
        this.refreshEquipInfosView();
    }

    onClickDress() {
        let basicConfig = configUtils.getEquipConfig(this._curShowEquip.ID);
        bagDataOpt.sendDressEquip(this._heroId, basicConfig.PositionType, this._curShowEquip.Seq, this._curShowEquip.ID);
    }

    onClickReplace() {
        if(bagDataUtils.checkEquipIsDressed(this._curShowEquip)) {
            let info: MsgboxInfo = {
                content: '该装备正在被其他人使用，是否要替换给当前英雄？',
                leftStr: '取消',
                leftCallback: null,
                rightStr: '确定',
                rightCallback: () => {
                    let basicConfig = configUtils.getEquipConfig(this._curShowEquip.ID);
                    bagDataOpt.sendDressEquip(this._heroId, basicConfig.PositionType, this._curShowEquip.Seq, this._curShowEquip.ID);
                }
            }
            guiManager.showMessageBox(this.node, info);
        } else {
            let basicConfig = configUtils.getEquipConfig(this._curShowEquip.ID);
            bagDataOpt.sendDressEquip(this._heroId, basicConfig.PositionType, this._curShowEquip.Seq, this._curShowEquip.ID);
        }
    }

    onClickUndress() {
        let basicConfig = configUtils.getEquipConfig(this._curShowEquip.ID);
        bagDataOpt.sendUnDressEquip(this._heroId, basicConfig.PositionType);
    }

    onClickFilterBtn() {
        this._filterData = this._filterData ^ 1;
        this.updateSortView();
        this.sortEquips();
        this.updateEquipList();
    }

    updateSortView() {
        let icon = this.sortNode.children[0];
        let tipsLb = this.sortNode.children[1].getComponent(cc.Label);
        icon.rotation = this._filterData == 1 ? 0 : 180;
        tipsLb.string = this._filterData == 1 ? '降序' : '升序';
    }

    updateEquipList() {
        this.equipsList.numItems = this._equips.length;
        this.equipsList.updateAll();
        this.scheduleOnce(() => {
            if (this._curShowEquip) {
                let index: number = this._equips.findIndex(item => {
                    return item.ID == this._curShowEquip.ID && utils.longToNumber(item.Seq) == utils.longToNumber(this._curShowEquip.Seq);
                });
                if (index > -1) {
                    this.equipsList.selectedId = index;
                }
            }
        })
    }

    onRecvDressSuc() {
        guiManager.showDialogTips(CustomDialogId.HERO_EQUIP_ON);
        this.closeView();
    }

    onRecvUnDressSuc() {
        guiManager.showDialogTips(CustomDialogId.HERO_EQUIP_OFF);
        this.closeView();
    }

    /**
      * 根据部位筛选装备 所有的
      * @param equipPartType 
      * @returns 
      */
    getEquipsByPartType(equipPartType: EQUIP_PART_TYPE) {
        let equips = bagData.equipList;
        let partEquips: data.IBagUnit[] = [];
        let heroCfg: cfg.HeroBasic = configUtils.getHeroBasicConfig(this._heroId);
        for (const k in equips) {
            const equip = equips[k];
            let equipConfig: cfg.Equip = configUtils.getEquipConfig(equip.ID);
            // 部位相同
            if (!bagDataUtils.checkCommonEquip(equipConfig.PositionType)) {
                if (equipConfig.PositionType == equipPartType && equipConfig.TextureType == heroCfg.HeroBasicEquipType) {
                    partEquips.push(equip);
                }
            } else {
                // 专属
                if(EQUIP_PART_TYPE.EXCLUSIVE == equipPartType) {
                    if(equip.ID == heroCfg.HeroBasicExclusive) {
                        partEquips.push(equip);
                    }
                } else {
                    if (equipConfig.PositionType == equipPartType) {
                        partEquips.push(equip);
                    }
                }
            }
        }
        return partEquips;
    }

    sortEquips() {
        if (this._equips.length > 1) {
            this._equips.sort((a, b) => {
                let aCfg = configUtils.getEquipConfig(a.ID);
                let bCfg = configUtils.getEquipConfig(b.ID);
                if(this._filterData == 1) {
                    return bCfg.Quality - aCfg.Quality;
                } else {
                    return aCfg.Quality - bCfg.Quality;
                }
            });
        }
    }

    checkEquipIsDressedByHero(heroId: number, equip: data.IBagUnit) {
        let heroUnit: HeroUnit = new HeroUnit(heroId);
        let equips = heroUnit.getHeroEquips();
        for(const k in equips) {
            if (equips[k].ID == equip.ID && utils.longToNumber(equips[k].Seq) == utils.longToNumber(equip.Seq)) {
                return true;
            }
        }
        return false;
    }

    checkIsDressedPart() {
        let heroUnit: HeroUnit = new HeroUnit(this._heroId);
        let equips = heroUnit.getHeroEquips();
        if(equips) {
            for(const k in equips) {
                let equipCfg = configUtils.getEquipConfig(equips[k].ID);
                if(equipCfg.PositionType == this._equipPartType) {
                    return true;
                }
            }
        }
        return false;
    }

}
