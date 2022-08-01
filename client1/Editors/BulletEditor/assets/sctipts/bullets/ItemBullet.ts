
/*
 * @Description: 子弹
 * @Autor: lixu
 * @Date: 2021-04-26 09:17:34
 * @LastEditors: lixu
 * @LastEditTime: 2021-08-13 15:35:10
 */

import { bulletPoolManager, BulletProp } from "../BulletManager";
import { global } from "../main";
import utils from "../Utils";
import SonBullet from "./SonBullet";

const {ccclass, property} = cc._decorator;

//子弹依附节点类型
enum BULLET_ATTACH_TYPE{
    ROLE = 1,   //依附于角色
    SCREEN,     //依附于屏幕
}

//子弹旋转方式
enum BULLTE_ROTATION_TYPE{
    NONE = 0,
    STATIC,
    DYNAMIC
}

//子弹运动过程的目标位置类型
enum BULLET_TARGET_POS_TYPE{
    FIX = 0,    //固定位置
    FOLLOW_ONCE,    //追踪怪物一次
    FOLLOW_ALWAYS   //持续追踪怪物
}

//子弹穿透性
enum BULLET_THROUGH_TYPE{
    NONE = 0,
    ENABLE,
}

class BulletEntity{
    //所属的子弹组ID
    private _groupId: number;
    //子弹本身的ID
    private _ID:number;
    //发射延迟
    private _launchDelay: number;
    //依附的节点类型
    private _attachType: BULLET_ATTACH_TYPE;
    //发射位置的x坐标
    private _startPosx: number[];
    //发射位置的y坐标
    private _startPosy: number[];
    //目标位置x
    private  _endPosx: number;
    //目标位置y
    private _endPosy: number;
    //目标点的类型
    private _targetPosType: BULLET_TARGET_POS_TYPE;
    //单次追踪目标点的延迟时间
    private _targetFollowDelay: number;
    //运动多长时间销毁
    private _destroyTime: number;
    //运动多长距离销毁
    private _destroyDis: number;
    //销毁效果
    private _destroyEffect: boolean;
    //开始运动的线速度
    private _startLineVel: number;
    //线性加速度
    private _addLineVel: number;
    //最大线性速度
    private _maxLineVel: number;
    //最小线性速度
    private _minLineVel: number;
    //目标旋转角度
    private _targetRotation: number;
    //旋转方式
    private _rotationType: BULLTE_ROTATION_TYPE;
    //动态旋转中初始角速度
    private _startAngularVel: number;
    //动态旋转中角速度的加速度
    private _addAngularVel: number;
    //动态旋转中的最大角速度
    private _maxAngularVel: number;
    //动态旋转中的最小角速度
    private _minAngularVel: number;
    //当前位置
    private _curPos: cc.Vec2;
    //目标节点
    private _targetNode: cc.Node;
    private _targetPos: cc.Vec2;
    private _followType: BULLET_TARGET_POS_TYPE;
    private _moveDis: number = 0;
    //当前的旋转量
    private _currRotation: number;
    //当前的线速度
    private _currLineVel: number = 0;
    //当前角速度
    private _currAngularVel: number; //正数为逆时针，负数为顺时针
    private _realTime: number = 0;//飞行时间
    private _damageRate: number = 0;//伤害系数
    private _baseDamage: number = 0; //基础伤害，来自于角色攻击伤害
    private _through: boolean = false;  //是否可穿透

    private _startRotation: number = 0; //起始旋转角,也就是所属的子弹组的旋转角

    init(config: any){
        this._groupId = config.groudId;
        this._ID = config.ID;
        this._launchDelay = config.delay;
        this._attachType = config.attachType;
        this._startPosx = config.startPosx;
        this._startPosy = config.startPosy;
        this._endPosx = config.endPosx;
        this._endPosy = config.endPosy;
        this._targetPosType = config.targetPosType;
        this._targetFollowDelay = config.targetFollowDelay;
        this._destroyTime = config.destroyTime;
        this._destroyDis =  config.destroyDis;
        this._destroyEffect = config.destroyEffect;
        this._startLineVel = config.startLineVel;
        this._addLineVel = config.addLineVel;
        this._maxLineVel = config.maxLineVel;
        this._minLineVel = config.minLineVel;
        this._targetRotation = config.targetRotation;
        this._rotationType = config.rotationType;
        this._startAngularVel = config.startAngularVel;
        this._addAngularVel = config.addAngularVel;
        this._maxAngularVel = config.maxAngularVel;
        this._minAngularVel = config.minAngularVel;
        this._startRotation = config.startRotation;
        this._parseBullet(this._ID, config);
    }

