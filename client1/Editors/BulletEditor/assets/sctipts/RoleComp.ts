/*
 * @Description: 
 * @Autor: lixu
 * @Date: 2021-05-29 16:31:00
 * @LastEditors: lixu
 * @LastEditTime: 2021-06-24 20:40:54
 */

import { BULLET_ATTACH_TYPE } from "./BulletGroupEntity";
import { bulletPoolManager, BulletProp } from './BulletManager';
import BulletManager from './BulletManager';
import { global } from "./main";
import { BulletEmitter } from "./bullets/ItemBullet";
const {ccclass, property} = cc._decorator;

@ccclass
export default class RoleComp extends cc.Component {
    
    @property(BulletManager) bulletManager: BulletManager = null;
    private  _bulletEmitter: BulletEmitter = null;

    private _bulletConfig: any = null;  //子弹配置

    onLoad(){
        this._bulletEmitter = new BulletEmitter();
        this._bulletEmitter.realEmitFunc = this._doShoot.bind(this);
    }

    startShoot(config: any, interval: number){
        this._bulletConfig = config;
        this._bulletEmitter.reset(this._bulletConfig, interval);
        
        this._bulletEmitter.setEmit(true);
    }

    stopShoot(){
        this._bulletEmitter.setEmit(false);
    }

    update(dt: number){
        this._bulletEmitter && this._bulletEmitter.isEmit() && this._bulletEmitter.checkEmitter(dt);
    }

    //射击
    private _doShoot(idx: number, bulletID: number){
        let bulletInfo = this._bulletConfig.bullets[idx];
        let damage = 1;
        let config = this._bulletConfig.bullets[idx];
        let startPos = cc.v2();
        if(bulletInfo.attachType === BULLET_ATTACH_TYPE.ROLE){
            startPos = this.node.convertToWorldSpaceAR(startPos);
        }
        if(!bulletPoolManager.hasBulletTemplate(bulletID)){
            bulletPoolManager.addBulletTemplate(bulletID, this._getBulletProp(bulletID));
        }
        let bullet = bulletPoolManager.get(bulletID, startPos, damage, config);
        if(!bullet) return;
        this.bulletManager.onShoot(bullet);
    }

    private _getBulletProp(bulletID: number): cc.Prefab{
        if(!global.bulletCongigs.has(bulletID)){
            global.showToastMsg(`子弹配置表中没有ID=${bulletID}的子弹`);
            return;
        }
        let config = global.bulletCongigs.get(bulletID);
        let prefab: cc.Prefab = cc.resources.get(`${global.bulletPrefabPath}${config.ArtID}`, cc.Prefab);
        if(!prefab){
            global.showToastMsg(`子弹预制体没有找到, ID=${bulletID}的子弹`);
            return null;
        }
        return prefab;
    }
}
