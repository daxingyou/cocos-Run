

import { configUtils } from "../../app/ConfigUtils";
import { cfg } from "../../config/config";
import { data, gamesvr } from "../../network/lib/protocol";
import BaseModel from "./BaseModel";
class ConsecreateData extends BaseModel {

    private _consecrateInfo: data.IUniversalConsecrateData = null;

    init(): void {

    }

    deInit(): void {
        this._consecrateInfo = null;
    }

    initConsecrateData(data: data.IUniversalData) {
        this._consecrateInfo = data.UniversalConsecrateData || {};
        this._consecrateInfo.UniversalConsecrateStatueMap =  this._consecrateInfo.UniversalConsecrateStatueMap || {};
    }

    //添加贡品
    addTribute(statusType: number, item: data.IUniversalConsecrateTribute) {
        if(!item) return;
        this._consecrateInfo.UniversalConsecrateStatueMap[statusType] =  this._consecrateInfo.UniversalConsecrateStatueMap[statusType] || {};
        this._consecrateInfo.UniversalConsecrateStatueMap[statusType].UniversalConsecrateTributeList = this._consecrateInfo.UniversalConsecrateStatueMap[statusType].UniversalConsecrateTributeList || [];
        this._consecrateInfo.UniversalConsecrateStatueMap[statusType].UniversalConsecrateTributeList.push(item);
    }

    //移除贡品
    removeTribute(statusType: number, pos: number) {
        if(!this._consecrateInfo.UniversalConsecrateStatueMap[statusType]
          || !this._consecrateInfo.UniversalConsecrateStatueMap[statusType].UniversalConsecrateTributeList
          || this._consecrateInfo.UniversalConsecrateStatueMap[statusType].UniversalConsecrateTributeList.length == 0
          || pos >= this._consecrateInfo.UniversalConsecrateStatueMap[statusType].UniversalConsecrateTributeList.length
        ){
            return;
        }
        this._consecrateInfo.UniversalConsecrateStatueMap[statusType].UniversalConsecrateTributeList.splice(pos, 1);
    }

    //更新贡品列表
    updateTributeList(statusType: number, items: data.IUniversalConsecrateTribute[], startPos?: number) {
        this._consecrateInfo.UniversalConsecrateStatueMap[statusType] =  this._consecrateInfo.UniversalConsecrateStatueMap[statusType] || {};
        if(typeof startPos != 'undefined'){
            //传过来的位置需要-1，因为startPos是按照数组索引+1
            startPos = startPos - 1;
            let tributes = this._consecrateInfo.UniversalConsecrateStatueMap[statusType].UniversalConsecrateTributeList || [];
            tributes.length = items.length + startPos;
            items.forEach((ele, idx) => {
                tributes[startPos + idx] = ele;
            });
            this._consecrateInfo.UniversalConsecrateStatueMap[statusType].UniversalConsecrateTributeList = tributes;
        }else {
            this._consecrateInfo.UniversalConsecrateStatueMap[statusType].UniversalConsecrateTributeList = items;
        }
    }

    //更新雕像信息
    updateStatue(statueInfo: gamesvr.IUniversalConsecrateReceiveTributeRewardRes) {
        if(!statueInfo) return;
        let _statueInfo =  this._consecrateInfo.UniversalConsecrateStatueMap[statueInfo.StatueType] =  this._consecrateInfo.UniversalConsecrateStatueMap[statueInfo.StatueType] || {};
        for(let k in statueInfo) {
            if(statueInfo.hasOwnProperty(k)) {
                _statueInfo[k] = statueInfo[k];
            }
        }
    }

    //更新雕像等级奖励领取状态
    updateStatueLevelReward(statusType: number, lv: number) {
        let _statueInfo =  this._consecrateInfo.UniversalConsecrateStatueMap[statusType] =  this._consecrateInfo.UniversalConsecrateStatueMap[statusType] || {};
        _statueInfo.ReceiveLevelRewardMap = _statueInfo.ReceiveLevelRewardMap || {};
        _statueInfo.ReceiveLevelRewardMap[lv] = true;
    }

    //更新雕像信仰奖励领取状态
    updateStatueRefallReward(statusType: number, cnt: number, nextRewards: number[]) {
        let _statueInfo =  this._consecrateInfo.UniversalConsecrateStatueMap[statusType] =  this._consecrateInfo.UniversalConsecrateStatueMap[statusType] || {};
        _statueInfo.ReceiveBefallRewardCount = cnt;
        _statueInfo.RandomBefallRewardIndexList = nextRewards;
    }

    getStatueInfo(statueID: number) {
        return this._consecrateInfo.UniversalConsecrateStatueMap[statueID] || null;
    }

    // 获取满信仰值的主体
    getFullXinYangStatue(): number{
        if(!this._consecrateInfo || !this._consecrateInfo.UniversalConsecrateStatueMap) return -1;

        let statues = this._consecrateInfo.UniversalConsecrateStatueMap;
        for(let k in statues) {
            let statue = statues[k];
            let consecrateComeCfg: cfg.ConsecrateCome = configUtils.getConsecrateComeCfg(parseInt(k));
            let befallCnt = statue.ReceiveBefallRewardCount || 0;
            if(statue && statue.StatueBefall - (consecrateComeCfg.ConsecrateComeFaith * befallCnt) >= consecrateComeCfg.ConsecrateComeFaith) {
                return parseInt(k);
            }
        }
        return -1;
    }
}

let consecrateData = new ConsecreateData();
export {consecrateData}
