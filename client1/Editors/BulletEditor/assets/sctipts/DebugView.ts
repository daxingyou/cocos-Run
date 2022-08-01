/*
 * @Description: 
 * @Version: 1.0
 * @Autor: lixu
 * @Date: 2021-08-17 17:59:58
 * @LastEditors: lixu
 * @LastEditTime: 2021-08-17 18:03:48
 */
const {ccclass, property} = cc._decorator;

@ccclass
export default class DebugView extends cc.Component {
    @property(cc.Label) heroPos: cc.Label = null;

    start () {
        this.heroPos.string = '';
    }

    updateHeroPos(pos: cc.Vec2){
        this.heroPos.string = `玩家位置(X:${pos.x} Y:${pos.y})`
    }
}
