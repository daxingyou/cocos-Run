import { HeroEquipProp } from "../../app/AppType";
import { BAG_ITEM_TYPE, EQUIP_PART_TYPE, EQUIP_TEXTURE_TYPE, HERO_PROP, HERO_PROP_MAP, QUALITY_TYPE } from "../../app/AppEnums";
import { utils } from "../../app/AppUtils";
import { configUtils } from "../../app/ConfigUtils";
import { configManager } from "../../common/ConfigManager";
import { logger } from "../../common/log/Logger";
import { cfg } from "../../config/config";
import { data } from "../../network/lib/protocol";
import { bagData } from "../models/BagData";
import { userData } from "../models/UserData";
import { Equip } from "./Equip";
import { pveFakeData } from "../models/PveFakeData";
import { pvpData } from "../models/PvpData";
import { pragmaticData } from "../models/PragmaticData";
import { LEAD_SKILL_ATTRIBUTE_RANGE } from "../../app/BattleConst";
import { bagDataUtils } from "../../app/BagDataUtils";
import { configCache } from "../../common/ConfigCache";


// =========================== HERO ==========================
export default class HeroUnit {
    private _fakeId: number = 0;
    private _fakeCfg: cfg.PVEDaoistMagicHero = null;
    private _hero: data.IHeroUnit = null;
    private _heroCfg: cfg.HeroBasic = null;
    private _isBasic: boolean = true;               // 是否是英雄整卡
    private _lv: number = 0;
    
    // 修改是为了英雄碎片也想用这个数据 统一 不合适再改
    constructor(item: data.IBagUnit | number, fakeHeroId?: number, level?:number) {
        this._lv = level || 0;
        this._fakeId = fakeHeroId;
        this._fakeCfg = configManager.getConfigByKey("pveMagicHero", this._fakeId);
        if (typeof item == 'number' || typeof item == 'string') {
            // 碎片
            this._heroCfg = configUtils.getHeroBasicConfig(item);
            if (item == this._heroCfg.HeroBasicId) {
                let bagItem: HeroUnit = bagData.getHeroById(item);
                let fakeItem = pveFakeData.getFakeHeroById(this._fakeId);
                if ((bagItem && bagItem._hero) || !!this._fakeId) {
                    this._isBasic = true;
                    this._hero = this._fakeId ? fakeItem._hero : bagItem._hero;
                } else {
                    this._isBasic = false;
                }
            } else {
                this._isBasic = false;
            }
        } else {
            // 整卡
            this._heroCfg = configUtils.getHeroBasicConfig(item.ID);
            if (item.ID == this._heroCfg.HeroBasicId) {
                let bagItem: data.IBagItem = bagData.getItemByID(item.ID);
                if ((bagItem ) || !!this._fakeId) {
                    this._isBasic = true;
                    this._hero = this._fakeId ? item.HeroUnit : bagItem.Array[0].HeroUnit;
                } else {
                    this._isBasic = false;
                }
            } else {
                this._isBasic = false;
            }
        }
        if (!this._heroCfg) {
            logger.error(`HeroUnit constructor err item === ${item}`);
        }
    }

    get hero() {
        return this._hero;
    }

    get heroCfg() {
        return this._heroCfg;
    }

    get lv() {
        // todo 现在版本是英雄等级跟随用户等级
        
        return this._fakeId ? this._fakeCfg.HeroLevel : this._lv || userData.lv;
    }

    get star() {
        if (this._hero) {
            return this._hero.Star;
        } else {
            // todo 有可能改成获得初始星级  
            return bagDataUtils.getHeroInitStar(this.heroCfg.HeroBasicId);
        }
    }

    get gift() {
        if(this._hero) {
            return this._hero.Gifts;
        }
        return null;
    }

    get basicId() {
        return this._heroCfg.HeroBasicId;
    }

    get fakeId() {
        return this._fakeId;
    }

    get chipId() {
        return this._heroCfg.HeroBasicItem;
    }
    /**
     * 是否是英雄整卡
     */
    get isHeroBasic(): boolean {
        return this._isBasic && cc.isValid(this._hero);
    }
    /**
     * 获得英雄身上的装备
     * @param heroInfo 
     * @returns 
     */
    getHeroEquips(): {[k: string]: data.IBagUnit} {
        if (!this.hero) {
            return {};
        }
        for (let k in this._hero.Equips) {
            let ele = this._hero.Equips[k];
            let equip = bagData.getItemBySeq(ele.Seq, ele.ID);
            // pvp模式可以直接跳过背包数据校验
            let pvpMode = !!pvpData.pvpConfig;
            (pvpMode || equip) && (this.hero.Equips[k] = equip);
        }
        return this._hero.Equips;
    }

    getHeroEquipById(equipId: number){
        if (!this.hero) {
            return null;
        }
        for (let k in this._hero.Equips) {
            let ele = this._hero.Equips[k];
            if (ele.ID == equipId){
                return ele;
            }
        }
        return null;
    }
    /**
    * 获得英雄身上某个部位的装备
    * @param heroInfo 
    * @param partType 
    * @returns 
    */
    getHeroEquipByPart(partType: EQUIP_PART_TYPE) {
        if(!this.isHeroBasic) return null;
        let heroEquips = this._hero.Equips;
        if(!heroEquips || heroEquips.length == 0 ) return null;

        for (const k in heroEquips) {
            let equipConfig = configUtils.getEquipConfig(heroEquips[k].ID);
            if(equipConfig && equipConfig.PositionType == partType) {
                return heroEquips[k];
            }

            if(partType == EQUIP_PART_TYPE.BEAST) {
                let beastCfg = configUtils.getBeastConfig(heroEquips[k].ID);
                if(beastCfg) return heroEquips[k];
            }
        }
        return null;
    }

