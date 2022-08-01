import { CustomDialogId, CustomItemId, VIEW_NAME, XUANTIE_TO_EXP } from "../../../app/AppConst";
import { EQUIP_PART_TYPE, EQUIP_TEXTURE_TYPE, QUALITY_TYPE } from "../../../app/AppEnums";
import { utils } from "../../../app/AppUtils";
import { configUtils } from "../../../app/ConfigUtils";
import { cfg } from "../../../config/config";
import { data, gamesvr } from "../../../network/lib/protocol";
import { bagData } from "../../models/BagData";
import { bagDataOpt } from "../../operations/BagDataOpt";
import { Equip } from "../../template/Equip";
import guiManager from "../../../common/GUIManager";
import HeroUnit from "../../template/HeroUnit";
import ItemBag, { ITEM_SHOW_TYPE } from "../view-item/ItemBag";
import ItemRedDot from "../view-item/ItemRedDot";
import PreinstallRoleItem from "../view-preinstall/PreinstallRoleItem";
import { ItemBagPool } from "../../../common/res-manager/NodePool";
import { BagDataUtils, bagDataUtils } from "../../../app/BagDataUtils";
import { redDotMgr, RED_DOT_MODULE } from "../../../common/RedDotManager";
import { configManager } from "../../../common/ConfigManager";
import { commonData } from "../../models/CommonData";
import { eventCenter } from "../../../common/event/EventCenter";
import { bagDataEvent } from "../../../common/event/EventData";
import { userData } from "../../models/UserData";
import { audioManager, SFX_TYPE } from "../../../common/AudioManager";
import { BagItemInfo } from "../../../app/AppType";

const {ccclass, property} = cc._decorator;

@ccclass
export default class HeroEquipsView extends cc.Component {
    @property(cc.Node)                  spineParent: cc.Node = null;
    @property(cc.Prefab)                spinePfb: cc.Prefab = null;
    @property([cc.Node])                equipsList: cc.Node[] = [];
    @property(cc.Node)                  onceEquipBtn: cc.Node = null;
    @property(cc.Node)                  onceUnEquipBtn: cc.Node = null;
    @property([ItemRedDot])             equipsRedotList: ItemRedDot[] = [];
    
    private _heroId: number = 0;
    private _loadSubView: Function = null;
    private _itemBags: ItemBag[] = [];
    private _roleSpineNode : PreinstallRoleItem = null;

    onInit(heroId: number, loadSubView: Function) {
        this._heroId = heroId;
        this._loadSubView = loadSubView;
        this.registerAllEvent();
        this._initRedots();
        this.refreshView();
    }

    registerAllEvent() {
        eventCenter.register(bagDataEvent.EQUIP_TOTAL_ENHANCED, this, this.onEnquipTotalEnhanced);
    }

    onRelease() {
        this.equipsRedotList.forEach(ele => {
            ele.deInit();
        });
        this.deInit();
    }

    deInit() {
        eventCenter.unregisterAll(this);

        if (cc.isValid(this._roleSpineNode)) {
            this._roleSpineNode.deInit(true);
        }
        this._clearItems();
    }

    private _initRedots() {
        //更新红点
        this.equipsRedotList.forEach( (_rd, part) => {
            _rd.setData(RED_DOT_MODULE.HERO_EQUIP_DRESS_TOGGLE, {
                args: [this._heroId, part+1],
                subName: `${this._heroId}` +''
            });
        })
    }

    private _clearItems() {
        this._itemBags.forEach(_i => {
            ItemBagPool.put(_i)
        });
        this._itemBags.length = 0;
    }

