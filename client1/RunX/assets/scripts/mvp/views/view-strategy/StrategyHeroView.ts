
import { EQUIP_PART_TYPE, HERO_ABILITY, HERO_EQUIP_TYPE, QUALITY_TYPE } from "../../../app/AppEnums";
import { utils } from "../../../app/AppUtils";
import { bagDataUtils } from "../../../app/BagDataUtils";
import { configUtils } from "../../../app/ConfigUtils";
import UIGridView, { GridData } from "../../../common/components/UIGridView";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { configManager } from "../../../common/ConfigManager";
import { eventCenter } from "../../../common/event/EventCenter";
import { StrategyEvents } from "../../../common/event/EventData";
import { ItemHeroHeadSquarePool } from "../../../common/res-manager/NodePool";
import { preloadHeadSquarePool } from "../../../common/res-manager/Preloaders";
import { cfg } from "../../../config/config";
import { data } from "../../../network/lib/protocol";
import { bagData } from "../../models/BagData";
import { userData } from "../../models/UserData";
import { strategyOpt } from "../../operations/StrategyOpt";
import ItemHeadSquare from "../view-item/ItemHeadSquare";
import ItemStrategyHero from "./item/ItemStrategyHero";

const {ccclass, property} = cc._decorator;

@ccclass
export default class StrategyHeroView extends ViewBaseComponent {
    @property(cc.Label) heroName: cc.Label = null;
    @property(cc.Node) filterLayout: cc.Node = null;
    @property(cc.Label) filterTip: cc.Label = null;
    @property(UIGridView) strategyGView: UIGridView = null;
    @property(cc.Prefab) prefab: cc.Prefab = null;
    @property(UIGridView) heroViewList: UIGridView = null;
    @property(cc.Node) emptyNode: cc.Node = null;

    private _heroList: number[] = null;
    private _mainHeroViewFilterInfo: number[] = [0, -1];                // 筛选记录
    private _heroViewShowInfos: number[] = [];                          // 英雄列表总数据
    private _curSelectHeroId: number = 0;                               // 当前选择的英雄id
    private _strategyHeroCfgs: cfg.StrategyHero[] = null;
    private _isHeroGVInited: boolean = false;

    private _nodePool: cc.NodePool = null;

    private _heroPropMap: Map<number, {[key: string]: number}> = null;

    preInit(...rest: any[]): Promise<any> {
        this.filterLayout.active = false;
        this.emptyNode.active = false;
        return new Promise((resolve, reject) => {
            preloadHeadSquarePool().start(() => {
                resolve(true);
            })
        });
    }

    protected onInit(...args: any[]): void {
        this._nodePool = this._nodePool || new cc.NodePool();
        this._registerEvents();
        this._initCfgs();
        this.updateFilterData(true);
    }

    protected onRelease(): void {
        eventCenter.unregisterAll(this);
        this.heroViewList.clear();
        this.strategyGView.clear();
        this._heroList = null;
        this._strategyHeroCfgs = null;
        this._nodePool && this._nodePool.clear();
        this._isHeroGVInited = false;
        this._heroPropMap && this._heroPropMap.clear();
    }

    private _registerEvents() {
        eventCenter.register(StrategyEvents.RECV_HERO_RES, this, this._onRecvStrategyHero);
    }

