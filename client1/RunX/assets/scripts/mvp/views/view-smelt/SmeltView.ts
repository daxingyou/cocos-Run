
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { eventCenter } from "../../../common/event/EventCenter";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { bagData } from "../../models/BagData";
import { bagDataUtils } from "../../../app/BagDataUtils";
import { configUtils } from "../../../app/ConfigUtils";
import { BAG_ITEM_TYPE, QUALITY_TYPE, ShopSubType } from "../../../app/AppEnums";
import { configManager } from "../../../common/ConfigManager";
import { cfg } from "../../../config/config";
import { data, gamesvr } from "../../../network/lib/protocol";
import { Equip } from "../../template/Equip";
import { CustomDialogId, FULL_PERCENT, TREASURE_SYS_POWER_TYPE, VIEW_NAME } from "../../../app/AppConst";
import guiManager from "../../../common/GUIManager";
import List from "../../../common/components/List";
import ItemBag from "../view-item/ItemBag";
import ItemSmelt from "./ItemSmelt";
import RichTextEx from "../../../common/components/rich-text/RichTextEx";
import { bagDataEvent } from "../../../common/event/EventData";
import { bagDataOpt } from "../../operations/BagDataOpt";
import { utils } from "../../../app/AppUtils";
import { ItemBagPool } from "../../../common/res-manager/NodePool";
import { uiHelper } from "../../../common/ui-helper/UIHelper";
import ListItem from "../../../common/components/ListItem";
import moduleUIManager from "../../../common/ModuleUIManager";
import { taskData } from "../../models/TaskData";
const { ccclass, property } = cc._decorator;

interface SmeltItem {
    itemId: number,
    seq: any,
    count: number,
    type?: SMELT_TYPE
}

interface SupportInfo{
    min: number,
    max: number,
    step: number
}

enum TOGGLE_TYPE {
    NONE = -1, MAIN, LEFT, RIGHT
}

enum SMELT_TYPE {
    RANDOM, RECEIPE
}

@ccclass
export default class SmeltView extends ViewBaseComponent {
    @property(List) itemList: List = null;
    @property(cc.Node) recipeRes: cc.Node = null;
    @property(RichTextEx) recipeText: RichTextEx = null;
    @property(RichTextEx) costText: RichTextEx = null;
    @property(cc.Node) emptyResult: cc.Node = null;
    @property(cc.Node) emptyTips: cc.Node = null;
    @property(cc.Toggle) toggles: cc.Toggle[] = [];
    @property(cc.Node) rateNodes: cc.Node[] = [];

    private _spriteLoader = new SpriteLoader();
    private _toggleIdx: TOGGLE_TYPE = TOGGLE_TYPE.NONE;
    private _lastToggleIdx: TOGGLE_TYPE = TOGGLE_TYPE.NONE;
    private _mainItem: SmeltItem = null;
    private _leftItem: SmeltItem = null;
    private _rightItem: SmeltItem = null;
    private _displayItems: data.IBagUnit[] = [];
    private _supportInfo: { [k: number]: SupportInfo } = {};
    private _itemBags: ItemBag[] = [];

    private _equipQualitySet: Set<number> = null;    //能够炼宝的装备品质集合，属于其中品质的装备才能炼宝

    onInit() {
        this._registerAllEvent();
        this._initFilterSet();
        this._initBaseView();
        this._showSmeltCost();
        this.onClickMainItem();
    }

    deInit() {
        this._clearItems();
        this.releaseSubView();
    }

    private _registerAllEvent() {
        eventCenter.register(bagDataEvent.SMELT_SUCCESS, this, this._onSmeltRes);
    }

    onRelease() {
        this.deInit();
        this.itemList._deInit();
        this.clearTipsInfo();
        this._spriteLoader.release();
        eventCenter.unregisterAll(this);
    }

    private _clearItems() {
        this._itemBags.forEach(_i => {
            // 避免失效
            if(_i && cc.isValid(_i)) {
                ItemBagPool.put(_i)    
            }
        })
        this._itemBags = [];
    }

    
    //初始化装备的筛选条件集
    private _initFilterSet(){
        if(this._equipQualitySet) return;
        this._equipQualitySet = new Set<number>();
        configManager.getConfigList("smeltRandom").forEach(ele => {
            ele.SmeltRandomQuality && this._equipQualitySet.add(ele.SmeltRandomQuality);
        });
    }

    private _initBaseView () {
        let diaCfg = configUtils.getDialogCfgByDialogId(99000038);
        let diaCfg2 = configUtils.getDialogCfgByDialogId(99000037);
        diaCfg && diaCfg.DialogText && (this.emptyResult.getComponentInChildren(cc.Label).string = diaCfg.DialogText);
        diaCfg2 && diaCfg2.DialogText && (this.emptyTips.getComponentInChildren(cc.Label).string = diaCfg2.DialogText);
    }


