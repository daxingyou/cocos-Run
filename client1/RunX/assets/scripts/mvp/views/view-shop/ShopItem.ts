/*
 * @Author:xuyang
 * @Date: 2021-06-19 17:39:54
 * @Description: 商店物品Item
 */
import { CustomItemId, PRODUCR_WITH_TREASURE_MAP, RES_ICON_PRE_URL } from "../../../app/AppConst";
import { utils } from "../../../app/AppUtils";
import { configUtils } from "../../../app/ConfigUtils";
import { configManager } from "../../../common/ConfigManager";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { cfg } from "../../../config/config";
import { serverTime } from "../../models/ServerTime";
import { checkExtraCharge, checkGiftRestrict, checkProductRestrict, ShopItemInfo } from "./ShopView";
import {scheduleManager} from "../../../common/ScheduleManager";
import ItemRedDot from "../view-item/ItemRedDot";
import { redDotMgr, RED_DOT_MODULE } from "../../../common/RedDotManager";
import { QUALITY_TYPE } from "../../../app/AppEnums";
import ItemQualityEffect, { QUALITY_EFFECT_TYPE } from "../view-item/ItemQualityEffect";
import { ItemQualityPool } from "../../../common/res-manager/NodePool";
import { trackData } from "../../models/TrackData";
import { pvpData } from "../../models/PvpData";
import { taskData } from "../../models/TaskData";
import { appCfg } from "../../../app/AppConfig";
import { resPathUtils } from "../../../app/ResPathUrlUtils";

const { ccclass, property } = cc._decorator;
enum PAGE_MODE {
    PROP,
    RECHARGE,
    GIFT,
    RANDOM
}

@ccclass
export default class ShopItem extends cc.Component {
    @property(cc.Label) itemName: cc.Label = null;      //物品名称
    @property(cc.Label) restrict: cc.Label = null;      //购买限制
    @property(cc.Label) timeOver: cc.Label = null;      //下架时间
    @property(cc.Label) priceNum: cc.Label = null;      //价格文字
    @property(cc.Node) itemTmp: cc.Node = null;         //物品展示
    @property(cc.Node) extra: cc.Node = null;           //额外赠送
    @property(cc.Sprite) iconName: cc.Sprite = null;    //物品名称
    @property(cc.Sprite) iconRecharge: cc.Sprite = null;//充值/礼包展示
    @property(cc.Sprite) priceIcon: cc.Sprite = null;   //价格图标
    @property(cc.Node) timeLimit: cc.Node = null;       //限时标签
    @property(cc.Node) cheap: cc.Node = null;           //超值标签
    @property(cc.Node) skeNode: cc.Node = null;         //特效流光
    @property([cc.SpriteFrame]) qualitySfs: cc.SpriteFrame[] = [];

    @property(cc.Node) buttonBuy: cc.Node = null;      //售罄
    @property(cc.Node) iconUnSell: cc.Node = null;      //售罄
    @property(ItemRedDot) itemRedDot: ItemRedDot = null;

    private _info: ShopItemInfo = null;
    private _scheduleId: number = 0;
    private _sprLoader: SpriteLoader = new SpriteLoader();  //精灵替换
    private _itemQuality: ItemQualityEffect = null;
    private _price: number = 0;
    private _priceIconVisible: boolean = false;

    getPrice() {
        return this._price;
    }

    init(info: ShopItemInfo) {
        this._info = info;
        if (info.type == PAGE_MODE.PROP) {
            this.showCommodityItem(info.id);
        }
        if (info.type == PAGE_MODE.GIFT) {
            this.showGiftItem(info.id); 
        }
        if (info.type == PAGE_MODE.RECHARGE) {
            this.showRechargeItem(info.id);
        }
        if (info.type == PAGE_MODE.RANDOM) {
            this.showRandomItem(info.id);
        }

        this._updateLayout()
    }

