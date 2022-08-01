import { CustomItemId, EQUIP_MAX_STAR, RES_ICON_PRE_URL, VIEW_NAME } from "../../../app/AppConst";
import { EQUIP_PART_TYPE, QUALITY_TYPE } from "../../../app/AppEnums";
import { BagItemInfo, TransPiece } from "../../../app/AppType";
import { utils } from "../../../app/AppUtils";
import { bagDataUtils } from "../../../app/BagDataUtils";
import { configUtils } from "../../../app/ConfigUtils";
import { resPathUtils } from "../../../app/ResPathUrlUtils";
import { audioManager, SFX_TYPE } from "../../../common/AudioManager";
import RichTextEx from "../../../common/components/rich-text/RichTextEx";
import { configManager } from "../../../common/ConfigManager";
import { RED_DOT_MODULE } from "../../../common/RedDotManager";
import { ItemQualityPool } from "../../../common/res-manager/NodePool";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { cfg } from "../../../config/config";
import { bagData } from "../../models/BagData";
import ItemQualityEffect, { QUALITY_EFFECT_TYPE } from "./ItemQualityEffect";
import ItemRedDot, { RED_DOT_SUB_INFO } from "./ItemRedDot";

const { ccclass, property } = cc._decorator;
export enum ITEM_SHOW_TYPE {
    ITEM = 1,
    HERO,
    EQUIP,
    BEAST
}

export enum ITEM_RECEIVED_TYPE {
    GREEN = 0,
    RED
}

// 自动图集预览的时候不会生成图集，先这样测一测
const SUIT = {"suit1": 0, "suit2": 1,"suit3": 2,"suit4": 3,"suit5": 4,"suit6": 5,"suit7": 6,"suit8": 7,"suit9": 8,"suit10": 9, 
              "suit11": 10,"suit12": 11,"suit13": 12,"suit14": 13,"suit15": 14}

const CAREER = {"type10001": 0, "type10002": 1,"type10003": 2,"type10004": 3,"type10005": 4}


@ccclass export default class ItemBag extends cc.Component {
    // @property(cc.Label)     labelCnt: cc.Label = null;
    // @property(cc.Sprite)    spIcon: cc.Sprite = null;

    @property(cc.SpriteAtlas) spfAtlas: cc.SpriteAtlas = null; // 图集
    @property(cc.Node) ndEquip: cc.Node = null;        // 装备
    @property(cc.Node) ndBeast: cc.Node = null;        // 灵兽
    @property(cc.Node) ndHeroSquare: cc.Node = null;   // 头像
    @property(cc.Node) ndItem: cc.Node = null;         // 普通道具

    // common
    @property([cc.SpriteFrame]) recivedIcon: cc.SpriteFrame[] = [];
    @property(cc.SpriteFrame) qualitySfs: cc.SpriteFrame[] = [];
    @property(cc.Node) mask: cc.Node = null;
    @property(cc.Node) black: cc.Node = null;
    @property(cc.Node) gou: cc.Node = null;

    // 普通道具
    @property(cc.Sprite) spFrame: cc.Sprite = null;
    @property(cc.Sprite) itemIcon: cc.Sprite = null;
    @property(cc.Sprite) extraIcon: cc.Sprite = null;
    @property(cc.Label) labelNum: cc.Label = null;
    @property(cc.Node) textNumBg: cc.Node = null;
    @property(RichTextEx) textNum: RichTextEx = null;
    @property(cc.Sprite) itemLvBG: cc.Sprite = null;
    @property(cc.Label) itemLvLb: cc.Label = null;
    @property(cc.Sprite) received: cc.Sprite = null;

    // 装备
    @property(cc.Sprite) equipQuality: cc.Sprite = null;
    @property(cc.Sprite) spEquipUser: cc.Sprite = null;
    @property(cc.Node) ndEquipUser: cc.Node = null;
    @property(cc.Sprite) equipIcon: cc.Sprite = null;
    @property(cc.Label) lbEquipLevel: cc.Label = null;
    @property(cc.Node) levelBg: cc.Node = null;
    @property(cc.Node) equipSuit: cc.Node = null;
    @property(cc.Node) equipStarBg: cc.Node = null;
    @property(cc.Node)  exclusive: cc.Node = null;          // 专属
    @property(cc.SpriteFrame) suitSfs: cc.SpriteFrame[] = [];

