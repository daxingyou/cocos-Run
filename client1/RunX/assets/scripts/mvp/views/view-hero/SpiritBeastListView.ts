

import { BAG_ITEM_TYPE, BEAST_RISE_LV_MATERIAL, BEAST_TYPE, EQUIP_PART_TYPE, HEAD_ICON, HERO_PROP_MAP, NumberValueType } from "../../../app/AppEnums";
import { BagItemInfo } from "../../../app/AppType";
import { utils } from "../../../app/AppUtils";
import { bagDataUtils } from "../../../app/BagDataUtils";
import { configUtils } from "../../../app/ConfigUtils";
import { resPathUtils } from "../../../app/ResPathUrlUtils";
import UIGridView, { GridData } from "../../../common/components/UIGridView";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { eventCenter } from "../../../common/event/EventCenter";
import { bagDataEvent, heroViewEvent } from "../../../common/event/EventData";
import guiManager from "../../../common/GUIManager";
import moduleUIManager from "../../../common/ModuleUIManager";
import { ItemBagPool } from "../../../common/res-manager/NodePool";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { cfg } from "../../../config/config";
import { data, gamesvr } from "../../../network/lib/protocol";
import { bagData } from "../../models/BagData";
import { commonData } from "../../models/CommonData";
import { bagDataOpt } from "../../operations/BagDataOpt";
import ItemBag, { ITEM_SHOW_TYPE } from "../view-item/ItemBag";
import BeastRiseStarView from "./BeastRiseStarView";

const {ccclass, property} = cc._decorator;

enum BEASR_SPE_PROP_TYPE {
    PROP = 1,
    SKILL
}

const NUMBER_MAX_V = 100000;
const BEAST_MATERIAL_AND_COIN_RATIO = 2;

/**
 * @description 灵兽
 */
@ccclass
export default class SpiritBeastListView extends ViewBaseComponent {
    @property(UIGridView) beastListView: UIGridView = null;

    @property(cc.Sprite) QualitySp: cc.Sprite = null;
    @property(cc.Sprite) typeBgSp: cc.Sprite = null;
    @property(cc.Sprite) typeIcon: cc.Sprite = null;
    @property(cc.Label) TypeLb: cc.Label = null;
    @property(cc.Sprite) modelIconSp: cc.Sprite = null;
    @property(cc.Label) lvLb: cc.Label = null;
    @property(cc.Label) nameLb: cc.Label = null;
    @property(cc.Sprite) dressedHeroSp: cc.Sprite = null;
    @property(cc.Node) btnDress: cc.Node = null;
    @property(cc.Node) btnUndress: cc.Node = null;
    @property(cc.Node) btnChange: cc.Node = null;
    @property(cc.Node) starRoot: cc.Node = null;
    @property(cc.Node) btnRiseLv: cc.Node = null;
    @property(cc.Node) btnRiseStar: cc.Node = null;
    @property(cc.Toggle) onceRiseLvTlg: cc.Toggle = null;
    @property(cc.Label) maxLvTip: cc.Label = null;
    @property(cc.Label) maxStarTip: cc.Label = null;
    @property(cc.Node) basePropContainor: cc.Node = null;
    @property(cc.Node) spePropContainor: cc.Node = null;
    @property(cc.Sprite) riseLvItemIcon: cc.Sprite = null;
    @property(cc.Label) riseLvItemCnt: cc.Label = null;
    @property(cc.Sprite) riseLvCoinIcon: cc.Sprite = null;
    @property(cc.Label) riseLvCoinCnt: cc.Label = null;
    @property(cc.Node) templateProp: cc.Node = null;
    @property(cc.Node) templateSkill: cc.Node = null;

    private _spLoader: SpriteLoader = null;
    private _heroID: number = 0;
    private _selBeastIdx: number = 0;
    private _propPool: cc.NodePool = new cc.NodePool();
    private _skillPool: cc.NodePool = new cc.NodePool();
    private _baseProps: cc.Node[] = null;
    private _speProps: cc.Node[] = null;
    private _speSkills: cc.Node[] = null;
    private _beastList: data.IBagUnit[] = null;
    private _beastPropCfgMap: Map<number, BeastPropCfgs> = null;
    private _basePropContainorH: number = 0;
    private _spePropContainorH: number = 0;

    private _riseStarView: BeastRiseStarView = null;

    protected onInit(heroID: number): void {
        this._heroID = heroID;
        this._spLoader = this._spLoader || new SpriteLoader();
        this._registerEvents();
        this._genBeastData();
        this._initBeastList();
        this._updateBaseInfo();
    }

    protected onRelease(): void {
        this.unscheduleAllCallbacks();
        this._riseStarView && this._riseStarView.closeView();
        this._riseStarView = null;
        eventCenter.unregisterAll(this);
        this._spLoader && this._spLoader.release();
        this.beastListView.clear();
        if(this._baseProps && this._baseProps.length > 0) {
            this._baseProps.forEach(ele => {
                this._propPool.put(ele);
            });
        }
        this._baseProps = null;

        if(this._speProps && this._speProps.length > 0) {
            this._speProps.forEach(ele => {
                this._propPool.put(ele);
            });
        }
        this._speProps = null;

        if(this._speSkills && this._speSkills.length > 0) {
            this._speSkills.forEach(ele => {
                this._skillPool.put(ele);
            });
        }
        this._speSkills = null;
        this._propPool.clear();
        this._skillPool.clear();
    }

