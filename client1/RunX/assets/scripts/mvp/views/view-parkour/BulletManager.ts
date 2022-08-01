/*
 * @Description: 子弹层
 * @Autor: lixu
 * @Date: 2021-04-27 19:22:20
 * @LastEditors: lixu
 * @LastEditTime: 2021-12-31 11:51:40
 */
import {parkourEvent} from "../../../common/event/EventData"
import {eventCenter} from "../../../common/event/EventCenter"
import ItemBullet from '../view-item/ItemBullet';
import { logger } from "../../../common/log/Logger";
import { ParkourBulletOwnerType, parkourConfig } from "./ParkourConst";
import StepWork from "../../../common/step-work/StepWork";
const {ccclass, property} = cc._decorator;

@ccclass
export default class BulletManager extends cc.Component {

    private _isInit: boolean = false;
    onInit(){
        bulletPoolManager.setEnable(true);
        this._init();
    }

    private _init(){
        if(this._isInit) return;
        this._isInit = true;
        this._initEvents();
    }

    private _initEvents(){
        eventCenter.register(parkourEvent.SHOOT, this, this._onShoot);
    }

    onRelease(){
        eventCenter.unregisterAll(this);
        this._isInit = false;
        bulletGroupCfgManager.clear();
        bulletPoolManager.clearAll();
    }

    //发射子弹
    private _onShoot(...param: any[]){
        let bulletNode: cc.Node =  param[1];
        this.node.addChild(bulletNode);
        bulletNode.getComponent(ItemBullet).shoot();
    }

    deInit(){
        this._recycleReMainNodes();
        bulletPoolManager.setEnable(false);
    }

    //回收还未销毁的子弹
    private _recycleReMainNodes(){
        let children = [...this.node.children];
        children.forEach((ele)=>{
            let comp: ItemBullet = ele.name == "bullet" ? ele.getComponent(ItemBullet) : null;
            comp && comp.forceRecycle();
        });
    }

    //清除所有子弹
    cleanAllBullets(){
        let children = [...this.node.children];
        if(!children || children.length <= 0) return;
        children.forEach((ele) => {
            let bulletComp = ele.getComponent(ItemBullet);
            if(!bulletComp) return;
            bulletComp.getBulletOwnerType() == ParkourBulletOwnerType.Monster && bulletComp.autoDestroy();
        });
    }

    //获取指定区域内怪物子弹的权重值
    getMonsterBulletWeight(): number[]{
        let weightArr: number[] =  parkourConfig.AutoPlayWeightArr.slice(0);
        this.node.children.forEach(ele => {
            if(ele.name != 'bullet') return;
            let bulletComp: ItemBullet = ele.getComponent(ItemBullet);
            if(!cc.isValid(bulletComp) || bulletComp.getBulletOwnerType() != ParkourBulletOwnerType.Monster) return;
            let pos = ele.parent.convertToWorldSpaceAR(ele.getPosition());
            for(let i = 0, len = parkourConfig.AutoPlayAreas.length; i < len; i++){
                if(!parkourConfig.AutoPlayAreas[i].contains(pos)) continue;
                bulletComp.getWeight && (weightArr[i] += bulletComp.getWeight());
                break;
            }
        });
        return weightArr;
    }
}

const BULLET_PREBUILD_COUNT = 30;
const PRE_FRAME_BUILD_COUNT = 10;

class BulletPoolManager{
    private _bulletMap: Map<number, cc.NodePool> = null;
    private _bulletPrefabMap: Map<number, cc.Prefab> = null;
    private _isEnable = false;

    constructor(){
        this._bulletMap = new Map<number, cc.NodePool>();
        this._bulletPrefabMap = new Map<number, cc.Prefab>();
    }

    setEnable(isEnable: boolean){
        this._isEnable = isEnable;
    }

