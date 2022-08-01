/*
 * @Description: 
 * @Version: 1.0
 * @Autor: lixu
 * @Date: 2021-08-17 18:25:40
 * @LastEditors: lixu
 * @LastEditTime: 2021-08-17 19:16:30
 */


const {ccclass, property} = cc._decorator;

@ccclass
export default class HeroCollisionComp extends cc.Component {

    private _collisionCount: number = 0;

    onEnable(){
        this._collisionCount = 0;
        this.node.color = cc.Color.WHITE;
    }
    
    onCollisionEnter(other: cc.Collider, self: cc.Collider) {
        this._collisionCount += 1;
        this.node.color = cc.Color.RED;
    }

    onCollisionStay(other: cc.Collider, self: cc.Collider) {

    }

    onCollisionExit(other: cc.Collider, self: cc.Collider) {
        this._collisionCount -= 1;
        this.node.color = cc.Color.WHITE;
    }

    lateUpdate(dt: number){
        this.node.color = this._collisionCount > 0 ? cc.Color.RED : cc.Color.WHITE;
    }
}
