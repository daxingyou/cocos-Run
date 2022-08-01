import { SHADE_LAYER_Z_INDEX } from "../../../app/BattleConst";

/*
 * @Description:  黑屏层
 * @Version: 1.0
 * @Autor: lixu
 * @Date: 2021-12-01 19:37:48
 * @LastEditors: lixu
 * @LastEditTime: 2022-02-15 11:44:39
 */
const {ccclass, property} = cc._decorator;

@ccclass
export default class ShadeController extends cc.Component {

    init( ){
        this.node.zIndex = SHADE_LAYER_Z_INDEX - 1;
        this.node.active = false;
    }

    deInit(){
        this.hide();
    }

    show(){
        this.node.active = true;
    }

    hide(){
        this.node.active = false;
    }
}