    private _updateLayout() {
        if (this.itemName.string) {
            // @ts-ignore
            this.itemName._forceUpdateRenderData();

            if (this.iconName.node.active) {
                let iconWidth = this.iconName.node.width * this.iconName.node.scale;
                let total = iconWidth + this.itemName.node.width
                this.itemName.node.x = -total/2 + iconWidth;
                this.iconName.node.x = -total/2 + iconWidth/2;
            } else {
                this.itemName.node.x = -this.itemName.node.width/2
            }
        }

        if (this.priceNum.string && this.priceNum.node.parent.active) {
            // @ts-ignore
            this.priceNum._forceUpdateRenderData();
            let iconWidth = this._priceIconVisible ? (this.priceIcon.node.width * this.priceIcon.node.scale) : 0
            let total = iconWidth+ this.priceNum.node.width
            this.priceNum.node.x = -total/2 + iconWidth;
            this.priceIcon.node.x = -total/2 + iconWidth/2;
        }
    }

    showCommodityItem(key: string) {
        this.clear();
        let cfg: cfg.ShopCommodity = configManager.getConfigByKey("commodity", key);
        let parseInfo = utils.parseStingList(cfg.ShopCommodityItem)[0];
        let parseInfoP = utils.parseStingList(cfg.ShopCommodityCost)[0];

        let isSellOut = false;
        this.priceNum.node.parent.active = true;
        //限制购买，每日/每周/每月/终身
        if (cfg.ShopCommodityLimit) {
            let limitCondis = utils.parseStingList(cfg.ShopCommodityLimit)[0];
            let limitType = parseInt(limitCondis[0]), limitValue = parseInt(limitCondis[1]);
            if(PRODUCR_WITH_TREASURE_MAP.hasOwnProperty(key)){
                let extra = taskData.getTreasureSysPowerParam(PRODUCR_WITH_TREASURE_MAP[parseInt(key)]);
                extra && (limitValue += extra);
            }
            let dateHead = ["", "今日", "本周", "本月", "永久"];
            let buyRes = checkProductRestrict(parseInt(key));
            isSellOut = buyRes[0] && buyRes[0] >= buyRes[1];
            this.restrict.string = `${dateHead[limitType]}限购(${limitValue - buyRes[0]}/${limitValue})`;
            this.priceNum.node.parent.active = !isSellOut;
            this.iconUnSell.active = isSellOut;
        }

        if (parseInfo && parseInfoP && parseInfo.length > 0 && parseInfoP.length > 0) {
            let itemCfg: cfg.Item = configManager.getConfigByKey("item", parseInt(parseInfo[0]));
            let quality = this.itemTmp.getChildByName("quality").getComponent(cc.Sprite);
            let icon = this.itemTmp.getChildByName("icon").getComponent(cc.Sprite);
            let countBg = this.itemTmp.getChildByName('bg');
            let count = this.itemTmp.getChildByName("count").getComponent(cc.Label);
            let url = `${RES_ICON_PRE_URL.BAG_ITEM}/${itemCfg.ItemIcon}`;

            count.string = `${parseInfo[1]}`;
            if (countBg) {
                countBg.active = count.node.active = parseFloat(parseInfo[1]) > 1;
            }

            quality.spriteFrame = this.qualitySfs[itemCfg.ItemQuality - 1]
            this._sprLoader.changeSprite(icon, url);
            this.itemName.string = itemCfg.ItemName;
            this.itemTmp.active = true;
            if(count.node.active){
                //@ts-ignore
                count._forceUpdateRenderData();
                if (countBg) {
                    countBg.width = count.node.width + 10;
                }
            }

            //支付价格
            let prizeIconRes = `${RES_ICON_PRE_URL.BAG_ITEM}/${configUtils.getItemConfig(Number(parseInfoP[0])).ItemIcon}`;
            this._priceIconVisible = !!parseInfo[1];
            this._priceIconVisible && this._sprLoader.changeSpriteP(this.priceIcon, prizeIconRes).then(() => {
                this.priceIcon.node.active = this._priceIconVisible
            })
            this._price = parseFloat(parseInfoP[1]) || 0;
            this.priceNum.string = parseInfoP[1] || "免费";
            // 特效
            if (itemCfg.ItemQuality >= QUALITY_TYPE.SSR && !isSellOut) {
                if (!this._itemQuality) {
                    this._itemQuality = ItemQualityPool.get();
                    this.skeNode.addChild(this._itemQuality.node)
                }
                this._itemQuality.onInit(itemCfg.ItemQuality, cc.size(124, 124), QUALITY_EFFECT_TYPE.ITEM);
            } else {
                this._releaseEffect();
            }
        }

        if(isSellOut){
            this._setSpriteMaterial(cc.assetManager.builtins.getBuiltin('material', 'builtin-2d-gray-sprite') as cc.Material);
        }

        if (cfg.ShopCommodityPowerLimit){
            let limit = utils.parseStingList(cfg.ShopCommodityPowerLimit)[0];
            if (limit[0] == 1 && limit[1]){
                let topRank = pvpData.spiritData ? pvpData.spiritData.TopRank : 0;
                if (!(topRank && topRank <= limit[1])){
                    this.restrict.string = `鹤鸣会武至${limit[1]}名`;
                }
            }
        }

        if (this.buttonBuy){
            this.buttonBuy.active = !isSellOut;
        }
    }

