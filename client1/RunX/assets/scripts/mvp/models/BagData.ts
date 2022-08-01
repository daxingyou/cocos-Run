import { CustomItemId } from "../../app/AppConst";
import { configUtils } from "../../app/ConfigUtils";
import { configManager } from "../../common/ConfigManager";
import { BAG_ITEM_TYPE, HEAD_TYPE, TREASURE_CONDITION_TYPE } from "../../app/AppEnums";
import { utils } from "../../app/AppUtils";
import { data, gamesvr } from "../../network/lib/protocol";
import { cfg } from "../../config/config";
import BaseModel from "./BaseModel";
import HeroUnit from "../template/HeroUnit";
import { Equip } from "../template/Equip";
import { userData } from "./UserData";
import { pragmaticData } from "./PragmaticData";
import { redDotMgr } from "../../common/RedDotManager";
import { eventCenter } from "../../common/event/EventCenter";
import { bagDataEvent } from "../../common/event/EventData";
import { bagDataUtils } from "../../app/BagDataUtils";
import { taskData } from "./TaskData";

interface EquipNormal {
    Attack?: number,             //基础攻击
    Defend?: number             //基础防御
    Hp?: number                  //基础血量
}

// 装备属性，基础/特殊/特技/灵兽
interface EquipProp {
    white: EquipNormal,
    green: cfg.EquipGreen[],
    yellow: cfg.EquipYellow,
    castSoul?: {[Key: number] : number}
    beast?: {[key: number]: number},
    beastSpe?: cfg.EquipYellow[],
}

interface LastBagData {
    props: data.IBagUnit[],
    mats: data.IBagUnit[],
    equips: data.IBagUnit[],
    heros: data.IBagUnit[],
    treasures?: data.IBagUnit[],
}

interface TreasureProp  {
  ID: number,
  lv: number,
  LvUpNeedCount: number[],
  fixAttrScope?: number,
  fixAttr1ID?: number,
  fixAttr1Values?: number[],
  fixAttr1CurValue?: number,
  fixAttr2ID?: number,
  fixAttr2Values?: number[],
  fixAttr2CurValue?: number,
  taskMaxCount?: number,
  taskPerStepNeedNum?: number,
  taskCurProgress?: number,
  taskCurNum?: number,      // 当前任务进度(具体数量，eg:3个、5次、3000分)
  addOnAttrScope?: number,
  addOnAttrID?: number,
  addOnAttrValues?: number[],
  addOnAttrCurValue?: number
}

class BagData extends BaseModel {
    private _bagData: { [k: string]: data.IBagItem } = {};
    private _bagDataKeys: Array<string> = [];
    private _lastData: LastBagData = null;
    private _lastDataCopy: LastBagData = null;  //获取物品界面用
    private _treasureProp: Map<number, TreasureProp> = new Map();

    get treasureProp() {
        return this._treasureProp;
    }

    get diamond() {
        let item = this.getItemByID(CustomItemId.DIAMOND);
        return item ? utils.longToNumber(item.Array[0].Count) : 0;
    }

    get physical() {
        let item = this.getItemByID(CustomItemId.PHYSICAL);
        return item ? utils.longToNumber(item.Array[0].Count) : 0;
    }

    get gold() {
        let item = this.getItemByID(CustomItemId.GOLD);
        return item ? utils.longToNumber(item.Array[0].Count) : 0;
    }

    get honor() {
        let item = this.getItemByID(CustomItemId.HONOR);
        return item ? utils.longToNumber(item.Array[0].Count) : 0;
    }

    get reputation() {
        let item = this.getItemByID(CustomItemId.REPUTATION);
        return item ? utils.longToNumber(item.Array[0].Count) : 0;
    }

