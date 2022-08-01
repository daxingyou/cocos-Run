import { appCfg } from "../../../app/AppConfig";
import { CustomItemId } from "../../../app/AppConst";
import { resPathUtils } from "../../../app/ResPathUrlUtils";
import ButtonEx from "../../../common/components/ButtonEx";
import { configManager } from "../../../common/ConfigManager";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { cfg } from "../../../config/config";
import { activityData } from "../../models/ActivityData";
import { shopOpt } from "../../operations/ShopOpt";
import { TileSetBasicGIDS } from "../view-parkour/ParkourConst";
import ItemDoubleWeekBase from "./ItemDoubleWeekBase";

const {ccclass, property} = cc._decorator;

@ccclass
export default class ItemDoubleWeekGift extends ItemDoubleWeekBase {
    @property(cc.Label) limitTips: cc.Label = null;
    @property(ButtonEx) chargeBtn: ButtonEx = null;
    @property(cc.Node) rewardedTips: cc.Node = null;
    @property(cc.Node) redDot: cc.Node = null;
    @property(cc.Sprite) priceIcon: cc.Sprite = null;

    private _gift: number[] = [];
    private _oriPricePos: cc.Vec2 = null;
    private _spLoader: SpriteLoader = null;
    private _giftCfg: cfg.ShopGift = null;

    init(gift: number[], activityId: number, loadView: Function) {
        this._oriPricePos = this._oriPricePos || cc.find('labels/chargeTips', this.node).getPosition();
        this._gift = gift;
        this.baseInit(loadView);
        this._refreshView(activityId);
    }

    private _refreshView(activityId: number) {
        const giftId = this._gift[0];
        const limitCount = this._gift[1];
        const buyCount = activityData.doubleWeekData.ActivityDoubleWeekFunctionMap[activityId]
        && activityData.doubleWeekData.ActivityDoubleWeekFunctionMap[activityId].BuyGiftMap[giftId]
        ? activityData.doubleWeekData.ActivityDoubleWeekFunctionMap[activityId].BuyGiftMap[giftId] : 0;
        const canBuy = buyCount < limitCount;

        this.limitTips.string = `剩余${limitCount - buyCount}次`;
        this.chargeBtn.setActivity(canBuy);
        this.priceIcon.node.active = false;
        this.rewardedTips.active = !canBuy;

        const shopCfg: cfg.ShopGift = configManager.getConfigByKey('gift', giftId);
        this._giftCfg = shopCfg;
        if(canBuy) {
            const costNum = this._getMoneyNum(shopCfg.ShopGiftCost);
            let isNotFree = costNum > 0;
            if(appCfg.UseTestMoney){
                this._spLoader = this._spLoader || new SpriteLoader();
                isNotFree && this._spLoader.changeSprite(this.priceIcon, resPathUtils.getItemIconPath(CustomItemId.ZI_YV), () => {
                    this.priceIcon.node.active = isNotFree;
                });
                let str = isNotFree ? `${costNum}` : '免费';
                this.chargeBtn.setButtonTipsContent(str);
                //@ts-ignore
                this.chargeBtn.buttonTips.getComponent(cc.Label)._forceUpdateRenderData();
                let totalWh = (isNotFree ? this.priceIcon.node.width : 0) + this.chargeBtn.buttonTips.width;
                let halfWh = totalWh >> 1;
                isNotFree && (this.priceIcon.node.x = this._oriPricePos.x - halfWh + (this.priceIcon.node.width >> 1));
                this.chargeBtn.buttonTips.x = this._oriPricePos.x + halfWh - (this.chargeBtn.buttonTips.width >> 1);
            }else {
                let str = costNum > 0 ? `${costNum}元` : '免费';
                this.chargeBtn.buttonTips.x = this._oriPricePos.x;
                this.chargeBtn.setButtonTipsContent(str);
            }

            this.redDot.active = costNum <= 0;
        }

        if(shopCfg) {
            this._refreshReward(shopCfg.ShopGiftItemShow);
        } else {
            this._releaseRewards();
        }
    }

    deInit(): void {
        this._spLoader && this._spLoader.release();
        super.deInit();
    }

    onClickChargeBtn() {
        let giftId = this._gift[0];
        let needMoney = this._getMoneyNum(this._giftCfg && this._giftCfg.ShopGiftCost || 0);
        shopOpt.sendBuyGiftReq(giftId, needMoney);
    }

    private _getMoneyNum(num: number): number {
        return Math.ceil(num / 100);
    }

}