    get ID():number{
        return this._ID;
    }

    get groupId(): number{
        return this._groupId;
    }

    private _parseBullet(bulletID: number, config: any){
        //let bulletConfig = configUtils.getRunxBulletConfig(this._ID);
        this._damageRate = 1;
        this._through = false;
    }
    
    setBulletConfig(startPos: cc.Vec2, baseDamage: number){
        this._baseDamage = baseDamage;
        this._moveDis = 0;
        this._realTime = 0;
        this._currLineVel = this._startLineVel;
        this._currAngularVel = this._startAngularVel;//正数为逆时针，负数为顺时针

        let x = startPos.x;
        if(this._startPosx.length > 1){
            x +=  utils.getRandomInBlock(this._startPosx);
        }else{
            x += this._startPosx[0];
        }

        let y = startPos.y;
        if(this._startPosy.length > 1){
            y +=  utils.getRandomInBlock(this._startPosy);
        }else{
            y += this._startPosy[0];
        }

        let endX = startPos.x + this._endPosx;
        let endY = startPos.y + this._endPosy;

        let vec = cc.v2(endX - x, endY - y);

        let startRotation = 180 * Math.atan2(vec.y, vec.x) /Math.PI;
        
        if(this._rotationType == BULLTE_ROTATION_TYPE.STATIC){
            this._currRotation = this._targetRotation;
        }else if(this._rotationType == BULLTE_ROTATION_TYPE.DYNAMIC){
            this._currRotation = this._startRotation + startRotation;
        }

        this._curPos = cc.v2(x, y);
    }

    get damage(): number{
        return this._baseDamage * this._damageRate;
    }

    get isThrough(): boolean{
        return this._through;
    }
    
    get destroyEffect(): boolean{
        return this._destroyEffect;
    }

    get followType(): BULLET_TARGET_POS_TYPE{
        return this._followType;
    }

    get moveDis(): number{
        return this._moveDis;
    }

    updateMoveDis(offset: number){
        this._moveDis += offset;
    }

    get currLineVel(): number{
        return this._currLineVel;
    }

    updateLineVel(offset: number){
        this._currLineVel += offset;
    }

    get currAngularVel(): number{
        return this._currAngularVel;
    }

    updateAngularVel(offset: number){
        this._currAngularVel += offset;
    }

    get maxAngularVel():number {
        return this._maxAngularVel;
    }

    get minAngularVel():number {
        return this._minAngularVel;
    }

    get addAngularVel(): number{
        return this._addAngularVel;
    }

    get curPos():cc.Vec2{
        return this._curPos;
    }

    updatePos(offset: cc.Vec2){
        this._curPos.x += offset.x;
        this._curPos.y += offset.y;
    }

    get targetNode(): cc.Node{
        return this._targetNode;
    }

    get targetPos() : cc.Vec2{
        return this._targetPos;
    }

    get startLineVel(): number{
        return this._startLineVel;
    }

    get addLineVel(): number{
        return this._addLineVel;
    }

    isCanDestroy(): boolean{
        return (this._destroyTime > 0 && this._realTime >= this._destroyTime) || (this._destroyDis > 0 && this._moveDis >= this._destroyDis);
    }

    get rotationType(): BULLTE_ROTATION_TYPE{
        return this._rotationType;
    }

    get maxLineVel():number{
        return this._maxLineVel;
    }

    get minLineVel(): number{
        return this._minLineVel;
    }

    get rotation(): number{
        return this._targetRotation;
    }

    updateRotation(offset: number){
        if(this._rotationType != BULLTE_ROTATION_TYPE.DYNAMIC) return;
        if(Math.abs(this._targetRotation) <= this._currRotation){
            this._currRotation = this.rotation;
            return;
        }

        this._currRotation += offset;
    }
    
    get currRotation(): number{
        return this._currRotation;
    }

    updateRealTime(dt: number){
        this._realTime += dt;
    }