    onClickMainItem(){
        if (this._toggleIdx == TOGGLE_TYPE.MAIN) return;
        // 随机熔炼和配方熔炼两类
        let randomPart = bagDataUtils.getNotDressEquips().filter((_equip)=>{
            let equipCfg = configUtils.getEquipConfig(_equip.ID);
            return equipCfg && this._equipQualitySet.has(equipCfg.Quality) && !(equipCfg.PositionType == 7);
        });
        let recipePart: data.IBagUnit[] = [];
        configManager.getConfigList("smeltRecipe").forEach((_cfg: cfg.SmeltChangeless) =>{
            let cnt = bagData.getItemCountByID(_cfg.SmeltChangelessItemID);
            if (cnt) recipePart.push(bagData.getItemByID(_cfg.SmeltChangelessItemID).Array[0]);
        });

        randomPart.sort((_itemA, _itemB) => {
            return _itemB.ID - _itemA.ID;
        })
        randomPart.sort((_itemA, _itemB) => {
            let configA = configUtils.getEquipConfig(_itemA.ID);
            let configB = configUtils.getEquipConfig(_itemB.ID);
            return configB.PositionType - configA.PositionType;
        })
        randomPart.sort((_itemA, _itemB) => {
            let configA = configUtils.getEquipConfig(_itemA.ID);
            let configB = configUtils.getEquipConfig(_itemB.ID);
            return configB.Quality - configA.Quality;
        })

        recipePart.sort((_itemA, _itemB) => {
            return _itemB.ID - _itemA.ID;
        })

        this._displayItems = recipePart.concat(randomPart);
        this._displayItems.forEach((_item) => {
            this._supportInfo[_item.ID] = {min: 1, max: 1, step: 1}
        })

        this.itemList.numItems = this._displayItems.length;
        this.emptyTips.active = !this.itemList.numItems;
        this._toggleIdx = TOGGLE_TYPE.MAIN;
        this._resetToggles(); 
        // 只有在选中态才能按钮生效
        this.toggles.forEach(toggle => {
            let itemComp = toggle.node.getComponentInChildren(ItemBag);
            if (itemComp) {
                itemComp.node.getComponent(cc.Button).interactable = toggle.isChecked;
            }
        })
    }

    onClickLeftItem() {
        if (this._toggleIdx == TOGGLE_TYPE.LEFT) return;

        if (!this._mainItem) {
            guiManager.showDialogTips(CustomDialogId.SMELT_CHOOSE_CORE);
            this.toggles[0].isChecked = true; 
            return;
        }
        let recipeCfg = configManager.getConfigByKey("smeltRecipe", this._mainItem.itemId);
        if (recipeCfg) {
            let parseItem = recipeCfg.SmeltChangelessItemID2
                .split(";")
                .map((_str: string) => {return parseInt(_str)});
            let leftItem = bagData.getItemByID(parseItem[0]);
            this._displayItems = leftItem && leftItem.Array[0].Count > 0 ? [leftItem.Array[0]] : [];
            let needCount = parseItem[1];
            this._supportInfo[parseItem[0]] = {min: needCount, max: needCount, step: needCount};
            this.itemList.numItems = this._displayItems.length;
            this.emptyTips.active =  this._displayItems.length == 0;
        } else {
            let randomBatchingPart: data.IBagUnit[] = [];
            configManager.getConfigList("smeltRandomBatching").forEach((_cfg: cfg.SmeltRandomBatching) => {
                let cnt = bagData.getItemCountByID(_cfg.SmeltRandomBatchingID);
                let equipCfg = configUtils.getEquipConfig(this._mainItem.itemId);
                if (cnt > 0 && _cfg.SmeltRandomBatchingPosition == 2){
                    randomBatchingPart.push(bagData.getItemByID(_cfg.SmeltRandomBatchingID).Array[0]);
                    this._supportInfo[_cfg.SmeltRandomBatchingID] = {
                        min: 0,
                        max: equipCfg.Quality == QUALITY_TYPE.SR ? _cfg.SmeltRandomBatchingAddLimitSR : _cfg.SmeltRandomBatchingAddLimitSSR,
                        step: equipCfg.Quality == QUALITY_TYPE.SR ? _cfg.SmeltRandomBatchingAddQuantitySR : _cfg.SmeltRandomBatchingAddQuantitySSR,
                    }
                }
                    
            });

            this._displayItems = randomBatchingPart;
            this._displayItems.sort((_itemA, _itemB)=>{
                return _itemB.ID -_itemA.ID;
            })
            this._displayItems.sort((_itemA, _itemB) => {
                let configA = configUtils.getItemConfig(_itemA.ID);
                let configB = configUtils.getItemConfig(_itemB.ID);
                return configB.ItemType - configA.ItemType;
            })
            this._displayItems.sort((_itemA, _itemB) => {
                let configA = configUtils.getItemConfig(_itemA.ID);
                let configB = configUtils.getItemConfig(_itemB.ID);
                return configB.ItemQuality - configA.ItemQuality;
            }) 
            this._displayItems.sort((_itemA, _itemB) => {
                let fillA = this.checkChipAvaliable(_itemA.ID) ? 1 : -1;
                let fillB = this.checkChipAvaliable(_itemB.ID) ? 1 : -1;
                return fillB - fillA;
            })

            this.itemList.numItems = this._displayItems.length;
            this.emptyTips.active = !this.itemList.numItems;
        }
        this._toggleIdx = TOGGLE_TYPE.LEFT;
        // 只有在选中态才能按钮生效
        this.toggles.forEach(toggle => {
            let itemComp = toggle.node.getComponentInChildren(ItemBag);
            if (itemComp) {
                itemComp.node.getComponent(cc.Button).interactable = toggle.isChecked;
            }
        })
    }

