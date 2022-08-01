import { parkourConfig } from "../../ParkourConst";
import ParkourMonster from "../../ParkourMonster";
import { BaseState, StateContext } from "../../StateModule";
/*
 * @Description:怪物状态
 * @Version: 1.0
 * @Autor: lixu
 * @Date: 2021-07-12 10:54:36
 * @LastEditors: lixu
 * @LastEditTime: 2021-07-12 14:45:38
 */
class IdelState implements BaseState{
    public name: string = null;

    constructor(name: string){
        this.name = name;
    }

    handleEvent(context: StateContext<ParkourMonster> , event: string) {
        if(event == 'doRun'){
            context.stateObject.currAddSpeed = parkourConfig.addSpeed;
            //进入场景完成，地图开始移动
            context.changeState(context.getState("run"));
        }
  }
}

export {
  IdelState
}
