import { configUtils } from "../../../app/ConfigUtils";
import { eventCenter } from "../../../common/event/EventCenter";
import { parkourEvent } from "../../../common/event/EventData";
import { ParkourBuffType } from "../../template/Role";
import ItemBullet, { BulletEmitter, BULLET_ATTACH_TYPE } from "../view-item/ItemBullet";
import { bulletGroupCfgManager, bulletPoolManager } from "./BulletManager";
import { GROUPS_OF_NODE, HP_BAR_LERP_MIN_TRRESSHOLD, HP_BAR_LERP_RATIO, ParkourBulletOwnerType, parkourConfig, ParkourLazyLoadType, ParkourRoleActions, ParkourRoleEffects, RoleColliderType, getParkRoleSpinePath, TileSetBasicGIDS, TRAP_COLLISION_TYPE, TRAP_TYPE, ValueType } from "./ParkourConst";
import { parkourSpineCache } from "./RoleLayerComp";
import { ActorManager } from "./ActorManager";
import { BaseState, FastDownState, JumpState, RunState, SprintState } from "./StateModule";
import RoleFollowComp from "./RoleFollowComp";
import { ParkourScene } from "../view-scene/ParkourScene";
import RoleShadowComp from "./RoleShadowComp";
import { lazyLoadRes } from "./ParkourString";

/*
 * @Description:英雄组件
 * @Version: 1.0
 * @Autor: lixu
 * @Date: 2021-06-16 09:55:08
 * @LastEditors: lixu
 * @LastEditTime: 2021-06-16 10:05:32
 */
const {ccclass, property} = cc._decorator;

//每个角色的帧间隔
const DelayFrameCount = 5;
const ShadowScaleScope = 255;

@ccclass
export default class RoleLogicComp extends cc.Component {
    //角色的正常位置
    private _normalPos: cc.Vec2 =  parkourConfig.actorPos;
    //角色是否已经通关
    isPass : boolean = false;
    //当前角色是否已经通关并且退出场景
    isFinish: boolean = false;
    //是否暂停角色的逻辑帧
    private _isPaused: boolean = false;
    //角色的子弹发射器，负责子弹的发射
    bulletEmitter: BulletEmitter = null;
    //角色已经开始移动
    private _isStart: boolean = false;
    //角色身上普通碰撞器的尺寸
    private _normalColliderSize = cc.size(0, 0);
    //角色跟随组件
    private _followComp: RoleFollowComp = null;
    //当前的状态
    private _currState: BaseState = null;
    //冲刺的时候，目标位置高度(第一顺位冲刺状态下的y轴位置)
    private _chongCiPosY: number = -1;

    private _chongCiSpeed: cc.Vec2 = cc.v2();

    private _effectTargetWidth: number = -1;  //血条效果的目标宽度
    private _effectTween: cc.Tween = null;
    private _shadowComp: RoleShadowComp = null;

    private _dirtNode: cc.Node = null; //烟尘特效节点

    /**
     * 角色的正常位置，根据第一顺位的位置和角色当前的顺位自动调整
     */
     get normalPos(): cc.Vec2{
        return cc.v2(this._normalPos.x - (ActorManager.getInstance().getRoleInfo(this).sortId - 1) * parkourConfig.HeroOffset, this._normalPos.y);
    }

    onInit(...params: any[]){
        this.node.active = true;
        let idx = params[0];
        let followTarget = params[1];
        this.isPass = this.isFinish = false;
        let roleInfo = ActorManager.getInstance().getRoleInfo(this);
        //初始化子弹发射器
        this.bulletEmitter = this.bulletEmitter || this._initBulletEmitter(roleInfo.bulletGroup, roleInfo.shootDelay / 1000);
        this._followComp = this._followComp || this.node.getComponent(RoleFollowComp);
        //初始化跟随组件
         this._followComp.onInit({targetNode: followTarget, delayFrame: DelayFrameCount * idx});
        //影子组件
        this._shadowComp = this.node.getChildByName('Shadow').getComponent(RoleShadowComp);
        this._shadowComp.onInit();
        this._setRoleSpineData();
        this._setColliderSize();
        this.updateHP(Math.floor(roleInfo.hp / roleInfo.maxHp * 100) / 100);
        let roleNode = this.node.getChildByName("wizeard");
        roleNode.opacity = 255;
    }

