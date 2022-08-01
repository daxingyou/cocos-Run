import { configUtils } from "../../../../app/ConfigUtils";
import RichTextEx from "../../../../common/components/rich-text/RichTextEx";
import UIGridView, { GridData } from "../../../../common/components/UIGridView";
import { ViewBaseComponent } from "../../../../common/components/ViewBaseComponent";
import { ItemHeroHeadSquarePool } from "../../../../common/res-manager/NodePool";
import { cfg } from "../../../../config/config";
import { bagData } from "../../../models/BagData";
import HeroUnit from "../../../template/HeroUnit";
import ItemHeadSquare from "../../view-item/ItemHeadSquare";
import PVEYYBookView from "./PVEYYBookView";

const {ccclass, property} = cc._decorator;

@ccclass
export default class PVEYYBookSelectHeroView extends ViewBaseComponent {

    @property(cc.Label) ruleDescription: cc.Label = null;
    @property(RichTextEx) rewardDescription: RichTextEx = null;
    @property(UIGridView) myHeroesList: UIGridView = null;
    @property(cc.Node) emptyNode: cc.Node = null;
    @property(cc.Label) emptyLabel: cc.Label = null;

    private _root: PVEYYBookView;   // 主界面
    private _trigrams: number;      // 卦象

    onInit(root: PVEYYBookView, trigrams: number) {
        this._root = root;
        this._trigrams = trigrams;

        this._initView();
    }

    onRelease() {
        this.myHeroesList.clear();
    }

    private _initView() {
        let self = this;

        let ruleDialog = configUtils.getDialogCfgByDialogId(99000085);
        this.ruleDescription.string = ruleDialog.DialogText;
        let rewardDialog = configUtils.getDialogCfgByDialogId(99000086);
        this.rewardDescription.string = rewardDialog.DialogText;
        let emptyDialog = configUtils.getDialogCfgByDialogId(99000087);
        this.emptyLabel.string = emptyDialog.DialogText;

        // 获取背包中对应卦象英雄ID
        let heroCfg: cfg.HeroBasic = null;
        let heroIDs: number[] = [];
        bagData.heroList.forEach((item) => {
            heroCfg = configUtils.getHeroBasicConfig(item.ID);
            if (heroCfg.HeroBasicTrigrams === this._trigrams) {
                heroIDs.push(item.ID);
            }
        });

        // 无则显示织女对话
        this.emptyNode.active = heroIDs.length === 0;

        // 有则初始化列表供玩家选择
        if (heroIDs.length > 0) {
            let gridDatas: GridData[] = [];
            let heroInfo: { heroID: number, capability: number } = null;
            let heroUnit: HeroUnit = null;
            heroIDs.forEach((id) => {
                heroUnit = new HeroUnit(id);
                heroInfo = {
                    heroID: id,
                    capability: heroUnit.getCapability()
                }
                gridDatas.push({key: String(id), data: heroInfo});
            });

            let clickHandler: Function = this.onClickItemHeadSquare.bind(this);
            this.myHeroesList.init(gridDatas, {
                getItem: () => {
                    return ItemHeroHeadSquarePool.get();
                },
                releaseItem: (item: ItemHeadSquare) => {
                    ItemHeroHeadSquarePool.put(item);
                },
                onInit: (item: ItemHeadSquare, gridData: GridData) => {
                    item.init(gridData.data.heroID, clickHandler);
                },
                sortFunc: (left, right) => {
                    return right.data.capability - left.data.capability;
                }
            })
        }
    }

    onClickItemHeadSquare(heroID: number) {
        this._root.selectHero(this._trigrams, heroID);
        this.onBtnClose();
    }

    onBtnClose() {
        this.closeView();
    }
}
