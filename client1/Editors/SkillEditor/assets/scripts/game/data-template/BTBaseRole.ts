import { ATTACK_TYPE, HALO_RANGE, HERO_PROP, ROLE_STATE, ROLE_TYPE, TARGET_TYPE } from "../../app/AppEnums";
import { utils } from "../../app/AppUtils";
import { configUtils } from "../../app/ConfigUtils";
import { BattleInfo, BuffData, HaloData, RoleEffect } from "../BattleType";
import { dataManager } from "../data-manager/DataManager";
import Buff from "./Buff";

export default class BTBaseRole {
    protected _roleCfg: any     = null;
    protected _id: number       = 0;
    protected _instanId: number = 0;
    protected _pos: number      = 0;
    protected _attack: number   = 0; // 攻击
    protected _block: number    = 0; // 格挡
    protected _hp: number       = 0; // 血量
    protected _maxHp: number            = 0; // 血量
    protected _avoidInjury: number      = 0; // 免伤 
    protected _speed: number            = 0; // 速度
    protected _speedAdd: number         = 0; // 速度

    protected _hitRate: number          = 0; // 命中率
    protected _dodge: number            = 0; // 闪躲率
    protected _critRate: number         = 0; // 暴击率
    protected _crit: number             = 0; // 暴击伤害
    protected _vampireRate: number      = 0; // 吸血率
    protected _vampire: number          = 0; // 吸血效果
    protected _counterRate: number      = 0; // 反击率
    protected _counter: number          = 0; // 反击效果
    protected _parryRate: number        = 0; // 招架率
    protected _parry: number            = 0; // 招架收益值
    protected _noCrit: number           = 0; // 暴击抵抗率
    protected _sputterRate: number      = 0; // 溅射率
    protected _sputtering: number       = 0; // 溅射值
    protected _immunity: number         = 0; // 异常状态抵抗率
    protected _harmImmunity: number     = 0; // 百分比免伤

    protected _paEnergy: number         = 0; // 普能回收
    protected _maxEnergy: number        = 0; // 最大能量

    protected _roleState: ROLE_STATE    = ROLE_STATE.NORMAL;
    protected _roleType: ROLE_TYPE      = ROLE_TYPE.INVALID;
    protected _buffList: Buff[]         = [];
    protected _haloList: number[]       = [];
    protected _skillList: number[]      = [];
    protected _attackType: ATTACK_TYPE  = ATTACK_TYPE.MELEE;
    protected _power: number            = 0;

    protected _buffEffect: RoleEffect[] = [];
    protected _haloEffect: RoleEffect[] = [];

    clear () {
        this._attack = 0;
        this._block = 0;
        this._hp = 0;
        this._maxHp = 0;
        this._speed = 0;
        this._speedAdd = 0;
        this._hitRate = 0;
        this._avoidInjury = 0;
        this._dodge = 0;
        this._critRate = 0;
        this._crit = 0;
        this._vampireRate = 0;
        this._vampire = 0;
        this._counterRate = 0;
        this._counter = 0;
        this._parry = 0;

        this._roleCfg = null;
        this._roleType = ROLE_TYPE.INVALID;
        this._roleState = ROLE_STATE.NORMAL;
        this._buffList = [];
        this._skillList = [];
        this._attackType = ATTACK_TYPE.MELEE;
        this._power = 0;
        this._paEnergy = 0;
        this._maxEnergy = 100;
        this._buffEffect = [];
    }

    initBaseProp () {
        if(!this._roleCfg) {
            return;
        }

       
        this._attackType= this._roleCfg.MeleeOrLong || ATTACK_TYPE.MELEE;
        this._buffEffect = [];
        this._skillList = [];
        
        this._power = 100;
    }

    whenRoundBegin () { 
      
    }

    whenRoundEnd () {

    }

    whenBattleBegin () {
        
    }

    whenBattleEnd () {
        
    }

    isAlive () {
        return this.hp > 0
    }

