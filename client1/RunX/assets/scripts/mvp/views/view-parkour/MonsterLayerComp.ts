/*
 * @Description: 怪物层
 * @Version: 1.0
 * @Autor: lixu
 * @Date: 2021-07-05 15:00:16
 * @LastEditors: lixu
 * @LastEditTime: 2021-09-26 11:38:22
 */
import { RES_ICON_PRE_URL } from "../../../app/AppConst";
import { utils } from "../../../app/AppUtils";
import { configUtils } from "../../../app/ConfigUtils";
import { CACHE_MODE, resourceManager } from "../../../common/ResourceManager";
import StepWork from "../../../common/step-work/StepWork";
import { cfg } from "../../../config/config";
import { ParkourScene } from "../view-scene/ParkourScene";
import { bulletGroupCfgManager, bulletPoolManager } from "./BulletManager";
import { getBulletCfgPath, Bullet_prefab_Dir, parkourConfig, ParkourLazyLoadType, ParkourMonsterType, getParkRoleSpinePath, TERR_LAYER } from "./ParkourConst";
import ParkourMonster, { MonsterDeadType } from "./ParkourMonster";
import { lazyLoadRes } from "./ParkourString";
import { ProgressViewType } from "./ProgressView";
import { parkourSpineCache } from "./RoleLayerComp";

const {ccclass, property} = cc._decorator;
const PER_FRAME_CREARE_MAX_MONSTER = 1;

@ccclass
export default class MonsterLayerComp extends cc.Component {
    @property(cc.Prefab) monsterPrefab: cc.Prefab = null;

    //种怪配置中的怪物配置，地形管理器，会将地形中的怪配置传入，通过这个配置查询怪的ID
    private _monstersConfigs: any[] = null;

    private _prebuildMonsterMap: Map<cc.Node, Array<any>> = null;
    private _willAppearMonsterMap: Map<cc.Node, Array<ParkourMonster>> = null;
    //存储已经出场并且存活的怪
    private _runningMonsters: ParkourMonster[] = null;

    private _isInit: boolean = false;

    onInit(...params: any){
        this._init();
    }

    private _init(){
        if(this._isInit) return;
        this._isInit = true;
    }

    deInit(...params: any[]){
        this._prebuildMonsterMap && this._prebuildMonsterMap.clear();
        this._recycleReMainNodes();
    }

    //回收残余节点
    private _recycleReMainNodes(){
      if(this._willAppearMonsterMap){
          this._willAppearMonsterMap.forEach(ele => {
              ele.forEach(ele1 => {

                  ele1.forceRecycle();
              });
              ele.length = 0;
          });
          this._willAppearMonsterMap.clear();
      }
      if(this._runningMonsters){
          this._runningMonsters.forEach(ele => {
              ele.forceRecycle();
          });
          this._runningMonsters.length = 0;
      }
    }

    onRelease(){
        this._prebuildMonsterMap = null;
        this._willAppearMonsterMap = null;
        this._runningMonsters = null;
        monsterPoolManager.clear();
        this._isInit = false;
        this._monstersConfigs = null;
    }

    addPrebuildMonsterConfig(key: cc.Node, configs: Array<any>){
        this._prebuildMonsterMap = this._prebuildMonsterMap || new Map<cc.Node, Array<any>>();
        if(!cc.isValid(key) || !configs || configs.length == 0) return;
        if(this._prebuildMonsterMap.has(key)){
            cc.warn('预构建的怪物配置已经存在！！！');
            return;
        }
        let cfg = utils.deepCopy(configs);
        this._prebuildMonsterMap.set(key, cfg);
    }

    private _initData(config: any){
        if(!config || !config.monsters) return;
        this._monstersConfigs = config.monsters;
    }

    setPaused(isPause: boolean){
        this._allRoleDoAction('setPaused', true, isPause);
    }