    onClickRightItem() {
        if (this._toggleIdx == TOGGLE_TYPE.RIGHT) return;
        if (!this._mainItem) {
            guiManager.showDialogTips(CustomDialogId.SMELT_CHOOSE_CORE);
            this.toggles[0].isChecked = true; return;
        }
        let recipeCfg = configManager.getConfigByKey("smeltRecipe", this._mainItem.itemId);
        if (recipeCfg) {
            let parseItem = recipeCfg.SmeltChangelessItemID3
                .split(";")
                .map((_str: string) => { return parseInt(_str) });
            let rightItem = bagData.getItemByID(parseItem[0]);

            this._displayItems = rightItem && rightItem.Array[0].Count > 0 ? [rightItem.Array[0]] : [];
            let needCount =  parseItem[1];
            this._supportInfo[parseItem[0]] = { min: needCount, max: needCount, step: needCount };
            this.itemList.numItems = this._displayItems.length;
            this.emptyTips.active = !this.itemList.numItems;
        } else {
            let randomBatchingPart: data.IBagUnit[] = [];
            configManager.getConfigList("smeltRandomBatching").forEach(
                (_cfg: cfg.SmeltRandomBatching) => {
                let cnt = bagData.getItemCountByID(_cfg.SmeltRandomBatchingID);
                let equipCfg = configUtils.getEquipConfig(this._mainItem.itemId);
                if (cnt > 0 && _cfg.SmeltRandomBatchingPosition == 3){
                    randomBatchingPart.push(bagData.getItemByID(_cfg.SmeltRandomBatchingID).Array[0]);
                    this._supportInfo[_cfg.SmeltRandomBatchingID] = {
                        min: 0,
                        max: equipCfg.Quality == QUALITY_TYPE.SR ? _cfg.SmeltRandomBatchingAddLimitSR : _cfg.SmeltRandomBatchingAddLimitSSR,
                        step: equipCfg.Quality == QUALITY_TYPE.SR ? _cfg.SmeltRandomBatchingAddQuantitySR : _cfg.SmeltRandomBatchingAddQuantitySSR,
                    }
                }
            });

            this._displayItems = randomBatchingPart; 
            this._displayItems.sort((_itemA, _itemB) => {
                return _itemB.ID - _itemA.ID;
            })
            this._displayItems.sort((_itemA, _itemB) => {
                let configA = configUtils.getItemConfig(_itemA.ID);
                let configB = configUtils.getItemConfig(_itemB.ID);
                return configB.ItemType - configA.ItemType;
            })
            this._displayItems.sort((_itemA, _itemB) => {
                let configA = configUtils.getItemConfig(_itemA.ID);
                let configB = configUtils.getItemConfig(_itemB.ID);
                return configB.ItemQuality - configA.ItemQuality;
            })
            this._displayItems.sort((_itemA, _itemB) => {
                let fillA = this.getFillCount(_itemA.ID) ? 1 : -1;
                let fillB = this.getFillCount(_itemB.ID) ? 1 : -1;
                return fillB - fillA;
            })

            this.itemList.numItems = this._displayItems.length;
            this.emptyTips.active = !this.itemList.numItems;
        }
        this._toggleIdx = TOGGLE_TYPE.RIGHT;
        // 只有在选中态才能按钮生效
        this.toggles.forEach(toggle => {
            let itemComp = toggle.node.getComponentInChildren(ItemBag);
            if (itemComp) {
                itemComp.node.getComponent(cc.Button).interactable = toggle.isChecked;
            }
        })
    }

    onListRender(itemNode: cc.Node, idx: number){
        let itemComp = itemNode.getComponent(ItemSmelt);
        let cfg = configUtils.getItemConfig(this._displayItems[idx].ID);
        let cfg1 = configUtils.getEquipConfig(this._displayItems[idx].ID);
        //经验材料
        if (cfg) {
            itemComp.clear();
            itemComp.isSingle = false;
            itemComp.stepNum = this._supportInfo[this._displayItems[idx].ID].step;
            itemComp.maxNum = this._supportInfo[this._displayItems[idx].ID].max;
            itemComp.minNum = this._supportInfo[this._displayItems[idx].ID].min;
            itemComp.updateIcon(cfg.ItemIcon);
            itemComp.updateCount(utils.longToNumber(this._displayItems[idx].Count));
            itemComp.updateQuality(cfg.ItemQuality);
            itemComp.updateSelectCount(this.getSelCount(this._displayItems[idx].ID));
            if (cfg.ItemType == 50 && !this.checkChipAvaliable(this._displayItems[idx].ID)){
                itemComp.updateChipStatus();
            }
        }
        //经验装备
        if (cfg1) {
            let equipLevel = new Equip(this._displayItems[idx]).getEquipLevel();
            itemComp.clear();
            itemComp.isSingle = true;
            itemComp.updateIcon(cfg1.Icon);
            itemComp.updateSuitIcon(cfg1.SuitId);
            itemComp.updateLevel(equipLevel);
            itemComp.updateQuality(cfg1.Quality);
        }
        // 设置选中ID
        if (idx == this.itemList.displayItemNum - 1){
            let objItem = this._toggleIdx == TOGGLE_TYPE.MAIN ? this._mainItem
                : this._toggleIdx == TOGGLE_TYPE.LEFT ? this._leftItem
                : this._toggleIdx == TOGGLE_TYPE.RIGHT ? this._rightItem : null;
            this.itemList.selectedId = this._displayItems.findIndex(
                (_item) => {
                    return objItem && _item.ID == objItem.itemId && utils.longToNumber(_item.Seq) == utils.longToNumber(objItem.seq) ;
                }
            );   
        }
    }