    get heroList(): data.IBagUnit[] {
        let ownHeroes: data.IBagUnit[] = [];
        let keys = this._bagDataKeys;
        for (let i = 0; i < keys.length; ++i) {
            const item = this._bagData[keys[i]];
            item.Array.forEach(eachItem => {
                if (eachItem && utils.longToNumber(eachItem.Count) > 0) {
                    let cfg = configManager.getConfigByKey("hero", eachItem.ID);
                    cfg && ownHeroes.push(eachItem);
                }
            });
        }
        return ownHeroes;
    }

    get bagItems() {
        return this._bagData;
    }

    get equipList(): data.IBagUnit[] {
        return this.getItemsByType(BAG_ITEM_TYPE.EQUIP)
    }

    get bagDataKeys() {
        return this._bagDataKeys;
    }

    init() { }

    deInit() { 
        this._bagData = {};
        this._bagDataKeys = [];
        this._lastData = null;
        this._lastDataCopy = null;  //获取物品界面用
        this._treasureProp.clear();
    }

    initBagData(bagData: data.IBagData) {
        if(!bagData) return;
        this._bagData = bagData.Items;
        this._bagDataKeys = Object.keys(this._bagData);
        let props = this.getItemsByType(BAG_ITEM_TYPE.PROP);
        let equips = this.getItemsByType(BAG_ITEM_TYPE.EQUIP);
        let materials = this.getItemsByType(BAG_ITEM_TYPE.MATERIAL);
        let heros = this.getItemsByType(BAG_ITEM_TYPE.HERO);
        let treasures = this.getItemsByType(BAG_ITEM_TYPE.TREASURE);
        this._lastData = {
            props: utils.deepCopy(props),
            equips: utils.deepCopy(equips),
            mats: utils.deepCopy(materials),
            heros: utils.deepCopy(heros),
            treasures: utils.deepCopy(treasures),
        };
        this._lastDataCopy = {
            props: utils.deepCopy(props),
            equips: utils.deepCopy(equips),
            mats: utils.deepCopy(materials),
            heros: utils.deepCopy(heros),
        };
    }

    //初始化宝物属性
    initTreasureProp(){
        let treasures = this.getItemsByType(BAG_ITEM_TYPE.TREASURE);
        if(!treasures) return;
        treasures.forEach(ele => {
            this._initOneTreasureProp(ele.ID);
        });
    }

    private _initOneTreasureProp(treasureID: number){
        let treasureCfg: cfg.LeadTreasure = configUtils.getLeadTreasureConfig(treasureID);
        let lv: number = bagDataUtils.getTreasureLV(treasureID);
        let treasureProp: TreasureProp = this._treasureProp.get(treasureID);
        if(!this._treasureProp.has(treasureID)){
            let lvUpcfg = utils.parseStringTo1Arr(treasureCfg.LevelUpNeed);
            let lvUpCfgArr = lvUpcfg.map(ele => {
                return parseFloat(ele);
            });
            treasureProp = {ID: treasureID, lv: lv, LvUpNeedCount: lvUpCfgArr};
            this._treasureProp.set(treasureID, treasureProp);
        }

        let oriAttrScope = treasureCfg.FixedAttributeType || 0;
        if(oriAttrScope) {
            treasureProp.fixAttrScope = oriAttrScope;
            let oriAttr1 = treasureCfg.FixedAttributeID1 || 0;
            if(oriAttr1 && treasureCfg.FixedAttributeValue1 && treasureCfg.FixedAttributeValue1.length > 0){
                let oriAttrValues = utils.parseStringTo1Arr(treasureCfg.FixedAttributeValue1).map(ele => {
                    return parseFloat(ele);
                });
                treasureProp.fixAttr1ID = oriAttr1;
                treasureProp.fixAttr1Values = oriAttrValues;
                treasureProp.fixAttr1CurValue = oriAttrValues[lv - 1];
            }

            let oriAttr2 = treasureCfg.FixedAttributeID2 || 0;
            if(oriAttr2 && treasureCfg.FixedAttributeValue2 && treasureCfg.FixedAttributeValue2.length > 0){
                let oriAttrValues = utils.parseStringTo1Arr(treasureCfg.FixedAttributeValue2).map(ele => {
                    return parseFloat(ele);
                });
                treasureProp.fixAttr2ID = oriAttr2;
                treasureProp.fixAttr2Values = oriAttrValues;
                treasureProp.fixAttr2CurValue = oriAttrValues[lv - 1];
            }
        }

        //条件属性
        let addOnPropScope = treasureCfg.AttributeConditionType || 0;
        let addOnPropID = treasureCfg.AttributeConditionID;
        if(addOnPropScope && addOnPropID && treasureCfg.AttributeConditionValue && treasureCfg.AttributeConditionValue.length > 0){
            treasureProp.addOnAttrScope = addOnPropScope;
            treasureProp.addOnAttrID = addOnPropID;
            let addOnPropValues = utils.parseStringTo1Arr(treasureCfg.AttributeConditionValue).map(ele => {
                return parseFloat(ele);
            });
            treasureProp.addOnAttrValues = addOnPropValues;
            treasureProp.taskMaxCount = treasureCfg.AttributeConditionMax || 1;
            treasureProp.taskPerStepNeedNum = treasureCfg.ConditionGoalParam || 1;
            let currFinishCD = taskData.getTreasureTaskAchieveCnt(treasureCfg.ConditionID);
            let finishTimes = Math.floor(currFinishCD / treasureProp.taskPerStepNeedNum);
            finishTimes = Math.min(finishTimes, treasureProp.taskMaxCount);
            treasureProp.taskCurProgress = finishTimes;
            treasureProp.taskCurNum = Math.min(currFinishCD, treasureProp.taskMaxCount * treasureProp.taskPerStepNeedNum);
            treasureProp.addOnAttrCurValue = finishTimes * addOnPropValues[lv - 1];
        }
    }

