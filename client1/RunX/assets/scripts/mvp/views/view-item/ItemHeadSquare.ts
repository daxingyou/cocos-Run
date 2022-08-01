
import { ABILITY_ICON_TYPE, ALLTYPE_TYPE, HEAD_ICON, QUALITY_TYPE } from "../../../app/AppEnums";
import { configUtils } from "../../../app/ConfigUtils";
import { resPathUtils } from "../../../app/ResPathUrlUtils";
import { audioManager, SFX_TYPE } from "../../../common/AudioManager";
import DragableItem from "../../../common/components/DragableItem";
import { ItemQualityPool } from "../../../common/res-manager/NodePool";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { cfg } from "../../../config/config";
import { pveData } from "../../models/PveData";
import { pveFakeData } from "../../models/PveFakeData";
import ItemQualityEffect, { QUALITY_EFFECT_TYPE } from "./ItemQualityEffect";

const {ccclass, property} = cc._decorator;

export interface SquareHeadOption {
    abilityIconType?: ABILITY_ICON_TYPE,
    abilityIconPos?: cc.Vec2,
    hp?: number,    // 百分比(0-1)
    power?: number  // 百分比(0-1)
}

@ccclass
export default class ItemHeadSquare extends cc.Component {
    @property(cc.Sprite)    sprHead: cc.Sprite = null;      // 头像
    @property(cc.Sprite)    qualitySp: cc.Sprite = null;    // 品质 //空头像用银色
    @property(cc.Sprite)    heroTypeSp: cc.Sprite = null;   // 类型
    @property(cc.Label)     lvLb: cc.Label = null;          // 等级
    @property(cc.Node)      blackTrial: cc.Node = null;
    @property(cc.Node)      black: cc.Node = null;
    @property(cc.Node)      qualityEffectParent: cc.Node = null;
    @property(cc.Node)      willActivityFriendNode: cc.Node = null; // 待激活仙缘的标志提示
    @property(cc.Node)      checkMark: cc.Node = null;    //选中标记
    @property(cc.Node)      hpBar: cc.Node = null;          // 血量条
    @property(cc.Node)      powerBar: cc.Node = null;       // 能量条
    @property(cc.Node)      powerLine: cc.Node = null;      // 能量条分界线
    @property(cc.Node)      deadFrame: cc.Node = null;      // 阵亡框

    // 多阵容相关
    @property(cc.Sprite)    sprMultiNum: cc.Sprite = null;
    @property(cc.SpriteFrame)   sprframeNum: cc.SpriteFrame[] = [];

    private _heroId: number = 0;
    private _realHeroId: number = 0;
    private _clickHandler: Function = null;
    private _spriteLoader: SpriteLoader = null;
    private _itemQuality: ItemQualityEffect = null;
    private _abilityIconOriPos: cc.Vec2 = null;

    get heroID () {
        return this._heroId
    }

    init (heroId: number, clickHandler?: Function, longClickHandler?: Function, options?: SquareHeadOption) {
        this._heroId = heroId;
        this._realHeroId = pveData.magicDoor ? pveFakeData.getRealHeroId(heroId) : heroId;
        this._clickHandler = clickHandler;
        this.node.active = true;
        this._spriteLoader = this._spriteLoader || new SpriteLoader();
        // 注意！如果是空头像，默认给个银色底框
        if (!this._heroId) {
            this.sprHead.spriteFrame = null;
            this._releaseEffect();
            return;
        }

        let heroConfig = configUtils.getHeroBasicConfig(this._realHeroId);
        this._updateQuality(heroConfig);
        this._updateHeadSp(heroConfig);
        this._updateType(heroConfig, options);
        this._updateLevel();
        this.checkMark.active = false;
        this.blackTrial.active = pveData.checkHeroBan(this._realHeroId);
        this.black.active = pveData.checkPveBanHero(this._realHeroId);
        this.willActivityFriendNode.active = false;
        this.sprMultiNum.node.parent.active = false;

        if (options && options.hp != null && options.power != null) {
            this.hpBar.getComponent(cc.ProgressBar).progress = options.hp;
            this.powerBar.getComponent(cc.ProgressBar).progress = options.power;
            this.hpBar.active = true;
            this.powerBar.active = true;
            this.deadFrame.active = options.hp <= 0;    // 血量为0 表示阵亡
            this.powerLine.active = options.power > 0;  // 能量大于0，显示分界线
        }
    }

    deInit () {
        this.hpBar.active = false;
        this.powerBar.active = false;
        this.deadFrame.active = false;

        this._clickHandler = null;
        this._spriteLoader && this._spriteLoader.release();
        this._releaseEffect();
        this.node.setPosition(cc.v2(0, 0));
        this.node.scale = 1;
        this._abilityIconOriPos && this.heroTypeSp.node.setPosition(this._abilityIconOriPos);
        let dragComp = this.node.getComponent(DragableItem);
        if(!dragComp) return;
        dragComp.longClickProgressCb = null;
        dragComp.longClickInterruptCb = null;
        dragComp.deInit();
        dragComp.node.removeFromParent()
    }

    private _releaseEffect () {
        if(this._itemQuality) {
            ItemQualityPool.put(this._itemQuality);
            this._itemQuality = null;
        }
    }

    setChecked(isChecked: boolean = false) {
        this.checkMark.active = isChecked;
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

    showMultiBattleIdx (index: number) {
        if(index == -1 || !cc.isValid(this.sprframeNum[index])) {
            this.sprMultiNum.node.parent.active = false;
        } else {
            this.sprMultiNum.node.parent.active = true;
            this.sprMultiNum.spriteFrame = this.sprframeNum[index];
        }
    }

    private _updateQuality (heroConfig: cfg.HeroBasic) {
        let headUrl: string = resPathUtils.getHeroHeadQualityIcon(heroConfig.HeroBasicQuality);
        this._spriteLoader.changeSprite(this.qualitySp, headUrl);
        if(this._checkNeedShowQualityEffect(heroConfig.HeroBasicQuality)) {
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

    private _updateHeadSp (heroConfig: cfg.HeroBasic) {
        let headIconUrl: string = resPathUtils.getItemIconPath(this._realHeroId, HEAD_ICON.SQUARE);
        this._spriteLoader.changeSpriteP(this.sprHead, headIconUrl).catch(() => {
            this.sprHead.spriteFrame = null;
        });
    }

    private _updateType (heroConfig: cfg.HeroBasic, options: SquareHeadOption) {
        if(options && options.abilityIconPos) {
            this._abilityIconOriPos = this._abilityIconOriPos || this.heroTypeSp.node.getPosition();
            this.heroTypeSp.node.setPosition(options.abilityIconPos);
        }

        let allTypeCfg: cfg.ALLType = configUtils.getAllTypeConfig(ALLTYPE_TYPE.HERO_ABILITY, heroConfig.HeroBasicAbility);
        let iconType = (options && options.abilityIconType) ? options.abilityIconType :  ABILITY_ICON_TYPE.NO_BG;
        let abilityUrl = resPathUtils.getHeroAllTypeIconUrl(iconType == ABILITY_ICON_TYPE.NO_BG ? allTypeCfg.HeroTypeIcon : allTypeCfg.HeroTypeIcon2);
        this._spriteLoader.changeSprite(this.heroTypeSp, abilityUrl);
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

    private _checkNeedShowQualityEffect(quality: QUALITY_TYPE): boolean {
        if(!!quality) {
            return quality >= QUALITY_TYPE.SSR;
        }
        return false;
    }
}