    refreshView() {
        if (!this._heroId) return;

        // 展示spine
        if(!cc.isValid(this._roleSpineNode)){
            let node = cc.instantiate(this.spinePfb);
            this.spineParent.addChild(node);
            this._roleSpineNode = node.getComponent(PreinstallRoleItem);
        }
        this._roleSpineNode.setData(this._heroId);
        let heroUnit: HeroUnit = bagData.getHeroById(this._heroId);
        
        this.onceEquipBtn && (this.onceEquipBtn.active = heroUnit && heroUnit.isHeroBasic);
        this.onceUnEquipBtn && (this.onceUnEquipBtn.active = heroUnit && heroUnit.isHeroBasic);
        
        let equips: {[k: string]: data.IBagUnit} = {};
        heroUnit && ( equips = heroUnit.getHeroEquips());
        this._clearItems();

        // 专属栏的展示
        let exclusiveEquipNode: cc.Node = this.equipsList[6];
        exclusiveEquipNode.active = this.checkRoleHasExclusiveByUnit(heroUnit.basicId);
        
        this.equipsList.forEach((ele, idx) => {
            let equip: data.IBagUnit = equips[idx + 1];
            if (equip) {
                let equipItem: cc.Node = ItemBagPool.get().node;
                equipItem.scale = 1;
                ele.addChild(equipItem);
                this._itemBags.push(equipItem.getComponent(ItemBag));
                
                let equipUnit: Equip = new Equip(equip);
                equipItem.getComponent(ItemBag).init({
                    id: equip.ID,
                    level: equipUnit.getEquipLevel(),
                    star: equip.EquipUnit.Star,
                    prizeItem: true,
                    currEquip: this._heroId,
                    isShowCurrUser: false,
                    clickHandler: (info: BagItemInfo, type: ITEM_SHOW_TYPE)=>{
                        //灵兽
                        if(type == ITEM_SHOW_TYPE.BEAST) {
                            this._loadSubView(VIEW_NAME.SPIRIT_BEAST_LIST_VIEW, null, this._heroId);
                            return;
                        }
                        this.onClickEquip(equip);
                    }
                });
            }
        });
    }

    onClickEquip(equip: data.IBagUnit) {
        for (let i = 0; i < this.equipsList.length; ++i) {
            if (!this.equipsList[i]) continue;
            let itemBagCom = this.equipsList[i].getComponentInChildren(ItemBag);
            if (itemBagCom) {
                itemBagCom.refreshSelect(equip.ID ? equip.ID : 0);
            }
        }
        if(equip.ID && this._loadSubView) {
            this._loadSubView(VIEW_NAME.EQUIP_PROPERTY_VIEW, 2, equip, this._heroId);
        }
    }

    onClickEmityEquipPart(event: cc.Event, customEventData: EQUIP_PART_TYPE) {
        // 显示可替换装备
        let heroUnit: HeroUnit = new HeroUnit(this._heroId);
        if (heroUnit.isHeroBasic && this._loadSubView) {
          if(customEventData && customEventData == EQUIP_PART_TYPE.BEAST) {
              this._loadSubView(VIEW_NAME.SPIRIT_BEAST_LIST_VIEW, null, this._heroId);
          } else {
              this._loadSubView(VIEW_NAME.EQUIPS_LIST_VIEW, 1, customEventData, this._heroId);
          }
        } else {
            guiManager.showDialogTips(CustomDialogId.HERO_EQUIP_CONDITION);
        }
    }

    onClickOnceDressEquip() {
        if(this._checkHasDressEquip()) {
            let result = this._onceDressEquip();
            bagDataOpt.sendOnceDressEquip(this._heroId, result);
        } else {
            guiManager.showDialogTips(CustomDialogId.HERO_EQUIP_NO_AVALIABLE);
        }
    }

    onClickOnceUnDressEquip() {
        let equips = bagDataUtils.getDressedEquipsOfHero(this._heroId);
        if(utils.getObjLength(equips) > 0) {
            bagDataOpt.sendOnceUnDressEquip(this._heroId);
        } else {
            guiManager.showDialogTips(CustomDialogId.HERO_NO_EQUIP);
        }
    }

