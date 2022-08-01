import { data } from "../../network/lib/protocol";
import BaseModel from "./BaseModel";
import HeroUnit from "../template/HeroUnit";
import { cfg } from "../../config/config";
import { configUtils } from "../../app/ConfigUtils";
import { configManager } from "../../common/ConfigManager";
import { LEVEL_EXP_TYPE } from "../../app/AppEnums";
import { pveTrialData } from "./PveTrialData";


class PveFakeData extends BaseModel {
    private _fakeHero: { [k: string]: data.IBagItem } = null;
    private _seedFakeHero: { [k: string]: data.IBagItem } = null;

    init(){
        if (!this._fakeHero){
            this.constructFakeData();
        }
    }

    deInit(): void {
        this._fakeHero = {};
        this._seedFakeHero = {};
    }

    get fakeHero(){
        return this._fakeHero;
    }   

    set fakeHero(fakeHeroData: { [k: string]: data.IBagItem }) {
        this._fakeHero = fakeHeroData;
    }
    /**
     * @desc 获取假英雄信息
     * @param heroId MagicHero唯一ID
     * @returns 
     */
    getFakeHeroById(heroId: number): HeroUnit {
        let itemData = this._fakeHero[heroId];
        if (itemData && itemData.Array.length > 0) {
            // 英雄不能叠加
            return new HeroUnit(itemData.Array[0], heroId)
        }
        return null;
    }

    /**
     * @desc 获取假英雄信息
     * @param heroId 英雄真实ID
     * @returns
     */
    getFakeHeroByHeroId(heroId: number): HeroUnit {
        for (let k in this._fakeHero){
            let bagUnit = this._fakeHero[k].Array[0];
            if (bagUnit.ID == heroId){
                return new HeroUnit(bagUnit, parseInt(k))
            }
        }
        return null;
    }

    getFakeHeroList(){
        let heroList: number[] = [];
        for (let k in this._fakeHero) {
            let bagUnit = this._fakeHero[k].Array[0];
            heroList.push(parseInt(k));
        }
        return heroList;
    }

    getSeedFakeHeroList() {
        let heroList: number[] = [];
        for (let k in this._seedFakeHero) {
            heroList.push(parseInt(k));
        }
        return heroList;
    }

    getRealHeroId(fakeID: number){
        if (this._fakeHero.hasOwnProperty(fakeID)){
            return this._fakeHero[fakeID].Array[0].ID;
        }
        return null;
    }

    constructFakeData(){
        let configs = configManager.getConfigs("pveMagicHero");
        let magicCfg: cfg.PVEDaoistMagic = configManager.getConfigByKey("pveMagicDoor", pveTrialData.miracalInfo.CurrentPeriod);
        let fakeHeroData: { [k: string]: data.IBagItem } = {};
        let seedFakeHero: { [k: string]: data.IBagItem } = {};
        let magicHeroList: number[] = [];
        if (magicCfg && magicCfg.PVEDaoistMagicPlayerHero){
            magicHeroList = magicCfg.PVEDaoistMagicPlayerHero.split("|")
            .map(_hid => {return Number(_hid)});
        }
        for (let k in configs){
            let heroInfo: cfg.PVEDaoistMagicHero = configs[k];
            let heroBagUnit: data.IBagUnit = {
                Seq: -1, ID: heroInfo.HeroID, Count: 1,
                HeroUnit: {
                    Star: heroInfo.HeroStar,
                    Equips: {}, Gifts: {}, Attrs: {},
                }
            }
            if (heroInfo.Equip1) {
                let equipUnit = this.constructEquipUnit(heroInfo.Equip1);
                heroBagUnit.HeroUnit.Equips[equipUnit.ID] = equipUnit;
            }
            if (heroInfo.Equip2) {
                let equipUnit = this.constructEquipUnit(heroInfo.Equip2);
                heroBagUnit.HeroUnit.Equips[equipUnit.ID] = equipUnit;
            }
            if (heroInfo.Equip3) {
                let equipUnit = this.constructEquipUnit(heroInfo.Equip3);
                heroBagUnit.HeroUnit.Equips[equipUnit.ID] = equipUnit;
            }
            if (heroInfo.Equip4) {
                let equipUnit = this.constructEquipUnit(heroInfo.Equip4);
                heroBagUnit.HeroUnit.Equips[equipUnit.ID] = equipUnit;
            }
            if (heroInfo.Equip5) {
                let equipUnit = this.constructEquipUnit(heroInfo.Equip5);
                heroBagUnit.HeroUnit.Equips[equipUnit.ID] = equipUnit;
            }
            if (heroInfo.Equip6) {
                let equipUnit = this.constructEquipUnit(heroInfo.Equip6);
                heroBagUnit.HeroUnit.Equips[equipUnit.ID] = equipUnit;
            }
            if (heroInfo.Equip7) {
                let equipUnit = this.constructEquipUnit(heroInfo.Equip7);
                heroBagUnit.HeroUnit.Equips[equipUnit.ID] = equipUnit;
            }
            if (magicHeroList.indexOf(Number(k))!=-1)
                seedFakeHero[k] = { Array: [heroBagUnit] };
            fakeHeroData[k] = { Array: [heroBagUnit] };
        }
        this._seedFakeHero = seedFakeHero;
        this._fakeHero = fakeHeroData;
    }
    //武器信息构造
    constructEquipUnit(str: string): data.IBagUnit {
        let parseArr = str.split(";");
        let equipUnit: data.IBagUnit = {};
        if (parseArr.length && parseArr.length > 1) {
            let star = parseInt(parseArr[1]);
            let level = parseInt(parseArr[2]) || 1;
            equipUnit.ID = parseInt(parseArr[0]);
            equipUnit.Count = 1;
            equipUnit.EquipUnit = {
                Exp: this.getEquipExpInLevel(level, equipUnit.ID),
                Star: star
            };
            equipUnit.Seq = 0;
        }
        return equipUnit;
    }

    /**
     * 
     * @param lv 假英雄携带装备等级
     * @param equipId 
     * @returns 
     */
    getEquipExpInLevel(lv: number, equipId: number) {
        let expConfig: cfg.LevelExp[] = configManager.getConfigs('levelExp');
        let equipCfg = configUtils.getEquipConfig(equipId);
        let equipExpList: cfg.LevelExp[] = [];
        let exp = 0;
        for (const k in expConfig) {
            if (expConfig[k].LevelExpType == LEVEL_EXP_TYPE.EQUIP
                && expConfig[k].LevelExpQuality == equipCfg.Quality
                && Number(k) < lv) {
                exp += Number(expConfig[k]) || 0;
            }
        }
        return exp;
    }

}

let pveFakeData = new PveFakeData();
export {
    pveFakeData,
}