/*
 * @Author: xuyang
 * @Date: 2021-06-28 17:10:02
 * @Description: 商店操作类
 */
import { eventCenter } from "../../common/event/EventCenter";
import { gamesvr } from "../../network/lib/protocol";
import { operationSvr } from "../../network/OperationSvr";
import { BaseOpt } from "./BaseOpt";
import { activityEvent, shopEvent, timeLimitEvent } from "../../common/event/EventData"
import { trackData } from "../models/TrackData";
import { configManager } from "../../common/ConfigManager";
import { cfg } from "../../config/config";
import PackageUtils from "../../app/PackageUtils";
import { userData } from "../models/UserData";
import { redDotMgr, RED_DOT_MODULE } from "../../common/RedDotManager";
import { configUtils } from "../../app/ConfigUtils";
import { limitData } from "../models/LimitData";
import { appCfg } from "../../app/AppConfig";
import { bagDataUtils } from "../../app/BagDataUtils";
import { FIRST_CHARGE_GIFT_ID } from "../../app/AppConst";
import { activityData } from "../models/ActivityData";
import { activityUtils } from "../../app/ActivityUtils";
import GameSvr from "../../network/GameSvr";

class ShopOpt extends BaseOpt {

    init() {
        this.registerAllEvent();
    }

    //注册消息队列监听
    registerAllEvent() {
        this.addEventListener(gamesvr.CMD.BUY_PRODUCT_RES, this._onProductBuyRes);
        this.addEventListener(gamesvr.CMD.GET_PAY_ORDER_RES, this._onProductChargeRes);
        this.addEventListener(gamesvr.CMD.GET_GIFT_ORDER_RES, this._onGiftBuyRes);
        this.addEventListener(gamesvr.CMD.PAY_RESULT_NOTIFY, this._onPayResultNotify);
        //限时礼包购买
        this.addEventListener(gamesvr.CMD.SHOP_TIME_FINITE_GIFT_BUY_GIFT_RES, this._recvBuyLimitedTimeGiftBag);
        this.addEventListener(gamesvr.CMD.SHOP_RANDOM_SHOP_BUY_RES, this._onShopRandomBuyRes);
        this.addEventListener(gamesvr.CMD.SHOP_RANDOM_SHOP_REFRESH_RES, this._onShopRandomRefreshRes);
        this.addEventListener(gamesvr.CMD.SHOP_RANDOM_SHOP_REFRESH_NOTIFY, this._onShopRandomRefreshNotify);

        this.addEventListener(gamesvr.CMD.BUY_CURRENCY_GIFT_RES, this._recvBuyCurrencyGift);
        this.addEventListener(gamesvr.CMD.ACTIVITY_FIRST_CHARGE_RECEIVE_REWARD_RES, this._recvTakeFirstPayGiftBag);
        this.addEventListener(gamesvr.CMD.ACTIVITY_FEAST_GIF_BUY_GIFT_COUNT_NOTIFY, this._recvFeastGiftNtf);
    }

    //购买道具成功
    private _onProductBuyRes(recvMsg: { Result: number, Desc: string, Msg: gamesvr.IBuyProductRes }) {
        if (!this._checkResValid(recvMsg)) {
            return;
        }
        let msg = recvMsg.Msg;
        msg.Record && trackData.updateProductRecords(msg.Record.ProductID.toString(), msg.Record);
        eventCenter.fire(shopEvent.BUY_PRODUCT, msg);
        
    }
    //充值支付单号响应(无支付，暂不处理)
    private _onProductChargeRes(recvMsg: { Result: number, Desc: string, Msg: gamesvr.IGetPayOrderRes }) {
        if (!this._checkResValid(recvMsg)) {
            return;
        }

        let msg = recvMsg.Msg;
        let accInfo = operationSvr.accountInfo
        PackageUtils.nativePay(
            msg.Order, 
            ""+msg.PropertyID, 
            "钻石", 
            msg.Price, 
            msg.Price,
            msg.PropertyCount,
            "钻石"+msg.PropertyCount, 
            msg.OrderTime.toString(),
            accInfo.UserID,
            accInfo.UserID, 
            ""+userData.accountData.UserRoleID, 
            userData.accountData.Name,
            '1', 
            '9800', 
            '正式服', 
            accInfo.Ext, 
            accInfo.Session, 
            msg.Sign, 
            msg.PlatOrderID, 
            msg.NoticeUrl
        )
    }
    //礼包支付单号响应(无支付，暂不处理)
    private _onGiftBuyRes(recvMsg: { Result: number, Desc: string, Msg: gamesvr.IGetGiftOrderRes }) {
        if (!this._checkResValid(recvMsg)) {
            return;
        }

        let msg = recvMsg.Msg;
        let accInfo = operationSvr.accountInfo
        PackageUtils.nativePay(
            msg.Order,
            ""+msg.ProductID,
            "礼包",
            msg.Price,
            msg.Price,
            1,
            "礼包"+msg.ProductID,
            msg.OrderTime.toString(),
            accInfo.UserID,
            accInfo.UserID,
            ""+userData.accountData.UserRoleID,
            userData.accountData.Name,
            '1',
            '9800',
            '正式服',
            accInfo.Ext,
            accInfo.Session,
            msg.Sign,
            msg.PlatOrderID,
            msg.NoticeUrl
        )
    }