    //更新宝物属性加成
    updateTreasureProp(treasureID: number){
        if(!treasureID) return;
        let treasure = this.getItemByID(treasureID);
        if(!treasure) return;

        let treasureCfg: cfg.LeadTreasure = configUtils.getLeadTreasureConfig(treasureID);
        if(this._treasureProp.has(treasureID)){
            let treasureProp = this._treasureProp.get(treasureID);
            let lv = bagDataUtils.getTreasureLV(treasureID);
            treasureProp.lv = lv;
            if(treasureProp.fixAttrScope) {
                treasureProp.fixAttr1ID && (treasureProp.fixAttr1CurValue = treasureProp.fixAttr1Values[lv - 1]);
                treasureProp.fixAttr2ID && (treasureProp.fixAttr2CurValue = treasureProp.fixAttr2Values[lv - 1]);
            }

            if(treasureProp.addOnAttrScope && treasureProp.addOnAttrID){
                let currFinishCD = taskData.getTreasureTaskAchieveCnt(treasureCfg.ConditionID);
                let finishTimes = Math.floor(currFinishCD / treasureProp.taskPerStepNeedNum);
                finishTimes = Math.min(finishTimes, treasureProp.taskMaxCount);
                treasureProp.taskCurProgress = finishTimes;
                treasureProp.taskCurNum = Math.min(currFinishCD, treasureProp.taskMaxCount * treasureProp.taskPerStepNeedNum);
                treasureProp.addOnAttrCurValue = finishTimes * treasureProp.addOnAttrValues[lv - 1];
            }
            return;
        }
        this._initOneTreasureProp(treasureID);
    }

