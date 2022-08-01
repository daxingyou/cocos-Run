import { logger } from '../../common/log/Logger';
import { configUtils } from '../../app/ConfigUtils';
import { userData } from '../models/UserData';
import { bagData } from '../models/BagData';
/*
 * @Description: 跑酷角色
 * @Autor: lixu
 * @Date: 2021-04-17 18:18:11
 * @LastEditors: lixu
 * @LastEditTime: 2021-07-22 19:22:56
 */

enum ParkourBuffType {
    None = 0,    //无buff
    NO_HURT = 1,    //无敌状态，免伤
    PENG_ZHUANG = 1<< 1, //碰撞状态，碰到的陷阱被撞碎
    CHONG_CI = 1 <<2, //冲刺状态
    RELIVE = 1 << 3,    //复活状态
    STRONG = 1 << 4,    //强化状态
}

class Role{
    //角色ID
    protected _id: number = -1;
    //名称
    protected _name: string = null;
    //品质
    protected _quality: number = -1;
    //星级
    private _starLevel: number = -1;
    //等级
    private _level: number = 0;
    //角色血量
    protected _maxHp: number = 0;
    //血量等级增量
    private _hpAdd: number = 0;
    //血量
    protected _hp:number = 0;
    //攻击力
    protected _damage: number = 0;
    //攻击力等级增量
    private _damageAdd: number = 0;
    //buff
    protected _buffMap: Map<ParkourBuffType, number> = null;
    //子弹组
    private _bulletGroup: number[] = null;
    //射击间隔
    private _shootDelay: number = 0;
    //对应的资源ID
    private _resID: number = -1;
    //强化子弹组
    private _superBulletGroup: number[] = null;
    //强化子弹的攻击间隔
    private _superShootDelay: number = 0;
    //顺位ID
    private _sortId:number = -1;
    //当前顺位
    private _currSortId = -1;

    constructor(id: number){
        this._id = id;
        this._level = userData.lv;

        this._parseConfig();
        this._hp = this._maxHp;
        this._buffMap = new Map<ParkourBuffType, number>();
    }

    get ID(){
        return this._id;
    }

    private _parseConfig(){
        let roleBasic = configUtils.getHeroBasicConfig(this._id);
        this._quality = roleBasic.HeroBasicQuality;
        this._starLevel = this._getRoleStar();
        let roleInfo = configUtils.getRunXHeroConfig(this._id);
        if(!roleInfo){
            logger.error('init Runx Role Entity fail', this._id);
            return;
        }
        this._name = roleInfo.RunXHeroName || '';
        this._bulletGroup = [roleInfo.HeroBulletID];
        this._shootDelay = roleInfo.Space;
        this._superBulletGroup = [roleInfo.HeroSuperBulletID];
        this._superShootDelay = roleInfo.SuperBulletSpace;
        this._resID = roleInfo.HerosArtID;

        let heroAttrConfig = configUtils.getRunXHeroAttr(this._quality, this._starLevel);
        this._damageAdd = heroAttrConfig.HeroDamageAdd || 0;
        this._hpAdd = heroAttrConfig.HeroBloodAdd || 0;
        this._damage = heroAttrConfig.HeroDamage + (this._level - 1) * this._damageAdd;
        this._maxHp = heroAttrConfig.HeroBlood + (this._level - 1) * this._hpAdd;
    }

    get sortId(){
        return this._currSortId;
    }

    set sortId(sortId: number){
        if(sortId < 0) return;
        if(this._currSortId >= 0) return;
        this._sortId = sortId;
        this._currSortId = sortId;
    }

    private _getRoleStar(){
        let heroList = bagData.heroList;
        let star = 1;
        for(let i = 0, len = heroList.length; i < len; i++){
            let ele = heroList[i];
            if(ele.ID === this._id){
                star = ele.HeroUnit.Star;
                break;
            }
        }
        return star;
    }

    decSortId(): number{
        if(this._currSortId <= 0)  return NaN;
        this._currSortId --;
        return this._currSortId;
    }

    resetSortId(){
        if(this._sortId < 0) return;
        this._currSortId = this._sortId;
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

    /**
     * 角色添加buff
     * @param buffType  buff类型
     * @param time      持续时间
     * @param isAccumulate  当前buff已经生效的情况下，是否累加
     */
    addBuff(buffType: ParkourBuffType = ParkourBuffType.None, time: number = 0, isAccumulate = true){
        let newTime = time;
        if(this._buffMap.has(buffType)){
            newTime = isAccumulate ? this._buffMap.get(buffType) + newTime : Math.max(newTime, this._buffMap.get(buffType));
        }
        this._buffMap.set(buffType, newTime);
    }

    /**
     * 移除角色身上的buff
     * @param buffType  buff类型
     */
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

    get damage(): number{
        return this._damage;
    }

    get bulletGroup(): number{
        return this._bulletGroup[0];
    }

    get shootDelay(): number{
        return this._shootDelay;
    }

    get superBulletGroup(): number{
        return this._superBulletGroup[0];
    }

    get superBulletDelay(): number{
        return this._superShootDelay;
    }

    /**
     * @description: 是否一号位
     * @param {*}
     * @return {*}
     * @author: lixu
     */
    isFirstSort(): boolean{
        return this._currSortId === 1;
    }

    //设置死亡时候的顺位id
    setDeadSortID(){
        this._currSortId = -1;
    }
}

export {
    Role,
    ParkourBuffType,
}
