import { utils } from "../../../app/AppUtils";
import { configUtils } from "../../../app/ConfigUtils";
import { resPathUtils } from "../../../app/ResPathUrlUtils";
import ListItem from "../../../common/components/ListItem";
import UIGridView, { GridData } from "../../../common/components/UIGridView";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { configCache } from "../../../common/ConfigCache";
import { configManager } from "../../../common/ConfigManager";
import { eventCenter } from "../../../common/event/EventCenter";
import { pragmaticEvent } from "../../../common/event/EventData";
import guiManager from "../../../common/GUIManager";
import { ItemHeroListPool } from "../../../common/res-manager/NodePool";
import { preloadItemHeroListPool } from "../../../common/res-manager/Preloaders";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { cfg } from "../../../config/config";
import { data, gamesvr } from "../../../network/lib/protocol";
import { bagData } from "../../models/BagData";
import { pragmaticData } from "../../models/PragmaticData";
import { pragmaticDataOpt } from "../../operations/PragmaticDataOpt";
import HeroListItem from "../view-hero/HeroListItem";
import ItemWuDaoProp from "./ItemWuDaoProp";

const {ccclass, property} = cc._decorator;
const NUMBER_MAX_V = 100000;

@ccclass
export default class WuDaoView extends ViewBaseComponent{
    @property(cc.Label) title: cc.Label = null;
    @property(cc.Sprite) titleIcon: cc.Sprite = null;
    @property(cc.Node)  leftPanel: cc.Node = null;
    @property(cc.Node)  pageTemplate: cc.Node = null;
    @property(UIGridView) heroGridView: UIGridView = null;
    @property(UIGridView) propGridView: UIGridView = null;
    @property(cc.Prefab) propNodetemplate: cc.Prefab = null;
    @property(cc.Label) progress: cc.Label = null;
    @property(cc.ProgressBar) progressBar: cc.ProgressBar = null;
    @property(cc.Sprite) costItemIcon: cc.Sprite = null;
    @property(cc.Node) pageCheckMark: cc.Node = null;
    @property([cc.Node]) skillNodes: cc.Node[] = [];
    @property(cc.Node) btnRise: cc.Node = null;


    private _pageItems: cc.Node[] = null;
    private _spLoader: SpriteLoader = null;
    private _curGroup: number = 0;
    private _curGroupData: data.ILeadGraspLevel = null;
    private _propNodePool: cc.NodePool = null;
    private _herosMap: Map<number, number[]> = null;
    private _isInitedHeros: boolean = false;
    private _rootView: ViewBaseComponent = null;

    preInit(...rest: any[]): Promise<any> {
        return new Promise((resolve, reject) => {
            preloadItemHeroListPool().start(() => {
                resolve(true);
            });
        });
    }

    protected onInit(rootView: ViewBaseComponent): void {
        this._rootView = rootView;
        eventCenter.register(pragmaticEvent.UPDTAE_WU_DAO_LV, this, this._updateWuDaoLv)
        this._spLoader = this._spLoader || new SpriteLoader();
        this._propNodePool = this._propNodePool || new cc.NodePool();

        let pageDatas: number[] = [];
        let transMap: Map<number, string>  = new Map();

        let cfgs = configCache.getWuDaoCache();
        for(let [k, v]of cfgs) {
            pageDatas.push(v.HeroType);
            transMap.set(v.HeroType, `${v.TeamID}`);
        }

        pageDatas.forEach(ele => {
            let wuDaoID = configCache.getWuDaoCfgsByHeroType(ele).LeadEnlightenmentIDs[0];
            let wuDaoCfg: cfg.LeadEnlightenment = configManager.getConfigByKey('LeadEnlightenment', wuDaoID);
            this._genPageToggle(wuDaoCfg);
        });

        let defaultTeamID = transMap.get(pageDatas[0]);
        this._setupCurGroup(defaultTeamID);
        this._updateCheckMark();
        this._setupCostInfo(defaultTeamID, true);
        this._setupProgress(defaultTeamID, false);
        this._setupMidView(defaultTeamID, true, true);
    }

    protected onRelease(): void {
        cc.Tween.stopAllByTarget(this.progressBar);
        this.releaseSubView();
        eventCenter.unregisterAll(this);
        this.propGridView.clear();
        this.heroGridView.clear();
        this._spLoader && this._spLoader.release();
        this._pageItems && this._pageItems.length > 0 && this._pageItems.forEach(ele => { ele.destroy()});
        this._pageItems.length = 0;
        this._propNodePool && this._propNodePool.clear();
        this._isInitedHeros = false;
        this._herosMap.clear();
        this._curGroupData = null;
    }

