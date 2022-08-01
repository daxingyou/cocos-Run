/*
 * @Description: 跑酷怪物
 * @Autor: lixu
 * @Date: 2021-05-27 19:57:23
 * @LastEditors: lixu
 * @LastEditTime: 2021-10-21 11:40:28
 */
import { utils } from "../../../app/AppUtils";
import { configUtils } from "../../../app/ConfigUtils";
import { eventCenter } from "../../../common/event/EventCenter";
import { parkourEvent } from "../../../common/event/EventData";
import { cfg } from "../../../config/config";
import { data } from "../../../network/lib/protocol";
import ItemBullet, { BULLET_ATTACH_TYPE } from "../view-item/ItemBullet";
import { ParkourScene } from "../view-scene/ParkourScene";
import { bulletGroupCfgManager, bulletPoolManager } from "./BulletManager";
import { RewardAninType } from "./ItemManager";
import MonsterBT from "./monsterBehavior/MonsterBT";
import { IdelState } from "./monsterBehavior/state/IdelState";
import { monsterPoolManager } from "./MonsterLayerComp";
import { GROUPS_OF_NODE, HP_BAR_LERP_MIN_TRRESSHOLD, HP_BAR_LERP_RATIO, ItemWeights, ParkourBulletOwnerType, parkourConfig, ParkourLazyLoadType, ParkourMonsterMoveType, ParkourMonsterType, ParkourRoleActions, RoleColliderType, getParkRoleSpinePath, TERR_LAYER, TERR_TYPE } from "./ParkourConst";
import { lazyLoadRes } from "./ParkourString";
import { ActionInfo } from "./RoleFollowComp";
import { parkourSpineCache } from "./RoleLayerComp";
import { BaseState, DieState, FastDownState, JumpState, RunState, StateContext } from "./StateModule";
import TerrCollisionComp from "./terr/TerrCollisionComp";

const {ccclass, property} = cc._decorator;

@ccclass
export default class ParkourMonster extends cc.Component {
    @property(sp.Skeleton) skeletonComp: sp.Skeleton  = null;
    @property(cc.ProgressBar) hpBar: cc.ProgressBar = null;
    @property(cc.Node) hpEffect: cc.Node = null;
    private _isActive: boolean = false;
    private _config: any = null;
    private _monsterInfo: MonsterInfo = null;
    private _tree: MonsterBT = null;
    private _isPaused: boolean = false;
    private _blackboard: b3.Blackboard = null;
    private _treeTarget: any = null;
    private _startPos: cc.Vec2 = null;
    private _attackedEffect: cc.Tween = null;

    //地形碰撞是否有效
    private _isCollisionEnable: boolean = false;
    //是否处于可被攻击的状态
    private _isAttackedAble: boolean = false;

    //当前的跳跃次数，控制二连条
    jumpCount : number = 0;
    //角色是否正在跳跃阶段
    jumping: boolean = false;
    //角色与地形的碰撞计数器，与地形开始碰撞的时候，计数器+1，结束碰撞的时候，计数器-1
    collisionLandCount = 0;
    //角色最近接触过的地形碰撞器，用以判断是否在基础地形上
    leastLandCollider:cc.Collider = null;
    //基础地形的Y坐标，用以在角色下落过程中，判断是否接触到地面了
    landY: number = 0;
    //角色的跳跃速度
    jumpSpeed: cc.Vec2 = cc.v2(0, 0);
    //角色当前的加速度
    currAddSpeed : cc.Vec2 = parkourConfig.addSpeed;
    //是否从高层地形速降
    isFastDownFromHighLand: boolean  = false;
    //进行速降时所处的高度，用来判定速降过程中与同一层的碰撞器发生碰撞时被反弹回去
    fastDownFromHeight: number = -1;
    //上坡的碰撞计数器
    private _upSlopseCollisionCount: number = 0;
    //下坡的碰撞计数器
    private _downSlopeCollisionCount: number = 0;
    //与斜坡发生碰撞的上坡节点数组
    private _collisionUpSlopsNode: cc.Node[] = [];
    //与斜坡发生碰撞的下坡节点数组
    private _collisionDownSlopsNode: cc.Node[] = [];
    //与地面发生碰撞的节点属于
    private _collisionNode: cc.Node[] = [];
    //需要执行的状态切换事件
    private _execStateEvents: string[] = [];

    private _effectTargetWidth: number = -1;  //血条效果的目标宽度
    private _effectTween: cc.Tween = null;

    private _stateMachine: StateContext<ParkourMonster> = null;

    get attackedAble(): boolean{
        return this._isAttackedAble;
    }

    set attackedAble(attackedAble: boolean){
        this._isAttackedAble = attackedAble;
    }

    onInit(initPos: cc.Vec2, ...params: any[]){
        this._startPos = initPos;
        this._isActive = false;
        this._config = this._config || params[0];
        this._init(this._config.monsterId);
        this._initCollision(true);
        this.node.x = cc.winSize.width + Math.abs(this.skeletonComp.node.width / 2 * this.skeletonComp.node.scaleX);
        this.node.y = this._startPos.y;
        this._initStateMachine();
    }

