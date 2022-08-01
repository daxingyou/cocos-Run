import { ParkourScene } from "../../../view-scene/ParkourScene";
import { ParkourMonsterType } from "../../ParkourConst";

/*
 * @Description:怪物清洗动作
 * @Version: 1.0
 * @Autor: lixu
 * @Date: 2021-07-08 13:54:58
 * @LastEditors: lixu
 * @LastEditTime: 2021-07-14 17:15:52
 */
export default class CleanAction extends b3.Action {
    public static TAG: string = 'CleanAction';

    constructor(){
        super({name: CleanAction.TAG});
    }

    enter(tick: b3.Tick){

    }

    oepn(tick: b3.Tick){

    }

    tick(tick: b3.Tick): number{
        ParkourScene.getInstance().getMonsterLayerComp().cleanAllMonsters(ParkourMonsterType.Solider);
        ParkourScene.getInstance().getBulletManager().cleanAllBullets();
        return b3.SUCCESS;
    }

    close(tick: b3.Tick){

    }

    exit(tick: b3.Tick){

    }
}