    /**
     * @description 一键强化
     */
    onClickOnceEnhanceEquip() {
        let tempEquips = bagDataUtils.getDressedEquipsOfHero(this._heroId);
        let equips: Array<Equip> = new Array();
        let oldEquipsLv: {[key: number]: number} = {};  // 存储装备原先的经验
        for (const k in tempEquips) {
            if (tempEquips[k] != null) {
                equips.push(new Equip(utils.deepCopy(tempEquips[k])));
                oldEquipsLv[tempEquips[k].ID] = tempEquips[k].EquipUnit.Exp;
            }
        }

        // 判断身上是否有穿戴装备
        if (equips.length === 0) {
            guiManager.showDialogTips(CustomDialogId.HERO_NO_EQUIP);
            return;
        }

        // 过滤掉灵兽、专属装备、当前满级装备
        let curEquipMaxLevel: number = bagDataUtils.curEquipMaxLevel;
        equips = equips.filter((equip: Equip) => {
            return !equip.isBeast && !equip.isExclusive() && equip.getEquipLevel() < curEquipMaxLevel;
        });
        if (equips.length === 0) {
            guiManager.showDialogTips(CustomDialogId.EQUIP_MEET_CURRENT_MAX_LEVEL);
            return;
        }

        // 根据玄铁和金币进行比例计算，获得当前持有的可消耗经验数量
        let xuantieToExp: number = bagData.getItemCountByID(CustomItemId.XUANTIE) * XUANTIE_TO_EXP;
        let goldToExp: number = bagData.getItemCountByID(CustomItemId.GOLD) / bagDataUtils.getEnhanceGoldMulti();
        let haveExp: number = Math.min(xuantieToExp, goldToExp);

        // 根据一键强化的规则对每件装备尽可能地平均强化，直到满级或者经验数量不足
        let costExp: number = 0;
        let enhanceEquip: Equip = null;
        let curEnhanceLevel: number = -1;
        while(haveExp > 0) {
            enhanceEquip = this._getEquipOfOnceEhance(equips, curEnhanceLevel);
            if (enhanceEquip == null) {
                break;  // 装备都强化至当前最高
            }
            curEnhanceLevel = enhanceEquip.getEquipLevel();
            haveExp -= enhanceEquip.getCostExpOfEquipForLevelUp(curEnhanceLevel+1);
            if (haveExp >= 0) {
                costExp += enhanceEquip.getCostExpOfEquipForLevelUp(curEnhanceLevel+1);
                enhanceEquip.equip.Exp += enhanceEquip.getCostExpOfEquipForLevelUp(curEnhanceLevel+1);
            } else {
                break;  // 经验数量不足
            }
        }

        // 过滤掉没升级的装备
        equips = equips.filter((equip) => {
            let result = equip.equip.Exp != oldEquipsLv[equip.equipData.ID]
            return result;
        });

        if (costExp > 0) {
            this._showCostOfOnceEnhanceEquip(costExp, equips);
        } else {
            // 提示更少的道具数量不足
            guiManager.showDialogTips(CustomDialogId.COMMON_ITEM_NOT_ENOUGH, xuantieToExp < goldToExp ? CustomItemId.XUANTIE : CustomItemId.GOLD);
        }
    }

    /**
     * 根据一键强化规则获得此次要强化的装备
     * @param equips 装备数组
     * @param curEnhanceLevel 当前强化等级
     * @returns 要强化的装备，为空表示都已强化到当前最高等级
     */
     private _getEquipOfOnceEhance(equips: Array<Equip>, curEnhanceLevel: number): Equip {
        let equip: Equip = null;
        for (let i = 0; i < equips.length; ++i) {
            if (equips[i].getEquipLevel() === curEnhanceLevel) {
                equip = equips[i];
                break;
            }
        }

        if (equip == null) {
            equips.sort(this.onceEnhanceEquipSortFunc);
            if (equips[0].getEquipLevel() < bagDataUtils.curEquipMaxLevel) {
                equip = equips[0];
            }
        }

        return equip;
    }

    private onceEnhanceEquipSortFunc(a: Equip, b: Equip) {
        let levelA = a.getEquipLevel();
        let levelB = b.getEquipLevel();
        if (levelA != levelB) {
            return levelA - levelB;
        } else {
            return a.equipCfg.PositionType - b.equipCfg.PositionType;
        }
    }

    /** 展示一键强化消耗窗口 */
    private _showCostOfOnceEnhanceEquip(costExp: number, equips: Equip[]) {
        let heroID: number = this._heroId;
        let enhanceTotalEquipmentInfoList: gamesvr.EnhanceTotalEquipmentInfo[] = [];
        equips.forEach((equip: Equip) => {
            enhanceTotalEquipmentInfoList.push(gamesvr.EnhanceTotalEquipmentInfo.create({
                EquipSeq: equip.equipData.Seq,
                EquipID: equip.equipData.ID,
                Exp: equip.equip.Exp
            }));
        });


        if (!commonData.tmpCache.BLOCK_EQUIP_ONCE_ENHANCE_CONFIRM) {
            this._loadSubView(VIEW_NAME.EQUIP_ONCE_ENHANCE_CONFIRM_VIEW, 0, costExp, (checked: boolean) => {
                if (checked) {
                    commonData.blockEquipOnceEnhanceConfirm = checked;
                }
    
                bagDataOpt.sendEnhanceTotalEquipmentRequest(heroID, enhanceTotalEquipmentInfoList);
            });
        } else {
            bagDataOpt.sendEnhanceTotalEquipmentRequest(heroID, enhanceTotalEquipmentInfoList);
        }
    }

    /**
    * 英雄是否拥有专属栏
    * @param hero 
    * @returns 
    */
    checkRoleHasExclusiveByUnit(heroId: number) {
        let heroBasic = configUtils.getHeroBasicConfig(heroId);
        return heroBasic.HeroBasicQuality >= QUALITY_TYPE.SSR;
    }

