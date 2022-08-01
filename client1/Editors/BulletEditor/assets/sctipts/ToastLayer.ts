import ItemToast from './ItemToast';

/*
 * @Description: 
 * @Autor: lixu
 * @Date: 2021-05-25 14:38:11
 * @LastEditors: lixu
 * @LastEditTime: 2021-05-29 18:00:45
 */
const {ccclass, property} = cc._decorator;

const targetPosY: number = 600;

@ccclass
export default class ToastLayer extends cc.Component {

    @property(cc.Prefab) itemPrefab: cc.Prefab = null;
    private pool: cc.NodePool = new cc.NodePool(ItemToast);
    private _visibleCount: number = 0;

    showToast(msg: string){
        let node = this.getItem(msg);
        this.node.addChild(node);
        this._visibleCount = Math.max(0, this._visibleCount);
        let targetY = targetPosY - (node.height * this._visibleCount);
        this._visibleCount += 1;
        cc.tween(node).to(0.5, {y: targetY}).delay(1).to(0.1, {opacity: 0}, {easing: 'fade'}).call(()=>{
            this._visibleCount -= 1;
            this.pool.put(node);
        }).start();
    }

    private getItem(msg: string){
        if(this.pool.size() > 0){
            return this.pool.get(msg);
        }
        let node = cc.instantiate(this.itemPrefab);
        cc.Tween.stopAllByTarget(node);
        node.opacity = 255;
        node.getComponent(ItemToast).label.string = msg;
        node.setPosition(cc.v2());
        return node;
    }

    onDestroy(){
        this.pool.clear();
        this.pool = null;
    }
}
