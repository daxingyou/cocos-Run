import { ALLTYPE_TYPE, HEAD_ICON } from "../../../app/AppEnums";
import { configUtils } from "../../../app/ConfigUtils";
import { resPathUtils } from "../../../app/ResPathUrlUtils";
import { configManager } from "../../../common/ConfigManager";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { bagData } from "../../models/BagData";

const {ccclass, property} = cc._decorator;

@ccclass
export default class ItemBossTeam extends cc.Component {
    @property(cc.Node) rootNode: cc.Node = null;
    @property(cc.Node) selectedNode: cc.Node = null;
    @property(cc.Node) starsContent: cc.Node = null;
    @property(cc.Sprite) heroHead: cc.Sprite = null;
    @property(cc.Sprite) heroType: cc.Sprite = null;
    @property(cc.Sprite) equipType: cc.Sprite = null;
    @property(cc.Sprite) heroTrigram: cc.Sprite = null;

    private _heroId: number = 0;
    private _clickHandle: Function = null;
    private _spriteLoader: SpriteLoader = new SpriteLoader();
    start () {

    }

    deInit() {
        this._spriteLoader.release();
    }

    unuse() {
        this.deInit();
    }

    reuse() {
    }

    setData(heroId: number, isSelected: boolean = false, clickHandle: Function) {
        this._heroId = heroId;
        this._clickHandle = clickHandle;
        this._refreshView();
        this.refreshSelected(isSelected);
    }

    private _refreshView() {
        this.rootNode.active = this._heroId > 0;
        if(this._heroId) {
            let heroCfg = configUtils.getHeroBasicConfig(this._heroId);
            let headUrl = resPathUtils.getItemIconPath(this._heroId, HEAD_ICON.SQUARE);
            this._spriteLoader.changeSprite(this.heroHead, headUrl);

            // 定位
            let ability = heroCfg.HeroBasicAbility;
            let abilityCfg = configManager.getOneConfigByManyKV('allType', 'HeroTypeForm', ALLTYPE_TYPE.HERO_ABILITY, 'HeroTypeFormNum', ability);
            let abilityUrl = resPathUtils.getHeroAllTypeIconUrl(abilityCfg.HeroTypeIcon);
            this._spriteLoader.changeSprite(this.heroType, abilityUrl);

            // 装备类型
            let equipType = heroCfg.HeroBasicEquipType;
            let equipTypeCfg = configManager.getOneConfigByManyKV('allType', 'HeroTypeForm', ALLTYPE_TYPE.HERO_EQUIP_TYPE, 'HeroTypeFormNum', equipType);
            let equipTypeUrl = resPathUtils.getHeroAllTypeIconUrl(equipTypeCfg.HeroTypeIcon);
            this._spriteLoader.changeSprite(this.equipType, equipTypeUrl);
            
            // 卦象
            let trigrams = heroCfg.HeroBasicTrigrams;
            let trigramsCfg = configManager.getOneConfigByManyKV('allType', 'HeroTypeForm', ALLTYPE_TYPE.HERO_TRIGRAMS, 'HeroTypeFormNum', trigrams);
            let trigramsUrl = resPathUtils.getHeroAllTypeIconUrl(trigramsCfg.HeroTypeIcon);
            this._spriteLoader.changeSprite(this.heroTrigram, trigramsUrl);

            let heroUnit = bagData.getItemByID(this._heroId);
            let star = heroUnit.Array[0] && heroUnit.Array[0].HeroUnit && heroUnit.Array[0].HeroUnit.Star;
            this.starsContent.children.forEach((_star, _index) => {
                _star.active = _index <= star - 1;
            }); 
        }
    }

    refreshSelected(isSelected: boolean) {
        this.selectedNode.active = isSelected;
    }

    onClickItem() {
        if(this._clickHandle) {
            this._clickHandle();
        }
    }

}
