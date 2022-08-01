import { bagData } from "../../models/BagData";
import { pveFakeData } from "../../models/PveFakeData";
import ItemHeadSquare, { SquareHeadOption } from "../view-item/ItemHeadSquare";
import DragableItem from '../../../common/components/DragableItem';
import { battleUtils } from "../../../app/BattleUtils";
import { pveData } from "../../models/PveData";
import { ItemHeroHeadSquarePool } from "../../../common/res-manager/NodePool";
import UIGridView, { GridData } from "../../../common/components/UIGridView";
import { PVE_MODE } from "../../../app/AppEnums";
import { pveTrialData } from "../../models/PveTrialData";
import { HERO_ENERGY_MAX } from "../../../app/AppConst";
import HeroUnit from "../../template/HeroUnit";
import guiManager from "../../../common/GUIManager";

const {ccclass, property} = cc._decorator;
/**
 * 这个组件其实可以做成更通用，战队备战，跑酷备战，编队界面，完全可以做一个单独的组件
 * 但是这3个界面由三个不同的人开发，适配性比较差，后续优化可以抽出来做一个通用的组件 -dex
 */
interface UIInfo {
    click: Function, 
    longClick: Function,
    longClickIntrupt: Function,
    longClickChange: Function,
    switchClick: Function,
    dragRoot: cc.Node,
    attachComp: cc.Component,
    initSquareHeadOption?: Function
}

@ccclass
export default class PreinstallHeroListComp extends cc.Component {
    @property(UIGridView) grid: UIGridView = null;

    private _clickHandle: Function = null;
    private _longClickHandle: Function = null;
    private _clickSwitchTeamShowHandle: Function = null;
    private _longClickPbChanged: Function = null;
    private _longClickInterrupted: Function = null;
    private _isFakeHero: boolean = false;
    private _heros: number[] = [];
    private _dragNodeAttachedNode: cc.Node = null; //scrollView元素可拖拽的时候，复制的item依附的节点
    private _attacedComp: cc.Component = null;     //依赖的组件，主要用于判断拖动操作
    private _currUpHeros: number[];
    private _multiHero: Map<number, number[]> = null;
    private _initSquareHeadOption: Function = null;

    onInit (clickInfo: UIInfo) {
        this.grid.clear();
        this._currUpHeros = [];
        this._isFakeHero = false;

        this._longClickPbChanged = clickInfo.longClickChange;
        this._longClickInterrupted = clickInfo.longClickIntrupt;
        this._clickHandle = clickInfo.click;
        this._longClickHandle = clickInfo.longClick
        this._clickSwitchTeamShowHandle = clickInfo.switchClick;

        this._attacedComp = clickInfo.attachComp;
        this._dragNodeAttachedNode = clickInfo.dragRoot;
        this._initSquareHeadOption = clickInfo?.initSquareHeadOption;
    }

    onRefresh (heros: number[], upHeroes: number[], isFakeHero?: boolean, multiHero?: Map<number, number[]>) {
        this._isFakeHero = isFakeHero ? isFakeHero : false;
        this._currUpHeros = upHeroes;
        this._multiHero = multiHero;
        this._updateListData(heros);
    }

    deInit() {
        this._dragNodeAttachedNode = null;
        this._longClickPbChanged = null;
        this._longClickInterrupted = null;
        this._attacedComp = null;
        this.grid.clear();
    }

    private _updateListData(heros: number[]) {
        this._heros = heros;
        this._sortHeroList();
        this._refreshHeroList();
    }

    updateOneData(heroId: number, isAdd: boolean = true, multiHero?: Map<number, number[]>) {
        let findIndex = this._heros.indexOf(heroId);
        let upIndex = this._currUpHeros.indexOf(heroId);
        let isRefresh: boolean = false;
        this._multiHero = multiHero;
        if(isAdd) {
            if(heroId > 0) {
                if (findIndex == -1) {
                    isRefresh = true;
                    this._heros.push(heroId);
                }
                if (upIndex > -1) {
                    this._currUpHeros.splice(upIndex, 1);
                }
            }
        } else {
            if(findIndex > -1) {
                isRefresh = true;
                this._heros.splice(findIndex, 1);
            }
            if (upIndex == -1) {
                this._currUpHeros.push(heroId);
            }
        }

        if(isRefresh) {
            this._sortHeroList();
            this._refreshHeroList(true);
        }
    }

