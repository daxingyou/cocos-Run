
import { uiConfig, UI_CACHE, UIInfo, UI_LOADING } from "./UIConfig";
import { resourceManager, CACHE_MODE } from "./ResourceManager";
import { ViewBaseComponent } from "./components/ViewBaseComponent";
import FloatTips from "./components/FloatTips";
import { logger } from "./log/Logger";
import WaitingView from "../mvp/views/view-loading/WaitingView";
import GameLoading from "../mvp/views/view-loading/GameLoading";
import LoadingView from "../mvp/views/view-loading/LoadingView";

interface UICacheInfo {
    name: string;
    node: cc.Node;
}

const UICacheToResCache = (cache: UI_CACHE): CACHE_MODE => {
    if (cache === UI_CACHE.NODE || cache === UI_CACHE.PREFAB) {
        return CACHE_MODE.RELEASE_NO;
    } else {
        return CACHE_MODE.NONE;
    }
}

const BuiltInNodes = ['Clear Camera', 'Main Camera', 'UISnapCamera', 'UIAfterCamera', 'loggerView'];

/**
 * @desc 这里的缓存，只缓存NODE模式就行，Prefab的缓存，直接交给ResourceManager
 *
 * @class GUICache
 */
class GUICache {
    private _cache = new Map<string, UICacheInfo>();

    constructor() {
    }

    checkCacheValid(name: string) {
        return this._cache.has(name);
    }

    loadView(name: string): Promise<cc.Node> {
        return new Promise((resolve, reject) => {
            // 看看cache里边有没有
            const cfg = uiConfig.getConfig(name);
            if (this._cache.has(name)) {
                resolve(this._cache.get(name).node);
            } else {
                resourceManager.load(cfg.path, cc.Prefab, UICacheToResCache(cfg.cacheMode))
                    .then(data => {
                        const node = cc.instantiate(<cc.Prefab>data.res);
                        if (cfg.cacheMode === UI_CACHE.NODE) {
                            this._cache.set(name, {
                                name: name,
                                node: node,
                            });
                        }
                        resolve(node);
                    })
                    .catch(err => {
                        reject(err);
                    })
            }
        });
    }

    getLoadingTag(name: string): UI_LOADING {
        const cfg = uiConfig.getConfig(name);
        if (!cfg.loading) {
            return UI_LOADING.NONE;
        }

        // 战斗界面，加个LOADING，不然人出现的太突兀了
        if (name == 'BattleScene') {
            return cfg.loading;
        }

        // 看看有没有Cache
        if (cfg.cacheMode === UI_CACHE.NODE) {
            if (this.checkCacheValid(name)) {
                return UI_LOADING.NONE;
            }
        }

        // 最后看看是不是再resourceManager里边有cache，有的话，直接不显示加载，没有的话，再提示加载
        if (resourceManager.checkCacheValid(cfg.path, UICacheToResCache(cfg.cacheMode))) {
            return UI_LOADING.NONE;
        }

        return cfg.loading;
    }
}

interface UIInitInfo {
    sceneNode: cc.Node;
    tips: FloatTips;
    loadingView: LoadingView;
    waitingView: WaitingView;
    gameloadingNode: cc.Node;
    labelVersion: cc.Label;
}

class GUIManager {
    labelVersion: cc.Label = null;

    private _sceneNode: cc.Node = null;
    private _floatTips: FloatTips = null;
    private _loadingView: LoadingView = null;
    private _currScene: any = null;
    private _isSwitch: boolean;
    private _waitingView: WaitingView = null;
    private _guiCache: GUICache = new GUICache();
    private _gameLoading: GameLoading = null;
    private _gameLoadingNode: cc.Node = null;

    private _inLoadingScene: string = null;

    private _isDebug: boolean = false;
    private _popViewNode: cc.Node = null;

    constructor() {
    }

