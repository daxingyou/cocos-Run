import { configCache } from "../common/ConfigCache";
import { configManager } from "../common/ConfigManager";
import guiManager from "../common/GUIManager";
import { cfg } from "../config/config";
import { bagData } from "../mvp/models/BagData";
import { serverTime } from "../mvp/models/ServerTime";
import { userData } from "../mvp/models/UserData";
import { Equip } from "../mvp/template/Equip";
import HeroUnit from "../mvp/template/HeroUnit";
import { data } from "../network/lib/protocol";
import { CustomItemId, FULL_PERCENT } from "./AppConst";
import { BAG_ITEM_TYPE, EQUIP_PART_TYPE, EQUIP_TEXTURE_TYPE, HEAD_OPEN_TYPE, HEAD_TYPE, LEVEL_EXP_TYPE, QUALITY_TYPE } from "./AppEnums";
import { TransPiece } from "./AppType";
import { utils } from "./AppUtils";
import { configUtils } from "./ConfigUtils";

/**
 * @description 背包/武将相关的通用接口
 *  getHeroInitStar         根据ID获取武将的初始星级
 *  getEquipBeginStar       根据配置获取装备的初始星级
 *  checkEquipIsDressed     检验装备是否被穿戴
 *  getNotDressEquips       获取未装备武器
 *  checkEquipCastSoul      装备是否可以铸魂
 *  getEnhanceGoldMulti     装备强化所需金币
 *  getBreakGold            装备突破所需金币
 *  mergeGreenProp          合并绿色装备的所有属性
 *  buildDefaultEquip       根据ID构建基础装备
 *  buildDefaultItem        根据ID构建基础道具
 *  getEquipExpProvide      装备材料在作为材料时提供的经验值
 *  checkHeroMerge          是否可以碎片合成英雄
 *  checkOwnHero            检查是否拥有这个英雄
 *  getHeroChipCnt          获取拥有该英雄的碎片数量
 *  getHeroNeedChipCount    获得当前英雄星级升星所需要的碎片
 *  checkHeroCanAddStar     英雄是否能升星
 *  checkCommonEquip        检查装备是不是公共部分
 */

export class BagDataUtils {
    private _curEquipMaxLevel: number = -1;
    private _equipMaxLevel: number = -1;

    /** 当前装备最大等级(跟等级相关) */
    get curEquipMaxLevel() {
        let factorNumber: number = configUtils.getModuleConfigs().EquipLevelMax;
        factorNumber = factorNumber > 0 ? factorNumber : 2;
        let maxLevel = userData.lv * factorNumber;
        
        this._curEquipMaxLevel = maxLevel <= bagDataUtils.equipMaxLevel ? maxLevel : bagDataUtils.equipMaxLevel;
        
        return this._curEquipMaxLevel;
    }

    /** 装备最大等级(跟等级上限有关) */
    get equipMaxLevel() {
        if (this._equipMaxLevel === -1) {
            let factorNumber: number = configUtils.getModuleConfigs().EquipLevelMax;
            factorNumber = factorNumber > 0 ? factorNumber : 2;

            let levelExpConfigs: {[key: number]: cfg.LevelExp} = configManager.getConfigs("levelExp");
            let maxLevel: number = 0;
            for (let k in levelExpConfigs) {
                if (levelExpConfigs[k].LevelExpType === LEVEL_EXP_TYPE.USER) {
                    maxLevel += 1;
                }
            }

            this._equipMaxLevel = maxLevel * factorNumber;
        }

        return this._equipMaxLevel;
    }

    /**
     * @description 获取武将的初始星级
     * @param hero 武将basic配置
     * @returns
     */
    getHeroInitStar(heroId: number) {
        let hero: cfg.HeroBasic = configUtils.getHeroBasicConfig(heroId);
        let modelConfig: cfg.ConfigModule = configUtils.getModuleConfigs();
        let heroBeginStarString = modelConfig.HeroBeginStar;
        let heroBeginStarList: string[] = utils.parseStingList(heroBeginStarString);
        for (const k in heroBeginStarList) {
            if (hero.HeroBasicQuality == Number(heroBeginStarList[k][0])) {
                return Number(heroBeginStarList[k][1])
            }
        }
        return 1;
    }

