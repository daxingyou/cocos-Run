import { EQUIP_MAX_STAR } from "../../app/AppConst";
import { ALLTYPE_TYPE, BAG_ITEM_TYPE, EQUIP_PART_TYPE, HERO_PROP_MAP, LEVEL_EXP_TYPE, QUALITY_TYPE } from "../../app/AppEnums";
import { utils } from "../../app/AppUtils";
import { bagDataUtils } from "../../app/BagDataUtils";
import { configUtils } from "../../app/ConfigUtils";
import { resPathUtils } from "../../app/ResPathUrlUtils";
import { configManager } from "../../common/ConfigManager";
import { logger } from "../../common/log/Logger";
import { cfg } from "../../config/config";
import { data } from "../../network/lib/protocol";
import { bagData, EquipProp } from "../models/BagData";
import { userData } from "../models/UserData";
import { commonData } from "../models/CommonData";
import { configCache } from "../../common/ConfigCache";

//套装数据结构,技能组中第一个元素为没有提升时的技能ID
interface EquipSultCfg{
    sultID:                    number,               //套装组ID
    equips?:                   number[],             //套装组
    twoPartSkills?:            (number|number[])[],             //两件套的技能组
    twoPartLevels?:            number[],             //两件套的技能提升星级组
    fourPartSkills?:           (number|number[])[],             //四件套的技能组
    fourPartLevels?:           number[],             //四件套的技能提升星级组
}

// =========================== Equip ==========================
export class Equip {
    private _equipData: data.IBagUnit = null;
    private _equip: data.IEquipUnit = null;
    private _equipCfg: cfg.Equip = null;
    private _beastCfg: cfg.Beast = null;
    private _isBeast: boolean = false;
    constructor(equip?: data.IBagUnit) {
        this.setData(equip);
    }

    setData(equip: data.IBagUnit) {
        if (!equip) return;
        this._equipData = equip;
        this._equip = equip.EquipUnit;
        this._equip && (this._equip.Exp = this._equip.Exp ? this._equip.Exp : 0);
        this._equip && (this._equip.Star = this._equip.Star || 0);
        this._equipCfg = configUtils.getEquipConfig(equip.ID);
        if(!this._equipCfg) {
            let beastCfg = configUtils.getBeastConfig(equip.ID);
            beastCfg && (this._isBeast = true, this._beastCfg = beastCfg);
        }
    }

    get equip() {
        return this._equip;
    }

    get equipCfg() {
        return this._equipCfg;
    }

    get equipData() {
        return this._equipData;
    }

    get isBeast() {
        return this._beastCfg && this._isBeast;
    }

    get beastCfg() {
        return this._beastCfg;
    }

    //是否专属装备
    isExclusive(){
        return this._equipCfg.PositionType == EQUIP_PART_TYPE.EXCLUSIVE;
    }

    /**
     * 获得武器当前经验 是当前等级的
     * @param equip
     * @returns
     */
    getEquipCurExp(): number {
        let curLv = bagDataUtils.getEquipLVByExp(this._equip.Exp, this._equipCfg.Quality);
        let maxLevel: number = this.isBeast ? commonData.beastMaxLvCfg.get(this._equip.Star) : bagDataUtils.curEquipMaxLevel;
        curLv = Math.min(maxLevel, curLv, bagDataUtils.equipMaxLevel);
        if(curLv == bagDataUtils.equipMaxLevel) {
            return -1;
        }

        let lvCfg = bagDataUtils.getEquipLVCfg(curLv, this._equipCfg.Quality);
        return this._equip.Exp - lvCfg.minExp;
    }

    /**
     * 获得装备经验config
     * @param equipConfig 
     * @returns 
     */
    private _getEquipExpCfgByEquip(): cfg.LevelExp[] {
        //灵兽的经验配置
        if(this.isBeast) {
            return this._getBeastExpCfg();
        }

        let expConfig: cfg.LevelExp[] = configManager.getConfigs('levelExp');
        let equipExpList: cfg.LevelExp[] = [];
        for (const k in expConfig) {
            if (expConfig[k].LevelExpType == LEVEL_EXP_TYPE.EQUIP && expConfig[k].LevelExpQuality == this._equipCfg.Quality) {
                equipExpList.push(expConfig[k]);
            }
        }
        return equipExpList;
    }

