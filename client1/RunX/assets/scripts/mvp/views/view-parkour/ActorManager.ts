/*
 * @Description: 跑酷角色管理器
 * @Autor: lixu
 * @Date: 2021-05-06 17:22:16
 * @LastEditors: lixu
 * @LastEditTime: 2021-08-23 18:25:29
 */
import { ParkourBuffType, Role } from '../../template/Role';
import PlayerMoveComp from './PlayerMoveComp';
import RoleLogicComp from './RoleLogicComp';

/**
 * 角色管理器
 */
class ActorManager {
    private _rolesMap: Map<Role, RoleLogicComp> = null;
    //团队buff
    private _buffMap: Map<ParkourBuffType, number> = null;
    private _controller: PlayerMoveComp = null;

    private static ins: ActorManager = null;

    private constructor(){}

    static getInstance() : ActorManager {
        if(!ActorManager.ins){
            ActorManager.ins = new ActorManager();
        }
        return ActorManager.ins;
    }

    setPlayerController(controller: PlayerMoveComp){
        this._controller = controller;
    }

    //添加角色的时候，顺便设置了角色的顺位
    addRole(roleComp: RoleLogicComp, roleInfo: Role){
        if(!roleInfo || !roleComp) return;
        if(!this._rolesMap){
            this._rolesMap = new Map<Role, RoleLogicComp>();
        }
        roleInfo.sortId = (this._rolesMap.size + 1);
        this._rolesMap.set(roleInfo, roleComp);
    }

    containsWithComp(role: RoleLogicComp) : boolean{
        if(!this._rolesMap || this._rolesMap.size == 0) return false;
        for(let [key, value] of this._rolesMap.entries()){
            if(value == role){
                return true;
            }
        }
        return false;
    }

    clear(){
        this._controller =null;
        this._rolesMap && this._rolesMap.clear();
        this._rolesMap = null;
        this._buffMap && this._buffMap.clear();
        this._buffMap = null;
    }

    /**
     * 移除团队buff
     * @param buffType  buff类型
     */
    removeBuff(buffType: ParkourBuffType = ParkourBuffType.None){
        if(!this._buffMap) return;
        if(this._buffMap.has(buffType)){
            this._buffMap.delete(buffType);
            this._controller && this._controller.removeBuffState(buffType);
        }
    }

    /**
     * 团队添加buff
     * @param buffType  buff类型
     * @param time      持续时间
     * @param isAccumulate  当前buff已经生效的情况下，是否累加
     */
    addBuff(buffType: ParkourBuffType = ParkourBuffType.None, time: number = 0, isAccumulate = true){
        let newTime = time;
        this._buffMap = this._buffMap || new Map<ParkourBuffType, number>();
        if(this._buffMap.has(buffType)){
            newTime = isAccumulate ? this._buffMap.get(buffType) + newTime : Math.max(newTime, this._buffMap.get(buffType));
        }
        this._buffMap.set(buffType, newTime);
    }

    clearBuffs(){
        this._buffMap && this._buffMap.clear();
    }

    getRoleInfo(roleComp: RoleLogicComp) : Role{
        if(!this._rolesMap || this._rolesMap.size == 0) return null;
        for(let [key, value] of this._rolesMap.entries()){
            if(value == roleComp){
                return key;
            }
        }
        return null;
    }

    getRoleInfos() : Map<Role, RoleLogicComp>{
        return this._rolesMap;
    }

    //获取第一个没有死亡的角色组件
    /**
     *
     * @param isCanEmpty 是否允许在有角色的情况下返回空,允许的情况下返回当前的第一顺位
     * @returns
     */
    getFirstRole(isCanDead: boolean = false): RoleLogicComp{
        if(!this._rolesMap || this._rolesMap.size == 0) return null;

        let comp: RoleLogicComp = null;
        for(let [key, value] of this._rolesMap.entries()){
            if((!key.isDead())){
                comp = value;
                break;;
            }
        }
        if(!comp && isCanDead){
            comp = this._rolesMap.get(this._rolesMap.keys().next().value);
        }
        return comp;
    }