    //限时礼包订单
    private _recvBuyLimitedTimeGiftBag(recvMsg: { Result: number, Desc: string, Msg: gamesvr.ShopTimeFiniteGiftBuyGiftRes}){
        if(!this._checkResValid(recvMsg)) {
            return;
        }

        let msg = recvMsg.Msg;
        let accInfo = operationSvr.accountInfo
        //暂时在这里重置限时礼包的刷新时间，正常支付流程下不会在这里
        limitData.resetLimitedTimeGiftBagData(msg.NextFoundGiftTime);
        PackageUtils.nativePay(
            msg.Order,
            ""+msg.GiftID,
            "限时礼包",
            msg.Price,
            msg.Price,
            1,
            "限时礼包"+msg.GiftID,
            msg.OrderTime.toString(),
            accInfo.UserID,
            accInfo.UserID,
            ""+userData.accountData.UserRoleID,
            userData.accountData.Name,
            '1',
            '9800',
            '正式服',
            accInfo.Ext,
            accInfo.Session,
            msg.Sign,
            msg.PlatOrderID,
            msg.NoticeUrl
        )
    }

    //礼包、充值支付统一回调
    private _onPayResultNotify(recvMsg: { Result: number, Desc: string, Msg: gamesvr.IPayResultNotify }) {
        if (!this._checkResValid(recvMsg)) {
            return;
        }
        let msg = recvMsg.Msg;
        let cfg: cfg.ShopGift = configManager.getConfigByKey("gift", msg.ProductID);
        let cfg1: cfg.ShopRechargeIOS = configManager.getConfigByKey("rechargeIOS", msg.ProductID);
        let cfg2: cfg.ShopRechargeAndroid = configManager.getConfigByKey("rechargeAndroid", msg.ProductID);
        if (msg.ChargeOrderRecord) { trackData.updateChargeRecords(msg.ChargeOrderRecord.ProductID.toString(), msg.ChargeOrderRecord); }
        if (msg.ProductRecord) { trackData.updateProductRecords(msg.ProductRecord.ProductID.toString(), msg.ProductRecord); }

        if (cfg1 || cfg2) {
            eventCenter.fire(shopEvent.BUY_CHARGE, msg);
        }

        if (cfg) {
            let expandData: any[] = [];
            // 首充礼包, 更新首充奖励缓存
            if(msg.ProductID == FIRST_CHARGE_GIFT_ID) {
                let cfgs = configManager.getConfigs('firstPay');
                for(let k in cfgs) {
                    if(!cfgs.hasOwnProperty(k)) continue;
                    let cfg: cfg.FirstPay = cfgs[k];
                    if(cfg.FirstPayDay == 1) {
                        activityData.updateFirstChargeReward([cfg.FirstPayId]);
                        break;
                    }
                }
            }

            // 英雄养成礼包
            if(cfg.ShopGiftType == 6) {
                let activityPeriod = activityUtils.getHeroDevelopActivityPeriod();
                let activityCfgs = configManager.getConfigs('activityHeroGrowUp');
                for(let k in activityCfgs) {
                    if(!activityCfgs.hasOwnProperty(k)) continue;
                    let activityCfg: cfg.ActivityHeroGrowUp = activityCfgs[k];
                    // 期数和礼包ID匹配
                    if(msg.ProductID == activityCfg.ActivityHeroGrowUpGiftId && activityCfg.ActivityHeroGrowUpRound == activityPeriod) {
                        activityData.updateHeroGrowUpGiftData(activityCfg.ActivityHeroGrowUpId, msg.ProductID);
                        expandData.push(activityCfg.ActivityHeroGrowUpId, activityPeriod);
                        break;
                    }
                }
            }

            eventCenter.fire(shopEvent.BUY_GIFT, msg, ...expandData);
            redDotMgr.fire(RED_DOT_MODULE.MAIN_SHOP);
            redDotMgr.fire(RED_DOT_MODULE.SHOP_GIFT_TOGGLE);
            return;
        }

        //限时礼包
        let limitedTimeGiftBagCfg = configUtils.getShopGiftCfgByID(msg.ProductID);
        if(limitedTimeGiftBagCfg){
            limitData.resetLimitedTimeGiftBagData();
            eventCenter.fire(shopEvent.BUY_GIFT, msg);
        }
    }