    onSelectRender(itemNode: cc.Node, idx: number, lastIdx: number){
        //放置点添加Item
        let selcet = itemNode && itemNode.getComponent(ListItem).selected;
        if (selcet)
        {
            let cfg = configUtils.getItemConfig(this._displayItems[idx].ID);
            let itemComp = itemNode.getComponent(ItemSmelt);
            let objItem = this._toggleIdx == TOGGLE_TYPE.MAIN ? this._mainItem
                : this._toggleIdx == TOGGLE_TYPE.LEFT ? this._leftItem
                    : this._toggleIdx == TOGGLE_TYPE.RIGHT ? this._rightItem : null;
            if (!(objItem && objItem.itemId == this._displayItems[idx].ID && objItem.count == itemComp.selectNum))
                this.addToggleItem(this._toggleIdx, this._displayItems[idx], itemComp.selectNum);
            // 更换核心重置左右放置点
            if (this._toggleIdx == TOGGLE_TYPE.MAIN && this._toggleIdx == this._lastToggleIdx &&  lastIdx != idx) {
                this._showSmeltCost();
                this.removeToggleItem(TOGGLE_TYPE.LEFT)
                this.removeToggleItem(TOGGLE_TYPE.RIGHT)
            }
        } else {
            this.removeToggleItem(this._toggleIdx)
            switch (this._toggleIdx) {
                case 0: this._mainItem = null; break;
                case 1: this._leftItem = null; break;
                case 2: this._rightItem =null; break;
            }
        }

        this.clearTipsInfo();
        if (this._mainItem && this._mainItem.type == SMELT_TYPE.RECEIPE) {
            this.showRecipeTipsInfo();
        } else if (this._mainItem) {
            this.showRandomTipsInfo();
        }

        // 切换Item重置材料数据
        if (this.itemList.getItemByListId(lastIdx) && lastIdx != idx) {
            let lastSelItem:cc.Node = this.itemList.getItemByListId(lastIdx);
            lastSelItem && lastSelItem.getComponent(ItemSmelt).updateSelectCount(0);
        }
        this._lastToggleIdx = this._toggleIdx;
        this._resetToggles();
    }

    showRandomTipsInfo(){
        let equipCfg = configUtils.getEquipConfig(this._mainItem.itemId);
        let smeltRandomCfg: cfg.SmeltRandom = configManager.getConfigList("smeltRandom").find(_cfg => {
            return _cfg.SmeltRandomQuality == equipCfg.Quality;
        })
        let baseRateInfo: {produce: number, rate: number}[] = [];
        if (smeltRandomCfg) {
            baseRateInfo.push({ 
                produce: smeltRandomCfg.SmeltRandomProduce1, 
                rate: smeltRandomCfg.SmeltRandomProducePower1
            });
            baseRateInfo.push({
                produce: smeltRandomCfg.SmeltRandomProduce2,
                rate: smeltRandomCfg.SmeltRandomProducePower2
            });
            baseRateInfo.push({
                produce: smeltRandomCfg.SmeltRandomProduce3,
                rate: smeltRandomCfg.SmeltRandomProducePower3
            });
            // 附加概率
            if (this._leftItem) {
                let cfg = configManager.getConfigByKey("smeltRandomBatching", this._leftItem.itemId);
                let index = cfg.SmeltRandomBatchingProduceEffectID - 1;
                let addRate = cfg.SmeltRandomBatchingProduceEffectPower;
                if (baseRateInfo[index]) {
                    baseRateInfo[index].rate += this._leftItem.count * addRate;
                }
            }
            if (this._rightItem) {
                let cfg = configManager.getConfigByKey("smeltRandomBatching", this._rightItem.itemId);
                let index = cfg.SmeltRandomBatchingProduceEffectID - 1;
                let addRate = cfg.SmeltRandomBatchingProduceEffectPower;
                if (baseRateInfo[index]) {
                    baseRateInfo[index].rate += this._rightItem.count * addRate;
                }
            }
            // 概率归一化
            let totalRate = baseRateInfo[0].rate + baseRateInfo[1].rate + baseRateInfo[2].rate;
            baseRateInfo[0].rate = Math.floor(((baseRateInfo[0].rate/totalRate) * FULL_PERCENT) / 10) * 10;
            baseRateInfo[1].rate = Math.floor(((baseRateInfo[1].rate / totalRate) * FULL_PERCENT) / 10) * 10;
            baseRateInfo[2].rate = FULL_PERCENT - baseRateInfo[0].rate - baseRateInfo[1].rate;
        }

        baseRateInfo.forEach((rateInfo, _index) => {
            let produceCfg: cfg.Produce = configManager.getConfigByKey("produce", rateInfo.produce);  
            let rateStr = `<color = #12CE35>${Math.round(rateInfo.rate) * 100 / FULL_PERCENT}%</c>`;
            let rateNode = this.rateNodes[_index];
            if (produceCfg && rateNode) {
                rateNode.getComponentInChildren(cc.ProgressBar).progress = Math.round(rateInfo.rate) / FULL_PERCENT ;
                rateNode.getComponentInChildren(RichTextEx).string = `获得概率：${rateStr}` ;
                rateNode.getComponentInChildren(cc.Label).string =`${produceCfg.SmeltRandomDescribe}`;
            }
        })
        this.rateNodes[0].parent.active = true;
        this.emptyResult.active = false;
    }