    /**
     * @description 获取装备的初始星级
     * @param hero 装备配置
     * @returns
     */
    getEquipBeginStar(equipCfg: cfg.Equip) {
        return 0;
        // 调整装备初始星级都为0
        // let modelConfig = configUtils.getModuleConfigs();
        // let equipBeginStarString = modelConfig.EquipBeginStar;
        // let equipBeginStarList: string[] = utils.parseStingList(equipBeginStarString);
        // for (const k in equipBeginStarList) {
        //     if (quipCfg.Quality == Number(equipBeginStarList[k][0])) {
        //         return Number(equipBeginStarList[k][1])
        //     }
        // }
        // return 1;
    }

    /**
     * @desc 检验装备是否被穿戴
     * @param equip 装备单元
     * @returns 持有者HeroId
     */
    checkEquipIsDressed(equip: data.IBagUnit): number {
        let heroList: data.IBagUnit[] = bagData.heroList;
        for (let i = 0; i < heroList.length; ++i) {
            let heroEquips: { [k: string]: data.IBagUnit } = heroList[i].HeroUnit.Equips;
            if (heroEquips) {
                for (const k in heroEquips) {
                    if (heroEquips[k].ID == equip.ID && utils.longToNumber(heroEquips[k].Seq) == utils.longToNumber(equip.Seq)) {
                        return heroList[i].ID;
                    }
                }
            }
        }
        return 0;
    }

    /**
    * 获取未装备武器
    * @returns 
    */
    getNotDressEquips(): data.IBagUnit[] {
        let notDressEquips: data.IBagUnit[] = bagData.getItemsByType(BAG_ITEM_TYPE.EQUIP);
        let allHeroes = bagData.heroList;
        for (let i = 0; i < allHeroes.length; ++i) {
            let hero = allHeroes[i];
            if (hero.HeroUnit.Equips) {
                for (let j in hero.HeroUnit.Equips) {
                    let dressEquip = hero.HeroUnit.Equips[j];
                    let bagEquip = bagData.getItemBySeq(dressEquip.Seq, dressEquip.ID);
                    if (bagEquip) {
                        notDressEquips = notDressEquips.filter((equip) => {
                            return bagEquip.ID != equip.ID || utils.longToNumber(bagEquip.Seq) != utils.longToNumber(equip.Seq);
                        });
                    }
                }
            }
        }
        return notDressEquips;
    }

    /**
     * @desc 装备是否可以铸魂
     * @param equip 
     * @returns 
     */
    checkEquipCastSoul(equip: Equip){
        let moduleCfg = configUtils.getModuleConfigs();
        let limits = utils.parseStingList(moduleCfg.EquipCastSoulNum);
        let limit = limits.find((limit) => { return limit[0] && limit[0] == equip.equipCfg.Quality.toString() });
        let cfgs = configManager.getConfigList("equipCastSoul");
        let find = cfgs.findIndex(
            (_cfg) => {
                return _cfg.EquipCastSoulEquipType == equip.equipCfg.TextureType
                    && _cfg.EquipCastSoulEquipPart == equip.equipCfg.PositionType
            });
        return (limit && Number(limit[1])) && find != -1;
    }
    /**
     * 根据ID构建基础装备
     */
    buildDefaultEquip(id: number): data.IBagUnit {
        let cfg: any = configUtils.getEquipConfig(id);
        //因为灵兽也是在装备里面，再次判定一次
        if (!cfg) cfg = configUtils.getBeastConfig(id);
        if (!cfg) return null;
        let equipData: data.IBagUnit = {
            ID: id,
            Count: 1,
            Seq: 0,
            EquipUnit: null
        }
        let equip = new Equip(equipData);
        equipData.EquipUnit = {
            Exp: 0,
            Star: equip.getEquipBeginStarByUnit()
        }
        return equipData;
    }

