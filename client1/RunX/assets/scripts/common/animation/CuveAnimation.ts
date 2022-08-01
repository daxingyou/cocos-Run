import { CUVE_TYPE, EASE_TYPE } from "../../mvp/views/view-actor/SkillUtils";

interface CuveAnimationInfo {
    node: cc.Node;
    type: CUVE_TYPE;
    arrPoint: cc.Vec3[];
    time: number;
    ease: EASE_TYPE;
    finCallback?: Function;
}

class CuveAnimation {
    constructor () {
    }

    play (info: CuveAnimationInfo) {
        const arr = [];
        let action = null;
        if (info.type == CUVE_TYPE.LINE) {
            action = cc.moveTo(info.time, cc.v2(info.arrPoint[0]));
        } else {
            action = cc.bezierTo(info.time, info.arrPoint.map(v => {
                return cc.v2(v);
            }));
        }

        if (info.ease == EASE_TYPE.INOUTSINE) {
            arr.push(action.easing(cc.easeExponentialInOut()));
        } else if (info.ease == EASE_TYPE.INSINE) {
            arr.push(action.easing(cc.easeSineIn()));
        } else if (info.ease == EASE_TYPE.OUTSINE) {
            arr.push(action.easing(cc.easeSineOut()));
        } else {
            arr.push(action);
        }

        arr.push(cc.callFunc(() => {
            info.finCallback && info.finCallback();
        }));

        info.node.runAction(cc.sequence(arr));
    }
}

export {
    CuveAnimation,
    CuveAnimationInfo,
}