    private _initBulletEmitter(bulletGroup: number, interval: number){
        let emitter = new BulletEmitter(bulletGroup, interval);
        emitter.realEmitFunc = this.doShoot.bind(this);
        return emitter;
    }

    deInit(){
        this._followComp.deInit();
        this._shadowComp.deInit();
        this.bulletEmitter.isEmit() && this.bulletEmitter.setEmit(false);
        this.bulletEmitter.clear();
        this.node.active = false;
        this._clear();
    }

    private _clear(){
        let hPEffectNode = cc.find('HpBar/HPEffect', this.node);
        cc.Tween.stopAllByTarget(hPEffectNode);
        this._effectTween = null;
        hPEffectNode.active = false;
        let roleNode = this.node.getChildByName("wizeard");
        let skeletonComp = roleNode.getComponent(sp.Skeleton);
        skeletonComp.clearTracks();
        if(cc.isValid(this._dirtNode)){
            ParkourScene.getInstance().getEffectLayerComp().removeEffectNode(this._dirtNode);
        }
        ActorManager.getInstance().getRoleInfo(this).clearBuffs();
        ActorManager.getInstance().getRoleInfo(this).resetSortId();
        this._currState = null;
        this._dirtNode = null;
        this._isPaused = false;
        this._isStart = false;
    }

    onRelease(){
        this._followComp.onRelease();
        this._shadowComp.onRelease();
        this.bulletEmitter.release();
        this.bulletEmitter = null;
        this._release();
    }

    //場景釋放的時候調用
    private _release(){
        let roleNode = this.node.getChildByName("wizeard");
        let skeletonComp = roleNode.getComponent(sp.Skeleton);
        skeletonComp.clearTracks();
        skeletonComp.skeletonData = null;

        this._normalPos = null;
        this._normalColliderSize = null;
        this._chongCiSpeed = null;
        this._currState = null;
    }

    /**
     * 开始游戏，角色入场
     */
    realStart(){
        //确保入场移动相同的距离
        this._isStart = true;
        this.node.setPosition(cc.v2(this.normalPos.x - parkourConfig.actorPos.x, this.normalPos.y));
        this._doSpineAction(ParkourRoleActions.Run, true, 0, this._getSpineCompleteCb(ParkourRoleActions.Run), this._getSpineStartCb(ParkourRoleActions.Run), this._getSpineEndCb(ParkourRoleActions.Run));
        this._playDirtEffect(ParkourRoleEffects.RunDirt);
    }

    /**
     * 设置角色的spine资源
     */
    private _setRoleSpineData(){
        let roleInfo = ActorManager.getInstance().getRoleInfo(this);
        let roleNode = this.node.getChildByName("wizeard");
        let skeletonComp = roleNode.getComponent(sp.Skeleton);
        let model = configUtils.getModelConfig(configUtils.getHeroBasicConfig(roleInfo.ID).HeroBasicModel);
        let modelName = model && model.ModelAttack;    //默认的模型
        let scale = model && model.ModelRunSize;
        if(!model){
            cc.warn('RoleLogicComp', `role ${roleInfo.ID} has not model data!!!`);
            modelName = 'beibo';
            scale = 10000;
        }
        roleNode.scale = scale/10000;
        skeletonComp.skeletonData = parkourSpineCache.getSpineData(getParkRoleSpinePath(modelName));
        this._shadowComp.node.width = roleNode.width * roleNode.scaleX;
    }

    //碰撞器尺寸
    private _setColliderSize(){
        let roleInfo = ActorManager.getInstance().getRoleInfo(this);
        let model = configUtils.getModelConfig(configUtils.getHeroBasicConfig(roleInfo.ID).HeroBasicModel);
        let sizeDesc = model && model.ModelRunBossRange;    //默认的模型
        let sizeArr = sizeDesc.split(';');
        this.node.getComponents(cc.BoxCollider).forEach(ele => {
          if(ele.tag === RoleColliderType.NORMAL){
            this._normalColliderSize.width = ele.size.width = parseInt(sizeArr[0]);
            this._normalColliderSize.height = ele.size.height = parseInt(sizeArr[1]);
            ele.offset.y = parseInt(sizeArr[1]) >> 1;
          }
      });
    }