    buildDefaultItem(Id: number, count: number): data.IBagUnit{
        return {
            ID: Id,
            Count: count || 0,
            Seq: 0
        }
    }

    // 合并绿色装备的所有属性
    mergeGreenProp(greenCfgs: cfg.EquipGreen[]){
        let finalCfg: cfg.EquipGreen = {
            ID: 0,
            Level: greenCfgs[0] ? greenCfgs[0].Level : 0,
            Attack: 0,
            Defend: 0,
            Hp: 0,
            Critical: 0,
            CriticalHarm: 0,
            AttackPercent: 0,
            DefendPercent: 0,
            HpPercent: 0
        }
        greenCfgs.forEach(cfg=>{
            finalCfg.Attack += cfg.Attack || 0;
            finalCfg.Defend += cfg.Defend || 0;
            finalCfg.Hp += cfg.Hp || 0;
            finalCfg.Critical += cfg.Critical || 0;
            finalCfg.CriticalHarm += cfg.CriticalHarm || 0;
            finalCfg.AttackPercent += cfg.AttackPercent || 0;
            finalCfg.DefendPercent += cfg.DefendPercent || 0;
            finalCfg.HpPercent += cfg.HpPercent || 0;
        })
        return finalCfg;
    }

    //装备材料在作为材料时提供的经验值
    getEquipExpProvide(equip: data.IBagUnit) {
        let exp: number = 0;
        let cfg = configUtils.getEquipConfig(equip.ID);
        if (!cfg) return null;
        let cfg1 = configManager.getConfigByKey("itemExp", cfg.Quality);
        //基础提供经验值
        cfg1.ItemExpBasicNum && (exp += cfg1.ItemExpBasicNum);
        //当前经验折损
        cfg1.ItemExpAccumulateExp && (exp += (cfg1.ItemExpAccumulateExp / FULL_PERCENT) * (equip.EquipUnit.Exp || 0));
        return exp;
    }

    //灵兽在作为材料时提供的经验值
    getBeastExpProvide(beast:data.IBagUnit) {
        let exp: number = 0;
        let cfg = configUtils.getBeastConfig(beast.ID);
        if (!cfg) return null;
        let cfg1 = configManager.getConfigByKey("itemExp", cfg.BeastQuality);
        //基础提供经验值
        cfg1.ItemExpBasicNum && (exp += cfg1.ItemExpBasicNum);
        //当前经验折损
        cfg1.ItemExpAccumulateExp && (exp += (cfg1.ItemExpAccumulateExp / FULL_PERCENT) * (beast.EquipUnit.Exp || 0));
        return exp;
    }

    // 装备强化所需金币
    getEnhanceGoldMulti() {
        return parseFloat(configUtils.getConfigModule("EquipIntensifyCostMoney")) || -1;
    }

    // 装备突破所需金币
    getBreakGold(equip: Equip): number {
        let prefixId = 0, starID = 0;
        if (equip.equipCfg) {
            prefixId = equip.equipCfg.PositionType == EQUIP_PART_TYPE.EXCLUSIVE ? 3 : 2;
            starID = prefixId * 10000 + equip.equipCfg.Quality * 1000;
        } else if (equip.beastCfg) {
            prefixId = 4; //灵兽的类型固定为4
            starID = prefixId * 10000 + equip.beastCfg.BeastQuality * 1000 + equip.beastCfg.BeastType * 100 ;
        }
        //获得突破所用得金币获得
        let allGold = 0;
        for (let star = 0; star < equip.equip.Star; star++) {
            let TempStarID = starID + star;
            let starCfg = configUtils.getLevelStarConfig(TempStarID);    
            allGold += starCfg.LevelStarNeedMoney;
        }
        if (!allGold) {
            allGold = configUtils.getLevelStarConfig(starID).LevelStarNeedMoney || 0;
        }
        return allGold ;
    }

    
    /**检测装备/灵兽升星需要多少个本体 */
    checkoutBreakCount(equip: Equip):number {
        let count = 0;
        let prefixId = 0, starID = 0;
        if (equip.equipCfg) {
            prefixId = equip.equipCfg.PositionType == EQUIP_PART_TYPE.EXCLUSIVE ? 3 : 2;
            starID = prefixId * 10000 + equip.equipCfg.Quality * 1000;
        } else if (equip.beastCfg) {
            prefixId = 4; //灵兽的类型固定为4
            starID = prefixId * 10000 + equip.beastCfg.BeastQuality * 1000 + equip.beastCfg.BeastType * 100 ;
        }

        for (let star = 0; star < equip.equip.Star; star++) {
            let tempStarID = starID + star;
            let starCfg = configUtils.getLevelStarConfig(tempStarID);    
            count += (starCfg.LevelStarNeedSelf || 0);
        }

        return count;
    }