    // 灵兽
    @property(cc.Sprite) beastQuality: cc.Sprite = null;
    @property(cc.Sprite) beastIcon: cc.Sprite = null;
    @property(cc.Label) lbBeastLevel: cc.Label = null;
    @property(cc.Node)  beastLevelBg: cc.Node = null;
    @property(cc.Sprite) spBeastUser: cc.Sprite = null;
    @property(cc.Node) ndBeastUser: cc.Node = null;

    // 英雄
    @property(cc.Sprite) headIconSquare: cc.Sprite = null;
    @property(cc.Sprite) headCareer: cc.Sprite = null;
    @property(cc.Sprite) heroQuality: cc.Sprite = null;
    @property(cc.Node) heroEmptyNode: cc.Node = null;
    @property(cc.SpriteFrame) careerSfs: cc.SpriteFrame[] = [];

    @property(cc.Node) starNode: cc.Node = null;
    @property(cc.Node) star: cc.Node = null;
    @property(cc.Node) starBg: cc.Node = null;
    @property(cc.Node) emptyNode: cc.Node = null;
    @property(ItemRedDot) itemRedDot: ItemRedDot = null;
    @property(cc.Label) itemName: cc.Label = null;

    private _stars: cc.Node[] = [];
    private _iconLoader = new SpriteLoader();
    private _info: BagItemInfo = null;
    private _type: ITEM_SHOW_TYPE = null;
    private _cfg: any = null;
    private _itemQualityEffect: ItemQualityEffect = null;
    private _tweenTag: number = 0;
    private _cleared: boolean = false
    private _countBgOriWidth: number = 0;

    get info() {
        return this._info;
    }

    loadStars() {
        let starNode = this.starNode;
        starNode.removeAllChildren();
        this._stars.slice(0);
        for(let i = 0; i < EQUIP_MAX_STAR; i++){
            let copyStar = cc.instantiate(this.star);
            starNode.addChild(copyStar);
            this._stars.push(copyStar.children[0]);
        }
    }

    init(info: BagItemInfo) {
        !this._countBgOriWidth && (this._countBgOriWidth = this.textNumBg.width);
        this._cleared = false;
        this.ndEquip.active = false;
        this.ndBeast && (this.ndBeast.active = false);
        this.ndHeroSquare.active = false;
        this.ndItem.active = false;
        this.showReceived(info.receivedType);
        this._info = info;
        this._prepareData();
        if (!this._stars.length) this.loadStars();
        switch (this._type) {
            case ITEM_SHOW_TYPE.ITEM: { this._showItem(); break; }
            case ITEM_SHOW_TYPE.EQUIP: { this._showEquip(); break; }
            case ITEM_SHOW_TYPE.HERO: { this._showHero(); break; }
            case ITEM_SHOW_TYPE.BEAST: { this._showBeast(); break;}
            default: { break; }
        }
        this.itemRedDot.clear();
        if(info.isNew) {
            this.itemRedDot.showNew(true);
        }
        // this._showQualityEffect();
        // this.node.getComponent("ButtonAntiClick").enabled = this._info.prizeItem;
        // this.node.getComponent("ButtonClick").enabled = this._info.prizeItem || this._info.isMat;
    }

    reuse() {
    }

    unuse() {
        this.deInit();
    }

    deInit() {
        this.node.active = true
        this.ndEquip.active = false;
        this.ndHeroSquare.active = false;
        this.ndItem.active = false;
        this.ndBeast && (this.ndBeast.active = false);
        this._tweenTag = 0;
        this.node.scaleX = 1;
        this.node.scaleY = 1;
        this.node.position = new cc.Vec3(0,0,0);
        this._info = null;
        this.mask.active = false;
        this._iconLoader.release();
        this.showBlack(false);
        this.showGou(false);
        this._releaseEffect();
        this.itemRedDot.deInit();
        cc.Tween.stopAllByTarget(this.node);
        this._cleared = true;
        cc.isValid(this.received) && (this.received.node.active = false);
    }

