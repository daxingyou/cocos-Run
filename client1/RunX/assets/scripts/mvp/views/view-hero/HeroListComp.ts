import { CustomDialogId, VIEW_NAME } from "../../../app/AppConst";
import { CHARACTER_VIEW_TYPE, HERO_ABILITY, HERO_EQUIP_TYPE, HERO_TRIGRAMS, QUALITY_TYPE } from "../../../app/AppEnums";
import { utils } from "../../../app/AppUtils";
import { bagDataUtils } from "../../../app/BagDataUtils";
import { configUtils } from "../../../app/ConfigUtils";
import { audioManager, SFX_TYPE } from "../../../common/AudioManager";
import List from "../../../common/components/List";
import { configManager } from "../../../common/ConfigManager";
import guiManager from "../../../common/GUIManager";
import moduleUIManager from "../../../common/ModuleUIManager";
import { redDotMgr, RED_DOT_DATA_TYPE, RED_DOT_MODULE } from "../../../common/RedDotManager";
import { ItemHeroListPool } from "../../../common/res-manager/NodePool";
import { cfg } from "../../../config/config";
import { data } from "../../../network/lib/protocol";
import { bagData } from "../../models/BagData";
import { bagDataOpt } from "../../operations/BagDataOpt";
import HeroUnit from "../../template/HeroUnit";
import HeroListItem from "./HeroListItem";
import HeroView from "./HeroView";

const { ccclass, property } = cc._decorator;
const enum HERO_FILTER_TYPE {
    CAPABILITY,
    QUALITY,
    TRIGRAMS,
    ABILITY,
    EQUIPTYPE,
}

@ccclass
export default class HeroListComp extends cc.Component {
    @property(cc.Node)      bgNode: cc.Node = null;
    @property(List)         heroViewList: List = null;
    @property(cc.Node)      filterLayout: cc.Node = null;
    @property(cc.Node)      heroListViewParent: cc.Node = null;
    @property(cc.Label)     filterLb: cc.Label = null;
    @property(cc.Node)      leftBtn: cc.Node = null;
    @property(cc.Node)      rightBtn: cc.Node = null;
    @property({ type: cc.Node, tooltip: '英雄展示节点的item的父节点' })  heroListParent: cc.Node = null;
    
    @property(cc.ToggleContainer) qualityToggles: cc.ToggleContainer = null;
    @property(cc.ToggleContainer) trigrameToggles: cc.ToggleContainer = null;
    @property(cc.ToggleContainer) abilityToggles: cc.ToggleContainer = null;
    @property(cc.ToggleContainer) equipTypeToggles: cc.ToggleContainer = null;
    @property(cc.Node)  emptyNode: cc.Node = null;

    private _heros: number[] = []; // 英雄列表总数据
    private _currSelect: number = 0;
    private _clickHero: Function = (hero: number): void => void{};
    private _filter: number[] = [0, -1];// 筛选配置
    private _root: HeroView = null
    private _defaultID: number;

    get currHero () {
        return this._currSelect;
    }

    get currList () {
        return this._heros;
    }

    preInit() {
        this._heros = this._getFilterData();
    }

    onInit (root: HeroView, clickCB: (hero: number) => void, defaultID?: number) {

        if ((cc.winSize.height/cc.winSize.width) < 720/1280) {
            this.node.width = 560 + 60
        }
        this.node.x = -cc.winSize.width/2
        this.heroViewList.setupExternalPool(ItemHeroListPool);

        this._root = root;
        this._clickHero = clickCB
        this._defaultID = defaultID;

        this.leftBtn.active = false;
        this.rightBtn.active = false;

        let dialogCfg = configUtils.getDialogCfgByDialogId(99000052);
        let labelComp = cc.find('label', this.emptyNode).getComponent(cc.Label);
        labelComp.string = dialogCfg.DialogText;
        //@ts-ignore
        labelComp._forceUpdateRenderData();
        cc.find('spr1', this.emptyNode).height = labelComp.node.height + 80;

        this.heroViewList.numItems = this._heros.length;
        // this.heroViewList.selectedId = 0;
        this._initToggle();
    }

