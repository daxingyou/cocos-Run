import { BATTLE_POS, ROLE_TYPE } from "../../app/AppEnums";
import { BuffData } from "../../game/BattleType";
import { BuffResult, RoleData } from "../../game/CSInterface";

export default class UIRole {
    protected _id: number       = 0;
    protected _instanId: number = 0;
    protected _pos: number      = 0;
    protected _hp: number       = 0; 
    protected _maxHp: number    = 0; 
    protected _power: number    = 0; 
    protected _buffList: BuffData[] = []; 
    protected _roleType: ROLE_TYPE = ROLE_TYPE.INVALID;
    protected _spPath: string   = "";

    constructor (role: RoleData) {
        this._id = role.ID;
        this._instanId = role.UID;
        this._hp = role.HP;
        this._maxHp = role.MaxHP;
        this._pos = role.Pos;
        this._roleType = role.Type
        this._buffList = [];
        this._power = role.Power;

        role.Buffs.forEach( _b => {
            this._buffList.push({
                buffId: _b.buffId,
                buffUId: _b.buffUId,
                count: _b.count,
                data: _b.data
            })
        })
    }

    private  _equipment: number[] = [];

    init () {

    }

    clear () {
        this._equipment = [];
    }

    updateRoleBuff (buffData: BuffResult) {
        let buff = this.getBuff(buffData.BuffId);
        if (buff) {
            if (buffData.Count == 0) {
                this.removeBuff(buff.buffId);
            } else {
                buff.count = buffData.Count;
            }
        } else {
            if (buffData.Count > 0) // 不需要显示的buff
                this.addBuff(buffData);
        }
    }

    getBuff (buffID: number): BuffData {
        for (let i = 0; i < this._buffList.length; i++) {
            if (this._buffList[i].buffId == buffID) {
                return this._buffList[i];
            }
        }
        return null;
    }

    removeBuff (buffID: number) {
        for (let i = this._buffList.length - 1; i >= 0; i--) {
            if (this._buffList[i].buffId == buffID) {
                this._buffList.splice(i, 1);
                break;
            }
        }
    }

    addBuff (buffResult: BuffResult) {
        this._buffList.push({
            buffId: buffResult.BuffId,
            count: buffResult.Count,
        });
    }

    get buffList () {
        return this._buffList;
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
}