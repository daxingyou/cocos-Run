import { ALLTYPE_TYPE, EQUIP_PART_TYPE, HEAD_ICON, QUALITY_TYPE } from "../../../app/AppEnums";
import { utils } from "../../../app/AppUtils";
import { bagDataUtils } from "../../../app/BagDataUtils";
import { configUtils } from "../../../app/ConfigUtils";
import { resPathUtils } from "../../../app/ResPathUrlUtils";
import { eventCenter } from "../../../common/event/EventCenter";
import { bagDataEvent, commonEvent } from "../../../common/event/EventData";
import { localStorageMgr, SAVE_TAG } from "../../../common/LocalStorageManager";
import { logger } from "../../../common/log/Logger";
import { redDotMgr, RED_DOT_MODULE } from "../../../common/RedDotManager";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { cfg } from "../../../config/config";
import { gamesvr } from "../../../network/lib/protocol";
import HeroUnit from "../../template/HeroUnit";
import ItemRedDot from "../view-item/ItemRedDot";
import ItemRoleSpine from "../view-item/ItemRoleSpine";
import HeroView from "./HeroView";

const { ccclass, property } = cc._decorator;
const SPINE_TAG = "HERO_VIEW_ROLE"
const enum ADVANCE_STATE {
    COMPOUND,
    ADVANCE,
    REFINER
}

const COLOR_GREEN = cc.color().fromHEX("#44E647");
const COLOR_RED = cc.color().fromHEX("#E53737");
const LEFT_OFFSET_X = -360
@ccclass
export default class HeroRoleComp extends cc.Component {
    @property(cc.Sprite)            qualityIconSp: cc.Sprite = null;
    @property(cc.Label)             nameLb: cc.Label = null;
    @property(cc.Label)             powerLb: cc.Label = null;
    @property(cc.Sprite)            trigramsSp: cc.Sprite = null;
    @property(cc.Sprite)            equipTypeSp: cc.Sprite = null;
    @property(cc.Sprite)            abilityTypeSp: cc.Sprite = null;

    @property(cc.Node)              advanceNode: cc.Node = null;
    @property(sp.Skeleton)          advanceEff: sp.Skeleton = null;
    @property(cc.Sprite)            advanceTipsSp: cc.Sprite = null;
    @property([cc.SpriteFrame])     advanceTipsSFs: cc.SpriteFrame[] = []

    @property(cc.Sprite)            heroPieceSP: cc.Sprite = null;
    @property(cc.Node)              starsNode: cc.Node = null;
    @property(cc.Sprite)            heroImg: cc.Sprite = null;
    @property(cc.Node)              spineParent: cc.Node = null;
    @property(ItemRedDot)           advanceRedDot: ItemRedDot = null;
    @property(ItemRedDot)           detailBtnRedDot: ItemRedDot = null;
    @property(ItemRoleSpine)        roleSpine: ItemRoleSpine = null;
    @property(cc.Node)              equipPreviewNode: cc.Node = null;
    @property([cc.SpriteFrame])     equipQualitySfs: cc.SpriteFrame[] = [];
    @property(cc.Node)              ndLeft: cc.Node = null;
    @property(cc.Node)              growTip: cc.Node = null;

    @property({ type: cc.Label, tooltip: '进阶碎片数量'}) advanceNumLb: cc.Label = null;


    private _spriteLoader: SpriteLoader = null
    private _currHero: number = 0;

    private _root: HeroView = null

    onInit (root: HeroView) {
        if ((cc.winSize.height/cc.winSize.width) < 720/1280) {
            this.ndLeft.x = LEFT_OFFSET_X - 60
        }

        this._root = root;
        this._spriteLoader = new SpriteLoader()
        eventCenter.register(commonEvent.UPDATE_CAPABILITY, this, this.refreshCapability);
        eventCenter.register(bagDataEvent.ITEM_CHANGE, this, this._updateHeroChipCnt);
    }
    