    showRandomItem(key: string) {
        this.clear();
        let cfg: cfg.ShopRandom = configManager.getConfigByKey("shopRandom", key);
        let parseInfo = utils.parseStingList(cfg.ShopCommodityItem)[0];
        let parseInfoP = utils.parseStingList(cfg.ShopCommodityCost)[0];

        //限制购买，每日/每周/每月/终身
        let shopRandomDataMap = trackData.shopRandomData ? trackData.shopRandomData.RandomShopCommodityIDMap : {};
        let buyRes = shopRandomDataMap[this._info.id] ? 1 : 0;
        let isSellOut = buyRes && buyRes == 1;

        if (parseInfo && parseInfoP && parseInfo.length > 0 && parseInfoP.length > 0) {
            let itemCfg: cfg.Item = configManager.getConfigByKey("item", parseInt(parseInfo[0]));
            let quality = this.itemTmp.getChildByName("quality").getComponent(cc.Sprite);
            let icon = this.itemTmp.getChildByName("icon").getComponent(cc.Sprite);
            let countBg = this.itemTmp.getChildByName('bg');
            let count = this.itemTmp.getChildByName("count").getComponent(cc.Label);
            let url = `${RES_ICON_PRE_URL.BAG_ITEM}/${itemCfg.ItemIcon}`;

            count.string = `${parseInfo[1]}`;
            if (countBg) {
                countBg.active = count.node.active = parseFloat(parseInfo[1]) > 1;
            }
            
            quality.spriteFrame = this.qualitySfs[itemCfg.ItemQuality - 1]
            this._sprLoader.changeSprite(icon, url);
            this.itemName.string = itemCfg.ItemName;
            this.itemTmp.active = true;

            if(count.node.active && countBg){
                //@ts-ignore
                count._forceUpdateRenderData();
                countBg.width = count.node.width + 10;
            }

            //支付价格
            let prizeIconRes = `${RES_ICON_PRE_URL.BAG_ITEM}/${configUtils.getItemConfig(Number(parseInfoP[0])).ItemIcon}`;
            this._priceIconVisible = !!parseInfo[1];
            this._priceIconVisible && this._sprLoader.changeSpriteP(this.priceIcon, prizeIconRes).then(() => {
                this.priceIcon.node.active = this._priceIconVisible;
            })
            this._price = parseFloat(parseInfoP[1]) || 0;
            this.priceNum.string = parseInfoP[1] || "免费";
            // 特效
            if (itemCfg.ItemQuality >= QUALITY_TYPE.SSR && !isSellOut) {
                if (!this._itemQuality) {
                    this._itemQuality = ItemQualityPool.get();
                    this.skeNode.addChild(this._itemQuality.node)
                }
                this._itemQuality.onInit(itemCfg.ItemQuality, cc.size(124, 124), QUALITY_EFFECT_TYPE.ITEM);
            } else {
                this._releaseEffect();
            }
        }

        this.restrict.string = `限购(${1 - buyRes}/1)`;
        this.priceNum.node.parent.active = !isSellOut;
        this.iconUnSell.active = isSellOut;

        if(isSellOut){
            this._setSpriteMaterial(cc.assetManager.builtins.getBuiltin('material', 'builtin-2d-gray-sprite') as cc.Material);
        }

        if (this.buttonBuy) {
            this.buttonBuy.active = !isSellOut;
        }
        this.itemRedDot.showNew(redDotMgr.getRandomShopItemState(key));
    }

