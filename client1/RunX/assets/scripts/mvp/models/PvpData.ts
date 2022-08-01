/*
 * @Description: 
 * @Autor: lixu
 * @Date: 2021-05-27 11:14:42
 * @LastEditors: Please set LastEditors
 * @LastEditTime: 2021-07-29 11:52:58
 */

import { PVP_MODE } from "../../app/AppEnums";
import { PvpConfig } from "../../app/AppType";
import { utils } from "../../app/AppUtils";
import { configUtils } from "../../app/ConfigUtils";
import { redDotMgr } from "../../common/RedDotManager";
import { cfg } from "../../config/config";
import { data, gamesvr } from "../../network/lib/protocol";
import HeroUnit from "../template/HeroUnit";
import { bagData } from "./BagData";
import BaseModel from "./BaseModel";

class PvpData extends BaseModel {
   
    private _pvpData: data.IPVPData = new data.PVPData();
    private _pvpConfig: PvpConfig = null;
    // 斩将封神敌方阵容
    private _spiritEnemies: data.IPVPSpiritEnemy[] = [];
    // 论道修仙排行信息
    private _fairyRankList: data.IPVPFairyIntegral[] = [];
    /**巅峰对决信息*/
    private _peakDuelRankInfo: gamesvr.RankPvpPeakDuelGetListRes = null;
    /***巅峰对决敌方信息*/
    private _peakDuelEnemiesInfo: data.IPVPPeakDuelIntegral = null;
    /**战报回放的进攻数据*/
    private _peakRecordInfo: data.IPVPPeakDuelFight = null;

    // 结算数据，手动备份
    private _pvpFairyFinishData: gamesvr.PvpFairyEnterRes = null;
    private _pvpSpiritFinishData: gamesvr.PvpSpiritEnterRes = null;
    private _pvpPeakDuekFinishData: gamesvr.PvpPeakDuelEnterRes = null;
    private _hasNewDefendRecord: boolean = false;

    get spiritData() {
        return this._pvpData ? this._pvpData.PVPSpiritData : null;
    }

    get fairyData() {
        return this._pvpData ? this._pvpData.PVPFairyData : null;
    }

    get peakDuelData() {
        return this._pvpData?.PVPPeakDuelData;
    }

    get fairyRank() {
        return this._fairyRankList;
    }

    get pvpConfig() {
        return this._pvpConfig;
    }

    set pvpConfig(cfg: PvpConfig) {
        this._pvpConfig = cfg;
    }

    get fairyFinishData(): gamesvr.PvpFairyEnterRes {
        let copyData = utils.deepCopy(this._pvpFairyFinishData);
        this.fairyFinishData = null;
        return copyData;
    }

    set fairyFinishData(val: gamesvr.PvpFairyEnterRes) {
        this._pvpFairyFinishData = val;
    }

    get spiritFinishData(): gamesvr.PvpSpiritEnterRes {
        let copyData = utils.deepCopy(this._pvpSpiritFinishData);
        this.spiritFinishData = null;
        return copyData;
    }

    set spiritFinishData(val: gamesvr.PvpSpiritEnterRes) {
        this._pvpSpiritFinishData = val;
    }

    get spiritEnemyList() {
        return this._spiritEnemies;
    }

    get peakDuelEnemiesInfo() {
        return this._peakDuelEnemiesInfo;
    }

    get peakRecordInfo() { return this._peakRecordInfo; }

    set hasNewDefendRecord(isNewDefend: boolean) {
        this._hasNewDefendRecord = isNewDefend;
    }

    get hasNewDefendRecord() {
        return this._hasNewDefendRecord;
    }

    get isReplay(): boolean {
        return !!(this._pvpConfig && this._pvpConfig.replay)
    }

    get peakDuelRankInfo() { return this._peakDuelRankInfo; }

    set pvpPeakDuekFinishData(val: gamesvr.PvpPeakDuelEnterRes) {
        this._pvpPeakDuekFinishData = val;
    }

    get pvpPeakDuekFinishData() { return this._pvpPeakDuekFinishData; }

    init() { }

    deInit() {
        this._pvpData = new data.PVPData();
        this._pvpConfig = null;
        this._spiritEnemies = [];
        this._fairyRankList = [];
        this._peakDuelRankInfo = null;
        // this._peakDuelEnemiesInfo = null;
        this._pvpFairyFinishData = null;
        this._pvpSpiritFinishData = null;
        this._hasNewDefendRecord = false;
    }

