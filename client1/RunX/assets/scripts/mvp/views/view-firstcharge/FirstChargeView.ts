import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { cfg } from "../../../config/config";
import { configManager } from "../../../common/ConfigManager";
import { utils } from "../../../app/AppUtils";
import { ItemBagPool } from "../../../common/res-manager/NodePool";
import { shopOpt } from "../../operations/ShopOpt";
import { eventCenter } from "../../../common/event/EventCenter";
import { commonEvent, shopEvent } from "../../../common/event/EventData";
import { data, gamesvr } from "../../../network/lib/protocol";
import guiManager from "../../../common/GUIManager";
import ItemBag from "../view-item/ItemBag";
import moduleUIManager from "../../../common/ModuleUIManager";
import { appCfg } from "../../../app/AppConfig";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { CustomItemId, FIRST_CHARGE_GIFT_ID } from "../../../app/AppConst";
import { resPathUtils } from "../../../app/ResPathUrlUtils";
import { trackData } from "../../models/TrackData";
import { ItemInfo } from "../../../app/AppType";
import { activityData } from "../../models/ActivityData";
import { activityUtils } from "../../../app/ActivityUtils";
import { serverTime } from "../../models/ServerTime";

const { ccclass, property } = cc._decorator;

@ccclass
export default class FirstChargeView extends ViewBaseComponent{
    @property(cc.Sprite) priceIcon: cc.Sprite = null;
    @property(cc.Label) price: cc.Label = null;
    @property(cc.Node) rewardsTemplate: cc.Node = null;
    @property(cc.Node) rewardContainor: cc.Node = null;

    private _rewardCfgs: Map<number, ItemInfo[]> = null;
    private _itemBags: ItemBag[] = [];
    private _rewardNodes: Map<number, cc.Node> = null;
    private _spLoader: SpriteLoader = null;
    private _giftCfg: cfg.ShopGift = null;

    onInit(moduleId: number) {
        eventCenter.register(shopEvent.BUY_GIFT, this, this._recvBuyRes);
        eventCenter.register(shopEvent.RECV_FIRST_CHARGE_REWARD, this, this._recvFirstChargeReward);
        eventCenter.register(commonEvent.TIME_DAY_RESET, this, this._onDayReset);
        this._prepareData();
        this._showView();
    }

    onRelease() {
        eventCenter.unregisterAll(this);
        this._spLoader && this._spLoader.release();
        this._clearItems();
        if(this._rewardNodes) {
            this._rewardNodes.forEach(ele => {
                ele.destroy();
            });
            this._rewardNodes.clear();
        }
    }

    private _prepareData() {
        if(this._rewardCfgs) return;
        this._rewardCfgs = new Map<number, ItemInfo[]>();
        this._giftCfg = configManager.getConfigByKey('gift', FIRST_CHARGE_GIFT_ID);
        let rewardCfg: cfg.FirstPay[] = configManager.getConfigList('firstPay');
        rewardCfg && rewardCfg.sort((l, r) => {return l.FirstPayDay - r.FirstPayDay});
        rewardCfg.forEach((ele, idx) => {
            let day = ele.FirstPayDay;
            if(!ele.FirstPayRewardShow || ele.FirstPayRewardShow.length == 0) return;

            !this._rewardCfgs.has(day) && !this._rewardCfgs.set(day, []);
            utils.parseStingList(ele.FirstPayRewardShow, (strArr: string[]) => {
                if(!strArr || !Array.isArray(strArr)|| strArr.length == 0) return;
                this._rewardCfgs.get(day).push({itemId: parseInt(strArr[0]), num: parseInt(strArr[1])});
            });
        })
    }

    private _showView(){
        let rewardCfgs = this._rewardCfgs;
        if (rewardCfgs) {
            let perRewardsW = this.rewardContainor.width / rewardCfgs.size;
            let startPosX = -(this.rewardContainor.width >> 1);
            for (let day of rewardCfgs.keys()) {
                let node = cc.instantiate(this.rewardsTemplate);
                node.setPosition(startPosX + perRewardsW * day - (perRewardsW >> 1), 0);
                node.parent = this.rewardContainor;
                node.active = true;
                let titleNode = node.getChildByName('title');
                titleNode.getComponent(cc.Label).string = this._getTitleDesc(day);
                this._addRewardItem(day, node.getChildByName('itemContainor'));
                this._rewardNodes = this._rewardNodes || new Map();
                this._rewardNodes.set(day, node);
            }
        }
        this._updateUI();
    }