    /**
     * 获得英雄自身的成长属性
     * @returns 
     */
    getHeroBasicProperty() {
        let heroPropertyConfig: cfg.HeroProperty = configUtils.getHeroPropertyConfig(this._heroCfg.HeroBasicId);
        // let attack: number = Number(utils.parseStingList(heroPropertyConfig.Attack)[this.star - 1]) + Number(utils.parseStingList(heroPropertyConfig.AttackAdd)[this.star - 1]) * (this.lv - 1);
        // let defend: number = Number(utils.parseStingList(heroPropertyConfig.Defend)[this.star - 1]) + Number(utils.parseStingList(heroPropertyConfig.DefendAdd)[this.star - 1]) * (this.lv - 1);
        // let hp: number = Number(utils.parseStingList(heroPropertyConfig.Hp)[this.star - 1]) + Number(utils.parseStingList(heroPropertyConfig.HpAdd)[this.star - 1]) * (this.lv - 1);
        // let speed: number = Number(utils.parseStingList(heroPropertyConfig.Speed)[this.star - 1]) + Number(utils.parseStingList(heroPropertyConfig.SpeedAdd)[this.star - 1]) * (this.lv - 1);
        
        let total = { Attack: 0, Defend: 0, Hp: 0, Speed: 0, Critical: 0, CriticalHarm: 0};
        total.Attack = Number(utils.parseStingList(heroPropertyConfig.Attack)[this.star - 1]) + Number(utils.parseStingList(heroPropertyConfig.AttackAdd)[this.star - 1]) * (this.lv - 1)
        total.Defend = Number(utils.parseStingList(heroPropertyConfig.Defend)[this.star - 1]) + Number(utils.parseStingList(heroPropertyConfig.DefendAdd)[this.star - 1]) * (this.lv - 1)
        total.Hp = Number(utils.parseStingList(heroPropertyConfig.Hp)[this.star - 1]) + Number(utils.parseStingList(heroPropertyConfig.HpAdd)[this.star - 1]) * (this.lv - 1)
        total.Speed = Number(utils.parseStingList(heroPropertyConfig.Speed)[this.star - 1]) + Number(utils.parseStingList(heroPropertyConfig.SpeedAdd)[this.star - 1]) * (this.lv - 1)
        total.Critical = Number(utils.parseStingList(heroPropertyConfig.Critical)[this.star - 1]) + Number(utils.parseStingList(heroPropertyConfig.CriticalAdd)[this.star - 1]) * (this.lv - 1)
        total.CriticalHarm = Number(utils.parseStingList(heroPropertyConfig.CriticalHarm)[this.star - 1]) + Number(utils.parseStingList(heroPropertyConfig.CriticalHarmAdd)[this.star - 1]) * (this.lv - 1)
        
        return total;
        // return { attack: attack, defend: defend, hp: hp, speed: speed };
    }
    /**
     * 获得武器附加的属性
     * @returns 
     */
    getHeroEquipsAddProperty() {
        let total: HeroEquipProp = { attack: 0, defend: 0, hp: 0,
            green: { Attack: 0, Defend: 0, Hp: 0, Critical: 0, CriticalHarm: 0, AttackPercent: 0, DefendPercent: 0, HpPercent: 0} as cfg.EquipGreen,
            yellow: {Speed: 0, HarmImmunity: 0, Parry: 0, Miss: 0,Blood: 0, Harm: 0,Through: 0, CounterAttack: 0, Sputtering: 0, Continuity: 0} as cfg.EquipYellow,
            castSoul: {},
        }

        if (this._hero && utils.getObjLength(this._hero.Equips) > 0) {
            for (const k in this._hero.Equips) {
                let equip: Equip = bagData.getEquipById(this._hero.Equips[k].ID, utils.longToNumber(this._hero.Equips[k].Seq));
                let pvp = !!pvpData.pvpConfig;
                if (this._fakeId || pvp) equip = new Equip(this._hero.Equips[k]);
                let equipInfo = equip.getEquipDetailInfo();
                if (equipInfo.white) {
                    total.attack += equipInfo.white.Attack || 0;
                    total.defend += equipInfo.white.Defend || 0;
                    total.hp += equipInfo.white.Hp || 0;
                }

                if (equipInfo.green) {
                    equipInfo.green.forEach(green => {
                        total.green.Attack += green.Attack || 0;
                        total.green.Defend += green.Defend || 0;
                        total.green.Hp += green.Hp || 0;
                        total.green.Critical += green.Critical || 0;
                        total.green.CriticalHarm += green.CriticalHarm || 0;
                        total.green.AttackPercent += green.AttackPercent || 0;
                        total.green.DefendPercent += green.DefendPercent || 0;
                        total.green.HpPercent += green.HpPercent || 0;  
                    });
                   
                }

                if (equipInfo.yellow) {
                    total.yellow.Speed += equipInfo.yellow.Speed || 0;
                    total.yellow.HarmImmunity += equipInfo.yellow.HarmImmunity || 0;
                    total.yellow.Parry += equipInfo.yellow.Parry || 0;
                    total.yellow.Miss += equipInfo.yellow.Miss || 0;
                    total.yellow.Blood += equipInfo.yellow.Blood || 0;
                    total.yellow.Harm += equipInfo.yellow.Harm || 0;
                    total.yellow.Through += equipInfo.yellow.Through || 0;
                    total.yellow.CounterAttack += equipInfo.yellow.CounterAttack || 0;
                    total.yellow.Sputtering += equipInfo.yellow.Sputtering || 0;
                    total.yellow.Continuity += equipInfo.yellow.Continuity || 0;
                }

                if(equipInfo.castSoul){
                    for(let k in equipInfo.castSoul){
                        let propType = parseInt(k);
                        total.castSoul[propType] = total.castSoul[propType] || 0;
                        total.castSoul[propType] += equipInfo.castSoul[k] || 0;
                    }
                }

                if(equipInfo.beastSpe && equipInfo.beastSpe.length > 0) {
                    equipInfo.beastSpe.forEach(ele => {
                        total.yellow.Speed += ele.Speed || 0;
                        total.yellow.HarmImmunity += ele.HarmImmunity || 0;
                        total.yellow.Parry += ele.Parry || 0;
                        total.yellow.Miss += ele.Miss || 0;
                        total.yellow.Blood += ele.Blood || 0;
                        total.yellow.Harm += ele.Harm || 0;
                        total.yellow.Through += ele.Through || 0;
                        total.yellow.CounterAttack += ele.CounterAttack || 0;
                        total.yellow.Sputtering += ele.Sputtering || 0;
                        total.yellow.Continuity += ele.Continuity || 0;
                    })
                }

                if(equipInfo.beast) {
                    total.beast = total.beast || {};
                    for(let k in equipInfo.beast){
                        let propType = parseInt(k);
                        total.beast[propType] = total.beast[propType] || 0;
                        total.beast[propType] += equipInfo.beast[k] || 0;
                    }
                }
            }
        }
        return total;
    }