    onClickItem() {
        if (this._info && this._info.clickHandler) {
            audioManager.playSfx(SFX_TYPE.BUTTON_CLICK);
            this._info.clickHandler(this._info, this._type, this);
        }
    }

    setRedDotData(moduleName: RED_DOT_MODULE, subInfo?: RED_DOT_SUB_INFO) {
        this.itemRedDot.setData(moduleName, subInfo);
    }

    getItemName (): string {
        if (this.itemName && cc.isValid(this.itemName)) {
            return this.itemName.string 
        }
        return "" 
    }

    private _prepareData() {
        let _item = this._info.id;
        let cfg: any = configUtils.getItemConfig(_item);
        if (cfg && cfg.ItemId) {
            this._cfg = cfg;
            this._type = ITEM_SHOW_TYPE.ITEM;
            //选中框只有在背包模块使用
            this.mask.opacity = this._info.isMat || this._info.prizeItem ? 0 : 255;
            return;
        }

        cfg = configUtils.getEquipConfig(_item);
        if (cfg) {
            this._cfg = cfg;
            this._type = ITEM_SHOW_TYPE.EQUIP;
            this.mask.opacity = this._info.prizeItem ? 0 : 255;
            return;
        }

        cfg = configUtils.getBeastConfig(_item);
        if (cfg) {
            this._cfg = cfg;
            this._type = ITEM_SHOW_TYPE.BEAST;
            this.mask.opacity = this._info.prizeItem ? 0 : 255;
            return;
        }


        cfg = configUtils.getHeroBasicConfig(_item);
        if (cfg) {
            this._cfg = cfg;
            this._type = ITEM_SHOW_TYPE.HERO;
            this.mask.opacity = 0;
        }
    }

    private _showItem() {
        this.ndItem.active = true;
        this.clearItemNode();
        // ICON
        if (this._cfg && this._cfg.ItemIcon) {
            let url = `${RES_ICON_PRE_URL.BAG_ITEM}/${this._cfg.ItemIcon}`;
            this._iconLoader.changeSpriteP(this.itemIcon, url).then(() => {
                this.itemIcon && (this.itemIcon.node.active = true);
            });
        }
        // 额外赠送
        this.extraIcon && (this.extraIcon.node.active = this._info.extra);
        // 品质框
        if (this._cfg && this._cfg.ItemQuality && this.qualitySfs[this._cfg.ItemQuality - 1]) {
            this.spFrame.spriteFrame = this.qualitySfs[this._cfg.ItemQuality - 1];
        }
        // 数量
        let showCnt = this._info.count && this._info.count > 1 ? this._info.count : 0;
        // 供奉加速换算成时间
        if(this._info.id == CustomItemId.GONG_FENG_SPEED_UP_COIN) {
            showCnt = this._info.count || 0;
            let timeArr = utils.getLeftTime(showCnt * 60);
            let cntDesc = '';
            if(timeArr[0] != 0) {
                cntDesc = `${cntDesc}${timeArr[0]}天`;
            }
            if(timeArr[1] != 0) {
                cntDesc = `${cntDesc}${timeArr[1]}小时`;
            }
            if(timeArr[2] != 0) {
                cntDesc = `${cntDesc}${timeArr[2]}分`;
            }
            this.labelNum.string = cntDesc;
            this.labelNum.node.active = showCnt > 0;
        } else {
            this.labelNum.string = showCnt < 1000000 ? `${showCnt}` : `${Math.floor(showCnt / 10000)}万`;
            this.labelNum.node.active = Boolean(showCnt);
        }

        this.textNum.string = this._info.richTxt || "";
        this.textNum.node.active = !!this._info.richTxt;
        this.textNumBg.active = this.labelNum.node.active || this.textNum.node.active;
        if(this.labelNum.node.active){
            //@ts-ignore
            this.labelNum._forceUpdateRenderData();
            this.textNumBg.width = this.labelNum.node.width + 10;
        }else if(this.textNum.node.active){
            //@ts-ignore
            this.textNum._updateRichText();
            this.textNumBg.width = this.textNum.node.width + 10;
        }
        // 名称
        if (this._info.getItem && this.itemName) {
            this.itemName.node.active = true;
            this.itemName.string = this._cfg.ItemName;
        }

        //等级
        let level = this._info.level;
        if(level){
            cc.isValid(this.itemLvBG) && (this.itemLvBG.node.active = true);
            cc.isValid(this.itemLvLb) && (this.itemLvLb.node.active = true);
            cc.isValid(this.itemLvLb) && (this.itemLvLb.string = `${level}级`);

        }else{
            cc.isValid(this.itemLvBG) && (this.itemLvBG.node.active = false);
            cc.isValid(this.itemLvLb) && (this.itemLvLb.node.active = false);
        }
    }

