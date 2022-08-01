import { ALLTYPE_TYPE, HEAD_ICON } from "../../../app/AppEnums";
import { utils } from "../../../app/AppUtils";
import { bagDataUtils } from "../../../app/BagDataUtils";
import { configUtils } from "../../../app/ConfigUtils";
import { resPathUtils } from "../../../app/ResPathUrlUtils";
import { eventCenter } from "../../../common/event/EventCenter";
import { RED_DOT_MODULE, RED_DOT_TYPE } from "../../../common/RedDotManager";
import { ItemQualityPool } from "../../../common/res-manager/NodePool";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { cfg } from "../../../config/config";
import { bagData } from "../../models/BagData";
import { pveFakeData } from "../../models/PveFakeData";
import HeroUnit from "../../template/HeroUnit";
import ItemQualityEffect, { QUALITY_EFFECT_TYPE } from "../view-item/ItemQualityEffect";
import ItemRedDot from "../view-item/ItemRedDot";

const { ccclass, property } = cc._decorator;

const HERO_MAX_STARS = 6;

@ccclass
export default class HeroListItem extends cc.Component {
    @property({ type: cc.Sprite, tooltip: '英雄品质框' })       heroQualityCircleSp: cc.Sprite = null;
    @property({ type: cc.Sprite, tooltip: '英雄头像' })         heroHeadSp: cc.Sprite = null;
    @property({ type: cc.Sprite, tooltip: '英雄类型底' })       heroTypeBGSp: cc.Sprite = null;
    @property({ type: cc.Sprite, tooltip: '英雄类型Icon' })     heroTypeSp: cc.Sprite = null;
    @property({ type: cc.Node, tooltip: '星级特效父节点' })     levelStarEffectParent: cc.Node = null;
    @property({ type: cc.Node, tooltip: '星级父节点' })         levelStarParent: cc.Node = null;
    @property({ type: cc.Sprite, tooltip: '星级背景图' })       levelStarBG: cc.Sprite = null;
    @property({ type: cc.Node, tooltip: '未合成的蒙版' })       lockStateNode: cc.Node = null;
    @property({ type: cc.Node, tooltip: '满足合成时的提示' })   canUnlockTips: cc.Node = null;
    @property(cc.Label)                                         chipCountLb: cc.Label = null;
    @property({ type: cc.Label, tooltip: '等级' })              heroLvLb: cc.Label = null;
    @property(cc.Label)                                         nameLb: cc.Label = null;
    @property(cc.Node)                                          newIcon: cc.Node = null;
    @property(ItemRedDot)                                       itemRedDot: ItemRedDot = null;  
    @property(cc.Node)                                          skeNode: cc.Node = null;

    private _spriteLoader: SpriteLoader = new SpriteLoader();
    private _heroId: number = null;
    private _fake: boolean = false;         //假玩家
    private _onlyShow: boolean = false;     //假玩家
    private _itemQuality: ItemQualityEffect = null;
    private _isGray: boolean = null;       // 变灰标志变量

    set onlyShow(val: boolean){
        this._onlyShow = val;
    }

    init () {
    
    }

    deInit () {
        this.itemRedDot.deInit();
        this.unscheduleAllCallbacks();
        eventCenter.unregisterAll(this);
        this._releaseEffect()
        if (this._spriteLoader) {
            this._spriteLoader.release();
        }
    }

    get heroID(){
        return this._heroId;
    }

    isFakeHero(){
        return this._heroId && this._fake;
    }

    unuse() {
        this.deInit();
    }

    private _releaseEffect () {
        if(this._itemQuality && cc.isValid(this._itemQuality)) {
            ItemQualityPool.put(this._itemQuality);
            this._itemQuality = null;
        }
        
        this.levelStarEffectParent.children.forEach(eleNode => {
            eleNode.getComponent(sp.Skeleton).clearTracks();
            eleNode.active = false;
        });
    }

    setData(heroId: number, moduleName?: RED_DOT_MODULE, fake?: boolean) {
        this._heroId = heroId;
        this._fake = fake;
        this.refreshView(moduleName);
    }

