import BulletGroup from './BulletGroup';
import { BulletLittleGroupEntity } from './BulletGroupEntity';
import RightContainor from './RightContainor';

/*
 * @Description: 
 * @Autor: lixu
 * @Date: 2021-05-25 11:13:25
 * @LastEditors: lixu
 * @LastEditTime: 2021-06-21 13:37:06
 */

const {ccclass, property} = cc._decorator;

@ccclass
export default class BulletLittleGroup extends cc.Component {
    @property(cc.EditBox) groupName: cc.EditBox = null;
    @property(cc.EditBox) delay: cc.EditBox = null;
    @property(cc.EditBox) offsetX: cc.EditBox = null;
    @property(cc.EditBox) offsetY: cc.EditBox = null;
    @property(cc.EditBox) roration: cc.EditBox = null;
    @property(cc.Node) arrow: cc.Node = null;

    private controller: RightContainor = null;
    private _group: BulletGroup = null;

    private _isExpand: boolean  = true;
    private _curTween: cc.Tween = null;

    init(controller: RightContainor, group:BulletGroup, isCopy: boolean = false, ...rest: any){
        this.controller = controller;
        this._group = group;
        this.arrow.rotation = this._isExpand == true ? 180: 90;
        this.initUI(isCopy, ...rest);
        if(this._isExpand === true){
            this.controller.drawExpandLittleGroup(this.node);
        }else{
            this.controller.drawbBackLittleGroup(this.node);
        }
    }

    private initUI(isCopy: boolean, ...rest: any){
        let name = rest[0];
        name = name || `子弹小组${Date.now()}`;
        this.groupName.string = name;

        if(isCopy){
            return;
        }

        let startPosx = rest[1];
        startPosx = typeof startPosx === 'undefined' ? 0 : startPosx;
        this.offsetX.string = startPosx;

        let startPosy = rest[2];
        startPosy = typeof startPosy === 'undefined' ? 0 : startPosy;
        this.offsetY.string = startPosy;

        let delay = rest[3];
        delay = typeof delay === 'undefined' ? 0 : delay;
        delay *= 1000;
        this.delay.string = delay;

        let rotation = rest[4];
        rotation = typeof rotation === 'undefined' ? 0 : rotation;
        this.roration.string = rotation;
    }

    onClickAdd(){
        this.controller.createNewBullet(this);
    }

    addToGroup(node: cc.Node){
        if(!cc.isValid(node)) return;
        node.name = "bullet";
        this.node.addChild(node);
        node.active = this._isExpand;
    }

    playDelAnim(cb: Function){
        cc.tween(this.node).to(0.1, {scale: 0}).call(()=>{
            cb && cb();
        }).start();
    }

    onClickCopy(){
        this.controller.copyLittleGroup(this._group, this);
    }

    onClickDel(){
        this.controller.delLittleGroup(this);
    }

    onArrowClick(){
        if(this._curTween) return;
        this._isExpand = !this._isExpand;
        this._curTween = cc.tween(this.arrow).to(0.1, {rotation: this._isExpand == true ? 180 : 90}).call(() => {
            if(this._isExpand === true){
                this.controller.drawExpandLittleGroup(this.node);
            }else{
                this.controller.drawbBackLittleGroup(this.node);
            }
            this._curTween.stop();
            this._curTween = null;
        }).start();
    }

    getConfig(): BulletLittleGroupEntity{
        let name = this.groupName.string;
        let offsetX = parseInt(this.offsetX.string);
        let offsety = parseInt(this.offsetY.string);
        let delay = parseFloat(this.delay.string);
        let rotation = parseFloat(this.roration.string);

        offsetX = !isNaN(offsetX)? offsetX : 0;
        offsety = !isNaN(offsety)? offsety : 0;
        delay = !isNaN(delay)? delay : 0;
        rotation = !isNaN(rotation)? rotation : 0;
        
        return {
            name: name,
            idx: null,
            bullets: null,
            startPosx: offsetX,
            startPosy: offsety,
            delay: delay / 1000,
            targetRotation: rotation
        }
    }
}