    private clearItemNode() {
        // 通用星级
        this._stars.forEach((star) => { star.parent.active = false });
        this.starBg.active = false;
        this.itemIcon && (this.itemIcon.node.active = false);
        this.labelNum && (this.labelNum.node.active = false);
        this.textNum && (this.textNum.node.active = false);
        this.textNumBg && (this.textNumBg.active = false);
        this.extraIcon && (this.extraIcon.node.active = false);
        this.itemLvBG && (this.itemLvBG.node.active = false);
        this.itemLvLb && (this.itemLvLb.node.active = false)
    }

    private _showHero() {
        if (this._cfg && this._cfg.HeroBasicModel) {
            this.headIconSquare.node.active = false;
            this.starBg.active = true;
            this._stars.forEach((star) => { star.parent.active = false });

            this.heroEmptyNode.active = false;
            this.heroQuality.node.active = true;
            let modelCfg: cfg.Model = configManager.getConfigByKey("model", this._cfg.HeroBasicModel);
            let url = ``;
            this.ndHeroSquare.active = true;
            // 头像
            if (modelCfg && modelCfg.ModelHeadIconSquare) {
                url = `textures/head-hero/${modelCfg.ModelHeadIconSquare}`;
                if (url) this._iconLoader.changeSpriteP(this.headIconSquare, url).then(()=>{
                    this.headIconSquare.node.active = true;
                });
            }
            //品质
            if (this._cfg && this._cfg.HeroBasicQuality && this.qualitySfs[this._cfg.HeroBasicQuality - 1]) {
                this.heroQuality.spriteFrame = this.qualitySfs[this._cfg.HeroBasicQuality - 1];
            }

            // 职业
            // this._iconLoader.changeSprite(this.headCareer, resPathUtils.getHeroTypeIconUrl(this._cfg));
            let icon = resPathUtils.getHeroTypeIcon(this._cfg);
            // let spframe = this.spfAtlas.getSpriteFrame(icon);
            // if (spframe) this.headCareer.getComponent(cc.Sprite).spriteFrame = spframe;
            // @ts-ignore
            let spfIdx = CAREER[icon];
            if (spfIdx != null && this.careerSfs[spfIdx]) {
                this.headCareer.getComponent(cc.Sprite).spriteFrame = this.careerSfs[spfIdx];
            }

            let star = this._info.star != null ? this._info.star : bagDataUtils.getHeroInitStar(this._cfg.HeroBasicId);
            for (let i = 0; i < 6; i++) {
                this._stars[i].parent.active = true;
                this._stars[i].active = i < star;
            }
            // 名称
            if (this._info.getItem && this.itemName) {
                this.itemName.node.active = true;
                this.itemName.string = this._cfg.HeroBasicName;
            }
        }
    }

    showEmptyHero() {
        this.ndHeroSquare.active = true;
        this.heroQuality && (this.heroQuality.node.active = false);
        this.heroEmptyNode && (this.heroEmptyNode.active = true);
    }

    showBlack(isShow: boolean, opacity: number = 180) {
        if (isShow) {
            !this.black.active && (this.black.active = true);
            this.black.opacity = opacity;
        } else {
            this.black.opacity = 0;
        }
    }

    showGou(isShow: boolean) {
        if(!cc.isValid(this.gou)) return;
        this.gou.active = isShow;
    }

    showReceived(receivedType: ITEM_RECEIVED_TYPE) {
        if(!cc.isValid(this.received)) return;
        if (receivedType != null) {
            this.received.node.active = true;
            this.received.spriteFrame = this.recivedIcon[receivedType];
        } else {
            this.received.node.active = false;
        }
    }

