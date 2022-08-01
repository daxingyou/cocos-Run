/*
 * @Description:跑酷玩家组件，响应输入
 * @Version: 1.0
 * @Autor: lixu
 * @Date: 2021-06-16 09:26:55
 * @LastEditors: lixu
 * @LastEditTime: 2021-11-15 12:25:35
 */

import { eventCenter } from "../../../common/event/EventCenter";
import { parkourEvent } from "../../../common/event/EventData";
import { CameraConfig, GROUPS_OF_NODE, parkourConfig, ParkourLazyLoadType, RoleColliderType, TERR_LAYER, TERR_TYPE } from "./ParkourConst";
import { ActorManager } from "./ActorManager";
import { BaseState, DieState, FastDownState, IdelState, JumpState, RunState, SprintState, StateContext } from "./StateModule";
import RoleLayerComp from "./RoleLayerComp";
import { ActionInfo } from "./RoleFollowComp";
import { ParkourBuffType } from "../../template/Role";
import { ParkourScene } from "../view-scene/ParkourScene";
import RoleLogicComp from "./RoleLogicComp";
import TerrCollisionComp from "./terr/TerrCollisionComp";
import { lazyLoadRes } from "./ParkourString";

const {ccclass, property} = cc._decorator;

const EnterSceneSpeedX = 300;

@ccclass
export default class PlayerMoveComp extends cc.Component {
    //角色的正常位置
    private _normalPos: cc.Vec2 =  parkourConfig.actorPos;
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
    //角色的状态机，进行角色状态的转换
    stateMachine: StateContext<PlayerMoveComp> = null;
    //角色当前的加速度
    currAddSpeed : cc.Vec2 = parkourConfig.addSpeed;
    //角色是否已经通关
    isPass : boolean = false;
    //当前角色是否已经通关并且退出场景
    isFinish: boolean = false;
    //是否暂停角色的逻辑帧
    private _isPaused: boolean = false;
    //角色已经开始移动
    private _isStart: boolean = false;
    //是否从高层地形速降
    isFastDownFromHighLand: boolean  = false;
    //进行速降时所处的高度，用来判定速降过程中与同一层的碰撞器发生碰撞时被反弹回去
    fastDownFromHeight: number = -1;

    //冲刺的时候，目标位置高度(第一顺位冲刺状态下的y轴位置)
    chongCiPosY: number = -1;

    private _controllor: RoleLayerComp = null;

    private _currAction: ActionInfo = null;
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
    //是否正处于自动模式
    private _isAutoPlay: boolean = false;

    private _autoPlayInterval: number = 0;

    private _chongCiEft: cc.Node = null;  //冲刺特效

    setAction(action: ActionInfo){
        this._currAction = action;
    }

    //设置自动模式
    setAutoPlay(isAuto: boolean){
        this._isAutoPlay = isAuto;
        this._autoPlayInterval = 0;
    }

    /**
     * 角色的正常位置，根据第一顺位的位置和角色当前的顺位自动调整
     */
    get normalPos(): cc.Vec2{
        return cc.v2(this._normalPos.x, this._normalPos.y);
    }

    onInit(controllor: RoleLayerComp){
        this._controllor = controllor;
        this.isFinish = this.isPass = false;
        //增加团队buff的回调
        ActorManager.getInstance().setPlayerController(this);
        this._setColliderValid(false);
        this._initStateMachine();
    }

    deInit(){
        this._clear();
        this._setColliderValid(false);
        cc.isValid(this._chongCiEft) && (ParkourScene.getInstance().getEffectLayerComp().removeEffectNode(this._chongCiEft));
        this._chongCiEft = null;
        ActorManager.getInstance().clearBuffs();
    }

    private _clear(){
        this.jumpCount = 0;
        this.jumping = false;
        this.collisionLandCount = 0;
        this.leastLandCollider = null;
        this.landY = 0;
        this.jumpSpeed.x = this.jumpSpeed.y = 0;
        this._isStart = false;
        this.setPaused(false);
        this.isFastDownFromHighLand = false;
        this.fastDownFromHeight = -1;
        this.chongCiPosY = -1;
        this._currAction = null;
        this._upSlopseCollisionCount = 0;
        this._downSlopeCollisionCount = 0;
        this._collisionDownSlopsNode && (this._collisionDownSlopsNode.length = 0);
        this._collisionUpSlopsNode && (this._collisionUpSlopsNode.length = 0);
        this._collisionNode && (this._collisionNode.length = 0);
        this._execStateEvents && (this._execStateEvents.length = 0);
        this._isAutoPlay = false;
        this._autoPlayInterval = 0;
    }