    deInit () {
        eventCenter.unregisterAll(this);
        this._releaseSpine();
        this._spriteLoader.release();
        this.advanceRedDot.deInit();
        this.detailBtnRedDot.deInit();
    }
     
    onClickIntroduceBtn() {
        this._root.loadHeroSubView('HeroIntroduceView', 2, this._currHero);
    }

    onClickGrowTipsToogle () {
        if (this.growTip.active) {
            this.growTip.active = false;
            if(this._currHero) {
                localStorageMgr.setAccountStorage(SAVE_TAG.GROW_TIPS + this._currHero, 1)
            }
        } else {
            this.growTip.active = true;
            if(this._currHero) {
                localStorageMgr.setAccountStorage(SAVE_TAG.GROW_TIPS + this._currHero, 0)
            }
        }
        redDotMgr.fire(RED_DOT_MODULE.HERO_DETAIL_BUTTON);
        redDotMgr.fire(RED_DOT_MODULE.HERO_GIFT_TOGGLE);
        redDotMgr.fire(RED_DOT_MODULE.HERO_EQUIP_TOGGLE);
        redDotMgr.fire(RED_DOT_MODULE.HERO_ITEM, `${this._currHero}`)
        redDotMgr.fire(RED_DOT_MODULE.HERO_EQUIP_DRESS_TOGGLE, `${this._currHero}`);
        redDotMgr.fire(RED_DOT_MODULE.HERO_GIF_ICON, `${this._currHero}`);
    }

    updateRole (heroId: number) {
        if(!heroId) return;
        if (this._currHero == heroId) return;
        this._currHero = heroId;
        this._updateBase(heroId);
        this.updateStatueInfo(heroId);
        this.updateEquipPreview();
        this.refreshCapability();
        this._refreshGrowTips();
    }

    private _updateBase (heroId: number) {
        let heroUnit: HeroUnit = new HeroUnit(heroId);
        // 英雄品质icon
        let heroPropQualityUrl = resPathUtils.getHeroPropertyQualityIcon(heroUnit.heroCfg.HeroBasicQuality);
        this._spriteLoader.changeSprite(this.qualityIconSp, heroPropQualityUrl);
        // 名字显示
        this.nameLb.string = `${heroUnit.heroCfg.HeroBasicName}`;

        // 角色
        this._updateSpine(heroUnit.heroCfg.HeroBasicModel);

        // 更换卦象icon
        let trigramsAllTypeConfig = configUtils.getAllTypeConfig(ALLTYPE_TYPE.HERO_TRIGRAMS, heroUnit.heroCfg.HeroBasicTrigrams);
        let trigramsIconUrl = resPathUtils.getHeroAllTypeIconUrl(trigramsAllTypeConfig.HeroTypeIcon);
        this._spriteLoader.changeSprite(this.trigramsSp, trigramsIconUrl);

        // 更换装备类型icon
        let heroEquipTypeAllTypeConfig = configUtils.getAllTypeConfig(ALLTYPE_TYPE.HERO_EQUIP_TYPE, heroUnit.heroCfg.HeroBasicEquipType);
        let equipTypeIconUrl = resPathUtils.getHeroAllTypeIconUrl(heroEquipTypeAllTypeConfig.HeroTypeIcon);
        this._spriteLoader.changeSprite(this.equipTypeSp, equipTypeIconUrl);
        
        // 英雄定位
        let heroAbilityAllTypeConfig = configUtils.getAllTypeConfig(ALLTYPE_TYPE.HERO_ABILITY, heroUnit.heroCfg.HeroBasicAbility);
        let abilityIconUrl = resPathUtils.getHeroAllTypeIconUrl(heroAbilityAllTypeConfig.HeroTypeIcon2);
        this._spriteLoader.changeSprite(this.abilityTypeSp, abilityIconUrl);
    }