    // 是否可以碎片合成英雄
    checkHeroMerge (heroID: number) {
        let cfg = configUtils.getHeroBasicConfig(heroID);
        if (!cfg) return false;

        if (this.checkOwnHero(heroID)) {
            return false
        }

        let cfgs: cfg.HeroBasic = configUtils.getHeroBasicConfig(heroID);
        let needList = utils.parseStingList(configUtils.getModuleConfigs().HeroOpenNeedPiece);
        let needCount: number = 0;
        for(let i = 0; i < needList.length; ++i) {
            if(needList[i][0] == cfgs.HeroBasicQuality) {
                needCount = Number(needList[i][1]);
                break;
            }
        }

        let ownCnt = bagData.getItemCountByID(cfgs.HeroBasicItem)
        return ownCnt >= needCount;
    }

    // 检查是否拥有这个英雄
    checkOwnHero (heroID: number) {
        let heroItem = bagData.getHeroById(heroID);
        if(heroItem && heroItem.isHeroBasic) {
            return true;
        }
        return false;
    }

    // 检查拥有该英雄的碎片数量
    getHeroChipCnt (heroID: number) {
        let heroCfg = configUtils.getHeroBasicConfig(heroID)
        if(heroCfg && heroCfg.HeroBasicItem) {
            return bagData.getItemCountByID(heroCfg.HeroBasicItem)
        }
        return 0;
    }

    /**
    * 获得当前英雄星级升星所需要的碎片
    * @param heroInfo 
    * @returns 
    */
    getHeroNeedChipCount(heroID: number) {
        let heroUnit = new HeroUnit(heroID)
        let cfgs: cfg.HeroBasic = configUtils.getHeroBasicConfig(heroUnit.basicId);
        let needCount: number = 0;
        if(heroUnit.isHeroBasic) {
            let cfg = configManager.getOneConfigByManyKV('levelStar', 'LevelStarType', 1, 'LevelStarQuality', cfgs.HeroBasicQuality, 'LevelStarNum', heroUnit.star);
            needCount = cfg.LevelStarNeedSelf;
        } else {
            let needList = utils.parseStingList(configUtils.getModuleConfigs().HeroGetPiece);
            for (let i = 0; i < needList.length; ++i) {
                if (needList[i][0] == cfgs.HeroBasicQuality) {
                    needCount = Number(needList[i][1]);
                }
            }
        }
        return needCount;
    }

    /**
     * 英雄是否能升星
     * @param hero 
     * @returns 
     */
    checkHeroCanAddStar(heroId: number) {
        let heroUnit: HeroUnit = new HeroUnit(heroId);
        if(heroUnit.isHeroBasic) {
            let needCount = this.getHeroNeedChipCount(heroId);
            let bagItems = bagData.getItemByID(heroUnit.chipId);
            let curCount: number = 0;
            if(bagItems) {
                curCount = utils.longToNumber(bagItems.Array[0].Count);
            }
            return curCount >= needCount;
        }
        return false;
    }

