const { ccclass, property } = cc._decorator;

import blurManager from "../common/BlurManager";
import FloatTips from "../common/components/FloatTips";
import { configManager } from "../common/ConfigManager";
import guiManager from "../common/GUIManager";
import scheduleManager from "../common/ScheduleManager";
import { gameControl } from "../game/GameControl";
import { modelManager } from "../mvp/models/ModeManager";
import { optManager } from "../mvp/operations/OptManager";
import LoadingView from "../mvp/views/view-loading/LoadingView";
import WaitingView from "../mvp/views/view-loading/WaitingView";
import { appCfg } from "./AppConfig";
import { audioManager } from "../common/AudioManager";

@ccclass
export default class App extends cc.Component {
    @property(cc.Node) sceneNode: cc.Node = null;
    @property(cc.Label) labelVersion: cc.Label = null;
    @property(cc.Node) floatTips: cc.Node = null;
    @property(cc.Node) nodeGameLoading: cc.Node = null;
    @property(LoadingView) loadingView: LoadingView = null;
    @property(WaitingView) waitingView: WaitingView = null;
    @property(cc.Material) blur: cc.Material = null;
    @property(sp.SkeletonData) touchSkeleton: sp.SkeletonData = null;
    @property(cc.Boolean) isDebug: boolean = false;

    private _floatTips: FloatTips = null;
    onLoad() {
    }

    start() {
        this._updateVersion();
        cc.game.addPersistRootNode(this.node);
        cc.game.setFrameRate(60);

        if (cc.sys.isNative) {
            // @ts-ignore
            jsb.Device.setKeepScreenOn(true);
        }
        this._floatTips = this.floatTips.getComponent("FloatTips");
        this._initGlobalTouchGfx();

        scheduleManager.init(this);
        guiManager.init({
            sceneNode: this.sceneNode,
            tips: this._floatTips,
            loadingView: this.loadingView,
            waitingView: this.waitingView,
            gameloadingNode: this.nodeGameLoading,
            labelVersion: this.labelVersion,
        }, this.isDebug);

        this.setCollisionEnable(this.isDebug);
        blurManager.init(this.blur);
        configManager.init();
        modelManager.init();
        optManager.init();
        audioManager.init();

        gameControl.init();
        guiManager.loadScene('LoginScene');
    }

    //碰撞检测的开关
    public setCollisionEnable(enable: boolean) {
        cc.director.getCollisionManager().enabled = enable;
        cc.director.getCollisionManager().enabledDebugDraw = enable && this.isDebug;
        cc.director.getCollisionManager().enabledDrawBoundingBox = enable && this.isDebug;
    }

    private _initGlobalTouchGfx() {
        // 全局点击事件
        this.node.on(cc.Node.EventType.TOUCH_START, this._onTouchStart, this, true);
        // @ts-ignore
        if (this.node._touchListener && this.node._touchListener.setSwallowTouches) {
            // @ts-ignore
            this.node._touchListener.setSwallowTouches(false);
        } else {
            this.node.off(cc.Node.EventType.TOUCH_START);
        }
    }

    private _onTouchStart(event: cc.Event.EventTouch) {
        this._playTouchGfx(cc.v3(this.node.convertToNodeSpaceAR(event.getLocation())));
    }

    private _updateVersion() {
        this.labelVersion.string = `${this._versionToName()}`;
    }

    private _versionToName(): string {
        return "resources-version-" + appCfg.getVersion();
    }

    private _playTouchGfx(pos: cc.Vec3) {
        const node = new cc.Node();
        const skeletonRet = node.addComponent(sp.Skeleton);
        skeletonRet.skeletonData = this.touchSkeleton;
        this.node.addChild(node);
        node.position = pos;
        skeletonRet.setCompleteListener(() => {
            node.destroy();
        });
        skeletonRet.setAnimation(0, 'animation', false);
    }
}