    private _getBeastExpCfg() {
        let expConfig: cfg.LevelExp[] = configManager.getConfigs('levelExp');
        let equipExpList: cfg.LevelExp[] = [];
        for (const k in expConfig) {
            if (expConfig[k].LevelExpType == LEVEL_EXP_TYPE.BEAST && expConfig[k].LevelExpQuality == this._beastCfg.BeastQuality) {
                equipExpList.push(expConfig[k]);
            }
        }
        return equipExpList;
    }

    /**
     * 获得装备当前等级的最大经验
     * @param equip 
     * @returns [升级经验，最大经验]
     */
    getEquipCurMaxExp() {
        let maxLevel: number = this.isBeast ? commonData.beastMaxLvCfg.get(this._equip.Star) : bagDataUtils.curEquipMaxLevel;
        let level: number = 0;
        //灵兽
        if(this.isBeast) {
            let curLv = bagDataUtils.getBeastLVByExp(this._equip.Exp, this._beastCfg.BeastQuality);
            level = Math.min(maxLevel, curLv);
            let lvCfg = bagDataUtils.getBeastLVCfg(level, this._beastCfg.BeastQuality);
            return lvCfg.maxExp - lvCfg.minExp;
        }

        //装备
        let curLv = bagDataUtils.getEquipLVByExp(this._equip.Exp, this._equipCfg.Quality);
        level = Math.min(maxLevel, curLv);
        let lvCfg = bagDataUtils.getEquipLVCfg(level, this._equipCfg.Quality);
        return lvCfg.maxExp - lvCfg.minExp;
    }

    /**
    * 获得装备当前星级的最大经验
    * @param equip 
    * @returns 最大经验
    */
    getEquipMaxExp() {
        let expCount: number = 0;
        let maxLevel: number = this.isBeast ? commonData.beastMaxLvCfg.get(this._equip.Star) : bagDataUtils.curEquipMaxLevel;

        if(this.isBeast) {
            //灵兽
            expCount = bagDataUtils.getBeastLVCfg(maxLevel, this._beastCfg.BeastQuality).maxExp;
        } else {
            //常规装备
            expCount = bagDataUtils.getEquipLVCfg(maxLevel, this._equipCfg.Quality).maxExp;
        }
        return expCount;
    }

    /**
     * 获得装备等级
     * @param equip 
     * @returns 
     */
    getEquipLevel() {
	      let maxLevel: number = this.isBeast ? commonData.beastMaxLvCfg.get(this._equip.Star) : bagDataUtils.curEquipMaxLevel;
        let level: number = 1;
        // 灵兽
        if(this.isBeast) {
            level = bagDataUtils.getBeastLVByExp(this._equip.Exp, this._beastCfg.BeastQuality);
        } else {
            level = bagDataUtils.getEquipLVByExp(this._equip.Exp, this._equipCfg.Quality);
        }
        return Math.min(maxLevel, level);
    }

    /**
    * 装备是否满足突破
    * @param equip 
    * @returns 
    */
    checkEquipCanBroken() {
	//灵兽
        if(this.isBeast) {
            return !this.equipData.EquipUnit.Star || this.equipData.EquipUnit.Star < EQUIP_MAX_STAR;
        }
        return this.equipData.EquipUnit.Star < EQUIP_MAX_STAR;
    }
    /**
    * 判断装备是否能铸魂
    * @param equip 
    * @returns 
    */
    checkEquipCanCostSoul() {
        if(this.isBeast) return false;

        return this._equipCfg.Quality >= QUALITY_TYPE.R;
    }

    /**
     * 获得装备初始星级
     * @param equip 
     * @returns 
     */
    getEquipBeginStarByUnit() {
        if(this.isBeast) return 0;
        return bagDataUtils.getEquipBeginStar(this._equipCfg);
    }