    onClickRaise() {
        if(this._isMaxLv()) {
            guiManager.showTips('已经满级了');
            return;
        }

        let wuDaoLv = this._curGroupData
        let curProgress = wuDaoLv.Count;
        let cfg: cfg.LeadEnlightenment = configManager.getConfigByKey('LeadEnlightenment', configCache.getWuDaoCfgsByTeamID(this._curGroup).LeadEnlightenmentIDs[wuDaoLv.Level]);
        let costItemCfgs = utils.parseStringTo1Arr(cfg.LeadEnlightenmentLevelNeed, ';');
        let itemID = parseInt(costItemCfgs[0]), itemCnt = parseInt(costItemCfgs[1]);
        let holdCnt = bagData.getItemCountByID(itemID);

        if(holdCnt < itemCnt){
            guiManager.showTips('道具数量不足');
            return;
        }

        // let maxOffset = itemCnt - curProgress;
        // if(maxOffset <= 0){
        //     guiManager.showTips('当前悟道已满级');
        //     return;
        // }

        pragmaticDataOpt.reqRaiseLvOfWuDao(this._curGroup, itemCnt);
    }

    onToggleChecked(toggle: cc.Toggle) {
        this._setupCurGroup(toggle.node.name);
        this._updateCheckMark();
        this._setupCostInfo(toggle.node.name, true);
        this._setupProgress(toggle.node.name, false);
        this._setupMidView(toggle.node.name, true, true);
    }

    private _setupCurGroup(groupID: string) {
        this._curGroup = parseInt(groupID);
        let wuDaoData = pragmaticData.getWuDaoLv(groupID);
        this._curGroupData = wuDaoData ? utils.deepCopy(wuDaoData) : {Count: 0, Level: 0};
        this._curGroupData.Level = this._curGroupData.Level || 0;
        this._curGroupData.Count = this._curGroupData.Count || 0;
    }

    private _genPageToggle(cfg: cfg.LeadEnlightenment) {
        this._pageItems = this._pageItems || [];
        let toggleNode = cc.instantiate(this.pageTemplate);
        toggleNode.active = true;
        toggleNode.name = `${cfg.LeadEnlightenmentTeamID}`;
        toggleNode.parent = this.leftPanel;
        toggleNode.x = 0;
        let posY = (2 * this._pageItems.length + 1) * (toggleNode.height >> 1) + this._pageItems.length * 10;
        toggleNode.y = -posY;
        this._pageItems.push(toggleNode);
        let icon = toggleNode.getChildByName('icon');
        let lv = toggleNode.getChildByName('lv');
        this._spLoader.changeSprite(icon.getComponent(cc.Sprite), resPathUtils.getHeroAllTypeIconUrl(cfg.LeadEnlightenmentIcon));
        let wuDaoData = pragmaticData.getWuDaoLv(toggleNode.name);
        lv.getComponent(cc.Label).string = `${wuDaoData ? (wuDaoData.Level || 0) : 0}级`;
    }

    private _setCheckedToggleLv() {
        let toggleContainor = this.leftPanel.getComponent(cc.ToggleContainer);
        if(!cc.isValid(toggleContainor)) return;

        toggleContainor.toggleItems.some(ele => {
            if(ele.isChecked) {
                let lv = ele.node.getChildByName('lv');
                let wuDaoData = pragmaticData.getWuDaoLv(ele.node.name);
                lv.getComponent(cc.Label).string = `${wuDaoData ? (wuDaoData.Level || 0) : 0}级`;
                return true;
            }
            return false;
        })
    }

    private _setupCostInfo(groupID: string, isRefreshIcon: boolean = false) {
        let wuDaoCfg: cfg.LeadEnlightenment = configManager.getConfigByKey('LeadEnlightenment', configCache.getWuDaoCfgsByTeamID(parseInt(groupID)).LeadEnlightenmentIDs[0]);
        let raiseCfg = utils.parseStringTo1Arr(wuDaoCfg.LeadEnlightenmentLevelNeed, ';');
        let itemID = parseInt(raiseCfg[0]);
        let isMaxLv = this._isMaxLv();
        this.btnRise.active = !isMaxLv;
        if(isRefreshIcon) {
            this.title.string = wuDaoCfg.LeadEnlightenmentIntroduce;
            this._spLoader.changeSprite(this.titleIcon, resPathUtils.getHeroAllTypeIconUrl(wuDaoCfg.LeadEnlightenmentIcon))
            this._spLoader.changeSprite(this.costItemIcon, resPathUtils.getItemIconPath(itemID));
        }
    }