    updateLastData(type: BAG_ITEM_TYPE, getItem?: boolean){
        if (getItem){
            this._lastDataCopy = {
              props: utils.deepCopy(this.getItemsByType(BAG_ITEM_TYPE.PROP)),
              equips: utils.deepCopy(this.getItemsByType(BAG_ITEM_TYPE.EQUIP)),
              mats: utils.deepCopy(this.getItemsByType(BAG_ITEM_TYPE.MATERIAL)),
              heros: utils.deepCopy(this.getItemsByType(BAG_ITEM_TYPE.HERO)),
            };
            return;
        }

        switch(type){
            case BAG_ITEM_TYPE.PROP: this._lastData.props = this.getItemsByType(BAG_ITEM_TYPE.PROP); break;
            case BAG_ITEM_TYPE.EQUIP: this._lastData.equips = this.getItemsByType(BAG_ITEM_TYPE.EQUIP); break;
            case BAG_ITEM_TYPE.MATERIAL: this._lastData.mats = this.getItemsByType(BAG_ITEM_TYPE.MATERIAL); break;
            case BAG_ITEM_TYPE.HERO: this._lastData.heros = this.getItemsByType(BAG_ITEM_TYPE.HERO); break;
            case BAG_ITEM_TYPE.TREASURE: this._lastData.treasures = this.getItemsByType(BAG_ITEM_TYPE.TREASURE); break;
            default: break;
        }
    }

    updateLastItemData(type: BAG_ITEM_TYPE, item: data.IBagUnit){
        switch (type) {
            case BAG_ITEM_TYPE.EQUIP:
                this._lastData.equips.push(item);
                break;
            case BAG_ITEM_TYPE.HERO:
                this._lastData.heros.push(item);
                break;
            case BAG_ITEM_TYPE.TREASURE:
                this._lastData.treasures = this._lastData.treasures || [];
                let oldIdx = this._lastData.treasures.findIndex(ele => {
                    return ele.ID == item.ID;
                });
                oldIdx != -1 && this._lastData.treasures.splice(oldIdx, 1);
                this._lastData.treasures.push(item);
                break;
            default: break;
        }
    }

    checkItemNew(type: BAG_ITEM_TYPE, id: number, getItem?: boolean){
        let isNew = false;
        switch (type) {
            // case BAG_ITEM_TYPE.PROP: 
            //     isNew = getItem ? this._lastDataCopy.props.filter(item => { return item.ID == id; }).length == 0
            //             : this._lastData.props.filter(item=>{ return item.ID == id; }).length == 0;
            //     break;
            // case BAG_ITEM_TYPE.MATERIAL: 
            //     isNew = getItem ? this._lastDataCopy.mats.filter(item => { return item.ID == id; }).length == 0
            //         : this._lastData.mats.filter(item => { return item.ID == id; }).length == 0;
            //     break;
            case BAG_ITEM_TYPE.EQUIP: 
                isNew = getItem ? this._lastDataCopy.equips.filter(item => { return item.ID == id; }).length == 0
                    : this._lastData.equips.filter(item => { return item.ID == id; }).length == 0;
                break;
            case BAG_ITEM_TYPE.HERO: 
                isNew = getItem ? this._lastDataCopy.heros.filter(item => { return item.ID == id; }).length == 0
                    : this._lastData.heros.filter(item => { return item.ID == id; }).length == 0;
                break;
            case BAG_ITEM_TYPE.TREASURE:
                let newCnt = this.getItemCountByID(id);
                if(!this._lastData.treasures || this._lastData.treasures.length == 0){
                    isNew = true;
                    break;
                }

                let idx = this._lastData.treasures.findIndex(ele => {
                    if(ele.ID == id){
                        return true;
                    }
                    return false;
                });

                if(idx == -1){
                    isNew = true
                }else if(utils.longToNumber(this._lastData.treasures[idx].Count) != newCnt){
                    isNew = true;
                }
                break;
            default: break;
        }
        return isNew;
    }
    