    showRecipeTipsInfo(){
        let recipeCfg: cfg.SmeltChangeless = configManager.getConfigByKey("smeltRecipe", this._mainItem.itemId);
        let parentNode = uiHelper.getRootViewComp(this.node.parent).node;
        if (recipeCfg){
            let item = ItemBagPool.get();
            let newItem = item.node;
            let parseItem2 = recipeCfg.SmeltChangelessItemID2
                .split(";")
                .map((_str: string) => { return parseInt(_str) });
            let parseItem3 = recipeCfg.SmeltChangelessItemID3
                .split(";")
                .map((_str: string) => { return parseInt(_str) });
            item.init({
                id: recipeCfg.SmeltChangelessRewardShow,
                clickHandler: ()=>{
                    moduleUIManager.showItemDetailInfo(recipeCfg.SmeltChangelessRewardShow, 0, parentNode);
                }
            })
            newItem.parent = this.recipeRes;
            if (this._mainItem){
                let cfg = configUtils.getItemConfig(this._mainItem.itemId);
                let ownStr = `<color = #00ff00>(已添加)</c>`;
                this.recipeText.string = `1号栏：${cfg.ItemName} ${ownStr}`;
            }
            if (parseItem2.length){
                let cfg = configUtils.getItemConfig(parseItem2[0]);
                let ownStr = this._leftItem && this._leftItem.itemId ? 
                    `<color = #00ff00>(已添加)</c>` : `<color = #ff0000>(未添加)</c>`
                this.recipeText.string = `${this.recipeText.string}<br/>2号栏：${cfg.ItemName}*${parseItem2[1]} ${ownStr}`;
            }
            if (parseItem3.length) {
                let cfg = configUtils.getItemConfig(parseItem3[0]);
                let ownStr = this._rightItem && this._rightItem.itemId ?
                    `<color = #00ff00>(已添加)</c>` : `<color = #ff0000>(未添加)</c>`
                this.recipeText.string = `${this.recipeText.string}<br/>3号栏：${cfg.ItemName}*${parseItem3[1]} ${ownStr}`;
            }
        }
        this.recipeRes.parent.active = true;
        this.emptyResult.active = false;
    }

    clearTipsInfo(){
        let item = this.recipeRes.getComponentInChildren(ItemBag);
        if(item){
            ItemBagPool.put(item);
        }
        this.recipeText.string = "";
        this.rateNodes[0].parent.active = false;
        this.recipeRes.parent.active = false;
        this.emptyResult.active = true;
    }

    private _showSmeltCost(){
        let haveGold = bagData.gold;
        let needGold = this.getNeedGold();
        this.costText.string = needGold > haveGold ?
            `<color = #ff0000>${needGold}</c>` : `${needGold}`;
    }

    /**
     * 灵宝是否满级
     * @param itemId  灵宝卷轴的ID
     * @returns
     */
    private _isTreasureItemFullLv(itemId: number){
        let recipeCfg: cfg.SmeltChangeless = configManager.getConfigByKey("smeltRecipe", itemId);
        if(!recipeCfg) return false;

        //灵宝ID
        let itemID = recipeCfg.SmeltChangelessRewardShow;
        let itemCfg = configUtils.getLeadTreasureConfig(itemID);
        if(!itemCfg) return false;
        let bagItem = bagData.getItemByID(itemID);
        if(!bagItem) return false;

        let treasureCount =  0;
        bagItem && (treasureCount = Number(bagItem.Array[0].Count));
        let levelUpCfg = itemCfg.LevelUpNeed.split('|');
        let maxCnt = 1;
        levelUpCfg.forEach(ele => {
          maxCnt += parseInt(ele);
        });
        return treasureCount >= maxCnt;
    }

    addToggleItem(toggleIdx: number, item: data.IBagUnit, selConut?: number){
        let itemId = item.ID;
        let isMain = toggleIdx == TOGGLE_TYPE.MAIN;
        let cfg = configUtils.getItemConfig(itemId);
        let cfg1 = configUtils.getEquipConfig(itemId);
        let toggleNode = this.toggles[toggleIdx].node;
        let parentNode = uiHelper.getRootViewComp(this.node.parent).node;
        let newItem = toggleNode.children.find(child => { return child.getComponent(ItemBag) });
        if (!newItem) {
            newItem = ItemBagPool.get().node;
            toggleNode.addChild(newItem);
            this._itemBags.push(newItem.getComponent(ItemBag));
        }
        if (cfg) {
            isMain && this._isTreasureItemFullLv(itemId) && guiManager.showMessageBoxByCfg(this.node.parent, configUtils.getDialogCfgByDialogId(99000056));
            newItem.getComponent(ItemBag).init({
                id: itemId,
                isMat: true,
                richTxt: isMain ? "" : `${ selConut}`,
                clickHandler: ()=>{
                    moduleUIManager.showItemDetailInfo(itemId, 0, parentNode);
                }
            })
            newItem.getComponent(cc.Button).interactable = this.toggles[toggleIdx].isChecked;
        } else if (cfg1) {
            let itemBagComp =   newItem.getComponent(ItemBag);
            itemBagComp.init({
                id: itemId,
                level: new Equip(item).getEquipLevel(),
                isMat: true,
                clickHandler: () => {
                    moduleUIManager.showItemDetailInfo(itemId, 0, parentNode, item.Seq);
                }
            })
            itemBagComp.hideStar();
            newItem.getComponent(cc.Button).interactable = this.toggles[toggleIdx].isChecked;
        }
        // 确定材料
        switch (toggleIdx) {
            case 0: 
                this._mainItem = {
                    itemId: item.ID,
                    seq: item.Seq,
                    count: 1,
                    type: cfg ? SMELT_TYPE.RECEIPE : SMELT_TYPE.RANDOM
                }; 
                break;
            case 1: 
                this._leftItem = {
                    itemId: item.ID,
                    seq: item.Seq,
                    count: selConut
                }; 
                break;
            case 2: 
                this._rightItem = {
                    itemId: item.ID,
                    seq: item.Seq,
                    count: selConut
                }; 
                break;
        }
        // 只有在选中态才能按钮生效
        this.toggles.forEach(toggle => {
            let itemComp = toggle.node.getComponentInChildren(ItemBag);
            if (itemComp) {
                itemComp.node.getComponent(cc.Button).interactable = toggle.isChecked;
            }
        })
    }

