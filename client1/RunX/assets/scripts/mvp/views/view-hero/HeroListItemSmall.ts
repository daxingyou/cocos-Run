import { ALLTYPE_TYPE, HEAD_ICON } from "../../../app/AppEnums";
import { bagDataUtils } from "../../../app/BagDataUtils";
import { configUtils } from "../../../app/ConfigUtils";
import { resPathUtils } from "../../../app/ResPathUrlUtils";
import { eventCenter } from "../../../common/event/EventCenter";
import { ItemQualityPool } from "../../../common/res-manager/NodePool";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { bagData } from "../../models/BagData";
import { pveFakeData } from "../../models/PveFakeData";
import HeroUnit from "../../template/HeroUnit";
import ItemQualityEffect, { QUALITY_EFFECT_TYPE } from "../view-item/ItemQualityEffect";

const { ccclass, property } = cc._decorator;

@ccclass
export default class HeroListItemSmall extends cc.Component {
    @property({ type: cc.Sprite, tooltip: '英雄品质框' }) heroQualityCircleSp: cc.Sprite = null;
    @property({ type: cc.Sprite, tooltip: '英雄头像' }) heroHeadSp: cc.Sprite = null;
    @property({ type: cc.Sprite, tooltip: '英雄类型Icon' }) heroTypeSp: cc.Sprite = null;
    @property({ type: cc.Node, tooltip: '星级父节点' }) levelStarParent: cc.Node = null;
    @property({ type: cc.Node, tooltip: '未合成的蒙版' }) lockStateNode: cc.Node = null;
    @property({ type: cc.Node, tooltip: '满足合成时的提示' }) canUnlockTips: cc.Node = null;
    @property(cc.Node) isSelect: cc.Node = null;
    @property(cc.Node) skeNode: cc.Node = null;
    @property(cc.Node) selectBlack: cc.Node = null;

    private _spriteLoader: SpriteLoader = new SpriteLoader();
    private _heroId: number = null;
    private _fake: boolean = false;     //假玩家
    private _itemQuality: ItemQualityEffect = null;
    onLoad() {
    }

    reuse() {
    }

    unuse() {
        eventCenter.unregisterAll(this);
        if (this._spriteLoader) {
            this._spriteLoader.release();
        }
        this._releaseEffect()
    }

    private _releaseEffect () {
        if(this._itemQuality) {
            ItemQualityPool.put(this._itemQuality)
            this._itemQuality = null;
        }
    }

    setData(heroId: number, fake?: boolean) {
        this._heroId = heroId;
        this._fake = fake;
        this.refreshView();
    }

    refreshView() {
        // todo 判断是否是完整英雄
        let heroUnit: HeroUnit = this._fake ? pveFakeData.getFakeHeroById(this._heroId) : bagData.getHeroById(this._heroId);
        if (heroUnit && heroUnit.isHeroBasic) {
            this.lockStateNode.active && (this.lockStateNode.active = false);
            this.canUnlockTips.active && (this.canUnlockTips.active = false);
            this.refreshStarView(heroUnit);
        } else {
            this.levelStarParent.active = false;
            !this.lockStateNode.active && (this.lockStateNode.active = true);
            // 可以合成
            if (this._checkHeroMerge()) {
                !this.canUnlockTips.active && (this.canUnlockTips.active = true);
            } else {
                this.canUnlockTips.active && (this.canUnlockTips.active = false);
            }
        }
        // 根据英雄品质 显示不同的品质框
        this._spriteLoader.changeSprite(this.heroQualityCircleSp, resPathUtils.getHeroHeadQualityIcon(heroUnit.heroCfg.HeroBasicQuality));
        // 显示英雄定位标签
        this._spriteLoader.changeSpriteP(this.heroTypeSp, resPathUtils.getHeroAllTypeIconUrl(configUtils.getAllTypeConfig(ALLTYPE_TYPE.HERO_ABILITY, heroUnit.heroCfg.HeroBasicAbility).HeroTypeIcon)).catch(() => {
            this._spriteLoader.deleteSprite(this.heroTypeSp);
        });
        // 显示英雄头像
        this._spriteLoader.deleteSprite(this.heroHeadSp);
        this._spriteLoader.changeSpriteP(this.heroHeadSp, resPathUtils.getItemIconPath(heroUnit.basicId, HEAD_ICON.SQUARE)).catch(() => {
            this._spriteLoader.deleteSprite(this.heroHeadSp);
        });
        // 假英雄禁用列表组件
        if (this._fake) this.isSelect.opacity = 0;

        if(!this._itemQuality) {
            this._itemQuality = ItemQualityPool.get();
            this.skeNode.addChild(this._itemQuality.node)
        }
        this._itemQuality.onInit(heroUnit.heroCfg.HeroBasicQuality, cc.size(80, 80), QUALITY_EFFECT_TYPE.HERO_SMALL);
    }

    refreshStarView(heroUnit: HeroUnit) {
        if (!heroUnit) {
            this.levelStarParent.active = false;
            return;
        }
        this.levelStarParent.active = true;
        let star = heroUnit.star;
        for (let i = 0; i < this.levelStarParent.childrenCount; ++i) {
            if (i < star) {
                !this.levelStarParent.children[i].active && (this.levelStarParent.children[i].active = true);
            } else {
                this.levelStarParent.children[i].active && (this.levelStarParent.children[i].active = false);
            }
        }
    }

    refreshSelect(heroId: number) {
        if (heroId != this._heroId) {
            this.isSelect.active && (this.isSelect.active = false);
        } else {
            !this.isSelect.active && (this.isSelect.active = true);
        }
    }

    onDestroy() {
    }

    private _checkHeroMerge() {
        if (this._fake) {
            return false
        }
        return bagDataUtils.checkHeroMerge(this._heroId)
    }

}