    _updateHeroChipCnt(cmd: number, msg: gamesvr.ItemChangeNotify){
        if(!msg || !msg.Units || msg.Units.length == 0 || !this._currHero) return;
        let bagUnits = msg.Units;
        let heroCfg = configUtils.getHeroBasicConfig(this._currHero);
        if(!heroCfg) return;
        let heroChipID = heroCfg.HeroBasicItem;
        let isChipChanged = bagUnits.some(ele => {
            if(ele.ID == heroChipID){
                return true;
            }
            return false;
        });

        if(!isChipChanged) return;
        this.updateHeroChipCnt();
    }

    updateHeroChipCnt(){
        if(!this._currHero) return;
        let heroUnit: HeroUnit = new HeroUnit(this._currHero);
        // 展示英雄碎片
        let roleChipCount: number = bagDataUtils.getHeroChipCnt(this._currHero);
        let isShowAdvanceEff: boolean = false;

        let advanceLabelColor = cc.Color.WHITE;
        let advanceLabelStr = '';
        if (heroUnit.isHeroBasic) {
            // 更换碎片头像
            if(heroUnit.star >= 6) {
                this.advanceTipsSp.spriteFrame = this.advanceTipsSFs[ADVANCE_STATE.REFINER];
                advanceLabelColor = COLOR_GREEN;
                advanceLabelStr = `${roleChipCount}`
            } else {
                this.advanceTipsSp.spriteFrame = this.advanceTipsSFs[ADVANCE_STATE.ADVANCE];
                let curNeedChipCount: number = bagDataUtils.getHeroNeedChipCount(heroUnit.basicId);
                advanceLabelStr = `${roleChipCount}/${curNeedChipCount}`;
                if (roleChipCount >= curNeedChipCount) {
                    advanceLabelColor = COLOR_GREEN;
                    isShowAdvanceEff = true;
                } else {
                    advanceLabelColor = COLOR_RED; 
                }
            }
        } else {
            this.advanceTipsSp.spriteFrame = this.advanceTipsSFs[ADVANCE_STATE.COMPOUND];
            let curNeedChipCount: number = bagDataUtils.getHeroNeedChipCount(heroUnit.basicId);
            advanceLabelStr = `${roleChipCount}/${curNeedChipCount}`;
            advanceLabelColor = bagDataUtils.checkHeroMerge(heroUnit.basicId) ? COLOR_GREEN: COLOR_RED;
        }
        this.advanceNumLb.node.color = advanceLabelColor;
        this.advanceNumLb.string = advanceLabelStr;
        cc.isValid(this.advanceEff) && (this.advanceEff.node.active = isShowAdvanceEff);
    }

    updateStatueInfo (heroId: number) {
        let heroUnit: HeroUnit = new HeroUnit(heroId);
        if(!heroUnit || !heroUnit.basicId) return;

        let jinjieNode = this.advanceNode.getChildByName('Button_jinjie');
        let compoundNode = this.advanceNode.getChildByName('Button_compound');
        jinjieNode.active = heroUnit.isHeroBasic;
        compoundNode.active = !heroUnit.isHeroBasic;

        this.updateHeroChipCnt();

        // 星级展示
        for(let i = 0; i < this.starsNode.childrenCount; ++i) {
            this.starsNode.children[this.starsNode.childrenCount - 1 - i].active = i < heroUnit.star;
        }

        let heroHeadUrl = resPathUtils.getHeroCircleHeadIcon(heroUnit.heroCfg.HeroBasicModel, HEAD_ICON.CIRCLE);
        if(heroHeadUrl) {
            this._spriteLoader.changeSprite(this.heroPieceSP, heroHeadUrl);
        }
    }

    //更新红点
    updateRedots(){
        this.advanceRedDot.setData(RED_DOT_MODULE.HERO_ADVANCE, {
            args: [this._currHero]
        } );
        this.detailBtnRedDot.setData(RED_DOT_MODULE.HERO_DETAIL_BUTTON, {
            args: [this._currHero]
        });
    }

    refreshCapability () {
        if(!this._currHero) return;
        let heroUnit: HeroUnit = new HeroUnit(this._currHero);
        // 刷新战力值
        this.powerLb.string = `${heroUnit && heroUnit.isHeroBasic ? heroUnit.getCapability() : 0}`;
    }