    onClickFilterBtn () {
        this.filterLayout.active = !this.filterLayout.active;
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

    private _getFilterData(): number[] {
        let hasRoleList: data.IBagUnit[] = utils.deepCopyArray(bagData.heroList);
        let ownRoleList: number[] = [];
        let notOwnRoleList: number[] = [];
        let findIndexCb = (cfg: cfg.HeroBasic) => {
            let heroIdx = hasRoleList.findIndex(heroUnit => {return heroUnit.ID == cfg.HeroBasicId});
            //拥有的英雄
            if(heroIdx != -1){
                ownRoleList.push(cfg.HeroBasicId);
            } else {
                notOwnRoleList.push(cfg.HeroBasicId);
            }
        }
        this._heroList && this._heroList.forEach(ele => {
            let heroCfg: cfg.HeroBasic = configUtils.getHeroBasicConfig(ele);
            if(this._mainHeroViewFilterInfo[0] == 0) {
                findIndexCb(heroCfg);
                return;
            }
            if (this._mainHeroViewFilterInfo[0] != -1 && this._mainHeroViewFilterInfo[1] != -1) {
                if ((this._mainHeroViewFilterInfo[0] == 1 && this._mainHeroViewFilterInfo[1] == heroCfg.HeroBasicQuality)
                    || (this._mainHeroViewFilterInfo[0] == 2 && this._mainHeroViewFilterInfo[1] == heroCfg.HeroBasicTrigrams)
                    || (this._mainHeroViewFilterInfo[0] == 3 && this._mainHeroViewFilterInfo[1] == heroCfg.HeroBasicAbility)
                    || (this._mainHeroViewFilterInfo[0] == 4 && this._mainHeroViewFilterInfo[1] == heroCfg.HeroBasicEquipType)) {
                    findIndexCb(heroCfg);
                }
            }
        });

        let sortPower = (a: number, b: number) => {
            let aCfg: cfg.HeroBasic = configUtils.getHeroBasicConfig(a);
            let bCfg: cfg.HeroBasic = configUtils.getHeroBasicConfig(b);
            return bCfg.HeroBasicQuality - aCfg.HeroBasicQuality;
        }
        ownRoleList.sort(sortPower);
        notOwnRoleList.sort(sortPower);
        return ownRoleList.concat(notOwnRoleList);
    }

    // 点击全部
    onClickAll() {
        // todo 根据战斗力排下序
        this._mainHeroViewFilterInfo = [0, -1];
        this.resetFilter();
    }

    resetFilter() {
        this.filterLayout.active = false;
        this.filterTip.string = '全部';
        this.updateFilterData();
    }

    updateFilterData(isForceUpdate: boolean = false) {
        this._heroViewShowInfos = this._getFilterData();
        this._refreshHeroList(isForceUpdate);
    }

    // 英雄品质
    onClickQuality(toogle: cc.Toggle, customEventData: QUALITY_TYPE, isClick: Boolean = true) {
        if (isClick) {
            let curQualityIndex = this._mainHeroViewFilterInfo[1];
            if (curQualityIndex != customEventData) {
                this._mainHeroViewFilterInfo = [1, Number(customEventData)];
                // 刷新筛选按钮状态
                let tipsString: string[] = ['', '', '', 'R', 'SR', 'SSR', 'SP'];
                toogle.node.parent.active = false;
                this.updateFilterView(tipsString[Number(customEventData)]);
            } else {
                this.filterLayout.active = false;
                toogle.node.parent.active = false;
            }
        } else {
            // 刷新筛选按钮状态
            let tipsString: string[] = ['', '', '', 'R', 'SR', 'SSR', 'SP'];
            this.updateFilterView(tipsString[Number(customEventData)]);
        }
    }

    // 英雄卦象
    onClickTrigrames(event: cc.Toggle, customEventData: HERO_ABILITY, isClick: Boolean = true) {
        if (isClick) {
            let curTrigramsIndex: number = this._mainHeroViewFilterInfo[1];
            if (curTrigramsIndex != Number(customEventData)) {
                this._mainHeroViewFilterInfo = [2, Number(customEventData)];

                // 刷新筛选按钮状态
                let tipsString: string[] = ['', '天', '地', '风', '雷', '水', '火', '山', '泽'];
                event.node.parent.active = false;
                this.updateFilterView(tipsString[Number(customEventData)]);
            } else {
                this.filterLayout.active = false;
                event.node.parent.active = false;
            }
        } else {
            // 刷新筛选按钮状态
            let tipsString: string[] = ['', '天', '地', '风', '雷', '水', '火', '山', '泽'];
            this.updateFilterView(tipsString[Number(customEventData)]);
        }
    }

    // 英雄定位
    onClickAbility(event: cc.Toggle, customEventData: HERO_ABILITY, isClick: Boolean = true) {
        if (isClick) {
            let cuiAbilityIndex: number = this._mainHeroViewFilterInfo[1];
            if (cuiAbilityIndex != Number(customEventData)) {
                this._mainHeroViewFilterInfo = [3, Number(customEventData)];
                // 刷新筛选按钮状态
                let tipsString: string[] = ['', '输出', '承伤', '控制', '辅助', '治疗'];
                event.node.parent.active = false;
                this.updateFilterView(tipsString[Number(customEventData)]);

            } else {
                this.filterLayout.active = false;
                event.node.parent.active = false;
            }
        } else {
            // 刷新筛选按钮状态
            let tipsString: string[] = ['', '输出', '承伤', '控制', '辅助', '治疗'];
            this.updateFilterView(tipsString[Number(customEventData)]);
        }
    }

    // 英雄装备类型
    onClickEquipType(event: cc.Toggle, customEventData: HERO_EQUIP_TYPE, isClick: Boolean = true) {
        if (isClick) {
            let curEquipType: number = this._mainHeroViewFilterInfo[1];
            if (curEquipType != Number(customEventData)) {
                this._mainHeroViewFilterInfo = [4, Number(customEventData)];
                // 刷新筛选按钮状态
                let tipsString: string[] = ['', '板甲', '皮甲', '布甲'];
                event.node.parent.active = false;
                this.updateFilterView(tipsString[Number(customEventData)]);
            } else {
                this.filterLayout.active = false;
                event.node.parent.active = false;
            }
        } else {
            // 刷新筛选按钮状态
            let tipsString: string[] = ['', '板甲', '皮甲', '布甲'];
            this.updateFilterView(tipsString[Number(customEventData)]);
        }
    }

    updateFilterView(string: string) {
        this.filterTip.string = string;
        this.filterLayout.active = false;
        this.updateFilterData();
    }

    private _refreshHeroList(isForceUpdate: boolean = false) {
        this.heroViewList.clear();

        if(isForceUpdate) {
            this._curSelectHeroId = this._heroViewShowInfos[0] || 0;
            this._refreshHeroStrategyInfo(this._curSelectHeroId);
        }

        let gridDatas:GridData[] = this._heroViewShowInfos.map(ele => {
            return {
                key: ele+'',
                data: ele
            }
        });
        this.heroViewList.init(gridDatas, {
            onInit: (item: ItemHeadSquare, data: GridData) => {
                let curHeroID: number = data.data;
                item.init(curHeroID, (heroID: number) => {
                    if(heroID != this._curSelectHeroId) {
                        this._curSelectHeroId = heroID;
                        let visiblesItem: Map<string, ItemHeadSquare> = this.heroViewList.getItems() as Map<string, ItemHeadSquare>;
                        visiblesItem.forEach(ele => {
                            ele.setChecked(ele.heroID == this._curSelectHeroId);
                        })
                        this._refreshHeroStrategyInfo(heroID);
                    }
                });
                item.setChecked(curHeroID == this._curSelectHeroId);
            },
            releaseItem: (item: ItemHeadSquare) => {
                item.node.active = true;
                ItemHeroHeadSquarePool.put(item);
            },
            getItem: ():ItemHeadSquare => {
                return ItemHeroHeadSquarePool.get();
            }
        });
    }

    // 刷新英雄攻略信息
    private _refreshHeroStrategyInfo(heroID: number) {
        let heroCfg: cfg.HeroBasic = configUtils.getHeroBasicConfig(heroID);
        this.heroName.string = heroCfg.HeroBasicName || '';

        if(!this._isHeroExist()) {
            this.emptyNode.active = true;
            this.strategyGView.node.active = false;
            return;
        }

        this.emptyNode.active = false;
        this.strategyGView.node.active = true;

        this._refreshHeroGV();
        this._getHeroProgress(heroID);
    }

    private _refreshHeroGV() {
        if(this._isHeroGVInited) {
            this.strategyGView.scrollTo({key:this._strategyHeroCfgs[0].StrategyHeroId + '', data: this._strategyHeroCfgs[0]});
            let visibleMap: Map<string, ItemStrategyHero> = this.strategyGView.getItems() as Map<string, ItemStrategyHero>;
            let heroBasicCfg = configUtils.getHeroBasicConfig(this._curSelectHeroId);
            if(heroBasicCfg && heroBasicCfg.HeroBasicExclusive && !this.strategyGView.getGridData('5')) {
                this.strategyGView.addItems([{key:this._strategyHeroCfgs[4].StrategyHeroId + '', data: this._strategyHeroCfgs[4]}]);
            } else if(heroBasicCfg && !heroBasicCfg.HeroBasicExclusive && this.strategyGView.getGridData('5')) {
                this.strategyGView.deleteItem('5');
            }
            visibleMap.forEach((value, key) => {
                value.refreshView();
            });
            return;
        }

        let gridData: GridData[] = [];
        this._strategyHeroCfgs.forEach(ele => {
            let heroBasicCfg = configUtils.getHeroBasicConfig(this._curSelectHeroId);
            if(ele.StrategyHeroId != 5 || (ele.StrategyHeroId == 5 && heroBasicCfg && heroBasicCfg.HeroBasicExclusive)) {
                gridData.push({
                    key: ele.StrategyHeroId +'',
                    data: ele,
                });
            }
        });

        this.strategyGView.init(gridData, {
            onInit: (item: ItemStrategyHero, data: GridData) => {
                let cfg: cfg.StrategyHero = data.data as cfg.StrategyHero;
                item.init(cfg, this._getHeroProp.bind(this));
            },
            releaseItem: (item: ItemStrategyHero) => {
                item.deInit();
                this._nodePool.put(item.node);
            },
            getItem: (): ItemStrategyHero => {
                let node = this._getItem();
                node.active = true;
                return node.getComponent(ItemStrategyHero);
            }
        });
        this._isHeroGVInited = true;
    }

    private _initCfgs() {
        if(!this._heroList) {
            this._heroList = [];
            let heroList: cfg.HeroBasic[] = configManager.getConfigList('heroBasic');
            heroList && heroList.forEach(ele => {
                if(ele.HeroBasicIfOper) {
                    this._heroList.push(ele.HeroBasicId);
                }
            });
        }

        if(!this._strategyHeroCfgs) {
            this._strategyHeroCfgs = configManager.getConfigList('strategyHero');
        }
    }

    private _getItem() : cc.Node {
        if(this._nodePool.size() > 0) {
            return this._nodePool.get();
        }
        let node = cc.instantiate(this.prefab);
        return node;
    }

    private _getHeroProgress(heroID: number) {
        strategyOpt.sendEpochStrategyViewHeroReq(heroID);
    }

    private _onRecvStrategyHero(eventID: number, heroID: number, data: data.IEpochStrategyHero) {
        this._heroPropMap = this._heroPropMap || new Map();
        this._heroPropMap.set(heroID, data.DegreeMap);
        if(this._curSelectHeroId != heroID) return;
        let visibleMap: Map<string, ItemStrategyHero> = this.strategyGView.getItems() as Map<string, ItemStrategyHero>;
        visibleMap.forEach((value, key) => {
            value.refreshView();
        });
    }

    private _getHeroProp(type: number): any {
        if(!this._heroPropMap || !this._heroPropMap.has(this._curSelectHeroId)) return null;

        if(!this._isHeroExist()) return null;

        let currV: number = null;
        if(type == 1) {
            currV = this._getHeroLv(this._curSelectHeroId);
        } else if(type == 2) {
            currV = this._getHeroCapability(this._curSelectHeroId);
        } else if(type == 3) {
            currV = this._getHeroGift(this._curSelectHeroId);
        } else if(type == 4) {
            currV = this._getHeroStar(this._curSelectHeroId);
        } else if(type == 5) {
            currV = this._getHeroSpecialEquipStar(this._curSelectHeroId);
        }

        let heroProp = this._heroPropMap.get(this._curSelectHeroId);
        let maxV: number = (heroProp && heroProp.hasOwnProperty(type + '')) ? heroProp[type + ''] : 0
        return {curV: currV, maxV: maxV, type: type};
    }

    // 英雄等级
    private _getHeroLv(heroID: number) : number {
        return userData.lv;
    }

    //英雄战力
    private _getHeroCapability(heroID: number) : number {
        return bagData.getHeroById(heroID).getCapability();
    }

    // 英雄激活天赋数量
    private _getHeroGift(heroID: number) : number {
        let gifts = bagData.getHeroById(heroID).gift;
        if(!gifts) return 0;

        let count = 0;
        for (let k in gifts) {
            gifts[k] && (count += 1);
        }
        return count;
    }

    // 英雄星级
    private _getHeroStar(heroID: number) : number {
        return bagData.getHeroById(heroID).star;
    }

    // 专属装备星级
    private _getHeroSpecialEquipStar(heroID: number) : number {
        let heroUnit = bagData.getHeroById(heroID);
        let equip = heroUnit.getHeroEquipByPart(EQUIP_PART_TYPE.EXCLUSIVE);
        let star = 0;
        if(equip && equip.EquipUnit) {
            if(equip.EquipUnit.Star) return  equip.EquipUnit.Star;
            let equipCfg = configUtils.getEquipConfig(equip.ID);
            star = bagDataUtils.getEquipBeginStar(equipCfg)
        }
        return star;
    }

    private _isHeroExist() {
        let heroUnit = bagData.getHeroById(this._curSelectHeroId);
        return !!(heroUnit && heroUnit.isHeroBasic);
    }
}
