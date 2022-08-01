import { WatcherHelper } from "../components/WatcherHelper";
import { resourceManager } from "../ResourceManager";
import { AnimationOnce, ANIM_TYPE, AnimationOnceInfo } from "./AnimationOnce";
import { CuveAnimation } from "./CuveAnimation";

class CreatorPrefabOnce extends AnimationOnce {
    private _node: cc.Node = null;
    private _stoped: boolean = false;

    constructor(type: ANIM_TYPE, info: AnimationOnceInfo) {
        super(type, info);
    }

    play () {
        return new Promise((resolve, reject) => {
            resourceManager.load(this.info.path, cc.Prefab)
            .then(data => {
                let node: cc.Node = cc.instantiate(data.res);
                this.info.offset && (node.position = cc.v3(this.info.offset.x, this.info.offset.y));
                this.info.scale && (node.scale = this.info.scale);
                this.info.angle && (node.angle = this.info.angle);

                if (this.info.flipX) {
                    node.scaleX *= -1;
                }

                this._node = node;

                const onFinish = () => {
                    this.info.onComplete && this.info.onComplete();
                    WatcherHelper.removeWatcher(node);
                    resolve(null);
                    node.destroy();
                    resourceManager.release(this.info.path);
                }

                let playAnim = () => {
                    if (this._stoped) {
                        onFinish();
                        return;
                    }

                    this.info.node.addChild(node);
                    WatcherHelper.addWatcher({
                        node: node,
                        parent: this.info.node,
                        onDisable: () => {
                            onFinish();
                        }
                    });

                    if (this.info.zIndex) {
                        node.zIndex = this.info.zIndex;
                    }

                    this.info.onStart && this.info.onStart(node);

                    if (this.info.cuveInfo) {
                        const cuveAnim = new CuveAnimation();
                        cuveAnim.play({
                            ...this.info.cuveInfo,
                            node: node,
                            finCallback: () => {
                                onFinish();
                            }
                        })
                    }
                }

                if (this.info.delay && this.info.scheduleHelper) {
                    this.info.scheduleHelper.scheduleOnce(() => {
                        playAnim();
                    }, this.info.delay);
                } else {
                    playAnim();
                }
            })
            .catch(err => {
                reject(err);
            })
        });
    }

    stop () {
        this._stoped = true;
        if (this._node) {
            WatcherHelper.removeWatcher(this._node);
            this._node.destroy();
            this._node = null;
            resourceManager.release(this.info.path);
        }
    }
}

export default CreatorPrefabOnce;