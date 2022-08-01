/*
 * @Description:
 * @Version: 1.0
 * @Autor: lixu
 * @Date: 2022-05-26 16:45:14
 * @LastEditors: lixu
 * @LastEditTime: 2022-05-27 13:43:27
 */
import { RES_ICON_PRE_URL } from "../../../app/AppConst";
import { utils } from "../../../app/AppUtils";
import UIGridView, {GridData} from "../../../common/components/UIGridView";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { configManager } from "../../../common/ConfigManager";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { cfg } from "../../../config/config";
import ItemStrategyMoneyItem from "./item/ItemStrategyMoneyItem";
import ItemStrategyGetItem, { StrategyGetItemWayInfo } from "./item/ItemStrategyGetItem";

const {ccclass, property} = cc._decorator;

@ccclass
export default class StrategyGetItemView extends ViewBaseComponent {
    @property(cc.Label) itemName: cc.Label = null;
    @property(cc.Sprite) itemIcon: cc.Sprite = null;
    @property(cc.Label) itemUse: cc.Label = null;
    @property(UIGridView) getWayGridView: UIGridView = null;
    @property(UIGridView) itemGridView: UIGridView = null;
    @property(cc.Prefab) prefab: cc.Prefab = null;
    @property(cc.Node) templateItem: cc.Node = null;

    private _getItemCfgs: cfg.StrategyMoney[] = null;
    private _spLoader: SpriteLoader = null;
    private _moneyItemPool: cc.NodePool = new cc.NodePool();
    private _wayItemPool: cc.NodePool = new cc.NodePool();
    private _seleMoneyItemIDx: number = -1;
    private _getItemWayInfo: Map<number, StrategyGetItemWayInfo[]> = new Map();

    protected onInit(...args: any[]): void {
        this._spLoader = this._spLoader || new SpriteLoader();
        this._getItemCfgs = this._getItemCfgs || configManager.getConfigList('strategyMoney');
        this._seleMoneyItemIDx = this._getItemCfgs[0].StrategyMoneyId;
        this._initItemList();
        this._switchMoneyView();
    }

    private _parseCfg(cfg: cfg.StrategyMoney) {
        if(!cfg || this._getItemWayInfo.has(cfg.StrategyMoneyId)) return;
        let getWay: string = cfg.StrategyMoneyGetAway;
        getWay = getWay.replace(/\s/gm, '');
        if(!getWay) return;

        let params: StrategyGetItemWayInfo[] = null;
        utils.parseStingList(getWay, (strArr: string[]) => {
            if(!strArr || strArr.length == 0) return;
            let title = strArr[0], desc = strArr[1];
            let jumpParam: any[] = null;
            strArr.length > 2 && (jumpParam = strArr.slice(2));
            if(jumpParam) {
                for(let i = 0, len = jumpParam.length; i < len; i++) {
                    jumpParam[i] = parseInt(jumpParam[i]);
                }
            }
            params = params|| [];
            params.push({title: title, desc: desc, jumpParam: jumpParam});
        })
        this._getItemWayInfo.set(cfg.StrategyMoneyId, params);
    }

    private _initItemList() {
        let gridData: GridData[] = this._getItemCfgs.map((ele, idx) => {
            return {
                key: ele.StrategyMoneyId +'',
                data: ele,
            }
        });
        this.itemGridView.init(gridData, {
            onInit: (item: ItemStrategyMoneyItem, data: GridData) => {
                let idx = data.key;
                let cfg: cfg.StrategyMoney = data.data;
                item.init(cfg, (comp: ItemStrategyMoneyItem, dataKey: number) => {
                    if(dataKey == this._seleMoneyItemIDx){
                        return;
                    }
                    this.itemGridView.getItems().forEach((ele: ItemStrategyMoneyItem, idx) => {
                        if((this._seleMoneyItemIDx + '') == idx) {
                            ele.checkMark.active = false;
                        }
                    })
                    comp.checkMark.active = true;
                    this._seleMoneyItemIDx = dataKey;
                    this._switchMoneyView();
                })
                item.checkMark.active = (idx == (this._seleMoneyItemIDx+''));
                item.title.string = cfg.StrategyMoneyName || '';
                if(cfg.StrategyMoneyIcon) {
                    let url = `${RES_ICON_PRE_URL.BAG_ITEM}/${cfg.StrategyMoneyIcon}`
                    this._spLoader.changeSprite(item.icon,url);
                }
            },

            getItem: ():ItemStrategyMoneyItem  => {
                let item = this._getMoneyItem();
                item.node.active = true;
                return item;
            },
            releaseItem: (item: ItemStrategyMoneyItem) => {
                item.deInit();
                this._moneyItemPool.put(item.node);
            }
        })
    }

    protected onRelease(): void {
        this._seleMoneyItemIDx = -1;
        this._spLoader && this._spLoader.release();
        this.itemGridView.clear();
        this.getWayGridView.clear();
        this._moneyItemPool.clear();
        this._wayItemPool.clear();
    }

    private _getMoneyItem():ItemStrategyMoneyItem {
        if(this._moneyItemPool.size() > 0) {
            return this._moneyItemPool.get().getComponent(ItemStrategyMoneyItem);
        }

        let node = cc.instantiate(this.templateItem);
        return node.getComponent(ItemStrategyMoneyItem);
    }

    private _switchMoneyView() {
        this.getWayGridView.clear();
        let cfg: cfg.StrategyMoney = configManager.getConfigByKey('strategyMoney', this._seleMoneyItemIDx + '');

        this.itemName.string = cfg.StrategyMoneyName || '';
        this.itemUse.string = cfg.StrategyMoneyIntroduce || '';
        if(cfg.StrategyMoneyIcon) {
            let url = `${RES_ICON_PRE_URL.BAG_ITEM}/${cfg.StrategyMoneyIcon}`
            this._spLoader.changeSprite(this.itemIcon,url);
        }

        let gridData: GridData[] = [];
        this._parseCfg(cfg);
        let getItemInfos = this._getItemWayInfo.get(cfg.StrategyMoneyId);
        getItemInfos && getItemInfos.forEach((ele, idx) => {
            gridData.push({key: idx+'', data: ele});
        })
        this.getWayGridView.init(gridData, {
            onInit: (item: ItemStrategyGetItem, data: GridData) => {
                let wayInfo: StrategyGetItemWayInfo = data.data;
                item.init(cfg, wayInfo);
            },

            getItem: ():ItemStrategyGetItem  => {
                return this._getWayItem();
            },
            releaseItem: (item: ItemStrategyGetItem) => {
                item.deInit();
                item.node.active = true;
                this._wayItemPool.put(item.node);
            }
        })
    }

    private _getWayItem() : ItemStrategyGetItem {
        if(this._wayItemPool.size() > 0) {
            return this._wayItemPool.get().getComponent(ItemStrategyGetItem);
        }

        let node = cc.instantiate(this.prefab);
        return node.getComponent(ItemStrategyGetItem);
    }
}