    private _clear(){
        cc.Tween.stopAllByTarget(this.hpEffect);
        this._effectTargetWidth = -1;
        this._effectTween = null;
        this.hpEffect.active = false;
        this._tree && (this._tree.active = false);
        this._isActive = false;
        this._isPaused = false;
        this._blackboard = null;
        this._startPos = null;
        if(this._attackedEffect){
            this._attackedEffect.stop();
            this._attackedEffect = null;
        }
        cc.isValid(this.skeletonComp) && (this.skeletonComp.node.color = cc.Color.WHITE);
        this._isCollisionEnable = false;
        this._isAttackedAble = false;
        this.jumpCount = 0;
        this.jumping = false;
        this.collisionLandCount = 0;
        this.leastLandCollider = null;
        this.landY = 0;
        this.jumpSpeed = cc.v2(0, 0);
        this.currAddSpeed = parkourConfig.addSpeed;
        this.isFastDownFromHighLand = false;
        this.fastDownFromHeight = -1;
        this._upSlopseCollisionCount = 0;
        this._downSlopeCollisionCount = 0;
        this._collisionUpSlopsNode.length = 0;
        this._collisionDownSlopsNode.length = 0;
        this._collisionNode.length = 0;
        this._execStateEvents.length = 0;
        if(this._stateMachine){
            this._stateMachine.changeState(this._stateMachine.getState('idel'));
        }
    }

    deInit(...params: any[]){
        this._clear();
    }

    onRelease(){
        this._tree && this._tree.release();
        this._tree = null;
        this._stateMachine.release();
        this.skeletonComp.clearTracks();
        this.skeletonComp.skeletonData = null;
        this._stateMachine = null;
        this._config = null;
        this._monsterInfo = null;
        this.jumpSpeed = null;
        this.currAddSpeed = null;
        this._collisionUpSlopsNode = null;
        this._collisionDownSlopsNode = null;
        this._collisionNode = null;
        this._execStateEvents = null;
        this._treeTarget = null;
    }

    //初始化碰撞器,对于飞行怪物，关闭地形碰撞器
    private _initCollision(isReset: boolean){
        let collisions = this.node.getComponents(cc.BoxCollider);
        collisions.forEach((ele) => {
            if(ele.tag == RoleColliderType.LAND){
                if(isReset){
                    ele.enabled = false;
                    return;
                }
                ele.enabled  = this._isCollisionEnable;
            }
        });
    }

    //初始化怪物的状态机，及设置起始状态
    private _initStateMachine (){
        if(!this._stateMachine){
            let stateArr = [];
            stateArr.push(new IdelState("idel"));
            stateArr.push(new RunState("run"));
            stateArr.push(new JumpState("jump"));
            stateArr.push(new FastDownState("fastDown"));
            stateArr.push(new DieState("die"));
            this._stateMachine = new StateContext<ParkourMonster>(this);
            this._stateMachine.init(stateArr, stateArr[0]);
            return;
        }
        this._stateMachine.changeState(this._stateMachine.getState('idel'));
    }

    update(dt: number){
        this._execStateEvents.length = 0;
        if(!this._isActive) return;
        if(this._isPaused) return;
        this._execBT(dt) && this._updatePos(dt);
    }

    private _execBT(dt: number): boolean{
        if(!this._tree.active) return false;
        this._treeTarget = this._treeTarget || {};
        this._treeTarget.dt = dt;
        this._treeTarget.target = this.node;
        let status: number = this._tree.tick(this._treeTarget, this._blackboard);
        //@ts-ignore
        if(status != b3.RUNNING){
            this._tree.active = false;
            this._isActive = false;
            //怪物死亡
            ParkourScene.getInstance().getMonsterLayerComp().removeMonster(this);
            return false;
        }
        return true;
    }

    isActive(): boolean{
        return this._isActive;
    }