    /**
     * 设置是否暂停，PS:只是暂停角色逻辑帧，并不会暂停渲染帧数
     * @param isPaused
     */
    setPaused(isPaused: boolean){
        this._isPaused = isPaused;
        //设置是否暂停角色的所有action
        if(isPaused){
            cc.director.getActionManager().pauseTarget(this.node);
        }else{
            cc.director.getActionManager().resumeTarget(this.node);
        }
    }

    //更新玩家血量
    updateHP(progress: number, isUseAnim: boolean = true) {
        let HPNode = this.node.getChildByName("HpBar");
        let progressComp = HPNode.getComponent(cc.ProgressBar);
        progressComp.progress = progress;
        this._effectTargetWidth = progress * progressComp.totalLength;
        this._updateHPEffect(isUseAnim)
    }

    private _updateHPEffect(isUseAnim: boolean){
        let hpEffectNode = cc.find('HpBar/HPEffect', this.node);
        if(!isUseAnim){
            cc.Tween.stopAllByTarget(hpEffectNode);
            this._effectTween = null;
            hpEffectNode.width = this._effectTargetWidth;
            !hpEffectNode.active && (hpEffectNode.active = true);
            return;
        }

        if(this._effectTween) return;
        let tween = cc.tween().delay(0).call(() =>{
            hpEffectNode.width = cc.misc.lerp(hpEffectNode.width, this._effectTargetWidth, HP_BAR_LERP_RATIO);
            if(Math.abs(hpEffectNode.width - this._effectTargetWidth) <= HP_BAR_LERP_MIN_TRRESSHOLD){
                cc.Tween.stopAllByTarget(hpEffectNode);
                hpEffectNode.width = this._effectTargetWidth;
                this._effectTween = null;
            }
        }, this);
        this._effectTween = cc.tween(hpEffectNode).repeatForever(tween).start();
    }

    //更新角色buff
    updateBuffState(buffType: ParkourBuffType){
        if(buffType == ParkourBuffType.NO_HURT){
            let roleNode = this.node.getChildByName("wizeard");
            roleNode.opacity = 120;
        }

        //增强buff
        if(buffType == ParkourBuffType.STRONG){
            let roleInfo = ActorManager.getInstance().getRoleInfo(this);
            this.changeBullet(roleInfo.superBulletGroup, roleInfo.superBulletDelay / 1000);
        }
    }

    //移除角色buff
    removeBuffState(buffType: ParkourBuffType){
        if(buffType == ParkourBuffType.NO_HURT){
            let roleNode = this.node.getChildByName("wizeard");
            roleNode.opacity = 255;
        }

        //增强buff
        if(buffType == ParkourBuffType.STRONG){
            let roleInfo = ActorManager.getInstance().getRoleInfo(this);
            this.changeBullet(roleInfo.bulletGroup, roleInfo.shootDelay / 1000);
        }
    }

    //换弹
    changeBullet(bulletID: number, shootDelay: number){
        if(isNaN(bulletID)) return;
        if(this.bulletEmitter && this.bulletEmitter.getCurrGroup() != bulletID){
            this.bulletEmitter.reset(bulletID, shootDelay);
        }
    }

    //死亡
    goDie() {
        //清空跟随信息，防止复活后执行生前未执行的跟随
        this._followComp.clear();
        //停止子弹发射器
        this.setBulletEmitterState();
        this.bulletEmitter.clear();
        let roleNode = this.node.getChildByName("wizeard");
        roleNode.opacity = 255;
        cc.tween(this.node).to(0.5, {x: -100}).start();
        this._doSpineAction(ParkourRoleActions.Die, false, 0, this._getSpineCompleteCb(ParkourRoleActions.Die), this._getSpineStartCb(ParkourRoleActions.Die), this._getSpineEndCb(ParkourRoleActions.Die));
        this._playDirtEffect(ParkourRoleEffects.DeadDirt);
      }

    //复活
    relive(time: number = 0, distance: number = 300, isBack: boolean = true) {
        this._doSpineAction(ParkourRoleActions.Run, true, 0, this._getSpineCompleteCb(ParkourRoleActions.Run), this._getSpineStartCb(ParkourRoleActions.Run), this._getSpineEndCb(ParkourRoleActions.Run));
        this._playDirtEffect(ParkourRoleEffects.RunDirt);
        this.node.active = true;
    }

