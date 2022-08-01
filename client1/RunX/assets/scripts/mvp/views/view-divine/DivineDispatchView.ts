import { VIEW_NAME } from "../../../app/AppConst";
import { BAG_ITEM_TYPE } from "../../../app/AppEnums";
import { utils } from "../../../app/AppUtils";
import { configUtils } from "../../../app/ConfigUtils";
import { resPathUtils } from "../../../app/ResPathUrlUtils";
import ButtonEx from "../../../common/components/ButtonEx";
import List from "../../../common/components/List";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { eventCenter } from "../../../common/event/EventCenter";
import { divineEvent } from "../../../common/event/EventData";
import guiManager from "../../../common/GUIManager";
import moduleUIManager from "../../../common/ModuleUIManager";
import { ItemBagPool } from "../../../common/res-manager/NodePool";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { data } from "../../../network/lib/protocol";
import { bagData } from "../../models/BagData";
import { divineData } from "../../models/DivineData";
import { serverTime } from "../../models/ServerTime";
import { divineOpt } from "../../operations/DivineOpt";
import HeroUnit from "../../template/HeroUnit";
import ItemBag from "../view-item/ItemBag";
import { NEED_TYPE } from "./DivineOnceDispatchView";
import ItemDispatchHero from "./ItemDispatchHero";

export enum DISPATCH_STATE {
    NOT_DISPATCH,
    DISPATCHED,
}

const DISPATCH_MAX_HEROS: number = 3;

const {ccclass, property} = cc._decorator;

@ccclass
export default class DivineDispatchView extends ViewBaseComponent {
    @property(List) herosList: List = null;
    @property(cc.Node) itemBagParent: cc.Node = null;
    @property(cc.Node) starsParent: cc.Node = null;
    @property(cc.Sprite) taskQualityNode: cc.Sprite = null;
    @property(cc.Label) taskCostTime: cc.Label = null;
    @property(cc.Node) typesParent: cc.Node = null;
    @property(cc.Node) dispatchHerosParent: cc.Node = null;
    @property(cc.Prefab) itemDispatchHeroTemplate: cc.Prefab = null;
    @property(ButtonEx) dispatchBtnCmp: ButtonEx = null;
    @property([cc.SpriteFrame]) qualitySPArr: cc.SpriteFrame[] = [];

    private _taskId: number = 0;
    private _loadView: Function = null;
    private _heros: number[] = [];
    private _dispatchHeros: number[] = [];
    private _spriteLoader: SpriteLoader = new SpriteLoader();
    onInit(taskId: number, loadView: Function) {
        this._taskId = taskId;
        this._loadView = loadView;
        this.addEvent();
        this._dueData();
        this._refreshView();
        this._refreshHeroList();
        this._refreshDispatchView();
    }

    addEvent() {
        eventCenter.register(divineEvent.DISPATCH_SUC_EVENT, this, this._recvDispatchSuc);
    }

    onRelease() {
        eventCenter.unregisterAll(this);
        this.herosList._deInit();
        let child = [...this.dispatchHerosParent.children]
        child.forEach(_c => {
            _c.getComponent(ItemDispatchHero).deInit();
            _c.removeFromParent();
        });
        this._spriteLoader.release();

        let child2 = [...this.itemBagParent.children]
        child2.forEach(_c => {
            _c.scale = 1;
            ItemBagPool.put(_c.getComponent(ItemBag));
            _c.removeFromParent();
        });

    }

    private _dueData() {
        this._dispatchHeros = [];
        this._heros = this._getHeroList();
    }