    private _showEquip() {
        this.ndEquip.active = true;
        this.clearEquipNode();
        let isExclusive = this._cfg.PositionType == EQUIP_PART_TYPE.EXCLUSIVE;
        //品质框
        if (this._cfg.Quality && this.qualitySfs[this._cfg.Quality - 1]) {
            this.equipQuality.spriteFrame = this.qualitySfs[this._cfg.Quality - 1];
        }
        //装备ICON
        if (this._cfg.Icon) {
            let url = `${RES_ICON_PRE_URL.BAG_ITEM}/${this._cfg.Icon}`;
            this._iconLoader.changeSpriteP(this.equipIcon, url).then(() => {
                this.equipIcon && (this.equipIcon.node.active = true);
            });
        }

        //等级(非专属装备有等级)
        if (this._info.level && !isExclusive) {
            this.lbEquipLevel.node.active = true;
            this.levelBg.active = true;
            this.lbEquipLevel.string = this._info.level >= bagDataUtils.equipMaxLevel ? `满级` : `${this._info.level}级`;
        } else {
            this.levelBg.active = false;
        }
        //套装
        this.equipSuit.active = Boolean(this._cfg.SuitId);
        if (this._cfg.SuitId) {
            let suitCfg: cfg.EquipSuit = configUtils.getEquipSuitConfig(this._cfg.SuitId);
            if (suitCfg && suitCfg.SuitIcon) {
                // @ts-ignore
                let spfIdx = SUIT[suitCfg.SuitIcon];
                if (spfIdx != null && this.suitSfs[spfIdx]) {
                    this.equipSuit.getComponent(cc.Sprite).spriteFrame = this.suitSfs[spfIdx];
                }
    
            }
        }
        //星级
        let star = this._info.star != null ? this._info.star : bagDataUtils.getEquipBeginStar(this._cfg);
        for (let i = 0; i < 6; i++) {
            this._stars[i].parent.active = star != 0;
            this._stars[i].active = i < star;
        }
        this.equipStarBg.active = star != 0;
        // 谁正在装备这个东西
        let isShowUser: boolean = typeof this._info.isShowCurrUser == 'undefined' ? true : this._info.isShowCurrUser;
        if (this._info.currEquip && isShowUser) {
            this.ndEquipUser.active = true;
            let userId = this._info.currEquip;
            let cfg = configUtils.getHeroBasicConfig(userId);
            if (cfg && cfg.HeroBasicModel) {
                let modelCfg: cfg.Model = configManager.getConfigByKey("model", cfg.HeroBasicModel);
                if (modelCfg && modelCfg.ModelHeadIconCircular) {
                    let url = `textures/head-hero/${modelCfg.ModelHeadIconCircular}`;
                    if (url) this._iconLoader.changeSprite(this.spEquipUser, url);
                }
            }
        } else {
            this.ndEquipUser.active = false;
        }

        // 专属
        if(this._info.currEquip) {
            let userId = this._info.currEquip;
            let heroUnit = bagData.getHeroById(userId);
            let equipCfg = this._cfg as cfg.Equip;
            this.exclusive.active = heroUnit.getExclusiveInfos() > 0 && equipCfg.PositionType == EQUIP_PART_TYPE.EXCLUSIVE;
        }

        // 名称
        if (this._info.getItem && this.itemName){
            this.itemName.node.active = true;
            this.itemName.string = this._cfg.EquipName;
        }
    }

    private _clearBeastNode() {
        this.beastIcon.node.active = false;
        this.lbBeastLevel.node.active = false;
        this.beastLevelBg.active = false;
        this.equipStarBg.active = false;

        this.starBg.active = true;
        this.starNode.active = true;
        this._stars.forEach((star) => { star.parent.active = false });
    }