    checkCommonEquip(partType: EQUIP_PART_TYPE) {
        return EQUIP_PART_TYPE.NECKLACE == partType || EQUIP_PART_TYPE.RING == partType || EQUIP_PART_TYPE.EXCLUSIVE == partType;
    }

    //获取有效的头像或者头像框集合
    getValidHeadsByType(hType: HEAD_TYPE): cfg.HeadFrame[]{
        let handler = (arr: cfg.HeadFrame[], headItem: cfg.HeadFrame, openType: HEAD_OPEN_TYPE, condi: number) => {
            if(!arr) return;
            if(openType == HEAD_OPEN_TYPE.ExpLevel){
                userData.lv >= condi &&  bagData.getItemByID(headItem.HeadFrameId) && arr.push(headItem);
                return;
            }

            if(openType == HEAD_OPEN_TYPE.SvrTime){
                serverTime.currServerTime() >= condi && arr.push(headItem);
                return;
            }

            if(openType == HEAD_OPEN_TYPE.OwnHero){
                let heroUnit = bagData.getHeroById(condi);
                heroUnit && heroUnit.isHeroBasic && bagData.getItemByID(headItem.HeadFrameId) && arr.push(headItem);
            }
        }

        let headArr: cfg.HeadFrame[] = [];
        let headType = hType == HEAD_TYPE.HEAD ? BAG_ITEM_TYPE.HEAD : BAG_ITEM_TYPE.HEAD_FRAME;
        let heads = bagData.getItemsByType(headType) || [];
        heads.forEach(ele => {
           let headCfg =  configUtils.getHeadConfig(ele.ID);
           if(!headCfg) return;
           let openCondi = utils.parseStingList(headCfg.HeadFrameOpenCondition);
           let openType = parseInt(openCondi[0]), condi = parseInt(openCondi[1]);
           handler(headArr, headCfg, openType, condi);
        });

        return headArr;
    }

    //背包中是否存在某一部位的装备
    isHasDressedEquip(equipPosType: EQUIP_PART_TYPE, heroID: number){
        let equips = bagData.equipList;
        if(!equips || equips.length == 0) return false;
        let heroCfg: cfg.HeroBasic = configUtils.getHeroBasicConfig(heroID);
        return equips.some((ele, idx) => {
            let equipConfig: cfg.Equip = configUtils.getEquipConfig(ele.ID);
            //部位相匹配的装备
            if(!bagDataUtils.checkCommonEquip(equipConfig.PositionType)){
                return equipConfig.PositionType == equipPosType
                            && equipConfig.TextureType == heroCfg.HeroBasicEquipType
                            && !bagDataUtils.checkEquipIsDressed(ele);
            }
            //专属装备
            if(EQUIP_PART_TYPE.EXCLUSIVE == equipPosType && EQUIP_PART_TYPE.EXCLUSIVE == equipConfig.PositionType){
                return equipConfig.EquipId == ele.ID && ele.ID == heroCfg.HeroBasicExclusive && !bagDataUtils.checkEquipIsDressed(ele);
            }

            //通用装备
            return equipConfig.PositionType == equipPosType && !bagDataUtils.checkEquipIsDressed(ele);
        });
    }

