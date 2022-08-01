import { configUtils } from "../app/ConfigUtils";
import { ModuleName, VIEW_NAME } from "../app/AppConst";
import guiManager from "./GUIManager";
import { uiConfig, UI_TYPE } from "./UIConfig";
import { ViewBaseComponent } from "./components/ViewBaseComponent";
import { data } from "../network/lib/protocol";
import { bagData } from "../mvp/models/BagData";
import { bagDataUtils } from "../app/BagDataUtils";
import { logger } from "./log/Logger";
import { activityUtils } from "../app/ActivityUtils";
import { eventCenter } from "./event/EventCenter";
import { commonEvent } from "./event/EventData";

const BuiltInNodes = ['Clear Camera', 'Main Camera', 'UISnapCamera', 'UIAfterCamera', 'loggerView'];

class ModuleUIManager {
    private _rootNode:cc.Node = null;
    private _stashNode:cc.Node[] = [];

    //暂存节点
    get stashNode(){
        return this._stashNode;
    }

    init(node:cc.Node){
        this._rootNode = node;
        this._stashNode = [];
    }

    deInit() {
        this._rootNode = null;
        this._stashNode = [];
    }

    //SSR英雄开卡页面
    showGetNewSSRHero(heroList: number[], cb: Function, parentNode?: cc.Node, isPlayCapTip: boolean = true){
        let sceneNode = parentNode || guiManager.sceneNode;
        guiManager.loadView('GetSSRPVView', sceneNode, heroList, cb, isPlayCapTip);
    }