    private _refreshView() {
        let taskData = divineData.getTaskById(this._taskId);
        let taskConfig = configUtils.getDispatchTaskConfig(taskData.TaskID);
        taskConfig.DispatchQuality < this.qualitySPArr.length && (this.taskQualityNode.spriteFrame = this.qualitySPArr[taskConfig.DispatchQuality - 1]);
        this.taskCostTime.string = `任务时长：${this._convertToCountdownTime(taskConfig.CostTime)}`;

        // 刷新星级
        for(let i = 0; i < this.starsParent.childrenCount; ++i) {
            let star = this.starsParent.children[i];
            if(cc.isValid(star)) {
                star.active = i < taskConfig.DispatchStar;
            }
        }

        let itemBag = this.itemBagParent.children[0];
        let itemBagCmp: ItemBag = null;
        if(!itemBag) {
            itemBagCmp = ItemBagPool.get();
            itemBag = itemBagCmp.node;
            this.itemBagParent.addChild(itemBag);
        } else {
            itemBagCmp = itemBag.getComponent(ItemBag);
        }
        itemBag.scale = 0.8;
        itemBagCmp.init({
            id: taskConfig.RewardItemID,
            count: taskConfig.RewardNum,
            clickHandler: () => {
                moduleUIManager.showItemDetailInfo(taskConfig.RewardItemID, taskConfig.RewardNum, this.node);
            }
        });
    }

    private _refreshHeroList() {
        this.herosList.numItems = this._heros.length;
    }

    onHeroListItemRender(item: cc.Node, index: number) {
        let heroId = this._heros[index];
        let itemDispatchHero = item.getComponent(ItemDispatchHero);
        let isSelected = this._dispatchHeros.indexOf(heroId) > -1;
        itemDispatchHero.init(heroId, isSelected);
    }

    onHeroListItemSelect(item: cc.Node, index: number, lastIndex: number) {
        let heroId = this._heros[index];
        let itemDispatchHero = item.getComponent(ItemDispatchHero);
        let dispatchState = this._getHeroDispatchState(heroId);
        if(DISPATCH_STATE.DISPATCHED == dispatchState) {
            guiManager.showTips('该英雄已被其他任务派遣');
        } else {
            let findIndex = this._dispatchHeros.indexOf(heroId);
            if(findIndex > -1) {
                this._dispatchHeros.splice(findIndex, 1);
                this._refreshDispatchView();
            } else {
                if(this._dispatchHeros.length >= DISPATCH_MAX_HEROS) {
                    guiManager.showTips('派遣人数已达上限');
                    return;
                } else {
                    this._dispatchHeros.push(heroId);
                    this._refreshDispatchView();
                }
            }
            let isSelect = findIndex == -1;
            itemDispatchHero.refreshSelected(isSelect);
        }
    }

    private _refreshDispatchView() {
        // 因为总共就三个 所以没有对象池
        for(let i = 0; i < DISPATCH_MAX_HEROS; ++i) {
            let itemDispatchHero = this.dispatchHerosParent.children[i];
            if(!itemDispatchHero) {
                itemDispatchHero = cc.instantiate(this.itemDispatchHeroTemplate);
                this.dispatchHerosParent.addChild(itemDispatchHero);
            }
            itemDispatchHero.y = 0;
            let heroId = this._dispatchHeros[i] || 0;
            let itemDispatchHeroCmp = itemDispatchHero.getComponent(ItemDispatchHero);
            itemDispatchHeroCmp.init(heroId, false, () => {
                this._unDispatchHero(heroId);
            });
        }
        this._refreshNeedTypesView();
        let isSatisfy = this._checkDispatchSatisfy();
        this.dispatchBtnCmp.setGray(!isSatisfy);
    }