    /**
     * 获得英雄天赋加成属性
     * @returns [AttributeId];
     */
    getGiftAddProperty() {
        let giftAttributes: number[] = [];
        // 假英雄直接读表
        if (this._fakeId && this._fakeCfg.HeroGiftAttribute){
            let giftAttr = utils.parseStingList(this._fakeCfg.HeroGiftAttribute);
            giftAttr.forEach((ele)=>{
                let attr = parseInt(ele[0]);
                let value = parseInt(ele[1]);
                giftAttributes[attr] = value;
            })
            return giftAttributes;
        }
        // 真实英雄
        for(const k in this.gift) {
            let giftCfg: cfg.HeroGift = configUtils.getHeroGiftConfig(Number(k));
            if(giftCfg.HeroGiftAttribute) {
                let attributeList = utils.parseStingList(giftCfg.HeroGiftAttribute);
                for(let i = 0; i < attributeList.length; ++i) {
                    let type: number = attributeList[i][0];
                    let num: number = Number(attributeList[i][1]);
                    if (giftAttributes[type]) {
                        giftAttributes[type] += num;
                    } else {
                        giftAttributes[type] = num;
                    }
                }
            }
        }
        return giftAttributes;
    }

    getGiftAddSkill() {
        let giftAddSkill: number[] = [];
        // 假英雄直接读表
        if (this._fakeId && this._fakeCfg.HeroGiftSkill) {
            let giftAttr = utils.parseStingList(this._fakeCfg.HeroGiftSkill);
            giftAttr.forEach((ele) => {
                let skill = parseInt(ele[0]);
                giftAddSkill.push(skill);
            })
            return giftAddSkill;
        }
        for (const k in this.gift) {
            if(this.gift[k].SkillID) {
                giftAddSkill.push(this.gift[k].SkillID);
            } 
        }
        return giftAddSkill;
    }

    getFriendAddSkill() {
        let friendAddSkill: number[] = [];
        let friendID = this._heroCfg.HeroFriendID;
        if (friendID) {
            let friendCfg: cfg.HeroFriend = configUtils.getHeroFriendConfig(friendID);
            let friends = utils.parseStingList(friendCfg.HeroFriendNeedHero);

            if(friends.some(item => {
                let heroUnit: HeroUnit = bagData.getHeroById(item);
                let fakeHeroUnit = pveFakeData.getFakeHeroByHeroId(item);
                return this._fakeId ? fakeHeroUnit : heroUnit;
            })) {
                friendAddSkill.push(this._heroCfg.FriendSkill1);
            }
        }
        return friendAddSkill;
    }