    removeToggleItem(toggleIdx: number){
        this.toggles[toggleIdx].node.children.
            forEach(child => {
                let itemComp = child.getComponent(ItemBag);
                let idx = this._itemBags.indexOf(itemComp);
                if (itemComp) {
                    ItemBagPool.put(itemComp);

                    if (idx > -1){
                        this._itemBags.splice(idx, 1);
                    }
                }
            }
        )
        // 确定材料
        switch (toggleIdx) {
            case 0:
                this._mainItem = null;
                break;
            case 1:
                this._leftItem = null;
                break;
            case 2:
                this._rightItem = null;
                break;
        }
    }

    getSelCount(itemId: number) {
        let count = 0;
        if (this._toggleIdx == TOGGLE_TYPE.MAIN) {
            if (this._mainItem && this._mainItem.itemId == itemId)
                count = this._mainItem.count;
        }

        if (this._toggleIdx == TOGGLE_TYPE.LEFT) {
            if (this._leftItem && this._leftItem.itemId == itemId)
                count = this._leftItem.count;
        }

        if (this._toggleIdx == TOGGLE_TYPE.RIGHT) {
            if (this._rightItem && this._rightItem.itemId == itemId)
                count = this._rightItem.count;
        }
        return count;
    }

    getFillCount(itemId: number){
        let fillCnt = 0;
        let itemCount = bagData.getItemCountByID(itemId);
        let supportInfo = this._supportInfo[itemId];
        if (supportInfo){
            fillCnt = Math.min(supportInfo.max, Math.floor(itemCount/supportInfo.step) * supportInfo.step);
        }
        return fillCnt;
    }

    getNeedGold(){
        let count = 0;
        if (this._mainItem && this._mainItem.type == SMELT_TYPE.RECEIPE) {
            let recipeCfg = configManager.getConfigByKey("smeltRecipe", this._mainItem.itemId);
            count = recipeCfg.SmeltChangelessNeedMoney;
        } else if (this._mainItem) {
            let equipCfg = configUtils.getEquipConfig(this._mainItem.itemId);
            let smeltRandomCfg: cfg.SmeltRandom = configManager.getConfigList("smeltRandom").find(_cfg => {
                return _cfg.SmeltRandomQuality == equipCfg.Quality;
            })
            count = smeltRandomCfg.SmeltRandomNeedMoney;
        }
        return count;
    }

    checkChipAvaliable(itemId: number){
        let heroCfg = configManager.getConfigList('heroBasic').find((cfg: cfg.HeroBasic) => {
            return cfg.HeroBasicItem == itemId;
        });
        if (heroCfg && heroCfg.HeroBasicId) {
            let haveHero = bagData.getHeroById(heroCfg.HeroBasicId);
            return (haveHero && haveHero.star == 6);
        }
        return true;
    }