    getBeastDetailInfo(eProp?: EquipProp) {
        eProp = eProp || {white: {}, green: [], yellow: null, beast: {}, beastSpe: null};
        let star = this._equip.Star, grade = this.getEquipLevel();
        let beastCfg = this._beastCfg;

        let handleBaseProp = (baseProp: string, addPropOffset: string) => {
            if(baseProp && baseProp.length > 0) {
                let propStrs = utils.parseStringTo1Arr(baseProp, ';');
                let propID = parseInt(propStrs[0]), baseV = parseFloat(propStrs[1]);

                let addArr: string[] = null;
                if(addPropOffset && addPropOffset.length > 0) {
                    addArr = utils.parseStringTo1Arr(addPropOffset);
                }
                eProp.beast = eProp.beast || {};
                let addOffset = (addArr && star < addArr.length) ? parseFloat(addArr[star]) : 0;
                eProp.beast[propID] = (eProp.beast[propID] || 0) + baseV + (grade - 1) * addOffset;
            }
        }

        handleBaseProp(beastCfg.BeastPropertyValue1, beastCfg.BeastValueLevelAdd1);
        handleBaseProp(beastCfg.BeastPropertyValue2, beastCfg.BeastValueLevelAdd2);
        handleBaseProp(beastCfg.BeastPropertyValue3, beastCfg.BeastValueLevelAdd3);
        handleBaseProp(beastCfg.BeastPropertyValue4, beastCfg.BeastValueLevelAdd4);

        if(star == 0 && this._beastCfg.BeastSpecialPropertyValue && this._beastCfg.BeastSpecialPropertyValue.length > 0) {
            let spePropsArr:cfg.EquipYellow[] = utils.parseStringTo1Arr(this._beastCfg.BeastSpecialPropertyValue, ';').map(ele => {
                let propID =  parseInt(ele);
                return configUtils.getEquipYellowConfig(propID);
            })
            eProp.beastSpe = spePropsArr;
        }

        if(star > 0 && this._beastCfg.BeastSpecialValueStarAdd && this._beastCfg.BeastSpecialValueStarAdd.length > 0) {
            let propAddArr: number[] = null;
            utils.parseStingList(this._beastCfg.BeastSpecialValueStarAdd, (strArr: string[] | string, idx: number) => {
                if(star != (idx + 1)) return;
                if(!strArr || strArr.length == 0) return;
                !Array.isArray(strArr) && (strArr = [strArr]);
                propAddArr = strArr.map(ele => {
                  return parseInt(ele);
                })
            });

            propAddArr && propAddArr.length > 0 && (eProp.beastSpe = propAddArr.map(ele => { return configUtils.getEquipYellowConfig(ele);}));
        }
        return eProp;
    }

    /**
     * @desc 计算装备最低等级特殊属性
     * @param basicLv 特殊属性最低等级
     * @returns
     */
    getEquipDetailInfo(basicLv?: number) {
        let eProp: EquipProp = { white: {}, green: [], yellow: null,  castSoul: {}};
        //灵兽
        if(this.isBeast) {
            return this.getBeastDetailInfo(eProp);
        }

        let star = this._equip.Star, grade = this.getEquipLevel();
        if (star < 0 || star > EQUIP_MAX_STAR || grade < 1 || grade > bagDataUtils.curEquipMaxLevel ) {
            logger.log(`当前装备属性异常：等级${grade}，星级${star}`);
            return eProp;
        }
        if (!this._equipCfg) return null;
        let hpStep = this._equipCfg.WhiteHpAdd.split("|");
        let attakStep = this._equipCfg.WhitAttackAdd.split("|");
        let defenceStep = this._equipCfg.WhiteDefendAdd.split("|");
        eProp.white.Hp = this._equipCfg.WhiteHp || 0;
        eProp.white.Attack = this._equipCfg.WhitAttack || 0;
        eProp.white.Defend = this._equipCfg.WhiteDefend || 0;
        eProp.white.Hp += (parseFloat(hpStep[star]) * (grade - 1));
        eProp.white.Attack += (parseFloat(attakStep[star]) * (grade - 1));
        eProp.white.Defend += (parseFloat(defenceStep[star]) * (grade - 1));

        // 特殊属性处理，green属性与等级有关, yellow属性与星级有关
        if (this._equipCfg.GreenId) {
            let parseRes = utils.parseStingList(this._equipCfg.GreenId);
            let tarIndex = this.getIndexOfGreenID();
            
            let greenIds = [].concat(parseRes[tarIndex].slice(1));
            eProp.green = greenIds.map(greenId=>{
               return greenId ? utils.deepCopy(configUtils.getEquipGreenConfig(Number(greenId))) : null
            }).filter(greenId =>{return !!greenId});
        }
        if (this._equipCfg.YellowId) {
            let yellowId = parseInt(this._equipCfg.YellowId.split("|")[star]);
            eProp.yellow = yellowId ? utils.deepCopy(configUtils.getEquipYellowConfig(yellowId)) : null;
        }

        //铸魂属性
        if(this._equip.CastSoulPoolMap) {
          for (let k in this._equip.CastSoulChooseMap) {
              let cfg = configUtils.getEquipCastSoulConfig(parseInt(k));
              eProp.castSoul[cfg.EquipCastSoulPropertyId] = this._equip.CastSoulChooseMap[k];
          }
        }
        return eProp;
    }