    init(info: UIInitInfo, popViewNode?: cc.Node) {
        this._popViewNode = popViewNode;
        this._sceneNode = info.sceneNode;
        this._floatTips = info.tips;
        this._loadingView = info.loadingView;
        this._waitingView = info.waitingView;
        this._gameLoadingNode = info.gameloadingNode;
        this.labelVersion = info.labelVersion;
        this._loadGameLoading();
        this._initloggerView();
    }

    get isDebug(){
        return this._isDebug;
    }

    get sceneNode(): cc.Node {
        return this._sceneNode;
    }

    /**
     * @desc 加载场景prefab。会自动卸载当前的场景，然后加载需要加载的场景
     *
     * @param {string} name
     * @param {*} rest
     * @returns {Promise<cc.Node>}
     * @memberof GUIManager
     */
    loadScene(name: string, ...rest: any[]): Promise<cc.Node> {
        return new Promise((resolve, reject) => {
            if (this._currScene && this._currScene.name === name) {
                resolve(this._currScene.node);
                return;
            }

            const debugCheckSceneNode = (now: string) => {
                // 看看还有没有遗漏的没有释放的UI
                this._sceneNode.children.forEach(v => {
                    // @ts-ignore
                    if (v.name != now && BuiltInNodes.indexOf(v.name) === -1 && !v.name.startsWith('SkeletonOnce_fx')) {
                        logger.warn('GUIManager', '残留节点 name = ', v.name);
                    }
                });
            }

            const realLoad = () => {
                // 场景的加载，是一个完整的过程作为独占，不允许中间插入
                if (this._inLoadingScene) {
                    reject("load scene again!")
                    return;
                }
                this._inLoadingScene = name;

                const ret = this.loadView(name, this._sceneNode, ...rest);
                ret.then((view) => {
                    if (this._currScene) {
                        this._currScene.closeView();
                    }

                    debugCheckSceneNode(view.node.name);

                    this._currScene = view;
                    this._inLoadingScene = null;
                    resolve(view.node);
                }).catch(err => {
                    this._inLoadingScene = null;
                    logger.error('GUIManager', `loadScene name = ${name} failed. err = `, err);
                    this.showTips(err);
                    reject(err);
                });
            }

            realLoad();
        })
    }

    private _loadGameLoading(fincallback?: Function) {
        resourceManager.load('prefab/views/view-loading/GameLoading', cc.Prefab, CACHE_MODE.RELEASE_NO, 'GAME_LOADING')
            .then(ret => {
                let node = cc.instantiate(ret.res);
                this._gameLoadingNode.addChild(node);
                node.active = false;
                node.name = 'GameLoading';
                this._gameLoading = node.getComponent(GameLoading);
                fincallback && fincallback();
            })
    }

    showLoading(loadHandler: Function) {
        this._isSwitch = true;
        this._loadingView.show(loadHandler);
    }

    showGameLoading(loadHandler: Function) {
        this._isSwitch = true;
        if (this._gameLoading) {
            this._gameLoading.show(loadHandler);
        } else {
            this._loadGameLoading(() => {
                this._gameLoading.show(loadHandler);
            });
        }
    }

    hideGameLoading() {
        this._isSwitch = false;
        this._gameLoading.hide();
    }

    hideLoading() {
        this._isSwitch = false;
        this._loadingView.hide();
    }

    showWaiting(handler: Function) {
        this._waitingView && this._waitingView.show(handler);
    }

    hideWaiting() {
        this._waitingView && this._waitingView.hide();
    }

