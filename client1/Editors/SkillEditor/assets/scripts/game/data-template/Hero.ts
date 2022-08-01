import { ROLE_TYPE } from "../../app/AppEnums";
import { AppUtils } from "../../app/AppUtils";
import { configUtils } from "../../app/ConfigUtils";
import { configManager } from "../../common/ConfigManager";
import BTBaseRole from "./BTBaseRole";

export default class Hero extends BTBaseRole {

    constructor (heroId: number, idx: number) {
        super();
        let cfg = configUtils.getHeroConfig(heroId);
        if (cfg) {
            this._roleType = ROLE_TYPE.HERO;
            this._instanId = AppUtils.HeroUID++
            this._id = heroId;
            this._pos = idx;
            this._roleCfg = cfg;
            this.initBaseProp();
            this._initHeroProp();
        }
    }

    private  _equipment: number[] = [];

    init () {

    }

    clear () {
        super.clear();
        this._equipment = [];
    }

    private _initHeroProp () {
        let currLevel = 0;
        let currStar = 0;

        // 基础属性
        this._maxHp     = this._getHeroPropLevel(this._roleCfg.Hp, currLevel)
        this._hp        = this._maxHp;
        this._attack    = this._getHeroPropLevel(this._roleCfg.Attack, 0)
        this._block     = this._getHeroPropLevel(this._roleCfg.Defend, 0);
        this._critRate  = this._getHeroPropLevel(this._roleCfg.Critical, 0);
        this._crit      = this._getHeroPropLevel(this._roleCfg.CriticalHarm, 0);
        this._speed     = this._getHeroPropLevel(this._roleCfg.Speed, 0);
        this._speedAdd  = this._getHeroPropLevel(this._roleCfg.SpeedAdd, 0);


        let attributeCfg = configManager.getConfigByKey("heroAttribute", this._id);

        this._harmImmunity  = this._getHeroPropLevel(attributeCfg.HarmImmunity, currLevel);
        this._parryRate     = this._getHeroPropLevel(attributeCfg.Parry, currLevel);
        this._parry         = this._getHeroPropLevel(attributeCfg.ParryValue, currLevel);
        this._hitRate       = this._getHeroPropLevel(attributeCfg.Hit, currLevel);
        this._dodge         = this._getHeroPropLevel(attributeCfg.Miss, currLevel);
        this._vampireRate   = this._getHeroPropLevel(attributeCfg.Blood, currLevel);
        this._vampire       = this._getHeroPropLevel(attributeCfg.BloodValue, currLevel);
        this._noCrit        = this._getHeroPropLevel(attributeCfg.NoCritical, currLevel);
        this._counterRate   = this._getHeroPropLevel(attributeCfg.Counterattack, currLevel);
        this._counter       = this._getHeroPropLevel(attributeCfg.CounterattackValue, currLevel);
        this._sputterRate   = this._getHeroPropLevel(attributeCfg.Sputtering, currLevel);
        this._sputtering    = this._getHeroPropLevel(attributeCfg.SputteringValue, currLevel);
        this._immunity      = this._getHeroPropLevel(attributeCfg.DebuffImmunity, currLevel);
        this._paEnergy      = this._getHeroPropLevel(attributeCfg.PAEnergy, currLevel);
        this._maxEnergy     = this._getHeroPropLevel(attributeCfg.EnergyLimit, currLevel);
        
        this._hp            = this._maxHp + this._getHeroPropLevel(this._roleCfg.HpAdd, 0) * currLevel;
        this._attack        = this._attack + this._getHeroPropLevel(this._roleCfg.AttackAdd, 0) * currLevel;
        this._block         = this._block + this._getHeroPropLevel(this._roleCfg.DefendAdd, 0) * currLevel;
        this._critRate      = this._critRate + this._getHeroPropLevel(this._roleCfg.CriticalAdd, 0) * currLevel;
        this._crit          = this._crit + this._getHeroPropLevel(this._roleCfg.CriticalHarmAdd, 0) * currLevel;

        if (this._roleCfg.HoldSkill) {
            let strSkill: string[] = this._roleCfg.HoldSkill.split("|");
            
            if (strSkill[0]) {
                this._skillList.push(parseInt(strSkill[0]))
            }
        }

    }

}