    //受伤
    beHurt(deltaHp: number, valueType: ValueType = ValueType.AbsoluteValue){
        let roleNode = this.node.getChildByName("wizeard");
        roleNode.color = cc.Color.fromHEX(cc.Color.clone(cc.Color.WHITE), '#9C9C9C');
        cc.tween(roleNode).blink(0.5, 5).call(() => {
            roleNode.color = cc.Color.WHITE;
            roleNode.opacity = 255;
        }).start();
        eventCenter.fire(parkourEvent.UPDATE_HP, this, deltaHp, valueType);
    }

    /**
     *
     * @param buffType  buff类型
     * @param time      buff持续时间
     * @param isAccumulate  是否累加
     */
    addBuff(buffType: ParkourBuffType, time: number, isAccumulate: boolean){
        eventCenter.fire(parkourEvent.ADD_BUFF, this, buffType, time, isAccumulate);
    }

    //移除buffer
    removeBuff(buffType: ParkourBuffType){
        eventCenter.fire(parkourEvent.REMOVE_BUFF, this, buffType);
    }

    //播放指定的spine动画
    private _doSpineAction(animName: string, isLoop: boolean = false, trackIdx: number = 0, completeCb: Function = null, startCb: Function = null, endCb: Function = null){
        let roleNode = this.node.getChildByName("wizeard");
        let skeletonComp = roleNode.getComponent(sp.Skeleton);
        skeletonComp.setStartListener(startCb);
        skeletonComp.setEndListener(endCb);
        skeletonComp.setCompleteListener(completeCb);
        skeletonComp.setAnimation(trackIdx, animName, isLoop);
    }

    //射击
    doShoot(idx: number, bulletID: number){
        if(this._isPaused || this.isFinish || this.isPass) return;
        //死亡不发射子弹
        if(ActorManager.getInstance().getRoleInfo(this).isDead()) return;

        let roleInfo = ActorManager.getInstance().getRoleInfo(this);
        let bulletcfg = bulletGroupCfgManager.getBulletGroupCfg(this.bulletEmitter.getCurrGroup());
        let bulletInfo = bulletcfg.bullets[idx];

        let startPos = cc.v2();
        if(bulletInfo.attachType === BULLET_ATTACH_TYPE.ROLE){
            startPos = this.node.convertToWorldSpaceAR(startPos);
        }
        let bullet = bulletPoolManager.get(bulletID, startPos, roleInfo.damage, bulletInfo);
        if(!bullet) return;
        bullet.getComponent(ItemBullet).setBulletOwnerType(ParkourBulletOwnerType.Player);
        eventCenter.fire(parkourEvent.SHOOT, bullet);
    }

    //子弹发射器的开关
    setBulletEmitterState(){
        let isEmit: boolean = !ActorManager.getInstance().getRoleInfo(this).isDead() && ParkourScene.getInstance().getMonsterLayerComp().hasAttackedMonster();
        this.bulletEmitter && this.bulletEmitter.setEmit(isEmit);
    }

    /**
     * 碰撞的回调函数
     * @param other 与角色发生碰撞的其他节点上的碰撞器
     * @param self
     * @returns
     */
    onCollisionEnter(other: cc.Collider, self: cc.Collider) {
        if(!this._isStart) return;
        if(this._isPaused) return;
        //与陷阱的碰撞
        if(other.node.groupIndex === GROUPS_OF_NODE.TRAP && self.tag === RoleColliderType.NORMAL){
            let compName = other.node.name;
            let trapComp = other.node.getComponent(compName);
            if(!trapComp) return;
            switch(trapComp.trapType){
                case TRAP_TYPE.FIXED:
                    if(other.tag === TRAP_COLLISION_TYPE.DAMAGE){//伤害碰撞器
                        //对于为死亡且没有免伤buff的角色，扣除血量
                        if(!ActorManager.getInstance().getRoleInfo(this).isDead() && !ActorManager.getInstance().getRoleInfo(this).isNoHurtState()){
                            this.beHurt(-trapComp.damage, trapComp.damageType);
                            this.addBuff(ParkourBuffType.NO_HURT, 1, false);
                        }
                    }
                    break;
                case TRAP_TYPE.HINDER:
                    break;
            }
        }

        //与子弹的碰撞
        if(other.node.groupIndex === GROUPS_OF_NODE.BULLET && self.tag === RoleColliderType.NORMAL){
            if(other.node.parent.name == "bullet"){
                let bulletComp = other.node.parent.getComponent(ItemBullet);
                if(!bulletComp) return;
                //被子弹击中了
                if(bulletComp.getBulletOwnerType() == ParkourBulletOwnerType.Monster){
                    this.beHurt(-bulletComp.bullet.damage);
                }
            }
        }
    }