    /**
     * @desc 直接跳转到指定模块指定页签
     * @param mID 模块ID，ConfigFunction表可查
     * @param pID 模块页签，需要在模块主界面适配
     */
    jumpToModule(mID: number, pID?: number, sId?: number, ...args:any[]) {
        eventCenter.fire(commonEvent.JUMP_MODULE)
        let functionCfg = configUtils.getFunctionConfig(mID);
        //@ts-ignore
        let viewName = ModuleName[mID] || functionCfg.FunctionName;
        let moduleNode = guiManager.getCeilView();
        let openInfo = activityUtils.checkMeetCond(mID)
        if (openInfo && openInfo.length > 2) {
            guiManager.showTips(openInfo)
        }

        if (viewName && !openInfo) {
            let moduleNodeComp = moduleNode && moduleNode.getComponent(ViewBaseComponent);
            if (moduleNode && moduleNode.name == viewName && moduleNodeComp) {
                // 这里需要注意的是，如果界面存在，会重新走一遍init，需要确认界面重复init是没问题的
                // moduleNodeComp.initViewBaseComponent(viewName, Number(mID), Number(pID), Number(sId), ...args);
                moduleNodeComp.onRefresh(mID, pID, sId, ...args);
                return new Promise(()=>{});
            }
            return guiManager.loadModuleView(viewName, mID, pID, sId ,...args);
        } else {
            return new Promise(() => {});
        }
    }
    /**
     * 隐藏所有子节点
     */
    hideModuleView(auto?: boolean){
        // console.log("hide:", this.stashNode.map((node)=>{return node.name}));
        if (this._rootNode && this._stashNode.length){
            this._stashNode.forEach((node)=>{
                const uiCfg = uiConfig.getConfig(node.name);
                if(UI_TYPE.SCENE != uiCfg.type) {
                    node.active = false;
                    node.removeFromParent(false);
                }
            })
        }
    }
    /**
    * @desc显示所有子节点并将所有Scene节点置底
    * 目前只有切回主界面时有用到
    * 【弃用】 现在切换场景弹出界面统一放到loadScene -> popStashNode里面，不再单独手动调用
    */
    showModuleView(isAutoGuide: boolean = true) {
        return;
        let popScene = guiManager.getCeilView();
        if (this._rootNode && this._stashNode && this._stashNode.length) {
            let child = this._stashNode[this._stashNode.length-1];
            let view = child.getComponent(ViewBaseComponent);
            child.active = true;
            child.parent = this._rootNode;
            if (popScene && uiConfig.getConfig(popScene.name).type == UI_TYPE.SCENE) {
                let comp = popScene.getComponent(ViewBaseComponent);
                // @ts-ignore
                comp.onPause && comp.onPause();
            }
            if (view) {
                view.onRefresh();
            }
        } else{
            if (popScene && uiConfig.getConfig(popScene.name).type == UI_TYPE.SCENE) {
                let comp = popScene.getComponent(ViewBaseComponent);
                // @ts-ignore
                comp.onRestart && comp.onRestart();
            }
        }
        isAutoGuide && guiManager.onGuideAfterCloseView();
    }
    /**
     * 暂存到 栈 中 unshift 最新加入的在栈顶 如果是UIConfig的type不为NONE 就会加入 因为有些界面的实现方式不合适 不选择加入栈来操作
     * 比如 ActivityHomeView的子界面 BattlePrepareView 因为他们父节点不是scene 而当前实现方式是removeFromeParent取不到父节点信息了 可能会改变当前父节点信息 
     * @param node 
     */
    addStashNode (node: cc.Node){
        let viewName = node.name;
        let uiCfg = uiConfig.getConfig(viewName);
        let viewBaseComp = node.getComponent(ViewBaseComponent);
        if (cc.isValid(node) && BuiltInNodes.indexOf(viewName) == -1 && UI_TYPE.NONE != uiCfg.type && viewBaseComp) {
            // 这里为什么要隐藏scene，万一挂的节点就是scenen呢
            if(UI_TYPE.FULL_SCREEN_VIEW == uiCfg.type) {
                this.showScene(false);
                if (cc.isValid(node.parent) && !node.parent.active) {
                    node.parent.active = true;
                }
            }

            // 这里要注意的是，如果加载的view是FULL_SCREEN_VIEW，
            // 因为父节点是通过loadsubview加载上来的并且父节点stash了，那么就出现黑屏了
            if(UI_TYPE.SCENE != uiCfg.type) {
                if(UI_TYPE.FULL_SCREEN_VIEW == uiCfg.type) {
                    const popVIew = this._stashNode[0];
                    if(cc.isValid(popVIew) && popVIew.parent) {
                        const popViewCfg = uiConfig.getConfig(popVIew.name);
                        if(UI_TYPE.SCENE != popViewCfg.type) {
                            popVIew.active = false;
                            popVIew.removeFromParent(false);
                        }
                    }
                }
                let sameNodeIdx = this.haveStashNode(node.name);
                sameNodeIdx && this._stashNode.splice(sameNodeIdx - 1, 1);
                this._stashNode.unshift(node);
            } else {
                // 一般不会吧
                let sameNodeIdx = this.haveStashNode(node.name);
                if(!sameNodeIdx) {
                    this._stashNode.unshift(node);
                }
            }
        }
    }

    removeStashNode(node: cc.Node) {
        let viewName = node.name;
        let uiCfg = uiConfig.getConfig(viewName);
        let viewBaseComp = node.getComponent(ViewBaseComponent);
        if (cc.isValid(node) && BuiltInNodes.indexOf(viewName) == -1 && UI_TYPE.NONE != uiCfg.type && viewBaseComp) {
            let sameNodeIdx = this.haveStashNode(node.name);
            sameNodeIdx && this._stashNode.splice(sameNodeIdx - 1, 1);
        }
    }

