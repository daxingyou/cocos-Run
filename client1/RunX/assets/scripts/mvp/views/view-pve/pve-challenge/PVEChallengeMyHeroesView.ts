import { configUtils } from "../../../../app/ConfigUtils";
import { ViewBaseComponent } from "../../../../common/components/ViewBaseComponent";
import { ItemHeroHeadSquarePool } from "../../../../common/res-manager/NodePool";
import { pveTrialData } from "../../../models/PveTrialData";
import HeroUnit from "../../../template/HeroUnit";
import ItemHeadSquare from "../../view-item/ItemHeadSquare";
import moduleUIManager from "../../../../common/ModuleUIManager";
import { HERO_ENERGY_MAX } from "../../../../app/AppConst";

const {ccclass, property} = cc._decorator;

@ccclass
export default class PVEChallengeMyHeroesView extends ViewBaseComponent {

    @property(cc.Label) content: cc.Label = null;
    @property(cc.Node) myHeroes: cc.Node = null;

    private _items: ItemHeadSquare[] = [];

    onInit() {
        this.initView();
    }

    initView() {
        let dialogConfig = configUtils.getDialogCfgByDialogId(99000071);
        if (dialogConfig && dialogConfig.DialogText) {
            this.content.string = dialogConfig.DialogText;
        }

        let heroes = pveTrialData.respectData.Heroes;
        heroes.sort((a, b) => {
            // 存活 > 阵亡
            if (a.HPPercent > 0 && b.HPPercent <= 0) { return -1; }
            if (b.HPPercent > 0 && a.HPPercent <= 0) { return 1; }

            // 品质由高到低
            let heroUnitA = new HeroUnit(a.ID);
            let heroUnitB = new HeroUnit(b.ID);
            return heroUnitB.getCapability() - heroUnitA.getCapability();
        });

        let item: ItemHeadSquare = null;
        for (let i = 0; i < heroes.length; ++i) {
            item = ItemHeroHeadSquarePool.get();
            this._items.push(item);

            item.init(heroes[i].ID, () => {
                moduleUIManager.jumpToModule(20000, null, null, heroes[i].ID);
            }, null, {hp: heroes[i].HPPercent / 10000, power: heroes[i].Energy / HERO_ENERGY_MAX});
            this.myHeroes.addChild(item.node);
        }
    }

    onRelease() {
        this._items.forEach((item) => {
            ItemHeroHeadSquarePool.put(item);
        });
    }

    onBtnClose() {
        this.closeView();
    }
}