    private _registerEvents() {
        eventCenter.register(heroViewEvent.HERO_DRESS_EQUIP, this, this._onEquipDressed)
        eventCenter.register(heroViewEvent.HERO_UNDRESS_EQUIP, this, this._onEquipUndressed);
        eventCenter.register(bagDataEvent.EQUIP_ENHANCED, this, this._onEquipStreng);
        eventCenter.register(bagDataEvent.EQUIP_BROKE, this, this._onEquipRiseStar);
    }

    // 初始化灵兽列表
    private _initBeastList() {
        this.beastListView.clear();
        if(!this._beastList || this._beastList.length == 0) return;
        let data: GridData[] = this._beastList.map((ele, idx) => { return { key: idx + '', data: idx}});
        this.beastListView.init(data, {
            onInit: (item: ItemBag, data: GridData) => {
                let idx: number = data.data;
                let beastItem = this._beastList[idx];
                let beastCfg: cfg.Beast = configUtils.getBeastConfig(beastItem.ID);
                let itemInfo = {
                    idx: idx,
                    id: beastItem.ID,
                    seq: utils.longToNumber(beastItem.Seq),
                    level: bagDataUtils.getBeastLVByExp(beastItem.EquipUnit.Exp, beastCfg.BeastQuality),
                    star: beastItem.EquipUnit.Star || 0,
                    currEquip: bagDataUtils.checkEquipIsDressed(beastItem),         // 正在装备的武将ID
                    clickHandler: (info: BagItemInfo, type: ITEM_SHOW_TYPE) => {
                        if(info.idx == this._selBeastIdx) return;
                        this._selBeastIdx = info.idx;
                        this.beastListView.getItems().forEach((ele: ItemBag) => {
                            ele.refreshSelect(info.id, info.seq);
                        });
                        this._updateBaseInfo();
                    }
                }
                item.init(itemInfo);
                item.refreshSelect(this._beastList[this._selBeastIdx].ID, this._beastList[this._selBeastIdx].Seq);
            },

            releaseItem: (item: ItemBag) =>{
                ItemBagPool.put(item);
            },
            getItem: ():ItemBag => {
                return ItemBagPool.get();
            }
        });
        this.scheduleOnce(() => {
            this.beastListView.scrollTo({key: this._selBeastIdx+'', data:  this._selBeastIdx});
        });
    }

    // 生成灵兽数据
    private _genBeastData() {
        let beasts = bagData.getItemsByType(BAG_ITEM_TYPE.BEAST);
        this._beastList = beasts;
        this._selBeastIdx = 0;

        if(!beasts || beasts.length == 0) return;

        beasts.sort((a, b) => {
            let aBeastCfg = configUtils.getBeastConfig(a.ID);
            let bBeastCfg = configUtils.getBeastConfig(b.ID);
            if(aBeastCfg.BeastQuality != bBeastCfg.BeastQuality) {
                return bBeastCfg.BeastQuality - aBeastCfg.BeastQuality;
            }

            let aLv = bagDataUtils.getBeastLVByExp(a.EquipUnit.Exp, aBeastCfg.BeastQuality);
            let bLv = bagDataUtils.getBeastLVByExp(b.EquipUnit.Exp, bBeastCfg.BeastQuality);

            if(aLv !=  bLv) {
                return bLv - aLv;
            }
            return bBeastCfg.BeastID - aBeastCfg.BeastID;
        });

        beasts.some((ele, idx) => {
            if(bagDataUtils.checkEquipIsDressed(ele) == this._heroID){
                this._selBeastIdx = idx;
                return true;
            }
            return false;
        });
        this._selBeastIdx == -1 && (this._selBeastIdx = 0);
    }

    //穿戴
    onClickDressBtn() {
        let beastItem = this._beastList[this._selBeastIdx];
        bagDataOpt.sendDressEquip(this._heroID, EQUIP_PART_TYPE.BEAST, utils.longToNumber(beastItem.Seq), beastItem.ID);
    }

    //卸下
    onClickUndressBtn() {
        bagDataOpt.sendUnDressEquip(this._heroID, EQUIP_PART_TYPE.BEAST);
    }

    //替换
    onClickChangeBtn() {
        let beastItem = this._beastList[this._selBeastIdx];
        bagDataOpt.sendDressEquip(this._heroID, EQUIP_PART_TYPE.BEAST, utils.longToNumber(beastItem.Seq), beastItem.ID);
    }

