
import { uiConfig, UI_CACHE, UI_LOADING, UI_TYPE } from "./UIConfig";
import { resourceManager, CACHE_MODE } from "./ResourceManager";
import { ViewBaseComponent } from "./components/ViewBaseComponent";
import FloatTips from "./components/FloatTips";
import { logger } from "./log/Logger";
import { eventCenter } from "../common/event/EventCenter";
import WaitingView from "../mvp/views/view-loading/WaitingView";
import GameLoading from "../mvp/views/view-loading/GameLoading";
import LoadingView from "../mvp/views/view-loading/LoadingView";
import { cfg } from "../config/config";
import { configUtils } from "../app/ConfigUtils";
import { CustomDialogId } from "../app/AppConst";
import moduleUIManager from "./ModuleUIManager";
import PopAction from "./components/PopAction";
import MessageBoxView, { CB, MsgboxInfo } from "../mvp/views/view-other/MessageBoxView";
import { FunctionGuideManager } from "../mvp/views/view-guide/FunctionGuideView";
import { utils } from "../app/AppUtils";
import { commonEvent } from "./event/EventData";
import CoinNode from "../mvp/template/CoinNode";
import App from "../app/App";

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

const DefaultLoadingTag = ['BattleScene', 'HeroView'];

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

        // 默认读取配置Loading的view，因为本身初始化比较复杂，比如战斗、英雄
        if (DefaultLoadingTag.indexOf(name) >= 0) {
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
    taskTips: FloatTips;
    loadingView: LoadingView;
    waitingView: WaitingView;
    gameloadingNode: cc.Node;
    coinNode: cc.Prefab;
    appIns: App
}

class GUIManager {

    private _sceneNode: cc.Node = null;
    private _coinNode: cc.Prefab = null;
    private _mainCamera: cc.Camera = null;
    private _floatTips: FloatTips = null;
    private _taskTips: FloatTips = null;
    private _loadingView: LoadingView = null;
    private _currScene: ViewBaseComponent = null;
    private _isSwitch: boolean;
    private _waitingView: WaitingView = null;
    private _guiCache: GUICache = new GUICache();
    private _gameLoading: GameLoading = null;
    private _gameLoadingNode: cc.Node = null;
    private _appIns: App = null;

    private _currLoad: cc.Component = null;

    private _inLoadingScene: string = null;

    private _isDebug: boolean = false;

    constructor() {
    }

    get appIns() {
        return this._appIns;
    }

    init(info: UIInitInfo, isDebug: boolean = false) {
        this._appIns = info.appIns;
        this._isDebug = isDebug;
        this._sceneNode = info.sceneNode;
        this._mainCamera = info.sceneNode.getChildByName('Main Camera').getComponent(cc.Camera);
        this._floatTips = info.tips;
        this._taskTips = info.taskTips;
        this._loadingView = info.loadingView;
        this._waitingView = info.waitingView;
        this._gameLoadingNode = info.gameloadingNode;
        this._coinNode = info.coinNode;
        this._currLoad = null;
        this._initEvents();
        this.setMainCameraClearFlags(cc.Camera.ClearFlags.COLOR | cc.Camera.ClearFlags.DEPTH | cc.Camera.ClearFlags.STENCIL);
        this._loadGameLoading().then(() => {});
    }

    isLoadViewShow(){
        return cc.isValid(this._currLoad) && this._currLoad.node.active;
    }

    private _initEvents(){
        eventCenter.register(commonEvent.HIDE_LOADING, this, this._onLoadingHided);
    }

    private _onLoadingHided(){
        if(!cc.isValid(this._currLoad)) return;
        this._currLoad = null;
    }

    get isDebug() {
        return this._isDebug;
    }

    get sceneNode(): cc.Node {
        return this._sceneNode;
    }

    setMainCameraClearFlags(clearFlags: number){
        if(!cc.isValid(this._mainCamera)) return;
        if(this._mainCamera.clearFlags == clearFlags) return;
        this._mainCamera.clearFlags = clearFlags;
    }