    onRelease(){
        ActorManager.getInstance().setPlayerController(null);
        this._controllor = null;
        this._normalPos = null;
        this.jumpSpeed = null;
        this.currAddSpeed = null;
        this._collisionUpSlopsNode = null;
        this._collisionDownSlopsNode = null;
        this._collisionNode = null;
        this._execStateEvents = null;
        this.stateMachine.release();
        this.stateMachine = null;
    }

    /**
     * 初始化角色的状态机，及设置起始状态
     */
     private _initStateMachine (){
        if(!this.stateMachine){
            let stateArr = [];
            stateArr.push(new IdelState("idel"));
            stateArr.push(new RunState("run"));
            stateArr.push(new JumpState("jump"));
            stateArr.push(new FastDownState("fastDown"));
            stateArr.push(new SprintState("sprint"));
            stateArr.push(new DieState("die"));
            this.stateMachine = new StateContext<PlayerMoveComp>(this);
            this.stateMachine.init(stateArr, stateArr[0]);
            return;
        }
        this.stateMachine.changeState(this.stateMachine.getState('idel'));
    }

    private _setColliderValid(isValid: boolean){
        let colliders = this.node.getComponents(cc.BoxCollider);
        colliders.forEach((ele) => {
          ele.tag == RoleColliderType.LAND && (ele.enabled = isValid);
        });
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

    /**
     * 设置是否暂停，PS:只是暂停角色逻辑帧，并不会暂停渲染帧
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

    /**
     * 开始游戏，角色入场
     */
    realStart(){
        this._isStart = true;
        this._setColliderValid(true);
        this.jumpSpeed.x = EnterSceneSpeedX;
        this.node.setPosition(cc.v2(0, this.normalPos.y));
    }

    /**
     * 执行下跳操作，所有角色死亡或者通关之后不再响应
     * @returns
     */
    public goDown (){
        if(ActorManager.getInstance().isAllRoleDead()) return;
        if(!this._isStart) return;
        if(this._isPaused) return;
        if(this.stateMachine.getCurrState() instanceof SprintState) return;
        if(this.isPass) return;
        this.stateMachine.handleEvent("doFastDown");
    }

    /**
     * 执行上跳操作，角色死亡或者通关之后不再响应
     * @returns
     */
    public goUp() {
        if(ActorManager.getInstance().isAllRoleDead()) return;
        if(!this._isStart) return;
        if(this._isPaused) return;
        if(this.stateMachine.getCurrState() instanceof SprintState) return;
        if(this.isPass) return;
        this.stateMachine.handleEvent("doJump");
    }

    /**
     * 设置角色为通关状态，通关之后，不再响应玩家的输入事件
     */
    public levelFinish () {
        this.isPass = true;
        this.stateMachine.handleEvent("doPass");
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
        if(this.isFinish) return;
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

                //冲刺状态不做处理
                if(this.stateMachine.getCurrState() instanceof SprintState) return;
                //处理浮空层速降的时候被弹回的情况
                if(this.isFastDownFromHighLand && this.fastDownFromHeight != -1 && other.node.y + other.node.height == this.fastDownFromHeight){
                    return;
                }

                //跳跃状态或者速降状态转换为跑状态
                if(!(this.stateMachine.getCurrState() instanceof RunState) && !(this.stateMachine.getCurrState() instanceof IdelState) &&
                    (other.tag == TERR_TYPE.FLAT)   //平地落地
                    || (other.tag == TERR_TYPE.UPSLOPE &&   this.jumpSpeed.y <= ParkourScene.getInstance().getMapTerrManager().getMoveSpeedX()) //碰到上坡的碰撞体,y轴速度小于当前地形的推进速度，必须落地
                    || (other.tag == TERR_TYPE.DOWNGRADE && this.jumpSpeed.y <= 0) //碰到下坡的碰撞体，y轴速度不大于0就可落地了
                  ){
                    this.addStateEvents('doRun');
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
        if(this.isFinish) return;
        //与地形的碰撞
        if(other.node.groupIndex === GROUPS_OF_NODE.LAND && self.tag === RoleColliderType.LAND){
            //下落阶段
            if((self.node.y <= other.node.y + other.node.height && this.collisionLandCount > 0) &&
                (this.jumpSpeed.y <= 0 && other.tag == TERR_TYPE.FLAT)//平地状态下的落地
                || (other.tag == TERR_TYPE.UPSLOPE || other.tag == TERR_TYPE.DOWNGRADE) //爬坡
              ){
                //冲刺状态不做处理
                if(this.stateMachine.getCurrState() instanceof SprintState) return;
                //处理浮空层速降的时候被弹回的情况
                if(this.isFastDownFromHighLand && this.fastDownFromHeight != -1 && other.node.y + other.node.height == this.fastDownFromHeight){
                    return;
                }

                //处理贴着地面冲刺结束后，由于碰撞从未终止过，冲刺结束后转换到jump状态，不会触发enter,从而不能从jump转换到run
                if(!(this.stateMachine.getCurrState() instanceof RunState) && !(this.stateMachine.getCurrState() instanceof IdelState) &&
                    (other.tag == TERR_TYPE.FLAT)   //平地落地
                    || (other.tag == TERR_TYPE.UPSLOPE &&   this.jumpSpeed.y <= ParkourScene.getInstance().getMapTerrManager().getMoveSpeedX()) //碰到上坡的碰撞体,y轴速度小于当前地形的推进速度，必须落地
                    || (other.tag == TERR_TYPE.DOWNGRADE && this.jumpSpeed.y <= 0) //碰到下坡的碰撞体，y轴速度不大于0就可落地了
                ){
                    this.addStateEvents('doRun');
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
    onCollisionExit(other: cc.Collider, self: cc.Collider) {
        if(!this._isStart) return;
        if(this._isPaused) return;
        if(this.isFinish) return;
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

    //对于碰撞监听器和update同时使用的时候，组件的update会先被调用，然后再调用组件上的碰撞回调,因此不要在update中切换角色的状态,因为比collider的触发延迟
    update(dt: number){
        this._execStateEvents.length = 0;
        if(!this._isStart) return;
        if(this._isPaused) return;
        if(this.isFinish) return;
        //当所有角色死亡的时候，暂停更新
        if(ActorManager.getInstance().isAllRoleDead()) return;
        //冲刺状态下y轴匀速运动到目标位置
        if((this.stateMachine.getCurrState() instanceof SprintState)){
            this.node.x += this.jumpSpeed.x * dt;
            if(this.node.x >= cc.winSize.width / 2){
                this.node.x = cc.winSize.width / 2;
                this.jumpSpeed.x = 0;
            }

            this.node.y += this.jumpSpeed.y *dt;
            //向下靠拢目标
            if(this.jumpSpeed.y < 0 && this.node.y <= this.chongCiPosY){
                this.node.y = this.chongCiPosY;
                this.jumpSpeed.y = 0;
            }

            //向上靠拢目标
            if(this.jumpSpeed.y > 0 && this.node.y >= this.chongCiPosY){
                this.node.y = this.chongCiPosY;
                this.jumpSpeed.y = 0;
            }
            return;
        }

        if(this.jumping){
            //速降状态是匀速下落的，因此在速降状态下不改变下落速度
            if(!(this.stateMachine.getCurrState() instanceof FastDownState)){
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

        //x轴的位移
        if(this.jumpSpeed.x != 0){
            this.node.x += this.jumpSpeed.x * dt;
            if(this.isPass){
                if(this.node.x >= cc.winSize.width + 300){
                    this.isFinish = true;
                    eventCenter.fire(parkourEvent.SHOW_RESULT, true); //发送通关事件
                }
            }else{
                if(this.node.x <= this.normalPos.x && this.jumpSpeed.x < 0){ //向左运动
                    this.node.x = this.normalPos.x;
                    this.jumpSpeed.x = 0;
                }else if(this.node.x >= this.normalPos.x && this.jumpSpeed.x > 0){//向右移动
                    this.node.x = this.normalPos.x;
                    this.jumpSpeed.x = 0;
                }
                //update中的状态切换的特例,只是做初始状态的切换
                if(this.stateMachine.getCurrState() instanceof IdelState && this.jumpSpeed.x === 0){
                    this.stateMachine.handleEvent("doRun");
                }
            }
        }

        if(this.stateMachine.getCurrState() instanceof RunState){
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

        this.node.y < 0 && (this.node.y = 0);
    }

    lateUpdate(dt: number){
        if(!this._isStart) return;
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
                isConditionSucc && this.stateMachine.handleEvent(element);
            });
        }
        this._execStateEvents.length = 0;
        if(this.isFinish) return;
        //当与地形碰撞器的计数为零的时候，说明可以自由落体了
        if(this.collisionLandCount === 0 && (this.stateMachine.getCurrState() instanceof RunState)){
            this.stateMachine.handleEvent("doDown");
        }
        //规避下到坡底的时候或者上到坡顶的时候没有紧贴地面
        if(this.collisionLandCount > 0 && this._upSlopseCollisionCount == 0 && this._downSlopeCollisionCount == 0  && this.stateMachine.getCurrState() instanceof RunState){
            this.node.y = this._collisionNode[0].y + this._collisionNode[0].height;
        }
        this._controllor && this._controllor.autoCaptureFollowInfo(dt);
        this._currAction = null;
        this.checkCamera(dt);
        if(!this._isAutoPlay) return;
        this._autoPlayInterval -= dt;
        if(this._autoPlayInterval <= 0){
            this._autoPlayInterval = parkourConfig.AutoPlayTickInterval;
            this._updateAutoPlayArea();
            this._autoPlay();
        }
    }

    getCurrState(): BaseState{
        if(!this.stateMachine) return null;
        return this.stateMachine.getCurrState();
    }

    getCurrActionInfo(): ActionInfo{
        return this._currAction;
    }

    //开始冲刺
    processChongCi(time: number): boolean{
        //通关状态下不再响应冲刺
        if(this.isPass) return false;
        this.stateMachine.handleEvent("doSprint", time);
        return true;
    }

    //处理冲刺
  dealChongCi(time: number){
        if(!cc.isValid(this._chongCiEft)){
          let animClipCache = ParkourScene.getInstance().getAnimClipCache();
          let clip = animClipCache.getClip(lazyLoadRes[ParkourLazyLoadType.AnimClip]['ChongFeng']);
          this._chongCiEft = ParkourScene.getInstance().getEffectLayerComp().getEffectNode(true, clip);
          this._chongCiEft.anchorX = 1;
          let firstRole = ActorManager.getInstance().getFirstRole();
          this._chongCiEft.setPosition(firstRole.node.x + (firstRole.node.width >> 1) + 20, firstRole.node.y + (firstRole.node.height >> 1));
        }
        //y轴方向不做移动了
        this.jumpSpeed.y = 0;
        let chongCiTime = time;  //冲刺动作时长
        this.addBuff(ParkourBuffType.CHONG_CI, chongCiTime, false); //增加冲刺状态
        eventCenter.fire(parkourEvent.MAP_FAST_MOVE);
    }

    //结束冲刺
    endChongCi(){
        this.chongCiPosY = -1;
        if(cc.isValid(this._chongCiEft)){
           ParkourScene.getInstance().getEffectLayerComp().removeEffectNode(this._chongCiEft);
           this._chongCiEft = null;
        }
        eventCenter.fire(parkourEvent.MAP_NORMAL_MOVE);
    }

    //移除团队buff
    removeBuffState(buffType: ParkourBuffType){
        if(buffType == ParkourBuffType.CHONG_CI){
            //结束冲刺
            this._controllor.unExecChongCi();
            this.stateMachine.handleEvent("doSprintEnd");
        }

        if(buffType == ParkourBuffType.RELIVE){
            if(!(this.stateMachine instanceof SprintState) && !this.isPass){
                eventCenter.fire(parkourEvent.MAP_NORMAL_MOVE);
            }
        }
    }

    //更新团队buff
    updateBuffState(buffType: ParkourBuffType){

    }

    /**
     *
     * @param buffType  buff类型
     * @param time      buff持续时间
     * @param isAccumulate  是否累加
     */
    addBuff(buffType: ParkourBuffType, time: number, isAccumulate: boolean){
        eventCenter.fire(parkourEvent.ADD_BUFF, null, buffType, time, isAccumulate, true);
    }

    //移除buffer
    removeBuff(buffType: ParkourBuffType){
        eventCenter.fire(parkourEvent.REMOVE_BUFF, null, buffType, true);
    }

    //复活
    dealRelive(time: number){
        if(this.isPass) return;
        eventCenter.fire(parkourEvent.MAP_FAST_MOVE);
        this.addBuff(ParkourBuffType.RELIVE, time, false); //增加复活状态
        //此处可能需要增加复活位移的动作
    }

    //检测相机移动
    checkCamera(dt: number){
        let gameCamera = ParkourScene.getInstance().getGameCamera();
        let cameraWorldPos = gameCamera.parent.convertToWorldSpaceAR(gameCamera.getPosition());
        let cameraLocalPos = this.node.parent.convertToNodeSpaceAR(cameraWorldPos);

        let disY = cameraLocalPos.y - this.node.y
        if(gameCamera.y >= 0 && Math.abs(disY) > CameraConfig.UP_SCOPE){
            let speed = -disY * 0.8;
            if(speed < 0 && gameCamera.y == 0) return;

            let offsetY = speed * dt;
            let targetY = gameCamera.y + offsetY;
            targetY = Math.max(0, targetY);
            eventCenter.fire(parkourEvent.CAMERA_MOVE, cc.v2(gameCamera.x, targetY));
        }
    }

    //更新自动模式的区域
    private _updateAutoPlayArea(){
        let autoCutLines = ParkourScene.getInstance().getAutoCutLines();
        autoCutLines[0] = 2 * cc.winSize.height;
        let firstRoleComp: RoleLogicComp = ActorManager.getInstance().getFirstRole();
        autoCutLines[3] = this.node.parent.convertToWorldSpaceAR(this.node.getPosition()).y;
        autoCutLines[2] = autoCutLines[3] + firstRoleComp.node.height;
        autoCutLines[1] = autoCutLines[2] + 256;
        autoCutLines[4] = autoCutLines[3] - 196;
        autoCutLines[5] = -2 * cc.winSize.height;
        ParkourScene.getInstance().updateAutoPlayArea();
        ParkourScene.getInstance().getUILayerComp().reDrawAutoPlayRect();
    }

    private _autoPlay(){
        let itemWeights = ParkourScene.getInstance().getMapTerrManager().getItemAndTrapWeight();
        let bulletWeights = ParkourScene.getInstance().getBulletManager().getMonsterBulletWeight();
        let monsterWeights = ParkourScene.getInstance().getMonsterLayerComp().getMonsterWeight();
        if(!itemWeights || !bulletWeights || !monsterWeights) return;

        //Player所在的区间

        let playerIdx: number = Math.floor((parkourConfig.AutoPlayAreas as Array<cc.Rect>).length / 2);
        //计算各区间的权重
        let weights = [];
        let maxWeight: number = NaN;
        let maxWeightIdx = playerIdx;
        let playerWeight = 0;
        for(let i = 0, len = itemWeights.length; i < len; i++){
            weights.push(0);
            weights[i] = itemWeights[i] + bulletWeights[i] + monsterWeights[i];
            i == playerIdx && (playerWeight = weights[i]);
            isNaN(maxWeight) && (maxWeight = weights[i]);
            if(maxWeight <= weights[i]){
                maxWeight = weights[i];
                maxWeightIdx = i;
            }
        }
        //当最大权重和玩家权重相同时, 不进行任何操作
        maxWeight == playerWeight && ( maxWeightIdx = playerIdx);
        //根据Player所在的区间和目标区间，决定Player的操作
        let offset = playerIdx - maxWeightIdx;
        if(offset == 0){
            //玩家区间和目标区间在同一层
        }else if(offset < 0){
            //玩家区间在目标区间的上层，需要速降
            if(this.collisionLandCount > 0 && this.isPlaceBaseLand() && weights[maxWeightIdx] == weights[playerIdx - 1]){
                //特殊情况：如果在最底层，并且上下区间值一样的时候，选择上条
                this.goUp();
            }else{
                this.goDown();
            }
        }else if(offset > 0){
            //玩家区间在目标区间的下层，需要跳跃
            this.goUp();
        }
        ParkourScene.getInstance().getUILayerComp().updateAutoPlayDebugInfo(itemWeights, bulletWeights, monsterWeights, playerIdx);
    }
}
