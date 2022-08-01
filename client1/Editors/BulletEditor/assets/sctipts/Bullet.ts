import { BulletEntity, BULLET_ATTACH_TYPE, BULLET_ROTATION_TYPE, BULLET_TARGET_POS_TYPE } from './BulletGroupEntity';
import BulletLittleGroup from './BulletLittleGroup';
import { global } from './main';
import RightContainor from './RightContainor';

/*
 * @Description: 
 * @Autor: lixu
 * @Date: 2021-05-25 11:27:38
 * @LastEditors: lixu
 * @LastEditTime: 2021-06-21 16:08:25
 */

const {ccclass, property} = cc._decorator;

@ccclass
export default class Bullet extends cc.Component {

    private _isExpand: boolean  = true;
    private _curTween: cc.Tween = null;

    @property(cc.Node) arrow: cc.Node = null;
    @property(cc.Node) baseNode: cc.Node = null;
    @property(cc.Node) expandNode: cc.Node = null;
    @property(cc.EditBox) bulletName: cc.EditBox = null;
    @property(cc.EditBox)  createDelay: cc.EditBox = null;
    @property(cc.EditBox) bulletTypePath: cc.EditBox = null;
    @property(cc.ToggleContainer) attachNode: cc.ToggleContainer = null;
    @property(cc.Toggle) attachActor: cc.Toggle = null;
    @property(cc.Toggle) attachScreen: cc.Toggle = null;
    @property(cc.EditBox) startX_1: cc.EditBox = null;
    @property(cc.EditBox) startX_2: cc.EditBox = null;
    @property(cc.EditBox) startY_1: cc.EditBox = null;
    @property(cc.EditBox) startY_2: cc.EditBox = null;
    @property(cc.ToggleContainer)  targetPosType: cc.ToggleContainer = null;
    @property(cc.Toggle) targetPosFix: cc.Toggle = null;
    @property(cc.Toggle) targetPosFollow: cc.Toggle = null;
    @property(cc.EditBox) targetPosX: cc.EditBox = null;
    @property(cc.EditBox) targetPosY: cc.EditBox = null;
    @property(cc.EditBox) followOnceDelay: cc.EditBox = null;
    @property(cc.ToggleContainer) followType: cc.ToggleContainer = null;
    @property(cc.Toggle) followOnce: cc.Toggle = null;
    @property(cc.Toggle) followAlways: cc.Toggle = null;
    @property(cc.EditBox) destroyDis: cc.EditBox = null;
    @property(cc.EditBox) destroyTime: cc.EditBox = null;
    @property(cc.Toggle) destroyEffectEnable: cc.Toggle = null;
    @property(cc.EditBox) startLineVel: cc.EditBox = null;
    @property(cc.EditBox) addLineVel: cc.EditBox = null;
    @property(cc.EditBox) maxLineVel: cc.EditBox = null;
    @property(cc.EditBox) minLineVel: cc.EditBox = null;
    @property(cc.EditBox) targetAngular: cc.EditBox = null;
    @property(cc.ToggleContainer) rotationType: cc.ToggleContainer = null;
    @property(cc.Toggle) rotateStatic: cc.Toggle = null;
    @property(cc.Toggle) rotateDynamic: cc.Toggle = null;
    @property(cc.EditBox) startAngularVel: cc.EditBox = null;
    @property(cc.EditBox) addAngularVel: cc.EditBox = null;
    @property(cc.EditBox) maxAngularVel: cc.EditBox = null;
    @property(cc.EditBox) minAngularVel: cc.EditBox = null;

    private controller: RightContainor = null;
    private _group: BulletLittleGroup = null;

    init(controller, group: BulletLittleGroup, isCopy: boolean = false, ...rest: any){
        this.controller = controller;
        this._group = group;
        this._curTween = null;
        this._isExpand = true;
        this.arrow.rotation = this._isExpand == true ? 180 : 90;
        this.expandNode.active = this._isExpand;
        this.initUI(isCopy, ...rest);
    }

    onArrowClick(){
        if(this._curTween) return;
        this._isExpand = !this._isExpand;
        this._curTween = cc.tween(this.arrow).to(0.1, {rotation: this._isExpand == true ? 180 : 90}).call(() => {
            this.expandNode.active = this._isExpand;
            this._curTween.stop();
            this._curTween = null;
        }).start();
    }

