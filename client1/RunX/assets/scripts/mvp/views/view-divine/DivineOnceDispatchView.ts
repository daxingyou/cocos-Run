import { BAG_ITEM_TYPE } from "../../../app/AppEnums";
import { configUtils } from "../../../app/ConfigUtils";
import ButtonEx from "../../../common/components/ButtonEx";
import List from "../../../common/components/List";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { eventCenter } from "../../../common/event/EventCenter";
import { divineEvent } from "../../../common/event/EventData";
import guiManager from "../../../common/GUIManager";
import { logger } from "../../../common/log/Logger";
import { data, gamesvr } from "../../../network/lib/protocol";
import { bagData } from "../../models/BagData";
import { divineData, Divine_Task_Data } from "../../models/DivineData";
import { serverTime } from "../../models/ServerTime";
import { divineOpt } from "../../operations/DivineOpt";
import ItemOnceDispatch from "./ItemOnceDispatch";

export const enum NEED_TYPE {
    QUALITY,
    STAR,
    TRIGRAM,
    EQUIP_TYPE,
    ABILITY
}

export const MAX_MATCH_HEROS: number = 3;

const {ccclass, property} = cc._decorator;

@ccclass
export default class DivineOnceDispatchView extends ViewBaseComponent {
    @property(List) dispatchList: List = null;
    @property(ButtonEx) onceDispatchBtnCmp: ButtonEx = null;

    private _tasksList: number[] = [];
    private _filterHeros: number[][] = [];
    private _loadView: Function = null;
    private _selectedList: number[] = [];
    onInit(loadView: Function) {
        this._loadView = loadView;
        this.addEvent();
        this._dueData();
        this._refreshView();
        this._refreshList();
    }

    addEvent() {
        eventCenter.register(divineEvent.DISPATCH_SUC_EVENT, this, this.closeView);
    }
    
    onRelease() {
        eventCenter.unregisterAll(this);
        this.dispatchList._deInit();
    }