    buildLayer(config: any, TAG?: string, cb?: Function): StepWork{
        let stepWork: StepWork = new StepWork();
        let monsterSpineRes: string[]  = null;//怪物的spine资源路径
        let bulletGroupsRes: number[] = null;//子弹组的ID
        //解析怪物配置
        stepWork.addTask((callback: () => {}) => {
            this._initData(config);
            if(!config || !config.monsters || !Array.isArray(config.monsters) || (config.monsters as Array<any>).length <= 0){
                callback && callback();
                return;
            }

            let monsters: Array<any> = config.monsters;
            monsters.forEach(ele => {
                let config = configUtils.getRunXMonsterCfg(ele.monsterId);
                if(!config) return;

                //怪物模型资源
                let modelConfig = configUtils.getModelConfig(config.ArtID);
                monsterSpineRes = monsterSpineRes || [];
                if(monsterSpineRes.indexOf(getParkRoleSpinePath(modelConfig.ModelAttack)) == -1){
                    monsterSpineRes.push(getParkRoleSpinePath(modelConfig.ModelAttack));
                }

                //Boss头像资源,再parkourScene中采用懒加载进行加载
                if(config.MonsterType == ParkourMonsterType.Boss && modelConfig.ModelHeadIconCircular){
                    let spriteRes = lazyLoadRes[ParkourLazyLoadType.Sprite];
                    spriteRes[modelConfig.ModelHeadIconCircular] = `${RES_ICON_PRE_URL.HEAD_IMG}/${modelConfig.ModelHeadIconCircular}`;
                }

                //怪物子弹资源
                let actionID = config.RunXMonsterAction;
                let actionConfigs: cfg.RunXMonsterAction[]  = configUtils.getRunXMonsterActionCfg(actionID);
                actionConfigs.forEach(ele => {
                    if(ele.AttackTimeAxis){
                        utils.parseStingList(ele.AttackTimeAxis, (attackConfig: any[])=> {
                            let bulletGroupID = parseInt(attackConfig[1]);
                            bulletGroupsRes = bulletGroupsRes || [];
                            if(bulletGroupsRes.indexOf(bulletGroupID) != -1) return;
                            bulletGroupsRes.push(bulletGroupID);
                        });
                    }
                });
            });
            callback && callback();
        });

        //加载怪物spine资源
        let loadSpineTask = new StepWork();
        loadSpineTask.addTask((callback: () => {})=>{
            if(!monsterSpineRes || monsterSpineRes.length == 0){
                callback && callback();
                return;
            }

            let subWork = new StepWork();
            monsterSpineRes.forEach((ele) =>{
                subWork.addTask((cb: Function) => {
                    let ret = resourceManager.load(ele, sp.SkeletonData, CACHE_MODE.NONE, TAG);
                    ret.then((data)=>{
                        (data.res as sp.SkeletonData).getRuntimeData();
                        parkourSpineCache.addSpineData(data.name, data.res);
                        cb && cb();
                    });
                });
            });
            subWork.start(() => {
                callback && callback();
            });
        });
        stepWork.concact(loadSpineTask);

        //加载子弹组配置资源
        let loadBulletGroupTask = new StepWork();
        let bulletPrefabs: Map<number, string> = new Map<number, string>();
        loadBulletGroupTask.addTask((callback: () => {}) =>{
            if(!bulletGroupsRes || bulletGroupsRes.length <= 0){
              callback && callback();
              return;
            }

            let subWork = new StepWork();
            bulletGroupsRes.forEach((ele) => {
                subWork.addTask((cb: Function) => {
                    this._getBulletsCfg(ele, bulletPrefabs).then(() => {
                        cb && cb();
                    });
                });
            });

            subWork.start(() => {
                callback && callback();
            });
        });
        stepWork.concact(loadBulletGroupTask);

        //加载怪物子弹资源
        let loadBulletPrefabTask = new StepWork();
        loadBulletPrefabTask.addTask((callback: () => {}) =>{
            if(!bulletPrefabs || bulletPrefabs.size <= 0){
                callback && callback();
                return;
            }

            let subWork = new StepWork();
            bulletPrefabs.forEach((value, key) =>{
                subWork.addTask((cb: Function) => {
                    resourceManager.load(value, cc.Prefab, CACHE_MODE.NONE, TAG).then((data) => {
                        bulletPoolManager.addBulletPrefab(key, data.res);
                        cb && cb();
                    });
                });
            });
            subWork.start(() => {
                callback && callback();
            });
        });
        stepWork.concact(loadBulletPrefabTask);

        //需要预先创建的怪物
        let createMonsterTask = new StepWork();
        createMonsterTask.addTask((callback: Function) => {
            let loadMonsterFn = () => {
              let isFinish = this.generateMonster();
              if(isFinish){
                  this.unschedule(loadMonsterFn);
                  this.checkMonsterAppear();
                  callback && callback();
              }
            };
            this.schedule(loadMonsterFn, 0, cc.macro.REPEAT_FOREVER,0);
        });
        stepWork.concact(createMonsterTask);
        return stepWork;
    }