    addBuff (buffInfo: BuffData, battleInfo: BattleInfo): {buff: Buff, delta: number} {
        let buffId = buffInfo.buffId
        let config = configUtils.getBuffConfig(buffId);
        if (!config) return null;
        
        let originCnt = 0;
        if (this.hasBuff(buffId)) {
            let curr = this.getBuff(buffId);
            originCnt = curr.count;
        } else {
            let buff = new Buff({buffId: buffId, count:0}, this.roleUID);
            this._buffList.push(buff)
            originCnt = 0;
        }

        let currBuff = this.getBuff(buffId);
        if (currBuff) {
            currBuff.extraData = buffInfo.data;
            currBuff.addCount(buffInfo.count);

            let delta = currBuff.count - originCnt;

            return {
                buff: currBuff, 
                delta: delta,
            };
        }
        return null 
    }

    addHalo (halo: HaloData) {
        if (this._haloList.indexOf(halo.HaloId) == -1) {
            this._haloList.push(halo.HaloId);
            // this.
        }
        return halo
    }

    getBuff (buffId: number) {
        for (let i = 0; i < this._buffList.length; i++) {
            if (this._buffList[i].buffId == buffId) {
                return this._buffList[i];
            }
        }
        return null;
    }

    hasBuff (buffId: number): boolean {
        for (let i = 0; i < this._buffList.length; i++) {
            if (this._buffList[i].buffId == buffId) {
                return true;
            }
        }
        return false;
    }

    clearInvalidBuff () {
        for (let i = this._buffList.length - 1; i >= 0; i--) {
            let buff = this._buffList[i];
            if (buff.count <= 0) {
                this._buffList.splice(i, 1);
            }
        }
    }

    setBuffEffect (para: RoleEffect): RoleEffect {
        let res: RoleEffect = null;
        if (para && para.buffId) {
            let find = false;
            for (let i = this._buffEffect.length - 1; i >= 0; i--) {
                let buff = this._buffEffect[i];
                if (buff.buffId == para.buffId) {
                    this._buffEffect[i] = para;
                    find = true;
                    break;
                }
            }
            if (!find) {
                this._buffEffect.push(para)
            }
        }
        // @ts-ignore
        return utils.deepCopy(res);
    }

    setHaloEffect (para: RoleEffect): RoleEffect {
        let res: RoleEffect = null;
        if (para && para.haloId) {
            let find = false;
            for (let i = this._haloEffect.length - 1; i >= 0; i--) {
                let buff = this._haloEffect[i];
                if (buff.haloId == para.haloId) {
                    this._haloEffect[i] = para;
                    find = true;
                    break;
                }
            }
            if (!find) {
                this._haloEffect.push(para)
            }
        }
        // @ts-ignore
        return utils.deepCopy(res);
    }

    removeBuffEffect (buffId: number) {
        for (let i = this._buffEffect.length - 1; i >= 0; i--) {
            let buff = this._buffEffect[i];
            if (buff.buffId == buffId) {
                this._buffEffect.splice(i, 1);
            }
        }
    }

    removeBuff (buffId: number): {buffId: number, delta: number} {
        let res = {buffId: buffId, delta: 0}
        for (let i = this._buffList.length - 1; i >= 0; i--) {
            let buff = this._buffList[i];                     
            if (buff.buffId == buffId) {
                res.delta = -buff.count;
                this._buffList.splice(i, 1);
            }
        }
        this.removeBuffEffect(buffId);
        return res;
    }

    protected _getHeroPropLevel (strProp: string, level: number = 0) {
        let value = strProp.split("|");
        if (value[level]) {
            return parseInt(value[level]);
        }
        return 0;
    }

    get roleUID () {
        return this._instanId;
    }

    get roleID () {
        return this._id;
    }

    get config () {
        return this._roleCfg;
    }

    get speed () {
        return this._speed;
    }

    get defend () {
        return this._block;
    }

    get skillList () {
        return this._skillList;
    }

    get roleType () {
        return this._roleType;
    }

    get hp () {
        return this._hp;
    }

    get state () {
        return this._roleState;
    }

    set state (v: ROLE_STATE) {
        this._roleState = v;
    }

    get buffList () {
        return this._buffList;
    }

    get haloList () {
        return this._haloList;
    }

    set hp (v: number) {
        this._hp = v;
    }

    get maxHp () {
        return this._maxHp;
    }

    get pos () {
        return this._pos;
    }

    set pos (v: number) {
        this._pos = v;
    }

    get attack () {
        return this._attack;
    } 