    private _updatePos(dt: number){
        if(this._monsterInfo.isDead()) return;
        if(!this._isCollisionEnable) return;
        if(this.jumping){
            //速降状态是匀速下落的，因此在速降状态下不改变下落速度
            if(!(this._stateMachine.getCurrState() instanceof FastDownState)){
                this.jumpSpeed.y += this.currAddSpeed.y * dt;
                if(Math.abs(this.jumpSpeed.y) > parkourConfig.maxJumpSpeed.y){
                    this.jumpSpeed.y = this.jumpSpeed.y > 0 ? this.jumpSpeed.y : -parkourConfig.maxJumpSpeed.y;
                }
            }
        }

        //在y轴速度不为0时,更新角色的位置
        if(this.jumpSpeed.y != 0)   {
            this.node.y += this.jumpSpeed.y * dt;
        }

        if(this._stateMachine.getCurrState() instanceof RunState){
            //上坡
            if(this._upSlopseCollisionCount > 0){
                for(let len  = this._collisionUpSlopsNode.length, i = 0; i < len; i++){
                  let node = this._collisionUpSlopsNode[i];
                  let worldBox = node.getBoundingBoxToWorld();
                  let boundBox = cc.rect(worldBox.center.x, worldBox.center.y,  worldBox.width, worldBox.height);
                  if(boundBox.xMin <= this.node.x && boundBox.xMax >= this.node.x){
                      let startX = boundBox.xMin;
                      let offsetX = this.node.x - startX;
                      let posY = boundBox.yMin + offsetX;
                      this.node.y = posY;
                      break;
                  }
                  //规避角色爬坡过程中爬不到最高点
                  if(boundBox.xMax < this.node.x && len == 1 && this.node.y < boundBox.yMax){
                      this.node.y = boundBox.yMax;
                      break;
                  }
                }
            }
            //下坡
            if(this._downSlopeCollisionCount > 0){
                let validNode: cc.Node = null;
                for(let len  = this._collisionDownSlopsNode.length, i = 0; i < len; i++){
                    let node = this._collisionDownSlopsNode[i];
                    let worldBox = node.getBoundingBoxToWorld();
                    let boundBox = cc.rect(worldBox.center.x, worldBox.center.y,  worldBox.width, worldBox.height);
                    validNode = node;
                    if(boundBox.xMin <= this.node.x && boundBox.xMax >= this.node.x){
                        let posY =  boundBox.yMin + boundBox.xMax - this.node.x;
                        this.node.y = posY;
                        break;
                    }
                    //规避角色下坡时踏空情况发生
                    if(boundBox.xMax < this.node.x &&  this.node.y > boundBox.yMin && len == 1){
                        this.node.y -= ParkourScene.getInstance().getMapTerrManager().getCurrFrameMoveDis();
                        break;
                    }
                }
            }
        }

        if(this.node.y < 0){
            this.node.y = 0;
        }
    }

    lateUpdate(dt: number){
          if(!this._isActive) return;
          if(this._isPaused) return;
          if(this._execStateEvents.length > 0){
            this._execStateEvents.forEach(element => {
                let isConditionSucc: boolean = false;
                //切换到跑状态
                if(element == 'doRun'){
                    //重置当前的地面高度
                    if(this.collisionLandCount > 0){
                        //只有平地
                        if(this._upSlopseCollisionCount <= 0 && this._downSlopeCollisionCount <= 0){
                            //随便取一个碰撞节点，设置最大y为地面高度
                            this.landY = this._collisionNode[0].y + this._collisionNode[0].height;
                            isConditionSucc = true;
                        }else if(this._upSlopseCollisionCount > 0){ //有上坡
                            //在坡中间
                            if(this.collisionLandCount == this._upSlopseCollisionCount){
                                for(let i = 0, len = this._collisionUpSlopsNode.length; i < len; i++){
                                    let node = this._collisionUpSlopsNode[i];
                                    let worldBox = node.getBoundingBoxToWorld();
                                    let boundBox = cc.rect(worldBox.center.x, worldBox.center.y,  worldBox.width, worldBox.height);
                                    if(boundBox.xMin <= this.node.x && boundBox.xMax >= this.node.x){
                                        let startX = boundBox.xMin;
                                        let offsetX = this.node.x - startX;
                                        let posY = boundBox.y + offsetX;
                                        //当可以触及到可以落地的位置时，进行落地
                                        if(this.node.y <= posY){
                                            isConditionSucc = true;
                                            this.landY = posY;
                                        }
                                        break;
                                    }
                                }
                            }

                            //在坡顶或者坡底部
                            if(this.collisionLandCount > this._upSlopseCollisionCount){
                                let currPlaceNode = null;
                                for(let i = 0, len = this._collisionNode.length; i < len; i++){
                                    let node = this._collisionNode[i];
                                    let worldBox = node.getBoundingBoxToWorld();
                                    let boundBox = cc.rect(worldBox.center.x, worldBox.center.y,  worldBox.width, worldBox.height);
                                    if(boundBox.xMin <= this.node.x && boundBox.xMax >= this.node.x){
                                        currPlaceNode = node;
                                        break;
                                    }
                                }

                                if(this._collisionUpSlopsNode.indexOf(currPlaceNode) != -1){//有效碰撞在上坡中
                                    let worldBox = currPlaceNode.getBoundingBoxToWorld();
                                    let boundBox = cc.rect(worldBox.center.x, worldBox.center.y,  worldBox.width, worldBox.height);
                                    let startX = boundBox.xMin;
                                    let offsetX = this.node.x - startX;
                                    let posY = boundBox.y + offsetX;
                                    if(this.node.y <= posY){
                                        isConditionSucc = true;
                                        this.landY = posY;
                                    }
                                }else{//有效碰撞在坡顶或者坡底
                                    isConditionSucc = true;
                                    this.landY = currPlaceNode.y + currPlaceNode.height;
                                }
                            }
                        }else if(this._downSlopeCollisionCount > 0){//有下坡
                            //在坡中间
                            if(this._downSlopeCollisionCount ==  this.collisionLandCount){
                                for(let len  = this._collisionDownSlopsNode.length, i = 0; i < len; i++){
                                  let node = this._collisionDownSlopsNode[i];
                                  let worldBox = node.getBoundingBoxToWorld();
                                  let boundBox = cc.rect(worldBox.center.x, worldBox.center.y,  worldBox.width, worldBox.height);
                                  if(boundBox.xMin <= this.node.x && boundBox.xMax >= this.node.x){
                                      let posY =  boundBox.yMin + boundBox.xMax - this.node.x;
                                      if(this.node.y <= posY){
                                          this.landY = posY;
                                          isConditionSucc = true;
                                      }
                                      break;
                                  }
                                }
                            }

                            //在坡顶或者坡底
                            if(this.collisionLandCount > this._downSlopeCollisionCount){
                                let currPlaceNode = null;
                                for(let i = 0, len = this._collisionNode.length; i < len; i++){
                                    let node = this._collisionNode[i];
                                    let worldBox = node.getBoundingBoxToWorld();
                                    let boundBox = cc.rect(worldBox.center.x, worldBox.center.y,  worldBox.width, worldBox.height);
                                    if(boundBox.xMin <= this.node.x && boundBox.xMax >= this.node.x){
                                        currPlaceNode = node;
                                        break;
                                    }
                                }

                                if(this._collisionDownSlopsNode.indexOf(currPlaceNode) != -1){//有效碰撞在下坡的碰撞器节点
                                    let worldBox = currPlaceNode.getBoundingBoxToWorld();
                                    let boundBox = cc.rect(worldBox.center.x, worldBox.center.y,  worldBox.width, worldBox.height);
                                    let startX = boundBox.xMin;
                                    let offsetX = this.node.x - startX;
                                    let posY = boundBox.y + offsetX;
                                    if(this.node.y <= posY){
                                        isConditionSucc = true;
                                        this.landY = posY;
                                    }
                                }else{//有效碰撞在坡顶或者坡底
                                    isConditionSucc = true;
                                    this.landY = currPlaceNode.y + currPlaceNode.height;
                                }
                            }
                        }
                    }
                }
                isConditionSucc && this._stateMachine.handleEvent(element);
            });
        }
        this._execStateEvents.length = 0;
        //当与地形碰撞器的计数为零的时候，说明可以自由落体了
        if(this.collisionLandCount === 0 && (this._stateMachine.getCurrState() instanceof RunState)){
            this._stateMachine.handleEvent("doDown");
        }
    }