    private async _getBulletsCfg(bulletGroupID: number, bulletPrefabs: Map<number, string>){
        if(!bulletGroupID) return;
        let ret = await resourceManager.load(getBulletCfgPath(bulletGroupID), cc.JsonAsset, CACHE_MODE.NONE);
        let bulletConfig = ret.res.json;
        bulletGroupCfgManager.addBulletGroupCfg(bulletGroupID, bulletConfig);
        let bullets: any[] = bulletConfig.bullets || [];
        if(bullets && bullets.length > 0){
            bullets.forEach(ele => {
                if(bulletPrefabs.has(ele.ID)) return;
                let artID = configUtils.getRunxBulletConfig(ele.ID).ArtID;
                if(!artID || artID.length == 0){
                    cc.warn(`子弹ID:${ele.ID}没有配置对应资源！！！`);
                    return;
                }
                bulletPrefabs.set(ele.ID, `${Bullet_prefab_Dir}${artID}`);
            });
        }
        resourceManager.release(ret.name);
    }

    reBuildIn(): Promise<any>{
        return new Promise((resolve, reject) => {
            let loadMonsterFn = () => {
              let isFinish = this.generateMonster();
                if(isFinish){
                    this.unschedule(loadMonsterFn);
                    this.checkMonsterAppear();
                    resolve(true);
                }
            };
            this.schedule(loadMonsterFn, 0, cc.macro.REPEAT_FOREVER,0);
        });
    }

    //生成怪物，采用分帧渲染的方式
    generateMonster(): boolean{
        if(!this._prebuildMonsterMap || this._prebuildMonsterMap.size == 0) return true;
        let count = 0;
        let emptyKeys: cc.Node[] = [];
        for(let [key, value] of this._prebuildMonsterMap.entries()){
            if(count >= PER_FRAME_CREARE_MAX_MONSTER) break;
            if(!value || value.length <= 0) continue;
            for(let idx = 0, len = value.length; idx < len; idx++){
                let monsterConfig = value[idx];
                let monsterId = this._monstersConfigs[monsterConfig.idx].monsterId;
                let layer: cc.TiledLayer = key.getComponent(cc.TiledMap).getLayer(TERR_LAYER.SHADE);
                if(!layer){
                    cc.warn(`怪物配置异常: 种怪的地形没有 shade 层`, monsterConfig);
                    continue;
                }
                monsterConfig.monsterId = monsterId;
                let startPos = layer.getPositionAt(cc.v2(monsterConfig.posX, monsterConfig.posY));
                let getMonsterTask = monsterPoolManager.get(monsterId, startPos, monsterConfig);
                getMonsterTask.then((monsterNode: cc.Node) => {
                    monsterNode.parent = this.node;
                    this._willAppearMonsterMap = this._willAppearMonsterMap || new Map<cc.Node, Array<ParkourMonster>>();
                    if(!this._willAppearMonsterMap.has(key)){
                        this._willAppearMonsterMap.set(key, []);
                    }
                    this._willAppearMonsterMap.get(key).push(monsterNode.getComponent(ParkourMonster));
                }); 
                count ++;
                value.shift();
                idx--;
                len--;
                if(count >= PER_FRAME_CREARE_MAX_MONSTER){
                    break;
                }
            }
            if(value.length == 0){
                emptyKeys.push(key);
            }
        }
        if(emptyKeys.length > 0){
            emptyKeys.forEach(ele => {
                this._prebuildMonsterMap.delete(ele);
            });
        }
        return this._prebuildMonsterMap.size == 0;
    }

