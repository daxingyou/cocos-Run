// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import { RES_ICON_PRE_URL } from "../../../../app/AppConst";
import { QUALITY_TYPE } from "../../../../app/AppEnums";
import { configUtils } from "../../../../app/ConfigUtils";
import { ItemQualityPool } from "../../../../common/res-manager/NodePool";
import { SpriteLoader } from "../../../../common/ui-helper/SpriteLoader";
import { cfg } from "../../../../config/config";
import ItemQualityEffect, { QUALITY_EFFECT_TYPE } from "../../view-item/ItemQualityEffect";

const {ccclass, property} = cc._decorator;

export interface ItemPveShopInfo {
    /** 商品ID */
    gainID: number,
    /** 商品数量 */
    gainCount: number,
    /** 价格ID */
    costID: number,
    /** 价格数量 */
    costCount: number,
    /** 限购描述 */
    restrictStr?: string,
    /** 售罄 */
    isSellOut?: boolean,
    /** 折扣(%) */
    discount?: number,
    /** 点击回调 */
    clickFunc?: Function
}

@ccclass
export default class ItemPveShop extends cc.Component {
    @property([cc.SpriteFrame]) qualifySfs: cc.SpriteFrame[] = [];

    @property(cc.Sprite) discountBg: cc.Sprite = null;      // 折扣背景
    @property(cc.Label) discount: cc.Label = null;          // 折扣文字

    @property(cc.Label) itemName: cc.Label = null;          // 商品名字
    @property(cc.Sprite) itemQualify: cc.Sprite = null;     // 商品展示框
    @property(cc.Sprite) itemIcon: cc.Sprite = null;        // 商品ICON
    @property(cc.Sprite) itemCountBg: cc.Sprite = null;     // 商品数量阴影
    @property(cc.Label) itemCount: cc.Label = null;         // 商品数量
    @property(cc.Node) skeNode: cc.Node = null;             // 特效节点

    @property(cc.Label) restrict: cc.Label = null;          // 限购描述
    @property(cc.Node) unSell: cc.Node = null;              // 售罄
    @property(cc.Sprite) costIcon: cc.Sprite = null;        // 价格ICON
    @property(cc.Label) costCount: cc.Label = null;         // 价格数量

    private _spriteLoader: SpriteLoader = new SpriteLoader();

    private _qualityEffect: ItemQualityEffect = null;

    private _clickFunc: Function = null;

    init(info: ItemPveShopInfo) {
        this.node.active = true;

        // 折扣
        if (info.discount > 0) {
            this.discountBg.node.active = true;
            this.discount.string = info.discount + "%" + "\n折扣";
        } else {
            this.discountBg.node.active = false;
            this.discount.string = "";
        }

        // 展示商品
        let gainConfig: cfg.Item = configUtils.getItemConfig(info.gainID);
        
        this.itemName.string = gainConfig.ItemName;
        
        this.itemQualify.spriteFrame = this.qualifySfs[gainConfig.ItemQuality-1];
        
        let url = `${RES_ICON_PRE_URL.BAG_ITEM}/${gainConfig.ItemIcon}`;
        this._spriteLoader.changeSprite(this.itemIcon, url);

        if (info.gainCount > 1) {
            this.itemCountBg.node.active = true;
            this.itemCount.string = info.gainCount > 10000 ? Math.floor(info.gainCount/10000) + "万" : String(info.gainCount);
            (this.itemCount as any)._forceUpdateRenderData();
            this.itemCountBg.node.width = this.itemCount.node.width + 10;
        } else {
            this.itemCountBg.node.active = false;
            this.itemCount.string = "";
        }

        if (gainConfig.ItemQuality >= QUALITY_TYPE.SSR && !info.isSellOut) {
            if (!this._qualityEffect) {
                this._qualityEffect = ItemQualityPool.get();
                this.skeNode.addChild(this._qualityEffect.node)
            }
            this._qualityEffect.onInit(gainConfig.ItemQuality, cc.size(124, 124), QUALITY_EFFECT_TYPE.ITEM);
        } else {
            this._releaseEffect();
        }

        // 限购
        if (info.restrictStr) {
            this.restrict.string = info.restrictStr;
        }

        // 售罄
        this.unSell.active = info.isSellOut;
        if(info.isSellOut){
            this._setSpriteMaterial(cc.assetManager.builtins.getBuiltin('material', 'builtin-2d-gray-sprite') as cc.Material);
        }

        // 价格
        this.costIcon.node.active = !info.isSellOut;
        this.costCount.node.active = !info.isSellOut;
        if (!info.isSellOut) {
            let costUrl: string = `${RES_ICON_PRE_URL.BAG_ITEM}/${configUtils.getItemConfig(info.costID).ItemIcon}`;
            this._spriteLoader.changeSprite(this.costIcon, costUrl);
            this.costCount.string = info.costCount > 10000 ? Math.floor(info.costCount/10000) + "万" : String(info.costCount);
            (this.costCount as any)._forceUpdateRenderData();
            let iconWidth = this.costIcon.node.width * this.costIcon.node.scale;
            let total = iconWidth+ this.costCount.node.width
            this.costCount.node.x = -total/2 + iconWidth;
            this.costIcon.node.x = -total/2 + iconWidth/2;
        }

        // 点击回调
        this._clickFunc = info.clickFunc;
    }

    private _releaseEffect () {
        if(this._qualityEffect) {
            ItemQualityPool.put(this._qualityEffect);
            this._qualityEffect = null;
        }
    }

    private _setSpriteMaterial(material: cc.Material){
        if(!cc.isValid(material)) return;
        let sprites = this.node.getComponentsInChildren(cc.Sprite);
        sprites && sprites.forEach(ele => {
            ele.setMaterial(0, material);
        });
    }

    deInit() {
        this._spriteLoader.release();

        this._releaseEffect();

        this._setSpriteMaterial(cc.assetManager.builtins.getBuiltin('material', 'builtin-2d-sprite') as cc.Material);
    }

    onClickThis() {
        this._clickFunc != null && (this._clickFunc());
    }
}
