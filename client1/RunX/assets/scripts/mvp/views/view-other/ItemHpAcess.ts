import { QUALITY_TYPE } from "../../../app/AppEnums";
import { configUtils } from "../../../app/ConfigUtils";
import { resPathUtils } from "../../../app/ResPathUrlUtils";
import { ItemQualityPool } from "../../../common/res-manager/NodePool";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { bagData } from "../../models/BagData";
import ItemQualityEffect, { QUALITY_EFFECT_TYPE } from "../view-item/ItemQualityEffect";

const { ccclass, property } = cc._decorator;

@ccclass export default class ItemHpAcess extends cc.Component {

    @property(cc.Label)     lbName: cc.Label = null;
    @property(cc.Node)      skRoot: cc.Node = null;
    @property(cc.Sprite)    icon: cc.Sprite = null;
    @property(cc.Sprite)    spQuality: cc.Sprite = null;
    @property(cc.Label)     lbCnt: cc.Label = null;
    @property(cc.SpriteFrame)     qualitySfs: cc.SpriteFrame[] = [];

    private _itemQuality: ItemQualityEffect = null;
    private _sprLoader = new SpriteLoader();
    private _itemID: number = 0;
    private _clickIcon: Function = null;
    private _clickUse: Function = null;

    onInit (itemId: number, clickIcon: Function, clickUse: Function) {
        let itemCfg = configUtils.getItemConfig(itemId);

        if (!itemCfg) return;

        this._itemID = itemId;
        this._clickIcon = clickIcon;
        this._clickUse = clickUse;

        let itemCnt = bagData.getItemCountByID(itemId) || 0;
        if (itemCfg) {
            this.lbName.string = `${itemCfg.ItemName}`;
            this.spQuality.spriteFrame = this.qualitySfs[itemCfg.ItemQuality - 1];
            this.lbCnt.string = `${itemCnt}`;
            this.lbCnt.node.color = !!itemCnt ? cc.color(255,255,255) : cc.color(255,0,0);
            this._sprLoader.changeSprite(this.icon, resPathUtils.getItemIconPath(itemId));
 
            if (itemCfg.ItemQuality >= QUALITY_TYPE.SSR) {
                if(!this._itemQuality) {
                    this._itemQuality = ItemQualityPool.get();
                    this.skRoot.addChild(this._itemQuality.node)
                }
                this._itemQuality.onInit(itemCfg.ItemQuality, cc.size(124, 124), QUALITY_EFFECT_TYPE.ITEM);
            } else {
                this._releaseEffect()
            }           
        }
    }

    unuse () {
        this._sprLoader.release();
        this._releaseEffect();
    }

    onClickIcon () {
        this._clickIcon && this._clickIcon(this._itemID)
    }

    onUseItem () {
        this._clickUse && this._clickUse(this._itemID)
    }

    private _releaseEffect () {
        if(this._itemQuality) {
            ItemQualityPool.put(this._itemQuality);
            this._itemQuality = null;
        }
    }
}