    getLineVelOffset(dt: number): number{
        let offset = 0;
         //减速运动
         if(this._addLineVel < 0 && this._currLineVel <= this._minLineVel){
            return offset;
        }
        
        if(this._addLineVel > 0 && this._currLineVel >= this._maxLineVel){
            return offset;
        }
        return this._addLineVel * dt;
    }

    getAngularVelOffset(dt: number): number{
        if(this._rotationType != BULLTE_ROTATION_TYPE.DYNAMIC) return 0;
        let offset = 0;
         //减速运动
        if(this._addAngularVel < 0 && this._currAngularVel <= this._minAngularVel){
            return offset;
        }
        
        if(this._addAngularVel > 0 && this._currAngularVel >= this._maxAngularVel){

            return offset;
        }
        return this._addAngularVel * dt;
    }
}

interface BulletDelayInfo{
    idx: number,
    bulletID: number,
    delay: number,
    isLaunch?: boolean;
}

class BulletEmitter{
    private _config: any  = null;
    private _bulletSimpleData: BulletDelayInfo[] = [];
    private _emitQueue: BulletGroupInfo[] = null;
    private _intervalTime: number = 0;
    private _isEmit: boolean = false;    //能否发射
    private _count: number = 0;
    private _realEmitFunc: (idx: number, bulletID: number) =>void = null;

    constructor(config?: any, interval?: number){
        this.reset(config, interval);
    }

    reset(config: any, interval: number){
        this._config = config;
        this._intervalTime = interval;
        this._emitQueue = [];
        this._bulletSimpleData.length = 0;
        if(config){
            let bullets: any[] = this._config.bullets;
            bullets.forEach((ele, idx) =>{
                this._bulletSimpleData.push({idx:idx, bulletID: ele.ID, delay: ele.delay});
            });
        }
    }

    set realEmitFunc(func : (idx: number, bulletID: number) =>void){
        this._realEmitFunc = func;
    }

    setEmit(isEmit: boolean){
        this._isEmit = isEmit;
    }

    isEmit(): boolean{
        return  this._isEmit;
    }

    private _addBulletGroup(){
        if(this._emitQueue.length > 0 && this._emitQueue[0].isFree()){
            if(this._emitQueue.length === 1){
                this._emitQueue[0].launch();
                return;
            }
            let group: BulletGroupInfo  = this._emitQueue.shift();
            group.launch();
            this._emitQueue.push(group);
        }else{
            let group = new BulletGroupInfo(this._config.groupId, utils.deepCopy(this._bulletSimpleData), this._realEmitFunc);
            this._emitQueue.push(group);
        }
    }
    
    //更新发射队列, 如果需要新增发射组，则创建（重用）新的发射组，增加到发射队列中，然后更新
    checkEmitter(dt: number){
        if(!this._isEmit) return;
        this._count -= dt;
        if(this._count <= 0){
            this._addBulletGroup();
            this._count = this._intervalTime;
        }

        this._emit(dt);
    }

    private _emit(dt: number){
        if(!this._isEmit) return;
        this._emitQueue.forEach((ele) =>{
            ele.update(dt);
        });
    }
}

class BulletGroupInfo{
    private _isFree: boolean = true;
    private _groupID: number = 0;
    private _realTime: number = 0;
    private _bulletsConfig: BulletDelayInfo[] = null;
    private _launchFunc: (idx: number, bulletID: number) => void = null;;

    constructor(groupID: number, bulletsConfig: BulletDelayInfo[], launchFunc: (idx: number, bulletID: number) => void){
        this._groupID = groupID;
        this._bulletsConfig = bulletsConfig;
        this._launchFunc = launchFunc;
    }

    launch(){
        if(!this._isFree) return;
        this._reset();
    }

    isFree(){
        return this._isFree;
    }
    
    //放在update中去调用，不要在其他地方调用
    update(dt: number){
        if(this._isFree) return;
        this._checkLaunchBullet();
        this._realTime += dt;
    }

    get realTime(): number{
        return this._realTime;
    }