    private _setupProgress(groupID: string, isPlayAnin: boolean = false) {
        let wuDaoData = this._curGroupData;
        let curLv = wuDaoData.Level;
        let isMaxLv = this._isMaxLv();
        let currLvCfg: cfg.LeadEnlightenment = configManager.getConfigByKey('LeadEnlightenment', configCache.getWuDaoCfgsByTeamID(parseInt(groupID)).LeadEnlightenmentIDs[isMaxLv ? (curLv - 1) : curLv]);
        let itemCfg = utils.parseStringTo1Arr(currLvCfg.LeadEnlightenmentLevelNeed, ';');
        let itemID = parseInt(itemCfg[0]), maxFeedCnt = parseInt(itemCfg[1]);
        cc.Tween.stopAllByTarget(this.progressBar);
        let holdCnt =  bagData.getItemCountByID(itemID) || 0;
        this.progress.string = isMaxLv ? '满级' : `${ holdCnt}/${maxFeedCnt}`;
        let curProgress = Math.round(holdCnt * 1000 / maxFeedCnt) / 1000;
        if(!isPlayAnin) {
            this.progressBar.progress = isMaxLv ? 1 : curProgress;
            return;
        }

        let targetProgress = Math.min(curProgress, 1);
        cc.tween(this.progressBar).to(0.2, {progress: targetProgress}).delay(0.05).call(() => {
            this.progressBar.progress = isMaxLv ? 1 : curProgress;
        }).start();
    }

    private _setupMidView(groupID: string, isRefreshHero: boolean = false, isRefreshProp: boolean = false){
        let wuDaoData = this._curGroupData;
        let curLv = wuDaoData.Level;
        let isMaxLv = this._isMaxLv();
        isRefreshHero && this._setupHeroList(this._getGroupHeros(parseInt(groupID)));
        isRefreshProp && this._setupAddProp(this._getGroupAddProp(parseInt(groupID), curLv), isMaxLv ? null : this._getGroupAddProp(parseInt(groupID), curLv, false));
        isRefreshProp && this._setupSkills();
    }

    private _setupSkills() {
        let wuDaoData = this._curGroupData;
        let curLv = wuDaoData.Level;
        let wuDaoCfgs = configCache.getWuDaoCfgsByTeamID(this._curGroup);
        if(!wuDaoCfgs || !wuDaoCfgs.Skills) {
            this.skillNodes.forEach(ele => {
                ele.active = false;
            })
            return;
        }

        this.skillNodes.forEach((ele, idx) => {
            let hasSkill =  wuDaoCfgs.Skills.has(idx + 1);
            ele.active = hasSkill;
            let iconSp = ele.getChildByName('skillIcon').getComponent(cc.Sprite);
            let wuDaoCfg: cfg.LeadEnlightenment = configManager.getConfigByKey('LeadEnlightenment', wuDaoCfgs.Skills.get(idx+1)[0]);
            //@ts-ignore
            this._spLoader.changeSprite(iconSp, resPathUtils.getSkillIconPathByID(wuDaoCfg[`LeadEnlightenmentSkillId${idx + 1}`]));
            let isLock = curLv < wuDaoCfg.LeadEnlightenmentLevel;

            let lockNode = ele.getChildByName('lock');
            lockNode.active = isLock;
            let lvNode = ele.getChildByName('skilllLv');
            lvNode.active = !isLock;

            if(isLock) {
                lockNode.getChildByName('lvLb').getComponent(cc.Label).string = `${wuDaoCfg.LeadEnlightenmentLevel}级`;
            } else {
                let skills = wuDaoCfgs.Skills.get(idx+1);
                let lv = 0;
                skills.some((ele, idx) => {
                    let cfg: cfg.LeadEnlightenment = configManager.getConfigByKey('LeadEnlightenment', ele);
                    if(cfg.LeadEnlightenmentLevel <= curLv){
                        lv += 1;
                        return false;
                    }
                    return true;
                });
                lvNode.getChildByName('lvLb').getComponent(cc.Label).string = `${lv}`;
            }
        });
    }