    private _onShopRandomBuyRes(recvMsg: { Result: number, Desc: string, Msg: gamesvr.ShopRandomShopBuyRes }){
        if (!this._checkResValid(recvMsg)) {
            return;
        }
        let msg = recvMsg.Msg;
        if (msg && msg.RandomShopCommodityID){
            trackData.updateRandomShopMap([msg.RandomShopCommodityID])
        }
        if (msg && msg.Prizes){
            eventCenter.fire(shopEvent.BUY_RANDOM, msg.Prizes);
        } 
    }

    private _onShopRandomRefreshRes(recvMsg: { Result: number, Desc: string, Msg: gamesvr.ShopRandomShopRefreshRes }){
        if (!this._checkResValid(recvMsg)) {
            return;
        }
        let msg = recvMsg.Msg;
        if (msg){
            trackData.updateRandomShopData(msg.RandomCount, msg.RandomShopCommodityIDMap)
            eventCenter.fire(shopEvent.REFRESH_RANDOM);
        }
    }

    private _onShopRandomRefreshNotify(recvMsg: { Result: number, Desc: string, Msg: gamesvr.ShopRandomShopRefreshNotify }) {
        if (!this._checkResValid(recvMsg)) {
            return;
        }
        let msg = recvMsg.Msg;
        if (msg) {
            trackData.updateRandomShopData(msg.RandomCount, msg.RandomShopCommodityIDMap)
            eventCenter.fire(shopEvent.REFRESH_RANDOM);
        }
    }
    //发送购买道具请求
    sendBuyProductReq(pID: number, count: number) {
        let buyReq = gamesvr.BuyProductReq.create({
            ProductID: pID,
            Quantity: count
        })
        operationSvr.send(buyReq);
    }

    //发送充值请求
    sendRechargeReq(pID: number, needMoney?: number) {
        if(appCfg.UseTestMoney){
            this._sendRechargeReqWithTestMoney(pID, needMoney);
            return;
        }

        let buyReq = gamesvr.GetPayOrderReq.create({
            ProductID: pID,
        })
        operationSvr.send(buyReq);
    }

    //发送购买礼包请求
    sendBuyGiftReq(pID: number, needMoney?: number) {
        if(appCfg.UseTestMoney){
            this._sendBuyGiftReqWithTestMoney(pID, needMoney);
            return;
        }

        let buyReq = gamesvr.GetGiftOrderReq.create({
            ProductID: pID,
        })
        operationSvr.send(buyReq);
    }

    //发送购买市集物品请求
    sendBuyRandomReq(pID: number){
        let buyReq = gamesvr.ShopRandomShopBuyReq.create({
            RandomShopCommodityID: pID,
        })
        operationSvr.send(buyReq);
    }

    sendRefreshRandomReq() {
        let refreshReq = gamesvr.ShopRandomShopRefreshReq.create({
        })
        operationSvr.send(refreshReq);
    }