    //强化
    onClickRiseLvBtn() {
        if(!this._beastList || this._selBeastIdx < 0 || this._selBeastIdx >= this._beastList.length) return;
        let beastItem = this._beastList[this._selBeastIdx];
        let beastCfg: cfg.Beast = configUtils.getBeastConfig(beastItem.ID);
        //等级
        let lv = bagDataUtils.getBeastLVByExp(beastItem.EquipUnit.Exp, beastCfg.BeastQuality);
        //星级
        let star = beastItem.EquipUnit.Star || 0;
        let maxLv = commonData.beastMaxLvCfg.get(star);
        //已经升级到当前星级的最大等级
        if(lv >= maxLv) {
            return;
        }

        let materialID: number = 0;
        switch(beastCfg.BeastType) {
          case BEAST_TYPE.FEI_QIN:
              materialID = BEAST_RISE_LV_MATERIAL.FEI_QIN;
              break;
          case BEAST_TYPE.ZOU_SHOU:
              materialID = BEAST_RISE_LV_MATERIAL.ZOU_SHOU;
              break;
          case BEAST_TYPE.SHUI_ZU:
              materialID = BEAST_RISE_LV_MATERIAL.SHUI_ZU;
              break;
        }

        let lvMap = configUtils.getLevelExpConfigsByType(6, beastCfg.BeastQuality);
        let holdCnt = bagData.getItemCountByID(materialID);
        let needCnt =0;
        let needCoin = 0;
        let nextLv = lv;
        let holdCoin = bagData.getItemCountByID(10010001);
        //一键强化
        if(this.onceRiseLvTlg.isChecked) {
            for(let i = lv; i < maxLv; i++) {
                let nextLvCfg = lvMap[i];
                if(needCnt + nextLvCfg.LevelExpNeedNum > holdCnt || needCoin + (nextLvCfg.LevelExpNeedNum * BEAST_MATERIAL_AND_COIN_RATIO) > holdCoin){
                    break;
                }
                nextLv = nextLvCfg.LevelExpLevel + 1;
                needCnt += nextLvCfg.LevelExpNeedNum;
                needCoin = needCnt * BEAST_MATERIAL_AND_COIN_RATIO;
            }
        } else{
            let LvCfg = lvMap[lv];
            needCnt = LvCfg.LevelExpNeedNum;
            nextLv = LvCfg.LevelExpLevel + 1;
            needCoin = needCnt * 2;
        }

        nextLv = Math.min(nextLv, maxLv);

        //升级材料不足
        if(needCnt > holdCnt || nextLv == lv) {
            guiManager.showDialogTips(1000127, materialID);
            return;
        }
        //铜钱不足
        if(needCoin > holdCoin || nextLv == lv) {
            guiManager.showDialogTips(1000033);
            return;
        }

        let item = {...bagData.getItemByID(materialID).Array[0]};
        item.Count = needCnt;
        let materialArr = [item];
        bagDataOpt.sendEnhanceEquipRequest(beastItem, materialArr);
    }

    onClikcRiseStarBtn() {
        if(!this._beastList || this._selBeastIdx < 0 || this._selBeastIdx >= this._beastList.length) return;
        let beastItem = this._beastList[this._selBeastIdx];
        //星级
        let star = beastItem.EquipUnit.Star || 0;
        //已经满星
        if(star == 6) {
            return;
        }
        guiManager.loadView('BeastRiseStarView', this.node, beastItem, this._beastPropCfgMap.get(beastItem.ID),  () => {
            this._riseStarView = null;
        }).then((view: ViewBaseComponent) => {
            this._riseStarView = view as BeastRiseStarView;
        });
    }

    onClickStrongItem(event: cc.Event.EventTouch) {
        let target = event.target;
        // 强化金币
        if(this.riseLvCoinIcon.node == target) {
            moduleUIManager.showItemDetailInfo(10010001,0 ,this.node);
            return;
        }

        // 强化道具
        if(this.riseLvItemIcon.node == target) {
            let beastData: data.IBagUnit = this._beastList[this._selBeastIdx];
            let beastCfg: cfg.Beast = configUtils.getBeastConfig(beastData.ID);
            let materialID: number = 0;
            switch(beastCfg.BeastType) {
                case BEAST_TYPE.FEI_QIN:
                    materialID = BEAST_RISE_LV_MATERIAL.FEI_QIN;
                    break;
                case BEAST_TYPE.ZOU_SHOU:
                    materialID = BEAST_RISE_LV_MATERIAL.ZOU_SHOU;
                    break;
                case BEAST_TYPE.SHUI_ZU:
                    materialID = BEAST_RISE_LV_MATERIAL.SHUI_ZU;
                    break;
            }
            moduleUIManager.showItemDetailInfo(materialID,0 ,this.node);
            return;
        }
    }

