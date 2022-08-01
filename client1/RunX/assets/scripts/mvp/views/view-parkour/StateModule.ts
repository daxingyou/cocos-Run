import {parkourEvent} from '../../../common/event/EventData';
import {eventCenter} from "../../../common/event/EventCenter";
import {ParkourBuffType} from "../../template/Role";
import {parkourConfig, ParkourRoleActions} from './ParkourConst';
import PlayerMoveComp from './PlayerMoveComp';
import ParkourMonster from './ParkourMonster';

interface BaseState{
    name: string;
    handleEvent(context: any, event: string, ...params: any[]): void;
}

/**
 * 初始状态
 */
class IdelState implements BaseState{
    public name: string = null;
    constructor(name: string){
        this.name = name;
    }

    handleEvent(context: StateContext<PlayerMoveComp> , event: string, ...params: any[]) {
        if(event === "doRun"){
            context.stateObject.currAddSpeed = parkourConfig.addSpeed;
            //进入场景完成，地图开始移动
            context.changeState(context.getState("run"));
            eventCenter.fire(parkourEvent.ACTOR_ENTER_FINISH);
        }
    }
}

/*
 *  跑步状态
 */
class RunState implements BaseState{
    public name: string = null;
    constructor(name: string){
        this.name = name;
    }

    handleEvent(context: StateContext<PlayerMoveComp>, event: string, ...params: any[]) {
        if(event === "doJump"){//跳跃
            if(!context.stateObject.jumping && context.stateObject.jumpCount < parkourConfig.MAX_CONTINUE_JUMP_COUNT){
                context.stateObject.jumping = true;
                context.stateObject.jumpCount += 1;
                context.stateObject.jumpSpeed.y = parkourConfig.jumpStartSpeed.y;
                context.stateObject.landY = 0;  //每次起跳时候，将地面的位置设置为0
                context.changeState(context.getState("jump"));
            }
        }

        if(event === "doDown"){
            if(context.stateObject.collisionLandCount === 0){//走完地面掉下触发自由落体
                context.stateObject.jumping = true;
                context.stateObject.jumpCount += 1;
                context.stateObject.jumpSpeed.y = 0;
                context.stateObject.landY = 0;
                context.changeState(context.getState("jump"));
                context.stateObject.setAction({name: ParkourRoleActions.AutoDown, loop: false});
            }
        }

        if(event === "doFastDown"){ //速降
            if(context.stateObject.isPlaceBaseLand()){//最底层的地面，进行旋转
                context.stateObject.setAction({name: ParkourRoleActions.FastDown});
            }else{
                //在浮空层，进行速降
                context.stateObject.jumpSpeed.y = -parkourConfig.fastDownSpeed;
                context.stateObject.currAddSpeed = cc.v2(0, 0);
                context.stateObject.landY = 0;  //地面设置为零，通过碰撞检测重新确定下层的地面位置
                context.stateObject.isFastDownFromHighLand = true;
                context.stateObject.fastDownFromHeight = context.stateObject.node.y;
                context.changeState(context.getState("fastDown"));
            }
        }

        if(event === "doSprint"){ //冲刺
            if(context.stateObject.isPass) return;
            context.changeState(context.getState("sprint"));
            context.stateObject.dealChongCi(params[0]);
        }

        if(event == "doPass"){
            context.stateObject.jumpSpeed.x = 500;
        }
    }
}

/**
 * 跳跃状态
 */
class JumpState implements BaseState{
    public name: string = null;
    constructor(name: string){
        this.name = name;
    }

    handleEvent(context: StateContext<PlayerMoveComp>, event: string, ...params: any[]) {
        if(event === "doRun"){
            if(context.stateObject.jumping){
                context.stateObject.jumping = false;
                context.stateObject.jumpCount = 0;
                context.stateObject.node.y = context.stateObject.landY;
                context.stateObject.currAddSpeed = parkourConfig.addSpeed;
                context.stateObject.jumpSpeed.y = 0;
                context.changeState(context.getState("run"));
            }
        }

        if(event === "doJump"){//二段跳
            if(context.stateObject.jumping && context.stateObject.jumpCount < parkourConfig.MAX_CONTINUE_JUMP_COUNT){
                context.stateObject.jumpCount ++;
                context.stateObject.jumpSpeed.y = parkourConfig.jumpStartSpeed.y;
                context.stateObject.landY = 0;  //每次起跳时候，将地面的位置设置为0
                context.changeState(context.getState("jump"));
                context.stateObject.setAction({name: ParkourRoleActions.DoubleJump, loop: true});
            }
        }

        if(event === "doFastDown"){ //速降
            //跳跃状态下的速降，地面坐标不能重置为零，因为有可能速降的时候，碰撞已经发生
            context.stateObject.jumpCount = 0;
            context.stateObject.jumpSpeed.y = -parkourConfig.fastDownSpeed;
            context.stateObject.currAddSpeed = cc.v2(0, 0);
            context.changeState(context.getState("fastDown"));
        }

        if(event === "doSprint"){ //冲刺
            if(context.stateObject.isPass) return;
            context.changeState(context.getState("sprint"));
            context.stateObject.dealChongCi(params[0]);
        }

        if(event == "doPass"){
            context.stateObject.jumpSpeed.x = 500;
        }
    }
}