    checkItemChanged(item: SmeltItem, oldItem: SmeltItem){
        if ((item && !oldItem) || (!item && oldItem)){
            return true;
        }
        if (item && oldItem){
            return (item.count != oldItem.count) || (item.itemId != oldItem.itemId)
        }
        return false;
    }
    // 一键填充逻辑
    onClickAutoFill() {
        if (!this._mainItem) {
            guiManager.showDialogTips(CustomDialogId.SMELT_CHOOSE_CORE);
            return;
        }
        let recipeCfg = configManager.getConfigByKey("smeltRecipe", this._mainItem.itemId);
        let oldLeftItem = utils.deepCopy(this._leftItem);
        let oldrightItem = utils.deepCopy(this._leftItem);
        let leftItems: data.IBagUnit[] = [];
        let rightItems: data.IBagUnit[] = [];

        if (recipeCfg) {
            let parseItem2 = recipeCfg.SmeltChangelessItemID2
                .split(";")
                .map((_str: string) => { return parseInt(_str) });
            let parseItem3 = recipeCfg.SmeltChangelessItemID3
                .split(";")
                .map((_str: string) => { return parseInt(_str) });
            let leftItem = bagData.getItemByID(parseItem2[0]);
            let rightItem = bagData.getItemByID(parseItem3[0]);
            leftItem && leftItem.Array[0].Count > 0 && leftItems.push(leftItem.Array[0]);
            rightItem && rightItem.Array[0].Count > 0 && rightItems.push(rightItem.Array[0]);
            this._supportInfo[parseItem2[0]] = { min: parseItem2[1], max: parseItem2[1], step: 1 };
            this._supportInfo[parseItem3[0]] = { min: parseItem3[1], max: parseItem3[1], step: 1 };
        } else {
            configManager.getConfigList("smeltRandomBatching").forEach((_cfg: cfg.SmeltRandomBatching) => {
                let cnt = bagData.getItemCountByID(_cfg.SmeltRandomBatchingID);
                let equipCfg = configUtils.getEquipConfig(this._mainItem.itemId);
                if (cnt > 0 && _cfg.SmeltRandomBatchingPosition == 2) {
                    leftItems.push(bagData.getItemByID(_cfg.SmeltRandomBatchingID).Array[0]);
                    this._supportInfo[_cfg.SmeltRandomBatchingID] = {
                        min: 0,
                        max: equipCfg.Quality == QUALITY_TYPE.SR ? _cfg.SmeltRandomBatchingAddLimitSR : _cfg.SmeltRandomBatchingAddLimitSSR,
                        step: equipCfg.Quality == QUALITY_TYPE.SR ? _cfg.SmeltRandomBatchingAddQuantitySR : _cfg.SmeltRandomBatchingAddQuantitySSR,
                    }
                }
                if (cnt > 0 && _cfg.SmeltRandomBatchingPosition == 3) {
                    rightItems.push(bagData.getItemByID(_cfg.SmeltRandomBatchingID).Array[0]);
                    this._supportInfo[_cfg.SmeltRandomBatchingID] = {
                        min: 0,
                        max: equipCfg.Quality == QUALITY_TYPE.SR ? _cfg.SmeltRandomBatchingAddLimitSR : _cfg.SmeltRandomBatchingAddLimitSSR,
                        step: equipCfg.Quality == QUALITY_TYPE.SR ? _cfg.SmeltRandomBatchingAddQuantitySR : _cfg.SmeltRandomBatchingAddQuantitySSR,
                    }
                }
            });
        }
        // 按可用数量排序, 并剔除不可用英雄碎片
        leftItems = leftItems.filter(item => {
            return this.checkChipAvaliable(item.ID);
        })
        // leftItems.sort((_itemA, _itemB) => {
        //     return _itemB.ID - _itemA.ID;
        // })
        // leftItems.sort((_itemA, _itemB) => {
        //     let configA = configUtils.getItemConfig(_itemA.ID);
        //     let configB = configUtils.getItemConfig(_itemB.ID);
        //     return configB.ItemQuality - configA.ItemQuality;
        // })
        // leftItems.sort((_itemA, _itemB) => {
        //     let configA = configUtils.getItemConfig(_itemA.ID);
        //     let configB = configUtils.getItemConfig(_itemB.ID);
        //     return configB.ItemType - configA.ItemType;
        // })
        // leftItems.sort((_itemA, _itemB) => {
        //     let fillA = this.getFillCount(_itemA.ID) ? 1 : -1;
        //     let fillB = this.getFillCount(_itemB.ID) ? 1 : -1;
        //     return fillB - fillA;
        // })

        leftItems.sort((_itemA, _itemB) => {
            if (_itemB.ID != _itemA.ID) {
                return _itemB.ID - _itemA.ID;
            }
            let configA = configUtils.getItemConfig(_itemA.ID);
            let configB = configUtils.getItemConfig(_itemB.ID);

            if (configB.ItemQuality != configA.ItemQuality) {
                return configB.ItemQuality - configA.ItemQuality;
            }

            if (configB.ItemType != configA.ItemType) {
                return configB.ItemType - configA.ItemType;
            }
            let fillA = this.getFillCount(_itemA.ID) ? 1 : -1;
            let fillB = this.getFillCount(_itemB.ID) ? 1 : -1;
            return fillB - fillA;
        })


        rightItems = rightItems.filter(item => {
            return this.checkChipAvaliable(item.ID);
        })
        // rightItems.sort((_itemA, _itemB) => {
        //     return _itemB.ID - _itemA.ID;
        // })
        // rightItems.sort((_itemA, _itemB) => {
        //     let configA = configUtils.getItemConfig(_itemA.ID);
        //     let configB = configUtils.getItemConfig(_itemB.ID);
        //     return configB.ItemQuality - configA.ItemQuality;
        // })
        // rightItems.sort((_itemA, _itemB) => {
        //     let configA = configUtils.getItemConfig(_itemA.ID);
        //     let configB = configUtils.getItemConfig(_itemB.ID);
        //     return configB.ItemType - configA.ItemType;
        // })
        // rightItems.sort((_itemA, _itemB) => {
        //     let fillA = this.getFillCount(_itemA.ID) ? 1 : -1;
        //     let fillB = this.getFillCount(_itemB.ID) ? 1 : -1;
        //     return fillB - fillA;
        // })
        rightItems.sort((_itemA, _itemB) => {
            if (_itemB.ID != _itemA.ID) {
                return _itemB.ID - _itemA.ID;
            }
            let configA = configUtils.getItemConfig(_itemA.ID);
            let configB = configUtils.getItemConfig(_itemB.ID);

            if (configB.ItemQuality != configA.ItemQuality) {
                return configB.ItemQuality - configA.ItemQuality;
            }

            if (configB.ItemType != configA.ItemType) {
                return configB.ItemType - configA.ItemType;
            }
            let fillA = this.getFillCount(_itemA.ID) ? 1 : -1;
            let fillB = this.getFillCount(_itemB.ID) ? 1 : -1;
            return fillB - fillA;
        })

        let isEnough = !!this._leftItem || (!this._leftItem && leftItems.length > 0);

        if (!this._leftItem && leftItems.length) {
            let fillCnt = this.getFillCount(leftItems[0].ID);
            let cntEnough = fillCnt && fillCnt >= this._supportInfo[leftItems[0].ID].max;
            isEnough = isEnough && cntEnough;
            if (cntEnough)
                this.addToggleItem(TOGGLE_TYPE.LEFT, leftItems[0], fillCnt);
            if (this._toggleIdx == TOGGLE_TYPE.LEFT && cntEnough){
                this.itemList.numItems = this._displayItems.length;
                this.emptyTips.active = !this.itemList.numItems;
            }
        }

        isEnough = isEnough && (!!this._rightItem || (!this._rightItem && rightItems.length > 0));
        if (!this._rightItem && rightItems.length) {
            let fillCnt = this.getFillCount(rightItems[0].ID);
            let cntEnough = fillCnt && fillCnt >= this._supportInfo[rightItems[0].ID].max;
            isEnough = isEnough && cntEnough;
            if (cntEnough)
                this.addToggleItem(TOGGLE_TYPE.RIGHT, rightItems[0], fillCnt);
            if (this._toggleIdx == TOGGLE_TYPE.RIGHT && cntEnough) {
                this.itemList.numItems = this._displayItems.length;
                this.emptyTips.active = !this.itemList.numItems;
            }
        }

        let leftChanged = this.checkItemChanged(this._leftItem, oldLeftItem);
        let rightChanged = this.checkItemChanged(this._rightItem, oldrightItem);
        if (this._mainItem && this._mainItem.type == SMELT_TYPE.RECEIPE && (leftChanged || rightChanged)) {
            this.clearTipsInfo();
            this.showRecipeTipsInfo();
        } else if (this._mainItem && (leftChanged || rightChanged)) {
            this.showRandomTipsInfo();
        }

        !isEnough && guiManager.showDialogTips(1000137);
    }