    private _updateBaseInfo() {
        let rightPanel = cc.find('rootNode/rightPanel', this.node);
        let leftPanel = cc.find('rootNode/leftPanel', this.node);
        let emptyTip = cc.find('rootNode/empty', this.node);
        let leftBg = cc.find('rootNode/box_bg1', this.node);

        if(!this._beastList || this._selBeastIdx < 0 || this._selBeastIdx >= this._beastList.length) {
            rightPanel.active = false;
            leftPanel.active = false;
            emptyTip.active = true;
            leftBg.active = false;
            return;
        }
        rightPanel.active = leftPanel.active = true;
        emptyTip.active = false;
        leftBg.active = true;
        let beastData: data.IBagUnit = this._beastList[this._selBeastIdx];
        let beastCfg: cfg.Beast = configUtils.getBeastConfig(beastData.ID);
        //品质
        this._spLoader.changeSprite(this.QualitySp, resPathUtils.getHeroPropertyQualityIcon(beastCfg.BeastQuality));
        //类型
        let beastTypes = ['飞禽', '走兽', '水族']
        this._spLoader.changeSprite(this.typeBgSp, resPathUtils.getBeastBgPath(beastCfg.BeastType));
        this._spLoader.changeSprite(this.typeIcon, resPathUtils.getBeastIconPath(beastCfg.BeastType));
        this.TypeLb.string = beastTypes[beastCfg.BeastType - 1];
        //立绘
        this._spLoader.changeSprite(this.modelIconSp, resPathUtils.getBeastModel(beastCfg.BeastShowImage));
        //等级
        let lv = bagDataUtils.getBeastLVByExp(beastData.EquipUnit.Exp, beastCfg.BeastQuality);
        this.lvLb.string = `${lv}级`
        //名称
        this.nameLb.string = beastCfg.BeastName;
        //星级
        let star = beastData.EquipUnit.Star || 0;
        this._updateStar(star);
        let heroID: number = bagDataUtils.checkEquipIsDressed(beastData);
        this._updateBeastHeroImg(heroID);
        this._updateDressBtns(heroID);
        this._updateBaseProps(beastData.ID, lv, star);
        this._updateSpeProps(beastData.ID, lv, star);
        this._updateBeastRiseLvCostInfo(lv, star, beastCfg);
        this._updateBeastRiseStarInfo(star, beastCfg);
    }

    private _updateStar(star: number) {
        star = star || 0;
        for(let i = 0, len = 6; i < len; i++) {
            let starNode = this.starRoot.getChildByName(`star_${i+1}`);
            if(cc.isValid(starNode)) {
                starNode.children[0].active = i < star;
            }
        }
    }

    private _updateBeastRiseStarInfo(star: number, beastCfg: cfg.Beast) {
        let isMaxStar = star >= 6;
        this.btnRiseStar.active = !isMaxStar;
        this.maxStarTip.node.active = isMaxStar;
    }

    private _updateBeastRiseLvCostInfo(lv: number, star: number, beastCfg: cfg.Beast) {
        let maxLv = commonData.beastMaxLvCfg.get(star);
        let isMaxLv = lv >= maxLv;
        this.riseLvItemIcon.node.active = !isMaxLv;
        this.riseLvCoinIcon.node.active = !isMaxLv;
        this.riseLvCoinCnt.node.active = !isMaxLv;
        this.riseLvItemCnt.node.active = !isMaxLv;
        this.btnRiseLv.active = !isMaxLv;
        this.onceRiseLvTlg.node.active =  !isMaxLv;
        this.maxLvTip.node.active = isMaxLv;
        if(isMaxLv) {
            this.maxLvTip.string = star >= 6 ? '灵兽已满级' : '已达等级上限，需升星后继续升级'
            return;
        }
        let materialID: number = 0;
        switch(beastCfg.BeastType) {
          case BEAST_TYPE.FEI_QIN:
              materialID = BEAST_RISE_LV_MATERIAL.FEI_QIN;
              break;
          case BEAST_TYPE.ZOU_SHOU:
              materialID = BEAST_RISE_LV_MATERIAL.ZOU_SHOU;
              break;
          case BEAST_TYPE.SHUI_ZU:
              materialID = BEAST_RISE_LV_MATERIAL.SHUI_ZU;
              break;
        }

        this._spLoader.changeSprite(this.riseLvItemIcon,  resPathUtils.getItemIconPath(materialID));
        this._spLoader.changeSprite(this.riseLvCoinIcon, resPathUtils.getItemIconPath(10010001));

        let lvMap = configUtils.getLevelExpConfigsByType(6, beastCfg.BeastQuality);
        let LvCfg = lvMap[lv];
        let needCnt = LvCfg.LevelExpNeedNum;
        let holdCnt = bagData.getItemCountByID(materialID);
        this.riseLvItemCnt.string =  `${holdCnt >= NUMBER_MAX_V ? `${Math.floor(holdCnt/10000)}万` : holdCnt}/${needCnt >= NUMBER_MAX_V ? `${Math.floor(needCnt/10000)}万` : needCnt}`;
        this.riseLvItemCnt.node.color = cc.color().fromHEX(needCnt > holdCnt ? '#ff0000' : '#8A5E28');

        let needCoin = needCnt * BEAST_MATERIAL_AND_COIN_RATIO;
        let holdCoin = bagData.getItemCountByID(10010001);
        this.riseLvCoinCnt.string = `${holdCoin >= NUMBER_MAX_V ? `${Math.floor(holdCoin/10000)}万` : holdCoin}/${needCoin >= NUMBER_MAX_V ? `${Math.floor(needCoin/10000)}万` : needCoin}`;
        this.riseLvCoinCnt.node.color = cc.color().fromHEX(needCoin > holdCoin ? '#ff0000' : '#8A5E28');
    }

