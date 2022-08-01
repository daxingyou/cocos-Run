/*
 * @Description: 所有道具类，陷阱类的内存池管理器
 * @Autor: lixu
 * @Date: 2021-06-04 17:42:13
 * @LastEditors: lixu
 * @LastEditTime: 2021-12-06 11:45:58
 */

import { logger } from "../../../common/log/Logger";
import { CACHE_MODE, resourceManager } from "../../../common/ResourceManager";
import {scheduleManager} from "../../../common/ScheduleManager";
import StepWork from "../../../common/step-work/StepWork";

interface IParkourItemPool{
    comp: string,
    prefabPath: string
    maxCacheCount?: number
}

class ParkourItemPool{
    private _capacity: number = 0;
    private _cachedCount: number = 0;
    private _pool: cc.NodePool = null;
    private _itemInfo: IParkourItemPool = null;
    private _prefab: cc.Prefab = null;

    constructor(itemInfo: IParkourItemPool, prefab: cc.Prefab){
        this._itemInfo = itemInfo;
        this._pool = new cc.NodePool(this._itemInfo.comp);
        this._prefab = prefab;
    }

    set capacity(capacity: number){
        this._capacity = capacity;
    }

    get capacity(){
        return this._capacity;
    }

    get cachedCount(){
        return this._cachedCount;
    }

    getItemInfo(){
        return this._itemInfo;
    }

    get(...param: any[]): cc.Node{
        if(this._pool.size() > 0){
            let node = this._pool.get(...param);
            return node;
        }

        let comp = this._createNew();
        comp && (comp as any).reuse && (comp as any).reuse(...param);
        return comp.node;
    }

    addOneToPool(){
        let node = this._createNew();
        this.put(node);
    }

    private _createNew(){
        let node = cc.instantiate(this._prefab);
        let comp = node.getComponent(this._itemInfo.comp);
        this._cachedCount += 1;
        return comp;
    }

    put(node: cc.Node){
        if(!cc.isValid(node)) return;
        if(!node.getComponent(this._itemInfo.comp)){
            logger.warn('ParkourItemPool', `put a exception node that not added Component named ${cc.js.getClassName(this._itemInfo.comp)}'`);
            return;
        }
        this._pool.put(node);
    }

    clear(){
        for(let i = 0, len = this._pool.size(); i < len; i++){
            //@ts-ignore
            this._pool._pool[i].getComponent(this._itemInfo.comp).onRelease && this._pool._pool[i].getComponent(this._itemInfo.comp).onRelease();
        }
        this._pool && this._pool.clear();
        this._cachedCount = 0;

    }

    release(){
        this.clear();
        this._capacity = 0;
        this._itemInfo = null;
        this._pool = null;
        this._prefab = null;
    }
}

class ParkourItemPoolMananger{
    private _poolMaps: Map<string, ParkourItemPool> = null;

    constructor(){
        this._poolMaps = new Map<string, ParkourItemPool>();
    }

    getItemPools(){
        return this._poolMaps;
    }

    getItemPool(itemId: string): ParkourItemPool{
        if(!this._poolMaps) return null
        return this._poolMaps.get(itemId);
    }

    getItemCfg(itemId: string): IParkourItemPool{
      if(!this._poolMaps.has(itemId)){
          logger.warn("ParkourItemPoolMananger", 'itemId not added to ParkourItemPoolMananger when getItemPool called!!!');
          return null;
      }

      let pool = this._poolMaps.get(itemId);
      if(!pool) return null;
      return pool.getItemInfo();
    }

    addItemPool(itemInfo: IParkourItemPool, prefab: cc.Prefab){
        if(!itemInfo || !prefab) return;
        if(this._poolMaps.has(itemInfo.prefabPath) && this._poolMaps.get(itemInfo.prefabPath)) return;
        let pool = new ParkourItemPool(itemInfo, prefab);
        this._poolMaps.set(itemInfo.prefabPath, pool);
    }

    getItem(itemId: string, ...params: any[]): cc.Node{
        if(!this._poolMaps.has(itemId)){
            logger.warn("ParkourItemPoolMananger", 'itemId not added to ParkourItemPoolMananger when getItem  !!!');
            return null;
        }
        let pool  = this._poolMaps.get(itemId);
        return pool.get(...params);
    }

    putItem(itemId: string, node: cc.Node){
        if(!this._poolMaps.has(itemId)){
            logger.warn("ParkourItemPoolMananger", 'itemId not added to ParkourItemPoolMananger when putItem called!!!');
            return;
        }
        let pool  = this._poolMaps.get(itemId);
        pool.put(node);
    }

    clearByItemId(itemId: string){
        if(!this._poolMaps.has(itemId)) return;
        let pool = this._poolMaps.get(itemId);
        pool.clear();
    }

    clearAll(){
        this._poolMaps.forEach(elem => {
            elem.clear();
        });
    }

    release(){
        this._poolMaps.forEach((elem, idx) => {
            elem.release();
            this._poolMaps.set(idx, null);
        });
        this._poolMaps.clear();
    }

    updateItemPoolCapacity(itemId: string, capacity: number) {
        if(!this._poolMaps.has(itemId)){
            return;
        }
        let pool = this._poolMaps.get(itemId);
        if(!pool) return;
        pool.capacity = capacity;
    }
}

const parkourItemPoolMananger = new ParkourItemPoolMananger();

let preloadParkourItems = function(res: IParkourItemPool[], useTag: string, loadCb?: Function): StepWork{
    if(!res || res.length === 0) return null;
    let stepWork = new StepWork();
    res.forEach((ele, idx) => {
        stepWork.addTask((callback: ()=>{} ) =>{
            let task = resourceManager.load(ele.prefabPath, cc.Prefab, CACHE_MODE.NONE, useTag)
            task.then((info) => {
                loadCb && loadCb(ele.prefabPath);
                parkourItemPoolMananger.addItemPool(ele, info.res);
                callback && callback();
            }).catch(callback);
        });
    })
    return stepWork;
}

let prebuildParkourItems = function (){
    let stepWork = new StepWork();
    let itemKeys = Object.keys(parkourItemPoolMananger.getItemPools());
    stepWork.addTask((callback: () => {}) => {
      let currIdx: number = 0;
      let schedulerID = scheduleManager.schedule(() => {
          if(currIdx >= itemKeys.length){
              scheduleManager.unschedule(schedulerID);
              callback && callback();
              return;
          }
          let pool = parkourItemPoolMananger.getItemPool(itemKeys[currIdx]);
          if(!pool && pool.cachedCount >= pool.capacity){
              currIdx += 1;
              return;
          }

          for(let i = 0; i < 5 && pool.cachedCount <  pool.capacity; i++){
              pool.addOneToPool();
          }
        }, 0);

    });
    return stepWork;
}

export{
    IParkourItemPool,
    preloadParkourItems,
    parkourItemPoolMananger,
    prebuildParkourItems
}