    //获取散件装备的附加技能
    getPartSKill(): (number| number[])[]{
        if(!this._equipCfg || this._equipCfg.PositionType == EQUIP_PART_TYPE.EXCLUSIVE
            || this._equipCfg.SuitId)
            return null;
        if(typeof this._equipCfg.GeneralAddSkill == 'undefined' || typeof this._equipCfg.ExclusiveChangeSkill == 'undefined') return null;
        let initSKill = this._equipCfg.GeneralAddSkill;
        let changeSKillList = utils.parseStringTo1Arr(this._equipCfg.ExclusiveChangeSkill);
        let skillList: (number|number[])[] = changeSKillList.map((ele)=> {
            if(ele.indexOf(';') == -1){
                return parseInt(ele);
            }
            return utils.parseStringTo1Arr(ele,';').map(changeID => {
                return parseInt(changeID);
            })
        });

        let startZeroIdx = skillList.lastIndexOf(0);
        startZeroIdx != -1 && (skillList[startZeroIdx] = initSKill);
        return skillList;
    }

    //获取专属装备的附加技能
    getExclusiveSKill(): number[]{
        if(!this._equipCfg || this._equipCfg.PositionType != EQUIP_PART_TYPE.EXCLUSIVE 
            || typeof this._equipCfg.ExclusiveChangeSkill == 'undefined')
            return null;

        let initSKill = this._equipCfg.ExclusiveAddSkill;
        let changeSKillList = utils.parseStringTo1Arr(this._equipCfg.ExclusiveChangeSkill);
        let skillList: number[] = changeSKillList.map((ele)=> {
            return parseInt(ele);
        });
        
        if(initSKill){
            let startZeroIdx = skillList.lastIndexOf(0);
            startZeroIdx != -1 && (skillList[startZeroIdx] = initSKill);
        }
        return skillList;
    }