    private _updateBeastHeroImg(heroID: number) {
        //穿戴英雄
        if(heroID) {
            let heroCfg: cfg.HeroBasic = configUtils.getHeroBasicConfig(heroID);
            let url = resPathUtils.getHeroCircleHeadIcon(heroCfg.HeroBasicModel, HEAD_ICON.CIRCLE);
            if(url && url.length > 0) {
                this._spLoader.changeSprite(this.dressedHeroSp, url, (err: any) => {
                    this.dressedHeroSp.node.active = true;
                });
            } else {
                this.dressedHeroSp.node.active = false;
            }
        } else {
            this.dressedHeroSp.node.active = false;
        }
    }

    //更新按钮状态
    private _updateDressBtns(heroID: number) {
        //未穿戴
        if(!heroID) {
            this.btnDress.active = true;
            this.btnUndress.active = false;
            this.btnChange.active = false;
            return;
        }

        //已穿戴
        if(heroID == this._heroID) {
            this.btnDress.active = false;
            this.btnUndress.active = true;
            this.btnChange.active = false;
            return;
        }

        this.btnDress.active = false;
        this.btnUndress.active = false;
        this.btnChange.active = true;
    }

    private _updateBaseProps(beastID: number, lv: number, star: number) {
        let propCfg: BeastPropCfgs = this._getBeastPropCfg(beastID);
        this._baseProps = this._baseProps || [];
        this._basePropContainorH = 0;
        let scrollView = this.basePropContainor.parent.parent.getComponent(cc.ScrollView);
        if(scrollView){
            scrollView.scrollToTop(0, false);
        }
        if(!propCfg || !propCfg.baseProps || propCfg.baseProps.length == 0) {
            this._baseProps.forEach(ele => {
                this._propPool.put(ele);
            })
            this._baseProps.length = 0;
            return;
        }
        let baseProps: BeastBasePropCfg[] = propCfg.baseProps;
        baseProps.forEach((ele, idx) => {
            let propID = ele.propID;
            let baseV = ele.baseV;
            let riseAdd = ele.riseAdd;
            let starBaseV = (riseAdd && star < riseAdd.length) ? riseAdd[star] : 0;

            let curV = baseV + starBaseV * (lv - 1);
            let attrCfg = configUtils.getAttributeConfig(propID);
            let attrDesc = `${attrCfg.Name}：${attrCfg.AttributeValueType == NumberValueType.REAL_VALUE ? curV : `${curV/100}%`}`;
            let node: cc.Node = null;
            if(this._baseProps[idx]){
                node = this._baseProps[idx];
            } else {
                node = this._getPropNode();
                this.basePropContainor.addChild(node);
                this._baseProps.push(node);
            }
            node.getComponent(cc.Label).string = attrDesc;
            let y = Math.floor((idx >> 1)) * -(node.height + 10), x = (idx % 2 == 0 ? -1.6 : 0.6) * (this.basePropContainor.width >> 2);
            node.setPosition(x, y);
            this._basePropContainorH = Math.max(this._basePropContainorH, Math.abs(node.getBoundingBox().yMin));
        });
        if(baseProps.length < this._baseProps.length) {
            let unuseNodes: cc.Node [] = this._baseProps.splice(baseProps.length, this._baseProps.length - baseProps.length);
            unuseNodes.forEach(ele => {
                this._propPool.put(ele);
            });
        }

        if(this._basePropContainorH > this.basePropContainor.parent.height) {
            this.basePropContainor.height = this._basePropContainorH;
        }
    }

    private _updateSpeProps(beastID: number, lv: number, star: number) {
        let propCfg: BeastPropCfgs = this._getBeastPropCfg(beastID);
        this._speProps = this._speProps || [];
        this._speSkills = this._speSkills || [];
        this._spePropContainorH = 0;
        let scrollView = this.spePropContainor.parent.parent.getComponent(cc.ScrollView);
        if(scrollView){
            scrollView.scrollToTop(0, false);
        }
        if(!propCfg || !propCfg.speProps || propCfg.speProps.length == 0) {
            this._speProps.forEach(ele => {
                this._propPool.put(ele);
            })
            this._speProps.length = 0;

            this._speSkills.forEach(ele => {
                this._skillPool.put(ele);
            })
            this._speSkills.length = 0;
            return;
        }

        let speProps: BeastSpePropCfg[] = propCfg.speProps;
        let propNodeIdx: number = 0;
        let skillNodeIdx: number = 0
        speProps.forEach((ele, idx) => {
            let propType = ele.propType;
            if(propType ==  BEASR_SPE_PROP_TYPE.PROP) {
                propNodeIdx = this._setupSpePropNode(ele, star, propNodeIdx);
            } else {
                skillNodeIdx = this._setupSpeSkillNode(ele, star, skillNodeIdx);
            }
        });
        if(propNodeIdx < this._speProps.length) {
            let unuseNodes: cc.Node [] = this._speProps.splice(propNodeIdx, this._speProps.length - propNodeIdx);
            unuseNodes.forEach(ele => {
                this._propPool.put(ele);
            });
        }
        if(skillNodeIdx < this._speSkills.length) {
            let unuseNodes: cc.Node [] = this._speSkills.splice(skillNodeIdx, this._speSkills.length - skillNodeIdx);
            unuseNodes.forEach(ele => {
                this._skillPool.put(ele);
            });
        }

        if(this._spePropContainorH > this.spePropContainor.parent.height) {
            this.spePropContainor.height = this._spePropContainorH;
        }
    }

