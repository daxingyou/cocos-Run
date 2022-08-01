import { ROLE_TYPE } from "../../app/AppEnums";
import { AppUtils } from "../../app/AppUtils";
import { configUtils } from "../../app/ConfigUtils";
import BTBaseRole from "./BTBaseRole";

export default class Monster extends BTBaseRole{

    constructor (monsterId: number, idx: number) {
        super();
        let cfg = configUtils.getMonsterConfig(monsterId);
        if (cfg) {
            this._roleType = ROLE_TYPE.MONSTER;
            this._instanId = AppUtils.MonsterUID++
            this._id = monsterId;
            this._pos = idx;
            this._roleCfg = cfg;
            this.initBaseProp();
            this._initMonsterProp();
        }
    }

    init () {
        
    }

    clear () {
        super.clear();
    }

    private _initMonsterProp () {

        this._maxHp     = this._roleCfg.Hp
        this._hp        = this._maxHp;
        this._attack    = this._roleCfg.Attack;
        this._block     = this._roleCfg.Defend;
        this._critRate  = this._roleCfg.Critical;
        this._crit      = this._roleCfg.CriticalHarm;
        this._speed     = this._roleCfg.Speed;

        this._hitRate       = this._roleCfg.Hit || 0;
        this._dodge         = this._roleCfg.Miss || 0;
        this._vampireRate   = this._roleCfg.Blood || 0;
        this._vampire       = this._roleCfg.BloodValue || 0;
        this._noCrit        = this._roleCfg.NoCritical || 0;
        this._counterRate   = this._roleCfg.Counterattack || 0;
        this._counter       = this._roleCfg.CounterattackValue || 0;
        this._sputterRate   = this._roleCfg.Sputtering || 0;
        this._sputtering    = this._roleCfg.SputteringValue || 0;
        this._immunity      = this._roleCfg.DebuffImmunity || 0;
        this._harmImmunity  = this._roleCfg.HarmImmunity || 0;
        this._parryRate     = this._roleCfg.Parry || 0;
        this._parry         = this._roleCfg.ParryValue || 0;
    }
}