    //按条件筛选装备强化材料
    getItemExpByQualityAndType(equipData: data.IBagUnit, quality?: QUALITY_TYPE, type?: EQUIP_TEXTURE_TYPE) {
        if(!equipData) return null;
        let equips = this.getNotDressEquips();
        let filterEquips: data.IBagUnit[] = [];
        let materialList: data.IBagUnit[] = [];
        for (let i = 0; i < equips.length; ++i) {
            let config = configUtils.getEquipConfig(equips[i].ID);
            if (quality && type && config.Quality == quality && config.TextureType == type) {
                filterEquips.push(equips[i]);
            } else if (quality && !type && config.Quality == quality) {
                filterEquips.push(equips[i]);
            } else if (type && !quality && config.TextureType == type) {
                filterEquips.push(equips[i]);
            } else if (!type && !quality) {
                filterEquips.push(equips[i]);
            }
        }
        filterEquips.sort((a, b) => {
            let expA = this.getEquipExpProvide(a);
            let expB = this.getEquipExpProvide(b);
            return expA - expB;
        });
        filterEquips.sort((a, b) => {
            let configA = configUtils.getEquipConfig(a.ID);
            let configB = configUtils.getEquipConfig(b.ID);
            return configA.Quality - configB.Quality;
        });
        filterEquips = filterEquips.filter(equip => {
            return equip.ID != equipData.ID ||
                utils.longToNumber(equip.Seq) != utils.longToNumber(equipData.Seq);
        })
        materialList = bagData.getItemsByType(BAG_ITEM_TYPE.MATERIAL).filter(item => {
            return item.ID === CustomItemId.XUANTIE;
        });
        materialList.sort((a, b) => {
            let configA = configUtils.getItemConfig(a.ID);
            let configB = configUtils.getItemConfig(b.ID);
            return configA.ItemQuality - configB.ItemQuality;
        });
        let result = materialList.concat(filterEquips);
        if (equipData) {
            result = result.filter((_bagunit) => {
                return (_bagunit.ID != equipData.ID || Number(_bagunit.Seq) != Number(equipData.Seq)) && Number(_bagunit.Count) != 0;
            })
        }
        return result;
    }

    //是否装备
    isEquip(data: data.IBagUnit){
        if(!data) return false;
        let eCfg = configUtils.getEquipConfig(data.ID);
        return !!eCfg;
    }

    //是否材料
    isMaterial(data: data.IBagUnit){
        if(!data) return false;
        let cfg = configUtils.getItemConfig(data.ID);
        return cfg && cfg.ItemSort == BAG_ITEM_TYPE.MATERIAL;
    }

    //是否宝物
    isTreasure(data: data.IBagUnit){
        if(!data) return false;
        let cfg = configUtils.getItemConfig(data.ID);
        return cfg && cfg.ItemType == BAG_ITEM_TYPE.TREASURE;
    }

    getItemTransform (prize: data.IItemInfo[], currHero: number[]) {
        let transInfo: TransPiece[] = [];
        let heroes = [...currHero]
        for (let i = 0; i < prize.length; i++) {
            let _p = prize[i].ID;
            let cfg = configUtils.getHeroBasicConfig(_p);
            if (cfg) {
                if (heroes.indexOf(_p) != -1) {
                    let tranform = this._getHeroTransform(prize[i], cfg, i);
                    tranform && transInfo.push(tranform);
                } else {
                    heroes.push(_p);
                }
            }
        }
        return transInfo;
    }

    private _getHeroTransform (prize: data.IItemInfo, cfg: cfg.HeroBasic, idx: number):TransPiece {
        let _qua = cfg.HeroBasicQuality;
        let _item = cfg.HeroBasicItem;
        let _piece = configUtils.getModuleConfigs().HeroGetPiece;
        let transInfo: TransPiece = null
        if (_qua && _item && _piece) {
            let _pieceCfg = _piece.split("|");
            _pieceCfg.forEach( _s => {
                let _str = _s.split(";");
                let _q = parseInt(_str[0]);
                let _c = parseInt(_str[1]) || 0;
                if (_q == _qua) {
                    transInfo = {
                        originCnt: prize.Count,
                        originId: prize.ID,
                        idx: idx,
                        id: _item,
                        count: _c * prize.Count
                    }
                }
            })
        }
        return transInfo;
    }

    isTestMoneyEnough(needCount: number){
        let count = bagData.getItemCountByID(CustomItemId.ZI_YV);
        if(count < needCount){
            guiManager.showMessageBoxByCfg(guiManager.sceneNode, configUtils.getDialogCfgByDialogId(2000019));
            return false;
        }
        return true;
    }

