import { GIFT_STATE } from "../../../app/AppEnums";
import { utils } from "../../../app/AppUtils";
import { configUtils } from "../../../app/ConfigUtils";
import { resPathUtils } from "../../../app/ResPathUrlUtils";
import { RED_DOT_MODULE } from "../../../common/RedDotManager";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { cfg } from "../../../config/config";
import { gamesvr } from "../../../network/lib/protocol";
import { bagData } from "../../models/BagData";
import HeroUnit from "../../template/HeroUnit";
import ItemRedDot from "../view-item/ItemRedDot";

const {ccclass, property} = cc._decorator;

@ccclass
export default class ItemGiftIcon extends cc.Component {
    @property(cc.Sprite)            quality1: cc.Sprite = null;
    @property(cc.Sprite)            quality2: cc.Sprite = null;
    @property(cc.Sprite)            giftIconSp1: cc.Sprite = null;
    @property(cc.Sprite)            giftIconSp2: cc.Sprite = null;
    @property(ItemRedDot)           redotComp: ItemRedDot = null;
    @property(sp.Skeleton)          effect: sp.Skeleton = null;
    @property([sp.SkeletonData])    effectDataArr: sp.SkeletonData[] = [];

    private _giftId: number = 0;
    private _heroUnit: HeroUnit = null;
    private _giftCfg: cfg.HeroGift = null;
    private _clickHandler: Function = null;
    private _spriteLoader: SpriteLoader = new SpriteLoader();
    private _redotOriPos: cc.Vec2 = null;
    private _isSmallIcon: boolean = false;
    private _isUseEff: boolean = false;

    get giftID () {
        return this._giftId;
    }

    onInit(giftId: number, clickHandler: Function = null, isUseEff: boolean = true) {
        this._giftId = giftId;
        clickHandler && (this._clickHandler = clickHandler);
        this._isUseEff = isUseEff;
        this.redotComp.clear();
        this._redotOriPos = this._redotOriPos || cc.v2(this.redotComp.node.x, this.redotComp.node.y);
        this._giftCfg = configUtils.getHeroGiftConfig(this._giftId);
        this._heroUnit = bagData.getHeroById(this._giftCfg.HeroGiftHeroId);
        this._isSmallIcon = !this._giftCfg.HeroGiftIconSize || this._giftCfg.HeroGiftIconSize <= 0;
        this.refreshView();

        this.redotComp.setData(RED_DOT_MODULE.HERO_GIF_ICON, {
            args: [this._heroUnit.basicId, this._getGiftState(), this._isEnoughMaterial()],
            subName: `${this._heroUnit.basicId}`
        });
    }

    deInit() {
        this._isSmallIcon = false;
        this._stopEff();
        if(this._spriteLoader) {
            this._spriteLoader.release();
        }
        this.redotComp.deInit();
    }

    refreshView() {
        let isSmallIcon = this._isSmallIcon;
        let offset: cc.Vec2 = null;
        if(isSmallIcon) {
            // 小图标
            offset = cc.v2( -12, -12);
        }
        let giftState = this._getGiftState();
        this.updateGiftIcon(giftState);
        this._setupIconRes();
        offset && this.redotComp.node.setPosition(this._redotOriPos.x + offset.x, this._redotOriPos.y + offset.y);
        this._updateEff(giftState);
    }

    private _setupIconRes(){
        let isSmallIcon = this._isSmallIcon;
        let iconSp: cc.Sprite = null;
        if(isSmallIcon) {
            // 小图标
            iconSp = this.giftIconSp1;
        } else {
            // 大图标
            iconSp = this.giftIconSp2;
        }
        this._spriteLoader.changeSprite(iconSp, this._getGiftIconPath());
    }

    private _playEff(){
        if(!cc.isValid(this.effect)) return;
        this._stopEff();
        let skeletonData = this._isSmallIcon ? this.effectDataArr[0] : this.effectDataArr[1];
        if(!skeletonData) return;
        this.effect.skeletonData = skeletonData;
        this.effect.setAnimation(0, 'animation', true);
    }