    private _setupSpePropNode(cfg: BeastSpePropCfg, star: number, nodeIdx: number): number {
        let curV: number = 0;
        let riseAdd = cfg.riseAdd;
        if(star == 0) {
            curV = cfg.propID || 0;
        } else {
            curV = (riseAdd && star < riseAdd.length) ? riseAdd[star - 1] : 0;
        }
        if(!curV) return nodeIdx;
        let yellowCfg = configUtils.getEquipYellowConfig(curV);
        for(let k in HERO_PROP_MAP) {
            let attrName = HERO_PROP_MAP[k];
            if(yellowCfg[attrName]) {
                let attrCfg = configUtils.getAttributeConfig(parseInt(k));
                let attrDesc = `${attrCfg.Name}：${attrCfg.AttributeValueType == NumberValueType.REAL_VALUE ? yellowCfg[attrName] : `${yellowCfg[attrName]/100}%`}`;
                let node: cc.Node = null;
                if(this._speProps[nodeIdx]){
                    node = this._speProps[nodeIdx];
                } else {
                    node = this._getPropNode();
                    this.spePropContainor.addChild(node);
                    this._speProps.push(node);
                }
                node.getComponent(cc.Label).string = attrDesc;
                let y = Math.floor((nodeIdx >> 1)) * -(node.height + 10), x = (nodeIdx % 2 == 0 ? -1.6 : 0.6) * (this.spePropContainor.width >> 2);
                node.setPosition(x, y);
                nodeIdx++;
                this._spePropContainorH = Math.max(this._spePropContainorH, Math.abs(node.getBoundingBox().yMin));
                break;
            }
        }
        return nodeIdx;
    }

    private _setupSpeSkillNode(cfg: BeastSpePropCfg, star: number, nodeIdx: number): number {
        let propID = cfg.propID;
        let riseAdd = cfg.riseAdd;

        if(propID) {
            let skillCfg: cfg.SkillBuff = configUtils.getBuffConfig(propID);
            let skillNode: cc.Node = null;
            if(this._speSkills[nodeIdx]) {
                skillNode = this._speSkills[nodeIdx];
            } else {
                skillNode = this._getSkillNode();
                this.spePropContainor.addChild(skillNode);
                this._speSkills.push(skillNode);
            }

            let starNode = skillNode.getChildByName('star');
            starNode.getComponent(cc.Label).string = `0星`;
            let descNode = skillNode.getChildByName('desc');
            descNode.getComponent(cc.Label).string = skillCfg ? skillCfg.Illustrate : '';
            descNode.getComponent(cc.Label)._forceUpdateRenderData();
            skillNode.height = descNode.height;
            skillNode.setPosition(0,  this._spePropContainorH == 0 ? 0 : -this._spePropContainorH- 10);
            this._spePropContainorH = Math.max(this._spePropContainorH, Math.abs(skillNode.getBoundingBox().yMin));
            nodeIdx ++;
        }

        riseAdd && riseAdd.forEach((ele, idx) => {
            if(!ele) return;
            let changeCfg: cfg.SkillChange = configUtils.getSkillChangeConfig(ele);
            let skillNode: cc.Node = null;
            if(this._speSkills[nodeIdx]) {
                skillNode = this._speSkills[nodeIdx];
            } else {
                skillNode = this._getSkillNode();
                this.spePropContainor.addChild(skillNode);
                this._speSkills.push(skillNode);
            }

            let starNode = skillNode.getChildByName('star');
            starNode.getComponent(cc.Label).string = `${idx}星`;
            let descNode = skillNode.getChildByName('desc');
            descNode.getComponent(cc.Label).string = changeCfg ? changeCfg.Desc : '';
            descNode.getComponent(cc.Label)._forceUpdateRenderData();
            skillNode.height = descNode.height;
            let lastNode = this._speSkills[nodeIdx - 1];
            skillNode.setPosition(0, cc.isValid(lastNode) ? lastNode.getBoundingBox().yMin - 10 : 0);
            skillNode.setPosition(0,  this._spePropContainorH == 0 ? 0 : -this._spePropContainorH- 10);
            nodeIdx ++;
            this._spePropContainorH = Math.max(this._spePropContainorH, Math.abs(skillNode.getBoundingBox().yMin));
        })

        return nodeIdx;
    }