    private _refreshGrowTips () {
        if(!this._currHero) return;
        let locol = localStorageMgr.getAccountStorage(SAVE_TAG.GROW_TIPS + this._currHero);
        if (locol && locol == 1)  this.growTip.active = false;
        else this.growTip.active = true;
    }

    //设置对应位置装备品质
    private _setEquipPreview(nodeName: string, quality: number){
        let equipNode = cc.find(nodeName, this.equipPreviewNode);
        if(!cc.isValid(equipNode)) return;
        equipNode.getComponent(cc.Sprite).spriteFrame = this.equipQualitySfs[quality];
    }

    //刷新装备预览
    updateEquipPreview(){
        if(!this._currHero) return;
        let heroUnit: HeroUnit = new HeroUnit(this._currHero);
        //装备预览
        let equips = heroUnit.getHeroEquips();

        let equipNodeNames = ['equip', 'chest', 'helmet', 'boot', 'ring', 'kicknick', 'exclusive'];
        equipNodeNames.forEach(ele => {
            this._setEquipPreview(ele, 0);
        })

        //是否有专属
        cc.find(equipNodeNames[equipNodeNames.length - 1], this.equipPreviewNode).active = heroUnit.heroCfg.HeroBasicQuality >= QUALITY_TYPE.SSR;
        if(!equips)  return;

        for(let k in equips){
            if(equips.hasOwnProperty(k)){
                let equip = equips[k];
                let equipCfg = configUtils.getEquipConfig(equip.ID);
                if(!equipCfg) continue;
                let nodeIdx = equipCfg.PositionType - 1;
                let quality = equipCfg.Quality;
                this._setEquipPreview(equipNodeNames[nodeIdx], quality - 1);
            }
        }
    }

    private _updateSpine (modelID: number) {
        let modelCfg = configUtils.getModelConfig(modelID);
        if(!modelCfg) {
            logger.error('ItemHeroShow modelCfg error:', modelID);
            return;
        }
        let changeSizeCb = (node: cc.Node, sizeList: string[]) => {
                let size = cc.v2(((Number(sizeList[0]) / 10000) || 1) , ((Number(sizeList[1]) / 10000) || 1));
                node.setScale(size);
                let pos = cc.v2(Number(sizeList[2]) || 0, Number(sizeList[3]) || 0);
                node.setPosition(pos);
        }
        if(modelCfg.ModelLive2d) {
            this.heroImg.node.active = false;
            this.spineParent.active = true;
            let spineUrl: string = resPathUtils.getModelLive2dPath(modelCfg.ModelLive2d);
            this._loadModelSpine(spineUrl, modelCfg);
            return;
        } else if(modelCfg.ModelPhoto) {
            this.heroImg.node.active = true;
            this.spineParent.active = false;
            if(this.heroImg.spriteFrame) {
                this._spriteLoader.deleteSprite(this.heroImg);
            }
            this._releaseSpine();
            let url = resPathUtils.getModelPhotoPath(modelID);
            this._spriteLoader.changeSpriteP(this.heroImg, url).then(() => {
                let sizeList = utils.parseStingList(modelCfg.ModelPhotoSize);
                changeSizeCb(this.heroImg.node, sizeList);
            }).catch((err) => {
                logger.error(err);
                this._spriteLoader.deleteSprite(this.heroImg);
            });
            return;
        }
    }

    private _loadModelSpine(url: string, modelCfg: cfg.Model) {
        let modelSizeList = utils.parseStingList(modelCfg.ModelLive2dSize);
        let spScale = cc.v2(parseInt(modelSizeList[0]) / 10000, parseInt(modelSizeList[1]) / 10000);
        let spPos = cc.v3(parseInt(modelSizeList[2]), parseInt(modelSizeList[3]), 0);

        this.roleSpine.init(url, {
            scale: spScale.x,
            position: spPos,
            anima: 'animation', 
            loop: true,
        }, null, SPINE_TAG)
    }

    private _releaseSpine() {
        this.roleSpine.deInit()
    }

}