    private _stopEff(){
        if(!cc.isValid(this.effect)) return;
        this.effect.clearTracks();
        this.effect.skeletonData = null;
    }

    updateGiftIcon(state?: GIFT_STATE){
        let isSmallIcon = this._isSmallIcon;
        this.giftIconSp1.node.active = this.quality1.node.active = isSmallIcon;
        this.giftIconSp2.node.active =  this.quality2.node.active = !isSmallIcon;
        let iconSp: cc.Sprite = null;
        let quality: cc.Sprite = null;
        if(isSmallIcon) {
            // 小图标
            iconSp = this.giftIconSp1;
            quality = this.quality1;
        } else {
            // 大图标
            iconSp = this.giftIconSp2;
            quality = this.quality2;
        }
        let giftState = state || this._getGiftState();
        let material = cc.assetManager.builtins.getBuiltin('material', giftState == GIFT_STATE.LOCK ? 'builtin-2d-gray-sprite' : 'builtin-2d-sprite');
        let color = giftState == GIFT_STATE.UNLOCK ?  cc.Color.GRAY : cc.Color.WHITE;
        iconSp.setMaterial(0, material as cc.Material);
        iconSp.node.color = color;
        quality.setMaterial(0, material as cc.Material);
        quality.node.color = color;
        this._updateEff(giftState);
    }

    private _updateEff(state: GIFT_STATE){
        if(!this._isUseEff) return;
        if(state != GIFT_STATE.ACTIVE){
          this._stopEff();
        } else {
            this._playEff();
        }
    }

    refreshSelect(giftId: number) {
    }


    onClickGift() {
        this._clickHandler &&  this._clickHandler(this._giftId);
    }

    private _getGiftState() {
        let state = GIFT_STATE.LOCK;
        if(!this._heroUnit || !this._heroUnit.isHeroBasic) return state;

        if(this._heroUnit.lv >= this._giftCfg.HeroGiftNeedLevel){
            state = GIFT_STATE.UNLOCK;
            this._heroUnit.gift[this._giftId] && (state = GIFT_STATE.ACTIVE);
        }
        return state;
    }

    //前置天赋是否激活
    private _isPreGiftActived(){
        if(!this._heroUnit || !this._heroUnit.isHeroBasic) return false;
        if(!this._giftCfg.HeroGiftOrder) return true;
        let preGiftCfg = configUtils.getHeroGiftConfig(this._giftCfg.HeroGiftOrder);
        return this._heroUnit.lv >= preGiftCfg.HeroGiftNeedLevel && !!this._heroUnit.gift[preGiftCfg.HeroGiftId];
    }

    private _getGiftIconPath(): string {
        if(this._giftCfg.HeroGiftType == 2) {
            let iconStirng = this._giftCfg.HeroGiftIcon;
            let iconList = utils.parseStingList(iconStirng);
            if(this._heroUnit && this._heroUnit.gift[this._giftCfg.HeroGiftId]) {
                let skillList = utils.parseStingList(this._giftCfg.HeroGiftSkill);
                let index: number = skillList.indexOf(this._heroUnit.gift[this._giftCfg.HeroGiftId].SkillID + '');
                return resPathUtils.getGiftIconPath(iconList[index]);
            } else {
                return resPathUtils.getGiftIconPath(iconList[0]);
            }
        } else {
            return resPathUtils.getGiftIconPath(this._giftCfg.HeroGiftIcon);
        }
    }

    private _isEnoughMaterial(){
        let costList = utils.parseStingList(this._giftCfg.HeroGiftCost);
        if(!costList || costList.length == 0) return true;
        return costList.every(ele => {
            let itemId: number = Number(ele[0]), itemCount: number = Number(ele[1]);
            let bagItem = bagData.getItemByID(itemId);
            let haveCount: number = bagItem ? utils.longToNumber(bagItem.Array[0].Count) : 0;
            return haveCount >= itemCount;
        });
    }
}
