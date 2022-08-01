import { AnimationOnceInfo, AnimationOnce, ANIM_TYPE } from "./AnimationOnce";
import SkeletonAnimationOnce from "./SkeletonAnimationOnce";
import CreatorAnimationOnce from "./CreatorAnimationOnce";
import CreatorPrefabOnce from "./CreatorPrefabOnce";

const playAnimationOnce = (type: ANIM_TYPE, info: AnimationOnceInfo): Promise<any> => {
    let anim: AnimationOnce = null;
    switch (type) {
        case ANIM_TYPE.Skeleton: anim = new SkeletonAnimationOnce(type, info); break;
        // case ANIM_TYPE.CocosAnimation: anim = new CreatorAnimationOnce(type, info); break;
        // case ANIM_TYPE.CocosPrefab: anim = new CreatorPrefabOnce(type, info); break;
    }

    if (anim) {
        return anim.play();
    }
    return Promise.reject(`Can not find anim type for TYPE = ${type}`);
}

export default playAnimationOnce;