    private _setupAddProp(props: Map<number, number>, willAddProps: Map<number, number>){
        this.propGridView.clear();
        if((!props || props.size == 0) && (!willAddProps || willAddProps.size == 0)) return;
        let gridDatas: GridData[] = [];
        props && props.forEach( (_v, _idx) => {
            let data: any = {
                key: _idx.toString(),
                data: {curValue: _v}
            }

            if(willAddProps && willAddProps.has(_idx)){
                let willAddProp = willAddProps.get(_idx);
                willAddProps.delete(_idx);
                data.data['willValue'] = willAddProp;
            }
            gridDatas.push(data);
        });

        willAddProps && willAddProps.forEach( (_v, _idx) => {
            let data: any = {
                key: _idx.toString(),
                data: {willValue: _v}
            }
            gridDatas.push(data);
        });

        let template = `<color=%c>%s</color>`;
        let normalColor = '#926C3B';
        let addColor = `#5D9A3C`;
        this.propGridView.init(gridDatas, {
            onInit: (itemCmp: ItemWuDaoProp, data: GridData) => {
                let idx = parseInt(data.key);
                let attrCfg = configUtils.getAttributeConfig(idx);
                let vType = attrCfg.AttributeValueType;
                let curValue: number = data.data.curValue || 0;
                let willValue: number = data.data.willValue || 0;
                if(vType == 2) {
                    curValue && (curValue = curValue * 100 / 10000);
                    willValue && (willValue = willValue * 100 / 10000);
                }
                let valueTypeStr = vType == 2 ? '%' : '';
                let str = template.replace(/%c/, normalColor);
                str = str.replace(/%s/, `${attrCfg.Name}:${(curValue != 0 ? curValue: '0') + valueTypeStr}`);
                if(willValue != 0) {
                    let startStr = template.replace(/%c/, normalColor);
                    let leftStr = startStr.replace(/%s/, '(');
                    let rightStr = startStr.replace(/%s/, ')');
                    let midStr = template.replace(/%c/, addColor);
                    midStr = midStr.replace(/%s/, `+${willValue}${valueTypeStr}`);
                    str = `${str}${leftStr}${midStr}${rightStr}`;
                }
                itemCmp.label.string = str;
            },
            getItem: (): ItemWuDaoProp => {
                let itemNode = this._getPropNode();
                itemNode.active = true;
                return itemNode.getComponent(ItemWuDaoProp);
            },
            releaseItem: (itemCmp: ItemWuDaoProp) => {
                this._propNodePool.put(itemCmp.node);
            },
        });
    }

    private _setupHeroList(heroArr: number[]) {
        this.heroGridView.clear();
        if(!heroArr || heroArr.length == 0) return;

        let gridDatas: GridData[] = heroArr.map((_v, _idx) => {
            return {
                key: _idx.toString(),
                data: _v
            }
        });
        this.heroGridView.init(gridDatas, {
            onInit: (itemComp: HeroListItem, data: GridData) => {
                let heroID = data.data;
                let listItemScript = itemComp.getComponent(ListItem);
                listItemScript.clearSelectFlag();
                itemComp.onlyShow = true;
                itemComp.setData(heroID);
            },
            getItem: (): HeroListItem => {
                let item = ItemHeroListPool.get();
                return item;
            },
            releaseItem: (itemCmp: HeroListItem) => {
                let listItem = itemCmp.node.getComponent(ListItem);
                listItem && listItem.deInit();
                ItemHeroListPool.put(itemCmp);
                itemCmp.node.active = true;
            },
            resetSpacingCol: 20,
            resetSpacingRow: 20,
        });
    }

    private _updateWuDaoLv(cmd: number, data: gamesvr.LeadGraspFeedRes) {
        guiManager.showDialogTips(1000138);
        this._setCheckedToggleLv();
        if(data.GroupID != this._curGroup) return;

        let lastLv = this._curGroupData.Level;
        this._curGroupData.Count = data.CurCount || 0;
        this._curGroupData.Level = data.Level || 0;
        let groupStr = this._curGroup+'';
        this._setupCostInfo(groupStr, false);
        this._setupProgress(groupStr, true);
        if(lastLv != data.Level) {
            this._setupMidView(groupStr, false, true);
        }else {
            this._setupMidView(groupStr, false, false);
        }
    }

