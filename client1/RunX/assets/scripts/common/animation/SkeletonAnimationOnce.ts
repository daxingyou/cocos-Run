import { WatcherHelper } from "../components/WatcherHelper";
import skeletonManager from "../SkeletonManager";
import { AnimationOnce, ANIM_TYPE, AnimationOnceInfo } from "./AnimationOnce";
import { CuveAnimation } from "./CuveAnimation";

class SkeletonAnimationOnce extends AnimationOnce {
    private _skeleton: sp.Skeleton = null;
    private _stoped: boolean = false;

    constructor (type: ANIM_TYPE, info: AnimationOnceInfo) {
        super(type, info);
    }

    play () {
        return new Promise((resolve, reject) => {
            const skeletonRet = skeletonManager.loadSkeleton(this.info.path);
            skeletonRet.then ((skeleton) => {
                this._skeleton = skeleton;
                const onFinish = () => {
                    WatcherHelper.removeWatcher(skeleton.node);
                    this._skeleton = null;
                    resolve(null);
                    skeletonManager.releaseSkeleton(this.info.path, skeleton);
                }

                let tempOffet = cc.v3((this.info.flipX ? -1 : 1) * this.info.offset.x, this.info.offset.y, this.info.offset.z);
                this.info.offset && (skeleton.node.position = tempOffet);
                this.info.scale && (skeleton.node.scale = this.info.scale);
                this.info.angle && (skeleton.node.angle = this.info.angle);
                this.info.color && (skeleton.node.color = this.info.color);

                if (this.info.flipX) {
                    skeleton.node.scaleX *= -1;
                }
                
                const idx = this.info.path.lastIndexOf('/');
                if (idx >= 0) {
                    skeleton.node.name = `SkeletonOnce_${this.info.path.substr(idx+1)}`;
                } else {
                    skeleton.node.name = `SkeletonOnce_${this.info.path}`;
                }                
                skeleton.setCompleteListener(() => {
                    this.info.onComplete && this.info.onComplete();
                    onFinish();
                });

                if (this.info.eventHandler) {
                    skeleton.setEventListener((trackEntry: any, event: any) => {
                        this.info.eventHandler(trackEntry, event);
                    })
                }

                if (this.info.skin && this.info.skin.length > 1) {
                    skeleton.defaultSkin = this.info.skin;
                }

                if (this.info.timeScale) {
                    skeleton.timeScale = this.info.timeScale;
                }

                let playAnim = () => {
                    if (this._stoped || !cc.isValid(this.info.node)) {
                        onFinish();
                        return;
                    }

                    if (this.info.node.active == false) {
                        onFinish();
                        return;
                    }
                    
                    this.info.node.addChild(skeleton.node);
                    WatcherHelper.addWatcher({
                        node: skeleton.node,
                        parent: this.info.node,
                        onDisable: () => {
                            onFinish();
                        }
                    });
                    
                    if (this.info.zIndex) {
                        skeleton.node.zIndex = this.info.zIndex;
                    }

                    this.info.onStart && this.info.onStart(skeleton.node);

                    if (this.info.cuveInfo) {
                        skeleton.setAnimation(0, this.info.animation, true);
                        const cuveAnim = new CuveAnimation();
                        cuveAnim.play({
                            ...this.info.cuveInfo,
                            node: skeleton.node,
                            finCallback: () => {
                                onFinish();
                            }
                        })
                    } else {
                        skeleton.setAnimation(0, this.info.animation, false);
                    }
                }

                if (this.info.delay && this.info.scheduleHelper) {
                    this.info.scheduleHelper.scheduleOnce(() => {
                        playAnim();
                    }, this.info.delay);
                } else {
                    playAnim();
                }
            }).catch( err => {
                reject(err);
            });
        });
    }

    stop () {
        this._stoped = true;
        if (this._skeleton) {
            this._skeleton.clearTracks();
            WatcherHelper.removeWatcher(this._skeleton.node);
            skeletonManager.releaseSkeleton(this.info.path, this._skeleton);
            this._skeleton = null;
        }
    }
}

export default SkeletonAnimationOnce;