    get mainCamera() {
        return  this._mainCamera;
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
                    if (v.name != now && BuiltInNodes.indexOf(v.name) === -1 && !moduleUIManager.haveStashNode(v.name) && !v.name.startsWith('SkeletonOnce_fx')) {
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
                        this._currScene.closeView(false);
                    }
                    moduleUIManager.clearStashNode(name);
                    debugCheckSceneNode(view.node.name);
                    moduleUIManager.popStashNode(name);
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

    private async _loadGameLoading(fincallback?: Function) {
        let ret = await resourceManager.load('prefab/views/view-loading/GameLoading', cc.Prefab, CACHE_MODE.RELEASE_NO, 'GAME_LOADING');
        let node = cc.instantiate(ret.res);
        this._gameLoadingNode.addChild(node);
        node.active = false;
        node.name = 'GameLoading';
        this._gameLoading = node.getComponent(GameLoading);
        fincallback && fincallback();
    }

    showLoading(loadHandler: Function) {
        this._isSwitch = true;
        this._currLoad = this._loadingView;
        this._loadingView.show(loadHandler);
    }

    showGameLoading(loadHandler: Function) {
        this._isSwitch = true;
        if (this._gameLoading) {
            this._currLoad = this._gameLoading;
            this._gameLoading.show(loadHandler);
        } else {
            this._loadGameLoading(() => {
                this._currLoad = this._gameLoading;
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
        this._currLoad = this._waitingView;
        this._waitingView && this._waitingView.show(handler);
    }

    hideWaiting() {
        this._waitingView && this._waitingView.hide();
    }

    /*
    * @param funcId 模块ID
    * @param partId 页签ID
    * */
    addCoinNode (root: cc.Node, funcId?: number, partId?: number): cc.Node {
        if (!root || !cc.isValid(root)) {
            return null;
        }

        let coin = root.getChildByName("BASE_COIN");
        if (coin && cc.isValid(coin)) {
            logger.warn("[guimanager] duplicate add coin node ", root.name)
            // this.removeCoinNode(root);
            coin.getComponent(CoinNode).init(funcId, partId);
            return coin
        } else {
            coin = cc.instantiate(this._coinNode)
            root.addChild(coin, 0, "BASE_COIN");
            coin.getComponent(CoinNode).init(funcId, partId);
        }

        return coin
    }

    removeCoinNode (root: cc.Node) {
        if (!root || !cc.isValid(root)) {
            return;
        }

        let coin = root.getChildByName("BASE_COIN")
        if (coin) {
            let comp =  coin.getComponent(CoinNode);
            comp && comp.deInit();
            coin.removeFromParent();
        }
    }

    // 如果直接用guiManager.loadView 必须确保调用了 closeView, ReleaseSubView并不会释放的！！！！
    loadView(name: string, parent: cc.Node, ...rest: any[]): Promise<ViewBaseComponent> {
        parent = parent || this.sceneNode
        //logger.log('GUIManager', `loadView. name = ${name}`);
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
                    let initViewBaseFunc = async () => {
                        let view: ViewBaseComponent = null;
                        if (cfg.component) {
                            view = node.getComponent(cfg.component);
                        } else {
                            view = node.getComponent(ViewBaseComponent);
                        }

                        await view.preInit(...rest);

                        if (cfg.cacheMode === UI_CACHE.NODE) {
                            view.attachToNode(parent, name);
                        } else {
                            let currSameView = this.checkViewOpenInScene(node.name, parent)
                            if(currSameView) {
                                let comp = currSameView.getComponent(ViewBaseComponent);
                                comp && comp.closeView();
                            }
                            parent.addChild(node, 0, name);
                        }

                        if (view) {
                            let loadRet = view.initViewBaseComponent(name, ...rest);
                            let guideCfg = FunctionGuideManager.getIns().checkTrigger(name);
                            if (typeof loadRet === 'boolean') {
                                hideLoading(loadingTag);
                                resolve(view);
                                guideCfg && FunctionGuideManager.getIns().runGuide(guideCfg, view.node);
                            } else {
                                (loadRet as Promise<Boolean>).then(() => {
                                    hideLoading(loadingTag);
                                    resolve(view);
                                    guideCfg && FunctionGuideManager.getIns().runGuide(guideCfg, view.node);
                                });
                            }
                        } else {
                            hideLoading(loadingTag);
                            const errInfo = `Can not find Component for View name = ${name}`;
                            logger.error('GUIManager', errInfo);
                            reject(errInfo);
                        }
                        moduleUIManager.addStashNode(node);
                    }
                    let popActionCmp: PopAction = node.getComponentInChildren(PopAction);
                    if(popActionCmp) {
                        popActionCmp.showOpenAction(initViewBaseFunc);
                    } else {
                        initViewBaseFunc();
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
    /**
     * @desc 脱离于LoadView方法，子页面可复用
     * @param name 
     * @param parent 废弃，父节点写死为根节点方便管理
     * @param rest 
     * @returns 
     */
    loadModuleView(name: string, ...rest: any[]): Promise<ViewBaseComponent> {
        let parent = this._sceneNode;
        //logger.log('GUIManager', `loadModuleView. name = ${name}`);
        return new Promise((resolve, reject) => {
            const cfg = uiConfig.getConfig(name);
            const loadingTag = this._guiCache.getLoadingTag(name);
            const popScene = this.getCeilView();

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
                // 如果找到了 直接pop出来 就不用再load
                let sameNode = moduleUIManager.stashNode.filter(child=>{
                    return child.name==name;
                })[0];
                if(sameNode){
                    // 相同节点如果已经有父节点了没必要重新addChild
                    if (sameNode.parent && cc.isValid(sameNode.parent)) {
                        if (sameNode != parent) {   // Q: 应该是sameNode.parent?
                            sameNode.removeFromParent();
                            parent.addChild(sameNode, 0, name);
                        } 
                    } else {
                        sameNode.active = true;
                        parent.addChild(sameNode, 0, name);
                    }
                   
                    moduleUIManager.addStashNode(sameNode);
                    const view = sameNode.getComponent(ViewBaseComponent);
                    if(view) {
                        logger.log(` ======== loadModuleView 查询到相同节点：${name} ========`);
                        view.onRefresh(...rest);
                    }
                    return;
                }
                const ret = this._guiCache.loadView(name);
                ret.then(res => {
                    let node = res;
                    let initBaseViewFunc = async () => {
                        let view: ViewBaseComponent = null;
                        if (cfg.component) {
                            view = node.getComponent(cfg.component);
                        } else {
                            view = node.getComponent(ViewBaseComponent);
                        }

                        await view.preInit(...rest);
                        if (cfg.cacheMode === UI_CACHE.NODE) {
                            view.attachToNode(parent, name);
                        } else {
                            let currSameView = this.checkViewOpenInScene(node.name, parent)
                            if(currSameView) {
                                let comp = currSameView.getComponent(ViewBaseComponent);
                                comp && comp.closeView();
                            }
                            parent.addChild(node, 0, name);
                        }

                        if (view) {
                            let loadRet = view.initViewBaseComponent(name, ...rest);
                            view.isModuleView = true;
                            let guideCfg = FunctionGuideManager.getIns().checkTrigger(name);
                            if (typeof loadRet === 'boolean') {
                                hideLoading(loadingTag);
                                resolve(view);
                                guideCfg ? FunctionGuideManager.getIns().runGuide(guideCfg, view.node) : FunctionGuideManager.getIns().pauseGuide();
                            } else {
                                (loadRet as Promise<Boolean>).then(() => {
                                    hideLoading(loadingTag);
                                    resolve(view);
                                    guideCfg ? FunctionGuideManager.getIns().runGuide(guideCfg, view.node) : FunctionGuideManager.getIns().pauseGuide();
                                });
                            }
                           
                            if (popScene && uiConfig.getConfig(popScene.name).type == UI_TYPE.SCENE) {
                                let comp = popScene.getComponent(ViewBaseComponent);
                                // @ts-ignore
                                comp.onPause && comp.onPause();
                            }
                        } else {
                            hideLoading(loadingTag);
                            const errInfo = `Can not find Component for View name = ${name}`;
                            logger.error('GUIManager', errInfo);
                            reject(errInfo);
                        }
                        // 隐藏所有模块页
                        // moduleUIManager.hideModuleView();
                        moduleUIManager.addStashNode(node);
                        // logger.log('loadModuleView stashNode: ', moduleUIManager.stashNode);
                    }

                    let popActionCmp: PopAction = node.getComponentInChildren(PopAction);
                    if(popActionCmp) {
                        popActionCmp.showOpenAction(initBaseViewFunc);
                    } else {
                        initBaseViewFunc();
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
            moduleUIManager.removeStashNode(view.node);
            if (info.cacheMode !== UI_CACHE.NODE) {
                // 先显示 再移除要移除的 这样露馅小
                moduleUIManager.popStashNode(view.name);
                view.node.removeFromParent(true);
                view.node.destroy();
                resourceManager.release(info.path, UICacheToResCache(info.cacheMode));
            } else {
                view.node.removeFromParent(false);
            }
        }
    }

    checkViewOpenInScene(viewName: string, root?: cc.Node) {
        return this._findHierarchyChild(viewName, cc.isValid(root) ? root : this.currSceneNode);
    }

    showLockTips() {
        this.showDialogTips(CustomDialogId.UNOPEN);
    }

    showTips(msg: string) {
        this._floatTips.show(msg);
    }

    showDialogTips(dialogId: number, itemId: number = 0){
        let cfg = configUtils.getDialogCfgByDialogId(dialogId);
        if (cfg && cfg.DialogText) {
            if(CustomDialogId.COMMON_ITEM_NOT_ENOUGH == dialogId) {
                if(itemId == 0) {
                    logger.warn(`showDialogTips dialogId:`, dialogId, 'itemId:', itemId, 'error');
                } else {
                    let itemCfg = configUtils.getItemConfig(itemId);
                    if(itemCfg) {
                        let tipsStr = cfg.DialogText.replace('%itemname', itemCfg.ItemName);
                        this.showTips(tipsStr);
                    }
                }
            } else {
                this.showTips(cfg.DialogText);
            }
        }
    }

    showTaskTips(msg: string) {
        this._taskTips.show(msg);
    }

    hideTaskTips() {
        this._taskTips.hideAll();
    }

    showMessageBox(root: cc.Node, info: MsgboxInfo) {
        this.clearMessageBox(root);
        this.clearMessageBox(this.sceneNode);
        return this.loadView("MessageBoxView", root, info)
    }

    // 避免重复弹框
    clearMessageBox (root: cc.Node) {
        if (!cc.isValid(root)) {
            return
        }
        let nodeMsg = root.getChildByName("MessageBoxView");
        if (nodeMsg && cc.isValid(nodeMsg)) {
            let comp = nodeMsg.getComponent(MessageBoxView)
            comp && comp.closeView()
        }
    }

    /**
     * @description 根据ConfigDialogue表，由策划去配置弹出对话框的内容
     * @param root 
     * @param cfg 
     * @param leftCallback 
     * @param rightCallback 
     * @returns 
     */
    showMessageBoxByCfg(root: cc.Node, cfg: cfg.Dialog, leftCallback: CB = null, rightCallback: CB = null, isshowToggle: boolean = false) {
        root = root || this._sceneNode;
        let titleStr = cfg.DialogTitle || "系统提示";
        let content = cfg.DialogText || "";
        let btnStr = cfg.DialogButton.split("|");
        let left = btnStr[0] && btnStr[0].split(";");
        let leftStr = left && (left[1] || "取消");
        let right = btnStr[1] && btnStr[1].split(";");
        let rightStr = right && (right[1] || "确定");
        let closeBtn = cfg.DialogClose ? true : false;
        let info: MsgboxInfo = {
            content : content,
            closeBtn: closeBtn,
            showToggle: isshowToggle,
        }
        leftStr && (info.leftStr = leftStr);
        leftCallback && (info.leftCallback = leftCallback);
        rightStr && (info.rightStr = rightStr);
        rightCallback && (info.rightCallback = rightCallback);
        return this.loadView("MessageBoxView", root, info)
    }

    showCapabilityChange(preCapability: number, capability: number) {
        if(capability > preCapability) {
            this.showTips(`战斗力从${preCapability}增长到${capability}`);
        }
    }

    currScene(): String {
        return this._currScene.name;
    }

    getCurrScene() {
        return this._currScene;
    }

    get currSceneNode () {
        if (this._currScene && cc.isValid(this._currScene)) {
            return this._currScene.node
        }
        return this._sceneNode
    }

    isSwitch(): boolean {
        return this._isSwitch;
    }

    private _findHierarchyChild(childName: string, parent: cc.Node): cc.Node {
        if (!parent) return null;
        if (parent.children.length == 0) return null;

        if (parent.getChildByName(childName)) {
            return parent.getChildByName(childName);
        }/* else {
            for (let i = 0; i < parent.children.length; i++) {
                let find = this._findHierarchyChild(childName, parent.children[i])
                if (find) {
                    return find;
                }
            }
        }*/
        return null;
    }
    //角色升级页面
    showLevelUpView(oldLv: number) {
        return this.loadModuleView("LevelUpView", oldLv);
    }
    /**
     * @desc 获取常驻挂载节点
     * @returns 
     */
    getSceneRootNode(isScene?:boolean){
        let sceneNode = this.sceneNode;
        return sceneNode;
    }

    /**
    * @desc 在根节点内寻找顶层节点
    * @param name
    * @returns
    */
    getCeilView() {
        let node: cc.Node = null;
        if (this.sceneNode) {
            this.sceneNode.children.forEach(child => {
                let viewName = child.name;
                let viewComp = child.getComponent(ViewBaseComponent);
                let uiCfg = uiConfig.getConfig(viewName);
                if (cc.isValid(child) && BuiltInNodes.indexOf(viewName) == -1 && viewComp && uiCfg) {
                    node = node || child;
                    node = child.zIndex >= node.zIndex ? child : node;
                }
            });
        }
        return node;
    }

    //页面关闭后更新引导
    onGuideAfterCloseView(){
        let topView = guiManager.getCeilView();
        if(topView !== FunctionGuideManager.getIns().getCurrGuideView() && utils.isNodeContain(topView, FunctionGuideManager.getIns().getCurrGuideView())){
            topView = FunctionGuideManager.getIns().getCurrGuideView();
        }
        if(cc.isValid(topView)) {
            let guideCfg = FunctionGuideManager.getIns().checkTrigger(topView.name);
            if(guideCfg){
                guideCfg && FunctionGuideManager.getIns().runGuide(guideCfg, topView);
            }else{
                FunctionGuideManager.getIns().pauseGuide();
            }
        }
    }
}

const guiManager = new GUIManager();

export default guiManager;
