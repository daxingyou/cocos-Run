/*
 * @Description:
 * @Autor: lixu
 * @Date: 2021-05-19 11:04:04
 * @LastEditors: lixu
 * @LastEditTime: 2021-08-26 19:37:47
 */
import { ALLTYPE_TYPE, HEAD_ICON, QUALITY_TYPE } from "../../../app/AppEnums";
import { configUtils } from "../../../app/ConfigUtils";
import { resPathUtils } from "../../../app/ResPathUrlUtils";
import { ItemQualityPool } from "../../../common/res-manager/NodePool";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { cfg } from "../../../config/config";
import ItemQualityEffect, { QUALITY_EFFECT_TYPE } from "../view-item/ItemQualityEffect";

const { ccclass, property } = cc._decorator;

@ccclass
export default class HeroHeadItem extends cc.Component {
    @property(cc.Sprite)        qualitySp: cc.Sprite = null;
    @property(cc.Sprite)        headSp: cc.Sprite = null;
    @property(cc.Sprite)        heroTypeSp: cc.Sprite = null;
    @property(cc.Label)         lvLb: cc.Label = null;
    @property(cc.Node)          emptyBGNode: cc.Node = null;

    private _heroId: number = null;
    private _spriteLoader: SpriteLoader = new SpriteLoader();
    private _itemQuality: ItemQualityEffect = null;
    private _clickHandler: Function = null;

    deInit() {
        if (this._spriteLoader) {
            this._spriteLoader.release();
        }
        this._clickHandler = null;
        this._releaseEffect();
    }

    private _releaseEffect () {
        if(this._itemQuality) {
            ItemQualityPool.put(this._itemQuality);
            this._itemQuality = null;
        }
    }

    setData(data: number, isShowEmpty: boolean = false, isTouchSawllow: boolean = true, click: Function = null) {
        this._heroId = data;
        this._clickHandler = click
        this._setEmptyBGVisible(false);
        this.refreshView(isShowEmpty);
        if(!isTouchSawllow || !click) {
            this.node.getComponent(cc.Button).interactable = false;
        } else {
            this.node.getComponent(cc.Button).interactable = true
        }
    }

    // setBattleArrayInfo (battleArray: BattleArray) {
    //     this.black.active = false;
    //     this.banNode.active = false;
    //     this.sprMultiNum.node.active = false;
    //     if (!battleArray || battleArray.size <= 1 || !this._heroId) {
    //         return;
    //     } else {
    //         let idx = battleArray.checkDuplicate([this._heroId], -1);
    //         if (idx != -1 && this.sprframeNum[idx]) {
    //             this.black.active = true;
    //             this.sprMultiNum.node.active = true;
    //             this.sprMultiNum.spriteFrame = this.sprframeNum[idx]
    //         }

    //         let banList = pveData.pveConfig? pveData.pveConfig.banHeroList:[]
    //         if (banList && banList.length) {
    //             this.banNode.active = banList.indexOf(this._heroId) != -1
    //         }
    //     }
    // }

    onClickItem () {
        this._clickHandler && this._clickHandler(this._heroId)
    }

    private _setEmptyBGVisible(visible: boolean){
        if(cc.isValid(this.emptyBGNode)) {
            this.emptyBGNode.active = visible;
            this.node.children.forEach(ele => {
                if(ele != this.emptyBGNode){
                    cc.isValid(ele) && (ele.active = !visible);
                }
            });
        }
    }

    refreshView(isShowEmpty: boolean = false) {
        if (!this._heroId) {
            isShowEmpty && this._setEmptyBGVisible(true);
            return;
        }
        let heroConfig: cfg.HeroBasic = configUtils.getHeroBasicConfig(this._heroId);
        let headUrl: string = resPathUtils.getHeroHeadQualityIcon(heroConfig.HeroBasicQuality);
        this._spriteLoader.changeSprite(this.qualitySp, headUrl);
        // 改变头像
        let headIconUrl: string = resPathUtils.getItemIconPath(this._heroId, HEAD_ICON.SQUARE);
        this._spriteLoader.changeSpriteP(this.headSp, headIconUrl).catch(() => {
            this.headSp.spriteFrame = null;
        });

        // 改变英雄类型
        let abilityUrl = resPathUtils.getHeroAllTypeIconUrl(configUtils.getAllTypeConfig(ALLTYPE_TYPE.HERO_ABILITY, heroConfig.HeroBasicAbility).HeroTypeIcon)
        this._spriteLoader.changeSprite(this.heroTypeSp, abilityUrl);

        this.lvLb.node.active = false;
        if (heroConfig.HeroBasicQuality == QUALITY_TYPE.SSR) {
            if(!this._itemQuality) { 
                this._itemQuality = ItemQualityPool.get();
                this.node.addChild(this._itemQuality.node)
            }
            this._itemQuality.onInit(heroConfig.HeroBasicQuality, cc.size(124, 124), QUALITY_EFFECT_TYPE.CIRCLE);
        } else {
            this._releaseEffect();
        }
    }

}