    private _checkLaunchBullet(){
        for(let i = 0, len = this._bulletsConfig.length; i < len; i++){
            let bulletInfo = this._bulletsConfig[i];
            if(!bulletInfo.isLaunch && this._realTime >= bulletInfo.delay){
                bulletInfo.isLaunch = true;
                this._bulletsConfig.splice(i, 1);
                this._bulletsConfig.push(bulletInfo);
                i -= 1;
                this._launchFunc && this._launchFunc(bulletInfo.idx, bulletInfo.bulletID);
                continue;
            }
            if(bulletInfo.isLaunch){
                break;
            }
        }
        
        if(this._bulletsConfig[0].isLaunch){
            this._isFree = true;
        }
    }

    private _reset(){
        this._realTime = 0;
        this._isFree = false;
        this._bulletsConfig.forEach((ele) =>{
            ele.isLaunch = false;
        });
    }
}

@ccclass
export default class ItemBullet extends cc.Component {
    @property({type: [SonBullet]}) bulletEntity: SonBullet[] = [];
    private _bullet: BulletEntity = null;
    private _isValid: boolean = false;  //是否有效子弹，防止同一个子弹同时打中两个角色，对两个角色同时造成伤害
    private _isPause: boolean = false;
    private _isRunning: boolean = false;

    private _boomCount: number = 0;

    get bullet() : BulletEntity{
        return this._bullet;
    }

    setBulletData(startPos: cc.Vec2, baseDamage: number, config?: any){
        !this._bullet && (this._bullet = new BulletEntity());
        config && this._bullet.init(config);
        this._bullet.setBulletConfig(startPos, baseDamage);
        this.node.setPosition(this._bullet.curPos);
        this.node.angle = this._bullet.currRotation;
        this.node.name = "bullet";
        
        if(!this.bulletEntity || this.bulletEntity.length == 0){
            global.showToastMsg("子弹预制体没有设置发射的子弹组");
            return;
        }

        this.bulletEntity.forEach(ele =>{
           ele.onInit(this);
           ele.playFly(); 
        });
    }

    shoot(){
        this._isRunning = true;
        this._isPause = false;
        this._isValid = true;
    }

    playBoom(){
        if(!this.bulletEntity || this.bulletEntity.length <= 0){
            cc.warn(`子弹的配置有问题,组ID: ${this._bullet.groupId}, 子弹ID:${this._bullet.ID}`);
            return;
        }
        this._boomCount = this.bulletEntity.length;
        this.bulletEntity.forEach(ele => {
            ele.playBoom(this._boomFinish.bind(this));
        });
    }

    private _boomFinish(comp: SonBullet){
        this._boomCount -= 1;
        if(this._boomCount == 0){
            bulletPoolManager.put(this.node, this._bullet.ID);
        }
    }

    update(dt: number){
        if(!this._isRunning || this._isPause) return;

        this._bullet.updateRealTime(dt);
        if(this._bullet.isCanDestroy()){
             //执行销毁
            this._isRunning = false;
            this._isPause = true;
            this.playBoom();
            return;
        }
        
        let moveDis = this._bullet.currLineVel * dt;
        this._bullet.updateMoveDis(moveDis);
        
        let offsetX = moveDis * Math.cos(this._bullet.currRotation / 180 * Math.PI);
        let offsetY = moveDis * Math.sin(this._bullet.currRotation / 180 * Math.PI);
        this._bullet.updatePos(cc.v2(offsetX, offsetY));
     
        this.node.x = this._bullet.curPos.x;
        this.node.y = this._bullet.curPos.y;
        this.node.angle = this._bullet.currRotation;

        //线速度增量
        let lineVelOffset:number  = this._bullet.getLineVelOffset(dt);
        this._bullet.updateLineVel(lineVelOffset);

        //角速度增量
        if(this._bullet.rotationType != BULLTE_ROTATION_TYPE.DYNAMIC) return;
        let angularOffset = this._bullet.getAngularVelOffset(dt);
        this._bullet.updateRotation(this._bullet.currAngularVel * dt);
        this._bullet.updateAngularVel(angularOffset);
    }

    unuse(){
        this._isRunning = false;
        this._isPause = false;
    }

    reuse(...rest: any[]){
        let startPos: cc.Vec2 = rest[0];
        let baseDamage: number = rest[1];
        let config: any = rest[2];
        this.setBulletData(startPos, baseDamage, config);
    }
}

export {
    BulletEmitter,
    BULLET_ATTACH_TYPE
}