    deInit () {
        this.heroViewList._deInit();
    }

    onRelease(){
        this.deInit();
        redDotMgr.clearHeroAllNewData();
    }

    onRefresh () {
        if ((cc.winSize.height/cc.winSize.width) < 720/1280) {
            this.node.width = 560 + 60

        }
        
    }

    onSelectNext (addIndex: number) {
        let curSelectIndex: number = this.heroViewList.selectedId;
        // 循环列表的实现方式
        let selectId: number = 0;
        if(curSelectIndex + addIndex >= 0) {
            selectId = (curSelectIndex + addIndex) % this.currList.length;
        } else {
            selectId = this.currList.length - Math.abs(curSelectIndex + addIndex) % this.currList.length;
        }
        this.heroViewList.selectedId = selectId;
    }

    scrollToCurr () {
        this.heroViewList.scrollTo(this.heroViewList.getCurIndex());
    }

     /**
     * 点击某个筛选大选项
     * @param event 
     * @param customEventData 
     */
    onClickFilterBtns(event: cc.Event, customEventData: number) {
        for (let i = 0; i < this.filterLayout.childrenCount; ++i) {
            let filterBtn: cc.Node = this.filterLayout.children[i];
            let btns: cc.Node = filterBtn.getChildByName('btns');
            if (i == customEventData) {
                if (btns) {
                    btns.active = !btns.active;
                }
            } else {
                if (btns && btns.active) {
                    btns.active = false;
                }
            }
        }
    }

    updateListOne(heroId?: number) {
        let index: number = this.currList.indexOf(heroId || this._currSelect);
        if(index > -1) {
            this.heroViewList.updateItem(index);
            this.heroViewList.selectedId = index
        }
    }

    updateItemsRedDot(){
        let insideNodes: cc.Node[] = this.heroViewList.getInsideItem();
        if(!insideNodes || insideNodes.length == 0) return;
        insideNodes.forEach(ele => {
            let itemComp = ele.getComponent(HeroListItem);
            if(!cc.isValid(itemComp) || !itemComp.heroID) return;
            redDotMgr.fire(RED_DOT_MODULE.HERO_ITEM, `${itemComp.heroID}`);
        });
    }

    /**
     * 点击空白区域 为了隐藏装备信息弹窗的
     */
    onClickHidePop() {
        if(this.filterLayout.active) {
            this.filterLayout.active = false;
        }
    }

    onClickFilterBtn() {
        this.filterLayout.active = !this.filterLayout.active;
    }

    onClickAdvanceBtn() {
        if(!this._currSelect) return;

        let heroUnit: HeroUnit = new HeroUnit(this._currSelect);

        //碎片合成
        if(!heroUnit.isHeroBasic) {
            this._compoundHero();
            return;
        }

        //满星
        if (heroUnit.star >= 6) {
            this._root.loadHeroSubView(VIEW_NAME.COMPOUND_VIEW, 1, 47000, CHARACTER_VIEW_TYPE.SMELT);
            return;
        }

        //升星
        if (bagDataUtils.checkHeroCanAddStar(this._currSelect)) {
            bagDataOpt.sendAddHeroStar(this._currSelect);
        } else {
            guiManager.showDialogTips(CustomDialogId.HERO_CHIPS_NO_ENOUGH);
            let chipId = heroUnit.chipId;
            moduleUIManager.showItemDetailInfo(chipId, 0, this.node);
        }
    }


    /**
     * 点击英雄列表 item
     * @param selectIndex
     */
    private _selectHero(heroId: number) {
        if (heroId != this._currSelect) {
            this._currSelect = heroId;

            this._clickHero && this._clickHero(heroId);
            // this.refreshHeroStage();
            // this.refreshView();
        } else {
            this._compoundHero();
        }
        audioManager.playSfx(SFX_TYPE.BUTTON_CLICK);
    }