    private _refreshNeedTypesView() {
        let herosAllTypes = this._getDispatchHerosAllNeedTypes();
        let template = this.typesParent.children[0];
        let refreshTypesFunc = (list: number[], types: NEED_TYPE, startIndex: number) => {
            for(let i = 0; i < list.length; ++i) {
                let type = list[i];
                let itemType = this.typesParent.children[startIndex + i + 1];
                if(!itemType) {
                    itemType = cc.instantiate(template);
                    this.typesParent.addChild(itemType);
                }
                let curType = Number(type);
                let typeIconUrl = null;
                let isActivity: boolean = false;
                if(NEED_TYPE.STAR != types && NEED_TYPE.QUALITY != types) {
                    let allTypeCfg = configUtils.getAllTypeCfg(curType);
                    if(allTypeCfg) {
                        typeIconUrl = resPathUtils.getHeroAllTypeIconUrl(allTypeCfg.HeroTypeIcon);
                        let heroFromType = allTypeCfg.HeroTypeFormNum;
                        let findIndex = herosAllTypes[types] ? herosAllTypes[types].indexOf(heroFromType) : -1;
                        if(findIndex > -1) {
                            isActivity = true;
                            herosAllTypes[types].splice(findIndex, 1);
                        }
                    }
                } else if(NEED_TYPE.STAR == types) {
                    typeIconUrl = resPathUtils.getNeedTypeStarIcon(curType);
                    let findIndex = herosAllTypes[NEED_TYPE.STAR] ? herosAllTypes[NEED_TYPE.STAR].findIndex(_star => { return _star >= curType; }) : -1;
                    if(findIndex > -1) {
                        isActivity = true;
                        herosAllTypes[NEED_TYPE.STAR].splice(findIndex, 1);
                    }
                } else if(NEED_TYPE.QUALITY == types) {
                    typeIconUrl = resPathUtils.getNeedTypeQualityIcon(curType);
                    let findIndex = herosAllTypes[NEED_TYPE.QUALITY] ? herosAllTypes[NEED_TYPE.QUALITY].findIndex(_quality => { return _quality >= curType; }) : -1;
                    if(findIndex > -1) {
                        isActivity = true;
                        herosAllTypes[NEED_TYPE.QUALITY].splice(findIndex, 1);
                    }
                }
                this._spriteLoader.changeSprite(itemType.getComponent(cc.Sprite), typeIconUrl);
                itemType.active = true;
                itemType.children[0].active = isActivity;
            }
        }

        const taskData = divineData.getTaskById(this._taskId);
        let startIndex: number = 0;
        if(taskData.NeedHeroStarList.length > 0) {
            refreshTypesFunc(taskData.NeedHeroStarList, NEED_TYPE.STAR, startIndex);
        }
        startIndex += taskData.NeedHeroStarList.length;
        if(taskData.NeedHeroQualityList.length > 0) {
            refreshTypesFunc(taskData.NeedHeroQualityList, NEED_TYPE.QUALITY, startIndex);
        }
        startIndex += taskData.NeedHeroQualityList.length;
        if(taskData.NeedHeroLocationList.length > 0) {
            refreshTypesFunc(taskData.NeedHeroLocationList, NEED_TYPE.ABILITY, startIndex);
        }
        startIndex += taskData.NeedHeroLocationList.length;
        if(taskData.NeedHeroDiagramsList.length > 0) {
            refreshTypesFunc(taskData.NeedHeroDiagramsList, NEED_TYPE.TRIGRAM, startIndex);
        }
        startIndex += taskData.NeedHeroDiagramsList.length;
        if(taskData.NeedHeroArmorList.length > 0) {
            refreshTypesFunc(taskData.NeedHeroArmorList, NEED_TYPE.EQUIP_TYPE, startIndex);
        }
    }

    private _unDispatchHero(heroId: number) {
        let findIndex = this._dispatchHeros.indexOf(heroId);
        if(findIndex > -1) {
            this._dispatchHeros.splice(findIndex , 1);
            this._refreshDispatchView();
            let listIndex = this._heros.indexOf(heroId);
            this.herosList.updateItem(listIndex);
        }
    }

    private _recvDispatchSuc() {
        this.closeView();
    }

    onClickDispatchBtn() {
        if(this._checkDispatchSatisfy()) {
            divineOpt.sendDispatch([
                {
                    Seq: this._taskId,
                    HeroIDList: this._dispatchHeros
                }
            ]);
        } else {
            guiManager.showTips('不满足派遣条件');
        }
    }