    getFriendHeroId() {
        let friendId: number[] = [];
        let friendID = this._heroCfg.HeroFriendID;
        if (friendID) {
            let friendCfg: cfg.HeroFriend = configUtils.getHeroFriendConfig(friendID);
            if (friendCfg){
                let friends = utils.parseStingList(friendCfg.HeroFriendNeedHero);
                friendId = friends.map(friend=>{return Number(friend)}).filter((friend)=>{
                    return !!friend;
                });
            }
        }
        return friendId;
    }
    /**
     * 获得英雄特殊属性
     * @returns
     */
    getHeroSpecialAttributeProperty() {
        // 加上了基础属性 攻防血速
        let star: number = this._hero ? this.hero.Star - 1 : 0;
        let heroBasicProps = this.getHeroBasicProperty();
        let equipAdd = this.getHeroEquipsAddProperty();
        let giftAdd = this.getGiftAddProperty();
        let pragmaticAddProp = this.getPragmaticAddProperty();
        let treasureProps = this.getTreasureAddProps();
        let heroSpeAttrs = this.getHeroSpecialAttribute();
        let wuDaoProp = this.getWuDaoAddProps();
        let attributeCfgs: {[k: number]: cfg.Attribute} = configManager.getConfigs('attribute');
        let getPropFunc = (cfg: cfg.Attribute, propType: HERO_PROP): {name: string, value: number, type: number} => {
            let prop = {name: '', value: 0, type: 1};
            prop.name = cfg.Name;
            prop.type = cfg.AttributeValueType;
            let propAlias: string = HERO_PROP_MAP[propType];
            let heroPro = heroBasicProps[propAlias] || 0;
            let equipPro = (equipAdd[propAlias.toLocaleLowerCase()] || 0) + (equipAdd.yellow[propAlias] || 0) + (equipAdd.green[propAlias] || 0)
                + (equipAdd.castSoul[propType] || 0) + ((equipAdd.beast && equipAdd.beast[propType]) || 0);
            let heroSpePro = heroSpeAttrs[propAlias] || 0;
           switch(propType) {
               case HERO_PROP.BASE_ATTACK:
                    prop.value = heroPro + equipPro + heroSpePro + (giftAdd[propType] || 0) + (pragmaticAddProp[propType] || 0);

                    let attackAddPct = equipAdd.green.AttackPercent + (equipAdd.castSoul[HERO_PROP.BASE_ATTACK_PCT] || 0)
                          + ((equipAdd.beast && equipAdd.beast[HERO_PROP.BASE_ATTACK_PCT]) || 0)
                          + (giftAdd[HERO_PROP.BASE_ATTACK_PCT] || 0)
                          + (pragmaticAddProp[HERO_PROP.BASE_ATTACK_PCT] || 0)
                          + (treasureProps.has(HERO_PROP.BASE_ATTACK_PCT) ? treasureProps.get(HERO_PROP.BASE_ATTACK_PCT) : 0) * 100
                          + (!!(wuDaoProp && wuDaoProp.has(HERO_PROP.BASE_ATTACK_PCT)) ? wuDaoProp.get(HERO_PROP.BASE_ATTACK_PCT) : 0);
                    prop.value += Math.floor(heroPro * attackAddPct / 10000);
                    break;
               case HERO_PROP.DEFEND:
                    prop.value = heroPro + equipPro + heroSpePro + (giftAdd[propType] || 0) +(pragmaticAddProp[propType] || 0);

                    let defendAddPct = equipAdd.green.DefendPercent + (equipAdd.castSoul[HERO_PROP.DEFEND_PCT] || 0)
                              + ((equipAdd.beast && equipAdd.beast[HERO_PROP.DEFEND_PCT]) || 0)
                              + (giftAdd[HERO_PROP.DEFEND_PCT] || 0)
                              + (pragmaticAddProp[HERO_PROP.DEFEND_PCT] || 0)
                              + (treasureProps.has(HERO_PROP.DEFEND_PCT) ? treasureProps.get(HERO_PROP.DEFEND_PCT) : 0) * 100
                              + (!!(wuDaoProp && wuDaoProp.has(HERO_PROP.DEFEND_PCT)) ? wuDaoProp.get(HERO_PROP.DEFEND_PCT) : 0);
                    prop.value += Math.floor(heroPro * defendAddPct / 10000);
                    break;
               case HERO_PROP.MAX:
                    prop.value = heroPro + equipPro + heroSpePro + (giftAdd[propType] || 0) +(pragmaticAddProp[propType] || 0);

                    let hpAddPct = equipAdd.green.HpPercent + (equipAdd.castSoul[HERO_PROP.HP_PCT] || 0)
                                + ((equipAdd.beast && equipAdd.beast[HERO_PROP.HP_PCT]) || 0)
                                + (giftAdd[HERO_PROP.HP_PCT] || 0)
                                + (pragmaticAddProp[HERO_PROP.HP_PCT] || 0)
                                + (treasureProps.has(HERO_PROP.HP_PCT) ? treasureProps.get(HERO_PROP.HP_PCT) : 0) * 100
                                + (!!(wuDaoProp && wuDaoProp.has(HERO_PROP.HP_PCT)) ? wuDaoProp.get(HERO_PROP.HP_PCT) : 0);
                    prop.value += Math.floor(heroPro * hpAddPct / 10000);
                   break;
               case HERO_PROP.SPEED: {
                    prop.value = heroPro + equipPro + heroSpePro + (giftAdd[propType] || 0) + (pragmaticAddProp[propType] || 0);

                    let speedAddPct = (equipAdd.castSoul[HERO_PROP.SPEED_PCT] || 0)
                    + ((equipAdd.beast && equipAdd.beast[HERO_PROP.SPEED_PCT]) || 0)
                    + (giftAdd[HERO_PROP.SPEED_PCT] || 0)
                    + (pragmaticAddProp[HERO_PROP.SPEED_PCT] || 0)
                    + (treasureProps.has(HERO_PROP.SPEED_PCT) ? treasureProps.get(HERO_PROP.SPEED_PCT) : 0) * 100
                    + (!!(wuDaoProp && wuDaoProp.has(HERO_PROP.SPEED_PCT)) ? wuDaoProp.get(HERO_PROP.SPEED_PCT) : 0);
                    prop.value += Math.floor(heroPro * speedAddPct / 10000);
                   break;
               }
               default: {
                    prop.value = heroPro + equipPro + heroSpePro +(giftAdd[propType] || 0)
                    + (pragmaticAddProp[propType] || 0);
                   break;
               }
           }

            return prop;
        }
        let props = [];
        for(const k in attributeCfgs) {
            let cfg = attributeCfgs[k];
            if(cfg.AttributeExhibition) {
                let propType = parseInt(k);
                let prop = getPropFunc(cfg, propType);
                if(treasureProps.has(propType)){
                    let propValue = treasureProps.get(propType);
                    prop.value += propValue;
                }
                if(wuDaoProp && wuDaoProp.has(propType)) {
                    let propValue = wuDaoProp.get(propType);
                    prop.value += propValue;
                }
                props.push(prop);
            }
        }
        return props;
    }