    initPvpData(pvpData: data.IPVPData) {
        this._pvpData = pvpData;
    }

    clearPvpConfig() {
        this._pvpConfig = null;
    }
    /**
     * @desc 更新战斗记录
     * @param fightData 全部战斗记录
     * @returns 
     */
    updateSpiritRecord(fightData: data.IPVPSpiritFight) {
        // TODO 这里需要改一下 会改成只推单个数据的 自己push;
        this._updateNewDefendState(fightData);
        redDotMgr.updatePvpDeifyFightState();
        let spiritData = this.spiritData;
        if (!spiritData) return;
        if (!spiritData.FightList) {
            spiritData.FightList = new Array();
        }
        spiritData.FightList.push(fightData);
    }

    /**
     * @desc 更新战斗排名
     * @param rank 排名
     * @returns 
     */
    updateSpiritRank(rank: number) {
        if (!rank || !this.spiritData) return;
        let spiritData = this.spiritData;
        spiritData.Rank = rank;
        spiritData.TopRank = Math.min(rank, spiritData.TopRank || Infinity);
    }

    /**
     * @desc 更新敌人列表
     * @param enemies 敌方列表
     * @param tradeTime 手动更新时间
     */
    updateEnemyList(enemies: data.IPVPSpiritEnemy[], tradeTime?: number) {
        if (!enemies) return;
        this._spiritEnemies = enemies;
        tradeTime && (this.spiritData.LastTradeTime = tradeTime);
    }

    /**
     * @desc 更新防御阵容
     * @param defensive 防御阵容
     * @returns 
     */
    updateSpiritDefensive(defensive: gamesvr.PvpSpiritTradeDefensiveLineupRes) {
        if (!defensive || !defensive.DefensiveHeroMap || !this.spiritData) return;
        this.spiritData.DefensiveHeroMap = defensive.DefensiveHeroMap;
    }

    getSpiritDefensiveTeam() {
        let teamInfo: data.ITeamInfo = {
            Index: 0,
            Heroes: utils.deepCopy(this.spiritData.DefensiveHeroMap) || {}
        };
        return teamInfo;
    }
    
    getSpiritEnemyGroup(): number[] {
        let heros: number[] = [];
        if (this._spiritEnemies && this._pvpConfig.enemySerial < this._spiritEnemies.length) {
            let enemyUnit = this._spiritEnemies[this._pvpConfig.enemySerial].RankUserUnit;
            for (let k in enemyUnit.HeroUnitMap) {
                // heros.push(enemyUnit.HeroUnitMap[k].ID)
                heros[Number(k)] = enemyUnit.HeroUnitMap[k].ID;
            }
        }
        return heros;
    }

    // 回放的阵容
    getReplayEnemyGroup(): number[] {
        let heros: number[] = [0, 0, 0, 0, 0];
        let teams = this._pvpConfig.replay.Teams;
        if (teams && teams[1]) {
            teams[1].Roles.forEach(_r => {
                let pos = _r.Pos || 0
                heros[pos] = _r.ID
            })
        }
        return heros;
    }

    getSpiritEnemyUnit(): data.IPVPSpiritRankUser {
        let heros: number[] = [];
        if (this._spiritEnemies && this._pvpConfig.enemySerial < this._spiritEnemies.length) {
            let enemyUnit = this._spiritEnemies[this._pvpConfig.enemySerial].RankUserUnit;
            return enemyUnit
        }
        return null;
    }

    getSpiritHero(heroId: number) {
        if (this._pvpConfig) {
            let enemyUnit = this._spiritEnemies[this._pvpConfig.enemySerial].RankUserUnit;
            for (let k in enemyUnit.HeroUnitMap) {
                if (enemyUnit.HeroUnitMap[k].ID == heroId) {
                    let level = this.calUserLv(enemyUnit.Exp);
                    return new HeroUnit((enemyUnit.HeroUnitMap[k]), null, level);
                }
            }
        }
        return null;
    }
    /**
     * @desc 更新斩将封神门票购买次数
     */
    updateSpiritBuyTimes(times: number) {
        if (!times || !this.spiritData) return;
        this.spiritData.BuyTicketsTimes = times;
    }