    refreshView(moduleName: RED_DOT_MODULE) {
        let heroUnit: HeroUnit = this._fake ? pveFakeData.getFakeHeroById(this._heroId) : bagData.getHeroById(this._heroId) || new HeroUnit(this._heroId);
        if (heroUnit && (heroUnit.isHeroBasic || this._onlyShow)) {
            this.lockStateNode.active = false;
            this.canUnlockTips.active = false;
            this.setNodeGray(this.node, this._onlyShow && !heroUnit.isHeroBasic, true);
            this.refreshStarView(heroUnit);
        } else {
            this.levelStarBG.node.active = false;
            this.lockStateNode.active = true;
            this.chipCountLb.string = `${this._getBagChipCount()}/${this._getHeroUnlockCount()}`
            // 可以合成
            this.canUnlockTips.active = this._checkHeroMerge();
        }
        this.nameLb.string = heroUnit.heroCfg.HeroBasicName;
        // 根据英雄品质 显示不同的品质框
        let headQualityUrl = resPathUtils.getQualityHeroListBg(heroUnit.heroCfg.HeroBasicQuality, 'heroBg');
        this._spriteLoader.changeSprite(this.heroQualityCircleSp, headQualityUrl);
        // 定位标签的底
        let nameBgUrl = resPathUtils.getQualityHeroListBg(heroUnit.heroCfg.HeroBasicQuality, 'nameBg');
        this._spriteLoader.changeSprite(this.heroTypeBGSp,nameBgUrl );
        // 显示英雄定位标签
        let abilityIconUrl = resPathUtils.getHeroAllTypeIconUrl(configUtils.getAllTypeConfig(ALLTYPE_TYPE.HERO_ABILITY, heroUnit.heroCfg.HeroBasicAbility).HeroTypeIcon);
        this._spriteLoader.changeSprite(this.heroTypeSp, abilityIconUrl);
        // 显示英雄头像
        let heroHeadUrl = resPathUtils.getItemIconPath(heroUnit.basicId, HEAD_ICON.BIG);      
        this._spriteLoader.changeSprite(this.heroHeadSp, heroHeadUrl);
        // 假英雄禁用列表组件
        if (this._fake || this._onlyShow) {
            
        }
        
        // 英雄地图 品质特效
        if (this._onlyShow && !heroUnit.isHeroBasic){
            this._releaseEffect()
        } else {
            let effectType = QUALITY_EFFECT_TYPE.HERO_LIST;
            if (!this._itemQuality) {
                this._itemQuality = ItemQualityPool.get();
                this.skeNode.addChild(this._itemQuality.node)
            }
            this._itemQuality.onInit(heroUnit.heroCfg.HeroBasicQuality, cc.size(116, 189), effectType);
        }

        if(!moduleName) return;
        // 新到英雄
        this.itemRedDot.setData(moduleName, {
            redDotType: RED_DOT_TYPE.NORMAL,
            args: [this._heroId],
            subName: this._heroId + ''
        });
        // 添加英雄标签地图特效
        // if(this._itemQualityEffectTag) {
        //     this._itemQualityEffectTag.onInit(heroUnit.heroCfg.HeroBasicQuality);
        // } else {
        //     guiManager.loadView(VIEW_NAME.ITEM_QUALITY_EFFECT, this.heroTypeBGSp.node, heroUnit.heroCfg.HeroBasicQuality, cc.size(29, 72), QUALITY_EFFECT_TYPE.TAG).then(viewBase => {
        //         this._itemQualityEffectTag = viewBase as ItemQualityEffect;
        //     });
        // }
    }

    refreshStarView(heroUnit: HeroUnit) { 
        if (!heroUnit) {
            this.levelStarBG.node.active = false;
            return;
        }

        let starBgUrl = resPathUtils.getQualityHeroListBg(heroUnit.heroCfg.HeroBasicQuality, 'starBg');
        this._spriteLoader.changeSprite(this.levelStarBG, starBgUrl);

        this.levelStarBG.node.active = true;
        let star = heroUnit.star;
        for(let i = 0; i < HERO_MAX_STARS; ++i) {
            let starName = `SSR_bk_xx${i}`;
            let starBG = this.levelStarParent.getChildByName(starName);
            let starEffectNode = this.levelStarEffectParent.getChildByName(starName);
            let isShow: boolean = i < star;
            starBG.active = isShow;

            let isEffectShow = heroUnit.isHeroBasic && isShow;;
            starEffectNode.active = isEffectShow;
            if(isEffectShow){
                starEffectNode.getComponent(sp.Skeleton).setAnimation(0, 'animation', true);
            }
        }
    }

    private _checkHeroMerge() {
        if (this._fake) {
            return false
        }

        return bagDataUtils.checkHeroMerge(this._heroId);
    }
    
    private _getChipId(id: number) {
        let cfg = configUtils.getHeroBasicConfig(id);
        return cfg.HeroBasicItem;
    }

    private _getBagChipCount() {
        let bagItemCount: number = utils.longToNumber(bagData.getItemByID(this._getChipId(this._heroId)).Array[0].Count) || 0;
        return bagItemCount;
    }

    private _getHeroUnlockCount() {
        let cfgs: cfg.HeroBasic = configUtils.getHeroBasicConfig(this._heroId);
        let needList = utils.parseStingList(configUtils.getModuleConfigs().HeroOpenNeedPiece);
        let needCount: number = 0;
        for (let i = 0; i < needList.length; ++i) {
            if (needList[i][0] == cfgs.HeroBasicQuality) {
                needCount = Number(needList[i][1]);
            }
        }
        return needCount;
    }

    setNodeGray(node: cc.Node, gray?: boolean, isParent?: boolean) {
        // 避免从对象池拿出，重复设置材质引起的消耗
        if (isParent) {
            if (this._isGray === gray) {
                return;
            }
            this._isGray = gray;
        }

        let materialGrey: cc.Material = gray ? cc.Material.getBuiltinMaterial('2d-gray-sprite') : cc.Material.getBuiltinMaterial('2d-sprite');
        let nodeSprComp = node.getComponent(cc.Sprite);
        let nodeLbComp = node.getComponent(cc.Sprite);
        let nodeSpComp = node.getComponent(sp.Skeleton);
        if (node && (nodeSprComp || nodeLbComp || nodeSpComp)){
            nodeSprComp && nodeSprComp.setMaterial(0, materialGrey);
            nodeLbComp && nodeLbComp.setMaterial(0, materialGrey);
            nodeSprComp && nodeSprComp.setMaterial(0, materialGrey);
        }
        if (node.children && node.childrenCount){
            node.children.forEach(child=>{
                this.setNodeGray(child, gray);
            })
        }
    }

}