    //获取套装技能配置
    getSultSkillCfg(): EquipSultCfg{
        if(!this._equipCfg || this._equipCfg.PositionType == EQUIP_PART_TYPE.EXCLUSIVE 
            || !this._equipCfg.SuitId)
            return null;
        let sultCfg = configUtils.getEquipSuitConfig(this._equipCfg.SuitId);
        if(!sultCfg) return null;

        let sultInfo: EquipSultCfg = {sultID:sultCfg.SuitId};

        let equips = utils.parseStringTo1Arr(sultCfg.NeedEquip);
        sultInfo.equips = equips.map((ele)=> {
            return parseInt(ele);
        });

        let star2Skill: number, star4Skill: number;
        utils.parseStingList(sultCfg.SuitSkill, (arr: string[]) => {
            let equipNum = parseInt(arr[0]);
            if(equipNum == 2){
                star2Skill = parseInt(arr[1]);
            }else if(equipNum == 4){
                star4Skill = parseInt(arr[1]);
            }
        });

        if(star2Skill && sultCfg.TwoUpPoint && sultCfg.TwoUpPoint.length > 0){
            let starPoints = utils.parseStringTo1Arr(sultCfg.TwoUpPoint);
            sultInfo.twoPartLevels = starPoints.map((ele) => {
                                            return parseInt(ele);
                                        });
        }

        if(star2Skill && sultCfg.TwoSuitChangeSkill && sultCfg.TwoSuitChangeSkill.length > 0){
            let changeList = utils.parseStringTo1Arr(sultCfg.TwoSuitChangeSkill);
            sultInfo.twoPartSkills = changeList.map((ele) => {
                                            if(ele.indexOf(';') == -1){
                                                return parseInt(ele);
                                            }
                                            return utils.parseStringTo1Arr(ele, ';').map(changeID => {
                                                return parseInt(changeID);
                                            })
                                        });
        }
        sultInfo.twoPartSkills = sultInfo.twoPartSkills || [];
        star2Skill && sultInfo.twoPartSkills.unshift(star2Skill);

        if(star4Skill && sultCfg.FourUpPoint && sultCfg.FourUpPoint.length > 0){
            let starPoints = utils.parseStringTo1Arr(sultCfg.FourUpPoint);
            sultInfo.fourPartLevels = starPoints.map((ele) => {
                                            return parseInt(ele);
                                        });
        }

        if(star4Skill && sultCfg.FourSuitChangeSkill && sultCfg.FourSuitChangeSkill.length > 0){
            let changeList = utils.parseStringTo1Arr(sultCfg.FourSuitChangeSkill);
            sultInfo.fourPartSkills = changeList.map((ele) => {
                                            if(ele.indexOf(';') == -1){
                                                return parseInt(ele);
                                            }
                                            return utils.parseStringTo1Arr(ele, ';').map(changeID => {
                                                return parseInt(changeID);
                                            })
                                        });
        }
        sultInfo.fourPartSkills = sultInfo.fourPartSkills || [];
        star4Skill && sultInfo.fourPartSkills.unshift(star4Skill);

        return sultInfo;
    }

    //获取装备突破所需特殊材料
    getBreakSpecialMaterial(): data.IBagUnit[] {
        let univerSal: string = configUtils.getConfigModule("EquipBreachUseReplaceItem");
        let itemList: data.IBagUnit[] = [];
        let materials = bagData.getItemsByType(BAG_ITEM_TYPE.MATERIAL);

        //背包数据中有万能道具则添加
        if(univerSal && univerSal.length) {
            utils.parseStingList(univerSal, (strArr: string[]) => {
                if(!strArr || !Array.isArray(strArr) || strArr.length == 0) return;
                let matQuality = parseInt(strArr[0]),  matID = parseInt(strArr[1]);
                if(matQuality != this.equipCfg.Quality) return;
                materials.forEach(ele => {
                    if(ele.ID == matID) {
                        itemList.push(ele);
                    }
                })
            });
        }

        let equips = bagData.getItemsByType(BAG_ITEM_TYPE.EQUIP);
        itemList.splice(itemList.length, 0, ...(equips.filter(equip => {
            if(equip.ID != this._equipData.ID ||  utils.longToNumber(equip.Seq) == utils.longToNumber(this._equipData.Seq)) return false;
            let equiped = bagDataUtils.checkEquipIsDressed(equip);
            if(equiped) return false;
            let initStar = bagDataUtils.getEquipBeginStar(configUtils.getEquipConfig(equip.ID));
            return (equip.EquipUnit.Star || initStar) <= initStar;
        })));
        return itemList;
    }