    /**
     * @description 获得巅峰对决的敌方英雄
     * @param index 游戏过程中-使用step控制战斗阵容
     *              结算界面-查看阵容时-根据业务控制
     * @returns 
     */
    getPeakDuelEnemyGroup(index?: number): number[] {
        let step = (index>=0) ? index : this._pvpConfig.step;
        let enemys: number[] = [0, 0, 0, 0, 0];
        let enemyInfo = this.peakDuelEnemiesInfo ? this.peakDuelEnemiesInfo : this.peakDuelData.PVPPeakDuelIntegralList[step];
        let stepArr: data.IPVPPeakDuelDefensiveHero = enemyInfo?.PVPPeakDuelDefensiveHeroList[step];
        if (!stepArr?.HeroUnitMap) return [];
        for (let k in stepArr.HeroUnitMap) {
            enemys[Number(k)] = stepArr.HeroUnitMap[k].ID;
        }
        return enemys;
    }

    updatePeakDuelEnemisInfo(enemyInfo: data.IPVPPeakDuelIntegral) {
        if (!enemyInfo) return;
        this._peakDuelEnemiesInfo = enemyInfo;
    }

    /**回放时-重置战斗信息*/
    updatePeakDuelRecordInfo(fight: data.IPVPPeakDuelFight) {
        this._peakRecordInfo = fight;
        this._peakDuelEnemiesInfo = fight.PVPPeakDuelIntegralUnit;
    }

    /**
     * @desc 更新论道修仙数据
     */
    updateFairyData(fairyData: data.IPVPFairyData) {
        if (fairyData && (fairyData.Integral || fairyData.Integral == 0)) {
            this.fairyData.Integral = fairyData.Integral;
        }
        if (fairyData && (fairyData.ChallengeTimes || fairyData.ChallengeTimes == 0)) {
            this.fairyData.ChallengeTimes = fairyData.ChallengeTimes;
        }
        if (fairyData && (fairyData.WinTimes || fairyData.WinTimes == 0)) {
            this.fairyData.WinTimes = fairyData.WinTimes;
        }
        if (fairyData && ((fairyData.FightUserList || fairyData.FightUserList.length == 0))) {
            this.fairyData.FightUserList = fairyData.FightUserList;
        }
    }

    private _updateNewDefendState(fightData: data.IPVPSpiritFight) {
        if (fightData.IsChallenger) return;
        if (this._hasNewDefendRecord) return;
        let isNewDefend = fightData && (fightData.IsChallenger ? false : true);
        this._hasNewDefendRecord = isNewDefend;
    }

    updateFairyRankList(rankList: data.IPVPFairyIntegral[]) {
        this._fairyRankList = rankList || [];
        // 按照积分大小再次排序
        this._fairyRankList.sort((a, b) => {
            return (b.Integral || Infinity) - (a.Integral || Infinity);
        });
    }

    getFairyEnemyUnit(): data.IPVPFairyFightUser {
        if (this.fairyData && this.fairyData.FightUserList) {
            let enemyUnit = this.fairyData.FightUserList[this._pvpConfig.fightId];
            return enemyUnit
        }
        return null;
    }

    /**
     * @desc 获取论道修仙排名
     * @param uID 用户ID
     * @returns 
     */
    getUserFairyRank(uID: string) {
        let rank = 0;
        for (let i = 0; i < this._fairyRankList.length; i++) {
            let ele = this._fairyRankList[i];
            if (ele.User.UserID == uID) {
                rank = i + 1;
                break;
            }
        }
        return rank;
    }

    getFairyEnemyGroup(): number[] {
        let heros: number[] = [];
        if (this.fairyData && this.fairyData.FightUserList) {
            let enemyUnit = this.fairyData.FightUserList[this._pvpConfig.fightId];
            for (let k in enemyUnit.HeroUnitMap) {
                // heros.push(enemyUnit.HeroUnitMap[k].ID)
                heros[Number(k)] = enemyUnit.HeroUnitMap[k].ID;
            }
        }
        return heros;
    }

   
    getFairyHero(heroId: number) {
        if (this._pvpConfig) {
            let enemyUnit = this.fairyData.FightUserList[this._pvpConfig.fightId];
            for (let k in enemyUnit.HeroUnitMap) {
                if (enemyUnit.HeroUnitMap[k].ID == heroId) {
                    let level = this.calUserLv(enemyUnit.Exp);
                    return new HeroUnit((enemyUnit.HeroUnitMap[k]), null, level);
                }
            }
        }
        return null;
    }

