import { HERO_ENERGY_MAX, VIEW_NAME } from "../../../../app/AppConst";
import { utils } from "../../../../app/AppUtils";
import { configUtils } from "../../../../app/ConfigUtils";
import UIGridView, { GridData } from "../../../../common/components/UIGridView";
import { ViewBaseComponent } from "../../../../common/components/ViewBaseComponent";
import { eventCenter } from "../../../../common/event/EventCenter";
import { purgatoryEvent } from "../../../../common/event/EventData";
import guiManager from "../../../../common/GUIManager";
import moduleUIManager from "../../../../common/ModuleUIManager";
import { ItemHeroHeadSquarePool } from "../../../../common/res-manager/NodePool";
import { cfg } from "../../../../config/config";
import { bagData } from "../../../models/BagData";
import { pveTrialData } from "../../../models/PveTrialData";
import { serverTime } from "../../../models/ServerTime";
import HeroUnit from "../../../template/HeroUnit";
import ItemHeadSquare from "../../view-item/ItemHeadSquare";
import PVEPurgatoryView from "./PVEPurgatoryView";

const {ccclass, property} = cc._decorator;

interface HeroState {
    heroID: number,         // 英雄ID
    hpPercent: number,      // HP百分比(0-1)
    energyPercent: number,  // 能量百分比(0-1)
    capability: number      // 战力(排序用)
}

@ccclass
export default class PVEPurgatoryMyHeroesView extends ViewBaseComponent {

    @property(cc.Sprite) freeReviveIcon: cc.Sprite = null;
    @property(cc.Label) countdownFreeRevive: cc.Label = null;
    @property(cc.Label) description: cc.Label = null;
    @property(UIGridView) myHeroesList: UIGridView = null;

    root: PVEPurgatoryView = null;

    onInit(root: PVEPurgatoryView) {
        this.root = root;

        let dialogConfig: cfg.Dialog = configUtils.getDialogCfgByDialogId(99000076);
        let itemID: number = configUtils.getModuleConfigs().PVEInfernalResurrectionItem;
        let itemConfig: cfg.Item = configUtils.getItemConfig(itemID);
        this.description.string = utils.convertFormatString(dialogConfig.DialogText, [{itemname: itemConfig.ItemName}]);

        this.refreshView();

        eventCenter.register(purgatoryEvent.REVIVE_SUCCESS, this, this.refreshView);
    }

    onRelease() {
        this.root.removeCountDown([this.countdownFreeRevive]);
        this.myHeroesList.clear();
        eventCenter.unregisterAll(this);
    }

    refreshView() {
        let self = this;

        // 复活按钮倒计时
        let lastTime: number = utils.longToNumber(pveTrialData.purgatoryData.FreeReliveTime);
        let restTime: number = lastTime + configUtils.getModuleConfigs().PVEInfernalResurrectionFreeCD - serverTime.currServerTime();
        if (restTime <= 0) {
            this.countdownFreeRevive.string = "";
            utils.setSpriteGray(this.freeReviveIcon, false);
        } else {
            utils.setSpriteGray(this.freeReviveIcon, true);
            this.root.addCountDown(this.countdownFreeRevive, {
                endTime: lastTime + configUtils.getModuleConfigs().PVEInfernalResurrectionFreeCD,
                callback: () => {
                    utils.setSpriteGray(this.freeReviveIcon, false);
                    self.root.removeCountDown([self.countdownFreeRevive]);
                }
            })
        }

        // 英雄列表
        this.myHeroesList.clear();
        
        let gridDatas: GridData[] = [];
        let heroState: HeroState = null;
        let heroUnit: HeroUnit = null;
        pveTrialData.getPurgatoryHeroes().forEach((item) => {
            heroUnit = new HeroUnit(item.ID);
            heroState = {
                heroID: item.ID, 
                hpPercent: item.HPPercent / 10000, 
                energyPercent: item.Energy / HERO_ENERGY_MAX, 
                capability: heroUnit.getCapability()
            };
            gridDatas.push({key: String(item.ID), data: heroState});
        });

        this.myHeroesList.init(gridDatas, {
            getItem: () => {
                return ItemHeroHeadSquarePool.get();
            },
            releaseItem: (item: ItemHeadSquare) => {
                ItemHeroHeadSquarePool.put(item);
            },
            onInit: (item: ItemHeadSquare, gridData: GridData) => {
                item.init(gridData.data.heroID, 
                    this.onClickItemHeadSquare, 
                    null, 
                    {hp: gridData.data.hpPercent, power: gridData.data.energyPercent});
            },
            sortFunc: (left, right) => {
                // 优先存活，其次战力
                if (left.data.hpPercent > 0 && right.data.hpPercent <= 0) { return -1; }
                if (left.data.hpPercent <= 0 && right.data.hpPercent > 0) { return 1; }

                return right.data.capability - left.data.capability;
            }
        });
    }

    onBtnClose() {
        this.closeView();
    }

    onBtnRevive() {
        guiManager.loadView(VIEW_NAME.PVE_PURGATORY_REVIVE_VIEW, this.root.node, this.root);
    }

    onClickItemHeadSquare(heroID: number) {
        moduleUIManager.jumpToModule(20000, null, null, heroID);
    }
}
