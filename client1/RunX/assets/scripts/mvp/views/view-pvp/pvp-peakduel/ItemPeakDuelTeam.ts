import guiManager from "../../../../common/GUIManager";
import moduleUIManager from "../../../../common/ModuleUIManager";
import { ItemHeroHeadSquarePool } from "../../../../common/res-manager/NodePool";
import { pvpData } from "../../../models/PvpData";
import HeroUnit from "../../../template/HeroUnit";
import ItemHeadSquare from "../../view-item/ItemHeadSquare";
import { ADJUST_TEAM_TYPE } from "./PVPPeakDuelChangeTeamView";

const {ccclass, property} = cc._decorator;
@ccclass
export default class ItemPeakDuelTeam extends cc.Component {
    @property(cc.Label) power: cc.Label = null;
    @property(cc.Layout) heroList: cc.Layout = null;
    @property(cc.Sprite) xuanzhong: cc.Sprite = null;

    private _heroHeadItems: ItemHeadSquare[] = [];

    onInit(index: number, herosList: number[], isEnemy: boolean = false ): void {
        this.deInit();
        this._showPower(herosList,isEnemy,index);    
    }

    private _showPower(heros: number[],isEnemy?:boolean,index?:number) {
        let powers = 0;
        heros.forEach(heroId => {
            if (heroId) {
                let heroUnit = new HeroUnit(heroId);
                heroUnit && (powers += heroUnit.getCapability());
    
                let item = ItemHeroHeadSquarePool.get();
                item.node.scale = 0.5;
                item.init(heroId, () => {
                    moduleUIManager.jumpToModule(20000, null, null, heroId);
                });
                item.node.parent = this.heroList.node;   
                this._heroHeadItems.push(item);
            }
        })
        if (isEnemy) {
            let power = pvpData.peakDuelEnemiesInfo.PVPPeakDuelDefensiveHeroList[index].Power;
            this.power.string = `${power}`;
        } else {
            this.power.string = `${powers}`;    
        }
    }

    setChoosed(chose: boolean = false) {
        this.xuanzhong.node.active = chose;
    }

    isChoosed() {
        return this.xuanzhong.node.active;
    }

    /**item释放清理*/
    deInit() {
        this._heroHeadItems.forEach(item => {
            if (item.node && cc.isValid(item.node) && item.node.parent) {
                ItemHeroHeadSquarePool.put(item);    
            }
        })
        this.heroList.node.children.length = 0;
        this._heroHeadItems = [];
    }
}