    showRechargeItem(key: string) {
        this.clear();
        if (cc.sys.os == cc.sys.OS_IOS) {
            let cfg: cfg.ShopRechargeIOS = configManager.getConfigByKey("rechargeIOS", key);
            let iconRes = `${RES_ICON_PRE_URL.SHOP}/${cfg.ShopRechargeIOSImage}`;
            this._sprLoader.changeSpriteP(this.iconRecharge, iconRes).then(() => {
                this.iconRecharge.node.active = true;
            });
            //商品标题
            if (cfg.ShopRechargeIOSPropertyID && cfg.ShopRechargeIOSPropertyCount) {
                let itemCfg: cfg.Item = configManager.getConfigByKey("item", cfg.ShopRechargeIOSPropertyID);
                let url = `${RES_ICON_PRE_URL.BAG_ITEM}/${itemCfg.ItemIcon}`;
                this._sprLoader.changeSpriteP(this.iconName, url).then(() => {
                    this.iconName.node.active = true;
                    this._updateLayout();
                });
                this.itemName.string = cfg.ShopRechargeIOSPropertyCount.toString();
            }

            let isNotFree = !!cfg.ShopRechargeIOSCost;
            this._price = isNotFree ? cfg.ShopRechargeIOSCost / 100 : 0;
            //价格
            if(appCfg.UseTestMoney){
                isNotFree && (this._priceIconVisible = true);
                this._priceIconVisible && this._sprLoader.changeSpriteP(this.priceIcon, resPathUtils.getItemIconPath(CustomItemId.ZI_YV)).then(() => {
                    this.priceIcon.node.active = this._priceIconVisible;
                });
                this.priceNum.string =  isNotFree ? `${this._price}` : "免费";
            }else{
                this.priceNum.string =  isNotFree ? `￥${this._price}` : "免费";
            }

            //额外赠送
            if (cfg.ShopRechargeIOSPropertyID) {
                let itemCfg: cfg.Item = configManager.getConfigByKey("item", cfg.ShopRechargeIOSPropertyID);
                let icon = this.extra.getChildByName("icon").getComponent(cc.Sprite);
                let num = this.extra.getChildByName("num").getComponent(cc.Label);
                let url = `${RES_ICON_PRE_URL.BAG_ITEM}/${itemCfg.ItemIcon}`;

                let fistCharge = checkExtraCharge(parseInt(key));
                this._sprLoader.changeSprite(icon, url);
                num.string = fistCharge ? cfg.ShopRechargeIOSBundledCount.toString() : cfg.ShopRechargeIOSGiveCount.toString();
            }
            // this.extra.active = checkExtraCharge(parseInt(key));
            this.extra.active = true;
        } else {
            let cfg: cfg.ShopRechargeAndroid = configManager.getConfigByKey("rechargeAndroid", key);
            let iconRes = `${RES_ICON_PRE_URL.SHOP}/${cfg.ShopRechargeAndroidImage}`;
            this._sprLoader.changeSpriteP(this.iconRecharge, iconRes).then(() => {
                this.iconRecharge.node.active = true;
            });
            //商品标题
            if (cfg.ShopRechargeAndroidPropertyID && cfg.ShopRechargeAndroidPropertyCount) {
                let itemCfg: cfg.Item = configManager.getConfigByKey("item", cfg.ShopRechargeAndroidPropertyID);
                let url = `${RES_ICON_PRE_URL.BAG_ITEM}/${itemCfg.ItemIcon}`;
                this._sprLoader.changeSpriteP(this.iconName, url).then(() => {
                    this.iconName.node.active = true;
                    this._updateLayout();
                });
                this.itemName.string = cfg.ShopRechargeAndroidPropertyCount.toString();
            }

            let isNotFree = !!cfg.ShopRechargeAndroidCost;
            this._price = isNotFree ? cfg.ShopRechargeAndroidCost / 100 : 0;
            //价格
            if(appCfg.UseTestMoney){
                isNotFree && (this._priceIconVisible = true);
                this._priceIconVisible && this._sprLoader.changeSpriteP(this.priceIcon, resPathUtils.getItemIconPath(CustomItemId.ZI_YV)).then(() => {
                    this.priceIcon.node.active = this._priceIconVisible;
                });
                this.priceNum.string =  isNotFree ? `${this._price}` : "免费";
            }else{
                this.priceNum.string =  isNotFree ? `￥${this._price}` : "免费";
            }

            //额外赠送
            if (cfg.ShopRechargeAndroidPropertyID) {
                let itemCfg: cfg.Item = configManager.getConfigByKey("item", cfg.ShopRechargeAndroidPropertyID);
                let icon = this.extra.getChildByName("icon").getComponent(cc.Sprite);
                let num = this.extra.getChildByName("num").getComponent(cc.Label);
                let url = `${RES_ICON_PRE_URL.BAG_ITEM}/${itemCfg.ItemIcon}`;
                let fistCharge = checkExtraCharge(parseInt(key));
                this._sprLoader.changeSprite(icon, url);
                num.string = fistCharge ? cfg.ShopRechargeAndroidBundledCount.toString() : cfg.ShopRechargeAndroidGiveCount.toString();
            }
            this.extra.getChildByName('bg').active = checkExtraCharge(parseInt(key));
            this.extra.getChildByName('bg2').active = !checkExtraCharge(parseInt(key));
            this.extra.active = true;
        }
    }