    private _showBeast() {
        if(!cc.isValid(this.ndBeast)) return;
        this.ndBeast.active = true;
        this._clearBeastNode();
        let cfg: cfg.Beast = this._cfg as cfg.Beast;
        //品质框
        if (cfg.BeastQuality && this.qualitySfs[cfg.BeastQuality - 1]) {
            this.beastQuality.spriteFrame = this.qualitySfs[cfg.BeastQuality - 1];
        }

        //装备ICON
        if (cfg.BeastHeadImage) {
            let url = `${RES_ICON_PRE_URL.BAG_ITEM}/${cfg.BeastHeadImage}`;
            this._iconLoader.changeSpriteP(this.beastIcon, url).then(() => {
                this.beastIcon && (this.beastIcon.node.active = true);
            });
        }

        //等级
        if (typeof this._info.level != 'undefined') {
            this.lbBeastLevel.node.active = true;
            this.beastLevelBg.active = true;
            this.lbBeastLevel.string = `${this._info.level}级`;
        } else {
            this.levelBg.active = false;
        }

        //星级
        let star = this._info.star != null ? this._info.star : 0;
        for (let i = 0; i < 6; i++) {
            this._stars[i].parent.active = star != 0;
            this._stars[i].active = i < star;
        }
        this.equipStarBg.active = star != 0;
        // 谁正在装备这个东西
        let isShowUser: boolean = typeof this._info.isShowCurrUser == 'undefined' ? true : this._info.isShowCurrUser;
        if (this._info.currEquip && isShowUser) {
            this.ndBeastUser.active = true;
            let userId = this._info.currEquip;
            let userCfg = configUtils.getHeroBasicConfig(userId);
            if (userCfg && userCfg.HeroBasicModel) {
                let modelCfg: cfg.Model = configManager.getConfigByKey("model", userCfg.HeroBasicModel);
                if (modelCfg && modelCfg.ModelHeadIconCircular) {
                    let url = `textures/head-hero/${modelCfg.ModelHeadIconCircular}`;
                    if (url) this._iconLoader.changeSprite(this.spBeastUser, url);
                }
            }
        } else {
            this.ndBeastUser.active = false;
        }
    }

    private _showQualityEffect() {
        let quality: number = 0;
        let cfg = null;
        switch(this._type) {
            case ITEM_SHOW_TYPE.HERO:
                cfg = this._cfg as cfg.HeroBasic;
                quality = cfg.HeroBasicQuality;
                break;
            case ITEM_SHOW_TYPE.EQUIP:
                cfg = this._cfg as cfg.Equip;
                quality = cfg.Quality;
                break;
            case ITEM_SHOW_TYPE.ITEM:
                cfg = this._cfg as cfg.Item;
                quality = cfg.ItemQuality;
                break;
            default:
                break;
        }
        if(quality != QUALITY_TYPE.SSR) {
           this._releaseEffect()
        } else {
            if (!this._itemQualityEffect) {
                this._itemQualityEffect = ItemQualityPool.get();
                this.emptyNode.addChild(this._itemQualityEffect.node);
            }
            this._itemQualityEffect.onInit(quality, cc.size(124, 124), QUALITY_EFFECT_TYPE.ITEM);
        }
    }

    refreshSelect(selectId: number, seq?: number) {
        if (this._info.id == selectId && (typeof seq == 'undefined' || seq == this._info.seq)) {
            this.mask.opacity = 255;
            if (!this.mask.active) {
                this.mask.active = true;
            }
        } else {
            this.mask.opacity = 0;
        }
    }

    hideStar(){
        this.starBg.active = false;
        this.starNode.active = false;
    }

    private clearEquipNode() {
        this.equipIcon.node.active = false;
        this.lbEquipLevel.node.active = false;
        this.exclusive.active = false;
        this.levelBg.active = false;
        this.equipSuit.active = false;
        this.equipStarBg.active = false;

        this.starBg.active = true;
        this.starNode.active = true;
        this._stars.forEach((star) => { star.parent.active = false });
    }

    showPiece (v: TransPiece) {
        if (this._tweenTag) return;
        this._tweenTag = 1;
        cc.tween(this.node)
        .delay(0.5)
        .to(0.1, {scaleX: 0})
        .call(()=> {
            this.init({count: v.count, id: v.id, clickHandler: this._info.clickHandler})
        })
        .to(0.1, {scaleX: 1})
        .start().tag(this._tweenTag)
    }

    hideNewIcon(){
    }

    private _releaseEffect () {
        if(this._itemQualityEffect) {
            ItemQualityPool.put(this._itemQualityEffect);
            this._itemQualityEffect = null;
        }
    }
}