    /**
    * @desc 获取PVP战斗敌方阵容
    * @param heroId
    * @returns
    */
    getEnemyGroup(): number[] {
        if (this._pvpConfig.pvpMode == PVP_MODE.DEIFY_COMBAT) {
            if (this._pvpConfig.replay) {
                return this.getReplayEnemyGroup();
            } else {
                return this.getSpiritEnemyGroup();
            }
        }
        if (this._pvpConfig.pvpMode == PVP_MODE.IMMORTALS_RANK) {
            return this.getFairyEnemyGroup();
        }
        if (this._pvpConfig.pvpMode == PVP_MODE.PEAK_DUEL) {
            // if (this._pvpConfig.replay) {
            //     return this.getPeakDuelEnemyGroupByReplay();
            // }
            return this.getPeakDuelEnemyGroup();
        }
        return [];
    }
    /**
      * @desc 获取PVP战斗敌方英雄类
      * @param heroId
      * @returns
      */
    getHero(heroId: number) {
        if (this._pvpConfig.pvpMode == PVP_MODE.DEIFY_COMBAT) {
            return this.getSpiritHero(heroId);
        }
        if (this._pvpConfig.pvpMode == PVP_MODE.IMMORTALS_RANK) {
            return this.getFairyHero(heroId);
        }
        return null;
    }

    getFairyBuff() {
        let buffId: number[] = [];
        if (this._pvpConfig.pvpMode == PVP_MODE.IMMORTALS_RANK) {
            let buffInfos = utils.parseStingList(configUtils.getModuleConfigs().PVPImmortalsBuff).slice(0, 2);
            this.pvpConfig.buffs.forEach(buffIndex => {
                if (buffInfos[buffIndex]) {
                    buffId.push(buffInfos[buffIndex][0]);
                }
            })
        }
        return buffId;
    }

    calUserLv(exp: number): number {
        let expConfigs = configUtils.getLevelExpConfigsByType(3);
        let level: number = 1;
        if (exp) {
            let expCount: number = 0;
            let key: number = 0;
            for (const k in expConfigs) {
                expCount += expConfigs[k].LevelExpNeedNum;
                if (exp < expCount) {
                    level = Number(k);
                    break;
                }
                level = Number(k);
            }
        }
        return level;
    }
    
    //计算最新的等级，等级经验，当前等级经验上限，即取即用
    getUserLv(exp: number) {
        if (!exp) return 1;
        let expConfigs = configUtils.getLevelExpConfigsByType(3);
        if (exp > 1) {
            let expCount: number = 0;
            for (const k in expConfigs) {
                expCount += Number(expConfigs[k].LevelExpNeedNum);
                if (exp < expCount) {
                    return Number(expConfigs[k].LevelExpLevel);
                }
            }
            return utils.getUserMaxLv();
        } else {
            return 1;
        }
    }


    //巅峰对决- 排行榜信息
    updatePeakDuelRankList(rankData: gamesvr.RankPvpPeakDuelGetListRes) {
        this._peakDuelRankInfo = rankData;
    }

    getPVPDefensiveTeam(): data.ITeamInfo {
        if (!this._pvpConfig) return null;
        if (!this.peakDuelData?.PvpPeakDuelDefensiveLineupHeroList) return null;
        let step = this.pvpConfig?.step || 0;
        let heroList: number[] = this.peakDuelData.PvpPeakDuelDefensiveLineupHeroList[step]?.DefensiveHeroList;
        if (!heroList) return null;
        let heros: { [k: string]: number } = {};
        heroList.forEach((heroId, index) => {
            heros[`${index}`] = heroId;
        })
        let teamItem:data.ITeamInfo = {
            Index: step,
            Heroes: heros,
        }
        return teamItem;
    }

    /**获得巅峰对决门票数量*/
    getPeakDuekAttakTimes(): number{
        let modelConfig: cfg.ConfigModule = configUtils.getModuleConfigs();
        let itemID = modelConfig?.PVPTopBattleUseItemId || 0;
        let count = bagData.getItemCountByID(itemID) || 0;
        return count;
    }

    /**检测 是否 PVP多阵容
     * @param pvpMode pvp类型
    */
    checkPVPMulitBattle(pvpMode?: number): boolean {
        if (!pvpMode && (!this._pvpData || !this._pvpConfig)) return false;
        let checkPvpMode = pvpMode ? pvpMode : this._pvpConfig?.pvpMode;
        switch (checkPvpMode) {
            case PVP_MODE.PEAK_DUEL:  //巅峰对决
            case PVP_MODE.GUILD_WAR:  //公会战
                return true;
            default:
                return false;
        }
    }
}

let pvpData = new PvpData();
export { pvpData }