    //检查是否有boss将要出场
    checkNodeContainBoss(tiledNode: cc.Node): boolean{
        if(!cc.isValid(tiledNode)) return false;
        if(!this._willAppearMonsterMap || this._willAppearMonsterMap.size == 0
              || !this._willAppearMonsterMap.has(tiledNode)) return false;
        let monsters = this._willAppearMonsterMap.get(tiledNode);
        for(let i = 0, len = monsters.length; i < len; i++){
            let monster = monsters[i];
            if(monster.getMonsterInfo().isBoss()){
                return true;
            }
        }
        return false;
    }

    //每帧检查是否有怪物出场
    checkMonsterAppear(): boolean{
        //检查怪物的出场
        if(!this._willAppearMonsterMap || this._willAppearMonsterMap.size == 0) return false;
        let emptyKeys: cc.Node[] = [];
        let isAppear: boolean = false;
        this._willAppearMonsterMap.forEach((monsters, key) =>{
            let worldPos = key.parent.convertToWorldSpaceAR(key.getPosition());
            if(worldPos.x <= cc.winSize.width){
                let distance = cc.winSize.width - worldPos.x;
                for(let i = 0, len = monsters.length; i < len; i++){
                    let monster = monsters[i];
                    if(monster.checkAppearEnable(distance)){
                        //怪物出场,执行其行为树
                        isAppear = true;
                        monster.setActive(true);
                        if(monster.getMonsterInfo().isBoss()){
                            ParkourScene.getInstance().getUILayerComp().getProgressView().showView(ProgressViewType.BossHPView, monster.getMonsterInfo());
                        }
                        monsters.splice(i, 1);
                        this._addActiveMonster(monster);
                        i -= 1;
                        len -= 1;
                    }
                }
            }

            if(monsters.length == 0){
              emptyKeys.push(key);
            }
        });

        //从怪物的出场列表中移除已经全部出场的地形
        if(emptyKeys.length > 0){
            emptyKeys.forEach((ele) => {
                if(!this._willAppearMonsterMap.has(ele)) return;
                let monsters = this._willAppearMonsterMap.get(ele);
                if(monsters){
                    monsters.length = 0;
                }
                this._willAppearMonsterMap.delete(ele);
            });
        }
        emptyKeys.length = 0;
        emptyKeys = null;
        return isAppear;
    }

    private _allRoleDoAction(action: string, isImmediate: boolean = false, ...param: any){
        if(!action || action.length <= 0) return;
        if(this._runningMonsters && this._runningMonsters.length >  0){
            this._runningMonsters.forEach((elem: any) => {
                if(isImmediate){
                    elem[action] && elem[action].apply(elem, param);
                }else{
                    elem.pushAction && elem.pushAction(action, param);
                }
            });
        }
    }

    cleanAllMonsters(type: ParkourMonsterType){
        this._cleanAllMonsters(type);
    }

    removeMonster(monster: ParkourMonster){
        this._deleInActiveMonster(monster);
    }

    //存储活跃的的怪物(PS: 已经存储的怪不能重复存储)
    private _addActiveMonster(monster: ParkourMonster){
        if(!monster || !cc.isValid(monster.node)) return;
        this._runningMonsters = this._runningMonsters || [];
        if(this._runningMonsters.indexOf(monster) != -1) return;
        this._runningMonsters.push(monster);
    }

    //移除不再活跃的怪物
    private _deleInActiveMonster(monster: ParkourMonster){
        if(!monster || !cc.isValid(monster.node)) return;
        if(!this._runningMonsters || this._runningMonsters.length == 0 || this._runningMonsters.indexOf(monster) == -1) return;
        let idx = this._runningMonsters.indexOf(monster);
        this._runningMonsters.splice(idx, 1);
        monster.setActive(false);
        monster.goDie();
        if(!this.hasBossActive()){
            ParkourScene.getInstance().getUILayerComp().getProgressView().showView(ProgressViewType.LevelProgressView);
        }
    }