    loadView(name: string, parent: cc.Node, ...rest: any[]): Promise<ViewBaseComponent> {
        parent = parent || this._popViewNode;
        logger.log('GUIManager', `loadView. name = ${name}`);
        return new Promise((resolve, reject) => {
            const cfg = uiConfig.getConfig(name);
            const loadingTag = this._guiCache.getLoadingTag(name);

            const hideLoading = (tag: UI_LOADING) => {
                if (tag === UI_LOADING.LOADING) {
                    this.hideLoading();
                } else if (tag === UI_LOADING.GAME_LOADING) {
                    this.hideGameLoading();
                } else if (tag === UI_LOADING.WAITING) {
                    this.hideWaiting();
                }
            }

            const showLoading = (tag: UI_LOADING, exec: Function) => {
                if (tag === UI_LOADING.LOADING) {
                    this.showLoading(() => {
                        exec();
                    });
                } else if (tag === UI_LOADING.WAITING) {
                    this.showWaiting(() => {
                        exec();
                    })
                } else if (tag === UI_LOADING.GAME_LOADING) {
                    this.showGameLoading(() => {
                        exec();
                    })
                } else {
                    exec();
                }
            }

            const _realLoad = () => {
                const ret = this._guiCache.loadView(name);
                ret.then(res => {
                    let node = res;
                    let view: ViewBaseComponent = null;
                    if (cfg.component) {
                        view = node.getComponent(cfg.component);
                    } else {
                        view = node.getComponent(ViewBaseComponent);
                    }

                    if (cfg.cacheMode === UI_CACHE.NODE) {
                        view.attachToNode(parent, name);
                    } else {
                        parent.addChild(node, 0, name);
                    }

                    if (view) {
                        let loadRet = view.initViewBaseComponent(name, ...rest);
                        if (typeof loadRet === 'boolean') {
                            hideLoading(loadingTag);
                            resolve(view);
                        } else {
                            (loadRet as Promise<Boolean>).then(() => {
                                hideLoading(loadingTag);
                                resolve(view);
                            });
                        }
                    } else {
                        hideLoading(loadingTag);
                        const errInfo = `Can not find Component for View name = ${name}`;
                        logger.error('GUIManager', errInfo);
                        reject(errInfo);
                    }
                }).catch(err => {
                    hideLoading(loadingTag);
                    logger.error('GUIManager', `loadView name = ${name} failed. err = `, err);
                    reject(err);
                })
            }

            showLoading(loadingTag, _realLoad);
        });
    }

    releaseView(view: ViewBaseComponent) {
        if (view.isSharedView()) {
            logger.warn('GUIManager', `SharedView no need to release. name = ${view.name}`);
            return;
        }

        if (view.isViewValid()) {
            logger.info('GUIManager', `releaseView name = ${view.name}`);
            const info = view.uiInfo;
            view.releaseViewBaseComponent();
            if (info.cacheMode !== UI_CACHE.NODE) {
                view.node.removeFromParent(true);
                view.node.destroy();
                resourceManager.release(info.path, UICacheToResCache(info.cacheMode));
            } else {
                view.node.removeFromParent(false);
            }
        }
    }

    checkViewOpenInScene(viewName: string, root?: cc.Node) {
        return this._findHierarchyChild(viewName, cc.isValid(root) ? root : this._sceneNode);
    }

    showLockTips() {
        this.showTips('敬请期待，尚未开放');
    }

    showTips(msg: string) {
        this._floatTips.show(msg);
    }

    showMessageBox(root: cc.Node, content: string, leftStr: string = null, leftCallback: Function = null, rightStr: string = null, rightCallback: Function = null, titleStr?: string) {
        return this.loadView("MessageBoxView", root, content, leftStr, leftCallback, rightStr, rightCallback, titleStr)
    }

    currScene(): String {
        return this._currScene.name;
    }

    isSwitch(): boolean {
        return this._isSwitch;
    }

    private _initloggerView() {
        if (this.labelVersion) {
            this.labelVersion.node.on(cc.Node.EventType.TOUCH_START, () => {
                // guiManager.loadView('loggerView', this.labelVersion.node.parent);
            });
        }
    }

    private _findHierarchyChild(childName: string, parent: cc.Node): cc.Node {
        if (!parent) return null;
        if (parent.children.length == 0) return null;

        if (parent.getChildByName(childName)) {
            return parent.getChildByName(childName);
        } else {
            for (let i = 0; i < parent.children.length; i++) {
                let find = this._findHierarchyChild(childName, parent.children[i])
                if (find) {
                    return find;
                }
            }
        }
        return null;
    }
}

const guiManager = new GUIManager();

export default guiManager;