    /**
     * 碰撞的回调函数
     * @param other 与角色发生碰撞的其他节点上的碰撞器
     * @param self
     * @returns
     */
    onCollisionStay(other: cc.Collider, self: cc.Collider) {
        if(!this._isStart) return;
        if(this._isPaused) return;
        //与陷阱的碰撞
        if(other.node.groupIndex === GROUPS_OF_NODE.TRAP && self.tag === RoleColliderType.NORMAL){
            let compName = other.node.name;
            let trapComp = other.node.getComponent(compName);
            if(!trapComp) return;

            switch(trapComp.trapType){
                case TRAP_TYPE.FIXED:
                    if(!ActorManager.getInstance().getRoleInfo(this).isDead() && !ActorManager.getInstance().getRoleInfo(this).isNoHurtState()){
                        this.beHurt(-trapComp.damage, trapComp.damageType);
                        this.addBuff(ParkourBuffType.NO_HURT, 1, false);
                    }
                    break;
                case TRAP_TYPE.HINDER:
                    break;
            }
        }
    }

    /**
     * 碰撞的回调函数
     * @param other 与角色发生碰撞的其他节点上的碰撞器
     * @param self
     * @returns
     */
    onCollisionExit(other: cc.Collider, self: cc.Collider) {
        if(!this._isStart) return;
        if(this._isPaused) return;
        //与陷阱的碰撞
        if(other.node.groupIndex === GROUPS_OF_NODE.TRAP && self.tag === RoleColliderType.NORMAL){
            let compName = other.node.name;
            let trapComp = other.node.getComponent(compName);
            if(!trapComp) return;
            switch(trapComp.trapType){
                case TRAP_TYPE.HINDER:

                    break;
            }
        }
    }

    update(dt: number){
        if(!this._isStart) return;
        if(this._isPaused) return;
        if(this.isFinish) return;
        this.bulletEmitter && this.setBulletEmitterState();
        this.bulletEmitter && this.bulletEmitter.isEmit() && this.bulletEmitter.checkEmitter(dt);
    }

    updateShadow(){
        let wizeardNode = this.node.getChildByName("wizeard");
        let pos = this.node.convertToWorldSpaceAR(wizeardNode.getPosition());
        let target = ParkourScene.getInstance().getMapTerrManager().getNearestPosInShadeLayer(pos);
        if(!target) return;
        let pos1 = target.targetPos;
        let tileSize = target.tileSize;
        let gid: number = target.gid;
        let targetPos: cc.Vec2 = cc.v2(pos.x, 0);
        if(gid == TileSetBasicGIDS.PingDi){
            targetPos.y = pos1.y + wizeardNode.y + tileSize.height;
        }else if(gid == TileSetBasicGIDS.ShangPo){
            targetPos.y = pos1.y + this.node.x - pos1.x +  wizeardNode.y;
        }else if(gid == TileSetBasicGIDS.XiaPo){
            targetPos.y = pos1.y + tileSize.height - (this.node.x - pos1.x) +  wizeardNode.y;
        }
        let realPos = this.node.convertToNodeSpaceAR(targetPos);
        let scale = 1 - Math.min(ShadowScaleScope, Math.abs(realPos.y)) / ShadowScaleScope;
        this._shadowComp.updatePos(realPos, scale);
    }