    //获取宝物等级
    getTreasureLV(treasureID: number) {
        let treasureCfg: cfg.LeadTreasure = configUtils.getLeadTreasureConfig(treasureID);
        let iBagItem = bagData.getItemByID(treasureID);
        let lv: number = 1;
        if(!iBagItem) return lv;

        let treasureCount = parseInt(iBagItem.Array[0].Count);
        let upgradeNeeds = treasureCfg.LevelUpNeed.split('|');
        let needCount: number = 1;
        for(let i = 0; i < upgradeNeeds.length; ++i) {
            needCount += parseInt(upgradeNeeds[i]);
            if(treasureCount >= needCount) {
                lv += 1;
            }
        }
        return lv;
    }

    //检查某件装备被某个英雄穿戴
    checkEquipDressedByHero(equipId: number, heroUnit: HeroUnit) {
      if (heroUnit && heroUnit.isHeroBasic) {
          const equips = heroUnit.hero.Equips;
          for (const k in equips) {
              let equip = equips[k];
              if (equip.ID == equipId) {
                  return true;
              }
          }
      }
      return false;
    }

    //通过经验值计算等级
    getUserLVByExp(exp: number) {
      let lv = 1;
      if(!exp) return lv;
      let expConfigs = configUtils.getLevelExpConfigsByType(3);
      let expCount: number = 0;
        for (const k in expConfigs) {
            lv = Number(k);
            expCount += expConfigs[k].LevelExpNeedNum;
            if (exp < expCount) {
                break;
            }
        }
      return lv;
    }

    getBeastLVByExp(exp:number, quality: number) {
        let cfgs = configCache.getBeastExpCfgs(quality);
        if(!exp) {
            return cfgs[0].lv;
        }
        let low = 0, high = cfgs.length - 1;
        while(low <= high) {
            let mid = low + ((high - low) >> 1);
            if(exp >= cfgs[mid].minExp && exp < cfgs[mid].maxExp) {
                return cfgs[mid].lv;
            }
            if(exp < cfgs[mid].minExp) {
                high = mid - 1;
            } else {
                low = mid + 1;
            }
        }
        return cfgs[cfgs.length - 1].lv;
    }

    getBeastLVCfg(lv:number, quality: number) {
        let cfgs = configCache.getBeastExpCfgs(quality);
        if(lv >= cfgs[cfgs.length - 1].minExp){
            return cfgs[cfgs.length - 1];
        }
        return cfgs[lv - 1];
    }

    getEquipLVByExp(exp:number, quality: number) {
        let cfgs = configCache.getEquipExpCfgs(quality);
        if(!exp) {
            return cfgs[0].lv;
        }
        let low = 0, high = cfgs.length - 1;
        while(low <= high) {
            let mid = low + ((high - low) >> 1);
            if(exp >= cfgs[mid].minExp && exp < cfgs[mid].maxExp) {
                return cfgs[mid].lv;
            }
            if(exp < cfgs[mid].minExp) {
                high = mid - 1;
            } else {
                low = mid + 1;
            }
        }
        return cfgs[cfgs.length - 1].lv;
    }

    getEquipLVCfg(lv:number, quality: number) {
        let cfgs = configCache.getEquipExpCfgs(quality);
        if(lv >= cfgs[cfgs.length - 1].minExp){
            return cfgs[cfgs.length - 1];
        }
        return cfgs[lv - 1];
    }

    /**
     * @description 获取英雄身上穿戴的装备
     * @param heroID 英雄ID
     * @returns 装备对象 key 为穿戴位置，value为 装备
     */
    getDressedEquipsOfHero(heroID: number): {[k: string]: data.IBagUnit} {
        let heroUnit: HeroUnit = bagData.getHeroById(heroID);
        let equips = heroUnit && heroUnit.isHeroBasic ? heroUnit.getHeroEquips() : {};
        return equips;
    }