    //更新背包数据,每次理论上仅更新
    updateBagData(bagData: data.IBagUnit[]) {
        if (!bagData || bagData.length == 0) return;
        //新加数据
        // logger.log("数据：" + JSON.stringify(bagData));
        bagData.forEach(bagUnit => {
            let find = this.getItemBySeq(bagUnit.Seq, bagUnit.ID);
            if (find) {
                find.Count = bagUnit.Count;
                find.UpdateTime = bagUnit.UpdateTime;
                find.EquipUnit = { ...bagUnit.EquipUnit };
                find.HeroUnit = { ...bagUnit.HeroUnit };
            } else {
                let item = this.getItemByID(bagUnit.ID);
                if (item) {
                    item.Array.push(bagUnit);
                } else {
                    this._bagData[bagUnit.ID] = {
                        Array: [bagUnit]
                    }

                    this._bagDataKeys.push(String(bagUnit.ID));
                }
            }
            //经验道具同步到UserData
            if (bagUnit.ID == CustomItemId.EXP) {
                let find = this.getItemBySeq(bagUnit.Seq, bagUnit.ID);
                userData.updateExp(utils.longToNumber(find.Count));
            } else if(bagUnit.ID == CustomItemId.PRAGMATIC_SKILL_POINT) {
                pragmaticData.updateBagSkillPoint();
            } else if(CustomItemId.GUILD_EXP == bagUnit.ID) {
                eventCenter.fire(bagDataEvent.GUILD_EXP_CHANGE);
            }

            //宝物
            if(bagDataUtils.isTreasure(bagUnit)){
                this.updateTreasureProp(bagUnit.ID);
                userData.updateCapability();
            }
        });
        redDotMgr.updateData(bagData);
    }

    getItemByID(itemId: number): data.IBagItem {
        return this._bagData[itemId];
    }

    /**
     * @description 根据物品ID获取物品持有数量，
     * 【注意】只对不能叠加的物品有效
     * @param itemId 物品ID
     * @returns 
     */
    getItemCountByID(itemId: number): number {
        let v = this.getItemByID(itemId)
        if (!v || !v.Array) return 0

        return utils.longToNumber(v.Array[0].Count);
    }

    /**
     * @description 根据索引去找item，如果传入id速度会更快
     * @param seq 序列ID
     * @param itemId 物品ID
     * @returns 
     */
    getItemBySeq(seq: any, itemId: number = 0): data.IBagUnit {
        let resUnit: data.IBagUnit;

        if (itemId) {
            let itemByID = this.getItemByID(itemId);
            if (itemByID && itemByID.Array.length) {
                itemByID.Array.forEach(eachItem => {
                    if (utils.longToNumber(eachItem.Seq) == utils.longToNumber(seq)) {
                        resUnit = eachItem;
                    }
                });
            }
        } else {
            for (const key in this._bagData) {
                if (this._bagData.hasOwnProperty(key)) {
                    const item = this._bagData[key];
                    item.Array.forEach(eachItem => {
                        if (utils.longToNumber(eachItem.Seq) == utils.longToNumber(seq)) {
                            resUnit = eachItem;
                        }
                    });
                }
            }
        }
        return resUnit;
    }

    /**
     * 获取英雄资料，也可以判断有没有该英雄
     * @param heroId 
     * @returns 
    */
    getHeroById(heroId: number): HeroUnit {
        let itemData = this._bagData[heroId];
        if (itemData && itemData.Array.length > 0) {
            // 英雄不能叠加
            return new HeroUnit(itemData.Array[0])
        }
        return null
    }
    

    getEquipById(equipId: number, seq?: number): Equip {
        let itemData = this._bagData[equipId];
        if (itemData && itemData.Array.length > 0) {
            let equipIndex: number = 0;
            if (seq) {
                equipIndex = itemData.Array.findIndex((equip) => {
                    return utils.longToNumber(equip.Seq) == seq;
                });
            }
            if (itemData.Array[equipIndex]) return new Equip(itemData.Array[equipIndex]);
        }
        return null
    }