    onCollisionEnter(other: cc.Collider, self: cc.Collider){
        if(!this._isActive) return;
        if(this._isPaused) return;
        //与地形的碰撞
        if(other.node.groupIndex === GROUPS_OF_NODE.LAND && self.tag === RoleColliderType.LAND){
            if(self.node.y <= other.node.y + other.node.height && (this.jumpSpeed.y <= 0 && other.tag == TERR_TYPE.FLAT) //平地上有效作碰撞的条件(跳跃上升过程中与浮空层的碰撞不算有效碰撞)
                || (other.tag == TERR_TYPE.DOWNGRADE || other.tag == TERR_TYPE.UPSLOPE)  //爬坡阶段的碰撞都是有效碰撞
              ){
                //所有算作有效碰撞的节点，都缓存起来，离开碰撞的时候，再进行移除，防止离开碰撞的时候，移除了无效的碰撞
                if(this.addCollisionNode(other.node)){
                    this.leastLandCollider = other;
                    this.collisionLandCount ++;
                }

                //上坡地形
                if(other.tag == TERR_TYPE.UPSLOPE && this.addCollisionSlopeNode(other.node, true)){
                    this._upSlopseCollisionCount ++;
                }

                //下坡地形
                if(other.tag == TERR_TYPE.DOWNGRADE && this.addCollisionSlopeNode(other.node, false)){
                    this._downSlopeCollisionCount ++;
                }

                //处理浮空层速降的时候被弹回的情况
                if(this.isFastDownFromHighLand && this.fastDownFromHeight != -1 && other.node.y + other.node.height == this.fastDownFromHeight){
                    return;
                }

                //跳跃状态或者速降状态转换为跑状态
                if(!(this._stateMachine.getCurrState() instanceof RunState) && !(this._stateMachine.getCurrState() instanceof IdelState) &&
                    (other.tag == TERR_TYPE.FLAT)   //平地落地
                    || (other.tag == TERR_TYPE.UPSLOPE &&   this.jumpSpeed.y <= ParkourScene.getInstance().getMapTerrManager().getMoveSpeedX()) //碰到上坡的碰撞体,y轴速度小于当前地形的推进速度，必须落地
                    || (other.tag == TERR_TYPE.DOWNGRADE && this.jumpSpeed.y <= 0) //碰到下坡的碰撞体，y轴速度不大于0就可落地了
                  ){
                    this.addStateEvents('doRun');
                }
            }
        }

        //与子弹的碰撞
        if(this.isInView() && other.node.groupIndex === GROUPS_OF_NODE.BULLET && self.tag === RoleColliderType.NORMAL){
            if(other.node.parent.name == "bullet"){
                let bulletComp = other.node.parent.getComponent(ItemBullet);
                if(!bulletComp) return;
                //怪物被子弹击中了
                if(bulletComp.getBulletOwnerType() == ParkourBulletOwnerType.Player){
                    let damage = bulletComp.bullet.damage;
                    !this._monsterInfo.isBoss() && (this.hpBar.node.active = true);
                    this.updateHP(-damage, true);
                    if(this._attackedEffect){
                        this._attackedEffect.stop();
                        this._attackedEffect = null;
                    }

                    this.skeletonComp.node.color = cc.Color.fromHEX(cc.Color.clone(cc.Color.WHITE), '#9C9C9C');
                    this._attackedEffect =  cc.tween(this.skeletonComp.node).delay(0.1).call(() => {
                        this.skeletonComp.node.color = cc.Color.WHITE;
                        this._attackedEffect = null;
                    }, this).start();

                }
            }
        }
    }