     /**
     * 判断是否有一件满足穿戴的装备
     */
    private _checkHasDressEquip(): boolean {
        let equips = bagData.equipList;
        let heroCfg: cfg.HeroBasic = configUtils.getHeroBasicConfig(this._heroId);
        for (const k in equips) {
            let equipConfig: cfg.Equip = configUtils.getEquipConfig(equips[k].ID);
            let isExclusiveEquip = heroCfg.HeroBasicExclusive && heroCfg.HeroBasicExclusive == equips[k].ID;
            
            // 英雄装备类型 || 通用类型4 || 专属装备
            if ((this._checkEquipTexture(equipConfig.TextureType, heroCfg.HeroBasicEquipType)
                || isExclusiveEquip) && !bagDataUtils.checkEquipIsDressed(equips[k])) {
                return true;
            }
        }
        return false;
    }

    /**
     * 装备是否合身
     * @param equipT 
     * @param heroT 
     * @returns 
     */
    private _checkEquipTexture(equipT: number, heroT: number): boolean {
        return equipT == heroT || equipT == EQUIP_TEXTURE_TYPE.COMMON_ARMOUR
    }

    /**
     * 一键穿戴逻辑
     * 1. 先找最多件套装，若套装件数少于2，则穿散件。
     * 2. 对没有填充的位置找套装，若套装件数少于2，则穿散件。
     * 3. 循环2，直到所有装备穿完
     * 4. 穿散件：每个位置的装备进行排序，穿第一件
     */
    private _onceDressEquip() {
        let result: { [k: string]: gamesvr.IEquipInfo } = {}
        let heroCfg: cfg.HeroBasic = configUtils.getHeroBasicConfig(this._heroId);
        let idleEquips = bagDataUtils.getIdleEquips(this._heroId);

        let idleSuit = this._getIdleSuit(idleEquips, heroCfg.HeroBasicEquipType);
        let equipPos = [
            EQUIP_PART_TYPE.WEAPON, EQUIP_PART_TYPE.CHEST, EQUIP_PART_TYPE.HELMET,
            EQUIP_PART_TYPE.BOOT, EQUIP_PART_TYPE.RING, EQUIP_PART_TYPE.NECKLACE
        ]

        while (equipPos.length > 0) {
            let currIdleSuit = this._getIdleSuitByPos(idleSuit, equipPos)
            if (currIdleSuit.length > 0) {
                let suit = currIdleSuit[0]
                suit.forEach((v, k) => {
                    result[k] = { ID: v.ID, Seq: v.Seq }
                    let index = equipPos.indexOf(k)
                    equipPos.splice(index, 1)
                })
            } else {
                for (let i = equipPos.length - 1; i >= 0; --i) {
                    const pos = equipPos[i]
                    const equip = this._findIdleScatter(idleEquips, pos, heroCfg)
                    if (equip) result[pos] = { ID: equip.ID, Seq: equip.Seq }
                    equipPos.pop()
                }
            }
        }

        // 穿戴专属
        if (heroCfg.HeroBasicExclusive) {
            let equips = idleEquips.filter(v => {
                return v.ID == heroCfg.HeroBasicExclusive
            }).sort((a, b) => {
                return a.EquipUnit.Star >= b.EquipUnit.Star ? -1 : 1
            })
            if (equips.length > 0) {
                result[EQUIP_PART_TYPE.EXCLUSIVE] = equips[0]
            }
        }

        return result
    }

    private _getSuitDressed(suit: Map<number, data.IBagUnit>) {
        let dressed = 0
        suit.forEach((v, k) => {
            let equipHero = bagDataUtils.checkEquipIsDressed(v)
            if (equipHero == this._heroId) {
                dressed++
            }
        })
        return dressed
    }

