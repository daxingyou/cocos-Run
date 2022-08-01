/**
 * desc 限时活动 1限时战斗 2限时商店
 */
import { eventCenter } from "../../common/event/EventCenter";
import { timeLimitEvent } from "../../common/event/EventData";
import { logger } from "../../common/log/Logger";
import { gamesvr } from "../../network/lib/protocol";
import { operationSvr } from "../../network/OperationSvr";
import { commonData } from "../models/CommonData";
import { limitData, TimeLimitData } from "../models/LimitData";
import { BaseOpt } from "./BaseOpt";

class LimitDataOpt extends BaseOpt {

    init() {
        this.addEventListener(gamesvr.CMD.TIME_LIMIT_FANTASY_TOUCH_NOTIFY, this._recvRandomFight);
        this.addEventListener(gamesvr.CMD.TIME_LIMIT_TRAVEL_TOUCH_NOTIFY, this._recvRandomShop);
        this.addEventListener(gamesvr.CMD.TIME_LIMIT_TRAVEL_BUY_SHOP_RES, this._recvBuyLimitShopItem);
        this.addEventListener(gamesvr.CMD.TIME_LIMIT_FANTASY_ENTER_PVE_RES, this._recvEnterLimitFight);
        this.addEventListener(gamesvr.CMD.TIME_LIMIT_FANTASY_FINISH_PVE_RES, this._recvLimitFightEnd);
        //限时礼包查询
        this.addEventListener(gamesvr.CMD.SHOP_TIME_FINITE_GIFT_FOUND_GIFT_RES, this._recvQueryLimitedTimeGiftBag);
    }

    deInit() {
    }

    private _recvQueryLimitedTimeGiftBag(recvMsg: { Result: number, Desc: string, Msg: gamesvr.ShopTimeFiniteGiftFoundGiftRes}){
        if(!this._checkResValid(recvMsg)) {
            logger.error("_recvQueryLimitedTimeGiftBag recv error:", recvMsg);
            return;
        }

        let data = recvMsg.Msg;
        limitData.updateLimitedTimeGiftBagData(data.ShopTimeFiniteGiftBaleUnit, data.TouchCount, data.NextFoundGiftTime);
        eventCenter.fire(timeLimitEvent.REVCE_QUERY_LIMIT_TIME_GIFT_BAG, true);
    }

    private _recvRandomShop(recvMsg: { Result: number, Desc: string, Msg: gamesvr.TimeLimitTravelTouchNotify }) {
        if(!this._checkResValid(recvMsg)) {
            logger.error("_recvRandomShop recv error:", recvMsg);
            return;
        }
        let msg = recvMsg.Msg;
        let limitdata = limitData.addRandomShopData(msg);
        delete commonData.tmpCache.RandomShopClicked;
        eventCenter.fire(timeLimitEvent.RECV_RANDOM_SHOP_EVENT, limitdata);
    }

    // 梦幻仙缘
    private _recvRandomFight(recvMsg: { Result: number, Desc: string, Msg: gamesvr.TimeLimitFantasyTouchNotify }) {
        if(!this._checkResValid(recvMsg)) {
            logger.error("_recvRandomFight recv error:", recvMsg);
            return;
        }
        let msg = recvMsg.Msg;
        let limitdata = limitData.addRandomFightData(msg);
        delete commonData.tmpCache.RandomFightClicked;
        eventCenter.fire(timeLimitEvent.RECV_RANDOM_FIGHT_EVENT, limitdata);
    }

    private _recvBuyLimitShopItem(recvMsg: { Result: number, Desc: string, Msg: gamesvr.TimeLimitTravelBuyShopRes }, limitdata: TimeLimitData, shopId: number) {
        if(!this._checkResValid(recvMsg)) {
            return;
        }
        let msg = recvMsg.Msg;
        limitData.buyLimitShop(null, msg.ShopID);
        eventCenter.fire(timeLimitEvent.RECV_BUY_SHOPITEM, msg, limitdata, shopId);
    }
    /**
     * 接受到进入幻梦仙缘战斗
     * @param recvMsg 
     * @returns 
     */
    private _recvEnterLimitFight(recvMsg: { Result: number, Desc: string, Msg: gamesvr.TimeLimitFantasyEnterPveRes }) {
         if(!this._checkResValid(recvMsg)) {
            return;
        }
        let msg = recvMsg.Msg;
        eventCenter.fire(timeLimitEvent.ENTER_RANDOM_FIGHT_BATTLE, msg);
    }

    private _recvLimitFightEnd(recvMsg: { Result: number, Desc: string, Msg: gamesvr.TimeLimitFantasyFinishPveRes }) {
        if(!this._checkResValid(recvMsg)) {
            eventCenter.fire(timeLimitEvent.END_RANDOM_FIGHT_BATTLE);
            return;
        }
        let msg = recvMsg.Msg;
        if(msg.Past) {
            limitData.clearRandomFight();
        }
        eventCenter.fire(timeLimitEvent.END_RANDOM_FIGHT_BATTLE, msg);
    }

    sendBuyLimitShopItem(shopId: number, limitdata?: TimeLimitData) {
        let seq = new gamesvr.TimeLimitTravelBuyShopReq({
            ShopID: shopId
        });
        operationSvr.send(seq);
    }

    sendEnterLimitFightBattle(id: number, heros: number[]) {
        let seq = new gamesvr.TimeLimitFantasyEnterPveReq({
            ID: id,
            Heroes: heros
        });
        operationSvr.send(seq);
    }

    sendLimitFightEnd(id: number, isPass: boolean) {
        let seq = new gamesvr.TimeLimitFantasyFinishPveReq({
            ID: id,
            Past: isPass
        });
        operationSvr.send(seq);
    }

    //查询可用的限时礼包
    sendQueryLimitedTimeGiftBag(){
        let seq = new gamesvr.ShopTimeFiniteGiftFoundGiftReq();
        operationSvr.send(seq);
    }
}

let limitDataOpt = new LimitDataOpt();
export {
    limitDataOpt
}