    private _dueData() {
        this._selectedList = [];
        this._tasksList = this._getTasksList();
        this._filterHeros = this._filterDispatchHerosAI();
        for(let i = 0; i < this._filterHeros.length; ++i) {
            if(this._filterHeros[i] && this._filterHeros[i].length > 0) {
                let taskId = this._tasksList.find(_taskId => { return _taskId == i; });
                this._selectedList.push(taskId);
            }
        }
        this._sortTasks();
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
        let filterHeros: number[][] = [];
        for(const k in this._tasksList) {
            let taskId = this._tasksList[k];
            let taskData = divineData.getTaskById(taskId);
            let matchesHeros = getMatchHerosFunc(taskData);
            logger.log('最初的匹配：', matchesHeros);
            if(!this._checkMathHerosSatisfy(matchesHeros)) {
                filterHeros[taskId] = [];
                continue;
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
                    if(filterHeros[taskId] && filterHeros[taskId].length >= MAX_MATCH_HEROS && !this._checkIsMatchEnd(needTypes)) {
                        continue;
                    }
                    if(matchTypesHeros[j].length == 1) {
                        let heroId = matchTypesHeros[j][0];
                        let findIndex = notDispatchHeros.indexOf(heroId);
                        if(findIndex > -1) {
                            // 第一次在 未派遣中 未匹配的中 就找到了匹配英雄 则直接删除所有有关自己满足的属性
                            if(!filterHeros[taskId]) {
                                filterHeros[taskId] = new Array();
                            }
                            filterHeros[taskId].push(heroId);
                            notDispatchHeros.splice(findIndex, 1);
                            this._delMathTypes(heroId, needTypes)
                        }
                    } else {
                        let heroId = this._filterMatchHeros(needTypes, notDispatchHeros);
                        if(heroId > 0) {
                            let findIndex = notDispatchHeros.indexOf(heroId);
                            if(findIndex > -1) {
                                if(!filterHeros[taskId]) {
                                    filterHeros[taskId] = new Array();
                                }
                                filterHeros[taskId].push(heroId);
                                notDispatchHeros.splice(findIndex, 1);
                                this._delMathTypes(heroId, needTypes)
                            }
                        }
                    }
                    
                }
            }
            if(!this._checkIsMatchEnd(needTypes) && filterHeros[taskId].length > 0) {
                notDispatchHeros = notDispatchHeros.concat(filterHeros[taskId]);
                notDispatchHeros.sort((_a, _b) => {
                    let _aCfg = configUtils.getHeroBasicConfig(_a);
                    let _bCfg = configUtils.getHeroBasicConfig(_b);
                    return _bCfg.HeroBasicQuality - _aCfg.HeroBasicQuality;
                });
                filterHeros[taskId] = [];
            }
            logger.log('匹配的英雄们: ', filterHeros);
        }
        return filterHeros;
    }

    private _refreshView() {
        let isSatisfy = this._checkOnceDispatchSatisfy() && this._selectedList.length > 0;
        this.onceDispatchBtnCmp.setGray(!isSatisfy);
    }

    private _refreshList() {
        this.dispatchList.numItems = this._tasksList.length;
    }

    onOnceDispatchItemRender(item: cc.Node, index: number) {
        let taskId = this._tasksList[index];
        let filterHeros = this._filterHeros[taskId];
        let isSelect = this._selectedList.indexOf(taskId) > -1;
        let onceDispatchItem = item.getComponent(ItemOnceDispatch);
        onceDispatchItem.init(taskId, filterHeros, this._loadView, isSelect);
    }

    onOnceDispatchItemSelect(item: cc.Node, index: number) {
        let taskId = this._tasksList[index];
        if(this._filterHeros[taskId] && this._filterHeros[taskId].length <= 0) {
            guiManager.showTips('需求英雄不足，无法完成派遣');
            return;
        }
        let findIndex = this._selectedList.indexOf(taskId);
        let isSelected = findIndex == -1;
        if(isSelected) {
            this._selectedList.push(taskId);
        } else {
            this._selectedList.splice(findIndex, 1);
        }
        let onceDispatchItem = item.getComponent(ItemOnceDispatch);
        onceDispatchItem.select = isSelected;
        onceDispatchItem.refreshSelectView();
        this._refreshView(); 
    }

    onClickDispatchBtn() {
        if(this._checkOnceDispatchSatisfy()) {
            let tasks: gamesvr.IDivineExpeditionJoinTask[] = [];
            for(let i = 0; i < this._tasksList.length; ++i) {
                let taskId = this._tasksList[i];
                if(this._filterHeros[taskId] && this._filterHeros[taskId].length > 0 && this._selectedList.indexOf(taskId) > -1) {
                    tasks.push({
                        Seq: taskId,
                        HeroIDList: this._filterHeros[taskId]
                    })
                }
            }
            if(tasks.length <= 0) {
                guiManager.showTips('未选择派遣队伍');
            } else {
                divineOpt.sendDispatch(tasks);
            }
        } else {
            guiManager.showTips('未满足派遣条件');
        }
    }

    private _sortTasks() {
        this._tasksList.sort((_a, _b) => {
            let taskA = divineData.getTaskById(_a);
            let taskB = divineData.getTaskById(_b);
            let aSatisfy = this._selectedList.indexOf(_a) > -1 ? 1 : 0;
            let bSatisfy = this._selectedList.indexOf(_b) > -1 ? 1 : 0;
            if(aSatisfy == bSatisfy) {
                let taskACfg = configUtils.getDispatchTaskConfig(taskA.TaskID);
                let taskBCfg = configUtils.getDispatchTaskConfig(taskB.TaskID);
                if(taskACfg.DispatchQuality == taskBCfg.DispatchQuality) {
                    return taskBCfg.DispatchStar - taskACfg.DispatchStar;
                } else {
                    return taskBCfg.DispatchQuality - taskACfg.DispatchQuality;
                }
            } else {
                return bSatisfy - aSatisfy;
            }
        })
    }

    private _checkOnceDispatchSatisfy(): boolean {
        return this._filterHeros.findIndex(_heros => {
            return _heros && _heros.length > 0;
        }) > -1;
    }

    private _checkIsMatchEnd(needTypes: number[][]): boolean {
        let findIndex = needTypes.findIndex(_array => {
            return _array.length > 0;
        });
        return findIndex == -1;
    }

    private _getTasksList() {
        let tasksList = divineData.tasksList;
        let divineTasks = [];
        for(const k in tasksList) {
            if(tasksList[k] && !tasksList[k].IsExecute) {
                divineTasks.push(Number(k));
            }
        }
        divineTasks.sort((_a, _b) => {
            let taskA = divineData.getTaskById(_a);
            let taskB = divineData.getTaskById(_b);
            let taskACfg = configUtils.getDispatchTaskConfig(taskA.TaskID);
            let taskBCfg = configUtils.getDispatchTaskConfig(taskB.TaskID);
            if(taskACfg.DispatchQuality == taskBCfg.DispatchQuality) {
                return taskBCfg.DispatchStar - taskACfg.DispatchStar;
            } else {
                return taskBCfg.DispatchQuality - taskACfg.DispatchQuality;
            }
        });
        return divineTasks;
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

    // private _filterShowCountHeros(matchHeros: any[]) {
    //     let notDispatchHeros = this._getNotDispatchHeros();
    //     let filterShowCountList: {heroId: number, count: number}[][] = [];
    //     notDispatchHeros.forEach(_heroId => {
    //         let showCount: number = 0;
    //         for(let i = 0; i < SAME_MAX_MATCH_TYPE; ++i) {
    //             let heros = [];
    //             for(let j = 0; j <= NEED_TYPE.ABILITY; ++j) {
    //                 heros = matchHeros[j][i] ? matchHeros[j][i] : matchHeros[j][i < matchHeros[j].length ? i : matchHeros.length - 1];
    //                 if(heros) {
    //                     if(heros.indexOf(_heroId) > -1) {
    //                         showCount++;
    //                     }
    //                 }
    //             }
    //             if(showCount > 0) {
    //                 if(!filterShowCountList[i]) {
    //                     filterShowCountList[i] = new Array();
    //                 }
    //                 filterShowCountList[i].push({
    //                     heroId: _heroId,
    //                     count: showCount
    //                 });
    //             }
    //         }
    //     });
    //     return filterShowCountList;
    // }

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

    private _getAlltypeHeroType(heroTypeId: number) {
        let allType = configUtils.getAllTypeCfg(heroTypeId);
        return allType.HeroTypeFormNum || 0;
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
