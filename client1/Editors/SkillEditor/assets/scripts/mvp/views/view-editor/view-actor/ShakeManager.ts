import { ShakeInfo, EffectConst, SHAKE_REDUCT_TYPE } from "./CardSkill";

/**
 * File: ShakeManager.ts
 * Created Date: Sat May 13 2021
 * Author: Dex
 * Description: 震屏管理器
 * 
 * Copyright (c) 2019 YokaGames
 */

class ShakeManager{
    private _camera: cc.Camera = null;
    private _sceneNode: cc.Node = null;
    private _sequence: number = 0;
    private _currTranslateShake: number = 0;

    constructor () {
    }

    setCameraAndRoot (camera: cc.Camera, sceneNode: cc.Node) {
        this._camera = camera;
        this._sceneNode = sceneNode;
    }

    shake (shakeInfo: ShakeInfo) {
        if (!EffectConst.isShakeValid(shakeInfo)) {
            return;
        }

        this._shakeTranslate(shakeInfo);
    }

    private _shakeTranslate (shakeInfo: ShakeInfo) {
        this._currTranslateShake = this._generateId();
 
        const stepTime = shakeInfo.duration / shakeInfo.times / 4;
        const arr: any [] = [];
        if (shakeInfo.delay > 0) {
            arr.push(cc.delayTime(shakeInfo.delay));
        }
 
        for (let i=0; i<shakeInfo.times; ++i) {
            let amplitude: cc.Vec3 = this._getAmplitude(shakeInfo, i);
            if(!amplitude) continue;
            let posX = amplitude.x;
            let posY = amplitude.y;
            arr.push(cc.moveBy(stepTime, cc.v2(posX, posY)));
            arr.push(cc.moveBy(stepTime, cc.v2(-2 * posX, -2 * posY)));
            arr.push(cc.moveBy(stepTime, cc.v2(posX, posY)));
        }
        arr.push(cc.callFunc(() => {
            this._currTranslateShake = 0;
            this._camera.node.x = 0;
            this._camera.node.y = 0;
        }));
 
        this._camera.node.runAction(cc.sequence(arr));
    }

    private _getAmplitude(shakeInfo: ShakeInfo, currTime: number): cc.Vec3{
        if(!shakeInfo) return null;
        let reductType = shakeInfo.reduct || SHAKE_REDUCT_TYPE.NONE;
        let amolitude: cc.Vec3 = null;
        switch(reductType){
            case SHAKE_REDUCT_TYPE.NONE:
                amolitude = shakeInfo.amplitude;
                break
            case SHAKE_REDUCT_TYPE.LINE:
                amolitude = shakeInfo.amplitude.mul(currTime / shakeInfo.times);
                break;
            case SHAKE_REDUCT_TYPE.SIN:
                let posX = (1 - Math.sin(currTime / shakeInfo.times)) * shakeInfo.amplitude.x;
                let posY = (1 - Math.sin(currTime / shakeInfo.times)) * shakeInfo.amplitude.y;
                amolitude = cc.v3(posX, posY);
                break;
        }
        return amolitude;
    }

    private _shakeScale (shakeInfo: ShakeInfo) {
        console.warn(`缩放震屏，已经被取消了，你们不要再用了，用shake-translate吧`);
        // if (this._currScaleShake > 0) {
        //     return ;
        // }
        // this._currScaleShake = this._generateId();

        // const scene: cc.Node = this._sceneNode;
        // scene.setAnchorPoint(cc.v2(shakeInfo.ori.x / cc.winSize.width, shakeInfo.ori.y / cc.winSize.height));
        // scene.scale = 1;

        // const stepRange = (shakeInfo.range - 1.0) / shakeInfo.times;
        // const stepTime = shakeInfo.duration / shakeInfo.times / 2;
        
        // const arr: any [] = [];
        // if (shakeInfo.delay > 0.001) {
        //     arr.push(cc.delayTime(shakeInfo.delay));
        // }

        // for (let i=0; i<shakeInfo.times; ++i) {
        //     arr.push(cc.scaleTo(stepTime, 1.0 + stepRange * (shakeInfo.times - i)));
        //     arr.push(cc.scaleTo(stepTime, 1.0));
        // }
        // arr.push(cc.callFunc(() => {
        //     this._currScaleShake = 0;
        // }));
        // scene.runAction(cc.sequence(arr));
    }

    private _generateId () : number{
        return ++this._sequence;
    }
}

const shakeManager = new ShakeManager();

export default shakeManager;