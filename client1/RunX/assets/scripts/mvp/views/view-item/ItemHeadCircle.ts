import { ALLTYPE_TYPE, HEAD_ICON, QUALITY_TYPE } from "../../../app/AppEnums";
import { configUtils } from "../../../app/ConfigUtils";
import { resPathUtils } from "../../../app/ResPathUrlUtils";
import { audioManager, SFX_TYPE } from "../../../common/AudioManager";
import { ItemQualityPool } from "../../../common/res-manager/NodePool";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { cfg } from "../../../config/config";
import { pveData } from "../../models/PveData";
import { pveFakeData } from "../../models/PveFakeData";
import ItemQualityEffect, { QUALITY_EFFECT_TYPE } from "./ItemQualityEffect";

const {ccclass, property} = cc._decorator;

@ccclass
export default class ItemHeadCircle extends cc.Component {
    @property(cc.Sprite)    sprHead: cc.Sprite = null;      // 头像
    @property(cc.Sprite)    qualitySp: cc.Sprite = null;    // 品质 //空头像用银色
    @property(cc.Sprite)    heroTypeSp: cc.Sprite = null;   // 类型
    @property(cc.Label)     lvLb: cc.Label = null;          // 等级
    @property(cc.Node)      black: cc.Node = null;
    @property(cc.Node)      qualityEffectParent: cc.Node = null;
    @property(cc.Node)      willActivityFriendNode: cc.Node = null; // 待激活仙缘的标志提示 

    private _heroId: number = 0;
    private _realHeroId: number = 0;
    private _clickHandler: Function = null;
    private _spriteLoader: SpriteLoader = null;
    private _itemQualityEffect: ItemQualityEffect = null;
    init (heroId: number, clickHandler: () => {}, longClickHandler: () => {}, option?: {headType?: HEAD_ICON, showQuality?: boolean, showType?: boolean}) {
        this._heroId = heroId;
        this._realHeroId = pveData.magicDoor ? pveFakeData.getRealHeroId(heroId) : heroId;
        this.node.active = true;
        this._clickHandler = clickHandler;
        this._spriteLoader = this._spriteLoader || new SpriteLoader();
        // 注意！如果是空头像，默认给个银色底框
        if (!this._heroId) {
            this.node.children.forEach(ele => { ele.active = false; });
            let urlEmpty = `textures/head-quality/common_frame_hero_2`;
            this.qualitySp.node.active = true;
            this._spriteLoader.changeSprite(this.qualitySp, urlEmpty);
            this._releaseEffect();
            return;
        }

        let heroConfig = configUtils.getHeroBasicConfig(this._realHeroId);
        (!option || (typeof option.showQuality == 'undefined') ||  option.showQuality) && this._updateQuality(heroConfig);
        this._updateHeadSp(heroConfig, option ? (option.headType || HEAD_ICON.CIRCLE) : HEAD_ICON.CIRCLE);
        (!option || (typeof option.showType == 'undefined') ||  option.showType) &&  this._updateType(heroConfig);
        this._updateLevel();

        this.willActivityFriendNode.active = false;
        this.black.active = pveData.checkHeroBan(this._realHeroId);
    }

    deInit () {
        this._clickHandler = null;
        this._spriteLoader && this._spriteLoader.release();
        this._releaseEffect();
    }

    private _releaseEffect () {
        if(this._itemQualityEffect) {
            ItemQualityPool.put(this._itemQualityEffect);
            this._itemQualityEffect = null;
        }
    }

    // 加入游戏禁用逻辑
    onClickHead () {
        if (this._clickHandler) {
            this._clickHandler(this._heroId);
            audioManager.playSfx(SFX_TYPE.BUTTON_CLICK);
        }
    }

    showWillActivityFriend(isShow: boolean = false) {
        if(cc.isValid(this.willActivityFriendNode)) {
            this.willActivityFriendNode.active = isShow;
        }
    }

    private _updateQuality (heroConfig: cfg.HeroBasic) {
        let headUrl: string = resPathUtils.getHeroHeadQualityIcon(heroConfig.HeroBasicQuality);
        this._spriteLoader.changeSprite(this.qualitySp, headUrl);
        if(this._checkNeedShowQualityEffect(heroConfig.HeroBasicQuality)) {
            if (!this._itemQualityEffect) {
                this._itemQualityEffect = ItemQualityPool.get();
                this._itemQualityEffect.node.active = true;
                this.qualityEffectParent.addChild(this._itemQualityEffect.node);
            }
            this._itemQualityEffect.onInit(heroConfig.HeroBasicQuality, null, QUALITY_EFFECT_TYPE.CIRCLE);
        } else {
            if (this._itemQualityEffect) {
                this._itemQualityEffect.deInit();
            }
        }
    }

    private _updateHeadSp (heroConfig: cfg.HeroBasic, headType: HEAD_ICON = HEAD_ICON.CIRCLE) {
        let headIcon: string = resPathUtils.getItemIconPath(this._realHeroId, headType);
        this._spriteLoader.changeSpriteP(this.sprHead, headIcon).catch(() => {
            this.sprHead.spriteFrame = null;
        });
    }

    private _updateType (heroConfig: cfg.HeroBasic) {
        let abilityIconUrl = resPathUtils.getHeroAllTypeIconUrl(configUtils.getAllTypeConfig(ALLTYPE_TYPE.HERO_ABILITY, heroConfig.HeroBasicAbility).HeroTypeIcon);
        this._spriteLoader.changeSprite(this.heroTypeSp, abilityIconUrl);
    }

    private _updateLevel () {
        // let lv: number = heroData.getHeroLevel(this._heroData);
        // this.lvLb.string = `Lv.${lv}`;
        this.lvLb.node.active = false;
    }

    unuse(){
        this.deInit();
    }

    reuse(id: number){

    }

    onDestroy(){

    }

    private _checkNeedShowQualityEffect(quality: QUALITY_TYPE): boolean {
        if(!!quality) {
            return quality >= QUALITY_TYPE.SSR;
        }
        return false;
    }
}