    showGiftItem(key: string) {
        this.clear();
        let cfg: cfg.ShopGift = configManager.getConfigByKey("gift", key);
        let buyRes = checkGiftRestrict(parseInt(key));
        let isSellOut = buyRes[0] && buyRes[0] >= buyRes[1];
        let iconRes = `${RES_ICON_PRE_URL.SHOP}/${cfg.ShopGiftImage}`;
        this._sprLoader.changeSpriteP(this.iconRecharge, iconRes).then(() => {
            this.iconRecharge.node.active = true;
        });

        if(isSellOut){
            this._setSpriteMaterial(cc.assetManager.builtins.getBuiltin('material', 'builtin-2d-gray-sprite') as cc.Material);
        }
        //限制购买，每日/每周/每月/终身
        if (cfg.ShopGiftLimit) {
            let limit = utils.parseStingList(cfg.ShopGiftLimit)[0];
            let dateHead = ["", "今日", "本周", "本月", "永久", "活动"];

            this.restrict.string = `${dateHead[limit[0]]}限购(${limit[1] - buyRes[0]}/${limit[1]})`;
            // this.buttonBuy.active = !buyRes[0] || buyRes[0] < buyRes[1];
            this.iconUnSell.active = isSellOut;
        }
        //剩余持续时间
        if (cfg.ShopGiftSellTime && cfg.ShopGiftHoldTime) {
            let resetTime = configUtils.getBasicConfig().ActivityResetCron;            //活动重置时间
            let resetArr = resetTime.split("|") || [];
            let hour = resetArr[1] || 0,
                minute = resetArr[0] || 0,
                second = 0;
            let timeStr = cfg.ShopGiftSellTime.split(";").join("-");
            let beginTime = Number(new Date(`${timeStr} ${hour}:${minute}:${second}`)) / 1000;
            let limitTime = beginTime + cfg.ShopGiftHoldTime;
            let currTime = serverTime.currServerTime();
            if (currTime < limitTime) {
                this.timeOver.string = utils.getTimeInterval(limitTime - currTime) + "后下架";
                this._scheduleId = scheduleManager.schedule(() => {
                    let lTime = limitTime - serverTime.currServerTime();
                    if (lTime > 0) {
                        this.timeOver.string = utils.getTimeInterval(lTime) + "后下架";
                    } else {
                        this.timeOver.string = "该礼包已下架";
                        this._info.dellFunc && this._info.dellFunc();
                        scheduleManager.unschedule(this._scheduleId);
                    }
                }, 1)
            } else {
                this.timeOver.string = "该礼包已下架";
                this._info.dellFunc && this._info.dellFunc();
            }
        }
        //标签
        if (cfg.ShopGiftTips) {
            let tips = ["", "超值", "限时"];
            this.cheap.active = cfg.ShopGiftTips == 1;
            this.timeLimit.active = cfg.ShopGiftTips == 2;
        }
        this.itemName.string = cfg.ShopGiftName || '';

        //价格
        let isNotFree = !!cfg.ShopGiftCost;
        this._price = isNotFree ? cfg.ShopGiftCost / 100 : 0;
        if(appCfg.UseTestMoney){
            isNotFree && (this._priceIconVisible = true);
            this._priceIconVisible && this._sprLoader.changeSpriteP(this.priceIcon, resPathUtils.getItemIconPath(CustomItemId.ZI_YV)).then(() => {
                this.priceIcon.node.active = this._priceIconVisible;
            });
            this.priceNum.string = isNotFree ? `${this._price}` : "免费";
        }else {
            this.priceNum.string = isNotFree ? `￥${this._price}` : "免费";
        }

        this.itemRedDot.setData(RED_DOT_MODULE.SHOP_GIFT_ITEM, {
            args: [cfg.ShopGiftId]
        });
        this.priceNum.node.parent.active = !isSellOut;
    }