    //购买限时礼包
    sendBuyLimitedTimeGiftBag(giftBagID: number, needMoney?: number) {
        if(appCfg.UseTestMoney){
            this._sendBuyLTGiftBagWithTestMoney(giftBagID, needMoney);
            return;
        }

        let seq = new gamesvr.ShopTimeFiniteGiftBuyGiftReq({
            ID: giftBagID
        });
        operationSvr.send(seq);
    }

    private _sendRechargeReqWithTestMoney(pID: number,  needMoney: number){
        if(!bagDataUtils.isTestMoneyEnough(needMoney)) return;
        let seq = gamesvr.ShopTestGetPayOrderReq.create({
            ProductID: pID
        });

        operationSvr.send(seq);
    }

    private _sendBuyGiftReqWithTestMoney(pID: number, needMoney: number){
        if(!bagDataUtils.isTestMoneyEnough(needMoney)) return;
        let req = gamesvr.ShopTestGetGiftOrderReq.create({
            ProductID: pID
        });
        operationSvr.send(req);
    }

    private _sendBuyLTGiftBagWithTestMoney(giftBagID: number, needMoney?: number) {
        if(!bagDataUtils.isTestMoneyEnough(needMoney)) return;
        let seq = gamesvr.ShopTestTimeFiniteGiftBuyGiftReq.create({
            ID: giftBagID
        });
        operationSvr.send(seq);
    }

    // 使用游戏内货币购买礼包
    sendBuyCurrencyGift(pID: number) {
        let req = gamesvr.BuyCurrencyGiftReq.create({
            ProductID: pID
        });
        operationSvr.send(req);
    }

    private _recvBuyCurrencyGift(recvMsg: { Result: number, Desc: string, Msg: gamesvr.IBuyCurrencyGiftRes }) {
        if (!this._checkResValid(recvMsg)) {
            return;
        }

        let msg = recvMsg.Msg;
        msg.Record && trackData.updateProductRecords(msg.Record.ProductID.toString(), msg.Record);

        let cfg: cfg.ShopGift = configManager.getConfigByKey("gift", msg.ProductID);

        let expandData: any[] = [];
        // 英雄养成礼包
        if(cfg.ShopGiftType == 6) {
            let activityPeriod = activityUtils.getHeroDevelopActivityPeriod();
            let activityCfgs = configManager.getConfigs('activityHeroGrowUp');
            for(let k in activityCfgs) {
                if(!activityCfgs.hasOwnProperty(k)) continue;
                let activityCfg: cfg.ActivityHeroGrowUp = activityCfgs[k];
                // 期数和礼包ID匹配
                if(msg.ProductID == activityCfg.ActivityHeroGrowUpGiftId && activityCfg.ActivityHeroGrowUpRound == activityPeriod) {
                    activityData.updateHeroGrowUpGiftData(activityCfg.ActivityHeroGrowUpId, msg.ProductID);
                    expandData.push(activityCfg.ActivityHeroGrowUpId);
                    break;
                }
            }
        }

        eventCenter.fire(shopEvent.BUY_CURRENCY_GIFT, msg, ...expandData);
    }

    // 领取首充奖励礼包
    sendTakeFirstPayGiftBag(rewardIdx: number) {
        let req = gamesvr.ActivityFirstChargeReceiveRewardReq.create({
            RewardIndex: rewardIdx
        });

        operationSvr.send(req);
    }

    private _recvTakeFirstPayGiftBag(recvMsg: { Result: number, Desc: string, Msg: gamesvr.IActivityFirstChargeReceiveRewardRes }) {
        if (!this._checkResValid(recvMsg)) {
            return;
        }
        let msg = recvMsg.Msg;
        activityData.updateFirstChargeReward(msg.RewardRecord);
        eventCenter.fire(shopEvent.RECV_FIRST_CHARGE_REWARD, msg.Prizes);
    }

    private _recvFeastGiftNtf(recvMsg: { Result: number, Desc: string, Msg: gamesvr.IActivityFeastGifBuyGiftCountNotify }) {
        if (!this._checkResValid(recvMsg)) {
            return;
        }
        let msg = recvMsg.Msg;
        if (msg) {
            activityData.feastGiftData.BuyGiftMap[msg.ShopID.toString()] = msg.Count;
            eventCenter.fire(activityEvent.FEAST_GIFT_CHANGE_NTF, msg);
        }
    }
}

let shopOpt = new ShopOpt();
export { shopOpt }