    isInView(){
      let selfBox = this.node.getBoundingBoxToWorld();
      let halfWidth = this.node.width >> 1, halfHeight = this.node.height >> 1;
      return selfBox.xMax - halfWidth <= cc.winSize.width && selfBox.xMin + halfWidth >= 0 && selfBox.yMax - halfHeight <= cc.winSize.height && selfBox.yMin + halfHeight >= 0;
    }

    onCollisionStay(other: cc.Collider, self: cc.Collider){
        if(!this._isActive) return;
        if(this._isPaused) return;
        //与地形的碰撞
        if(other.node.groupIndex === GROUPS_OF_NODE.LAND && self.tag === RoleColliderType.LAND){
          //下落阶段
          if((self.node.y <= other.node.y + other.node.height && this.collisionLandCount > 0) &&
              (this.jumpSpeed.y <= 0 && other.tag == TERR_TYPE.FLAT)//平地状态下的落地
              || (other.tag == TERR_TYPE.UPSLOPE || other.tag == TERR_TYPE.DOWNGRADE) //爬坡
            ){
              //处理浮空层速降的时候被弹回的情况
              if(this.isFastDownFromHighLand && this.fastDownFromHeight != -1 && other.node.y + other.node.height == this.fastDownFromHeight){
                  return;
              }

              //处理贴着地面冲刺结束后，由于碰撞从未终止过，冲刺结束后转换到jump状态，不会触发enter,从而不能从jump转换到run
              if(!(this._stateMachine.getCurrState() instanceof RunState) && !(this._stateMachine.getCurrState() instanceof IdelState) &&
                  (other.tag == TERR_TYPE.FLAT)   //平地落地
                  || (other.tag == TERR_TYPE.UPSLOPE &&   this.jumpSpeed.y <= ParkourScene.getInstance().getMapTerrManager().getMoveSpeedX()) //碰到上坡的碰撞体,y轴速度小于当前地形的推进速度，必须落地
                  || (other.tag == TERR_TYPE.DOWNGRADE && this.jumpSpeed.y <= 0) //碰到下坡的碰撞体，y轴速度不大于0就可落地了
              ){
                  this.addStateEvents('doRun');
              }
          }
      }
    }

    onCollisionExit(other: cc.Collider, self: cc.Collider){
        if(!this._isActive) return;
        if(this._isPaused) return;

        //与地形的碰撞
        if(other.node.groupIndex == GROUPS_OF_NODE.LAND && self.tag === RoleColliderType.LAND){
          if(this.collisionLandCount > 0){
              //离开碰撞,移除缓存的碰撞节点
              if(this.removeCollisionNode(other.node)){
                  this.collisionLandCount --;
              }

              //上坡地形
              if(other.tag == TERR_TYPE.UPSLOPE && this.removeCollisionSlopeNode(other.node, true)){
                  this._upSlopseCollisionCount --;
              }

              //下坡地形
              if(other.tag == TERR_TYPE.DOWNGRADE && this.removeCollisionSlopeNode(other.node, false)){
                  this._downSlopeCollisionCount --;
              }
          }
      }
    }

    //移除斜坡碰撞节点
    removeCollisionSlopeNode(node: cc.Node, isUpSlope: boolean): boolean{
        if(!node || !cc.isValid(node)) return false;
        if(isUpSlope){
            if(this._collisionUpSlopsNode.length == 0) return false;
            let removeIdx = this._collisionUpSlopsNode.indexOf(node);
            if(removeIdx != -1){
                this._collisionUpSlopsNode.splice(removeIdx , 1);
                return true;
            }
            return false;
        }else{
            if(this._collisionDownSlopsNode.length == 0) return false;
            let removeIdx = this._collisionDownSlopsNode.indexOf(node);
            if(removeIdx != -1){
                this._collisionDownSlopsNode.splice(removeIdx , 1);
                return true;
            }
            return false;
        }
    }

    //添加斜坡碰撞节点
    addCollisionSlopeNode(node: cc.Node, isUpSlope: boolean): boolean{
        if(!node || !cc.isValid(node)) return false;
        if(isUpSlope){
            let idx = this._collisionUpSlopsNode.indexOf(node);
            if(idx != -1) return false;
            this._collisionUpSlopsNode.push(node);
            this._collisionUpSlopsNode.sort((a, b) =>{
                return a.x - b.x;
            });
            return true;
        }else{
            let idx = this._collisionDownSlopsNode.indexOf(node);
            if(idx != -1) return false;
            this._collisionDownSlopsNode.push(node);
            this._collisionDownSlopsNode.sort((a, b) => {
                return a.x - b.x;
            });
            return true;
        }
    }

