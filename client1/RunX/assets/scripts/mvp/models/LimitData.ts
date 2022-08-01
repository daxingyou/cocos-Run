/**
 * desc 限时活动 1限时战斗 2限时商店
 */
import { ItemInfo } from "../../app/AppType";
import { utils } from "../../app/AppUtils";
import { configUtils } from "../../app/ConfigUtils";
import {scheduleManager} from "../../common/ScheduleManager";
import { data, gamesvr } from "../../network/lib/protocol";
import BaseModel from "./BaseModel";
import { serverTime } from "./ServerTime";

enum TIME_LIMIT_TYPE {
    SHOP,
    FIGHT,
    GIFT_BAG
}

let Limit_Data_Index: number = 0;
const _newLimitId = () => {
    ++Limit_Data_Index;
    return Limit_Data_Index;
}

interface LimitShopItem {
    shopId: number,
    shopItem?: ItemInfo,
    isBuy?: boolean
}

interface TimeLimitData {
    starTime: number,
    index: number,
    limitType: TIME_LIMIT_TYPE,
    ID?: number,
    iconPath?: string,
    endTime?: number
    textIndex?: number,
    fightId?: number,
    team?: number[],
    rewards?: data.IItemInfo[],
    shopList?: LimitShopItem[],
}

class LimitData extends BaseModel {
    private _limitData: TimeLimitData[] = [];
    private _enterRandomFight: TimeLimitData = null;
    private _newLimitData: TimeLimitData[] = [];
    private _shopTimeFiniteGiftData: data.IShopTimeFiniteGiftData = null;
    private _limitedTimeGiftBagScheduleID = 0;

    get shopTimeFiniteGiftData () {
        return this._shopTimeFiniteGiftData
    }

    init() {
    }

    deInit() {
        this._unscheduleGiftBag();

        this._limitData = [];
        this._enterRandomFight = null;
        this._newLimitData = [];
        this._shopTimeFiniteGiftData = null;
    }

    get limitList() {
        return this._limitData;
    }

    get enterRandomFightData() {
        return this._enterRandomFight;
    }

    get newLimitData() {
        return this._newLimitData;
    }

    initLimitData(datas: data.ITimeLimitData) {
        this.clearData();
        for(const k in datas.PlayDataMap) {
            let data = datas.PlayDataMap[k];
            this.srvToLocal(data);
        }
    }

    initLimitedTimeGiftBagData(shopData: data.IShopData){
        if(!shopData) return;
        shopData.ShopTimeFiniteGiftData && (this._shopTimeFiniteGiftData = shopData.ShopTimeFiniteGiftData);
        this._unscheduleGiftBag();
        this._limitedTimeGiftBagScheduleID = scheduleManager.schedule(() => {
            let currTime = new Date(serverTime.currServerTime() * 1000);
            if(currTime.getHours() == 0 && currTime.getMinutes() == 0 && currTime.getSeconds() == 0){
                this._shopTimeFiniteGiftData.TouchCount = 0;
            }
        }, 1);
    }

    //注销限时礼包0点重置定时器
    private _unscheduleGiftBag(){
        this._limitedTimeGiftBagScheduleID && scheduleManager.unschedule(this._limitedTimeGiftBagScheduleID);
        this._limitedTimeGiftBagScheduleID = 0;
    }

    //更新限时礼包
    updateLimitedTimeGiftBagData(giftBag: data.IShopTimeFiniteGiftBale, touchCount: number, nextTime: any){
        if(!giftBag) return;
        this._shopTimeFiniteGiftData = this._shopTimeFiniteGiftData || {};
        this._shopTimeFiniteGiftData.NextFoundGiftTime = nextTime;
        this._shopTimeFiniteGiftData.TouchCount = touchCount;
        this._shopTimeFiniteGiftData.ShopTimeFiniteGiftBaleMap[`${giftBag.ID}`] = giftBag;
    }

    //重置限时礼包
    resetLimitedTimeGiftBagData (NextFoundGiftTime?: any){
        this._shopTimeFiniteGiftData = this._shopTimeFiniteGiftData || {};
        this._shopTimeFiniteGiftData.ShopTimeFiniteGiftBaleMap = {};
        typeof NextFoundGiftTime != 'undefined' && NextFoundGiftTime != null
            && (this._shopTimeFiniteGiftData.NextFoundGiftTime = NextFoundGiftTime);
    }

    /**
     * 目前只可能是战斗
     * @param limitData
     * @returns
     */
    delLimitData(limitData: TimeLimitData): boolean {
        let index: number = this._limitData.findIndex(_t => {
            return _t.ID == limitData.ID;
        });
        index != -1 && this._limitData.splice(index, 1);
        return index != -1;
    }