    onClickOnceDispatchBtn() {
        if(this._dispatchHeros.length >= DISPATCH_MAX_HEROS) {
            guiManager.showTips('已上阵最大人数');
        } else {
            let filterHeros = this._filterDispatchHerosAI();
            if(filterHeros.length == 0) {
                guiManager.showDialogTips(1000128);
                return;
            }
            let preDispatchHeros = utils.deepCopyArray(this._dispatchHeros);
            if(this._dispatchHeros.length + filterHeros.length > DISPATCH_MAX_HEROS) {
                // for(let i = this._dispatchHeros.length, filterIndex = 0; i < DISPATCH_MAX_HEROS;) {
                //     let heroId = filterHeros[filterIndex];
                //     if(this._dispatchHeros.indexOf(heroId) == -1) {
                //         this._dispatchHeros.push(heroId);
                //         ++i;
                //     }
                //     ++filterIndex;
                // }
                this._dispatchHeros = filterHeros;
            } else {
                for(let i = 0; i < filterHeros.length; ++i) {
                    if(this._dispatchHeros.indexOf(filterHeros[i]) == -1) {
                        this._dispatchHeros.push(filterHeros[i]);
                    }
                }
            }
            if(this._checkDispatchSatisfy()) {
                this._refreshHeroList();
                this._refreshDispatchView();
            } else {
                this._dispatchHeros = preDispatchHeros;
                guiManager.showDialogTips(1000128);
                return;
            }
        }
    }

    private _filterDispatchHerosAI() {
        let notDispatchHeros = this._getNotDispatchHeros();
        let getMatchHerosFunc = (taskData: data.IDivineExpeditionTask) => {
            let matches: any[] = [];
            let needStars = taskData.NeedHeroStarList;
            if(!matches[NEED_TYPE.STAR]) {
                matches[NEED_TYPE.STAR] = new Array();
            }
            for(let i = 0; i < needStars.length; ++i) {
                let star = needStars[i];
                let matchHeros = notDispatchHeros.filter(_heroId => {
                    let heroUnit = bagData.getHeroById(_heroId);
                    return heroUnit.star >= star;
                });
                matches[NEED_TYPE.STAR][i] = matchHeros;
            }
            let needQualities = taskData.NeedHeroQualityList;
            if(!matches[NEED_TYPE.QUALITY]) {
                matches[NEED_TYPE.QUALITY] = new Array();
            }
            for(let i = 0; i < needQualities.length; ++i) {
                let quality = needQualities[i];
                let matchHeros = notDispatchHeros.filter(_heroId => {
                    let heroUnit = bagData.getHeroById(_heroId);
                    return heroUnit.heroCfg.HeroBasicQuality >= quality;
                });
                matches[NEED_TYPE.QUALITY][i] = matchHeros;
            }
            let needTrigrams = taskData.NeedHeroDiagramsList;
            if(!matches[NEED_TYPE.TRIGRAM]) {
                matches[NEED_TYPE.TRIGRAM] = new Array();
            }
            for(let i = 0; i < needTrigrams.length; ++i) {
                let trigram = this._getAlltypeHeroType(needTrigrams[i]);
                let matchHeros = notDispatchHeros.filter(_heroId => {
                    let heroUnit = bagData.getHeroById(_heroId);
                    return heroUnit.heroCfg.HeroBasicTrigrams == trigram;
                });
                matches[NEED_TYPE.TRIGRAM][i] = matchHeros;
            }

            let needEquipTypes = taskData.NeedHeroArmorList;
            if(!matches[NEED_TYPE.EQUIP_TYPE]) {
                matches[NEED_TYPE.EQUIP_TYPE] = new Array();
            }
            for(let i = 0; i < needEquipTypes.length; ++i) {
                let equipType = this._getAlltypeHeroType(needEquipTypes[i]);
                let matchHeros = notDispatchHeros.filter(_heroId => {
                    let heroUnit = bagData.getHeroById(_heroId);
                    return heroUnit.heroCfg.HeroBasicEquipType == equipType;
                });
                matches[NEED_TYPE.EQUIP_TYPE][i] = matchHeros;
            }

            let needAbilities = taskData.NeedHeroLocationList;
            if(!matches[NEED_TYPE.ABILITY]) {
                matches[NEED_TYPE.ABILITY] = new Array();
            }
            for(let i = 0; i < needAbilities.length; ++i) {
                let ability = this._getAlltypeHeroType(needAbilities[i]);
                let matchHeros = notDispatchHeros.filter(_heroId => {
                    let heroUnit = bagData.getHeroById(_heroId);
                    return heroUnit.heroCfg.HeroBasicAbility == ability;
                });
                matches[NEED_TYPE.ABILITY][i] = matchHeros;
            }

            return matches;
        }
        let filterHeros: number[] = [];
            let taskData = divineData.getTaskById(this._taskId);
            let matchesHeros = getMatchHerosFunc(taskData);
            if(!this._checkMathHerosSatisfy(matchesHeros)) {
                filterHeros = [];
            }
            let needTypes: number[][] = this._getNeedTypes(taskData);
            for(let i = 0; i < matchesHeros.length; ++i) {
                if(this._checkIsMatchEnd(needTypes)) {
                    continue;
                }
                let matchTypesHeros = matchesHeros[i];
                for(let j = 0; j < matchTypesHeros.length; ++j) {
                    if(this._checkIsMatchEnd(needTypes)) {
                        continue;
                    }
                    // 超出了派遣上限 所以不满足 返还派遣英雄
                    if(filterHeros && filterHeros.length >= DISPATCH_MAX_HEROS) {
                        notDispatchHeros = notDispatchHeros.concat(filterHeros);
                        filterHeros = [];
                        continue;
                    }
                    if(matchTypesHeros[j].length == 1) {
                        let heroId = matchTypesHeros[j][0];
                        let findIndex = notDispatchHeros.indexOf(heroId);
                        if(findIndex > -1) {
                            // 第一次在 未派遣中 未匹配的中 就找到了匹配英雄 则直接删除所有有关自己满足的属性
                            if(!filterHeros) {
                                filterHeros = new Array();
                            }
                            filterHeros.push(heroId);
                            notDispatchHeros.splice(findIndex, 1);
                            this._delMathTypes(heroId, needTypes)
                        }
                    } else {
                        let heroId = this._filterMatchHeros(needTypes, notDispatchHeros);
                        if(heroId > 0) {
                            let findIndex = notDispatchHeros.indexOf(heroId);
                            if(findIndex > -1) {
                                if(!filterHeros) {
                                    filterHeros = new Array();
                                }
                                filterHeros.push(heroId);
                                notDispatchHeros.splice(findIndex, 1);
                                this._delMathTypes(heroId, needTypes)
                            }
                        }
                    }
                    
                }
            }
        return filterHeros;
    }