    private _getPropNode() {
        if(this._propPool.size() > 0){
            return this._propPool.get();
        }

        let node = cc.instantiate(this.templateProp);
        node.active = true;
        return node;
    }

    private _getSkillNode() {
        if(this._skillPool.size() > 0){
            return this._skillPool.get();
        }

        let node = cc.instantiate(this.templateSkill);
        node.active = true;
        return node;
    }

    private _getBeastPropCfg(beastID: number) {
        if(this._beastPropCfgMap && this._beastPropCfgMap.has(beastID)) {
            return this._beastPropCfgMap.get(beastID);
        }

        this._beastPropCfgMap = this._beastPropCfgMap || new Map();
        let beastCfg: cfg.Beast = configUtils.getBeastConfig(beastID);

        let beastPropCfg: BeastPropCfgs = this._genBeastBasePropCfg(null, beastCfg.BeastPropertyValue1, beastCfg.BeastValueLevelAdd1);
        beastPropCfg = this._genBeastBasePropCfg(beastPropCfg, beastCfg.BeastPropertyValue2, beastCfg.BeastValueLevelAdd2);
        beastPropCfg = this._genBeastBasePropCfg(beastPropCfg, beastCfg.BeastPropertyValue3, beastCfg.BeastValueLevelAdd3);
        beastPropCfg = this._genBeastBasePropCfg(beastPropCfg, beastCfg.BeastPropertyValue4, beastCfg.BeastValueLevelAdd4);

        beastPropCfg = this._genBeastSpePropCfg(beastPropCfg, BEASR_SPE_PROP_TYPE.PROP, beastCfg.BeastSpecialPropertyValue, beastCfg.BeastSpecialValueStarAdd);
        beastPropCfg = this._genBeastSpePropCfg(beastPropCfg, BEASR_SPE_PROP_TYPE.SKILL, beastCfg.BeastSkill + '', beastCfg.BeastSkillChange);

        this._beastPropCfgMap.set(beastID, beastPropCfg);
        return beastPropCfg;
    }

    // 解析基础属性
    private _genBeastBasePropCfg(beastPropCfg: BeastPropCfgs, baseProp: string, addProp: string): BeastPropCfgs {
        if(baseProp && baseProp.length > 0) {
            let prop1 = utils.parseStringTo1Arr(baseProp, ';');
            let propK = parseInt(prop1[0]), propV = parseFloat(prop1[1]);
            let propAdd: number[] = null;
            if(addProp && addProp.length > 0) {
                propAdd = utils.parseStringTo1Arr(addProp).map(ele=> {
                    return parseFloat(ele);
                })
            }
            beastPropCfg = beastPropCfg || {};
            beastPropCfg.baseProps = beastPropCfg.baseProps || [];
            beastPropCfg.baseProps.push({propID: propK, baseV: propV, riseAdd: propAdd});
        }
        return beastPropCfg;
    }

    // 解析特殊属性和技能
    private _genBeastSpePropCfg(beastPropCfg: BeastPropCfgs,type: BEASR_SPE_PROP_TYPE, speProp: string, speAddProp: string): BeastPropCfgs {
        let props: BeastSpePropCfg[] = null;
        if(speProp && speProp.length > 0) {
            utils.parseStingList(speProp, (propArr: string[]) => {
                if(!propArr) return;
                if(!Array.isArray(propArr)) propArr = [propArr];
                if(propArr.length == 0) return;
                props = props || [];
                propArr.forEach((ele, idx) => {
                    if(idx < props.length){
                        props[idx].propType = type;
                        props[idx].propID = parseInt(ele);
                    } else {
                        props.push({propType: type, propID: parseInt(ele)})
                    }
                });
            });
        }

        if(speAddProp && speAddProp.length > 0) {
            utils.parseStingList(speAddProp, (propArr: string[], idx: number) => {
                if(!propArr) return;
                if(!Array.isArray(propArr)) propArr = [propArr];
                if(propArr.length == 0) return;
                props = props || [];
                propArr.forEach((ele, index) => {
                    if(index < props.length){
                        props[index].propType = type;
                        props[index].riseAdd = props[index].riseAdd || [];
                    } else {
                        props.push({propType: type, riseAdd:[]});
                    }

                    if(idx <  props[index].riseAdd.length) {
                        props[index].riseAdd[idx] = parseInt(ele);
                    } else {
                        props[index].riseAdd.push(parseInt(ele));
                    }
                });
            });
        }

        if(props && props.length > 0) {
            beastPropCfg = beastPropCfg || {};
            beastPropCfg.speProps = beastPropCfg.speProps || [];
            beastPropCfg.speProps.splice(beastPropCfg.speProps.length, 0, ...props);
        }

        return beastPropCfg;
    }

