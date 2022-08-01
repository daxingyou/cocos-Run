/*
 * @Description:
 * @Autor: lixu
 * @Date: 2021-05-12 16:33:58
 * @LastEditors: lixu
 * @LastEditTime: 2021-09-01 15:56:57
 */
import { CACHE_MODE, resourceManager } from "../../../common/ResourceManager";
import StepWork from "../../../common/step-work/StepWork";
import { eventCenter } from "../../../common/event/EventCenter";
import {parkourEvent} from '../../../common/event/EventData';
import { Role } from "../../template/Role";
import { ActorManager } from "./ActorManager";
import RoleLogicComp from "./RoleLogicComp";
import RoleFollowComp from "./RoleFollowComp";
import { bulletGroupCfgManager, bulletPoolManager } from "./BulletManager";
import { configUtils } from "../../../app/ConfigUtils";
import { Bullet_prefab_Dir, getBulletCfgPath, RoleColliderType } from "./ParkourConst";
import PlayerMoveComp from "./PlayerMoveComp";

const {ccclass, property} = cc._decorator;

@ccclass
export default class RoleLayerComp extends cc.Component {
    @property(cc.Prefab) playerPrefab: cc.Prefab = null;
    @property(cc.Prefab) rolePrefab: cc.Prefab = null;

    private _roles: RoleLogicComp[] = [];    //角色组件

    private _playerComp: PlayerMoveComp = null; //玩家控制的节点
    private _isInit: boolean = false;

    getPlayer(): PlayerMoveComp{
        return this._playerComp;
    }

    onInit(callBack: Function){
        this._init();
        this._playerComp.onInit(this);

        //下列操作比较耗时，因此此处分帧处理
        if(this._roles && this._roles.length >  0){
            let stepWork = new StepWork();
            this._roles.forEach((elem: RoleLogicComp, idx: number) => {
                let index = idx;
                stepWork.addTask(() => {
                    elem.onInit(index, this._playerComp.node);
                });
            });
            stepWork.start(() => {
                callBack && callBack();
            })
            return;
        }
        callBack && callBack();
    }

    private _init(){
        if(this._isInit) return;
        this._isInit = true;
        this.initEvents();
    }

    private initEvents(){
        eventCenter.register(parkourEvent.GO_DOWN, this, this._onGoDown);
        eventCenter.register(parkourEvent.GO_UP, this, this._onGoUp);
        eventCenter.register(parkourEvent.LEVEL_FINISH, this, this._onLevelFinish);
    }

    private _onGoDown(){
        this._playerComp.goDown();
    }

    private _onGoUp(){
        this._playerComp.goUp();
    }

    private _onLevelFinish(){
        this._playerComp.levelFinish();
        this._allRoleDoAction("levelFinish", true);
    }

    startGame(){
        this._playerComp.realStart();
        this._allRoleDoAction("realStart", true);
    }

    deInit(){
        this._allRoleDoAction('deInit', true);
        this._playerComp.deInit();
    }

    async reBuildIn(){
        ActorManager.getInstance().getRoleInfos().forEach((value, key) => {
            key.hp = key.maxHp;
            key.resetSortId();
            value.resetFrameDelay();
            value.node.active = true;
        });
    }

    onRelease(){
        eventCenter.unregisterAll(this);
        this._isInit = false;
        this._allRoleDoAction('onRelease', true);
        this._playerComp.onRelease();
        this._playerComp = null;
        this._roles.length = 0;
        this._roles = null;
    }

    autoCaptureFollowInfo(dt: number){
        if(!this._playerComp) return;
        if(!this._roles.length && this._roles.length === 0) return;
        this._roles.forEach((elem: RoleLogicComp) => {
            elem.captureFollowInfo(dt);
        });
    }

    setPaused(isPause: boolean){
        this._playerComp.setPaused(isPause);
        this._allRoleDoAction('setPaused', true, isPause);
    }

    //执行冲刺
    execChongCi(time: number){
        if(this._playerComp.processChongCi(time)){
            let pos = this._playerComp.node.getPosition();
            this._allRoleDoAction('startChongCi', true, pos, time);
        }
    }

    //取消所有角色的冲刺状态
    unExecChongCi(){
        this._allRoleDoAction('endChongCi', true);
    }

    //执行复活
    execRelive(...params: any[]){
        this.scheduleOnce(() => {
            let moveDis = params && params[1];
            let isBack = params && params[2];
            let time = 0.65;
            ActorManager.getInstance().clearBuffs();
            eventCenter.fire(parkourEvent.RESUME_LOGIC);
            this._playerComp.dealRelive(time);
            ActorManager.getInstance().reliveAll((comp: RoleLogicComp, roleInfo: Role) => {
                comp.resetNormalPos();
                comp.resetFrameDelay();
                comp.updateHP(Math.floor(roleInfo.hp / roleInfo.maxHp * 100) / 100);
                comp.relive(time, moveDis, isBack);
            }, time);
        }, 0);
    }