    private _sortHeroList() {
        this._heros.sort((_a, _b) => {
            if (!_a) return 1;
            if (!_b) return -1;
            let heroUnit1:HeroUnit = this._isFakeHero ? pveFakeData.getFakeHeroById(_a) : bagData.getHeroById(_a);
            let heroUnit2:HeroUnit = this._isFakeHero ? pveFakeData.getFakeHeroById(_b) : bagData.getHeroById(_b);

            // 排序优先级：可用 > 不可用，阵容禁用 > 副本禁用
            if (pveData.checkHeroBan(heroUnit1.basicId) && !pveData.checkHeroBan(heroUnit2.basicId)) {
                return 1
            }

            if (pveData.checkHeroBan(heroUnit2.basicId) && !pveData.checkHeroBan(heroUnit1.basicId)) {
                return -1
            }

            if (pveData.checkPveBanHero(heroUnit1.basicId) && !pveData.checkPveBanHero(heroUnit2.basicId)) {
                return -1
            }

            if (pveData.checkPveBanHero(heroUnit2.basicId) && !pveData.checkPveBanHero(heroUnit1.basicId)) {
                return 1
            }

            return heroUnit2.getCapability() - heroUnit1.getCapability();
        });
    }

    private _refreshHeroList (onlyRefresh: boolean = false) {
        let heroes = this._heros;
        let self = this;
        let gridDatas: GridData[]  = heroes.map( (_v, _idx) => {
            return {
                key: _idx.toString(),
                data: _v,
            }
        })
        if (onlyRefresh) {
            this.grid.updateDatas(gridDatas);
            return;
        }
        this.grid.init(gridDatas, {
            onInit: (itemCmp: ItemHeadSquare, data: GridData) => {
                self._onItemUpdate(itemCmp, parseInt(data.key));
            },
            getItem: (): ItemHeadSquare => {
                let itemNode = ItemHeroHeadSquarePool.get()
                return itemNode;
            },
            releaseItem: (itemCmp: ItemHeadSquare) => {
                ItemHeroHeadSquarePool.put(itemCmp)
            },
        });
    }

    private _onItemUpdate (item: ItemHeadSquare, index: number) {
        let heroId = this._heros[index];

        // 英雄有状态，则需要显示血量和能量
        let options: SquareHeadOption = null;
        this._initSquareHeadOption && (options = this._initSquareHeadOption(heroId));

        //scrollView元素可拖拽,需要挂载拖拽组件
        let comp = item;
        if (options && options.hp <= 0) {
            comp.init(heroId, null, null, options);
        } else if(cc.isValid(this._dragNodeAttachedNode)){
            comp.init(heroId, null, null, options);

            let dragComp = item.getComponent(DragableItem);
            if(!dragComp){
                dragComp = item.addComponent(DragableItem);
            }
            dragComp.init(
                this.grid.node.getComponent(cc.ScrollView), 
                this._dragNodeAttachedNode, 
                false,
                undefined, 
                this._onItemClick.bind(this),
                this._onItemDrag.bind(this), 
                this._onItemUsed.bind(this), 
                this._onItemLongClick.bind(this), 
                index
            );
            dragComp.longClickProgressCb = this._onLongClickPbChanged.bind(this);
            dragComp.longClickInterruptCb = this._onLongClickInterrupt.bind(this);
        } else {
            comp.init(heroId, this._clickHandle, this._longClickHandle, options);
        }

        let recommend = battleUtils.getFriendHeroRecommand(this._currUpHeros, heroId, pveData.magicDoor)
        comp.showWillActivityFriend(recommend);

        let getMulIdx = battleUtils.getMultiHeroIndex(heroId, this._multiHero);
        comp.showMultiBattleIdx(getMulIdx)
    }

    private _onLongClickInterrupt(){
        this._longClickInterrupted && this._longClickInterrupted();
    }

    private _onLongClickPbChanged(progress: number, pos: cc.Vec2){
      this._longClickPbChanged && this._longClickPbChanged(progress, pos);
    }

    onClickSwitchTeamShowBtn() {
        this._clickSwitchTeamShowHandle && this._clickSwitchTeamShowHandle();
    }

    private _onItemClick(comp: DragableItem, idx: number): boolean{
        this._clickHandle && this._clickHandle(this._heros[idx]);
        return true;
    }

    private _onItemLongClick(idx: number){
        this._longClickHandle && this._longClickHandle(this._heros[idx]);
    }

    private _onItemUsed(comp: DragableItem, idx: number, cb: Function) {
        cb && cb();
    }

    private _onItemDrag(comp: DragableItem, node: cc.Node, idx: number): boolean{
        //@ts-ignore
        if(!cc.isValid(this._attacedComp) || !this._attacedComp.checkUsedHero) return false;
        //@ts-ignore
        let isUsed = this._attacedComp.checkUsedHero(node, this._heros[idx]);
        return isUsed;
    }
}