    // 刷新UI可变部分
    private _updateUI() {
        this._setupPrice();
        if(this._rewardNodes) {
            this._rewardNodes.forEach((ele, key) => {
                let token = false;
                if(activityData.firstChargeData && activityData.firstChargeData.RewardRecord) {
                    token =  activityData.firstChargeData.RewardRecord.indexOf(key) != -1;
                }
                ele.getChildByName('over').active = token;
            });
        }
    }

    private _addRewardItem(day: number, parsentNode: cc.Node) {
        if(!this._rewardCfgs.has(day) || !this._rewardCfgs.get(day)) return;
        let rewardCfgs = this._rewardCfgs.get(day);

        let itemW = 0;
        let totalW: number, startX: number, spaceX = 5, scale = 0.9;
        rewardCfgs.forEach(ele => {
            let giftItem = ItemBagPool.get();
            if(typeof totalW == 'undefined') {
                itemW = giftItem.node.width * scale;
                totalW = itemW * rewardCfgs.length + (rewardCfgs.length - 1) * spaceX;
                startX = -(totalW >> 1);
            }
            this._itemBags.push(giftItem);
            giftItem.node.parent = parsentNode;
            giftItem.node.setPosition(startX + (itemW >> 1), 0);
            startX += (itemW +spaceX);
            giftItem.node.scale = scale;
            giftItem.init({
                id: ele.itemId,
                count: ele.num,
                prizeItem: true,
                clickHandler: () => {
                    moduleUIManager.showItemDetailInfo( ele.itemId, ele.num, this.node)
                }
            });
        });
    }

    private _setupPrice(){
        let shopGiftCfg = this._giftCfg;
        if(!shopGiftCfg) return;
        if(appCfg.UseTestMoney){
            this._spLoader = this._spLoader || new SpriteLoader();
            this.priceIcon && this._spLoader.changeSprite(this.priceIcon, resPathUtils.getItemIconPath(CustomItemId.ZI_YV));
            this.price.string = this._getPriceDesc(shopGiftCfg);
            //@ts-ignore
            this.price._forceUpdateRenderData();
            let totalWh = this.priceIcon.node.width + this.price.node.width;
            let halfWh = totalWh >> 1;
            this.priceIcon.node.x = -halfWh + (this.priceIcon.node.width >> 1);
            this.price.node.x = halfWh - (this.price.node.width >> 1);
            return;
        }
        this.priceIcon.node.active = false;
        this.price.string = this._getPriceDesc(shopGiftCfg);
    }

    private _clearItems() {
        this._itemBags.forEach(_i => {
            _i.node.removeFromParent();
            ItemBagPool.put(_i)
        });
        this._itemBags.length = 0;
    }

    private _recvBuyRes(cmd: any, msg: gamesvr.IPayResultNotify) {
        if (msg && msg.ProductID == FIRST_CHARGE_GIFT_ID){
            guiManager.loadView("GetItemView", null, msg.PropertyList || [], msg.ExtraPropertyList || []);
        }
        // 刷新界面
        this._updateUI();
    }

    private _onDayReset() {
        this._updateUI();
    }

    private _recvFirstChargeReward(cmd: any, prizes: data.IItemInfo[]) {
        let curState = this._getFirstPayTakebleRewardCfg();

        prizes && prizes.length > 0 && guiManager.loadView("GetItemView", null, prizes);
        // 所有首充礼包奖励都已领取
        if(curState.state == FIRST_PAY_REWARD_STATE.ALL_TAKED) {
            this.closeView();
            return;
        }

        // 刷新界面
        this._updateUI();
    }