    private initUI(isCopy: boolean, ...rest: any){
        this.bulletName.string = `子弹${Date.now().toString()}`;
        let bulletData = rest[0];
        if(!bulletData) return;
        if(isCopy) return;
        this.bulletName.string = bulletData.name || this.bulletName.string;
        this.bulletTypePath.string = bulletData.ID;
        this.createDelay.string = `${bulletData.delay * 1000}`;
        this.attachActor.isChecked = bulletData.attachType === BULLET_ATTACH_TYPE.ROLE;
        this.attachScreen.isChecked = bulletData.attachType === BULLET_ATTACH_TYPE.SCREEN;
        this.startX_1.string = bulletData.startPosx[0];
        this.startX_2.string = bulletData.startPosx.length > 1 ? bulletData.startPosx[1] : 0;
        this.startY_1.string = bulletData.startPosy[0];
        this.startY_2.string = bulletData.startPosy.length > 1 ? bulletData.startPosy[1] : 0;
        this.targetPosFix.isChecked = bulletData.targetPosType === BULLET_TARGET_POS_TYPE.FIX;
        this.targetPosFollow.isChecked = (bulletData.targetPosType == BULLET_TARGET_POS_TYPE.FOLLOW_ONCE || bulletData.targetPosType == BULLET_TARGET_POS_TYPE.FOLLOW_ALWAYS);
        this.targetPosX.string = bulletData.endPosx;
        this.targetPosY.string = bulletData.endPosy;
        this.followOnceDelay.string = `${bulletData.targetFollowDelay * 1000}`;
        this.followOnce.isChecked = (bulletData.targetPosType == BULLET_TARGET_POS_TYPE.FOLLOW_ONCE);
        this.followAlways.isChecked = (bulletData.targetPosType == BULLET_TARGET_POS_TYPE.FOLLOW_ALWAYS);
        this.destroyDis.string = bulletData.destroyDis;
        this.destroyTime.string = `${bulletData.destroyTime * 1000}`;
        this.destroyEffectEnable.isChecked = bulletData.destroyEffect;
        this.startLineVel.string = bulletData.startLineVel;
        this.addLineVel.string = bulletData.addLineVel;
        this.maxLineVel.string = bulletData.maxLineVel;
        this.minLineVel.string = bulletData.minLineVel;
        this.targetAngular.string = bulletData.targetRotation;
        this.rotateStatic.isChecked = bulletData.rotationType == BULLET_ROTATION_TYPE.STATIC;
        this.rotateDynamic.isChecked = bulletData.rotationType == BULLET_ROTATION_TYPE.DYNAMIC;
        this.startAngularVel.string = bulletData.startAngularVel;
        this.addAngularVel.string = bulletData.addAngularVel;
        this.maxAngularVel.string = bulletData.maxAngularVel;
        this.minAngularVel.string = bulletData.minAngularVel;
    }

    onClikcDel(){
        this.controller.delBullet(this);
    }
    onClickCopy(){
        this.controller.copyBullet(this._group, this);
    }

    playDelAnim(cb: Function){
        cc.tween(this.node).to(0.1, {scale: 0}).call(()=>{
            cb && cb();
        }).start();
    }

