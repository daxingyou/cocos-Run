/*
 * @Description:人物影子组件
 * @Version: 1.0
 * @Autor: lixu
 * @Date: 2021-08-06 10:14:45
 * @LastEditors: lixu
 * @LastEditTime: 2021-08-23 11:07:57
 */

const {ccclass, property} = cc._decorator;

@ccclass
export default class RoleShadowComp extends cc.Component {
    onInit(){
    }

    updatePos(pos: cc.Vec2, scale: number){
        this.node.setPosition(pos);
        this.node.setScale(scale);
    }

    deInit(){

    }

    onRelease(){

    }
}