    //获取英雄特殊属性
    getHeroSpecialAttribute(){
        let heroAttrs : any = null;
        let heroPropertyConfig: any = configUtils.getHeroSpecialAttributeConfig(this._heroCfg.HeroBasicId);
        if(!heroPropertyConfig) return heroAttrs;
        //字段忽略表
        let ignoreKeys = ['HeroId'];
        let keys = Object.keys(heroPropertyConfig);
        for(let i = 0, len = keys.length; i < len; i++) {
            if(ignoreKeys.indexOf(keys[i]) === -1){
                heroAttrs = heroAttrs || {};
                heroAttrs[keys[i]] = parseInt(utils.parseStingList(heroPropertyConfig[keys[i]])[this.star - 1]);
            }
        }
        return heroAttrs;
    }

    /**
     * 计算修炼点 带来的属性加成
     * @returns
     */
    getPragmaticAddProperty() {
        let pragmaticSkills = pragmaticData.skills;
        let props: number[] = [];
        for(const k in pragmaticSkills) {
            let cfgs: cfg.LeadSkillLevel[] = configManager.getConfigByKV('leadSkillLevel', 'LeadSkillLevelGroup', Number(k));
            if(!cfgs || cfgs.length == 0) continue;
            let attrType: number = NaN;
            cfgs.some(ele => {
                if(ele.LeadSkillLevelAttributeType){
                  attrType = ele.LeadSkillLevelAttributeType;
                  return true;
                }
                return false;
            });
            if(isNaN(attrType)) continue;
            if(!this._checkCanAddPragmaticProp(attrType)) continue;

            cfgs.forEach(ele => {
                if(!ele || !ele.LeadSkillLevelAttributeValue) return;
                if(ele.LeadSkillLevelSkillLevel > pragmaticSkills[k]) return;
                utils.parseStingList(ele.LeadSkillLevelAttributeValue, (strs: string[]) => {
                    let propType = parseInt(strs[0]), propValue = parseFloat(strs[1]);
                    props[propType] = props[propType] || 0;
                    props[propType] += propValue;
                });
            });
        }
        return props;
    }

    //获取宝物对英雄属性的加成
    getTreasureAddProps(){
        let props: Map<number, number> = new Map();
        let treasureProps = bagData.treasureProp;
        if(!treasureProps || treasureProps.size == 0) return props;

        treasureProps.forEach((ele, key) => {
            //固定属性
            if(ele.fixAttrScope && this._checkCanAddTreasureProp(ele.fixAttrScope)){
               ele.fixAttr1ID && props.set(ele.fixAttr1ID, (props.get(ele.fixAttr1ID) || 0) + (ele.fixAttr1CurValue || 0));
               ele.fixAttr2ID && props.set(ele.fixAttr2ID, (props.get(ele.fixAttr2ID) || 0) + (ele.fixAttr2CurValue || 0));
            }

            //条件属性
            if(ele.addOnAttrScope && this._checkCanAddTreasureProp(ele.addOnAttrScope)){
                ele.addOnAttrID && props.set(ele.addOnAttrID, (props.get(ele.addOnAttrID) || 0) + (ele.addOnAttrCurValue || 0));
            }
        });
        return props;
    }

    getWuDaoAddProps(): Map<number, number> {
        let ability = this._heroCfg.HeroBasicAbility || 0;
        if(!ability) return null;

        let wuDaoCfg = configCache.getWuDaoCfgsByHeroType(ability);
        if(!wuDaoCfg) return null;
        return pragmaticData.getWuDaoProps(`${wuDaoCfg.TeamID}`);
    }

    private _getPragmaticCapability () {
        let total = 0;
        let pragmaticSkills = pragmaticData.skills;
        for(const k in pragmaticSkills) {
            let cfgs: cfg.LeadSkillLevel[] = configManager.getConfigByKV('leadSkillLevel', 'LeadSkillLevelGroup', Number(k));
            for(const j in cfgs) {
                let cfg = cfgs[j];
                if(cfg.LeadSkillLevelSkillLevel <= pragmaticSkills[k] && cfg && cfg.LeadSkillLevelAttributeType && cfg.LeadSkillLevelAttributeValue) {
                    // 添加属性
                    if(this._checkCanAddPragmaticProp(cfg.LeadSkillLevelAttributeType)) {
                        total += cfg.LeadSkillLevelPower
                    }
                }
            }
        }
        return total;
    }

    private _getGiftCapability () {
        let total = 0;
        if (this._fakeId){
            return total;
        }
        // 真实英雄
        for(const k in this.gift) {
            let giftCfg: cfg.HeroGift = configUtils.getHeroGiftConfig(Number(k));
            if(giftCfg && giftCfg.HeroGiftPower) {
                total += giftCfg.HeroGiftPower
            }
        }
        return total;
    }

    private _getEquipCapability () {
        let total = 0;
        if (this._hero && utils.getObjLength(this._hero.Equips) > 0) {
            for (const k in this._hero.Equips) {
                let _e = this._hero.Equips[k];
                let equip: Equip = bagData.getEquipById(_e.ID, utils.longToNumber(_e.Seq));
                let star = equip.equip.Star;
                let powerArray: string[] = null;
                if(equip.isBeast) {
                    powerArray = utils.parseStringTo1Arr(equip.beastCfg.BeastPower);
                } else {
                    powerArray = utils.parseStringTo1Arr(equip.equipCfg.EquipPower);
                }
                if (powerArray && powerArray[star]) {
                    total += parseInt(powerArray[star]);
                }
            }
        }
        return total;
    }