/**
 * 速降状态
 */
class FastDownState implements BaseState{
    public name: string = null;
    constructor(name: string){
        this.name = name;
    }

    handleEvent(context: StateContext<PlayerMoveComp>, event: string, ...params: any[]) {
        if(event === "doRun"){
            context.stateObject.isFastDownFromHighLand = false;
            context.stateObject.fastDownFromHeight = -1;
            context.stateObject.jumping = false;
            context.stateObject.node.y = context.stateObject.landY;
            context.stateObject.jumpSpeed.y = 0;
            context.stateObject.currAddSpeed = parkourConfig.addSpeed;
            context.changeState(context.getState("run"));
        }

        if(event === "doSprint"){ //冲刺
            if(context.stateObject.isPass) return;
            context.stateObject.isFastDownFromHighLand = false;
            context.stateObject.fastDownFromHeight = -1;
            context.changeState(context.getState("sprint"));
            context.stateObject.dealChongCi(params[0]);
        }

        if(event == "doPass"){
            context.stateObject.fastDownFromHeight = -1;
            context.stateObject.isFastDownFromHighLand = false;
            context.stateObject.jumpSpeed.x = 500;
        }
    }
}

/**
 * 冲刺状态
 */
 class SprintState implements BaseState{
    public name: string = null;
    constructor(name: string){
        this.name = name;
    }

    handleEvent(context: StateContext<PlayerMoveComp>, event: string, ...params: any[]) {
        if(event == "doSprint"){
            if(context.stateObject.isPass) return;
            context.stateObject.dealChongCi(params[0]);
        }

        if(event == "doSprintEnd"){
            context.stateObject.endChongCi();
            context.stateObject.jumpSpeed.y = 0;
            context.stateObject.currAddSpeed = parkourConfig.addSpeed;
            context.stateObject.jumping = true;
            context.stateObject.jumpCount = 2;
            context.changeState(context.getState("jump"));
        }

        if(event == "doPass"){
            context.stateObject.jumpSpeed.x = 500;
            //通关之后，移除冲刺buff
            context.stateObject.removeBuff(ParkourBuffType.CHONG_CI);
        }
    }
}

/**
 * 死亡状态
 */
class DieState implements BaseState{
    public name: string = null;
    constructor(name: string){
        this.name = name;
    }

    handleEvent(context: StateContext<PlayerMoveComp>, event: string, ...params: any[]) {

    }
}

/**
 * 上下文
 */
class StateContext<T> {
    currState: BaseState = null;

    states: Map<string, BaseState> = null;

    stateObject: T = null;
    constructor(stateObject: T){
        this.stateObject = stateObject;
    }

    release(){
        this.currState = null;
        this.stateObject = null;
        this.states.forEach(ele => {
            //@ts-ignore
            ele.release && ele.release();
        });
        this.states.clear();
        this.states = null;
    }

    init(states: BaseState[], initState: BaseState) : void{
        this.states = new Map<string, BaseState>();
        states.forEach((state) => {
            this.states.set(state.name, state);
        }, this);
        this.currState = initState;
    }

    changeState (newState: BaseState){
        //this.stateObject instanceof ParkourMonster && cc.warn(`切换状态: ${this.currState.name} --->${newState.name}`, cc.director.getTotalFrames());
        this.currState = newState;
    }

    getCurrState() : BaseState{
        return this.currState;
    }

    getState (stateName: string) : BaseState{
        return this.states.get(stateName);
    }

    handleEvent(event: string, ...params: any[]){
        this.currState.handleEvent(this, event, ...params);
    }
}

export {
    BaseState,
    IdelState,
    RunState,
    JumpState,
    FastDownState,
    DieState,
    SprintState,
    StateContext
}