    private _onEquipDressed(event: number, data: gamesvr.IHeroEquipRes ) {
        if(!data || data.HeroID != this._heroID || data.Positon != EQUIP_PART_TYPE.BEAST) return;
        let visibleItems: Map<string, ItemBag> = this.beastListView.getItems() as Map<string, ItemBag>;
        visibleItems.forEach((ele, idx) => {
            let beastUnit = this._beastList[parseInt(idx)];
            if(beastUnit.ID == data.EquipID && utils.longToNumber(beastUnit.Seq) == utils.longToNumber(data.EquipSeq)) {
                ele.info.currEquip = data.HeroID;
                ele.init(ele.info);
            }else if( ele.info.currEquip && ele.info.currEquip == data.HeroID){
                ele.info.currEquip = bagDataUtils.checkEquipIsDressed({ID: ele.info.id, Seq: ele.info.seq});
                ele.init(ele.info);
            }
        });
        let curSelBeast = this._beastList[this._selBeastIdx];
        if(curSelBeast && curSelBeast.ID == data.EquipID && utils.longToNumber(curSelBeast.Seq) == utils.longToNumber(data.EquipSeq)) {
            this._updateBeastHeroImg(data.HeroID);
            this._updateDressBtns(data.HeroID);
        }
    }

    private _onEquipUndressed(event: number, data: gamesvr.IHeroUnequipRes ) {
        if(!data || data.HeroID != this._heroID || data.Positon != EQUIP_PART_TYPE.BEAST) return;
        let visibleItems: Map<string, ItemBag> = this.beastListView.getItems() as Map<string, ItemBag>;
        visibleItems.forEach((ele, idx) => {
            if(ele.info && ele.info.currEquip && ele.info.currEquip == data.HeroID) {
                ele.info.currEquip = 0;
                ele.init(ele.info);
            }
        });

        let curSelBeast = this._beastList[this._selBeastIdx];
        let heroID: number = bagDataUtils.checkEquipIsDressed(curSelBeast);
        this._updateBeastHeroImg(heroID);
        this._updateDressBtns(heroID);
    }

    private _onEquipStreng(event: number, data:gamesvr.IEnhanceEquipmentRes) {
        if(!data) return;
        let visibleItems: Map<string, ItemBag> = this.beastListView.getItems() as Map<string, ItemBag>;
        let beastCfg = configUtils.getBeastConfig(data.ID);
        let lv = bagDataUtils.getBeastLVByExp(data.Exp, beastCfg.BeastQuality);
        visibleItems.forEach((ele, idx) => {
            if(ele.info && ele.info.id == data.ID && ele.info.seq == data.Seq) {
                ele.info.level = lv;
                ele.init(ele.info);
            }
        });

        let curSelBeast = this._beastList[this._selBeastIdx];
        if(curSelBeast.ID == data.ID && utils.longToNumber(curSelBeast.Seq) == utils.longToNumber(data.Seq)) {
            this.lvLb.string =  `${lv}级`;
            this._updateBaseProps(data.ID, lv, curSelBeast.EquipUnit.Star);
            this._updateBeastRiseLvCostInfo(lv, curSelBeast.EquipUnit.Star, beastCfg);
        }
        guiManager.showDialogTips(1000034);
    }

    private _onEquipRiseStar(event: number, data: gamesvr.IEnhanceEquipmentRes) {
        let visibleItems: Map<string, ItemBag> = this.beastListView.getItems() as Map<string, ItemBag>;
        visibleItems.forEach((ele, idx) => {
            if(ele.info && ele.info.id == data.ID && ele.info.seq == data.Seq) {
                ele.info.star += 1;// 目前只能逐级升星，所以星级自增
                ele.init(ele.info);
            }
        });
        this._genBeastData();
        this._initBeastList();
        let curSelBeast = this._beastList[this._selBeastIdx];
        let beastCfg = configUtils.getBeastConfig(data.ID);
        let lv = bagDataUtils.getBeastLVByExp(data.Exp, beastCfg.BeastQuality);
        this._updateBeastRiseLvCostInfo(lv, curSelBeast.EquipUnit.Star, beastCfg);
        if(curSelBeast.ID == data.ID && utils.longToNumber(curSelBeast.Seq) == utils.longToNumber(data.Seq)) {
            this._updateStar(curSelBeast.EquipUnit.Star);
            this._updateBaseProps(data.ID, lv, curSelBeast.EquipUnit.Star);
            this._updateSpeProps(curSelBeast.ID, lv, curSelBeast.EquipUnit.Star);
            this._updateBeastRiseStarInfo(curSelBeast.EquipUnit.Star, beastCfg);
        }
    }
}

interface BeastBasePropCfg {
    propID: number,
    baseV: number,
    riseAdd?: number[],
}

interface BeastSpePropCfg {
    propType: BEASR_SPE_PROP_TYPE,     // 属性类型  1：属性  2：技能
    propID?: number,
    riseAdd?: number[]
}

interface BeastPropCfgs {
    baseProps? : BeastBasePropCfg[],
    speProps?:  BeastSpePropCfg[]
}

export {
    BEASR_SPE_PROP_TYPE,
    BeastBasePropCfg,
    BeastSpePropCfg,
    BeastPropCfgs
}