    /**
     * 获得战斗力
     */
    getCapability(isPassive: boolean = false) {
        /**        第一层       */
        // 英雄基础属性值 第一层
        let props = this.getHeroBasicProperty();
        /**         第二层             */
        // 装备添加属性
        let equipAdd = this.getHeroEquipsAddProperty();
        // TODO 需要取到基础属性百分比 再第一层之上乘以百分比
        // 天赋添加属性
        let giftAddProperty = this.getGiftAddProperty();
        // 修炼添加属性
        let pragmaticAddProp = this.getPragmaticAddProperty();
        // 宝物属性加成
        let treasuerProp = this.getTreasureAddProps();
        // 悟道属性加成
        let wuDaoProp = this.getWuDaoAddProps();

        //攻击
        let baseAttack = props.Attack;
        props.Attack += (equipAdd.attack + equipAdd.green.Attack + (equipAdd.castSoul[HERO_PROP.BASE_ATTACK] || 0) + ((equipAdd.beast && equipAdd.beast[HERO_PROP.BASE_ATTACK]) || 0));
        props.Attack += (giftAddProperty[HERO_PROP.BASE_ATTACK] || 0);
        props.Attack += (pragmaticAddProp[HERO_PROP.BASE_ATTACK] || 0);
        treasuerProp.has(HERO_PROP.BASE_ATTACK) && (props.Attack += treasuerProp.get(HERO_PROP.BASE_ATTACK));
        wuDaoProp &&  wuDaoProp.has(HERO_PROP.BASE_ATTACK) && (props.Attack += wuDaoProp.get(HERO_PROP.BASE_ATTACK));

        let attackAddPct = equipAdd.green.AttackPercent + (equipAdd.castSoul[HERO_PROP.BASE_ATTACK_PCT] || 0)
                  + ((equipAdd.beast && equipAdd.beast[HERO_PROP.BASE_ATTACK_PCT]) || 0)
                  + (giftAddProperty[HERO_PROP.BASE_ATTACK_PCT] || 0)
                  + (pragmaticAddProp[HERO_PROP.BASE_ATTACK_PCT] || 0)
                  + (treasuerProp.has(HERO_PROP.BASE_ATTACK_PCT) ? treasuerProp.get(HERO_PROP.BASE_ATTACK_PCT) : 0) * 100
                  + (!!(wuDaoProp && wuDaoProp.has(HERO_PROP.BASE_ATTACK_PCT)) ? wuDaoProp.get(HERO_PROP.BASE_ATTACK_PCT) : 0);
        props.Attack += Math.floor(baseAttack * attackAddPct / 10000);

        //防御
        let baseDefend = props.Defend;
        props.Defend += (equipAdd.defend + equipAdd.green.Defend + ( equipAdd.castSoul[HERO_PROP.DEFEND] || 0) + ((equipAdd.beast && equipAdd.beast[HERO_PROP.DEFEND]) || 0));
        props.Defend += (giftAddProperty[HERO_PROP.DEFEND] || 0);
        props.Defend += (pragmaticAddProp[HERO_PROP.DEFEND] || 0);
        treasuerProp.has(HERO_PROP.DEFEND) && (props.Defend += treasuerProp.get(HERO_PROP.DEFEND));
        wuDaoProp && wuDaoProp.has(HERO_PROP.DEFEND) && (props.Defend += wuDaoProp.get(HERO_PROP.DEFEND));

        let defendAddPct = equipAdd.green.DefendPercent + ( equipAdd.castSoul[HERO_PROP.DEFEND_PCT] || 0)
                  + ((equipAdd.beast && equipAdd.beast[HERO_PROP.DEFEND_PCT]) || 0)
                  + (giftAddProperty[HERO_PROP.DEFEND_PCT] || 0)
                  + (pragmaticAddProp[HERO_PROP.DEFEND_PCT] || 0)
                  + (treasuerProp.has(HERO_PROP.DEFEND_PCT) ? treasuerProp.get(HERO_PROP.DEFEND_PCT) : 0) * 100
                  + (!!(wuDaoProp && wuDaoProp.has(HERO_PROP.DEFEND_PCT)) ? wuDaoProp.get(HERO_PROP.DEFEND_PCT) : 0);
        props.Defend += Math.floor(baseDefend * defendAddPct / 10000);

        //血量
        let baseHp = props.Hp;
        props.Hp += (equipAdd.hp + equipAdd.green.Hp + ( equipAdd.castSoul[HERO_PROP.MAX] || 0) + ((equipAdd.beast && equipAdd.beast[HERO_PROP.MAX]) || 0));
        props.Hp += (giftAddProperty[HERO_PROP.MAX] || 0);
        props.Hp += (pragmaticAddProp[HERO_PROP.MAX] || 0);
        treasuerProp.has(HERO_PROP.MAX) && (props.Hp += treasuerProp.get(HERO_PROP.MAX));
        wuDaoProp && wuDaoProp.has(HERO_PROP.MAX) && (props.Hp += wuDaoProp.get(HERO_PROP.MAX));

        let hpAddPct = equipAdd.green.HpPercent + ( equipAdd.castSoul[HERO_PROP.HP_PCT] || 0)
                    + ((equipAdd.beast && equipAdd.beast[HERO_PROP.HP_PCT]) || 0)
                    + (giftAddProperty[HERO_PROP.HP_PCT] || 0)
                    + (pragmaticAddProp[HERO_PROP.HP_PCT] || 0)
                    + (treasuerProp.has(HERO_PROP.HP_PCT) ? treasuerProp.get(HERO_PROP.HP_PCT) : 0) * 100
                    + (!!(wuDaoProp && wuDaoProp.has(HERO_PROP.HP_PCT)) ? wuDaoProp.get(HERO_PROP.HP_PCT) : 0);
        props.Hp += Math.floor(baseHp * hpAddPct / 10000);

        //速度
        let baseSpeed = props.Speed;
        props.Speed += (equipAdd.yellow.Speed + ( equipAdd.castSoul[HERO_PROP.SPEED] || 0) + ((equipAdd.beast && equipAdd.beast[HERO_PROP.SPEED]) || 0));
        props.Speed += (giftAddProperty[HERO_PROP.SPEED] || 0);
        props.Speed += (pragmaticAddProp[HERO_PROP.SPEED] || 0);
        treasuerProp.has(HERO_PROP.SPEED) && (props.Speed += treasuerProp.get(HERO_PROP.SPEED));
        wuDaoProp && wuDaoProp.has(HERO_PROP.SPEED) && (props.Speed += wuDaoProp.get(HERO_PROP.SPEED));

        let speedAddPct = (equipAdd.castSoul[HERO_PROP.SPEED_PCT] || 0)
                + ((equipAdd.beast && equipAdd.beast[HERO_PROP.SPEED_PCT]) || 0)
                + (giftAddProperty[HERO_PROP.SPEED_PCT] || 0)
                + (pragmaticAddProp[HERO_PROP.SPEED_PCT] || 0)
                + (treasuerProp.has(HERO_PROP.SPEED_PCT) ? treasuerProp.get(HERO_PROP.SPEED_PCT) : 0) * 100
                + (!!(wuDaoProp && wuDaoProp.has(HERO_PROP.SPEED_PCT)) ? wuDaoProp.get(HERO_PROP.SPEED_PCT) : 0);
        props.Speed += Math.floor(baseSpeed * speedAddPct / 10000);

        // todo 需要加上天赋解锁加的技能 加的战斗力

        // todo 需要加上仙缘解锁 加的战斗力

        // 有可能还要加上英雄星级的加成 每个星级加固定的战斗力
        let heroStarAddPower: number = 0;
        if(this._hero) {
            let star: number = this._hero.Star;
            let combatPower: cfg.Power = configUtils.getCombatPowerConfig();
            let strCfg = ""
            switch (this._heroCfg.HeroBasicQuality) {
                case QUALITY_TYPE.SSR: { strCfg = combatPower.PowerHeroStarSsr; break;}
                case QUALITY_TYPE.SR: {strCfg = combatPower.PowerHeroStarSr; break;}
                case QUALITY_TYPE.R: {strCfg = combatPower.PowerHeroStarR; break; }
                default: {break;}
            }

            if (strCfg) {
                let heroStarPowerList: string[] = utils.parseStingList(strCfg);
                heroStarAddPower = parseInt(heroStarPowerList[star - 1]);
            }   
        }

        // 乘以 属性 系数
        let attRate: number = configUtils.getAttributeConfig(HERO_PROP.BASE_ATTACK).PowerAttrRate || 1;
        let defendRate: number = configUtils.getAttributeConfig(HERO_PROP.DEFEND).PowerAttrRate || 1;
        let hpRate: number = configUtils.getAttributeConfig(HERO_PROP.MAX).PowerAttrRate || 1;

        let pragmaticCapability = this._getPragmaticCapability();
        let giftCapability = this._getGiftCapability();
        let equipCapability = this._getEquipCapability();

        let clientCapability = props.Attack * attRate + props.Defend * defendRate + props.Hp * hpRate
                        + heroStarAddPower + pragmaticCapability + giftCapability + equipCapability;

        let srvCapability: number = 0;
        if (this._hero && this._hero.Attrs) {
            srvCapability = Number(this._hero.Attrs[900]);
        }
        if(srvCapability > 0 && clientCapability != srvCapability) {
            // guiManager.showTips('战斗力不同步 请查看日志 盘查问题');
            isPassive && logger.log(`战斗力不同 heroId: ${this._heroCfg.HeroBasicId} client：${clientCapability} srv: ${srvCapability}`);
            clientCapability = srvCapability;
        }
        return clientCapability;
    }
    /**
     * 是否拥有专属栏
     * @returns 
     */
    getHasExclusiveEquipPart() {
        // return typeof this.heroCfg.HeroBasicExclusive != "undefined";
        return this._heroCfg.HeroBasicQuality >= QUALITY_TYPE.SSR;
    }
    /**
     * 获得升星所需的碎片数
     * @returns 
     */
    getAddStarNeedChipCount() {
        let levelStars = configUtils.getLevelStarByTypeAndQuality(1, this._heroCfg.HeroBasicQuality);
        return levelStars[this._hero.Star].LevelStarNum;
    }
    /**
     * 获得合成整卡的碎片数
     */
    getCompoundHeroChipCount() {
        let needList = utils.parseStingList(configUtils.getModuleConfigs().HeroOpenNeedPiece);
        let needCount: number = needList.filter(item => {
            return item[0] == this._heroCfg.HeroBasicQuality;
        })[0][1];
        return needCount;
    }
    /**
     * 获得拥有的碎片
     * @returns 
     */
    getChipCount() {
        let bagItem: data.IBagItem = bagData.getItemByID(this.chipId);
        let count: number = 0;
        if (bagItem) {
            bagItem.Array.forEach(bagUnit => {
                count += utils.longToNumber(bagUnit.Count);
            });
        }
        return count;
    }