    //获取最后一个没有死亡的角色
    getLastRole(): RoleLogicComp{
        if(!this._rolesMap || this._rolesMap.size == 0) return null;
        let comp: RoleLogicComp = null;
        for(let [key, value] of this._rolesMap.entries()){
            if((!key.isDead())){
                comp = value;
            }
        }
        return comp;
    }

    //是否第一顺位
    isFirstSortSRole(roleComp: RoleLogicComp){
        return this.getFirstRole() === roleComp;
    }

    //是否倒数第一顺位
    isLastSortRole(roleComp: RoleLogicComp){
        return this.getLastRole() == roleComp;
    }

    getRoleInfoByID(roleID: number): Role{
        if(!this._rolesMap || this._rolesMap.size == 0) return null;
        for(let [key, value] of this._rolesMap.entries()){
            if(key.ID === roleID){
                return key;
            }
        }
        return null;
    }

    //队伍中全部死亡
    isAllRoleDead(): boolean {
        if(!this._rolesMap || this._rolesMap.size == 0) return true;

        let isAllDead = true;
        for(let [k, v] of this._rolesMap.entries()){
            if(!k.isDead()){
                isAllDead = false;
                break;
            }
        }
        return isAllDead;
    }

    //更新顺位
    decRolesSortID(roleInfo: Role, curActorComp: RoleLogicComp): RoleLogicComp[]{
        if(!this._rolesMap || this._rolesMap.size == 0) return null;
        if(!curActorComp || !roleInfo) return null;
        if(!roleInfo.isDead()) return null;
        let changeComps = [];
        let decEnable = false;
        for(let [k, v] of this._rolesMap.entries()){
            if(v === curActorComp){
                decEnable = true;
            }
            if(!k.isDead() && decEnable){
                k.decSortId();
                changeComps.push(v);
            }
        }
        return changeComps;
    }

    //重置英雄的顺位
    resetRolesSortID(){
        if(!this._rolesMap || this._rolesMap.size == 0) return;
        for(let [k, v] of this._rolesMap.entries()){
            if(!k.isDead()){
                k.resetSortId();
            }
        }
    }

    getRoleCompByRoleInfo(info: Role): RoleLogicComp{
        return this._rolesMap.get(info);
    }

    update(dt: number){
        //更新团队buff
        if(this._buffMap && this._buffMap.size > 0){
            let removeKeys = new Array();
            let isAce = this.isAllRoleDead();
            this._buffMap.forEach((value, buffType) => {
                let leftTime = isAce ? 0 : value - dt;
                if(leftTime <= 0){
                    removeKeys.push(buffType);
                    this._controller && this._controller.removeBuffState(buffType);
                }else{
                    this._buffMap.set(buffType, leftTime);
                    this._controller && this._controller.updateBuffState(buffType);
                }
            });

            removeKeys.forEach(element => {
                this._buffMap.has(element) && this._buffMap.delete(element);
            });
        }

        //更新角色的buff状态,并通知view更新
        if(this._rolesMap && this._rolesMap.size > 0){
            this._rolesMap.forEach((comp, role) => {
                let buffMap = role.buffState;
                if(!buffMap || buffMap.size == 0) return;
                let isDead = role.isDead();
                let removeKeys = new Array();
                buffMap.forEach((value, key) => {
                    //死亡状态下清空所有buff
                    let leftTime = isDead ? 0 : value - dt;
                    if(leftTime <= 0){
                        removeKeys.push(key);
                        comp.removeBuffState(key);
                    }else{
                        buffMap.set(key, leftTime);
                        comp.updateBuffState(key);
                    }
                });

                removeKeys.forEach(element => {
                    buffMap.has(element) && buffMap.delete(element);
                });
            });
        };
    }

    //复活所有
    reliveAll(cb: Function, ...params: any[]){
        if(!this._rolesMap || this._rolesMap.size == 0) return;
        let time = params[0];
        this._rolesMap.forEach((value, key) =>{
            key.clearBuffs();
            key.hp = key.maxHp;
            key.resetSortId();
            key.addBuff(ParkourBuffType.NO_HURT, time);
            key.addBuff(ParkourBuffType.PENG_ZHUANG, time);
            cb && cb(value, key);
        });
    }
}

export {
    ActorManager
}
