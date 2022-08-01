import guiManager from "../GUIManager";
import { uiConfig, UIInfo, UI_CACHE } from "../UIConfig";
import StepWork, { SyncHandler, AsyncHandler } from "../step-work/StepWork";
import { WatcherHelper } from "./WatcherHelper";
import { logger } from "../log/Logger";

const { ccclass, property } = cc._decorator;

@ccclass
export class ViewBaseComponent extends cc.Component {
    private _subView: ViewBaseComponent[] = [];
    private _uiInfo: UIInfo = null;
    private _stepWork: StepWork = new StepWork;
    private _enterCounter = 0;

    initViewBaseComponent(name: string, ...args: any[]): boolean | Promise<boolean> {
        this._uiInfo = uiConfig.getConfig(name);
        this._enterCounter++;
        this.onInit(...args);
        return this._checkAndExecStepWork();
    }

    get enterCount(): number {
        return this._enterCounter;
    }

    get uiInfo(): UIInfo {
        return this._uiInfo;
    }

    // @ts-ignore
    get name(): string {
        return this._uiInfo ? this._uiInfo.id : 'unknownView';
    }

    /**
     * @desc 当前的UI是否有效
     *
     * @returns {boolean}
     * @memberof ViewBaseComponent
     */
    isViewValid(): boolean {
        return this._uiInfo != null && cc.isValid(this.node);
    }

    /**
     * @desc 是否是单例的UI（缓存模式为NODE的UI）
     *
     * @returns {boolean}
     * @memberof ViewBaseComponent
     */
    isSharedView(): boolean {
        return this.isViewValid() && this._uiInfo.cacheMode === UI_CACHE.NODE;
    }

    releaseViewBaseComponent() {
        this.onRelease();
        this._uiInfo = null;
    }

    onDestroy() {
        // this.releaseSubView();
    }

    /**
     * @desc 关闭并释放UI。调用说明：
     *  1. 如果外部有持有这个view的实例引用，那么就在外部通过实例引用进行closeView
     *  2. 如果这个界面是通过Button触发关闭的，就在子界面的实现中手工加入一个onCloseClick，来调用closeView
     *
     * @memberof ViewBaseComponent
     */
    closeView() {
        WatcherHelper.removeWatcherOnNode(this.node);
        if (this.isSharedView()) {
            this._sharedViewClose();
        } else {
            guiManager.releaseView(this);
        }
    }

    /**
     * @desc 返回一个Node，加载上来的View会直接挂在this.node上
     *
     * @protected
     * @param {string} name view的id（在UIConfig中配置），或者prefab的路径
     * @param {*} args 需要透传给onInit的参数，如果没有在UIConfig中配置，或者view不是从ViewBaseComponent派生，就不生效
     * @returns {Promise<cc.Node>}
     * @memberof ViewBaseComponent
     */
    protected loadSubView(name: string, ...args: any[]): Promise<ViewBaseComponent> {
        return new Promise((resolve, reject) => {
            const cfg = uiConfig.getConfig(name);
            if (cfg.cacheMode === UI_CACHE.NODE) {
                reject('Shared View should load by guiManager.loadView');
            } else {
                const ret = guiManager.loadView(name, this.node, ...args);
                ret.then((view) => {
                    this._subView.push(view);
                    resolve(view);
                }).catch(err => {
                    reject(err);
                });
            }
        });
    }

    /**
     * @desc 释放掉通过this.loadSubView加载上来的View，并不会在onRelease中自动调用，如果需要再onRelease中释放，需要自己手工添加
     *
     * @protected
     * @memberof ViewBaseComponent
     */
    protected releaseSubView() {
        this._subView.forEach(el => {
            guiManager.releaseView(el);
        })
        this._subView = [];
    }

    /**
     * @desc call after onLoad。after parent.addChild
     *
     * @protected
     * @param {*} args
     * @memberof ViewBaseComponent
     */
    protected onInit(...args: any[]) {
        logger.warn('ViewBaseComponent', `need overwrite onInit for view ${this.name}`);
    }

    /**
     * @desc 界面呗释放时调用。此时界面的node还有效（相对挂在父节点上）。请勿主动调用！1
     *
     * @protected
     * @memberof ViewBaseComponent
     */
    protected onRelease() {
    }

    protected addStepTask(taskHandler: SyncHandler | AsyncHandler, name = 'defaultTask', priority = 0): ViewBaseComponent {
        this._stepWork.addTask(taskHandler, name, priority);
        return this;
    }

    private _checkAndExecStepWork(): boolean | Promise<boolean> {
        if (this._stepWork.length === 0) {
            return true;
        }
        return new Promise((resolve, reject) => {
            this._stepWork.start(() => {
                resolve(true);
            })
        });
    }

    protected get stepWork(): StepWork {
        return this._stepWork;
    }

    private _sharedViewClose() {
        if (this.isSharedView() && cc.isValid(this.node.parent)) {
            WatcherHelper.removeWatcher(this.node);
            this.releaseViewBaseComponent();
            this.node.removeFromParent(false);
        }
    }

    /**
     * @desc 给子view使用，查找替换spriteFrame
     * 
     * @param name 
     * @param spFrames 
     */
    protected _getSpriteFrame(name: string, spFrames: cc.SpriteFrame[]) {
        if (!(spFrames instanceof Array)) return null;

        for (let i = 0; i < spFrames.length; i++) {
            const spframe = spFrames[i];
            if (spframe.name == name) {
                return spframe;
            }
        }
        return null;
    }

    /**
     * @desc 挂接在指定节点上；该函数只针对缓存模式为NODE的View生效，其他的别用，说了别用的啊
     *
     * @param {cc.Node} node
     * @memberof ViewBaseComponent
     */
    attachToNode(node: cc.Node, name: string) {
        if (this._uiInfo && this._uiInfo.cacheMode !== UI_CACHE.NODE) {
            logger.error('ViewBaseComponent', `You cant not call this function while view is not sharedView`);
            return;
        }

        this._sharedViewClose();
        node.addChild(this.node, 0, name);
        WatcherHelper.addWatcher({
            node: this.node,
            parent: node,
            onDisable: () => {
                this._sharedViewClose();
            }
        });
    }
}