    //构建角色层
    buildLayer(roleList: number[], TAG?: string, cb?: Function): StepWork{
        let stepWork = new StepWork();
        //测试过五个角色的时候, 创建角色任务能够在一帧内完成,所以没有分帧，后续如果该过程超出一帧时间，再具体分析
        stepWork.addTask((callback: (err?: any)=>{}) => {
            let playerNode = cc.instantiate(this.playerPrefab);
            this._playerComp = playerNode.getComponent(PlayerMoveComp);
            this.node.addChild(playerNode);
            roleList.forEach((id, idx) => {
                let actor: cc.Node = cc.instantiate(this.rolePrefab);
                actor.name = "Actor";
                let roleComp = actor.getComponent(RoleLogicComp);
                if(!roleComp){
                    roleComp = actor.addComponent(RoleLogicComp);
                }
                let followComp = actor.getComponent(RoleFollowComp);
                if(!followComp){
                    followComp =  actor.addComponent(RoleFollowComp);
                }
                this._roles.push(roleComp);
                let role = new Role(id);
                ActorManager.getInstance().addRole(roleComp, role);
                this.node.addChild(actor, roleList.length - idx);
            });
            callback && callback();
        });

        //加载角色的子弹配置
        let loadRoleBulletConfigTask = new StepWork();
        let bulletPrefabs: Map<number, string> = new Map<number, string>();
        roleList.forEach((id) => {
            loadRoleBulletConfigTask.addTask((callback: Function) =>{
                let task = this._getBulletsCfg(id, bulletPrefabs);
                task.then(() => {
                   callback && callback()
                }).catch((reason: any) => {

                });
            });
        });

        //加载角色的子弹预制体
        let loadRoleBulletTask = new StepWork();
        loadRoleBulletTask.addTask((callback: Function) =>{
            if(bulletPrefabs.size == 0) {
              callback && callback();
              return;
            }

            let subWork = new StepWork();
            bulletPrefabs.forEach((value, key) => {
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

        stepWork.concact(loadRoleBulletConfigTask);
        stepWork.concact(loadRoleBulletTask);
        return stepWork;
    }

    private async _getBulletsCfg(roleID: number, bulletPrefabs: Map<number, string>){
        let roleInfo = ActorManager.getInstance().getRoleInfoByID(roleID);
        if(!roleInfo) return;
        let bulletGroup = roleInfo.bulletGroup;

        let dealBulletCfg = (bullets: any[]) => {
            if(!bullets || bullets.length == 0) return;
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

        let bulletConfigPath = getBulletCfgPath(bulletGroup);  //子弹组的配置文件名
        let ret = await resourceManager.load(bulletConfigPath, cc.JsonAsset);
        let bulletConfig = ret.res.json;
        bulletGroupCfgManager.addBulletGroupCfg(bulletGroup, bulletConfig);
        dealBulletCfg(bulletConfig.bullets);
        resourceManager.release(bulletConfigPath);

        let superBulletGroup = roleInfo.superBulletGroup;
        let superBulletConfigPath = getBulletCfgPath(superBulletGroup);  //子弹组的配置文件名
        let ret1 = await resourceManager.load(superBulletConfigPath, cc.JsonAsset);
        let superBulletConfig = ret1.res.json;
        bulletGroupCfgManager.addBulletGroupCfg(superBulletGroup, superBulletConfig);
        dealBulletCfg(superBulletConfig.bullets);
        resourceManager.release(superBulletConfigPath);
    }

    private _allRoleDoAction(action: string, isImmediate: boolean = false, ...param: any){
        if(!action || action.length <= 0) return;
        if(this._roles && this._roles.length >  0){
            this._roles.forEach((elem: any) => {
                if(isImmediate){
                    elem[action] && elem[action].apply(elem, param);
                }else{
                    elem.pushAction && elem.pushAction(action, param);
                }
            });
        }
    }

    //没有死亡且需要补位的角色进行追帧
    catchUpFrames(comps: RoleLogicComp[]){
        if(!comps || comps.length <= 0) return;
        //补位对象进行追帧数
        for(let i = 0, len = comps.length; i < len; i++){
            comps[i].catchUpFrame();
        }
    }
}

class SpineCache{
    private _spineMap: Map<string, sp.SkeletonData> = null;

    addSpineData(key: string, data: sp.SkeletonData){
        if(!this._spineMap){
            this._spineMap = new Map<string, sp.SkeletonData>();
        }

        if(this._spineMap.has(key)) return;
        this._spineMap.set(key, data);
    }

    getSpineData(key: string): sp.SkeletonData{
        if(!this._spineMap || !this._spineMap.has(key)) return null;
        return this._spineMap.get(key);
    }

    clear(){
        if(!this._spineMap || this._spineMap.size === 0) return;
        this._spineMap.clear();
    }
}

const parkourSpineCache = new SpineCache();

export{
    parkourSpineCache
}