    clear() {
        this._priceIconVisible = false;
        this._price = 0;
        this.iconName.node.active = false;
        this.extra.active = false;
        this.itemTmp.active = false;
        this.priceIcon.node.active = false;
        this.iconRecharge.node.active = false;
        this.priceNum.string = "";
        this.itemName.string = "";
        this.timeOver.string = "";
        this.restrict.string = "";
        this.iconUnSell.active = false;
        this.timeLimit.active = false;
        this.cheap.active = false;
        this.priceNum.node.parent.active = true;
        this._setSpriteMaterial(cc.assetManager.builtins.getBuiltin('material', 'builtin-2d-sprite') as cc.Material);
        this.itemRedDot.deInit();
        scheduleManager.unschedule(this._scheduleId);
    }

    private _setSpriteMaterial(material: cc.Material){
        if(!cc.isValid(material)) return;
        let sprites = this.node.getComponentsInChildren(cc.Sprite);
        sprites && sprites.forEach(ele => {
            ele.setMaterial(0, material);
        });
    }

    deInit() {
        this._sprLoader.release();
        if (this._scheduleId) {
            scheduleManager.unschedule(this._scheduleId);
        }
        this.clear();
        this._releaseEffect();
    }

    unuse() {
        this.deInit();
    }

    private _releaseEffect () {
        if(this._itemQuality) {
            ItemQualityPool.put(this._itemQuality);
            this._itemQuality = null;
        }
    }
    //道具、礼包购买限制
    reuse() {

    }
}