     //英雄碎片合成
    private _compoundHero(){
        if (bagDataUtils.checkHeroMerge(this._currSelect)) {
            let hereId: number = configUtils.getHeroBasicConfig(this._currSelect).HeroBasicId;
            bagDataOpt.sendCompoundHero(hereId);
        }
    }

    /**
     * 初始化筛选
     */
    private _initToggle() {
        let filterInfo = this._filter;
        if(filterInfo[0] > 0) {
            if(filterInfo[1] > 0) {
                switch(Number(filterInfo[0])) {
                    case HERO_FILTER_TYPE.QUALITY:{
                        this.onClickQuality(null, filterInfo[1], false);
                        break;
                    }
                    case HERO_FILTER_TYPE.TRIGRAMS: {
                        this.onClickTrigrames(null, filterInfo[1], false);
                        break;
                    }
                    case HERO_FILTER_TYPE.ABILITY: {
                        this.onClickAbility(null, filterInfo[1], false);
                        break;
                    }
                    case HERO_FILTER_TYPE.EQUIPTYPE: {
                        this.onClickEquipType(null, filterInfo[1], false);
                        break;
                    }
                    default: {
                        break;
                    }
                }
            }
        } else {
            this.onClickSortByCapbility();
        }
    }

    onListRenderEvent(item: cc.Node, index: number) {
        let heroListItemCmp: HeroListItem = item.getComponent(HeroListItem);
        heroListItemCmp.setData(this._heros[index], RED_DOT_MODULE.HERO_ITEM);
    }


    onListItemClick(item: cc.Node, index: number) {
        // bagData.updateLastItemData(BAG_ITEM_TYPE.HERO, bagItem ? bagItem.Array[0] : 0);
        let heroId = this._heros[index];
        this._selectHero(heroId);
        this._refreshNextBtnView();
        let bagItem = bagData.getItemByID(this._heros[index]);
        if(bagItem) {
            redDotMgr.clearNewData(RED_DOT_DATA_TYPE.HERO, bagItem.Array[0]);
            redDotMgr.fire(RED_DOT_MODULE.HERO_ITEM, `${heroId}`);
        }
    }

    refreshList () {
        this._updateFilterData();
    }

    private _refreshNextBtnView () {
       // this.leftBtn.active = this.heroViewList.selectedId > 0;
        // this.rightBtn.active = this.heroViewList.selectedId < this.heroViewList.numItems - 1;
    }

    private _resetFilter() {
        this._filter = [-1, -1];
        this.filterLayout.active = false;
        this._updateFilterData();
        // this._afterFilter();
        if (this._heros.length > 0) {
            let listID: number = 0;
            if (this._defaultID) {
                this._heros.find((hero, idx) => {
                    if (hero === this._defaultID ) {
                        listID = idx;
                        return true;
                    }
                    return false;
                });
            }
            this.heroViewList.selectedId = listID;
        }
        this.filterLb.string = '全部';
    }