    get baseAttack () {
        let add = 0;
        let addPct = 0;

        this._buffEffect.forEach( _v => {
            if (_v.propEffect && _v.propEffect[HERO_PROP.BASE_ATTACK])
                add+= _v.propEffect[HERO_PROP.BASE_ATTACK]

            if (_v.propEffect && _v.propEffect[HERO_PROP.BASE_ATTACK_PCT])
                addPct += _v.propEffect[HERO_PROP.BASE_ATTACK_PCT]
        })
        return (this._attack + add)* (1 + addPct/10000);
    }

    get baseDefend () {
        let add = 0;
        let addPct = 0;

        this._buffEffect.forEach( _v => {
            if (_v.propEffect && _v.propEffect[HERO_PROP.DEFEND])
                add+= _v.propEffect[HERO_PROP.DEFEND]

            if (_v.propEffect && _v.propEffect[HERO_PROP.DEFEND])
            addPct+= _v.propEffect[HERO_PROP.DEFEND_PCT]
        })
        return (this._block + add)* (1+addPct);
    }

    get block () {
        return this._block;
    }

    get harmImmunity () {
        return this._harmImmunity;
    }

    get miss () {
        return this._dodge;
    }

    get hit () {
        return this._hitRate;
    }

    get critRate () {
        return this._critRate;
    }

    get crit () {
        return this._crit;
    }

    get noCrit () {
        return this._noCrit;
    }

    get power () {
        return this._power;
    }

    set power (v: number) {
        this._power = v;
    }

    get maxPower () {
        return this._maxEnergy;
    }

    get paPower () {
        return this._paEnergy;
    }

    get buffProp () {
        return this._buffEffect;
    }

    get haloProp () {
        return this._haloEffect;
    }

    getTotalProp () {
        let res: number[] = [];
        let buff = this.getTotalBuffProp();
        let halo = this.getTotalHaloProp();
        for (let i = HERO_PROP.BEGIN; i < HERO_PROP.END; i++) {
            res[i] = buff[i] + halo[i];
        }
        return res;
    }

    getTotalBuffProp () {
        let total: number [] = [];
        for (let i = HERO_PROP.BEGIN; i < HERO_PROP.END; i++) {
            total[i] = 0;
        }
        this._buffEffect.filter( _b => {
            return _b.targetType && _b.targetType == TARGET_TYPE.SELF
        }).forEach( _be => {
            let list = _be.propEffect;
            list.forEach( (_v, _key) => {
                let origin = total[_key] || 0;
                if (_v) {
                    total[_key] = origin + _v;
                }
            })
        })
        return total;
    }

    getTotalHaloProp () {
        let total: number [] = [];
        for (let i = HERO_PROP.BEGIN; i < HERO_PROP.END; i++) {
            total[i] = 0;
        }
        
        let allRoles: BTBaseRole[] = [];
        let teams = dataManager.battleData.teams;
        teams.forEach( _t => {
            allRoles = allRoles.concat(_t.roles);
        })

        const checkRange = (haloOwner: BTBaseRole, target: BTBaseRole, range: HALO_RANGE):boolean => {
            if (!range) return false; 
            if (haloOwner.hp <= 0) return false; 

            switch (range) {
                case HALO_RANGE.ALL: {
                    return true;
                }
                case HALO_RANGE.DEFAULT: {
                    return (haloOwner.roleType != target.roleType) && (haloOwner.pos == target.pos);
                }
                case HALO_RANGE.DEFAULT_AROUND: {
                    return (haloOwner.roleType != target.roleType) && ( Math.abs(haloOwner.pos - target.pos) <= 1);
                }
                case HALO_RANGE.ENEMY_ALL: {
                    return (haloOwner.roleType != target.roleType)
                }
                case HALO_RANGE.SELF_AROUND: {
                    return (haloOwner.roleType == target.roleType) && ( Math.abs(haloOwner.pos - target.pos) <= 1);
                }
                case HALO_RANGE.SELL_ALL: {
                    return (haloOwner.roleType == target.roleType);
                }
                default: {
                    return false;
                }
            }
            return false;
        } 

        allRoles.forEach( _r => {
            _r.haloProp.forEach( _h => {
                if (checkRange(_r, this, _h.rangeType)) {
                    let list = _h.propEffect;
                    list.forEach( (_v, _key) => {
                        let origin = total[_key] || 0;
                        if (_v) {
                            total[_key] = origin + _v;
                        }
                    }) 
                }
            })
        });
        return total;
    }
}