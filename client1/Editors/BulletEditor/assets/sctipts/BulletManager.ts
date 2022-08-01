import ItemBullet from "./bullets/ItemBullet";


/*
 * @Description: 子弹层
 * @Autor: lixu
 * @Date: 2021-04-27 19:22:20
 * @LastEditors: lixu
 * @LastEditTime: 2021-06-24 20:37:00
 */
const {ccclass, property} = cc._decorator;

@ccclass
export default class BulletManager extends cc.Component {

    onLoad(){
        bulletPoolManager.setEnable(true);
    }

    //发射子弹
    onShoot(bulletNode: cc.Node){
        if(!cc.isValid(bulletNode)) return;
        this.node.addChild(bulletNode);
        bulletNode.getComponent(ItemBullet).shoot();
    }

    deInit(){
        bulletPoolManager.clearAll();
    }
}

//单个子弹的属性描述
interface BulletProp{
    //子弹ID
    ID: number,
    //飞行子弹的美术资源
    ArtID?: string,

}

class BulletPoolManager{
    private _bulletMap: Map<number, cc.NodePool> = null;
    private _bulletPrefabMap: Map<number, cc.Prefab> = null;
    private _isEnable = false;

    constructor(){
        this._bulletMap = new Map<number, cc.NodePool>();
        this._bulletPrefabMap = new Map<number, cc.Prefab>();
    }

    setEnable(isEnable: boolean){
        this._isEnable = isEnable;
    }

    hasBulletTemplate(bulletID: number){
        return this._bulletPrefabMap.has(bulletID) && this._bulletPrefabMap.get(bulletID);
    }

    addBulletTemplate(bulletID: number, prefab: cc.Prefab){
        if(!this._isEnable) return;
        if(this._bulletPrefabMap.has(bulletID) && this._bulletPrefabMap.get(bulletID)) return;
        this._bulletPrefabMap.set(bulletID, prefab);
    }

    get(bulletID: number, ...rest: any[]): cc.Node{
        if(!this._isEnable) return null;
        let pool: cc.NodePool = null;
        if(!this._bulletMap.has(bulletID) || !this._bulletMap.get(bulletID)){
            pool = new cc.NodePool(ItemBullet);
            this._bulletMap.set(bulletID, pool);
        }
        (pool == null) && (pool = this._bulletMap.get(bulletID));
        let bullet: cc.Node = null;
       
        if(pool.size() > 0){
            bullet = pool.get(...rest);
            return bullet;
        }
        let bulletProp = this._bulletPrefabMap.get(bulletID);
        if(bulletProp){
            let startPos: cc.Vec2 = rest[0];
            let baseDamage: number = rest[1];
            let config: any = rest[2];
            let node = cc.instantiate(bulletProp);
            let comp:ItemBullet = node.getComponent(ItemBullet);
            comp.setBulletData(startPos, baseDamage, config);
            return node;
        }
        return null;
    }

    put(node: cc.Node, bulletID: number){
        if(!this._isEnable) return;
        let pool: cc.NodePool = null;
        if(!this._bulletMap.has(bulletID) || !this._bulletMap.get(bulletID)){
            pool = new cc.NodePool(ItemBullet);
            this._bulletMap.set(bulletID, pool);
        }
        (pool == null) && (pool = this._bulletMap.get(bulletID));
        pool.put(node);
    }

    clear(bulletID: number){
        if(!this._bulletMap.has(bulletID)) return;
        let pool: cc.NodePool = this._bulletMap.get(bulletID);
        pool.clear();
    }

    clearAll(){
        if(!this._bulletMap || this._bulletMap.size === 0){
            this._bulletMap = null;
            return;
        }
        this._bulletMap.forEach((elem) => {
            elem.clear();
        });
        this._bulletMap.clear();
        this._bulletPrefabMap.clear();
        this.setEnable(false);
    }
}

export let bulletPoolManager = new BulletPoolManager();

export{
    BulletProp
}