    onClickBuy(){
        if(activityUtils.checkAllFirstPayRewardToken()) return;
        // 购买首充礼包
        if(trackData.checkFirstCharge()) {
            let needMoney = this._giftCfg && this._giftCfg.ShopGiftCost || 0;
            needMoney /= 100;
            shopOpt.sendBuyGiftReq(FIRST_CHARGE_GIFT_ID, needMoney);
            return;
        }

        let targetCfg = this._getFirstPayTakebleRewardCfg();
        if(targetCfg.state == FIRST_PAY_REWARD_STATE.TAKED) {
            guiManager.showTips('今日奖励已领取，请明天再来');
            return;
        }

        if(targetCfg.state == FIRST_PAY_REWARD_STATE.ALL_TAKED) {
            guiManager.showTips('首充奖励已全部领取');
            return;
        }

        // 领取首充礼包的附赠礼包
        if(targetCfg.state == FIRST_PAY_REWARD_STATE.NO_TAKE && targetCfg.cfg) {
            shopOpt.sendTakeFirstPayGiftBag(targetCfg.cfg.FirstPayId);
        }
    }

    private _getTitleDesc(day: number) {
        if(day == 1) {
            return '立即获得';
        }

        if(day == 2) {
            return '次日领取';
        }

        return `${utils.transformToChinese(day)}日领取`;
    }

    // 充值/领奖按钮的文本内容
    private _getPriceDesc(shopGiftCfg: cfg.ShopGift) {
        if(!shopGiftCfg) return '';

        let targetCfg = this._getFirstPayTakebleRewardCfg();
        if(targetCfg.state == FIRST_PAY_REWARD_STATE.NO_PAY) {
            return appCfg.UseTestMoney ? `${shopGiftCfg.ShopGiftCost/100}` : `￥${shopGiftCfg.ShopGiftCost/100}`;
        }

        if(targetCfg.state == FIRST_PAY_REWARD_STATE.TAKED) {
            return '明日再来';
        }
        return '领取奖励';
    }

    // 获取首充礼包可领取的奖励配置
    private _getFirstPayTakebleRewardCfg(): {state: FIRST_PAY_REWARD_STATE, cfg: cfg.FirstPay} {
        let result: {state: FIRST_PAY_REWARD_STATE, cfg: cfg.FirstPay} = {state: FIRST_PAY_REWARD_STATE.NO_PAY, cfg: null};
        let productRecords = trackData.productRecords;
        // 未购买首充礼包
        if(!productRecords || !productRecords.hasOwnProperty(FIRST_CHARGE_GIFT_ID +'')) {
            result.state = FIRST_PAY_REWARD_STATE.NO_PAY;
            return result;
        }

        let firstPayRecord = productRecords[FIRST_CHARGE_GIFT_ID +''];
        let firstPayTime = utils.longToNumber(firstPayRecord.PurchaseTime[0]);
        let zeroTime = utils.getZeroTimeByTimeStamp(firstPayTime);
        let curTime = serverTime.currServerTime();
        let costDays = Math.floor((curTime - zeroTime)/86400);
        // 购买首充礼包当天
        if(costDays == 0) {
            result.state = FIRST_PAY_REWARD_STATE.TAKED;
            return result;
        }

        // 首充礼包配置异常，通常不会出现
        let firstPayCfgs = configManager.getConfigs('firstPay');
        if(!firstPayCfgs) {
            result.state = FIRST_PAY_REWARD_STATE.ALL_TAKED;
            return result;
        }

        let tokenCnt = 0;
        let rewardCnt = 0;
        for(let k in firstPayCfgs) {
            if(!firstPayCfgs.hasOwnProperty(k)) continue;
            let cfg: cfg.FirstPay = firstPayCfgs[k];
            rewardCnt += 1;
            let rewardIdx = activityData.firstChargeData.RewardRecord.indexOf(cfg.FirstPayId);
            //招到了未领取奖励的项
            if(cfg.FirstPayDay != 1 && cfg.FirstPayDay - 1 <= costDays && rewardIdx == -1) {
                result.cfg = cfg;
                result.state = FIRST_PAY_REWARD_STATE.NO_TAKE;
                return result;
            }
            if(rewardIdx != -1) tokenCnt += 1;
        }

        // 符合条件的已领取，还有不符合条件的
        if(tokenCnt != rewardCnt) {
            result.state = FIRST_PAY_REWARD_STATE.TAKED;
            return  result;
        }

        // 所有奖励都已经领取
        result.state = FIRST_PAY_REWARD_STATE.ALL_TAKED;
        return result;
    }
}

enum FIRST_PAY_REWARD_STATE {
    NO_PAY,
    NO_TAKE,
    TAKED,
    ALL_TAKED,
}