    //销毁指定类型的怪物
    private _cleanAllMonsters(type: ParkourMonsterType){
        if(!this._runningMonsters || this._runningMonsters.length == 0) return;
        for(let i = 0, len = this._runningMonsters.length; i < len; i++){
            let monster = this._runningMonsters[i];
            if(monster.getMonsterInfo().type <= type){
                monster.getMonsterInfo().deadType = MonsterDeadType.CleanUp;
                this._runningMonsters.splice(i, 1);
                monster.setActive(false);
                monster.goDie();
                i -= 1;
                len -= 1;
            }
        }
    }

    hasBossActive(): boolean{
        if(!this._runningMonsters || this._runningMonsters.length == 0) return false;
        for(let i = 0, len = this._runningMonsters.length; i < len; i++){
            let monster = this._runningMonsters[i];
            let monsterInfo = monster.getMonsterInfo();
            if(monsterInfo.isBoss() && monsterInfo.currHp > 0 && monster.isActive()){
                return true;
            }
        }
        return false;
    }

    //是否存在怪物，包括将要创建的，还未出场的，和已经出场的
    isAllMonsterDead(){
        return (!this._runningMonsters || this._runningMonsters.length == 0)
            && (!this._willAppearMonsterMap || this._willAppearMonsterMap.size == 0)
            && (!this._prebuildMonsterMap || this._prebuildMonsterMap.size == 0);
    }

    //是否有可攻击的怪物(归位阶段的怪物不可被攻击)
    hasAttackedMonster(){
        if(!this._runningMonsters) return false;
        let enable: boolean = false;
        enable = this._runningMonsters.some((ele) => {
            return ele.attackedAble;
        });
        return enable;
    }

    //是否有激活的怪物
    hasActiveMonster(){
        return this._runningMonsters && this._runningMonsters.length > 0;
    }

    //获取指定区域怪物的权重值
    getMonsterWeight(): number[]{
      let weightArr: number[] = parkourConfig.AutoPlayWeightArr.slice(0);
      if(this._runningMonsters && this._runningMonsters.length > 0){
          this._runningMonsters.forEach((ele, idx) =>{
              let pos = ele.node.parent.convertToWorldSpaceAR(ele.node.getPosition());
              for(let i = 0, len = parkourConfig.AutoPlayMonsterAreas.length; i < len; i++){
                  if(parkourConfig.AutoPlayMonsterAreas[i].contains(pos)){
                      weightArr[i] += ele.getWeight();
                      break;
                  }
              }
          });
      }
      return weightArr;
  }
}

class MonsterPoolManager{
    private _monsterMap: Map<number, cc.NodePool>  = null;

    private _getPool(monsterID: number): cc.NodePool{
        this._monsterMap = this._monsterMap || new Map<number, cc.NodePool>();
        if(!this._monsterMap.has(monsterID)){
            this._monsterMap.set(monsterID, new cc.NodePool(ParkourMonster));
        }
        return this._monsterMap.get(monsterID);
    }

    async get(monsterID: number, ...rest: any[]){
        let pool = this._getPool(monsterID);
        if(pool.size() <= 0){
            let monsterNode: cc.Node = cc.instantiate(ParkourScene.getInstance().getMonsterLayerComp().monsterPrefab);
            if(pool && pool.poolHandlerComp){
                //@ts-ignore
                let comp = monsterNode.getComponent(pool.poolHandlerComp);
                comp && comp.reuse && comp.reuse(...rest);
            }
            return monsterNode;
        }
        return pool.get(...rest);
    }

    put(monsterID: number, monsterNode: cc.Node){
        let pool = this._getPool(monsterID);
        pool.put(monsterNode);
    }

    clear(){
        if(!this._monsterMap || this._monsterMap.size == 0) return;
        this._monsterMap.forEach((ele, key) => {
            if(!ele) return;
            //@ts-ignore
            let pool: cc.Node[] = ele._pool;
            pool.forEach(ele1 => {
                let monsterComp = ele1.getComponent(ParkourMonster);
                monsterComp && monsterComp.onRelease();
            });
            ele.clear();
        });
        this._monsterMap.clear();
        this._monsterMap = null;
    }
}

let monsterPoolManager = new MonsterPoolManager();
export {
  monsterPoolManager
}