    onClickSmelt(){
        let stove0: gamesvr.ISmeltStove = null;
        let stove1: gamesvr.ISmeltStove = null;
        let stove2: gamesvr.ISmeltStove = null;

        this._mainItem && (stove0 = {
            ID: this._mainItem.itemId,
            Seq: this._mainItem.seq,
            Count: this._mainItem.count,
        })
        this._leftItem && (stove1 = {
            ID: this._leftItem.itemId,
            Seq: this._leftItem.seq,
            Count: this._leftItem.count,
        })
        this._rightItem && (stove2 = {
            ID: this._rightItem.itemId,
            Seq: this._rightItem.seq,
            Count: this._rightItem.count,
        })

        if (bagData.gold < this.getNeedGold()) {
            guiManager.showDialogTips(CustomDialogId.SMELT_GOLD_NO_ENOUGH);
            return;
        } 
        if (!stove0) {
            guiManager.showDialogTips(CustomDialogId.SMELT_CHOOSE_CORE);
            return;
        } else if (this._mainItem && this._mainItem.type == SMELT_TYPE.RECEIPE && !(stove0 && stove1 && stove2)) {
            guiManager.showDialogTips(CustomDialogId.SMELT_MAT_NO_ENOUGH);
            return;
        }

        bagDataOpt.sendSmeltRequest(stove0, stove1, stove2);
    }

    private _onSmeltRes(cmd: any, prizes: data.IItemInfo[]){
        if(!prizes || prizes.length <= 0) return;

        let parentNode = uiHelper.getRootViewComp(this.node.parent).node;

        //过滤额外奖励
        let extraPrize = this._getExtraSmeltPrize();
        if(extraPrize && extraPrize.length > 0){
            let idx = 0, len = extraPrize.length;
            for(; idx < len; idx++){
                let prize = extraPrize[idx];
                let idxInPrizes = prizes.findIndex(ele => {
                        return ele.ID == prize.ID && utils.longToNumber(ele.Count) == utils.longToNumber(prize.Count)
                    });
                if(idxInPrizes != -1){
                    prizes.splice(idxInPrizes, 1);
                }else{
                    extraPrize.splice(idx, 1);
                    idx -= 1;
                    len -= 1;
                }
            }
        }

        //有效熔炼(超出部分会被转化为其他道具)
        if(bagDataUtils.isTreasure({ID: prizes[0].ID})){
            let isNew = bagData.checkItemNew(BAG_ITEM_TYPE.TREASURE, prizes[0].ID);
            if(isNew){
                let treasureItem = bagData.getItemByID(prizes[0].ID);
                let treasureUnit = treasureItem ? treasureItem.Array[0] : null;
                treasureUnit && bagData.updateLastItemData(BAG_ITEM_TYPE.TREASURE, utils.deepCopy(treasureUnit));
                parentNode && guiManager.loadView('TreasureActiveView', parentNode, prizes[0].ID, () => {
                    this.scheduleOnce(() => {
                        this._showPrizes(parentNode, prizes, extraPrize);
                    }, 0.05);
                });
            }else{
                //满级后替换为其他道具
                let replacePrizes: data.IItemInfo [] = [];
                prizes.forEach(ele => {
                    let treasureCfg = configUtils.getLeadTreasureConfig(ele.ID);
                    if(!treasureCfg || !treasureCfg.MaxConversion || treasureCfg.MaxConversion.length == 0) return;
                    utils.parseStingList(treasureCfg.MaxConversion, (itemCfg: string[]) => {
                        if(!itemCfg || itemCfg.length == 0) return;
                        let itemID = parseInt(itemCfg[0]);
                        let count = parseInt(itemCfg[1]);
                        replacePrizes.push({ID: itemID, Count: count});
                    });
                })
                this._showPrizes(parentNode, replacePrizes, extraPrize);
            }
        }else {
            this._showPrizes(parentNode, prizes, extraPrize);
        }

        this.removeToggleItem(TOGGLE_TYPE.MAIN);
        this.removeToggleItem(TOGGLE_TYPE.LEFT);
        this.removeToggleItem(TOGGLE_TYPE.RIGHT);
        this.toggles[0].isChecked = true;
        this._toggleIdx = TOGGLE_TYPE.NONE;
        this.clearTipsInfo();
        this.onClickMainItem();
        this.itemList.selectedId = -1;
    }

    private _showPrizes(prrentNode: cc.Node, prizes: data.IItemInfo[], extraPrize: data.IItemInfo[]){
        if(!cc.isValid(prrentNode)) return;
        guiManager.loadView(VIEW_NAME.GET_ITEM_VIEW, prrentNode, prizes, extraPrize);
    }

    private _getExtraSmeltPrize(): data.IItemInfo[]{
        let prizes: data.IItemInfo[] = null;
        let extra = taskData.getTreasureSysPowerParam(TREASURE_SYS_POWER_TYPE.BA_GUA_LU);
        extra && (prizes = [{ID: 10010011, Count: extra}]);
        return prizes;
    }

    private _resetToggles(){
        this.toggles[TOGGLE_TYPE.LEFT].node.getChildByName("lock").active = !this._mainItem;
        this.toggles[TOGGLE_TYPE.RIGHT].node.getChildByName("lock").active = !this._mainItem;
    }

    onClickShop(){
        //跳转幻灵商店
        moduleUIManager.jumpToModule(25000, 0, ShopSubType.HuanLing);
    }
}
