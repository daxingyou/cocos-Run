import { ROLE_STATE, ROLE_TYPE } from "../../app/BattleConst";
import { gamesvr } from "../../network/lib/protocol";

export default class UIRole {
    protected _id: number       = 0;
    protected _instanId: number = 0;
    protected _pos: number      = 0;
    protected _hp: number       = 0; 
    protected _maxHp: number    = 0;
    protected _shield: number   = 0; // 护盾值
    protected _power: number    = 0; 
    protected _maxPower: number    = 0; 
    protected _buffList: gamesvr.IBuff[] = []; 
    protected _haloList: gamesvr.IHalo[] = []; 
    protected _roleType: ROLE_TYPE = ROLE_TYPE.INVALID;
    protected _spPath: string   = "";
    protected _state: number   = gamesvr.RoleState.Normal;
    // 客户端数据，仅供奇门遁甲使用
    protected _fakeId: number   = 0;

    constructor (role: gamesvr.IRole, roleType: ROLE_TYPE) {
        this._instanId = role.UID;
        this._id = role.ID;
        this._pos = role.Pos || 0;
        this._maxHp = role.MaxHP;
        this._hp = role.HP;
        this._maxPower = role.MaxPower;
        this._shield = 0;
        this._power = role.Power;
        this._state = role.RoleState;

        this._roleType = roleType
        this._buffList = [];
        this._haloList = [];

        this.addBuffs(role.Buffs);
        this.addHalos(role.Halos);
    }

    init () {

    }

    clear () {

    }

    updateRoleBuff (v: gamesvr.IBuffResult) {
        let buff = this.getBuff(v.BuffUID);

        let delta = v.Delta || 0;
        if (buff) {
            if (buff.Count + delta <= 0) {
                this.removeBuff(buff.UID);
            } else {
                buff.Count += delta;
            }
        } else {
            if (delta> 0) // 不需要显示的buff
                this.addBuff({
                    UID: v.BuffUID,
                    ID: v.BuffID,
                    Count: v.Count
                });
        }
    }

    getBuff (buffUID: number): gamesvr.IBuff {
        for (let i = 0; i < this._buffList.length; i++) {
            if (this._buffList[i].UID == buffUID) {
                return this._buffList[i];
            }
        }
        return null;
    }

    removeBuff (buffUID: number) {
        for (let i = this._buffList.length - 1; i >= 0; i--) {
            if (this._buffList[i].UID == buffUID) {
                // this._buffList.splice(i, 1);
                this._buffList[i].Count = 0;
                break;
            }
        }
    }

    addBuffs (buffs: gamesvr.IBuff[]) {
        if (!buffs) return;
        buffs.forEach( _b => {
            this.addBuff(_b)
        })
    }

    addBuff (buff: gamesvr.IBuff) {
        this._buffList.push(buff);
    }

    addHalos (haloes: gamesvr.IHalo[]) {
        if (!haloes) return;
        haloes.forEach( _h => {
            this.addHalo(_h)
        })
    }

    addHalo (halo: gamesvr.IHalo) {
        this._haloList.push(halo);
    }

    updateRoleHalo (haloRes: gamesvr.IHaloResult) {
        let halo = this.getHalo(haloRes.HaloUID);
        if (!halo)
            this.addHalo({
                UID: haloRes.HaloUID,
                ID: haloRes.HaloID,
                RoleID: haloRes.RoleUID,
            });
    }


    getHalo (haloUid: number): gamesvr.IHalo {
        for (let i = 0; i < this._haloList.length; i++) {
            if (this._haloList[i].UID == haloUid) {
                return this._haloList[i];
            }
        }
        return null;
    }

    removeHalo (haloUid: number) {
        for (let i = this._haloList.length - 1; i >= 0; i--) {
            if (this._haloList[i].UID == haloUid) {
                this._haloList.splice(i, 1);
                break;
            }
        }
    }

    get buffList () {
        return this._buffList;
    }

    get haloList () {
        return this._haloList;
    }

    get uid () {
        return this._instanId;
    }

    set power (v: number) {
        this._power = v;
    }

    get power () {
        return this._power;
    }

    set maxPower (v: number) {
        this._maxPower = v;
    }

    get maxPower () {
        return this._maxPower;
    }

    set state (v: ROLE_STATE) {
        this._state = v;
    }

    get state () {
        return this._state;
    }

    set hp (v: number) {
        this._hp = v;
    }

    get hp () {
        return this._hp;
    }

    set maxHp (v: number) {
        this._maxHp = v;
    }

    get maxHp () {
        return this._maxHp;
    }

    get roleType () {
        return this._roleType
    }

    get pos () {
        return this._pos
    }

    get roleId () {
        return this._id
    }

    get rolePath () {
        return this._spPath;
    }

    set fakeId(id: number) {
        this._fakeId = id;
    }

    get fakeId() {
        return this._fakeId;
    }

}