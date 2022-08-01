import { RES_ICON_PRE_URL } from "../../../app/AppConst";
import { BagItemInfo } from "../../../app/AppType";
import { configUtils } from "../../../app/ConfigUtils";
import { audioManager, SFX_TYPE } from "../../../common/AudioManager";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";

const { ccclass, property } = cc._decorator;

enum ITEM_SHOW_TYPE {
  ITEM = 1,
  HERO,
  EQUIP
}

@ccclass export default class ItemLotteryIcon extends cc.Component {
    @property(cc.Sprite) quailityBox: cc.Sprite = null;
    @property(cc.Sprite) itemSp: cc.Sprite = null;
    @property(cc.Sprite) countBg: cc.Sprite = null;
    @property(cc.Label)  count: cc.Label = null;
    @property(cc.Sprite) tokenTag: cc.Sprite = null;
    @property([cc.SpriteFrame]) qualitySfs: cc.SpriteFrame[] = [];

    private _spLoader: SpriteLoader = new SpriteLoader();
    private _info: BagItemInfo = null;
    private _countBgOriWidth: number = 0;
    private _cfg: any = 0;
    private _type: ITEM_SHOW_TYPE = ITEM_SHOW_TYPE.ITEM;
    private _isToken: boolean = false;

    init(itemInfo: BagItemInfo, isToken: boolean = false) {
        this._info = itemInfo;
        this._isToken = isToken;
        !this._countBgOriWidth && (this._countBgOriWidth = this.countBg.node.width);
        this._prepareData();
        this._initUI();
    }

    deInit() {
        this._spLoader.release();
        this._cfg = null;
        this._isToken = false;
        this._info = null;
    }

    private _prepareData() {
        let _item = this._info.id;
        let cfg: any = configUtils.getItemConfig(_item);
        if (cfg && cfg.ItemId) {
            this._cfg = cfg;
            this._type = ITEM_SHOW_TYPE.ITEM;
            return;
        }

        cfg = configUtils.getEquipConfig(_item);
        if (cfg) {
            this._cfg = cfg;
            this._type = ITEM_SHOW_TYPE.EQUIP;
            return;
        }

        cfg = configUtils.getHeroBasicConfig(_item);
        if (cfg) {
            this._cfg = cfg;
            this._type = ITEM_SHOW_TYPE.HERO;
        }
    }

    private _initUI() {
        switch (this._type) {
            case ITEM_SHOW_TYPE.ITEM: { this._showItem(); break; }
            default: { break; }
        }
    }

    private _showItem() {
        // 品质框
        if (this._cfg && this._cfg.ItemQuality && this.qualitySfs[this._cfg.ItemQuality - 1]) {
            this.quailityBox.spriteFrame = this.qualitySfs[this._cfg.ItemQuality - 1];
        }

         // ICON
        if (this._cfg && this._cfg.ItemIcon) {
            let url = `${RES_ICON_PRE_URL.BAG_ITEM}/${this._cfg.ItemIcon}`;
            this._spLoader.changeSpriteP(this.itemSp, url).then(() => {
                this.itemSp && (this.itemSp.node.active = true);
            });
        }

        // 数量
        let showCnt = this._info.count && this._info.count > 1 ? this._info.count : 0;
        this.count.string = `${showCnt}`;
        this.count.node.active = Boolean(showCnt);
        if(this.count.node.active){
            //@ts-ignore
            this.count._forceUpdateRenderData();
            this.countBg.node.width = Math.max(this.count.node.width + 10, this._countBgOriWidth);
        }

        this.tokenTag.node.active = this._isToken;
    }

    onClickItem() {
        if (this._info && this._info.clickHandler) {
            audioManager.playSfx(SFX_TYPE.BUTTON_CLICK);
            this._info.clickHandler(this._info, this._type);
        }
    }
}
