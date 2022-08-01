import { EFFECT_TYPE } from "../../app/AppEnums";
import { configUtils } from "../../app/ConfigUtils";
import { AttackProperty, HaloData } from "../BattleType";

export default class Halo {
    private _haloId: number = 0;
    private _owner: number  = 0;
    private _extra: any     = 0;
    private _cfg: any       = 0;

    private _buffEffect: AttackProperty = null;

    constructor (halo: HaloData, owner: number) {
        this._haloId = halo.HaloId;
        this._owner = owner;

        this._buffEffect = {effectType: EFFECT_TYPE.HALO};
        this._cfg = configUtils.getHaloConfig(this._haloId);
    }

    get buffId () {
        return this._haloId;
    }

    get owner () {
        return this._owner;
    }

    get buffEffect () {
        return this._buffEffect
    }

    get cfg () {
        return this._cfg
    }

}