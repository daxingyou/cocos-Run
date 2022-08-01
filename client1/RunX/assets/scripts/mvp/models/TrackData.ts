import { TREASURE_SYS_POWER_TYPE } from "../../app/AppConst";
import { redDotMgr } from "../../common/RedDotManager";
import { cfg } from "../../config/config";
import { data } from "../../network/lib/protocol";
import BaseModel from "./BaseModel";
import { serverTime } from "./ServerTime";
import { taskData } from "./TaskData";

class TrackData extends BaseModel {

    private _cardPoolRecords: { [k: string]: data.ICardPoolRecord } = {};
    private _chargeRecords: { [k: string]: data.IChargeOrderRecord } = {};
    private _productRecords: { [k: string]: data.IProductOrderRecord } = {};
    private _summonCardLimit: { [k: string]: number } = {};
    private _shopRandomData: data.IShopRandomShopData = {};
    private _battlePass: boolean = false;

    get poolRecords() { return this._cardPoolRecords; }
    get battlePass() { return this._battlePass; }
    get chargeRecords() { return this._chargeRecords }
    get productRecords() { return this._productRecords }
    get summonCardLimit() { return this._summonCardLimit }
    get shopRandomData() { return this._shopRandomData }

    init() { }

    deInit() {
        this._battlePass = false;
     }

    initTrackData(resData: data.ITrackData) {
        this._cardPoolRecords = resData.CardPoolRecords;
        this._chargeRecords = resData.ChargeRecords;
        this._productRecords = resData.ProductRecords;
        this._summonCardLimit = resData.SummonCardLimitMap;
    }

    initShopRandomData(shopData: data.IShopData){
        if (shopData && shopData.ShopRandomShopData){
            this._shopRandomData = shopData.ShopRandomShopData;
        }
    }

    updateRecord(key: string, record: data.ICardPoolRecord) {
        this._cardPoolRecords[key] = record;
    }

    updateCardLimit(key: string, curr: number) {
        this._summonCardLimit[key] = curr || 0;
    }

    updateSaveSimulate(key: string, record: data.ISimulateRecord) {
        this._cardPoolRecords[key].SimulateRecords.push(record);
    }

    updateCurrSimulate(key: string, record: data.ISimulateRecord) {
        this._cardPoolRecords[key].CurrentSimulate = record;
    }

    updateCardContinuousDraw(key: string, progress: number){
        this._cardPoolRecords[key] = this._cardPoolRecords[key] || {};
        this._cardPoolRecords[key].ContinuousDraw = progress;
    }

    updateBattlePass(v: boolean) {
        this._battlePass = v;
    }

    updateChargeRecords(key: string, record: data.IProductOrderRecord) {
        this._chargeRecords[key] = record;
    }

    updateProductRecords(key: string, record: data.IChargeOrderRecord) {
        this._productRecords[key] = record;
    }

    updateRandomShopData(cnt: number, commodityMap: {[k: string]: boolean}){
        if (!this._shopRandomData){ this._shopRandomData = {};}
        if (typeof(cnt) == "number" && cnt >= 0) this._shopRandomData.RandomCount = cnt;
        if (commodityMap)
            this._shopRandomData.RandomShopCommodityIDMap = commodityMap;
        //市集商店有红点需求，所以将新数据暂存到redDotMgr
        redDotMgr.updateNewShopData(commodityMap);
    }

    updateRandomShopMap(commodityMap: number[]){
        if (!this._shopRandomData){ this._shopRandomData = {};}
        if (commodityMap && commodityMap.length) 
            commodityMap.forEach(_id =>{
                this._shopRandomData.RandomShopCommodityIDMap[_id] = true;
            })
    }


    // 是否购买首充礼包
    checkFirstCharge(){
        if (this._productRecords && this._productRecords[351001]){
            return false;
        }
        return true;
    }
    
    //获取每天剩余的免费抽卡次数
    getSummonFreeCount(summonCfg: cfg.SummonCard){
        if(!summonCfg) return 0;
        let svrData = this.poolRecords[summonCfg.SummonCardId];

        let currTime = serverTime.currServerTime();
        if(!svrData || currTime < svrData.FreeDrawTime) return 0;

        let totalTimes = summonCfg.SummonCardFree || 0;
        let usedTimes = 0;
        svrData && (usedTimes = svrData.FreeDrawCount || 0);
        //装备抽卡
        if(summonCfg.SummonCardId == 10001){
            //10002：赠送抽卡次数的宝物参数，在表LeadTreasure中
            totalTimes += taskData.getTreasureSysPowerParam(TREASURE_SYS_POWER_TYPE.JIU_MING_SHEN_QIAN);
        }

        //英雄抽卡
        if(summonCfg.SummonCardId == 10002){
            //10001：赠送抽卡次数的宝物参数，在表LeadTreasure中
            totalTimes += taskData.getTreasureSysPowerParam(TREASURE_SYS_POWER_TYPE.YU_JING_PING);
        }
        return totalTimes - usedTimes;
    }
}

let trackData = new TrackData();
export { trackData }