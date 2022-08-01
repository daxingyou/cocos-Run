import { ALLTYPE_TYPE, HEAD_ICON } from "../../../app/AppEnums";
import { configUtils } from "../../../app/ConfigUtils";
import { resPathUtils } from "../../../app/ResPathUrlUtils";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import guiManager from "../../../common/GUIManager";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { bagData } from "../../models/BagData";
import { pveFakeData } from "../../models/PveFakeData";
import HeroUnit from "../../template/HeroUnit";

const {ccclass, property} = cc._decorator;

@ccclass
export default class HeroCommonInfoView extends ViewBaseComponent {
    @property(cc.Sprite)                    qualityIconSp: cc.Sprite = null;
    @property(cc.Label)                     nameLb: cc.Label = null;
    @property(cc.Sprite)                    trigramsSp: cc.Sprite = null;
    @property(cc.Sprite)                    equipTypeSp: cc.Sprite = null;
    @property(cc.Sprite)                    abilityTypeSp: cc.Sprite = null;
    @property(cc.Sprite)                    heroHeadSp: cc.Sprite = null;

    private _heroId: number = 0;
    private _heroUnit: HeroUnit = null;
    private _spriteLoader: SpriteLoader = new SpriteLoader();
    onInit(heroId: number) {
        this._heroId = heroId;
        let isFake = pveFakeData.fakeHero.hasOwnProperty(heroId);
        isFake && (this._heroId = pveFakeData.fakeHero[heroId].Array[0].ID);
        this._heroUnit =  isFake ? pveFakeData.getFakeHeroById(heroId) : bagData.getHeroById(heroId);
        this._refreshHeroView();
    }

    onRelease() {
        this._spriteLoader.release();
    }

    //英雄部分
    private _refreshHeroView() {
        let heroUnit: HeroUnit = new HeroUnit(this._heroId, this._heroUnit && this._heroUnit.fakeId);
         // 英雄品质icon
        this._spriteLoader.changeSprite(this.qualityIconSp, resPathUtils.getHeroPropertyQualityIcon(heroUnit.heroCfg.HeroBasicQuality));
        // 名字显示
        this.nameLb.string = `${heroUnit.heroCfg.HeroBasicName}`;
         // 更换卦象icon
        let trigramsAllTypeConfig = configUtils.getAllTypeConfig(ALLTYPE_TYPE.HERO_TRIGRAMS, heroUnit.heroCfg.HeroBasicTrigrams);
        this._spriteLoader.changeSprite(this.trigramsSp, resPathUtils.getHeroAllTypeIconUrl(trigramsAllTypeConfig.HeroTypeIcon));

        // 更换装备类型icon
        let heroEquipTypeAllTypeConfig = configUtils.getAllTypeConfig(ALLTYPE_TYPE.HERO_EQUIP_TYPE, heroUnit.heroCfg.HeroBasicEquipType);
        this._spriteLoader.changeSprite(this.equipTypeSp, resPathUtils.getHeroAllTypeIconUrl(heroEquipTypeAllTypeConfig.HeroTypeIcon));

        // 英雄定位
        let heroAbilityAllTypeConfig = configUtils.getAllTypeConfig(ALLTYPE_TYPE.HERO_ABILITY, heroUnit.heroCfg.HeroBasicAbility);
        this._spriteLoader.changeSprite(this.abilityTypeSp, resPathUtils.getHeroAllTypeIconUrl(heroAbilityAllTypeConfig.HeroTypeIcon));

        if(cc.isValid(this.heroHeadSp.node)) {
            let modelId = heroUnit.heroCfg.HeroBasicModel;
            let url = resPathUtils.getHeroCircleHeadIcon(modelId, HEAD_ICON.CIRCLE);
            this._spriteLoader.changeSprite(this.heroHeadSp, url);
        }
    }
}