    private _getNotDispatchHeros(): number[] {
        const tasks = divineData.tasksList;
        let heros = bagData.getItemsByType(BAG_ITEM_TYPE.HERO).map(_unit => { return Number(_unit.ID); });
        for(const k in tasks) {
            let dispatchHeros = tasks[k].HeroIDList;
            if(dispatchHeros && dispatchHeros.length > 0 && !this._checkTaskHeroNotDispatch(Number(k))) {
                for(let i = 0; i < dispatchHeros.length; ++i) {
                    let index = heros.indexOf(dispatchHeros[i]);
                    heros.splice(index, 1);
                }
            }
        }
        heros.sort((_a, _b) => {
            let _aCfg = configUtils.getHeroBasicConfig(_a);
            let _bCfg = configUtils.getHeroBasicConfig(_b);
            return _bCfg.HeroBasicQuality - _aCfg.HeroBasicQuality;
        });
        return heros;
    }

    private _filterMatchHeros(allTypes: number[][], notDispatchHeros: number[]): number {
        // 先找到最匹配的
        let getMatchCountFunc = (type: NEED_TYPE, heroId: number) => {
            let heroUnit = bagData.getHeroById(heroId);
            let matchCount: number = 0;
            let needTypes = allTypes[type];
            if(!needTypes) {
                return matchCount;
            }
            if(NEED_TYPE.STAR == type || NEED_TYPE.QUALITY == type) {
                let need = NEED_TYPE.STAR == type ? heroUnit.star : heroUnit.heroCfg.HeroBasicQuality;
                for(let i = 0; i < needTypes.length; ++i) {
                    if(need >= needTypes[i]) {
                        matchCount++;
                    }
                }
            } else {
                let need = 0;
                switch(type) {
                    case NEED_TYPE.TRIGRAM: {
                        need = heroUnit.heroCfg.HeroBasicTrigrams;
                        break;
                    }
                    case NEED_TYPE.EQUIP_TYPE: {
                        need = heroUnit.heroCfg.HeroBasicEquipType;
                        break;
                    }
                    case NEED_TYPE.ABILITY: {
                        need = heroUnit.heroCfg.HeroBasicAbility;
                        break;
                    }
                    default: {
                        break;
                    }
                }
                for(let i = 0; i < needTypes.length; ++i) {
                    let curType = this._getAlltypeHeroType(needTypes[i]);
                    if(curType == need) {
                        matchCount++;
                        return matchCount;
                    }
                }
            }
            return matchCount;
        }
        let matchMaxCount: number = 0;
        let maxCountHeroId: number = 0;
        notDispatchHeros.forEach(_heroId => {
            let matchCount = 0;
            matchCount += getMatchCountFunc(NEED_TYPE.STAR, _heroId);
            matchCount += getMatchCountFunc(NEED_TYPE.QUALITY, _heroId);
            matchCount += getMatchCountFunc(NEED_TYPE.TRIGRAM, _heroId);
            matchCount += getMatchCountFunc(NEED_TYPE.EQUIP_TYPE, _heroId);
            matchCount += getMatchCountFunc(NEED_TYPE.ABILITY, _heroId);
            if(matchCount > matchMaxCount) {
                matchMaxCount = matchCount;
                maxCountHeroId = _heroId;
            }
        });

        return maxCountHeroId;
    }