    buyLimitShop(limitdata: TimeLimitData, randomShopId: number) {
        let suc: boolean = false;
        let findLimitdata = this._limitData.find(_l => {
            return _l.limitType == TIME_LIMIT_TYPE.SHOP;
        });
        if(findLimitdata) {
            findLimitdata.shopList.forEach(_s => {
                if(_s.shopId == randomShopId) {
                    if(!_s.isBuy) {
                        suc = true;
                        _s.isBuy = true;
                    }
                }
            })
        }
        return suc;
    }

    getLimitDataByIndex(index: number): TimeLimitData {
        if(index > this._limitData.length - 1) return null;
        return this._limitData[index];
    }

    clearData() {
        this._limitData = [];
        this._enterRandomFight = null;
    }

    enterRandomFightBattle(limitdata: TimeLimitData) {
        this._enterRandomFight = limitdata;
    }

    clearRandomFight() {
        if(this._enterRandomFight) {
            this.delLimitData(this._enterRandomFight);
        }
        this._enterRandomFight = null;
    }

    srvToLocal(data: data.IPlayData) {
        if(TIME_LIMIT_TYPE.SHOP == data.PlayType) {
            let timeLimitData: TimeLimitData = {
                starTime: utils.longToNumber(data.TravelData.TouchTime),
                limitType: TIME_LIMIT_TYPE.SHOP,
                index: _newLimitId(),
                shopList: [],
                textIndex: data.TravelData.RandomShopTextIndex
            };
            let shopData = data.TravelData.ShopDataMap;
            if(utils.getObjLength(shopData) > 0) {
                for(const k in shopData) {
                    timeLimitData.shopList.push({
                        shopId: shopData[k].ShopID,
                        isBuy: shopData[k].isBuy
                    });
                }
                // this.addLimitData(timeLimitData);
                this._limitData.push(timeLimitData);
            }
        } else if( TIME_LIMIT_TYPE.FIGHT == data.PlayType) {
            let fightDatas = data.FantasyData.FightDataMap;
            for(const v in fightDatas) {
                let fightData = fightDatas[v];
                let limitdata: TimeLimitData = {
                    ID: utils.longToNumber(fightData.ID),
                    fightId: fightData.FightID,
                    starTime: utils.longToNumber(fightData.TouchTime),
                    team: fightData.MonsterIDList,
                    index: _newLimitId(),
                    limitType: TIME_LIMIT_TYPE.FIGHT,
                    rewards: fightData.Prizes
                }
                this._limitData.push(limitdata);
            }
        }
        this._limitData.sort((a, b) => {
            return a.starTime - b.starTime;
        });
    }
    /**
     *  添加战斗数据
     * @param fightData 
     */
    addRandomFightData(fightData: gamesvr.TimeLimitFantasyTouchNotify):TimeLimitData {
        let limitdata: TimeLimitData = {
            ID: utils.longToNumber(fightData.ID),
            fightId: fightData.FightID,
            starTime: utils.longToNumber(fightData.TouchTime),
            team: fightData.MonsterIDList,
            index: _newLimitId(),
            limitType: TIME_LIMIT_TYPE.FIGHT,
            rewards: fightData.Prizes
        }
        this._limitData.push(limitdata);
        this._newLimitData.push(limitdata);
        return limitdata;
    }

    /**
     *  添加商店数据
     * @param shopData 
     */
    addRandomShopData(shopData: gamesvr.TimeLimitTravelTouchNotify): TimeLimitData {
        let timeLimitData: TimeLimitData = {
            starTime: utils.longToNumber(shopData.TouchTime),
            limitType: TIME_LIMIT_TYPE.SHOP,
            index: _newLimitId(),
            shopList: [],
            textIndex: shopData.RandomShopTextIndex
        };
        for(const k in shopData.ShopIDList) {
            timeLimitData.shopList.push({
                shopId: shopData.ShopIDList[k],
                isBuy: false
            });
        }
        this._limitData.push(timeLimitData);
        this._newLimitData.push(timeLimitData);
        return timeLimitData;
    }

    clearNewLimitData() {
        this._newLimitData = [];
    }

    checkRandomFightIsTimeOver() {
        if(this.enterRandomFightData) {
            let startTime = Number(this.enterRandomFightData.starTime);
            let exitTime = configUtils.getRandomFightConfig(Number(this.enterRandomFightData.fightId)).RandomFightHoldTime;
            let curTime = serverTime.currServerTime();
            return curTime >= startTime + exitTime;
        }
        return true;
    }
}

let limitData = new LimitData();
export {
    limitData,
    TIME_LIMIT_TYPE,
    TimeLimitData,
    LimitShopItem,
    _newLimitId
}