    lateUpdate(dt: number){
        if(!this._isStart) return;
        if(this._isPaused) return;
        if(this.isFinish) return;

        //更新位置信息
        if(!this._followComp) return;
        //x轴的跟随采用固定频率
        this.node.x = this._followComp.getCurrFollowTargetPosX() - (ActorManager.getInstance().getRoleInfo(this).sortId - 1) * parkourConfig.HeroOffset;
        let followInfo = this._followComp.getCurrFollowInfo(!(this._currState instanceof SprintState));
        if(!followInfo) return;
        let actionInfo = followInfo.action;
        if(!this._currState || this._currState != followInfo.state){
            let lastState = this._currState;
            this._currState = followInfo.state;
            this._switchSpine(followInfo.state);
            //一段跳(不包括跑状态通过自由落体方式切换到一段跳)时，播放一段跳特效
            if(lastState instanceof RunState && this._currState instanceof JumpState && !actionInfo){
                this._playDirtEffect(ParkourRoleEffects.OneJumpDirt);
            }

            //跑状态通过自由落体方式切换到一段跳时, 不需要执行动作特效
            if(lastState instanceof RunState && this._currState instanceof JumpState && actionInfo && actionInfo.name == ParkourRoleActions.AutoDown){
                actionInfo = null;
                this._playDirtEffect(ParkourRoleEffects.AutoDown);
            }

            if((lastState instanceof JumpState && this._currState instanceof RunState) || lastState instanceof FastDownState && this._currState instanceof RunState){
                this._playDirtEffect(ParkourRoleEffects.LandDirt);
            }
        }

        //冲刺状态下
        if(this._currState instanceof SprintState){
            this.node.y += this._chongCiSpeed.y * dt;
             //向下靠拢目标
             if(this._chongCiSpeed.y < 0 && this.node.y <= this._chongCiPosY){
                this.node.y = this._chongCiPosY;
                this._chongCiSpeed.y = 0;
            }

            //向上靠拢目标
            if(this._chongCiSpeed.y > 0 && this.node.y >= this._chongCiPosY){
                this.node.y = this._chongCiPosY;
                this._chongCiSpeed.y = 0;
            }
        }else{
            this.node.y = followInfo.y;
        }
        this.updateShadow();

        if(actionInfo){
            let spineName = actionInfo.name;
            if(actionInfo.name == ParkourRoleActions.FastDown || actionInfo.name == ParkourRoleActions.DoubleJump){
                spineName = ParkourRoleActions.Roll;
            }

            this._doSpineAction(spineName, actionInfo.loop || false, actionInfo.trackIdx, this._getSpineCompleteCb(spineName), this._getSpineStartCb(spineName), this._getSpineEndCb(spineName));
            if(actionInfo.name == ParkourRoleActions.DoubleJump){
                this._playDirtEffect(ParkourRoleEffects.DoubleJumpDirt);
            }
        }
    }

    captureFollowInfo(dt: number){
        if(!this._followComp){
            cc.warn('RoleLogicComp captureFollowInfo: _followComp is null!!!');
            return;
        }
        if(this._isPaused) return;
        if(!this._isStart) return;

        //角色死亡,不再捕获
        let roleInfo = ActorManager.getInstance().getRoleInfo(this);
        if(!roleInfo || roleInfo.isDead()) return;
        this._followComp.captureFollowInfo(dt);
    }

    //开始冲刺
    startChongCi(pos?: cc.Vec2, time?: number){
        if(this.isPass) return;
        //冲刺状态下碰撞器吸附范围扩大为原来的两倍
        this.setColliderSize(RoleColliderType.NORMAL, 2);
        let chongCiTime = time;  //冲刺动作时长
        this.addBuff(ParkourBuffType.PENG_ZHUANG, chongCiTime, false); //增加碰撞状态
        this.addBuff(ParkourBuffType.NO_HURT, chongCiTime, false); //增加免伤状态
        this._chongCiPosY = pos.y;
        //需要清空还未执行的缓存信息
        this._followComp.clear();
        if(this.node.y < this._chongCiPosY){
            this._chongCiSpeed.y = -500;
        }else if(this.node.y > this._chongCiPosY){
            this._chongCiSpeed.y = 500;
        }else{
            this._chongCiSpeed.y = 0;
        }
    }

    //结束冲刺状态
    endChongCi(){
        this._chongCiPosY = -1;
        this.setColliderSize(RoleColliderType.NORMAL, 1);
    }

    //改变某个碰撞器的尺寸
    setColliderSize(type : RoleColliderType, newSize: cc.Size | number){
        //目前没有处理角色地形碰撞器的尺寸改变
        if(type != RoleColliderType.NORMAL) return;
        let colliders = this.node.getComponents(cc.BoxCollider);
        colliders.forEach(element => {
            if(element.tag === RoleColliderType.NORMAL){
                if(newSize instanceof cc.Size){
                    element.size.width = (newSize as cc.Size).width;
                    element.size.height = (newSize as cc.Size).height;
                }else{
                    element.size.width = this._normalColliderSize.width * newSize;
                    element.size.height = this._normalColliderSize.height * newSize;
                }
            }
        });
    }