    //所有算作与地面碰撞的节点，添加到数组中
    addCollisionNode(node: cc.Node){
        if(!node || !cc.isValid(node)) return false;
        let idx = this._collisionNode.indexOf(node);
        if(idx != -1) return false;
        this._collisionNode.push(node);
        this._collisionNode.sort((a, b) => {
            return a.x - b.x;
        })
        return true;
    }

    //所有算作与地面碰撞的节点，从数组中移除
    removeCollisionNode(node: cc.Node){
        if(!node || !cc.isValid(node)) return false;
        if(this._collisionNode.length == 0) return false;
        let removeIdx = this._collisionNode.indexOf(node);
        if(removeIdx != -1){
            this._collisionNode.splice(removeIdx , 1);
            return true;
        }
        return false;
    }

    //添加状态切换的事件，在lateUpdate中会执行事件队列中的事件，事件不重复
    addStateEvents(event: string){
        if(!event || event.length == 0 || this._execStateEvents.indexOf(event) != -1) return;
        this._execStateEvents.push(event);
    }

    unuse(){
        this.deInit();
    }

    reuse(...rest: any[]){
        let startPos = rest[0];
        this.onInit(startPos, ...(rest.slice(1)));
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

    //是否可以出场了，已经出场的不能再次出场，没有到出场时机的不能出场
    checkAppearEnable(distance: number): boolean{
        if(distance < 0) return false;
        if(this._isActive) return false;
        return this._startPos.x <= distance;
    }

    //设置怪物的激活状态
    setActive(isActive: boolean = false){
        this._isActive = isActive;
        this._isActive &&  this._doSpineAction(ParkourRoleActions.Run, true, 0, this._getSpineCompleteCb(ParkourRoleActions.Run), this._getSpineCompleteCb(ParkourRoleActions.Run), this._getSpineEndCb(ParkourRoleActions.Run));
        this._tree && (this._tree.active = isActive);
        this._isActive && this._initCollision(false);
        if(this._stateMachine.getCurrState() instanceof IdelState){
            this._stateMachine.handleEvent("doRun");
        }
    }

    getMonsterInfo(){
        return this._monsterInfo;
    }

    /**
     * 设置角色的spine资源
     */
    private _init(monsterID: number){
        let config = configUtils.getRunXMonsterCfg(monsterID);
        if(!config) {
            cc.warn(`缺少怪物配置：monsterID:${monsterID}`);
            return;
        };
        if(!this._monsterInfo){
            this._monsterInfo = new MonsterInfo(config);
        }
        this._monsterInfo.currHp = this._monsterInfo.maxHp;
        this._monsterInfo.deadType = MonsterDeadType.None;
        this.updateHP();
        this.hpEffect.width = this.hpBar.totalLength;
        this.hpEffect.active = true;
        this.hpBar.node.active = false;

        this.skeletonComp.skeletonData = null
        let modelConfig = configUtils.getModelConfig(config.ArtID);
        let modelName = modelConfig && modelConfig.ModelAttack;    //默认的模型
        let scale = modelConfig && modelConfig.ModelRunSize;
        if(!modelConfig){
            cc.warn('ParkourMonster', `MonsterID ${monsterID} has not model data!!!`);
            return;
        }
        this.skeletonComp.node.scale = scale/10000;
        let spineData = parkourSpineCache.getSpineData(getParkRoleSpinePath(modelName));
        this.skeletonComp.skeletonData = spineData;
        this.skeletonComp.node.scaleX > 0 && (this.skeletonComp.node.scaleX = -this.skeletonComp.node.scaleX);

        let colliderSizeDesc = modelConfig.ModelRunBossRange;
        let colliderSizeArr = colliderSizeDesc.split(';');
        let colliders = this.node.getComponents(cc.BoxCollider);
        colliders.forEach(ele => {
            if(ele.tag == RoleColliderType.NORMAL){
                ele.size.width = parseInt(colliderSizeArr[0]);
                ele.size.height = parseInt(colliderSizeArr[1]);
                ele.offset.y = parseInt(colliderSizeArr[1]) >> 1;
            }
        });
        //检查地形碰撞器是否有效，一个怪物的所有动作序列只有全部有效或者全部无效两种状态
        this._isCollisionEnable = configUtils.getRunXMonsterActionCfg(config.RunXMonsterAction)[0].CollisionType == ParkourMonsterMoveType.Collision;
        if(!this._tree){
            this._tree = new MonsterBT(monsterID, config.RunXMonsterAction);
            this._treeTarget = {target: this.node};
        }
        this._blackboard = new b3.Blackboard();
    }

    private _doSpineAction(animName: string, isLoop: boolean = false, trackIdx: number = 0, completeCb: Function = null, startCb: Function = null, endCb: Function = null){
        let skeletonComp = this.skeletonComp
        skeletonComp.setStartListener(startCb);
        skeletonComp.setEndListener(endCb);
        skeletonComp.setCompleteListener(completeCb);
        skeletonComp.setAnimation(trackIdx, animName, isLoop);
    }

    //射击
    doShoot(idx: number, bulletID: number, bulletGroudId: number){
        if(this._isPaused) return;
        if(this._monsterInfo.isDead()) return;

        let groupInfo = bulletGroupCfgManager.getBulletGroupCfg(bulletGroudId);
        let bulletInfo = groupInfo.bullets[idx];
        let startPos = cc.v2();
        if(bulletInfo.attachType === BULLET_ATTACH_TYPE.ROLE){
            startPos = this.node.convertToWorldSpaceAR(startPos);
        }

        let damage = this._monsterInfo.damage;
        let bullet = bulletPoolManager.get(bulletID, startPos, damage, bulletInfo);
        if(!bullet) return;
        bullet.getComponent(ItemBullet).setBulletOwnerType(ParkourBulletOwnerType.Monster);
        eventCenter.fire(parkourEvent.SHOOT, bullet);
    }

    updateHP(offsetHp: number = 0, useEffect: boolean = false){
        this._monsterInfo.currHp += offsetHp;
        if(!this._isActive) return;
        if(this._monsterInfo.isBoss()){
            ParkourScene.getInstance().getUILayerComp().getProgressView().bossHPView.updateHP();
            return;
        };
        this.hpBar.progress = this._monsterInfo.currHp / this._monsterInfo.maxHp;
        this._effectTargetWidth = this.hpBar.progress * this.hpBar.totalLength;
        if(!useEffect) {
            this.hpEffect.width =  this._effectTargetWidth;
            return;
        }
        this._updateHPEffect();
    }

    private _updateHPEffect(){
      if(this._effectTween) return;
      let tween = cc.tween().delay(0).call(() =>{
          this.hpEffect.width = cc.misc.lerp(this.hpEffect.width, this._effectTargetWidth, HP_BAR_LERP_RATIO);
          if(Math.abs(this.hpEffect.width - this._effectTargetWidth) <= HP_BAR_LERP_MIN_TRRESSHOLD){
              cc.Tween.stopAllByTarget(this.hpEffect);
              this.hpEffect.width = this._effectTargetWidth;
              this._effectTween = null;
          }
      }, this);
      this._effectTween = cc.tween(this.hpEffect).repeatForever(tween).start();
  }

    getCurrState(): BaseState{
        if(!this._stateMachine) return null;
        return this._stateMachine.getCurrState();
    }

    //上跳
    goUp(){
        if(this._monsterInfo.isDead()) return;
        if(!this._isActive) return;
        if(this._isPaused) return;
        this._stateMachine.handleEvent("doJump");
    }

    //下跳
    goDown(){
        if(this._monsterInfo.isDead()) return;
        if(!this._isActive) return;
        if(this._isPaused) return;
        this._stateMachine.handleEvent("doFastDown");
    }

    //怪物执行指定的spine动作
    setAction(actionInfo: ActionInfo, ...params:any[]){
        if(!actionInfo) return;
        if(actionInfo.name == ParkourRoleActions.DoubleJump || actionInfo.name == ParkourRoleActions.FastDown || actionInfo.name == ParkourRoleActions.AutoDown){
            return;
        }
        this._doSpineAction(actionInfo.name, actionInfo.loop || false, actionInfo.trackIdx, this._getSpineCompleteCb(actionInfo.name), this._getSpineCompleteCb(actionInfo.name), this._getSpineEndCb(actionInfo.name));
    }

    //是否在地形基础层
    isPlaceBaseLand() : boolean{
      if(!cc.isValid(this.leastLandCollider.node) || !cc.isValid(this.leastLandCollider.node.parent)){
          cc.warn('isPlaceBaseLand : 碰撞节点或者其父节点异常！！！');
          return false;
      }

      let terrCollisionComp = this.leastLandCollider.getComponent(TerrCollisionComp);
      if(!terrCollisionComp){
          cc.warn('isPlaceBaseLand : 碰撞节点没有挂载TerrCollisionComp');
          return false;
      }

      let tiledShadeInfo = terrCollisionComp.getTiledShadeInfo();
      let tiledMap = this.leastLandCollider.node.parent.getComponent(cc.TiledMap);
      let layer = tiledMap.getLayer(TERR_LAYER.SHADE);
      let height = layer.getLayerSize().height;
      let nextY = -1;
      for(let i = tiledShadeInfo.startTileInfo.y + 1; i < height; i++){
          if(layer.getTileGIDAt(tiledShadeInfo.startTileInfo.x, i) != 0){
              nextY = i;
              break;
          }
      }
      let isBaseLand = false;
      if(nextY == -1){
          isBaseLand = true;
      }
      return  isBaseLand;
    }

    goDie(){
        this.hpBar.node.active = false;
        if(this._monsterInfo.stepDropItems && this._monsterInfo.stepDropItems.length > 0){
            this.gengerateReward(this._monsterInfo.reward, RewardAninType.StepDrop);
        }
        //正常生命到达时限，不触发掉落奖励
        if(this._monsterInfo.deadType != MonsterDeadType.NoLife && this._monsterInfo.deadType != MonsterDeadType.None &&this._monsterInfo.reward && this._monsterInfo.reward.length > 0){
            this.gengerateReward(this._monsterInfo.reward);
            this._playBoomAnin();
        }

        this._doSpineAction(ParkourRoleActions.Die, false, 0, this._getSpineCompleteCb(ParkourRoleActions.Die), this._getSpineCompleteCb(ParkourRoleActions.Die), this._getSpineEndCb(ParkourRoleActions.Die));
    }

    private _playBoomAnin(){
        let animClipCache = ParkourScene.getInstance().getAnimClipCache();
        let clip = animClipCache.getClip(lazyLoadRes[ParkourLazyLoadType.AnimClip]['MonsterBoom']);
        let boomEft = ParkourScene.getInstance().getEffectLayerComp().getEffectNode(true, clip, null, this);
        boomEft.setPosition(this.node.x, this.node.y + (this.node.height >> 1));
    }

    gengerateReward(itemInfo: data.IItemInfo[], dropType: RewardAninType = RewardAninType.Circle){
        let pos = this.node.parent.convertToWorldSpaceAR(this.node.getPosition());
        pos.y += this.node.height >> 1;
        eventCenter.fire(parkourEvent.PRODUCT_ITEM, pos, itemInfo, dropType, this);
    }

    private _getSpineEndCb(animName: string){
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
                this.forceRecycle();
            }
        }
        return null;
    }

    private _getSpineStartCb(animName: string){
        return null;
    }

    getWeight(): number{
        return ItemWeights.MONSTER;
    }

    //强制回收
    forceRecycle(){
        this.setActive(false);
        this.skeletonComp.clearTracks();
        monsterPoolManager.put(this._monsterInfo.ID, this.node);
    }
}