    // 获取英雄的套装穿戴状态
    getSuitInfos() {
        let suits: {[k: number]: number} = {};
        if (!this.hero) return suits;
        const equips = this.hero.Equips;
        // <suitId, count> 
        for(const k in equips) {
            let equip: data.IBagUnit = equips[k];
            let equipCfg = configUtils.getEquipConfig(equip.ID);
            if(!equipCfg) {
                // 目前只可能是灵兽
                continue;
            }
            let suitId: number = equipCfg.SuitId || 0;
            if(suitId > 0) {
                if(suits[suitId]) {
                    suits[suitId]++;
                } else {
                    suits[suitId] = 1;
                }
            }
        }
        return suits;
    }

    //获取某个装备所属套装的穿戴状态
    getSuitInfoByEquip(equipId: number): {suitId: number, suitCount: number} {
        let suitInfo = { suitId: 0, suitCount: 0};
        if (!this.hero || !equipId) return suitInfo;
        let equipCfg: cfg.Equip = configUtils.getEquipConfig(equipId);
        // 可能传入的是灵兽，因此加入判断
        if(equipCfg) {
            let suitId: number = equipCfg.SuitId || 0;
            if (suitId > 0) {
                let suits = this.getSuitInfos();
                if (suits[suitId]) {
                    suitInfo.suitCount = suits[suitId];
                    suitInfo.suitId = suitId;
                }
            }
        }
        return suitInfo;
    }