    private _checkDispatchSatisfy(): boolean {
        let herosAllTypes = this._getDispatchHerosAllNeedTypes();
        let checkIsActivityFunc = (list: number[], type: NEED_TYPE): boolean => {
            let clearCount: number = 0;
            for(let i = 0; i < list.length; ++i) {
                let curNum = Number(list[i]);
                let findIndex = -1;
                if(NEED_TYPE.STAR != type && NEED_TYPE.QUALITY != type) {
                    curNum = this._getAlltypeHeroType(curNum);
                    findIndex = herosAllTypes[type] ? herosAllTypes[type].indexOf(curNum) : -1;
                } else {
                    findIndex = herosAllTypes[type] ? herosAllTypes[type].findIndex(_needNum => { return _needNum >= curNum; }) : -1;
                }
                if(findIndex > -1) {
                    clearCount++;
                    herosAllTypes[type].splice(findIndex, 1);
                }
            }
            return clearCount >= list.length;
        }
        const taskData = divineData.getTaskById(this._taskId);
        if(taskData.NeedHeroStarList.length > 0 && !checkIsActivityFunc(taskData.NeedHeroStarList, NEED_TYPE.STAR)) {
            return false;
        }
        if(taskData.NeedHeroQualityList.length > 0 && !checkIsActivityFunc(taskData.NeedHeroQualityList, NEED_TYPE.QUALITY)) {
            return false;
        }
        if(taskData.NeedHeroLocationList.length > 0 && !checkIsActivityFunc(taskData.NeedHeroLocationList, NEED_TYPE.ABILITY)) {
            return false;
        }
        if(taskData.NeedHeroDiagramsList.length > 0 && !checkIsActivityFunc(taskData.NeedHeroDiagramsList, NEED_TYPE.TRIGRAM)) {
            return false;
        }
        if(taskData.NeedHeroArmorList.length > 0 && !checkIsActivityFunc(taskData.NeedHeroArmorList, NEED_TYPE.EQUIP_TYPE)) {
            return false;
        }
        return true;
    }