    //获取装备突破所需材料
    getBreakMaterial(): data.IBagUnit[] {
        let prefix = 0,starID = 0;
        if (this._equipCfg) {
            prefix = this._equipCfg.PositionType == EQUIP_PART_TYPE.EXCLUSIVE ? 3 : 2;
            starID = prefix * 10000 + this._equip.Star + this.equipCfg.Quality * 1000;
        }else if(this._beastCfg){
             prefix = 4; //灵兽的类型固定为4
             starID = prefix * 10000 + this._beastCfg.BeastQuality * 1000 + this._beastCfg.BeastType * 100 + this._equip.Star;
        }
        
        let starCfg = configUtils.getLevelStarConfig(starID);
        let itemList: data.IBagUnit[] = [];
        //本体材料，需拷贝
        let selfCopy: data.IBagUnit = utils.deepCopy(this._equipData);
        selfCopy.Count = starCfg.LevelStarNeedSelf || 0;
        itemList.push(selfCopy);

        if(!starCfg.LevelStarNeedItem || starCfg.LevelStarNeedItem.length == 0) return itemList;

        utils.parseStingList(starCfg.LevelStarNeedItem, (strArr: string[]) => {
            if(!strArr || !Array.isArray(strArr) || strArr.length == 0) return;
            let itemID = parseInt(strArr[0]), itemCnt = parseInt(strArr[1]);
            if(isNaN(itemCnt) || itemCnt <= 0) return;
            let bagItem = bagData.getItemByID(itemID);
            let bagUnit = bagItem ? utils.deepCopy(bagItem.Array[0]) : {};
            bagUnit.ID = itemID;
            bagUnit.Count = itemCnt;
            itemList.push(bagUnit);
        });
        return itemList;
    }
    /**
     * 装备基础属性的加成
     * @returns 
     */
    getBasicPropertyAdd() {
        let star: number = this._equip.Star;
        let lv: number = this.getEquipLevel();
        let atkAdd: number = parseFloat(utils.parseStingList(this._equipCfg.WhitAttackAdd)[star]) * (lv - 1);
        let defAdd: number = parseFloat(utils.parseStingList(this._equipCfg.WhiteDefendAdd)[star]) * (lv - 1);
        let hpAdd: number = parseFloat(utils.parseStingList(this._equipCfg.WhiteHpAdd)[star]) * (lv - 1);
        return { attack: atkAdd, defend: defAdd, hp: hpAdd };
    }

    //装备类型
    getEquipTextureIcon() {
        //灵兽
        if(this.isBeast) {
            return '';
        }

        let typeCfg = configUtils.getAllTypeConfig(ALLTYPE_TYPE.HERO_EQUIP_TYPE, this._equipCfg.TextureType);
        if (typeCfg && typeCfg.HeroTypeIcon) {
            return resPathUtils.getHeroAllTypeIconUrl(typeCfg.HeroTypeIcon);
        }
        return "";
    }
    //装备位置
    getEquipPositionIcon() {
        //灵兽
        if(this.isBeast) {
            return '';
        }

        let typeCfg = configUtils.getAllTypeConfig(ALLTYPE_TYPE.HERO_EQUIP_PART, this._equipCfg.PositionType);
        if (typeCfg && typeCfg.HeroTypeIcon) {
            return resPathUtils.getHeroAllTypeIconUrl(typeCfg.HeroTypeIcon);
        }
        return "";
    }

    /**
     * 获得当前等级在装备特殊属性中对应的下标
     * @returns 对应下标,如果没有特殊属性，则返回-1
     */
    getIndexOfGreenID() {
        // 装备特殊属性，根据GreenId配置(Array<level;prop1;prop2>)来读，>=level则获取属性，取最大的
        let tarIndex = -1;
        if (this._equipCfg.GreenId) {
            let equipLevel = this.getEquipLevel();
            let parseRes = utils.parseStingList(this._equipCfg.GreenId);
            let tempLV = 0;
            parseRes.forEach((val, index) => {
                if (equipLevel >= Number(val[0]) && tempLV < Number(val[0])) {
                    tempLV = Number(val[0]);
                    tarIndex = index;
                }
            });
        }

        return tarIndex;
    }

    /**
     * @description 装备从当前状态到目标等级需要消耗的经验
     * @param tarLevel 目标等级
     * @returns 需要消耗的经验
     */
     getCostExpOfEquipForLevelUp(tarLevel: number): number {
        tarLevel = Math.min(tarLevel, bagDataUtils.curEquipMaxLevel, bagDataUtils.equipMaxLevel, configCache.getEquipExpCfgs(this._equipCfg.Quality).length);
        let lvCfg = bagDataUtils.getEquipLVCfg(tarLevel, this._equipCfg.Quality);
        return lvCfg.minExp - (this._equip.Exp || 0);
    }
}