    getItemsByType(type: BAG_ITEM_TYPE): data.IBagUnit[] {
        let items: data.IBagUnit[] = [];
        let keys: Array<string> = this._bagDataKeys;
        for (let i = 0; i < keys.length; ++i) {
            const item = this._bagData[keys[i]];
            item.Array.forEach(eachItem => {
                if (eachItem && utils.longToNumber(eachItem.Count) > 0) {
                    let cfg = configUtils.getItemConfig(eachItem.ID);
                    
                    if (cfg && cfg.ItemSort == type) {
                        items.push(eachItem);
                    } else if (type == BAG_ITEM_TYPE.EQUIP) {
                        let eCfg = configUtils.getEquipConfig(eachItem.ID);
                        eCfg && items.push(eachItem);
                    } else if(type == BAG_ITEM_TYPE.BEAST) {
                        let beastCfg = configUtils.getBeastConfig(eachItem.ID);
                        beastCfg && items.push(eachItem);
                    } else if (type == BAG_ITEM_TYPE.HERO) {
                        let hCfg = configUtils.getHeroBasicConfig(eachItem.ID);
                        hCfg && eachItem.ID != hCfg.HeroBasicItem && items.push(eachItem);
                    } else if(type == BAG_ITEM_TYPE.HEAD){
                        let headCfg = configUtils.getHeadConfig(eachItem.ID);
                        headCfg && headCfg.HeadFrameType == HEAD_TYPE.HEAD && items.push(eachItem);
                    } else if(type == BAG_ITEM_TYPE.HEAD_FRAME) {
                        let headCfg = configUtils.getHeadConfig(eachItem.ID);
                        headCfg && headCfg.HeadFrameType == HEAD_TYPE.FRAME && items.push(eachItem);
                    } else if (cfg && cfg.ItemType && cfg.ItemType == type) {
                        items.push(eachItem);
                    }
                }
            });
        }

        
        
        return items;
    }

   
    updateHeroGift(heroId: number, giftId: number, skillId: number = 0) {
        let hero = this._bagData[heroId];
        if (hero && hero.Array.length > 0) {
            hero.Array[0].HeroUnit.Gifts[giftId] = new data.GiftInfo();
            if (skillId > 0) {
                hero.Array[0].HeroUnit.Gifts[giftId].SkillID = skillId;
            }
        }
    }

    updateHeroPower(msg: gamesvr.HeroPowerNotify) {
        let hero = this._bagData[msg.HeroID];
        if (hero && hero.Array.length > 0) {
            hero.Array[0].HeroUnit.Attrs[900] = msg.Power;
        }
    }

    getTreasures(): cfg.LeadTreasure[] {
        let treasureList: cfg.LeadTreasure[] = [];
        const treasureCfgs: cfg.LeadTreasure[] = configManager.getConfigList('leadTreasure');
        treasureList = treasureCfgs.filter(_treasureCfg => {
            return !!bagData.getItemByID(_treasureCfg.ItemID);
        });
        return treasureList;
    }

    updateEquipUnit(equipId: number, seq: number, castSoulMap?: { [k: string]: number }, castSoulChooseMap?: { [k: string]: number }){
        let itemBagUnit = this.getItemBySeq(seq, equipId);
        castSoulMap && (itemBagUnit.EquipUnit.CastSoulPoolMap = castSoulMap);
        castSoulChooseMap && (itemBagUnit.EquipUnit.CastSoulChooseMap = castSoulChooseMap);
    }

    /**
     * @description 根据灵宝任务条件类型对数量进行单位转换
     */
    convertUnitOfTreasureTaskNumByConditionType(taskNum: number, conditionType: TREASURE_CONDITION_TYPE) {
        switch (conditionType) {
            case TREASURE_CONDITION_TYPE.RECHARGE:
                taskNum = Math.floor(taskNum / 100);    // 充值类型 分 转为 元
                break;
        }

        return taskNum;
    }

    /**
     * 更新装备的经验
     * @param seq 序列号
     * @param id ID
     * @param exp 目标经验值
     */
    updateEquipExp(seq: number, id: number, exp: number) {
        let item: data.IBagUnit = this.getItemBySeq(seq, id);
        item.EquipUnit && (item.EquipUnit.Exp = exp);
    }
}

let bagData = new BagData();
export {
    bagData,
    EquipProp
}