    private _delMathTypes(heroId: number, needTypes: number[][]) {
        let heroUnit = bagData.getHeroById(heroId);
        let star = heroUnit.star;
        let findIndex = needTypes[NEED_TYPE.STAR].findIndex(_star => { return star >= _star; });
        if(findIndex > -1) {
            needTypes[NEED_TYPE.STAR].splice(findIndex, 1);
        }
        let quality = heroUnit.heroCfg.HeroBasicQuality;
        findIndex = needTypes[NEED_TYPE.QUALITY].findIndex(_quality => { return quality >= _quality; });
        if(findIndex > -1) {
            needTypes[NEED_TYPE.QUALITY].splice(findIndex, 1);
        }
        let trigram = heroUnit.heroCfg.HeroBasicTrigrams;
        findIndex = needTypes[NEED_TYPE.TRIGRAM].findIndex(_trigram => {
            let needTrigram = this._getAlltypeHeroType(_trigram);
            return needTrigram == trigram; 
        });
        if(findIndex > -1) {
            needTypes[NEED_TYPE.TRIGRAM].splice(findIndex, 1);
        }
        let equipType = heroUnit.heroCfg.HeroBasicEquipType;
        findIndex = needTypes[NEED_TYPE.EQUIP_TYPE].findIndex(_equipType => {
            let needEquipType = this._getAlltypeHeroType(_equipType);
            return needEquipType == equipType; 
        });
        if(findIndex > -1) {
            needTypes[NEED_TYPE.EQUIP_TYPE].splice(findIndex, 1);
        }
        let ability = heroUnit.heroCfg.HeroBasicAbility;
        findIndex = needTypes[NEED_TYPE.ABILITY].findIndex(_ability => {
            let needAbility = this._getAlltypeHeroType(_ability);
            return needAbility == ability; 
        });
        if(findIndex > -1) {
            needTypes[NEED_TYPE.ABILITY].splice(findIndex, 1);
        }
    }

    private _getHeroList(): number[] {
        let heros = bagData.getItemsByType(BAG_ITEM_TYPE.HERO).map(_heroUnit => { return Number(_heroUnit.ID); });
        heros.sort((_a, _b) => {
            let _aState = this._getHeroDispatchState(_a);
            let _bState = this._getHeroDispatchState(_b);
            if(_aState == _bState) {
                let _aUnit = new HeroUnit(_a);
                let _bUnit = new HeroUnit(_b);
                return _bUnit.getCapability() - _aUnit.getCapability();
            } else {
                return _aState - _bState;
            }
        });
        return heros;
    }

    private _getHeroDispatchState(heroId: number): DISPATCH_STATE {
        let tasks = divineData.tasksList;
        for(const k in tasks) {
            let task = tasks[k];
            if(task.HeroIDList && task.HeroIDList.indexOf(heroId) > -1 && !this._checkTaskHeroNotDispatch(Number(k))) {
                return DISPATCH_STATE.DISPATCHED;
            }
        }
        return DISPATCH_STATE.NOT_DISPATCH;
    }

    private _getAlltypeHeroType(heroTypeId: number) {
        let allType = configUtils.getAllTypeCfg(heroTypeId);
        return allType.HeroTypeFormNum || 0;
    }