    getExclusiveInfos() {
        let exclusive: number = 0;
        if(this.isHeroBasic && this._heroCfg.HeroBasicExclusive) {
            let equips = this._hero.Equips;
            for(const k in equips) {
                if(equips[k].ID == this._heroCfg.HeroBasicExclusive) {
                    exclusive = this._heroCfg.HeroBasicExclusive;
                }
            }
        }
        return exclusive;
    }
    /**
     * 获得套装激活的技能 TODO 后续可能获得单件装备附加的技能
     * @returns 
     */
    getSuitSkills(): number[] {
        let skills: number[] = [];
        let suits = this.getSuitInfos();
        for(const k in suits) {
            const suitCount: number = suits[k];
            if(suitCount >= 2) {
                let suitCfg: cfg.EquipSuit = configUtils.getEquipSuitConfig(Number(k));
                let skillsList = utils.parseStingList(suitCfg.SuitSkill);
                let skill1: number = (skillsList[0] && Number(skillsList[0][1])) || 0;
                let skill2: number = (skillsList[1] && Number(skillsList[1][1])) || 0;
                if(suitCount >= 4) {
                    skills.push(skill1);
                    if(skill1 != skill2 && skill2 > 0) {
                        skills.push(skill2);
                    }
                } else {
                    if(skill1 > 0) {
                        skills.push(skill1);
                    }
                }
            }
        }
        return skills;
    }

    private _checkCanAddTreasureProp(attributeType: LEAD_SKILL_ATTRIBUTE_RANGE){
        return this._checkCanAddPragmaticProp(attributeType);
    }

    private _checkCanAddPragmaticProp(attributeType: LEAD_SKILL_ATTRIBUTE_RANGE) {
        let isCanAdd: boolean = false;
        switch(attributeType) {
            case LEAD_SKILL_ATTRIBUTE_RANGE.ALL:
                isCanAdd = true;
                break;
            case LEAD_SKILL_ATTRIBUTE_RANGE.SSR:
                if(QUALITY_TYPE.SSR == this._heroCfg.HeroBasicQuality) {
                    isCanAdd = true;
                }
                break;
            case LEAD_SKILL_ATTRIBUTE_RANGE.PLATE:
                if(EQUIP_TEXTURE_TYPE.PLATE_ARMOUR == this._heroCfg.HeroBasicEquipType) {
                    isCanAdd = true;
                }
                break;
            case LEAD_SKILL_ATTRIBUTE_RANGE.CLOTH:
                if(EQUIP_TEXTURE_TYPE.CLOTH_ARMOUR == this._heroCfg.HeroBasicEquipType) {
                    isCanAdd = true;
                }
                break;
            case LEAD_SKILL_ATTRIBUTE_RANGE.LEATHER:
                if(EQUIP_TEXTURE_TYPE.LEATHER_ARMOUR == this._heroCfg.HeroBasicEquipType) {
                    isCanAdd = true;
                }
                break;
            case LEAD_SKILL_ATTRIBUTE_RANGE.PLATE_LEATHER: {
                if(EQUIP_TEXTURE_TYPE.PLATE_ARMOUR == this._heroCfg.HeroBasicEquipType || EQUIP_TEXTURE_TYPE.LEATHER_ARMOUR == this._heroCfg.HeroBasicEquipType) {
                    isCanAdd = true;
                }
                break;
            }
            case LEAD_SKILL_ATTRIBUTE_RANGE.LEATHER_CLOTH: {
                if(EQUIP_TEXTURE_TYPE.CLOTH_ARMOUR == this._heroCfg.HeroBasicEquipType || EQUIP_TEXTURE_TYPE.LEATHER_ARMOUR == this._heroCfg.HeroBasicEquipType) {
                    isCanAdd = true;
                }
                break;
            }
            case LEAD_SKILL_ATTRIBUTE_RANGE.PLATE_CLOTH: {
                if(EQUIP_TEXTURE_TYPE.PLATE_ARMOUR == this._heroCfg.HeroBasicEquipType || EQUIP_TEXTURE_TYPE.CLOTH_ARMOUR == this._heroCfg.HeroBasicEquipType) {
                    isCanAdd = true;
                }
                break;
            }
            default:
                break;
        }
        return isCanAdd;
    }
}