    //重置当前英雄的位置
    resetNormalPos(){
        this.node.x = this.normalPos.x;
        this.node.y = this.normalPos.y
    }

    //重置帧延迟,需要在角色的sortId更新后调用，否则帧延迟不会被改变
    resetFrameDelay(){
        let roleInfo = ActorManager.getInstance().getRoleInfo(this);
        if(roleInfo.isDead()) return;
        this._followComp.delayFrame = (roleInfo.sortId - 1) * DelayFrameCount;
    }

    //补位追帧
    catchUpFrame(){
        this.resetFrameDelay();
        let frames = this._followComp.getMoreFollowInfos();
        if(!frames || frames.length == 0) return
        for(let i = 0, len = frames.length; i < len; i++){
            let followInfo = frames[i];
            let actionInfo = followInfo.action;
            this.node.x = followInfo.x - (ActorManager.getInstance().getRoleInfo(this).sortId - 1) * parkourConfig.HeroOffset;
            this.node.y = followInfo.y;
            if(!this._currState || this._currState != followInfo.state){
                let lastState = this._currState;
                this._currState = followInfo.state;
                this._switchSpine(followInfo.state);
                //一段跳(不包括跑状态通过自由落体方式切换到一段跳)时，播放一段跳特效
                if(lastState instanceof RunState && this._currState instanceof JumpState && !actionInfo){
                    this._playDirtEffect(ParkourRoleEffects.OneJumpDirt);
                }

                //跑状态通过自由落体方式切换到一段跳时, 不需要执行动作特效
                if(lastState instanceof RunState && this._currState instanceof JumpState && actionInfo && actionInfo.name == ParkourRoleActions.AutoDown){
                    actionInfo = null;
                    this._playDirtEffect(ParkourRoleEffects.AutoDown);
                }

                if((lastState instanceof JumpState && this._currState instanceof RunState) || lastState instanceof FastDownState && this._currState instanceof RunState){
                    this._playDirtEffect(ParkourRoleEffects.LandDirt);
                }
            }

            if(actionInfo){
                let spineName = actionInfo.name;
                if(actionInfo.name == ParkourRoleActions.FastDown || actionInfo.name == ParkourRoleActions.DoubleJump){
                    spineName = ParkourRoleActions.Roll;
                }
                this._doSpineAction(spineName, actionInfo.loop || false, actionInfo.trackIdx, this._getSpineCompleteCb(spineName), this._getSpineCompleteCb(spineName), this._getSpineEndCb(spineName));
                if(actionInfo.name == ParkourRoleActions.DoubleJump){
                    this._playDirtEffect(ParkourRoleEffects.DoubleJumpDirt);
                }
            }
        }
    }

    private _switchSpine(newState: BaseState){
        if(!newState) return;
        if(newState instanceof RunState){
            this._doSpineAction(ParkourRoleActions.Run, true, 0, this._getSpineCompleteCb(ParkourRoleActions.Run), this._getSpineStartCb(ParkourRoleActions.Run), this._getSpineEndCb(ParkourRoleActions.Run));
        }

        if(newState instanceof JumpState){
            this._doSpineAction(ParkourRoleActions.Jump, false, 0, this._getSpineCompleteCb(ParkourRoleActions.Jump), this._getSpineStartCb(ParkourRoleActions.Jump), this._getSpineEndCb(ParkourRoleActions.Jump));
        }
    }

    private _getSpineEndCb(animName: string): Function{
        return null;
    }

    private _getSpineCompleteCb(animName: string){
        if(animName == ParkourRoleActions.Roll){
            return () => {
                this._doSpineAction(ParkourRoleActions.Run, true, 0, this._getSpineCompleteCb(ParkourRoleActions.Run), this._getSpineStartCb(ParkourRoleActions.Run), this._getSpineEndCb(ParkourRoleActions.Run));
            };
        };

        if(animName == ParkourRoleActions.Die){
            return ()=> {
                this.node.active = false;
            }
        }
        return null;
    }