    private _getFilterData(): number[] {
        let allHero : data.IBagUnit[] = utils.deepCopyArray(bagData.heroList);
        let canCompoundList: number[] = [];
        let unownList: number[] = [];
        let ownList: number[] = [];
        let allCfgs = configManager.getConfigs('heroBasic');
        let findIndexCb = (cfg: cfg.HeroBasic, isReduce: boolean = false) => {
            if (allHero.findIndex(heroUnit => {
                return heroUnit.ID == cfg.HeroBasicId;
            }) > -1 && !isReduce) {
                // 拥有角色
                ownList.push(cfg.HeroBasicId);
            } else {
                let item = bagData.getItemByID(cfg.HeroBasicItem);
                if (item && !isReduce) {
                    // 有碎片 可以合成
                    if (bagDataUtils.checkHeroMerge(cfg.HeroBasicId)) {
                        canCompoundList.push(cfg.HeroBasicItem);
                    } else {
                        unownList.push(cfg.HeroBasicItem);
                    }
                }
            }
        }
        for (const k in allCfgs) {
            let heroCfg: cfg.HeroBasic = allCfgs[k];
            if (this._filter[0] != -1 && this._filter[1] != -1) {
                if ((this._filter[0] == HERO_FILTER_TYPE.QUALITY && this._filter[1] == heroCfg.HeroBasicQuality)
                    || (this._filter[0] == HERO_FILTER_TYPE.TRIGRAMS && this._filter[1] == heroCfg.HeroBasicTrigrams)
                    || (this._filter[0] == HERO_FILTER_TYPE.ABILITY && this._filter[1] == heroCfg.HeroBasicAbility)
                    || (this._filter[0] == HERO_FILTER_TYPE.EQUIPTYPE && this._filter[1] == heroCfg.HeroBasicEquipType)) {
                    findIndexCb(heroCfg);
                } else {
                    findIndexCb(heroCfg, true)
                }
            } else {
                findIndexCb(heroCfg);
            }
        }
        let sortCb = (a: number, b: number) => {
            let aCfg = configUtils.getHeroBasicConfig(a);
            let bCfg = configUtils.getHeroBasicConfig(b);
            return bCfg.HeroBasicQuality - aCfg.HeroBasicQuality;
        };
        canCompoundList.sort(sortCb)
        unownList.sort(sortCb);

        // 缓存ID对应战力，避免重复计算
        let tempCapabilityMap:{[key: number]: number} = {};
        let tempHeroUnit: HeroUnit = null; 
        for (let i = 0; i < ownList.length; ++i) {
            tempHeroUnit = bagData.getHeroById(ownList[i]);
            tempCapabilityMap[ownList[i]] = tempHeroUnit.getCapability();
        }

        let sortPower = (a: number, b: number) => {
            let aUnit: HeroUnit = bagData.getHeroById(a);
            let bUnit: HeroUnit = bagData.getHeroById(b);
            let aPower = tempCapabilityMap[a];
            let bPower = tempCapabilityMap[b];
            if(aPower == bPower) {
                return bUnit.heroCfg.HeroBasicQuality - aUnit.heroCfg.HeroBasicQuality;
            } else {
                return bPower - aPower;
            }
        }
        ownList.sort(sortPower);

        return new Array().concat(canCompoundList, ownList, unownList);
    }

    // 全部
    onClickSortByCapbility () {
        // todo 根据战斗力排下序
        this._filter = [HERO_FILTER_TYPE.CAPABILITY, -1];
        this._resetFilter();
    }

