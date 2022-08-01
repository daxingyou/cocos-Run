import { EFFECT_TYPE } from "../../app/AppEnums";
import { configUtils } from "../../app/ConfigUtils";
import { AttackProperty, BattleInfo, BuffData, BuffExtraData } from "../BattleType";

export default class Buff {
    private _buffId: number = 0;
    private _count: number  = 0;
    private _owner: number  = 0;
    private _extra: BuffExtraData = null;
    private _cfg: any       = 0;
    private _roundIdx: number = 0;

    constructor (buffInfo: BuffData, owner: number) {
        this._buffId = buffInfo.buffId;
        this._count = buffInfo.count;
        this._extra = buffInfo.data;
        this._owner = owner;
        
        this._cfg = configUtils.getBuffConfig(this._buffId);
        this._roundIdx = this._cfg.Times;
    }

    get buffId () {
        return this._buffId;
    }

    get roundTag () {
        return this._roundIdx;
    }

    set roundTag (v: number) {
        this._roundIdx = v;
    }

    get count () {
        return this._count;
    }

    set count (v: number) {
        this._count = v;
    }

    get owner () {
        return this._owner;
    }

    set extraData (v: BuffExtraData) {
        this._extra = v;
    }

    get extraData () {
        return this._extra;
    }


    /**
     * @description buff叠加的时候，重置CD
     * @param v 
     */
    addCount (v: number) {
        this._count += v;
        if (this._cfg.Layers && this._count > this._cfg.Layers) {
            this._count = this._cfg.Layers;
        } 
        this._roundIdx = this._cfg.Times;
    }

    get cfg () {
        return this._cfg
    }

}