    //获取可以对灵兽升星的灵兽集合(不包括不是0星的灵兽和已经被穿戴的灵兽)
    getBeastsUsedRiseStar(beastID: number, beastSeq: number) {
        let items = bagData.bagItems;
        let beastArr: data.IBagUnit[] = [];
        if(items.hasOwnProperty(beastID+'')){
            let item = items[beastID + ''];
            item.Array.forEach(ele => {
                if (ele && utils.longToNumber(ele.Count) > 0) {
                    let beastCfg: cfg.Beast = configUtils.getBeastConfig(ele.ID);
                    if(!beastCfg || beastCfg.BeastPositionType != EQUIP_PART_TYPE.BEAST) return;
                    if(ele.EquipUnit && ele.EquipUnit.Star > 0) return;
                    if(bagDataUtils.checkEquipIsDressed(ele) != 0) return;
                    if(ele.ID == beastID && utils.longToNumber(ele.Seq) == beastSeq) return;
                    beastArr.push(ele);
                }
            })
        }
        return beastArr;
    }

    /**
    * 获取未装备灵兽
    * @returns 
    */
     getNotDressBeast(): data.IBagUnit[] {
         let notDressBeasts: data.IBagUnit[] = bagData.getItemsByType(BAG_ITEM_TYPE.BEAST);
         let beastArr:data.IBagUnit[] = [];
         notDressBeasts.forEach(ele => {
            if (ele && utils.longToNumber(ele.Count) > 0) {
                let beastCfg: cfg.Beast = configUtils.getBeastConfig(ele.ID);
                if(!beastCfg || beastCfg.BeastPositionType != EQUIP_PART_TYPE.BEAST) return;
                if(bagDataUtils.checkEquipIsDressed(ele) != 0) return;
                beastArr.push(ele);
            }
         })
        return beastArr;
    }

    /**
     * 获得可穿戴的装备，传入英雄ID则结果会包含英雄身上的装备
     * @param heroID 英雄ID 
     * @returns 
     */
    getIdleEquips(heroID?: number): data.IBagUnit[] {
        let idleEquips: data.IBagUnit[] = [];

        let equips = bagData.equipList;
        // 将ID_SEQ - 下标做一个映射
        let equipsMap: {[key: string]: number} = {};
        for (let i = 0; i < equips.length; ++i) {
            equipsMap[equips[i].ID + "_" + equips[i].Seq] = i;
        }

        // 遍历获得已被穿戴的装备，如传入heroID则过滤掉自身穿戴的
        let heroList: data.IBagUnit[] = bagData.heroList;
        for (let i = 0; i < heroList.length; ++i) {
            if (heroID && heroList[i].ID === heroID) {
                continue;
            }

            let heroEquips: { [k: string]: data.IBagUnit } = heroList[i].HeroUnit.Equips;
            if (heroEquips) {
                for (const k in heroEquips) {
                    equipsMap[heroEquips[k].ID + "_" + heroEquips[k].Seq] = -1;
                }
            }
        }

        // 遍历所有装备，过滤掉已被穿戴的
        let idx = -1;
        for (let i = 0; i < equips.length; ++i) {
            idx = equipsMap[equips[i].ID + "_" + equips[i].Seq];
            if (idx >= 0) {
                idleEquips.push(equips[idx]);
            }
        }

        return idleEquips;
    }

    // checkEquipIsDressed(equip: data.IBagUnit): number {
    //     let heroList: data.IBagUnit[] = bagData.heroList;
    //     for (let i = 0; i < heroList.length; ++i) {
    //         let heroEquips: { [k: string]: data.IBagUnit } = heroList[i].HeroUnit.Equips;
    //         if (heroEquips) {
    //             for (const k in heroEquips) {
    //                 if (heroEquips[k].ID == equip.ID && utils.longToNumber(heroEquips[k].Seq) == utils.longToNumber(equip.Seq)) {
    //                     return heroList[i].ID;
    //                 }
    //             }
    //         }
    //     }
    //     return 0;
    // }
}

export let bagDataUtils = new BagDataUtils();