    // 英雄品质
    onClickQuality(toogle: cc.Toggle, customEventData: QUALITY_TYPE, isClick: Boolean = true) {
        this._resetToggle();
        let tipsString: string[] = ['', '',  '精良', '稀有', '史诗', '传说'];
        if (isClick) {
            let curQualityIndex = this._filter[1];
            if (curQualityIndex != customEventData || this._filter[0] != HERO_FILTER_TYPE.QUALITY) {
                this._filter = [HERO_FILTER_TYPE.QUALITY, customEventData];
                // 刷新筛选按钮状态
                this._updateFilterView(tipsString[customEventData]);
            } else {
                this.filterLayout.active = false;
            }
            toogle.node.parent.active = false;
        } else {
            // 刷新筛选按钮状态
            this._updateFilterView(tipsString[customEventData]);
        } 
        this.qualityToggles.toggleItems.forEach((toggle, index) => { toggle.isChecked = (index == (this.qualityToggles.toggleItems.length -  Number(customEventData) + 1)) });
    }
    // 英雄卦象
    onClickTrigrames(toggle: cc.Toggle, customEventData: HERO_TRIGRAMS, isClick: Boolean = true) {
        this._resetToggle();
        let tipsString: string[] = ['', '天', '地', '风', '雷', '水', '火', '山', '泽'];
        if (isClick) {
            let curTrigramsIndex: number = this._filter[1];
            if (curTrigramsIndex != customEventData || this._filter[0] != HERO_FILTER_TYPE.TRIGRAMS) {
                this._filter = [HERO_FILTER_TYPE.TRIGRAMS, customEventData];

                // 刷新筛选按钮状态
                this._updateFilterView(tipsString[customEventData]);
            } else {
                this.filterLayout.active = false;
            }
            toggle.node.parent.active = false;
        } else {
            // 刷新筛选按钮状态
            this._updateFilterView(tipsString[customEventData]);
        }
        this.trigrameToggles.toggleItems.forEach((toggle, index) => {toggle.isChecked = (index == Number(customEventData) -1) });
    }
    // 英雄定位
    onClickAbility(toggle: cc.Toggle, customEventData: HERO_ABILITY, isClick: Boolean = true) {
        this._resetToggle();
        let tipsString: string[] = ['', '输出', '承伤', '控制', '辅助', '治疗'];
        if (isClick) {
            let cuiAbilityIndex: number = this._filter[1];
            if (cuiAbilityIndex != customEventData || this._filter[0] != HERO_FILTER_TYPE.ABILITY) {
                this._filter = [HERO_FILTER_TYPE.ABILITY, customEventData];
                // 刷新筛选按钮状态
                this._updateFilterView(tipsString[customEventData]);
            } else {
                this.filterLayout.active = false;
            }
            toggle.node.parent.active = false;
        } else {
            // 刷新筛选按钮状态
            this._updateFilterView(tipsString[customEventData]);
        } 
        this.abilityToggles.toggleItems.forEach((toggle, index) => { toggle.isChecked = (index == Number(customEventData) - 1) });
    }
    // 英雄装备类型
    onClickEquipType(toggle: cc.Toggle, customEventData: HERO_EQUIP_TYPE, isClick: Boolean = true) {
        this._resetToggle();
        let tipsString: string[] = ['', '板甲', '皮甲', '布甲'];
        if (isClick) {
            let curEquipType: number = this._filter[1];
            if (curEquipType != customEventData || this._filter[0] != HERO_FILTER_TYPE.EQUIPTYPE) {
                this._filter = [HERO_FILTER_TYPE.EQUIPTYPE, customEventData];
                // 刷新筛选按钮状态
                this._updateFilterView(tipsString[customEventData]);
            } else {
                this.filterLayout.active = false;
            }
            toggle.node.parent.active = false;
        } else {
            // 刷新筛选按钮状态
            this._updateFilterView(tipsString[customEventData]);
        }
        this.equipTypeToggles.toggleItems.forEach((toggle, index) => { toggle.isChecked = (index == Number(customEventData) - 1) });
    }

    private _resetToggle () {
        this.qualityToggles.toggleItems.forEach((toggle, index) => { toggle.isChecked = false });
        this.trigrameToggles.toggleItems.forEach((toggle, index) => { toggle.isChecked = false });
        this.abilityToggles.toggleItems.forEach((toggle, index) => { toggle.isChecked = false });
        this.equipTypeToggles.toggleItems.forEach((toggle, index) => { toggle.isChecked = false });
    }

    /**
     * 更新筛选label
     * @param string 
     */
    private _updateFilterView(string: string) {
        this.filterLb.string = string;
        this.filterLayout.active = false;
        this._updateFilterData();
        this._afterFilter();
    }

    private _updateFilterData() {
        this._heros = this._getFilterData();
        this._refreshHeroList();
    }

    /**
     * 刷新英雄列表
     * @returns 
     */
    private _refreshHeroList() {
        // 英雄头像展示列表
        if (!this.heroListParent) {
            return;
        }
        this.heroViewList.numItems = this._heros.length;
        this.emptyNode.active = (!this._heros || this._heros.length == 0)
        if(this._root.mainBack) {
            this._root.mainBack = false;
        }
    }

    /**
     * 筛选过后 强制选择筛选的第一个
    */
    private _afterFilter() {
        if(this._heros.length > 0) {
            this.heroViewList.selectedId = 0;
        }
    }
}