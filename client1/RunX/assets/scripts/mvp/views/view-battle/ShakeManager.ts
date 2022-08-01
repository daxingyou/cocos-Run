
import { EffectConst, ShakeInfo, SHAKE_REDUCT_TYPE } from "../view-actor/SkillUtils";

class ShakeManager{
    private _camera: cc.Camera = null;
    private _sequence: number = 0;
    private _currTranslateShake: number = 0;
    private _isInit: boolean = false;

    constructor () {
    }

    setCameraAndRoot (camera: cc.Camera) {
        this._camera = camera;
    }

    init(){
        this._isInit = true;
    }

    deInit(){
        this._isInit = false;
        if(!cc.isValid(!this._camera) || !cc.isValid(this._camera.node)) return;
        this._camera.node.stopAllActions();
        this._camera.node.setPosition(cc.v2());
    }

    shake (shakeInfo: ShakeInfo) {
        if(!this._isInit) return;
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

    private _generateId () : number{
        return ++this._sequence;
    }
}

const shakeManager = new ShakeManager();

export default shakeManager;
