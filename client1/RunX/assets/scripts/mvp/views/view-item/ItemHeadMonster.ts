import { HEAD_ICON, QUALITY_TYPE } from "../../../app/AppEnums";
import { configUtils } from "../../../app/ConfigUtils";
import { resPathUtils } from "../../../app/ResPathUrlUtils";
import { configManager } from "../../../common/ConfigManager";
import { ItemQualityPool } from "../../../common/res-manager/NodePool";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { cfg } from "../../../config/config";
import ItemQualityEffect, { QUALITY_EFFECT_TYPE } from "./ItemQualityEffect";

const {ccclass, property} = cc._decorator;

@ccclass
export default class ItemHeadMonster extends cc.Component {

    @property(cc.Sprite) headQualityFrame: cc.Sprite = null;
    @property(cc.Sprite) headIcon: cc.Sprite = null;
    @property(cc.Node)  qualityEffectParent: cc.Node = null;

    private _spriteLoader: SpriteLoader = new SpriteLoader();
    private _itemQuality: ItemQualityEffect = null;

    init(monsterID: number) {
        let monsterConfig: cfg.Monster = configManager.getConfigByKey("monster", monsterID);
        
        // 头像
        let iconUrl: string = resPathUtils.getHeroCircleHeadIcon(monsterConfig.ModelId, HEAD_ICON.SQUARE);
        this._spriteLoader.changeSprite(this.headIcon, iconUrl);

        // 品质框，有对应英雄就用英雄品质，小怪就用最低的2
        let heroConfig: cfg.HeroBasic = null;
        let quality: number = 2;
        if (monsterConfig.NoumenonID) {
            heroConfig = configUtils.getHeroBasicConfig(monsterConfig.NoumenonID);
            quality = heroConfig.HeroBasicQuality;
        }
        let qualityUrl: string = resPathUtils.getHeroHeadQualityIcon(quality, false);
        this._spriteLoader.changeSprite(this.headQualityFrame, qualityUrl);

        // 品质框特效
        if (heroConfig != null && this._checkNeedShowQualityEffect(heroConfig.HeroBasicQuality)) {
            if (!this._itemQuality) {
                this._itemQuality = ItemQualityPool.get();
                this.qualityEffectParent.addChild(this._itemQuality.node)
                this._itemQuality.node.active = true;
            }
            this._itemQuality.onInit(heroConfig.HeroBasicQuality, cc.size(108, 108), QUALITY_EFFECT_TYPE.CIRCLE);
        } else {
            if(this._itemQuality) {
                this._itemQuality.node.removeFromParent();
                ItemQualityPool.put(this._itemQuality);
                this._itemQuality = null;
            }
        }

    }

    deInit() {
        this._spriteLoader.release();

        this._releaseEffect();
    }

    private _checkNeedShowQualityEffect(quality: QUALITY_TYPE): boolean {
        if(!!quality) {
            return quality >= QUALITY_TYPE.SSR;
        }
        return false;
    }

    private _releaseEffect () {
        if(this._itemQuality) {
            ItemQualityPool.put(this._itemQuality);
            this._itemQuality = null;
        }
    }
}