    haveStashNode(name:string) {
        for( let i = 0; i < this._stashNode.length; i++ ){
            let node = this._stashNode[i];
            if(node && node.name == name){
                return i+1;
            }
        }
        return null;
    }
    /**
     * 如果有页面的改动 一般是关闭了个界面 需要判断当前栈顶的是不是 全屏页面 如果是就显示当前全屏页面 如果不是 找到下一个全屏页面 显示 并显示当前的非全屏页面；
     * @param viewName 
     */
    popStashNode(viewName: string) {
        if(this._stashNode.length > 0) {
            this.hideModuleView();
            let isFindScene: boolean = false;
            // 找到第一个本场景的第一个全屏页面
            const firstFullScreenNodeIndex = this._stashNode.findIndex(_node => {
                const uiCfg = uiConfig.getConfig(_node.name);
                if(UI_TYPE.SCENE == uiCfg.type) {
                    isFindScene = true;
                }
                return !isFindScene && uiCfg.type == UI_TYPE.FULL_SCREEN_VIEW;
            });
            const addViewFunc = (view: cc.Node, viewType: UI_TYPE) => {
                try {
                    const isOpen = guiManager.checkViewOpenInScene(view.name);
                    if(!isOpen && !view.parent) {
                        let sceneNode = guiManager.sceneNode
                        const parentNode = firstFullScreenNodeIndex > -1 && UI_TYPE.FULL_SCREEN_VIEW != viewType ? this._stashNode[firstFullScreenNodeIndex] : sceneNode;
                        view.active = true;
                        parentNode.addChild(view);
                        // 如果重新pop回来 会走 onRefresh
                        const viewBaseComp = view.getComponent(ViewBaseComponent);
                        if(viewBaseComp) {
                            viewBaseComp.onRefresh();
                        }
                    }
                } catch(err) {
                    logger.error('popStashNode addViewFunc err:', err, 'view: ', view);
                }
            }
            let lastFullScreenView: cc.Node = null;
            let lastPopView: cc.Node = null;
            if(firstFullScreenNodeIndex > -1) {
                // 找到了全屏界面
                let viewList = this._stashNode.slice(0, firstFullScreenNodeIndex + 1);
                lastFullScreenView = viewList[firstFullScreenNodeIndex];
                if(cc.isValid(lastFullScreenView)) {
                    addViewFunc(lastFullScreenView, UI_TYPE.FULL_SCREEN_VIEW);
                }
                if(viewList.length > 1) {
                    lastPopView = viewList[0];
                }
                this.showScene(false);
            } else {
                // 如果没找到全屏页面
                this.showScene();
                lastPopView = this._stashNode[0];
            }
            if(cc.isValid(lastPopView)) {
                const popViewCfg = uiConfig.getConfig(lastPopView.name);
                if(UI_TYPE.SCENE != popViewCfg.type && UI_TYPE.FULL_SCREEN_VIEW != popViewCfg.type) {
                    addViewFunc(lastPopView, UI_TYPE.VIEW);
                }
            }
        } else {
            this.showScene();
        }
    }
    /**
     * 切换场景的时候，需要清除当前scene所有的暂存，只保留一个全屏界面，结束战斗的时候快速返回
     * 1. 只有从MainScene切换出去的时候，才会缓存最后一个打开的界面
     *  比如：冒险地图界面，pvp的选敌人界面
     *  缓存之后，打完战斗能快速返回
     * 2. 从非MainScene切到其他场景，都需要关闭modul里面的缓存界面
     * 
     */
    clearStashNode (loadScene: string) {
        let needCacheFullScreenView = true;

        if (loadScene == "LoginScene") {
            needCacheFullScreenView = false
        }

        let viewRelease: string[] = [];
        for(let i = 0; i < this._stashNode.length; i++){
            let nodeStash = this._stashNode[i];
            if(nodeStash && cc.isValid(nodeStash)){
                let view = nodeStash.getComponent(ViewBaseComponent);
                if (view) {
                    const tempUiCfg = uiConfig.getConfig(view.name);
                    // 暂时地图界面不关闭，因为打完战斗回到主界面能快速打开地图界面
                    if (UI_TYPE.SCENE == tempUiCfg.type) {
                        continue;
                    }

                    // 已经释放过了也没必要再释放
                    if (!view.isViewValid()) {
                        continue
                    }

                    if (tempUiCfg.type == UI_TYPE.FULL_SCREEN_VIEW) {
                        
                        if (needCacheFullScreenView) {
                            needCacheFullScreenView = false;
                            logger.log("[GUIManager] 切换场景保留最后一个全屏界面 = ", view.name)
                            view.node.removeFromParent(false)
                        } else {
                            viewRelease.push(view.name)
                        }
                    } else {
                        viewRelease.push(view.name)
                    }
                }
            }
        }

        for(let i = this._stashNode.length - 1; i >= 0; i--) {
            let nodeStash = this._stashNode[i];
            if(nodeStash && cc.isValid(nodeStash)) {
                let view = nodeStash.getComponent(ViewBaseComponent);
                if (viewRelease.indexOf(view.name) != -1) {
                    if(nodeStash && cc.isValid(nodeStash)){
                        let view = nodeStash.getComponent(ViewBaseComponent);
                        view && view.closeView()
                    }
                }
            }
        }
    }
    /**
     * 控制场景的显影 如果没有全屏页面了 就会显示场景 如果有全屏页面 就会隐藏场景
     * @param isShow 
     */
    showScene(isShow: boolean = true) {
        const firstScene: cc.Node = this._stashNode.find(_view => {
            const uiCfg = uiConfig.getConfig(_view.name);
            return uiCfg && UI_TYPE.SCENE == uiCfg.type;
        });
        if(firstScene && firstScene.active != isShow) {
            firstScene.active = isShow;
            if(isShow) {
                const cmp = firstScene.getComponent(ViewBaseComponent);
                if(cmp) {
                    cmp.onRefresh();
                }
            }
        }
    }