    getConfig(): BulletEntity{
        let ID = parseInt(this.bulletTypePath.string);
        if(isNaN(ID)){
            global.showToastMsg(`子弹${this.bulletName.string} 配置异常，没有配置对应的子弹ID`);
            return null;
        }
        let delay = parseFloat(this.createDelay.string);
        delay = isNaN(delay) ? 0 : delay;

        //依附的节点类型        
        let attachType = BULLET_ATTACH_TYPE.ROLE;
        if(this.attachScreen.isChecked){
            attachType = BULLET_ATTACH_TYPE.SCREEN;
        }

        //起始点x偏移
        let startPosX: number[] = [];
        let start1 = parseInt(this.startX_1.string);
        start1 = isNaN(start1) ? 0 : start1;
        let start2 = parseInt(this.startX_2.string);
        start2 = isNaN(start2) ? 0 : start2;
        startPosX.push(start1);
        startPosX.push(start2);

         //起始点y偏移
        let startPosy: number[] = [];
        let startY1 = parseInt(this.startY_1.string);
        startY1 = isNaN(startY1) ? 0 : startY1;
        let startY2 = parseInt(this.startY_2.string);
        startY2 = isNaN(startY2) ? 0 : startY2;
        startPosy.push(startY1);
        startPosy.push(startY2);

        //目标标点
        let targetPosType:BULLET_TARGET_POS_TYPE = BULLET_TARGET_POS_TYPE.FIX;
        if(this.targetPosFollow.isChecked && this.followOnce.isChecked){
            targetPosType = BULLET_TARGET_POS_TYPE.FOLLOW_ONCE;
        }      
        if(this.targetPosFollow.isChecked && this.followAlways.isChecked){
            targetPosType = BULLET_TARGET_POS_TYPE.FOLLOW_ONCE;
        }
        let targetPosx = parseInt(this.targetPosX.string);
        targetPosx = isNaN(targetPosx) ? 0 : targetPosx;
        let targetPosy = parseInt(this.targetPosY.string);
        targetPosy = isNaN(targetPosy) ? 0 : targetPosy;
        let followOnceDelay = parseFloat(this.followOnceDelay.string);
        followOnceDelay = isNaN(followOnceDelay) ? 0 : followOnceDelay;

        //自毁
        let destroyDis = parseInt(this.destroyDis.string);
        destroyDis = isNaN(destroyDis) ? 0 : destroyDis;
        let destroyTime = parseFloat(this.destroyTime.string);
        destroyTime = isNaN(destroyTime) ? 0 : destroyTime;
        let destroyEffect = this.destroyEffectEnable.isChecked;

        //变速
        let startLineVel = parseFloat(this.startLineVel.string);
        startLineVel = isNaN(startLineVel) ? 0: startLineVel;
        let addLineVel = parseFloat(this.addLineVel.string);
        addLineVel = isNaN(addLineVel) ? 0 : addLineVel;
        let maxLineVel = parseFloat(this.maxLineVel.string);
        maxLineVel = isNaN(maxLineVel) ? 0 : maxLineVel;
        let minLineVel = parseFloat(this.minLineVel.string);
        minLineVel = isNaN(minLineVel) ? 0 : minLineVel;

        //曲线
        let targetAngular = parseFloat(this.targetAngular.string);
        targetAngular = isNaN(targetAngular) ? 0: targetAngular;
        let rotationType = BULLET_ROTATION_TYPE.STATIC;
        if(this.rotateDynamic.isChecked){
            rotationType = BULLET_ROTATION_TYPE.DYNAMIC
        }
        let startAngularVel = parseFloat(this.startAngularVel.string);
        startAngularVel = isNaN(startAngularVel) ? 0 : startAngularVel;
        let addAngularVel = parseFloat(this.addAngularVel.string);
        addAngularVel = isNaN(addAngularVel) ? 0 : addAngularVel;
        let maxAngularVel = parseFloat(this.maxAngularVel.string);
        maxAngularVel = isNaN(maxAngularVel) ? 0 : maxAngularVel;
        let minAngularVel = parseFloat(this.minAngularVel.string);
        minAngularVel = isNaN(minAngularVel) ? 0 : minAngularVel;
        
        return {
            name: this.bulletName.string,
            ID: ID,
            delay: delay / 1000,
            attachType: attachType,
            startPosx: startPosX,
            startPosy: startPosy,
            endPosx: targetPosx,
            endPosy: targetPosy,
            targetPosType: targetPosType,
            targetFollowDelay: followOnceDelay / 1000,
            destroyTime: destroyTime / 1000,
            destroyDis: destroyDis,
            destroyEffect: destroyEffect,
            startLineVel:startLineVel,
            addLineVel: addLineVel,
            maxLineVel: maxLineVel,
            minLineVel: minLineVel,
            targetRotation: targetAngular,
            rotationType: rotationType,
            startAngularVel: startAngularVel,
            addAngularVel: addAngularVel,
            maxAngularVel: maxAngularVel,
            minAngularVel: minAngularVel,
            startRotation: 0,
        };
    }
}