    private _playDirtEffect(effectType: ParkourRoleEffects){
        let roleInfo = ActorManager.getInstance().getRoleInfo(this);
        if(roleInfo.isDead()) return;
        let animClipCache = ParkourScene.getInstance().getAnimClipCache();
        let isShowRunDirt: boolean = false;
        if(effectType == ParkourRoleEffects.RunDirt ){//&& ActorManager.getInstance().isLastSortRole(this)
            if(!cc.isValid(this._dirtNode)){
                let clip = animClipCache.getClip(lazyLoadRes[ParkourLazyLoadType.AnimClip]['RunDirt']);
                this._dirtNode = ParkourScene.getInstance().getEffectLayerComp().getEffectNode(false, clip, null, this, this._initDirtEffect);
                this._dirtNode.anchorX = 1;
                this._dirtNode.anchorY = 0;
                this._dirtNode.x = 0;
                this._dirtNode.y = 0;
                this._dirtNode.parent = this.node;
            }
            isShowRunDirt = true;
        }

        if(effectType == ParkourRoleEffects.OneJumpDirt){ //&& ActorManager.getInstance().isFirstSortSRole(this)
            let clip = animClipCache.getClip(lazyLoadRes[ParkourLazyLoadType.AnimClip]['OneJumpDirt']);
            let dirtNode = ParkourScene.getInstance().getEffectLayerComp().getEffectNode(true, clip, this._removeDirtAction, this, this._initDirtEffect);
            dirtNode.anchorY = 0;
            dirtNode.x = this.node.x - (dirtNode.width >> 1);
            dirtNode.y = this.node.y;
            this._addDirtAction(dirtNode);
        }

        if(effectType == ParkourRoleEffects.DoubleJumpDirt){ //&& ActorManager.getInstance().isFirstSortSRole(this)
            let clip = animClipCache.getClip(lazyLoadRes[ParkourLazyLoadType.AnimClip]['DoubleJumpDirt']);
            let dirtNode = ParkourScene.getInstance().getEffectLayerComp().getEffectNode(true, clip, this._removeDirtAction, this, this._initDirtEffect);
            dirtNode.anchorY = 0;
            dirtNode.x = this.node.x;
            dirtNode.y = this.node.y;
            this._addDirtAction(dirtNode);
        }

        //单个人情况,先播放落地效果，在播放奔跑效果
        if(effectType == ParkourRoleEffects.LandDirt ){//&& ActorManager.getInstance().isFirstSortSRole(this)
            let clip = animClipCache.getClip(lazyLoadRes[ParkourLazyLoadType.AnimClip]['LandDirt']);
            let dirtNode = ParkourScene.getInstance().getEffectLayerComp().getEffectNode(true, clip, this._onLandDirtEffectFinishCb, this, this._initDirtEffect);
            dirtNode.x = this.node.x;
            dirtNode.y = this.node.y;
            this._addDirtAction(dirtNode);
        }

        //多人情况,最后一个人直接播放奔跑效果
        // if(effectType == ParkourRoleEffects.LandDirt && !ActorManager.getInstance().isFirstSortSRole(this) && ActorManager.getInstance().isLastSortRole(this)){
        //     this._onLandDirtEffectFinishCb(null);
        //     return;
        // }

        cc.isValid(this._dirtNode) && (this._dirtNode.active = isShowRunDirt);
    }

    //初始化尘埃特效的sprite组件
    private _initDirtEffect(animComp: cc.Animation, spriteComp: cc.Sprite){
        if(!cc.isValid(animComp.node)) return;
        if(cc.isValid(spriteComp)){
            spriteComp.sizeMode = cc.Sprite.SizeMode.RAW;
            spriteComp.type = cc.Sprite.Type.SIMPLE;
            spriteComp.trim = false;
        }
    }

    private _addDirtAction(dirtNode: cc.Node){
        if(!cc.isValid(dirtNode)) return;
        cc.tween(dirtNode).by(1, {x: -400}, {easing: 'smooth'}).start();
    }

    private _removeDirtAction(effectNode: cc.Node){
        if(!cc.isValid(effectNode)) return;
        cc.Tween.stopAllByTarget(effectNode);
    }

    private _onLandDirtEffectFinishCb(effectNode: cc.Node){
        cc.Tween.stopAllByTarget(effectNode);
        if(this._currState instanceof RunState){
          this._playDirtEffect(ParkourRoleEffects.RunDirt);
        }
    }

    private _getSpineStartCb(animName: string): Function{
        return null;
    }
}