    /**
     * 获取空闲套装并排序
     * @param equips 
     */
    private _getIdleSuit(equips: data.IBagUnit[], heroTexture: number) {
        let suitMap = new Map<number, Map<number, data.IBagUnit>>()
        for (let i = 0; i < equips.length; i++) {
            const equip = equips[i]
            const equipCfg = configUtils.getEquipConfig(equip.ID)
            const suitable = this._checkEquipTexture(equipCfg.TextureType, heroTexture)
            if (equipCfg && equipCfg.SuitId && suitable) {
                if (!suitMap.has(equipCfg.SuitId)) {
                    let unit = new Map<number, data.IBagUnit>()
                    suitMap.set(equipCfg.SuitId, unit)
                }

                // 如果有多件，选择星级最高的一件
                let origin = suitMap.get(equipCfg.SuitId).get(equipCfg.PositionType)
                if (!(origin && origin.EquipUnit.Star > equip.EquipUnit.Star)) {
                    suitMap.get(equipCfg.SuitId).set(equipCfg.PositionType, equip)   
                }
            }
        }

        let suitList: Map<number, data.IBagUnit>[] = []
        suitMap.forEach((v, k) => { suitList.push(v) })
        suitList.sort((a, b) => {
            // 质量优先
            // 数量优先
            // 已穿戴优先
            if (a.size != b.size) return a.size < b.size ? 1 : -1
            
            let aDressedCnt = this._getSuitDressed(a)
            let bDreesedCnt = this._getSuitDressed(b)
            return aDressedCnt >= bDreesedCnt ? -1 : 1
        })
        return suitList
    }

    /**
     * 获取指定位置的空闲套装并排序
     * @param suits 
     * @param equipPoss 
     */
    private _getIdleSuitByPos(suits: Map<number, data.IBagUnit>[], equipPoss: number[]) {
        let suitList: Map<number, data.IBagUnit>[] = []
        suits.forEach((v1, k1) => {
            let suit = new Map<number, data.IBagUnit>()
            v1.forEach((v2, k2) => {
                if (equipPoss.indexOf(k2) >= 0) {
                    suit.set(k2, v2)
                }
            })
            if (suit.size > 1) {
                suitList.push(suit)
            }
        })
        
        suitList.sort((a, b) => {
            if (a.size != b.size) return a.size < b.size ? 1 : -1
            
            let aDressedCnt = this._getSuitDressed(a)
            let bDreesedCnt = this._getSuitDressed(b)
            return aDressedCnt >= bDreesedCnt ? -1 : 1
        })
        return suitList
    }

    /**
     * 找散件
     * @param equips 
     * @param pos 
     */
    private _findIdleScatter(equips: data.IBagUnit[], equipPos: number, heroCfg: cfg.HeroBasic) {
        let scatter: data.IBagUnit
        let scaterCfg: cfg.Equip

        const sortEquip = (equipA: data.IBagUnit, equipB: data.IBagUnit, 
            equipACfg: cfg.Equip, equipBCfg: cfg.Equip): boolean => {
            // 是否存在
            if (!equipA || !equipACfg) return true
            // 质量
            if (equipACfg.Quality < equipBCfg.Quality) return true
            if (equipACfg.Quality > equipBCfg.Quality) return false
            // 是否散件
            let isAScatter = !equipACfg.SuitId
            let isBScatter = !equipBCfg.SuitId
            if (isAScatter != isBScatter) return isBScatter
            // 是否穿戴
            let equipedAHero = bagDataUtils.checkEquipIsDressed(equipA)
            let equipedBHero = bagDataUtils.checkEquipIsDressed(equipB)
            if (equipedAHero == this._heroId) return false
            if (equipedBHero == this._heroId) return true
            // ID从小到大
            return equipA.ID > equipB.ID
        }


        for (let i = 0; i < equips.length; i++) {
            const equip = equips[i];
            const equipCfg = configUtils.getEquipConfig(equip.ID)
            const suitable = this._checkEquipTexture(equipCfg.TextureType, heroCfg.HeroBasicEquipType)
            if (equipCfg.PositionType == equipPos && suitable) {
                let instead = sortEquip(scatter, equip, scaterCfg, equipCfg)
                if (instead) {
                    scatter = equip
                    scaterCfg = equipCfg
                }                
            }
        }
        
        return scatter
    }

    onEnquipTotalEnhanced(event: any, msg: gamesvr.EnhanceTotalEquipmentRes) {
        // 更新战力
        userData.updateCapability();
        
        // 刷新页面
        this.refreshView();
        
        // 发布红点事件，刷新红点
        redDotMgr.fire(RED_DOT_MODULE.EQUIP_ENHANCE_TOGGLE);
        redDotMgr.fire(RED_DOT_MODULE.BAG_VIEW_EQUIP_ENHANCE_BTN);
        redDotMgr.fire(RED_DOT_MODULE.EQUIP_ENHANCE_NODE_ENGANCE_BTN);
        this._initRedots();

        // 提示 和 音效
        guiManager.showDialogTips(CustomDialogId.EQUIP_ENHANCE_SUCCESS);
        audioManager.playSfx(SFX_TYPE.EQUIP_ENHANCE);
    }
}