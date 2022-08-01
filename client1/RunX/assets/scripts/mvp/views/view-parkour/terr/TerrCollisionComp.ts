import { terrCollisionNodePool, TiledShadeInfo } from "../MapTerrManager";

/*
 * @Description:挂载在地形碰撞节点上的组件，主要用于地形碰撞节点的回收
 * @Version: 1.0
 * @Autor: lixu
 * @Date: 2021-08-03 18:07:45
 * @LastEditors: lixu
 * @LastEditTime: 2021-08-23 16:10:48
 */
const {ccclass, property} = cc._decorator;

@ccclass
export default class TerrCollisionComp extends cc.Component {
    private _collisionCfg: TiledShadeInfo = null;

    getTiledShadeInfo(): TiledShadeInfo{
        return this._collisionCfg;
    }

    onInit(cfg: TiledShadeInfo){
        this._collisionCfg = cfg;
    }

    deInit(){
        this._collisionCfg = null;
    }

    onRelease(){
    }

    lateUpdate(dt: number){
        if(!cc.isValid(this.node.parent)) return;
        let pos = this.node.parent.convertToWorldSpaceAR(this.node.getPosition());
        if(pos.x < 0 && pos.x + this.node.width <= 0){
            this.doRecycle();
        }
    }

    unuse(){
      this.deInit();
    }

    reuse(...params: any[]){
        let cfg: TiledShadeInfo = params[0];
        this.onInit(cfg);
    }

    doRecycle(){
        terrCollisionNodePool.put(this.node);
    }

}