    prebuild(callback: Function){
        if(!this._bulletPrefabMap || this._bulletPrefabMap.size <= 0){
            callback && callback();
            return;
        }
        let stepWork = new StepWork();
        let entrys = this._bulletPrefabMap.entries();
        let entry = null;
        while((entry = entrys.next()).value){
            let key = entry.value[0];
            let prefab = entry.value[1];
            for(let i = 0; i < BULLET_PREBUILD_COUNT;){
                let count = PRE_FRAME_BUILD_COUNT;
                count + i > BULLET_PREBUILD_COUNT && (count = BULLET_PREBUILD_COUNT - i);
                stepWork.addTask((cb: Function) => {
                    for(let j = 0; j < count; j++){
                        this.put(this._createOneBullet(prefab).node, key);
                    }
                    cb && cb();
                });
                i += count;
            }
        }

        stepWork.start(() => {
            callback && callback();
        })
    }

    addBulletPrefab(bulletID: number, prefab: cc.Prefab){
        if(this._bulletPrefabMap.has(bulletID) && this._bulletPrefabMap.get(bulletID)) return;
        this._bulletPrefabMap.set(bulletID, prefab);
    }

    get(bulletID: number, ...rest: any[]): cc.Node{
        if(!this._isEnable) return null;
        let pool: cc.NodePool = null;
        if(!this._bulletMap.has(bulletID) || !this._bulletMap.get(bulletID)){
            pool = new cc.NodePool(ItemBullet);
            this._bulletMap.set(bulletID, pool);
        }
        pool = pool || this._bulletMap.get(bulletID);
        if(pool.size() > 0){
            return pool.get(...rest);
        }
        let prefab = this._bulletPrefabMap.get(bulletID);
        if(!cc.isValid(prefab)){
            logger.error('BulletPoolManager', `${bulletID} has current bullet Prefab`);
            return null;
        }
        let startPos: cc.Vec2 = rest[0];
        let baseDamage: number = rest[1];
        let config: any = rest[2];
        let bulletComp = this._createOneBullet(prefab);
        bulletComp && bulletComp.onInit(startPos, baseDamage, config);
        return bulletComp ? bulletComp.node: null;
    }

    private _createOneBullet(bulletPrefab: cc.Prefab): ItemBullet{
        if(!cc.isValid(bulletPrefab)) return null;
        let node = cc.instantiate(bulletPrefab);
        let comp = node.getComponent(ItemBullet);
        return comp;
    }

    put(node: cc.Node, bulletID: number){
        if(!this._isEnable) return;
        let pool: cc.NodePool = null;
        if(!this._bulletMap.has(bulletID) || !this._bulletMap.get(bulletID)){
            pool = new cc.NodePool(ItemBullet);
            this._bulletMap.set(bulletID, pool);
        }
        pool = pool || this._bulletMap.get(bulletID);
        pool.put(node);
    }

    clear(bulletID: number){
        if(!this._bulletMap.has(bulletID)) return;
        let pool = this._bulletMap.get(bulletID);
        pool.clear();
    }

    clearAll(){
        this.setEnable(false);
        this._bulletMap && this._bulletMap.forEach((elem) => {elem.clear()});
        this._bulletMap && this._bulletMap.clear();
        this._bulletPrefabMap && this._bulletPrefabMap.clear();
    }
}

export let bulletPoolManager = new BulletPoolManager();

class BulletGroupCfgManager{
    private _bulletConfigs: Map<number, any> = null;

    addBulletGroupCfg(bulletID: number, cfg: any){
        if(isNaN(bulletID) || !cfg) return;
        this._bulletConfigs = this._bulletConfigs || new Map<number, any>();
        if(this._bulletConfigs.has(bulletID)) return;
        this._bulletConfigs.set(bulletID, cfg);
    }

    getBulletGroupCfg(bulletID: number):any{
        if(isNaN(bulletID)){
            console.warn(`BulletGroupCfgManager: 子弹组ID: ${bulletID}非法！！！`);
            return null;
        }

        if(!this._bulletConfigs || !this._bulletConfigs.has(bulletID) || !this._bulletConfigs.get(bulletID)){
            console.warn(`BulletGroupCfgManager: 子弹组ID: ${bulletID}没有被缓存！！！`);
            return null;
        }
        return this._bulletConfigs.get(bulletID);
    }

    clear(){
        if(!this._bulletConfigs) return;
        this._bulletConfigs.clear();
        this._bulletConfigs = null;
    }
}

export let bulletGroupCfgManager = new BulletGroupCfgManager();