//阶段性掉落道具的数据结构
interface StepDropItemCfg{
    condition?: number,
    isTrig?: boolean,
    items?:data.IItemInfo[]
}

//怪物死亡方式
enum MonsterDeadType{
    None = 0,
    BeAttack, //被打死
    NoLife,   //生命周期结束
    CleanUp,  //清洗
}

class MonsterInfo{
    //怪物ID
    private _monsterID: number;
    //最大血量
    private _maxHp: number;
    //当前血量
    private _currHp: number;
    //死亡掉落
    private _reward: data.IItemInfo[];
    //怪物类型，1:小怪  2:boss
    private _type: number = 0;
    //攻击力
    private _damage: number = 0;
    //阶段性掉落
    private _middleDropItem: Map<number, StepDropItemCfg> = null;
    //死亡时的小掉落（一般boss有的类型）
    private _stepDropItems: data.IItemInfo[] = null;
    private _dieType: MonsterDeadType = MonsterDeadType.None;

    constructor(config?: cfg.RunXMonster){
        if(!config) return;
        this._monsterID = config.MonsterID;
        this._maxHp = config.Blood;
        this._currHp = config.Blood;
        config.Item && (this._reward = utils.parseStr2Iteminfo(config.Item));
        if(config.RunXMonsterBossMiddleDrop){
            this._middleDropItem = this._middleDropItem || new Map<number, StepDropItemCfg>();
            utils.parseStingList(config.RunXMonsterBossMiddleDrop, (data: any[]) => {
                let condition = parseInt(data[0]) / 10000;
                let itemID = parseInt(data[1]);
                let itemCount = parseInt(data[2]);
                if(!this._middleDropItem.has(condition)){
                    this._middleDropItem.set(condition, {condition: condition, isTrig: false, items: []});
                }
                let dropCfgs = this._middleDropItem.get(condition).items;
                dropCfgs.push({ID: itemID, Count: itemCount});
            });
        }
        config.RunXMonsterBossDrop && (this._stepDropItems = utils.parseStr2Iteminfo(config.RunXMonsterBossDrop));
        this._type = config.MonsterType;
        this._damage = config.Damage;
    }

    get type(): number{
        return this._type;
    }

    get middleDropItem(): Map<number, StepDropItemCfg>{
        return this._middleDropItem;
    }

    get stepDropItems(): data.IItemInfo[]{
        return this._stepDropItems;
    }

    get damage(): number{
        return this._damage;
    }

    get reward(): data.IItemInfo[]{
        return this._reward;
    }

    set currHp(_hp: number){
        _hp = Math.max(0, _hp);
        _hp = Math.min(_hp, this._maxHp);
        this._currHp = _hp;
    }

    get currHp(): number{
        return this._currHp;
    }

    get maxHp(): number{
        return this._maxHp;
    }

    set maxHp(hp){
      this._maxHp = hp;
    }

    get ID(): number{
        return this._monsterID;
    }

    set deadType(deadType: MonsterDeadType){
        this._dieType = deadType;
    }

    get deadType(): MonsterDeadType{
        return this._dieType;
    }

    isBoss(): boolean{
        return this._type == ParkourMonsterType.Boss;
    }

    isDead(): boolean{
        return this._maxHp > 0 && this._currHp <= 0;
    }
}
export {
  MonsterInfo,
  MonsterDeadType
}