    private _getGroupAddProp(groupID: number, lv: number, isRealProp: boolean = true) : Map<number, number> {
        let propMap: Map<number, number> = null;
        if(!isRealProp) {
            let cfg: cfg.LeadEnlightenment = configManager.getConfigByKey('LeadEnlightenment', configCache.getWuDaoCfgsByTeamID(groupID).LeadEnlightenmentIDs[lv]);
            utils.parseStingList(cfg.LeadEnlightenmentLevelProperty, (arr: string[]) => {
                if(!arr || arr.length == 0) return;
                propMap = propMap || new Map();
                let propID = parseInt(arr[0]), propValue = parseInt(arr[1]);
                let oldPropV = propMap.get(propID) || 0;
                propMap.set(propID, oldPropV + propValue);
            });
            return propMap;
        }
        return pragmaticData.getWuDaoProps(groupID+'');
    }

    private _getGroupHeros(groupID: number) {
        this._initHeroCfgs();
        let classify = configCache.getWuDaoCfgsByTeamID(groupID).HeroType;
        if(this._herosMap && this._herosMap.has(classify)) return this._herosMap.get(classify);
        return null;
    }

    private _initHeroCfgs() {
        if(this._isInitedHeros) return;
        this._herosMap = this._herosMap || new Map();
        let heroCfgs = configManager.getConfigs('heroBasic');
        for(let k in heroCfgs) {
            if(!heroCfgs.hasOwnProperty(k)) continue;

            let heroCfg = heroCfgs[k];
            if(!heroCfg.HeroBasicIfOper || !heroCfg.HeroBasicAbility) continue;

            if(!this._herosMap.has(heroCfg.HeroBasicAbility)) {
                this._herosMap.set(heroCfg.HeroBasicAbility, []);
            }
            let sameClsHeros = this._herosMap.get(heroCfg.HeroBasicAbility);
            sameClsHeros.push(heroCfg.HeroBasicId);
        }

        this._herosMap.forEach(ele => {
            if(!ele || ele.length == 0) return;

            ele.sort((a, b) => {
                let aHero = bagData.getHeroById(a);
                let bHero = bagData.getHeroById(b);

                let aTag = aHero && aHero.isHeroBasic ? 10 : 0;
                let bTag = bHero && bHero.isHeroBasic ? 10 : 0;

                aTag += (heroCfgs[a+''].HeroBasicQuality);
                bTag += (heroCfgs[b+''].HeroBasicQuality);

                if(aTag != bTag){
                    return bTag - aTag;
                }
                return heroCfgs[b+''].heroBasic - heroCfgs[a+''].heroBasic;
            });
        })
        this._isInitedHeros = true;
    }

    private _getPropNode(): cc.Node {
        if(this._propNodePool.size() > 0) {
            return this._propNodePool.get();
        }
        return cc.instantiate(this.propNodetemplate);
    }

    private _isMaxLv() : boolean {
        let wuDaoLv = this._curGroupData
        let curLv = wuDaoLv.Level;
        let wuDaoCfgs = configCache.getWuDaoCfgsByTeamID(this._curGroup);
        let lastWuDaoCfg: cfg.LeadEnlightenment = configManager.getConfigByKey('LeadEnlightenment', wuDaoCfgs.LeadEnlightenmentIDs[wuDaoCfgs.LeadEnlightenmentIDs.length - 1]);
        let maxLv = lastWuDaoCfg.LeadEnlightenmentLevel;
        return maxLv == curLv;
    }

    private _updateCheckMark() {
        let toggleContainor = this.leftPanel.getComponent(cc.ToggleContainer);
        if(!cc.isValid(toggleContainor)) return;
        toggleContainor.toggleItems.forEach(ele => {
            if(ele.isChecked) {
                ele.node.getChildByName('bg').active = false;
                this.pageCheckMark.x = ele.node.x;
                this.pageCheckMark.y = ele.node.y;
            } else {
                ele.node.getChildByName('bg').active = true;
            }
        })
    }

    onClickSkill(event: cc.Event.EventTouch, customData: string) {
        let skillType = parseInt(customData);
        let wuDaoCfgs = configCache.getWuDaoCfgsByTeamID(this._curGroup);
        if(!wuDaoCfgs.Skills || wuDaoCfgs.Skills.size == 0 || !wuDaoCfgs.Skills.has(skillType)) return;
        //@ts-ignore
        this._rootView.loadSubView('TipsWuDaoSkill', this._curGroup, skillType, this._curGroupData.Level);
    }
}