    /**
     * @desc 展示物品、装备、英雄详细信息
     * @param parent 指定父节点，可选
     */
    showItemDetailInfo(itemID: number, itemCount: number, parent: cc.Node, seq?: any){
        parent = guiManager.sceneNode;
        let config = configUtils.getItemConfig(itemID);
       
        
        if (config) {
            let newitem: data.IBagUnit = { ID: itemID, Count: itemCount, Seq: 0 };
            guiManager.loadView(VIEW_NAME.TIPS_ITEM, parent, newitem);
            return;
        } 
        let config1 = configUtils.getEquipConfig(itemID);
        if (config1) {
            let item: data.IBagUnit = bagDataUtils.buildDefaultEquip(itemID);
            let bagItem = bagData.getItemBySeq(seq, itemID);
            guiManager.loadView(VIEW_NAME.TIPS_EQUIP, parent, bagItem || item);
            return;
        } 

        let config2 = configUtils.getHeroBasicConfig(itemID);
        if (config2) {
            guiManager.loadView(VIEW_NAME.TIPS_HERO, parent, itemID, true);
        }
    }

    showItemDetailInfoByLoadView(itemID: number, itemCount: number, loadView: Function, seq?: any) {
        let config = configUtils.getItemConfig(itemID);
        let config1 = configUtils.getEquipConfig(itemID);
        let config2 = configUtils.getHeroBasicConfig(itemID);
        if (config) {
            let newitem: data.IBagUnit = { ID: itemID, Count: itemCount, Seq: 0 };
            let findItem = bagData.getItemByID(itemID);
            let item: data.IBagUnit = (itemCount || !findItem) ? newitem : findItem.Array[0];
            loadView(VIEW_NAME.TIPS_ITEM, item);
        } else if (config1) {
            let item: data.IBagUnit = bagDataUtils.buildDefaultEquip(itemID);
            let bagItem = bagData.getItemBySeq(seq, itemID);
            loadView(VIEW_NAME.TIPS_EQUIP, bagItem || item);
        } else if (config2){
            loadView(VIEW_NAME.TIPS_HERO, itemID, true);
        }
    }

}

const moduleUIManager = new ModuleUIManager();
export default moduleUIManager;
