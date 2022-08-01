/**
 * 跑酷角色
 */

enum ParkourBuffType {
    None = 0,    //无buff
    NO_HURT = 1,    //无敌状态，免伤
    PENG_ZHUANG = 1<< 1, //碰撞状态，碰到的陷阱被撞碎
    CHONG_CI = 1 <<2, //冲刺状态
}

class Role{

    protected _roleCfg: any = null;
    
    protected _maxHp: number = 0;
    protected _hp:number = 0;
    protected _buffMap: Map<ParkourBuffType, number> = null;
    protected _skillList: [] = null;

    constructor(){
        this._buffMap = new Map<ParkourBuffType, number>();
    }
       
    set roleCfg(cfg: any) {
        this._roleCfg = cfg;
    }

    get maxHp() {
        return this._maxHp;
    }

    set maxHp(maxHp: number){
        this._maxHp = maxHp;
    }

    get hp(){
        return this._hp;
    }

    set hp(hp: number){
        this._hp = hp;
    }

    get buffState(){
        return this._buffMap;
    }

    //是否免伤状态
    isNoHurtState(){
        return this._buffMap && this._buffMap.size > 0 && this._buffMap.get(ParkourBuffType.NO_HURT) > 0;
    }

    //是否碰撞状态
    isPengZhuangState(){
        return this._buffMap && this._buffMap.size > 0 && this._buffMap.get(ParkourBuffType.PENG_ZHUANG) > 0;
    }

    //增加buff
    addBuff(buffType: ParkourBuffType = ParkourBuffType.None, time: number = 0, isOver = true){
        let newTime = time;
        if(this._buffMap.has(buffType)){
            newTime = isOver ? this._buffMap.get(buffType) + time : time;  
        }
        this._buffMap.set(buffType, newTime);
    }

    //移除buff
    removeBuff(buffType: ParkourBuffType = ParkourBuffType.None){
        if(this._buffMap.has(buffType)){
            this._buffMap.delete(buffType);
        }
    }

    isDead(){
        return this.maxHp > 0 && this.hp <= 0;
    }

    clearBuffs(){
        this._buffMap.clear();
    }
}

export {
    Role,
    ParkourBuffType,
}