    private _getDispatchHerosAllNeedTypes(): number[][] {
        const curSelectHeros = this._dispatchHeros;
        let herosAllTypes: number[][] = [];
        curSelectHeros.forEach(_hero => {
            let heroUnit = bagData.getHeroById(_hero);
            if(!herosAllTypes[NEED_TYPE.STAR]) {
                herosAllTypes[NEED_TYPE.STAR] = new Array();
            }
            herosAllTypes[NEED_TYPE.STAR].push(heroUnit.star);
            if(!herosAllTypes[NEED_TYPE.QUALITY]) {
                herosAllTypes[NEED_TYPE.QUALITY] = new Array();
            }
            herosAllTypes[NEED_TYPE.QUALITY].push(heroUnit.heroCfg.HeroBasicQuality);
            if(!herosAllTypes[NEED_TYPE.TRIGRAM]) {
                herosAllTypes[NEED_TYPE.TRIGRAM] = new Array();
            }
            herosAllTypes[NEED_TYPE.TRIGRAM].push(heroUnit.heroCfg.HeroBasicTrigrams);
            if(!herosAllTypes[NEED_TYPE.EQUIP_TYPE]) {
                herosAllTypes[NEED_TYPE.EQUIP_TYPE] = new Array();
            }
            herosAllTypes[NEED_TYPE.EQUIP_TYPE].push(heroUnit.heroCfg.HeroBasicEquipType);
            if(!herosAllTypes[NEED_TYPE.ABILITY]) {
                herosAllTypes[NEED_TYPE.ABILITY] = new Array();
            }
            herosAllTypes[NEED_TYPE.ABILITY].push(heroUnit.heroCfg.HeroBasicAbility);
        });
        return herosAllTypes;
    }

    private _getNeedTypes(taskData: data.IDivineExpeditionTask): number[][] {
        let needTypes: number[][] = [];
        for(let i = 0; i <= NEED_TYPE.ABILITY; ++i) {
            let needList: number[] = [];
            if(!needTypes[i]) {
                needTypes[i] = new Array();
            }
            switch(i) {
                case NEED_TYPE.STAR: {
                    needList = taskData.NeedHeroStarList;
                    needList.sort((_a, _b) => {
                        return _b - _a;
                    });
                    break;
                }
                case NEED_TYPE.QUALITY: {
                    needList = taskData.NeedHeroQualityList;
                    needList.sort((_a, _b) => {
                        return _b - _a;
                    });
                    break;
                }
                case NEED_TYPE.TRIGRAM: {
                    needList = taskData.NeedHeroDiagramsList;
                    break;
                }
                case NEED_TYPE.EQUIP_TYPE: {
                    needList = taskData.NeedHeroArmorList;
                    break;
                }
                case NEED_TYPE.ABILITY: {
                    needList = taskData.NeedHeroLocationList;
                    break;
                }
                default: {
                    break;
                }
            }
            needTypes[i] = needTypes[i].concat(needList);
        }
        return needTypes;
    }

    private _convertToCountdownTime(interval: number): string {
        let timeStr = '';
        let pushTimeStr = (time: number, isShowDoubleZero: boolean = true, isEnd: boolean = false) => {
            if((!isShowDoubleZero && time > 0) || isShowDoubleZero) {
                timeStr += (time < 10 ? '0' + time : time) + '';
                if(!isEnd) {
                    timeStr += ":";
                }
            }
        }
        let hour: number = Math.floor(interval / 60 / 60);
        pushTimeStr(hour, false);
        let NotHourTime = interval % 3600;
        let minute = Math.floor(NotHourTime / 60);
        pushTimeStr(minute);
        let second = NotHourTime % 60;
        pushTimeStr(second, true, true);
        return timeStr;
    }

    private _checkIsMatchEnd(needTypes: number[][]): boolean {
        let findIndex = needTypes.findIndex(_array => {
            return _array.length > 0;
        });
        return findIndex == -1;
    }

    private _checkMathHerosSatisfy(mathHeroes: number[][][]): boolean {
        let isSatisfy: boolean = true;
        mathHeroes.forEach(_needTypes => {
            _needTypes.forEach(_heros => {
                if(isSatisfy && _heros.length <= 0) {
                    isSatisfy = false;
                }
            })
        });
        return isSatisfy;
    }

    private _checkTaskHeroNotDispatch(seq: number) {
        let task = divineData.getTaskById(seq);
        if(task && task.IsExecute) {
            let curTime = serverTime.currServerTime();
            let taskCfg = configUtils.getDispatchTaskConfig(task.TaskID);
            return curTime >= Number(task.ExecuteTime) + taskCfg.CostTime;
        }
        return true;
    }

}
