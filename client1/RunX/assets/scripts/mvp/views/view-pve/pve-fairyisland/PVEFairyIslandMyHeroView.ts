import { utils } from "../../../../app/AppUtils";
import { configUtils } from "../../../../app/ConfigUtils";
import { ViewBaseComponent } from "../../../../common/components/ViewBaseComponent";
import { eventCenter } from "../../../../common/event/EventCenter";
import { islandEvent } from "../../../../common/event/EventData";
import guiManager from "../../../../common/GUIManager";
import moduleUIManager from "../../../../common/ModuleUIManager";
import { ItemHeroHeadSquarePool } from "../../../../common/res-manager/NodePool";
import { cfg } from "../../../../config/config";
import { data } from "../../../../network/lib/protocol";
import { bagData } from "../../../models/BagData";
import { islandData } from "../../../models/IslandData";
import { pveTrialData } from "../../../models/PveTrialData";
import { pveDataOpt } from "../../../operations/PveDataOpt";
import HeroUnit from "../../../template/HeroUnit";
import ItemHeadSquare from "../../view-item/ItemHeadSquare";
import ItemIsLandBtn from "./ItemIsLandBtn";

const {ccclass, property} = cc._decorator;
@ccclass
export default class PVEFairyIslandMyHeroView extends ViewBaseComponent {

    @property(ItemIsLandBtn) resuregenBtn: ItemIsLandBtn = null;
    @property(cc.Label) desLb: cc.Label = null;
    @property(cc.Node) content: cc.Node = null; 

    /**生命和怒气值有变动的英雄列表*/
    private _changeHeros: data.ITrialRoleInfo[] = [];
    private _useItemHeads: ItemHeadSquare[] = [];
    /**已阵亡的英雄*/
    private _dieHeroList: number[] = [];

    onInit(): void {
        this._registerEvent();
        this._initView();
    }

    /**页面释放清理*/
    onRelease() {
        this._clear();
        eventCenter.unregisterAll(this);
    }

    private _initView() {
        this._clear();
        this._changeHeros = pveTrialData.islandData?.Heroes;

        let heroList = bagData.heroList.concat();
        heroList.sort((a:data.IBagUnit, b:data.IBagUnit) => {
            let heroUnitA = new HeroUnit(a.ID);
            let heroUnitB = new HeroUnit(b.ID);
            return heroUnitB.getCapability() - heroUnitA.getCapability();
        })

        if (heroList && heroList.length) {
            for (let i = 0; i < heroList.length; i++){
                this.onHeroItemRender(heroList[i]);
            }
            this.content.height = 110 * Math.ceil(heroList.length / 5);
        }
        this._renderDieHero();

        let dialogueCfg: cfg.Dialog = configUtils.getDialogCfgByDialogId(99000076);
        let itemID: number = configUtils.getModuleConfigs().PVEInfernalResurrectionItem;
        let itemConfig: cfg.Item = configUtils.getItemConfig(itemID);
        this.desLb.string = utils.convertFormatString(dialogueCfg.DialogText, [{itemname: itemConfig.ItemName}]);

         //剩余数量
         let remain = islandData.getResurrectionItemId()
         //本次是否免费-先判定上次免费时间是不是在今天
         let data = new Date();
         let curTimeOffset = Number(data.getTime() / 1000) - data.getHours()*3600 - data.getMinutes()*60 - data.getSeconds();
         let notSameDay = (curTimeOffset - pveTrialData.islandData.FreeReliveTime) > 0;
         let free = notSameDay ? 1 : 0;
         this.resuregenBtn.onInit({ clickFunc: this.funcByPortalMedicine.bind(this), btnTitle: `立即使用`, remainNum: remain, freeNum: free });
    }

    private _registerEvent() {
        eventCenter.register(islandEvent.RECEIVE_RELIVE_RES, this, this._showTips);
    }

    private _clear() {
        this._useItemHeads.forEach(item => {
            ItemHeroHeadSquarePool.put(item);
        })
        this._useItemHeads.length = 0;
        this._dieHeroList.length = 0;
        this._changeHeros.length = 0;
        this.content.removeAllChildren();
        this.content.height = 0;
    }

    onHeroItemRender(heroUnit: data.IBagUnit) {
        //是否是有变化的英雄信息
        let changeHeros = this._changeHeros.filter((item) => {
            return item.ID == heroUnit.ID;
        });

        let isHavaChange = (changeHeros && changeHeros.length);
        let changeHp = isHavaChange ? changeHeros[0].HPPercent : 10000;
        let changeEnergy = isHavaChange ? changeHeros[0].Energy : 0;
        //已经阵亡的放出来
        if (changeHp <= 0) {
            this._dieHeroList.push(heroUnit.ID);
            return;
        }
        this._addItemHeadComp(heroUnit.ID, changeHp, changeEnergy);
    }

    private _renderDieHero() {
        if (!this._dieHeroList.length) return;
        this._dieHeroList.forEach(heroId => {
            let hero = this._changeHeros.filter((item) => {
                return item.ID == heroId;
            });
            
            this._addItemHeadComp(heroId, 0, hero[0].Energy);
        })
    }

    private _addItemHeadComp(heroId:number,hp: number, energy: number) {
        let ItemHeadComp = ItemHeroHeadSquarePool.get();
        if (ItemHeadComp) {   
            ItemHeadComp.init(heroId, () => {
                moduleUIManager.jumpToModule(20000, null, null, heroId);
            }, null, { hp: hp / 10000, power: energy / 100 });
            ItemHeadComp.node.parent = this.content;

            this._useItemHeads.push(ItemHeadComp);
        }
    }
    
    /**复活仙丹*/
    funcByPortalMedicine() {
        pveDataOpt.reqRelive();
    }

    private _showTips() {
        this._initView();
    }

}